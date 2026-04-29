#!/usr/bin/env bash
# Auto-update marketplace repos on session start (no cache)
# Runs async — does not block session initialization
# Cross-platform: macOS, Linux, Windows (Git Bash/WSL)

MARKETPLACE_ROOT="$(cd "${CLAUDE_PLUGIN_ROOT}/../.." 2>/dev/null && pwd)"
[ -z "$MARKETPLACE_ROOT" ] && exit 0

# Lock file — temp dir portable across OS
TMPDIR="${TMPDIR:-${TMP:-/tmp}}"
LOCK="$TMPDIR/claude-marketplace-update.lock"
# Skip if another instance is already running (e.g. both protheus and fluig trigger)
[ -f "$LOCK" ] && exit 0
trap 'rm -f "$LOCK"' EXIT
echo $$ > "$LOCK"

# Log file (visible across runs) — substitui falhas silenciosas
USER_HOME="${HOME:-$USERPROFILE}"
LOG="$USER_HOME/.claude/plugins/auto-update.log"
mkdir -p "$(dirname "$LOG")" 2>/dev/null
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"
}

NEW_REPO_URL="https://github.com/tbc-servicos/tbc-knowledge-plugins.git"

# Force-update git-based marketplace repos (fetch+reset, no cache)
for d in "$MARKETPLACE_ROOT"/*/; do
  [ -d "$d/.git" ] || continue

  # Auto-healing: detectar URL antiga (Bitbucket) e migrar para GitHub
  CURRENT_URL=$(git -C "$d" remote get-url origin 2>/dev/null)
  if echo "$CURRENT_URL" | grep -qi "bitbucket.org/fabricatbc/claude_skills"; then
    log "Marketplace $d apontava para Bitbucket antigo. Migrando origin para $NEW_REPO_URL"
    git -C "$d" remote set-url origin "$NEW_REPO_URL" 2>>"$LOG"
  fi

  BRANCH=$(git -C "$d" rev-parse --abbrev-ref HEAD 2>/dev/null)
  [ -z "$BRANCH" ] && BRANCH="main"

  if ! git -C "$d" fetch origin --prune --force --quiet 2>>"$LOG"; then
    log "fetch falhou em $d (origin: $(git -C "$d" remote get-url origin 2>/dev/null))"
    continue
  fi
  if ! git -C "$d" reset --hard "origin/$BRANCH" --quiet 2>>"$LOG"; then
    log "reset --hard origin/$BRANCH falhou em $d"
  fi
done

# Remove TBC plugin names installed from any marketplace other than claude-skills-tbc.
# Prevents stale cache conflicts when the same plugin exists in multiple marketplaces.
TBC_PLUGINS="protheus fluig tae confluence mit-docs jira-api keepass playwright discli tempo"
CORRECT_MARKETPLACE="claude-skills-tbc"

while IFS= read -r line; do
  if [[ "$line" =~ [[:space:]]([a-z-]+)@([a-z0-9_-]+)[[:space:]]*$ ]]; then
    plugin_name="${BASH_REMATCH[1]}"
    marketplace="${BASH_REMATCH[2]}"
    for tbc in $TBC_PLUGINS; do
      if [[ "$plugin_name" == "$tbc" && "$marketplace" != "$CORRECT_MARKETPLACE" ]]; then
        claude plugins uninstall "${plugin_name}@${marketplace}" --scope user 2>/dev/null
      fi
    done
  fi
done < <(claude plugins list 2>/dev/null | grep '❯')

# Sync marketplace → cache (skills, hooks, agents, CLAUDE.md, dist)
# Mantém o cache sempre atualizado sem precisar reinstalar o plugin.
PLUGINS_ROOT=""
_candidate="$CLAUDE_PLUGIN_ROOT"
for _i in 1 2 3 4 5 6; do
  _candidate="$(cd "$_candidate/.." 2>/dev/null && pwd)"
  if [ -d "$_candidate/cache" ] && [ -d "$_candidate/marketplaces" ]; then
    PLUGINS_ROOT="$_candidate"
    break
  fi
done

if [ -n "$PLUGINS_ROOT" ]; then
  _mkt_dir="$PLUGINS_ROOT/marketplaces/$CORRECT_MARKETPLACE"
  [ -d "$_mkt_dir" ] && for _plugin in $TBC_PLUGINS; do
    _plugin_dir="$_mkt_dir/$_plugin"
    [ -d "$_plugin_dir" ] || continue
    _cache_plugin="$PLUGINS_ROOT/cache/$CORRECT_MARKETPLACE/$_plugin"
    [ -d "$_cache_plugin" ] || continue
    for _version_dir in "$_cache_plugin"/*/; do
      [ -d "$_version_dir" ] || continue

      # Sync diretórios inteiros (skills, hooks, agents, dist)
      for _sync_dir in skills hooks agents dist; do
        [ -d "$_plugin_dir/$_sync_dir" ] || continue
        mkdir -p "$_version_dir/$_sync_dir"
        cp -r "$_plugin_dir/$_sync_dir"/. "$_version_dir/$_sync_dir/" 2>/dev/null || true
      done

      # Sync CLAUDE.md (raiz do plugin)
      [ -f "$_plugin_dir/CLAUDE.md" ] && \
        cp -f "$_plugin_dir/CLAUDE.md" "$_version_dir/CLAUDE.md" 2>/dev/null || true
    done
  done
fi
