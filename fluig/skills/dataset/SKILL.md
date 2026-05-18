---
name: dataset
description: Cria dataset JavaScript para TOTVS Fluig com defineStructure(), createDataset(), try/catch e logging completo. Use quando precisar consultar dados no Fluig, integrar com Protheus via REST, consulta SQL, atualizar dados externos ou dataset com constraints. Suporta: SQL simples, REST Protheus (GET/POST), SQL dinâmico com validação anti-injection.
---

## Consulta MCP

Antes de gerar código, consulte o MCP `tbc-knowledge`:

```
searchFluigApi({ category: "dataset" })
// → métodos DatasetFactory, DatasetBuilder, constraints, colunas

searchFluigPatterns({ category: "template", skill: "fluig-dataset" })
// → templates: base, SQL, REST Protheus, constraints

searchFluigPatterns({ category: "naming" })
// → convenção de nomenclatura ds_[acao]_[entidade].js
```

---

## Fluxo de Desenvolvimento

1. Nomear dataset: `ds_[acao]_[entidade].js`
2. Implementar `defineStructure()` — define colunas
3. Implementar `createDataset()` — executa lógica, retorna dados
4. Sempre usar `try/catch` e logging
5. Testar com fluig-test

---

## Instruções para Claude

1. **Perguntar antes de gerar:** Qual o nome do dataset? Qual a fonte de dados (SQL, REST Protheus, dataset interno)? Quais colunas retornar? Precisa de constraints?
2. **Consultar MCP** para obter o template correto conforme o tipo de dataset solicitado.
3. **Sempre incluir** `try/catch` com `log.info` na entrada e `log.error` no catch.
4. **Validar inputs** em datasets SQL dinâmico — nunca concatenar parâmetros sem sanitização.
5. **Nomear corretamente:** `ds_[acao]_[entidade].js` em snake_case.
