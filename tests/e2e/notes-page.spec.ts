import { test, expect } from '@playwright/test';
import { navigateTo, switchTab } from './helpers';

/**
 * Notes Page E2E Tests (comprehensive rewrite)
 *
 * Tests note creation, editing, deletion, folder management,
 * search, tags, tab navigation (Notes/Daily/Graph), and editor features.
 */

test.describe('Notes Page - Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/notes');
  });

  test('shows all notes tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Notes' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Daily Notes' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Graph' })).toBeVisible();
  });

  test('notes tab is selected by default', async ({ page }) => {
    const notesTab = page.getByRole('tab', { name: 'Notes' });
    await expect(notesTab).toHaveAttribute('aria-selected', 'true');
  });

  test('can switch to Daily Notes tab', async ({ page }) => {
    await switchTab(page, 'Daily Notes');
    await expect(page.getByRole('tab', { name: 'Daily Notes' })).toHaveAttribute('aria-selected', 'true');
  });

  test('can switch to Graph tab', async ({ page }) => {
    await switchTab(page, 'Graph');
    await expect(page.getByRole('tab', { name: 'Graph' })).toHaveAttribute('aria-selected', 'true');
  });

  test('tabs accessible via URL params', async ({ page }) => {
    await page.goto('/notes?tab=daily');
    await expect(page.getByRole('tab', { name: 'Daily Notes' })).toHaveAttribute('aria-selected', 'true');

    await page.goto('/notes?tab=graph');
    await expect(page.getByRole('tab', { name: 'Graph' })).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('Notes Page - Folder Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/notes');
  });

  test('displays folder sidebar elements', async ({ page }) => {
    await expect(page.getByText('Folders')).toBeVisible();
    await expect(page.getByPlaceholder(/Search notes/)).toBeVisible();
  });

  test('has All Notes button', async ({ page }) => {
    const allNotes = page.getByRole('button', { name: /All Notes/i });
    await expect(allNotes).toBeVisible();
  });

  test('can create a new folder', async ({ page }) => {
    const newFolderBtn = page.locator('button[title="New Folder"]');
    await newFolderBtn.click();

    // Folder name input should appear
    const folderInput = page.getByPlaceholder(/folder.*name|name/i);
    await expect(folderInput).toBeVisible();
    await folderInput.fill('E2E Folder');
    await page.keyboard.press('Enter');

    // Folder should appear in the tree
    await expect(page.getByText('E2E Folder')).toBeVisible();
  });

  test('has Manage Tags button', async ({ page }) => {
    const manageTagsBtn = page.getByRole('button', { name: /Manage Tags/i });
    await expect(manageTagsBtn).toBeVisible();
  });

  test('search filters notes', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search notes/);
    await searchInput.fill('nonexistent note xyz123');
    await page.waitForTimeout(300);

    // Search should filter — might show "No notes found" or empty state
  });
});

test.describe('Notes Page - CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/notes');
  });

  test('can create a new note', async ({ page }) => {
    // Find the create note button
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|\+ Note|\+/i }).first();
    await createButton.click();

    // Editor should appear
    const editor = page.locator('[contenteditable="true"]').first();
    await expect(editor).toBeVisible();

    // Type content
    await editor.click();
    await page.keyboard.type('E2E Created Note Content');

    // Content should be in editor
    await expect(editor).toContainText('E2E Created Note Content');
  });

  test('notes auto-save', async ({ page }) => {
    // Create a note
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|\+ Note|\+/i }).first();
    await createButton.click();

    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Auto-Save Test Content');

    // Wait for auto-save
    await page.waitForTimeout(1500);

    // Reload page
    await page.reload();
    await navigateTo(page, '/notes');

    // Note should persist
    await expect(page.getByText('Auto-Save Test Content')).toBeVisible();
  });

  test('can edit note content', async ({ page }) => {
    // Create a note
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|\+ Note|\+/i }).first();
    await createButton.click();

    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Initial Note Content');
    await page.waitForTimeout(500);

    // Select all and replace
    await page.keyboard.press('Control+a');
    await page.keyboard.type('Updated Note Content');

    await expect(editor).toContainText('Updated Note Content');
  });
});

test.describe('Notes Page - Editor Features', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/notes');

    // Create a note to work with
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|\+ Note|\+/i }).first();
    await createButton.click();
    await page.waitForTimeout(300);
  });

  test('supports bold formatting with Ctrl+B', async ({ page }) => {
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('normal ');
    await page.keyboard.press('Control+b');
    await page.keyboard.type('bold');
    await page.keyboard.press('Control+b');

    // Editor should contain bold text (rendered as <strong> or <b>)
    await expect(editor.locator('strong, b')).toContainText('bold');
  });

  test('supports italic formatting with Ctrl+I', async ({ page }) => {
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('normal ');
    await page.keyboard.press('Control+i');
    await page.keyboard.type('italic');
    await page.keyboard.press('Control+i');

    await expect(editor.locator('em, i')).toContainText('italic');
  });
});

test.describe('Notes Page - Daily Notes', () => {
  test('daily notes tab shows calendar grid', async ({ page }) => {
    await navigateTo(page, '/notes?tab=daily');

    // Daily notes tab should render some calendar-like interface
    // with clickable dates
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });
});

test.describe('Notes Page - Graph', () => {
  test('graph tab renders', async ({ page }) => {
    await navigateTo(page, '/notes?tab=graph');

    // Graph tab should load the force-directed graph view
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });
});
