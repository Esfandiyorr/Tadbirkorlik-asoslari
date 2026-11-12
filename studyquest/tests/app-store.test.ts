import { beforeAll, beforeEach, expect, it } from 'vitest';
import type { Actor } from '../lib/types';
import {
  appAdmin,
  appInfo,
  assetLinks,
  cancelDeletion,
  deletionStatus,
  forgetAppInfo,
  manageApp,
  normalizeSha,
  requestDeletion,
} from '../lib/server/app-store';
import { resetSiteMemory, siteGet } from '../lib/server/site-content';
import { subscribePush, pushSubs } from '../lib/server/push';
import { deleteDoc, privacyDoc } from '../lib/legal';

/* 📱 Play Market: ilova imzosi (assetlinks.json), maxfiylik siyosati ma'lumotlari va hisobni o'chirish so'rovlari. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(() => {
  resetSiteMemory();
  forgetAppInfo();
});
const who = (id: string, role = 'student') =>
  ({
    id,
    uid: 'auth-' + id,
    role,
    name: 'Ali Valiyev',
    classId: 'AP-223',
    learnerType: 'university',
  }) as unknown as Actor;
const admin = who('owner', 'admin');
const SHA =
  '14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5';

it('publishes asset links only when the package and a valid fingerprint are set', async () => {
  expect(assetLinks(await appInfo())).toEqual([]);
  expect(normalizeSha(SHA.toLowerCase().replace(/:/g, ''))).toBe(SHA);
  expect(normalizeSha('abc')).toBe('');
  await expect(
    manageApp(who('legacy_ali'), { op: 'save', operator: '', email: '', pkg: '', sha: [] }),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    manageApp(admin, { op: 'save', operator: 'x', email: 'not-an-email', pkg: '', sha: [] }),
  ).rejects.toThrow();
  await expect(
    manageApp(admin, { op: 'save', operator: 'x', email: '', pkg: 'bad name', sha: [] }),
  ).rejects.toThrow();
  await expect(
    manageApp(admin, { op: 'save', operator: 'x', email: '', pkg: '', sha: ['12:34'] }),
  ).rejects.toMatchObject({ status: 400 });
  const v = await manageApp(admin, {
    op: 'save',
    operator: 'Isfandiyor Q.',
    email: 'aloqa@example.uz',
    pkg: 'uz.terdu.tadbirkorlik',
    sha: [SHA.toLowerCase(), SHA.replace(/:/g, ' ')],
  });
  expect(v.info).toEqual({
    operator: 'Isfandiyor Q.',
    email: 'aloqa@example.uz',
    pkg: 'uz.terdu.tadbirkorlik',
    sha: [SHA],
  });
  expect(v.ready).toEqual({ policy: true, links: true });
  expect(assetLinks(await appInfo())).toEqual([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'uz.terdu.tadbirkorlik',
        sha256_cert_fingerprints: [SHA],
      },
    },
  ]);
  // maxfiylik siyosatida operator va email ko'rinadi; kiritilmagan bo'lsa — ilova ichidagi «Adminga xabar»
  const doc = privacyDoc('uz', await appInfo());
  expect(JSON.stringify(doc)).toContain('Isfandiyor Q.');
  expect(JSON.stringify(doc)).toContain('aloqa@example.uz');
  const bare = JSON.stringify(deleteDoc('en', { operator: '', email: '' }));
  expect(bare).toContain('Message the admin');
  expect(bare).not.toContain('undefined');
});

it('a student asks to delete the account, may cancel, and the administrator erases it without a copy', async () => {
  const ali = who('legacy_ali');
  expect(await deletionStatus(ali)).toEqual({ pending: null });
  await expect(requestDeletion(ali, {})).rejects.toThrow(); // tasdiqsiz bo'lmaydi
  await expect(requestDeletion(admin, { confirm: true })).rejects.toMatchObject({ status: 400 });
  const now = Date.UTC(2026, 10, 12, 9, 0);
  expect(
    await requestDeletion(ali, { confirm: true, reason: 'Boshqa o‘qishga o‘tdim' }, now),
  ).toEqual({
    pending: now,
  });
  expect(await cancelDeletion(ali)).toEqual({ pending: null });
  expect((await appAdmin(admin)).requests).toEqual([]);

  await requestDeletion(ali, { confirm: true }, now);
  await requestDeletion(who('legacy_vali'), { confirm: true }, now + 1000);
  const dev = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
    keys: {
      p256dh: Buffer.from(new Uint8Array(65).fill(4)).toString('base64url'),
      auth: Buffer.from(new Uint8Array(16).fill(1)).toString('base64url'),
    },
  };
  await subscribePush(ali, dev);
  expect((await appAdmin(admin)).requests.map((r) => r.uid)).toEqual(['legacy_ali', 'legacy_vali']);
  await expect(appAdmin(who('tc', 'teacher'))).rejects.toMatchObject({ status: 403 });

  // asl baza o'rnida soxta: o'chirilgan yo'llar yozib olinadi
  const db: Record<string, unknown> = {
    'students/ali': { name: 'Ali', surname: 'Valiyev', status: 'ok', total: 120 },
  };
  const patches: Record<string, unknown>[] = [];
  const read = async (p: string) => db[p] ?? null;
  const update = async (p: Record<string, unknown>) => void patches.push(p);
  await expect(
    manageApp(admin, { op: 'approve', uid: 'legacy_nobody' }, now, read, update),
  ).rejects.toMatchObject({ status: 404 });
  const after = await manageApp(
    admin,
    { op: 'approve', uid: 'legacy_ali' },
    now + 5000,
    read,
    update,
  );
  expect(after.requests.map((r) => r.uid)).toEqual(['legacy_vali']);
  expect(patches).toHaveLength(1);
  const p = patches[0];
  expect(p).toMatchObject({
    'students/ali': null,
    'keys/ali': null,
    'owners/ali': null,
    'priv/ali': null,
    'support/legacy_ali': null,
    'meta/deletedStudentIds/ali': true,
  });
  // nusxa (arxiv) saqlanmaydi; jurnalda faqat id va vaqt
  expect(Object.keys(p).some((k) => k.startsWith('deletedStudents/'))).toBe(false);
  const audit = Object.entries(p).find(([k]) => k.startsWith('adminAudit/'))![1];
  expect(audit).toEqual({
    action: 'eraseStudent',
    studentId: 'ali',
    by: 'auth-owner',
    at: now + 5000,
    why: 'self-request',
  });
  expect(await pushSubs()).toEqual({}); // bildirishnoma obunasi ham o'chdi
  expect(await siteGet('deleteRequests/legacy_ali')).toBeNull();

  // rad etilsa — hech narsa o'chmaydi, faqat so'rov olib tashlanadi
  const rejected = await manageApp(admin, { op: 'reject', uid: 'legacy_vali' }, now, read, update);
  expect(rejected.requests).toEqual([]);
  expect(patches).toHaveLength(1);
  expect(await deletionStatus(who('legacy_vali'))).toEqual({ pending: null });
});
