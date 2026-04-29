---
name: implement
description: Orquestra Agent Team para executar o plano ADVPL/TLPP — protheus-implementer (haiku) implementa em worktree isolado, protheus-spec-reviewer (sonnet) verifica spec, protheus-reviewer (sonnet) revisa qualidade. Comunicação bidirecional entre teammates. Gate de compilação via lint. Use após /protheus:plan. Próximo passo: /protheus:deploy.
disable-model-invocation: true
---

## Instruções para Claude

Leia o plano mais recente em `docs/plans/` (arquivo terminado em `-plan.md`).
Se não houver plano, recomende `/protheus:plan` primeiro.

---

## Pré-requisitos

- **Agent Teams** habilitado: `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- **Claude Code v2.1.32+**
- Plano aprovado em `docs/plans/`

Se Agent Teams não estiver habilitado, informe o usuário e caia no fallback (Estágio 1-alt).

---

## Regra de Modelos (OBRIGATÓRIA)

| Papel | Modelo | Uso |
|-------|--------|-----|
| protheus-implementer | **haiku** | Implementação mecânica, TDD |
| protheus-spec-reviewer | **sonnet** | Verificação de conformidade com spec |
| protheus-reviewer | **sonnet** | Qualidade de código ADVPL/TLPP |
| Opus | **NUNCA automático** | Se complexo, sugerir ao dev — decisão é dele |

---

## Estágio 0 — Criar Agent Team

Crie o time de implementação:

```
TeamCreate({
  name: "protheus-impl-team",
  description: "Time de implementação ADVPL/TLPP com feedback bidirecional"
})
```

Os teammates serão despachados via Agent tool com:
- `subagent_type: "protheus:protheus-implementer"` (haiku)
- `subagent_type: "protheus:protheus-spec-reviewer"` (sonnet)
- `subagent_type: "protheus:protheus-reviewer"` (sonnet)
- `isolation: "worktree"` para implementador (trabalha em cópia isolada)

---

## Estágio 1 — Implementação (teammate haiku, worktree isolado)

Para cada task de implementação do plano, despache o teammate `protheus-implementer`:

```
Agent({
  subagent_type: "protheus:protheus-implementer",
  name: "impl-task-N",
  isolation: "worktree",
  model: "haiku",
  prompt: "<conteúdo do implementer-prompt.md preenchido>"
})
```

Leia o template em `skills/implement/implementer-prompt.md` e preencha com:
- Texto completo da task
- Conteúdo do design doc
- Contexto adicional (tabelas, regras, dependências)

Tasks independentes podem rodar em paralelo (múltiplos Agent calls no mesmo bloco).
Tasks com dependência rodam em sequência.

### Tratamento de respostas:

- **DONE:** Avance para o Estágio 2
- **BLOCKED:** Analise o bloqueio. Se for dependência de outra task, reordene. Se for técnico, use SendMessage para fornecer contexto adicional ao implementador.
- **NEEDS_CONTEXT:** Responda a dúvida do implementador via SendMessage com contexto adicional.

### Fallback (sem Agent Teams):

Se Agent Teams não estiver disponível, use o padrão anterior:
- Despache via Agent tool sem TeamCreate
- Comunicação unidirecional (sem SendMessage de volta)

Aguarde conclusão de todas as tasks antes de avançar.

---

## Estágio 2 — Review Spec Compliance (teammate sonnet)

Despache o teammate `protheus-spec-reviewer`:

```
Agent({
  subagent_type: "protheus:protheus-spec-reviewer",
  name: "spec-review",
  model: "sonnet",
  prompt: "<conteúdo do spec-reviewer-prompt.md preenchido>"
})
```

Leia o template em `skills/implement/spec-reviewer-prompt.md` e preencha com:
- Lista de artefatos implementados (com caminhos — se worktree, usar o path do worktree)
- Design doc original
- Tasks do plano

**Critério de avanço:** ✅ SPEC OK em todos os artefatos.

**Se houver ❌ SPEC FALHA:**
1. Identifique as divergências
2. Envie feedback ao implementador via SendMessage com as divergências
3. Após correção, repita o review spec
4. Só avance quando todos os artefatos estiverem ✅

---

## Estágio 3 — Review Qualidade de Código (teammate sonnet)

Despache o teammate `protheus-reviewer`:

```
Agent({
  subagent_type: "protheus:protheus-reviewer",
  name: "code-review",
  model: "sonnet",
  prompt: "<conteúdo do code-reviewer-prompt.md preenchido>"
})
```

Leia o template em `skills/implement/code-reviewer-prompt.md` e preencha com:
- Lista de artefatos aprovados no spec review
- Contexto do projeto

**Critério de avanço:** `Aprovado para compilação: SIM`

**Se houver CRÍTICOs:**
- Envie feedback direto ao implementador via SendMessage
- Ciclo: corrige (implementer) → re-review → avança

---

## Estágio 4 — Lint Gate (validação local)

Antes de encaminhar para deploy, rode lint local em todos os artefatos:

```bash
advpls appre /caminho/arquivo.prw -I /caminho/includes/
```

**Critério de avanço:** zero erros tipo "0" no lint.

**Se houver erros:**
```
GATE DE LINT — fluxo interrompido

Erros do advpls appre:
[erros com arquivo + linha]

Ações necessárias:
1. Corrija os erros nos artefatos indicados
2. Repita os reviews (Estágios 2 e 3) se a correção for substancial
3. Reexecute o lint após correção
```

---

## Estágio 5 — Merge Worktree + Encerramento

Se o implementador usou worktree isolado:
1. Revise as mudanças do worktree branch
2. Merge no branch principal do projeto
3. Limpe o worktree

Quando todos os estágios passarem:

```
Implementação concluída

Artefatos implementados: [lista]
Spec review: ✅ todos conformes
Code review: Aprovado para compilação: SIM
Lint: PASS (0 erros)
Worktree: merged e limpo

Próximo passo: /protheus:deploy
```

### Sobre complexidade

Se durante a implementação identificar que uma task é complexa demais para haiku:
```
⚠️ Task [N] pode se beneficiar do modelo opus para [motivo].
Deseja escalar este task para opus? (decisão do dev)
```

**Nunca escalar automaticamente.** A decisão é sempre do desenvolvedor.

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
