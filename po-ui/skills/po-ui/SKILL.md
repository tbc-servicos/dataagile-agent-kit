---
name: po-ui
description: Consulta componentes, inputs/outputs, exemplos e guias da biblioteca PO-UI (Angular TOTVS) via MCP server oficial. Use antes de escrever ou modificar qualquer UI que utilize PO-UI.
---

# Skill: PO-UI Component Reference

## Quando ativar

Sempre que a tarefa envolva:

- Criar componente Angular novo usando PO-UI
- Modificar componente existente que use `po-*` tags
- Decidir entre Angular Material e PO-UI (resposta: **sempre PO-UI**)
- Buscar input/output específico (ex: `po-table` com paginação infinita)
- Configurar tema, i18n, acessibilidade PO-UI
- Resolver erro de componente PO-UI (input errado, output não chamado, layout quebrado)

## Fluxo obrigatório antes de codar

1. **Identificar o componente**: usar `list_components` quando não souber o nome exato
2. **Buscar doc detalhada**: `get_component_docs` com o nome do componente
3. **Consultar exemplo**: incluído na doc; copiar estrutura base
4. **Verificar inputs/outputs**: nome exato, tipo, valor default
5. **Aplicar no código**: usar nome de propriedades EXATO da doc (case-sensitive, prefixo `p-`)

## Tools MCP

### `list_components`

Lista todos componentes PO-UI agrupados por categoria.

**Use quando**: não sabe o nome do componente ou quer ver opções disponíveis em uma categoria.

**Exemplo de retorno**: `po-table, po-button, po-input, po-dynamic-form, po-page, po-modal, ...`

### `get_component_docs`

Doc completa de um componente: descrição, inputs (`p-*`), outputs (`p-*-change`), métodos públicos, exemplos.

**Use quando**: já sabe o nome (ou aprendeu via `list_components`) e precisa implementar.

**Parâmetros**: `component_name` (ex: `"po-table"`)

### `search_docs`

Busca textual livre na documentação oficial — para conceitos, guias, dúvidas que não mapeiam diretamente a um componente.

**Use quando**: pergunta tipo "como faço paginação infinita" ou "exemplo de upload de arquivo".

### `get_guide`

Guias temáticos: acessibilidade, theming, i18n, performance, setup.

**Use quando**: configuração transversal (não específica de componente).

## Convenções obrigatórias

| Convenção | Regra |
|-----------|-------|
| Biblioteca UI | **PO-UI sempre**, nunca Angular Material |
| Notificações | `PoNotificationService` (success/warning/error/info), nunca `alert()` |
| Tabelas | `po-table` com `p-columns` tipadas (`[{ property, label, type }]`) |
| Formulários reativos | `po-dynamic-form` (preferencial) ou campos PO individuais (`po-input`, `po-select`, `po-datepicker`) |
| Ícones | prefixo `po-icon-*` (lista completa em `get_component_docs` de `po-icon`) |
| Tema | `@po-ui/style` — não criar variáveis CSS manuais |
| Loading | `p-loading="true"` no componente, não overlay custom |
| Layout | `po-page-default`, `po-page-dynamic-table`, `po-page-dynamic-edit` conforme tipo de tela |

## Anti-padrões

| Anti-padrão | Correção |
|-------------|----------|
| `import { MatTable } from '@angular/material'` | Use `PoTableModule` |
| `alert("erro")` | `this.poNotification.error({ message: '...' })` |
| `<table>` HTML puro | `<po-table>` com colunas tipadas |
| Variáveis CSS hardcoded (`#1a4d5c`) | Tokens do tema `@po-ui/style` |
| `getElementById` para focus | `ViewChild` + métodos do componente PO |

## Instalação em projeto novo

```bash
ng add @po-ui/ng-components
```

Inclui automaticamente:

- `@po-ui/ng-components`
- `@po-ui/ng-templates`
- `@po-ui/style`
- Configuração de tema padrão

## Recursos

- Site: https://po-ui.io
- Docs LLM compacta: https://po-ui.io/llms.txt
- Docs LLM expandida: https://po-ui.io/llms-full.txt
- npm MCP: https://www.npmjs.com/package/@po-ui/mcp
