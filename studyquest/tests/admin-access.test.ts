import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  accessCookie,
  adminOnly,
  issueAccess,
  validAccess,
  ownerEmail,
  isOwnerIdentity,
} from '../lib/server/admin-access';
import { proxy } from '../proxy';
beforeEach(() => {
  vi.stubEnv('PLATFORM_MAINTENANCE', 'true');
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
it('enforces maintenance for APIs, original assets and optimized images when enabled', async () => {
  const state = await proxy(new NextRequest('https://example.test/api/platform'));
  expect(await state.json()).toMatchObject({ adminOnly: true, lessons: [] });
  for (const path of [
    '/api/platform?view=roster',
    '/api/material?id=x',
    '/legacy/mavzu-1.html',
    '/crm/CRM-taqdimot.pdf',
    '/crm/1.webp',
    '/%6cegacy/rt-engine.js',
    '/_next/image?url=%2Flegacy%2Flogo_tersu.png&w=640&q=75',
  ])
    expect((await proxy(new NextRequest('https://example.test' + path))).status).toBe(403);
});
it('allows signed owner access and the administrator sign-in endpoint during maintenance', async () => {
  const cookie = accessCookie + '=' + issueAccess('owner-uid');
  expect(
    (
      await proxy(
        new NextRequest('https://example.test/legacy/mavzu-1.html', { headers: { cookie } }),
      )
    ).headers.get('x-middleware-next'),
  ).toBe('1');
  expect(
    (await proxy(new NextRequest('https://example.test/api/admin-access'))).headers.get(
      'x-middleware-next',
    ),
  ).toBe('1');
});
it('reopens by default and ignores the previous temporary closure flag', async () => {
  vi.stubEnv('PLATFORM_MAINTENANCE', 'false');
  vi.stubEnv('PLATFORM_ADMIN_ONLY', 'true');
  expect(adminOnly()).toBe(false);
  expect(
    (await proxy(new NextRequest('https://example.test/legacy/mavzu-1.html'))).headers.get(
      'x-middleware-next',
    ),
  ).toBe('1');
});
it('accepts only a verified owner email and signs its UID independently of the allowlist', () => {
  expect(isOwnerIdentity({ uid: 'new-owner', email: ownerEmail, email_verified: true })).toBe(true);
  expect(isOwnerIdentity({ uid: 'other', email: ownerEmail, email_verified: false })).toBe(false);
  expect(
    isOwnerIdentity({ uid: 'other', email: 'attacker@example.test', email_verified: true }),
  ).toBe(false);
  expect(validAccess(issueAccess('new-owner', Date.now(), ownerEmail))).toBe(true);
});
