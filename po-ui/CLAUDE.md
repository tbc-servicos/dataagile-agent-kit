# PO-UI Plugin — Claude Code

Plugin que expõe o MCP server oficial **@po-ui/mcp** para consulta de componentes Angular PO-UI (TOTVS).

## Quando usar

- Construir UI Angular para Protheus, Fluig ou qualquer projeto que adote PO-UI
- Antes de escrever qualquer componente: consultar o MCP para garantir uso correto de inputs/outputs/events
- Substituir buscas manuais na documentação web — o MCP entrega componentes, exemplos e guias direto no contexto

## Tools MCP disponíveis

| Tool | Uso |
|------|-----|
| `list_components` | Listar todos componentes PO-UI por categoria (form, layout, navigation, etc) |
| `get_component_docs` | Detalhes completos de um componente (inputs, outputs, exemplos, properties) |
| `search_docs` | Busca textual na documentação |
| `get_guide` | Guias temáticos (acessibilidade, theming, i18n, performance) |

## Convenções obrigatórias

- **Nunca** Angular Material puro — sempre PO-UI
- Notificações: `PoNotificationService` (nunca `alert()`)
- Tabelas: `po-table` com `p-columns` tipadas
- Formulários reativos: `po-dynamic-form` ou campos PO individuais
- Ícones: prefixo `po-icon-*`
- Tema: `@po-ui/style` (não criar variáveis CSS manualmente)

## Instalação em projeto Angular

```bash
ng add @po-ui/ng-components
```

## Recursos externos

- Site oficial: https://po-ui.io
- Docs LLM compacta: https://po-ui.io/llms.txt
- Docs LLM expandida: https://po-ui.io/llms-full.txt
