import { test, expect } from '@playwright/test';

test.describe('Minhas Solicitações', () => {
  async function completePaidRequest(page) {
    await page.goto('/');
    await page.click('button.menu-item--highlight');
    await page.click('[data-name="Histórico Escolar Oficial"]');
    await page.click('#btn-advance');
    await page.click('text=Já efetuei o pagamento');
    await expect(page.locator('#overlay-success')).toBeVisible({ timeout: 5000 });
    await page.click('text=Ver minhas solicitações');
    await expect(page.locator('#screen-requests')).toHaveClass(/active/);
  }

  async function completeFreeRequest(page) {
    await page.goto('/');
    await page.click('button.menu-item--highlight');
    await page.click('[data-name="Declaração de Matrícula (1ª via)"]');
    await page.click('#btn-advance');
    await expect(page.locator('#overlay-success')).toBeVisible({ timeout: 5000 });
    await page.click('text=Ver minhas solicitações');
    await expect(page.locator('#screen-requests')).toHaveClass(/active/);
  }

  test.describe('Estado inicial', () => {
    test('acesso direto via bottom nav exibe a solicitação pré-existente', async ({ page }) => {
      await page.goto('/');
      await page.click('.bottom-nav-item:has-text("Solicitações")');
      await expect(page.locator('#screen-requests')).toHaveClass(/active/);
      await expect(page.locator('.request-card')).toHaveCount(1);
    });

    test('solicitação pré-existente tem status "Disponível"', async ({ page }) => {
      await page.goto('/');
      await page.click('.bottom-nav-item:has-text("Solicitações")');
      await expect(page.locator('.status-badge--done')).toBeVisible();
      await expect(page.locator('.status-badge--done')).toContainText('Disponível');
    });

    test('solicitação pré-existente exibe botão de download', async ({ page }) => {
      await page.goto('/');
      await page.click('.bottom-nav-item:has-text("Solicitações")');
      await expect(page.locator('.btn-download')).toBeVisible();
    });
  });

  test.describe('Após pagamento pago', () => {
    test('nova solicitação aparece na lista', async ({ page }) => {
      await completePaidRequest(page);
      await expect(page.locator('.request-card')).toHaveCount(2);
    });

    test('nova solicitação exibe o nome do documento correto', async ({ page }) => {
      await completePaidRequest(page);
      const firstCard = page.locator('.request-card').first();
      await expect(firstCard).toContainText('Histórico Escolar Oficial');
    });

    test('nova solicitação paga tem status "Disponível"', async ({ page }) => {
      await completePaidRequest(page);
      const firstCard = page.locator('.request-card').first();
      await expect(firstCard.locator('.status-badge--done')).toContainText('Disponível');
    });

    test('nova solicitação paga exibe o valor correto', async ({ page }) => {
      await completePaidRequest(page);
      const firstCard = page.locator('.request-card').first();
      await expect(firstCard.locator('.request-meta')).toContainText('15,00');
    });

    test('nova solicitação paga tem botão de download', async ({ page }) => {
      await completePaidRequest(page);
      const firstCard = page.locator('.request-card').first();
      await expect(firstCard.locator('.btn-download')).toBeVisible();
    });

    test('clicar em download exibe toast de confirmação', async ({ page }) => {
      await completePaidRequest(page);
      await page.locator('.request-card').first().locator('.btn-download').click();
      await expect(page.locator('.toast')).toBeVisible();
      await expect(page.locator('.toast')).toContainText('Download iniciado');
    });

    test('solicitação mais recente aparece no topo da lista', async ({ page }) => {
      await completePaidRequest(page);
      const firstCard = page.locator('.request-card').first();
      await expect(firstCard).toContainText('Histórico Escolar Oficial');
    });
  });

  test.describe('Após solicitação gratuita', () => {
    test('nova solicitação gratuita aparece na lista', async ({ page }) => {
      await completeFreeRequest(page);
      await expect(page.locator('.request-card')).toHaveCount(2);
    });

    test('solicitação gratuita exibe status "Processando"', async ({ page }) => {
      await completeFreeRequest(page);
      const firstCard = page.locator('.request-card').first();
      await expect(firstCard.locator('.status-badge--processing')).toContainText('Processando');
    });

    test('solicitação gratuita exibe "Gratuito" nos metadados', async ({ page }) => {
      await completeFreeRequest(page);
      const firstCard = page.locator('.request-card').first();
      await expect(firstCard.locator('.request-meta')).toContainText('Gratuito');
    });

    test('solicitação gratuita não exibe botão de download', async ({ page }) => {
      await completeFreeRequest(page);
      const firstCard = page.locator('.request-card').first();
      await expect(firstCard.locator('.btn-download')).toHaveCount(0);
    });
  });

  test.describe('Navegação', () => {
    test('botão "Nova solicitação" navega para o catálogo', async ({ page }) => {
      await page.goto('/');
      await page.click('.bottom-nav-item:has-text("Solicitações")');
      await page.click('text=+ Nova solicitação');
      await expect(page.locator('#screen-catalog')).toHaveClass(/active/);
    });

    test('botão voltar retorna ao menu principal', async ({ page }) => {
      await page.goto('/');
      await page.click('.bottom-nav-item:has-text("Solicitações")');
      await page.locator('#screen-requests .back-btn').click();
      await expect(page.locator('#screen-menu')).toHaveClass(/active/);
    });
  });
});