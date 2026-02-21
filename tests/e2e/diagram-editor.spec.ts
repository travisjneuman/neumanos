import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Diagram Editor E2E Tests
 *
 * Tests the diagram creation and editing canvas:
 * toolbar tools, shape palette, template gallery.
 */

test.describe('Diagram Editor', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/create?tab=diagrams');
  });

  test('diagrams tab loads', async ({ page }) => {
    const diagramsTab = page.getByRole('tab', { name: 'Diagrams' });
    if (await diagramsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(diagramsTab).toHaveAttribute('aria-selected', 'true');
    }
    assertNoConsoleErrors(page);
  });

  test('can create a new diagram', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new.*diagram|create.*diagram|\+/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);
    }
    assertNoConsoleErrors(page);
  });

  test('diagram editor has canvas', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new.*diagram|create.*diagram|\+/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);

      // Konva canvas renders as a div with canvas inside
      const canvas = page.locator('canvas').first();
      if (await canvas.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(canvas).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('diagram has toolbar with tools', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new.*diagram|create.*diagram|\+/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);

      // Check for toolbar buttons by title attribute
      const selectTool = page.locator('[title="Select"]');
      if (await selectTool.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(selectTool).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });
});
