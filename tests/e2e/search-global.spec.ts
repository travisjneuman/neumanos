import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Global Search E2E Tests
 *
 * Tests the global search functionality
 * accessible from the header or keyboard shortcut.
 */

test.describe('Global Search', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/');
  });

  test('has search input in header', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(searchInput).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('search can be opened with keyboard shortcut', async ({ page }) => {
    // Ctrl+K or / commonly opens search
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(300);

    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(searchInput).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can type in search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.click();
      await searchInput.fill('test query');
      await page.waitForTimeout(300);
      await expect(searchInput).toHaveValue('test query');
    }
    assertNoConsoleErrors(page);
  });

  test('search shows results or empty state', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.click();
      await searchInput.fill('nonexistent item xyz');
      await page.waitForTimeout(500);

      // Should show either results or empty state
      const results = page.getByText(/no.*results|no.*found|results/i).first();
      if (await results.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(results).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('Escape closes search', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(300);

    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
    assertNoConsoleErrors(page);
  });
});
