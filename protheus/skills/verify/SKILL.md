---
name: verify
description: Gate final antes de produção. Checklist de conformidade TOTVS (MIT043, Code Analysis, patch .ptm), confirma com o dev e orienta distribuição ao cliente. Acione após /protheus:qa.
disable-model-invocation: true
---

Você vai conduzir a verificação final antes de liberar os artefatos para produção.

## HARD GATE

Não inicie a verificação se:
- QA não foi concluído com sucesso
- Existem riscos ALTOS não resolvidos

## Passo 1 — Checklist de conformidade TOTVS

Verifique cada item obrigatório:

### 1.1 — MIT043 (Registro de Customizações)
- [ ] Todos os artefatos estão registrados no MIT043
- [ ] Descrição funcional preenchida
- [ ] Módulo e sequencial corretos

### 1.2 — Code Analysis
- [ ] Todos os fontes passaram no https://codeanalysis.totvs.com.br
- [ ] Sem violações críticas pendentes

### 1.3 — Patch .ptm
- [ ] Patch gerado com todos os artefatos
- [ ] Patch testado em ambiente de homologação
- [ ] Nome do patch segue convenção do cliente

### 1.4 — Documentação
- [ ] ProtheusDoc completo em todas as User Functions
- [ ] README ou instruções de aplicação do patch para o cliente

### 1.5 — Git
- [ ] Branch seguindo convenção: `homologacao/feature/[nome-da-demanda]`
- [ ] Commits com mensagens descritivas
- [ ] PR criado (se aplicável)

## Passo 2 — Confirmar com o usuário

Use `AskUserQuestion`:

```
Checklist de verificação final:

[apresentar resultado de cada item]

Itens pendentes: [listar se houver]

Confirma liberação para produção?
```

## Passo 3 — Orientar distribuição

```
✅ VERIFICAÇÃO CONCLUÍDA — [nome da demanda]

Artefatos aprovados:
- [listar artefatos com tipo]

Patch: [nome.ptm]
Ambiente testado: [servidor:porta/env]
Testes TIR: [N] cenários passando

Próximos passos para produção:
- [ ] Registrar fontes no MIT043 (se ainda não feito)
- [ ] Validar em https://codeanalysis.totvs.com.br
- [ ] Criar/mergear PR em: homologacao/feature/[nome-da-demanda]
- [ ] Distribuir patch ao cliente para aplicação em produção
- [ ] Agendar aplicação com o cliente (janela de manutenção)
```

## Ciclo Encerrado

```
Ciclo de desenvolvimento concluído.

Todos os gates passaram:
  ✅ Implementação (teammates haiku + sonnet)
  ✅ Review spec + qualidade
  ✅ Lint gate (advpls appre)
  ✅ Deploy compilado (patch .ptm)
  ✅ QA TIR E2E
  ✅ Verificação TOTVS (MIT043, Code Analysis)

Os artefatos estão aprovados para produção.
```

## Regras obrigatórias

- Todos os itens do checklist devem ser verificados — não pule
- MIT043 é obrigatório antes de distribuir ao cliente
- Code Analysis é obrigatório antes de mergear PR
- Sempre confirmar com o usuário antes de declarar aprovado
- Se itens pendentes: resolva antes de liberar

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
