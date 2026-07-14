#!/usr/bin/env bash
# Testes do sync-sonar-rules.cjs contra um servidor FALSO (sem depender da rede
# da TOTVS): prova o parser do bundle, o download dos detalhes, o --check e o
# fail-fast quando a SPA muda de formato.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
FAIL=0
check() { local d="$1"; shift; if "$@"; then echo "  ✅ $d"; else echo "  ❌ $d"; FAIL=1; fi; }

S="$(mktemp -d)"
# porta dinâmica + kill por PID: 'kill %1' não funciona sem job control (script não
# interativo) — o http.server ficava órfão na porta fixa e servia o sandbox já removido,
# então a suíte passava isolada e falhava no runner.
PORT=$(python3 -c "import socket;s=socket.socket();s.bind(('127.0.0.1',0));print(s.getsockname()[1]);s.close()")
SRV_PID=""
cleanup() { [ -n "$SRV_PID" ] && kill "$SRV_PID" 2>/dev/null; rm -rf "$S"; }
trap cleanup EXIT
mkdir -p "$S/site/assets/rules-html"
cat > "$S/site/index.html" <<'H'
<!doctype html><html><body><script src="main.abc123.js"></script></body></html>
H
cat > "$S/site/main.abc123.js" <<'J'
var x=[{codigo:"CA9001",tipo:"BUG",desc:"CA9001: Regra de teste"},{codigo:"CA9002",tipo:"CODE SMELL",desc:"CA9002: Outra"}];
J
cat > "$S/site/assets/rules-html/CA9001.html" <<'H'
<html><style>p{color:red}</style><h1>CA9001</h1><table><tr><td>TypeName</td></tr></table>
<h2>Como corrigir a violação</h2><p>Trocar X por Y.</p><pre>Local nX := 1</pre></html>
H
cat > "$S/site/assets/rules-html/CA9002.html" <<'H'
<html><h2>Como corrigir a violação</h2><p>Fazer Z.</p></html>
H
(cd "$S/site" && exec python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1) &
SRV_PID=$!
for _ in $(seq 1 20); do curl -sf "http://127.0.0.1:$PORT/index.html" >/dev/null && break; sleep 0.2; done

OUT="$REPO/protheus/skills/reviewer/references/sonarqube-rules-engpro.md"
BK="$S/backup.md"; cp "$OUT" "$BK"

echo "T1 — sincroniza catálogo + detalhes do servidor"
# a saída do sync é GUARDADA (e mostrada se algo falhar): um teste que engole a mensagem de
# erro obriga quem investiga a adivinhar — foi o que aconteceu quando isto quebrou no CI.
SONAR_RULES_URL=http://127.0.0.1:$PORT node "$REPO/scripts/sync-sonar-rules.cjs" >"$S/sync.log" 2>&1 || true
check "regra CA9001 no índice" grep -q "CA9001" "$OUT"
check "tipo preservado" grep -q "CODE SMELL" "$OUT"
check "'como corrigir' extraído" grep -q "Trocar X por Y" "$OUT"
check "exemplo de código em bloco advpl" grep -q '```advpl' "$OUT"
check "tabela de metadados descartada" bash -c "! grep -q 'TypeName' '$OUT'"

echo "T2 — --check detecta desatualização e confirma quando em dia"
SONAR_RULES_URL=http://127.0.0.1:$PORT node "$REPO/scripts/sync-sonar-rules.cjs" --check >/dev/null 2>&1
check "check verde quando sincronizado" test $? -eq 0
echo "sujeira" >> "$OUT"
SONAR_RULES_URL=http://127.0.0.1:$PORT node "$REPO/scripts/sync-sonar-rules.cjs" --check >/dev/null 2>&1
check "check vermelho quando desatualizado" test $? -eq 1

echo "T3 — fail-fast se a SPA mudar de formato (não gera arquivo vazio em silêncio)"
echo 'var semRegras = 1;' > "$S/site/main.abc123.js"
ERR=$(SONAR_RULES_URL=http://127.0.0.1:$PORT node "$REPO/scripts/sync-sonar-rules.cjs" 2>&1); RC=$?
check "exit != 0" test "$RC" -ne 0
check "erro explica a causa" grep -qi "catálogo de regras não encontrado" <<<"$ERR"

cp "$BK" "$OUT"   # restaura a referência real
if [ "$FAIL" -ne 0 ]; then
  echo "--- saída do sync (T1) ---"; cat "$S/sync.log" 2>/dev/null
  echo "--- servidor falso: porta $PORT ---"; curl -sS "http://127.0.0.1:$PORT/index.html" 2>&1 | head -3
fi
[ "$FAIL" -eq 0 ] && echo "TODOS OS TESTES PASSARAM" || { echo "FALHAS DETECTADAS"; exit 1; }
