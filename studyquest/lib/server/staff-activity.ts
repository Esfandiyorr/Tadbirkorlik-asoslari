import 'server-only';
import { randomUUID } from 'node:crypto';
import type { Actor } from '../types';
import { staff } from './auth';
import { siteGet, siteUpdate } from './site-content';
export type StaffActivity = { id: string; at: number; by: string; action: string; target: string };
/** Faqat boshqaruv amali va nishoni; parol, javob, qayd va baho yozilmaydi. */
export async function recordStaffActivity(a: Actor, action: string, target: string) {
  staff(a);
  const at = Date.now(),
    id = at + '-' + randomUUID().slice(0, 8);
  const old = (await siteGet<Record<string, StaffActivity>>('staffActivity')) || {};
  const patch: Record<string, unknown> = {
    ['staffActivity/' + id]: {
      id,
      at,
      by: a.id,
      action: action.slice(0, 60),
      target: target.slice(0, 120),
    },
  };
  for (const key of Object.keys(old)
    .sort()
    .slice(0, Math.max(0, Object.keys(old).length - 49)))
    patch['staffActivity/' + key] = null;
  await siteUpdate(patch);
}
export async function staffActivity(a: Actor) {
  staff(a);
  const rows = Object.values((await siteGet<Record<string, StaffActivity>>('staffActivity')) || {});
  return rows
    .filter((r) => a.role === 'admin' || r.action.startsWith('topic:') || r.by === a.id)
    .sort((a, b) => b.at - a.at)
    .slice(0, 50);
}
