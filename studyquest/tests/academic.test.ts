import { it, expect, beforeEach, vi } from 'vitest';
import { Academic, academicRecord } from '../lib/server/academic';
import { MemoryRepository, initialState } from '../lib/server/repository';
import { demoUsers } from '../lib/seed';
const student = demoUsers[0],
  teacher = demoUsers[1],
  admin = demoUsers[2];
const source = {
  alice: {
    name: 'Ali',
    surname: 'Valiyev',
    group: 'AP-223',
    status: 'ok',
    total: 375.5,
    at: 1000,
    pk: 'DO_NOT_COPY',
    pwSalt: 'PRIVATE',
    email: 'private@example.test',
    manual: { m1: 4 },
    topics: { m1: { p: 75, b: 4, s: 12, q: 8, t: 3000 } },
    prog: { m1: { sl: { slide0: 1, slide5: 1 }, tm: { device: 3000 }, f: 1000 } },
  },
  bob: { name: 'Bobur', surname: 'Aliyev', group: 'AP-224', status: 'ok', total: 450 },
  independent: {
    name: 'Mustaqil',
    surname: 'O‘quvchi',
    learnerType: 'independent',
    status: 'pending',
    total: 0,
    reading: { m1: { sl: { slide2: 1 }, last: 2, at: 1234 } },
  },
  blocked: { name: 'Blocked', surname: 'Account', status: 'blocked', total: 9999 },
};
let db: MemoryRepository, service: Academic;
beforeEach(() => {
  db = new MemoryRepository(initialState());
  service = new Academic(
    db,
    async () => structuredClone(source),
    () => 5000,
  );
});
it('imports existing accounts and academic scores without copying secrets or awarding XP', async () => {
  const result = await service.sync(admin);
  expect(result.students).toBe(4);
  const alice = await db.get('users', 'legacy_alice');
  expect(alice).toMatchObject({
    name: 'Ali Valiyev',
    classId: 'AP-223',
    academicPoints: 375.5,
    xp: 0,
    role: 'student',
    academicTopics: { m1: { b: 4 } },
    manualMarks: { m1: 4 },
  });
  expect(JSON.stringify(alice)).not.toMatch(/DO_NOT_COPY|PRIVATE|private@example/);
  expect((await db.get('progress', 'legacy_alice_m1'))?.seen).toEqual([0, 5]);
  expect(await db.get('progress', 'legacy_independent_m1')).toMatchObject({ last: 2, seen: [2] });
  expect(await db.list('xpTransactions')).toEqual([]);
});
it('repeated imports preserve XP, roles, progress and original database records', async () => {
  const before = structuredClone(source);
  await service.sync(admin);
  await db.transaction(async (tx) => {
    const u = await tx.get('users', 'legacy_alice');
    tx.set('users', 'legacy_alice', { ...u, xp: 345, role: 'teacher', leaderboardVisible: false });
    const p = await tx.get('progress', 'legacy_alice_m1');
    tx.set('progress', 'legacy_alice_m1', { ...p, seen: [0, 5, 10], last: 10, completed: true });
  });
  await service.sync(admin);
  expect(await db.get('users', 'legacy_alice')).toMatchObject({
    xp: 345,
    role: 'teacher',
    leaderboardVisible: false,
    academicPoints: 375.5,
  });
  expect(await db.get('progress', 'legacy_alice_m1')).toMatchObject({
    last: 10,
    completed: true,
    seen: [0, 5, 10],
  });
  expect(source).toEqual(before);
});
it('only administrators can import; non-staff cannot read the academic roster', async () => {
  const read = vi.fn();
  const guarded = new Academic(db, read);
  await expect(guarded.sync(student)).rejects.toThrow();
  await expect(guarded.sync(teacher)).rejects.toThrow();
  await expect(guarded.roster(student)).rejects.toThrow();
  expect(read).not.toHaveBeenCalled();
});
it('academic ranking preserves scores and excludes independent, blocked and other-class accounts', async () => {
  expect((await service.board(admin)).map((u) => u.academicPoints)).toEqual([450, 375.5]);
  expect(
    (await service.board({ ...student, id: 'legacy_alice', classId: 'AP-223' })).map((u) => u.name),
  ).toEqual(['Ali Valiyev']);
  await expect(service.board({ ...student, learnerType: 'independent' })).rejects.toThrow();
});
it('academic ranking honors privacy settings without erasing grades', async () => {
  await service.sync(admin);
  await db.transaction(async (tx) => {
    const u = await tx.get('users', 'legacy_alice');
    tx.set('users', 'legacy_alice', { ...u, leaderboardVisible: false });
  });
  expect((await service.board(admin)).some((u) => u.id === 'legacy_alice')).toBe(false);
  expect((await db.get('users', 'legacy_alice'))?.academicPoints).toBe(375.5);
});

