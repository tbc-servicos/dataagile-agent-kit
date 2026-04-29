#!/usr/bin/env node
/**
 * Build script — gera bundle unico em dist/tbc-mcp-proxy.mjs
 * Roda: cd mcp-proxy && npm install && npm run build
 */
import { build } from 'esbuild';
import { readFileSync, copyFileSync, mkdirSync } from 'fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

const banner = (name) => ({
  js: `// ${name} v${pkg.version} — bundle gerado automaticamente\n// NÃO EDITAR — edite mcp-proxy/ e rode npm run build\n`,
});

const common = {
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  minify: false,
  sourcemap: false,
};

await build({
  ...common,
  entryPoints: ['connect-remote.js'],
  outfile: '../dist/tbc-mcp-proxy.mjs',
  banner: banner('tbc-mcp-proxy'),
});
console.log(`Build OK → dist/tbc-mcp-proxy.mjs (v${pkg.version})`);

await build({
  ...common,
  entryPoints: ['tae-connect-remote.js'],
  outfile: '../dist/tae-mcp-proxy.mjs',
  banner: banner('tae-mcp-proxy'),
});
console.log(`Build OK → dist/tae-mcp-proxy.mjs (v${pkg.version})`);

// Copiar bundles para dentro de cada plugin (marketplace copia apenas o subdiretório)
const tbcPlugins = ['protheus', 'fluig', 'mit-docs'];
for (const plugin of tbcPlugins) {
  const dir = `../${plugin}/dist`;
  mkdirSync(dir, { recursive: true });
  copyFileSync('../dist/tbc-mcp-proxy.mjs', `${dir}/tbc-mcp-proxy.mjs`);
  console.log(`  Copiado → ${plugin}/dist/tbc-mcp-proxy.mjs`);
}

mkdirSync('../TAE/dist', { recursive: true });
copyFileSync('../dist/tae-mcp-proxy.mjs', '../TAE/dist/tae-mcp-proxy.mjs');
console.log(`  Copiado → TAE/dist/tae-mcp-proxy.mjs`);
