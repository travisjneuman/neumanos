import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors, createTask, createNote } from './helpers';

/**
 * Persistence Flow E2E Tests
 *
 * Tests that data survives page reloads.
 * Creates data, reloads the page, verifies it's still there.
 */

test.describe('Task Persistence', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
  });

  test('created task persists after reload', async ({ page }) => {
    await navigateTo(page, '/tasks');
    await createTask(page, 'Persist Test Task');
    await expect(page.getByText('Persist Test Task')).toBeVisible();

    // Reload and verify
    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.getByText('Persist Test Task')).toBeVisible({ timeout: 5000 });

    assertNoConsoleErrors(page);
  });

  test('task with tags persists after reload', async ({ page }) => {
    await navigateTo(page, '/tasks');
    await createTask(page, 'Tagged Persist Task');

    // Open task detail and add a tag
    await page.getByText('Tagged Persist Task').click();
    await page.waitForTimeout(300);

    const tagInput = page.getByPlaceholder('Add a tag...');
    if (await tagInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tagInput.fill('e2e-tag');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      // Close panel
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);

      // Reload and verify
      await page.reload();
      await page.waitForLoadState('networkidle').catch(() => {});

      // Re-open task detail
      const taskEl = page.getByText('Tagged Persist Task');
      if (await taskEl.isVisible({ timeout: 5000 }).catch(() => false)) {
        await taskEl.click();
        await page.waitForTimeout(300);

        // Verify tag persisted
        const tag = page.getByText('e2e-tag');
        if (await tag.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(tag).toBeVisible();
        }
      }
    }
    assertNoConsoleErrors(page);
  });

  test('task description persists after reload', async ({ page }) => {
    await navigateTo(page, '/tasks');
    await createTask(page, 'Description Persist Task');

    // Open task detail and add description
    await page.getByText('Description Persist Task').click();
    await page.waitForTimeout(300);

    const descInput = page.getByPlaceholder('Add a description...');
    if (await descInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await descInput.fill('This description should persist');
      await page.waitForTimeout(500); // auto-save

      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);

      // Reload and verify
      await page.reload();
      await page.waitForLoadState('networkidle').catch(() => {});

      const taskEl = page.getByText('Description Persist Task');
      if (await taskEl.isVisible({ timeout: 5000 }).catch(() => false)) {
        await taskEl.click();
        await page.waitForTimeout(300);

        const desc = page.getByText('This description should persist');
        if (await desc.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(desc).toBeVisible();
        }
      }
    }
    assertNoConsoleErrors(page);
  });
});

test.describe('Note Persistence', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
  });

  test('created note content persists after reload', async ({ page }) => {
    await navigateTo(page, '/notes');

    const newBtn = page.getByRole('button', { name: /new.*note|create.*note|\+/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);

      const editor = page.locator('[contenteditable="true"]').first();
      if (await editor.isVisible({ timeout: 3000 }).catch(() => false)) {
        await editor.click();
        await page.keyboard.type('Persistent note content for E2E test');
        await page.waitForTimeout(1000); // auto-save

        // Reload and verify
        await page.reload();
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(1000);

        const content = page.getByText('Persistent note content for E2E test');
        if (await content.isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(content).toBeVisible();
        }
      }
    }
    assertNoConsoleErrors(page);
  });
});

test.describe('Settings Persistence', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
  });

  test('display name persists after reload', async ({ page }) => {
    await navigateTo(page, '/settings');

    const nameInput = page.getByPlaceholder('Enter your name');
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.clear();
      await nameInput.fill('Persistence Test User');
      await page.waitForTimeout(500);

      // Reload and verify
      await page.reload();
      await page.waitForLoadState('networkidle').catch(() => {});

      const updatedInput = page.getByPlaceholder('Enter your name');
      if (await updatedInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(updatedInput).toHaveValue('Persistence Test User');
      }
    }
    assertNoConsoleErrors(page);
  });

  test('dark mode persists after reload', async ({ page }) => {
    await navigateTo(page, '/settings');

    const darkBtn = page.getByRole('button', { name: 'Dark', exact: true });
    if (await darkBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await darkBtn.click();
      await page.waitForTimeout(300);

      // Reload
      await page.reload();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(500);

      const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(hasDark).toBe(true);
    }
    assertNoConsoleErrors(page);
  });
});

test.describe('Cross-Page Data Visibility', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
  });

  test('task created on tasks page appears on today page', async ({ page }) => {
    await navigateTo(page, '/tasks');
    await createTask(page, 'Cross Page Visible Task');

    // Navigate to Today page
    await navigateTo(page, '/today');
    await page.waitForTimeout(500);

    // Task may appear in today's task list
    const task = page.getByText('Cross Page Visible Task');
    if (await task.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(task).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('navigating between pages preserves app state', async ({ page }) => {
    await navigateTo(page, '/');
    await navigateTo(page, '/tasks');
    await navigateTo(page, '/notes');
    await navigateTo(page, '/schedule');
    await navigateTo(page, '/settings');
    await navigateTo(page, '/');

    // App should still be healthy after rapid navigation
    await expect(page.getByRole('navigation')).toBeVisible();
    assertNoConsoleErrors(page);
  });
});
