---
name: deploy
description: Compila artefatos ADVPL/TLPP no AppServer e gera patch .ptm para aplicação no ambiente. Lê CLAUDE.md para parâmetros, confirma com o dev, aciona protheus-deployer teammate e verifica logs. Acione após /protheus:implement. Próximo passo obrigatório: /protheus:qa.
disable-model-invocation: true
---

Você vai conduzir a compilação e deploy de artefatos ADVPL/TLPP no AppServer Protheus.

## HARD GATE

Não inicie a compilação se as tarefas de implementação não estiverem concluídas e aprovadas nos reviews.

## Passo 1 — Ler contexto do projeto

Leia o CLAUDE.md do projeto para identificar:
- **AppServer:** host, porta, environment
- **Credenciais:** user, password, auth token
- **Includes:** diretório de includes do AppServer
- **Prefixo do cliente:** para confirmar artefatos corretos

Se o CLAUDE.md não existir, pergunte ao usuário os parâmetros antes de prosseguir.

## Passo 2 — Lint local (advpls appre)

Antes de compilar no servidor, rode lint local em todos os artefatos:

```bash
advpls appre /caminho/arquivo.prw -I /caminho/includes/
```

**Se houver erros tipo "0":** pare e reporte. Não avance para compilação.
**Se houver apenas avisos:** documente e prossiga.

## Passo 3 — Confirmar ambiente com o usuário

Use `AskUserQuestion` para confirmar:

```
Vou compilar [artefatos] no AppServer [servidor:porta] ambiente [ENV].
Gerar patch .ptm? [sim/não]
Confirma?
```

Aguarde confirmação explícita antes de prosseguir.

## Passo 4 — Acionar protheus-deployer

Após confirmação, acione o teammate `protheus-deployer` via SendMessage:

```
Compile os artefatos [listar nomes completos com caminho absoluto] no AppServer.
Parâmetros do CLAUDE.md: server=[X], port=[X], env=[X], user=[X], includes=[X].
Gere patch .ptm com nome [PATCH_NAME] em [SAVE_DIR].
Verifique o exit code e reporte erros com arquivo + linha.
```

## Passo 5 — Verificar resultado

Aguarde resposta do protheus-deployer confirmando:
- Exit code da compilação
- Patch .ptm gerado (se solicitado)
- Erros com arquivo + linha (se houver)

**Se houver erros de compilação:** reporte ao usuário e sugira `/protheus:diagnose` antes de retomar.

## Passo 6 — Anunciar conclusão

```
Deploy concluído no AppServer [servidor:porta] ambiente [ENV].

Artefatos compilados:
- [listar artefatos]

Patch gerado: [nome.ptm] em [diretório]

Próximo passo: /protheus:qa
```

## Regras obrigatórias

- Sempre ler CLAUDE.md para parâmetros do AppServer — nunca assumir
- Sempre rodar lint (appre) antes de compilar no servidor
- Sempre confirmar com o usuário antes de compilar
- Se houver falha: reporte erro e sugira `/protheus:diagnose`
- O próximo passo obrigatório é `/protheus:qa` — não pule testes

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
