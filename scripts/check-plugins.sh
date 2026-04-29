#!/usr/bin/env bash
# TBC Plugin Health Check — zero dependencias externas
# Cross-platform: macOS, Linux, Windows (Git Bash)

USER_HOME="${HOME:-$USERPROFILE}"
MARKET="$USER_HOME/.claude/plugins/marketplaces/claude-skills-tbc"

# Funcao para ler campo JSON simples (sem jq)
json_val() {
  local file="$1" key="$2"
  if command -v jq >/dev/null 2>&1; then
    jq -r ".$key // empty" "$file" 2>/dev/null
  else
    sed -n "s/.*\"$key\" *: *\"\([^\"]*\)\".*/\1/p" "$file" 2>/dev/null | head -1
  fi
}

echo "========================================"
echo "  TBC Plugin Health Check"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
echo ""

# 1. SO
printf "SO: "
case "$(uname -s)" in
  Darwin)  echo "macOS $(sw_vers -productVersion 2>/dev/null)" ;;
  Linux)   echo "Linux $(uname -r)" ;;
  MINGW*|MSYS*|CYGWIN*) echo "Windows ($(uname -s))" ;;
  *)       echo "$(uname -s)" ;;
esac

# 2. Claude Code
printf "Claude Code: "
if command -v claude >/dev/null 2>&1; then
  claude --version 2>/dev/null || echo "instalado"
else
  echo "NAO INSTALADO"
fi

# 3. Bash + Git
echo "Bash: ${BASH_VERSION:-$(sh --version 2>&1 | head -1)}"
printf "Git: "
git --version 2>/dev/null | head -1 || echo "NAO INSTALADO"

# 4. jq (opcional)
printf "jq: "
if command -v jq >/dev/null 2>&1; then
  jq --version 2>/dev/null
else
  echo "nao instalado (opcional)"
fi

# 5. Conectividade GitHub (HTTPS)
printf "GitHub: "
if curl -sS --max-time 5 -o /dev/null -w "%{http_code}" https://github.com/tbc-servicos/tbc-knowledge-plugins 2>/dev/null | grep -q "200\|301\|302"; then
  echo "OK"
else
  echo "FALHA (verificar conexao)"
fi

echo ""
echo "--- Marketplace ---"

# 6. Marketplace existe?
if [ ! -d "$MARKET" ]; then
  echo "Marketplace claude-skills-tbc NAO encontrado em $MARKET"
  echo "Instale com: claude plugins install"
  exit 1
fi

# 7. Branch e remote
printf "Remote: "
git -C "$MARKET" remote get-url origin 2>/dev/null || echo "N/A"
printf "Branch: "
git -C "$MARKET" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "N/A"
printf "Ultimo commit local: "
git -C "$MARKET" log --oneline -1 2>/dev/null || echo "N/A"

# 8. Forcar update
echo ""
echo "Atualizando..."
git -C "$MARKET" fetch origin --prune --force --quiet 2>/dev/null
BRANCH=$(git -C "$MARKET" rev-parse --abbrev-ref HEAD 2>/dev/null)
LOCAL_BEFORE=$(git -C "$MARKET" rev-parse HEAD 2>/dev/null)
git -C "$MARKET" reset --hard "origin/${BRANCH:-main}" --quiet 2>/dev/null

LOCAL_AFTER=$(git -C "$MARKET" rev-parse HEAD 2>/dev/null)
if [ "$LOCAL_BEFORE" != "$LOCAL_AFTER" ]; then
  COUNT=$(git -C "$MARKET" log --oneline "$LOCAL_BEFORE..$LOCAL_AFTER" 2>/dev/null | wc -l | tr -d ' ')
  echo "Atualizado! +${COUNT} commit(s)"
else
  echo "Ja esta na ultima versao"
fi

printf "Commit atual: "
git -C "$MARKET" log --oneline -1 2>/dev/null

# 9. Plugins e versoes
echo ""
echo "--- Plugins TBC ---"
ERRORS=0
for d in "$MARKET"/*/; do
  [ -d "$d" ] || continue
  pf="$d.claude-plugin/plugin.json"
  [ -f "$pf" ] || continue
  name=$(basename "$d")
  v=$(json_val "$pf" "version")
  v="${v:-?}"
  echo "  OK  $name v$v"
done

# 10. Hooks
echo ""
echo "--- Hooks ---"
for plugin in protheus fluig; do
  hf="$MARKET/$plugin/hooks/hooks.json"
  if [ -f "$hf" ]; then
    # Validar JSON: tentar parsear com jq ou verificar chaves/colchetes
    VALID=false
    if command -v jq >/dev/null 2>&1; then
      jq -e '.' "$hf" >/dev/null 2>&1 && VALID=true
    else
      # Fallback: verificar se abre e fecha com {}
      head -1 "$hf" | grep -q '{' && tail -1 "$hf" | grep -q '}' && VALID=true
    fi
    if $VALID; then
      echo "  OK  $plugin/hooks.json"
    else
      echo "  ERR $plugin/hooks.json (JSON INVALIDO)"
      ERRORS=$((ERRORS+1))
    fi
  else
    echo "  --  $plugin/hooks.json (nao encontrado)"
  fi

  rh="$MARKET/$plugin/hooks/run-hook.cmd"
  if [ -f "$rh" ]; then
    echo "  OK  $plugin/run-hook.cmd"
    [ ! -x "$rh" ] && chmod +x "$rh" 2>/dev/null
  else
    echo "  ERR $plugin/run-hook.cmd (FALTANDO)"
    ERRORS=$((ERRORS+1))
  fi

  sc="$MARKET/$plugin/hooks/session-context"
  if [ -f "$sc" ]; then
    echo "  OK  $plugin/session-context"
    [ ! -x "$sc" ] && chmod +x "$sc" 2>/dev/null
  else
    echo "  ERR $plugin/session-context (FALTANDO)"
    ERRORS=$((ERRORS+1))
  fi
done

# 11. StatusLine
echo ""
echo "--- StatusLine ---"
SETTINGS_FILE="$USER_HOME/.claude/settings.json"
if grep -q "statusline-tbc" "$SETTINGS_FILE" 2>/dev/null; then
  echo "  OK  statusline-tbc configurado"
else
  echo "  --  statusline-tbc nao configurado (rode setup-statusline.sh)"
fi

# Resultado
echo ""
echo "========================================"
if [ $ERRORS -eq 0 ]; then
  echo "  TUDO OK — reinicie o Claude Code para aplicar"
else
  echo "  ${ERRORS} PROBLEMA(S) ENCONTRADO(S)"
fi
echo "========================================"
