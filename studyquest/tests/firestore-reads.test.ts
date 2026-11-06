import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import type { Actor } from '../lib/types';

/* Firestore kunlik bepul kvotasi (50 000 o'qish): katalog uzoq keshlanadi va o'qituvchi o'zgartirganda versiya
   belgisi (asl bazada meta/catalogVersion) orqali yangilanadi; asl taqdimotli talabaning progress hujjatlari
   keraksiz o'qilmaydi. Soxta Firestore/RTDB bilan haqiqiy FirebaseRepository sinovdan o'tadi. */
const store: Record<string, Record<string, any>> = {};
const rtdb: Record<string, unknown> = {};
const stats = { queries: 0, gets: 0, rtdbReads: 0 };
const TIMESTAMP = { '.sv': 'timestamp' };
let clock = Date.UTC(2026, 10, 6, 12);

function query(c: string, filter?: { f: string; v: unknown }): any {
  const q: any = {
    where: (f: string, _op: string, v: unknown) => query(c, { f, v }),
    orderBy: () => q,
    limit: () => q,
    startAfter: () => q,
    get: async () => {
      stats.queries++;
      const docs = Object.entries(store[c] || {})
        .filter(([, d]) => !filter || d[filter.f] === filter.v)
        .map(([id, d]) => ({ id, data: () => structuredClone(d) }));
      return { docs, size: docs.length };
    },
  };
  return q;
}
const doc = (c: string, id: string) => ({
  c,
  id,
  get: async () => {
    stats.gets++;
    return { exists: !!store[c]?.[id], id, data: () => structuredClone(store[c]?.[id]) };
  },
});
vi.mock('firebase-admin/app', () => ({
  getApps: () => [{}],
  initializeApp: () => ({}),
  cert: () => ({}),
  applicationDefault: () => ({}),
}));
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: (c: string) => ({ ...query(c), doc: (id: string) => doc(c, id) }),
    runTransaction: async (f: (t: any) => Promise<unknown>) =>
      f({
        get: (ref: { get: () => Promise<unknown> }) => ref.get(),
        set: (ref: { c: string; id: string }, v: unknown) =>
          ((store[ref.c] ??= {})[ref.id] = structuredClone(v)),
        delete: (ref: { c: string; id: string }) => delete store[ref.c]?.[ref.id],
      }),
  }),
  FieldValue: {},
  FieldPath: { documentId: () => '__name__' },
}));
vi.mock('firebase-admin/database', () => ({
  getDatabase: () => ({
    ref: (path: string) => ({
      get: async () => {
        stats.rtdbReads++;
        if (rtdb.__down) throw new Error('RTDB unavailable');
        return { val: () => rtdb[path] ?? null };
      },
      set: async (v: unknown) => {
        rtdb[path] = v === TIMESTAMP ? clock : v;
      },
    }),
  }),
  ServerValue: { TIMESTAMP },
}));
vi.mock('firebase-admin/auth', () => ({ getAuth: () => ({}) }));
vi.mock('firebase-admin/storage', () => ({ getStorage: () => ({ bucket: () => ({}) }) }));

beforeAll(() => {
  delete process.env.STUDYQUEST_DEMO;
  process.env.FIREBASE_PROJECT_ID = 'test-project';
  process.env.FIREBASE_CLIENT_EMAIL = 'x@test';
  process.env.FIREBASE_PRIVATE_KEY = 'key';
});
beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  for (const k of Object.keys(rtdb)) delete rtdb[k];
  Object.assign(stats, { queries: 0, gets: 0, rtdbReads: 0 });
  store.courses = { c: { title: 'Tadbirkorlik asoslari', published: true } };
  store.lessons = {
    m1: { title: 'M1', courseId: 'c', published: true, legacyFile: 'mavzu-1.html' },
  };
  clock = Date.UTC(2026, 10, 6, 12);
  vi.spyOn(Date, 'now').mockImplementation(() => clock);
  delete (globalThis as { studyquestRepository?: unknown }).studyquestRepository;
});
afterEach(() => {
  vi.restoreAllMocks();
});
const fresh = async () => {
  delete (globalThis as { studyquestRepository?: unknown }).studyquestRepository;
  const { repository } = await import('../lib/server/repository');
  return repository();
};

it('keeps the catalog for hours and refreshes it within 30 seconds after any instance changes it', async () => {
  const repo = await fresh();
  expect((await repo.list('lessons')).map((l) => l.title)).toEqual(['M1']);
  await repo.list('lessons');
  clock += 2 * 3600000; // ikki soatdan keyin ham Firestore qayta o'qilmaydi
  await repo.list('lessons');
  expect(stats.queries).toBe(1);
  // Boshqa server nusxasi darsni o'zgartirdi: versiya belgisi yangilandi.
  store.lessons.m1.title = 'M1 (yangilangan)';
  rtdb['meta/catalogVersion'] = clock;
  clock += 10000;
  expect((await repo.list('lessons'))[0].title).toBe('M1'); // 30 soniyalik tekshiruv oralig'i
  clock += 31000;
  expect((await repo.list('lessons'))[0].title).toBe('M1 (yangilangan)');
  expect(stats.queries).toBe(2);
  // Shu nusxada yozilsa — belgi yangilanadi va kesh darhol tozalanadi.
  clock += 1000;
  await repo.transaction(async (tx) => {
    tx.set('lessons', 'm2', { title: 'M2', courseId: 'c', published: true });
  });
  expect(rtdb['meta/catalogVersion']).toBe(clock);
  expect((await repo.list('lessons')).map((l) => l.title).sort()).toEqual([
    'M1 (yangilangan)',
    'M2',
  ]);
  // Foydalanuvchiga oid to'plamlar keshlanmaydi.
  const before = stats.queries;
  await repo.list('users');
  await repo.list('users');
  expect(stats.queries - before).toBe(2);
});

it('falls back to the five-minute cache when the version stamp cannot be read', async () => {
  rtdb.__down = true;
  const repo = await fresh();
  await repo.list('courses');
  clock += 4 * 60000;
  await repo.list('courses');
  expect(stats.queries).toBe(1);
  clock += 2 * 60000;
  await repo.list('courses');
  expect(stats.queries).toBe(2);
});

it('does not read Firestore progress for original-presentation students while the catalog has only originals', async () => {
  const repo = await fresh();
  const { Platform } = await import('../lib/server/platform');
  store.progress = {
    legacy_ali_m1: { userId: 'legacy_ali', lessonId: 'm1', seen: [0, 1] },
    u1_m1: { userId: 'u1', lessonId: 'm1', seen: [0] },
  };
  const find = vi.spyOn(repo, 'find');
  const legacy = { id: 'legacy_ali', role: 'student', name: 'Ali' } as unknown as Actor;
  const email = { id: 'u1', role: 'student', name: 'Vali' } as unknown as Actor;
  const service = new Platform(repo, () => clock);
  const first = await service.state(legacy);
  expect(first.lessons.map((l) => (l as { id?: string }).id)).toEqual(['m1']);
  expect(first.progress).toEqual([]);
  expect(find.mock.calls.some(([c]) => c === 'progress')).toBe(false);
  expect((await service.state(email)).progress).toHaveLength(1);
  // O'qituvchi yangi (asl bo'lmagan) dars qo'shsa — talabaning progressi ham o'qiladi.
  await repo.transaction(async (tx) =>
    tx.set('lessons', 'new1', { title: 'Yangi', courseId: 'c', published: true }),
  );
  find.mockClear();
  await service.state(legacy);
  expect(find.mock.calls.some(([c]) => c === 'progress')).toBe(true);
});
