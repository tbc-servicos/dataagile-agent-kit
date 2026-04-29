---
name: jira
description: Integra Claude com Atlassian Jira e Confluence Cloud via MCP Server Oficial (Rovo). Fornece ferramentas para buscar, criar e atualizar issues no Jira e páginas no Confluence. Requer autenticação OAuth 2.1 via browser no primeiro uso.
---

## Configuração do MCP Server Oficial

O servidor oficial da Atlassian é baseado em nuvem e utiliza o protocolo SSE. Para ativá-lo, o arquivo `.mcp.json` na raiz do projeto deve conter:

```json
{
  "mcpServers": {
    "atlassian-official": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://mcp.atlassian.com/v1/sse"
      ]
    }
  }
}
```

## Autenticação

Ao executar o primeiro comando que utilize o MCP Atlassian, o `mcp-remote` abrirá uma janela no seu navegador para realizar o login na sua conta Atlassian e autorizar o acesso aos sites desejados (Jira/Confluence).

## Ferramentas Disponíveis (via Rovo MCP)

As ferramentas disponíveis dependem da versão atual do servidor oficial da Atlassian, mas geralmente incluem:

### Jira
- `jira_search_issues`: Busca issues usando JQL.
- `jira_get_issue`: Retorna detalhes de uma issue específica.
- `jira_create_issue`: Cria uma nova issue.
- `jira_update_issue`: Atualiza campos de uma issue.
- `jira_add_comment`: Adiciona comentário a uma issue.
- `jira_list_projects`: Lista projetos acessíveis.

### Confluence
- `confluence_search`: Busca conteúdo no Confluence.
- `confluence_get_page`: Retorna o conteúdo de uma página.
- `confluence_create_page`: Cria uma nova página.
- `confluence_update_page`: Atualiza uma página existente.

## Diferenças para o Plugin Local

Este repositório também possui um plugin local para Confluence (`confluence-tools`). 

- **MCP Oficial:** Melhor para uso geral, integração com Jira e suporte nativo da Atlassian.
- **MCP Local (`confluence-tools`):** Melhor para automações específicas de MIT (MIT010/072), manipulação de anexos complexos e quando se prefere usar API Tokens em vez de OAuth no browser.
