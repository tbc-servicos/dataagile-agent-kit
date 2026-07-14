#!/usr/bin/env bash
# Testes do hook advpl-lint.sh — foco na correção da injeção shell→JS.
#   T1 — saída maliciosa do advpls (backtick + ${...}) NÃO executa código
#   T2 — parse correto: erro tipo 0 bloqueia (exit 2)
#   T3 — fonte limpo passa (exit 0)
#   T4 — path com apóstrofo não quebra o parser
# Uso: tests/hooks/advpl-lint.test.sh [caminho-do-hook]
set -u

HOOK="${1:-$(cd "$(dirname "$0")/../.." && pwd)/protheus/hooks/advpl-lint.sh}"
FAIL=0
# O PATH abaixo é propositalmente estreito (isola o advpls FALSO), mas o hook usa `node` no
# parser. Na máquina do dev o node vive em /usr/bin e passava; no runner do CI ele fica no
# toolcache e sumiria do PATH — o parser não rodaria e a suíte reprovaria.
NODE_DIR="$(dirname "$(command -v node)")"
check() { local d="$1"; shift; if "$@"; then echo "  ✅ $d"; else echo "  ❌ $d"; FAIL=1; fi; }

SANDBOX="$(mktemp -d)"
trap 'rm -rf "$SANDBOX"' EXIT

# advpls falso: devolve o conteúdo de $FAKE_ADVPLS_OUT
FAKEBIN="$SANDBOX/bin"; mkdir -p "$FAKEBIN"
cat > "$FAKEBIN/advpls" <<'FAKE'
#!/usr/bin/env bash
cat "$FAKE_ADVPLS_OUT"
FAKE
chmod +x "$FAKEBIN/advpls"

run_hook() { # run_hook <arquivo> ; INPUT via stdin do hook
  printf '{"tool_input":{"file_path":"%s"}}' "$1" | \
    PATH="$FAKEBIN:$NODE_DIR:/usr/bin:/bin" FAKE_ADVPLS_OUT="$SANDBOX/advpls.out" bash "$HOOK"
}

SRC="$SANDBOX/ZTESTE.prw"; echo "User Function ZTESTE()" > "$SRC"

echo "T1 — payload malicioso não executa código"
PWNED="$SANDBOX/pwned.txt"
# Se o RAW fosse interpolado em template literal, este payload executaria
# require('fs').writeFileSync ao fechar o backtick e abrir ${...}
printf '%s' "\`+require('fs').writeFileSync('$PWNED','pwned')+\`\${require('fs').writeFileSync('$PWNED','pwned')}" > "$SANDBOX/advpls.out"
OUT=$(run_hook "$SRC"); RC=$?
check "nenhum arquivo criado pelo payload (injeção neutralizada)" test ! -f "$PWNED"
check "hook não crashou (fail-open, exit 0)" test "$RC" -eq 0
check "payload tratado como saída inesperada" grep -q "saída inesperada" <<<"$OUT"

echo "T2 — erro de compilação bloqueia (exit 2)"
printf '%s' '{"msgs":{"grp":{"ZTESTE.prw(3) syntax error: unexpected token":"0"}}}' > "$SANDBOX/advpls.out"
OUT=$(run_hook "$SRC" 2>&1); RC=$?
check "exit 2 (bloqueante)" test "$RC" -eq 2
check "erro reportado com linha" grep -q "Erros de compilação" <<<"$OUT"
ERR=$(run_hook "$SRC" 2>&1 >/dev/null)
check "relatório vai para STDERR (exit 2 alimenta o Claude por lá)" grep -q "Erros de compilação" <<<"$ERR"
check "linha numérica extraída (não 'undefined')" grep -q "linha 3:" <<<"$OUT"

echo "T3 — fonte limpo passa"
printf '%s' '' > "$SANDBOX/advpls.out"
OUT=$(run_hook "$SRC"); RC=$?
check "exit 0" test "$RC" -eq 0
check "mensagem ok" grep -q "ok" <<<"$OUT"

echo "T4 — path com apóstrofo não quebra"
SRCQ="$SANDBOX/o'brien.prw"; echo "User Function TESTE()" > "$SRCQ"
printf '%s' '{"msgs":{"grp":{"teste(1) variable X not used":"1"}}}' > "$SANDBOX/advpls.out"
printf '{"tool_input":{"file_path":"%s"}}' "$SRCQ" | \
  PATH="$FAKEBIN:$NODE_DIR:/usr/bin:/bin" FAKE_ADVPLS_OUT="$SANDBOX/advpls.out" bash "$HOOK" > "$SANDBOX/out4" 2>&1
RC=$?
check "exit 2 (warning crítico bloqueia mesmo com quote no path)" test "$RC" -eq 2
check "parser processou o arquivo com quote" grep -q "Problemas que devem ser corrigidos" "$SANDBOX/out4"

[ "$FAIL" -eq 0 ] && echo "TODOS OS TESTES PASSARAM" || { echo "FALHAS DETECTADAS"; exit 1; }
