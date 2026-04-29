# CLAUDE.md

Plugin Claude Code para gerenciamento de servidores **Discord** via CLI.

## Namespace

Skills com prefixo `discli:` — ex: `/discli`

## Instalação da CLI

```bash
npm install -g @rodrigopg/discord-cli
discli init --token BOT_TOKEN --server SERVER_ID
```

## Testar localmente

```bash
claude --plugin-dir /caminho/para/claude_skills/discli
```

## Configuração

Token e servidor padrão salvos em `~/.discli/.env` (permissões 600) e `~/.discli/config.json`.

## Distribuição

`https://github.com/tbc-servicos/tbc-knowledge-plugins.git` · npm `@ibbybuilds/discli`
