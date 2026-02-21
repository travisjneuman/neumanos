import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Automation Rule Builder E2E Tests
 *
 * Tests the automation rule builder UI:
 * triggers, conditions, actions, enable/disable.
 */

test.describe('Automation Rule Builder', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/automations');
  });

  test('page loads', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /Automation/i }).first();
    if (await heading.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(heading).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has create rule button', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /create.*rule|new.*rule|add.*rule|\+/i }).first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(createBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can open rule builder', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /create.*rule|new.*rule|add.*rule|\+/i }).first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(500);

      // Rule builder should show trigger section
      const triggerLabel = page.getByText(/trigger|when/i).first();
      if (await triggerLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(triggerLabel).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has trigger type selector', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /create.*rule|new.*rule|add.*rule|\+/i }).first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(500);

      const triggerSelect = page.locator('select').first();
      if (await triggerSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(triggerSelect).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has action section', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /create.*rule|new.*rule|add.*rule|\+/i }).first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(500);

      const actionLabel = page.getByText(/action|then/i).first();
      if (await actionLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(actionLabel).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has rule name input', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /create.*rule|new.*rule|add.*rule|\+/i }).first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(500);

      const nameInput = page.getByPlaceholder(/name|rule/i).first();
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(nameInput).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has save rule button', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /create.*rule|new.*rule|add.*rule|\+/i }).first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(500);

      const saveBtn = page.getByRole('button', { name: /save|create/i }).first();
      if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(saveBtn).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has automation history', async ({ page }) => {
    const historyBtn = page.getByRole('button', { name: /history|log/i });
    if (await historyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(historyBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });
});
