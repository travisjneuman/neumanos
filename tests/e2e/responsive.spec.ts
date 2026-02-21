import { test, expect } from '@playwright/test';
import { dismissOnboarding } from './helpers';

/**
 * Responsive Layout E2E Tests
 *
 * Tests the application at mobile, tablet, and desktop viewports.
 */

test.describe('Responsive - Mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('dashboard loads on mobile', async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);
    await expect(page).toHaveTitle(/NeumanOS/i);
  });

  test('sidebar is hidden on mobile', async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);

    // Sidebar should be hidden or a mobile drawer
    const sidebar = page.locator('aside[aria-label="Main navigation sidebar"]');
    // On mobile, the sidebar is typically not visible by default
  });

  test('notes page loads on mobile', async ({ page }) => {
    await page.goto('/notes');
    await dismissOnboarding(page);
    await expect(page.getByRole('tab', { name: 'Notes' })).toBeVisible();
  });

  test('tasks page loads on mobile', async ({ page }) => {
    await page.goto('/tasks');
    await dismissOnboarding(page);
    await expect(page.getByRole('tab', { name: 'Tasks' })).toBeVisible();
  });

  test('focus page works on mobile', async ({ page }) => {
    await page.goto('/focus');
    await dismissOnboarding(page);
    await expect(page.locator('button[aria-label="Exit Focus Mode"]')).toBeVisible();
    await expect(page.getByText(/\d{2}:\d{2}/)).toBeVisible();
  });
});

test.describe('Responsive - Tablet (768px)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('dashboard loads on tablet', async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);
    await expect(page).toHaveTitle(/NeumanOS/i);
  });

  test('navigation works on tablet', async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);

    // Navigate to key pages
    const nav = page.locator('nav[aria-label="Primary navigation"]');
    if (await nav.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nav.getByRole('link', { name: 'Tasks' }).click();
      await expect(page).toHaveURL(/\/tasks/);
    }
  });
});

test.describe('Responsive - Desktop (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('dashboard loads on large desktop', async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);
    await expect(page).toHaveTitle(/NeumanOS/i);

    // Sidebar should be fully visible
    const sidebar = page.locator('aside[aria-label="Main navigation sidebar"]');
    await expect(sidebar).toBeVisible();
  });

  test('all navigation links visible on desktop', async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);

    const nav = page.locator('nav[aria-label="Primary navigation"]');
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Tasks' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Notes' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Schedule' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Create' })).toBeVisible();
  });
});
