/* ⚡ Jonli test (Kahoot uslubida) — asl dvigateldagi (_reyting-manba/engine_js.txt: khMakeGame, khScore, yzScore,
   khParse, khQid) funksiyalarning aniq nusxasi. Arena (arena.html) va taqdimotlar shu ma'lumotni o'qiydi, shuning uchun
   kahoot/* dagi format o'zgarmasligi kerak. Brauzerda ham, serverda ham ishlatiladi. */

export type LiveCfg = {
  on?: boolean;
  time?: string;
  nq?: number;
  qsec?: number;
  min?: number;
  lobby?: number;
  yz?: boolean;
  tpx?: Record<string, boolean> | null;
};
export type BankQuestion = {
  t: string;
  o: string[];
  c: number;
  tp?: string;
  u?: number;
  l?: string;
};
export type IdxEntry = {
  start: number;
  open?: number;
  end?: number;
  nq?: number;
  qsec?: number;
  qs?: string[];
  sp?: boolean;
  note?: string | null;
  type?: string;
  x?: number;
  at?: number;
  mode?: string;
  dur?: number;
  lang?: string;
  lvl?: string;
  min?: number;
};
export type GameMeta = {
  start: number;
  open: number;
  end: number;
  qsec: number;
  nq: number;
  min: number;
  intro?: number;
  step?: number;
  pr?: { big?: number; a?: number[]; b?: number[] };
  note?: string;
  type?: string;
  nw?: number;
  mode?: string;
  dur?: number;
};
type Entry<T> = Record<number, T> | T[];
export type Game = {
  meta: GameMeta;
  q: Entry<{ at: number; t?: string; o?: string[] }>;
  k: Entry<{ cl: number; c: number }>;
  p?: Record<string, { n?: string; g?: string; at?: number }>;
  a?: Entry<Record<string, { c?: number; t?: number }>>;
};
export type ResEntry = {
  n: number;
  valid: boolean;
  prizes: Record<string, number>;
  top: { sid: string; n: string; g: string; s: number }[];
  r: Record<string, [number, number, number]>;
  st: number;
  ty: string | null;
  at: number;
};

/** Savollar bankining bo'limlari (asl KH_TPS). Kunlik o'yinga qaysi bo'limlar kirishi — cfg.tpx (kalit "_" — Umumiy). */
export const LIVE_SECTIONS: { id: string; uz: string; en: string; ru: string }[] = [
  { id: '', uz: 'Umumiy', en: 'General', ru: 'Общие' },
  {
    id: 'tad',
    uz: 'Tadbirkorlik asoslari',
    en: 'Entrepreneurship basics',
    ru: 'Основы предпринимательства',
  },
  { id: 'iqt', uz: 'Iqtisod', en: 'Economics', ru: 'Экономика' },
  ...Array.from({ length: 15 }, (_, i) => ({
    id: 'm' + (i + 1),
    uz: i + 1 + '-mavzu',
    en: 'Topic ' + (i + 1),
    ru: 'Тема ' + (i + 1),
  })),
];
export const sectionKey = (tp?: string) => tp || '_';
export const QSEC_CHOICES = [15, 20, 25, 30, 45];

/** Toshkent vaqti (UTC+5): kun va soat. */
export const khDay = (ms: number) => new Date(ms + 18000000).toISOString().slice(0, 10);
export const khHM = (ms: number) => new Date(ms + 18000000).toISOString().slice(11, 16);
/** "YYYY-MM-DD" + "HH:MM" (Toshkent) → ms. */
export function startOf(d: string, tm: string) {
  const hm = String(tm || '20:00').split(':');
  return (
    Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), +hm[0] || 0, +hm[1] || 0) -
    18000000
  );
}

