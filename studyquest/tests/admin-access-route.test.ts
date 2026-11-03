import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ verify: vi.fn() }));
vi.mock('../lib/server/repository', () => ({
  configured: () => true,
  authAdmin: () => ({ verifyIdToken: mocks.verify }),
}));
import { POST, DELETE } from '../app/api/admin-access/route';
const req = (origin = 'https://example.test') =>
  new NextRequest('https://example.test/api/admin-access', {
    method: 'POST',
    headers: { origin, authorization: 'Bearer valid-token' },
  });
beforeEach(() => {
  vi.stubEnv('PLATFORM_ADMIN_ONLY', 'true');
  vi.stubEnv('STUDYQUEST_ADMIN_UIDS', 'owner');
  vi.stubEnv('PLATFORM_ACCESS_SECRET', 'test-only-signing-key');
  mocks.verify.mockResolvedValue({ uid: 'owner' });
});
afterEach(() => vi.unstubAllEnvs());
it('checks token revocation and creates an HTTP-only cookie without Firestore', async () => {
  const response = await POST(req());
  expect(response.status).toBe(200);
  expect(response.headers.get('set-cookie')).toContain('HttpOnly');
  expect(mocks.verify).toHaveBeenCalledWith('valid-token', true);
  expect((await DELETE(req())).headers.get('set-cookie')).toContain('Max-Age=0');
});
it('rejects non-owner role claims, invalid sessions and cross-origin requests', async () => {
  mocks.verify.mockResolvedValue({ uid: 'other', role: 'admin' });
  expect((await POST(req())).status).toBe(403);
  mocks.verify.mockRejectedValue(new Error('revoked'));
  expect((await POST(req())).status).toBe(401);
  expect((await POST(req('https://attacker.test'))).status).toBe(403);
});
