import { test, expect } from '@playwright/test';

test.describe('Pagamento', () => {
  async function goToPaymentScreen(page) {
    await page.goto('/');
    await page.click('button.menu-item--highlight');
    await page.click('[data-name="Histórico Escolar Oficial"]');
    await page.click('#btn-advance');
    await expect(page.locator('#screen-payment')).toHaveClass(/active/);
  }

  test.describe('Resumo e estrutura', () => {
    test('exibe o nome do documento selecionado', async ({ page }) => {
      await goToPaymentScreen(page);
      await expect(page.locator('#pay-doc-name')).toContainText('Histórico Escolar Oficial');
    });

    test('exibe o valor correto no cabeçalho de pagamento', async ({ page }) => {
      await goToPaymentScreen(page);
      await expect(page.locator('#pay-doc-price')).toContainText('15,00');
    });

    test('aba Pix está ativa por padrão', async ({ page }) => {
      await goToPaymentScreen(page);
      await expect(page.locator('#tab-pix')).toHaveClass(/pay-tab--active/);
      await expect(page.locator('#panel-pix')).toBeVisible();
      await expect(page.locator('#panel-card')).toBeHidden();
    });
  });

  test.describe('Pix', () => {
    test('exibe o QR Code e o código Copia e Cola', async ({ page }) => {
      await goToPaymentScreen(page);
      await expect(page.locator('#qr-box')).toBeVisible();
      await expect(page.locator('#pix-code')).toBeVisible();
    });

    test('timer inicia em 10:00', async ({ page }) => {
      await goToPaymentScreen(page);
      await expect(page.locator('#timer-display')).toHaveText('10:00');
    });

    test('botão de copiar está visível e clicável', async ({ page }) => {
      await goToPaymentScreen(page);
      await expect(page.locator('#copy-btn')).toBeVisible();
      await page.click('#copy-btn');
      await expect(page.locator('#copy-btn')).toContainText('Copiado');
    });

    test('fluxo completo: confirmar pagamento via Pix exibe sucesso', async ({ page }) => {
      await goToPaymentScreen(page);
      await page.click('text=Já efetuei o pagamento');

      await expect(page.locator('#overlay-processing')).toBeVisible();

      await expect(page.locator('#overlay-success')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('.overlay-title')).toContainText('Pagamento confirmado');
    });

    test('overlay de sucesso exibe número de protocolo válido', async ({ page }) => {
      await goToPaymentScreen(page);
      await page.click('text=Já efetuei o pagamento');
      await expect(page.locator('#overlay-success')).toBeVisible({ timeout: 5000 });

      const protocol = await page.locator('#protocol-number').textContent();
      expect(protocol).toMatch(/^#\d{8}$/);
    });

    test('botão "Ver minhas solicitações" navega para Tela 4', async ({ page }) => {
      await goToPaymentScreen(page);
      await page.click('text=Já efetuei o pagamento');
      await expect(page.locator('#overlay-success')).toBeVisible({ timeout: 5000 });
      await page.click('text=Ver minhas solicitações');
      await expect(page.locator('#screen-requests')).toHaveClass(/active/);
    });
  });

  test.describe('Cartão de Crédito', () => {
    test('trocar para aba Cartão exibe o formulário e oculta o Pix', async ({ page }) => {
      await goToPaymentScreen(page);
      await page.click('#tab-card');
      await expect(page.locator('#panel-card')).toBeVisible();
      await expect(page.locator('#panel-pix')).toBeHidden();
      await expect(page.locator('#tab-card')).toHaveClass(/pay-tab--active/);
    });

    test('formulário de cartão contém todos os campos obrigatórios', async ({ page }) => {
      await goToPaymentScreen(page);
      await page.click('#tab-card');
      await expect(page.locator('input[placeholder="0000 0000 0000 0000"]')).toBeVisible();
      await expect(page.locator('input[placeholder="MM/AA"]')).toBeVisible();
      await expect(page.locator('input[placeholder="123"]')).toBeVisible();
      await expect(page.locator('input[placeholder="MATHEUS NETTO"]')).toBeVisible();
    });

    test('input de número de cartão formata com espaços', async ({ page }) => {
      await goToPaymentScreen(page);
      await page.click('#tab-card');
      const input = page.locator('input[placeholder="0000 0000 0000 0000"]');
      await input.fill('1234567890123456');
      await expect(input).toHaveValue('1234 5678 9012 3456');
    });

    test('input de validade formata com barra', async ({ page }) => {
      await goToPaymentScreen(page);
      await page.click('#tab-card');
      const input = page.locator('input[placeholder="MM/AA"]');
      await input.fill('1225');
      await expect(input).toHaveValue('12/25');
    });

    test('select de parcelamento exibe as opções para R$ 15,00', async ({ page }) => {
      await goToPaymentScreen(page);
      await page.click('#tab-card');
      const select = page.locator('.form-select');
      await expect(select.locator('option')).toHaveCount(3);
      await expect(select.locator('option').nth(0)).toContainText('1x de R$ 15,00');
      await expect(select.locator('option').nth(1)).toContainText('2x de R$ 7,50');
    });

    test('confirmar pagamento via Cartão exibe overlay de sucesso', async ({ page }) => {
      await goToPaymentScreen(page);
      await page.click('#tab-card');
      await page.click('button:has(#card-pay-value)');
      await expect(page.locator('#overlay-success')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Navegação', () => {
    test('botão voltar retorna ao catálogo', async ({ page }) => {
      await goToPaymentScreen(page);
      await page.click('.back-btn');
      await expect(page.locator('#screen-catalog')).toHaveClass(/active/);
    });
  });
});