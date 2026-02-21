import { test, expect } from '@playwright/test';

/**
 * Onboarding Flow E2E Tests
 *
 * Tests the 4-step onboarding modal shown to first-time users.
 */

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Go to dashboard as a "fresh" user (no stored state)
    await page.goto('/');
  });

  test('onboarding modal appears on first visit', async ({ page }) => {
    // The onboarding modal should appear with the welcome message
    await expect(page.getByText('Your privacy-first productivity platform')).toBeVisible({ timeout: 5000 });
    // Skip tour button should be available
    await expect(page.getByRole('button', { name: 'Skip tour' })).toBeVisible();
  });

  test('can navigate through all 4 onboarding steps', async ({ page }) => {
    // Step 1: Welcome
    await expect(page.getByText('Your privacy-first productivity platform')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /FAQ/i })).toBeVisible();

    // Go to Step 2
    await page.getByRole('button', { name: /Next/i }).click();
    await expect(page.getByText('Everything you need to stay organized')).toBeVisible();

    // Go to Step 3
    await page.getByRole('button', { name: /Next/i }).click();
    await expect(page.getByText('Personalize your experience')).toBeVisible();

    // Step 3 has display name input and theme selection
    await expect(page.locator('input#display-name')).toBeVisible();

    // Go to Step 4
    await page.getByRole('button', { name: /Next/i }).click();
    await expect(page.getByText("You're all set!")).toBeVisible();

    // Step 4 has action buttons
    await expect(page.getByRole('button', { name: 'Create Your First Note' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Your First Task' })).toBeVisible();
  });

  test('can go back through steps', async ({ page }) => {
    await expect(page.getByText('Your privacy-first productivity platform')).toBeVisible({ timeout: 5000 });

    // Go forward to step 2
    await page.getByRole('button', { name: /Next/i }).click();
    await expect(page.getByText('Everything you need to stay organized')).toBeVisible();

    // Go back to step 1
    await page.getByRole('button', { name: /Back/i }).click();
    await expect(page.getByText('Your privacy-first productivity platform')).toBeVisible();
  });

  test('can skip tour entirely', async ({ page }) => {
    await expect(page.getByText('Your privacy-first productivity platform')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Skip tour' }).click();

    // Modal should be gone
    await expect(page.getByText('Your privacy-first productivity platform')).not.toBeVisible();

    // Dashboard should be visible
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('can close modal with X button', async ({ page }) => {
    await expect(page.getByText('Your privacy-first productivity platform')).toBeVisible({ timeout: 5000 });

    await page.locator('button[aria-label="Close"]').click();

    // Modal should be gone
    await expect(page.getByText('Your privacy-first productivity platform')).not.toBeVisible();
  });

  test('can set display name in step 3', async ({ page }) => {
    await expect(page.getByText('Your privacy-first productivity platform')).toBeVisible({ timeout: 5000 });

    // Navigate to step 3
    await page.getByRole('button', { name: /Next/i }).click();
    await page.getByRole('button', { name: /Next/i }).click();
    await expect(page.getByText('Personalize your experience')).toBeVisible();

    // Set display name
    const nameInput = page.locator('input#display-name');
    await nameInput.fill('Test User');
    await expect(nameInput).toHaveValue('Test User');
  });

  test('can select a theme in step 3', async ({ page }) => {
    await expect(page.getByText('Your privacy-first productivity platform')).toBeVisible({ timeout: 5000 });

    // Navigate to step 3
    await page.getByRole('button', { name: /Next/i }).click();
    await page.getByRole('button', { name: /Next/i }).click();
    await expect(page.getByText('Personalize your experience')).toBeVisible();

    // Select dark mode
    await page.getByRole('button', { name: 'Dark', exact: true }).click();

    // Verify dark class is applied
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDark).toBe(true);
  });

  test('onboarding does not reappear after completion', async ({ page }) => {
    await expect(page.getByText('Your privacy-first productivity platform')).toBeVisible({ timeout: 5000 });

    // Complete the onboarding
    await page.getByRole('button', { name: 'Skip tour' }).click();
    await expect(page.getByText('Your privacy-first productivity platform')).not.toBeVisible();

    // Reload the page
    await page.reload();

    // Onboarding should not appear again
    const modalVisible = await page.getByText('Your privacy-first productivity platform')
      .isVisible({ timeout: 2000 }).catch(() => false);
    expect(modalVisible).toBe(false);
  });
});
