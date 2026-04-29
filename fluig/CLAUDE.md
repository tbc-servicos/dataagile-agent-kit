# CLAUDE.md

Plugin Claude Code para desenvolvimento **TOTVS Fluig** v2.0.1.

## Namespace

Skills com prefixo `fluig:` — ex: `/fluig:widget`, `/fluig:dataset`

## Testar localmente

```bash
claude --plugin-dir /home/jv/developments/tbc/claude_skills/fluig
```

## Convenções obrigatórias

- **Prefixos:** `wg_` widget · `ds_` dataset · `wf_` workflow · formulários com ID de 6 dígitos
- **Stack Angular:** 19.0.0 + PO-UI 19.36.0 — nunca Angular Material puro
- **Notificações:** sempre `Swal.fire()` — nunca `alert()` nativo
- **Erros:** sempre `try/catch` em todo acesso a dados — nunca catch vazio

## Regra de Modelos (OBRIGATÓRIA)

| Papel | Modelo | Regra |
|-------|--------|-------|
| **Dev (implementer)** | haiku | Implementação mecânica, scaffolding |
| **Review (spec + quality)** | sonnet | Análise qualitativa, padrões |
| **QA (testes + análise)** | sonnet | Riscos, edge cases |
| **Opus** | **NUNCA automático** | Só quando o dev solicitar explicitamente. Se a task for complexa, o orquestrador SUGERE mas a decisão é do dev |

**O plugin NUNCA deve escalar para opus por conta própria. Sempre perguntar.**

## Agent Teams (v2.0.1)

O ciclo de implementação usa **Agent Teams** para comunicação bidirecional entre teammates.

### Pré-requisitos

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

- Claude Code **v2.1.32+**
- Agent Teams é experimental — se não disponível, fallback para subagents unidirecionais

### Como funciona

1. `/fluig:implement` cria um **Agent Team** (`fluig-impl-team`)
2. Teammates são despachados com papéis específicos
3. Cada teammate pode **enviar mensagens a outros teammates** (bidirecional)
4. Implementador opera em **worktree isolado** — mudanças não afetam workspace principal
5. Reviewers enviam **feedback direto** ao implementador para correções

### Benefícios vs subagents tradicionais

- Implementador resolve problemas sozinho com feedback do reviewer (sem redespacho)
- Worktree evita conflitos entre tasks paralelas
- Contexto compartilhado via task list do time

## Estratégia Anti-Compactação (4 camadas)

### Camada 1 — Sempre presente (preloaded)
- CLAUDE.md, skills preloaded, hooks do plugin
- Custo: ~2K tokens fixos

### Camada 2 — Sob demanda (0 tokens até chamada)
- MCP queries (`searchFluigPatterns`, `searchFluigApi`, etc.)
- Consultas ao RAG de documentação

### Camada 3 — Compactável (contexto de trabalho)
- Código da task atual, feedback de review, cadeia de raciocínio
- Compactado pelo `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`

### Camada 4 — Persistente (fora do contexto)
- Agent memory files (`.claude/memory/`)
- Git commits e worktree branches
- Beads state (`.beads/`)

### Configuração recomendada

```bash
# Compactar a 50% em vez de 95% — compactações menores e mais frequentes perdem menos
export CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50
```

## Ciclo de Desenvolvimento

```
/fluig:brainstorm  →  design aprovado
    ↓
/fluig:plan        →  plano de implementação
    ↓
/fluig:implement   →  Agent Team (implementer haiku, worktree + reviewers sonnet)
    ↓
/fluig:deploy      →  deploy no servidor Fluig
    ↓
/fluig:qa          →  testes E2E + análise de qualidade
    ↓
/fluig:verify      →  checklist + deploy produção
```

Cada skill guia para a próxima — o dev é conduzido pelo fluxo completo.

## Teammates

| Teammate | Modelo | Papel | Isolamento |
|----------|--------|-------|------------|
| `fluig-implementer` | haiku | Implementa tasks do plano (TDD) | worktree |
| `fluig-spec-reviewer` | sonnet | Verifica spec compliance | — |
| `fluig-reviewer` | sonnet | Verifica code quality | — |
| `fluig-qa` | sonnet | Análise de riscos e QA | — |
| `fluig-deployer` | haiku | Deploy via SSH ou REST API | — |

## Distribuição

`https://github.com/tbc-servicos/tbc-knowledge-plugins.git` · marketplace `claude-skills-tbc`
