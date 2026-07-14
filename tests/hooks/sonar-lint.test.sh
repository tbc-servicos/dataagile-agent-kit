#!/usr/bin/env bash
# Testes do hook sonar-lint.cjs — o CONTRATO com o Claude Code (o motor tem testes próprios
# em tests/hooks/sonar-engine.test.cjs).
#   T1 — violação BUG bloqueia (exit 2) e o relatório vai para o STDERR (é o canal que o
#        Claude Code entrega ao modelo; em stdout ele seria bloqueado sem saber por quê)
#   T2 — só CODE SMELL: avisa em stdout e NÃO bloqueia (exit 0)
#   T3 — fonte limpo passa
#   T4 — arquivo que não é ADVPL é ignorado
#   T5 — modo CLI (argumento) funciona igual — é o que o CI e o dev usam
#   T6 — supressão justificada silencia; sem motivo, não silencia
# Uso: tests/hooks/sonar-lint.test.sh
set -u

HOOK="${1:-$(cd "$(dirname "$0")/../.." && pwd)/protheus/hooks/sonar-lint.cjs}"
FAIL=0
check() { local d="$1"; shift; if "$@"; then echo "  ✅ $d"; else echo "  ❌ $d"; FAIL=1; fi; }

SANDBOX="$(mktemp -d)"
trap 'rm -rf "$SANDBOX"' EXIT

# roda o hook do jeito que o Claude Code roda: JSON pelo stdin
run_hook() {
  printf '{"tool_input":{"file_path":"%s"}}' "$1" | node "$HOOK" 2>"$SANDBOX/err" >"$SANDBOX/out"
  echo $?
}

echo "T1 — BUG bloqueia com relatório no stderr"
cat > "$SANDBOX/bug.prw" <<'EOF'
#include "protheus.ch"
User Function ZBUG()
    Local aUsr := AllUsers()
Return aUsr
EOF
RC=$(run_hook "$SANDBOX/bug.prw")
check "exit 2 (bloqueia a gravação)" test "$RC" = "2"
check "o código da regra aparece" grep -q "CA2020" "$SANDBOX/err"
check "diz COMO corrigir" grep -qi "FWSFALLUSERS" "$SANDBOX/err"
check "stdout fica vazio (o relatório é do modelo, vai no stderr)" test ! -s "$SANDBOX/out"

echo "T2 — CODE SMELL avisa mas não bloqueia"
cat > "$SANDBOX/smell.prw" <<'EOF'
#include "protheus.ch"
User Function ZSMELL()
    Local nDesc := 0
    nDesc := iif(nDesc > 10, 1, 0)
Return nDesc
EOF
RC=$(run_hook "$SANDBOX/smell.prw")
check "exit 0 (não trava o dev no meio da escrita)" test "$RC" = "0"
check "o aviso sai no stdout" grep -q "CA4000" "$SANDBOX/out"

echo "T3 — fonte limpo passa"
cat > "$SANDBOX/ok.prw" <<'EOF'
#include "protheus.ch"
User Function ZOK()
    Local nTotal := 0
    If nTotal > 0
        nTotal := 1
    EndIf
Return nTotal
EOF
RC=$(run_hook "$SANDBOX/ok.prw")
check "exit 0" test "$RC" = "0"
check "diz que está sem violações" grep -q "sem violações" "$SANDBOX/out"

echo "T4 — arquivo não-ADVPL é ignorado"
echo 'AllUsers()' > "$SANDBOX/leiame.txt"
RC=$(run_hook "$SANDBOX/leiame.txt")
check "exit 0 e nada a dizer" test "$RC" = "0" -a ! -s "$SANDBOX/out"

echo "T5 — modo CLI (o que o dev e o CI usam)"
node "$HOOK" "$SANDBOX/bug.prw" >/dev/null 2>&1
check "exit 2 com o arquivo por argumento" test "$?" = "2"

echo "T6 — supressão exige motivo"
cat > "$SANDBOX/sup.prw" <<'EOF'
#include "protheus.ch"
User Function ZSUP()
    Local aUsr := AllUsers() // sonar:ignore CA2020 fonte legado do cliente, migracao em ZTBC-42
Return aUsr
EOF
RC=$(run_hook "$SANDBOX/sup.prw")
check "supressão JUSTIFICADA silencia (exit 0)" test "$RC" = "0"

cat > "$SANDBOX/sup2.prw" <<'EOF'
#include "protheus.ch"
User Function ZSUP2()
    Local aUsr := AllUsers() // sonar:ignore CA2020
Return aUsr
EOF
RC=$(run_hook "$SANDBOX/sup2.prw")
check "supressão SEM motivo não vale (continua exit 2)" test "$RC" = "2"

echo
[ "$FAIL" -eq 0 ] && echo "✅ sonar-lint OK" || { echo "❌ sonar-lint FALHOU"; exit 1; }
