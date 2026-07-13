#!/usr/bin/env bash
# Testes do fluig-lint.sh:
#   T1 — config dentro de node_modules NÃO é capturada (find com -prune)
#   T2 — regra de domínio: alert() em .js bloqueia ({"decision":"block"})
#   T3 — ds_*/wf_* sem try/catch bloqueia; com try/catch passa
#   T4 — hook não baixa pacote da rede (npx --no-install em tudo)
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
HOOK="$REPO/fluig/hooks/fluig-lint.sh"
FAIL=0
check() { local d="$1"; shift; if "$@"; then echo "  ✅ $d"; else echo "  ❌ $d"; FAIL=1; fi; }

SANDBOX="$(mktemp -d)"; trap 'rm -rf "$SANDBOX"' EXIT
PROJ="$SANDBOX/widget"; mkdir -p "$PROJ/node_modules/dep-qualquer"
# projeto Fluig detectável (o hook só age com @po-ui/ng-components)
cat > "$PROJ/package.json" <<'J'
{ "name": "wg_teste", "dependencies": { "@po-ui/ng-components": "*" } }
J
# config de eslint DENTRO de node_modules (não pode ser capturada)
echo '{}' > "$PROJ/node_modules/dep-qualquer/.eslintrc.json"

run_hook() { # run_hook <arquivo>
  printf '{"tool_input":{"file_path":"%s"},"cwd":"%s"}' "$1" "$PROJ" | \
    CLAUDE_PROJECT_DIR="$PROJ" bash "$HOOK"
}

echo "T1 — config de node_modules ignorada"
JS="$PROJ/qualquer.js"; echo "var x = 1;" > "$JS"
OUT=$(cd "$PROJ" && run_hook "$JS")
check "sem bloqueio por config de dependência" bash -c "! grep -q 'ESLint' <<<'$OUT'"

echo "T2 — alert() bloqueia"
echo 'alert("oi");' > "$PROJ/tela.js"
OUT=$(cd "$PROJ" && run_hook "$PROJ/tela.js")
check "decision block" grep -q '"decision"' <<<"$OUT"
check "motivo cita alert" grep -q "alert()" <<<"$OUT"

echo "T3 — dataset sem try/catch bloqueia; com try/catch passa"
printf 'function createDataset(f,c,s){ return DatasetBuilder.newDataset(); }\n' > "$PROJ/ds_consulta_x.js"
OUT=$(cd "$PROJ" && run_hook "$PROJ/ds_consulta_x.js")
check "ds_ sem try/catch → block" grep -q "try/catch" <<<"$OUT"
printf 'function createDataset(f,c,s){\n  try {\n    return DatasetBuilder.newDataset();\n  } catch(e) { log.error(e); }\n}\n' > "$PROJ/ds_consulta_ok.js"
OUT=$(cd "$PROJ" && run_hook "$PROJ/ds_consulta_ok.js")
check "ds_ com try/catch → passa" bash -c "! grep -q '\"decision\"' <<<'$OUT'"

echo "T4 — nenhum npx com --yes (sem download de rede em hook)"
check "todas as invocações npx usam --no-install" bash -c "! grep -q 'npx --yes' '$HOOK'"

[ "$FAIL" -eq 0 ] && echo "TODOS OS TESTES PASSARAM" || { echo "FALHAS DETECTADAS"; exit 1; }
