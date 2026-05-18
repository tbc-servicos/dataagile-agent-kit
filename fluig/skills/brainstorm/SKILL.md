---
name: brainstorm
description: Gate de design para desenvolvimento Fluig. Use ANTES de criar qualquer artefato (widget, form, dataset, workflow). Entrevista o desenvolvedor, mapeia integrações e produz um design aprovado antes de acionar qualquer skill de scaffolding. Invoque ao iniciar qualquer nova funcionalidade Fluig.
disable-model-invocation: true
---

Você está iniciando o planejamento de uma funcionalidade Fluig. Nenhum código será gerado até o design ser aprovado.

## HARD GATE

Não invoque nenhuma skill de scaffolding (`fluig-widget`, `fluig-form`, `fluig-dataset`, `fluig-workflow`) antes de ter o design aprovado pelo usuário nesta skill.

## Passo 1 — Entender o artefato

Use `AskUserQuestion` com as perguntas abaixo em uma única chamada com múltiplas questões:

**Pergunta 1:** Qual(is) artefato(s) será(ão) criado(s)?
- Widget Angular (tela interativa)
- Formulário Fluig (form nativo)
- Dataset (fonte de dados)
- Workflow / evento BPM
- Combinação de múltiplos artefatos

**Pergunta 2 (aberta):** Qual é a necessidade de negócio? O que o usuário final vai conseguir fazer?

**Pergunta 3:** Há integração com outros sistemas?
- Protheus REST API
- Outro dataset Fluig existente
- Workflow existente
- Nenhuma integração externa

**Pergunta 4:** Há artefatos Fluig existentes no projeto para reaproveitar ou modificar?
- Sim (descrever quais)
- Não, tudo novo

## Passo 2 — Apresentar o design

Com base nas respostas, apresente um design estruturado contendo:

### Artefatos a criar
Liste cada artefato com nome (seguindo convenção do projeto: prefixo do CLAUDE.md), tipo e responsabilidade.

### Integrações mapeadas
Para cada integração: endpoint ou artefato de origem, dados consumidos, tratamento de erro esperado.

### Fluxo do usuário
Descreva em 3-5 passos o que o usuário final vai fazer e o que cada artefato entrega.

### Dependências entre artefatos
Se houver múltiplos artefatos: qual precisa existir antes do outro? Ex: dataset antes do widget.

### Riscos e decisões em aberto
Liste explicitamente qualquer ponto que ainda não está claro e que pode impactar o desenvolvimento.

## Passo 3 — Aprovação

Apresente o design e pergunte:

> "Este design está correto? Posso prosseguir com o scaffolding?"

**Se aprovado:**

1. Salve o design como spec em `docs/fluig/specs/YYYY-MM-DD-<topic>.md`
2. Anuncie:

```
Design aprovado e salvo em docs/fluig/specs/[arquivo].

Próximo passo: /fluig:plan → criar plano de implementação com tasks detalhadas
```

**Se não aprovado:** revise o design com base no feedback e apresente novamente.

## Regras obrigatórias

- Nunca pule direto para scaffolding sem design aprovado
- Se o CLAUDE.md do projeto existir, leia-o para usar o prefixo correto dos artefatos
- Prefira perguntar sobre riscos cedo do que descobri-los durante o desenvolvimento

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
