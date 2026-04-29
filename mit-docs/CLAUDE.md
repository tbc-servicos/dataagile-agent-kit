# CLAUDE.md

Plugin Claude Code para geração de documentação de projeto TOTVS — **MIT044** (Especificação de Personalização) e **MIT010** (Termo de Validação).

## Namespace
Skills com prefixo `mit-docs:` — ex: `/mit-docs:mit044`, `/mit-docs:mit010`

## Testar localmente
```bash
claude --plugin-dir /caminho/para/claude_skills/mit-docs
```

## Contexto

As MITs são artefatos de gestão de projeto, não específicos de um produto. Servem para **qualquer projeto TBC** — Protheus, Fluig, integrações, ou misto.

### MIT044 — Especificação de Personalização
- **O que é:** documenta o que **será** desenvolvido
- **Quando:** antes do desenvolvimento, após análise de requisitos
- **Público:** cliente (não-técnico) + dev (técnico) — linguagem híbrida
- **Fluxo:** análise → brainstorm MIT044 → aprovação cliente → `/protheus:brainstorm` ou `/fluig:*`

### MIT010 — Termo de Validação
- **O que é:** documenta o que **foi** entregue e validado
- **Quando:** após testes QA aprovados
- **Público:** cliente (aceite formal)
- **Fluxo:** QA aprovado → gera MIT010 → assinatura cliente

## Fluxo completo de projeto

```
Requisitos do cliente
       ↓
/mit-docs:mit044  ← brainstorm + geração do documento
       ↓
Aprovação cliente (assinatura MIT044)
       ↓
/protheus:brainstorm ou /fluig:* ← implementação a partir da MIT044
       ↓
/protheus:test-web ou /fluig:test ← QA
       ↓
/mit-docs:mit010  ← gera termo de validação com evidências
       ↓
Aceite cliente (assinatura MIT010)
```

## Geração de DOCX

As skills usam `/docx` para gerar documentos Word. O arquivo é salvo no Google Drive compartilhado, onde abre automaticamente como Google Docs.

### Caminho padrão de saída
```
/Drives compartilhados/Projetos_TBC/Projetos - SOLUÇÕES/Projetos - DF/{CLIENTE}/{PROJETO}/MIT/MIT044 e MIT010/
```

## Dados sensíveis
Os documentos MIT contêm dados de projeto (nomes, contratos, valores). São documentos **internos/cliente** — não publicar em repositórios ou canais públicos.

## Assinatura eletrônica
Após gerar o DOCX, sugerir ao usuário o envio para assinatura via TOTVS Sign (`/tae:totvssign`).
