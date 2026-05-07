# Autenticação — Playwright CLI

## Abordagem recomendada: storageState

O Playwright reutiliza o estado de autenticação (cookies + localStorage) entre testes para evitar login repetido.

**Fluxo:**
1. `auth.setup.ts` faz login uma vez e salva em `auth.json`
2. Todos os outros specs usam `storageState: 'auth.json'`
3. `auth.json` está no `.gitignore`

---

## Configuração no playwright.config.ts

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  globalSetup: require.resolve('./global-setup'),

  projects: [
    // Projeto de setup — roda primeiro, gera auth.json
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Projeto principal — depende do setup
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'auth.json',  // reutiliza autenticação
      },
      dependencies: ['setup'],
    },
  ],
});
```

---

## auth.setup.ts — gera o storageState

```ts
import { test as setup } from '@playwright/test';

setup('autenticar', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Usuário').fill(process.env.TEST_USER!);
  await page.getByLabel('Senha').fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('/dashboard');

  // Salva o estado de autenticação
  await page.context().storageState({ path: 'auth.json' });
});
```

---

## Variáveis de ambiente — .env.test

Crie `.env.test` (nunca commitar):

```bash
TEST_USER=usuario@empresa.com
TEST_PASSWORD=senha_segura
BASE_URL=https://app.empresa.com
```

Carregar no `playwright.config.ts`:

```ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
```

---

## globalSetup — autenticação com API (mais rápido)

Para sistemas com API de login, autenticar via API é mais rápido que via browser:

Use o template em `references/templates/global-setup.ts`.

---

## Regras de segurança

- `auth.json` SEMPRE no `.gitignore`
- `.env.test` SEMPRE no `.gitignore`
- Nunca hardcodar usuário/senha em specs ou configurações
- Em CI: usar secrets do GitHub/GitLab — nunca variáveis plain text em logs
- Nunca logar `process.env.TEST_PASSWORD` em nenhuma circunstância
