# Fluig Ciclo Completo — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Criar 3 skills que fecham o ciclo de desenvolvimento Fluig: `fluig-brainstorm` (gate de design), `fluig-review` (gate de qualidade com deploy + QA no servidor) e `fluig-verify` (gate de deploy final com checklist).

**Architecture:** Três skills independentes com `disable-model-invocation: true` que formam um pipeline sequencial. `fluig-brainstorm` usa `AskUserQuestion` para guiar o design antes de qualquer código. `fluig-review` orquestra três passos sequenciais: revisão estática (agente fluig-reviewer), deploy no servidor de teste (agente fluig-deployer), e QA no servidor (agente fluig-qa). `fluig-verify` lê o CLAUDE.md do projeto para adaptar o checklist (HML vs servidor único) e aciona o deploy final.

**Tech Stack:** Claude Code skills (SKILL.md), bash, jq, agentes Fluig existentes (fluig-reviewer, fluig-qa, fluig-deployer)

---

## Task 1: Criar skill fluig-brainstorm

**Files:**
- Create: `fluig/skills/fluig-brainstorm/SKILL.md`

**Contexto:** Esta skill é o gate de entrada do ciclo. Deve ser invocada ANTES de qualquer scaffolding (`fluig-widget`, `fluig-form`, `fluig-dataset`, `fluig-workflow`). Usa `AskUserQuestion` para entender o que será construído e produz um mini design doc inline que precisa ser aprovado antes de prosseguir. `disable-model-invocation: true` é obrigatório.

**Step 1: Criar o diretório e arquivo**

```bash
mkdir -p fluig/skills/fluig-brainstorm
```

**Step 2: Criar SKILL.md com o conteúdo exato abaixo**

```markdown
---
name: fluig-brainstorm
description: Gate de design para desenvolvimento Fluig. Use ANTES de criar qualquer artefato (widget, form, dataset, workflow). Entrevista o desenvolvedor, mapeia integrações e produz um design aprovado antes de acionar qualquer skill de scaffolding. Invoque ao iniciar qualquer nova funcionalidade Fluig.
disable-model-invocation: true
---

Você está iniciando o planejamento de uma funcionalidade Fluig. Nenhum código será gerado até o design ser aprovado.

## HARD GATE

Não invoque nenhuma skill de scaffolding (`fluig-widget`, `fluig-form`, `fluig-dataset`, `fluig-workflow`) antes de ter o design aprovado pelo usuário nesta skill.

## Passo 1 — Entender o artefato

Use `AskUserQuestion` com as perguntas abaixo (em uma chamada só, multi-select onde indicado):

**Pergunta 1:** Qual(is) artefato(s) será(ão) criado(s)?
- Widget Angular (tela interativa)
- Formulário Fluig (form nativo)
- Dataset (fonte de dados)
- Workflow / evento BPM
- Combinação de múltiplos artefatos

**Pergunta 2 (aberta):** Qual é a necessidade de negócio? O que o usuário final vai conseguir fazer?

**Pergunta 3:** Há integração com outros sistemas?
- Protheus REST API
- Outro dataset Fluig existente
- Workflow existente
- Nenhuma integração externa

**Pergunta 4:** Há artefatos Fluig existentes no projeto para reaproveitar ou modificar?
- Sim (descrever quais)
- Não, tudo novo

## Passo 2 — Apresentar o design

Com base nas respostas, apresente um design estruturado contendo:

### Artefatos a criar
Liste cada artefato com nome (seguindo convenção do projeto: prefixo do CLAUDE.md), tipo e responsabilidade.

### Integrações mapeadas
Para cada integração: endpoint ou artefato de origem, dados consumidos, tratamento de erro esperado.

### Fluxo do usuário
Descreva em 3-5 passos o que o usuário final vai fazer e o que cada artefato entrega.

### Dependências entre artefatos
Se houver múltiplos artefatos: qual precisa existir antes do outro? Ex: dataset antes do widget.

### Riscos e decisões em aberto
Liste explicitamente qualquer ponto que ainda não está claro e que pode impactar o desenvolvimento.

## Passo 3 — Aprovação

Apresente o design e pergunte:

> "Este design está correto? Posso prosseguir com o scaffolding?"

**Se aprovado:** indique as skills a acionar em ordem:
```
Próximos passos:
1. /fluig:fluig-dataset   → criar dataset [nome]
2. /fluig:fluig-widget    → criar widget [nome]
3. /fluig:fluig-review    → revisar e validar no servidor
```

**Se não aprovado:** revise o design com base no feedback e apresente novamente.

## Regras obrigatórias

- Nunca pule direto para scaffolding sem design aprovado
- Se o CLAUDE.md do projeto existir, leia-o para usar o prefixo correto dos artefatos
- Prefira perguntar sobre riscos cedo do que descobri-los durante o desenvolvimento
```

