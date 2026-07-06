# playwright — Plugin Claude Code

Plugin com skill `playwright-cli` para setup, execução e geração de testes E2E com Playwright CLI, incluindo suporte ao fluxo test-agents (planner/generator/healer) integrado ao Claude Code.

## Pré-requisitos

| Requisito | Versão mínima |
|-----------|---------------|
| Node.js | 18+ |
| npm | 9+ |
| Claude Code | qualquer |

## Instalação do Playwright no projeto

### 1. Inicializar Playwright no projeto

```bash
npm init playwright@latest
```

Isso cria:
- `playwright.config.ts`
- `tests/example.spec.ts`
- `.github/workflows/playwright.yml` (opcional)

### 2. Instalar browsers

```bash
npx playwright install
```

Para instalar apenas um browser:

```bash
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

### 3. Verificar instalação

```bash
npx playwright --version
npx playwright test --list
```

### 4. (Opcional) Instalar test-agents com Claude Code

```bash
npx playwright init-agents --loop=claude
```

Isso configura o fluxo planner → generator → healer integrado ao Claude Code.

## Uso da skill

```
/playwright:playwright-cli
```

A skill verifica se o Playwright está instalado e guia o fluxo completo.

## Estrutura gerada pela skill

```
projeto/
  playwright.config.ts
  tests/
    seed.spec.ts        # teste de seed (ambiente inicial)
    *.spec.ts           # testes gerados pelo generator
  specs/
    *.md                # planos gerados pelo planner
  .env.test             # credenciais (nunca commitado)
  global-setup.ts       # autenticação global
```
