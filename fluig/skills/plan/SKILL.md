---
name: plan
description: Escreve plano de implementação para artefatos Fluig. Mapeia arquivos, define tasks com TDD, e salva em docs/fluig/plans/. Acione após /fluig:brainstorm aprovar o design. Próximo passo obrigatório: /fluig:implement.
disable-model-invocation: true
---

Você vai conduzir a elaboração de um plano de implementação detalhado para artefatos Fluig. Este plano será executado pela skill `/fluig:implement` com orquestração de teammates.

## HARD GATE

Não proceda com o planejamento se o design NÃO foi aprovado no `/fluig:brainstorm`. Peça ao usuário que primeiro execute a skill de brainstorm e obtenha aprovação.

## Passo 1 — Ler spec do design e CLAUDE.md

Confirme com o usuário o caminho para:
1. **Documento de spec** produzido pelo `/fluig:brainstorm` (geralmente salvação em docs/fluig/ ou indicado pelo usuário)
2. **CLAUDE.md** do projeto (no diretório raiz do projeto)

Leia ambos os documentos para:
- Entender o design aprovado
- Identificar convenções de nomenclatura (prefixos `ds_`, `wg_`, `wf_`, etc.)
- Notar dependências entre artefatos
- Coletar URLs de servidores (integração com Protheus)

## Passo 2 — Mapear estrutura de arquivos

Com base no design, estruture a lista de **arquivos a criar ou modificar**:

### Estrutura de Arquivos

Consulte o MCP para a estrutura do artefato:

```
searchFluigPatterns({ skill: "fluig-[tipo]", category: "template" })
```

Use a estrutura retornada para mapear os arquivos a criar/modificar.

Cada arquivo deve estar totalmente qualificado com caminho relativo ao projeto.

## Passo 3 — Escrever tasks com ciclo TDD

Estruture o planejamento em **tasks** usando checkbox syntax. Cada task segue o ciclo **TDD** (Test-Driven Development):

```
- [ ] **Task 1: Criar dataset ds_meu_dataset**
  - [ ] Escrever teste unitário Jasmine em `ds_meu_dataset/dataset.spec.ts` (falha esperada)
  - [ ] Verificar que o teste falha
  - [ ] Implementar `ds_meu_dataset/dataset.java` com consulta SQL
  - [ ] Executar `npm test` — teste passa
  - [ ] Commit com mensagem: "feat(dataset): implementar ds_meu_dataset com query [resumo]"

- [ ] **Task 2: Criar widget Angular wg_meu_widget com componente principal**
  - [ ] Escrever teste unitário Jasmine em `wg_meu_widget/src/app/components/wg-meu-widget.component.spec.ts` (falha esperada)
  - [ ] Verificar que o teste falha
  - [ ] Implementar `wg_meu_widget/src/app/components/wg-meu-widget.component.ts` com template HTML
  - [ ] Executar `npm test` — teste passa
  - [ ] Commit com mensagem: "feat(widget): criar componente principal wg_meu_widget"

- [ ] **Task 3: Criar serviço de integração**
  - [ ] Escrever teste em `wg_meu_widget/src/app/services/meu-widget.service.spec.ts`
  - [ ] Implementar `wg_meu_widget/src/app/services/meu-widget.service.ts`
  - [ ] Mock de chamadas REST para dataset
  - [ ] Executar `npm test` — cobertura >= 70%
  - [ ] Commit: "feat(service): criar meu-widget.service com integração a dataset"

- [ ] **Task 4: Testes E2E do fluxo completo**
  - [ ] Escrever testes Playwright em `wg_meu_widget/e2e/wg-meu-widget.e2e.spec.ts`
  - [ ] Mock do servidor Fluig (FLUIG_BASE_URL)
  - [ ] Executar `npm run e2e`
  - [ ] Todos os cenários passando
  - [ ] Commit: "test(e2e): adicionar testes E2E para fluxo completo"
```

**Cada task deve incluir:**
- Descrição exata do que será feito
- Arquivos afetados (caminho completo)
- Ciclo TDD explícito (teste falha → implementa → passa)
- Comando exato para executar e validar (ng test, npm test, ng build, etc.)
- Mensagem de commit esperada

## Passo 4 — Salvar plano em docs/fluig/plans/

Crie ou use o diretório `docs/fluig/plans/` no projeto. Salve o plano com nome:
```
YYYY-MM-DD-<nome-funcionalidade>.md
```

**Exemplo:** `2026-03-20-integracao-dashboard.md`

O arquivo deve conter:

```markdown
# Plano de Implementação — [Nome da Funcionalidade]

**Data:** [YYYY-MM-DD]
**Design aprovado em:** [link para spec ou resumo]
**Para execução:** use `/fluig:implement`

## Artefatos a criar/modificar

[Lista de arquivos do Passo 2]

## Tasks com ciclo TDD

[Tasks do Passo 3, com checkboxes]

## Modelo por fase

| Fase | Modelo | Razão |
|------|--------|-------|
| Implementação (dev) | haiku | velocidade e contexto local |
| Review + QA | sonnet | validação semântica e conformidade |
| Opus | somente se dev solicitar explicitamente | complexidade extrema |

## Próximos passos

Após aprovação deste plano:
1. Agente `fluig-implementer` (haiku) executa tasks 1-N
2. Agente `fluig-spec-reviewer` (sonnet) valida conformidade com spec
3. Agente `fluig-reviewer` (sonnet) valida qualidade de código
4. Resultado: `/fluig:deploy`
```

## Passo 5 — Anunciar conclusão

Após salvar o plano:

> "✅ Plano salvo em `docs/fluig/plans/YYYY-MM-DD-<funcionalidade>.md`"
>
> **Próximo passo:** `/fluig:implement` para iniciar a execução das tasks com orquestração de teammates."

Inclua o caminho exato do arquivo salvo.

## Regras obrigatórias

- Não avance sem design aprovado no `/fluig:brainstorm`
- Sempre ler CLAUDE.md para usar prefixos corretos
- Tasks devem ser granulares (não confundir tasks com passos dentro de uma task)
- TDD em cada task: teste falha → implementa → teste passa
- Caminhos de arquivo sempre qualificados (relativos ao raiz do projeto)
- Comandos sempre explícitos (ng test, npm test, ng build, etc.)
- Modelo haiku para implementação, sonnet para reviews
- Plano salvo em git antes de acionar `/fluig:implement`

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
