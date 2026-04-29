---
name: test
description: Gera e orienta execução de testes para widgets TOTVS Fluig. Unit tests com Jasmine + Karma e E2E com Playwright. Sempre questiona a URL do servidor antes de gerar configurações E2E. O E2E requer build + deploy antes de executar.
---

Você vai ajudar a criar e executar testes para widgets Fluig.

Existem dois tipos de teste:
- **Unit (Jasmine + Karma):** testa componentes, services e pipes isoladamente, sem servidor
- **E2E (Playwright):** testa o widget publicado no servidor Fluig real

---

## HARD GATE — Antes de qualquer E2E

Antes de gerar qualquer configuração E2E ou executar testes E2E, você DEVE:

1. Perguntar ao usuário a URL do servidor Fluig (ex: `https://fluig.empresa.com.br`)
2. Confirmar que o widget já foi publicado **ou** executar o fluxo de build + deploy agora
3. Nunca usar `localhost` como base URL — widgets Fluig só rodam no servidor Fluig

Use `AskUserQuestion` para coletar:
- URL do servidor Fluig
- Usuário e senha (ou confirmar que `FLUIG_USER`/`FLUIG_PASSWORD` estão definidos)
- Página Fluig onde o widget está publicado (ex: `/portal/p/home`)

---

## Busca de Testes Existentes (Context Enrichment)

Após confirmar o widget/módulo, consulte testes similares antes de gerar:

```
listTests({ platform: "fluig", module: "<widget/módulo>", limit: 5 })
```

- Se retornar resultados: mostre os cenários existentes e pergunte se quer algo diferente ou complementar
- Se retornar vazio: prossiga normalmente
- Use os exemplos para manter consistência de page objects e seletores

---

## Unit Tests — Jasmine + Karma

Estrutura esperada, configuração karma.conf.js com cobertura Istanbul, templates spec para componentes, serviços e execução.

Consulte a referência completa via MCP:
```
search_knowledge({ skill: "fluig-test", keyword: "unit tests" })
```

---

## E2E Tests — Playwright

HARD GATE: build + deploy obrigatório antes dos testes.

**Restrições Fluig obrigatórias:**
- `BASE_URL` = URL do servidor Fluig real (ex: `https://fluig.empresa.com.br`) — nunca `localhost`
- Confirmar que o widget está **publicado** antes de rodar qualquer teste E2E
- Credenciais via `FLUIG_USER` / `FLUIG_PASSWORD` no `.env.test` — nunca hardcoded
- A página de teste deve ser a página Fluig onde o widget está publicado (ex: `/portal/p/home`)

Para setup completo, `playwright.config.ts`, CLI commands, autenticação via `storageState` e templates, use o plugin playwright:

```
/playwright:playwright-cli
```

---

## Regras Obrigatórias

- `coverage/` nunca commitado
- Usuário e senha via variáveis de ambiente, nunca hardcoded
- Todos os specs devem cobrir casos de erro
- E2E requer deploy prévio

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```

---

## Gravar Teste no MCP (após validação)

Após confirmação que o teste E2E passou no servidor Fluig real:

> "Teste validado. Quer salvar na base de conhecimento para outros devs reutilizarem?"

Apresente o rascunho para revisão antes de persistir:

```
platform:  fluig
module:    <nome do widget/módulo>
title:     <título descritivo>
scenario:  <o que o teste valida>
script:    <código Playwright completo>
tags:      <CSV, ex: "widget,formulario,aprovacao">
```

Somente após confirmação explícita do dev, chame:

```
saveTest({
  platform:     "fluig",
  module:       "<módulo>",
  title:        "<título>",
  scenario:     "<cenário>",
  script:       "<script>",
  tags:         "<tags>",
  submitted_by: "<email via FLUIG_USER ou ~/.config/tbc/dev-config.json>"
})
```

Resposta de sucesso: "✅ Teste #\<id\> salvo na base de conhecimento."
Em caso de erro: preserve o rascunho para o dev salvar manualmente.