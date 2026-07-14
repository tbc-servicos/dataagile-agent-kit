#!/usr/bin/env bash
# Runner agregado dos testes do repo. Uso: tests/run-all.sh
# Convenções: *.test.sh (bash), *.test.cjs/*.test.js (node --test).
set -u
REPO="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0
run() { echo; echo "━━ $1"; shift; "$@" || FAIL=1; }

run "hooks: advpl-lint"                    "$REPO/tests/hooks/advpl-lint.test.sh"
run "hooks: fluig-lint"                    "$REPO/tests/hooks/fluig-lint.test.sh"
run "hooks: sonar-engine (regras EngPro)"  node --test "$REPO/tests/hooks/sonar-engine.test.cjs"
run "hooks: sonar-lint (contrato do hook)" "$REPO/tests/hooks/sonar-lint.test.sh"
run "scripts: sync regras SonarQube"       "$REPO/tests/scripts/sync-sonar-rules.test.sh"
run "mcp: bundle smoke (regressão 2.14.1)" node --test "$REPO/tests/mcp/bundle-smoke.test.js"

echo
[ "$FAIL" -eq 0 ] && echo "✅ SUÍTE COMPLETA VERDE" || { echo "❌ SUÍTE COM FALHAS"; exit 1; }
