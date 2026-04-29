---
name: totvssign
description: Gerencia documentos no TOTVS Assinatura Eletrônica (TAE) via MCP. Consultar, enviar para assinatura, assinar, rejeitar, acompanhar status e baixar documentos assinados.
---

# TOTVS Assinatura Eletrônica — Guia de Uso

Use as tools MCP `totvssign_*` para gerenciar documentos no TOTVS Sign.

## Fluxos de Trabalho

### 1. Consultar documentos

```
totvssign_listPublications
  → termo: "MIT062"          # busca por nome
  → status: ""               # filtro de status (vazio = todos)
  → paginaAtual: 1
  → tamanhoPagina: 20
```

Status possíveis nas publicações:
- `0` = Rascunho
- `1` = Aguardando assinaturas
- `2` = Concluído (todos assinaram)
- `3` = Rejeitado
- `4` = Expirado

Para detalhes de um documento específico:
```
totvssign_getPublication
  → id: 12978325
```

Retorna: assinantes, pendentes, status, data de expiração, observadores.

### 2. Enviar documento para assinatura

Fluxo completo para publicar um documento:

**Passo 1 — Criar publicação**
```
totvssign_createPublication
  → idDocumento: 12345                    # ID do documento no TOTVS Sign
  → destinatarios: [                      # quem vai assinar
      {"email": "fulano@empresa.com.br", "acao": 0, "workflow": 0}
    ]
  → observadores: [                       # quem acompanha (opcional)
      {"email": "gestor@empresa.com.br"}
    ]
  → utilizaWorkflow: false                # assinatura em ordem?
  → responsavelAssinaDocumento: true      # remetente também assina?
  → dataExpiracao: "2026-04-30"           # prazo (opcional)
```

**Passo 2 — Adicionar mais destinatários (se necessário)**
```
totvssign_addRecipients
  → idDocumento: 12345
  → destinatarios: [{"email": "outro@empresa.com.br", "acao": 0, "workflow": 0}]
```

**Passo 3 — Configurar opções (se necessário)**
```
totvssign_updatePublicationOptions
  → idDocumento: 12345
  → dataExpiracao: "2026-05-15"
  → assuntoMensagem: "Contrato para assinatura"
  → corpoMensagem: "Prezado, segue documento para assinatura."
  → permiteRejeitarDocumento: true
  → intervaloLembrete: 3                  # dias entre lembretes
```

### 3. Assinar um documento

```
totvssign_sign
  → idDocumento: 12978325
  → tipoDeAssinatura: "Eletronica"        # Eletronica, Digital, etc.
  → papelAssinante: "Assinante"           # Assinante, Testemunha, etc.
```

Para rejeitar:
```
totvssign_reject
  → idDocumento: 12978325
  → motivo: "Valores divergentes do acordado"
```

### 4. Acompanhar status de assinaturas

```
totvssign_getPublication
  → id: 12978325
```

Na resposta, verifique o campo `pendentes`:
- `pendente: true` → ainda não assinou
- `pendente: false` → já assinou
- `acao: 0` → assinou, `acao: 1` → rejeitou

### 5. Reenviar emails pendentes

Quando alguém não recebeu ou perdeu o email:
```
totvssign_resendPendingEmails
  → listaDocumentos: [12978325, 12978326]
```

### 6. Baixar documento assinado

**Passo 1 — Obter detalhes do anexo**
```
totvssign_getAttachment
  → idArquivo: 12978325
```

**Passo 2 — Download**
```
totvssign_downloadAttachment
  → idFileStream: "abc-123-def"           # ID do file stream retornado no passo 1
```

### 7. Gerenciar destinatários e observadores

**Remover destinatário:**
```
totvssign_removeRecipient
  → idDocumento: 12978325
  → emailDestinatario: "fulano@empresa.com.br"
```

**Adicionar observador:**
```
totvssign_addObservers
  → idDocumento: 12978325
  → observadores: [{"email": "gestor@empresa.com.br"}]
```

**Remover observador:**
```
totvssign_removeObserver
  → idDocumento: 12978325
  → emailObservador: "gestor@empresa.com.br"
```

### 8. Buscar usuários

Para encontrar o email correto de um usuário:
```
totvssign_getUserEmails
  → filter: "joao"
  → take: 10
```

Retorna nome + email de usuários que contêm o filtro.

### 9. Excluir documento

```
totvssign_deletePublication
  → idDocumento: 12978325
```

**Cuidado:** só funciona em documentos que ainda não foram totalmente assinados.

### 10. Consultar contratos

```
totvssign_getContracts
  → tipoContrato: "PJ"                   # tipo de contrato
```

## Referência Rápida

| Quero... | Tool |
|----------|------|
| Ver meus documentos | `totvssign_listPublications` |
| Ver detalhes de um documento | `totvssign_getPublication` |
| Enviar para assinatura | `totvssign_createPublication` |
| Assinar | `totvssign_sign` |
| Rejeitar | `totvssign_reject` |
| Baixar documento assinado | `totvssign_getAttachment` → `totvssign_downloadAttachment` |
| Adicionar signatário | `totvssign_addRecipients` |
| Remover signatário | `totvssign_removeRecipient` |
| Reenviar email | `totvssign_resendPendingEmails` |
| Buscar usuário por nome | `totvssign_getUserEmails` |
| Excluir documento | `totvssign_deletePublication` |
| Ver status da conexão | `getConnectionStatus` |

## Troubleshooting

| Erro | Causa | Solução |
|------|-------|---------|
| HTTP 401 | Token expirado ou inválido | MCP faz auto-login, reconecte |
| HTTP 403 | Sem permissão no documento | Verifique se é destinatário |
| HTTP 404 | Documento não encontrado | Verifique o ID |
| HTTP 400 | Parâmetros inválidos | Verifique campos obrigatórios |
