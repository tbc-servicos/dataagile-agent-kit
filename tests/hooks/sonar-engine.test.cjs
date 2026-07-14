// Testes do motor de regras SonarQube EngPro (protheus/hooks/lib/sonar-engine.cjs).
//
// O motor é PURO: recebe o texto do fonte, devolve os achados. Sem I/O, sem processo,
// sem advpls — por isso dá para testar cada regra em isolamento, que é justamente o
// que o plugin exige do código do dev (regra de negócio testável sem banco).
//
// Os testes de FALSO POSITIVO são os mais importantes: um lint que acusa `iif` dentro
// de um comentário perde a confiança do time no primeiro dia e vira ruído ignorado.
//
// Uso: node --test tests/hooks/sonar-engine.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { analisar, limparRuido } = require(
  path.join(__dirname, '..', '..', 'protheus', 'hooks', 'lib', 'sonar-engine.cjs'));

/** Códigos encontrados em um fonte — açúcar para os asserts. */
const codigos = (src) => analisar(src).map((a) => a.codigo);
/** O achado de um código específico (ou undefined). */
const achado = (src, cod) => analisar(src).find((a) => a.codigo === cod);

// ─────────────────────────────────────────────────────────────────────────────
// Limpeza de ruído — a base de tudo. Sem isto, todo o resto tem falso positivo.
// ─────────────────────────────────────────────────────────────────────────────

test('limparRuido: apaga o conteúdo de strings mas preserva linhas e colunas', () => {
  const src = 'Local cTxt := "iif(x, 1, 2)"';
  const limpo = limparRuido(src);
  assert.equal(limpo.length, src.length, 'não pode encurtar (quebraria o nº da coluna)');
  assert.ok(!/iif/i.test(limpo), 'o miolo da string tem de sumir');
  assert.ok(limpo.includes('Local cTxt :='), 'o código fora da string continua intacto');
});

test('limparRuido: apaga comentários de linha (//) e de bloco (/* */)', () => {
  const src = [
    'Local nX := 1  // usar iif() aqui é proibido',
    '/* StaticCall(FOO, BAR)',
    '   AllUsers() */',
    'Local nY := 2',
  ].join('\n');
  const limpo = limparRuido(src);
  assert.ok(!/iif|StaticCall|AllUsers/i.test(limpo));
  assert.equal(limpo.split('\n').length, 4, 'o número de linhas tem de ser preservado');
});

test('FALSO POSITIVO: regra proibida citada em comentário ou string NÃO é achado', () => {
  const src = [
    '#include "protheus.ch"',
    'User Function ZTESTE()',
    '    // Não use StaticCall() nem AllUsers() — proibido pela EngPro',
    '    Local cMsg := "Chame Conout() para depurar"',
    '    Local nTot := 10',
    'Return nTot',
  ].join('\n');
  assert.deepEqual(analisar(src), [], 'comentário e string não podem virar violação');
});

// ─────────────────────────────────────────────────────────────────────────────
// Funções e APIs proibidas (lexical puro)
// ─────────────────────────────────────────────────────────────────────────────

test('CA2022: StaticCall é bloqueante', () => {
  const a = achado('Local x := StaticCall(MATA010, FooBar)', 'CA2022');
  assert.ok(a, 'StaticCall tem de ser detectado');
  assert.equal(a.tipo, 'BUG');
  assert.equal(a.bloqueante, true);
  assert.equal(a.linha, 1);
  assert.match(a.correcao, /User Function/i, 'a mensagem tem de dizer COMO corrigir');
});

test('CA2023: PTInternal é bloqueante e aponta FWMonitorMsg', () => {
  const a = achado('    PTInternal(1, "erro")', 'CA2023');
  assert.ok(a);
  assert.match(a.correcao, /FWMonitorMsg/i);
});

test('CA2020: AllUsers() descontinuada aponta FWSFALLUSERS', () => {
  const a = achado('aUsers := AllUsers()', 'CA2020');
  assert.ok(a);
  assert.match(a.correcao, /FWSFALLUSERS/i);
});

test('CA2019: funções binárias (Bin2Str, X3Reserv...) são bloqueantes', () => {
  assert.ok(codigos('cRes := Bin2Str(SX3->X3_RESERV)').includes('CA2019'));
  assert.ok(codigos('If X3Reserv(cCampo, "þ")').includes('CA2019'));
  assert.match(achado('cRes := Bin2Str(cX)', 'CA2019').correcao, /X3OBRIGAT/i);
});

