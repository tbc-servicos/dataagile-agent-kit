#!/usr/bin/env node
'use strict';

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs');
const os = require('os');
const path = require('path');
const db = require('./db-external.js');

const DB_PATH = path.join(os.homedir(), '.local', 'share', 'tbc', 'local-knowledge-external.db');
const CONFIG_PATH = path.join(os.homedir(), '.config', 'tbc', 'local-knowledge.json');

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  let raw;
  try {
    const stat = fs.statSync(CONFIG_PATH);
    if ((stat.mode & 0o077) !== 0) {
      process.stderr.write(`[local-knowledge-external] AVISO: ${CONFIG_PATH} tem permissões abertas. Execute: chmod 600 ${CONFIG_PATH}\n`);
    }
    raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  } catch (e) {
    process.stderr.write(`[local-knowledge-external] erro ao ler config: ${e.message}\n`);
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    process.stderr.write(`[local-knowledge-external] config com JSON inválido: ${CONFIG_PATH}\n`);
    return null;
  }
}

async function getEmbedding(text, apiKey) {
  const resp = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'openai/text-embedding-3-small', input: text }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => resp.statusText);
    process.stderr.write(`[local-knowledge-external] embedding API error ${resp.status}: ${errText}\n`);
    throw new Error(`Embedding API error ${resp.status}`);
  }
  const json = await resp.json();
  return json.data[0].embedding;
}

function err(text) {
  return { content: [{ type: 'text', text }], isError: true };
}

function ok(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

async function setupServer() {
  const server = new Server(
    { name: 'local-knowledge-external', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );
  const transport = new StdioServerTransport();
  await server.connect(transport);

  let database = null;
  let dbError = null;
  if (!fs.existsSync(DB_PATH)) {
    dbError = `Base de conhecimento não encontrada em ${DB_PATH}.\n\nExecute o setup:\n  cd protheus/mcp-servers/local-knowledge-external\n  node setup.js`;
  } else {
    try {
      database = db.openDb(DB_PATH);
    } catch (e) {
      dbError = `Erro ao abrir base de conhecimento: ${e.message}`;
    }
  }

  function requireDb() {
    if (dbError) throw new Error(dbError);
    return database;
  }

  function requireApiKey() {
    const cfg = loadConfig();
    const key = cfg?.openrouter_api_key ?? cfg?.openai_api_key;
    if (!key) throw new Error(`Chave de API não configurada.\n\nCrie ${CONFIG_PATH} com:\n{\n  "openrouter_api_key": "sk-or-..."\n}`);
    return key;
  }

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'searchKnowledge',
        description: 'Busca na base de conhecimento técnica por soluções, erros e boas práticas. Retorna trechos relevantes ordenados por similaridade.',
        inputSchema: {
          type: 'object',
          properties: {
            q: { type: 'string', description: 'Texto da busca em linguagem natural' },
            limit: { type: 'integer', description: 'Máximo de resultados (padrão 10, máx 50)', default: 10 },
          },
          required: ['q'],
        },
      },
      {
        name: 'searchDocs',
        description: 'Busca na documentação técnica (guias, referências de API, tutoriais). Use listProducts para ver product_ids válidos.',
        inputSchema: {
          type: 'object',
          properties: {
            q: { type: 'string', description: 'Texto da busca em linguagem natural' },
            product_id: { type: 'string', description: 'Filtrar por produto (ex: "fluig", "protheus") — use listProducts para ver opções' },
            section: { type: 'string', description: 'Filtrar por seção (ex: "api_reference", "tutorial")' },
            limit: { type: 'integer', description: 'Máximo de resultados (padrão 10, máx 100)', default: 10 },
          },
          required: ['q'],
        },
      },
      {
        name: 'listProducts',
        description: 'Lista produtos disponíveis na base de documentação com contagem de documentos. Use antes de searchDocs com product_id.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'getKnowledgeStats',
        description: 'Estatísticas da base de conhecimento: total de entradas e data da última atualização.',
        inputSchema: { type: 'object', properties: {} },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'searchKnowledge': {
          const d = requireDb();
          const key = requireApiKey();
          const q = String(args.q ?? '').trim().slice(0, 2000);
          if (!q) return err('Parâmetro q é obrigatório e não pode ser vazio.');
          const limit = Math.min(Math.max(1, args.limit ?? 10), 50);
          const embedding = await getEmbedding(q, key);
          return ok(db.searchKnowledge(d, embedding, limit));
        }

        case 'searchDocs': {
          const d = requireDb();
          const key = requireApiKey();
          const q = String(args.q ?? '').trim().slice(0, 2000);
          if (!q) return err('Parâmetro q é obrigatório e não pode ser vazio.');
          const limit = Math.min(Math.max(1, args.limit ?? 10), 100);
          const embedding = await getEmbedding(q, key);
          return ok(db.searchDocs(d, embedding, args.product_id ?? null, args.section ?? null, limit));
        }

        case 'listProducts': {
          return ok(db.listProducts(requireDb()));
        }

        case 'getKnowledgeStats': {
          return ok(db.knowledgeStats(requireDb()));
        }

        default:
          return err(`Tool desconhecida: ${name}`);
      }
    } catch (e) {
      return err(e.message);
    }
  });
}

setupServer().catch((e) => {
  process.stderr.write(`[local-knowledge-external] fatal: ${e.message}\n`);
  process.exit(1);
});
