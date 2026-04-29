#!/usr/bin/env bash
# =============================================================
#  TBC Plugin Setup — Configuração completa para Claude Code
#  Cross-platform: macOS, Linux, Windows (Git Bash)
#  Para analistas e devs — nao requer conhecimento tecnico
# =============================================================

set -e

USER_HOME="${HOME:-$USERPROFILE}"
MARKET_DIR="$USER_HOME/.claude/plugins/marketplaces/claude-skills-tbc"
REPO_URL="https://github.com/tbc-servicos/tbc-knowledge-plugins.git"
AUTH_URL="https://mcp.totvstbc.com.br/auth"

echo "========================================"
echo "  TBC Plugin Setup"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
echo ""

# ----- Passo 1: Clonar/Atualizar marketplace (HTTPS, sem credenciais) -----
echo "[1/6] Instalando plugins TBC..."

if [ -d "$MARKET_DIR/.git" ]; then
  echo "  Marketplace ja existe, atualizando..."
  CURRENT_URL=$(git -C "$MARKET_DIR" remote get-url origin 2>/dev/null || echo "")
  if echo "$CURRENT_URL" | grep -qi "bitbucket"; then
    echo "  Detectada URL antiga (Bitbucket). Migrando para GitHub..."
    git -C "$MARKET_DIR" remote set-url origin "$REPO_URL"
  fi
  git -C "$MARKET_DIR" fetch origin --prune --force --quiet 2>/dev/null
  BRANCH=$(git -C "$MARKET_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
  git -C "$MARKET_DIR" reset --hard "origin/$BRANCH" --quiet 2>/dev/null
  echo "  Atualizado"
else
  echo "  Clonando repositorio publico..."
  mkdir -p "$(dirname "$MARKET_DIR")"
  git clone --quiet "$REPO_URL" "$MARKET_DIR" 2>/dev/null
  if [ $? -ne 0 ]; then
    echo "  ERRO: Falha ao clonar. Verifique sua conexao de internet."
    exit 1
  fi
  echo "  Clonado com sucesso"
fi

# ----- Passo 2: Configurar e validar email MCP -----
echo ""
echo "[2/6] Configurando email para o MCP..."

CONFIG_DIR="$USER_HOME/.config/tbc"
CONFIG_FILE="$CONFIG_DIR/dev-config.json"
EMAIL=""

if [ -f "$CONFIG_FILE" ]; then
  EMAIL=$(sed -n 's/.*"email" *: *"\([^"]*\)".*/\1/p' "$CONFIG_FILE" 2>/dev/null | head -1)
  [ -n "$EMAIL" ] && echo "  Email encontrado: $EMAIL"
fi

if [ -z "$EMAIL" ]; then
  GIT_EMAIL=$(git config user.email 2>/dev/null)
  printf "  Digite seu email"
  [ -n "$GIT_EMAIL" ] && printf " [$GIT_EMAIL]"
  printf ": "
  read -r EMAIL_INPUT
  EMAIL="${EMAIL_INPUT:-$GIT_EMAIL}"
fi

if [ -z "$EMAIL" ]; then
  echo "  AVISO: Email nao informado. MCP nao vai funcionar."
  echo "  Rode o setup novamente quando tiver o email."
else
  echo "  Verificando acesso ao MCP..."
  AUTH_RESPONSE=$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$AUTH_URL" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\"}" 2>/dev/null)

  case "$AUTH_RESPONSE" in
    200)
      echo "  Email validado — acesso ao MCP liberado"
      mkdir -p "$CONFIG_DIR"
      cat > "$CONFIG_FILE" <<JSONEOF
{
  "email": "$EMAIL"
}
JSONEOF
      ;;
    402)
      echo ""
      echo "  ============================================"
      echo "  AVISO: Trial expirado para '$EMAIL'"
      echo "  ============================================"
      echo "  Acesse https://mcp.totvstbc.com.br/payment para regularizar."
      mkdir -p "$CONFIG_DIR"
      cat > "$CONFIG_FILE" <<JSONEOF
{
  "email": "$EMAIL"
}
JSONEOF
      ;;
    403)
      echo ""
      echo "  ============================================"
      echo "  ERRO: Email '$EMAIL' nao tem acesso ao MCP"
      echo "  ============================================"
      echo "  Solicite cadastro: https://mcp.totvstbc.com.br/admin"
      ;;
    *)
      echo "  AVISO: Nao foi possivel validar (servidor indisponivel)."
      echo "  Salvando email — proxima sessao tenta de novo."
      mkdir -p "$CONFIG_DIR"
      cat > "$CONFIG_FILE" <<JSONEOF
{
  "email": "$EMAIL"
}
JSONEOF
      ;;
  esac
