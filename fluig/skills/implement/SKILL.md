---
name: implement
description: Orquestra Agent Team para executar plano Fluig — fluig-implementer (haiku) implementa em worktree isolado, fluig-spec-reviewer (sonnet) verifica spec, fluig-reviewer (sonnet) revisa qualidade. Comunicação bidirecional entre teammates. Próximo passo obrigatório: /fluig:deploy.
disable-model-invocation: true
---

Você vai orquestrar a execução do plano de implementação Fluig através de um **Agent Team** com comunicação bidirecional.

## HARD GATE

Não proceda se:
1. O plano de implementação NÃO foi criado em `/fluig:plan`
2. O plano NÃO foi lido e aprovado

Se algum desses pontos faltar, peça ao usuário para primeiro executar `/fluig:plan`.

## Pré-requisitos

- **Agent Teams** habilitado: `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- **Claude Code v2.1.32+**
- Plano aprovado em `docs/fluig/plans/`

Se Agent Teams não estiver habilitado, informe o usuário e caia no fallback (subagents unidirecionais).

## Regra de Modelos (OBRIGATÓRIA)

| Papel | Modelo | Uso |
|-------|--------|-----|
| fluig-implementer | **haiku** | Implementação mecânica, TDD |
| fluig-spec-reviewer | **sonnet** | Verificação de conformidade com spec |
| fluig-reviewer | **sonnet** | Qualidade de código Fluig |
| Opus | **NUNCA automático** | Se complexo, sugerir ao dev — decisão é dele |

## Estágio 0 — Criar Agent Team

Crie o time de implementação:

```
TeamCreate({
  name: "fluig-impl-team",
  description: "Time de implementação Fluig com feedback bidirecional"
})
```

Os teammates serão despachados via Agent tool com:
- `subagent_type: "fluig:fluig-implementer"` (haiku)
- `subagent_type: "fluig:fluig-spec-reviewer"` (sonnet)
- `subagent_type: "fluig:fluig-reviewer"` (sonnet)
- `isolation: "worktree"` para implementador (trabalha em cópia isolada)

## Passo 1 — Ler plano e extrair tasks

Solicite ao usuário o caminho para o plano (ex: `docs/fluig/plans/YYYY-MM-DD-<funcionalidade>.md`).

Leia o arquivo e extraia:
- **Lista completa de tasks** (com checkbox syntax)
- **Cada task:** descrição, arquivos, ciclo TDD, comandos, mensagem de commit esperada
- **Dependências entre tasks** (qual executa antes)

## Passo 2 — Loop por task

Para cada task na ordem de dependência:

### 2a. Dispatch para fluig-implementer (haiku, worktree isolado)

```
Agent({
  subagent_type: "fluig:fluig-implementer",
  name: "impl-task-N",
  isolation: "worktree",
  model: "haiku",
  prompt: "<conteúdo de implementer-prompt.md preenchido>"
})
```

Tasks independentes podem rodar em paralelo (múltiplos Agent calls no mesmo bloco).

Aguarde resposta. Possíveis status:
- **DONE** — task implementada, testes passam
- **NEEDS_CONTEXT** — responda via SendMessage com informação solicitada
- **BLOCKED** — investigue, forneça contexto ou escale ao usuário

### 2b. Dispatch para fluig-spec-reviewer (sonnet)

```
Agent({
  subagent_type: "fluig:fluig-spec-reviewer",
  name: "spec-review",
  model: "sonnet",
  prompt: "<conteúdo de spec-reviewer-prompt.md preenchido>"
})
```

**Se NÃO CONFORME:**
1. Envie feedback ao implementador via SendMessage com as divergências
2. Após correção, repita o review spec
3. Itere até **CONFORME**

### 2c. Dispatch para fluig-reviewer (sonnet)

```
Agent({
  subagent_type: "fluig:fluig-reviewer",
  name: "code-review",
  model: "sonnet",
  prompt: "<conteúdo de code-reviewer-prompt.md preenchido>"
})
```

**Se CRÍTICO:**
1. Envie feedback direto ao implementador via SendMessage
2. Após correção, re-revise
3. Itere até **APROVADO**

### 2d. Marcar task completa

```
- [x] Task [N]: [descrição] ✅
```

## Passo 3 — Merge Worktree + Encerramento

Se o implementador usou worktree isolado:
1. Revise as mudanças do worktree branch
2. Merge no branch principal do projeto
3. Limpe o worktree

Quando todas as tasks estiverem ✅:

### 3a. Validação final global

Dispatch `fluig-reviewer` para validação de todos os artefatos juntos.

### 3b. Anunciar conclusão

```
Implementação concluída

Resultado:
- [N] tasks executadas
- [N] commits criados
- [X]% cobertura de testes
- Todos os artefatos aprovados
- Worktree: merged e limpo

Próximo passo: /fluig:deploy
```

## RED FLAGS (nunca ignore)

- **Nunca skip reviews** — implementação sempre passa por spec-reviewer E code-reviewer
- **Nunca prossiga com itens CRÍTICOS** — espere correção ou escale ao usuário
- **Nunca ignore falhas de teste** — 100% testes passam antes de review
- **Nunca escale para opus automaticamente** — sugerir mas decisão é do dev

## Fallback (sem Agent Teams)

Se Agent Teams não estiver disponível:
- Despache via Agent tool sem TeamCreate
- Comunicação unidirecional (sem SendMessage de volta)
- Mesmo fluxo de estágios, mas sem feedback bidirecional

---

## Templates de dispatch

Veja os arquivos:
- `skills/implement/implementer-prompt.md` — template para haiku
- `skills/implement/spec-reviewer-prompt.md` — template para sonnet validação spec
- `skills/implement/code-reviewer-prompt.md` — template para sonnet validação código

## Consulta de Conhecimento

```
searchKnowledge({ keyword: "<termo relevante>" })
```
