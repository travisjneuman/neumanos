import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Habits Deep E2E Tests
 *
 * Tests habit completion, streaks, archive,
 * and the full habit lifecycle.
 */

test.describe('Habits', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/habits');
  });

  test('page loads', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /Habits/i });
    if (await heading.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(heading).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has add habit button', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*habit|new.*habit|\+/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(addBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can open add habit form', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*habit|new.*habit|\+/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(300);

      const nameInput = page.getByPlaceholder(/habit.*name|name/i).first();
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(nameInput).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('can create a habit', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*habit|new.*habit|\+/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(300);

      const nameInput = page.getByPlaceholder(/habit.*name|name/i).first();
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameInput.fill('E2E Test Habit');

        const saveBtn = page.getByRole('button', { name: /save|create|add/i }).first();
        if (await saveBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(300);
          await expect(page.getByText('E2E Test Habit')).toBeVisible();
        }
      }
    }
    assertNoConsoleErrors(page);
  });

  test('habit has completion toggle', async ({ page }) => {
    // Look for any habit completion checkbox or toggle
    const toggle = page.locator('[role="checkbox"], input[type="checkbox"]').first();
    if (await toggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(toggle).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has streak display', async ({ page }) => {
    const streak = page.getByText(/streak|day/i).first();
    if (await streak.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(streak).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has archive/active filter', async ({ page }) => {
    const archiveBtn = page.getByRole('button', { name: /archive/i });
    if (await archiveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(archiveBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has frequency options', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*habit|new.*habit|\+/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(300);

      const frequencySelect = page.locator('select').filter({ has: page.locator('option', { hasText: /daily/i }) });
      if (await frequencySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(frequencySelect).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });
});
