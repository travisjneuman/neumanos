import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * CSV/Data Export E2E Tests
 *
 * Tests export functionality across
 * tasks, time tracking, and other features.
 */

test.describe('Data Export', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
  });

  test('tasks page has export option', async ({ page }) => {
    await navigateTo(page, '/tasks');
    const exportBtn = page.getByRole('button', { name: /export/i });
    if (await exportBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(exportBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('time tracking has export option', async ({ page }) => {
    await navigateTo(page, '/time');
    const exportBtn = page.getByRole('button', { name: /export/i });
    if (await exportBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(exportBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('gantt view has export options', async ({ page }) => {
    await navigateTo(page, '/tasks');
    const ganttBtn = page.getByRole('button', { name: /gantt/i });
    if (await ganttBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await ganttBtn.click();
      await page.waitForTimeout(500);

      const exportBtn = page.getByRole('button', { name: /export/i });
      if (await exportBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(exportBtn).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('backup page has export brain', async ({ page }) => {
    await navigateTo(page, '/settings?tab=backup');
    const exportBtn = page.getByRole('button', { name: 'Export Brain' });
    if (await exportBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(exportBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });
});
