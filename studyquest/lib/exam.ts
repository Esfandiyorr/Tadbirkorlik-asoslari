/* 🎯 Yakuniy testga tayyorgarlik («Tadbirkorlik asoslari»): 15 mavzu × 30 savol = 450 ta test. Bo'lim pullik xizmat
   (lib/services.ts PRODUCTS['yakuniy-test']); savollarni administrator mavzu bo'yicha yuklaydi
   (Sayt boshqaruvi → 🎯 Yakuniy test savollari). Talaba mavzu bo'yicha, aralash va xatolari ustida mashq qiladi;
   yakuniy sinovdan (har mavzudan FINAL.perTopic savol, FINAL.minutes daqiqa) FINAL.pass % va undan ko'p olsa —
   QR-kodli sertifikat oladi. Server — lib/server/exam.ts. Brauzer va server uchun umumiy turlar va savol o'qish shu yerda. */

export type Tri = [string, string, string];

/** Har mavzudan kutilgan savollar soni va eng ko'pi. */
export const EXAM_PER_TOPIC = 30;
export const EXAM_TOPIC_MAX = 60;
/** Yakuniy sinov: har mavzudan 3 tadan (15 mavzu — 45 savol), 60 daqiqa, 60 % va undan yuqori — sertifikat. */
export const FINAL = { perTopic: 3, minutes: 60, pass: 60 } as const;
/** Aralash mashq va xatolar ustida ishlashdagi savollar soni. */
export const MIX_SIZE = 30;

export type ExamQuestion = { q: string; o: string[]; c: number };
/** Talabaga beriladigan savol (to'g'ri javobsiz). */
export type ExamItem = { id: string; topic: string; q: string; o: string[] };
export type ExamTopic = {
  id: string;
  n: number;
  title: string;
  /** yuklangan savollar soni */
  count: number;
  /** talabaning natijasi: ishlagan, to'g'ri, oxirgi urinishda xato */
  seen: number;
  right: number;
  wrong: number;
};
export type ExamRun = {
  id: string;
  at: number;
  score: number;
  total: number;
  pct: number;
  passed: boolean;
  cert?: string;
};
export type ExamCert = {
  id: string;
  name: string;
  group?: string;
  score: number;
  total: number;
  pct: number;
  at: number;
  course: string;
  teacher: string;
};
export type ExamView = {
  /** bo'lim ochiqmi (sotib olingan yoki o'qituvchi/administrator) */
  access: boolean;
  staff: boolean;
  signedIn: boolean;
  topics: ExamTopic[];
  total: number;
  /** oxirgi urinishda xato qilingan savollar */
  mistakes: number;
  final: { count: number; minutes: number; pass: number };
  runs: ExamRun[];
  /** tugallanmagan yakuniy sinov (sahifa yangilansa davom etadi) */
  open?: { id: string; end: number; items: ExamItem[] } | null;
};
export type ExamAdminView = {
  topics: (Omit<ExamTopic, 'seen' | 'right' | 'wrong'> & {
    items: (ExamQuestion & { id: string })[];
  })[];
  total: number;
  /** bo'limi ochiq foydalanuvchilar (yangilari oldin) va berilgan sertifikatlar soni */
  buyers: { uid: string; name: string; at: number }[];
  certs: number;
};

