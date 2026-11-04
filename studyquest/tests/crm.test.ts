import { expect, it, vi } from 'vitest';
import { academicRecord } from '../lib/server/academic';
import { crmRevision, revisionReading } from '../lib/crm';
import { writeCrm } from '../lib/server/crm';
import { demoUsers } from '../lib/seed';
const old = {
  name: 'Ali',
  surname: 'Valiyev',
  status: 'ok',
  total: 482.5,
  topics: { m7: { p: 95, b: 5, s: 18, t: 3600, q: 15 } },
  reading: { m7: { last: 17 } },
  prog: { m7: { sl: Object.fromEntries(Array.from({ length: 18 }, (_, i) => ['slide' + i, 1])) } },
};
it('old completed topic retains its points and grade but the CRM revision is unread from slide one', () => {
  const result = academicRecord('alice', structuredClone(old));
  expect(result.academicPoints).toBe(482.5);
  expect(result.readingHistory.m7).toMatchObject({
    score: 95,
    grade: 5,
    status: 'new',
    seenSlides: 0,
    lastSlide: 0,
    totalSlides: 22,
  });
  expect(result.academicTopics.m7.p).toBe(95);
});
it('new reading uses only this revision while leaving historical grades intact', () => {
  const result = academicRecord('alice', {
    ...old,
    readingRevisions: {
      m7: {
        [crmRevision]: {
          seen: Object.fromEntries(Array.from({ length: 22 }, (_, i) => [i, true])),
          last: 21,
        },
      },
    },
  });
  expect(result.readingHistory.m7).toMatchObject({
    score: 95,
    grade: 5,
    status: 'read',
    seenSlides: 22,
    lastSlide: 21,
  });
  expect(result.academicPoints).toBe(482.5);
  expect(revisionReading({ seen: [-1, 0, 0, 21, 22], last: 100 })).toEqual({
    seen: [0, 21],
    last: 21,
  });
});
it('records only the verified learner revision and rejects grade injection and out-of-range slides', async () => {
  const update = vi.fn();
  const a = { ...demoUsers[0], id: 'legacy_alice' };
  await writeCrm(a, { index: 4 }, update);
  expect(update).toHaveBeenCalledWith(`students/alice/readingRevisions/m7/${crmRevision}`, {
    'seen/4': true,
    last: 4,
    updatedAt: expect.any(Number),
  });
  await expect(writeCrm(a, { index: 22 }, update)).rejects.toThrow();
  await expect(writeCrm(a, { index: 1, studentId: 'bob', score: 100 }, update)).rejects.toThrow();
  await expect(writeCrm(demoUsers[2], { index: 1 }, update)).rejects.toThrow();
  expect(update).toHaveBeenCalledTimes(1);
});