test('CA1000: driver ISAM (DbCreate, CriaTrab(.T.), COPY TO) é bloqueante', () => {
  assert.ok(codigos('DbCreate(cArq, aStru, "DBFCDXADS")').includes('CA1000'));
  assert.ok(codigos('cArqTrb := CriaTrab(aStru, .T.)').includes('CA1000'));
  assert.match(achado('DbCreate(cArq, aStru)', 'CA1000').correcao, /FWTemporaryTable/i);
});

test('CA1000: CriaTrab(aStru, .F.) NÃO é ISAM — só cria o nome, não o arquivo', () => {
  assert.ok(!codigos('cNome := CriaTrab(NIL, .F.)').includes('CA1000'));
});

// ─────────────────────────────────────────────────────────────────────────────
// Dicionário de dados / tabelas de framework via workarea
// ─────────────────────────────────────────────────────────────────────────────

test('CA2004: manipular SX3 por workarea é bloqueante e aponta FWSX3Util', () => {
  const a = achado('SX3->(DbSeek(cCampo))', 'CA2004');
  assert.ok(a);
  assert.equal(a.tipo, 'BUG');
  assert.match(a.correcao, /FWSX3Util/i);
});

test('CA2004: DbSelectArea("SX3") também cai na regra', () => {
  assert.ok(codigos('DbSelectArea("SX3")').includes('CA2004'));
});

test('cada alias de metadado reporta o SEU código (SM0/SIX/SX6/SXG...)', () => {
  assert.ok(codigos('SM0->M0_CODIGO').includes('CA2000'));
  assert.ok(codigos('DbSelectArea("SIX")').includes('CA2001'));
  assert.ok(codigos('SX6->X6_CONTEUD').includes('CA2010'));
  assert.ok(codigos('SXG->(DbGoTop())').includes('CA2011'));
});

test('CA2013: tabelas de framework (SXE, SXF...) são bloqueantes', () => {
  assert.ok(codigos('SXE->(DbSeek(cChave))').includes('CA2013'));
  assert.ok(codigos('DbSelectArea("SXK")').includes('CA2013'));
});

test('CA2021: SE5 está em descontinuação', () => {
  const a = achado('SE5->(DbSeek(xFilial("SE5") + cNum))', 'CA2021');
  assert.ok(a);
  assert.match(a.correcao, /FK|ExecAuto/i);
});

test('FALSO POSITIVO: campo de tabela de negócio (SA1, SC5) não vira violação', () => {
  const src = 'SA1->(DbSeek(xFilial("SA1") + cCli))\nSC5->C5_NUM := cNum';
  assert.deepEqual(analisar(src), []);
});

// ─────────────────────────────────────────────────────────────────────────────
// CA2050 — SQL Injection (a única VULNERABILIDADE do catálogo)
// ─────────────────────────────────────────────────────────────────────────────

test('CA2050: concatenação direta dentro de TcGenQry é vulnerabilidade bloqueante', () => {
  const a = achado('dbUseArea(.T., "TOPCONN", TcGenQry(,, "SELECT * FROM SA1 WHERE A1_COD = " + cCod), cAlias)', 'CA2050');
  assert.ok(a);
  assert.equal(a.tipo, 'VULNERABILIDADE');
  assert.equal(a.bloqueante, true);
  assert.match(a.correcao, /FWPreparedStatement|TcGenQry2|BeginSQL/i);
});

test('CA2050: query montada em variável e concatenada com identificador (o caso clássico)', () => {
  const src = [
    'Local cQuery := "SELECT A1_COD FROM " + RetSqlName("SA1")',
    'cQuery += " WHERE A1_COD = \'" + cCodigo + "\'"',
    'TcQuery cQuery New Alias "TRB"',
  ].join('\n');
  const a = achado(src, 'CA2050');
  assert.ok(a, 'concatenar variável na query montada é injeção');
  assert.equal(a.linha, 2, 'aponta a linha da concatenação com o dado externo');
});

test('FALSO POSITIVO: BeginSQL com bind %Exp:% é o jeito CERTO — não acusar', () => {
  const src = [
    'BeginSQL Alias cAlias',
    '    SELECT A1_COD FROM %Table:SA1% SA1',
    '     WHERE SA1.A1_COD = %Exp:cCodigo%',
    '       AND SA1.%NotDel%',
    'EndSQL',
  ].join('\n');
  assert.deepEqual(analisar(src), [], 'o padrão seguro não pode gerar ruído');
});

test('FALSO POSITIVO: query com RetSqlName mas SEM dado externo concatenado não é injeção', () => {
  const src = 'Local cQuery := "SELECT * FROM " + RetSqlName("SA1")\nTcQuery cQuery New Alias "TRB"';
  assert.ok(!codigos(src).includes('CA2050'), 'RetSqlName não é entrada de usuário');
});

