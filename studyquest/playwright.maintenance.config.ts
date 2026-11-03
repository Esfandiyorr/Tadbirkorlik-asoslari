import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser-maintenance',
  timeout: 60000,
  expect: { timeout: 15000 },
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3202',
    launchOptions: process.env.SQ_BROWSER_EXECUTABLE
      ? { executablePath: process.env.SQ_BROWSER_EXECUTABLE }
      : {},
  },
  webServer: {
    command: 'npm run dev -- --port 3202',
    url: 'http://127.0.0.1:3202',
    timeout: 120000,
    env: {
      STUDYQUEST_DEMO: 'false',
      PLATFORM_ADMIN_ONLY: 'true',
      STUDYQUEST_ADMIN_UIDS: 'test-owner',
      PLATFORM_ACCESS_SECRET: 'isolated-browser-test-key',
    },
  },
  outputDir: 'tests/artifacts/maintenance',
});
