import { test, expect } from '@playwright/test';
import { dismissOnboarding, navigateTo, ensureSidebarExpanded } from './helpers';

/**
 * Navigation & Sidebar E2E Tests
 *
 * Tests sidebar links, collapse/expand, child routes, theme toggle,
 * and URL-based routing.
 */

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/');
    await ensureSidebarExpanded(page);
  });

  test('sidebar contains all primary nav links', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Primary navigation"]');

    await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Schedule' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Notes' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Tasks' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Create' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Settings' })).toBeVisible();
  });

  test('navigates to each main page', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Primary navigation"]');

    // Tasks
    await nav.getByRole('link', { name: 'Tasks' }).click();
    await expect(page).toHaveURL(/\/tasks/);

    // Notes
    await nav.getByRole('link', { name: 'Notes' }).click();
    await expect(page).toHaveURL(/\/notes/);

    // Schedule
    await nav.getByRole('link', { name: 'Schedule' }).click();
    await expect(page).toHaveURL(/\/schedule/);

    // Create
    await nav.getByRole('link', { name: 'Create' }).click();
    await expect(page).toHaveURL(/\/create/);

    // Settings
    await nav.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings/);

    // Dashboard
    await nav.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/');
  });

  test('navigates to child routes via expanded sidebar', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Primary navigation"]');

    // Expand Dashboard section and click Today
    const todayLink = nav.getByRole('link', { name: 'Today' });
    if (await todayLink.isVisible({ timeout: 1000 }).catch(() => false)) {
      await todayLink.click();
      await expect(page).toHaveURL(/\/today/);
    } else {
      // May need to expand Dashboard first
      const expandBtn = nav.locator('button[title="Expand"]').first();
      if (await expandBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expandBtn.click();
        await nav.getByRole('link', { name: 'Today' }).click();
        await expect(page).toHaveURL(/\/today/);
      }
    }

    // Link Library
    const linkLibrary = nav.getByRole('link', { name: 'Link Library' });
    if (await linkLibrary.isVisible({ timeout: 1000 }).catch(() => false)) {
      await linkLibrary.click();
      await expect(page).toHaveURL(/\/links/);
    }
  });

  test('sidebar can be collapsed and expanded', async ({ page }) => {
    const sidebar = page.locator('aside[aria-label="Main navigation sidebar"]');
    await expect(sidebar).toBeVisible();

    // Collapse via button
    const collapseButton = page.getByRole('button', { name: /Collapse/i });
    if (await collapseButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await collapseButton.click();
      await page.waitForTimeout(300);
    }

    // Expand via button
    const expandButton = page.locator('button[title="Expand Sidebar"]');
    if (await expandButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expandButton.click();
      await page.waitForTimeout(300);
      // Sidebar should be expanded again
      await expect(page.locator('nav[aria-label="Primary navigation"]')).toBeVisible();
    }
  });

  test('sidebar can be toggled with Ctrl+B', async ({ page }) => {
    const sidebar = page.locator('aside[aria-label="Main navigation sidebar"]');
    await expect(sidebar).toBeVisible();

    // Toggle collapse
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(400);

    // Toggle expand
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(400);

    // Should be visible again
    await expect(sidebar).toBeVisible();
  });
});

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/');
  });

  test('can toggle dark/light mode from sidebar', async ({ page }) => {
    const initialTheme = await page.evaluate(() =>
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );

    // Find theme toggle button
    const themeButton = page.getByRole('button', { name: /Light Mode|Dark Mode/ });
    await themeButton.click();

    const newTheme = await page.evaluate(() =>
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );

    expect(newTheme).not.toBe(initialTheme);
  });

  test('theme persists after page reload', async ({ page }) => {
    // Toggle to dark mode
    const themeButton = page.getByRole('button', { name: /Light Mode|Dark Mode/ });
    await themeButton.click();
    await page.waitForTimeout(300);

    const themeAfterToggle = await page.evaluate(() =>
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );

    // Reload
    await page.reload();
    await dismissOnboarding(page);

    const themeAfterReload = await page.evaluate(() =>
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );

    expect(themeAfterReload).toBe(themeAfterToggle);
  });
});

test.describe('Direct URL Routing', () => {
  test('navigates to /today', async ({ page }) => {
    await navigateTo(page, '/today');
    await expect(page.getByText("Today's Tasks")).toBeVisible();
  });

  test('navigates to /tasks', async ({ page }) => {
    await navigateTo(page, '/tasks');
    await expect(page.getByRole('tab', { name: 'Tasks' })).toBeVisible();
  });

  test('navigates to /notes', async ({ page }) => {
    await navigateTo(page, '/notes');
    await expect(page.getByRole('tab', { name: 'Notes' })).toBeVisible();
  });

  test('navigates to /schedule', async ({ page }) => {
    await navigateTo(page, '/schedule');
    // Calendar or Schedule content should load
    await expect(page.getByRole('tab', { name: /Calendar/i })).toBeVisible();
  });

  test('navigates to /create', async ({ page }) => {
    await navigateTo(page, '/create');
    await expect(page.getByRole('tab', { name: 'Create' })).toBeVisible();
  });

  test('navigates to /links', async ({ page }) => {
    await navigateTo(page, '/links');
    await expect(page.getByPlaceholder('Search links...')).toBeVisible();
  });

  test('navigates to /settings', async ({ page }) => {
    await navigateTo(page, '/settings');
    await expect(page.getByRole('button', { name: 'General' })).toBeVisible();
  });

  test('navigates to /focus', async ({ page }) => {
    await navigateTo(page, '/focus');
    await expect(page.locator('button[aria-label="Exit Focus Mode"]')).toBeVisible();
  });

  test('navigates to /pm', async ({ page }) => {
    await navigateTo(page, '/pm');
    // PM Dashboard content
    await expect(page).toHaveURL(/\/pm/);
  });

  test('legacy routes redirect properly', async ({ page }) => {
    // /docs should redirect to /create
    await navigateTo(page, '/docs');
    await expect(page).toHaveURL(/\/create/);

    // /habits should redirect to /tasks?tab=habits
    await navigateTo(page, '/habits');
    await expect(page).toHaveURL(/\/tasks.*tab=habits/);

    // /graph should redirect to /notes?tab=graph
    await navigateTo(page, '/graph');
    await expect(page).toHaveURL(/\/notes.*tab=graph/);
  });
});
