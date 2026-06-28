#!/usr/bin/env bash
# advpl-encoding.sh — Garante encoding CP-1252 em arquivos .prw e .tlpp

INPUT=$(cat)

if ! command -v jq &>/dev/null; then
  echo "⚠️  ENCODING: jq não encontrado. Verifique o encoding manualmente."
  exit 0
fi

FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""' 2>/dev/null)

# Só actua em .prw e .tlpp
[[ "$FILE" == *.prw ]] || [[ "$FILE" == *.tlpp ]] || exit 0
[[ -f "$FILE" ]] || exit 0

BASENAME=$(basename "$FILE")

# python3 é necessário para detecção de encoding
if ! command -v python3 &>/dev/null; then
  echo "⚠️  ENCODING: python3 não encontrado — verificação de encoding ignorada"
  exit 0
fi

# Detecta encoding em uma única leitura: ASCII | UTF8 | CP1252
ENCODING_STATE=$(python3 - "$FILE" <<'PYEOF'
import sys

filepath = sys.argv[1]
with open(filepath, 'rb') as f:
    data = f.read()

if not data or all(b < 128 for b in data):
    print("ASCII")
    sys.exit(0)

if data.startswith(b'\xef\xbb\xbf'):
    print("UTF8")
    sys.exit(0)

try:
    data.decode('utf-8')
    print("UTF8")
except UnicodeDecodeError:
    print("CP1252")
PYEOF
)

# Sair silenciosamente se não for UTF8 (cobre ASCII, CP1252 e output inesperado)
[[ "$ENCODING_STATE" == "UTF8" ]] || exit 0

# Arquivo está em UTF-8 com bytes altos — tentar converter para CP-1252
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
if iconv -f UTF-8 -t CP1252 "$FILE" > "$TMP" 2>/dev/null; then
  mv "$TMP" "$FILE"
  echo "✅ ENCODING: $BASENAME convertido UTF-8 → CP-1252"
  exit 0
fi

# Conversão falhou — há caracteres fora do CP-1252 (ex: emojis, codepoints altos)

PROBLEMATIC=$(python3 -c "
import sys

with open(sys.argv[1], 'rb') as f:
    data = f.read()

text = data.decode('utf-8', errors='replace')
lines = text.splitlines()

problems = []
for lineno, line in enumerate(lines, 1):
    for colno, ch in enumerate(line, 1):
        cp = ord(ch)
        # Tentar codificar em CP-1252; se falhar, é um char problemático
        try:
            ch.encode('cp1252')
        except (UnicodeEncodeError, LookupError):
            problems.append((lineno, colno, cp, ch))
            if len(problems) >= 10:
                break
    if len(problems) >= 10:
        break

for lineno, colno, cp, ch in problems:
    print(f'  linha {lineno}, col {colno}: U+{cp:04X} ({repr(ch)})')
" "$FILE" 2>/dev/null)

echo "❌ ENCODING: $BASENAME contém caracteres fora do CP-1252:"
echo "$PROBLEMATIC"
exit 2
