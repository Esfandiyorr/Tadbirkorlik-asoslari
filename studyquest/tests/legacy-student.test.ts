import { expect, it } from 'vitest';
import { applyLegacyUpdate, REOPEN_WINDOW } from '../lib/server/legacy-student';
import { academicRecord } from '../lib/server/academic';

/* 👥 «Talabalar va baholar»: asl yozuvga o'zgarish — holat, guruh, amaliy baho va 🔁 testga ikkinchi urinish. */
const now = Date.UTC(2026, 10, 14, 9, 0);
const student = () => ({
  name: 'Ali',
  surname: 'Valiyev',
  group: 'AP-223',
  status: 'ok',
  total: 40,
  updated: 1,
  prog: { m3: { qa: 2, sl: { slide0: 1 } } },
});

it('a second test attempt counts the attempts so far and keeps the rest of the progress', () => {
  const v = applyLegacyUpdate(student(), { reopen: 'm3' }, now, 2);
  expect(v.prog.m3).toEqual({ qa: 2, sl: { slide0: 1 }, qx: 2, fx: now + REOPEN_WINDOW });
  // «updated» o'zgarmaydi — talabaning o'z yozuvi kelganini o'qituvchi paneli shu bilan biladi
  expect(v.updated).toBe(1);
  // hali ishlanmagan mavzu ham ochiladi
  expect(applyLegacyUpdate(student(), { reopen: 'm5' }, now, 2).prog.m5).toEqual({
    qx: 0,
    fx: now + REOPEN_WINDOW,
  });
  // talaba yozuvida ham ko'rinadi (qachon berilgani)
  expect(academicRecord('ali', v).reopened).toEqual({ m3: now });
  expect(academicRecord('ali', student()).reopened).toBeUndefined();
});

it('independent learners get no scored attempts; missing records stay untouched', () => {
  const v = applyLegacyUpdate(
    { ...student(), learnerType: 'independent' },
    { reopen: 'm3' },
    now,
    2,
  );
  expect(v.prog.m3).toEqual({ qa: 2, sl: { slide0: 1 } });
  expect(applyLegacyUpdate(null, { reopen: 'm3' }, now, 2)).toBeUndefined();
  expect(applyLegacyUpdate({ name: 'X' }, { status: 'ok' }, now, 2)).toBeUndefined();
});

it('status, group and the practical mark still work as before', () => {
  const v = applyLegacyUpdate(student(), { status: 'blocked', group: 'AP-224' }, now, 2);
  expect(v).toMatchObject({ status: 'blocked', group: 'AP-224', updated: now });
  const m = applyLegacyUpdate(student(), { topic: 'm2', mark: 4 }, now, 2);
  expect(m.manual).toEqual({ m2: 4 });
  expect(m.total).toBe(48);
  expect(applyLegacyUpdate(m, { topic: 'm2', mark: 0 }, now, 2).total).toBe(40);
});
