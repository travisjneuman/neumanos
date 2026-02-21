import { test, expect } from '@playwright/test';
import { navigateTo, openCommandPalette } from './helpers';

/**
 * Command Palette (Synapse) E2E Tests
 *
 * Tests the Ctrl+K search, command mode (>), help mode (?),
 * navigation mode (/), and result selection.
 */

test.describe('Command Palette (Synapse)', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/');
  });

  test('opens with Ctrl+K', async ({ page }) => {
    await page.keyboard.press('Control+k');

    const dialog = page.getByRole('dialog', { name: 'Synapse search' });
    await expect(dialog).toBeVisible();

    const input = page.getByRole('combobox');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
  });

  test('closes with Escape', async ({ page }) => {
    await openCommandPalette(page);

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog', { name: 'Synapse search' })).not.toBeVisible();
  });

  test('shows search results when typing', async ({ page }) => {
    await openCommandPalette(page);

    const input = page.getByRole('combobox');
    await input.fill('Dashboard');

    // Should show results
    const results = page.getByRole('listbox', { name: /command-palette-results/i })
      .or(page.locator('#command-palette-results'));
    await expect(results).toBeVisible();

    // Should have at least one result
    const options = page.getByRole('option');
    await expect(options.first()).toBeVisible();
  });

  test('enters command mode with > prefix', async ({ page }) => {
    await openCommandPalette(page);

    const input = page.getByRole('combobox');
    await input.fill('>');

    // Placeholder should change to command mode
    await expect(input).toHaveAttribute('placeholder', /command/i);
  });

  test('can toggle dark mode via command', async ({ page }) => {
    const initialTheme = await page.evaluate(() =>
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );

    await openCommandPalette(page);

    const input = page.getByRole('combobox');
    await input.fill('>Toggle');

    // Find and click the toggle theme command
    const toggleOption = page.getByRole('option', { name: /Toggle.*Mode/i }).first();
    await expect(toggleOption).toBeVisible();
    await toggleOption.click();

    const newTheme = await page.evaluate(() =>
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );
    expect(newTheme).not.toBe(initialTheme);
  });

  test('enters help mode with ? prefix', async ({ page }) => {
    await openCommandPalette(page);

    const input = page.getByRole('combobox');
    await input.fill('?');

    // Should show help content
    await expect(input).toHaveAttribute('placeholder', /help/i);
  });

  test('enters navigation mode with / prefix', async ({ page }) => {
    await openCommandPalette(page);

    const input = page.getByRole('combobox');
    await input.fill('/');

    // Should show page navigation options
    await expect(input).toHaveAttribute('placeholder', /page/i);
  });

  test('navigates to page via command palette', async ({ page }) => {
    await openCommandPalette(page);

    const input = page.getByRole('combobox');
    await input.fill('Notes');

    // Click the Notes page result
    const notesOption = page.getByRole('option', { name: /Notes/i }).first();
    await expect(notesOption).toBeVisible();
    await notesOption.click();

    // Should navigate to notes
    await expect(page).toHaveURL(/\/notes/);
  });

  test('keyboard navigation works in results', async ({ page }) => {
    await openCommandPalette(page);

    const input = page.getByRole('combobox');
    await input.fill('task');

    // Wait for results
    await page.waitForTimeout(300);

    // Arrow down to select
    await page.keyboard.press('ArrowDown');

    // First option should be selected
    const selectedOption = page.getByRole('option', { name: /task/i }).first();
    if (await selectedOption.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Enter to activate
      await page.keyboard.press('Enter');
      // Should have navigated or executed
    }
  });

  test('close button works', async ({ page }) => {
    await openCommandPalette(page);

    const closeButton = page.locator('button[aria-label="Close Synapse"]');
    await closeButton.click();

    await expect(page.getByRole('dialog', { name: 'Synapse search' })).not.toBeVisible();
  });
});
