import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for NeumanOS
 *
 * Set TEST_BASE_URL to run tests against a remote deployment:
 *   TEST_BASE_URL=https://migrate-tailwind4-eslint10.neumanos.pages.dev npx playwright test
 *
 * @see https://playwright.dev/docs/test-configuration
 */

const remoteBaseURL = process.env.TEST_BASE_URL;

export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Test file pattern
  testMatch: '**/*.spec.ts',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Limit parallel workers on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [
    ['html', { outputFolder: 'tests/reports' }],
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Use remote URL if provided, otherwise local dev server
    baseURL: remoteBaseURL || 'http://localhost:5173',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'on-first-retry',
  },

  // Configure projects for major browsers + mobile
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Only start local dev server when not testing against a remote URL
  ...(!remoteBaseURL && {
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  }),

  // Output directory for test artifacts
  outputDir: 'tests/results',

  // Global timeout for each test (longer for remote targets)
  timeout: remoteBaseURL ? 60 * 1000 : 30 * 1000,

  // Expect timeout
  expect: {
    timeout: remoteBaseURL ? 10 * 1000 : 5 * 1000,
  },
});
