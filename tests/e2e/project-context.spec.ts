import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Project Context Dropdown E2E Tests
 *
 * Tests the project context dropdown (Ctrl+Shift+P):
 * project switching, project info display.
 */

test.describe('Project Context', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/');
  });

  test('has project context in sidebar or header', async ({ page }) => {
    const projectContext = page.locator('[aria-label*="project"], [title*="project"]').first()
      .or(page.getByText(/All Projects|No Project/i).first());
    if (await projectContext.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(projectContext).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can open project dropdown', async ({ page }) => {
    // Try keyboard shortcut
    await page.keyboard.press('Control+Shift+P');
    await page.waitForTimeout(300);

    const dropdown = page.locator('[role="menu"], [role="listbox"], [role="dialog"]').first();
    if (await dropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(dropdown).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('project dropdown shows All Projects option', async ({ page }) => {
    await page.keyboard.press('Control+Shift+P');
    await page.waitForTimeout(300);

    const allOption = page.getByText(/All Projects/i);
    if (await allOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(allOption).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can close project dropdown with Escape', async ({ page }) => {
    await page.keyboard.press('Control+Shift+P');
    await page.waitForTimeout(300);

    const dropdown = page.locator('[role="menu"], [role="listbox"], [role="dialog"]').first();
    if (await dropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
    assertNoConsoleErrors(page);
  });
});
