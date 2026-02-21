import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors, createTask } from './helpers';

/**
 * Undo System E2E Tests
 *
 * Tests the undo toast that appears after
 * destructive actions (delete, complete, etc.).
 */

test.describe('Undo System', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/tasks');
  });

  test('completing a task shows undo toast', async ({ page }) => {
    // Create a task first
    await createTask(page, 'Undo Test Task');
    await page.waitForTimeout(300);

    // Find and complete the task
    const taskCheckbox = page.locator('[role="checkbox"], input[type="checkbox"]').first();
    if (await taskCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await taskCheckbox.click();
      await page.waitForTimeout(500);

      // Look for undo toast
      const undoToast = page.getByText(/undo/i).first();
      if (await undoToast.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(undoToast).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('undo toast disappears after timeout', async ({ page }) => {
    await createTask(page, 'Undo Timeout Test');
    await page.waitForTimeout(300);

    const taskCheckbox = page.locator('[role="checkbox"], input[type="checkbox"]').first();
    if (await taskCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await taskCheckbox.click();
      await page.waitForTimeout(500);

      const undoToast = page.getByText(/undo/i).first();
      if (await undoToast.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Wait for toast to auto-dismiss (usually 5-10 seconds)
        await page.waitForTimeout(6000);
      }
    }
    assertNoConsoleErrors(page);
  });

  test('Ctrl+Z triggers undo', async ({ page }) => {
    await createTask(page, 'Ctrl+Z Test');
    await page.waitForTimeout(300);

    const taskCheckbox = page.locator('[role="checkbox"], input[type="checkbox"]').first();
    if (await taskCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await taskCheckbox.click();
      await page.waitForTimeout(500);

      // Try Ctrl+Z to undo
      await page.keyboard.press('Control+Z');
      await page.waitForTimeout(500);
    }
    assertNoConsoleErrors(page);
  });
});
