---
name: sync-tempo
description: Sincroniza Google Calendar com Tempo.io (Jira) bidirecionalmente. Use esta skill sempre que o usuário quiser sincronizar agenda com horas, lançar worklogs do calendário, criar eventos no calendário a partir do Tempo, ou qualquer variação de "sincronizar tempo/agenda/horas/worklogs". Também dispara quando o usuário diz "sincroniza meu dia", "lança minhas horas", "atualiza o Tempo", "bota no calendário" ou similares.
---

# sync-tempo

Sincroniza Google Calendar ↔ Tempo.io em dois modos que podem rodar juntos ou separados.

## Parâmetros de entrada

O usuário pode especificar:
- **Data ou intervalo**: "hoje", "ontem", "essa semana", "01/05 a 05/05", etc. Padrão: hoje.
- **Direção**: "só calendar→tempo", "só tempo→calendar", ou nada (bidirencional).

Se nenhum parâmetro for passado, execute bidirecional para hoje.

---

## Modo A — Calendar → Tempo

### 1. Buscar eventos do Google Calendar

Use `mcp__claude_ai_Google_Calendar__list_events` no calendário primário para o intervalo solicitado.

Ignore eventos:
- Sem horário de término (eventos do dia inteiro sem fim definido)
- Com título que contenha apenas emojis ou esteja vazio
- Marcados como "Fora do escritório" / "Out of office"

### 2. Para cada evento, extrair o ticket Jira

Padrão obrigatório: `[PROJ-NNN]` em qualquer posição do título.

Exemplos:
- `[FSWTBC-123] Reunião de planejamento` → issue `FSWTBC-123`
- `Stand-up [DAI-45]` → issue `DAI-45`
- `Almoço com time` → sem ticket

Calcule a duração em segundos: `(end_time - start_time)`.

### 3. Com ticket → criar worklog no Tempo

Use `mcp__tempo__tempo_create_worklog` com:
- `issueKey`: o ticket extraído
- `timeSpentSeconds`: duração do evento
- `startDate`: data do evento (formato `YYYY-MM-DD`)
- `startTime`: hora de início (formato `HH:mm:ss`)
- `description`: título do evento sem o `[PROJ-NNN]`, com espaços extras removidos

Se o worklog falhar por issue inexistente, informe ao usuário e pule.

### 4. Sem ticket → propor criação de ticket no Jira

O projeto Jira default vem da variável de ambiente `TEMPO_DEFAULT_JIRA_PROJECT` (ex: `DAI`, `PROJ`, etc.). Se não estiver definida, peça ao usuário antes de prosseguir.

Apresente ao usuário:

```
Evento sem ticket: "<título do evento>" (HH:MM–HH:MM)
Sugestão: criar ticket [<TEMPO_DEFAULT_JIRA_PROJECT>] com título "<título limpo>"
→ Confirma? [s] Criar e lançar  [n] Pular  [t] Informar ticket existente
```

- **s**: crie o ticket no Jira (projeto = `TEMPO_DEFAULT_JIRA_PROJECT`, tipo Task, título = título do evento sem prefixo) e em seguida crie o worklog
- **n**: pule o evento
- **t**: peça o número do ticket e crie o worklog com ele

Para criar ticket no Jira, use `mcp__plugin_atlassian_atlassian__createJiraIssue` com `projectKey: process.env.TEMPO_DEFAULT_JIRA_PROJECT`.

### 5. Resumo final

Ao fim do modo A, exiba:

```
Calendar → Tempo: X worklogs criados, Y tickets novos, Z eventos pulados
```

---

## Modo B — Tempo → Calendar

### 1. Buscar worklogs do Tempo

Use `mcp__tempo__tempo_get_worklogs_by_user` para o intervalo. O `accountId` do usuário deve ser obtido via `mcp__plugin_atlassian_atlassian__atlassianUserInfo` se ainda não conhecido.

### 2. Para cada worklog, verificar se já existe evento no Calendar

Busque eventos do Google Calendar no mesmo dia. Um worklog já está sincronizado se existe um evento cujo título contenha o `issueKey` do worklog (ex: `[FSWTBC-123]`).

Se já existe, pule.

### 3. Criar evento no Google Calendar

Use `mcp__claude_ai_Google_Calendar__create_event` com:
- **Título**: `[ISSUE-KEY] <descrição do worklog>` (se não tiver descrição, use o issueKey sozinho)
- **Início**: `startDate` + `startTime` do worklog
- **Fim**: início + `timeSpentSeconds`
- **Calendário**: primário

### 4. Resumo final

```
Tempo → Calendar: X eventos criados, Y worklogs já sincronizados (pulados)
```

---

## Execução bidirecional

Rode Modo A primeiro, depois Modo B. No fim, exiba os dois resumos juntos.

---

## Tratamento de erros

- Se uma ferramenta MCP retornar erro de autenticação, informe o usuário e pare.
- Se uma ferramenta retornar erro de rate limit, aguarde 2s e tente uma vez mais.
- Erros pontuais (worklog individual falhou) não param o fluxo — registre e continue.
- Ao final, liste todos os erros ocorridos se houver algum.

---

## Notas importantes

- Nunca crie worklogs duplicados: antes de criar, verifique se já existe worklog para o mesmo `issueKey` no mesmo `startDate` e `startTime`.
- Para verificar duplicata, use `mcp__tempo__tempo_get_worklogs_by_issue` filtrando pela data.
- O projeto padrão para tickets novos vem de `TEMPO_DEFAULT_JIRA_PROJECT`. Sem essa variável, sempre pergunte antes de criar ticket.
- Durações sempre em segundos inteiros (sem decimais).
