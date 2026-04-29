# CLAUDE.md

Plugin Claude Code para **Tempo.io** — sincronização bidirecional entre Google Calendar e Tempo Capacity Planner.

## Namespace
Skills com prefixo `tempo:` — ex: `/tempo:sync-tempo`

## Testar localmente
```bash
claude --plugin-dir /caminho/para/claude_skills/tempo
```

## Pré-requisitos

- **MCP Tempo** instalado e configurado (`claude mcp add tempo ...`)
  - Fonte: `Downloads/mcp-handoff/tempo-mcp` ou repositório interno
  - Token: Tempo > Settings > API Integration
- **MCP Google Calendar** conectado (`mcp__claude_ai_Google_Calendar__*`)
- **MCP Atlassian** conectado (`mcp__plugin_atlassian_atlassian__*`) — necessário para criar tickets Jira

## Skills disponíveis

| Skill | Descrição |
|---|---|
| `sync-tempo` | Sincroniza Google Calendar ↔ Tempo bidirecionalmente |

## Como usar

```
/tempo:sync-tempo              # bidirecional, hoje
sincroniza meu dia             # disparo automático
lança minhas horas de ontem    # disparo automático
cria planejamento no Tempo     # disparo automático
```

## Convenções

- Tickets Jira no título do evento no formato `[PROJ-123]`
- Projeto padrão para tickets novos: variável `TEMPO_DEFAULT_JIRA_PROJECT` (ex: `DAI`, `PROJ`)
- Duração do worklog = horário fim − horário início do evento