**Step 3: Verificar frontmatter**

```bash
head -6 fluig/skills/fluig-brainstorm/SKILL.md
```
Esperado: `name: fluig-brainstorm` e `disable-model-invocation: true`

**Step 4: Commit**

```bash
git add fluig/skills/fluig-brainstorm/SKILL.md
git commit -m "feat(fluig): criar skill fluig-brainstorm — gate de design antes do scaffolding"
```

---

## Task 2: Criar skill fluig-review

**Files:**
- Create: `fluig/skills/fluig-review/SKILL.md`

**Contexto:** Gate de qualidade em 3 passos sequenciais. Só avança para o próximo passo se o anterior passou. O deploy de teste é obrigatório antes do QA porque artefatos Fluig (formulários, datasets, workflows) só podem ser testados no servidor. Lê CLAUDE.md para saber o servidor de destino do deploy de teste.

**Step 1: Criar o diretório**

```bash
mkdir -p fluig/skills/fluig-review
```

**Step 2: Criar SKILL.md com o conteúdo exato abaixo**

```markdown
---
name: fluig-review
description: Gate de qualidade para artefatos Fluig em 3 passos sequenciais: (1) revisão estática de código, (2) deploy no servidor de teste, (3) QA no servidor. Acione após concluir o desenvolvimento e antes de declarar o artefato pronto. Orquestra os agentes fluig-reviewer, fluig-deployer e fluig-qa.
disable-model-invocation: true
---

Você vai conduzir o processo de review de artefatos Fluig em 3 passos obrigatórios e sequenciais. Nenhum passo pode ser pulado.

## HARD GATE

Não declare o artefato "aprovado" ou "pronto para produção" sem completar os 3 passos abaixo com resultado positivo em cada um.

## Passo 1 — Revisão Estática (fluig-reviewer)

Antes de qualquer deploy, acione o agente `fluig-reviewer` para revisar o código localmente.

Instrução ao agente:
> "Revise os artefatos [listar arquivos] seguindo o checklist completo de código Fluig."

O agente `fluig-reviewer` verifica:
- Nomenclatura correta (prefixo `ds_`, `wg_`, `wf_` conforme CLAUDE.md do projeto)
- Try/catch em todo acesso a dados e chamadas REST
- Ausência de `alert()` — usar sempre `Swal.fire()`
- APIs Fluig usadas corretamente (DatasetFactory, fluigc, WFMovementDTO)
- Integração com Protheus: URL da API lida do CLAUDE.md, nunca hardcoded

**Se fluig-reviewer retornar itens CRÍTICOS:** corrija antes de prosseguir. Não avance para o Passo 2.

**Se fluig-reviewer retornar apenas AVISOS:** documente-os e prossiga com o Passo 2.

## Passo 2 — Deploy no Servidor de Teste (fluig-deployer)

Antes de executar, leia o CLAUDE.md do projeto para identificar:
- Se há ambiente de homologação (HML): use-o como destino
- Se há apenas um servidor: use-o, mas confirme explicitamente com o usuário

Confirme com o usuário antes de deployar:
> "Vou fazer o deploy de [artefatos] para [servidor/ambiente]. Confirma?"

Após confirmação, acione o agente `fluig-deployer`:
> "Faça o deploy dos artefatos [listar] para o ambiente [HML ou servidor único do CLAUDE.md]."

**Se o deploy falhar:** reporte o erro ao usuário e aguarde correção. Não avance para o Passo 3.

## Passo 3 — QA no Servidor (fluig-qa)

Com os artefatos publicados no servidor, acione o agente `fluig-qa`:
> "Analise a qualidade dos artefatos [listar] publicados em [URL do servidor]. Verifique casos de borda, campos obrigatórios sem validação, datasets sem constraints de filtro e cobertura de testes."

O agente `fluig-qa` acessa o servidor real para validar o comportamento.

**Se fluig-qa retornar itens de risco ALTO:** corrija, volte ao Passo 1 e repita o ciclo.

**Se fluig-qa retornar apenas riscos MÉDIO/BAIXO:** documente e apresente o resultado ao usuário.

## Resultado do Review

Ao final dos 3 passos, apresente um resumo:

```
✅ REVIEW CONCLUÍDO — [nome do artefato]

