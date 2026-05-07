import { test, expect } from '@playwright/test';

/**
 * Seed test — ponto de partida para o test-agents (planner/generator)
 * Deve ser o teste mais simples que confirma que o ambiente está acessível.
 * Adapte a URL e o seletor para a aplicação real.
 */
test('ambiente acessível', async ({ page }) => {
  await page.goto('/');
  // Adapte para um elemento que confirme que a app carregou
  await expect(page).toHaveTitle(/.+/);
});
