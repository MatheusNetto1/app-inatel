import { test, expect } from '@playwright/test';

test('solicitação gratuita', async ({ page }) => {
  await page.goto('/');

  await page.click('text=Tesouraria & Documentos');

  await page.click('text=Declaração de Matrícula');

  await page.click('text=Confirmar Solicitação');

  await expect(
    page.locator('text=Pagamento confirmado')
  ).toBeVisible();
});