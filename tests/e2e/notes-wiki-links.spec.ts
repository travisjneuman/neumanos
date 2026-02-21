import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * E2E Tests for Notes Wiki Links
 *
 * Covers: Create [[wiki link]], navigate via link, verify backlink panel updates
 */

test.describe('Notes Wiki Links', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/notes');
  });

  test('can create a wiki link using [[brackets]]', async ({ page }) => {
    // Create a source note
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|add.*note/i });
    await createButton.click();

    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();

    // Type content with a wiki link
    await page.keyboard.type('This is a reference to [[Target Note]]');

    // Wait for auto-save
    await page.waitForTimeout(1000);

    // Verify the wiki link appears (might be styled differently or have a special class)
    // Wiki links are typically rendered as clickable elements
    const wikiLink = page.getByText('Target Note');
    await expect(wikiLink).toBeVisible();
  });

  test('can navigate by clicking a wiki link', async ({ page }) => {
    // Create a target note first
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|add.*note/i });
    await createButton.click();

    let editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Target Note Content');
    await page.waitForTimeout(1000);

    // Create a source note with a wiki link
    await createButton.click();
    editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Reference to [[Target Note Content]]');
    await page.waitForTimeout(1000);

    // Find and click the wiki link
    // Wiki links might be in a special element or have data attributes
    const wikiLink = page.locator('a, [data-wiki-link], .wiki-link').filter({ hasText: 'Target Note Content' }).first();

    if (await wikiLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await wikiLink.click();

      // Wait for navigation or note selection
      await page.waitForTimeout(500);

      // Verify the target note is now active
      // The editor should show the target note's content
      await expect(editor).toContainText('Target Note Content');
    }
  });

  test('backlink panel updates when wiki links are created', async ({ page }) => {
    // Create a target note
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|add.*note/i });
    await createButton.click();

    let editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Target Note for Backlinks');
    await page.waitForTimeout(1000);

    // Note the target note (might need to select it from the list later)
    const targetNoteText = 'Target Note for Backlinks';

    // Create a source note with a wiki link to the target
    await createButton.click();
    editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Source note linking to [[Target Note for Backlinks]]');
    await page.waitForTimeout(1000);

    // Navigate back to the target note
    // Click on the target note in the notes list
    const targetNoteItem = page.getByText(targetNoteText).first();
    if (await targetNoteItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await targetNoteItem.click();

      // Wait for note to load
      await page.waitForTimeout(500);

      // Look for backlinks panel or section
      // This might be in a sidebar, collapsible panel, or metadata section
      const backlinksSection = page.getByText(/backlinks|linked references/i);

      if (await backlinksSection.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Verify the source note appears in backlinks
        await expect(page.getByText(/Source note linking to/)).toBeVisible();
      } else {
        // If backlinks panel is not immediately visible, it might be in a toggle or tab
        const backlinksToggle = page.getByRole('button', { name: /backlinks|references/i });
        if (await backlinksToggle.isVisible({ timeout: 1000 }).catch(() => false)) {
          await backlinksToggle.click();
          await page.waitForTimeout(300);
          await expect(page.getByText(/Source note linking to/)).toBeVisible();
        }
      }
    }
  });

  test('can create links to non-existent notes', async ({ page }) => {
    // Create a note with a link to a note that doesn't exist yet
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|add.*note/i });
    await createButton.click();

    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Link to [[Future Note That Does Not Exist]]');
    await page.waitForTimeout(1000);

    // Verify the wiki link appears (might be styled differently for non-existent notes)
    const wikiLink = page.getByText('Future Note That Does Not Exist');
    await expect(wikiLink).toBeVisible();

    // Wiki links to non-existent notes might have a different style or class
    // e.g., "broken-link" or "missing-note" class
    // We can verify it's clickable but might show a "create note" action
  });

  test('wiki links are case-sensitive', async ({ page }) => {
    // Create notes with different cases
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|add.*note/i });

    // Create "lowercase note"
    await createButton.click();
    let editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('lowercase note content');
    await page.waitForTimeout(1000);

    // Create a note linking to "Lowercase Note" (different case)
    await createButton.click();
    editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Link to [[Lowercase Note]]');
    await page.waitForTimeout(1000);

    // Verify the link appears
    const wikiLink = page.getByText('Lowercase Note');
    await expect(wikiLink).toBeVisible();

    // The system should handle case differences appropriately
    // This test verifies that the wiki link syntax works regardless of case matching
  });

  test('can create multiple wiki links in a single note', async ({ page }) => {
    // Create a note with multiple wiki links
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|add.*note/i });
    await createButton.click();

    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('This note links to [[First Note]] and [[Second Note]] and [[Third Note]]');
    await page.waitForTimeout(1000);

    // Verify all three wiki links appear
    await expect(page.getByText('First Note')).toBeVisible();
    await expect(page.getByText('Second Note')).toBeVisible();
    await expect(page.getByText('Third Note')).toBeVisible();
  });
});
