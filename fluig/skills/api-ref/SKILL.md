---
name: api-ref
description: Referência das APIs TOTVS Fluig — DatasetFactory, DatasetBuilder, CardAPI, WCMAPI, fluigc, WFMovementDTO, getValue/setValue. Use quando tiver dúvida sobre qual API usar no Fluig, sintaxe de dataset, como manipular formulário, ou diferença entre APIs de workflow e formulário.
---

## Boas práticas

- Use a referência para identificar APIs, parâmetros e padrões — não cole trechos longos de código de terceiros
- Para customizações, crie datasets, widgets e workflows próprios em vez de duplicar comportamento já fornecido pelo Fluig
- Quando precisar de detalhe de implementação interno do Fluig, oriente o usuário a consultar o **TDN oficial** (tdn.totvs.com)

# Fluig API Reference

Referência completa das APIs TOTVS Fluig via MCP `tbc-knowledge`.

## Consulta MCP

### searchFluigApi — Referência de APIs

Busca documentação de APIs por categoria:

```
searchFluigApi({ category: "dataset" })      // DatasetFactory, DatasetBuilder, constraints
searchFluigApi({ category: "form" })         // CardAPI, WCMAPI, getValue/setValue, masks
searchFluigApi({ category: "workflow" })     // WFMovementDTO, variáveis WK*, setTaskUser
searchFluigApi({ category: "widget" })       // DatasetFactory client-side, REST Protheus
searchFluigApi({ category: "fluigc" })       // fluigc components (modal, message, etc)
searchFluigApi({ category: "rest" })         // REST endpoints Fluig
```

Busca livre por palavra-chave:
```
searchFluigApi({ query: "DatasetFactory createDataset" })
searchFluigApi({ query: "WKUser WKNumState" })
searchFluigApi({ query: "jQuery mask CPF" })
```

### searchFluigPatterns — Padrões e Templates de Código

Busca padrões, convenções e templates por categoria e skill:

```
searchFluigPatterns({ category: "template", skill: "fluig-dataset" })
searchFluigPatterns({ category: "template", skill: "fluig-form" })
searchFluigPatterns({ category: "template", skill: "fluig-workflow" })
searchFluigPatterns({ category: "template", skill: "fluig-widget" })
searchFluigPatterns({ category: "naming" })        // convenções de nomenclatura
searchFluigPatterns({ category: "review" })        // regras de code review
searchFluigPatterns({ category: "qa" })            // checklist de QA
searchFluigPatterns({ category: "conventions" })   // boas práticas gerais
```

Busca livre:
```
searchFluigPatterns({ query: "try catch logging dataset" })
searchFluigPatterns({ query: "SweetAlert2 validação formulário" })
```

## Quando usar cada tool

| Dúvida | Tool |
|--------|------|
| Qual método usar para consultar dataset? | `searchFluigApi({ category: "dataset" })` |
| Como obter valor de campo no formulário? | `searchFluigApi({ category: "form" })` |
| Quais variáveis WK* existem no workflow? | `searchFluigApi({ category: "workflow" })` |
| Como estruturar um dataset corretamente? | `searchFluigPatterns({ category: "template", skill: "fluig-dataset" })` |
| Qual a convenção de nomenclatura? | `searchFluigPatterns({ category: "naming" })` |
| O código passa no review? | `searchFluigPatterns({ category: "review" })` |
