#!/usr/bin/env node
/**
 * connect-remote.js — Proxy stdio ↔ SSE para o TOTVS Sign MCP remoto
 *
 * Conecta ao MCP em https://mcp.totvstbc.com.br/totvssign via SSE,
 * fazendo bridge stdio para que o Claude Code CLI possa usá-lo.
 *
 * Credenciais (em ordem de prioridade):
 *   1. Variáveis de ambiente: TAE_USER_EMAIL + TAE_PASSWORD
 *   2. Arquivo ~/.config/tbc/dev-config.json (campos tae_email, tae_password)
 *   3. KeePass: entrada "TBC/Totvs Assinatura Digital TAE - Login" no banco trabalho
 *
 * O email também é validado contra o auth-server (X-User-Email) para controle de acesso.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { homedir, hostname, userInfo } from 'os';
import path from 'path';

const REMOTE_URL = process.env.TBC_TAE_MCP_URL || 'https://mcp.totvstbc.com.br/totvssign';
const CONFIG_PATH = path.join(homedir(), '.config', 'tbc', 'dev-config.json');
const KEEPASS_DB = '/keepass/trabalho.kdbx';
const KEEPASS_ENTRY = 'TBC/Totvs Assinatura Digital TAE - Login';
const KEEPASS_CREDS = path.join(homedir(), '.claude', '.secrets', 'keepass-creds.sh');

function log(msg) {
  process.stderr.write(`[totvs-sign] ${msg}\n`);
}

/**
 * Read credentials from KeePass (if available on this machine)
 */
function getFromKeePass() {
  if (!existsSync(KEEPASS_DB) || !existsSync(KEEPASS_CREDS)) return null;

  try {
    // Source the creds script and get the password function, then call keepassxc-cli
    const script = `
      source "${KEEPASS_CREDS}"
      pass=$(keepass_get_pass "keepass-trabalho")
      echo "$pass" | keepassxc-cli show -q -s "${KEEPASS_DB}" "${KEEPASS_ENTRY}" 2>/dev/null
    `;
    const output = execSync(script, { shell: '/bin/bash', encoding: 'utf-8', timeout: 5000 });

    const email = output.match(/UserName:\s*(.+)/)?.[1]?.trim();
    const password = output.match(/Password:\s*(.+)/)?.[1]?.trim();

    if (email && password) {
      log('Credenciais carregadas do KeePass');
      return { email, password };
    }
  } catch {
    // KeePass not available or entry not found
  }
  return null;
}

/**
 * Read credentials from config file
 */
function getFromConfig() {
  if (!existsSync(CONFIG_PATH)) return null;
  try {
    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    const email = config.tae_email || config.email;
    const password = config.tae_password;
    if (email && password) {
      log('Credenciais carregadas de dev-config.json');
      return { email, password };
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Read credentials from environment variables
 */
function getFromEnv() {
  const email = process.env.TAE_USER_EMAIL || process.env.TBC_USER_EMAIL;
  const password = process.env.TAE_PASSWORD;
  if (email && password) {
    log('Credenciais carregadas de variáveis de ambiente');
    return { email, password };
  }
  return null;
}

/**
 * Resolve credentials from all sources
 */
function getCredentials() {
  return getFromEnv() || getFromConfig() || getFromKeePass();
}

/**
 * Start a diagnostic MCP server when connection fails
 */
async function startDiagnosticServer(errorMessage, emailUsed) {
  const server = new Server(
    { name: 'totvs-sign-proxy', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  const diagnosticInfo = {
    status: 'error',
    message: errorMessage,
    email: emailUsed || '(não configurado)',
    hostname: hostname(),
    server: REMOTE_URL,
    fix: !emailUsed
      ? [
          'Configure as credenciais de uma das formas:',
          '1. export TAE_USER_EMAIL=seu@email.com.br TAE_PASSWORD=sua-senha',
          '2. Adicione tae_email/tae_password em ~/.config/tbc/dev-config.json',
          '3. Crie entrada "TBC/Totvs Assinatura Digital TAE - Login" no KeePass trabalho',
        ].join('\n')
      : errorMessage.includes('denied') || errorMessage.includes('not authorized')
        ? `Email "${emailUsed}" não autorizado. Solicite acesso em https://mcp.totvstbc.com.br/admin`
        : errorMessage.includes('login failed') || errorMessage.includes('auth failed')
          ? 'Senha do TOTVS Sign incorreta. Verifique suas credenciais.'
          : 'Verifique sua conexão com a internet e tente novamente',
  };

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{
      name: 'getConnectionStatus',
      description: `[ERRO] MCP TOTVS Sign não conectado: ${errorMessage}. Use esta tool para ver detalhes.`,
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

async function checkSubscription(creds) {
  const res = await fetch(REMOTE_URL, {
    method: 'GET',
    headers: {
      'x-user-email': creds.email,
      'x-totvssign-password': creds.password,
      'x-hostname': hostname(),
      'x-os-user': userInfo().username,
    },
  }).catch(() => null);

  if (res && res.status === 402) {
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

async function main(creds) {
  const eventSourceInit = {
    fetch: (url, init) => fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        'x-user-email': creds.email,
        'x-totvssign-password': creds.password,
        'x-hostname': hostname(),
        'x-os-user': userInfo().username,
      },
    }),
  };

  const transport = new SSEClientTransport(
    new URL(REMOTE_URL),
    { eventSourceInit, requestInit: {} }
  );

  const client = new Client(
    { name: 'totvs-sign-proxy', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);
  log('Conectado ao MCP remoto TOTVS Sign');

  const { tools } = await client.listTools();
  log(`${tools.length} ferramentas disponíveis`);

  // Add diagnostic tool
  const allTools = [
    ...tools,
    {
      name: 'getConnectionStatus',
      description: 'Mostra o status da conexão com o MCP TOTVS Sign (email, servidor, ferramentas).',
      inputSchema: { type: 'object', properties: {} },
    },
  ];

  const server = new Server(
    { name: 'totvs-sign-proxy', version: '1.0.0' },
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
            email: creds.email,
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
  log('Proxy stdio ↔ TOTVS Sign MCP remoto ativo');

  process.on('SIGINT', async () => {
    await client.close();
    await server.close();
    process.exit(0);
  });
}

// ── Entry point ──────────────────────────────────────────────────────────────

const creds = getCredentials();
if (!creds) {
  log('ERRO: credenciais não configuradas');
  startDiagnosticServer('Credenciais TOTVS Sign não configuradas', null)
    .catch(() => process.exit(1));
} else {
  log(`Conectando ao MCP remoto (${creds.email})...`);
  await checkSubscription(creds).catch(() => {});
  main(creds).catch(async (err) => {
    log(`Erro: ${err.message}`);
    await startDiagnosticServer(err.message, creds.email)
      .catch(() => process.exit(1));
  });
}
