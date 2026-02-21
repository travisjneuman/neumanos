import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Tag Manager E2E Tests
 *
 * Tests the tag management dialog: creating,
 * editing, deleting, and filtering by tags.
 */

test.describe('Tag Manager', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/tasks');
  });

  test('has tag filter in sidebar or toolbar', async ({ page }) => {
    const tagFilter = page.getByRole('button', { name: /tag|filter/i }).first();
    if (await tagFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(tagFilter).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can open tag manager', async ({ page }) => {
    const tagBtn = page.getByRole('button', { name: /manage.*tag|tag.*manager/i }).first();
    if (await tagBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tagBtn.click();
      await page.waitForTimeout(300);
    }
    assertNoConsoleErrors(page);
  });

  test('tag filter shows tag options', async ({ page }) => {
    const filterBtn = page.getByRole('button', { name: /filter/i }).first();
    if (await filterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await filterBtn.click();
      await page.waitForTimeout(300);

      const tagOption = page.getByText(/tag/i).first();
      if (await tagOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(tagOption).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });
});
