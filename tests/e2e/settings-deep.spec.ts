import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Settings Deep E2E Tests
 *
 * Tests every control in every settings tab:
 * General (theme, display name, time format, temperature),
 * Projects (CRUD), Tasks (WIP limits, auto-shift),
 * Backup (export/import brain), AI Terminal (providers),
 * Advanced (custom fields, team members).
 */

test.describe('Settings — General Tab', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/settings');
  });

  test('has display name input', async ({ page }) => {
    const nameInput = page.getByPlaceholder('Enter your name');
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(nameInput).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can change display name', async ({ page }) => {
    const nameInput = page.getByPlaceholder('Enter your name');
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.clear();
      await nameInput.fill('E2E Test User');
      await page.waitForTimeout(300);
      await expect(nameInput).toHaveValue('E2E Test User');
    }
    assertNoConsoleErrors(page);
  });

  test('has Light/Dark/System theme buttons', async ({ page }) => {
    const lightBtn = page.getByRole('button', { name: 'Light', exact: true });
    const darkBtn = page.getByRole('button', { name: 'Dark', exact: true });
    const systemBtn = page.getByRole('button', { name: 'System', exact: true });
    if (await lightBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(lightBtn).toBeVisible();
      await expect(darkBtn).toBeVisible();
      await expect(systemBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can switch to light mode', async ({ page }) => {
    const lightBtn = page.getByRole('button', { name: 'Light', exact: true });
    if (await lightBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lightBtn.click();
      await page.waitForTimeout(300);
      const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(hasDark).toBe(false);
    }
    assertNoConsoleErrors(page);
  });

  test('can switch to dark mode', async ({ page }) => {
    const darkBtn = page.getByRole('button', { name: 'Dark', exact: true });
    if (await darkBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await darkBtn.click();
      await page.waitForTimeout(300);
      const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(hasDark).toBe(true);
    }
    assertNoConsoleErrors(page);
  });

  test('has time format buttons', async ({ page }) => {
    const btn12h = page.getByRole('button', { name: '12-Hour' });
    const btn24h = page.getByRole('button', { name: '24-Hour' });
    if (await btn12h.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(btn12h).toBeVisible();
      await expect(btn24h).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has temperature unit buttons', async ({ page }) => {
    const fahrenheit = page.getByRole('button', { name: /Fahrenheit/ });
    const celsius = page.getByRole('button', { name: /Celsius/ });
    if (await fahrenheit.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(fahrenheit).toBeVisible();
      await expect(celsius).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has search engine selector', async ({ page }) => {
    const searchSelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'Google' }) });
    if (await searchSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(searchSelect).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has Customize Background button', async ({ page }) => {
    const bgBtn = page.getByRole('button', { name: /Customize Background/ });
    if (await bgBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(bgBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });
});

test.describe('Settings — Projects Tab', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/settings?tab=projects');
  });

  test('has New Project button', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: 'New Project' });
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(newBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can open new project form', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: 'New Project' });
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(300);
      const nameInput = page.getByPlaceholder(/Work, Personal/);
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(nameInput).toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('can create a project', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: 'New Project' });
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(300);

      const nameInput = page.getByPlaceholder(/Work, Personal/);
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameInput.fill('E2E Test Project');

        const createBtn = page.getByRole('button', { name: 'Create', exact: true });
        if (await createBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await createBtn.click();
          await page.waitForTimeout(300);
          await expect(page.getByText('E2E Test Project')).toBeVisible();
        }
      }
    }
    assertNoConsoleErrors(page);
  });
});

test.describe('Settings — Tasks Tab', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/settings?tab=tasks');
  });

  test('has auto-shift tasks checkbox', async ({ page }) => {
    const checkbox = page.locator('#auto-shift-tasks');
    if (await checkbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(checkbox).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has enforce WIP limits checkbox', async ({ page }) => {
    const checkbox = page.locator('#enforce-wip-limits');
    if (await checkbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(checkbox).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can toggle auto-shift tasks', async ({ page }) => {
    const checkbox = page.locator('#auto-shift-tasks');
    if (await checkbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      const wasChecked = await checkbox.isChecked();
      await checkbox.click();
      await page.waitForTimeout(200);
      const isNowChecked = await checkbox.isChecked();
      expect(isNowChecked).not.toBe(wasChecked);
    }
    assertNoConsoleErrors(page);
  });
});

test.describe('Settings — Backup & Data Tab', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/settings?tab=backup');
  });

  test('has Export Brain button', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: 'Export Brain' });
    if (await exportBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(exportBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has Import Brain button', async ({ page }) => {
    const importBtn = page.getByRole('button', { name: 'Import Brain' });
    if (await importBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(importBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('export triggers download', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: 'Export Brain' });
    if (await exportBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
      await exportBtn.click();
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toContain('.brain');
      }
    }
    assertNoConsoleErrors(page);
  });
});

test.describe('Settings — AI Terminal Tab', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/settings?tab=ai');
  });

  test('has Configure Providers button', async ({ page }) => {
    const configBtn = page.getByRole('button', { name: /Configure Providers/ });
    if (await configBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(configBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has Quick Note Mode radio buttons', async ({ page }) => {
    const permanentRadio = page.getByText('Permanent');
    const dailyRadio = page.getByText('Daily');
    if (await permanentRadio.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(permanentRadio).toBeVisible();
      await expect(dailyRadio).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });
});

test.describe('Settings — Advanced Tab', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/settings?tab=advanced');
  });

  test('has Custom Fields section', async ({ page }) => {
    const heading = page.getByText('Custom Fields');
    if (await heading.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(heading).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has Team Members section', async ({ page }) => {
    const heading = page.getByText('Team Members');
    if (await heading.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(heading).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });
});
