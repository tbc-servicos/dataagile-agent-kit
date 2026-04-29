# Design: Hook de Encoding CP-1252 para Arquivos ADVPL/TLPP

**Data:** 2026-03-06
**Status:** Aprovado

## Problema

Arquivos `.prw` e `.tlpp` devem ser salvos em CP-1252 (Windows-1252) para compilação correta no Protheus. Claude Code salva arquivos em UTF-8 por padrão, o que causa falhas de compilação quando há caracteres acentuados.

## Solução

Dois hooks complementares:

1. **PostToolUse hook** (`advpl-encoding.sh`) — detecta e corrige durante edição
2. **Git pre-commit hook** (`pre-commit-encoding.sh`) — bloqueia commits com encoding errado

## Arquitetura

### 1. advpl-encoding.sh (PostToolUse)

- Roda após cada Write/Edit em `.prw` e `.tlpp`
- Lê o caminho do arquivo do JSON de entrada (mesmo padrão do `advpl-lint.sh`)
- Detecta UTF-8 e converte automaticamente para CP-1252 via `iconv`
- Se houver caracteres fora do CP-1252: reporta linhas problemáticas e sai com `exit 2` (bloqueia o Claude)

### 2. pre-commit-encoding.sh (Git pre-commit)

- Verifica apenas arquivos `.prw`/`.tlpp` staged (`git diff --cached --name-only`)
- Mesma lógica de detecção e bloqueio
- Instalado no projeto cliente via `protheus-init-project`

### 3. hooks.json

Adiciona segunda entrada no `PostToolUse` para `advpl-encoding.sh` (mesmo matcher `Write|Edit`).

### 4. protheus-init-project

Adiciona instrução de instalação do git hook:
```bash
cp .claude/pre-commit-encoding.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## Logica de Deteccao

```
arquivo .prw/.tlpp
     |
tem bytes > 0x7F?  -> NAO -> ASCII puro, OK
     | SIM
decodifica como UTF-8 valido?  -> NAO -> ja e CP-1252
     | SIM
tenta iconv UTF-8 -> CP1252
     |
sucesso? -> SIM -> converte in-place, reporta (auto-fix)
     | NAO
reporta linhas com chars invalidos, exit 2 (bloqueia)
```

## Ferramentas Utilizadas

- `python3` - deteccao de encoding (try/except UTF-8 decode)
- `iconv -f UTF-8 -t CP1252` - conversao de encoding
- Compativel com Linux e macOS

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `protheus/hooks/advpl-encoding.sh` | Criar |
| `protheus/hooks/pre-commit-encoding.sh` | Criar |
| `protheus/hooks/hooks.json` | Atualizar |
| `protheus/skills/protheus-init-project/SKILL.md` | Atualizar (instrucao de instalacao) |
