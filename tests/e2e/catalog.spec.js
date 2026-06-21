import { test, expect } from '@playwright/test';

test.describe('Catálogo de Documentos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button.menu-item--highlight');
    await expect(page.locator('#screen-catalog')).toHaveClass(/active/);
  });

  test('exibe os quatro documentos disponíveis', async ({ page }) => {
    const cards = page.locator('.doc-card');
    await expect(cards).toHaveCount(4);
  });

  test('documentos gratuitos exibem a tag "Gratuito"', async ({ page }) => {
    const freeBadges = page.locator('.doc-badge--free');
    await expect(freeBadges).toHaveCount(2);
  });

  test('botão de avançar começa desabilitado', async ({ page }) => {
    await expect(page.locator('#btn-advance')).toBeDisabled();
  });

  test('selecionar um documento habilita o botão de avançar', async ({ page }) => {
    await page.click('[data-name="Histórico Escolar Oficial"]');
    await expect(page.locator('#btn-advance')).toBeEnabled();
  });

  test('selecionar documento pago exibe o valor no rodapé', async ({ page }) => {
    await page.click('[data-name="Histórico Escolar Oficial"]');
    await expect(page.locator('#footer-total')).toBeVisible();
    await expect(page.locator('#footer-total-value')).toContainText('15,00');
  });

  test('selecionar documento gratuito exibe "Gratuito" no rodapé', async ({ page }) => {
    await page.click('[data-name="Declaração de Matrícula (1ª via)"]');
    await expect(page.locator('#footer-total-value')).toContainText('Gratuito');
  });

  test('apenas um documento fica selecionado por vez', async ({ page }) => {
    await page.click('[data-name="Histórico Escolar Oficial"]');
    await page.click('[data-name="Certificado de Conclusão"]');
    await expect(page.locator('.doc-card.selected')).toHaveCount(1);
    await expect(page.locator('.doc-card.selected')).toContainText('Certificado de Conclusão');
  });

  test('botão de voltar retorna ao menu principal', async ({ page }) => {
    await page.click('.back-btn');
    await expect(page.locator('#screen-menu')).toHaveClass(/active/);
  });

  test('documento gratuito vai direto para overlay de sucesso', async ({ page }) => {
    await page.click('[data-name="Declaração de Matrícula (1ª via)"]');
    await page.click('#btn-advance');
    await expect(page.locator('#overlay-success')).toBeVisible();
    await expect(page.locator('.overlay-title')).toContainText('Pagamento confirmado');
  });

  test('documento pago avança para a tela de pagamento', async ({ page }) => {
    await page.click('[data-name="Histórico Escolar Oficial"]');
    await page.click('#btn-advance');
    await expect(page.locator('#screen-payment')).toHaveClass(/active/);
  });
});