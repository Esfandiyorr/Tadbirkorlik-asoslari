import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ verify: vi.fn(), write: vi.fn(), read: vi.fn() }));
vi.mock('../lib/server/repository', () => ({
  configured: () => true,
  authAdmin: () => ({ verifyIdToken: mocks.verify }),
  legacyDb: () => ({
    ref: (path: string) => ({
      get: async () => ({ val: () => mocks.read(path) }),
      set: async (value: unknown) => mocks.write(path, value),
    }),
  }),
}));
import { POST } from '../app/api/student-login/route';
beforeEach(() => {
  vi.stubEnv('STUDYQUEST_ADMIN_UIDS', '');
  mocks.verify.mockResolvedValue({ uid: 'anon', firebase: { sign_in_provider: 'anonymous' } });
  mocks.read.mockReturnValue({ name: 'Ali', surname: 'Valiyev', status: 'ok', pwSalt: 'PRIVATE' });
  mocks.write.mockReset();
});
afterEach(() => vi.unstubAllEnvs());
const req = (body: any, origin = 'https://example.test') =>
  new NextRequest('https://example.test/api/student-login', {
    method: 'POST',
    headers: { origin, authorization: 'Bearer token' },
    body: JSON.stringify(body),
  });
it('verifies anonymous identity and creates only a scoped owner grant', async () => {
  const response = await POST(
    req({ id: 'alice', name: 'Ali', surname: 'Valiyev', password: '1111' }),
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
  expect(mocks.verify).toHaveBeenCalledWith('token', true);
  expect(mocks.write).toHaveBeenCalledWith(
    'owners/alice/anon',
    expect.stringMatching(/^shared1111:/),
  );
});
it('rejects cross-origin requests and Google-account impersonation without writes', async () => {
  expect((await POST(req({ id: 'alice' }, 'https://attacker.test'))).status).toBe(403);
  mocks.verify.mockResolvedValue({ uid: 'google', firebase: { sign_in_provider: 'google.com' } });
  expect(
    (await POST(req({ id: 'alice', name: 'Ali', surname: 'Valiyev', password: '1111' }))).status,
  ).toBe(403);
  expect(mocks.write).not.toHaveBeenCalled();
});
