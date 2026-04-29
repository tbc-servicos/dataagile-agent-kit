#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import Database from 'better-sqlite3';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { decryptToBuffer } from './encrypt-db.js';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// AES-256-GCM decrypt: input is hex string of [IV 16][AuthTag 16][Ciphertext]
function decryptValue(hexData, hexKey) {
  const key = Buffer.from(hexKey, 'hex');
  const data = Buffer.from(hexData, 'hex');
  const iv = data.subarray(0, 16);
  const authTag = data.subarray(16, 32);
  const ciphertext = data.subarray(32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

// Module-level state for credentials (set during auth flow or from tests)
let cachedCredentials = { rag_api_key: '', rag_search_url: '', rag_ask_url: '' };

/**
 * Create query handlers for the MCP server
 * @param {string} dbPath - Path to the database file (plaintext or encrypted)
 * @param {object} credentials - Optional credentials object for testing
 * @returns {object} Query handlers
 */
export function createQueryHandlers(dbPath, credentials = null) {
  const db = new Database(dbPath, { readonly: true });

  // Override credentials if provided (for testing)
  if (credentials) {
    cachedCredentials = credentials;
  }

  return {
    searchFunction({ name, module, type, limit = 50 }) {
      let query = 'SELECT * FROM functions WHERE 1=1';
      const params = [];

      if (name) {
        query += ' AND name LIKE ?';
        params.push(`%${name}%`);
      }

      if (module) {
        query += ' AND module = ?';
        params.push(module);
      }

      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }

      query += ' LIMIT ?';
      params.push(limit);

      return db.prepare(query).all(...params);
    },

    findEndpoint({ keyword, method, module, limit = 50 }) {
      let query = 'SELECT * FROM endpoints WHERE (path LIKE ? OR function_name LIKE ? OR namespace LIKE ?)';
      const params = [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`];

      if (method) {
        query += ' AND method = ?';
        params.push(method);
      }

      if (module) {
        query += ' AND module = ?';
        params.push(module);
      }

      query += ' LIMIT ?';
      params.push(limit);

      return db.prepare(query).all(...params);
    },

    findSmartView({ keyword, team, module, limit = 50 }) {
      let query = 'SELECT * FROM smartview_objects WHERE (class_name LIKE ? OR display_name LIKE ?)';
      const params = [`%${keyword}%`, `%${keyword}%`];

      if (team) {
        query += ' AND team = ?';
        params.push(team);
      }

      if (module) {
        query += ' AND module = ?';
        params.push(module);
      }

      query += ' LIMIT ?';
      params.push(limit);

      return db.prepare(query).all(...params);
    },

    findExecAuto({ target, caller, table, module, limit = 50 }) {
      let query = 'SELECT * FROM exec_auto WHERE target_function LIKE ?';
      const params = [`%${target}%`];

      if (caller) {
        query += ' AND caller_function LIKE ?';
        params.push(`%${caller}%`);
      }

      if (table) {
        query += ' AND table_alias LIKE ?';
        params.push(`%${table}%`);
      }

      if (module) {
        query += ' AND module = ?';
        params.push(module);
      }

      query += ' LIMIT ?';
      params.push(limit);

      return db.prepare(query).all(...params);
    },

    findMvcPattern({ model_id, table, module, limit = 50 }) {
      let query = 'SELECT * FROM mvc_patterns WHERE model_id LIKE ?';
      const params = [`%${model_id}%`];

      if (table) {
        query += ' AND tables LIKE ?';
        params.push(`%${table}%`);
      }

      if (module) {
        query += ' AND module = ?';
        params.push(module);
      }

      query += ' LIMIT ?';
      params.push(limit);

      return db.prepare(query).all(...params);
    },

    listModules() {
      return db.prepare(
        'SELECT module, COUNT(*) as count FROM functions GROUP BY module ORDER BY count DESC'
      ).all();
    },

    searchByTable({ table, limit = 20 }) {
      const results = {};

      // Search in functions (protheus_doc)
      results.functions = db.prepare(
        'SELECT id, name, module FROM functions WHERE protheus_doc LIKE ? LIMIT ?'
      ).all(`%${table}%`, limit);

      // Search in endpoints (path)
      results.endpoints = db.prepare(
        'SELECT id, path, function_name FROM endpoints WHERE path LIKE ? LIMIT ?'
      ).all(`%${table}%`, limit);

      // Search in smartview (tables)
      results.smartviews = db.prepare(
        'SELECT id, class_name, team FROM smartview_objects WHERE tables LIKE ? LIMIT ?'
      ).all(`%${table}%`, limit);

      // Search in exec_auto (table_alias)
      results.exec_auto = db.prepare(
        'SELECT id, caller_function, target_function FROM exec_auto WHERE table_alias LIKE ? LIMIT ?'
      ).all(`%${table}%`, limit);

      // Search in mvc (tables)
      results.mvc = db.prepare(
        'SELECT id, model_id, tables FROM mvc_patterns WHERE tables LIKE ? LIMIT ?'
      ).all(`%${table}%`, limit);

      return results;
    },

    searchKnowledge({ keyword, skill, category, platform, limit = 20 }) {
      let query = 'SELECT * FROM knowledge_patterns WHERE content LIKE ?';
      const params = [`%${keyword}%`];

      if (skill) {
        query += ' AND skill = ?';
        params.push(skill);
      }

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      if (platform) {
        query += ' AND platform = ?';
        params.push(platform);
      }

      query += ' LIMIT ?';
      params.push(limit);

      return db.prepare(query).all(...params);
    },

    searchDocuments({ keyword, doc_type, limit = 20 }) {
      let query = 'SELECT * FROM documents WHERE (title LIKE ? OR content LIKE ?)';
      const params = [`%${keyword}%`, `%${keyword}%`];

      if (doc_type) {
        query += ' AND doc_type = ?';
        params.push(doc_type);
      }

      query += ' LIMIT ?';
      params.push(limit);

      return db.prepare(query).all(...params);
    },

    getCredentials() {
      return {
        rag_api_key: cachedCredentials.rag_api_key,
        rag_search_url: cachedCredentials.rag_search_url,
        rag_ask_url: cachedCredentials.rag_ask_url
      };
    },

    close() {
      db.close();
    }
  };
}

/**
 * Load or authenticate to get encryption key and credentials
 */
async function loadAuthCache() {
  const cacheDir = path.join(process.env.HOME || os.homedir(), '.config/tbc');
  const cachePath = path.join(cacheDir, 'advpl-auth.json');

  // Try to read cache
  if (fs.existsSync(cachePath)) {
    const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    const expiresAt = new Date(cached.expires_at);

    if (expiresAt > new Date()) {
      console.error('[auth] Using cached credentials');
      return cached;
    }
    console.error('[auth] Cache expired, fetching new credentials');
  }

  // Fetch new credentials
  const authServerUrl = process.env.AUTH_SERVER_URL || 'https://auth-claudecode.totvstbc.com.br';


  let email = process.env.CLAUDE_CODE_USER_EMAIL;
  if (!email) {
    const userConfigPath = path.join(process.env.HOME || os.homedir(), '.config/tbc/user.json');
    if (fs.existsSync(userConfigPath)) {
      try {
        const userConfig = JSON.parse(fs.readFileSync(userConfigPath, 'utf-8'));
        email = userConfig.email;
      } catch (_) {}
    }
  }
  if (!email) {
    try {
      email = execSync('git config user.email', { encoding: 'utf-8' }).trim();
    } catch (_) {}
  }
  if (!email) {
    throw new Error('EMAIL_NOT_CONFIGURED');
  }

  let hostname = 'unknown';
  let osUser = process.env.USER || process.env.USERNAME || 'unknown';
  try { hostname = execSync('hostname', { encoding: 'utf-8' }).trim(); } catch (_) {}

  console.error(`[auth] Authenticating as ${email} @ ${hostname} (${osUser})...`);
  const authController = new AbortController();
  const authTimeout = setTimeout(() => authController.abort(), 15000);
  let response;
  try {
    response = await fetch(`${authServerUrl}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, hostname, os_user: osUser }),
      signal: authController.signal
    });
  } catch (err) {
    clearTimeout(authTimeout);
    if (err.name === 'AbortError') {
      throw new Error(`Auth server não respondeu em 15s. Verifique sua conexão ou tente novamente.`);
    }
    throw new Error(`Falha ao conectar ao auth server: ${err.message}`);
  }
  clearTimeout(authTimeout);

  if (response.status === 403) {
    const reason = await response.json().then(r => r.error).catch(() => 'denied');
    const msg = reason === 'denied_expired'
      ? `Acesso expirado para ${email}. Solicite renovação ao administrador.`
      : `Acesso negado: ${email} não está cadastrado. Contate o administrador em https://auth-claudecode.totvstbc.com.br/admin`;
    console.error(`[auth] ${msg}`);
    throw Object.assign(new Error(msg), { authDenied: true });
  }

  if (!response.ok) {
    throw new Error(`Auth server error: ${response.status} ${response.statusText}`);
  }

  const credentials = await response.json();

  // Decrypt encrypted secrets from auth server response
  const encKey = credentials.encryption_key;
  const ragApiKey = decryptValue(credentials.rag_api_key_encrypted, encKey);
  const ragSearchUrl = decryptValue(credentials.rag_search_url_encrypted, encKey);
  const ragAskUrl = decryptValue(credentials.rag_ask_url_encrypted, encKey);

  // Ensure cache directory exists
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  // Save to cache (plaintext after decryption)
  const cacheData = {
    email,
    encryption_key: encKey,
    rag_api_key: ragApiKey,
    rag_search_url: ragSearchUrl,
    rag_ask_url: ragAskUrl,
    expires_at: credentials.expires_at,
    cached_at: new Date().toISOString()
  };

  fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
  console.error('[auth] Credentials cached');

  return cacheData;
}

