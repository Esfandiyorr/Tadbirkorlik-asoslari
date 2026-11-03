import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { accessCookie, adminOnly, issueAccess, validAccess } from '../lib/server/admin-access';
import { proxy } from '../proxy';
beforeEach(() => {
  vi.stubEnv('PLATFORM_ADMIN_ONLY', 'true');
  vi.stubEnv('STUDYQUEST_ADMIN_UIDS', 'owner-uid');
  vi.stubEnv('PLATFORM_ACCESS_SECRET', 'isolated-test-only-secret');
});
afterEach(() => vi.unstubAllEnvs());
it('denies forged, expired and removed-owner sessions', () => {
  const now = 1000000,
    value = issueAccess('owner-uid', now);
  expect(validAccess(value, now + 1)).toBe(true);
  expect(validAccess(value + '0', now)).toBe(false);
  expect(validAccess(value, now + 901000)).toBe(false);
  expect(validAccess('owner-uid')).toBe(false);
  vi.stubEnv('STUDYQUEST_ADMIN_UIDS', 'different-owner');
  expect(validAccess(value, now)).toBe(false);
  expect(() => issueAccess('owner-uid', now)).toThrow();
});
it('shows a data-free maintenance state and blocks API, original assets and image optimization', async () => {
  const state = proxy(new NextRequest('https://example.test/api/platform'));
  expect(await state.json()).toMatchObject({ adminOnly: true, lessons: [], courses: [] });
  expect(state.headers.get('cache-control')).toContain('no-store');
  for (const path of [
    '/api/platform?view=roster',
    '/api/platform?view=legacyLesson&lesson=m1',
    '/api/upload',
    '/api/material?id=private',
    '/api/auth/demo',
    '/legacy/mavzu-1.html',
    '/%6cegacy/rt-engine.js',
    '/_next/image?url=%2Flegacy%2Flogo_tersu.png&w=640&q=75',
  ])
    expect(proxy(new NextRequest('https://example.test' + path)).status, path).toBe(403);
  expect(
    proxy(new NextRequest('https://example.test/api/platform', { method: 'POST' })).status,
  ).toBe(403);
});
it('allows only signed owner sessions through the gate without replacing API authorization', () => {
  const cookie = accessCookie + '=' + issueAccess('owner-uid');
  expect(
    proxy(
      new NextRequest('https://example.test/legacy/mavzu-1.html', { headers: { cookie } }),
    ).headers.get('x-middleware-next'),
  ).toBe('1');
  expect(
    proxy(new NextRequest('https://example.test/api/admin-access')).headers.get(
      'x-middleware-next',
    ),
  ).toBe('1');
});
it('is closed by default in production even when a demo flag is set, and can be explicitly reopened', () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('PLATFORM_ADMIN_ONLY', '');
  vi.stubEnv('STUDYQUEST_DEMO', 'true');
  expect(adminOnly()).toBe(true);
  vi.stubEnv('PLATFORM_ADMIN_ONLY', 'false');
  expect(adminOnly()).toBe(false);
});
