#!/usr/bin/env node
'use strict';
/**
 * sync-sonar-rules.cjs — sincroniza as regras oficiais do SonarQube EngPro TOTVS
 * (https://sonar-rules.engpro.totvs.com.br) para a referência do /protheus:reviewer.
 *
 * Como a fonte funciona (descoberto por engenharia reversa do bundle):
 *   - É uma SPA Angular SEM API. O catálogo (codigo/tipo/desc) está embutido no
 *     bundle `main.<hash>.js`; o "como resolver" de cada regra é um HTML estático
 *     em `assets/rules-html/<CODIGO>.html`.
 *   - Portanto: lê o index.html → descobre o bundle → extrai o catálogo → baixa
 *     os detalhes → gera markdown determinístico.
 *
 * Uso:
 *   node scripts/sync-sonar-rules.cjs           # regenera a referência
 *   node scripts/sync-sonar-rules.cjs --check   # falha (exit 1) se estiver desatualizada (CI)
 */
const fs = require('fs');
const path = require('path');

const BASE = process.env.SONAR_RULES_URL || 'https://sonar-rules.engpro.totvs.com.br';
const OUT = path.join(__dirname, '..', 'protheus', 'skills', 'reviewer', 'references',
  'sonarqube-rules-engpro.md');
const TIMEOUT = 20000;

async function get(url, asText = true) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) throw new Error(`${res.status} em ${url}`);
  return asText ? res.text() : res.arrayBuffer();
}

/**
 * HTML → markdown útil. A fonte traz um <table> de metadados (TypeName/CheckId/
 * Category/Applicability) que só repete o que já está no índice — descartado.
 * O que interessa é: Causas, Descrição da Regra, COMO CORRIGIR e os exemplos.
 */
function htmlToMarkdown(html) {
  let s = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<table[\s\S]*?<\/table>/gi, '')   // tabela de metadados (redundante)
    .replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '')   // título (já é o cabeçalho da seção)
    .replace(/<h[2-6][^>]*>([\s\S]*?)<\/h[2-6]>/gi, '\n**$1**\n')
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, code) =>
      '\n```advpl\n' + code.replace(/<[^>]+>/g, '').trim() + '\n```\n')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<\/(p|div|tr|ul|ol)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return s.split('\n').map((l) => l.trim()).filter((l, i, a) => l || a[i - 1])
    .join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function main() {
  const check = process.argv.includes('--check');

  const index = await get(`${BASE}/`);
  const bundle = (index.match(/src="(main\.[a-f0-9]+\.js)"/) || [])[1];
  if (!bundle) throw new Error('bundle main.*.js não encontrado no index — a SPA mudou?');

  const js = await get(`${BASE}/${bundle}`);
  const re = /\{codigo:"(.*?)",tipo:"(.*?)",desc:"(.*?)"\}/g;
  const rules = [];
  for (const m of js.matchAll(re)) {
    const unesc = (x) => x.replace(/\\x([0-9a-f]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
    rules.push({ codigo: unesc(m[1]), tipo: unesc(m[2]), desc: unesc(m[3]) });
  }
  if (!rules.length) throw new Error('catálogo de regras não encontrado no bundle — formato mudou?');

  const detalhes = {};
  for (const r of rules) {
    try {
      detalhes[r.codigo] = htmlToMarkdown(await get(`${BASE}/assets/rules-html/${r.codigo}.html`));
    } catch (e) {
      detalhes[r.codigo] = `_(detalhe indisponível na fonte: ${e.message})_`;
    }
  }

  const porTipo = rules.reduce((acc, r) => ((acc[r.tipo] = (acc[r.tipo] || 0) + 1), acc), {});
  const linhas = [];
  linhas.push('# Regras SonarQube — EngPro TOTVS (catálogo oficial completo)');
  linhas.push('');
  linhas.push(`> **Gerado por \`scripts/sync-sonar-rules.cjs\` a partir de ${BASE} — não edite à mão.**`);
  linhas.push('> Rode o script para ressincronizar quando a TOTVS publicar regras novas (o CI verifica com `--check`).');
  linhas.push('');
  linhas.push(`**${rules.length} regras** — ` + Object.entries(porTipo).map(([t, n]) => `${n} ${t}`).join(' · '));
  linhas.push('');
  linhas.push('## Índice');
  linhas.push('');
  linhas.push('| Código | Tipo | Descrição |');
  linhas.push('|--------|------|-----------|');
  for (const r of rules) {
    const d = r.desc.replace(/^[A-Z]+[0-9-]+:\s*/, '').replace(/\|/g, '\\|');
    linhas.push(`| [${r.codigo}](#${r.codigo.toLowerCase()}) | ${r.tipo} | ${d} |`);
  }
  linhas.push('');
  linhas.push('## Detalhe e correção');
  linhas.push('');
  for (const r of rules) {
    linhas.push(`### ${r.codigo}`);
    linhas.push('');
    linhas.push(`**Tipo:** ${r.tipo}`);
    linhas.push('');
    linhas.push(detalhes[r.codigo] || '_(sem detalhe)_');
    linhas.push('');
    linhas.push('---');
    linhas.push('');
  }
  const novo = linhas.join('\n');

  if (check) {
    const atual = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (atual !== novo) {
      console.error('Referência SonarQube desatualizada — rode: node scripts/sync-sonar-rules.cjs');
      process.exit(1);
    }
    console.log(`Regras SonarQube em dia (${rules.length} regras).`);
    return;
  }

  fs.writeFileSync(OUT, novo);
  console.log(`${path.relative(process.cwd(), OUT)}: ${rules.length} regras sincronizadas ` +
    `(${Object.entries(porTipo).map(([t, n]) => `${n} ${t}`).join(', ')}).`);
}

main().catch((e) => { console.error(`ERRO: ${e.message}`); process.exit(2); });
