import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Idle Prompt E2E Tests
 *
 * Tests the idle prompt modal that appears
 * after inactivity with suggested actions.
 */

test.describe('Idle Prompt', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/');
  });

  test('page loads without idle prompt initially', async ({ page }) => {
    // Idle prompt should NOT appear immediately
    const idleModal = page.getByText(/idle|inactive|break/i).first();
    const isVisible = await idleModal.isVisible({ timeout: 1000 }).catch(() => false);
    // It's expected to not be visible initially
    expect(isVisible).toBe(false);
    assertNoConsoleErrors(page);
  });

  test('no console errors on dashboard load', async ({ page }) => {
    await page.waitForTimeout(2000);
    assertNoConsoleErrors(page);
  });
});