const nrm = (x: unknown) =>
  String(x || '')
    .toLowerCase()
    .replace(/[^a-zЀ-ӿ']/g, '');
export function hash32(str: string, seed: number) {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return ('0000000' + h.toString(16)).slice(-8);
}
/** Savol kaliti — asl khQid bilan bir xil (bir savol ikki marta qo'shilmaydi). */
export const questionId = (t: string) => 'q' + hash32(nrm(t) + '|' + String(t).length, 2166136261);

function shuffle<T>(a: T[], rnd: () => number) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Bir kunlik o'yin: savollar vaqti va (yopilgandan keyin ochiladigan) to'g'ri javob kalitlari. */
export function makeGame(
  d: string,
  cfg: LiveCfg,
  qs: { t: string; o: string[]; c: number }[],
  rnd: () => number = Math.random,
): Game {
  const start = startOf(d, String(cfg.time || '20:00'));
  const qsec = +(cfg.qsec ?? 0) || 15,
    intro = 10000,
    step = qsec * 1000 + 7000,
    lobby = (+(cfg.lobby ?? 0) || 10) * 60000;
  const meta: GameMeta = {
    start,
    open: start - lobby,
    intro,
    step,
    qsec,
    nq: qs.length,
    min: +(cfg.min ?? 0) || 7,
    end: start + intro + qs.length * step,
    pr: { big: 20, a: [5, 4, 3], b: [5, 4, 3, 2, 1] },
  };
  const q: Record<number, { at: number; t: string; o: string[] }> = {},
    k: Record<number, { cl: number; c: number }> = {};
  qs.forEach((x, i) => {
    const at = start + intro + i * step,
      ord = shuffle([0, 1, 2, 3], rnd);
    q[i] = { at, t: x.t, o: ord.map((j) => String((x.o || [])[j] || '')) };
    k[i] = { cl: at + qsec * 1000, c: ord.indexOf(+x.c || 0) };
  });
  return { meta, q, k };
}

const at = <T>(e: Entry<T> | undefined, i: number): T | undefined =>
  e ? (e as Record<number, T>)[i] : undefined;

export type ScoreRow = {
  sid: string;
  n: string;
  g: string;
  at: number;
  s: number;
  rank: number;
};
/** ⚡ Jonli test natijasi (asl khScore): tezlik + ketma-ketlik bonusi; sovrin 5-4-3 (20 kishidan ko'p — 5…1). */
export function scoreQuiz(g: Game | null | undefined, upto?: number) {
  const m = (g?.meta || {}) as Partial<GameMeta>,
    n = +(m.nq ?? 0) || 0,
    qs = (+(m.qsec ?? 0) || 15) * 1000;
  const P = g?.p || {};
  if (upto == null || upto > n) upto = n;
  const rows = Object.keys(P).map((sid) => {
    const pp = P[sid] || {},
      r = {
        sid,
        n: pp.n || '?',
        g: pp.g || '',
        at: +(pp.at ?? 0) || 0,
        s: 0,
        c: 0,
        tm: 0,
        st: 0,
        rank: 0,
      };
    for (let i = 0; i < upto!; i++) {
      const a = (at(g?.a, i) || {})[sid],
        k = at(g?.k, i),
        q = at(g?.q, i);
      if (a && k && q && +(a.c ?? NaN) === +k.c) {
        const dt = Math.max(0, Math.min(qs, (+(a.t ?? 0) || 0) - (+q.at || 0)));
        const base = Math.round(1000 * (1 - dt / qs / 2));
        r.st++;
        const bon = Math.min(500, (r.st - 1) * 100);
        r.s += base + bon;
        r.c++;
        r.tm += dt;
      } else r.st = 0;
    }
    return r;
  });
  rows.sort(
    (x, y) => y.s - x.s || y.c - x.c || x.tm - y.tm || x.at - y.at || (x.sid < y.sid ? -1 : 1),
  );
  rows.forEach((r, i) => (r.rank = i + 1));
  const cnt = rows.length,
    valid = cnt >= (+(m.min ?? 0) || 7),
    prizes: Record<string, number> = {};
  if (valid && upto === n && n > 0) {
    const big = (m.pr && +(m.pr.big ?? 0)) || 20,
      pz = (m.pr && (cnt > big ? m.pr.b : m.pr.a)) || (cnt > big ? [5, 4, 3, 2, 1] : [5, 4, 3]);
    for (let j = 0; j < pz.length && j < rows.length; j++)
      if (rows[j].s > 0) prizes[rows[j].sid] = +pz[j];
  }
  return { rows: rows as ScoreRow[], n: cnt, valid, prizes };
}

const yzWords = (t: unknown) =>
  String(t || '')
    .split(' ')
    .filter((w) => w.length > 0);
/** ⌨️ Yozuv marafoni natijasi (asl yzScore): eng uzoq yetgan nazorat nuqtasi → ertaroq yetgan. */
export function scoreRace(g: Game | null | undefined) {
  const m = (g?.meta || {}) as Partial<GameMeta>,
    P = g?.p || {},
    st = +(m.start ?? 0) || 0,
    W = +(m.nw ?? 0) || 0;
  const lim = st + (+(m.dur ?? 0) || 0) * 1000 + (m.mode === 'time' ? 1500 : 4000);
  const words = yzWords(at(g?.q, 0)?.t),
    cum: number[] = [];
  let c = 0;
  for (let k = 0; k < words.length; k++) {
    c += words[k].length + (k ? 1 : 0);
    cum.push(c);
  }
  const rows = Object.keys(P).map((sid) => {
    const pp = P[sid] || {},
      r = {
        sid,
        n: pp.n || '?',
        g: pp.g || '',
        at: +(pp.at ?? 0) || 0,
        w: 0,
        t: 0,
        ch: 0,
        sus: false,
        s: 0,
        rank: 0,
      };
    for (let i = W; i >= 1; i--) {
      const a = (at(g?.a, i) || {})[sid],
        ta = a ? +(a.t ?? 0) : 0;
      if (ta && ta >= st && ta <= lim) {
        r.w = i;
        r.t = ta - st;
        break;
      }
    }
    if (r.w) {
      r.ch = cum[r.w - 1] || 0;
      if (r.t <= 0 || (r.ch >= 20 && r.ch / (r.t / 1000) > 15)) r.sus = true;
    }
    r.s = r.w;
    return r;
  });
  rows.sort(
    (x, y) => +x.sus - +y.sus || y.w - x.w || x.t - y.t || x.at - y.at || (x.sid < y.sid ? -1 : 1),
  );
  rows.forEach((r, i) => (r.rank = i + 1));
  const cnt = rows.length,
    valid = cnt >= (+(m.min ?? 0) || 3),
    prizes: Record<string, number> = {},
    pz = m.pr?.a || [5, 4, 3];
  let j = 0;
  if (valid)
    rows.forEach((r) => {
      if (j < pz.length && !r.sus && r.w > 0) {
        prizes[r.sid] = +pz[j];
        j++;
      }
    });
  return { rows: rows as ScoreRow[], n: cnt, valid, prizes };
}
export const scoreGame = (g: Game | null | undefined) =>
  g?.meta?.type === 'yz' ? scoreRace(g) : scoreQuiz(g);
/** res/<kun> faqat shu kalitdagi hozirgi o'yinniki bo'lsa (asl khResOk). */
export const resultFits = (e: IdxEntry | undefined, r: Partial<ResEntry> | undefined) =>
  !!(r && e && (r.st != null ? +r.st === +e.start : +(r.at ?? 0) >= +(e.end ?? 0) - 60000));

/** Ko'p savolni matndan qo'shish (asl khParse): bo'sh qator — savollar orasida; 1-qator savol, keyingi 4 qator
    javob; to'g'ri javob oxirida * (yoki boshida + / ✅). Natijada to'g'ri javob doim birinchi (c: 0). */
export function parseBulk(txt: string) {
  const qs: { t: string; o: string[]; c: number }[] = [];
  let bad = 0;
  String(txt || '')
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .forEach((blk) => {
      const L = blk
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean);
      if (!L.length) return;
      const q = L[0].replace(/^\d+[.)]\s*/, '');
      let c = -1;
      const ans = L.slice(1, 5).map((a, i) => {
        if (/^[+*✅]/.test(a) || /\*\s*$/.test(a)) c = i;
        return a
          .replace(/^[A-Da-d][).]\s+/, '')
          .replace(/^[-+*✅•]\s*/, '')
          .replace(/\s*\*\s*$/, '')
          .trim();
      });
      if (q.length < 5 || ans.length !== 4 || c < 0 || ans.some((a) => !a)) {
        bad++;
        return;
      }
      qs.push({ t: q, o: [ans[c]].concat(ans.filter((_, i) => i !== c)), c: 0 });
    });
  return { qs, bad };
}
