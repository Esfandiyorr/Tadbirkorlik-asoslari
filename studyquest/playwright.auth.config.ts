import { defineConfig } from '@playwright/test';
import config from '../_reyting-manba/config.json';

// Real provider and legacy login code, with all remote services mocked by the tests.
export default defineConfig({
  testDir: './tests/browser-auth',
  timeout: 60000,
  expect: { timeout: 15000 },
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3201',
    launchOptions: process.env.SQ_BROWSER_EXECUTABLE
      ? { executablePath: process.env.SQ_BROWSER_EXECUTABLE }
      : {},
  },
  webServer: {
    command: 'npm run dev -- --port 3201',
    url: 'http://127.0.0.1:3201',
    timeout: 120000,
    env: {
      STUDYQUEST_DEMO: 'false',
      PLATFORM_MAINTENANCE: 'false',
      NEXT_PUBLIC_FIREBASE_API_KEY: config.fbWeb.apiKey,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: config.fbWeb.projectId,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: config.fbWeb.authDomain,
    },
  },
  outputDir: 'tests/artifacts/auth',
});
