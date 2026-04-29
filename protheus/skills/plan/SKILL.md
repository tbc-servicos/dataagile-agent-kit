---
name: plan
description: Decompõe o design aprovado do brainstorm em tasks concretas para teammates ADVPL. Gera plano tipado com artefatos R[MOD][TYPE][SEQ].prw/.tlpp, gates de lint e testes TIR. Use após /protheus:brainstorm.
disable-model-invocation: true
---

## Instruções para Claude

Leia o design doc mais recente em `docs/plans/` antes de começar.
Se não houver design doc, recomende `/protheus:brainstorm` primeiro.

---

## Passo 1 — Ler o design aprovado

```bash
ls -t docs/plans/*.md | head -3
```

Leia o design doc identificado. Extraia:
- Lista de artefatos a implementar (nome do arquivo, tipo, responsabilidade)
- Módulo Protheus (FAT, FIN, EST, COM, RH…)
- Tabelas envolvidas
- Regras de negócio críticas

---

## Passo 2 — Decompor em tasks de implementação

Para cada artefato identificado no design, crie uma task com:

```
Task N: Implementar [NOME_ARQUIVO]
Teammate: protheus-implementer (haiku)
Artefato: R[MOD][TYPE][SEQ].prw (ou .tlpp)
Tipo: [User Function | MVC | Ponto de Entrada | Relatório]
Responsabilidade: [descrição funcional]
Contexto para o teammate:
  - Design doc: docs/plans/[arquivo].md
  - Tabelas: [lista]
  - Regras: [lista]
  - Padrões: consultar MCP para convenções atualizadas
```

Tasks de implementação **podem rodar em paralelo** quando os artefatos
forem independentes (PE em arquivo próprio, funções sem dependência mútua).

---

## Passo 3 — Adicionar tasks fixas de qualidade (sempre nesta ordem)

Após todas as tasks de implementação, adicione obrigatoriamente:

### Task Review Spec Compliance
```
Task N+1: Review spec compliance
Teammate: protheus-spec-reviewer (sonnet)
Escopo: todos os artefatos implementados
Critério de aprovação: ✅ SPEC OK em todos os artefatos
Bloqueio: tasks de implementação devem estar concluídas
```

### Task Review Qualidade
```
Task N+2: Review qualidade de código
Teammate: protheus-reviewer (sonnet)
Escopo: todos os artefatos aprovados no spec compliance
Critério de aprovação: Aprovado para compilação: SIM
Bloqueio: spec compliance aprovado
```

### Task Lint Gate
```
Task N+3: Lint local (advpls appre)
Ação: rodar advpls appre em todos os artefatos
GATE: se lint retornar erros tipo "0" → fluxo para aqui
Critério de aprovação: zero erros tipo "0"
Bloqueio: ambos os reviews aprovados
```

### Task Deploy (compilação + patch)
```
Task N+4: Compilar e gerar patch
Skill: /protheus:deploy
Ação: compilar no AppServer via advpls cli, gerar patch .ptm
Bloqueio: lint aprovado
```

### Task Testes TIR E2E
```
Task N+5: Executar testes TIR E2E
Skill: /protheus:qa
Escopo: fluxos críticos de negócio identificados no design
Bloqueio: compilação bem-sucedida (RPO atualizado)
```

---

## Passo 4 — Salvar o plano

Salve o plano completo em:

```
docs/plans/YYYY-MM-DD-[modulo]-[descricao]-plan.md
```

Formato do plano:

```markdown
# Plano: [Descrição]

**Design:** docs/plans/[design-doc].md
**Módulo:** [MOD]
**Data:** YYYY-MM-DD

## Tasks de Implementação

| # | Artefato | Tipo | Teammate | Paralelo? |
|---|---------|------|----------|-----------|
| 1 | RFATA001.prw | User Function | protheus-implementer (haiku) | sim |
| 2 | PE_MATA010.prw | Ponto de Entrada MVC | protheus-implementer (haiku) | sim |

## Tasks de Qualidade e Deploy

| # | Task | Teammate/Skill | Bloqueada por |
|---|------|----------------|--------------|
| 3 | Spec compliance | protheus-spec-reviewer (sonnet) | 1, 2 |
| 4 | Qualidade código | protheus-reviewer (sonnet) | 3 |
| 5 | Lint gate (appre) | — | 4 |
| 6 | Compilação + patch | /protheus:deploy | 5 |
| 7 | Testes TIR E2E | /protheus:qa | 6 |
```

---

## Passo 5 — Encadear implementação

Após salvar o plano:

```
Plano salvo em docs/plans/[arquivo]-plan.md

Próximo passo:
  /protheus:implement
```

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
