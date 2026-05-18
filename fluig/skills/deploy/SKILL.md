---
name: deploy
description: Deploy de artefatos Fluig no servidor de teste. Lê CLAUDE.md para identificar ambiente, confirma com o dev, aciona fluig-deployer teammate e verifica logs. Acione após /fluig:implement. Próximo passo obrigatório: /fluig:qa.
disable-model-invocation: true
---

Você vai conduzir o deploy de artefatos Fluig no servidor de teste de forma segura e controlada.

## HARD GATE

Não inicie o deploy se as tarefas de implementação não estiverem concluídas. Verifique o status das tarefas antes de prosseguir.

## Passo 1 — Ler contexto do projeto

Leia o CLAUDE.md do projeto para identificar:
- **Servidor de teste:** URL disponível e seu ambiente
- **Prefixo do cliente:** para confirmar que os artefatos corretos serão deployados
- **Integração Protheus:** se existir, confirmar que a URL da API está correta

Se o CLAUDE.md não existir no projeto atual, pergunte ao usuário o servidor de destino antes de prosseguir.

## Passo 2 — Confirmar ambiente com o usuário

Use `AskUserQuestion` para confirmar o deploy:

```
Vou fazer o deploy de [artefatos] para [servidor/ambiente].
Confirma o deploy neste ambiente?
```

Aguarde confirmação explícita do usuário antes de prosseguir.

## Passo 3 — Acionar fluig-deployer

Após confirmação, acione o agente `fluig-deployer` via SendMessage:

```
Faça o deploy dos artefatos [listar nomes completos] para o ambiente [servidor de teste do CLAUDE.md].
Verifique o status antes e depois do deploy, e confirme sucesso nos logs.
```

Forneça:
- Lista de artefatos específicos (datasets, formulários, widgets com dist compilado)
- URL/ambiente exato do CLAUDE.md
- Instrução para verificar status antes

## Passo 4 — Verificar logs pós-deploy

Aguarde resposta do fluig-deployer confirmando:
- Status do servidor antes e depois
- Absence de erros críticos nos logs
- URL(s) onde os artefatos foram publicados

Se houver erros nos logs, reporte ao usuário e sugira `/fluig:debug` antes de retomar.

## Passo 5 — Anunciar conclusão

Apresente resultado:

```
Deploy concluído em [URL servidor].

Artefatos publicados:
- [listar artefatos com URLs diretas se disponíveis]

Para validar o comportamento no servidor:
  Acesse [URL] e verifique [cenários esperados].

Próximo passo: /fluig:qa
```

## Regras obrigatórias

- Sempre ler CLAUDE.md para identificar o servidor correto — nunca assumir
- Sempre confirmar com o usuário antes de iniciar o deploy
- Nunca fazer deploy sem sucesso confirmado nos logs
- Se houver falha: reporte erro e sugira `/fluig:debug`
- O próximo passo obrigatório é `/fluig:qa` — não pule testes de integração

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
