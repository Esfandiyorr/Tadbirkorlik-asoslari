import 'server-only';
import { randomUUID } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import type { Actor } from '../types';
import {
  SLIDES_MAX,
  SLIDES_MIN,
  SLIDE_LANGS,
  SLIDE_LEVELS,
  type Deck,
  type DeckMeta,
  type DeckRequest,
  type SavedDeck,
} from '../slides';
import { ApiError, check } from './auth';
import { demo } from './repository';
import { siteGet, siteUpdate } from './site-content';
import { premiumInfo, premiumKey, premiumState } from './premium';

/* 🎞 Taqdimot: sun'iy intellekt (Claude) talaba yozgan mavzu bo'yicha tayyor taqdimot tuzadi — sarlavha, slaydlar
   (har birida qisqa bandlar) va ma'ruzachi uchun izohlar. Talaba uni sayt ichida ko'radi va PowerPoint qilib yuklaydi.
   Pullik imkoniyat: obunachi (lib/server/premium.ts) kuniga DAILY, oyiga MONTHLY tagacha tuzadi (har bir taqdimot
   sun'iy intellekt xizmatiga pul sarflaydi — chegara xarajatni oldindan ma'lum qiladi); obunasiz foydalanuvchiga
   administrator belgilagan miqdorda bepul sinov (site/premiumInfo.free).
   Kalit — serverdagi ANTHROPIC_API_KEY (Vercel → Environment Variables); brauzerga hech qachon berilmaydi.
   Sun'iy intellektga faqat mavzu va talabning matni yuboriladi — ism, guruh yoki boshqa shaxsiy ma'lumot emas.
   site/slides/<foydalanuvchi> = {used: bepul ishlatilgani, day: {<kun>: soni}, mon: {<oy>: soni}, busy: vaqt,
   decks: {<id>: taqdimot}}. */

export const SLIDES_MODEL = 'claude-opus-5-5';
const DAILY = 5;
const MONTHLY = 40;
const DAILY_STAFF = 30;
const MONTHLY_STAFF = 300;
const KEEP = 12;
const BUSY_MS = 3 * 60000;
const day = (ms: number) => new Date(ms + 18000000).toISOString().slice(0, 10);

type Stored = {
  used?: number;
  day?: Record<string, number>;
  mon?: Record<string, number>;
  busy?: number;
  decks?: Record<string, SavedDeck>;
};

export const slidesConfigured = () =>
  demo() || !!process.env.ANTHROPIC_API_KEY || !!process.env.ANTHROPIC_AUTH_TOKEN;

const request = z
  .object({
    topic: z.string().trim().min(3).max(160),
    n: z.number().int().min(SLIDES_MIN).max(SLIDES_MAX),
    lang: z.enum(SLIDE_LANGS),
    level: z.enum(SLIDE_LEVELS),
    note: z.string().trim().max(400).optional(),
  })
  .strict();

/* Model javobining shakli (structured outputs): faqat matn va ro'yxatlar — son cheklovlari ko'rsatmada. */
const deckShape = z.object({
  title: z.string(),
  subtitle: z.string(),
  slides: z.array(
    z.object({
      title: z.string(),
      bullets: z.array(z.string()),
      notes: z.string(),
    }),
  ),
});

const clip = (s: unknown, n: number) =>
  String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, n);
/** Model javobini tartibga keltirish: uzunliklar, bandlar soni, bo'sh slaydlar. */
export function tidyDeck(raw: unknown, want: number): Deck {
  const d = deckShape.parse(raw);
  const slides = d.slides
    .map((s) => ({
      title: clip(s.title, 110),
      bullets: s.bullets
        .map((b) => clip(b, 220))
        .filter(Boolean)
        .slice(0, 6),
      notes: clip(s.notes, 700),
    }))
    .filter((s) => s.title && s.bullets.length)
    .slice(0, Math.min(SLIDES_MAX, want));
  check(
    slides.length >= 3,
    502,
    'Sun’iy intellekt taqdimotni to‘liq tuza olmadi. Qayta urinib ko‘ring.',
  );
  return { title: clip(d.title, 140), subtitle: clip(d.subtitle, 200), slides };
}

const LANG_NAME = {
  uz: 'Uzbek (Latin script, with the letters o‘ and g‘)',
  ru: 'Russian',
  en: 'English',
} as const;
const LEVEL_NOTE = {
  simple:
    'The audience is new to the subject: plain words, everyday examples, no jargon without a short explanation.',
  student:
    'The audience is university students: correct terms, clear definitions, one concrete example per idea.',
  expert:
    'The audience already knows the basics: go deeper — mechanisms, trade-offs, comparisons, and practical application.',
} as const;

