import { test, expect } from '@playwright/test';

test('pagamento pix', async ({ page }) => {
  await page.goto('/');

  await page.click('text=Tesouraria & Documentos');

  await page.click('text=Histórico Escolar Oficial');

  await page.click('text=Avançar para Pagamento');

  await expect(
    page.locator('#panel-pix')
  ).toBeVisible();

  await page.click('text=Já efetuei o pagamento');

  await expect(
    page.locator('text=Pagamento confirmado')
  ).toBeVisible();
});