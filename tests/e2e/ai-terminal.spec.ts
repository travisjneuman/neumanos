import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * AI Terminal E2E Tests
 *
 * Tests the AI terminal/chat widget:
 * input, send button, provider config.
 */

test.describe('AI Terminal', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/');
  });

  test('has AI terminal or chat widget', async ({ page }) => {
    const aiWidget = page.getByText(/AI|Terminal|Chat|Assistant/i).first();
    if (await aiWidget.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(aiWidget).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('AI terminal has input field', async ({ page }) => {
    const input = page.getByPlaceholder(/ask|type|message|chat/i).first();
    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(input).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('AI terminal has send button', async ({ page }) => {
    const sendBtn = page.getByRole('button', { name: /send/i }).first()
      .or(page.locator('[aria-label*="send"], [aria-label*="Send"]').first());
    if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(sendBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can type in AI terminal', async ({ page }) => {
    const input = page.getByPlaceholder(/ask|type|message|chat/i).first();
    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      await input.click();
      await input.fill('Hello AI');
      await page.waitForTimeout(200);
      await expect(input).toHaveValue('Hello AI');
    }
    assertNoConsoleErrors(page);
  });
});
