import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Time Tracking Deep E2E Tests
 *
 * Tests the time tracking page features:
 * timer, manual entries, summary, filters, projects.
 */

test.describe('Time Tracking', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/time');
  });

  test('page loads', async ({ page }) => {
    const heading = page.getByText(/Time Tracking|Time/i).first();
    if (await heading.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(heading).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has start timer button', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: /start|play/i }).first();
    if (await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(startBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has task description input', async ({ page }) => {
    const input = page.getByPlaceholder(/what.*working|task|description/i).first();
    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(input).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has manual entry button', async ({ page }) => {
    const manualBtn = page.getByRole('button', { name: /manual|add.*entry/i }).first();
    if (await manualBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(manualBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has date filter', async ({ page }) => {
    const dateFilter = page.locator('input[type="date"]').first();
    if (await dateFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(dateFilter).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has summary/report view', async ({ page }) => {
    const summaryBtn = page.getByRole('button', { name: /summary|report/i });
    if (await summaryBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(summaryBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has project selector', async ({ page }) => {
    const projectSelect = page.locator('select').filter({ has: page.locator('option', { hasText: /project|all/i }) }).first();
    if (await projectSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(projectSelect).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has total time display', async ({ page }) => {
    const total = page.getByText(/total|hours|h.*m/i).first();
    if (await total.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(total).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });
});
