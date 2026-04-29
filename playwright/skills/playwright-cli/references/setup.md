# Setup — Playwright CLI

## Inicialização

```bash
npm init playwright@latest
```

Responda as perguntas:
- **TypeScript or JavaScript?** → TypeScript
- **Where to put your end-to-end tests?** → `tests`
- **Add a GitHub Actions workflow?** → depende do projeto
- **Install Playwright browsers?** → Yes

---

## playwright.config.ts — Configuração base

Use o template em `references/templates/playwright.config.ts`.

Principais seções:

### testDir
```ts
testDir: './tests',
```
Diretório onde ficam os `.spec.ts`.

### timeout
```ts
timeout: 30_000,  // 30s por teste
```

### retries
```ts
retries: process.env.CI ? 2 : 0,
```
2 retries em CI, 0 localmente.

### workers
```ts
workers: process.env.CI ? 1 : undefined,
```
Paralelo localmente, serial em CI.

### reporter
```ts
reporter: [['html'], ['list']],
```
Gera relatório HTML em `playwright-report/`.

### use (configurações globais)
```ts
use: {
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'on-first-retry',
},
```

### globalSetup (quando usar autenticação)
```ts
globalSetup: require.resolve('./global-setup'),
```
Ver `references/auth.md` para configuração de autenticação global.

---

## Estrutura de pastas recomendada

```
projeto/
  playwright.config.ts
  global-setup.ts          # autenticação (se necessário)
  .env.test                # credenciais (no .gitignore)
  tests/
    seed.spec.ts           # setup inicial do ambiente
    auth.setup.ts          # gera storageState (se necessário)
    *.spec.ts              # testes de funcionalidade
  specs/
    *.md                   # planos do planner (test-agents)
  playwright-report/       # gerado, nunca commitado
  test-results/            # gerado, nunca commitado
```

---

## .gitignore — adicionar sempre

```gitignore
playwright-report/
test-results/
.env.test
/auth.json
```

---

## Estrutura mínima de um spec

```ts
import { test, expect } from '@playwright/test';

test.describe('Feature X', () => {
  test('deve fazer Y com sucesso', async ({ page }) => {
    await page.goto('/rota');
    await expect(page.getByText('Texto esperado')).toBeVisible();
  });

  test('deve exibir erro quando Z', async ({ page }) => {
    await page.goto('/rota-invalida');
    await expect(page.getByRole('alert')).toBeVisible();
  });
});
```
