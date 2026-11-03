import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  clearPolicyCache,
  defaultSitePolicy,
  normalizePolicy,
  sitePolicy,
} from '../lib/server/site-policy';
beforeEach(() => {
  clearPolicyCache();
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('PLATFORM_MAINTENANCE', 'false');
  vi.stubEnv('FIREBASE_DATABASE_URL', '');
  vi.stubEnv('FIREBASE_PROJECT_ID', '');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  clearPolicyCache();
});
it('defaults to open access and ignores the retired closure flag and malformed policy values', async () => {
  vi.stubEnv('PLATFORM_ADMIN_ONLY', 'true');
  expect(await sitePolicy()).toEqual(defaultSitePolicy);
  expect(
    normalizePolicy({ maintenance: 'true', publicLeaderboard: false, secret: 'omit' }),
  ).toEqual({ ...defaultSitePolicy, publicLeaderboard: false });
});
it('loads only public policy metadata, caches it, and retains a known closure on connection failure', async () => {
  vi.stubEnv('FIREBASE_DATABASE_URL', 'https://database.example.test/');
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(
        JSON.stringify({ maintenance: true, publicLeaderboard: false, allowInitialCode: false }),
      ),
    );
  vi.stubGlobal('fetch', fetch);
  const policy = await sitePolicy();
  expect(policy).toEqual({ maintenance: true, publicLeaderboard: false, allowInitialCode: false });
  expect(fetch.mock.calls[0][0]).toBe('https://database.example.test/meta/platformPolicy.json');
  expect(await sitePolicy()).toEqual(policy);
  expect(fetch).toHaveBeenCalledTimes(1);
  const now = Date.now();
  vi.spyOn(Date, 'now').mockReturnValue(now + 6000);
  fetch.mockRejectedValue(new Error('offline'));
  expect(await sitePolicy()).toEqual(policy);
  vi.restoreAllMocks();
});
it('the emergency environment closure overrides runtime settings without an external read', async () => {
  vi.stubEnv('PLATFORM_MAINTENANCE', 'true');
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  expect((await sitePolicy()).maintenance).toBe(true);
  expect(fetch).not.toHaveBeenCalled();
});
