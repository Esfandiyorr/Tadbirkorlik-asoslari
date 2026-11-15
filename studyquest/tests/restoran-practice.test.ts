import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { expect, it, vi } from 'vitest';

const script = readFileSync('../_reyting-manba/restoran_practice.js', 'utf8').replace(
  '__RS_MIN__',
  '15',
);
function open(storage: Map<string, string>, user = 'alice', now = 1000) {
  const award = vi.fn(),
    bump = vi.fn(),
    write = vi.fn();
  const context = vm.createContext({
    Q: [{ a: ['A', 'B', 'C', 'D'] }, { a: ['A', 'B', 'C', 'D'] }],
    RT_CFG: { topic: 'r5' },
    RT: { student: () => ({ id: user }), award, qBump: bump },
    window: null,
    document: { getElementById: () => null },
    qIsOpen: () => false,
    qOk: (_: number, answer: unknown) => answer === 0,
    confirm: () => true,
    Date: { now: () => now },
    setInterval: () => 1,
    clearInterval: () => {},
    localStorage: {
      getItem: (key: string) => storage.get(key) || null,
      setItem: (key: string, value: string) => {
        write(key);
        storage.set(key, value);
      },
    },
  });
  context.window = context;
  vm.runInContext(script, context);
  return { context, award, bump, write };
}

it('restores only this learner’s practice answers and original timer without changing existing scores', () => {
  const storage = new Map([
    ['terdu_qs_m1_alice', 'existing answers'],
    ['terdu_points_alice', 'existing points'],
  ]);
  const first = open(storage);
  vm.runInContext('rsStart(); rsAnswer(0, 0);', first.context);
  expect(first.context.RS_STATE.answers[0]).toBe(0);
  const order = JSON.stringify(first.context.RS_STATE.order);

  const reopened = open(storage, 'alice', 61_000);
  expect(reopened.context.RS_STATE.answers[0]).toBe(0);
  expect(JSON.stringify(reopened.context.RS_STATE.order)).toBe(order);
  expect(reopened.context.RS_STATE.at).toBe(1000);
  expect(vm.runInContext('rsLeft()', reopened.context)).toBe(840_000);
  expect(open(storage, 'bob').context.RS_STATE).toBeNull();
  expect(storage.get('terdu_qs_m1_alice')).toBe('existing answers');
  expect(storage.get('terdu_points_alice')).toBe('existing points');
  expect(first.write.mock.calls.every(([key]) => key === 'terdu_restoran_practice_r5_alice')).toBe(
    true,
  );
  expect(first.award).not.toHaveBeenCalled();
  expect(first.bump).not.toHaveBeenCalled();
  expect(reopened.award).not.toHaveBeenCalled();
  expect(reopened.bump).not.toHaveBeenCalled();
});
