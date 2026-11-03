import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
export const accessCookie = 'tad-owner-access';
export const accessLifetime = 900;
export const ownerUids = () =>
  (process.env.STUDYQUEST_ADMIN_UIDS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
export const ownerEmail = 'isfandiyor2198@gmail.com';
export const ownerName = 'Isfandiyor Sayfiddinov';
export function isOwnerIdentity(identity: {
  uid: string;
  email?: string;
  email_verified?: boolean;
}) {
  return (
    ownerUids().includes(identity.uid) ||
    (identity.email_verified === true && identity.email?.trim().toLowerCase() === ownerEmail)
  );
}
export function adminOnly() {
  return process.env.PLATFORM_MAINTENANCE === 'true';
}
const secret = () => process.env.PLATFORM_ACCESS_SECRET || process.env.FIREBASE_PRIVATE_KEY || '';
export function issueAccess(uid: string, now = Date.now(), email?: string) {
  if (!secret() || (!ownerUids().includes(uid) && email !== ownerEmail))
    throw Error('Administrator kirishi sozlanmagan.');
  const payload = Buffer.from(
    JSON.stringify({
      uid,
      ...(email === ownerEmail ? { email } : {}),
      exp: now + accessLifetime * 1000,
    }),
  ).toString('base64url');
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
      (ownerUids().includes(data.uid) || data.email === ownerEmail) &&
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