function instructions(r: DeckRequest) {
  return [
    'You write presentation decks for university students in Uzbekistan. A student gives you a topic; they will present the deck in class, so it has to be accurate, well structured and easy to speak from.',
    `Write everything in ${LANG_NAME[r.lang]}.`,
    LEVEL_NOTE[r.level],
    `Produce exactly ${r.n} slides, in this order: the first slide introduces the topic and why it matters; the middle slides each develop one idea, in a logical sequence; the last slide gives the conclusions.`,
    'Each slide has a short title (no numbering), 3 to 5 bullets, and speaker notes. A bullet is one complete thought of at most about 18 words — the audience reads it at a glance. The speaker notes are 2 to 4 sentences the student can say aloud: they explain and connect the bullets rather than repeat them.',
    'The deck title is short and specific; the subtitle is one line saying what the listener will learn.',
    'Use only facts you are confident about. Where a precise figure, date or name is uncertain, describe the point in general terms instead of inventing a number. Do not include links, images, or placeholders.',
    'Plain text only: no markdown, no emoji in titles, no bullet symbols at the start of a bullet.',
  ].join('\n\n');
}

/** Demo va sinovlar uchun (tashqi xizmatga so'rov yuborilmaydi): mavzudan oddiy namunaviy taqdimot. */
function sampleDeck(r: DeckRequest): Deck {
  const w =
    r.lang === 'ru'
      ? {
          why: 'Почему это важно',
          idea: 'Главная мысль',
          end: 'Выводы',
          sub: 'Краткий обзор темы',
          b: 'Пункт',
          n: 'Пояснение для докладчика.',
        }
      : r.lang === 'en'
        ? {
            why: 'Why it matters',
            idea: 'Key idea',
            end: 'Conclusions',
            sub: 'A short overview of the topic',
            b: 'Point',
            n: 'A note for the speaker.',
          }
        : {
            why: 'Nima uchun muhim',
            idea: 'Asosiy g‘oya',
            end: 'Xulosa',
            sub: 'Mavzuning qisqa sharhi',
            b: 'Band',
            n: 'Ma’ruzachi uchun izoh.',
          };
  return {
    title: r.topic,
    subtitle: w.sub,
    slides: Array.from({ length: r.n }, (_, i) => ({
      title: i === 0 ? w.why : i === r.n - 1 ? w.end : `${w.idea} ${i}`,
      bullets: [1, 2, 3].map((k) => `${w.b} ${k}: ${r.topic}`),
      notes: w.n,
    })),
  };
}

/** Sinovlar uchun: generatorni almashtirish (null — odatiy). */
let generator: ((r: DeckRequest) => Promise<unknown>) | null = null;
export function setSlidesGenerator(g: typeof generator) {
  generator = g;
}

async function generate(r: DeckRequest): Promise<unknown> {
  if (generator) return generator(r);
  if (demo()) return sampleDeck(r);
  const client = new Anthropic();
  try {
    // Uzoq javob: oqim bilan olinadi (vaqt tugab qolmasin), tayyor xabar kutiladi.
    const stream = client.beta.messages.stream({
      model: SLIDES_MODEL,
      max_tokens: 16000,
      // Rad etilsa — server o'zi zaxira modelda qayta urinadi (xavfsizlik filtri noto'g'ri ishlagan holatlar uchun).
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: zodOutputFormat(deckShape) },
      system: instructions(r),
      messages: [
        {
          role: 'user',
          content:
            `Topic: ${r.topic}` + (r.note ? `\n\nThe student's additional wishes: ${r.note}` : ''),
        },
      ],
    });
    const message = await stream.finalMessage();
    if (message.stop_reason === 'refusal')
      throw new ApiError(
        422,
        'Bu mavzu bo‘yicha taqdimot tuzib bo‘lmadi. Mavzuni boshqacha yozib ko‘ring.',
      );
    if (message.stop_reason === 'max_tokens')
      throw new ApiError(
        502,
        'Taqdimot juda uzun chiqdi. Slaydlar sonini kamaytirib qayta urinib ko‘ring.',
      );
    const text = message.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim();
    try {
      return JSON.parse(text);
    } catch {
      throw new ApiError(502, 'Sun’iy intellekt javobi o‘qilmadi. Qayta urinib ko‘ring.');
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError)
      throw new ApiError(
        503,
        'Sun’iy intellekt xizmati kaliti noto‘g‘ri. Administratorga xabar bering.',
      );
    if (e instanceof Anthropic.RateLimitError)
      throw new ApiError(429, 'Hozir so‘rovlar ko‘p. Bir daqiqadan keyin qayta urinib ko‘ring.');
    if (e instanceof Anthropic.BadRequestError)
      throw new ApiError(
        502,
        'Sun’iy intellekt so‘rovni qabul qilmadi. Administratorga xabar bering.',
      );
    if (e instanceof Anthropic.APIError)
      throw new ApiError(
        502,
        'Sun’iy intellekt xizmati vaqtincha javob bermayapti. Birozdan keyin urinib ko‘ring.',
      );
    throw e;
  }
}

const meta = (d: SavedDeck): DeckMeta => ({
  id: d.id,
  topic: d.topic,
  title: d.title,
  n: d.n,
  lang: d.lang,
  at: d.at,
});