Passo 1 — Revisão estática: [APROVADO / APROVADO COM AVISOS]
  Avisos: [listar se houver]

Passo 2 — Deploy teste: [APROVADO] em [URL servidor]

Passo 3 — QA servidor: [APROVADO / APROVADO COM RESSALVAS]
  Ressalvas: [listar se houver]

Próximo passo: /fluig:fluig-verify → deploy final
```

## Regras obrigatórias

- Os 3 passos são sequenciais — nunca em paralelo
- Deploy de teste é obrigatório antes do QA (artefatos Fluig só testam no servidor)
- Sempre ler CLAUDE.md para saber servidor e prefixo antes de acionar qualquer agente
- Sempre confirmar com o usuário antes de fazer qualquer deploy
```

**Step 3: Verificar frontmatter**

```bash
head -6 fluig/skills/fluig-review/SKILL.md
```
Esperado: `name: fluig-review` e `disable-model-invocation: true`

**Step 4: Commit**

```bash
git add fluig/skills/fluig-review/SKILL.md
git commit -m "feat(fluig): criar skill fluig-review — gate de qualidade com deploy + QA no servidor"
```

---

## Task 3: Criar skill fluig-verify

**Files:**
- Create: `fluig/skills/fluig-verify/SKILL.md`

**Contexto:** Gate final antes de declarar o artefato pronto. Checklist adaptativo: se o projeto tem HML, confirma que o deploy final vai para produção. Se tem servidor único, confirma que o QA foi concluído. Aciona `fluig-deployer` para o deploy final apenas após checklist completo e confirmação explícita do usuário. `disable-model-invocation: true`.

**Step 1: Criar o diretório**

```bash
mkdir -p fluig/skills/fluig-verify
```

**Step 2: Criar SKILL.md com o conteúdo exato abaixo**

```markdown
---
name: fluig-verify
description: Gate de deploy final para artefatos Fluig. Checklist adaptativo baseado no ambiente do projeto (HML vs servidor único). Acione após fluig-review aprovado, antes de declarar o artefato pronto para produção. Confirma ambiente, valida checklist e aciona o deploy final via fluig-deployer.
disable-model-invocation: true
---

Você vai conduzir o gate final antes de declarar um artefato Fluig pronto para produção.

## HARD GATE

Não acione o deploy final e não declare o artefato "pronto" sem completar o checklist abaixo com todas as respostas positivas.

## Passo 1 — Ler contexto do projeto

Leia o CLAUDE.md do projeto para identificar:
- **Servidor(es):** URL(s) disponíveis e seus ambientes (HML, produção, único)
- **Prefixo do cliente:** para confirmar que os artefatos corretos serão deployados
- **Integração Protheus:** se existir, confirmar que a URL da API está correta

## Passo 2 — Checklist adaptativo

### Se o projeto tem ambiente HML (homologação separado de produção):

Use `AskUserQuestion` para confirmar cada item:

1. O `fluig-review` foi executado e retornou aprovado no ambiente HML?
2. Os itens CRÍTICOS da revisão estática estão corrigidos?
3. O deploy será feito em **PRODUÇÃO** (não HML) — confirma o ambiente correto?
4. Há um plano de rollback definido? (qual versão anterior, como reverter via fluig-deployer)
5. O responsável pelo ambiente de produção foi notificado?

### Se o projeto tem servidor único:

Use `AskUserQuestion` para confirmar cada item:

1. O `fluig-review` foi executado e retornou aprovado?
2. Os itens CRÍTICOS da revisão estática estão corrigidos?
3. O fluig-qa não retornou nenhum item de risco ALTO?
4. Há um plano de rollback definido? (backup do artefato anterior)
5. O horário de deploy é adequado? (evitar horário de pico de uso)

**Se qualquer item for respondido negativamente:** não prossiga. Indique o que precisa ser resolvido antes.

## Passo 3 — Confirmação final

Apresente um resumo antes do deploy:

```
🚀 DEPLOY FINAL — [nome do artefato]

Artefato(s): [listar com nomes completos]
Servidor destino: [URL]
Ambiente: [Produção / Servidor único]
Checklist: ✅ Todos os itens confirmados

Confirma o deploy?
```

Aguarde confirmação explícita ("sim" / "confirma" / "pode deployar") antes de prosseguir.

## Passo 4 — Deploy final (fluig-deployer)

Após confirmação, acione o agente `fluig-deployer`:
> "Faça o deploy dos artefatos [listar] para [URL servidor de produção / servidor único]."

## Passo 5 — Resultado

Após o deploy com sucesso, apresente:

```
✅ DEPLOY CONCLUÍDO — [nome do artefato]

