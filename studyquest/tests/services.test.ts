import { beforeAll, beforeEach, expect, it } from 'vitest';
import { FILE_CHUNK, KEEP_DAYS, SERVICE_KINDS } from '../lib/services';
import type { Actor } from '../lib/types';
import { demoOutbox } from '../lib/server/push';
import {
  adminServices,
  manageServices,
  saveServiceChunk,
  serviceChunk,
  servicesAdmin,
  servicesView,
} from '../lib/server/services';
import { resetSiteMemory, siteGet, siteUpdate } from '../lib/server/site-content';

const admin = { id: 'owner', role: 'admin', name: 'Admin' } as Actor;
const student = {
  id: 'legacy_ali',
  role: 'student',
  name: 'Ali Valiyev',
  classId: 'AP-223',
} as Actor;
const other = { id: 'legacy_vali', role: 'student', name: 'Vali Karimov' } as Actor;
const ids = { uk: student.id, id: 'testorder1' };
const orderPath = 'serviceOrders/' + ids.uk + '/' + ids.id;
const orderRef = ids.uk + '/' + ids.id;
const input = 'taqdimot';
const text = 'Marketing asoslari bo‘yicha 12 ta slayd kerak.';
const file = 'inputfile1';
const result = 'outputfile1';
const PDF = Buffer.from('%PDF-1.4\n% sinov fayli\n');
const NOW = Date.now();
const DAY = 86400000;

beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});

beforeEach(async () => {
  resetSiteMemory();
  demoOutbox.length = 0;
  await siteUpdate({
    'serviceInfo/shown': true,
    'push/subs/admin': { e: 'admin', p: 'p', a: 'a', uid: admin.id, role: admin.role },
    'push/subs/student': { e: 'student', p: 'p', a: 'a', uid: student.id, role: student.role },
    'push/subs/other': { e: 'other', p: 'p', a: 'a', uid: other.id, role: other.role },
  });
});

const draft = (files: string[] = [], now = NOW) =>
  manageServices(student, { op: 'draft', id: ids.id, kind: input, text, files }, now);
const submit = (now = NOW) => manageServices(student, { op: 'submit', id: ids.id }, now);
const begin = (scope: 'me' | 'admin', fid: string, size = PDF.length) => {
  const data = { op: 'begin', fid, name: fid + '.pdf', size };
  return scope === 'me'
    ? manageServices(student, { ...data, id: ids.id }, NOW)
    : adminServices(admin, { ...data, ...ids }, NOW);
};
const finish = (scope: 'me' | 'admin', fid: string) =>
  scope === 'me'
    ? manageServices(student, { op: 'finish', id: ids.id, fid }, NOW)
    : adminServices(admin, { op: 'finish', ...ids, fid }, NOW);
const deliver = (answer: string, link = '', now = NOW) =>
  adminServices(admin, { op: 'deliver', ...ids, text: answer, link }, now);

it('publishes a private request only after upload, then delivers a private reply once', async () => {
  await draft([file]);
  await expect(submit()).rejects.toMatchObject({ status: 409 });
  expect((await servicesView(student, NOW)).orders).toEqual([]);
  expect((await servicesAdmin(admin, NOW)).orders).toEqual([]);
  expect(demoOutbox).toEqual([]);

  expect(await begin('me', file)).toMatchObject({ missing: [0] });
  await saveServiceChunk(student, 'me', orderRef, file, 0, PDF);
  await finish('me', file);
  await expect(serviceChunk(admin, orderRef, file, 0)).rejects.toMatchObject({ status: 404 });
  await Promise.all([submit(), submit(NOW + 1)]);
  expect(demoOutbox.map((notice) => [notice.sub.uid, notice.payload.u])).toEqual([
    [admin.id, '/#admin/services'],
  ]);
  expect((await servicesView(other, NOW)).orders).toEqual([]);
  expect((await servicesAdmin(admin, NOW)).orders[0]).toMatchObject({
    ...ids,
    text,
    status: 'new',
    files: [{ id: file }],
    name: student.name,
  });
  expect((await serviceChunk(admin, orderRef, file, 0)).bytes).toEqual(PDF);
  await expect(serviceChunk(other, orderRef, file, 0)).rejects.toMatchObject({ status: 404 });
  await expect(servicesAdmin(other)).rejects.toMatchObject({ status: 403 });

  await expect(deliver('')).rejects.toMatchObject({ status: 400 });
  await begin('admin', result);
  await expect(deliver('Tayyor!')).rejects.toMatchObject({ status: 409 });
  await saveServiceChunk(admin, 'admin', orderRef, result, 0, PDF);
  await finish('admin', result);
  expect((await servicesView(student, NOW)).orders?.[0].files.map((f) => f.id)).toEqual([file]);
  await expect(serviceChunk(student, orderRef, result, 0)).rejects.toMatchObject({ status: 404 });

  await Promise.all([
    deliver('Tayyor!', 'https://example.com/result', NOW + 2000),
    deliver('Tayyor!', 'https://example.com/result', NOW + 3000),
  ]);
  expect((await servicesView(student, NOW + 3000)).orders?.[0]).toMatchObject({
    status: 'done',
    reply: 'Tayyor!',
    link: 'https://example.com/result',
  });
  expect((await serviceChunk(student, orderRef, result, 0)).bytes).toEqual(PDF);
  await expect(serviceChunk(other, orderRef, result, 0)).rejects.toMatchObject({ status: 404 });
  expect(demoOutbox.map((notice) => [notice.sub.uid, notice.payload.u])).toEqual([
    [admin.id, '/#admin/services'],
    [student.id, '/#services/mine'],
  ]);
});

