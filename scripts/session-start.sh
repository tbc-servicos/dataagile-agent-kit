#!/usr/bin/env bash
# session-start.sh — Hook SessionStart do Claude Code
# Detecta o plugin sendo trabalhado e inicializa .jira-session

# Silencioso se não estiver em um repo git
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0

# Verifica se é o repo claude_skills (deve ter pelo menos um subdir com .claude-plugin)
HAS_PLUGIN=$(find "$REPO_ROOT" -maxdepth 3 -name "plugin.json" -path "*/.claude-plugin/*" 2>/dev/null | head -1)
if [ -z "$HAS_PLUGIN" ]; then
  exit 0
fi

JIRA_SESSION_SCRIPT="$REPO_ROOT/scripts/jira-session.sh"
if [ ! -f "$JIRA_SESSION_SCRIPT" ]; then
  exit 0
fi

# Detectar branch atual
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

# Detectar plugin: comparar $PWD com subdirs da raiz que têm .claude-plugin/plugin.json
PLUGIN="null"
while IFS= read -r plugin_json; do
  plugin_dir=$(dirname "$(dirname "$plugin_json")")
  if [ "$PWD" = "$plugin_dir" ] || [[ "$PWD" == "$plugin_dir/"* ]]; then
    PLUGIN=$(basename "$plugin_dir")
    break
  fi
done < <(find "$REPO_ROOT" -maxdepth 3 -name "plugin.json" -path "*/.claude-plugin/*" 2>/dev/null)

# Inicializar o estado de sessão na raiz do repo
(cd "$REPO_ROOT" && bash "$JIRA_SESSION_SCRIPT" write "$PLUGIN" "$BRANCH")
