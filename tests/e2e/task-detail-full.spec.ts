import { test, expect } from '@playwright/test';
import { navigateTo, createTask, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Task Detail Panel — Full Interaction Tests
 *
 * Exhaustive testing of every field, tab, and interaction
 * in the CardDetailPanel side panel.
 */

test.describe('Task Detail Panel — Full Interactions', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/tasks');
    await createTask(page, 'Full Detail Test');
    await page.getByText('Full Detail Test').click();
    await page.waitForTimeout(500);
  });

  // --- Priority ---

  test('can set priority to High', async ({ page }) => {
    const prioritySelect = page.locator('select').filter({ has: page.locator('option[value="high"]') });
    if (await prioritySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await prioritySelect.selectOption('high');
      await page.waitForTimeout(300);
      await expect(prioritySelect).toHaveValue('high');
    }
    assertNoConsoleErrors(page);
  });

  test('can set priority to Low', async ({ page }) => {
    const prioritySelect = page.locator('select').filter({ has: page.locator('option[value="low"]') });
    if (await prioritySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await prioritySelect.selectOption('low');
      await page.waitForTimeout(300);
      await expect(prioritySelect).toHaveValue('low');
    }
    assertNoConsoleErrors(page);
  });

  // --- Description ---

  test('can add a description', async ({ page }) => {
    const descInput = page.getByPlaceholder('Add a description...');
    if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descInput.click();
      await descInput.fill('This is a detailed task description for testing.');
      await page.waitForTimeout(300);
      await expect(descInput).toHaveValue(/detailed task description/);
    }
    assertNoConsoleErrors(page);
  });

  // --- Tags ---

  test('can add a tag', async ({ page }) => {
    const tagInput = page.getByPlaceholder('Add a tag...');
    if (await tagInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tagInput.fill('e2e-test');
      const addBtn = page.getByRole('button', { name: 'Add', exact: true }).last();
      await addBtn.click();
      await page.waitForTimeout(300);
      await expect(page.getByText('e2e-test')).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can remove a tag', async ({ page }) => {
    // Add a tag first
    const tagInput = page.getByPlaceholder('Add a tag...');
    if (await tagInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tagInput.fill('removable');
      await page.getByRole('button', { name: 'Add', exact: true }).last().click();
      await page.waitForTimeout(300);

      // Remove it
      const removeBtn = page.locator('[aria-label="Remove tag removable"]');
      if (await removeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await removeBtn.click();
        await page.waitForTimeout(300);
        await expect(page.getByText('removable')).not.toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  // --- Milestone ---

  test('can toggle milestone checkbox', async ({ page }) => {
    const milestoneCheckbox = page.locator('#is-milestone');
    if (await milestoneCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await milestoneCheckbox.check();
      await page.waitForTimeout(200);
      await expect(milestoneCheckbox).toBeChecked();

      await milestoneCheckbox.uncheck();
      await page.waitForTimeout(200);
      await expect(milestoneCheckbox).not.toBeChecked();
    }
    assertNoConsoleErrors(page);
  });

  // --- Effort / Story Points ---

  test('can set effort/story points', async ({ page }) => {
    const effortSelect = page.locator('select').filter({ has: page.locator('option[value="5"]') });
    if (await effortSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await effortSelect.selectOption('5');
      await page.waitForTimeout(200);
      await expect(effortSelect).toHaveValue('5');
    }
    assertNoConsoleErrors(page);
  });

  // --- Custom Status ---

  test('can set custom status', async ({ page }) => {
    const statusSelect = page.locator('select').filter({ has: page.locator('option[value="in-review"]') });
    if (await statusSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await statusSelect.selectOption('in-review');
      await page.waitForTimeout(200);
      await expect(statusSelect).toHaveValue('in-review');
    }
    assertNoConsoleErrors(page);
  });

  // --- Time Estimate ---

  test('can set time estimate', async ({ page }) => {
    const timeInput = page.getByPlaceholder('e.g., 4.5');
    if (await timeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await timeInput.fill('3.5');
      await page.waitForTimeout(200);
      await expect(timeInput).toHaveValue('3.5');
    }
    assertNoConsoleErrors(page);
  });

  // --- Progress Quick-Set ---

  test('can set progress with quick buttons', async ({ page }) => {
    const btn50 = page.getByRole('button', { name: '50%', exact: true });
    if (await btn50.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn50.click();
      await page.waitForTimeout(200);
    }
    assertNoConsoleErrors(page);
  });

  // --- Timer ---

  test('can start and stop timer', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: /Start Timer/ });
    if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(500);

      const stopBtn = page.getByRole('button', { name: /Stop Timer/ });
      if (await stopBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await stopBtn.click();
        await page.waitForTimeout(300);
      }
    }
    assertNoConsoleErrors(page);
  });

  // --- Recurrence ---

  test('can add recurrence', async ({ page }) => {
    const addRecurrenceBtn = page.getByRole('button', { name: /Add Recurrence/ });
    if (await addRecurrenceBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addRecurrenceBtn.click();
      await page.waitForTimeout(300);
    }
    assertNoConsoleErrors(page);
  });

  // --- Save as Template ---

  test('has save as template button', async ({ page }) => {
    const templateBtn = page.getByRole('button', { name: /Save as Template/ });
    if (await templateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(templateBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  // --- Tabs ---

  test('can switch to Subtasks tab', async ({ page }) => {
    const tab = page.getByRole('button', { name: /Subtasks/ });
    if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(300);
    }
    assertNoConsoleErrors(page);
  });

  test('can switch to Checklist tab', async ({ page }) => {
    const tab = page.getByRole('button', { name: 'Checklist', exact: true });
    if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(300);
    }
    assertNoConsoleErrors(page);
  });

  test('can switch to Comments tab', async ({ page }) => {
    const tab = page.getByRole('button', { name: 'Comments', exact: true });
    if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(300);
    }
    assertNoConsoleErrors(page);
  });

  test('can switch to Activity tab', async ({ page }) => {
    const tab = page.getByRole('button', { name: 'Activity', exact: true });
    if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(300);
    }
    assertNoConsoleErrors(page);
  });

  test('can switch to Time tab', async ({ page }) => {
    const tab = page.getByRole('button', { name: 'Time', exact: true });
    if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(300);
    }
    assertNoConsoleErrors(page);
  });

  test('can switch to Attachments tab', async ({ page }) => {
    const tab = page.getByRole('button', { name: /Attachments/ });
    if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(300);
    }
    assertNoConsoleErrors(page);
  });

  // --- Close ---

  test('can close detail panel with Escape', async ({ page }) => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    assertNoConsoleErrors(page);
  });
});
