import 'server-only';
import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { authAdmin, legacyDb, repository, demo, configured } from './repository';
import { catalog, demoUsers } from '../seed';
import type { Actor, User } from '../types';
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const check = (value: unknown, status: number, message: string) => {
  if (!value) throw new ApiError(status, message);
};
const demoKey = globalThis as unknown as { studyquestDemoKey?: string };
function key() {
  return (demoKey.studyquestDemoKey ??= crypto.randomBytes(32).toString('hex'));
}
export function demoCookie(id: string) {
  const value = Buffer.from(JSON.stringify({ id, exp: Date.now() + 86400000 })).toString(
    'base64url',
  );
  return value + '.' + crypto.createHmac('sha256', key()).update(value).digest('hex');
}
function readDemo(cookie: string) {
  const [value, sig] = cookie.split('.'),
    expected = crypto
      .createHmac('sha256', key())
      .update(value || '')
      .digest('hex');
  check(
    sig &&
      sig.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)),
    401,
    'Kirish talab qilinadi',
  );
  const x = JSON.parse(Buffer.from(value, 'base64url').toString());
  check(x.exp > Date.now() && demoUsers.some((u) => u.id === x.id), 401, 'Seans tugagan');
  return x.id as string;
}
export async function actor(req: NextRequest, readOnly = false): Promise<Actor> {
  check(
    demo() || configured(),
    503,
    'Tadbirkorlik asoslari xizmatlari hali sozlanmagan. Mavjud darslardan foydalanishingiz mumkin.',
  );
  const repo = await repository();
  if (demo()) {
    const cookie = req.cookies.get('sq-demo')?.value;
    check(cookie, 401, 'Demo hisobni tanlang');
    const u = await repo.get('users', readDemo(cookie!));
    check(u, 401, 'Hisob topilmadi');
    return u as Actor;
  }
  check(
    configured(),
    503,
    'Tadbirkorlik asoslari xizmatlari hali sozlanmagan. Mavjud darslardan foydalanishingiz mumkin.',
  );
  const token = req.headers.get('authorization')?.replace(/^Bearer /, '');
  check(token, 401, 'Hisobingizga kiring');
  let decoded;
  try {
    decoded = await authAdmin().verifyIdToken(token!, true);
  } catch {
    throw new ApiError(401, 'Seans tugagan. Qayta kiring.');
  }
  const legacyId = req.headers.get('x-legacy-student');
  check(!legacyId || /^[A-Za-z0-9_-]{1,100}$/.test(legacyId), 400, 'Hisob noto‘g‘ri');
  let academicPoints: number | undefined;
  let id = decoded.uid,
    name = decoded.name || decoded.email?.split('@')[0] || 'O‘quvchi',
    classId = '',
    learnerType: Actor['learnerType'] = 'independent';
  if (legacyId) {
    const [owner, record] = await Promise.all([
      legacyDb().ref(`owners/${legacyId}/${decoded.uid}`).get(),
      legacyDb().ref(`students/${legacyId}`).get(),
    ]);
    const s = record.val();
    check(
      owner.exists() &&
        s &&
        s.status !== 'blocked' &&
        (s.status === 'ok' || s.learnerType === 'independent'),
      403,
      'Hisob tasdig‘i yoki darsga ruxsat talab qilinadi',
    );
    academicPoints = Number.isFinite(s.total) ? s.total : 0;
    id = 'legacy_' + legacyId;
    name = s.name + ' ' + s.surname;
    classId = s.learnerType === 'independent' ? '' : s.group || '';
    learnerType = s.learnerType === 'independent' ? 'independent' : 'university';
  }
  const stored = readOnly ? null : await repo.get('users', id);
  check(!stored?.blocked, 403, 'Hisob bloklangan');
  const admins = (process.env.STUDYQUEST_ADMIN_UIDS || '').split(',').map((x) => x.trim());
  const emailTeacher =
    decoded.email_verified &&
    crypto
      .createHash('sha256')
      .update((decoded.email || '').toLowerCase())
      .digest('hex') === catalog.teacherH;
  const role = admins.includes(decoded.uid)
    ? 'admin'
    : stored?.role ||
      (decoded.role === 'admin'
        ? 'admin'
        : decoded.role === 'teacher' || emailTeacher
          ? 'teacher'
          : 'student');
  const u: User = {
    id,
    uid: decoded.uid,
    name: stored?.name || name,
    email: decoded.email,
    classId: legacyId ? classId : stored?.classId || classId,
    learnerType: legacyId ? learnerType : stored?.learnerType || learnerType,
    role,
    xp: stored?.xp || 0,
    streak: stored?.streak || 0,
    leaderboardVisible: stored?.leaderboardVisible !== false,
    createdAt: stored?.createdAt || Date.now(),
  };
  if (
    !readOnly &&
    (!stored ||
      stored.uid !== decoded.uid ||
      stored.role !== role ||
      stored.classId !== u.classId ||
      stored.learnerType !== u.learnerType ||
      stored.authLinkedUid !== decoded.uid)
  )
    await repo.transaction(async (tx) => {
      const current = await tx.get('users', id);
      tx.set('users', id, {
        ...u,
        ...current,
        uid: decoded.uid,
        role,
        classId: u.classId,
        learnerType: u.learnerType,
        authLinkedUid: decoded.uid,
      });
      tx.set('authLinks', decoded.uid, { id: decoded.uid, actorId: id });
    });
  return { ...u, ...(academicPoints !== undefined ? { academicPoints } : {}) };
}
export function staff(a: Actor) {
  check(a.role === 'teacher' || a.role === 'admin', 403, 'O‘qituvchi ruxsati talab qilinadi');
}
export function administrator(a: Actor) {
  check(a.role === 'admin', 403, 'Administrator ruxsati talab qilinadi');
}
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!origin) return;
  let source: URL;
  try {
    source = new URL(origin);
  } catch {
    throw new ApiError(403, 'So‘rov manbasi noto‘g‘ri');
  }
  const host = req.headers.get('host') || req.nextUrl.host;
  check(
    source.host === host && source.protocol === req.nextUrl.protocol,
    403,
    'So‘rov manbasi noto‘g‘ri',
  );
}
