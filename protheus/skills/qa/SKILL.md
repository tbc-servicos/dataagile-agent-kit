---
name: qa
description: Gate de QA E2E contra ambiente Protheus compilado. Aciona /protheus:test-web (Playwright — visão real + evidências MIT010) e analisa qualidade. Se falhas, retorna para /protheus:implement. Acione após /protheus:deploy. Próximo passo: /protheus:verify.
disable-model-invocation: true
---

Você vai conduzir testes E2E e análise de qualidade contra os artefatos compilados no ambiente Protheus.

> **Engine de E2E: Playwright** (`/protheus:test-web`) — visão computacional real (screenshots), validação visual e geração de evidência/MIT010. Para suíte de **regressão CI re-executável sem LLM**, gere opcionalmente um script TIR a partir da sessão Playwright validada (ver nota no fim).

## HARD GATE

Não inicie testes se:
- A compilação não foi concluída com sucesso (patch não aplicado)
- O ambiente não está acessível com o RPO atualizado

Verifique que o deploy do passo anterior foi concluído antes de prosseguir.

## Passo 1 — Executar testes E2E (Playwright)

Acione a skill `/protheus:test-web` solicitando execução dos testes E2E contra o ambiente compilado:

```
Execute os testes E2E (Playwright) dos artefatos [nomes] contra o ambiente [URL Webapp].
Módulo: [SIGAXXX]
Fluxos: [listar fluxos críticos do design]
Use a configuração do CLAUDE.md para URL, módulo, grupo e filial.
Colete evidências (screenshots) e gere o MIT010.
```

Os testes devem validar:
- Inclusão, alteração e exclusão de registros
- Regras de negócio críticas identificadas no design
- Integridade do fluxo completo

**Se os testes falharem:** analise screenshots e logs, corrija o artefato, recompile via `/protheus:deploy` e retorne para este passo.

## Passo 2 — Análise de qualidade

Após testes passando, revise a qualidade dos artefatos. Use o `/protheus:reviewer` (quality gate SonarQube G1–G5) e o MCP:
```
searchKnowledge({ skill: "protheus-reviewer", keyword: "checklist revisao" })
searchKnowledge({ skill: "protheus-patterns", keyword: "regras criticas" })
```

Classifique riscos como ALTO, MÉDIO ou BAIXO:
- **ALTO:** violações de convenções críticas, SQL injection, locks não liberados
- **MÉDIO:** performance, falta de validação em campos opcionais
- **BAIXO:** estilo, sugestões de melhoria

## Passo 3 — Avaliar resultados

### Se houver riscos ALTO:

```
Riscos ALTOS encontrados na análise de QA:
[listar riscos]

Estes precisam ser corrigidos antes de prosseguir para produção.
Retorne para /protheus:implement para correção, depois recompile via /protheus:deploy.
```

Não avance para `/protheus:verify` até riscos ALTOS serem resolvidos.

### Se houver apenas riscos MÉDIO/BAIXO:

Apresente os resultados ao usuário e prossiga para o próximo passo.

## Passo 4 — Anunciar conclusão

```
QA concluído.

Testes E2E (Playwright): [PASSANDO] — [N] cenários · evidência MIT010 gerada
Análise de qualidade (SonarQube G1–G5): [APROVADO / APROVADO COM RESSALVAS]

Riscos identificados:
- Altos: N
- Médios: N
- Baixos: N

Próximo passo: /protheus:verify
```

## Regras obrigatórias

- E2E sempre contra ambiente com RPO atualizado (nunca sem compilação)
- Análise de qualidade sempre após os testes E2E
- Riscos ALTOS obrigam retorno para `/protheus:implement` — não pule
- Riscos MÉDIO/BAIXO são documentados mas não bloqueiam
- O próximo passo obrigatório é `/protheus:verify` — gate final antes de produção

## Nota — regressão CI (opcional, TIR)

O Playwright é o caminho de validação/evidência. Quando o projeto exigir **suíte de regressão re-executável em CI sem LLM**, gere um script TIR (Python) a partir dos fluxos já validados na sessão Playwright — o melhor dos dois: validação visual + regressão determinística.

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
