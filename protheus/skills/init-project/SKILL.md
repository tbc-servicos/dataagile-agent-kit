---
name: init-project
description: Inicializa um projeto Protheus ADVPL — explora o projeto existente, entrevista o desenvolvedor e gera CLAUDE.md com configuração do cliente (AppServer, ambiente, prefixo de tabelas).
disable-model-invocation: true
---

## Passo 0 — Contexto Git

Antes de qualquer ação, identifique o contexto do repositório via MCP: `searchKnowledge({ skill: "protheus-init-project", keyword: "git context" })`

## Passo 1 — Explorar o projeto

Antes de qualquer pergunta, percorra o projeto para entender o que já existe.

```bash
# Estrutura geral
find . -not -path './.git/*' -not -path './node_modules/*' | sort

# Fontes ADVPL/TLPP existentes
find . -name "*.prw" -o -name "*.tlpp" | sort

# CLAUDE.md já existe?
cat CLAUDE.md 2>/dev/null

# Commits recentes
git log --oneline -10 2>/dev/null

# MIT043 — registro de customizações
find . -name "MIT043*" | head -5
```

Com base no que encontrar, identifique:
- **Padrão de nomenclatura** em uso (`R[MOD][TYPE][SEQ]` ou outro)
- **Módulos** já desenvolvidos (FAT, FIN, EST, COM…)
- **Prefixo de tabelas** customizadas (ex: `ZZ_`, `CX_`)
- **Namespace** TLPP, se houver
- Se o projeto já tem `CLAUDE.md` configurado → **pular direto ao Passo 4**

---

## Passo 2 — Entrevista

Use `AskUserQuestion` para coletar as informações do ambiente (apenas o que não encontrou no Passo 1):

1. Nome do cliente/projeto (ex: AcmeCorp, ContosoSA)
2. Host do AppServer (ex: srv1234567.exemplo.com.br ou IP)
3. Porta do AppServer (ex: 1234)
4. Nome do Environment/Ambiente (ex: P12, ENV_PROD)
5. Prefixo de tabelas customizadas (ex: `CX_`, `ZZ_`) — vazio se padrão TOTVS
6. Usuário TDS para compilação (ex: admin)
7. Diretório de includes do AppServer (ex: `/opt/protheus/include/`)

---

## Passo 3 — Gerar CLAUDE.md

Crie `CLAUDE.md` na raiz do projeto. Consulte o template via MCP: `searchKnowledge({ skill: "protheus-init-project", keyword: "claude md template" })`

---

## Passo 4 — Configurar email para o MCP remoto

O MCP `tbc-knowledge` autentica via `x-user-email`. Configure o email do desenvolvedor:

**Opção A — variável de ambiente (recomendada):**
```bash
# Adicionar ao ~/.bashrc ou ~/.zshrc:
export DATAAGILE_USER_EMAIL=seu.email@empresa.com.br
```

**Opção B — arquivo de config:**
```bash
mkdir -p ~/.config/dataagile
echo '{"email":"seu.email@empresa.com.br"}' > ~/.config/dataagile/dev-config.json
```

> Trial 30d automático no primeiro acesso. Para contratar, acesse https://mcp.totvstbc.com.br/payment

---

## Passo 5 — Verificar binário advpls

Consulte os comandos de detecção via MCP: `searchKnowledge({ skill: "protheus-init-project", keyword: "binary detection" })`

### Hook de encoding CP-1252

> Este passo se aplica tanto ao **Modo TBC** quanto ao **Modo Cliente**. O hook reside em `.git/hooks/` (local, não versionado) e não é afetado pela política de `.gitignore` do Modo Cliente.

Instale o hook git para bloquear commits com encoding errado em `.prw` e `.tlpp`:

```bash
cp "$(claude plugin path protheus)/hooks/pre-commit-encoding.sh" .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Confirme a instalação:

```bash
ls -la .git/hooks/pre-commit
```

---

## Passo 6 — Orientar próximos passos

```
✅ Projeto [NOME_CLIENTE] Protheus configurado!

  # Modo TBC: já commitado após Passo 3. Sem ação adicional.
  # Modo Cliente: CLAUDE.md está no .gitignore. Sem ação adicional.

Para iniciar o desenvolvimento:
  /protheus:brainstorm → planejar o design (SEMPRE primeiro)
  /protheus:plan       → criar plano de implementação
  /protheus:implement  → executar com teammates (haiku dev + sonnet review)
  /protheus:deploy     → lint + compilação AppServer + patch .ptm
  /protheus:qa         → testes TIR E2E + análise qualidade
  /protheus:verify     → checklist TOTVS + deploy produção

Atalho para mudanças rápidas:
  /protheus:writer     → geração direta de código
  /protheus:specialist → análise especializada + geração
```

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
