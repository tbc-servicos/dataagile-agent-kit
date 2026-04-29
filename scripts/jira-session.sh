#!/usr/bin/env bash
# jira-session.sh — Gerencia o estado de sessão JIRA (.jira-session)
# Interface: write <plugin> <branch> | read <campo> | set_issue_key <key> | clear
# Cross-platform: macOS, Linux, Windows Git Bash
# Zero dependências externas (sem jq obrigatório)

set -euo pipefail

SESSION_FILE=".jira-session"

_json_get() {
  local key="$1"
  local file="$2"
  # Extrai valor de "key": "value" com sed — funciona sem jq
  sed -n "s/.*\"${key}\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" "$file" | head -1
}

_json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/	/\\t/g' | tr -d '\n\r'
}

_json_write() {
  local plugin
  plugin=$(_json_escape "$1")
  local branch
  branch=$(_json_escape "$2")
  local user
  user=$(git config user.email 2>/dev/null || echo "${USER:-unknown}")
  user=$(_json_escape "$user")
  local timestamp
  timestamp=$(date +%Y-%m-%d)
  printf '{\n  "plugin": "%s",\n  "branch": "%s",\n  "user": "%s",\n  "timestamp": "%s",\n  "issue_key": ""\n}\n' \
    "$plugin" "$branch" "$user" "$timestamp"
}

cmd="${1:-}"

case "$cmd" in
  write)
    plugin="${2:-}"
    branch="${3:-}"
    if [ -z "$plugin" ] || [ -z "$branch" ]; then
      echo "Uso: $0 write <plugin> <branch>" >&2
      exit 1
    fi
    (umask 077 && _json_write "$plugin" "$branch" > "$SESSION_FILE")
    ;;

  read)
    campo="${2:-}"
    if [ -z "$campo" ]; then
      echo "Uso: $0 read <campo>" >&2
      exit 1
    fi
    if [ ! -f "$SESSION_FILE" ]; then
      echo ""
      exit 0
    fi
    value=$(_json_get "$campo" "$SESSION_FILE")
    echo "$value"
    ;;

  set_issue_key)
    key="${2:-}"
    if [ -z "$key" ]; then
      echo "Uso: $0 set_issue_key <key>" >&2
      exit 1
    fi
    if ! echo "$key" | grep -qE '^[A-Z]+-[0-9]+$'; then
      echo "Erro: issue_key inválido — esperado formato PROJ-123, recebido: '$key'" >&2
      exit 1
    fi
    if [ ! -f "$SESSION_FILE" ]; then
      echo "Erro: $SESSION_FILE não encontrado" >&2
      exit 1
    fi
    # Substitui o valor de issue_key no JSON existente
    # Compatível com sed GNU (Linux) e BSD (macOS)
    if sed --version 2>/dev/null | grep -q GNU; then
      sed -i "s/\"issue_key\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"issue_key\": \"${key}\"/" "$SESSION_FILE"
    else
      sed -i '' "s/\"issue_key\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"issue_key\": \"${key}\"/" "$SESSION_FILE"
    fi
    ;;

  clear)
    if [ -f "$SESSION_FILE" ]; then
      rm -f "$SESSION_FILE"
    fi
    ;;

  *)
    echo "Uso: $0 {write <plugin> <branch>|read <campo>|set_issue_key <key>|clear}" >&2
    exit 1
    ;;
esac
