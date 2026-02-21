import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

/**
 * Accessibility E2E Tests
 *
 * Tests ARIA landmarks, keyboard navigation, focus management,
 * and semantic structure across key pages.
 */

test.describe('Accessibility - ARIA Landmarks', () => {
  test('dashboard has navigation landmark', async ({ page }) => {
    await navigateTo(page, '/');
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('sidebar has proper aria-label', async ({ page }) => {
    await navigateTo(page, '/');
    const sidebar = page.locator('aside[aria-label="Main navigation sidebar"]');
    await expect(sidebar).toBeVisible();
  });

  test('primary nav has proper aria-label', async ({ page }) => {
    await navigateTo(page, '/');
    const nav = page.locator('nav[aria-label="Primary navigation"]');
    await expect(nav).toBeVisible();
  });
});

test.describe('Accessibility - Focus Management', () => {
  test('tab navigation reaches interactive elements', async ({ page }) => {
    await navigateTo(page, '/');

    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Something should be focused
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('modals trap focus', async ({ page }) => {
    await navigateTo(page, '/');

    // Open Command Palette
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog', { name: 'Synapse search' })).toBeVisible();

    // The input should be focused
    const input = page.getByRole('combobox');
    await expect(input).toBeFocused();

    // Tab should keep focus within the dialog
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    // Focus should still be within the dialog
    const isInDialog = await page.evaluate(() => {
      const focused = document.activeElement;
      const dialog = document.querySelector('[role="dialog"]');
      return dialog?.contains(focused) ?? false;
    });
    expect(isInDialog).toBe(true);
  });
});

test.describe('Accessibility - Task Tabs', () => {
  test('tasks page has proper tablist role', async ({ page }) => {
    await navigateTo(page, '/tasks');

    const tablist = page.locator('[role="tablist"][aria-label="Tasks navigation"]');
    await expect(tablist).toBeVisible();
  });

  test('active tab has aria-selected=true', async ({ page }) => {
    await navigateTo(page, '/tasks');

    const activeTab = page.getByRole('tab', { name: 'Tasks' });
    await expect(activeTab).toHaveAttribute('aria-selected', 'true');
  });

  test('tab panels have proper role', async ({ page }) => {
    await navigateTo(page, '/tasks');

    const tabpanel = page.locator('[role="tabpanel"]');
    await expect(tabpanel.first()).toBeVisible();
  });
});

test.describe('Accessibility - Notes Tabs', () => {
  test('notes page has proper tablist', async ({ page }) => {
    await navigateTo(page, '/notes');

    const tablist = page.locator('[role="tablist"][aria-label="Notes navigation"]');
    await expect(tablist).toBeVisible();
  });
});

test.describe('Accessibility - Command Palette', () => {
  test('command palette has proper dialog role', async ({ page }) => {
    await navigateTo(page, '/');
    await page.keyboard.press('Control+k');

    const dialog = page.getByRole('dialog', { name: 'Synapse search' });
    await expect(dialog).toBeVisible();

    const combobox = page.getByRole('combobox');
    await expect(combobox).toBeVisible();

    const listbox = page.locator('#command-palette-results');
    // Listbox appears when results are present
  });
});
