# Protheus Brainstorm — Cadeia de Subagentes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesenhar o plugin Protheus para seguir a metodologia superpowers — brainstorm com intake de MIT044, plano tipado para ADVPL, e orquestração de subagentes com gate de compilação antes do TIR.

**Architecture:** Três arquivos são criados/ajustados: `protheus-brainstorm` recebe suporte a MIT044 e passa a encadear `protheus-writing-plans`; `protheus-writing-plans` (novo) decompõe o design em tasks ADVPL-tipadas; `protheus-subagent-dev` (novo) orquestra `advpl-expert → protheus-reviewer → code-reviewer → protheus-deployer (gate: compila e gera patch) → protheus-test`. ADVPL é linguagem compilada — o patch deve ser gerado e aplicado antes de qualquer teste TIR.

**Tech Stack:** Claude skills (SKILL.md), agentes existentes do plugin Protheus (advpl-expert, protheus-reviewer, protheus-deployer), TIR (TOTVS Interface Robot) para E2E.

**Design doc:** `docs/plans/2026-02-26-protheus-brainstorm-redesign.md`

---

## Task 1: Criar worktree para a feature

**Files:**
- Worktree: `.claude/worktrees/protheus-subagent-chain/`

**Step 1: Criar worktree**

```bash
git worktree add .claude/worktrees/protheus-subagent-chain -b feat/protheus-subagent-chain
```

Expected: nova pasta criada, branch `feat/protheus-subagent-chain` criada a partir de `main`.

**Step 2: Verificar worktree**

```bash
git worktree list
```

Expected: lista com `main` e `feat/protheus-subagent-chain`.

---

## Task 2: Ajustar `protheus-brainstorm/SKILL.md`

**Files:**
- Modify: `protheus/skills/protheus-brainstorm/SKILL.md`

**Contexto:** O skill atual inicia direto na exploração do projeto e termina sugerindo `/advpl-writer`. Precisa: (1) perguntar sobre MIT044 antes de tudo, (2) usar o MIT044 como contexto primário acelerando perguntas, (3) encadear `protheus:protheus-writing-plans` ao final.

**Step 1: Reescrever o Passo 0 — Intake do MIT044**

Adicionar **antes** do "Passo 1 — Explorar o projeto" o seguinte bloco:

```markdown
## Passo 0 — Documento de desenvolvimento

Antes de qualquer exploração, pergunte:

> "Existe um documento de desenvolvimento (MIT044) ou levantamento de requisitos
> para esta tarefa? Se sim, informe o caminho do arquivo."

**Se o desenvolvedor informar o caminho:**
1. Leia o documento completo
2. Extraia automaticamente: módulo, tabelas envolvidas, tipo de artefato,
   regras de negócio e restrições
3. Apresente um resumo do que foi extraído e confirme com o desenvolvedor
4. Use esses dados como contexto primário nas perguntas do Passo 2 —
   só pergunte o que estiver faltando ou ambíguo no documento

**Se não houver documento:**
- Continue normalmente para o Passo 1
```

**Step 2: Ajustar o fechamento — Passo 5**

Substituir o conteúdo atual do "Passo 5 — Transição para implementação" por:

```markdown
## Passo 5 — Transição para implementação

Após aprovação do design, invoque o skill `protheus:protheus-writing-plans`
passando o contexto do design aprovado:

```
✅ Design aprovado!

Próximo passo:
  /protheus:protheus-writing-plans
```

> O `protheus-writing-plans` irá decompor o design em tasks tipadas para ADVPL
> e orquestrar os subagentes de implementação, revisão, compilação e testes TIR.
```

**Step 3: Verificar que nenhuma menção ao `/advpl-writer` permaneceu como destino final**

```bash
grep -n "advpl-writer" protheus/skills/protheus-brainstorm/SKILL.md
```

Expected: zero ocorrências como destino de encadeamento (pode aparecer em referências informativas, mas não como `Próximo passo`).

**Step 4: Commit**

```bash
git add protheus/skills/protheus-brainstorm/SKILL.md
git commit -m "feat(protheus-brainstorm): intake MIT044 e encadeia writing-plans"
```

---

## Task 3: Criar `protheus-writing-plans/SKILL.md`

**Files:**
- Create: `protheus/skills/protheus-writing-plans/SKILL.md`

