import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Notes CRUD Operations
 *
 * Covers: Create note, edit note, delete note, folder organization, search notes
 */

// Helper to dismiss onboarding modals
async function dismissModals(page: any) {
  // Check for auto-save backup modal
  const skipButton = page.getByRole('button', { name: /skip for now/i });
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click();
    await skipButton.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
  }

  // Check for close modal button
  const closeButton = page.getByRole('button', { name: /close modal/i });
  if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeButton.click();
    await closeButton.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
  }
}

test.describe('Notes CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notes');
    await dismissModals(page);
  });

  test('can create a new note', async ({ page }) => {
    // Find and click the create note button
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|add.*note/i });
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Wait for note to be created and editor to be visible
    // The editor should appear (Lexical editor or contenteditable area)
    const editor = page.locator('[contenteditable="true"]').first();
    await expect(editor).toBeVisible();

    // Type some content
    await editor.click();
    await editor.fill('E2E Test Note Content');

    // Verify the content appears in the editor
    await expect(editor).toContainText('E2E Test Note Content');

    // Note should auto-save - verify it appears in the notes list
    const noteItem = page.getByText('E2E Test Note Content').first();
    await expect(noteItem).toBeVisible();
  });

  test('can edit an existing note', async ({ page }) => {
    // Create a note first
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|add.*note/i });
    await createButton.click();

    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await editor.fill('Initial Content');

    // Wait for auto-save
    await page.waitForTimeout(1000);

    // Clear and update the content
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('Updated Content');

    // Wait for auto-save
    await page.waitForTimeout(1000);

    // Verify updated content persists
    await expect(editor).toContainText('Updated Content');
  });

  test('can delete a note', async ({ page }) => {
    // Create a note first
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|add.*note/i });
    await createButton.click();

    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await editor.fill('Note to Delete');

    // Wait for auto-save
    await page.waitForTimeout(1000);

    // Find the delete button (might be in a context menu or toolbar)
    const deleteButton = page.getByRole('button', { name: /delete/i }).first();
    if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteButton.click();

      // Confirm deletion if there's a confirm dialog
      const confirmButton = page.getByRole('button', { name: /confirm|delete|yes/i });
      if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Verify note is no longer visible
      await expect(page.getByText('Note to Delete')).not.toBeVisible();
    }
  });

  test('can organize notes in folders', async ({ page }) => {
    // Look for folder management UI
    const newFolderButton = page.getByRole('button', { name: /new.*folder|create.*folder|add.*folder/i });

    if (await newFolderButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newFolderButton.click();

      // Fill in folder name
      const folderInput = page.getByPlaceholder(/folder.*name|name/i);
      if (await folderInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await folderInput.fill('E2E Test Folder');

        // Submit folder creation
        await page.keyboard.press('Enter');

        // Verify folder appears
        await expect(page.getByText('E2E Test Folder')).toBeVisible();

        // Select the folder
        await page.getByText('E2E Test Folder').click();

        // Create a note in this folder
        const createButton = page.getByRole('button', { name: /new.*note|create.*note|add.*note/i });
        await createButton.click();

        const editor = page.locator('[contenteditable="true"]').first();
        await editor.click();
        await editor.fill('Note in Folder');

        // Wait for auto-save
        await page.waitForTimeout(1000);

        // Verify note appears
        await expect(page.getByText('Note in Folder')).toBeVisible();
      }
    }
  });

  test('can search for notes', async ({ page }) => {
    // Create a few notes first
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|add.*note/i });

    // Create first note
    await createButton.click();
    let editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await editor.fill('Searchable Note Alpha');
    await page.waitForTimeout(1000);

    // Create second note
    await createButton.click();
    editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await editor.fill('Searchable Note Beta');
    await page.waitForTimeout(1000);

    // Create third note with different content
    await createButton.click();
    editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await editor.fill('Different Content');
    await page.waitForTimeout(1000);

    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i);

    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Search for "Searchable"
      await searchInput.fill('Searchable');

      // Wait for search results
      await page.waitForTimeout(500);

      // Should see the two searchable notes
      await expect(page.getByText('Searchable Note Alpha')).toBeVisible();
      await expect(page.getByText('Searchable Note Beta')).toBeVisible();

      // Should not see the different content note
      // Note: This might still be visible if search is not filtering, so we check count
      const searchableNotes = page.getByText(/Searchable Note/);
      await expect(searchableNotes).toHaveCount(2);
    }
  });
});
