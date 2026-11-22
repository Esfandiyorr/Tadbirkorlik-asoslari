import 'server-only';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Actor } from '../types';
import type { Repository } from './repository';
import { check } from './auth';

export const noteInput = z
  .object({
    lessonId: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/),
    text: z.string().max(8000),
    bookmarks: z.array(z.number().int().min(0).max(999)).max(100),
    version: z.number().int().min(0),
  })
  .strict();
export type LearningNote = {
  text: string;
  bookmarks: number[];
  version: number;
  updatedAt: number;
};
const empty = (): LearningNote => ({ text: '', bookmarks: [], version: 0, updatedAt: 0 });
const key = (a: Actor, lesson: string) =>
  createHash('sha256')
    .update(a.id + '\0' + lesson)
    .digest('hex');
/** Shaxsiy qaydlar alohida yozuvda; progress, baho va akademik ballarga tegmaydi. */
export class LearningNotes {
  constructor(
    private db: Repository,
    private now = () => Date.now(),
  ) {}
  async get(a: Actor, lessonId: string): Promise<LearningNote> {
    const row = await this.db.get('learningNotes', key(a, lessonId));
    if (!row) return empty();
    check(row.userId === a.id, 403, 'Bu qayd sizga tegishli emas.');
    return {
      text: row.text,
      bookmarks: row.bookmarks,
      version: row.version,
      updatedAt: row.updatedAt,
    };
  }
  async save(a: Actor, input: unknown): Promise<LearningNote> {
    const p = noteInput.parse(input),
      id = key(a, p.lessonId);
    return this.db.transaction(async (tx) => {
      const old = await tx.get('learningNotes', id);
      check(!old || old.userId === a.id, 403, 'Bu qayd sizga tegishli emas.');
      check(
        (old?.version || 0) === p.version,
        409,
        'Qayd boshqa oynada yangilangan. Hisobdagi nusxani ochib, matningizni solishtiring.',
      );
      const value = {
        text: p.text,
        bookmarks: [...new Set(p.bookmarks)].sort((a, b) => a - b),
        version: p.version + 1,
        updatedAt: this.now(),
      };
      tx.set('learningNotes', id, { ...value, userId: a.id, lessonId: p.lessonId });
      return value;
    });
  }
}