/* ---------- 📥 savollarni matndan o'qish ---------- */
const LETTERS = 'ABCDEFabcdefАБВГДЕабвгде';
const letterIndex = (ch: string) => {
  const i = LETTERS.indexOf(ch);
  return i < 0 ? -1 : i % 6;
};
const clean = (s: string) =>
  s
    .replace(/ /g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();

/** HEMIS uslubi: savollar «++++» bilan, javoblar «====» bilan ajratiladi, to'g'ri javob oldida «#».
    ++++
    Savol matni
    ====
    #To'g'ri javob
    ====
    Noto'g'ri javob */
function parseHemis(text: string) {
  const items: ExamQuestion[] = [];
  const errors: string[] = [];
  const blocks = text
    .split(/^\s*\+{3,}\s*$/m)
    .map((b) => b.trim())
    .filter(Boolean);
  blocks.forEach((b, i) => {
    const parts = b
      .split(/^\s*={3,}\s*$/m)
      .map(clean)
      .filter(Boolean);
    const [q, ...opts] = parts;
    const marks = opts.map((o) => o.startsWith('#'));
    const o = opts.map((x) => clean(x.replace(/^#\s*/, '')));
    const n = i + 1;
    if (!q || o.length < 2) errors.push(`${n}-savol: kamida 2 ta javob kerak.`);
    else if (marks.filter(Boolean).length !== 1)
      errors.push(`${n}-savol: bitta to‘g‘ri javob «#» bilan belgilansin.`);
    else items.push({ q, o, c: marks.indexOf(true) });
  });
  return { items, errors };
}

const OPTION =
  /^\s*([*+#])?\s*([A-Fa-fА-Еа-е])\s*[).:]\s*(.*?)\s*(\(\+\)|\*|\+|✓|✅)?\s*$/;
const ANSWER = /^\s*(?:to['‘’`ʻ]?g['‘’`ʻ]?ri\s+)?(?:javob|answer|ответ)\s*[:\-–]\s*([A-Fa-fА-Еа-е])\b/i;
const NUMBER = /^\s*\d{1,3}\s*[.)]\s*/;

/** Raqamli uslub: «1. Savol?» keyin «A) …» qatorlari; to'g'ri javob oldida yoki oxirida «*» («+»), yoki alohida
    «Javob: B» qatori. Savollar orasida bo'sh qator bo'lishi shart emas. */
function parseNumbered(text: string) {
  const items: ExamQuestion[] = [];
  const errors: string[] = [];
  type Draft = { q: string[]; o: string[]; c: number; n: number };
  let cur: Draft | null = null;
  let n = 0;
  const finish = () => {
    if (!cur) return;
    const q = clean(cur.q.join(' '));
    if (!q || cur.o.length < 2) errors.push(`${cur.n}-savol: kamida 2 ta javob kerak.`);
    else if (cur.c < 0 || cur.c >= cur.o.length)
      errors.push(`${cur.n}-savol: to‘g‘ri javob belgilanmagan («*» yoki «Javob: B»).`);
    else items.push({ q, o: cur.o, c: cur.c });
    cur = null;
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/ /g, ' ');
    if (!line.trim()) continue;
    const ans = ANSWER.exec(line);
    if (ans && cur) {
      cur.c = letterIndex(ans[1]);
      continue;
    }
    const opt = OPTION.exec(line);
    if (opt && cur && (cur.o.length || cur.q.length)) {
      const marked = !!opt[1] || !!opt[4];
      const body = clean(opt[3]);
      if (marked) cur.c = cur.o.length;
      cur.o.push(body);
      continue;
    }
    if (NUMBER.test(line) || !cur || cur.o.length) {
      finish();
      n++;
      cur = { q: [line.replace(NUMBER, '')], o: [], c: -1, n };
      continue;
    }
    cur.q.push(line);
  }
  finish();
  return { items, errors };
}

/** Matndan savollar: HEMIS («++++», «====», «#») yoki raqamli («1.», «A)», «*»/«Javob: B») uslub. */
export function parseQuestions(text: string): { items: ExamQuestion[]; errors: string[] } {
  const t = String(text || '').replace(/\r\n?/g, '\n');
  const r = /^\s*\+{3,}\s*$/m.test(t) ? parseHemis(t) : parseNumbered(t);
  const items = r.items
    .map((x) => ({ q: x.q.slice(0, 600), o: x.o.slice(0, 6).map((o) => o.slice(0, 300)), c: x.c }))
    .filter((x) => x.c < x.o.length);
  return { items, errors: r.errors };
}

/** Barqaror savol kaliti (matndan): qayta yuklansa ham talabaning natijasi yo'qolmaydi. */
export function questionId(topic: string, q: string) {
  let h = 2166136261;
  for (const ch of q.trim().toLowerCase()) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return topic + '-' + h.toString(36);
}
