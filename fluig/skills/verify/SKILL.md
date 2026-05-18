---
name: verify
description: Gate de deploy final para artefatos Fluig. Checklist adaptativo baseado no ambiente do projeto (HML vs servidor único). Acione após fluig-review aprovado, antes de declarar o artefato pronto para produção. Confirma ambiente, valida checklist e aciona o deploy final via fluig-deployer.
disable-model-invocation: true
---

Você vai conduzir o gate final antes de declarar um artefato Fluig pronto para produção.

## HARD GATE

Não acione o deploy final e não declare o artefato "pronto" sem completar o checklist abaixo com todas as respostas positivas.

## Passo 1 — Ler contexto do projeto

Leia o CLAUDE.md do projeto para identificar:
- **Servidor(es):** URL(s) disponíveis e seus ambientes (HML, produção, único)
- **Prefixo do cliente:** para confirmar que os artefatos corretos serão deployados
- **Integração Protheus:** se existir, confirmar que a URL da API está correta

Se o CLAUDE.md não existir no projeto atual, pergunte ao usuário o servidor de destino antes de prosseguir.

## Passo 2 — Checklist adaptativo

### Se o projeto tem ambiente HML (homologação separado de produção):

Use `AskUserQuestion` para confirmar cada item:

1. O `fluig-review` foi executado e retornou aprovado no ambiente HML?
2. Os itens CRÍTICOS da revisão estática estão corrigidos?
3. O deploy será feito em **PRODUÇÃO** (não HML) — confirma o ambiente correto?
4. Há um plano de rollback definido? (qual versão anterior, como reverter via fluig-deployer)
5. O responsável pelo ambiente de produção foi notificado?

### Se o projeto tem servidor único:

Use `AskUserQuestion` para confirmar cada item:

1. O `fluig-review` foi executado e retornou aprovado?
2. Os itens CRÍTICOS da revisão estática estão corrigidos?
3. O fluig-qa não retornou nenhum item de risco ALTO?
4. Há um plano de rollback definido? (backup do artefato anterior)
5. O horário de deploy é adequado? (evitar horário de pico de uso)

**Se qualquer item for respondido negativamente:** não prossiga. Indique o que precisa ser resolvido antes de retomar.

## Passo 3 — Confirmação final

Apresente um resumo antes do deploy:

```
DEPLOY FINAL — [nome do artefato]

Artefato(s): [listar com nomes completos]
Servidor destino: [URL]
Ambiente: [Produção / Servidor único]
Checklist: ✅ Todos os itens confirmados

Confirma o deploy?
```

Aguarde confirmação explícita do usuário antes de prosseguir ("sim", "confirma" ou "pode deployar").

## Passo 4 — Deploy final (fluig-deployer)

Após confirmação, acione o agente `fluig-deployer`:
> "Faça o deploy dos artefatos [listar] para [URL servidor de produção / servidor único]."

## Passo 5 — Resultado

Após o deploy com sucesso, apresente:

```
DEPLOY CONCLUÍDO — [nome do artefato]

Artefato(s) publicado(s) em: [URL]

Para validar no servidor:
  Acesse [URL do artefato no Fluig] e verifique o comportamento esperado.

Em caso de problema — rollback:
  "use fluig-deployer to rollback [artefato] to previous version"
```

## Regras obrigatórias

- Nunca fazer deploy em produção sem confirmação explícita do usuário
- Sempre ler CLAUDE.md para identificar o ambiente correto — nunca assumir
- Se o projeto não tiver CLAUDE.md, perguntar o servidor antes de prosseguir
- Sempre informar como fazer rollback após o deploy
- Checklist HML e servidor único são diferentes — não misturar

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
