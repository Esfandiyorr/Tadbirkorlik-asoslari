import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import catalog from '../catalog.generated.json';

export const lessonAccessLifetime = 900;
const prefix = 'tad-lesson-';
const demoKey = globalThis as { studyquestLessonKey?: string };
const secret = () =>
  process.env.PLATFORM_ACCESS_SECRET ||
  process.env.FIREBASE_PRIVATE_KEY ||
  (process.env.STUDYQUEST_DEMO === 'true' && process.env.NODE_ENV !== 'production'
    ? (demoKey.studyquestLessonKey ??= randomBytes(32).toString('hex'))
    : '');

const paths = new Map<string, string>();
const topics = new Set<string>();
for (const topic of catalog.topics) {
  topics.add(topic.id);
  const files = [topic.file, topic.pdf, topic.video, 'quiz/' + topic.id + '.json'];
  if (topic.video?.endsWith('.mp4')) files.push(topic.video.replace(/\.mp4$/, '.vtt'));
  for (const file of files) {
    if (file && !file.includes('://')) paths.set('/legacy/' + file, topic.id);
  }
}

export const lessonAssetTopic = (pathname: string) => paths.get(pathname);
export const isMainLesson = (topic: string) => topics.has(topic);
export const lessonAccessCookie = (topic: string) => prefix + topic;
export const isLessonAccessCookie = (name: string) =>
  name.startsWith(prefix) && isMainLesson(name.slice(prefix.length));

const signature = (key: string, topic: string, expires: number) =>
  createHmac('sha256', key)
    .update('lesson:' + topic + ':' + expires)
    .digest();

export function issueLessonAccess(topic: string, now = Date.now()) {
  const key = secret();
  if (!key) throw new Error('Dars fayllari uchun server kaliti sozlanmagan.');
  const expires = now + lessonAccessLifetime * 1000;
  return expires + '.' + signature(key, topic, expires).toString('hex');
}

export function validLessonAccess(topic: string, value?: string, now = Date.now()) {
  const key = secret();
  if (!key || !value || !/^\d{13}\.[a-f0-9]{64}$/.test(value)) return false;
  const [stamp, sig] = value.split('.');
  const expires = Number(stamp);
  return (
    expires > now &&
    expires <= now + lessonAccessLifetime * 1000 &&
    timingSafeEqual(signature(key, topic, expires), Buffer.from(sig, 'hex'))
  );
}