// ─────────────────────────────────────────────────────────────────────────────
// Regras contextuais — dependem de estar DENTRO de transação ou de loop
// ─────────────────────────────────────────────────────────────────────────────

test('CA1002: interface (MsgYesNo) dentro de transação é bloqueante', () => {
  const src = [
    'Begin Transaction',
    '    If MsgYesNo("Confirma?")',
    '        RecLock("SA1", .F.)',
    '    EndIf',
    'End Transaction',
  ].join('\n');
  const a = achado(src, 'CA1002');
  assert.ok(a, 'trava a transação esperando o usuário');
  assert.equal(a.linha, 2);
});

test('CA1002: a MESMA chamada FORA da transação não é violação', () => {
  const src = 'If MsgYesNo("Confirma?")\n    Conout("ok")\nEndIf';
  assert.ok(!codigos(src).includes('CA1002'));
});

test('CA1003: GetMV dentro de While é bloqueante (leitura repetida de parâmetro)', () => {
  const src = [
    'While !(cAlias)->(Eof())',
    '    nLim := GetMV("MV_LIMITE")',
    '    (cAlias)->(DbSkip())',
    'EndDo',
  ].join('\n');
  const a = achado(src, 'CA1003');
  assert.ok(a);
  assert.match(a.correcao, /fora do loop|variável/i);
});

test('CA1003: GetMV fora do loop é o padrão CERTO — não acusar', () => {
  const src = 'nLim := GetMV("MV_LIMITE")\nWhile !Eof()\n    DbSkip()\nEndDo';
  assert.ok(!codigos(src).includes('CA1003'));
});

test('CA1003: ExistBlock dentro de For também cai na regra', () => {
  const src = 'For nI := 1 To Len(aItens)\n    If ExistBlock("ZA010GRV")\n    EndIf\nNext nI';
  assert.ok(codigos(src).includes('CA1003'));
});

// ─────────────────────────────────────────────────────────────────────────────
// CODE SMELL — avisam, não bloqueiam
// ─────────────────────────────────────────────────────────────────────────────

test('CA4000: iif() é CODE SMELL — avisa mas não bloqueia a gravação', () => {
  const a = achado('nDesc := iif(nVal > 100, 10, 0)', 'CA4000');
  assert.ok(a);
  assert.equal(a.tipo, 'CODE SMELL');
  assert.equal(a.bloqueante, false, 'CODE SMELL não pode travar o dev no meio da escrita');
  assert.match(a.correcao, /if\/else|If.*Else/i);
});

test('CA4000: If() usado como expressão (não como comando) também é iif disfarçado', () => {
  assert.ok(codigos('cTipo := If(lFat, "F", "N")').includes('CA4000'));
});

test('FALSO POSITIVO: o comando If normal nunca pode ser confundido com iif', () => {
  const src = 'If nVal > 100\n    nDesc := 10\nElse\n    nDesc := 0\nEndIf';
  assert.deepEqual(analisar(src), [], 'if/else é exatamente o que a regra MANDA usar');
});

test('CA3001: include em maiúscula é CODE SMELL', () => {
  assert.ok(codigos('#include "PROTHEUS.CH"').includes('CA3001'));
  assert.ok(!codigos('#include "protheus.ch"').includes('CA3001'), 'lowercase é o correto');
});

test('CA1004: Conout/OutStd são CODE SMELL e apontam FWLogMsg', () => {
  const a = achado('Conout("processando...")', 'CA1004');
  assert.ok(a);
  assert.equal(a.bloqueante, false);
  assert.match(a.correcao, /FWLogMsg/i);
});

test('CA3002: LongClassName deve virar LongNameClass', () => {
  const a = achado('#include "totvs.ch"\nClass ZFoo From LongClassName', 'CA3002');
  assert.ok(a);
  assert.match(a.correcao, /LongNameClass/);
});

test('CA2052: senha em literal é CODE SMELL', () => {
  assert.ok(codigos('Local cSenha := "P@ssw0rd123"').includes('CA2052'));
  assert.ok(!codigos('Local cSenha := ""').includes('CA2052'), 'string vazia não é senha exposta');
  assert.ok(!codigos('Local cSenha := cParam').includes('CA2052'), 'vindo de variável, não está exposta');
});

// ─────────────────────────────────────────────────────────────────────────────
// Supressão — escape hatch com motivo obrigatório
// ─────────────────────────────────────────────────────────────────────────────

test('supressão: // sonar:ignore CA1000 <motivo> na mesma linha suprime aquele código', () => {
  const src = 'DbCreate(cArq, aStru) // sonar:ignore CA1000 fonte legado do cliente, migração em ZTBC-42';
  assert.deepEqual(analisar(src), []);
});

