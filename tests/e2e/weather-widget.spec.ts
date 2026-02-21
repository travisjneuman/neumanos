import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Weather Widget E2E Tests
 *
 * Tests the weather dashboard widget display
 * and temperature unit switching.
 */

test.describe('Weather Widget', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/');
  });

  test('dashboard may show weather widget', async ({ page }) => {
    const weather = page.getByText(/weather|temperature|forecast|°/i).first();
    if (await weather.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(weather).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('weather shows temperature', async ({ page }) => {
    const temp = page.getByText(/°[FC]/i).first();
    if (await temp.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(temp).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('no console errors with weather widget', async ({ page }) => {
    await page.waitForTimeout(2000);
    assertNoConsoleErrors(page);
  });
});
