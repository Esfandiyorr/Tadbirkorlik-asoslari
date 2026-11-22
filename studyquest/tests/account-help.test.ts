import { expect, it } from 'vitest';
import { MemoryRepository } from '../lib/server/repository';
import { AccountHelp } from '../lib/server/account-help';
import type { Actor } from '../lib/types';
const student = { id: 'student', role: 'student' } as Actor,
  teacher = { id: 'teacher', role: 'teacher' } as Actor;
const input = {
  name: 'Ali Valiyev',
  group: 'AP-223',
  contact: 'ali@example.uz',
  message: 'Hisobga kira olmayapman',
};
it('requires the unguessable receipt for public status and staff for replies; never resets access or grades', async () => {
  const db = new MemoryRepository(),
    before = structuredClone(db.state),
    service = new AccountHelp(db, () => 1000);
  const receipt = await service.create(input, 'one');
  expect(receipt.receipt).toMatch(/^[a-f0-9]{64}$/);
  const rows = await service.list(teacher);
  expect(rows).toHaveLength(1);
  expect(rows[0]).not.toHaveProperty('receiptHash');
  expect(await service.status(receipt.receipt)).not.toHaveProperty('contact');
  await expect(service.status(rows[0].id)).rejects.toMatchObject({ status: 404 });
  await expect(service.list(student)).rejects.toMatchObject({ status: 403 });
  await expect(
    service.update(student, { id: rows[0].id, status: 'resolved', reply: 'x' }),
  ).rejects.toMatchObject({ status: 403 });
  await service.update(teacher, {
    id: rows[0].id,
    status: 'resolved',
    reply: 'O‘qituvchi bilan bog‘laning',
  });
  expect(await service.status(receipt.receipt)).toMatchObject({
    status: 'resolved',
    reply: 'O‘qituvchi bilan bog‘laning',
  });
  for (const [key, value] of Object.entries(before)) expect(db.state[key]).toEqual(value);
});
it('limits requests per hour and stops exposing expired requests', async () => {
  let now = 1000;
  const db = new MemoryRepository(),
    service = new AccountHelp(db, () => now);
  const receipt = await service.create(input, 'one');
  await service.create(input, 'one');
  await service.create(input, 'one');
  await expect(service.create(input, 'one')).rejects.toMatchObject({ status: 429 });
  now += 3600000;
  await expect(service.create(input, 'one')).resolves.toHaveProperty('receipt');
  now += 31 * 86400000;
  await expect(service.status(receipt.receipt)).rejects.toMatchObject({ status: 404 });
  expect(await service.list(teacher)).toEqual([]);
});