test('supressão: na linha ANTERIOR também vale', () => {
  const src = '// sonar:ignore CA2022 chamada exigida pelo padrão da rotina MATA010\nStaticCall(MATA010, Foo)';
  assert.deepEqual(analisar(src), []);
});

test('supressão SEM motivo não vale — senão vira um "desligar o lint" silencioso', () => {
  const src = 'StaticCall(MATA010, Foo) // sonar:ignore CA2022';
  assert.ok(codigos(src).includes('CA2022'), 'suprimir sem justificar não pode funcionar');
});

test('supressão é por código — não desliga as outras regras da linha', () => {
  const src = 'StaticCall(A, B) // sonar:ignore CA2022 motivo real aqui\nConout("x")';
  const cods = codigos(src);
  assert.ok(!cods.includes('CA2022'));
  assert.ok(cods.includes('CA1004'), 'a outra violação continua reportada');
});

// ─────────────────────────────────────────────────────────────────────────────
// Contrato do achado — o que o hook e o reviewer consomem
// ─────────────────────────────────────────────────────────────────────────────

test('todo achado traz código, tipo, linha, título, correção e o trecho ofensor', () => {
  const a = achado('    x := StaticCall(A, B)', 'CA2022');
  assert.deepEqual(Object.keys(a).sort(),
    ['bloqueante', 'codigo', 'correcao', 'linha', 'tipo', 'titulo', 'trecho'].sort());
  assert.equal(a.trecho, 'x := StaticCall(A, B)', 'trecho sem a indentação, pronto para exibir');
});

test('achados saem ordenados por linha', () => {
  const src = 'Conout("a")\nStaticCall(A, B)\niif(x, 1, 2)';
  const linhas = analisar(src).map((a) => a.linha);
  assert.deepEqual(linhas, [...linhas].sort((x, y) => x - y));
});

// ─────────────────────────────────────────────────────────────────────────────
// Coerência com o catálogo oficial — o motor não pode inventar regra
// ─────────────────────────────────────────────────────────────────────────────

test('todo código implementado existe no catálogo oficial sincronizado da EngPro', () => {
  const fs = require('node:fs');
  const { REGRAS } = require(
    path.join(__dirname, '..', '..', 'protheus', 'hooks', 'lib', 'sonar-rules.cjs'));
  const oficial = fs.readFileSync(path.join(__dirname, '..', '..', 'protheus', 'skills', 'reviewer',
    'references', 'sonarqube-rules-engpro.md'), 'utf8');

  const inventadas = [...new Set(REGRAS.map((r) => r.codigo))]
    .filter((cod) => !new RegExp(`^### ${cod}$`, 'm').test(oficial));

  assert.deepEqual(inventadas, [],
    'código de regra que não existe no site oficial (typo? regra removida pela TOTVS?)');
});

test('regra bloqueante é exatamente BUG ou VULNERABILIDADE — nunca CODE SMELL', () => {
  const { REGRAS } = require(
    path.join(__dirname, '..', '..', 'protheus', 'hooks', 'lib', 'sonar-rules.cjs'));
  for (const r of REGRAS) {
    assert.ok(['BUG', 'CODE SMELL', 'VULNERABILIDADE'].includes(r.tipo), `tipo inválido em ${r.codigo}`);
    assert.ok(r.correcao && r.correcao.length > 20, `${r.codigo} precisa dizer COMO corrigir`);
    assert.ok(r.padrao || r.padraoBruto || r.detectar, `${r.codigo} não detecta nada`);
  }
});

test('fonte limpo e idiomático não produz nenhum achado', () => {
  const src = [
    '#include "protheus.ch"',
    '#include "tlpp-core.th"',
    '',
    'User Function ZTBCA01()',
    '    Local cAlias := GetNextAlias()',
    '    Local nLimite := GetMV("MV_LIMITE")',
    '    Local nTotal := 0',
    '',
    '    BeginSQL Alias cAlias',
    '        SELECT A1_COD FROM %Table:SA1% SA1',
    '         WHERE SA1.A1_COD = %Exp:cCodigo%',
    '           AND SA1.%NotDel%',
    '    EndSQL',
    '',
    '    While !(cAlias)->(Eof())',
    '        If (cAlias)->A1_SALDO > nLimite',
    '            nTotal += (cAlias)->A1_SALDO',
    '        EndIf',
    '        (cAlias)->(DbSkip())',
    '    EndDo',
    '    (cAlias)->(DbCloseArea())',
    '',
    '    FWLogMsg("INFO", , , , , , , , , "Total: " + cValToChar(nTotal))',
    'Return nTotal',
  ].join('\n');
  assert.deepEqual(analisar(src), [], 'o código que o plugin ensina a escrever tem de passar limpo');
});
