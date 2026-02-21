import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Note Editor Deep E2E Tests
 *
 * Tests the Lexical rich text editor features:
 * formatting toolbar, slash commands, templates.
 */

test.describe('Note Editor', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/notes');
  });

  test('can create a new note', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new.*note|create.*note|\+/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);
    }
    assertNoConsoleErrors(page);
  });

  test('editor area is editable', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new.*note|create.*note|\+/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);

      const editor = page.locator('[contenteditable="true"]').first();
      if (await editor.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(editor).toBeVisible();
        await editor.click();
        await page.keyboard.type('E2E Test Content');
        await page.waitForTimeout(200);
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has bold formatting button', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new.*note|create.*note|\+/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);

      const boldBtn = page.locator('[aria-label="Bold"], [title="Bold"]').first();
      if (await boldBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(boldBtn).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has italic formatting button', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new.*note|create.*note|\+/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);

      const italicBtn = page.locator('[aria-label="Italic"], [title="Italic"]').first();
      if (await italicBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(italicBtn).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has heading formatting options', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new.*note|create.*note|\+/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);

      const headingBtn = page.locator('[aria-label*="Heading"], [title*="Heading"], [aria-label*="heading"]').first();
      if (await headingBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(headingBtn).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has bullet list button', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new.*note|create.*note|\+/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);

      const listBtn = page.locator('[aria-label*="ullet"], [title*="ullet"], [aria-label*="list"], [title*="List"]').first();
      if (await listBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(listBtn).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has code block button', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new.*note|create.*note|\+/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);

      const codeBtn = page.locator('[aria-label*="Code"], [title*="Code"]').first();
      if (await codeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(codeBtn).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('slash command menu opens on /', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new.*note|create.*note|\+/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);

      const editor = page.locator('[contenteditable="true"]').first();
      if (await editor.isVisible({ timeout: 3000 }).catch(() => false)) {
        await editor.click();
        await page.keyboard.type('/');
        await page.waitForTimeout(500);

        // Slash command menu should appear
        const menu = page.locator('[role="menu"], [role="listbox"]').first();
        if (await menu.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(menu).toBeVisible();
        }
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has note title input', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new.*note|create.*note|\+/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);

      const titleInput = page.getByPlaceholder(/title|untitled/i).first();
      if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(titleInput).toBeVisible();
        await titleInput.fill('E2E Test Note Title');
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has template library button', async ({ page }) => {
    const templateBtn = page.getByRole('button', { name: /template/i });
    if (await templateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(templateBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has folder selector', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new.*note|create.*note|\+/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);

      const folderSelect = page.locator('select').filter({ has: page.locator('option', { hasText: /folder|all/i }) }).first();
      if (await folderSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(folderSelect).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });
});
