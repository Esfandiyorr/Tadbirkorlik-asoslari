import 'server-only';
import { z } from 'zod';
import { ServerValue } from 'firebase-admin/database';
import { catalog } from '../seed';
import { demo, legacyDb } from './repository';
import { accessMode, weekEnd, type TopicMode } from './legacy-access';

/* O'qituvchi bo'limi → «Mavzular holati»: har mavzu hammaga 🔒 yopiq, 📖 o'qish rejimida yoki 🟢 ochiq (ball bilan).
   Yozuv asl bazada: meta/access/<mavzu> = {m, mt, ...}. Eski dvigatel nusxalari ham shunga yaqin ishlashi uchun
   lim/at ham yoziladi, guruh/talaba ochilishlari tozalanadi (rt-engine accModePatch bilan bir xil). */
export type TopicAccessRow = {
  id: string;
  order: number;
  title: string;
  /** hozir hamma uchun: 🔒 lock · 📖 read · 🟢 open · 👥 groups (faqat ayrim guruh/talabalarga ochiq) */
  state: TopicMode | 'groups';
  /** 🟢 bo'lsa — ball muddatining oxiri */
  due?: number;
  /** holat qayerdan: o'qituvchi tanlagan, boshlang'ich (config) yoki eski guruh qoidalari */
  source: 'teacher' | 'initial' | 'groups';
  groups: string[];
  students: number;
};

type Raw = Record<string, any>;
const memory = ((globalThis as { __sqTopicAccess?: Map<string, Raw> }).__sqTopicAccess ??=
  new Map());

/** Demo: o'qituvchi tanlagan holatlar (jonli bazaga tegmaydi). */
export const demoTopicAccess = (): Record<string, Raw> => Object.fromEntries(memory);

async function readAll(): Promise<Record<string, Raw>> {
  if (demo()) return demoTopicAccess();
  return ((await legacyDb().ref('meta/access').get()).val() || {}) as Record<string, Raw>;
}

const topics = () =>
  catalog.topics as {
    id: string;
    title: string;
    open?: boolean;
    read?: boolean;
    lim?: boolean;
    mode?: string;
    modeAt?: number;
  }[];

export function summarize(all: Record<string, Raw>, now = Date.now()): TopicAccessRow[] {
  const live = (v: unknown): v is number => typeof v === 'number' && v > 0 && now < weekEnd(v);
  return topics().map((t, i) => {
    const raw = all[t.id],
      base = { id: t.id, order: i, title: t.title.replace(/^M\d+\s*·\s*/, '') };
    if (!t.open) return { ...base, state: 'lock', source: 'initial', groups: [], students: 0 };
    const mode = accessMode(t, raw, now);
    if (mode) {
      const open = mode.m === 'open' && live(mode.t);
      return {
        ...base,
        state: mode.m === 'open' && !open ? 'read' : mode.m,
        ...(open ? { due: weekEnd(mode.t) - 60000 } : {}),
        source: mode.initial ? 'initial' : 'teacher',
        groups: [],
        students: 0,
      };
    }
    // Eski qoidalar (guruhlarga alohida ochish): rt-engine accState bilan bir xil.
    const a = raw
      ? { lim: !!raw.lim, g: raw.g || {}, s: raw.s || {}, at: +raw.at || 0 }
      : { lim: !!t.lim, g: {}, s: {}, at: 0 };
    if (!a.lim)
      return live(a.at)
        ? {
            ...base,
            state: 'open',
            due: weekEnd(a.at) - 60000,
            source: 'groups',
            groups: [],
            students: 0,
          }
        : { ...base, state: 'read', source: 'groups', groups: [], students: 0 };
    const groups = Object.keys(a.g).filter((g) => live(a.g[g])),
      students = Object.keys(a.s).filter((s) => live(a.s[s])).length;
    if (groups.length || students)
      return { ...base, state: 'groups', source: 'groups', groups, students };
    const gone = (v: unknown) => typeof v === 'number' && v > 0 && !live(v);
    const allRead =
      !!t.read || gone(a.at) || Object.values(a.g).some(gone) || Object.values(a.s).some(gone);
    return { ...base, state: allRead ? 'read' : 'lock', source: 'groups', groups: [], students: 0 };
  });
}

export async function topicAccessList(now = Date.now()) {
  return { topics: summarize(await readAll(), now) };
}

const input = z
  .object({
    topic: z.string().regex(/^m(?:[1-9]|1[0-5])$/),
    mode: z.enum(['lock', 'read', 'open']),
  })
  .strict();

export async function setTopicMode(raw: unknown, now = Date.now()) {
  const { topic, mode } = input.parse(raw);
  if (demo()) {
    memory.set(
      topic,
      mode === 'open'
        ? { m: mode, mt: now, lim: false, at: now }
        : mode === 'read'
          ? { m: mode, mt: now, lim: false, at: 1 }
          : { m: mode, mt: now, lim: true },
    );
  } else {
    const at = ServerValue.TIMESTAMP;
    await legacyDb()
      .ref('meta/access/' + topic)
      .update(
        mode === 'open'
          ? { m: mode, mt: at, lim: false, at, g: null, s: null }
          : mode === 'read'
            ? { m: mode, mt: at, lim: false, at: 1, g: null, s: null }
            : { m: mode, mt: at, lim: true, at: null, g: null, s: null },
      );
  }
  return topicAccessList();
}
