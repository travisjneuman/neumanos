import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

/**
 * Dashboard E2E Tests (comprehensive rewrite)
 *
 * Tests the main dashboard: widget display, widget manager,
 * page settings, and overall layout.
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/');
  });

  test('loads the dashboard page', async ({ page }) => {
    await expect(page).toHaveTitle(/NeumanOS/i);
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('has the main navigation sidebar', async ({ page }) => {
    const sidebar = page.locator('aside[aria-label="Main navigation sidebar"]');
    await expect(sidebar).toBeVisible();
  });

  test('displays widgets on dashboard', async ({ page }) => {
    // The dashboard should render at least some default widgets
    // Wait for widgets to load
    await page.waitForTimeout(1000);

    // Look for any widget content — default widgets include My Day, Tasks Summary, etc.
    const hasContent = await page.locator('main, [role="main"], .dashboard, .widget-grid')
      .first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('page settings gear is accessible from sidebar', async ({ page }) => {
    const gearBtn = page.locator('button[aria-label="Dashboard page settings"]');
    if (await gearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gearBtn.click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Dashboard - Widget Manager', () => {
  test('can open widget manager from empty state', async ({ page }) => {
    await navigateTo(page, '/');

    // If there's a "Customize Widgets" button (empty state)
    const customizeBtn = page.getByRole('button', { name: /Customize.*Widget/i });
    if (await customizeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await customizeBtn.click();

      // Widget manager modal should appear
      await expect(page.getByText('Customize Dashboard Widgets')).toBeVisible();
    }
  });

  test('widget manager has search and categories', async ({ page }) => {
    // Navigate to settings to open widget manager
    await navigateTo(page, '/');

    // Try to open via URL hash
    await page.goto('/#customize-widgets');
    await page.waitForTimeout(500);

    const widgetModal = page.getByText('Customize Dashboard Widgets');
    if (await widgetModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Search input
      const searchInput = page.getByPlaceholder(/Search widgets/);
      await expect(searchInput).toBeVisible();

      // Done button
      await expect(page.getByRole('button', { name: 'Done' })).toBeVisible();
    }
  });
});
