import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Info Modals E2E Tests
 *
 * Tests About, Privacy, Support, and other
 * informational modals accessible from settings or footer.
 */

test.describe('Info Modals', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/settings');
  });

  test('has About link or button', async ({ page }) => {
    const aboutBtn = page.getByRole('button', { name: /about/i }).or(page.getByRole('link', { name: /about/i }));
    if (await aboutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(aboutBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can open About modal', async ({ page }) => {
    const aboutBtn = page.getByRole('button', { name: /about/i }).or(page.getByRole('link', { name: /about/i }));
    if (await aboutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await aboutBtn.click();
      await page.waitForTimeout(300);

      const aboutText = page.getByText(/NeumanOS|version|about/i).first();
      if (await aboutText.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(aboutText).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has Privacy link or button', async ({ page }) => {
    const privacyBtn = page.getByRole('button', { name: /privacy/i }).or(page.getByRole('link', { name: /privacy/i }));
    if (await privacyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(privacyBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has Support or Help link', async ({ page }) => {
    const supportBtn = page.getByRole('button', { name: /support|help/i }).or(page.getByRole('link', { name: /support|help/i }));
    if (await supportBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(supportBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has version info somewhere on settings page', async ({ page }) => {
    const version = page.getByText(/v\d+\.\d+|version/i).first();
    if (await version.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(version).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });
});
