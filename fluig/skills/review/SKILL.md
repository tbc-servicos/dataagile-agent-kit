---
name: review
description: Atalho que orquestra o pipeline completo de qualidade Fluig. Executa sequencialmente: (1) revisão estática via fluig-reviewer, (2) testes unitários, (3) /fluig:deploy, (4) /fluig:qa. Use como atalho após mudanças ad-hoc ou quando quiser executar o pipeline completo de uma vez. Para o fluxo guiado, use /fluig:implement → /fluig:deploy → /fluig:qa.
disable-model-invocation: true
---

Você vai conduzir o pipeline completo de qualidade Fluig. Este é um **atalho** que orquestra as skills individuais em sequência.

> **Nota:** No fluxo guiado (`/fluig:brainstorm → plan → implement → deploy → qa → verify`), cada skill é acionada individualmente. Este `/fluig:review` serve como atalho para mudanças ad-hoc ou correções rápidas.

## HARD GATE

Não declare o artefato "aprovado" ou "pronto para produção" sem completar os 5 passos abaixo com resultado positivo em cada um.

## Regra de Modelos

Teammates de review e QA usam **sonnet**. Nunca escalar para opus automaticamente — se necessário, sugerir ao dev.

## Passo 1 — Revisão Estática (fluig-reviewer)

Antes de qualquer teste ou deploy, acione o agente `fluig-reviewer` para revisar o código localmente.

Instrução ao agente:
> "Revise os artefatos [listar arquivos] seguindo o checklist completo de código Fluig."

O agente `fluig-reviewer` consultará o MCP para obter as regras atualizadas automaticamente.

**Se fluig-reviewer retornar itens CRÍTICOS:** corrija antes de prosseguir. Não avance para o Passo 2.

**Se fluig-reviewer retornar apenas AVISOS:** documente-os e prossiga com o Passo 2.

## Passo 2 — Testes Unitários (fluig-test / Jasmine + Karma)

Com o código revisado e sem itens críticos, execute os testes unitários locais.

Acione a skill `/fluig:test` solicitando execução dos testes unitários:
> "Execute os testes unitários Jasmine/Karma do artefato [nome]. Não gere novos testes — execute os existentes."

Se não houver testes unitários ainda:
> "Gere e execute os testes unitários Jasmine/Karma para o artefato [nome]."

Threshold mínimo: **70% de cobertura** (configurado no karma.conf.js).

**Se os testes unitários falharem:** corrija o código ou os testes e volte ao Passo 1.

**Se coberta < 70%:** adicione testes antes de prosseguir.

**Se os testes passarem com cobertura adequada:** prossiga para o Passo 3.

## Passo 3 — Deploy no Servidor de Teste (fluig-deployer)

Antes de executar, leia o CLAUDE.md do projeto para identificar:
- Se há ambiente de homologação (HML): use-o como destino
- Se há apenas um servidor: use-o, mas confirme explicitamente com o usuário

Confirme com o usuário antes de deployar:
> "Vou fazer o deploy de [artefatos] para [servidor/ambiente]. Confirma?"

Após confirmação, acione o agente `fluig-deployer`:
> "Faça o deploy dos artefatos [listar] para o ambiente [HML ou servidor único do CLAUDE.md]."

**Se o deploy falhar:** reporte o erro ao usuário e aguarde correção. Não avance para o Passo 4.

## Passo 4 — Testes E2E no Servidor (fluig-test / Playwright)

Com os artefatos publicados no servidor, execute os testes E2E.

Acione a skill `/fluig:test` solicitando execução dos testes E2E:
> "Execute os testes Playwright E2E do artefato [nome] contra o servidor [URL do Passo 3]. Não gere novos testes — execute os existentes."

Se não houver testes E2E ainda:
> "Gere e execute os testes Playwright E2E para o artefato [nome] contra o servidor [URL]."

Os testes E2E usam `FLUIG_BASE_URL` apontando para o servidor do Passo 3 — nunca localhost.

**Se os testes E2E falharem:** corrija o artefato, redeploy (Passo 3) e execute novamente.

**Se os testes E2E passarem:** prossiga para o Passo 5.

## Passo 5 — QA no Servidor (fluig-qa)

Com os artefatos publicados e testes E2E passando, acione o agente `fluig-qa`:
> "Analise a qualidade dos artefatos [listar] publicados em [URL do servidor]. Verifique casos de borda, campos obrigatórios sem validação, datasets sem constraints de filtro e cobertura de testes."

O agente `fluig-qa` acessa o servidor real para validar o comportamento.

**Se fluig-qa retornar itens de risco ALTO:** corrija, volte ao Passo 1 e repita o ciclo.

**Se fluig-qa retornar apenas riscos MÉDIO/BAIXO:** documente e apresente o resultado ao usuário.

## Resultado do Review

Ao final dos 5 passos, apresente um resumo:

```
REVIEW CONCLUIDO — [nome do artefato]

Passo 1 — Revisão estática: [APROVADO / APROVADO COM AVISOS]
  Avisos: [listar se houver]

Passo 2 — Testes unitários: [APROVADO] — cobertura: [X%]

Passo 3 — Deploy teste: [APROVADO] em [URL servidor]

Passo 4 — Testes E2E: [APROVADO] — [N] cenários passando

Passo 5 — QA servidor: [APROVADO / APROVADO COM RESSALVAS]
  Ressalvas: [listar se houver]

Próximo passo: /fluig:verify → deploy final
```

## Regras obrigatórias

- Os 5 passos são sequenciais — nunca em paralelo
- Testes unitários antes do deploy (Jasmine/Karma rodam localmente)
- Deploy obrigatório antes dos testes E2E (Playwright exige servidor real)
- E2E nunca usa localhost — sempre o servidor do Passo 3
- Sempre ler CLAUDE.md para saber servidor e prefixo antes de acionar qualquer agente
- Sempre confirmar com o usuário antes de fazer qualquer deploy

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
