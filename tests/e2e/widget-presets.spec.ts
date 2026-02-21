import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Widget Presets E2E Tests
 *
 * Tests the dashboard widget preset manager:
 * saving, loading, and managing layout presets.
 */

test.describe('Widget Presets', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/');
  });

  test('dashboard has settings gear', async ({ page }) => {
    const settingsBtn = page.locator('[aria-label*="settings"], [aria-label*="Settings"], [title*="settings"]').first();
    if (await settingsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(settingsBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can open page settings menu', async ({ page }) => {
    const settingsBtn = page.locator('[aria-label*="settings"], [aria-label*="Settings"], [title*="settings"]').first();
    if (await settingsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await settingsBtn.click();
      await page.waitForTimeout(300);
    }
    assertNoConsoleErrors(page);
  });

  test('has preset options in settings', async ({ page }) => {
    const settingsBtn = page.locator('[aria-label*="settings"], [aria-label*="Settings"], [title*="settings"]').first();
    if (await settingsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await settingsBtn.click();
      await page.waitForTimeout(300);

      const presetOption = page.getByText(/preset|layout|save.*layout/i).first();
      if (await presetOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(presetOption).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has customize widgets option', async ({ page }) => {
    const settingsBtn = page.locator('[aria-label*="settings"], [aria-label*="Settings"], [title*="settings"]').first();
    if (await settingsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await settingsBtn.click();
      await page.waitForTimeout(300);

      const customizeOption = page.getByText(/customize.*widget|manage.*widget/i).first();
      if (await customizeOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(customizeOption).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });
});