**Contexto:** Skill novo que recebe o design aprovado do brainstorm e o decompõe em tasks concretas, tipadas para ADVPL. Sabe que ADVPL é compilada — compilação é gate antes dos testes TIR.

**Step 1: Criar o diretório**

```bash
mkdir -p protheus/skills/protheus-writing-plans
```

**Step 2: Criar o SKILL.md**

Conteúdo completo do arquivo:

```markdown
---
name: protheus-writing-plans
description: Decompõe o design aprovado do protheus-brainstorm em tasks concretas para subagentes ADVPL. Gera plano tipado com artefatos R[MOD][TYPE][SEQ].prw/.tlpp, gates de compilação e testes TIR. Use após /protheus:protheus-brainstorm. Invoque com /protheus:protheus-writing-plans
disable-model-invocation: true
---

## Instruções para Claude

Leia o design doc mais recente em `docs/plans/` antes de começar.
Se não houver design doc, recomende `/protheus:protheus-brainstorm` primeiro.

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
Agente: advpl-expert
Artefato: R[MOD][TYPE][SEQ].prw (ou .tlpp)
Tipo: [User Function | MVC | Ponto de Entrada | Relatório]
Responsabilidade: [descrição funcional]
Contexto para o agente:
  - Design doc: docs/plans/[arquivo].md
  - Tabelas: [lista]
  - Regras: [lista]
  - Padrões: notação húngara, ProtheusDoc, BEGIN SEQUENCE, xFilial
```

Tasks de implementação **podem rodar em paralelo** quando os artefatos
forem independentes (PE em arquivo próprio, funções sem dependência mútua).

---

## Passo 3 — Adicionar tasks fixas de qualidade (sempre nesta ordem)

Após todas as tasks de implementação, adicione obrigatoriamente:

### Task Review Spec Compliance
```
Task N+1: Review spec compliance
Agente: protheus-reviewer
Escopo: todos os artefatos implementados
Critério de aprovação: zero CRÍTICOs no relatório do protheus-reviewer
Bloqueio: tasks de implementação devem estar concluídas
```

### Task Review Qualidade
```
Task N+2: Review qualidade de código
Agente: superpowers:code-reviewer (ou code-reviewer se disponível)
Escopo: todos os artefatos aprovados no spec compliance
Critério de aprovação: aprovação do revisor
Bloqueio: spec compliance aprovado
```

### Task Compilação e Geração de Patch (GATE obrigatório)
```
Task N+3: Compilar artefatos e gerar patch (.ptm)
Agente: protheus-deployer
Ação: compilar todos os artefatos aprovados e gerar patch para aplicação no ambiente
GATE: se compilação falhar → fluxo para aqui, não avança para testes
Critério de aprovação: patch gerado sem erros, pronto para aplicação no ambiente de homologação
Bloqueio: ambos os reviews aprovados
Nota: o patch deve ser aplicado no ambiente antes de rodar os testes TIR
```

### Task Geração de Scripts TIR
```
Task N+4: Gerar scripts de teste TIR
Skill: protheus-test
Escopo: fluxos críticos de negócio identificados no design
Bloqueio: compilação bem-sucedida (RPO atualizado)
```

### Task Execução E2E
```
Task N+5: Executar testes TIR E2E
Ação: rodar scripts gerados contra o ambiente de homologação
Critério de aprovação: todos os testes passando
Bloqueio: scripts TIR gerados
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

| # | Artefato | Tipo | Agente | Paralelo? |
|---|---------|------|--------|-----------|
| 1 | RFATA001.prw | User Function | advpl-expert | sim |
| 2 | PE_MATA010.prw | Ponto de Entrada MVC | advpl-expert | sim |

## Tasks de Qualidade e Deploy

| # | Task | Agente | Bloqueada por |
|---|------|--------|--------------|
| 3 | Spec compliance | protheus-reviewer | 1, 2 |
| 4 | Qualidade código | code-reviewer | 3 |
| 5 | Compilação RPO (GATE) | protheus-deployer | 4 |
| 6 | Gerar TIR | protheus-test | 5 |
| 7 | Executar E2E | — | 6 |
```

---

## Passo 5 — Encadear protheus-subagent-dev

Após salvar o plano:

