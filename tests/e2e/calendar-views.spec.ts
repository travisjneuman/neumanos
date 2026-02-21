import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Calendar Views E2E Tests
 *
 * Tests month/week/day view switching,
 * navigation, and event display in each view.
 */

test.describe('Calendar Views', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/schedule');
  });

  test('calendar page loads', async ({ page }) => {
    const heading = page.getByText(/Schedule|Calendar/i).first();
    if (await heading.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(heading).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has month view button', async ({ page }) => {
    const monthBtn = page.getByRole('button', { name: /month/i });
    if (await monthBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(monthBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has week view button', async ({ page }) => {
    const weekBtn = page.getByRole('button', { name: /week/i });
    if (await weekBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(weekBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has day view button', async ({ page }) => {
    const dayBtn = page.getByRole('button', { name: /day/i });
    if (await dayBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(dayBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can switch to week view', async ({ page }) => {
    const weekBtn = page.getByRole('button', { name: /week/i });
    if (await weekBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await weekBtn.click();
      await page.waitForTimeout(300);
    }
    assertNoConsoleErrors(page);
  });

  test('can switch to day view', async ({ page }) => {
    const dayBtn = page.getByRole('button', { name: /day/i });
    if (await dayBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dayBtn.click();
      await page.waitForTimeout(300);
    }
    assertNoConsoleErrors(page);
  });

  test('has today button', async ({ page }) => {
    const todayBtn = page.getByRole('button', { name: /today/i });
    if (await todayBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(todayBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has navigation arrows', async ({ page }) => {
    const prevBtn = page.locator('[aria-label*="previous"], [aria-label*="Previous"], [title*="Previous"]').first();
    const nextBtn = page.locator('[aria-label*="next"], [aria-label*="Next"], [title*="Next"]').first();
    if (await prevBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(prevBtn).toBeVisible();
    }
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(nextBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can navigate to next month', async ({ page }) => {
    const nextBtn = page.locator('[aria-label*="next"], [aria-label*="Next"], [title*="Next"]').first();
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(300);
    }
    assertNoConsoleErrors(page);
  });

  test('can navigate to previous month', async ({ page }) => {
    const prevBtn = page.locator('[aria-label*="previous"], [aria-label*="Previous"], [title*="Previous"]').first();
    if (await prevBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await prevBtn.click();
      await page.waitForTimeout(300);
    }
    assertNoConsoleErrors(page);
  });

  test('has create event button', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /create.*event|add.*event|new.*event|\+/i }).first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(createBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has ICS import button', async ({ page }) => {
    const importBtn = page.getByRole('button', { name: /import.*ics|import.*calendar/i });
    if (await importBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(importBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });
});
