#!/usr/bin/env node
/**
 * tbc-mcp-proxy — Proxy stdio ↔ Streamable HTTP para MCP remoto TBC
 *
 * Uso: node tbc-mcp-proxy.mjs [URL]
 *   URL default: https://mcp.totvstbc.com.br/mcp
 *
 * Credenciais (lê nesta ordem):
 *   1. Variável de ambiente TBC_USER_EMAIL
 *   2. Arquivo ~/.config/tbc/dev-config.json { "email": "..." }
 *   3. git config user.email (fallback)
 *
 * Cross-platform: macOS, Linux, Windows
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, existsSync } from 'fs';
import { homedir, hostname, userInfo } from 'os';
import { execSync } from 'child_process';
import path from 'path';

const REMOTE_URL = process.argv[2] || process.env.TBC_MCP_URL || 'https://mcp.totvstbc.com.br/mcp';
const CONFIG_PATH = path.join(homedir(), '.config', 'tbc', 'dev-config.json');
const VERSION = '1.1.0';

function log(msg) {
  process.stderr.write(`[tbc-mcp-proxy] ${msg}\n`);
}

function getEmail() {
  // 1. Env var
  if (process.env.TBC_USER_EMAIL) return process.env.TBC_USER_EMAIL;

  // 2. Config file
  if (existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
      if (config.email) return config.email;
    } catch { /* ignore */ }
  }

  // 3. git config (fallback)
  try {
    const email = execSync('git config user.email', { encoding: 'utf-8', timeout: 3000 }).trim();
    if (email) return email;
  } catch { /* ignore */ }

  return null;
}

async function startDiagnosticServer(errorMessage, emailUsed) {
  const server = new Server(
    { name: 'tbc-mcp-proxy', version: VERSION },
    { capabilities: { tools: {} } }
  );

  const diagnosticInfo = {
    status: 'error',
    message: errorMessage,
    email: emailUsed || '(nao configurado)',
    hostname: hostname(),
    server: REMOTE_URL,
    version: VERSION,
    fix: !emailUsed
      ? 'Configure o email: export TBC_USER_EMAIL=seu@email.com.br OU crie ~/.config/tbc/dev-config.json com {"email":"seu@email.com.br"}'
      : errorMessage.includes('denied')
        ? `Email "${emailUsed}" nao cadastrado. Solicite ao administrador em https://mcp.totvstbc.com.br/admin`
        : 'Verifique sua conexao com a internet e tente novamente',
  };

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{
      name: 'getConnectionStatus',
      description: `[ERRO] MCP nao conectado: ${errorMessage}. Use esta tool para ver detalhes.`,
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
  log('ERRO: email nao configurado');
  startDiagnosticServer('Email nao configurado', null).catch(() => process.exit(1));
} else {
  log(`Conectando ao MCP remoto (${email})...`);
  main().catch(async (err) => {
    log(`Erro: ${err.message}`);
    await startDiagnosticServer(err.message, email).catch(() => process.exit(1));
  });
}

async function checkSubscription() {
  const res = await fetch(REMOTE_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-email': email,
      'x-hostname': hostname(),
      'x-os-user': userInfo().username,
      'x-proxy-version': VERSION,
    },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize', id: 0, params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'tbc-mcp-proxy', version: VERSION } } }),
  });

  if (res.status === 402) {
    const body = await res.json().catch(() => ({}));
    const url = body.checkout_url || 'https://mcp.totvstbc.com.br/payment';
    console.error('\n╔════════════════════════════════════════╗');
    console.error('║   TBC Knowledge — Assinatura Expirada  ║');
    console.error('╚════════════════════════════════════════╝');
    console.error(`\n  Seu período de trial expirou.`);
    console.error(`  Para continuar usando, acesse:\n`);
    console.error(`  ${url}\n`);
    process.exit(1);
  }
}

async function main() {
  await checkSubscription();

  const transport = new StreamableHTTPClientTransport(
    new URL(REMOTE_URL),
    {
      requestInit: {
        headers: {
          'x-user-email': email,
          'x-hostname': hostname(),
          'x-os-user': userInfo().username,
          'x-proxy-version': VERSION,
        },
      },
    }
  );

  const client = new Client(
    { name: 'tbc-mcp-proxy', version: VERSION },
    { capabilities: {} }
  );

  await client.connect(transport);
  log('Conectado ao MCP remoto');

  const { tools } = await client.listTools();
  log(`${tools.length} ferramentas disponiveis`);

  const allTools = [
    ...tools,
    {
      name: 'getConnectionStatus',
      description: 'Mostra o status da conexao com o MCP remoto (email, servidor, ferramentas).',
      inputSchema: { type: 'object', properties: {} },
    },
  ];

  const server = new Server(
    { name: 'tbc-mcp-proxy', version: VERSION },
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
            version: VERSION,
            platform: process.platform,
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
  log('Proxy stdio <> MCP remoto ativo');

  process.on('SIGINT', async () => {
    await client.close();
    await server.close();
    process.exit(0);
  });
}
