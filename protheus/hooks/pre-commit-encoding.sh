#!/usr/bin/env bash
# pre-commit-encoding.sh — Verifica encoding CP-1252 em .prw e .tlpp antes do commit
#
# Instalação no projeto:
#   cp <plugin-root>/hooks/pre-commit-encoding.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit

set -euo pipefail

# Fail-safe: se python3 não está disponível, não bloquear o commit
if ! command -v python3 &>/dev/null; then
  echo "AVISO: python3 não encontrado — verificação de encoding ignorada."
  exit 0
fi

detect_encoding() {
  local filepath="$1"
  python3 - "$filepath" <<'PYEOF'
import sys
filepath = sys.argv[1]
with open(filepath, 'rb') as f:
    data = f.read()
if not data or all(b < 128 for b in data):
    print("OK")
    sys.exit(0)
if data.startswith(b'\xef\xbb\xbf'):
    print("UTF8")
    sys.exit(0)
try:
    data.decode('utf-8')
    print("UTF8")
except UnicodeDecodeError:
    print("OK")
PYEOF
}

ERRORS=()

while IFS= read -r filepath; do
  [ -z "$filepath" ] && continue
  [ ! -f "$filepath" ] && continue

  result=$(detect_encoding "$filepath")

  if [ "$result" = "UTF8" ]; then
    ERRORS+=("$filepath")
  fi
done < <(git diff --cached --name-only --diff-filter=ACM | { grep -E '\.(prw|tlpp)$' || true; })

if [ "${#ERRORS[@]}" -eq 0 ]; then
  exit 0
fi

echo ""
echo "❌ ENCODING: arquivos staged com encoding UTF-8 (deve ser CP-1252):"
echo ""
for f in "${ERRORS[@]}"; do
  echo "  $f"
done
echo ""
echo "Corrija com:"
for f in "${ERRORS[@]}"; do
  echo "  iconv -f UTF-8 -t CP1252 \"$f\" > /tmp/fixed && mv /tmp/fixed \"$f\""
done
echo ""

exit 1