fi

# ----- Passo 3: Habilitar plugins no Claude Code -----
echo ""
echo "[3/6] Habilitando plugins..."

SETTINGS="$USER_HOME/.claude/settings.json"

if [ -f "$SETTINGS" ]; then
  TBC_PLUGINS="protheus fluig tae mit-docs jira-api keepass playwright discli tempo"
  ENABLED=0
  for plugin in $TBC_PLUGINS; do
    KEY="\"${plugin}@claude-skills-tbc\""
    if ! grep -q "$KEY" "$SETTINGS" 2>/dev/null; then
      if grep -q "enabledPlugins" "$SETTINGS" 2>/dev/null; then
        TMP=$(mktemp)
        awk -v key="$KEY" '
          /enabledPlugins/ { found=1 }
          found && /\}/ && !inserted {
            print "    " key ": true,"
            inserted=1
          }
          { print }
        ' "$SETTINGS" > "$TMP" && mv "$TMP" "$SETTINGS"
        ENABLED=$((ENABLED + 1))
      fi
    fi
  done
  if [ $ENABLED -gt 0 ]; then
    echo "  $ENABLED plugin(s) habilitado(s)"
  else
    echo "  Todos os plugins ja estavam habilitados"
  fi

  if ! grep -q "claude-skills-tbc" "$SETTINGS" 2>/dev/null || ! grep -q "extraKnownMarketplaces" "$SETTINGS" 2>/dev/null; then
    echo "  AVISO: marketplace claude-skills-tbc pode nao estar registrado."
    echo "  Abra o Claude Code e rode:"
    echo "    claude plugin marketplace add $REPO_URL"
  fi
else
  echo "  AVISO: settings.json nao encontrado. Abra o Claude Code uma vez antes."
fi

# ----- Passo 4: StatusLine -----
echo ""
echo "[4/6] Configurando rodape TBC..."

STATUSLINE_CMD='bash "$HOME/.claude/plugins/marketplaces/claude-skills-tbc/scripts/statusline-tbc.sh"'

if [ -f "$SETTINGS" ]; then
  if grep -q "statusline-tbc" "$SETTINGS" 2>/dev/null; then
    echo "  Rodape ja configurado"
  else
    if command -v awk >/dev/null 2>&1; then
      TMP=$(mktemp)
      awk -v cmd="$STATUSLINE_CMD" '
        { lines[NR] = $0; n = NR }
        END {
          for (i = 1; i < n; i++) {
            if (i == n-1) {
              sub(/[[:space:]]*$/, "", lines[i])
              if (lines[i] !~ /,$/ && lines[i] !~ /[{[]$/) {
                lines[i] = lines[i] ","
              }
            }
            print lines[i]
          }
          print "  \"statusLine\": {"
          print "    \"type\": \"command\","
          print "    \"command\": \"" cmd "\""
          print "  }"
          print "}"
        }
      ' "$SETTINGS" > "$TMP" && mv "$TMP" "$SETTINGS"
      echo "  Rodape configurado"
    else
      echo "  AVISO: awk nao encontrado. Adicione manualmente no settings.json:"
      echo "    \"statusLine\": { \"type\": \"command\", \"command\": \"$STATUSLINE_CMD\" }"
    fi
  fi
else
  echo "  AVISO: settings.json nao encontrado."
fi

# ----- Passo 5: Claude Desktop -----
echo ""
echo "[5/6] Configurando Claude Desktop..."

DESKTOP_CONFIG=""
case "$(uname -s)" in
  Darwin)
    DESKTOP_CONFIG="$USER_HOME/Library/Application Support/Claude/claude_desktop_config.json"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    DESKTOP_CONFIG="$APPDATA/Claude/claude_desktop_config.json"
    ;;
  Linux)
    DESKTOP_CONFIG="$USER_HOME/.config/Claude/claude_desktop_config.json"
    ;;
esac

