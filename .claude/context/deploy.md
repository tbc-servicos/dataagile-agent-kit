# Contexto: Versionamento e Deploy

## Versionamento

- Versões seguem semver no `plugin.json` de cada plugin e no `marketplace.json` raiz
- Ao atualizar um plugin, atualizar **os dois** — podem ficar defasados

## Registro do marketplace

- `/.claude-plugin/marketplace.json` na raiz é o índice de todos os plugins
- Ao adicionar novo plugin: registrar aqui também

## Auto-sync marketplace → cache

- Hook `marketplace-update.sh` (protheus e fluig) roda async no `SessionStart`
- Sincroniza: `skills/`, `hooks/`, `agents/`, `dist/` e `CLAUDE.md`
- Devs não precisam reinstalar para receber updates — só commitar e pushar

## Reinstalação limpa (usuários finais)

```bash
# Linux/macOS
rm -rf ~/.claude/plugins/cache/claude-skills-tbc ~/.claude/plugins/marketplaces/claude-skills-tbc
claude plugin marketplace add https://github.com/tbc-servicos/tbc-knowledge-plugins.git
claude plugin install protheus@claude-skills-tbc
claude plugin install fluig@claude-skills-tbc
```

```powershell
# Windows
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\plugins\cache\claude-skills-tbc","$env:USERPROFILE\.claude\plugins\marketplaces\claude-skills-tbc"
claude plugin marketplace add https://github.com/tbc-servicos/tbc-knowledge-plugins.git
claude plugin install protheus@claude-skills-tbc
claude plugin install fluig@claude-skills-tbc
```

Reinstalar apenas se mudar estrutura do `plugin.json` ou `.mcp.json` — o auto-sync cobre o resto.
