#!/usr/bin/env bash
# fluig-lint.sh — Lint JS/TS/HTML em projetos Angular/PO-UI Fluig
# Ativado por PostToolUse (Write|Edit)
# Padrão: espelha quality-check.sh global, adaptado para projetos com @po-ui

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Ignorar se sem caminho (ex: NotebookEdit)
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Ignorar se arquivo não existe
if [[ ! -f "$FILE_PATH" ]]; then
  exit 0
fi

EXT="${FILE_PATH##*.}"

# Só age em JS, TS e HTML
case "$EXT" in
  js|ts|html) ;;
  *) exit 0 ;;
esac

# Ignorar arquivos gerados/minificados
if [[ "$FILE_PATH" == *.min.js ]] || \
   [[ "$FILE_PATH" == *.d.ts ]] || \
   [[ "$FILE_PATH" == */dist/* ]] || \
   [[ "$FILE_PATH" == */.angular/* ]]; then
  exit 0
fi

# Detectar se é projeto Fluig: procura @po-ui/ng-components no package.json
# Sobe até 4 níveis a partir do diretório do arquivo
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')
[[ -z "$CWD" ]] && CWD="$(dirname "$FILE_PATH")"

is_fluig_project() {
  local dir="$1"
  for i in 1 2 3 4; do
    local pkg="$dir/package.json"
    if [[ -f "$pkg" ]] && jq -e '(.dependencies["@po-ui/ng-components"] // .devDependencies["@po-ui/ng-components"]) != null' "$pkg" &>/dev/null 2>&1; then
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

if ! is_fluig_project "$CWD"; then
  exit 0
fi

ERRORS=""

# 1. Prettier — auto-fix silencioso (não bloqueia)
if command -v npx &>/dev/null; then
  npx --yes prettier --write "$FILE_PATH" &>/dev/null || true
fi

# 2. ESLint — bloqueia se erros (só se config existir no projeto)
if command -v npx &>/dev/null; then
  ESLINT_CONFIG=$(find "$CWD" -maxdepth 4 \( \
    -name "eslint.config.js" -o -name "eslint.config.mjs" -o \
    -name ".eslintrc.js" -o -name ".eslintrc.cjs" -o \
    -name ".eslintrc.json" -o -name ".eslintrc.yml" -o \
    -name ".eslintrc" \
  \) 2>/dev/null | head -1)
  if [[ -n "$ESLINT_CONFIG" ]]; then
    ESLINT_EXIT=0
    ESLINT_OUT=$(npx --yes eslint "$FILE_PATH" 2>&1) || ESLINT_EXIT=$?
    if [[ $ESLINT_EXIT -ne 0 ]]; then
      ERRORS+="ESLint:\n${ESLINT_OUT}\n"
    fi
  fi
fi

# 3. tsc --noEmit — bloqueia se error TS (só para .ts, não .spec.ts)
if [[ "$EXT" == "ts" ]] && [[ "$FILE_PATH" != *.spec.ts ]]; then
  TSCONFIG=$(find "$CWD" -maxdepth 4 -name "tsconfig.json" 2>/dev/null | head -1)
  if [[ -n "$TSCONFIG" ]] && command -v npx &>/dev/null; then
    TSC_OUT=$(cd "$CWD" && npx --yes tsc --noEmit 2>&1) || true
    if echo "$TSC_OUT" | grep -qE "error TS"; then
      ERRORS+="TypeScript:\n${TSC_OUT}\n"
    fi
  fi
fi

# 4. Regras Fluig-específicas para JS (não aplica a spec/test)
if [[ "$EXT" == "js" ]] && \
   [[ "$FILE_PATH" != *.spec.js ]] && \
   [[ "$FILE_PATH" != *.test.js ]]; then

  if grep -q 'alert(' "$FILE_PATH" 2>/dev/null; then
    ERRORS+="Fluig: uso de alert() proibido — use Swal.fire() (SweetAlert2)\n"
  fi

  # Datasets e workflows devem ter try/catch
  BASENAME=$(basename "$FILE_PATH")
  if [[ "$BASENAME" == ds_* ]] || [[ "$BASENAME" == wf_* ]]; then
    if ! grep -qE '^\s*try\s*\{' "$FILE_PATH" 2>/dev/null; then
      ERRORS+="Fluig: '${BASENAME}' não tem try/catch — obrigatório em datasets e workflows\n"
    fi
  fi
fi

if [[ -n "$ERRORS" ]]; then
  jq -n --arg reason "Qualidade Fluig — corrija antes de continuar:\n\n${ERRORS}" \
    '{"decision":"block","reason":$reason}'
  exit 0
fi

exit 0
