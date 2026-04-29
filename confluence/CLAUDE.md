# CLAUDE.md

Plugin Claude Code para integração com **Atlassian Confluence** e extração de documentação técnica TOTVS (MIT010/MIT072).

## Namespace
Skills com prefixo `confluence:` — ex: `/confluence:confluence-tools`, `/confluence:mit-doc-extractor`

## Testar localmente
claude --plugin-dir /caminho/para/claude_skills/confluence

## Variáveis de ambiente obrigatórias

```env
CONFLUENCE_URL=https://sua-empresa.atlassian.net
CONFLUENCE_EMAIL=seu-email@empresa.com
CONFLUENCE_API_TOKEN=seu-token-aqui
CONFLUENCE_SPACE_KEY=FSW
```

Gerar token em: https://id.atlassian.com/manage-profile/security/api-tokens

## Configurar MCP no Claude Code

Adicionar ao `~/.claude/settings.json`:
```json
{
  "mcpServers": {
    "confluence": {
      "command": "python",
      "args": ["/caminho/absoluto/para/skills/confluence-tools/scripts/server.py"]
    }
  }
}
```

## Dados sensíveis (remover antes de publicar)
- Nome/código do cliente e projeto
- Proposta comercial
- Gerentes/Coordenadores
- Datas específicas do projeto (manter apenas versões de software)
- Informações de contrato
