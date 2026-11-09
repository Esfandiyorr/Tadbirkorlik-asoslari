import type { Data, Lang, LessonAccess, ReadingHistory } from './types';

/** Uch tilli matn: o'zbekcha, inglizcha, ruscha. */
export const tr = (lang: Lang, uz: string, en: string, ru: string) =>
  lang === 'en' ? en : lang === 'ru' ? ru : uz;

export type TopicPoints = {
  slides: number;
  time: number;
  test: number;
  task?: number;
  total: number;
  remaining: number;
};

/** Mavzu bali: 30 — slaydlar, 20 — o'qish vaqti (1 soat), 50 — test (8-mavzuda: test 25 + logotip 25). Jami 100. */
export function topicPoints(h?: ReadingHistory): TopicPoints {
  const p = h?.parts || { slides: 0, time: 0, test: 0 };
  const sum = Math.round((p.slides + p.time + p.test + (p.task || 0)) * 10) / 10;
  const total = Math.min(100, h?.score !== undefined ? h.score : sum);
  return { ...p, total, remaining: Math.max(0, Math.round((100 - total) * 10) / 10) };
}

/** 74.5 → «74,5»; butun sonlar o'zgarishsiz. */
export const num = (n: number) =>
  Number.isInteger(n) ? String(n) : (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');

/** Talaba uchun mavzu holati; o'qituvchi/administrator va noma'lum holatda — undefined. */
export function accessOf(d: Data, id: string): LessonAccess | undefined {
  const role = d.user?.role;
  if (!d.user || role === 'teacher' || role === 'admin') return undefined;
  return d.lessonAccess?.[id];
}

const TZ = 18000000; // Toshkent vaqti (UTC+5)
const monthsUz = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
];
const monthsEn = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const monthsRu = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];
/** Muddat: «8-noyabr, 23:59» va «4 kun qoldi». */
export function dueText(due: number, lang: Lang, now = Date.now()) {
  const d = new Date(due + TZ),
    day = d.getUTCDate(),
    m = d.getUTCMonth(),
    time =
      String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
  const date = tr(
    lang,
    `${day}-${monthsUz[m]}, ${time}`,
    `${monthsEn[m]} ${day}, ${time}`,
    `${day} ${monthsRu[m]}, ${time}`,
  );
  const ms = Math.max(0, due - now),
    days = Math.floor(ms / 86400000),
    hours = Math.floor((ms % 86400000) / 3600000);
  const left =
    ms <= 0
      ? tr(lang, 'muddat tugadi', 'deadline passed', 'срок истёк')
      : days >= 1
        ? tr(lang, `${days} kun qoldi`, `${days} days left`, `осталось ${days} дн.`)
        : hours >= 1
          ? tr(lang, `${hours} soat qoldi`, `${hours} hours left`, `осталось ${hours} ч`)
          : tr(lang, 'oz qoldi', 'almost over', 'почти истёк');
  return { date, left, urgent: ms < 2 * 86400000 };
}

export type Hint = { key: 'slides' | 'time' | 'test' | 'task'; text: string; points: number };
/** Qolgan ballni qanday olish mumkin — aniq qadamlar. */
export function pointHints(h: ReadingHistory | undefined, lang: Lang): Hint[] {
  if (!h) return [];
  const p = topicPoints(h),
    out: Hint[] = [];
  const slidesLeft = Math.max(0, h.totalSlides - h.seenSlides);
  if (p.slides < 30 && slidesLeft > 0)
    out.push({
      key: 'slides',
      text: tr(
        lang,
        `Yana ${slidesLeft} ta slaydni oching`,
        `Open ${slidesLeft} more slides`,
        `Откройте ещё ${slidesLeft} слайд(ов)`,
      ),
      points: Math.round((30 - p.slides) * 10) / 10,
    });
  const minutes = Math.ceil(Math.max(0, 3600 - h.seconds) / 60);
  if (p.time < 20 && minutes > 0)
    out.push({
      key: 'time',
      text: tr(
        lang,
        `Yana ${minutes} daqiqa o‘qing`,
        `Read for ${minutes} more minutes`,
        `Читайте ещё ${minutes} мин`,
      ),
      points: Math.round((20 - p.time) * 10) / 10,
    });
  const total = h.quizTotal || 15,
    missing = Math.max(0, total - h.correctAnswers),
    testMax = h.testMax ?? 50;
  if (p.test < testMax && missing > 0)
    out.push({
      key: 'test',
      text: h.correctAnswers
        ? tr(
            lang,
            `Testda yana ${missing} ta to‘g‘ri javob`,
            `${missing} more correct test answers`,
            `Ещё ${missing} верных ответов в тесте`,
          )
        : tr(lang, 'Yakuniy testni ishlang', 'Take the final test', 'Пройдите итоговый тест'),
      points: Math.round((testMax - p.test) * 10) / 10,
    });
  if (h.taskMax && p.task === undefined)
    out.push({
      key: 'task',
      text: tr(
        lang,
        'Logotip topshirig‘ini yuboring — o‘qituvchi baholaydi',
        'Send the logo assignment — the teacher grades it',
        'Отправьте задание «Логотип» — его оценит преподаватель',
      ),
      points: h.taskMax,
    });
  return out;
}

/** Barcha mavzular bo'yicha yig'indi. */
export function courseTotals(d: Data) {
  const h = d.user?.readingHistory || {},
    ids = d.lessons.map((l) => l.id);
  let points = 0,
    read = 0,
    started = 0,
    seconds = 0,
    perfect = 0,
    fullTest = 0,
    fullTime = 0,
    grade5 = 0;
  for (const id of ids) {
    const x = h[id];
    if (!x) continue;
    const p = topicPoints(x);
    points += p.total;
    if (x.status === 'read') read++;
    if (x.status !== 'new') started++;
    seconds += x.seconds || 0;
    if (p.total >= 99.95) perfect++;
    if (p.test >= 49.95) fullTest++;
    if (p.time >= 19.95) fullTime++;
    if (x.grade === 5) grade5++;
  }
  return {
    points: Math.round(points * 10) / 10,
    max: ids.length * 100,
    read,
    started,
    seconds,
    perfect,
    fullTest,
    fullTime,
    grade5,
    lessons: ids.length,
  };
}

/** 4500 s → «1 soat 15 daq». */
export function durationText(seconds: number, lang: Lang) {
  const h = Math.floor(seconds / 3600),
    m = Math.floor((seconds % 3600) / 60);
  if (h) return tr(lang, `${h} soat ${m} daq`, `${h} h ${m} min`, `${h} ч ${m} мин`);
  return tr(lang, `${m} daq`, `${m} min`, `${m} мин`);
}
