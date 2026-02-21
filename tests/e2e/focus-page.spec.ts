import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers';

/**
 * Focus Mode E2E Tests
 *
 * Tests the full-screen focus mode at /focus:
 * timer display, play/pause, reset, keyboard shortcuts, exit.
 */

test.describe('Focus Mode', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/focus');
  });

  test('displays full-screen focus interface', async ({ page }) => {
    // Focus mode should show the timer display
    await expect(page.getByText(/\d{2}:\d{2}/)).toBeVisible();

    // Exit button should be available
    await expect(page.locator('button[aria-label="Exit Focus Mode"]')).toBeVisible();

    // Reset button should be available
    await expect(page.locator('button[aria-label="Reset session"]')).toBeVisible();
  });

  test('can start and pause timer', async ({ page }) => {
    // Initially should show start button
    const startBtn = page.locator('button[aria-label="Start timer"]');
    await expect(startBtn).toBeVisible();

    // Start the timer
    await startBtn.click();

    // Should now show pause button
    const pauseBtn = page.locator('button[aria-label="Pause timer"]');
    await expect(pauseBtn).toBeVisible();

    // Recording indicator should appear
    await expect(page.getByText('Recording')).toBeVisible();

    // Pause the timer
    await pauseBtn.click();

    // Should show start button again
    await expect(page.locator('button[aria-label="Start timer"]')).toBeVisible();
  });

  test('can toggle timer with Space key', async ({ page }) => {
    // Press Space to start
    await page.keyboard.press('Space');
    await expect(page.locator('button[aria-label="Pause timer"]')).toBeVisible();

    // Press Space to pause
    await page.keyboard.press('Space');
    await expect(page.locator('button[aria-label="Start timer"]')).toBeVisible();
  });

  test('can reset session with R key', async ({ page }) => {
    // Start the timer
    await page.keyboard.press('Space');
    await page.waitForTimeout(1500); // Let it tick

    // Reset with R
    await page.keyboard.press('r');

    // Timer should be back to 00:00
    await expect(page.getByText('00:00')).toBeVisible();
  });

  test('can exit focus mode with Escape', async ({ page }) => {
    await page.keyboard.press('Escape');

    // Should navigate away from /focus
    await expect(page).not.toHaveURL(/\/focus/);
  });

  test('can exit focus mode with exit button', async ({ page }) => {
    await page.locator('button[aria-label="Exit Focus Mode"]').click();

    // Should navigate away from /focus
    await expect(page).not.toHaveURL(/\/focus/);
  });

  test('reset button resets the timer', async ({ page }) => {
    // Start the timer
    await page.locator('button[aria-label="Start timer"]').click();
    await page.waitForTimeout(1500);

    // Click reset
    await page.locator('button[aria-label="Reset session"]').click();

    // Timer should reset
    await expect(page.getByText('00:00')).toBeVisible();
  });
});