it('preserves summary-only legacy learning completion without creating XP rewards', async () => {
  const old = {
    summary: {
      name: 'Old',
      surname: 'Student',
      status: 'ok',
      group: 'AP-223',
      total: 100,
      topics: { m1: { s: 18, t: 3600, q: 15, b: 5, p: 100 } },
    },
  };
  const migration = new Academic(db, async () => old);
  await migration.sync(admin);
  expect(await db.get('progress', 'legacy_summary_m1')).toMatchObject({
    legacySeen: 18,
    legacySeconds: 3600,
    completed: true,
  });
  expect(await db.list('xpTransactions')).toEqual([]);
});

it('exposes original work and grades in all fifteen native topic cards without changing the total', () => {
  const record = academicRecord('alice', source.alice);
  expect(record.academicPoints).toBe(375.5);
  expect(Object.keys(record.readingHistory)).toHaveLength(15);
  expect(record.readingHistory.m1).toMatchObject({
    seenSlides: 12,
    totalSlides: 18,
    seconds: 3000,
    correctAnswers: 8,
    score: 75,
    grade: 4,
    status: 'started',
  });
  expect(record.readingHistory.m2.status).toBe('new');
  expect(record.manualMarks.m1).toBe(4);
  expect(JSON.stringify(record)).not.toMatch(/DO_NOT_COPY|PRIVATE|private@example/);
});

it('independent reading history contains the saved position without university grades', () => {
  const record = academicRecord('independent', source.independent);
  expect(record.readingHistory.m1).toMatchObject({
    seenSlides: 1,
    lastSlide: 2,
    status: 'started',
  });
  expect(record.readingHistory.m1).not.toHaveProperty('grade');
  expect(record.readingHistory.m1).not.toHaveProperty('score');
});

it('staff roster includes contact and registration details without exposing credential data to rankings or migration', async () => {
  const read = async (path: string) =>
    path === 'priv'
      ? { alice: { email: 'contact@example.test', secret: 'NEVER_EXPOSE' } }
      : structuredClone(source);
  const records = new Academic(db, read);
  const roster = await records.roster(admin);
  expect(roster.find((u) => u.legacyId === 'alice')).toMatchObject({
    email: 'contact@example.test',
    legacyRegisteredAt: 1000,
  });
  expect(JSON.stringify(roster)).not.toMatch(/NEVER_EXPOSE|DO_NOT_COPY|pwSalt/);
  expect(JSON.stringify(await records.board(admin))).not.toContain('contact@example.test');
});

it('public academic ranking includes all groups with an explicit five-field allowlist', async () => {
  const board = await service.publicBoard();
  expect(board.map((u) => u.classId)).toEqual(['AP-224', 'AP-223']);
  expect(Object.keys(board[0]).sort()).toEqual([
    'academicPoints',
    'classId',
    'id',
    'name',
    'today',
  ]);
  expect(JSON.stringify(board)).not.toMatch(/PRIVATE|email|topics|readingHistory|pwSalt/);
});

it('daily ranking counts only points earned since the start of today in Tashkent', async () => {
  const now = Date.UTC(2026, 10, 5, 10, 0); // 5-noyabr 15:00 (UTC+5)
  const students = {
    a: {
      name: 'Ali',
      surname: 'V',
      group: 'AP-223',
      status: 'ok',
      total: 150,
      dd: '2026-11-05',
      d0: 120,
    },
    b: {
      name: 'Bek',
      surname: 'S',
      group: 'AP-223',
      status: 'ok',
      total: 300,
      dd: '2026-11-04',
      d0: 250,
    },
    c: {
      name: 'Cho',
      surname: 'R',
      group: 'AP-224',
      status: 'ok',
      total: 40,
      dd: '2026-11-05',
      d0: 90,
    },
  };
  const board = await new Academic(db, async () => structuredClone(students)).publicBoard(now);
  const today = Object.fromEntries(board.map((u) => [u.id, u.today]));
  // Ali bugun 30 ball oldi; Bekning yozuvi kechagi — bugun 0; noto'g'ri kun boshi manfiy ball bermaydi.
  expect(today).toEqual({ legacy_a: 30, legacy_b: 0, legacy_c: 0 });
});
