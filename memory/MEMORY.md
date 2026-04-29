# claude_skills — Memory

## Projeto

Marketplace público de plugins Claude Code para desenvolvimento TOTVS (Protheus + Fluig + extras).
Repo: `https://github.com/tbc-servicos/tbc-knowledge-plugins.git`
Conteúdo proprietário gateado pelo `auth_server_skills` em `mcp.totvstbc.com.br` (trial 30d + 402 + checkout manual).

## Versões atuais (após PR feature/git-init-identification)

| Plugin | Versão |
|--------|--------|
| protheus | 1.3.1 (em PR) |
| fluig | 1.2.1 (em PR) |
| confluence | 1.0.0 |
| jira | 1.0.0 |

## Padrões do projeto

- Skills: markdown em `<plugin>/skills/<nome>/SKILL.md`
- Versão do plugin: `<plugin>/.claude-plugin/plugin.json`
- Worktrees em: `.worktrees/` (já no .gitignore)
- Commits: conventional commits sem `Co-Authored-By:` footer
- Branch base: `main`
- PR: GitHub (`gh` CLI funcional após migração 2026-04-29)

## Contexto TBC vs Cliente (feature implementada 2026-03-04)

Ambos os init skills detectam o remote via `git remote get-url origin`:
- `github.com/tbc-servicos/tbc-knowledge-plugins` (ou bitbucket.org/fabricatbc legado) → **Modo TBC**: commita `.claude/` + `CLAUDE.md`
- Outro remote → **Modo Cliente**: `.gitignore` protege arquivos AI, sem menção a IA
- Sem remote / não-git → bloquear

Ver: `docs/plans/2026-03-04-git-init-identification-design.md`

## Skills disponíveis

### protheus
`protheus-init-project`, `protheus-brainstorm`, `protheus-writing-plans`,
`protheus-subagent-dev`, `advpl-writer`, `advpl-patterns`, `advpl-sql`,
`protheus-reviewer`, `protheus-compile`, `protheus-test`, `protheus-migrate`,
`protheus-diagnose`

### fluig
`fluig-init-project`, `fluig-brainstorm`, `fluig-widget`, `fluig-dataset`,
`fluig-form`, `fluig-workflow`, `fluig-test`, `fluig-review`, `fluig-verify`,
`fluig-api-ref`
