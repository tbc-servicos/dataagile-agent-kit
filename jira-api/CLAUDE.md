# CLAUDE.md

Plugin Claude Code para **Jira Cloud REST API v3** — complementa o MCP oficial da Atlassian com funcionalidades que ele não suporta.

## Namespace
Skills com prefixo `jira-api:` — ex: `/jira-api:jira-tools`

## Testar localmente
```bash
claude --plugin-dir /caminho/para/claude_skills/jira-api
```

## Variáveis de ambiente obrigatórias

```bash
export JIRA_SITE=sua-empresa.atlassian.net
export JIRA_EMAIL=seu-email@empresa.com
export JIRA_API_TOKEN=seu-token-aqui
```

Gerar API token em: https://id.atlassian.com/manage-profile/security/api-tokens

## O que este plugin faz que o MCP oficial NÃO faz

| Funcionalidade | MCP Oficial | Este Plugin |
|---|---|---|
| Download de attachments (PDF, DOCX) | Não | Sim |
| Upload de attachments | Não | Sim |
| Leitura completa com custom fields | Parcial | Sim (`*all`) |
| Schema de campos | Não | Sim |
| Leitura de comments | Não | Sim |
| Search JQL com paginação cursor | Básico | Avançado |

## Convivência com MCP oficial

Este plugin **convive** com o MCP oficial da Atlassian (`atlassian@claude-plugins-official`). Use:
- **MCP oficial** para: transitions, worklogs, criar issues (já funciona)
- **Este plugin** para: attachments, custom fields, comments, search avançado

## Tools disponíveis

| Tool | Descrição |
|---|---|
| `get_issue` | Lê issue com todos os campos (incluindo custom fields) |
| `search_issues` | Busca JQL com paginação e campos selecionáveis |
| `get_comments` | Lista comentários de uma issue |
| `add_comment` | Adiciona comentário (aceita texto simples, converte para ADF) |
| `download_attachment` | Baixa attachment para disco local |
| `upload_attachment` | Sobe arquivo como attachment de uma issue |
| `get_field_schema` | Lista todos os campos (standard + custom) com IDs e tipos |
| `get_connection_status` | Verifica conexão e permissões |
