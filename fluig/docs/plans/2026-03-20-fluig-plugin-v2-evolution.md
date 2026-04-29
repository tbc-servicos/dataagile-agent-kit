# Plano: Evolução Fluig Plugin v2.0.0

**Data:** 2026-03-20
**Objetivo:** Incorporar padrões Superpowers no plugin Fluig, com fluxo guiado por skills e execução via teammates.

## Novo Fluxo (cada skill guia para a próxima)

```
/fluig:brainstorm  →  "Próximo: /fluig:plan"
    ↓
/fluig:plan        →  "Próximo: /fluig:implement"
    ↓
/fluig:implement   →  (teammates: implementer + spec-reviewer + reviewer)
    ↓                  "Próximo: /fluig:deploy"
/fluig:deploy      →  deploy no servidor Fluig
    ↓                  "Próximo: /fluig:qa"
/fluig:qa          →  testes integração + E2E (Playwright)
    ↓                  "Próximo: /fluig:verify"
/fluig:verify      →  checklist produção + deploy final
```

**Regra:** Cada skill DEVE terminar com bloco "Próximo passo" indicando a skill seguinte.

## Requisitos Especiais

1. **Deploy ANTES do QA** — Fluig precisa estar rodando para testes E2E e integração
2. **Teammates (SendMessage)** — NÃO subagents (Task). Teammates têm identidade nomeada
3. **README.md atualizado** — refletir o que o plugin entrega no v2.0.0
4. **Aderência guiada** — brainstorm conduz o dev por todo o fluxo

## Hierarquia de Modelos (Team)

| Papel | Modelo | Justificativa |
|-------|--------|---------------|
| **Team Leader** | sonnet (orquestrador) | Coordena o fluxo, toma decisões de arquitetura |
| **Dev (implementer)** | haiku | Implementação mecânica, scaffolding, 1-2 arquivos por vez |
| **Review (spec + code quality)** | sonnet | Precisa de julgamento qualitativo, análise de padrões |
| **QA (testes + análise)** | sonnet | Análise de riscos, edge cases, qualidade |
| **Opus** | NUNCA automático | Só usado quando o usuário solicitar explicitamente. Se a tarefa for complexa, o team leader SUGERE o uso mas a decisão é do dev |

**Regra de ouro:** O plugin NUNCA deve escalar para opus por conta própria. Sempre perguntar.

## Fases de Implementação

### Fase 1 — Agentes (Fundação)
- [ ] 1.1 Criar `agents/fluig-implementer.md` (model: haiku, TDD, self-review)
- [ ] 1.2 Criar `agents/fluig-spec-reviewer.md` (model: sonnet, verifica spec compliance)
- [ ] 1.3 Modificar `agents/fluig-reviewer.md` (focar em code quality, remover spec check)

### Fase 2 — Skills Core Novos
- [ ] 2.1 Criar `skills/plan/SKILL.md` (escreve plano de implementação)
- [ ] 2.2 Criar `skills/implement/SKILL.md` (orquestra teammates)
- [ ] 2.3 Criar `skills/implement/implementer-prompt.md` (template do implementer)
- [ ] 2.4 Criar `skills/implement/spec-reviewer-prompt.md` (template do spec reviewer)

### Fase 3 — Extrair Pipeline
- [ ] 3.1 Criar `skills/deploy/SKILL.md` (extraído do review Step 3)
- [ ] 3.2 Criar `skills/qa/SKILL.md` (extraído do review Steps 4-5)
- [ ] 3.3 Refatorar `skills/review/SKILL.md` (orquestrador chamando deploy + qa)

### Fase 4 — Enriquecer Existentes
- [ ] 4.1 Modificar `skills/brainstorm/SKILL.md` (spec em disco + transição para plan)
- [ ] 4.2 Modificar `skills/test/SKILL.md` (adicionar TDD mode)
- [ ] 4.3 Modificar `skills/init-project/SKILL.md` (ciclo completo no CLAUDE.md gerado)

### Fase 5 — Debug
- [ ] 5.1 Criar `skills/debug/SKILL.md` (debugging sistemático para Fluig)

### Fase 6 — Metadata e Docs
- [ ] 6.1 Atualizar `plugin.json` para v2.0.0
- [ ] 6.2 Atualizar `CLAUDE.md` com ciclo completo
- [ ] 6.3 Reescrever `README.md` refletindo o que o plugin entrega
