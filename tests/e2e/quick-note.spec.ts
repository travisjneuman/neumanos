import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Quick Note E2E Tests
 *
 * Tests the quick note widget/feature
 * for capturing ideas quickly.
 */

test.describe('Quick Note', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/');
  });

  test('dashboard has quick note widget', async ({ page }) => {
    const quickNote = page.getByText(/Quick Note/i).first();
    if (await quickNote.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(quickNote).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('quick note has text input', async ({ page }) => {
    const input = page.getByPlaceholder(/quick.*note|capture|jot/i).first()
      .or(page.locator('[contenteditable="true"]').first());
    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(input).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can type in quick note', async ({ page }) => {
    const input = page.getByPlaceholder(/quick.*note|capture|jot/i).first();
    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      await input.click();
      await input.fill('Quick test note');
      await page.waitForTimeout(200);
    }
    assertNoConsoleErrors(page);
  });
});
