import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.js',

  timeout: 30_000,

  retries: process.env.CI ? 1 : 0,

  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/report', open: 'never' }],
  ],

  use: {
    baseURL: 'http://localhost:5173',

    viewport: { width: 390, height: 844 },

    screenshot: 'only-on-failure',
    trace:      'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],

  webServer: {
    command:             'vite --port 5173',
    url:                 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});