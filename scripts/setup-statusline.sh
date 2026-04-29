#!/bin/sh
# Setup TBC Status Line — roda uma vez para configurar
# Cross-platform: macOS, Linux, Windows (Git Bash)
# Zero dependencias externas (sem jq)

USER_HOME="${HOME:-$USERPROFILE}"
SETTINGS="$USER_HOME/.claude/settings.json"
STATUSLINE_CMD='bash "$HOME/.claude/plugins/marketplaces/claude-skills-tbc/scripts/statusline-tbc.sh"'

# Verificar se settings.json existe
if [ ! -f "$SETTINGS" ]; then
  echo "Erro: $SETTINGS nao encontrado."
  exit 1
fi

# Verificar se ja tem statusLine
if grep -q '"statusLine"' "$SETTINGS" 2>/dev/null; then
  # Substituir bloco statusLine existente (remove e reinsere)
  TMP=$(mktemp)
  # Remove linhas do statusLine ate o proximo }
  awk '
    /"statusLine"/ { skip=1; next }
    skip && /\}/ { skip=0; next }
    skip { next }
    { print }
  ' "$SETTINGS" > "$TMP"
  mv "$TMP" "$SETTINGS"
fi

# Inserir statusLine antes do ultimo }
TMP=$(mktemp)
awk -v cmd="$STATUSLINE_CMD" '
  # Encontrar a ultima linha com }
  { lines[NR] = $0; n = NR }
  END {
    for (i = 1; i < n; i++) {
      # Se a penultima linha nao termina com virgula, adicionar
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

echo "statusLine configurado."
echo ""
echo "Reinicie o Claude Code para ver o rodape."
echo "Resultado esperado:"
echo "  Sonnet 4.6 | Ctx:87.0% | 39.6K | TBC[protheus:2.0.4 fluig:2.0.4 ...] | meu-projeto"
