#!/bin/sh
# TBC Status Line — cross-platform (macOS, Linux, Windows Git Bash)
# Mostra: Modelo | Context:X% | Tokens:XK | TBC[plugin:ver ...] | dir
# IMPORTANTE: nunca emitir escape codes/cores — quebra statusline no Windows

input=$(cat)

# Parse JSON — usa jq se disponivel, senao grep/sed
if command -v jq >/dev/null 2>&1; then
  model=$(echo "$input" | jq -r '.model.display_name // "Unknown"' 2>/dev/null)
  remaining=$(echo "$input" | jq -r '.context_window.remaining_percentage // empty' 2>/dev/null)
  total_input=$(echo "$input" | jq -r '.context_window.total_input_tokens // 0' 2>/dev/null)
  total_output=$(echo "$input" | jq -r '.context_window.total_output_tokens // 0' 2>/dev/null)
  cwd=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // ""' 2>/dev/null)
else
  # Fallback sem jq
  model=$(echo "$input" | sed -n 's/.*"display_name" *: *"\([^"]*\)".*/\1/p' | head -1)
  remaining=$(echo "$input" | sed -n 's/.*"remaining_percentage" *: *\([0-9.]*\).*/\1/p' | head -1)
  total_input=$(echo "$input" | sed -n 's/.*"total_input_tokens" *: *\([0-9]*\).*/\1/p' | head -1)
  total_output=$(echo "$input" | sed -n 's/.*"total_output_tokens" *: *\([0-9]*\).*/\1/p' | head -1)
  cwd=$(echo "$input" | sed -n 's/.*"current_dir" *: *"\([^"]*\)".*/\1/p' | head -1)
fi

# Defaults seguros
model="${model:-Unknown}"
total_input="${total_input:-0}"
total_output="${total_output:-0}"

# Basename cross-platform (Windows paths usam \ )
dir=$(basename "$cwd" 2>/dev/null)
dir="${dir:-.}"

# TBC plugin versions
USER_HOME="${HOME:-$USERPROFILE}"
TBC_MARKET="$USER_HOME/.claude/plugins/marketplaces/claude-skills-tbc"
tbc_part=""
if [ -d "$TBC_MARKET" ]; then
  items=""
  for d in "$TBC_MARKET"/*/; do
    [ -d "$d" ] || continue
    pf="$d.claude-plugin/plugin.json"
    [ -f "$pf" ] || continue
    name=$(basename "$d")
    if command -v jq >/dev/null 2>&1; then
      v=$(jq -r '.version // empty' "$pf" 2>/dev/null)
    else
      v=$(sed -n 's/.*"version" *: *"\([^"]*\)".*/\1/p' "$pf" 2>/dev/null | head -1)
    fi
    [ -n "$v" ] && items="${items:+$items }${name}:${v}"
  done
  [ -n "$items" ] && tbc_part="TBC[$items]"
fi

# Format tokens
total_tokens=$((total_input + total_output))
if [ "$total_tokens" -ge 1000000 ]; then
  tokens_fmt=$(awk "BEGIN { printf \"%.1fM\", $total_tokens / 1000000 }")
elif [ "$total_tokens" -ge 1000 ]; then
  tokens_fmt=$(awk "BEGIN { printf \"%.1fK\", $total_tokens / 1000 }")
else
  tokens_fmt="$total_tokens"
fi

# Format context
if [ -n "$remaining" ]; then
  remaining_fmt=$(awk "BEGIN { printf \"%.1f\", $remaining }")
  context_part="Ctx:${remaining_fmt}%"
else
  context_part="Ctx:N/A"
fi

# Output — texto puro, sem escape codes
if [ -n "$tbc_part" ]; then
  echo "${model} | ${context_part} | ${tokens_fmt} | ${tbc_part} | ${dir}"
else
  echo "${model} | ${context_part} | ${tokens_fmt} | ${dir}"
fi
