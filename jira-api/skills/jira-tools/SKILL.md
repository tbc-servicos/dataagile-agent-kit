---
name: jira-tools
description: Ferramentas avançadas para Jira Cloud via REST API v3. Download/upload de attachments, leitura completa de issues com custom fields, comments e search JQL. Complementa o MCP oficial. Use /jira-api:jira-tools
---

# Jira Tools — REST API v3

Ferramentas avançadas para Jira Cloud que o MCP oficial não suporta.

## Pré-requisitos

```bash
export JIRA_SITE=sua-empresa.atlassian.net
export JIRA_EMAIL=seu-email@empresa.com
export JIRA_API_TOKEN=seu-token-aqui
```

Token: https://id.atlassian.com/manage-profile/security/api-tokens

## Tools disponíveis

### get_issue — Leitura completa
```
get_issue({ issue_key: "FSWTBC-4179" })
```
Retorna todos os campos incluindo custom fields com nomes legíveis.

### search_issues — Busca JQL
```
search_issues({ jql: "project = FSWTBC AND status = 'In Progress'", max_results: 20 })
```

### download_attachment — Baixar arquivos
```
download_attachment({ attachment_id: "27361", save_path: "/tmp/documento.pdf" })
```
Baixa PDF, DOCX, imagens ou qualquer arquivo anexado ao ticket.

### upload_attachment — Subir arquivos
```
upload_attachment({ issue_key: "FSWTBC-4179", file_path: "/tmp/MIT044.docx" })
```
Sobe arquivo como attachment do ticket.

### get_comments — Ler comentários
```
get_comments({ issue_key: "FSWTBC-4179" })
```

### add_comment — Adicionar comentário
```
add_comment({ issue_key: "FSWTBC-4179", text: "MIT044 gerada e anexada." })
```
Aceita texto simples — converte automaticamente para ADF (formato Atlassian).

### get_field_schema — Descobrir campos
```
get_field_schema({ filter_custom: true })
```
Lista todos os custom fields com ID, nome e tipo.

### get_connection_status — Verificar conexão
```
get_connection_status()
```

## Casos de uso com outros plugins

### Download de anexos para brainstorm MIT044
```
1. get_issue("FSWTBC-4179")           → lista attachments
2. download_attachment(id, "/tmp/")    → baixa PDF/DOCX
3. /mit-docs:mit044                    → lê documentos baixados e inicia brainstorm
```

### Upload de MIT044/MIT010 gerada
```
1. /mit-docs:mit044                    → gera DOCX
2. upload_attachment("FSWTBC-4179", "/caminho/MIT044.docx")
3. add_comment("FSWTBC-4179", "MIT044 gerada e anexada para aprovação.")
```
