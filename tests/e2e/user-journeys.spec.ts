import { test, expect } from '@playwright/test';
import { navigateTo, createTask, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * End-to-End User Journey Tests
 *
 * These tests simulate complete user workflows across multiple features.
 * They verify the UX from the perspective of a real user, not individual components.
 */

test.describe('User Journey: First-Time User', () => {
  test('completes onboarding and creates first content', async ({ page }) => {
    setupConsoleMonitor(page);
    await page.goto('/');

    // Step 1: Welcome
    await expect(page.getByText('Your privacy-first productivity platform')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /Next/i }).click();

    // Step 2: Features
    await expect(page.getByText('Everything you need to stay organized')).toBeVisible();
    await page.getByRole('button', { name: /Next/i }).click();

    // Step 3: Setup
    await expect(page.getByText('Personalize your experience')).toBeVisible();
    const nameInput = page.locator('input#display-name');
    await nameInput.fill('Test User');
    await page.getByRole('button', { name: /Next/i }).click();

    // Step 4: Done
    await expect(page.getByText("You're all set!")).toBeVisible();

    // Click "Create Your First Note" to go directly to notes
    await page.getByRole('button', { name: 'Create Your First Note' }).click();
    await expect(page).toHaveURL(/\/notes/);

    assertNoConsoleErrors(page);
  });
});

test.describe('User Journey: Daily Productivity Workflow', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/');
  });

  test('check today, create task, track time, take notes', async ({ page }) => {
    // 1. Check Today page
    await page.goto('/today');
    await expect(page.getByText("Today's Tasks")).toBeVisible();
    await expect(page.getByText('Completed')).toBeVisible();

    // 2. Navigate to Tasks and create a task
    await page.goto('/tasks');
    await createTask(page, 'Daily Review Task');
    await expect(page.getByText('Daily Review Task')).toBeVisible();

    // 3. Navigate to Notes and create a note
    await page.goto('/notes');
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|\+ Note|\+/i }).first();
    await createButton.click();
    const editor = page.locator('[contenteditable="true"]').first();
    await expect(editor).toBeVisible();
    await editor.click();
    await page.keyboard.type('Daily review notes for today');
    await page.waitForTimeout(500);

    // 4. Check Focus mode
    await page.goto('/focus');
    await expect(page.locator('button[aria-label="Start timer"]')).toBeVisible();
    // Start and immediately stop
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await page.keyboard.press('Space');
    await page.keyboard.press('Escape');

    // 5. Back to Dashboard
    await expect(page).not.toHaveURL(/\/focus/);

    assertNoConsoleErrors(page);
  });
});

test.describe('User Journey: Project Management', () => {
  test('create tasks, organize, and review in PM dashboard', async ({ page }) => {
    setupConsoleMonitor(page);

    // Create several tasks
    await navigateTo(page, '/tasks');
    await createTask(page, 'PM Task Alpha');
    await createTask(page, 'PM Task Beta');
    await createTask(page, 'PM Task Gamma');

    // Switch to Timeline view
    await page.getByRole('tab', { name: 'Timeline' }).click();
    await expect(page.getByRole('tab', { name: 'Timeline' })).toHaveAttribute('aria-selected', 'true');

    // Check PM Dashboard
    await page.goto('/pm');
    await expect(page).toHaveURL(/\/pm/);

    // Should show task stats
    const statsText = page.getByText(/Total|Completed|In Progress|Overdue/i).first();
    await expect(statsText).toBeVisible();

    assertNoConsoleErrors(page);
  });
});

test.describe('User Journey: Notes & Knowledge Management', () => {
  test('create notes, use formatting, navigate graph', async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/notes');

    // Create a note with formatting
    const createButton = page.getByRole('button', { name: /new.*note|create.*note|\+ Note|\+/i }).first();
    await createButton.click();
    const editor = page.locator('[contenteditable="true"]').first();
    await expect(editor).toBeVisible();
    await editor.click();

    // Type with bold
    await page.keyboard.type('Meeting Notes: ');
    await page.keyboard.press('Control+b');
    await page.keyboard.type('Important');
    await page.keyboard.press('Control+b');
    await page.keyboard.type(' points discussed');
    await page.waitForTimeout(500);

    // Verify bold text rendered
    await expect(editor.locator('strong, b')).toContainText('Important');

    // Switch to Daily Notes tab
    await page.getByRole('tab', { name: 'Daily Notes' }).click();
    await expect(page.getByRole('tab', { name: 'Daily Notes' })).toHaveAttribute('aria-selected', 'true');

    // Switch to Graph tab
    await page.getByRole('tab', { name: 'Graph' }).click();
    await expect(page.getByRole('tab', { name: 'Graph' })).toHaveAttribute('aria-selected', 'true');

    assertNoConsoleErrors(page);
  });
});