/**
 * Decrypt and set up the database
 */
async function setupDatabase() {
  const dbPath = process.env.ADVPL_KNOWLEDGE_DB || 'data/protheus_knowledge.db.enc';
  const absDbPath = path.isAbsolute(dbPath) ? dbPath : path.join(__dirname, dbPath);

  // Load auth and get encryption key
  const auth = await loadAuthCache();
  cachedCredentials = {
    rag_api_key: auth.rag_api_key,
    rag_search_url: auth.rag_search_url,
    rag_ask_url: auth.rag_ask_url
  };

  // Check if db is encrypted or plaintext
  let finalDbPath = absDbPath;

  if (absDbPath.endsWith('.enc')) {
    // Decrypt to temp file
    console.error('[decrypt] Decrypting database...');
    const plainBuffer = decryptToBuffer(absDbPath, auth.encryption_key);
    finalDbPath = path.join(os.tmpdir(), `advpl-knowledge-${Date.now()}.db`);
    fs.writeFileSync(finalDbPath, plainBuffer);
    console.error(`[decrypt] Database ready at ${finalDbPath}`);

    // Clean up temp file on exit
    process.on('exit', () => {
      try {
        fs.unlinkSync(finalDbPath);
      } catch (err) {
        // Ignore
      }
    });
  } else {
    console.error(`[setup] Using plaintext database at ${finalDbPath}`);
  }

  return finalDbPath;
}

