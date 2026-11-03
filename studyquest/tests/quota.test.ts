import { it, expect, vi } from 'vitest';
import { QuotaGate, quotaExceeded, QuotaError } from '../lib/server/quota';
import { limitedCatalog } from '../lib/server/limited';
import { MemoryRepository, initialState } from '../lib/server/repository';
import { Platform } from '../lib/server/platform';
import { Academic } from '../lib/server/academic';
import { demoUsers } from '../lib/seed';

it('backs off after exhausted quota and retries only after the cooldown', async () => {
  let now = 1000;
  const gate = new QuotaGate(() => now),
    operation = vi.fn().mockRejectedValueOnce({ code: 8 }).mockResolvedValue('restored');
  await expect(gate.run(operation)).rejects.toBeInstanceOf(QuotaError);
  await expect(gate.run(operation)).rejects.toBeInstanceOf(QuotaError);
  expect(operation).toHaveBeenCalledTimes(1);
  now += 60001;
  expect(await gate.run(operation)).toBe('restored');
});

it('does not convert permission errors into a quota fallback', async () => {
  const gate = new QuotaGate(),
    error = { code: 7, message: 'permission denied' };
  await expect(
    gate.run(async () => {
      throw error;
    }),
  ).rejects.toBe(error);
  expect(quotaExceeded(error)).toBe(false);
});

it('limited mode preserves verified academic points without inventing XP or exposing demo users or answers', () => {
  const result = limitedCatalog({ ...demoUsers[0], academicPoints: 375.5 });
  expect(result.lessons).toHaveLength(15);
  expect(result.user).toMatchObject({ academicPoints: 375.5 });
  expect(result.user).not.toHaveProperty('xp');
  expect(result).not.toHaveProperty('users');
  expect(result.quizzes).toEqual([]);
  expect(result.mode).toBe('firebase');
  expect(result.limited).toBe(true);
});

it('student dashboard reads only their own private records even with a large unrelated class', async () => {
  const db = new MemoryRepository(initialState()),
    student = demoUsers[0];
  db.state.progress.mine = {
    id: 'mine',
    userId: student.id,
    lessonId: 'm1',
    seen: [],
    completed: false,
  };
  for (let n = 0; n < 1000; n++) db.state.progress['other' + n] = { userId: 'other', seen: [] };
  const list = vi.spyOn(db, 'list'),
    find = vi.spyOn(db, 'find');
  const state = await new Platform(db).state(student);
  expect(state.progress).toHaveLength(1);
  for (const c of [
    'progress',
    'quizAttempts',
    'xpTransactions',
    'userAchievements',
    'notifications',
    'users',
    'enrollments',
  ])
    expect(list.mock.calls.some(([name]) => name === c)).toBe(false);
  expect(find).toHaveBeenCalledWith('progress', 'userId', student.id);
  expect(state).not.toHaveProperty('allProgress');
});

it('opening the administrator dashboard does not load class reports until explicitly requested', async () => {
  const db = new MemoryRepository(initialState()),
    list = vi.spyOn(db, 'list');
  const service = new Platform(db);
  const home = await service.state(demoUsers[2]);
  expect(home).not.toHaveProperty('users');
  expect(list.mock.calls.some(([c]) => c === 'users')).toBe(false);
  expect(await service.state(demoUsers[2], true)).toHaveProperty('users');
});

it('unchanged migration retries do not rewrite student profiles, enrollments or progress', async () => {
  const db = new MemoryRepository(initialState()),
    source = {
      alice: {
        name: 'Ali',
        surname: 'Valiyev',
        status: 'ok',
        total: 375,
        topics: { m1: { s: 12, t: 3000 } },
      },
    };
  const service = new Academic(db, async () => source);
  await service.sync(demoUsers[2]);
  const original = structuredClone(db.state);
  const tx = db.transaction.bind(db),
    writes: string[] = [];
  db.transaction = (f) =>
    tx((t) =>
      f({
        ...t,
        set: (c, id, value) => {
          writes.push(c);
          t.set(c, id, value);
        },
      }),
    );
  await service.sync(demoUsers[2]);
  expect(writes).toEqual(['migrations']);
  expect(db.state.users).toEqual(original.users);
  expect(db.state.progress).toEqual(original.progress);
});
