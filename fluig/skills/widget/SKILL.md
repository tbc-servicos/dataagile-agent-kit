---
name: widget
description: Cria widget Angular 19 + PO-UI 19.36.0 para TOTVS Fluig. Estrutura completa com components, pages, services, testes Jasmine+Karma. Padrão: wg_[nome-kebab-case].
---

## Consulta MCP

Antes de gerar código, consulte o MCP `tbc-knowledge`:

```
searchFluigApi({ category: "widget" })
// → DatasetFactory client-side, REST Protheus, fluigc no contexto Angular

searchFluigPatterns({ category: "template", skill: "fluig-widget" })
// → templates: package.json, angular.json, app.module.ts, components, services, specs

searchFluigPatterns({ category: "conventions" })
// → convenções PO-UI, estrutura de módulos, boas práticas Angular/Fluig
```

---

## Stack e Estrutura

Consulte o MCP antes de gerar o widget:

```
searchFluigPatterns({ skill: "fluig-widget", category: "convention" })
searchFluigPatterns({ skill: "fluig-widget", category: "template" })
searchFluigPatterns({ skill: "fluig-widget", category: "naming" })
```

Aplique a stack, estrutura de pastas e convenções retornadas pelo MCP.

---

## Instruções para Claude

1. **Perguntar antes de gerar:** Qual o nome do widget? Qual a finalidade (listagem, formulário, dashboard)? Precisa integrar com dataset ou REST Protheus?
2. **Consultar MCP** para obter os templates de configuração (package.json, angular.json, app.module.ts) e os padrões PO-UI antes de gerar os arquivos.
3. **Criar TODOS os arquivos** da estrutura — incluindo configurações e specs de teste.
4. **Usar apenas PO-UI** para componentes visuais — nunca Angular Material isolado.
5. **Testes são obrigatórios:** gerar spec para cada componente e serviço criado.
