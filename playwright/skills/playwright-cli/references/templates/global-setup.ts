import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup — executa uma vez antes de todos os testes
 * Útil para autenticação via API (mais rápido que via browser)
 * Referenciado em playwright.config.ts: globalSetup: './global-setup'
 */
async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseURL}/login`);
  await page.getByLabel('Usuário').fill(process.env.TEST_USER!);
  await page.getByLabel('Senha').fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(`${baseURL}/dashboard`);

  // Salva estado de autenticação para todos os testes
  await page.context().storageState({ path: 'auth.json' });
  await browser.close();
}

export default globalSetup;
