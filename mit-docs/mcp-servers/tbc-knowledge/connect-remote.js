#!/usr/bin/env node
/**
 * connect-remote.js — Proxy stdio ↔ Streamable HTTP para o MCP remoto
 *
 * Conecta ao MCP em https://mcp.totvstbc.com.br/mcp via Streamable HTTP,
 * fazendo bridge stdio para que o Claude Code CLI possa usá-lo.
 *
 * Lê o email do desenvolvedor de:
 *   1. Variável de ambiente TBC_USER_EMAIL
 *   2. Arquivo ~/.config/tbc/dev-config.json
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, existsSync } from 'fs';
import { homedir, hostname, userInfo } from 'os';
import path from 'path';

const REMOTE_URL = process.env.TBC_MCP_URL || 'https://mcp.totvstbc.com.br/mcp';
const CONFIG_PATH = path.join(homedir(), '.config', 'tbc', 'dev-config.json');

function log(msg) {
  process.stderr.write(`[tbc-knowledge] ${msg}\n`);
}

function getEmail() {
  if (process.env.TBC_USER_EMAIL) return process.env.TBC_USER_EMAIL;
  if (existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
      if (config.email) return config.email;
    } catch { /* ignore */ }
  }
  return null;
}

/**
 * Start a minimal MCP server that exposes a single diagnostic tool
 * so the user gets feedback when the connection fails.
 */
async function startDiagnosticServer(errorMessage, emailUsed) {
  const server = new Server(
    { name: 'tbc-knowledge-proxy', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  const diagnosticInfo = {
    status: 'error',
    message: errorMessage,
    email: emailUsed || '(não configurado)',
    hostname: hostname(),
    server: REMOTE_URL,
    fix: !emailUsed
      ? 'Configure o email: export TBC_USER_EMAIL=seu@email.com.br'
      : errorMessage.includes('denied')
        ? `Email "${emailUsed}" não cadastrado. Solicite ao administrador em https://mcp.totvstbc.com.br/admin`
        : 'Verifique sua conexão com a internet e tente novamente',
  };

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{
      name: 'getConnectionStatus',
      description: `[ERRO] MCP não conectado: ${errorMessage}. Use esta tool para ver detalhes.`,
      inputSchema: { type: 'object', properties: {} },
    }],
  }));

  server.setRequestHandler(CallToolRequestSchema, async () => ({
    content: [{ type: 'text', text: JSON.stringify(diagnosticInfo, null, 2) }],
    isError: true,
  }));

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

const email = getEmail();
if (!email) {
  log('ERRO: email não configurado');
  startDiagnosticServer('Email não configurado', null).catch(() => process.exit(1));
} else {
  log(`Conectando ao MCP remoto (${email})...`);
  main().catch(async (err) => {
    log(`Erro: ${err.message}`);
    await startDiagnosticServer(err.message, email).catch(() => process.exit(1));
  });
}

async function main() {
  const transport = new StreamableHTTPClientTransport(
    new URL(REMOTE_URL),
    {
      requestInit: {
        headers: {
          'x-user-email': email,
          'x-hostname': hostname(),
          'x-os-user': userInfo().username,
        },
      },
    }
  );

  const client = new Client(
    { name: 'tbc-knowledge-proxy', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);
  log('Conectado ao MCP remoto');

  const { tools } = await client.listTools();
  log(`${tools.length} ferramentas disponíveis`);

  // Add a diagnostic tool to the list
  const allTools = [
    ...tools,
    {
      name: 'getConnectionStatus',
      description: 'Mostra o status da conexão com o MCP remoto (email, servidor, ferramentas).',
      inputSchema: { type: 'object', properties: {} },
    },
  ];

  const server = new Server(
    { name: 'tbc-knowledge-proxy', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allTools,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'getConnectionStatus') {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'connected',
            email,
            hostname: hostname(),
            server: REMOTE_URL,
            tools: tools.map(t => t.name),
            connectedAt: new Date().toISOString(),
          }, null, 2),
        }],
      };
    }

    const result = await client.callTool({
      name: request.params.name,
      arguments: request.params.arguments,
    });
    return result;
  });

  const stdioTransport = new StdioServerTransport();
  await server.connect(stdioTransport);
  log('Proxy stdio ↔ MCP remoto ativo');

  process.on('SIGINT', async () => {
    await client.close();
    await server.close();
    process.exit(0);
  });
}
