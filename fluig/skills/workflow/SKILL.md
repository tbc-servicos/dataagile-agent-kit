---
name: workflow
description: Cria scripts de eventos BPM para workflow TOTVS Fluig. Use quando precisar de afterStateEntry, beforeStateEntry, afterProcessCreate, afterProcessFinish, subProcessCreated ou lógica de aprovação. Gera evento completo com try/catch, log.info/error, integração dataset e envio de email. Nunca hardcoda login do responsável.
---

## Consulta MCP

Antes de gerar código, consulte o MCP `tbc-knowledge`:

```
searchFluigApi({ category: "workflow" })
// → WFMovementDTO, variáveis WK*, setTaskUser, getValue/setValue, sendNotification

searchFluigPatterns({ category: "template", skill: "fluig-workflow" })
// → templates: afterStateEntry, afterProcessCreate, afterProcessFinish, funções auxiliares

searchFluigPatterns({ category: "naming" })
// → convenção wf_[nome_processo].[evento].js
```

---

## Convenções e Eventos

Consulte o MCP antes de gerar o workflow:

```
searchFluigPatterns({ skill: "fluig-workflow", category: "naming" })
searchFluigApi({ category: "workflow" })
searchKnowledge({ skill: "fluig-dev-reference", keyword: "eventos workflow" })
```

Aplique naming, eventos e padrões retornados pelo MCP.

---

## Instruções para Claude

1. **Perguntar antes de gerar:** Qual o nome do processo? Qual o evento a ser implementado? Quais as atividades do diagrama BPM e quais regras de negócio se aplicam a cada uma?
2. **Consultar MCP** para obter o template correto e a referência das variáveis WK* antes de implementar.
3. **Usar o template correto:** Selecione o template correspondente ao evento solicitado. Nunca misture a assinatura de função de um evento com o corpo de outro.
4. **Substituir atividades genéricas:** Os números de atividade nos templates são exemplos. Substitua-os pelos números reais do diagrama BPM informado pelo usuário.
5. **Sempre incluir log.info e log.error:** Todo script deve conter `log.info` no início da função principal e `log.error` no bloco `catch` com `e.message`.
6. **Para setTaskUser: nunca hardcode de login:** O login do usuário deve sempre vir de `getValue()`, de um dataset ou de um parâmetro — nunca escrito literalmente no código.
