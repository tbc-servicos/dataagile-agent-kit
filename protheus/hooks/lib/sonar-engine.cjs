'use strict';
/**
 * sonar-engine.cjs — motor que aplica o catálogo de regras EngPro a um fonte ADVPL/TLPP.
 *
 * É PURO de propósito: entra texto, sai lista de achados. Não lê arquivo, não escreve na
 * tela, não chama processo. Quem faz I/O é o adaptador (sonar-lint.cjs) — a mesma separação
 * que o plugin cobra do dev nas skills /protheus:clean-architecture. Consequência prática:
 * cada regra é testável sem AppServer, sem advpls e sem tocar em disco.
 *
 * O motor não sabe QUAIS regras existem — ele só sabe aplicá-las (sonar-rules.cjs é o dado).
 */
const { REGRAS } = require('./sonar-rules.cjs');

/**
 * Apaga comentários e/ou o miolo das strings, SEM mudar o comprimento do texto — trocar
 * cada caractere por espaço preserva número de linha e coluna dos achados.
 *
 * Isto é a fundação de tudo: é o que impede o hook de acusar um `iif()` citado dentro de
 * um comentário ou de uma mensagem de texto. Um lint que grita em falso é desligado no
 * primeiro dia e deixa de proteger qualquer coisa.
 *
 * Comentários ADVPL: `//`, `&&`, `*` na 1ª coluna e blocos `/* … *\/`.
 */
function limparRuido(src, { comentarios = true, strings = true } = {}) {
  const out = src.split('');
  let i = 0;
  const n = src.length;
  let inicioDeLinha = true;
  const apagar = (pos) => { if (out[pos] !== '\n') out[pos] = ' '; };

  while (i < n) {
    const c = src[i];
    const prox = src[i + 1];

    if (c === '\n') { inicioDeLinha = true; i++; continue; }
    const eraInicio = inicioDeLinha;
    if (!/\s/.test(c)) inicioDeLinha = false;

    // comentário de bloco
    if (c === '/' && prox === '*') {
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (comentarios) apagar(i); i++; }
      if (i < n) { if (comentarios) { apagar(i); apagar(i + 1); } i += 2; }
      continue;
    }
    // comentário de linha: // ou && ou * na primeira coluna
    if ((c === '/' && prox === '/') || (c === '&' && prox === '&') || (c === '*' && eraInicio)) {
      while (i < n && src[i] !== '\n') { if (comentarios) apagar(i); i++; }
      continue;
    }
    // string literal
    if (c === '"' || c === "'") {
      const aspas = c;
      i++; // mantém a aspa de abertura: o texto continua parecendo código
      while (i < n && src[i] !== aspas && src[i] !== '\n') { if (strings) apagar(i); i++; }
      i++; // consome a aspa de fechamento
      continue;
    }
    i++;
  }
  return out.join('');
}

/**
 * Marca, para cada linha, se ela está dentro de uma transação e/ou de um loop — é o que
 * as regras CA1002 (interface em transação) e CA1003 (API custosa em loop) precisam saber.
 * Sem isso, `MsgYesNo` seria proibido no fonte inteiro, o que é falso: só é proibido DENTRO
 * da transação.
 */
function mapearContexto(linhasLimpas) {
  let emTransacao = false;
  let profundidadeLoop = 0;

  return linhasLimpas.map((linha) => {
    const abreTransacao = /\bBegin\s+Transaction\b|\bBeginTran\s*\(/i.test(linha);
    const fechaTransacao = /\bEnd\s+Transaction\b|\bEndTran\s*\(/i.test(linha);
    const abreLoop = /^\s*(While|For)\b/i.test(linha);
    const fechaLoop = /^\s*(EndDo|Next)\b/i.test(linha);

    if (fechaTransacao) emTransacao = false;
    if (fechaLoop) profundidadeLoop = Math.max(0, profundidadeLoop - 1);

    const ctx = { transacao: emTransacao, loop: profundidadeLoop > 0 };

    if (abreTransacao) emTransacao = true;
    if (abreLoop) profundidadeLoop++;
    return ctx;
  });
}

/**
 * Supressões declaradas no fonte: `// sonar:ignore CA1000 <motivo>`.
 *
 * O motivo é OBRIGATÓRIO — sem ele a supressão não vale. Uma supressão que não exige
 * justificativa é só um jeito educado de desligar o lint. Vale para a própria linha e para
 * a seguinte (o caso comum é o comentário acima da linha ofensora).
 *
 * Importante: isto silencia o HOOK, não o review. O /protheus:reviewer continua reportando,
 * e o SonarQube da TOTVS não aceita supressão na maioria destas regras.
 */
function mapearSupressoes(linhas) {
  const porLinha = new Map();
  const anota = (nLinha, codigo) => {
    if (!porLinha.has(nLinha)) porLinha.set(nLinha, new Set());
    porLinha.get(nLinha).add(codigo.toUpperCase());
  };

  linhas.forEach((linha, i) => {
    const m = linha.match(/(?:\/\/|&&)\s*sonar:ignore\s+([A-Za-z]{2}\d{4}(?:-\d)?)\s+(\S.{2,})/);
    if (!m) return;
    anota(i + 1, m[1]);  // a própria linha
    anota(i + 2, m[1]);  // e a de baixo
  });
  return porLinha;
}

/**
 * Analisa o fonte e devolve os achados, ordenados por linha.
 * @param {string} src conteúdo do .prw/.tlpp
 * @returns {Array<{codigo,tipo,titulo,correcao,linha,trecho,bloqueante}>}
 */
function analisar(src) {
  const linhas = src.split('\n');
  const linhasLimpas = limparRuido(src).split('\n');
  const linhasSemComentario = limparRuido(src, { strings: false }).split('\n');
  const contexto = mapearContexto(linhasLimpas);
  const supressoes = mapearSupressoes(linhas);

  const achados = [];
  const registrar = (regra, nLinha) => achados.push({
    codigo: regra.codigo,
    tipo: regra.tipo,
    titulo: regra.titulo,
    correcao: regra.correcao,
    linha: nLinha,
    trecho: (linhas[nLinha - 1] || '').trim(),
    bloqueante: regra.tipo !== 'CODE SMELL',
  });

  for (const regra of REGRAS) {
    if (regra.detectar) {
      for (const { linha } of regra.detectar({ linhas, linhasLimpas, linhasSemComentario })) {
        registrar(regra, linha);
      }
      continue;
    }
    linhas.forEach((_, i) => {
      if (regra.contexto && !contexto[i][regra.contexto]) return;
      const bateNoCodigo = regra.padrao && regra.padrao.test(linhasLimpas[i]);
      const bateNoLiteral = regra.padraoBruto && regra.padraoBruto.test(linhasSemComentario[i]);
      if (bateNoCodigo || bateNoLiteral) registrar(regra, i + 1);
    });
  }

  return achados
    .filter((a) => !(supressoes.get(a.linha) || new Set()).has(a.codigo))
    .sort((a, b) => a.linha - b.linha || a.codigo.localeCompare(b.codigo));
}

module.exports = { analisar, limparRuido, mapearContexto, mapearSupressoes };
