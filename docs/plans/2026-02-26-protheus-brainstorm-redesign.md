# Design: Cadeia Protheus no estilo superpowers

**Data:** 2026-02-26
**Escopo:** Redesenho completo do fluxo de desenvolvimento ADVPL/TLPP usando subagentes

---

## Contexto

O plugin Protheus tinha um fluxo linear: `protheus-brainstorm` explorava o projeto, fazia perguntas e ao final sugeria que o dev rodasse `/advpl-writer` manualmente. O código era gerado em sessão única, sem revisão estruturada, sem compilação automatizada e sem testes TIR integrados.

O objetivo é espelhar a metodologia do plugin `superpowers` — brainstorm → plano → subagentes com gates — mas com conhecimento de domínio ADVPL/TLPP, incluindo a particularidade de que **ADVPL é uma linguagem compilada**: nenhum teste pode rodar antes do RPO estar atualizado.

---

## Cadeia completa

```
MIT044 / doc de requisitos (opcional)
    ↓
protheus-brainstorm   ← ajustado
    ↓
protheus-writing-plans ← novo
    ↓
protheus-subagent-dev  ← novo
    ├── advpl-expert        (implementação — paralelo por artefato)
    ├── protheus-reviewer   (spec compliance — stage 1)
    ├── code-reviewer       (qualidade — stage 2)
    ├── protheus-deployer   (compile → RPO) ← GATE obrigatório
    └── protheus-test       (TIR E2E — só após deploy bem-sucedido)
```

---

## Seção 1 — `protheus-brainstorm` (ajustado)

### O que muda

- **Abertura com MIT044:** antes de explorar o projeto, pergunta se existe documento de desenvolvimento (MIT044 ou levantamento de requisitos) e seu caminho
  - Se fornecido: lê o documento e extrai automaticamente módulo, tabelas, regras de negócio e tipo de artefato — só pergunta o que estiver faltando ou ambíguo
  - Se não fornecido: mantém o fluxo atual de perguntas sequenciais
- **Fechamento:** após aprovação do design, invoca `protheus:protheus-writing-plans` — não mais sugere `/advpl-writer` manualmente
- Mantém `disable-model-invocation: true` e HARD-GATE

### O que não muda

- Exploração do projeto (fontes `.prw`/`.tlpp`, CLAUDE.md, MIT043, commits recentes)
- Perguntas uma a uma, preferência por múltipla escolha
- Proposta de 2-3 abordagens com trade-offs
- Design em seções com aprovação incremental
- Design doc opcional — só se tarefa complexa ou dev pedir

---

## Seção 2 — `protheus-writing-plans` (novo skill)

### Responsabilidade

Receber o design aprovado e decompor em tasks concretas, tipadas para ADVPL.

### Comportamento

- Cria uma task por artefato identificado no design, com nome no formato `R[MOD][TYPE][SEQ].prw/.tlpp`
- Cada task especifica: tipo (PE, MVC, User Function, Relatório), arquivo alvo e responsabilidade
- Adiciona tasks fixas no final, sempre nesta ordem:
  1. Review spec compliance → agente `protheus-reviewer`
  2. Review qualidade de código → agente `code-reviewer`
  3. Compilação e deploy no RPO → agente `protheus-deployer` *(gate: bloqueia as próximas)*
  4. Geração de scripts TIR → skill `protheus-test`
  5. Execução dos testes E2E → dependente do deploy ter passado
- Salva o plano em `docs/plans/YYYY-MM-DD-[modulo]-[descricao]-plan.md`
- Ao terminar, invoca `protheus:protheus-subagent-dev`

### Diferença do `superpowers:writing-plans`

Conhece os tipos de artefato ADVPL, sabe que compilação é gate obrigatório antes dos testes, e pré-atribui os agentes corretos por tipo de task.

---

## Seção 3 — `protheus-subagent-dev` (novo skill)

### Responsabilidade

Orquestrar a execução das tasks do plano usando os agentes certos, com gates entre estágios.

### Fluxo de execução

```
Para cada task de implementação (paralelo quando possível):
  → despacha advpl-expert
     contexto: task completa + design aprovado + padrões ADVPL do plugin

Após todas implementações concluídas:
  → despacha protheus-reviewer por artefato (spec compliance)
  → se falhar: devolve para advpl-expert corrigir → re-review obrigatório

Após protheus-reviewer aprovado:
  → despacha code-reviewer por artefato (qualidade)
  → se falhar: devolve para advpl-expert corrigir → re-review obrigatório

Após reviews aprovados:
  → despacha protheus-deployer
  → compila e publica no RPO do cliente
  → GATE: se compilação falhar → para o fluxo, reporta erros/warnings do advpls

Após deploy bem-sucedido:
  → despacha protheus-test → gera scripts TIR
  → executa TIR E2E
  → se falhar: reporta screenshot + log, sugere ciclo corrigir → recompilar → retestar
```

### Entrada

Caminho do plano gerado pelo `protheus-writing-plans`.

---

## Artefatos a criar/modificar

| Arquivo | Ação |
|---------|------|
| `protheus/skills/protheus-brainstorm/SKILL.md` | Ajustar |
| `protheus/skills/protheus-writing-plans/SKILL.md` | Criar |
| `protheus/skills/protheus-subagent-dev/SKILL.md` | Criar |

Os agentes existentes (`advpl-expert`, `protheus-reviewer`, `protheus-deployer`) não precisam de ajuste.
