---
name: init-project
description: Inicializa um projeto Fluig — entrevista o desenvolvedor e gera CLAUDE.md com contexto do cliente (URL servidor, prefixos, ambiente, integração Protheus). Invoque explicitamente ao iniciar projeto novo: /fluig:init-project
disable-model-invocation: true
---

Você está iniciando um projeto Fluig para um cliente. Colete as informações necessárias e gere o `CLAUDE.md` do projeto.

## Passo 0 — Contexto Git

Antes de qualquer ação, identifique o contexto do repositório:

> **Comportamento padrão:** Pode mencionar Claude, IA e ferramentas de automação normalmente. A exceção está documentada no Modo Cliente abaixo.

```bash
# Verificar se é repositório git
git rev-parse --is-inside-work-tree 2>/dev/null || { echo "NÃO É GIT"; exit 0; }

# Verificar remote
REMOTE_URL=$(git remote get-url origin 2>/dev/null || git remote get-url $(git remote | head -1) 2>/dev/null)
echo "$REMOTE_URL"
```

| Resultado | Contexto |
|-----------|----------|
| Diretório não é um repositório git | **Não é git** — bloquear |
| Nenhum remote configurado | **Sem remote** — bloquear |
| URL contém `github.com/tbc-servicos/tbc-knowledge-plugins` ou legado `bitbucket.org/fabricatbc` | **Modo TBC** |
| Qualquer outro remote | **Modo Cliente** |

### Se não é repositório git ou sem remote

Bloquear e orientar:

**Não é repositório git:**
  git init
  git remote add origin <url>

**Remote não configurado:**
  git remote add origin <url>

Confirme o setup antes de continuar.

### Modo TBC (github.com/tbc-servicos/tbc-knowledge-plugins)

**Após o Passo 3 (CLAUDE.md gerado)**, commitar os artefatos:

```bash
git add .claude/ CLAUDE.md
git commit -m "chore: init projeto Fluig — configuração Claude Code"
```

### Modo Cliente (repositório externo)

- **Nunca mencionar** IA, Claude, automação ou ferramentas de AI em qualquer saída: commits, PRs, mensagens, comentários ou instruções ao developer
- Commits **sem** footer `Co-Authored-By:`
- **Após o Passo 3 (CLAUDE.md gerado)**, adicionar ao `.gitignore`:

```
# Internal tooling
.claude/
CLAUDE.md
```

E commitar apenas o `.gitignore`:

```bash
git add .gitignore
git commit -m "chore: add internal tooling to .gitignore"
```

---

## Passo 1 — Entrevista

Use a ferramenta `AskUserQuestion` para coletar (em uma única chamada com múltiplas perguntas):

1. Nome do cliente/projeto (ex: CASSI, Bradesco, TBC Intranet)
2. URL do servidor Fluig (ex: http://fluig.empresa.com.br)
3. Prefixo de artefatos (2-5 letras, ex: cas, brad, tbc) — usado em wg_, ds_, wf_
4. Tem integração com Protheus? Se sim, qual URL da API REST do Protheus?
5. Ambiente padrão de trabalho (desenvolvimento / homologação / produção)

## Passo 2 — Gerar CLAUDE.md

Crie `CLAUDE.md` na raiz do projeto. Inclua apenas o que as skills não cobrem — contexto do cliente e decisões de equipe:

```markdown
# CLAUDE.md — [NOME_CLIENTE]

## Ambiente

- Fluig: `[URL_FLUIG]` · Ambiente: `[AMBIENTE]`
[SE_PROTHEUS_SIM]
- Protheus API: `[URL_PROTHEUS]`
[/SE_PROTHEUS_SIM]

## Artefatos

Prefixo do cliente: `[PREFIXO]` — usado em `wg_[PREFIXO]_`, `ds_[PREFIXO]_`, `wf_[PREFIXO]_`

## Regra de Modelos (OBRIGATÓRIA)

| Papel | Modelo | Regra |
|-------|--------|-------|
| Dev (implementer) | **haiku** | Implementação mecânica, scaffolding |
| Review e QA | **sonnet** | Análise qualitativa, padrões, riscos |
| Opus | **NUNCA automático** | Só quando o dev solicitar. Se complexo, sugerir mas NÃO escalar |

## Ciclo de Desenvolvimento

```
/fluig:brainstorm → design
/fluig:plan       → plano de implementação
/fluig:implement  → teammates (implementer haiku + reviewers sonnet)
/fluig:deploy     → deploy servidor teste
/fluig:qa         → testes E2E + análise QA
/fluig:verify     → checklist + deploy produção
```

**Scaffolding (dentro do implement):**
`/fluig:widget` · `/fluig:dataset` · `/fluig:form` · `/fluig:workflow`

**Atalho (mudanças ad-hoc):**
`/fluig:review` → executa pipeline completo (review → deploy → qa)

```bash
claude plugin update fluig@claude-skills-tbc
```
```

## Passo 3 — Orientar próximos passos

```
✅ CLAUDE.md criado para [NOME_CLIENTE].

  # Modo TBC: já commitado após Passo 3 (CLAUDE.md gerado). Sem ação adicional.
  # Modo Cliente: CLAUDE.md está no .gitignore. Sem ação adicional.

Para iniciar o desenvolvimento:
  /fluig:brainstorm → planejar o design (SEMPRE primeiro)
  /fluig:plan       → criar plano de implementação
  /fluig:implement  → executar com teammates (haiku dev + sonnet review)
  /fluig:deploy     → deploy no servidor de teste
  /fluig:qa         → testes E2E + análise de qualidade
  /fluig:verify     → deploy final com checklist

Atalho para mudanças rápidas:
  /fluig:review → pipeline completo (review + deploy + qa)
```

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
