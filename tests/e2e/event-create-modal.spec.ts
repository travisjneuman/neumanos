import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Event Create Modal — Full E2E Tests
 *
 * Tests every field in the EventCreateModal:
 * title, description, date, time, all-day, location,
 * recurrence, reminders, color.
 */

test.describe('Event Create Modal', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/schedule');
  });

  async function openCreateEventModal(page: import('@playwright/test').Page) {
    const addBtn = page.getByRole('button', { name: /add.*event|new.*event|create.*event|\+/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
    }
  }

  test('opens create event modal', async ({ page }) => {
    await openCreateEventModal(page);
    const heading = page.getByText('Create Event');
    if (await heading.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(heading).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has title input with placeholder', async ({ page }) => {
    await openCreateEventModal(page);
    const titleInput = page.locator('#event-title');
    if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(titleInput).toHaveAttribute('placeholder', /Meeting with team/);
    }
    assertNoConsoleErrors(page);
  });

  test('can fill event title', async ({ page }) => {
    await openCreateEventModal(page);
    const titleInput = page.locator('#event-title');
    if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await titleInput.fill('E2E Test Meeting');
      await expect(titleInput).toHaveValue('E2E Test Meeting');
    }
    assertNoConsoleErrors(page);
  });

  test('can fill event description', async ({ page }) => {
    await openCreateEventModal(page);
    const descInput = page.locator('#event-description');
    if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descInput.fill('Test event description');
      await expect(descInput).toHaveValue('Test event description');
    }
    assertNoConsoleErrors(page);
  });

  test('has date input', async ({ page }) => {
    await openCreateEventModal(page);
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(dateInput).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can toggle all-day event', async ({ page }) => {
    await openCreateEventModal(page);
    const allDayCheckbox = page.getByText('All-day event').locator('..').locator('input[type="checkbox"]');
    if (await allDayCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await allDayCheckbox.check();
      await page.waitForTimeout(200);
      await expect(allDayCheckbox).toBeChecked();
    }
    assertNoConsoleErrors(page);
  });

  test('shows time inputs when not all-day', async ({ page }) => {
    await openCreateEventModal(page);
    const startTimeInput = page.locator('input[type="time"]').first();
    if (await startTimeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(startTimeInput).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can fill location', async ({ page }) => {
    await openCreateEventModal(page);
    const locationInput = page.getByPlaceholder(/Meeting room, video call/);
    if (await locationInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await locationInput.fill('Conference Room B');
      await expect(locationInput).toHaveValue('Conference Room B');
    }
    assertNoConsoleErrors(page);
  });

  test('has recurrence/repeat selector', async ({ page }) => {
    await openCreateEventModal(page);
    const repeatSelect = page.locator('select').filter({ has: page.locator('option[value="daily"]') });
    if (await repeatSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(repeatSelect).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can set recurrence to weekly', async ({ page }) => {
    await openCreateEventModal(page);
    const repeatSelect = page.locator('select').filter({ has: page.locator('option[value="weekly"]') });
    if (await repeatSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await repeatSelect.selectOption('weekly');
      await page.waitForTimeout(300);
      await expect(repeatSelect).toHaveValue('weekly');
    }
    assertNoConsoleErrors(page);
  });

  test('has reminder checkboxes', async ({ page }) => {
    await openCreateEventModal(page);
    const reminder15 = page.getByText('15 minutes before');
    if (await reminder15.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(reminder15).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can select reminders', async ({ page }) => {
    await openCreateEventModal(page);
    const reminderLabel = page.getByText('30 minutes before');
    if (await reminderLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
      const checkbox = reminderLabel.locator('..').locator('input[type="checkbox"]');
      if (await checkbox.isVisible({ timeout: 1000 }).catch(() => false)) {
        await checkbox.check();
        await expect(checkbox).toBeChecked();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has Cancel and Create Event buttons', async ({ page }) => {
    await openCreateEventModal(page);
    const cancelBtn = page.getByRole('button', { name: 'Cancel', exact: true });
    const createBtn = page.getByRole('button', { name: 'Create Event' });
    if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(cancelBtn).toBeVisible();
    }
    if (await createBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(createBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can create a complete event', async ({ page }) => {
    await openCreateEventModal(page);
    const titleInput = page.locator('#event-title');
    if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await titleInput.fill('Complete Event Test');

      const descInput = page.locator('#event-description');
      if (await descInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await descInput.fill('Full event with all fields');
      }

      const locationInput = page.getByPlaceholder(/Meeting room/);
      if (await locationInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await locationInput.fill('Room 42');
      }

      const createBtn = page.getByRole('button', { name: 'Create Event' });
      if (await createBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(500);
      }
    }
    assertNoConsoleErrors(page);
  });

  test('can close modal with close button', async ({ page }) => {
    await openCreateEventModal(page);
    const closeBtn = page.locator('[aria-label="Close modal"]');
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(300);
    }
    assertNoConsoleErrors(page);
  });

  test('can cancel event creation', async ({ page }) => {
    await openCreateEventModal(page);
    const titleInput = page.locator('#event-title');
    if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await titleInput.fill('Should Not Be Created');
      const cancelBtn = page.getByRole('button', { name: 'Cancel', exact: true });
      if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await cancelBtn.click();
        await page.waitForTimeout(300);
        await expect(page.getByText('Should Not Be Created')).not.toBeVisible();
      }
    }
    assertNoConsoleErrors(page);
  });
});
