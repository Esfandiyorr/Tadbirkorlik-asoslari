import { it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  transaction: vi.fn(),
  verify: vi.fn(),
  original: vi.fn(),
}));
vi.mock('../lib/server/repository', () => ({
  configured: () => true,
  demo: () => false,
  repository: async () => ({ get: mocks.get, transaction: mocks.transaction }),
  authAdmin: () => ({ verifyIdToken: mocks.verify }),
  legacyDb: () => ({ ref: (path: string) => ({ get: () => mocks.original(path) }) }),
}));
import { actor } from '../lib/server/auth';
const request = (legacy = false) =>
  new NextRequest('https://example.test/api/platform', {
    headers: {
      authorization: 'Bearer test-token',
      ...(legacy ? { 'x-legacy-student': 'alice' } : {}),
    },
  });
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('STUDYQUEST_ADMIN_UIDS', '');
  mocks.verify.mockResolvedValue({ uid: 'test-uid', name: 'Test Student' });
});
afterEach(() => vi.unstubAllEnvs());

it('does not rewrite an unchanged profile and auth link on every request', async () => {
  mocks.get.mockResolvedValue({
    id: 'test-uid',
    uid: 'test-uid',
    name: 'Test Student',
    role: 'student',
    classId: '',
    learnerType: 'independent',
    authLinkedUid: 'test-uid',
    xp: 500,
  });
  expect(await actor(request())).toMatchObject({ xp: 500, role: 'student' });
  expect(mocks.transaction).not.toHaveBeenCalled();
});

it('limited identity still verifies Firebase revocation and performs no Firestore reads or writes', async () => {
  expect(await actor(request(), true)).toMatchObject({ uid: 'test-uid', role: 'student' });
  expect(mocks.verify).toHaveBeenCalledWith('test-token', true);
  expect(mocks.get).not.toHaveBeenCalled();
  expect(mocks.transaction).not.toHaveBeenCalled();
});

it('limited legacy identity verifies original ownership and preserves the original group and points', async () => {
  mocks.original.mockImplementation(async (path) =>
    path.startsWith('owners/')
      ? { exists: () => true }
      : {
          val: () => ({
            name: 'Ali',
            surname: 'Valiyev',
            group: 'AP-223',
            status: 'ok',
            total: 375.5,
          }),
        },
  );
  expect(await actor(request(true), true)).toMatchObject({
    id: 'legacy_alice',
    classId: 'AP-223',
    academicPoints: 375.5,
  });
  mocks.original.mockImplementation(async (path) =>
    path.startsWith('owners/') ? { exists: () => false } : { val: () => ({ status: 'ok' }) },
  );
  await expect(actor(request(true), true)).rejects.toMatchObject({ status: 403 });
});

it('does not trust a browser-selected role during quota recovery', async () => {
  mocks.get.mockResolvedValue({ role: 'admin' });
  const req = new NextRequest('https://example.test/api/platform', {
    headers: { authorization: 'Bearer test-token', 'X-Role': 'admin' },
  });
  expect((await actor(req, true)).role).toBe('student');
});

it('quota-only legacy administration requires the allowlist or original teacher identity, not a stale custom role', async () => {
  mocks.verify.mockResolvedValue({ uid: 'test-uid', name: 'Former Teacher', role: 'admin' });
  expect((await actor(request(), true)).role).toBe('student');
  vi.stubEnv('STUDYQUEST_ADMIN_UIDS', 'test-uid');
  expect((await actor(request(), true)).role).toBe('admin');
});
