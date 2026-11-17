import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../app/api/live/route';
import {
  accountPlayer,
  guestPlayer,
  guestCookie,
  readLive,
  writeLive,
} from '../lib/server/live-player';
import { demoKahoot } from '../lib/server/live-admin';
import { makeGame, type Game } from '../lib/live-quiz';
import { actor, demoCookie } from '../lib/server/auth';
import { repository, initialState } from '../lib/server/repository';
import { resetSiteMemory } from '../lib/server/site-content';
import type { Actor } from '../lib/types';

const mocks = vi.hoisted(() => ({ records: new Map<string, unknown>(), verify: vi.fn() }));
vi.mock('../lib/server/repository', async (load) => {
  const real = await load<typeof import('../lib/server/repository')>();
  const db = new real.MemoryRepository();
  return {
    ...real,
    repository: async () => db,
    configured: () => true,
    authAdmin: () => ({ verifyIdToken: mocks.verify }),
    legacyDb: () => ({
      ref: (path: string) => ({
        get: async () => ({
          val: () => structuredClone(mocks.records.get(path) || null),
          exists: () => mocks.records.has(path),
        }),
        transaction: async (change: (v: unknown) => unknown) => {
          expect(change(null)).toBeNull(); // initial empty RTDB cache must not reject a real game
          const next = change(structuredClone(mocks.records.get(path) || null));
          if (next) mocks.records.set(path, next);
          return { snapshot: { val: () => next } };
        },
      }),
    }),
  };
});
const day = '2030-01-10';
const player = accountPlayer({
  id: 'legacy_S1',
  name: 'Ali Valiyev',
  role: 'student',
  learnerType: 'independent',
  classId: '',
} as Actor);
let g: Game;
const guestToken = Buffer.alloc(32, 11).toString('base64url');
const req = (path: string, cookie?: string) =>
  new NextRequest(
    'https://unistay.test/api/live?path=' + encodeURIComponent(path),
    cookie ? { headers: { cookie } } : undefined,
  );
