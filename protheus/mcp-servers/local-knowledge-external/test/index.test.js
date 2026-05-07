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

  const { lastInsertRowid: k1 } = dbModule.insertKnowledge(database, 'Solução para erro de transmissão NF-e: renovar certificado A1', 'fiscal');
  dbModule.insertVecKnowledge(database, makeEmbedding(0.1, 0.2, 0.3, 0.4), Number(k1));

  dbModule.insertDoc(database, {
    qdrant_id: 'doc-001', product_id: 'protheus', product_name: 'Protheus',
    title: 'Configuração NF-e', source_url: 'https://tdn.totvs.com/protheus/nfe',
    section: 'tutorial', doc_type: 'guide',
    text: 'Passo a passo para configurar NF-e no Protheus', indexed_at: '2024-05-01',
  });
  const doc = database.prepare("SELECT id FROM docs WHERE qdrant_id = 'doc-001'").get();
  dbModule.insertVecDoc(database, makeEmbedding(0.2, 0.4, 0.6, 0.8), doc.id);

  dbModule.logImport(database, 'knowledge', 1);
  dbModule.logImport(database, 'docs', 1);

  return database;
}

describe('index.js — lógica das tools (sem servidor MCP)', () => {
  let database;

  before(() => { database = createFixtureDb(); });
  after(() => { database.close(); });

  describe('searchKnowledge', () => {
    test('retorna resultados com conteudo e score', () => {
      const results = dbModule.searchKnowledge(database, makeEmbedding(0.1, 0.2, 0.3, 0.4), 5);
      assert.ok(results.length > 0);
      assert.ok('conteudo' in results[0]);
      assert.ok('score' in results[0]);
    });

    test('NÃO expõe getTicket-equivalent (tabela knowledge sem ticket_id)', () => {
      // Verificar que não existe forma de recuperar dados com ticket_id
      const tables = database.prepare(
        "SELECT name FROM sqlite_master WHERE type='table'"
      ).all().map(r => r.name);
      assert.ok(!tables.includes('tickets'), 'tabela tickets não deve existir no DB externo');
      assert.ok(!tables.includes('interactions'), 'tabela interactions não deve existir no DB externo');
    });

    test('score em [-1, 1]', () => {
      const results = dbModule.searchKnowledge(database, makeEmbedding(0.1, 0.2, 0.3, 0.4), 5);
      results.forEach(r => {
        assert.ok(r.score >= -1 && r.score <= 1, `score fora do range: ${r.score}`);
      });
    });

    test('retorna vazio para embedding vazio', () => {
      assert.throws(() => dbModule.searchKnowledge(database, [], 5));
    });
  });

  describe('searchDocs', () => {
    test('retorna campos obrigatórios', () => {
      const results = dbModule.searchDocs(database, makeEmbedding(0.2, 0.4, 0.6, 0.8), null, null, 5);
      assert.ok(results.length > 0);
      assert.ok('text' in results[0]);
      assert.ok('score' in results[0]);
      assert.ok('source_url' in results[0]);
    });

    test('filtro product_id e section combinados', () => {
      const results = dbModule.searchDocs(database, makeEmbedding(0.2, 0.4, 0.6, 0.8), 'protheus', 'tutorial', 5);
      results.forEach(r => {
        assert.equal(r.product_id, 'protheus');
        assert.equal(r.section, 'tutorial');
      });
    });

    test('product_id inexistente retorna array vazio', () => {
      const results = dbModule.searchDocs(database, makeEmbedding(0.2, 0.4, 0.6, 0.8), 'produto-inexistente', null, 5);
      assert.deepEqual(results, []);
    });
  });

  describe('listProducts', () => {
    test('retorna product_id, product_name, total_docs', () => {
      const products = dbModule.listProducts(database);
      assert.ok(products.length >= 1);
      const p = products.find(x => x.product_id === 'protheus');
      assert.ok(p, 'protheus não encontrado');
      assert.ok('total_docs' in p);
    });
  });

  describe('knowledgeStats', () => {
    test('retorna total_knowledge, total_docs, last_knowledge_import', () => {
      const stats = dbModule.knowledgeStats(database);
      assert.ok(stats.total_knowledge >= 1);
      assert.ok(stats.total_docs >= 1);
      assert.ok(stats.last_knowledge_import !== null);
    });

    test('NÃO expõe total_tickets ou total_interactions', () => {
      const stats = dbModule.knowledgeStats(database);
      assert.ok(!('total_tickets' in stats), 'total_tickets não deve existir no stats externo');
      assert.ok(!('total_interactions' in stats), 'total_interactions não deve existir');
    });
  });
});
