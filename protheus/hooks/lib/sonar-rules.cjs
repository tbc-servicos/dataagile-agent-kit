'use strict';
/**
 * sonar-rules.cjs — CATÁLOGO das regras EngPro que dão para decidir lendo o texto do fonte.
 *
 * É só DADO. Nenhum I/O, nenhuma varredura: quem varre é o sonar-engine.cjs. Acrescentar
 * uma regra aqui não exige tocar no motor (aberto para extensão, fechado para modificação).
 *
 * Fonte: protheus/skills/reviewer/references/sonarqube-rules-engpro.md (gerado do site oficial
 * https://sonar-rules.engpro.totvs.com.br). Aqui ficam APENAS as regras decidíveis por léxico.
 * As que dependem de semântica (CA0000 erro de compilação, CA2017/CA2018 "API não permitida"
 * sem lista pública) continuam só no /protheus:reviewer — o hook não adivinha.
 *
 * Campos de uma regra:
 *   codigo, tipo ('BUG' | 'CODE SMELL' | 'VULNERABILIDADE'), titulo, correcao
 *   padrao      — RegExp na linha SEM comentários e SEM miolo de string (o código de verdade)
 *   padraoBruto — RegExp na linha COM as strings (só sem comentários), para o que VIVE dentro
 *                 do literal: DbSelectArea("SX3"), #include "PROTHEUS.CH", senha := "..."
 *   contexto    — 'transacao' | 'loop': só vale se a linha estiver dentro desse bloco
 *   detectar    — para o que RegExp por linha não resolve (ex.: query montada em N linhas)
 *
 * A separação padrao × padraoBruto não é preciosismo: casar `\bSX3\s*->` no texto bruto
 * acusaria a menção ao alias dentro de uma mensagem de log; e casar DbSelectArea("SX3") no
 * texto limpo é impossível, porque o alias está justamente dentro da string apagada.
 *
 * `bloqueante` NÃO é campo: deriva do tipo (BUG/VULNERABILIDADE bloqueiam, CODE SMELL avisa),
 * para não existir a possibilidade de catalogar um BUG "não bloqueante" por descuido.
 */

/** Alias de metadado → código da regra que proíbe manipulá-lo por workarea. */
const METADADOS = {
  SM0: 'CA2000', SIX: 'CA2001', SX1: 'CA2002', SX2: 'CA2003', SX3: 'CA2004',
  SX7: 'CA2005', SX9: 'CA2006', SXA: 'CA2007', SXB: 'CA2008', SX5: 'CA2009',
  SX6: 'CA2010', SXG: 'CA2011', SXD: 'CA2012',
};

/** Tabelas de framework (CA2013) — SX9 sai daqui porque tem código próprio (CA2006). */
const TABELAS_FRAMEWORK = ['SX8', 'SXE', 'SXF', 'SXH', 'SXI', 'SXJ', 'SXK', 'SXL',
  'SXM', 'SXN', 'SXO', 'SXP', 'SXQ'];

/** `SX3->…` — no código de verdade (linha limpa). */
const workarea = (alias) => new RegExp(`\\b${alias}\\s*->`, 'i');
/** `DbSelectArea("SX3")` — o alias mora dentro do literal (linha bruta). */
const selectArea = (aliases) =>
  new RegExp(`DbSelectArea\\s*\\(\\s*["'](${[].concat(aliases).join('|')})["']`, 'i');

/**
 * Funções cujo retorno é seguro concatenar numa query: não carregam entrada do usuário.
 * Sem esta lista, `"SELECT … FROM " + RetSqlName("SA1")` — que é o jeito CERTO — viraria
 * um falso positivo de SQL injection e o time desligaria o hook.
 */
const CONCAT_SEGURA = /^(RetSqlName|xFilial|GetNextAlias|CriaTrab)$/i;

/** Palavras que denunciam uma string sendo montada como SQL. */
const PARECE_SQL = /"[^"]*\b(SELECT|INSERT\s+INTO|UPDATE|DELETE|FROM|WHERE|JOIN)\b/i;

/** APIs que executam a query — concatenar dado do usuário aqui é injeção. */
const API_QUERY = /\b(TcGenQry|TCSQLExec|TCQuery|ChangeQuery|MPSysExecScript)\b/i;

/**
 * CA2050 — SQL Injection. É a única regra que não cabe numa RegExp de linha: a query
 * costuma ser montada em várias linhas (`cQuery := "SELECT…"` e depois `cQuery += …`).
 * Estratégia: marcar as variáveis que recebem texto de SQL e acusar quando uma delas
 * (ou uma API de query) for concatenada com um identificador que não é comprovadamente
 * seguro. É deliberadamente conservador: prefere calar a acusar errado.
 */
