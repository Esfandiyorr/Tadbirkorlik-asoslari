import 'server-only';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Actor } from '../types';
import type { Repository } from './repository';
import { check, staff } from './auth';
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
const form = z
  .object({
    name: z.string().trim().min(3).max(150),
    group: z.string().trim().max(60),
    contact: z.string().trim().min(5).max(150),
    message: z.string().trim().min(5).max(1000),
  })
  .strict();
export type HelpRow = {
  id: string;
  name: string;
  group: string;
  contact: string;
  message: string;
  status: 'new' | 'reviewing' | 'resolved';
  reply: string;
  at: number;
  updatedAt: number;
};
const KEEP = 30 * 86400000;
/** Faqat yordam so'rovi. Parol, hisob egasi, ball yoki ruxsat avtomatik o'zgarmaydi. */
export class AccountHelp {
  constructor(
    private db: Repository,
    private now = () => Date.now(),
  ) {}
  async create(input: unknown, address: string) {
    const p = form.parse(input),
      at = this.now(),
      receipt = randomBytes(32).toString('hex'),
      id = randomUUID(),
      rateId = hash(address + ':' + Math.floor(at / 3600000));
    await this.db.transaction(async (tx) => {
      const rate = await tx.get('accountHelpRate', rateId);
      check((rate?.count || 0) < 3, 429, 'Bir ozdan so‘ng qayta urinib ko‘ring.');
      tx.set('accountHelpRate', rateId, { count: (rate?.count || 0) + 1, expiresAt: at + 3600000 });
      tx.set('accountHelp', id, {
        ...p,
        id,
        receiptHash: hash(receipt),
        at,
        updatedAt: at,
        expiresAt: at + KEEP,
        status: 'new',
        reply: '',
      });
      tx.set('accountHelpReceipts', hash(receipt), { requestId: id, expiresAt: at + KEEP });
    });
    return { receipt, status: 'new', reply: '', at };
  }
  async status(receipt: string) {
    check(/^[a-f0-9]{64}$/.test(receipt), 404, 'So‘rov topilmadi.');
    const pointer = await this.db.get('accountHelpReceipts', hash(receipt));
    check(pointer && pointer.expiresAt > this.now(), 404, 'So‘rov topilmadi yoki muddati tugagan.');
    const row = await this.db.get('accountHelp', pointer!.requestId);
    check(row && row.receiptHash === hash(receipt), 404, 'So‘rov topilmadi.');
    return { status: row!.status, reply: row!.reply, at: row!.at, updatedAt: row!.updatedAt };
  }
  async list(a: Actor): Promise<HelpRow[]> {
    staff(a);
    const rows = await this.db.list('accountHelp');
    return rows
      .filter((r) => r.expiresAt > this.now())
      .sort((a, b) => b.at - a.at)
      .slice(0, 200)
      .map(({ receiptHash, expiresAt, ...r }) => r as HelpRow);
  }
  async update(a: Actor, input: unknown) {
    staff(a);
    const p = z
      .object({
        id: z.string().uuid(),
        status: z.enum(['new', 'reviewing', 'resolved']),
        reply: z.string().trim().max(1000),
      })
      .strict()
      .parse(input);
    await this.db.transaction(async (tx) => {
      const row = await tx.get('accountHelp', p.id);
      check(row && row.expiresAt > this.now(), 404, 'So‘rov topilmadi.');
      tx.set('accountHelp', p.id, { ...row, ...p, updatedAt: this.now(), by: a.id });
    });
    return { ok: true };
  }
}
