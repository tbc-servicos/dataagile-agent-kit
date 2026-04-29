# Contexto: Hooks

## Eventos suportados

- `SessionStart` — executa ao iniciar sessão Claude Code
- `PostToolUse` — executa após cada tool call
- `UserPromptSubmit` — executa ao submeter prompt

## Declaração (`hooks.json`)

```json
{
  "hooks": [
    {
      "event": "SessionStart",
      "script": "hooks/session-context.sh"
    }
  ]
}
```

## Regras críticas

- Scripts devem ser **idempotentes** — podem rodar múltiplas vezes sem efeito colateral
- Scripts devem ser **rápidos** — hooks bloqueiam o Claude quando retornam erros
- Erros em hooks bloqueiam a sessão inteira

## Auto-sync (marketplace-update.sh)

- Roda async no `SessionStart` nos plugins protheus e fluig
- Sincroniza do marketplace para o cache local: `skills/`, `hooks/`, `agents/`, `dist/`, `CLAUDE.md`
- Permite updates sem reinstalação

## Hook session-context

- Lista hardcoded de skills disponíveis exibida no início de cada sessão
- **Ao criar nova skill:** registrar aqui também, senão a skill não aparece no contexto
