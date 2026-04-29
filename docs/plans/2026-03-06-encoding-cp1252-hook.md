# Hook de Encoding CP-1252 para ADVPL/TLPP — Plano de Implementacao

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Garantir que arquivos `.prw` e `.tlpp` sejam sempre salvos em CP-1252, com auto-conversao UTF-8→CP-1252 durante edicao e bloqueio no git commit.

**Architecture:** Dois hooks complementares: (1) PostToolUse (`advpl-encoding.sh`) que roda apos cada Write/Edit e converte automaticamente; (2) git pre-commit (`pre-commit-encoding.sh`) que bloqueia commits com encoding errado. O hook PostToolUse e registrado em `hooks.json`; o git hook e instalado manualmente no projeto cliente via instrucao adicionada ao `protheus-init-project`.

**Tech Stack:** bash, python3 (deteccao de encoding), iconv (conversao), jq (parse do input JSON do Claude Code hook)

---

### Task 1: Criar worktree isolado para o hotfix

**Files:**
- Worktree: `.worktrees/hotfix-encoding-cp1252`

**Step 1: Verificar que .worktrees esta no gitignore**

```bash
git check-ignore -q .worktrees && echo "OK — ignorado"
```

Esperado: `OK — ignorado`

**Step 2: Criar o worktree**

```bash
git worktree add .worktrees/hotfix-encoding-cp1252 -b hotfix/encoding-cp1252
```

Esperado: `Preparing worktree (new branch 'hotfix/encoding-cp1252')`

**Step 3: Verificar baseline**

```bash
cd .worktrees/hotfix-encoding-cp1252
git log --oneline -3
ls protheus/hooks/
```

Esperado: ver `advpl-lint.sh` e `hooks.json`.

---

### Task 2: Criar advpl-encoding.sh (PostToolUse hook)

**Files:**
- Create: `.worktrees/hotfix-encoding-cp1252/protheus/hooks/advpl-encoding.sh`

**Step 1: Criar o script**

```bash
cat > .worktrees/hotfix-encoding-cp1252/protheus/hooks/advpl-encoding.sh << 'EOF'
#!/usr/bin/env bash
# advpl-encoding.sh — Garante encoding CP-1252 em arquivos .prw e .tlpp
# Lê o input do hook via stdin (JSON do Claude Code)

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""' 2>/dev/null)

# Só actua em .prw e .tlpp
[[ "$FILE" == *.prw ]] || [[ "$FILE" == *.tlpp ]] || exit 0
[[ -f "$FILE" ]] || exit 0

BASENAME=$(basename "$FILE")

if ! command -v python3 &>/dev/null; then
  echo "⚠️  ENCODING: python3 não encontrado. Verifique o encoding manualmente."
  exit 0
fi

# Detecta se o arquivo está em UTF-8 (não ASCII puro)
RESULT=$(python3 - "$FILE" <<'PYEOF'
import sys

filepath = sys.argv[1]

with open(filepath, 'rb') as f:
    data = f.read()

# Arquivo vazio ou ASCII puro — OK
if not data or all(b < 128 for b in data):
    print("OK")
    sys.exit(0)

# UTF-8 com BOM
if data.startswith(b'\xef\xbb\xbf'):
    print("UTF8")
    sys.exit(0)

# Tentar decodificar como UTF-8
try:
    data.decode('utf-8')
    print("UTF8")
except UnicodeDecodeError:
    # Falhou UTF-8 — já é CP-1252 (ou ASCII estendido single-byte)
    print("OK")
PYEOF
)

if [[ "$RESULT" == "OK" ]]; then
  exit 0
fi

# É UTF-8 — tentar converter para CP-1252
TMPFILE=$(mktemp)

if iconv -f UTF-8 -t CP1252 "$FILE" > "$TMPFILE" 2>/dev/null; then
  mv "$TMPFILE" "$FILE"
  echo "✅ ENCODING: $BASENAME convertido UTF-8 → CP-1252"
  exit 0
fi

rm -f "$TMPFILE"

# Conversão impossível — reportar caracteres problemáticos
PROBLEM_CHARS=$(python3 - "$FILE" <<'PYEOF'
import sys

filepath = sys.argv[1]
problems = []

with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
    for lineno, line in enumerate(f, 1):
        for char in line:
            if ord(char) > 127:
                try:
                    char.encode('cp1252')
                except (UnicodeEncodeError, LookupError):
                    problems.append(f"  linha {lineno}: '{char}' (U+{ord(char):04X})")

for p in problems[:10]:
    print(p)
if len(problems) > 10:
    print(f"  ... e mais {len(problems) - 10} ocorrência(s)")
PYEOF
)

echo "❌ ENCODING: $BASENAME contém caracteres fora do CP-1252:"
echo "$PROBLEM_CHARS"
echo ""
echo "Substitua por equivalentes CP-1252 antes de continuar."
exit 2
EOF
chmod +x .worktrees/hotfix-encoding-cp1252/protheus/hooks/advpl-encoding.sh
```

