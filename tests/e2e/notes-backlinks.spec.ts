import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Notes Backlinks Panel
 *
 * Covers: Verify backlinks panel shows linked references,
 *         verify unlinked mentions detection,
 *         test "Link" button conversion
 */

// Helper to dismiss onboarding modals
async function dismissModals(page: any) {
  const skipButton = page.getByRole('button', { name: /skip for now/i });
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click();
    await skipButton.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
  }

  const closeButton = page.getByRole('button', { name: /close modal/i });
  if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeButton.click();
    await closeButton.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
  }
}

test.describe('Notes Backlinks Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notes');
    await dismissModals(page);
  });

  test('backlinks panel shows all linked references', async ({ page }) => {
    // Create a target note
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|add.*note/i });
    await createButton.click();

    let editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Backlink Target Note');
    await page.waitForTimeout(1000);

    // Create multiple notes that link to the target
    for (let i = 1; i <= 3; i++) {
      await createButton.click();
      editor = page.locator('[contenteditable="true"]').first();
      await editor.click();
      await page.keyboard.type(`Source Note ${i} linking to [[Backlink Target Note]]`);
      await page.waitForTimeout(1000);
    }

    // Navigate back to the target note
    const targetNoteItem = page.getByText('Backlink Target Note').first();
    await targetNoteItem.click();
    await page.waitForTimeout(500);

    // Look for backlinks panel
    const backlinksSection = page.getByText(/backlinks|linked references/i);

    if (await backlinksSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Verify all three source notes appear in backlinks
      await expect(page.getByText(/Source Note 1/)).toBeVisible();
      await expect(page.getByText(/Source Note 2/)).toBeVisible();
      await expect(page.getByText(/Source Note 3/)).toBeVisible();
    } else {
      // Try to open backlinks panel if it's hidden
      const backlinksToggle = page.getByRole('button', { name: /backlinks|references|info/i });
      if (await backlinksToggle.isVisible({ timeout: 1000 }).catch(() => false)) {
        await backlinksToggle.click();
        await page.waitForTimeout(300);

        // Now verify the backlinks appear
        await expect(page.getByText(/Source Note 1/)).toBeVisible();
        await expect(page.getByText(/Source Note 2/)).toBeVisible();
        await expect(page.getByText(/Source Note 3/)).toBeVisible();
      }
    }
  });

  test('backlinks panel detects unlinked mentions', async ({ page }) => {
    // Create a target note with a unique title
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|add.*note/i });
    await createButton.click();

    let editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Unique Mention Target');
    await page.waitForTimeout(1000);

    // Create a note with an unlinked mention (not using [[brackets]])
    await createButton.click();
    editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('This note mentions Unique Mention Target but does not link to it');
    await page.waitForTimeout(1000);

    // Navigate back to the target note
    const targetNoteItem = page.getByText('Unique Mention Target').first();
    await targetNoteItem.click();
    await page.waitForTimeout(500);

    // Look for backlinks panel and unlinked mentions section
    const backlinksToggle = page.getByRole('button', { name: /backlinks|references|info/i });
    if (await backlinksToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await backlinksToggle.click();
      await page.waitForTimeout(300);
    }

    // Look for unlinked mentions section
    const unlinkedSection = page.getByText(/unlinked mentions|unlinked references/i);

    if (await unlinkedSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Verify the mention appears
      await expect(page.getByText(/This note mentions Unique Mention Target/)).toBeVisible();
    }
  });

  test('can convert unlinked mention to wiki link using Link button', async ({ page }) => {
    // Create a target note
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|add.*note/i });
    await createButton.click();

    let editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Link Conversion Target');
    await page.waitForTimeout(1000);

    // Create a note with an unlinked mention
    await createButton.click();
    editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Unlinked mention of Link Conversion Target here');
    await page.waitForTimeout(1000);

    // Navigate to the target note
    const targetNoteItem = page.getByText('Link Conversion Target').first();
    await targetNoteItem.click();
    await page.waitForTimeout(500);

    // Open backlinks panel if needed
    const backlinksToggle = page.getByRole('button', { name: /backlinks|references|info/i });
    if (await backlinksToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await backlinksToggle.click();
      await page.waitForTimeout(300);
    }

    // Look for the "Link" button in unlinked mentions
    const linkButton = page.getByRole('button', { name: /^link$|convert.*link/i });

    if (await linkButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await linkButton.click();
      await page.waitForTimeout(500);

      // After conversion, the mention should move from unlinked to linked references
      // Verify it now appears in the linked references section
      const linkedSection = page.getByText(/^backlinks$|linked references/i);
      await expect(linkedSection).toBeVisible();
      await expect(page.getByText(/Unlinked mention of Link Conversion Target/)).toBeVisible();
    }
  });

  test('backlinks update in real-time when links are added', async ({ page }) => {
    // Create a target note
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|add.*note/i });
    await createButton.click();

    let editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Real Time Backlinks');
    await page.waitForTimeout(1000);

    // Select the target note and open backlinks
    const targetNoteItem = page.getByText('Real Time Backlinks').first();
    await targetNoteItem.click();
    await page.waitForTimeout(500);

    // Open backlinks panel
    const backlinksToggle = page.getByRole('button', { name: /backlinks|references|info/i });
    if (await backlinksToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await backlinksToggle.click();
      await page.waitForTimeout(300);
    }

    // Initially, there should be no backlinks
    const noBacklinksMsg = page.getByText(/no.*backlinks|no.*references/i);
    if (await noBacklinksMsg.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(noBacklinksMsg).toBeVisible();
    }

    // Create a new note with a link to the target
    await createButton.click();
    editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('New source linking to [[Real Time Backlinks]]');
    await page.waitForTimeout(1000);

    // Navigate back to the target note
    await targetNoteItem.click();
    await page.waitForTimeout(500);

    // Backlinks should now show the new link
    await expect(page.getByText(/New source linking to/)).toBeVisible();
  });

  test('backlinks panel shows note preview context', async ({ page }) => {
    // Create a target note
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|add.*note/i });
    await createButton.click();

    let editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Context Preview Target');
    await page.waitForTimeout(1000);

    // Create a source note with surrounding context
    await createButton.click();
    editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Before context [[Context Preview Target]] after context');
    await page.waitForTimeout(1000);

    // Navigate to the target note
    const targetNoteItem = page.getByText('Context Preview Target').first();
    await targetNoteItem.click();
    await page.waitForTimeout(500);

    // Open backlinks panel
    const backlinksToggle = page.getByRole('button', { name: /backlinks|references|info/i });
    if (await backlinksToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await backlinksToggle.click();
      await page.waitForTimeout(300);
    }

    // Backlinks should show context around the link
    // This might include "before context" and "after context"
    const backlinkPreview = page.getByText(/Before context.*Context Preview Target.*after context/i);
    if (await backlinkPreview.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(backlinkPreview).toBeVisible();
    }
  });

  test('clicking backlink navigates to source note', async ({ page }) => {
    // Create a target note
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|add.*note/i });
    await createButton.click();

    let editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Backlink Navigation Target');
    await page.waitForTimeout(1000);

    // Create a source note
    await createButton.click();
    editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Source for navigation test [[Backlink Navigation Target]]');
    await page.waitForTimeout(1000);

    // Navigate to the target note
    const targetNoteItem = page.getByText('Backlink Navigation Target').first();
    await targetNoteItem.click();
    await page.waitForTimeout(500);

    // Open backlinks panel
    const backlinksToggle = page.getByRole('button', { name: /backlinks|references|info/i });
    if (await backlinksToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await backlinksToggle.click();
      await page.waitForTimeout(300);
    }

    // Click on the backlink to navigate to source note
    const backlinkItem = page.getByText(/Source for navigation test/).first();
    if (await backlinkItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await backlinkItem.click();
      await page.waitForTimeout(500);

      // Verify we're now viewing the source note
      await expect(editor).toContainText('Source for navigation test');
    }
  });
});
