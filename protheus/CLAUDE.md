# CLAUDE.md

Plugin Claude Code para desenvolvimento **TOTVS Protheus** (ADVPL/TLPP).

## Namespace

Skills com prefixo `protheus:` — ex: `/protheus:writer`, `/protheus:compile`



## Skills Protheus disponíveis

Para código com padrões TOTVS (notação húngara, BeginSQL, ExecBlock, MVC), prefira invocar a skill correspondente — o conhecimento específico está nelas, não no modelo genérico.

| Quando você for... | Skill recomendada |
|---|---|
| Escrever/gerar código ADVPL ou TLPP | `/protheus:writer` |
| Planejar uma feature ou novo desenvolvimento | `/protheus:brainstorm` |
| Investigar erro, log de compilação, crash | `/protheus:diagnose` |
| Revisar código existente | `/protheus:reviewer` |
| Buscar referência de função/API TOTVS | `/protheus:specialist` |
| Escrever SQL embarcado (BeginSQL/EndSQL) | `/protheus:sql` |
| Migrar ADVPL procedural para TLPP OO | `/protheus:migrate` |
| Gerar relatório SmartView/TReports (BO TLPP → Grid/Pivot/Report) | `/protheus:smartview-relatorio` |
| Gerar tela MVC (ModelDef/ViewDef/MenuDef, Modelo 1 ou 3) | `/protheus:mvc-generator` |
| Criar endpoint REST TLPP (@Get/@Post, padrão TTALK) | `/protheus:tlpp-rest-endpoint-generator` |
| Montar query SQL segura (D_E_L_E_T_, filial, índices SIX) | `/protheus:query-builder` |
| Consultar dicionário de dados (SX2/SX3/SIX/SX6…) | `/protheus:data-dictionary-lookup` |

Custo de invocar a skill: baixo (alguns segundos).
Custo de código fora do padrão: alto (retrabalho, code review, manutenção).

> O catálogo do hook `session-context.cjs` é gerado dinamicamente do frontmatter das skills — nova skill aparece sozinha no contexto de sessão.

## Convenções obrigatórias (inegociáveis)

- **Notação húngara:** `c`=char · `n`=numérico · `l`=lógico · `d`=data · `a`=array · `b`=bloco · `o`=objeto
- **Escopo explícito:** `Local` / `Static` / `Private` / `Public` — declarar no topo da função, antes de qualquer código
- **Tratamento de erros:** programação defensiva com guard clauses e verificação de retorno; `ErrorBlock` para capturar erros de runtime em chamadas críticas; **nunca usar** `BEGIN SEQUENCE`
- **Extensões:** `.prw` programa · `.tlpp` TLPP moderno

## Regra de Modelos (OBRIGATÓRIA)

| Papel | Modelo | Regra |
|-------|--------|-------|
| Dev (implementer) | **haiku** | Implementação mecânica, scaffolding, TDD |
| Review e QA | **sonnet** | Análise qualitativa, padrões, riscos |
| Opus | **NUNCA automático** | Só quando o dev solicitar. Se complexo, sugerir mas NÃO escalar |

## Agent Teams (v2.0.1)

O ciclo de implementação usa **Agent Teams** para comunicação bidirecional entre teammates.

### Pré-requisitos

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

- Claude Code **v2.1.32+**
- Agent Teams é experimental — se não disponível, fallback para subagents unidirecionais

### Como funciona

1. `/protheus:implement` cria um **Agent Team** (`protheus-impl-team`)
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
- MCP queries (`searchKnowledge`, `searchFunction`, etc.)
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
/protheus:brainstorm → MIT044/design aprovado
/protheus:plan       → plano de implementação com tasks tipadas
/protheus:implement  → Agent Team (implementer haiku + reviewers sonnet, worktree)
/protheus:deploy     → lint + compilação AppServer + patch .ptm
/protheus:qa         → testes TIR E2E + análise qualidade
/protheus:verify     → checklist TOTVS + deploy produção
```

**Atalho (mudanças ad-hoc):**
`/protheus:writer` · `/protheus:specialist` · `/protheus:compile`

**Utilitários:**
`/protheus:patterns` · `/protheus:sql` · `/protheus:migrate` · `/protheus:diagnose`



## Teammates

| Teammate | Modelo | Papel | Isolamento |
|----------|--------|-------|------------|
| protheus-implementer | haiku | Implementa tasks do plano via TDD | worktree |
| protheus-spec-reviewer | sonnet | Verifica conformidade com spec | — |
| protheus-reviewer | sonnet | Qualidade de código ADVPL/TLPP | — |
| protheus-deployer | haiku | Compila via advpls cli + gera patch | — |
| advpl-expert | sonnet | Análise especializada standalone | — |