```
✅ Plano salvo em docs/plans/[arquivo]-plan.md

Próximo passo:
  /protheus:protheus-subagent-dev
```
```

**Step 3: Verificar estrutura do arquivo criado**

```bash
head -5 protheus/skills/protheus-writing-plans/SKILL.md
```

Expected: frontmatter com `name: protheus-writing-plans` e `disable-model-invocation: true`.

**Step 4: Commit**

```bash
git add protheus/skills/protheus-writing-plans/
git commit -m "feat(protheus): cria skill protheus-writing-plans"
```

---

## Task 4: Criar `protheus-subagent-dev/SKILL.md`

**Files:**
- Create: `protheus/skills/protheus-subagent-dev/SKILL.md`

**Contexto:** Skill orquestrador que lê o plano gerado pelo `protheus-writing-plans` e executa cada task usando os agentes corretos, com gates entre estágios. Gate de compilação é obrigatório — falha para o fluxo.

**Step 1: Criar o diretório**

```bash
mkdir -p protheus/skills/protheus-subagent-dev
```

**Step 2: Criar o SKILL.md**

Conteúdo completo do arquivo:

```markdown
---
name: protheus-subagent-dev
description: Orquestra a execução do plano ADVPL usando subagentes — advpl-expert implementa, protheus-reviewer e code-reviewer revisam, protheus-deployer compila no RPO (gate obrigatório) e protheus-test executa TIR. Use após /protheus:protheus-writing-plans. Invoque com /protheus:protheus-subagent-dev
disable-model-invocation: true
---

## Instruções para Claude

Leia o plano mais recente em `docs/plans/` (arquivo terminado em `-plan.md`).
Se não houver plano, recomende `/protheus:protheus-writing-plans` primeiro.

---

## Estágio 1 — Implementação (paralelo)

Para cada task de implementação do plano, despache um subagente `advpl-expert`:

**Contexto obrigatório para cada subagente:**
- Texto completo da task (artefato, tipo, responsabilidade)
- Conteúdo do design doc
- Regras inegociáveis: notação húngara, ProtheusDoc, BEGIN SEQUENCE, xFilial, RecLock/MsUnlock
- Padrão de nomenclatura: `R[MOD][TYPE][SEQ].prw` ou `.tlpp`

Tasks independentes rodam em paralelo.
Tasks com dependência (ex: lógica externa que um PE chama) rodam em sequência.

Aguarde conclusão de todas as tasks de implementação antes de avançar.

---

## Estágio 2 — Review Spec Compliance

Despache o agente `protheus-reviewer` com todos os artefatos implementados.

**Critério de avanço:** zero itens `CRITICO` no relatório.

**Se houver CRÍTICOs:**
1. Identifique o artefato com problema
2. Despache `advpl-expert` novamente com o relatório de CRÍTICOs como contexto
3. Após correção, repita o review com `protheus-reviewer`
4. Só avança quando aprovado (`Aprovado para compilacao: SIM`)

---

## Estágio 3 — Review Qualidade de Código

Despache `code-reviewer` (ou `superpowers:code-reviewer`) com os artefatos aprovados.

**Critério de avanço:** aprovação do revisor.

**Se houver problemas:**
- Mesmo ciclo do Estágio 2: corrige → re-review → avança.

---

## Estágio 4 — Compilação e Geração de Patch (GATE)

> ⚠️ ADVPL/TLPP é uma linguagem **compilada**. O patch deve ser gerado e aplicado no ambiente antes de qualquer teste TIR.

Despache o agente `protheus-deployer` com a lista de artefatos aprovados.

O `protheus-deployer` irá:
1. Compilar todos os artefatos via `advpls cli`
2. Gerar o patch (`.ptm`) contendo todos os fontes compilados
3. Reportar resultado: patch gerado ou erros com linha

**Critério de avanço:** patch gerado sem erros de compilação, aplicado no ambiente de homologação.

**Se a compilação falhar:**
```
❌ GATE DE COMPILAÇÃO — fluxo interrompido

Erros do compilador:
[erros/warnings do advpls]

Ações necessárias:
1. Corrija os erros nos artefatos indicados
2. Repita o review (Estágios 2 e 3) se a correção for substancial
3. Recompile e gere novo patch após correção
```

**Não avance para testes enquanto o patch não estiver gerado e aplicado.**

