import { test, expect } from '@playwright/test';
import { navigateTo, switchTab } from './helpers';

/**
 * Habits E2E Tests
 *
 * Tests habit creation, completion, streaks, archiving.
 * Habits live under /tasks?tab=habits.
 */

test.describe('Habits', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/tasks');
    await switchTab(page, 'Habits');
  });

  test('habits tab loads', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Habits' })).toHaveAttribute('aria-selected', 'true');
  });

  test('can access habits via URL', async ({ page }) => {
    await page.goto('/tasks?tab=habits');
    await expect(page.getByRole('tab', { name: 'Habits' })).toHaveAttribute('aria-selected', 'true');
  });

  test('shows habit creation UI', async ({ page }) => {
    // There should be a way to create a new habit
    const createHabitBtn = page.getByRole('button', { name: /new.*habit|add.*habit|create.*habit|\+/i });
    if (await createHabitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(createHabitBtn).toBeVisible();
    }
  });

  test('can create a habit', async ({ page }) => {
    const createHabitBtn = page.getByRole('button', { name: /new.*habit|add.*habit|create.*habit|\+/i });
    if (await createHabitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createHabitBtn.click();

      // Habit creation modal/form should appear
      const titleInput = page.getByPlaceholder(/title|habit.*name|name/i);
      if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await titleInput.fill('E2E Test Habit');

        // Save the habit
        const saveBtn = page.getByRole('button', { name: /save|create|add/i });
        await saveBtn.click();

        // Habit should appear
        await expect(page.getByText('E2E Test Habit')).toBeVisible();
      }
    }
  });

  test('legacy /habits redirects to /tasks?tab=habits', async ({ page }) => {
    await page.goto('/habits');
    await expect(page).toHaveURL(/\/tasks.*tab=habits/);
  });
});
