#!/usr/bin/env node
'use strict';

/**
 * import-external.js — Constrói a base de conhecimento externa anonimizada.
 *
 * Para tickets: agrupa interações por ticket_id, chama LLM (gpt-4o-mini) para
 * extrair conhecimento genérico sem atribuição, re-embedda o texto resultante.
 * Para docs: importa diretamente do Qdrant (conteúdo TDN é público).
 *
 * Uso:
 *   node import-external.js              — import completo
 *   node import-external.js --dry-run    — valida credenciais sem conectar ao Qdrant
 *
 * Requer ~/.config/tbc/local-knowledge.json com openrouter_api_key.
 * DB de saída: ~/.local/share/tbc/local-knowledge-external.db (chmod 600)
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const db = require('./db-external.js');

const DB_PATH = path.join(os.homedir(), '.local', 'share', 'tbc', 'local-knowledge-external.db');
const CONFIG_PATH = path.join(os.homedir(), '.config', 'tbc', 'local-knowledge.json');
const QDRANT_LOCAL_PORT = 16333;
const QDRANT_REMOTE_PORT = 6333;
const BATCH_SIZE = 100;
const TICKETS_COLLECTION = 'ticket_chunks';
const DOCS_COLLECTION = 'all_docs_v3';
const EMBEDDING_MODEL = 'openai/text-embedding-3-small';
const LLM_MODEL = 'openai/gpt-4o-mini';

const isDryRun = process.argv.includes('--dry-run');

// ─── Config ───────────────────────────────────────────────────────────────────

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Config não encontrada: ${CONFIG_PATH}\nCrie com: { "openrouter_api_key": "sk-or-..." }`);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

// ─── Credentials ──────────────────────────────────────────────────────────────

function getVpsCredentials() {
  const helper = path.join(os.homedir(), '.claude', 'scripts', 'vps_credentials.sh');
  if (!fs.existsSync(helper)) {
    throw new Error(`KeePass helper não encontrado: ${helper}`);
  }
  const run = (field) => execSync(`"${helper}" vps-5 ${field}`, { encoding: 'utf-8' }).trim();
  return { user: run('username'), host: run('url'), password: run('password') };
}

// ─── SSH Tunnel ───────────────────────────────────────────────────────────────

function openTunnel(creds) {
  const args = [
    '-e', 'ssh',
    '-o', 'StrictHostKeyChecking=accept-new',
    '-o', 'ServerAliveInterval=30',
    '-N',
    '-L', `${QDRANT_LOCAL_PORT}:localhost:${QDRANT_REMOTE_PORT}`,
    `${creds.user}@${creds.host}`,
  ];
  const proc = spawn('sshpass', args, {
    stdio: ['ignore', 'ignore', 'pipe'],
    env: { ...process.env, SSHPASS: creds.password },
  });
  proc.stderr.on('data', (d) => {
    const msg = d.toString().trim();
    if (msg) process.stderr.write(`[tunnel] ${msg}\n`);
  });
  proc.on('error', (e) => { throw new Error(`Falha ao abrir SSH tunnel: ${e.message}`); });
  return proc;
}

function closeTunnel(proc) {
  try { proc.kill(); } catch { /* já encerrado */ }
}

async function waitForTunnel(ms = 2000) {
  await new Promise(r => setTimeout(r, ms));
}

// ─── Qdrant API ───────────────────────────────────────────────────────────────

const QDRANT_BASE = `http://localhost:${QDRANT_LOCAL_PORT}`;

