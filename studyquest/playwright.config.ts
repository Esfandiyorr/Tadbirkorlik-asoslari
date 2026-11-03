import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 90000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3200',
    headless: true,
    launchOptions: process.env.SQ_BROWSER_EXECUTABLE
      ? { executablePath: process.env.SQ_BROWSER_EXECUTABLE }
      : {},
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'STUDYQUEST_DEMO=true npm run dev -- --port 3200',
    env: { PLATFORM_ADMIN_ONLY: 'false' },
    url: 'http://127.0.0.1:3200',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  outputDir: 'tests/artifacts/browser',
});