/** Taqdimot bo'limi holati: xizmat ulanganmi, obuna, bepul sinov qoldig'i, bugungi limit va saqlangan taqdimotlar. */
export async function slidesView(a: Actor, now = Date.now()) {
  const key = premiumKey(a.id);
  const [st, premium, info] = await Promise.all([
    siteGet<Stored>('slides/' + key),
    premiumState(a, now),
    premiumInfo(),
  ]);
  const today = Number(st?.day?.[day(now)]) || 0,
    month = Number(st?.mon?.[day(now).slice(0, 7)]) || 0;
  const cap = premium.staff ? DAILY_STAFF : DAILY,
    monthCap = premium.staff ? MONTHLY_STAFF : MONTHLY;
  const freeLeft = premium.active ? 0 : Math.max(0, info.free - (Number(st?.used) || 0));
  const todayLeft = Math.max(0, Math.min(cap - today, monthCap - month));
  return {
    configured: slidesConfigured(),
    premium,
    info,
    freeLeft,
    todayLeft,
    monthLeft: Math.max(0, monthCap - month),
    can: premium.active ? todayLeft > 0 : freeLeft > 0,
    decks: Object.values(st?.decks || {})
      .filter((d) => d && d.deck)
      .sort((x, y) => y.at - x.at)
      .map(meta),
    now,
  };
}
export type SlidesView = Awaited<ReturnType<typeof slidesView>>;

/** Yangi taqdimot tuzish. Ruxsat: obuna (kunlik limit bilan) yoki bepul sinov qoldig'i. */
export async function makeDeck(a: Actor, raw: unknown, now = Date.now()) {
  const r = request.parse(raw) as DeckRequest;
  check(
    slidesConfigured(),
    503,
    'Sun’iy intellekt xizmati hali ulanmagan. Tez orada ishga tushadi.',
  );
  const key = premiumKey(a.id),
    path = 'slides/' + key;
  const [st, premium, info] = await Promise.all([
    siteGet<Stored>(path),
    premiumState(a, now),
    premiumInfo(),
  ]);
  const used = Number(st?.used) || 0,
    today = Number(st?.day?.[day(now)]) || 0,
    ym = day(now).slice(0, 7),
    month = Number(st?.mon?.[ym]) || 0;
  if (premium.active) {
    check(
      month < (premium.staff ? MONTHLY_STAFF : MONTHLY),
      429,
      'Bu oydagi limit tugadi. Keyingi oy boshida yana taqdimot tuzishingiz mumkin.',
    );
    check(
      today < (premium.staff ? DAILY_STAFF : DAILY),
      429,
      'Bugungi limit tugadi. Ertaga yana taqdimot tuzishingiz mumkin.',
    );
  } else check(used < info.free, 402, 'Bepul taqdimotlar tugadi. Davom etish uchun obuna bo‘ling.');
  check(
    !(Number(st?.busy) > now - BUSY_MS),
    409,
    'Oldingi taqdimot hali tayyorlanmoqda. Biroz kuting.',
  );
  await siteUpdate({ [path + '/busy']: now });
  let deck: Deck;
  try {
    deck = tidyDeck(await generate(r), r.n);
  } catch (e) {
    await siteUpdate({ [path + '/busy']: null }).catch(() => {});
    throw e;
  }
  const id = now.toString(36) + '-' + randomUUID().slice(0, 8);
  const saved: SavedDeck = {
    id,
    topic: r.topic,
    title: deck.title || r.topic,
    n: deck.slides.length,
    lang: r.lang,
    at: now,
    deck,
  };
  // eng eski taqdimotlar o'chiriladi (har foydalanuvchida oxirgi KEEP tasi saqlanadi)
  const old = Object.values(st?.decks || {})
    .filter(Boolean)
    .sort((x, y) => y.at - x.at)
    .slice(KEEP - 1);
  await siteUpdate({
    [path + '/busy']: null,
    [path + '/decks/' + id]: saved,
    [path + '/day']: { [day(now)]: today + 1 },
    [path + '/mon']: { [ym]: month + 1 },
    ...(premium.active ? {} : { [path + '/used']: used + 1 }),
    ...Object.fromEntries(old.map((d) => [path + '/decks/' + d.id, null])),
  });
  return { deck: saved, view: await slidesView(a, now) };
}

const deckId = z.string().regex(/^[a-z0-9-]{2,40}$/);
export async function readDeck(a: Actor, id: unknown) {
  const d = await siteGet<SavedDeck>('slides/' + premiumKey(a.id) + '/decks/' + deckId.parse(id));
  check(d && d.deck, 404, 'Taqdimot topilmadi.');
  return d!;
}
export async function removeDeck(a: Actor, id: unknown, now = Date.now()) {
  await siteUpdate({ ['slides/' + premiumKey(a.id) + '/decks/' + deckId.parse(id)]: null });
  return slidesView(a, now);
}
