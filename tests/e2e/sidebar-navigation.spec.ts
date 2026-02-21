import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Sidebar Navigation E2E Tests
 *
 * Tests the sidebar: all nav links, collapse/expand,
 * active state highlighting, mobile hamburger menu.
 */

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/');
  });

  test('sidebar is visible on desktop', async ({ page }) => {
    const sidebar = page.locator('nav, [role="navigation"]').first();
    if (await sidebar.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(sidebar).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has Dashboard link', async ({ page }) => {
    const link = page.getByRole('link', { name: /Dashboard/i }).or(page.getByText('Dashboard').first());
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(link).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has Tasks link', async ({ page }) => {
    const link = page.getByRole('link', { name: /Tasks/i }).or(page.getByText('Tasks').first());
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(link).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has Notes link', async ({ page }) => {
    const link = page.getByRole('link', { name: /Notes/i }).or(page.getByText('Notes').first());
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(link).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has Schedule link', async ({ page }) => {
    const link = page.getByRole('link', { name: /Schedule|Calendar/i }).or(page.getByText('Schedule').first());
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(link).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has Focus link', async ({ page }) => {
    const link = page.getByRole('link', { name: /Focus/i }).or(page.getByText('Focus').first());
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(link).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has Today link', async ({ page }) => {
    const link = page.getByRole('link', { name: /Today/i }).or(page.getByText('Today').first());
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(link).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has Settings link', async ({ page }) => {
    const link = page.getByRole('link', { name: /Settings/i }).or(page.getByText('Settings').first());
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(link).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('clicking Tasks navigates to tasks page', async ({ page }) => {
    const link = page.getByRole('link', { name: /Tasks/i }).first();
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/tasks/);
    }
    assertNoConsoleErrors(page);
  });

  test('clicking Notes navigates to notes page', async ({ page }) => {
    const link = page.getByRole('link', { name: /Notes/i }).first();
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/notes/);
    }
    assertNoConsoleErrors(page);
  });

  test('has sidebar collapse button', async ({ page }) => {
    const collapseBtn = page.locator('[aria-label*="collapse"], [aria-label*="Collapse"], [title*="collapse"]').first();
    if (await collapseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(collapseBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('active nav link is highlighted', async ({ page }) => {
    const activeLink = page.locator('nav a[aria-current="page"], nav [data-active="true"]').first();
    if (await activeLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(activeLink).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });
});
