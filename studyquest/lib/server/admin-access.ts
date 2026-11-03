import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
export const accessCookie = 'tad-owner-access';
export const accessLifetime = 900;
export const ownerUids = () =>
  (process.env.STUDYQUEST_ADMIN_UIDS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
export function adminOnly() {
  if (process.env.PLATFORM_ADMIN_ONLY === 'false') return false;
  if (process.env.PLATFORM_ADMIN_ONLY === 'true') return true;
  return (
    process.env.NODE_ENV !== 'test' &&
    !(
      process.env.STUDYQUEST_DEMO === 'true' &&
      process.env.NODE_ENV !== 'production' &&
      !process.env.VERCEL
    )
  );
}
const secret = () => process.env.PLATFORM_ACCESS_SECRET || process.env.FIREBASE_PRIVATE_KEY || '';
export function issueAccess(uid: string, now = Date.now()) {
  if (!secret() || !ownerUids().includes(uid)) throw Error('Administrator kirishi sozlanmagan.');
  const payload = Buffer.from(JSON.stringify({ uid, exp: now + accessLifetime * 1000 })).toString(
    'base64url',
  );
  return payload + '.' + createHmac('sha256', secret()).update(payload).digest('hex');
}
export function validAccess(value: string | undefined, now = Date.now()) {
  if (!secret() || !value || value.length > 2048) return false;
  try {
    const [payload, sig, extra] = value.split('.');
    if (extra || !payload || !/^[a-f0-9]{64}$/.test(sig || '')) return false;
    const expected = createHmac('sha256', secret()).update(payload).digest();
    if (!timingSafeEqual(expected, Buffer.from(sig, 'hex'))) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return (
      ownerUids().includes(data.uid) &&
      Number.isFinite(data.exp) &&
      data.exp > now &&
      data.exp <= now + accessLifetime * 1000
    );
  } catch {
    return false;
  }
}
export const maintenanceData = () => ({
  adminOnly: true,
  mode: 'firebase',
  courses: [],
  modules: [],
  lessons: [],
  quizzes: [],
  badges: [],
  settings: { levels: [], rewards: { lesson: 0, quiz: 0, perfect: 0, challenge: 0, course: 0 } },
});