it('resumes an interrupted upload and removes attachments deselected before sending', async () => {
  await draft([file, 'otherfile']);
  const bytes = Buffer.concat([PDF, Buffer.alloc(FILE_CHUNK - PDF.length + 1)]);
  expect(await begin('me', file, bytes.length)).toMatchObject({ missing: [0, 1] });
  await expect(saveServiceChunk(student, 'me', orderRef, file, 0, PDF)).rejects.toMatchObject({
    status: 400,
  });
  await saveServiceChunk(student, 'me', orderRef, file, 0, bytes.subarray(0, FILE_CHUNK));
  expect(await begin('me', file, bytes.length)).toMatchObject({ missing: [1] });

  await begin('me', 'otherfile');
  await saveServiceChunk(student, 'me', orderRef, 'otherfile', 0, PDF);
  await finish('me', 'otherfile');
  await draft([file]);
  expect(await siteGet('serviceFiles/' + orderRef + '/otherfile/0')).toBeNull();
  await expect(submit()).rejects.toMatchObject({ status: 409 });
  await saveServiceChunk(student, 'me', orderRef, file, 1, bytes.subarray(FILE_CHUNK));
  await finish('me', file);
  await finish('me', file);
  await submit();
  expect((await servicesView(student, NOW)).orders?.[0].files).toMatchObject([{ id: file }]);
});

it('keeps the catalog and intake controls and rejects the removed marketplace actions', async () => {
  const guest = await servicesView(null);
  expect(guest).toMatchObject({ signedIn: false, shown: true });
  expect(guest.catalog.map((k) => k.id)).toEqual(SERVICE_KINDS.map((k) => k.id));
  expect(guest).not.toHaveProperty('board');
  expect(guest).not.toHaveProperty('fans');
  await adminServices(admin, {
    op: 'catalog',
    kind: input,
    price: '50 000 so‘m',
    days: '2 kun',
    off: true,
  });
  expect((await servicesView(null)).catalog.some((k) => k.id === input)).toBe(false);
  await expect(draft()).rejects.toMatchObject({ status: 400 });
  await expect(manageServices(student, { op: 'join' })).rejects.toThrow();
  await expect(manageServices(student, { op: 'apply', ...ids })).rejects.toThrow();
  await expect(adminServices(admin, { op: 'assign', ...ids })).rejects.toThrow();

  await adminServices(admin, { op: 'show', shown: false });
  expect((await servicesView(null)).shown).toBe(false);
  await expect(draft()).rejects.toMatchObject({ status: 403 });
});

it('retains existing orders and files without giving former workers access', async () => {
  await siteUpdate({
    [orderPath]: {
      uid: student.id,
      name: student.name,
      kind: input,
      title: 'Old request',
      text,
      status: 'review',
      at: NOW,
      upd: NOW,
      worker: { uk: other.id },
      budget: 120000,
      paidNote: 'Old receipt',
      files: {
        [result]: {
          side: 'out',
          name: 'old.pdf',
          ext: 'pdf',
          size: PDF.length,
          chunks: 1,
          at: NOW,
          ready: true,
        },
      },
      msgs: { old: { from: 'worker', at: NOW, text: 'Avvalgi javob' } },
    },
    ['serviceFiles/' + ids.uk + '/' + result + '/0']: PDF.toString('base64'),
  });
  expect((await servicesView(student, NOW)).orders?.[0]).toMatchObject({
    status: 'done',
    msgs: [{ text: 'Avvalgi javob' }],
    files: [{ id: result }],
  });
  expect((await servicesAdmin(admin, NOW)).orders[0]).toMatchObject({
    budget: 120000,
    paidNote: 'Old receipt',
  });
  expect((await serviceChunk(student, orderRef, result, 0)).bytes).toEqual(PDF);
  await expect(serviceChunk(other, orderRef, result, 0)).rejects.toMatchObject({ status: 404 });

  await siteUpdate({ [orderPath + '/status']: 'paid' });
  await expect(deliver('Yakuniy javob')).resolves.toMatchObject({
    admin: { orders: [{ status: 'done', reply: 'Yakuniy javob' }] },
  });
});

it('cleans expired files and abandoned drafts and keeps access to replies if intake closes', async () => {
  await draft();
  await servicesView(student, NOW + DAY + 1);
  expect(await siteGet(orderPath)).toBeNull();

  await draft();
  await submit();
  await begin('admin', result);
  await saveServiceChunk(admin, 'admin', orderRef, result, 0, PDF);
  await finish('admin', result);
  await adminServices(admin, { op: 'show', shown: false });
  await deliver('Javob tayyor');
  expect((await servicesView(student, NOW)).orders?.[0].reply).toBe('Javob tayyor');
  const order = (await servicesView(student, NOW + KEEP_DAYS * DAY + 1)).orders?.[0];
  expect(order).toMatchObject({ expired: true, files: [], reply: 'Javob tayyor' });
  expect(await siteGet('serviceFiles/' + orderRef + '/' + result + '/0')).toBeNull();
  await manageServices(student, { op: 'remove', id: ids.id });
  expect((await servicesView(student)).orders).toEqual([]);
});
