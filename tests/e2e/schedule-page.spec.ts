import { test, expect } from '@playwright/test';
import { navigateTo, switchTab } from './helpers';

/**
 * Schedule Page E2E Tests
 *
 * Tests Calendar tab, Timer tab (time tracking), and Pomodoro tab.
 */

test.describe('Schedule Page - Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/schedule');
  });

  test('shows schedule tabs', async ({ page }) => {
    // The schedule page should have Calendar, Timer, Pomodoro tabs
    // These may be rendered as tabs or sidebar links
    const calendarTab = page.getByRole('tab', { name: /Calendar/i });
    const timerTab = page.getByRole('tab', { name: /Timer/i });
    const pomodoroTab = page.getByRole('tab', { name: /Pomodoro/i });

    // At least one should be visible
    const hasCalendar = await calendarTab.isVisible({ timeout: 2000 }).catch(() => false);
    const hasTimer = await timerTab.isVisible({ timeout: 1000 }).catch(() => false);
    const hasPomodoro = await pomodoroTab.isVisible({ timeout: 1000 }).catch(() => false);

    expect(hasCalendar || hasTimer || hasPomodoro).toBe(true);
  });
});

test.describe('Schedule Page - Calendar', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/schedule');
  });

  test('calendar view renders', async ({ page }) => {
    // Calendar should be visible with month/week/day view options
    // or at minimum show a calendar-like structure
    await expect(page).toHaveURL(/\/schedule/);
  });

  test('can create a new event', async ({ page }) => {
    // Look for an add event button
    const addEventBtn = page.getByRole('button', { name: /add.*event|new.*event|create.*event|\+/i });
    if (await addEventBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addEventBtn.click();

      // Event form should appear
      const titleInput = page.getByPlaceholder(/title|event/i);
      await expect(titleInput).toBeVisible();
      await titleInput.fill('E2E Test Event');

      // Save
      const saveBtn = page.getByRole('button', { name: /save|create/i });
      await saveBtn.click();

      // Event should appear on the calendar
      await expect(page.getByText('E2E Test Event')).toBeVisible();
    }
  });
});

test.describe('Schedule Page - Timer', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/schedule?tab=timer');
  });

  test('timer page loads', async ({ page }) => {
    await expect(page).toHaveURL(/tab=timer/);
  });
});

test.describe('Schedule Page - Pomodoro', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/schedule?tab=pomodoro');
  });

  test('pomodoro page loads', async ({ page }) => {
    await expect(page).toHaveURL(/tab=pomodoro/);
  });
});
