#!/bin/sh
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Install dependencies if missing
if [ ! -d node_modules ]; then
  echo "[totvs-sign] Instalando dependências..." >&2
  npm install --omit=dev --silent 2>&1 >&2
fi

exec node connect-remote.js
