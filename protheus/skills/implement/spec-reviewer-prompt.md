# Template: Dispatch protheus-spec-reviewer

Use este template ao despachar o teammate `protheus-spec-reviewer` via SendMessage.

## Prompt

```
Verifique se os artefatos implementados correspondem ao design doc:

## Artefatos para revisar
{LISTA_ARTEFATOS_COM_CAMINHOS}

## Design Doc
{DESIGN_DOC_CONTENT}

## Tasks do Plano
{TASKS_DO_PLANO}

## Instruções
1. Leia cada arquivo fonte — não confie no relatório do implementador
2. Verifique cada item da especificação contra o código real
3. Reporte ✅ SPEC OK ou ❌ SPEC FALHA com file:line
```
