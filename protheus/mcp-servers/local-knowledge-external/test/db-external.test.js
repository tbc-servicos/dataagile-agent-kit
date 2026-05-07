'use strict';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const dbModule = require('../db-external.js');

const DIM = 4;

function makeEmbedding(...vals) {
  const arr = new Float32Array(DIM);
  vals.forEach((v, i) => { arr[i] = v; });
  return arr;
}

function createFixtureDb() {
  const database = dbModule.openDb(':memory:');
  dbModule.initSchema(database, DIM);

  const { lastInsertRowid: k1 } = dbModule.insertKnowledge(database, 'Como resolver erro NF-e: atualizar certificado digital A1 vencido', 'fiscal');
  dbModule.insertVecKnowledge(database, makeEmbedding(0.1, 0.2, 0.3, 0.4), Number(k1));

  const { lastInsertRowid: k2 } = dbModule.insertKnowledge(database, 'Erro de conexão MSSQL: verificar porta 1433 e firewall', 'geral');
  dbModule.insertVecKnowledge(database, makeEmbedding(0.5, 0.6, 0.7, 0.8), Number(k2));

  dbModule.insertDoc(database, {
    qdrant_id: 'doc-001', product_id: 'fluig', product_name: 'Fluig',
    title: 'Dataset REST', source_url: 'https://tdn.totvs.com/fluig/dataset',
    section: 'api_reference', doc_type: 'guide',
    text: 'Como criar dataset REST no Fluig', indexed_at: '2024-05-01',
  });
  const doc = database.prepare("SELECT id FROM docs WHERE qdrant_id = 'doc-001'").get();
  dbModule.insertVecDoc(database, makeEmbedding(0.3, 0.5, 0.7, 0.9), doc.id);

  dbModule.logImport(database, 'knowledge', 2);
  dbModule.logImport(database, 'docs', 1);

  return database;
}

describe('db-external.js — schema e operações', () => {
  let database;

  before(() => { database = createFixtureDb(); });
  after(() => { database.close(); });

  describe('initSchema', () => {
    test('tabelas knowledge, docs, vec_knowledge, vec_docs existem', () => {
      const tables = database.prepare(
        "SELECT name FROM sqlite_master WHERE type IN ('table','shadow') AND name NOT LIKE 'sqlite_%'"
      ).all().map(r => r.name);
      assert.ok(tables.some(n => n.includes('knowledge')), 'tabela knowledge ausente');
      assert.ok(tables.some(n => n.includes('docs')), 'tabela docs ausente');
    });

    test('tabela knowledge NÃO tem campos de atribuição', () => {
      const cols = database.pragma('table_info(knowledge)').map(c => c.name);
      assert.ok(!cols.includes('ticket_id'), 'ticket_id não deve existir');
      assert.ok(!cols.includes('organizacao'), 'organizacao não deve existir');
      assert.ok(!cols.includes('autor'), 'autor não deve existir');
      assert.ok(!cols.includes('email_autor'), 'email_autor não deve existir');
      assert.ok(cols.includes('conteudo'), 'conteudo deve existir');
      assert.ok(cols.includes('categoria'), 'categoria deve existir');
    });

    test('rejeita dimension inválido', () => {
      const d = dbModule.openDb(':memory:');
      assert.throws(() => dbModule.initSchema(d, 0), /dimension inválido/);
      assert.throws(() => dbModule.initSchema(d, 70000), /dimension inválido/);
      d.close();
    });
  });

  describe('searchKnowledge', () => {
    test('retorna conteudo, categoria e score', () => {
      const results = dbModule.searchKnowledge(database, makeEmbedding(0.1, 0.2, 0.3, 0.4), 5);
      assert.ok(results.length > 0);
      const r = results[0];
      assert.ok('conteudo' in r, 'conteudo ausente');
      assert.ok('categoria' in r, 'categoria ausente');
      assert.ok('score' in r, 'score ausente');
    });

    test('score entre -1 e 1 (cosine similarity)', () => {
      const results = dbModule.searchKnowledge(database, makeEmbedding(0.1, 0.2, 0.3, 0.4), 5);
      results.forEach(r => {
        assert.ok(r.score >= -1 && r.score <= 1, `score fora do range [-1,1]: ${r.score}`);
      });
    });

    test('resultado NÃO contém ticket_id, organizacao, autor', () => {
      const results = dbModule.searchKnowledge(database, makeEmbedding(0.1, 0.2, 0.3, 0.4), 5);
      results.forEach(r => {
        assert.ok(!('ticket_id' in r), 'ticket_id não deve estar presente');
        assert.ok(!('organizacao' in r), 'organizacao não deve estar presente');
        assert.ok(!('autor' in r), 'autor não deve estar presente');
      });
    });
  });

  describe('searchDocs', () => {
    test('retorna text, score, source_url, product_id', () => {
      const results = dbModule.searchDocs(database, makeEmbedding(0.3, 0.5, 0.7, 0.9), null, null, 5);
      assert.ok(results.length > 0);
      const r = results[0];
      assert.ok('text' in r);
      assert.ok('score' in r);
      assert.ok('source_url' in r);
      assert.ok('product_id' in r);
    });

    test('filtro product_id funciona', () => {
      const results = dbModule.searchDocs(database, makeEmbedding(0.3, 0.5, 0.7, 0.9), 'fluig', null, 5);
      results.forEach(r => assert.equal(r.product_id, 'fluig'));
    });
  });

  describe('knowledgeStats', () => {
    test('retorna total_knowledge, total_docs, last_knowledge_import', () => {
      const stats = dbModule.knowledgeStats(database);
      assert.ok(stats.total_knowledge >= 1);
      assert.ok(stats.total_docs >= 1);
      assert.ok(stats.products_count >= 1);
      assert.ok(stats.last_knowledge_import !== null);
    });
  });
});
