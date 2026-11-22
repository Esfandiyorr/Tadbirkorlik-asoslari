import { expect, it } from 'vitest';
import { MemoryRepository } from '../lib/server/repository';
import { LearningNotes } from '../lib/server/learning-notes';
import type { Actor } from '../lib/types';
const alice = { id: 'legacy_alice', role: 'student' } as Actor;
const bob = { id: 'legacy_bob', role: 'student' } as Actor;
const note = { lessonId: 'm1', text: 'Mijozni tinglash', bookmarks: [2, 1, 2], version: 0 };
it('keeps personal notes private by account and lesson without writing grades or progress', async () => {
  const db = new MemoryRepository(),
    before = structuredClone(db.state),
    service = new LearningNotes(db, () => 123);
  const saved = await service.save(alice, note);
  expect(saved).toEqual({ text: note.text, bookmarks: [1, 2], version: 1, updatedAt: 123 });
  expect(await service.get(bob, 'm1')).toMatchObject({ text: '', version: 0 });
  expect(await service.get(alice, 'm2')).toMatchObject({ text: '', version: 0 });
  expect(await service.get(alice, 'm1')).toEqual(saved);
  expect(
    Object.fromEntries(Object.entries(db.state).filter(([key]) => key !== 'learningNotes')),
  ).toEqual(before);
  await expect(service.save(alice, { ...note, userId: bob.id })).rejects.toThrow();
});
it('does not overwrite a note saved in another tab and serializes competing saves', async () => {
  const service = new LearningNotes(new MemoryRepository());
  const results = await Promise.allSettled([
    service.save(alice, note),
    service.save(alice, { ...note, text: 'Boshqa oyna' }),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(results.find((r) => r.status === 'rejected')).toMatchObject({ reason: { status: 409 } });
  expect((await service.get(alice, 'm1')).text).toBe(note.text);
  await expect(service.save(alice, { ...note, text: 'Yangi', version: 1 })).resolves.toMatchObject({
    version: 2,
  });
  await expect(service.save(alice, { ...note, text: 'x'.repeat(8001) })).rejects.toThrow();
});
