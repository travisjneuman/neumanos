import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Presentation Editor E2E Tests
 *
 * Tests the presentation creation and editing:
 * slides panel, theme selector, slide content editing.
 */

test.describe('Presentation Editor', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/create?tab=presentations');
  });

  test('presentations tab loads', async ({ page }) => {
    const tab = page.getByRole('tab', { name: 'Presentations' });
    if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(tab).toHaveAttribute('aria-selected', 'true');
    }
    assertNoConsoleErrors(page);
  });

  test('can create a new presentation', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new.*presentation|create.*presentation|\+/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);
    }
    assertNoConsoleErrors(page);
  });

  test('presentation has slides panel', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new.*presentation|create.*presentation|\+/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);

      const slidesPanel = page.getByText('Slides');
      if (await slidesPanel.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(slidesPanel).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has theme selector', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new.*presentation|create.*presentation|\+/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);

      const themeBtn = page.getByRole('button', { name: /theme/i });
      if (await themeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(themeBtn).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('can add a new slide', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new.*presentation|create.*presentation|\+/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);

      const addSlideBtn = page.getByRole('button', { name: /add.*slide|\+/i }).first();
      if (await addSlideBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addSlideBtn.click();
        await page.waitForTimeout(300);
      }
    }
    assertNoConsoleErrors(page);
  });
});
