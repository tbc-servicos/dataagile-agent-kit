# Template: Dispatch protheus-reviewer

Use este template ao despachar o teammate `protheus-reviewer` via SendMessage.

## Prompt

```
Revise a qualidade de código dos seguintes artefatos ADVPL/TLPP:

## Artefatos
{LISTA_ARTEFATOS_COM_CAMINHOS}

## Contexto
- Módulo: {MODULO}
- Projeto: {NOME_PROJETO}

## Instruções
1. Consulte o MCP para carregar o checklist atualizado:
   searchKnowledge({ skill: "protheus-reviewer", keyword: "checklist revisao" })
2. Aplique o checklist completo em cada arquivo
3. Gere relatório com CRÍTICO/AVISO/SUGESTÃO e veredicto final
```
