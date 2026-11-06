import { beforeAll, beforeEach, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';
import type { Actor } from '../lib/types';
import { AVATAR_IDS } from '../lib/avatars';
import {
  avatarCatalog,
  avatarLibrary,
  manageLibrary,
  uploadAvatar,
} from '../lib/server/avatar-library';
import { avatarView, pickAvatar, readAvatars, type BoardRow } from '../lib/server/avatars';
import { resetSiteMemory } from '../lib/server/site-content';
import { GET as image } from '../app/api/site/img/[key]/route';

/* 🎭 Sayt boshqaruvi → Avatarlar kutubxonasi: administrator yangi avatar qo'shadi, nomini va rasmini almashtiradi,
   yashiradi yoki o'chiradi; talabalar faqat ko'rinib turganlarini tanlaydi. */
beforeAll(() => {
  process.env.STUDYQUEST_DEMO = 'true';
});
beforeEach(() => {
  resetSiteMemory();
  const store = (globalThis as { __sqAvatars?: { own: object; allow: object } }).__sqAvatars;
  if (store) {
    store.own = {};
    store.allow = {};
  }
});
const ranked: BoardRow[] = [1, 2, 3].map((n, i) => ({
  id: 'legacy_s' + n,
  name: 'Talaba ' + n,
  classId: 'AP-223',
  academicPoints: 100 - i,
}));
const student = (n: number) =>
  ({ id: 'legacy_s' + n, role: 'student', name: 'Talaba ' + n }) as unknown as Actor;
const admin = { id: 'owner', role: 'admin', name: 'Admin' } as unknown as Actor;
const teacher = { id: 'tc', role: 'teacher', name: 'Ustoz' } as unknown as Actor;
const png = fs.readFileSync(path.join(__dirname, '../public/icon-192.png'));

it('adds a new avatar with its own picture that top students can choose', async () => {
  expect((await avatarLibrary()).map((a) => a.id)).toEqual([...AVATAR_IDS]);
  await expect(uploadAvatar(teacher, { name: 'Burgut' }, png)).rejects.toMatchObject({
    status: 403,
  });
  await expect(uploadAvatar(admin, { name: '' }, png)).rejects.toThrow();
  await expect(
    uploadAvatar(admin, { name: 'Burgut' }, Buffer.from('<svg/>')),
  ).rejects.toMatchObject({ status: 400 });
  const now = Date.UTC(2026, 10, 6, 12);
  const lib = await uploadAvatar(admin, { name: 'Burgut', from: 'TerDU' }, png, now);
  const added = lib.at(-1)!;
  expect(added).toMatchObject({
    id: 'c' + now.toString(36),
    name: ['Burgut', 'Burgut', 'Burgut'],
    from: 'TerDU',
    custom: true,
    src: '/api/site/img/av-' + added.id + '?v=' + now.toString(36),
  });
  const served = await image(new NextRequest('http://localhost' + added.src), {
    params: Promise.resolve({ key: 'av-' + added.id }),
  });
  expect(served.headers.get('content-type')).toBe('image/png');
  expect(Buffer.from(await served.arrayBuffer()).equals(png)).toBe(true);

  const catalog = await avatarCatalog();
  const view = await pickAvatar(student(1), ranked, { avatar: added.id }, catalog);
  expect(view.leaderboard[0]).toMatchObject({ id: 'legacy_s1', avatar: added.id });
  expect(view.avatars.catalog.map((a) => a.id)).toContain(added.id);
  await expect(pickAvatar(student(2), ranked, { avatar: 'shrek' }, catalog)).rejects.toMatchObject({
    status: 404,
  });
});

it('renames, replaces pictures, hides and deletes avatars', async () => {
  let lib = await manageLibrary(admin, {
    op: 'rename',
    id: 'sonic',
    name: ['Tez Sonik', '', 'Соник'],
    from: 'Sega',
  });
  expect(lib.find((a) => a.id === 'sonic')).toMatchObject({
    name: ['Tez Sonik', 'Tez Sonik', 'Соник'],
    from: 'Sega',
    src: '/avatars/sonic.webp',
  });
  await expect(manageLibrary(teacher, { op: 'hide', id: 'po', off: true })).rejects.toMatchObject({
    status: 403,
  });
  // Asl qahramonning rasmini almashtirish va qaytarish.
  lib = await uploadAvatar(admin, { id: 'mario' }, png, 5);
  expect(lib.find((a) => a.id === 'mario')!.src).toBe('/api/site/img/av-mario?v=5');
  lib = await manageLibrary(admin, { op: 'resetImage', id: 'mario' });
  expect(lib.find((a) => a.id === 'mario')!.src).toBe('/avatars/mario.webp');
  // Yashirilgan avatar tanlanmaydi va egasida ham ko'rinmaydi.
  await pickAvatar(student(1), ranked, { avatar: 'po' }, await avatarCatalog());
  lib = await manageLibrary(admin, { op: 'hide', id: 'po', off: true });
  expect(lib.find((a) => a.id === 'po')!.off).toBe(true);
  const catalog = await avatarCatalog();
  expect(catalog.map((a) => a.id)).not.toContain('po');
  expect(
    avatarView(ranked, await readAvatars(), 'legacy_s1', catalog).avatars.me?.avatar,
  ).toBeNull();
  await expect(pickAvatar(student(2), ranked, { avatar: 'po' }, catalog)).rejects.toMatchObject({
    status: 404,
  });
  await manageLibrary(admin, { op: 'hide', id: 'po', off: false });
  // Asl avatarni o'chirib bo'lmaydi; o'zi qo'shganini — mumkin (egasidan ham olinadi).
  await expect(manageLibrary(admin, { op: 'delete', id: 'joy' })).rejects.toMatchObject({
    status: 400,
  });
  lib = await uploadAvatar(admin, { name: 'Burgut' }, png, 99);
  const id = lib.at(-1)!.id;
  await pickAvatar(student(2), ranked, { avatar: id }, await avatarCatalog());
  lib = await manageLibrary(admin, { op: 'delete', id });
  expect(lib.map((a) => a.id)).not.toContain(id);
  expect((await readAvatars()).own[id]).toBeUndefined();
});
