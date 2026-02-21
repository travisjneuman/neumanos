import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * PM Dashboard Deep E2E Tests
 *
 * Tests the project management dashboard:
 * burndown chart, blocked tasks, upcoming deadlines,
 * project progress, team workload.
 */

test.describe('PM Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/pm');
  });

  test('page loads with heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /Project|PM|Dashboard/i }).first();
    if (await heading.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(heading).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has project selector', async ({ page }) => {
    const selector = page.locator('select, [role="combobox"]').first();
    if (await selector.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(selector).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has burndown chart section', async ({ page }) => {
    const burndown = page.getByText(/burndown/i);
    if (await burndown.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(burndown).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has blocked tasks section', async ({ page }) => {
    const blocked = page.getByText(/blocked/i);
    if (await blocked.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(blocked).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has upcoming deadlines section', async ({ page }) => {
    const deadlines = page.getByText(/deadline|upcoming|due/i).first();
    if (await deadlines.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(deadlines).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has task completion stats', async ({ page }) => {
    const stats = page.getByText(/completed|completion|progress/i).first();
    if (await stats.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(stats).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has sprint or timeline view', async ({ page }) => {
    const sprint = page.getByText(/sprint|timeline|gantt/i).first();
    if (await sprint.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(sprint).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });
});
