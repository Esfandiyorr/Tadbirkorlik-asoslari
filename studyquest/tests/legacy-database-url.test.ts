import { afterEach, expect, it, vi } from 'vitest';
import { legacyDatabaseUrl } from '../lib/server/repository';
import { catalog } from '../lib/seed';
afterEach(() => vi.unstubAllEnvs());
it('uses the known original database only for its matching configured Firebase project', () => {
  vi.stubEnv('FIREBASE_DATABASE_URL', '');
  vi.stubEnv('FIREBASE_PROJECT_ID', catalog.projectId);
  expect(legacyDatabaseUrl()).toBe(catalog.databaseURL);
  vi.stubEnv('FIREBASE_PROJECT_ID', 'different-project');
  expect(legacyDatabaseUrl()).toBeUndefined();
  vi.stubEnv('FIREBASE_DATABASE_URL', 'https://configured.example.test');
  expect(legacyDatabaseUrl()).toBe('https://configured.example.test');
});
