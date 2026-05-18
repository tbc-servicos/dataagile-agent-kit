#!/usr/bin/env bash
# fluig-ts-preference.sh — Injeta contexto TypeScript/PO-UI em projetos Fluig Angular
# Ativado por UserPromptSubmit
# Espelha ts-preference.sh global, detectando projetos Fluig por @po-ui/ng-components

set -euo pipefail

INPUT=$(cat)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

if [[ -z "$CWD" ]]; then
  exit 0
fi

PKG="$CWD/package.json"

# Busca package.json subindo até 3 níveis se não encontrar no cwd
if [[ ! -f "$PKG" ]]; then
  for i in 1 2 3; do
    CWD="$(dirname "$CWD")"
    PKG="$CWD/package.json"
    [[ -f "$PKG" ]] && break
  done
fi

if [[ ! -f "$PKG" ]]; then
  exit 0
fi

# Validar JSON antes de usar
if ! jq empty "$PKG" &>/dev/null 2>&1; then
  exit 0
fi

# Detectar projeto Fluig: tem @po-ui/ng-components
if ! jq -e '(.dependencies["@po-ui/ng-components"] // .devDependencies["@po-ui/ng-components"]) != null' "$PKG" &>/dev/null 2>&1; then
  exit 0
fi

jq -n '{
  hookSpecificOutput: {
    hookEventName: "UserPromptSubmit",
    additionalContext: "Este projeto usa Angular 19 + PO-UI 19.36.0 (Fluig widget). SEMPRE use TypeScript (.ts). NUNCA crie arquivos .js para componentes, services, pipes ou models — apenas .spec.ts para testes unitários é permitido. Use const/let, nunca var. Notificações: sempre Swal.fire(), nunca alert()."
  }
}'

exit 0
