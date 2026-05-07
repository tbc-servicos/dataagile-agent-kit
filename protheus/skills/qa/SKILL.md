---
name: qa
description: Testes TIR E2E contra ambiente Protheus compilado. Aciona protheus:test para gerar/executar scripts TIR e analisa qualidade. Se falhas encontradas, retorna para /protheus:implement. Acione após /protheus:deploy. Próximo passo: /protheus:verify.
disable-model-invocation: true
---

Você vai conduzir testes E2E e análise de qualidade contra os artefatos compilados no ambiente Protheus.

## HARD GATE

Não inicie testes se:
- A compilação não foi concluída com sucesso (patch não aplicado)
- O ambiente não está acessível com o RPO atualizado

Verifique que o deploy do passo anterior foi concluído antes de prosseguir.

## Passo 1 — Executar testes TIR E2E

Acione a skill `/protheus:test` solicitando execução dos testes E2E contra o ambiente compilado:

```
Execute os testes TIR E2E dos artefatos [nomes] contra o ambiente [URL Webapp].
Módulo: [SIGAXXX]
Fluxos: [listar fluxos críticos do design]
Use a configuração do CLAUDE.md para URL, módulo, grupo e filial.
```

Os testes TIR devem validar:
- Inclusão, alteração e exclusão de registros
- Regras de negócio críticas identificadas no design
- Integridade do fluxo completo

**Se os testes TIR falharem:** analise screenshots e logs, corrija o artefato, recompile via `/protheus:deploy` e retorne para este passo.

## Passo 2 — Análise de qualidade

Após testes TIR passando, revise a qualidade dos artefatos:

Consulte o MCP para checklist de qualidade:
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

Testes TIR: [PASSANDO] — [N] cenários
Análise de qualidade: [APROVADO / APROVADO COM RESSALVAS]

Riscos identificados:
- Altos: N
- Médios: N
- Baixos: N

Próximo passo: /protheus:verify
```

## Regras obrigatórias

- Testes TIR sempre contra ambiente com RPO atualizado (nunca sem compilação)
- Análise de qualidade sempre após testes TIR
- Riscos ALTOS obrigam retorno para `/protheus:implement` — não pule
- Riscos MÉDIO/BAIXO são documentados mas não bloqueiam
- O próximo passo obrigatório é `/protheus:verify` — gate final antes de produção

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
