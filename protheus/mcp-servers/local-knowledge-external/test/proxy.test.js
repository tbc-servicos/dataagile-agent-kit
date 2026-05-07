'use strict';

/**
 * Testes unitários do output filter do proxy.js.
 * Extrai e testa a lógica de filtragem sem subir o processo proxy.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Re-implementa a lógica de filtragem do proxy para testes isolados
const REDACT_TOKEN = '[informação removida]';

const BLOCKLIST = [
  { label: 'email',        src: String.raw`[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}` },
  { label: 'func_totvs',   src: String.raw`\bMAT[A-Z]\d{3,}` },
  { label: 'func_totvs',   src: String.raw`\bFAT[A-Z]\d{3,}` },
  { label: 'func_totvs',   src: String.raw`\bCONT[A-Z]\d{3,}` },
  { label: 'func_totvs',   src: String.raw`\bPLS[A-Z]\d{3,}` },
  { label: 'func_totvs',   src: String.raw`\bRHU[A-Z][A-Z0-9]{2,}` },
  { label: 'ticket_ref',   src: String.raw`ticket\s*(?:#\s*)?\d{3,}` },
  { label: 'ticket_ref',   src: String.raw`chamado\s*(?:#\s*)?\d{3,}` },
  { label: 'ticket_ref',   src: String.raw`\bID\s*[:#]?\s*\d{5,}` },
  { label: 'internal_sys', src: String.raw`scrapping[-_]consulta[-_]ticket` },
  { label: 'internal_sys', src: String.raw`agente[_\-]scraping` },
  { label: 'internal_sys', src: String.raw`qdrant` },
  { label: 'internal_sys', src: String.raw`vps[-_]?\d` },
  { label: 'internal_sys', src: String.raw`local[-_]knowledge` },
  { label: 'attribution',  src: String.raw`base de conhecimento totvs` },
  { label: 'attribution',  src: String.raw`banco de tickets` },
  { label: 'attribution',  src: String.raw`tickets?\s+de\s+suporte` },
];

function filterText(text) {
  let filtered = text;
  for (const { src } of BLOCKLIST) {
    filtered = filtered.replace(new RegExp(src, 'gi'), REDACT_TOKEN);
  }
  return filtered;
}

describe('proxy.js — output filter blocklist', () => {
  describe('emails', () => {
    test('redacta email simples', () => {
      const out = filterText('Contato: joao.silva@totvs.com.br para suporte');
      assert.ok(!out.includes('@'), 'email não foi removido');
      assert.ok(out.includes(REDACT_TOKEN));
    });

    test('redacta email em contexto JSON', () => {
      const out = filterText('{"email": "fulano@empresa.com", "msg": "ok"}');
      assert.ok(!out.includes('@'));
    });

    test('não redacta texto sem email', () => {
      const out = filterText('Configure o certificado A1 no Protheus');
      assert.equal(out, 'Configure o certificado A1 no Protheus');
    });
  });

  describe('funções TOTVS proprietárias', () => {
    test('redacta MATA010', () => {
      const out = filterText('A função MATA010 é chamada no faturamento');
      assert.ok(!out.includes('MATA010'));
      assert.ok(out.includes(REDACT_TOKEN));
    });

    test('redacta FATA060, CONT010, PLSA180, RHUFIN10', () => {
      for (const fn of ['FATA060', 'CONTA010', 'PLSA180', 'RHUFIN10']) {
        const out = filterText(`Erro na função ${fn}`);
        assert.ok(!out.includes(fn), `${fn} não foi redactado`);
      }
    });

    test('case-insensitive: mata010', () => {
      const out = filterText('chama mata010 no contexto');
      assert.ok(!out.toLowerCase().includes('mata010'));
    });

    test('não redacta palavra comum como MATRIX', () => {
      const out = filterText('Veja o MATRIX de permissões');
      // MATRIX não bate no padrão MAT[A-Z]\d{3,} (sem dígitos suficientes)
      assert.equal(out, 'Veja o MATRIX de permissões');
    });
  });

  describe('referências a tickets', () => {
    test('redacta "ticket #12345"', () => {
      const out = filterText('Conforme ticket #12345 do cliente');
      assert.ok(!out.includes('12345'));
    });

    test('redacta "chamado 98765"', () => {
      const out = filterText('Ver chamado 98765 para mais detalhes');
      assert.ok(!out.includes('98765'));
    });

    test('redacta "ID: 123456"', () => {
      const out = filterText('Referência ID: 123456 no sistema');
      assert.ok(!out.includes('123456'));
    });

    test('não redacta número com menos de 3 dígitos em ticket', () => {
      const out = filterText('ticket 99');
      // Padrão exige \d{3,}
      assert.equal(out, 'ticket 99');
    });
  });

  describe('sistemas internos', () => {
    test('redacta "qdrant"', () => {
      const out = filterText('Dados indexados no Qdrant');
      assert.ok(!out.toLowerCase().includes('qdrant'));
    });

    test('redacta "local-knowledge"', () => {
      const out = filterText('MCP server local-knowledge rodando');
      assert.ok(!out.includes('local-knowledge'));
    });

    test('redacta "vps-5"', () => {
      const out = filterText('Conectado ao vps-5 com sucesso');
      assert.ok(!out.toLowerCase().includes('vps-5'));
    });

    test('redacta "scrapping-consulta-ticket"', () => {
      const out = filterText('API scrapping-consulta-ticket respondeu 200');
      assert.ok(!out.includes('scrapping'));
    });
  });

  describe('atribuição', () => {
    test('redacta "tickets de suporte"', () => {
      const out = filterText('Baseado em tickets de suporte TOTVS');
      assert.ok(!out.toLowerCase().includes('tickets de suporte'));
    });

    test('redacta "base de conhecimento totvs"', () => {
      const out = filterText('Fonte: base de conhecimento TOTVS');
      assert.ok(!out.toLowerCase().includes('base de conhecimento totvs'));
    });
  });

  describe('texto limpo passa sem modificação', () => {
    test('resposta técnica sem padrões sensíveis', () => {
      const clean = 'Para resolver o erro de certificado NF-e, atualize o arquivo .pfx no servidor.';
      assert.equal(filterText(clean), clean);
    });

    test('JSON de stats sem campos sensíveis', () => {
      const json = '{"total_knowledge": 6471, "total_docs": 22293}';
      assert.equal(filterText(json), json);
    });
  });
});
