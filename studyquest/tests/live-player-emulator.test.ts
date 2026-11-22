import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import path from 'node:path';
import fs from 'node:fs/promises';
import { initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getDatabase, type Database } from 'firebase-admin/database';
import { makeGame, khDay, type Game } from '../lib/live-quiz';
import type { Actor } from '../lib/types';

const state = vi.hoisted(() => ({ db: null as unknown as Database }));
vi.mock('../lib/server/repository', async (load) => ({
  ...(await load<typeof import('../lib/server/repository')>()),
  demo: () => false,
  legacyDb: () => state.db,
}));
import { accountPlayer, readLive, writeLive } from '../lib/server/live-player';

const run = it.skipIf(process.env.LIVE_RTDB_EMULATOR !== '1');
let emulator: ChildProcess | undefined,
  app: App,
  writerApp: App,
  seedDb: Database,
  writerDb: Database,
  g: Game;
const day = khDay(Date.now());
const players = ['S1', 'S2', 'S3'].map((id) =>
  accountPlayer({
    id: 'legacy_' + id,
    name: id,
    role: 'student',
    learnerType: 'university',
  } as Actor),
);
beforeAll(async () => {
  if (process.env.LIVE_RTDB_EMULATOR !== '1') return;
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as { port: number }).port;
  await new Promise<void>((resolve) => server.close(() => resolve()));
  const jar = path.resolve(__dirname, '../../tests/.cache/firebase-database-emulator-v4.11.2.jar');
  try {
    await fs.access(jar);
  } catch {
    const response = await fetch(
      'https://storage.googleapis.com/firebase-preview-drop/emulator/firebase-database-emulator-v4.11.2.jar',
      { signal: AbortSignal.timeout(20000) },
    );
    if (!response.ok) throw Error('RTDB emulator download failed: ' + response.status);
    await fs.mkdir(path.dirname(jar), { recursive: true });
    await fs.writeFile(jar, Buffer.from(await response.arrayBuffer()));
  }
  emulator = spawn('java', ['-Xmx256m', '-jar', jar, '--port', String(port)], { stdio: 'ignore' });
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/.json?ns=demo-live-quiz`);
      if (r.status < 500) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  expect(ready, 'local RTDB emulator started').toBe(true);
  vi.stubEnv('FIREBASE_DATABASE_EMULATOR_HOST', '127.0.0.1:' + port);
  app = initializeApp(
    {
      projectId: 'demo-live-quiz',
      databaseURL: 'https://demo-live-quiz.firebaseio.com',
      credential: { getAccessToken: async () => ({ access_token: 'owner', expires_in: 3600 }) },
    },
    'live-player-emulator',
  );
  seedDb = getDatabase(app);
  writerApp = initializeApp(app.options, 'live-player-emulator-writer');
  writerDb = getDatabase(writerApp);
  state.db = writerDb;
}, 45000);
beforeEach(async () => {
  if (process.env.LIVE_RTDB_EMULATOR !== '1') return;
  g = makeGame(
    day,
    { time: '20:00', qsec: 15 },
    Array.from({ length: 4 }, (_, i) => ({ t: 'Question ' + i, o: ['A', 'B', 'C', 'D'], c: 0 })),
    () => 0.5,
  );
  state.db = writerDb;
  await seedDb.ref().set({
    kahoot: { games: { [day]: g } },
    students: { S1: { total: 315, topics: { m1: { p: 75 } } } },
  });
});
afterAll(async () => {
  emulator?.kill('SIGTERM');
  if (app) {
    state.db.goOffline();
    seedDb.goOffline();
    await deleteApp(app);
  }
  if (writerApp) {
    writerDb.goOffline();
    await deleteApp(writerApp);
  }
  vi.unstubAllEnvs();
});
async function joinAll() {
  await Promise.all(
    players.map((p) =>
      writeLive(
        p,
        { path: `games/${day}/p/${p.id}`, value: { n: 'forged', at: 1 }, start: g.meta.start },
        () => g.meta.open + 1000,
      ),
    ),
  );
}
run(
  'real RTDB transactions accept concurrent joins without losing players or changing academic records',
  async () => {
    await joinAll();
    const stored = (await state.db.ref('kahoot/games/' + day).get()).val();
    expect(Object.keys(stored.p)).toEqual(expect.arrayContaining(['S1', 'S2', 'S3']));
    expect(stored.p.S1).toEqual({ n: 'S1', g: '', at: g.meta.open + 1000 });
    expect((await state.db.ref('students/S1').get()).val()).toEqual({
      total: 315,
      topics: { m1: { p: 75 } },
    });
  },
  15000,
);
run(
  'real RTDB aborts a concurrent answer replacement and preserves the original timestamp',
  async () => {
    await joinAll();
    const at = g.q[0].at + 500;
    const submit = (c: number) =>
      writeLive(
        players[0],
        { path: `games/${day}/a/0/S1`, value: { c, t: 1 }, start: g.meta.start },
        () => at,
      );
    const first = submit(0);
    state.db = seedDb; // Two independent SDK clients, as on separate server instances.
    const results = await Promise.allSettled([first, submit(1)]);
    expect(results.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((x) => x.status === 'rejected')).toHaveLength(1);
    expect((await state.db.ref(`kahoot/games/${day}/a/0/S1`).get()).val()).toMatchObject({ t: at });
    await expect(readLive(`games/${day}/k/0`, at)).rejects.toMatchObject({ status: 403 });
  },
  15000,
);
run(
  'a cancelled game is never recreated by a delayed answer transaction',
  async () => {
    await joinAll();
    await state.db.ref('kahoot/games/' + day).remove();
    await expect(
      writeLive(
        players[0],
        { path: `games/${day}/a/0/S1`, value: { c: 0 } },
        () => g.q[0].at + 500,
      ),
    ).rejects.toMatchObject({ status: 404 });
    expect((await state.db.ref('kahoot/games/' + day).get()).exists()).toBe(false);
  },
  15000,
);
