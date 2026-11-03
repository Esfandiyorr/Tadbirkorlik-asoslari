import { it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { demoUsers } from '../lib/seed';
import { ApiError } from '../lib/server/auth';
const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  actor: vi.fn(),
  access: vi.fn(),
  original: vi.fn(),
  reset: vi.fn(),
}));
vi.mock('../lib/server/repository', () => ({
  configured: () => true,
  demo: () => false,
  repository: async () => ({ list: mocks.list }),
  legacyDb: () => ({
    ref: (path: string) => ({ get: async () => ({ val: () => mocks.original(path) }) }),
  }),
  authAdmin: vi.fn(),
}));
vi.mock('../lib/server/auth', async (original) => ({
  ...(await original<typeof import('../lib/server/auth')>()),
  actor: mocks.actor,
}));
vi.mock('../lib/server/student-password', () => ({ resetStudentPassword: mocks.reset }));
vi.mock('../lib/server/legacy-access', () => ({ legacyAccess: mocks.access }));
import { GET, POST } from '../app/api/platform/route';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.list.mockRejectedValue({ code: 8 });
  mocks.actor.mockImplementation(async (_req, readOnly) => {
    if (!readOnly) throw { code: 8 };
    return { ...demoUsers[0], academicPoints: 375.5 };
  });
  mocks.access.mockResolvedValue(undefined);
  mocks.original.mockReturnValue({
    name: 'Ali',
    surname: 'Valiyev',
    status: 'ok',
    total: 375.5,
    pk: 'PRIVATE',
    topics: { m1: { p: 75, b: 4, s: 12, t: 3000, q: 8 } },
  });
});

it('serves a safe public catalog when Firestore refuses reads', async () => {
  const response = await GET(new NextRequest('https://example.test/api/platform'));
  const data = await response.json();
  expect(response.status).toBe(200);
  expect(data.limited).toBe(true);
  expect(data.lessons).toHaveLength(15);
  expect(data.user).toBeUndefined();
  expect(data.quizzes).toEqual([]);
});

it('uses separately verified read-only identity without pretending XP was restored', async () => {
  const response = await GET(
    new NextRequest('https://example.test/api/platform', {
      headers: { authorization: 'Bearer valid' },
    }),
  );
  const data = await response.json();
  expect(data.user.academicPoints).toBe(375.5);
  expect(data.user.xp).toBeUndefined();
  expect(mocks.actor).toHaveBeenLastCalledWith(expect.anything(), true);
});

it('does not let quota recovery bypass failed identity verification', async () => {
  mocks.actor.mockRejectedValue(new ApiError(401, 'Invalid session'));
  const response = await GET(
    new NextRequest('https://example.test/api/platform', {
      headers: { authorization: 'Bearer forged' },
    }),
  );
  expect(response.status).toBe(401);
});

it('does not fabricate or expose private rankings when privacy data is unavailable', async () => {
  const response = await GET(
    new NextRequest('https://example.test/api/platform?view=academic', {
      headers: { authorization: 'Bearer valid' },
    }),
  );
  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({ code: 'QUOTA_EXCEEDED' });
});

it('retains original lesson access checks in limited mode', async () => {
  const req = () =>
    new NextRequest('https://example.test/api/platform?view=legacyLesson&lesson=m7', {
      headers: { authorization: 'Bearer valid' },
    });
  expect((await GET(req())).status).toBe(200);
  expect(mocks.list).not.toHaveBeenCalled();
  mocks.access.mockRejectedValue(new ApiError(403, 'Not open for this class'));
  expect((await GET(req())).status).toBe(403);
});

it('returns a retryable quota error instead of reporting a successful XP write', async () => {
  const response = await POST(
    new NextRequest('https://example.test/api/platform', {
      method: 'POST',
      headers: { authorization: 'Bearer valid' },
      body: JSON.stringify({ action: 'slide', input: { lessonId: 'm1', index: 1 } }),
    }),
  );
  expect(response.status).toBe(503);
  expect(response.headers.get('Retry-After')).toBe('60');
});

it('returns original per-topic history even when Firestore profiles cannot load', async () => {
  mocks.actor.mockImplementation(async (_req, readOnly) => {
    if (!readOnly) throw { code: 8 };
    return { ...demoUsers[0], id: 'legacy_alice', academicPoints: 375.5 };
  });
  const response = await GET(
    new NextRequest('https://example.test/api/platform', {
      headers: { authorization: 'Bearer valid' },
    }),
  );
  const data = await response.json();
  expect(data.user.readingHistory.m1).toMatchObject({
    score: 75,
    grade: 4,
    seenSlides: 12,
    status: 'started',
  });
  expect(data.user.academicPoints).toBe(375.5);
  expect(JSON.stringify(data)).not.toContain('PRIVATE');
});

it('does not expose the original roster to a student while quota is exhausted', async () => {
  const response = await GET(
    new NextRequest('https://example.test/api/platform?view=roster', {
      headers: { authorization: 'Bearer valid' },
    }),
  );
  expect(response.status).toBe(403);
  expect(mocks.original).not.toHaveBeenCalled();
});

it('administrator password reset uses read-only identity without touching exhausted Firestore', async () => {
  mocks.actor.mockImplementation(async (_req, readOnly) => {
    if (!readOnly) throw { code: 8 };
    return demoUsers[2];
  });
  mocks.reset.mockResolvedValue({ ok: true, id: 'alice' });
  const response = await POST(
    new NextRequest('https://example.test/api/platform', {
      method: 'POST',
      headers: {
        origin: 'https://example.test',
        authorization: 'Bearer valid',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        action: 'legacyResetPassword',
        input: { id: 'alice', password: 'new-test-password' },
      }),
    }),
  );
  expect(response.status).toBe(200);
  expect(mocks.actor).toHaveBeenCalledExactlyOnceWith(expect.anything(), true);
  expect(mocks.reset).toHaveBeenCalledWith(demoUsers[2], {
    id: 'alice',
    password: 'new-test-password',
  });
  expect(mocks.list).not.toHaveBeenCalled();
});