**Step 2: Verificar que o script e executavel e tem a estrutura correta**

```bash
head -5 .worktrees/hotfix-encoding-cp1252/protheus/hooks/advpl-encoding.sh
ls -la .worktrees/hotfix-encoding-cp1252/protheus/hooks/advpl-encoding.sh
```

Esperado: shebang `#!/usr/bin/env bash` e permissao `-rwxr-xr-x`.

**Step 3: Testar deteccao com arquivo UTF-8**

```bash
# Criar arquivo de teste temporario com caractere acentuado em UTF-8
printf '// teste\nLocal cNome := "João"\n' > /tmp/test_encoding.prw

# Simular input do hook
echo '{"tool_input":{"file_path":"/tmp/test_encoding.prw"}}' \
  | .worktrees/hotfix-encoding-cp1252/protheus/hooks/advpl-encoding.sh

# Verificar que foi convertido para CP-1252
python3 -c "
with open('/tmp/test_encoding.prw', 'rb') as f:
    data = f.read()
try:
    data.decode('utf-8')
    print('FALHOU: ainda UTF-8')
except UnicodeDecodeError:
    print('OK: convertido para CP-1252')
"
```

Esperado: `✅ ENCODING: test_encoding.prw convertido UTF-8 → CP-1252` e depois `OK: convertido para CP-1252`.

**Step 4: Testar que arquivo ja CP-1252 nao e alterado**

```bash
# Criar arquivo ja em CP-1252
printf '// teste\n' > /tmp/test_ascii.prw
echo '{"tool_input":{"file_path":"/tmp/test_ascii.prw"}}' \
  | .worktrees/hotfix-encoding-cp1252/protheus/hooks/advpl-encoding.sh
echo "Exit code: $?"
```

Esperado: sem saida, exit code 0.

**Step 5: Testar bloqueio com caractere fora do CP-1252**

```bash
# Criar arquivo com emoji (fora do CP-1252)
printf '// teste\nLocal cMsg := "Hello 🌍"\n' > /tmp/test_emoji.prw
echo '{"tool_input":{"file_path":"/tmp/test_emoji.prw"}}' \
  | .worktrees/hotfix-encoding-cp1252/protheus/hooks/advpl-encoding.sh
echo "Exit code: $?"
```

Esperado: mensagem com `❌ ENCODING:` mostrando a linha e o emoji, exit code 2.

**Step 6: Limpar arquivos temporarios**

```bash
rm -f /tmp/test_encoding.prw /tmp/test_ascii.prw /tmp/test_emoji.prw
```

---

### Task 3: Atualizar hooks.json

**Files:**
- Modify: `.worktrees/hotfix-encoding-cp1252/protheus/hooks/hooks.json`

**Step 1: Adicionar entrada para advpl-encoding.sh**

Conteudo atual do `hooks.json`:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/advpl-lint.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

Novo conteudo (adicionar segundo hook no mesmo matcher):
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/advpl-encoding.sh",
            "timeout": 10
          },
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/advpl-lint.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

Nota: `advpl-encoding.sh` vem ANTES do lint — corrige o encoding antes de lint analisar o arquivo.

**Step 2: Verificar JSON valido**

```bash
python3 -m json.tool .worktrees/hotfix-encoding-cp1252/protheus/hooks/hooks.json > /dev/null && echo "JSON valido"
```

Esperado: `JSON valido`.

---

### Task 4: Criar pre-commit-encoding.sh (git hook)

**Files:**
- Create: `.worktrees/hotfix-encoding-cp1252/protheus/hooks/pre-commit-encoding.sh`

**Step 1: Criar o script**

