'use strict';

const Database = require('better-sqlite3');
const sqliteVec = require('sqlite-vec');

// sqlite-vec v0.1.9 does not support WHERE on auxiliary columns in KNN queries.
// Workaround: over-fetch (limit * OVERFETCH_FACTOR) and post-filter in JS.
const OVERFETCH_FACTOR = 10;

function openDb(dbPath) {
  const db = new Database(dbPath);
  sqliteVec.load(db);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

function initSchema(db, dimension = 1536) {
  if (!Number.isInteger(dimension) || dimension < 1 || dimension > 65535) {
    throw new Error(`dimension inválido: ${dimension}. Deve ser inteiro entre 1 e 65535.`);
  }
  db.exec(`
    -- Conhecimento extraído por LLM — sem atribuição a tickets, orgs ou autores
    CREATE TABLE IF NOT EXISTS knowledge (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      conteudo    TEXT NOT NULL,
      categoria   TEXT,
      indexed_at  TEXT NOT NULL
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS vec_knowledge USING vec0(
      embedding FLOAT[${dimension}],
      +knowledge_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS docs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      qdrant_id    TEXT UNIQUE NOT NULL,
      product_id   TEXT,
      product_name TEXT,
      title        TEXT,
      source_url   TEXT,
      section      TEXT,
      doc_type     TEXT,
      text         TEXT,
      indexed_at   TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_docs_product_id ON docs(product_id);
    CREATE INDEX IF NOT EXISTS idx_docs_section ON docs(section);

    CREATE VIRTUAL TABLE IF NOT EXISTS vec_docs USING vec0(
      embedding FLOAT[${dimension}],
      +doc_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS import_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      collection  TEXT NOT NULL,
      imported_at TEXT NOT NULL,
      total_items INTEGER NOT NULL
    );
  `);
}

function insertKnowledge(db, conteudo, categoria = null) {
  return db.prepare(
    'INSERT INTO knowledge (conteudo, categoria, indexed_at) VALUES (?, ?, ?)'
  ).run(conteudo, categoria, new Date().toISOString());
}

function insertVecKnowledge(db, embedding, knowledgeId) {
  const buf = embeddingToBuffer(embedding);
  return db.prepare(
    'INSERT INTO vec_knowledge(embedding, knowledge_id) VALUES (?, ?)'
  ).run(buf, BigInt(knowledgeId));
}

function insertDoc(db, doc) {
  return db.prepare(`
    INSERT OR REPLACE INTO docs
      (qdrant_id, product_id, product_name, title, source_url, section, doc_type, text, indexed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    doc.qdrant_id, doc.product_id, doc.product_name, doc.title,
    doc.source_url, doc.section, doc.doc_type, doc.text, doc.indexed_at
  );
}

function insertVecDoc(db, embedding, docId) {
  const buf = embeddingToBuffer(embedding);
  return db.prepare(
    'INSERT INTO vec_docs(embedding, doc_id) VALUES (?, ?)'
  ).run(buf, BigInt(docId));
}

function logImport(db, collection, totalItems) {
  db.prepare(
    'INSERT INTO import_log (collection, imported_at, total_items) VALUES (?, ?, ?)'
  ).run(collection, new Date().toISOString(), totalItems);
}

function searchKnowledge(db, embedding, limit = 10) {
  const buf = embeddingToBuffer(embedding);

  const rows = db.prepare(`
    SELECT v.rowid, v.knowledge_id, v.distance,
           k.conteudo, k.categoria
    FROM vec_knowledge v
    LEFT JOIN knowledge k ON k.id = v.knowledge_id
    WHERE v.embedding MATCH ? AND k = ?
    ORDER BY v.distance
  `).all(buf, limit);

  return rows.map(r => ({
    conteudo: r.conteudo,
    categoria: r.categoria,
    // L2 distance → cosine similarity for unit-normalized vectors: cos = 1 - (d² / 2)
    score: 1 - (r.distance * r.distance / 2),
  }));
}

function searchDocs(db, embedding, productId = null, section = null, limit = 10) {
  const buf = embeddingToBuffer(embedding);
  const k = (productId || section) ? limit * OVERFETCH_FACTOR : limit;

  const rows = db.prepare(`
    SELECT v.rowid, v.doc_id, v.distance,
           d.product_id, d.product_name, d.title, d.source_url, d.section, d.doc_type, d.text
    FROM vec_docs v
    LEFT JOIN docs d ON d.id = v.doc_id
    WHERE v.embedding MATCH ? AND k = ?
    ORDER BY v.distance
  `).all(buf, k);

  let filtered = rows;
  if (productId) filtered = filtered.filter(r => r.product_id === productId);
  if (section) filtered = filtered.filter(r => r.section === section);

  return filtered.slice(0, limit).map(r => ({
    text: r.text,
    // L2 distance → cosine similarity for unit-normalized vectors: cos = 1 - (d² / 2)
    score: 1 - (r.distance * r.distance / 2),
    source_url: r.source_url,
    title: r.title,
    product_id: r.product_id,
    section: r.section,
  }));
}

function listProducts(db) {
  return db.prepare(`
    SELECT d.product_id, d.product_name, COUNT(*) AS total_docs,
           l.imported_at AS last_imported_at
    FROM docs d
    LEFT JOIN (
      SELECT imported_at FROM import_log WHERE collection = 'docs'
      ORDER BY imported_at DESC LIMIT 1
    ) l ON 1=1
    GROUP BY d.product_id
    ORDER BY d.product_id
  `).all();
}

function knowledgeStats(db) {
  const { total_knowledge } = db.prepare('SELECT COUNT(*) AS total_knowledge FROM knowledge').get();
  const { total_docs } = db.prepare('SELECT COUNT(*) AS total_docs FROM docs').get();
  const { products_count } = db.prepare('SELECT COUNT(DISTINCT product_id) AS products_count FROM docs').get();
  const kLog = db.prepare(
    "SELECT imported_at FROM import_log WHERE collection = 'knowledge' ORDER BY imported_at DESC LIMIT 1"
  ).get();
  const dLog = db.prepare(
    "SELECT imported_at FROM import_log WHERE collection = 'docs' ORDER BY imported_at DESC LIMIT 1"
  ).get();
  return {
    total_knowledge,
    total_docs,
    products_count,
    last_knowledge_import: kLog?.imported_at ?? null,
    last_docs_import: dLog?.imported_at ?? null,
  };
}

function embeddingToBuffer(embedding) {
  if (Buffer.isBuffer(embedding)) return embedding;
  if (embedding instanceof Float32Array) {
    return Buffer.from(embedding.buffer, embedding.byteOffset, embedding.byteLength);
  }
  const f32 = new Float32Array(embedding);
  return Buffer.from(f32.buffer, f32.byteOffset, f32.byteLength);
}

module.exports = {
  openDb,
  initSchema,
  insertKnowledge,
  insertVecKnowledge,
  insertDoc,
  insertVecDoc,
  logImport,
  searchKnowledge,
  searchDocs,
  listProducts,
  knowledgeStats,
};