if [ -n "$DESKTOP_CONFIG" ]; then
  PROXY_PATH="$MARKET_DIR/dist/tbc-mcp-proxy.mjs"
  TAE_PROXY_PATH="$MARKET_DIR/dist/tae-mcp-proxy.mjs"

  CONFIGURED_EMAIL=""
  if [ -f "$CONFIG_FILE" ]; then
    CONFIGURED_EMAIL=$(sed -n 's/.*"email" *: *"\([^"]*\)".*/\1/p' "$CONFIG_FILE" 2>/dev/null | head -1)
  fi
  CONFIGURED_EMAIL="${CONFIGURED_EMAIL:-seu@email.com.br}"

  if [ -f "$DESKTOP_CONFIG" ] && grep -q "tbc-knowledge" "$DESKTOP_CONFIG" 2>/dev/null; then
    echo "  Claude Desktop ja configurado"
  else
    DESKTOP_DIR=$(dirname "$DESKTOP_CONFIG")
    mkdir -p "$DESKTOP_DIR" 2>/dev/null

    if [ -f "$DESKTOP_CONFIG" ] && grep -q "mcpServers" "$DESKTOP_CONFIG" 2>/dev/null; then
      TMP=$(mktemp)
      awk -v proxy="$PROXY_PATH" -v tae="$TAE_PROXY_PATH" -v email="$CONFIGURED_EMAIL" '
        /"mcpServers"/ { found=1 }
        found && /\{/ && count==0 { count=1; print; next }
        found && count==1 && !inserted {
          print "    \"tbc-knowledge\": {"
          print "      \"command\": \"node\","
          print "      \"args\": [\"" proxy "\"],"
          print "      \"env\": { \"TBC_USER_EMAIL\": \"" email "\" }"
          print "    },"
          print "    \"totvs-sign\": {"
          print "      \"command\": \"node\","
          print "      \"args\": [\"" tae "\"],"
          print "      \"env\": { \"TAE_USER_EMAIL\": \"" email "\", \"TAE_PASSWORD\": \"CONFIGURE_SUA_SENHA\" }"
          print "    },"
          inserted=1
        }
        { print }
      ' "$DESKTOP_CONFIG" > "$TMP" && mv "$TMP" "$DESKTOP_CONFIG"
      echo "  MCP adicionado ao Claude Desktop"
    else
      cat > "$DESKTOP_CONFIG" <<DESKTOPEOF
{
  "mcpServers": {
    "tbc-knowledge": {
      "command": "node",
      "args": ["$PROXY_PATH"],
      "env": { "TBC_USER_EMAIL": "$CONFIGURED_EMAIL" }
    },
    "totvs-sign": {
      "command": "node",
      "args": ["$TAE_PROXY_PATH"],
      "env": { "TAE_USER_EMAIL": "$CONFIGURED_EMAIL", "TAE_PASSWORD": "CONFIGURE_SUA_SENHA" }
    }
  }
}
DESKTOPEOF
      echo "  Claude Desktop configurado"
    fi

    echo "  AVISO: Configure a senha do TOTVS Sign em:"
    echo "    $DESKTOP_CONFIG"
    echo "    Substitua CONFIGURE_SUA_SENHA pela sua senha"
  fi
else
  echo "  SO nao reconhecido, pule esta etapa"
fi

# ----- Passo 6: Validacao -----
echo ""
echo "[6/6] Validando instalacao..."
echo ""

PLUGIN_COUNT=0
for d in "$MARKET_DIR"/*/; do
  [ -d "$d" ] || continue
  pf="$d.claude-plugin/plugin.json"
  [ -f "$pf" ] || continue
  name=$(basename "$d")
  v=$(sed -n 's/.*"version" *: *"\([^"]*\)".*/\1/p' "$pf" 2>/dev/null | head -1)
  v="${v:-?}"
  echo "  OK  $name v$v"
  PLUGIN_COUNT=$((PLUGIN_COUNT + 1))
done

echo ""
if [ -f "$MARKET_DIR/dist/tbc-mcp-proxy.mjs" ]; then
  echo "  OK  MCP proxy bundle"
else
  echo "  ERR MCP proxy bundle NAO encontrado"
fi

for plugin in protheus fluig; do
  rh="$MARKET_DIR/$plugin/hooks/run-hook.cmd"
  [ -f "$rh" ] && echo "  OK  $plugin/hooks" || echo "  ERR $plugin/hooks FALTANDO"
done

echo ""
echo "========================================"
echo "  SETUP COMPLETO — $PLUGIN_COUNT plugins instalados"
echo "  Reinicie o Claude Code para ativar."
echo "========================================"
