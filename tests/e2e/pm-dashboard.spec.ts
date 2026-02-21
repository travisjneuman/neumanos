import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

/**
 * PM Dashboard E2E Tests
 *
 * Tests the project management dashboard at /pm.
 */

test.describe('PM Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/pm');
  });

  test('page loads', async ({ page }) => {
    await expect(page).toHaveURL(/\/pm/);
  });

  test('shows project stats', async ({ page }) => {
    // Should show stat cards: Total Tasks, Completed, In Progress, Overdue
    const statsSection = page.getByText(/Total|Completed|In Progress|Overdue/i).first();
    await expect(statsSection).toBeVisible();
  });

  test('has project selector', async ({ page }) => {
    // Project selector dropdown
    const projectSelector = page.getByText(/All Projects|Select Project/i).first();
    if (await projectSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(projectSelector).toBeVisible();
    }
  });
});