test.describe('User Journey: Search & Navigation', () => {
  test('use command palette to navigate and execute commands', async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/');

    // Open Synapse
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Synapse search' });
    await expect(dialog).toBeVisible();

    // Search for a page
    const input = page.getByRole('combobox');
    await input.fill('Tasks');

    // Should show results
    const results = page.getByRole('option').first();
    await expect(results).toBeVisible();

    // Navigate to Tasks via result
    await results.click();
    await expect(page).toHaveURL(/\/tasks/);

    // Open Synapse again for a command
    await page.keyboard.press('Control+k');
    await expect(dialog).toBeVisible();

    // Use command mode
    await input.fill('>Toggle');
    const toggleCmd = page.getByRole('option', { name: /Toggle.*Mode/i }).first();
    if (await toggleCmd.isVisible({ timeout: 2000 }).catch(() => false)) {
      const themeBefore = await page.evaluate(() =>
        document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      );
      await toggleCmd.click();
      const themeAfter = await page.evaluate(() =>
        document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      );
      expect(themeAfter).not.toBe(themeBefore);
    }

    assertNoConsoleErrors(page);
  });
});

test.describe('User Journey: Content Creation', () => {
  test('create document, spreadsheet, and presentation', async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/create');

    // Create a document
    await page.getByRole('button', { name: /Document/i }).first().click();
    await page.waitForTimeout(500);

    // Go back to create page
    const backBtn = page.locator('button[aria-label="Back to create"]');
    if (await backBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await backBtn.click();
      await page.waitForTimeout(300);
    } else {
      await page.goto('/create');
    }

    // Create a spreadsheet
    await page.getByRole('button', { name: /Spreadsheet/i }).first().click();
    await page.waitForTimeout(500);

    // Go back
    if (await backBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await backBtn.click();
    } else {
      await page.goto('/create');
    }

    // Create a presentation
    await page.getByRole('button', { name: /Presentation/i }).first().click();
    await page.waitForTimeout(500);

    assertNoConsoleErrors(page);
  });

  test('switch between Diagrams and Forms tabs', async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/create');

    // Switch to Diagrams
    await page.getByRole('tab', { name: 'Diagrams' }).click();
    await expect(page.getByRole('tab', { name: 'Diagrams' })).toHaveAttribute('aria-selected', 'true');

    // Switch to Forms
    await page.getByRole('tab', { name: 'Forms' }).click();
    await expect(page.getByRole('tab', { name: 'Forms' })).toHaveAttribute('aria-selected', 'true');

    // Back to Create
    await page.getByRole('tab', { name: 'Create' }).click();
    await expect(page.getByRole('tab', { name: 'Create' })).toHaveAttribute('aria-selected', 'true');

    assertNoConsoleErrors(page);
  });
});

test.describe('User Journey: Settings Configuration', () => {
  test('navigate all settings tabs and verify content loads', async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/settings');

    const tabs = [
      { name: 'General', url: /\/settings/ },
      { name: 'Projects', url: /tab=projects/ },
      { name: 'Time Tracking', url: /tab=time/ },
      { name: 'Tasks', url: /tab=tasks/ },
      { name: 'Notes & Calendar', url: /tab=notes/ },
      { name: 'Backup & Data', url: /tab=backup/ },
      { name: 'AI Terminal', url: /tab=ai/ },
      { name: 'Advanced', url: /tab=advanced/ },
    ];

    for (const tab of tabs) {
      await page.getByRole('button', { name: tab.name }).click();
      await expect(page).toHaveURL(tab.url);
      await page.waitForTimeout(200);
    }

    assertNoConsoleErrors(page);
  });
});

test.describe('User Journey: Full App Navigation', () => {
  test('visits every page without console errors', async ({ page }) => {
    setupConsoleMonitor(page);

    const pages = [
      '/',
      '/today',
      '/tasks',
      '/tasks?tab=timeline',
      '/tasks?tab=habits',
      '/tasks?tab=resources',
      '/notes',
      '/notes?tab=daily',
      '/notes?tab=graph',
      '/schedule',
      '/schedule?tab=timer',
      '/schedule?tab=pomodoro',
      '/create',
      '/create?tab=diagrams',
      '/create?tab=forms',
      '/links',
      '/pm',
      '/settings',
      '/settings?tab=projects',
      '/settings?tab=time',
      '/settings?tab=tasks',
      '/settings?tab=notes',
      '/settings?tab=backup',
      '/settings?tab=ai',
      '/settings?tab=advanced',
      '/focus',
    ];

    for (const path of pages) {
      await navigateTo(page, path);
      // Verify page loaded without crash — title should still be NeumanOS
      if (path !== '/focus') {
        // Focus is full-screen overlay, may not show title
        await expect(page).toHaveTitle(/NeumanOS/i);
      }
    }

    // Check for console errors accumulated across all pages
    assertNoConsoleErrors(page);
  });
});
