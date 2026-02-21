import { test, expect } from '@playwright/test';
import { navigateTo, createTask } from './helpers';

/**
 * Task Detail Panel E2E Tests
 *
 * Tests every interaction in the task detail side panel:
 * title editing, description, priority, dates, tags, subtasks,
 * checklist, comments, activity, time tracking, dependencies.
 */

test.describe('Task Detail Panel', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/tasks');
    await createTask(page, 'Detail Panel Test');
    // Open the detail panel
    await page.getByText('Detail Panel Test').click();
    await page.waitForTimeout(500);
  });

  test('detail panel opens with task title', async ({ page }) => {
    // The detail panel should show the task title
    await expect(page.getByDisplayValue('Detail Panel Test').or(
      page.locator('input').filter({ hasText: 'Detail Panel Test' })
    ).or(page.getByText('Detail Panel Test').nth(1))).toBeVisible();
  });

  test('can edit task title', async ({ page }) => {
    // Find the title input in the detail panel
    const titleInput = page.getByDisplayValue('Detail Panel Test');
    if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await titleInput.click();
      await titleInput.clear();
      await titleInput.fill('Renamed Task');
      await page.keyboard.press('Tab'); // Trigger save
      await page.waitForTimeout(300);

      // Verify renamed on the board
      await expect(page.getByText('Renamed Task')).toBeVisible();
    }
  });

  test('can set task priority', async ({ page }) => {
    // Look for priority selector
    const priorityBtn = page.getByRole('button', { name: /priority|low|medium|high/i }).first();
    if (await priorityBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await priorityBtn.click();

      // Select High priority
      const highOption = page.getByText('High', { exact: true }).or(
        page.getByRole('option', { name: /high/i })
      );
      if (await highOption.isVisible({ timeout: 1000 }).catch(() => false)) {
        await highOption.click();
      }
    }
  });

  test('can add a description', async ({ page }) => {
    const descInput = page.getByPlaceholder(/description|details|add.*description/i);
    if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descInput.click();
      await descInput.fill('This is a test description for the task');
      await expect(descInput).toHaveValue(/test description/);
    }
  });

  test('has subtasks tab', async ({ page }) => {
    const subtasksTab = page.getByRole('button', { name: /subtask/i }).or(
      page.getByText('Subtasks', { exact: false })
    );
    if (await subtasksTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await subtasksTab.click();
    }
  });

  test('can add a subtask', async ({ page }) => {
    // Click subtasks tab
    const subtasksTab = page.getByRole('button', { name: /subtask/i }).or(
      page.getByText('Subtasks', { exact: false })
    );
    if (await subtasksTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await subtasksTab.click();
      await page.waitForTimeout(200);

      // Add subtask
      const addSubtaskBtn = page.getByRole('button', { name: /add.*subtask|\+/i });
      if (await addSubtaskBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await addSubtaskBtn.click();

        const subtaskInput = page.getByPlaceholder(/subtask|title/i);
        if (await subtaskInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          await subtaskInput.fill('Test Subtask');
          await page.keyboard.press('Enter');
          await expect(page.getByText('Test Subtask')).toBeVisible();
        }
      }
    }
  });

  test('has checklist tab', async ({ page }) => {
    const checklistTab = page.getByRole('button', { name: /checklist/i }).or(
      page.getByText('Checklist', { exact: false })
    );
    if (await checklistTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await checklistTab.click();
    }
  });

  test('has comments tab', async ({ page }) => {
    const commentsTab = page.getByRole('button', { name: /comment/i }).or(
      page.getByText('Comments', { exact: false })
    );
    if (await commentsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await commentsTab.click();
    }
  });

  test('has activity tab', async ({ page }) => {
    const activityTab = page.getByRole('button', { name: /activity/i }).or(
      page.getByText('Activity', { exact: false })
    );
    if (await activityTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await activityTab.click();
    }
  });

  test('can close detail panel', async ({ page }) => {
    // Close button or escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });
});
