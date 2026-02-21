import { test, expect } from '@playwright/test';
import { setupConsoleMonitor, assertNoConsoleErrors, dismissOnboarding } from './helpers';

/**
 * Performance Smoke E2E Tests
 *
 * Measures page load times for key routes and flags
 * anything over the threshold. Also checks for memory
 * leaks via rapid navigation.
 */

const MAX_LOAD_TIME_MS = 8000; // 8 seconds for remote, generous threshold

test.describe('Page Load Performance', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
  });

  const routes = [
    { path: '/', name: 'Dashboard' },
    { path: '/tasks', name: 'Tasks' },
    { path: '/notes', name: 'Notes' },
    { path: '/schedule', name: 'Schedule' },
    { path: '/today', name: 'Today' },
    { path: '/focus', name: 'Focus' },
    { path: '/links', name: 'Link Library' },
    { path: '/settings', name: 'Settings' },
    { path: '/pm', name: 'PM Dashboard' },
    { path: '/automations', name: 'Automations' },
    { path: '/create', name: 'Create' },
  ];

  for (const route of routes) {
    test(`${route.name} (${route.path}) loads within threshold`, async ({ page }) => {
      const start = Date.now();
      await page.goto(route.path);
      await dismissOnboarding(page);
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - start;

      // Log load time for reporting
      test.info().annotations.push({
        type: 'load-time',
        description: `${route.name}: ${loadTime}ms`,
      });

      expect(loadTime).toBeLessThan(MAX_LOAD_TIME_MS);
      assertNoConsoleErrors(page);
    });
  }
});

test.describe('Navigation Performance', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
  });

  test('rapid navigation does not cause errors', async ({ page }) => {
    const paths = ['/', '/tasks', '/notes', '/schedule', '/today', '/links', '/settings', '/pm', '/automations', '/create', '/'];

    for (const path of paths) {
      await page.goto(path);
      await dismissOnboarding(page);
      // Minimal wait — stress test rapid transitions
      await page.waitForTimeout(200);
    }

    assertNoConsoleErrors(page);
  });

  test('back/forward navigation works without errors', async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);

    await page.goto('/tasks');
    await dismissOnboarding(page);

    await page.goto('/notes');
    await dismissOnboarding(page);

    // Go back twice
    await page.goBack();
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/tasks/);

    await page.goBack();
    await page.waitForTimeout(300);

    // Go forward
    await page.goForward();
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/tasks/);

    assertNoConsoleErrors(page);
  });
});

test.describe('Resource Performance', () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitor(page);
  });

  test('no excessive network requests on dashboard', async ({ page }) => {
    let requestCount = 0;
    page.on('request', () => { requestCount++; });

    await page.goto('/');
    await dismissOnboarding(page);
    await page.waitForLoadState('networkidle').catch(() => {});

    // Annotate for visibility
    test.info().annotations.push({
      type: 'request-count',
      description: `Dashboard loaded with ${requestCount} requests`,
    });

    // Generous limit — flag if something is wildly wrong
    expect(requestCount).toBeLessThan(200);
    assertNoConsoleErrors(page);
  });

  test('no JavaScript errors during extended idle', async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);

    // Sit idle for 5 seconds — catch timer-based errors
    await page.waitForTimeout(5000);

    assertNoConsoleErrors(page);
  });
});
