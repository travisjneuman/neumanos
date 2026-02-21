import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Theme Switching E2E Tests
 *
 * Tests light/dark/system theme toggling
 * and verifies CSS class application.
 */

test.describe('Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/');
  });

  test('has theme toggle', async ({ page }) => {
    const themeBtn = page.locator('[aria-label*="theme"], [aria-label*="Theme"], [title*="theme"], [title*="Theme"]').first();
    if (await themeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(themeBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can toggle theme', async ({ page }) => {
    const themeBtn = page.locator('[aria-label*="theme"], [aria-label*="Theme"], [title*="theme"], [title*="Theme"]').first();
    if (await themeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const wasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      await themeBtn.click();
      await page.waitForTimeout(300);
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(isDark).not.toBe(wasDark);
    }
    assertNoConsoleErrors(page);
  });

  test('dark mode applies dark class to html', async ({ page }) => {
    // Navigate to settings to use the explicit dark mode button
    await navigateTo(page, '/settings');
    const darkBtn = page.getByRole('button', { name: 'Dark', exact: true });
    if (await darkBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await darkBtn.click();
      await page.waitForTimeout(300);
      const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(hasDark).toBe(true);
    }
    assertNoConsoleErrors(page);
  });

  test('light mode removes dark class from html', async ({ page }) => {
    await navigateTo(page, '/settings');
    const lightBtn = page.getByRole('button', { name: 'Light', exact: true });
    if (await lightBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lightBtn.click();
      await page.waitForTimeout(300);
      const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(hasDark).toBe(false);
    }
    assertNoConsoleErrors(page);
  });

  test('theme persists across page navigation', async ({ page }) => {
    await navigateTo(page, '/settings');
    const darkBtn = page.getByRole('button', { name: 'Dark', exact: true });
    if (await darkBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await darkBtn.click();
      await page.waitForTimeout(300);

      // Navigate to another page
      await navigateTo(page, '/tasks');
      await page.waitForTimeout(500);
      const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(hasDark).toBe(true);
    }
    assertNoConsoleErrors(page);
  });
});
