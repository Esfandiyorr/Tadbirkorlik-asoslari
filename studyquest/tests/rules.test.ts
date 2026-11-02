import { beforeAll, afterAll, it, expect } from 'vitest';
import fs from 'node:fs';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
let env: RulesTestEnvironment;
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-studyquest',
    firestore: { host: '127.0.0.1', port: 8199, rules: fs.readFileSync('firestore.rules', 'utf8') },
  });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role] of [
      ['student', 'student'],
      ['teacher', 'teacher'],
      ['admin', 'admin'],
      ['other', 'student'],
    ]) {
      await setDoc(doc(db, 'authLinks', uid), { actorId: uid });
      await setDoc(doc(db, 'users', uid), { id: uid, role, blocked: false, classId: 'AP-223' });
    }
    await setDoc(doc(db, 'courses', 'c1'), { id: 'c1', published: true, ownerId: 'teacher' });
    await setDoc(doc(db, 'courses', 'private'), {
      id: 'private',
      published: false,
      ownerId: 'teacher',
    });
    await setDoc(doc(db, 'lessons', 'l1'), {
      id: 'l1',
      published: true,
      courseId: 'c1',
      slides: [{ title: 'Private lesson' }],
    });
    await setDoc(doc(db, 'enrollments', 'student_c1'), { userId: 'student', courseId: 'c1' });
    await setDoc(doc(db, 'progress', 'p1'), { userId: 'student', courseId: 'c1' });
    await setDoc(doc(db, 'quizKeys', 'q1'), { answer: 'secret' });
    await setDoc(doc(db, 'xpTransactions', 'xp1'), { userId: 'student', points: 20 });
  });
});
afterAll(async () => {
  await env?.cleanup();
});
it('allows published catalog metadata but not private lessons to guests', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(db, 'courses', 'c1')));
  await assertFails(getDoc(doc(db, 'courses', 'private')));
  await assertFails(getDoc(doc(db, 'lessons', 'l1')));
});
it('requires enrollment and protects other students’ data', async () => {
  const db = env.authenticatedContext('student').firestore();
  await assertFails(getDoc(doc(db, 'lessons', 'l1')));
  await assertFails(getDoc(doc(db, 'progress', 'p1')));
  await assertFails(getDoc(doc(db, 'users', 'other')));
  await assertFails(getDoc(doc(env.authenticatedContext('other').firestore(), 'lessons', 'l1')));
});
it('denies client mutations to XP, roles, enrollment and progress even with fake role claims', async () => {
  for (const uid of ['student', 'teacher', 'admin']) {
    const db = env.authenticatedContext(uid, { role: 'admin' }).firestore();
    for (const c of ['users', 'xpTransactions', 'enrollments', 'progress', 'authLinks'])
      await assertFails(setDoc(doc(db, c, 'attack'), { role: 'admin', xp: 999999, userId: uid }));
  }
});
it('never exposes private answer keys to client SDKs', async () => {
  for (const uid of ['student', 'teacher', 'admin'])
    await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(), 'quizKeys', 'q1')));
});
it('uses server-maintained role documents instead of trusting arbitrary claims', async () => {
  await assertFails(
    getDoc(
      doc(env.authenticatedContext('student', { role: 'admin' }).firestore(), 'users', 'other'),
    ),
  );
  await assertFails(getDoc(doc(env.authenticatedContext('admin').firestore(), 'users', 'other')));
});
it('requires staff to use the authorized API for private course progress', async () => {
  await assertFails(getDoc(doc(env.authenticatedContext('teacher').firestore(), 'progress', 'p1')));
});