/**
 * MCP Server setup
 */
async function setupServer() {
  // Connect transport immediately so Claude's MCP handshake doesn't time out.
  // DB decryption (54MB) happens in background; handlers wait for it via promise.
  let handlersResolve, handlersReject;
  let handlersPromise = new Promise((res, rej) => { handlersResolve = res; handlersReject = rej; });

  const server = new Server({
    name: 'advpl-knowledge',
    version: '1.0.0'
  }, {
    capabilities: { tools: {} }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[server] MCP server started');

  // Setup DB in background after transport is connected
  setupDatabase().then(dbPath => {
    handlersResolve(createQueryHandlers(dbPath));
    console.error('[server] Database ready');
  }).catch(err => {
    handlersReject(err);
    console.error('[server] Database setup failed:', err.message);
  });

  // List tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'searchFunction',
        description: 'Search ADVPL/TLPP functions by name, module, and type',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Function name (partial match)'
            },
            module: {
              type: 'string',
              description: 'Module name (exact match)'
            },
            type: {
              type: 'string',
              description: 'Function type (exact match)'
            },
            limit: {
              type: 'integer',
              description: 'Maximum results',
              default: 50
            }
          },
          required: ['name']
        }
      },
      {
        name: 'findEndpoint',
        description: 'Find REST API endpoints by keyword, method, or module',
        inputSchema: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'Search in path, function_name, or namespace'
            },
            method: {
              type: 'string',
              description: 'HTTP method (GET, POST, etc.)'
            },
            module: {
              type: 'string',
              description: 'Module name (exact match)'
            },
            limit: {
              type: 'integer',
              description: 'Maximum results',
              default: 50
            }
          },
          required: ['keyword']
        }
      },
      {
        name: 'findSmartView',
        description: 'Search SmartView objects by keyword, team, or module',
        inputSchema: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'Search in class_name or display_name'
            },
            team: {
              type: 'string',
              description: 'Team name (exact match)'
            },
            module: {
              type: 'string',
              description: 'Module name (exact match)'
            },
            limit: {
              type: 'integer',
              description: 'Maximum results',
              default: 50
            }
          },
          required: ['keyword']
        }
      },
      {
        name: 'findExecAuto',
        description: 'Find ExecAuto calls by target function, caller, or table',
        inputSchema: {
          type: 'object',
          properties: {
            target: {
              type: 'string',
              description: 'Target function name (partial match)'
            },
            caller: {
              type: 'string',
              description: 'Caller function name (partial match)'
            },
            table: {
              type: 'string',
              description: 'Table alias (partial match)'
            },
            module: {
              type: 'string',
              description: 'Module name (exact match)'
            },
            limit: {
              type: 'integer',
              description: 'Maximum results',
              default: 50
            }
          },
          required: ['target']
        }
      },
      {
        name: 'findMvcPattern',
        description: 'Search MVC patterns by model ID, table, or module',
        inputSchema: {
          type: 'object',
          properties: {
            model_id: {
              type: 'string',
              description: 'Model ID (partial match)'
            },
            table: {
              type: 'string',
              description: 'Table name (partial match)'
            },
            module: {
              type: 'string',
              description: 'Module name (exact match)'
            },
            limit: {
              type: 'integer',
              description: 'Maximum results',
              default: 50
            }
          },
          required: ['model_id']
        }
      },
      {
        name: 'listModules',
        description: 'List all modules with function counts',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'searchByTable',
        description: 'Cross-search for a table across all relevant tables',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Table name to search for'
            },
            limit: {
              type: 'integer',
              description: 'Maximum results per category',
              default: 20
            }
          },
          required: ['table']
        }
      },
      {
        name: 'searchKnowledge',
        description: 'Search knowledge patterns by keyword, skill, category, or platform',
        inputSchema: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'Search in content'
            },
            skill: {
              type: 'string',
              description: 'Skill filter (exact match)'
            },
            category: {
              type: 'string',
              description: 'Category filter (exact match)'
            },
            platform: {
              type: 'string',
              description: 'Platform filter (exact match)'
            },
            limit: {
              type: 'integer',
              description: 'Maximum results',
              default: 20
            }
          },
          required: ['keyword']
        }
      },
      {
        name: 'searchDocuments',
        description: 'Search documents by keyword and type',
        inputSchema: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'Search in title or content'
            },
            doc_type: {
              type: 'string',
              description: 'Document type filter (exact match)'
            },
            limit: {
              type: 'integer',
              description: 'Maximum results',
              default: 20
            }
          },
          required: ['keyword']
        }
      },
      {
        name: 'getCredentials',
        description: 'Get RAG API credentials for additional services',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'setUserEmail',
        description: 'Save the user email for authentication. Call this when the user provides their corporate email.',
        inputSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'Corporate email address (e.g. nome@empresa.com.br)'
            }
          },
          required: ['email']
        }
      }
    ]
  }));

  // Call tools
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // setUserEmail works even before auth is ready (or after auth failure)
    if (name === 'setUserEmail') {
      const { email } = args;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { content: [{ type: 'text', text: 'Email inválido. Informe um endereço no formato nome@empresa.com.br' }], isError: true };
      }
      const configDir = path.join(process.env.HOME || os.homedir(), '.config/tbc');
      const configPath = path.join(configDir, 'user.json');
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify({ email }, null, 2));
      console.error(`[auth] Email saved: ${email}`);

      // Reset handlersPromise and retry auth+db setup
      handlersPromise = new Promise((res, rej) => { handlersResolve = res; handlersReject = rej; });
      setupDatabase().then(dbPath => {
        handlersResolve(createQueryHandlers(dbPath));
        console.error('[server] Database ready after email update');
      }).catch(err => {
        handlersReject(err);
        console.error('[server] Database setup failed after email update:', err.message);
      });

      return { content: [{ type: 'text', text: `✅ Email salvo: ${email}. Autenticando com o servidor TBC...` }] };
    }

    let handlers;
    try {
      handlers = await handlersPromise;
    } catch (err) {
      if (err.message === 'EMAIL_NOT_CONFIGURED') {
        return {
          content: [{ type: 'text', text: `❌ Email não configurado.\n\nPergunta ao usuário: "Qual é o seu email corporativo? (ex: nome@empresa.com.br)" e em seguida chame a ferramenta \`setUserEmail\` com o email informado.` }],
          isError: true
        };
      }
      return {
        content: [{ type: 'text', text: `⚠️ MCP advpl-knowledge indisponível: ${err.message}` }],
        isError: true
      };
    }

    try {
      let result;

      switch (name) {
        case 'searchFunction':
          result = handlers.searchFunction(args);
          break;
        case 'findEndpoint':
          result = handlers.findEndpoint(args);
          break;
        case 'findSmartView':
          result = handlers.findSmartView(args);
          break;
        case 'findExecAuto':
          result = handlers.findExecAuto(args);
          break;
        case 'findMvcPattern':
          result = handlers.findMvcPattern(args);
          break;
        case 'listModules':
          result = handlers.listModules();
          break;
        case 'searchByTable':
          result = handlers.searchByTable(args);
          break;
        case 'searchKnowledge':
          result = handlers.searchKnowledge(args);
          break;
        case 'searchDocuments':
          result = handlers.searchDocuments(args);
          break;
        case 'getCredentials':
          result = handlers.getCredentials();
          break;
        default:
          return {
            content: [{ type: 'text', text: `Unknown tool: ${name}` }],
            isError: true
          };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error: ${err.message}` }],
        isError: true
      };
    }
  });
}

// Run if called directly
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  setupServer().catch((err) => {
    console.error('[error]', err.message);
    process.exit(1);
  });
}
