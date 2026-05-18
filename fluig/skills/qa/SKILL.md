---
name: qa
description: Testes de integração e E2E (Playwright) contra servidor Fluig deployado. Aciona fluig:test e fluig-qa teammate. Se riscos ALTOS encontrados, retorna para /fluig:implement. Acione após /fluig:deploy. Próximo passo: /fluig:verify.
disable-model-invocation: true
---

Você vai conduzir testes de integração e QA contra os artefatos deployados no servidor Fluig.

## HARD GATE

Não inicie testes de QA se:
- O deploy não foi realizado com sucesso (não há servidor com os artefatos)
- O servidor não está acessível ou os artefatos não estão publicados

Verifique que o deploy do Passo 3 anterior foi concluído antes de prosseguir.

## Passo 1 — Executar testes E2E (Playwright)

Acione a skill `/fluig:test` solicitando execução dos testes E2E contra o servidor deployado:

```
Execute os testes Playwright E2E dos artefatos [nomes] contra o servidor [URL do deploy anterior].
Não gere novos testes — execute os existentes.
Use FLUIG_BASE_URL apontando para o servidor (nunca localhost).
```

Os testes E2E devem validar:
- Carregamento dos formulários e datasets no servidor real
- Integração com Protheus (se aplicável)
- Fluxo completo do usuário contra a API Fluig live

**Se os testes E2E falharem:** corrija o artefato, redeploy via `/fluig:deploy` e retorne para este passo.

## Passo 2 — Acionar fluig-qa para análise de qualidade

Após testes E2E passando, acione o agente `fluig-qa` via SendMessage (model: sonnet):

```
Analise a qualidade dos artefatos [listar nomes] publicados em [URL servidor].
Verifique: casos de borda não tratados, campos obrigatórios sem validação,
datasets sem constraints de filtro, cobertura de testes em widgets, e estado de erro.
Classifique riscos como ALTO, MÉDIO ou BAIXO.
```

O agente `fluig-qa` acessa o servidor real para validar comportamento e identificar:
- Validações faltantes
- Tratamento de erros inadequado
- Cenários de borda expostos
- Cobertura de testes insuficiente

## Passo 3 — Avaliar resultados

Revise a análise do fluig-qa:

### Se houver riscos ALTO:

```
Riscos ALTOS encontrados na análise de QA:
[listar riscos]

Estes precisam ser corrigidos antes de prosseguir para produção.
Retorne para /fluig:implement para correção, depois redeploy via /fluig:deploy.
```

Não avance para `/fluig:verify` até riscos ALTOS serem resolvidos.

### Se houver apenas riscos MÉDIO/BAIXO:

Apresente os resultados ao usuário e prossiga para o próximo passo.

## Passo 4 — Anunciar conclusão

```
QA concluído.

Testes E2E: [PASSANDO] — [N] cenários
Análise de qualidade: [APROVADO / APROVADO COM RESSALVAS]

Riscos identificados:
- Altos: N
- Médios: N
- Baixos: N

Próximo passo: /fluig:verify
```

## Regras obrigatórias

- Testes E2E sempre contra servidor real (nunca localhost)
- Fluig-qa sempre executado após E2E (análise no servidor live)
- Riscos ALTOS obrigam retorno para `/fluig:implement` — não pule
- Riscos MÉDIO/BAIXO são documentados mas não bloqueiam
- O próximo passo obrigatório é `/fluig:verify` — gate final antes de produção

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