```bash
cat > .worktrees/hotfix-encoding-cp1252/protheus/hooks/pre-commit-encoding.sh << 'EOF'
#!/usr/bin/env bash
# pre-commit-encoding.sh — Verifica encoding CP-1252 em .prw e .tlpp antes do commit
#
# Instalacao no projeto:
#   cp .claude/pre-commit-encoding.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit

ERRORS=()

if ! command -v python3 &>/dev/null; then
  echo "⚠️  ENCODING: python3 não encontrado. Verifique o encoding manualmente."
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

while IFS= read -r FILE; do
  [[ -f "$FILE" ]] || continue
  RESULT=$(detect_encoding "$FILE")
  [[ "$RESULT" != "OK" ]] && ERRORS+=("$FILE")
done < <(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(prw|tlpp)$')

if [[ ${#ERRORS[@]} -eq 0 ]]; then
  exit 0
fi

echo "❌ ENCODING: arquivos staged com encoding UTF-8 (deve ser CP-1252):"
for f in "${ERRORS[@]}"; do
  echo "   $f"
done
echo ""
echo "Corrija com:"
echo "  iconv -f UTF-8 -t CP1252 arquivo.prw > /tmp/fixed && mv /tmp/fixed arquivo.prw"
echo "  git add arquivo.prw"
exit 1
EOF
chmod +x .worktrees/hotfix-encoding-cp1252/protheus/hooks/pre-commit-encoding.sh
```

**Step 2: Verificar executavel**

```bash
ls -la .worktrees/hotfix-encoding-cp1252/protheus/hooks/pre-commit-encoding.sh
```

Esperado: `-rwxr-xr-x`.

**Step 3: Testar o script simulando staged files**

O script usa `git diff --cached`, entao o teste manual e feito indiretamente.
Verificar que a logica de deteccao funciona:

```bash
# Criar arquivo UTF-8 temporario
printf '// teste\nLocal cNome := "Ação"\n' > /tmp/test_staged.prw

# Testar funcao de deteccao isolada
python3 - /tmp/test_staged.prw <<'PYEOF'
import sys
filepath = sys.argv[1]
with open(filepath, 'rb') as f:
    data = f.read()
if not data or all(b < 128 for b in data):
    print("OK")
elif data.startswith(b'\xef\xbb\xbf'):
    print("UTF8")
else:
    try:
        data.decode('utf-8')
        print("UTF8")
    except UnicodeDecodeError:
        print("OK")
PYEOF

rm -f /tmp/test_staged.prw
```

Esperado: `UTF8`.

---

### Task 5: Atualizar protheus-init-project com instrucao do git hook

**Files:**
- Modify: `.worktrees/hotfix-encoding-cp1252/protheus/skills/protheus-init-project/SKILL.md`

**Step 1: Adicionar instrucao de instalacao do git hook no Passo 4**

Localizar o Passo 4 (verificar binario advpls, linha ~172) e adicionar instrucao de instalacao do git hook apos a verificacao do advpls.

Adicionar apos a instrucao de instalacao do `advpls` (antes do `---` que separa Passo 4 do Passo 5):

```markdown
### Hook de encoding CP-1252

Instale o hook git para bloquear commits com encoding errado:

```bash
cp "$(claude plugin path protheus)/hooks/pre-commit-encoding.sh" .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Isso garante que nenhum arquivo `.prw` ou `.tlpp` com UTF-8 entre no repositorio.
```

**Step 2: Verificar que a edicao nao quebrou a estrutura do arquivo**

```bash
grep -n "Passo [0-9]" .worktrees/hotfix-encoding-cp1252/protheus/skills/protheus-init-project/SKILL.md
```

Esperado: ver Passos 0, 1, 2, 3, 4, 5 na ordem correta.

---

### Task 6: Commit e verificacao final

**Files:**
- All modified/created files in worktree

**Step 1: Verificar todos os arquivos criados/modificados**

```bash
cd .worktrees/hotfix-encoding-cp1252
git status
git diff --stat
```

Esperado: ver `advpl-encoding.sh` (new), `pre-commit-encoding.sh` (new), `hooks.json` (modified), `protheus-init-project/SKILL.md` (modified).

**Step 2: Commit**

```bash
cd .worktrees/hotfix-encoding-cp1252
git add protheus/hooks/advpl-encoding.sh \
        protheus/hooks/pre-commit-encoding.sh \
        protheus/hooks/hooks.json \
        protheus/skills/protheus-init-project/SKILL.md
git commit -m "$(cat <<'EOF'
feat(protheus): hook de encoding CP-1252 para arquivos ADVPL/TLPP

- advpl-encoding.sh: PostToolUse hook que detecta UTF-8 e converte
  automaticamente para CP-1252; bloqueia se houver chars fora do CP-1252
- pre-commit-encoding.sh: git hook que verifica staged .prw/.tlpp
- hooks.json: advpl-encoding.sh adicionado antes do advpl-lint.sh
- protheus-init-project: instrucao de instalacao do git hook

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

**Step 3: Verificar commit**

```bash
cd .worktrees/hotfix-encoding-cp1252
git log --oneline -3
git show --stat HEAD
```

Esperado: commit com os 4 arquivos listados.

---

### Task 7: Finishing — merge ou PR

Invocar o skill `superpowers:finishing-a-development-branch` para decidir entre merge direto ou pull request.
