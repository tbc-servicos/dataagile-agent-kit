# Plugins Claude Code TBC

Este documento foi descontinuado e seu conteúdo migrado para arquivos atualizados.

> 📘 **Para começar:** veja [ONBOARDING.md](./ONBOARDING.md)
> 📘 **Documentação completa:** veja [README.md](./README.md)

## Resumo rápido

Marketplace público no GitHub: `https://github.com/tbc-servicos/tbc-knowledge-plugins`

```bash
# 1. Adicionar o marketplace
claude plugin marketplace add https://github.com/tbc-servicos/tbc-knowledge-plugins.git

# 2. Instalar plugins
claude plugin install fluig@claude-skills-tbc
claude plugin install protheus@claude-skills-tbc
claude plugin install confluence@claude-skills-tbc

# 3. Configurar email para o MCP (devs internos e clientes externos)
echo 'export TBC_USER_EMAIL=seu.nome@empresa.com.br' >> ~/.zshrc
source ~/.zshrc
```

Plugins disponíveis: **fluig, protheus, confluence, playwright, tae, mit-docs, jira-api, keepass, discli, tempo**.

## Dúvidas

- Slack TBC: `#desenvolvimento`
- Issues no GitHub: https://github.com/tbc-servicos/tbc-knowledge-plugins/issues
