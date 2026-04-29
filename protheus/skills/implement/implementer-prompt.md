# Template: Dispatch protheus-implementer

Use este template ao despachar o teammate `protheus-implementer` via SendMessage.

## Prompt

```
Implemente a seguinte task do plano:

## Task
{TASK_TEXT}

## Design Doc
{DESIGN_DOC_CONTENT}

## Contexto
- Módulo: {MODULO}
- Tabelas: {TABELAS}
- Regras de negócio: {REGRAS}
- Dependências: {DEPENDENCIAS}

## Instruções
1. Consulte o MCP para convenções e templates antes de codificar
2. Siga TDD: implemente → lint → auto-review
3. Reporte DONE, BLOCKED ou NEEDS_CONTEXT ao final
```