Artefato(s) publicado(s) em: [URL]
Horário: [timestamp]

Para validar no servidor:
  Acesse [URL do artefato no Fluig] e verifique o comportamento esperado.

Em caso de problema — rollback:
  "use fluig-deployer to rollback [artefato] to previous version"
```

## Regras obrigatórias

- Nunca fazer deploy em produção sem confirmação explícita do usuário
- Sempre ler CLAUDE.md para identificar o ambiente correto — nunca assumir
- Se o projeto não tiver CLAUDE.md, perguntar o servidor antes de prosseguir
- Sempre informar como fazer rollback após o deploy
```

**Step 3: Verificar frontmatter**

```bash
head -6 fluig/skills/fluig-verify/SKILL.md
```
Esperado: `name: fluig-verify` e `disable-model-invocation: true`

**Step 4: Commit**

```bash
git add fluig/skills/fluig-verify/SKILL.md
git commit -m "feat(fluig): criar skill fluig-verify — gate de deploy final com checklist adaptativo"
```

---

## Task 4: Atualizar fluig-init-project para mencionar o ciclo

**Files:**
- Modify: `fluig/skills/fluig-init-project/SKILL.md`

**Contexto:** O `fluig-init-project` gera o CLAUDE.md. O CLAUDE.md precisa incluir a seção de Skills com as novas skills do ciclo. Além disso, o "Passo 3 — Orientar próximos passos" deve mencionar `fluig-brainstorm` como primeiro passo.

**Step 1: Ler o arquivo atual**

```bash
cat fluig/skills/fluig-init-project/SKILL.md
```

**Step 2: Localizar a seção `## Skills` no template do CLAUDE.md gerado**

Encontre a linha:
```
`/fluig:fluig-widget` · `/fluig:fluig-dataset` · `/fluig:fluig-form`
```

Substitua por:
```
**Ciclo de desenvolvimento:**
`/fluig:fluig-brainstorm` → design · `/fluig:fluig-review` → qualidade · `/fluig:fluig-verify` → deploy

**Scaffolding:**
`/fluig:fluig-widget` · `/fluig:fluig-dataset` · `/fluig:fluig-form` · `/fluig:fluig-workflow`
```

**Step 3: Localizar o "Passo 3 — Orientar próximos passos"**

Encontre:
```
Para criar seu primeiro artefato:
  /fluig:fluig-widget   → criar widget Angular
  /fluig:fluig-dataset  → criar dataset
  /fluig:fluig-form     → criar formulário
```

Substitua por:
```
Para iniciar o desenvolvimento:
  /fluig:fluig-brainstorm → planejar o design do artefato (SEMPRE primeiro)

Após design aprovado:
  /fluig:fluig-widget   → criar widget Angular
  /fluig:fluig-dataset  → criar dataset
  /fluig:fluig-form     → criar formulário
  /fluig:fluig-workflow → criar evento BPM

Após desenvolvimento:
  /fluig:fluig-review   → revisar código + deploy teste + QA
  /fluig:fluig-verify   → deploy final com checklist
```

**Step 4: Commit**

```bash
git add fluig/skills/fluig-init-project/SKILL.md
git commit -m "feat(fluig): atualizar fluig-init-project com ciclo brainstorm/review/verify"
```

---

## Task 5: Bump versão e sincronizar cache

**Files:**
- Modify: `fluig/.claude-plugin/plugin.json`

**Contexto:** 3 skills novas + atualização do init-project = minor release. Versão 1.1.0 → 1.2.0.

**Step 1: Alterar versão no plugin.json**

```bash
# Em fluig/.claude-plugin/plugin.json
# Alterar: "version": "1.1.0"
# Para:    "version": "1.2.0"
```

**Step 2: Commit**

```bash
git add fluig/.claude-plugin/plugin.json
git commit -m "chore(fluig): bump version 1.1.0 → 1.2.0"
```

**Step 3: Push do branch**

```bash
git push origin <nome-do-branch>
```

---

## Checklist de verificação final

- [ ] `fluig/skills/fluig-brainstorm/SKILL.md` tem `disable-model-invocation: true` e HARD GATE explícito
- [ ] `fluig/skills/fluig-review/SKILL.md` tem os 3 passos sequenciais documentados
- [ ] `fluig/skills/fluig-verify/SKILL.md` tem checklist adaptativo HML vs servidor único
- [ ] `fluig-init-project` menciona `fluig-brainstorm` como primeiro passo
- [ ] `plugin.json` está na versão 1.2.0
- [ ] Todos os commits feitos e push enviado
