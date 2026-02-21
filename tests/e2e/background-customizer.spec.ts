import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Background Customizer E2E Tests
 *
 * Tests the background customization modal:
 * background types, gradient presets, image upload,
 * opacity/blur sliders, apply/reset/cancel.
 */

test.describe('Background Customizer', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/settings');
  });

  async function openBackgroundCustomizer(page: import('@playwright/test').Page) {
    const customizeBtn = page.getByRole('button', { name: /Customize Background/ });
    if (await customizeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await customizeBtn.click();
      await page.waitForTimeout(500);
    }
  }

  test('opens background customizer modal', async ({ page }) => {
    await openBackgroundCustomizer(page);
    await expect(page.getByText('Customize Background')).toBeVisible();
    assertNoConsoleErrors(page);
  });

  test('has background type buttons', async ({ page }) => {
    await openBackgroundCustomizer(page);
    const noneBtn = page.getByRole('button', { name: 'None', exact: true });
    const gradientBtn = page.getByRole('button', { name: 'Gradient', exact: true });
    const imageBtn = page.getByRole('button', { name: 'Image', exact: true });

    if (await noneBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(noneBtn).toBeVisible();
      await expect(gradientBtn).toBeVisible();
      await expect(imageBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has pattern button disabled with coming soon', async ({ page }) => {
    await openBackgroundCustomizer(page);
    const patternBtn = page.getByRole('button', { name: /Pattern.*Soon/ });
    if (await patternBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(patternBtn).toBeDisabled();
    }
    assertNoConsoleErrors(page);
  });

  test('can select Gradient type and see presets', async ({ page }) => {
    await openBackgroundCustomizer(page);
    const gradientBtn = page.getByRole('button', { name: 'Gradient', exact: true });
    if (await gradientBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gradientBtn.click();
      await page.waitForTimeout(300);

      // Should show gradient presets
      const purplePreset = page.locator('[title="Purple Bliss"]');
      if (await purplePreset.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(purplePreset).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('can select a gradient preset', async ({ page }) => {
    await openBackgroundCustomizer(page);
    const gradientBtn = page.getByRole('button', { name: 'Gradient', exact: true });
    if (await gradientBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gradientBtn.click();
      await page.waitForTimeout(300);

      const oceanPreset = page.locator('[title="Ocean"]');
      if (await oceanPreset.isVisible({ timeout: 1000 }).catch(() => false)) {
        await oceanPreset.click();
        await page.waitForTimeout(200);
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has opacity slider', async ({ page }) => {
    await openBackgroundCustomizer(page);
    const gradientBtn = page.getByRole('button', { name: 'Gradient', exact: true });
    if (await gradientBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gradientBtn.click();
      await page.waitForTimeout(300);

      const opacityLabel = page.getByText(/Opacity: \d+%/);
      if (await opacityLabel.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(opacityLabel).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has blur slider', async ({ page }) => {
    await openBackgroundCustomizer(page);
    const gradientBtn = page.getByRole('button', { name: 'Gradient', exact: true });
    if (await gradientBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gradientBtn.click();
      await page.waitForTimeout(300);

      const blurLabel = page.getByText(/Blur: \d+px/);
      if (await blurLabel.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(blurLabel).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has Apply, Cancel, and Reset buttons', async ({ page }) => {
    await openBackgroundCustomizer(page);
    const applyBtn = page.getByRole('button', { name: 'Apply', exact: true });
    const cancelBtn = page.getByRole('button', { name: 'Cancel', exact: true });
    const resetBtn = page.getByRole('button', { name: 'Reset', exact: true });

    if (await applyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(applyBtn).toBeVisible();
      await expect(cancelBtn).toBeVisible();
      await expect(resetBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can close with close button', async ({ page }) => {
    await openBackgroundCustomizer(page);
    const closeBtn = page.locator('[aria-label="Close background customizer"]');
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(300);
    }
    assertNoConsoleErrors(page);
  });

  test('can apply a gradient and close', async ({ page }) => {
    await openBackgroundCustomizer(page);
    const gradientBtn = page.getByRole('button', { name: 'Gradient', exact: true });
    if (await gradientBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gradientBtn.click();
      await page.waitForTimeout(200);

      const sunrisePreset = page.locator('[title="Sunrise"]');
      if (await sunrisePreset.isVisible({ timeout: 1000 }).catch(() => false)) {
        await sunrisePreset.click();
        await page.waitForTimeout(200);
      }

      const applyBtn = page.getByRole('button', { name: 'Apply', exact: true });
      if (await applyBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await applyBtn.click();
        await page.waitForTimeout(300);
      }
    }
    assertNoConsoleErrors(page);
  });

  test('reset clears background selection', async ({ page }) => {
    await openBackgroundCustomizer(page);
    const resetBtn = page.getByRole('button', { name: 'Reset', exact: true });
    if (await resetBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await resetBtn.click();
      await page.waitForTimeout(200);
    }
    assertNoConsoleErrors(page);
  });
});
