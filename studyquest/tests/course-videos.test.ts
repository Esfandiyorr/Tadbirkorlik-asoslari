import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../app/api/site/video/route';
import { GET as quizScript } from '../app/api/site/quiz/route';
import { allVideos, manageVideos, topicVideos, videoTopics } from '../lib/server/videos';
import { manageCourseAccess } from '../lib/server/course-access';
import { resetSiteMemory } from '../lib/server/site-content';
import { demoCookie } from '../lib/server/auth';
import { repository } from '../lib/server/repository';
import type { Actor } from '../lib/types';

vi.mock('../lib/server/repository', async (load) => {
  const actual = await load<typeof import('../lib/server/repository')>();
  const db = new actual.MemoryRepository();
  return { ...actual, repository: async () => db };
});
const admin = { id: 'demo-admin', uid: 'demo-admin', name: 'Admin', role: 'admin' } as Actor;
const id = 'ABcdEFghI_1';
const req = (lesson: string, user?: string) =>
  new NextRequest(
    'https://unistay.test/api/site/video?t=' + lesson,
    user ? { headers: { cookie: 'sq-demo=' + demoCookie(user) } } : undefined,
  );
beforeEach(() => {
  process.env.STUDYQUEST_DEMO = 'true';
  resetSiteMemory();
});

it('keeps videos scoped to 15 main topics and 12 restaurant lessons without changing student records', async () => {
  const db = await repository(),
    before = await db.list('users');
  expect(videoTopics().filter((t) => t.courseId === 'tad-asoslari')).toHaveLength(15);
  expect(videoTopics().filter((t) => t.courseId === 'restoran')).toHaveLength(12);
  await manageVideos(admin, {
    op: 'add',
    t: 'r4',
    url: 'https://youtu.be/' + id + '?t=12',
    title: 'R4 muloqot',
  });
  await manageVideos(admin, { op: 'add', t: 'm8', url: 'https://youtu.be/' + id });
  expect(await topicVideos('r4')).toMatchObject([{ id, s: 12 }]);
  expect((await allVideos()).topics.find((t) => t.id === 'r4')).toMatchObject({
    courseId: 'restoran',
    paid: true,
  });
  await expect(
    manageVideos(admin, { op: 'add', t: 'r99', url: 'https://youtu.be/' + id }),
  ).rejects.toMatchObject({ status: 404 });
  expect(await topicVideos('../r4')).toEqual([]);
  expect(await db.list('users')).toEqual(before);
});

it('protects paid video URLs with course access and never puts them in public quiz scripts or shared caches', async () => {
  await manageVideos(admin, { op: 'add', t: 'r4', url: 'https://youtu.be/' + id });
  const guest = await GET(req('r4'));
  expect(guest.status).toBe(401);
  expect(guest.headers.get('cache-control')).toBe('private, no-store');
  expect(JSON.stringify(await guest.json())).not.toContain(id);
  for (const user of ['demo-student', 'demo-teacher'])
    expect((await GET(req('r4', user))).status).toBe(403);
  const allowed = await GET(req('r4', 'demo-admin'));
  expect(allowed.status).toBe(200);
  expect(allowed.headers.get('cache-control')).toBe('private, no-store');
  expect((await allowed.json()).videos[0].id).toBe(id);
  await manageCourseAccess(admin, {
    op: 'grantUser',
    uid: 'demo-student',
    name: 'Talaba',
    course: 'restoran',
  });
  expect((await GET(req('r4', 'demo-student'))).status).toBe(200);
  await manageCourseAccess(admin, { op: 'revoke', uid: 'demo-student', course: 'restoran' });
  expect((await GET(req('r4', 'demo-student'))).status).toBe(403);
  expect(await (await quizScript(req('r4'))).text()).not.toContain(id);
});

it('keeps existing main-course videos public and cacheable', async () => {
  await manageVideos(admin, { op: 'add', t: 'm8', url: 'https://youtu.be/' + id });
  const response = await GET(req('m8'));
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toContain('s-maxage=30');
  expect((await response.json()).videos[0].id).toBe(id);
});
