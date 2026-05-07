---
name: playwright-cli
description: Setup completo, CLI e test-agents do Playwright. Cobre instalação, playwright.config.ts, todos os comandos npx playwright, fluxo planner/generator/healer com --loop=claude, e autenticação via storageState. Use quando precisar criar, executar ou reparar testes E2E com Playwright CLI.
---

## HARD GATE — Antes de qualquer operação

Antes de gerar configuração, templates ou executar qualquer comando, você DEVE verificar se o Playwright está instalado no projeto atual:

```bash
npx playwright --version
```

**Se não estiver instalado** (erro de comando não encontrado):

```bash
npm init playwright@latest
npx playwright install
```

**Se browsers não estiverem instalados** (erro "Executable doesn't exist"):

```bash
npx playwright install
```

Confirme a instalação antes de prosseguir.

---

## Fluxo de decisão

### Novo projeto / primeiro setup
→ Consulte `references/setup.md` para configuração completa do `playwright.config.ts`

### Executar testes existentes
→ Consulte `references/cli-commands.md` para comandos, flags e filtros

### Gerar testes com IA (test-agents)
→ Consulte `references/test-agents.md` para fluxo planner → generator → healer

### Configurar autenticação
→ Consulte `references/auth.md` para storageState, globalSetup e variáveis de ambiente

---

## Regras Obrigatórias

- Credenciais **sempre** via variáveis de ambiente — nunca hardcoded
- `coverage/`, `test-results/`, `playwright-report/` nunca commitados
- `.env.test` sempre no `.gitignore`
- Todo spec deve cobrir ao menos um caso de erro
- E2E requer ambiente real acessível — nunca `localhost` em ambientes externos
