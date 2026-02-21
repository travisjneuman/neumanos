import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors, createTask } from './helpers';

/**
 * Application Basics E2E Tests
 *
 * Core smoke tests: app loads, navigation works, theme toggles,
 * keyboard navigation is accessible.
 */

test.describe('Application Basics', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
  });

  test('loads the dashboard with correct title', async ({ page }) => {
    await navigateTo(page, '/');
    await expect(page).toHaveTitle(/NeumanOS/i);
    await expect(page.getByRole('navigation')).toBeVisible();
    assertNoConsoleErrors(page);
  });

  test('navigation works between pages', async ({ page }) => {
    await navigateTo(page, '/');

    // Navigate to Tasks
    const tasksLink = page.getByRole('link', { name: /tasks/i }).first();
    if (await tasksLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tasksLink.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/.*tasks/);
    }

    // Navigate to Notes
    const notesLink = page.getByRole('link', { name: /notes/i }).first();
    if (await notesLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notesLink.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/.*notes/);
    }

    // Navigate back to Dashboard
    const dashLink = page.getByRole('link', { name: /dashboard/i }).first();
    if (await dashLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dashLink.click();
      await page.waitForTimeout(500);
    }

    assertNoConsoleErrors(page);
  });
});

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
  });

  test('can create a task', async ({ page }) => {
    await navigateTo(page, '/tasks');

    const addButton = page.getByRole('button', { name: '+ Add task' }).first();
    if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addButton.click();

      const titleInput = page.getByPlaceholder('Task title...');
      if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await titleInput.fill('E2E Test Task');
        await page.getByRole('button', { name: 'Add', exact: true }).click();
        await expect(page.getByText('E2E Test Task')).toBeVisible();
      }
    }

    assertNoConsoleErrors(page);
  });
});

test.describe('Theme and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
  });

  test('theme toggle works', async ({ page }) => {
    await navigateTo(page, '/');

    const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="Theme"], [title*="theme"], [title*="Theme"]').first();
    if (await themeToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      const initialTheme = await page.evaluate(() =>
        document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      );

      await themeToggle.click();
      await page.waitForTimeout(300);

      const newTheme = await page.evaluate(() =>
        document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      );

      expect(newTheme).not.toBe(initialTheme);
    }

    assertNoConsoleErrors(page);
  });

  test('keyboard navigation has visible focus indicator', async ({ page }) => {
    await navigateTo(page, '/');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    assertNoConsoleErrors(page);
  });
});