function detectarSqlInjection({ linhasLimpas, linhasSemComentario }) {
  const varsDeQuery = new Set();
  const achados = [];

  linhasSemComentario.forEach((bruta, i) => {
    const limpa = linhasLimpas[i];

    // 1. a linha está montando/executando uma query?
    const declara = bruta.match(/\b(\w+)\s*(?::=|\+=)/);
    if (declara && PARECE_SQL.test(bruta)) varsDeQuery.add(declara[1].toLowerCase());

    const mexeEmQueryVar = declara && varsDeQuery.has(declara[1].toLowerCase());
    if (!mexeEmQueryVar && !API_QUERY.test(limpa)) return;

    // 2. concatena algum identificador que possa carregar dado externo?
    //    (na linha limpa o miolo das strings virou espaço — o que sobra depois de um
    //     `+` é justamente o que está sendo interpolado no SQL)
    const perigosos = [...limpa.matchAll(/\+\s*([A-Za-z_]\w*)/g)]
      .map((m) => m[1])
      .filter((id) => !CONCAT_SEGURA.test(id));

    if (perigosos.length) achados.push({ linha: i + 1 });
  });

  return achados;
}

const REGRAS = [
  // ── Funções e APIs proibidas ───────────────────────────────────────────────
  {
    codigo: 'CA2022', tipo: 'BUG', titulo: 'Uso de função restrita StaticCall',
    padrao: /\bStaticCall\s*\(/i,
    correcao: 'Remova o StaticCall — a partir do release 33 ele é erro de compilação em fonte '
      + 'customizado. Mude o escopo da função chamada para User Function. Para exportar CSV, use ExpExcel.',
  },
  {
    codigo: 'CA2023', tipo: 'BUG', titulo: 'Uso de função restrita PTInternal',
    padrao: /\bPTInternal\s*\(/i,
    correcao: 'Remova o PTInternal (uso interno da TOTVS). Se era PTInternal(1, …), troque por FWMonitorMsg.',
  },
  {
    codigo: 'CA2020', tipo: 'BUG', titulo: 'Uso de função descontinuada (AllUsers)',
    padrao: /\bAllUsers\s*\(/i,
    correcao: 'AllUsers() foi descontinuada — use FWSFALLUSERS().',
  },
  {
    codigo: 'CA2019', tipo: 'BUG', titulo: 'Leitura/gravação binária não permitida',
    padrao: /\b(FWConvRese|FWConvBin|Bin2Str|Str2Bin|X3Reserv)\s*\(/i,
    correcao: 'Retire a função binária do fonte. Se o uso era descobrir se o campo é obrigatório, '
      + 'troque por X3OBRIGAT(); alguns bancos nem suportam os caracteres binários.',
  },
  {
    codigo: 'CA1000', tipo: 'BUG', titulo: 'Chamada de driver ISAM',
    padrao: /\b(MsCreate|MsFile|MsCopyFile|MsErase|DbCreate|DbUseArea)\s*\(|\bCriaTrab\s*\([^)]*,\s*\.T\.\s*\)|^\s*COPY\s+TO\b/i,
    correcao: 'Driver ISAM foi descontinuado na v12. Use FWTemporaryTable (tabela temporária relacional) '
      + 'e, para exportar dados, ExpExcel. Para consulta, prefira BeginSQL/EndSQL com binds.',
  },
  {
    codigo: 'CA1001', tipo: 'CODE SMELL', titulo: 'Bloqueio exclusivo em arquivo no RootPath',
    padrao: /\bFO_EXCLUSIVE\b|\bFCreate\s*\(/i,
    correcao: 'Semáforo em disco não é permitido. Se o bloqueio exclusivo for mesmo inevitável, use LockByName.',
  },

  // ── Contextuais ───────────────────────────────────────────────────────────
  {
    codigo: 'CA1002', tipo: 'BUG', titulo: 'Chamada de interface dentro de transação',
    contexto: 'transacao',
    padrao: /\b(MsgAlert|MsgYesNo|MsgNoYes|Alert|Aviso|Help|Pergunte|ParamBox)\s*\(/i,
    correcao: 'A transação fica aberta esperando o usuário responder — e trava a base. '
      + 'Pergunte ANTES do Begin Transaction e leve a resposta para dentro por variável.',
  },
  {
    codigo: 'CA1003', tipo: 'BUG', titulo: 'Chamada de API custosa dentro de loop',
    contexto: 'loop',
    padrao: /\b(GetMV|ExistBlock)\s*\(/i,
    correcao: 'Tire a chamada de dentro do loop: leia uma vez antes e guarde numa variável local.',
  },

  // ── Dicionário de dados e tabelas de framework ────────────────────────────
  ...Object.entries(METADADOS).map(([alias, codigo]) => ({
    codigo, tipo: 'BUG', titulo: `Manipulação do metadado ${alias} por workarea`,
    padrao: workarea(alias), padraoBruto: selectArea(alias),
    correcao: `Não acesse o ${alias} direto: em versões futuras o alias é aberto e fechado sob demanda. `
      + 'Use as APIs padrão do framework (para campos, FWSX3Util). Alteração de dicionário só pelo Configurador.',
  })),
  {
    codigo: 'CA2013', tipo: 'BUG', titulo: 'Acesso direto a tabela de framework',
    padrao: new RegExp(TABELAS_FRAMEWORK.map((t) => `\\b${t}\\s*->`).join('|'), 'i'),
    padraoBruto: selectArea(TABELAS_FRAMEWORK),
    correcao: 'Tabelas de framework não podem ser manipuladas por workarea — use as APIs do framework.',
  },
  {
    codigo: 'CA2021', tipo: 'BUG', titulo: 'Uso da tabela SE5 (em descontinuação)',
    padrao: /\bSE5\s*->/i,
    padraoBruto: /DbSelectArea\s*\(\s*["']SE5["']|RetSqlName\s*\(\s*["']SE5["']/i,
    correcao: 'A SE5 está sendo substituída pela família FKx. Para gravar, use ExecAuto das rotinas de baixa; '
      + 'para ler, use as tabelas FKx.',
  },

  // ── Segurança ─────────────────────────────────────────────────────────────
  {
    codigo: 'CA2050', tipo: 'VULNERABILIDADE', titulo: 'SQL Injection',
    detectar: detectarSqlInjection,
    correcao: 'Nunca concatene dado do usuário na query. Use BeginSQL/EndSQL com bind %Exp:var% '
      + 'ou FWPreparedStatement / TcGenQry2. Esta regra não admite supressão na TOTVS.',
  },
  {
    codigo: 'CA2052', tipo: 'CODE SMELL', titulo: 'Senha exposta no fonte',
    padraoBruto: /\b\w*(senha|password|passwd|pwd)\w*\s*:=\s*"[^"]+"/i,
    correcao: 'Tire a senha do fonte — leve para parâmetro (SX6), variável de ambiente ou pipeline de deploy.',
  },

  // ── Código limpo ──────────────────────────────────────────────────────────
  {
    codigo: 'CA4000', tipo: 'CODE SMELL', titulo: 'Uso de iif()/If() como expressão',
    // `iif(` sempre; `If(` só quando é EXPRESSÃO (vem depois de := , ( ou operador) —
    // assim o comando `If cond` … `EndIf`, que é o que a regra manda usar, nunca é acusado.
    padrao: /\biif\s*\(|(?::=|==|=|,|\(|\+|-|\*|\/|>|<|\bReturn\b|\bAnd\b|\bOr\b)\s*\bIf\s*\(/i,
    correcao: 'iif()/If() como expressão esconde caminho de código do debug e da cobertura de teste. '
      + 'Escreva If / Else / EndIf.',
  },
  {
    codigo: 'CA3001', tipo: 'CODE SMELL', titulo: 'Include com letra maiúscula',
    padraoBruto: /#\s*include\s+["'][^"']*[A-Z][^"']*["']/,
    correcao: 'O nome do include deve estar todo em minúsculo (ex.: "protheus.ch").',
  },
  {
    codigo: 'CA3002', tipo: 'BUG', titulo: 'Herança declarada com LongClassName',
    padrao: /\bLongClassName\b/,
    correcao: 'Troque LongClassName por LongNameClass.',
  },
  {
    codigo: 'CA1004', tipo: 'CODE SMELL', titulo: 'API de console em vez de API de log',
    padrao: /\b(Conout|OutErr|OutStd)\s*\(/i,
    correcao: 'Use FWLogMsg (API de log padrão) e I18N nas mensagens.',
  },
  {
    codigo: 'CA2015', tipo: 'CODE SMELL', titulo: 'Sobrescrita de FormCommit',
    padrao: /\bFormCommit\b/i,
    correcao: 'Não sobrescreva o FormCommit — intercepte o ciclo de vida com FWModelEvent.',
  },
];

module.exports = { REGRAS, METADADOS, TABELAS_FRAMEWORK };