async function qdrantPost(path, body) {
  const resp = await fetch(`${QDRANT_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => resp.statusText);
    throw new Error(`Qdrant POST ${path} → ${resp.status}: ${txt}`);
  }
  return resp.json();
}

async function detectDimension(collection) {
  const resp = await fetch(`${QDRANT_BASE}/collections/${collection}`, { signal: AbortSignal.timeout(10_000) });
  if (!resp.ok) throw new Error(`Qdrant GET /collections/${collection} → ${resp.status}`);
  const info = await resp.json();
  const vectors = info?.result?.config?.params?.vectors;
  const dim = vectors?.size
    ?? vectors?.dense?.size
    ?? vectors?.embedding?.size
    ?? Object.values(vectors ?? {}).find(v => v?.size)?.size;
  if (!dim) throw new Error(`Não foi possível detectar dimensão da coleção ${collection}`);
  if (!Number.isInteger(dim) || dim < 1 || dim > 65535) {
    throw new Error(`Dimensão inválida recebida do Qdrant para ${collection}: ${dim}`);
  }
  return dim;
}

async function* scrollCollection(collection, withVectors) {
  let offset = null;
  while (true) {
    const body = { limit: BATCH_SIZE, with_payload: true, with_vectors: withVectors };
    if (offset) body.offset = offset;
    const result = await qdrantPost(`/collections/${collection}/points/scroll`, body);
    const points = result?.result?.points ?? [];
    if (points.length === 0) break;
    yield points;
    offset = result?.result?.next_page_offset;
    if (!offset) break;
  }
}

// ─── OpenRouter API ───────────────────────────────────────────────────────────

async function callLLM(apiKey, prompt) {
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.1,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => resp.statusText);
    throw new Error(`LLM API error ${resp.status}: ${txt}`);
  }
  const json = await resp.json();
  return json.choices[0].message.content.trim();
}

async function getEmbedding(apiKey, text) {
  const resp = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => resp.statusText);
    throw new Error(`Embedding API error ${resp.status}: ${txt}`);
  }
  const json = await resp.json();
  return json.data[0].embedding;
}

// ─── Knowledge Extraction ─────────────────────────────────────────────────────

const EXTRACTION_PROMPT = `Você é um extrator de conhecimento técnico.

Extraia APENAS o conhecimento técnico genérico do conteúdo abaixo.

INCLUA:
- Qual o problema ou sintoma técnico
- Qual a solução ou workaround encontrado
- Mensagens de erro ou log relevantes
- Configurações ou parâmetros envolvidos

NÃO INCLUA:
- Nomes de pessoas ou organizações
- Endereços de email
- IDs de tickets ou chamados
- Nomes de funções internas proprietárias (ex: MATA010, FATA020)
- Qualquer informação que identifique a origem do conteúdo
- Referências a sistemas internos

Responda em português. Seja conciso e técnico. Máximo 250 palavras.
Se o conteúdo não tiver valor técnico, responda apenas: [sem valor técnico]`;

function buildTicketContext(assunto, descricao, interactions) {
  const parts = [];
  if (assunto) parts.push(`Assunto: ${assunto}`);
  if (descricao) parts.push(`Problema: ${descricao}`);
  const textos = interactions
    .filter(i => i.texto && i.texto.length > 20)
    .map(i => `${i.tipo_autor ?? 'Sistema'}: ${i.texto}`)
    .join('\n\n');
  if (textos) parts.push(`Conversas:\n${textos}`);
  return parts.join('\n\n');
}

function inferCategoria(assunto) {
  if (!assunto) return null;
  const s = assunto.toLowerCase();
  if (s.includes('nf-e') || s.includes('nota fiscal') || s.includes('sped') || s.includes('nfe')) return 'fiscal';
  if (s.includes('folha') || s.includes('rh') || s.includes('esocial') || s.includes('funcionário')) return 'rh';
  if (s.includes('financ') || s.includes('contas') || s.includes('pagamento') || s.includes('recebi')) return 'financeiro';
  if (s.includes('estoque') || s.includes('inventário') || s.includes('produto')) return 'estoque';
  if (s.includes('compras') || s.includes('pedido') || s.includes('fornecedor')) return 'compras';
  if (s.includes('vendas') || s.includes('cliente') || s.includes('faturamento')) return 'vendas';
  if (s.includes('banco') || s.includes('cnab') || s.includes('remessa')) return 'banco';
  if (s.includes('contab') || s.includes('balanço') || s.includes('lançamento')) return 'contabilidade';
  return 'geral';
}

// ─── Import: Knowledge (tickets → LLM synthesis) ──────────────────────────────

async function importKnowledge(database, apiKey) {
  console.log(`\n[knowledge] Coletando payloads da coleção ${TICKETS_COLLECTION} (sem vetores)...`);

  // Passo 1: coletar todos os payloads sem vetores (mais rápido, menos memória)
  const ticketMap = new Map(); // ticket_id → { assunto, descricao, interactions[] }
  let totalPoints = 0;

  for await (const batch of scrollCollection(TICKETS_COLLECTION, false)) {
    for (const point of batch) {
      const p = point.payload ?? {};
      const ticketId = p.ticket_id ?? p.id;
      if (!ticketId) continue;

      if (!ticketMap.has(ticketId)) {
        ticketMap.set(ticketId, {
          assunto: p.assunto ?? p.subject ?? null,
          descricao: p.descricao_problema ?? p.description ?? null,
          interactions: [],
        });
      }
      const entry = ticketMap.get(ticketId);
      const texto = p.texto ?? p.texto_limpo ?? p.text ?? null;
      if (texto && texto.length > 20) {
        entry.interactions.push({ tipo_autor: p.tipo_autor ?? p.author_type, texto });
      }
    }
    totalPoints += batch.length;
    process.stdout.write(`\r[knowledge] ${totalPoints} pontos coletados, ${ticketMap.size} tickets únicos...`);
  }

  console.log(`\n[knowledge] ${ticketMap.size} tickets para processar. Iniciando LLM + embedding...\n`);

  // Passo 2: para cada ticket, extrair conhecimento via LLM e embeddar
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const [ticketId, { assunto, descricao, interactions }] of ticketMap) {
    const context = buildTicketContext(assunto, descricao, interactions);
    if (context.length < 50) { skipped++; continue; }

    try {
      const prompt = `${EXTRACTION_PROMPT}\n\n---\n${context}`;
      const conhecimento = await callLLM(apiKey, prompt);

      if (conhecimento === '[sem valor técnico]' || conhecimento.length < 30) {
        skipped++;
        continue;
      }

      const embedding = await getEmbedding(apiKey, conhecimento);
      const categoria = inferCategoria(assunto);

      const { lastInsertRowid } = db.insertKnowledge(database, conhecimento, categoria);
      db.insertVecKnowledge(database, embedding, Number(lastInsertRowid));
      processed++;

      if (processed % 50 === 0) {
        process.stdout.write(`\r[knowledge] ${processed} extraídos, ${skipped} ignorados, ${failed} erros...`);
      }
    } catch (e) {
      failed++;
      process.stderr.write(`\n[knowledge] Erro no ticket ${ticketId}: ${e.message}\n`);
      if (failed > 50) throw new Error('Muitos erros consecutivos — abortando import');
    }
  }

  console.log(`\n[knowledge] Concluído: ${processed} conhecimentos extraídos, ${skipped} ignorados, ${failed} erros`);
  db.logImport(database, 'knowledge', processed);
  return processed;
}

// ─── Import: Docs (direto do Qdrant, sem LLM) ────────────────────────────────

async function importDocs(database) {
  console.log(`\n[docs] Iniciando import da coleção ${DOCS_COLLECTION}...`);
  let totalPoints = 0;

  for await (const batch of scrollCollection(DOCS_COLLECTION, true)) {
    const insertBatch = database.transaction(() => {
      for (const point of batch) {
        const p = point.payload ?? {};
        const qdrantId = String(point.id);

        db.insertDoc(database, {
          qdrant_id: qdrantId,
          product_id: p.product_id ?? p.product ?? null,
          product_name: p.product_name ?? p.product_id ?? null,
          title: p.title ?? null,
          source_url: p.source_url ?? p.url ?? null,
          section: p.section ?? null,
          doc_type: p.doc_type ?? p.type ?? null,
          text: p.text ?? p.content ?? null,
          indexed_at: p.indexed_at ?? new Date().toISOString(),
        });

        const docVec = Array.isArray(point.vector) ? point.vector : point.vector?.dense;
        if (docVec) {
          const doc = database.prepare('SELECT id FROM docs WHERE qdrant_id = ?').get(qdrantId);
          if (doc) db.insertVecDoc(database, docVec, doc.id);
        }
      }
    });
    insertBatch();
    totalPoints += batch.length;
    process.stdout.write(`\r[docs] ${totalPoints} documentos processados...`);
  }

  console.log(`\n[docs] Concluído: ${totalPoints} documentos`);
  db.logImport(database, 'docs', totalPoints);
  return totalPoints;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== local-knowledge-external import ===');

  const config = loadConfig();
  const apiKey = config.openrouter_api_key ?? config.openai_api_key;
  if (!apiKey) throw new Error('openrouter_api_key não encontrado no config');

  if (isDryRun) {
    console.log('[dry-run] Config OK. Validando credenciais VPS...');
    const creds = getVpsCredentials();
    console.log(`[dry-run] Credenciais VPS-5 OK (user: ${creds.user}, host: ${creds.host})`);
    console.log('[dry-run] Validação completa. Sem conexão ao Qdrant em --dry-run.');
    return;
  }

  const dbDir = path.dirname(DB_PATH);
  fs.mkdirSync(dbDir, { recursive: true, mode: 0o700 });

  console.log('[import] Buscando credenciais VPS-5 via KeePass...');
  const creds = getVpsCredentials();
  console.log(`[import] Credenciais obtidas (user: ${creds.user})`);

  console.log('[import] Abrindo SSH tunnel → VPS-5:6333...');
  const tunnel = openTunnel(creds);
  await waitForTunnel(2000);

  let database = null;
  let exitCode = 0;

  try {
    console.log('[import] Detectando dimensão dos vetores...');
    const dimDocs = await detectDimension(DOCS_COLLECTION);
    console.log(`[import] Dimensão docs: ${dimDocs}`);

    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
      console.log('[import] DB anterior removido para recriação limpa.');
    }
    database = db.openDb(DB_PATH);
    db.initSchema(database, dimDocs);

    const knowledgeCount = await importKnowledge(database, apiKey);
    const docCount = await importDocs(database);

    database.close();
    database = null;

    fs.chmodSync(DB_PATH, 0o600);
    console.log(`\n✅ Import externo concluído:`);
    console.log(`   Conhecimentos: ${knowledgeCount}`);
    console.log(`   Docs: ${docCount}`);
    console.log(`   DB: ${DB_PATH} (chmod 600)`);
    console.log('\nPróximo passo: publicar no GitHub Releases');
    console.log('  gh release create vYYYY-MM-DD --title "local-knowledge-external YYYY-MM-DD"');
    console.log(`  gh release upload vYYYY-MM-DD ${DB_PATH}`);

  } catch (e) {
    console.error(`\n❌ Erro durante import: ${e.message}`);
    exitCode = 1;
  } finally {
    if (database) try { database.close(); } catch { /* ignore */ }
    closeTunnel(tunnel);
    console.log('[import] SSH tunnel encerrado.');
  }

  process.exit(exitCode);
}

main().catch((e) => {
  console.error(`[import-external] Fatal: ${e.message}`);
  process.exit(1);
});
