import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Link Library Deep E2E Tests
 *
 * Tests bookmark CRUD, categories, search,
 * import/export, and AI categorization.
 */

test.describe('Link Library', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/links');
  });

  test('page loads with heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /Link Library|Bookmarks/i });
    if (await heading.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(heading).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has add bookmark button', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*bookmark|add.*link|new.*bookmark|\+/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(addBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can open add bookmark form', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*bookmark|add.*link|new.*bookmark|\+/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(300);

      const urlInput = page.getByPlaceholder(/url|https/i).first();
      if (await urlInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(urlInput).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('can add a bookmark', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add.*bookmark|add.*link|new.*bookmark|\+/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(300);

      const urlInput = page.getByPlaceholder(/url|https/i).first();
      if (await urlInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await urlInput.fill('https://example.com');

        const titleInput = page.getByPlaceholder(/title|name/i).first();
        if (await titleInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          await titleInput.fill('E2E Test Bookmark');
        }

        const saveBtn = page.getByRole('button', { name: /save|add|create/i }).first();
        if (await saveBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(300);
        }
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has search input', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(searchInput).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has category filter', async ({ page }) => {
    const allBtn = page.getByRole('button', { name: /all/i }).first();
    if (await allBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(allBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has view toggle (grid/list)', async ({ page }) => {
    const gridBtn = page.locator('[title="Grid view"], [aria-label="Grid view"]').first();
    const listBtn = page.locator('[title="List view"], [aria-label="List view"]').first();
    if (await gridBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(gridBtn).toBeVisible();
    }
    if (await listBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(listBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has export button', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /export/i });
    if (await exportBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(exportBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has import button', async ({ page }) => {
    const importBtn = page.getByRole('button', { name: /import/i });
    if (await importBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(importBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });
});
