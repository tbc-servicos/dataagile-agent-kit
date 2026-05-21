# PO-UI Plugin

Plugin Claude Code para desenvolvimento com **PO-UI** — biblioteca oficial de componentes Angular da TOTVS, usada em fronts Protheus, Fluig e outros produtos.

> Instalação do kit completo DataAgile: [INSTALL.md](../INSTALL.md)

## O que entrega

- **MCP server `@po-ui/mcp`** — 4 tools para consulta direta de componentes, docs e exemplos
- **Skill PO-UI** — guia o agent sobre quando consultar antes de codar, qual componente usar, convenções obrigatórias
- **Conhecimento curado** — substitui busca manual na documentação web

## Instalação

### Opção 1: Marketplace público

```bash
/plugin marketplace add https://github.com/tbc-servicos/dataagile-agent-kit.git
/plugin install po-ui@claude-skills-dataagile
```

### Opção 2: `--plugin-dir` (local)

```bash
claude --plugin-dir /path/to/po-ui-plugin
```

## Quando usar

- Construindo qualquer UI Angular que use PO-UI
- Projetos Protheus com `Angular+PO-UI`
- Projetos Fluig com widgets em `Angular+PO-UI`
- Migrações de Angular Material → PO-UI

## Tools MCP

| Tool | Função |
|------|--------|
| `list_components` | Lista componentes por categoria |
| `get_component_docs` | Doc completa de um componente (inputs/outputs/exemplos) |
| `search_docs` | Busca textual na documentação oficial |
| `get_guide` | Guias temáticos (acessibilidade, theming, i18n, performance) |

## Convenções

- Sempre PO-UI, nunca Angular Material puro
- `PoNotificationService` para notificações
- `po-table` com colunas tipadas
- `po-dynamic-form` ou campos PO para formulários
- Ícones `po-icon-*` da biblioteca

## Combinar com outros plugins

- **`protheus`** — desenvolvimento Protheus (ADVPL/TLPP/Angular+PO-UI)
- **`fluig`** — desenvolvimento Fluig (Angular+PO-UI)
- **`playwright`** — testes E2E

Os plugins Protheus e Fluig já incluem PO-UI MCP no próprio `.mcp.json`. Este plugin standalone é útil quando o projeto **não** é Protheus/Fluig mas usa PO-UI.

## Recursos

- Site: https://po-ui.io
- Docs LLM: https://po-ui.io/llms.txt
- Repositório npm: https://www.npmjs.com/package/@po-ui/mcp
