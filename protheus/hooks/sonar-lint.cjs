#!/usr/bin/env node
'use strict';
/**
 * sonar-lint.cjs — hook PostToolUse: aplica as regras oficiais do SonarQube EngPro TOTVS
 * no instante em que o fonte é gravado, em vez de só no /protheus:reviewer.
 *
 * Por que é um hook SEPARADO do advpl-lint.sh (e não mais um pedaço dele):
 *   - advpl-lint depende do `advpls` (TDS-LS) e cuida de pré-processamento/compilação;
 *     quem não tem o binário instalado fica sem gate nenhum.
 *   - Estas regras são análise de TEXTO: rodam em qualquer máquina, em milissegundos,
 *     sem AppServer e sem includes. Separar mantém cada hook com uma responsabilidade só
 *     e garante que a régua da EngPro valha para todo mundo.
 *
 * Este arquivo é o ADAPTADOR: só faz I/O (stdin/arquivo → tela → exit code). Toda a decisão
 * mora no motor puro (lib/sonar-engine.cjs), que é testável sem tocar em disco.
 *
 * Uso:
 *   hook: recebe o JSON do Claude Code por stdin
 *   CLI:  node sonar-lint.cjs <arquivo.prw>   (exit 2 se houver violação bloqueante)
 */
const fs = require('fs');
const path = require('path');
const { analisar } = require('./lib/sonar-engine.cjs');

const EXT_ADVPL = /\.(prw|tlpp)$/i;
const URL_REGRAS = 'https://sonar-rules.engpro.totvs.com.br/rules';

function lerStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

/** Descobre o fonte a analisar: argumento de linha de comando ou JSON do hook. */
function resolverArquivo() {
  const arg = process.argv[2];
  if (arg) return arg;
  try {
    const input = JSON.parse(lerStdin() || '{}');
    return input?.tool_input?.file_path || input?.tool_input?.path || '';
  } catch {
    return '';
  }
}

function formatar(achados, arquivo) {
  const bloqueantes = achados.filter((a) => a.bloqueante);
  const avisos = achados.filter((a) => !a.bloqueante);
  const linhas = [`SONAR ENGPRO: ${path.basename(arquivo)}`];

  const bloco = (titulo, lista) => {
    if (!lista.length) return;
    linhas.push('', `${titulo} (${lista.length}):`);
    for (const a of lista) {
      linhas.push(`   linha ${a.linha} · ${a.codigo} — ${a.titulo}`);
      linhas.push(`      ${a.trecho}`);
      linhas.push(`      → ${a.correcao}`);
    }
  };

  bloco('❌ Violações que reprovam na homologação TOTVS', bloqueantes);
  bloco('⚠️  Code smells (não bloqueiam, mas o SonarQube aponta)', avisos);
  linhas.push('', `Catálogo completo: ${URL_REGRAS}`);
  if (bloqueantes.length) {
    linhas.push('Corrija as violações acima antes de compilar. Se for falso positivo, justifique '
      + 'no fonte: // sonar:ignore <CODIGO> <motivo> (o /protheus:reviewer continua reportando).');
  }
  return linhas.join('\n');
}

function main() {
  const arquivo = resolverArquivo();
  if (!arquivo || !EXT_ADVPL.test(arquivo) || !fs.existsSync(arquivo)) return 0;

  let achados;
  try {
    achados = analisar(fs.readFileSync(arquivo, 'utf8'));
  } catch (e) {
    // Um bug no lint nunca pode impedir o dev de gravar o fonte.
    console.log(`⚠️  SONAR ENGPRO: não foi possível analisar ${path.basename(arquivo)}: ${e.message}`);
    return 0;
  }

  if (!achados.length) {
    console.log(`✅ SONAR ENGPRO: ${path.basename(arquivo)} sem violações`);
    return 0;
  }

  const relatorio = formatar(achados, arquivo);
  if (achados.some((a) => a.bloqueante)) {
    // exit 2 + STDERR: é assim que o Claude Code devolve o texto ao modelo para ele corrigir.
    // Em stdout, o modelo seria bloqueado sem saber por quê.
    console.error(relatorio);
    return 2;
  }
  console.log(relatorio);
  return 0;
}

process.exit(main());