---

## Estágio 5 — Testes TIR E2E

Após confirmação de RPO atualizado:

**Step 1:** Invoke `/protheus:protheus-test` para gerar os scripts TIR
- Forneça: módulo, rotinas a testar, fluxos críticos identificados no design
- Confirme configuração do ambiente: URL, módulo, grupo, filial, headless

**Step 2:** Execute os scripts gerados:

```bash
python -m unittest discover -s tests/ -p "test_*.py" -v
```

Expected: todos os testes passando.

**Se testes falharem:**
```
❌ Falha no TIR E2E

Teste falho: [nome do teste]
Screenshot: screenshots/[arquivo].png
Log: logs/[arquivo].log

Próximos passos:
1. Analise o screenshot e log
2. Corrija o artefato ADVPL causador
3. Recompile (Estágio 4)
4. Reexecute os testes
```

---

## Encerramento

Quando todos os estágios passarem:

```
✅ Cadeia completa concluída

Patch gerado: [nome-do-patch].ptm
Artefatos compilados: [lista]
Testes TIR: [N] passando

Próximos passos:
- [ ] Registrar fontes no MIT043
- [ ] Validar em https://codeanalysis.totvs.com.br
- [ ] Abrir PR em: homologacao/feature/[nome-da-demanda]
- [ ] Distribuir patch ao cliente para aplicação em produção (quando aprovado)
```
```

**Step 3: Verificar estrutura**

```bash
head -5 protheus/skills/protheus-subagent-dev/SKILL.md
```

Expected: frontmatter com `name: protheus-subagent-dev` e `disable-model-invocation: true`.

**Step 4: Commit**

```bash
git add protheus/skills/protheus-subagent-dev/
git commit -m "feat(protheus): cria skill protheus-subagent-dev com gate de compilacao"
```

---

## Task 5: Registrar os novos skills no marketplace

**Files:**
- Modify: `protheus/.claude-plugin/plugin.json`

**Contexto:** Novos skills precisam estar listados no `plugin.json` para serem descobertos pelo marketplace.

**Step 1: Ler o plugin.json atual**

```bash
cat protheus/.claude-plugin/plugin.json
```

**Step 2: Adicionar as duas entradas de skills**

Inserir junto aos skills existentes:

```json
{
  "name": "protheus-writing-plans",
  "description": "Decompõe design ADVPL em tasks tipadas com gate de compilação antes do TIR"
},
{
  "name": "protheus-subagent-dev",
  "description": "Orquestra subagentes ADVPL: implementação → review → compilação (gate) → TIR"
}
```

**Step 3: Verificar JSON válido**

```bash
python3 -m json.tool protheus/.claude-plugin/plugin.json > /dev/null && echo "JSON válido"
```

Expected: `JSON válido`.

**Step 4: Commit**

```bash
git add protheus/.claude-plugin/plugin.json
git commit -m "feat(protheus): registra protheus-writing-plans e protheus-subagent-dev no plugin"
```

---

## Task 6: Bump de versão do plugin Protheus

**Files:**
- Modify: `protheus/.claude-plugin/plugin.json`

**Contexto:** Adição de 2 skills novos e ajuste no brainstorm justificam bump de minor version (1.1.4 → 1.2.0).

**Step 1: Atualizar versão**

No `plugin.json`, alterar `"version": "1.1.4"` para `"version": "1.2.0"`.

**Step 2: Commit**

```bash
git add protheus/.claude-plugin/plugin.json
git commit -m "chore(protheus): bump version 1.1.4 → 1.2.0"
```

---

## Task 7: Merge para main e limpeza do worktree

**Step 1: Garantir que todos os commits estão no worktree**

```bash
git log --oneline -10
```

**Step 2: Voltar para main e mergear**

```bash
git checkout main
git merge feat/protheus-subagent-chain --no-ff -m "feat(protheus): cadeia de subagentes estilo superpowers (v1.2.0)"
```

**Step 3: Remover worktree**

```bash
git worktree remove .claude/worktrees/protheus-subagent-chain
git branch -d feat/protheus-subagent-chain
```

**Step 4: Verificar estado final**

```bash
git log --oneline -8
ls protheus/skills/
```

Expected: skills `protheus-writing-plans` e `protheus-subagent-dev` presentes.
