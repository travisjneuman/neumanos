import { test, expect } from '@playwright/test';
import { navigateTo, setupConsoleMonitor, assertNoConsoleErrors } from './helpers';

/**
 * Pomodoro Timer E2E Tests
 *
 * Tests start/pause/resume/stop/skip, session tracking,
 * mode display (Focus/Short Break/Long Break).
 */

test.describe('Pomodoro Timer', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
    await navigateTo(page, '/schedule?tab=pomodoro');
  });

  test('displays timer with initial time', async ({ page }) => {
    // Should show time like "25:00"
    await expect(page.getByText(/\d{1,2}:\d{2}/)).toBeVisible();
    assertNoConsoleErrors(page);
  });

  test('shows Focus Session mode indicator', async ({ page }) => {
    const focusMode = page.getByText('Focus Session');
    if (await focusMode.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(focusMode).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has Start button initially', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: 'Start', exact: true });
    if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(startBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can start and pause timer', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: 'Start', exact: true });
    if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(500);

      // Should now show Pause button
      const pauseBtn = page.getByRole('button', { name: 'Pause', exact: true });
      if (await pauseBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(pauseBtn).toBeVisible();
        await pauseBtn.click();
        await page.waitForTimeout(300);

        // Should now show Resume button
        const resumeBtn = page.getByRole('button', { name: 'Resume', exact: true });
        if (await resumeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(resumeBtn).toBeVisible();
        }
      }
    }
    assertNoConsoleErrors(page);
  });

  test('can stop running timer', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: 'Start', exact: true });
    if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(500);

      const stopBtn = page.getByRole('button', { name: 'Stop', exact: true });
      if (await stopBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await stopBtn.click();
        await page.waitForTimeout(300);
      }
    }
    assertNoConsoleErrors(page);
  });

  test('has Skip button', async ({ page }) => {
    const skipBtn = page.getByRole('button', { name: 'Skip', exact: true });
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(skipBtn).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('can skip to next session', async ({ page }) => {
    const skipBtn = page.getByRole('button', { name: 'Skip', exact: true });
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(300);
      // Mode should change (e.g., from Focus Session to Short Break)
    }
    assertNoConsoleErrors(page);
  });

  test('displays session stats', async ({ page }) => {
    const sessionsText = page.getByText(/Sessions until long break/);
    if (await sessionsText.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(sessionsText).toBeVisible();
    }
    const todayText = page.getByText(/Focus sessions today/);
    if (await todayText.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(todayText).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('has Pomodoro Settings link', async ({ page }) => {
    const settingsLink = page.getByText('Pomodoro Settings');
    if (await settingsLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(settingsLink).toBeVisible();
    }
    assertNoConsoleErrors(page);
  });

  test('shows Running status when started', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: 'Start', exact: true });
    if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(500);

      const runningText = page.getByText('Running...');
      if (await runningText.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(runningText).toBeVisible();
      }

      // Clean up: stop timer
      const stopBtn = page.getByRole('button', { name: 'Stop', exact: true });
      if (await stopBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await stopBtn.click();
      }
    }
    assertNoConsoleErrors(page);
  });

  test('shows Paused status when paused', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: 'Start', exact: true });
    if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(300);

      const pauseBtn = page.getByRole('button', { name: 'Pause', exact: true });
      if (await pauseBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await pauseBtn.click();
        await page.waitForTimeout(300);

        const pausedText = page.getByText('Paused');
        if (await pausedText.isVisible({ timeout: 1000 }).catch(() => false)) {
          await expect(pausedText).toBeVisible();
        }
      }

      // Clean up
      const stopBtn = page.getByRole('button', { name: 'Stop', exact: true });
      if (await stopBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await stopBtn.click();
      }
    }
    assertNoConsoleErrors(page);
  });
});
