import { test, expect } from '@playwright/test';
import { navigateTo, dismissOnboarding } from './helpers';

/**
 * Keyboard Shortcuts E2E Tests
 *
 * Tests global keyboard shortcuts across the application.
 */

test.describe('Global Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/');
  });

  test('Ctrl+K opens Command Palette', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog', { name: 'Synapse search' })).toBeVisible();
  });

  test('Ctrl+B toggles sidebar', async ({ page }) => {
    const sidebar = page.locator('aside[aria-label="Main navigation sidebar"]');
    await expect(sidebar).toBeVisible();

    // Toggle off
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(400);

    // Toggle on
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(400);
    await expect(sidebar).toBeVisible();
  });

  test('Escape closes modals', async ({ page }) => {
    // Open Command Palette
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog', { name: 'Synapse search' })).toBeVisible();

    // Escape should close it
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Synapse search' })).not.toBeVisible();
  });

  test('Ctrl+D creates/opens daily note', async ({ page }) => {
    await page.keyboard.press('Control+d');
    // Should navigate to notes with daily tab or create a daily note
    await page.waitForTimeout(500);
  });
});

test.describe('Focus Mode Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/focus');
  });

  test('Space toggles timer', async ({ page }) => {
    // Start
    await page.keyboard.press('Space');
    await expect(page.locator('button[aria-label="Pause timer"]')).toBeVisible();

    // Pause
    await page.keyboard.press('Space');
    await expect(page.locator('button[aria-label="Start timer"]')).toBeVisible();
  });

  test('R resets session', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(1500);

    await page.keyboard.press('r');
    await expect(page.getByText('00:00')).toBeVisible();
  });

  test('Escape exits focus mode', async ({ page }) => {
    await page.keyboard.press('Escape');
    await expect(page).not.toHaveURL(/\/focus/);
  });
});
