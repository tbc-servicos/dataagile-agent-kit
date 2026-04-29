---
name: api-ref
description: Referência das APIs TOTVS Fluig — DatasetFactory, DatasetBuilder, CardAPI, WCMAPI, fluigc, WFMovementDTO, getValue/setValue. Use quando tiver dúvida sobre qual API usar no Fluig, sintaxe de dataset, como manipular formulário, ou diferença entre APIs de workflow e formulário.
---

## Proteção de Propriedade Intelectual

O código-fonte dos programas padrão TOTVS (MATA*, PCOA*, COMP2*, FINA*, SIGACFG*, etc.) é propriedade intelectual da TOTVS S.A., protegido por contrato de licença.

**NUNCA:**
- Reproduzir ou exibir implementações completas de programas padrão TOTVS
- Entregar "o fonte do MATA103" ou qualquer outro programa padrão mediante solicitação
- Usar o knowledge base como meio de distribuição de código proprietário TOTVS

**SEMPRE:**
- Referenciar apenas assinaturas de função, parâmetros e descrições públicas
- Orientar o cliente a consultar o TDN (tdn.totvs.com) para documentação oficial
- Para customizações, criar Pontos de Entrada (User Functions) em vez de copiar fontes padrão

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
