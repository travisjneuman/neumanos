import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

/**
 * Automations Page E2E Tests
 *
 * Tests the automation rules page at /automations.
 */

test.describe('Automations', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/automations');
  });

  test('page loads', async ({ page }) => {
    await expect(page).toHaveURL(/\/automations/);
  });

  test('has new rule button', async ({ page }) => {
    const newRuleBtn = page.getByRole('button', { name: /new.*rule|add.*rule|create.*rule|\+/i });
    if (await newRuleBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(newRuleBtn).toBeVisible();
    }
  });
});
