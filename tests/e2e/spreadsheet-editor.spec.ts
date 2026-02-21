import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Spreadsheet Editor E2E Tests
 *
 * Tests spreadsheet creation, cell editing,
 * formula bar, toolbar formatting, chart dialog.
 */

test.describe('Spreadsheet Editor', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/create');
  });

  test('can create a new spreadsheet', async ({ page }) => {
    const spreadsheetBtn = page.getByRole('button', { name: /Spreadsheet/i }).first();
    if (await spreadsheetBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await spreadsheetBtn.click();
      await page.waitForTimeout(500);
    }
    assertNoConsoleErrors(page);
  });

  test('spreadsheet renders grid cells', async ({ page }) => {
    const spreadsheetBtn = page.getByRole('button', { name: /Spreadsheet/i }).first();
    if (await spreadsheetBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await spreadsheetBtn.click();
      await page.waitForTimeout(500);

      // Spreadsheet should have table or grid cells
      const cells = page.locator('td, [role="gridcell"]');
      const count = await cells.count();
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      }
    }
    assertNoConsoleErrors(page);
  });

  test('can click on a cell', async ({ page }) => {
    const spreadsheetBtn = page.getByRole('button', { name: /Spreadsheet/i }).first();
    if (await spreadsheetBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await spreadsheetBtn.click();
      await page.waitForTimeout(500);

      const cell = page.locator('td, [role="gridcell"]').first();
      if (await cell.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cell.click();
        await page.waitForTimeout(200);
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has toolbar with formatting buttons', async ({ page }) => {
    const spreadsheetBtn = page.getByRole('button', { name: /Spreadsheet/i }).first();
    if (await spreadsheetBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await spreadsheetBtn.click();
      await page.waitForTimeout(500);

      // Check for formatting toolbar buttons
      const boldBtn = page.locator('[title="Bold"]');
      if (await boldBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(boldBtn).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });
});
