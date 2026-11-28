import 'server-only';
import { z } from 'zod';
import type { Actor } from '../types';
import {
  CLOSED_TEXT,
  closedFeatures,
  FEATURES,
  groupLimitKey,
  groupRule,
  userLimitKey,
  userRule,
  type Feature,
  type LimitStore,
} from '../student-limits';
import { ApiError, check, staff } from './auth';
import { siteGet, siteUpdate } from './site-content';

/* 🎚 Guruh va talaba bo'yicha yopilgan bo'limlar (lib/student-limits.ts). Har so'rovda bazani o'qimaslik uchun
   15 soniyalik xotira; o'zgartirilganda darhol yangilanadi. */
const mem = ((globalThis as { __sqLimits?: { v: LimitStore | null; at: number } }).__sqLimits ??= {
  v: null,
  at: 0,
});
const TTL = 15000;

function normalize(raw: unknown): LimitStore {
  const out: LimitStore = { g: {}, u: {} };
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  for (const scope of ['g', 'u'] as const) {
    const rules = (src[scope] && typeof src[scope] === 'object' ? src[scope] : {}) as Record<
      string,
      { f?: Record<string, unknown>; at?: unknown; by?: unknown; name?: unknown; group?: unknown }
    >;
    for (const [key, r] of Object.entries(rules)) {
      if (!r?.f || typeof r.f !== 'object') continue;
      const f = Object.fromEntries(
        FEATURES.filter((k) => typeof r.f![k] === 'boolean').map((k) => [k, r.f![k] as boolean]),
      );
      if (!Object.keys(f).length) continue;
      out[scope]![key] = {
        f,
        at: Number(r.at) || 0,
        by: typeof r.by === 'string' ? r.by : '',
        ...(typeof r.name === 'string' && r.name ? { name: r.name } : {}),
        ...(typeof r.group === 'string' && r.group ? { group: r.group } : {}),
      };
    }
  }
  return out;
}

export async function readLimits(fresh = false, now = Date.now()): Promise<LimitStore> {
  if (!fresh && mem.v && now - mem.at < TTL) return mem.v;
  const v = normalize(await siteGet('limits'));
  mem.v = v;
  mem.at = now;
  return v;
}

/** Talabaga yopilgan bo'limlar (xodimlarga — hech narsa yopilmaydi). Bazaga ulanib bo'lmasa — cheklov yo'q. */
export async function closedFor(
  a: Pick<Actor, 'id' | 'role' | 'classId'>,
  group?: string,
): Promise<Feature[]> {
  if (a.role !== 'student') return [];
  const store = await readLimits().catch(() => null);
  return closedFeatures(store, a.id, group ?? a.classId ?? '');
}

/** Bo'lim yopiq bo'lsa — 403 (tushunarli xabar bilan). */
export async function requireFeature(
  a: Pick<Actor, 'id' | 'role' | 'classId'>,
  f: Feature,
  group?: string,
) {
  if ((await closedFor(a, group)).includes(f)) throw new ApiError(403, CLOSED_TEXT.uz);
}

const featureMap = z.record(z.string(), z.boolean());
const input = z.discriminatedUnion('op', [
  z
    .object({
      op: z.literal('set'),
      scope: z.enum(['g', 'u']),
      key: z.string().trim().min(1).max(140),
      f: featureMap,
      name: z.string().trim().max(120).optional(),
      group: z.string().trim().max(60).optional(),
    })
    .strict(),
  z
    .object({
      op: z.literal('clear'),
      scope: z.enum(['g', 'u']),
      key: z.string().trim().min(1).max(140),
    })
    .strict(),
]);

/** O'qituvchi yoki administrator: guruh yoki talaba qoidasini saqlash ('set') yoki olib tashlash ('clear'). */
export async function manageLimits(a: Actor, raw: unknown, now = Date.now()) {
  staff(a);
  const p = input.parse(raw);
  const key = p.scope === 'g' ? groupLimitKey(p.key) : userLimitKey(p.key);
  check(key && key !== '_', 400, p.scope === 'g' ? 'Guruh topilmadi.' : 'Talaba topilmadi.');
  const path = 'limits/' + p.scope + '/' + key;
  if (p.op === 'clear') await siteUpdate({ [path]: null });
  else {
    const unknown = Object.keys(p.f).filter((k) => !(FEATURES as readonly string[]).includes(k));
    check(!unknown.length, 400, 'Noma’lum bo‘lim: ' + unknown.join(', '));
    const f = p.scope === 'g' ? groupRule(p.f) : userRule(p.f);
    await siteUpdate({
      [path]: Object.keys(f).length
        ? {
            f,
            at: now,
            by: (a.name || a.id).slice(0, 60),
            ...(p.name ? { name: p.name } : {}),
            ...(p.group ? { group: p.group } : {}),
          }
        : null,
    });
  }
  return readLimits(true, now);
}