function post(body: unknown, cookie?: string, origin = 'https://unistay.test') {
  return new NextRequest('https://unistay.test/api/live', {
    method: 'POST',
    headers: { origin, ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
}
const join = (p = player, n = 'Forged Name') => ({
  path: `games/${day}/p/${p.id}`,
  value: { n, g: 'FORGED', at: 1 },
  start: g.meta.start,
});
const answer = (c = 0, p = player, i = 0) => ({
  path: `games/${day}/a/${i}/${p.id}`,
  value: { c, t: 1 },
  start: g.meta.start,
});
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.stubEnv('STUDYQUEST_DEMO', 'true');
  vi.stubEnv('PLATFORM_MAINTENANCE', 'false');
  resetSiteMemory();
  mocks.records.clear();
  mocks.verify.mockReset();
  const db = await repository();
  (db as unknown as { state: unknown }).state = initialState();
  Object.assign(demoKahoot, { cfg: null, bank: {}, idx: {}, games: {}, res: {} });
  g = makeGame(
    day,
    { time: '20:00', qsec: 15 },
    Array.from({ length: 4 }, (_, i) => ({ t: 'Savol ' + i, o: ['A', 'B', 'C', 'D'], c: 0 })),
    () => 0.5,
  );
  demoKahoot.games[day] = g;
  demoKahoot.idx[day] = { start: g.meta.start, open: g.meta.open, end: g.meta.end, nq: g.meta.nq };
  vi.setSystemTime(g.meta.open + 1000);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('live quiz participation without a group or old student account', () => {
  it('ignores a stale demo cookie when the production service creates a guest session', async () => {
    vi.stubEnv('STUDYQUEST_DEMO', 'false');
    const response = await GET(req('session', 'sq-demo=expired-demo-cookie'));
    expect(response.status).toBe(200);
    expect((await response.json()).player.guest).toBe(true);
    expect(mocks.verify).not.toHaveBeenCalled();
  });
  it('accepts an independent account and derives identity, name and timestamps on the server', async () => {
    const db = await repository(),
      before = await db.list('users');
    const row = await writeLive(player, join());
    expect(row).toEqual({ n: 'Ali Valiyev', g: '', at: Date.now() });
    expect(
      accountPlayer({
        id: 'new-firebase-uid',
        name: 'Yangi',
        role: 'student',
        learnerType: 'independent',
      } as Actor).id,
    ).toMatch(/^usr_/);
    expect(await db.list('users')).toEqual(before);
    await expect(writeLive(player, join({ ...player, id: 'S2' }))).rejects.toMatchObject({
      status: 403,
    });
  });
  it('creates a private guest session, resumes the same player and accepts a name without exposing the bearer cookie', async () => {
    const first = await GET(req('session')),
      body = await first.json();
    const cookie = first.cookies.get(guestCookie)!.value;
    expect(cookie).toHaveLength(43);
    expect(first.headers.get('set-cookie')).toContain('HttpOnly');
    expect(first.headers.get('set-cookie')).toContain('Secure');
    expect(JSON.stringify(body)).not.toContain(cookie);
    expect(body.player).toMatchObject({ guest: true, group: '', academic: false });
    const header = guestCookie + '=' + cookie;
    expect((await (await GET(req('session', header))).json()).player.id).toBe(body.player.id);
    const input = join(body.player, 'Sevinch');
    expect((await POST(post(input))).status).toBe(401);
    const response = await POST(post(input, header));
    expect(response.status).toBe(200);
    expect((await response.json()).value).toMatchObject({ n: 'Sevinch', g: '' });
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect((await POST(post({ ...input, path: `games/${day}/p/S1` }, header))).status).toBe(403);
  });
  it('rejects empty guest names, cross-origin writes and untrusted identities', async () => {
    const p = guestPlayer(guestToken),
      cookie = guestCookie + '=' + guestToken;
    expect((await POST(post(join(p, ' '), cookie))).status).toBe(400);
    expect((await POST(post(join(p, 'Dilnoza'), cookie, 'https://attacker.test'))).status).toBe(
      403,
    );
    const invalid = new NextRequest('https://unistay.test/api/live?path=session', {
      headers: { authorization: 'Bearer invalid' },
    });
    vi.stubEnv('STUDYQUEST_DEMO', 'false');
    mocks.verify.mockRejectedValue(new Error('expired'));
    expect((await GET(invalid)).status).toBe(401); // never silently downgrade a rejected account to a guest
    expect(demoKahoot.games[day].p).toBeUndefined();
  });
  it('enforces lobby time, cancellation and replanning without creating orphan entries', async () => {
    await expect(writeLive(player, join(), () => g.meta.open - 1)).rejects.toMatchObject({
      status: 409,
    });
    await expect(writeLive(player, join(), () => g.meta.start)).rejects.toMatchObject({
      status: 409,
    });
    await expect(writeLive(player, { ...join(), start: g.meta.start + 1 })).rejects.toMatchObject({
      status: 409,
    });
    await writeLive(player, join());
    expect(await writeLive(player, join(), () => g.meta.start + 1000)).toMatchObject({
      n: player.name,
    }); // reconnect
    delete demoKahoot.games[day];
    expect(await readLive(`games/${day}/meta`)).toBeNull();
    await expect(writeLive(player, join())).rejects.toMatchObject({ status: 404 });
    expect(demoKahoot.games[day]).toBeUndefined();
  });
  it('never returns future questions, answer keys, others’ choices or the full game before their time', async () => {
    for (const p of ['q/0', 'k/0', 'a/0', ''])
      await expect(
        readLive(`games/${day}${p ? '/' + p : ''}`, g.q[0].at - 1),
      ).rejects.toMatchObject({ status: 403 });
    expect(await readLive(`games/${day}/q/0`, g.q[0].at)).toEqual(g.q[0]);
    for (const p of ['k/0', 'a/0'])
      await expect(readLive(`games/${day}/${p}`, g.k[0].cl - 1)).rejects.toMatchObject({
        status: 403,
      });
    expect(await readLive(`games/${day}/k/0`, g.k[0].cl)).toEqual(g.k[0]);
    expect(await readLive(`games/${day}`, g.meta.end)).toEqual(g);
    for (const p of ['bank', 'games/../meta', `games/${day}/q`, `games/${day}/p/S1`])
      await expect(readLive(p)).rejects.toThrow();
  });
  it('locks the first concurrent answer, ignores browser timestamps and allows safe retry and resume', async () => {
    await writeLive(player, join());
    await writeLive({ ...player, id: 'S2' }, join({ ...player, id: 'S2' }));
    await writeLive({ ...player, id: 'S3' }, join({ ...player, id: 'S3' }));
    const at = g.q[0].at + 500;
    const results = await Promise.allSettled([
      writeLive(player, answer(0), () => at),
      writeLive(player, answer(1), () => at),
    ]);
    expect(results.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
    expect(demoKahoot.games[day].a![0][player.id]).toEqual({ c: 0, t: at });
    expect(await writeLive(player, answer(0), () => at + 1000)).toEqual({ c: 0, t: at });
    expect(await readLive(`games/${day}/mine`, at, player)).toEqual({
      joined: true,
      answers: { 0: { c: 0, t: at } },
    });
    expect(await readLive(`games/${day}/mine`, at, { ...player, id: 'S2' })).toEqual({
      joined: true,
      answers: {},
    });
    await expect(writeLive(player, answer(0, player, 1), () => at)).rejects.toMatchObject({
      status: 409,
    });
    await expect(writeLive(player, answer(0, player, 1), () => g.k[1].cl)).rejects.toMatchObject({
      status: 409,
    });
  });
  it('does not accept an answer from an unjoined player or a cancelled small game', async () => {
    await expect(writeLive(player, answer(), () => g.q[0].at)).rejects.toMatchObject({
      status: 403,
    });
    await writeLive(player, join());
    await expect(writeLive(player, answer(), () => g.q[0].at)).rejects.toMatchObject({
      status: 409,
    });
    expect(demoKahoot.games[day].a).toBeUndefined();
  });
  it('uses the production transaction safely even when RTDB starts with an empty cache', async () => {
    vi.stubEnv('STUDYQUEST_DEMO', 'false');
    mocks.records.set('kahoot/games/' + day, g);
    await writeLive(player, join());
    expect((mocks.records.get('kahoot/games/' + day) as Game).p?.[player.id]).toMatchObject({
      n: player.name,
    });
  });
  it('permits an owned pending account only for live participation; blocked or unowned accounts still fail', async () => {
    vi.stubEnv('STUDYQUEST_DEMO', 'false');
    mocks.verify.mockResolvedValue({ uid: 'anon-uid' });
    const student = {
      name: 'Ali',
      surname: 'Valiyev',
      status: 'pending',
      group: '',
      total: 315,
      topics: { m1: { p: 75 } },
    };
    mocks.records.set('students/S1', student);
    mocks.records.set('owners/S1/anon-uid', 'grant');
    const r = new NextRequest('https://unistay.test/api/live?path=session', {
      headers: { authorization: 'Bearer valid', 'x-legacy-student': 'S1' },
    });
    await expect(actor(r)).rejects.toMatchObject({ status: 403 });
    expect((await GET(r)).status).toBe(200);
    expect(mocks.records.get('students/S1')).toEqual(student);
    mocks.records.set('students/S1', { ...student, status: 'blocked' });
    expect((await GET(r)).status).toBe(403);
    mocks.records.set('students/S1', student);
    mocks.records.delete('owners/S1/anon-uid');
    expect((await GET(r)).status).toBe(403);
  });
});
