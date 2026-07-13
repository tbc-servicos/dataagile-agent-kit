// Smoke do BUNDLE REAL dos MCP proxies distribuídos em <plugin>/dist/ — o
// artefato que o usuário recebe. Lição do incidente 2.14.1 do plugin interno:
// o bundle publicado crashava no boot (require de package.json em runtime) e
// nenhum teste executava o dist/ de verdade. Este teste falha em qualquer
// crash de inicialização, com e sem credenciais.
// Uso: node --test tests/mcp/bundle-smoke.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const BUNDLES = [
  path.join(ROOT, 'protheus', 'dist', 'tbc-mcp-proxy.mjs'),
  path.join(ROOT, 'fluig', 'dist', 'tbc-mcp-proxy.mjs'),
];

for (const bundle of BUNDLES) {
  test(`bundle ${path.relative(ROOT, bundle)} inicializa sem crash`, () => {
    assert.ok(existsSync(bundle), 'bundle existe no dist/ do plugin');
    for (const env of [
      { HOME: '/tmp/inexistente-smoke' },                                      // sem credenciais
      { HOME: '/tmp/inexistente-smoke', DATAAGILE_USER_EMAIL: 'smoke@test.dev' } // com email
    ]) {
      const r = spawnSync('node', [bundle], {
        env: { PATH: process.env.PATH, ...env },
        input: '', timeout: 8000, encoding: 'utf8',
      });
      const out = (r.stderr || '') + (r.stdout || '');
      assert.ok(!out.includes('MODULE_NOT_FOUND'),
        `bundle crashou com MODULE_NOT_FOUND:\n${out.slice(0, 400)}`);
      assert.ok(!out.includes('is not defined'),
        `bundle crashou com identificador indefinido:\n${out.slice(0, 400)}`);
      assert.ok(/dataagile-knowledge|Conectando|credencial/i.test(out),
        `proxy não logou inicialização:\n${out.slice(0, 400)}`);
    }
  });
}
