'use client';
import { CalendarClock, ClipboardCheck, Keyboard, Radio } from 'lucide-react';
import { useApp } from './provider';
import { HeroAvatar, type AcademicBoard } from './avatars';
import { canJoinLive, gameName, gamePath, useNews, type LiveGame } from './announcements';
import { SubscriberMark } from './premium';
import { accessOf, topicPoints, tr } from '@/lib/points';
import type { Data, Lang, Lesson } from '@/lib/types';

/* 🏠 Bosh sahifa banneri (binafsha gradient): chapda — bugungi sana (Toshkent vaqti) kichik yozuvda, talabaning ismi
   katta yozuvda (faol Premium bo'lsa — oldida olmos) va «Bugungi rejalar»: bugun muddati tugaydigan ball beriladigan
   mavzular va bugungi jonli o'yinlar, vaqti bo'yicha. O'ngda — talaba tanlagan avatar (cho'zilmaydi) yoki
   «Avatar qo'yish» (avatarlar kutubxonasi ochiladi). */

const TZ = 18000000; // Toshkent: UTC+5
const navigate = (view: string) => {
  location.hash = view;
};
const dayOf = (t: number) => new Date(t + TZ).toISOString().slice(0, 10);
const clock = (t: number) => {
  const d = new Date(t + TZ);
  return (
    String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0')
  );
};
const WEEK: Record<Lang, string[]> = {
  uz: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
};
const MONTHS: Record<Lang, string[]> = {
  uz: 'yanvar fevral mart aprel may iyun iyul avgust sentabr oktabr noyabr dekabr'.split(' '),
  en: 'January February March April May June July August September October November December'.split(
    ' ',
  ),
  ru: 'января февраля марта апреля мая июня июля августа сентября октября ноября декабря'.split(
    ' ',
  ),
};
/** «Seshanba, 24-noyabr» — Toshkent vaqti bo'yicha. */
export function todayLabel(lang: Lang, now = Date.now()) {
  const d = new Date(now + TZ),
    day = d.getUTCDate(),
    m = MONTHS[lang][d.getUTCMonth()];
  const date = lang === 'uz' ? `${day}-${m}` : lang === 'ru' ? `${day} ${m}` : `${m} ${day}`;
  return WEEK[lang][d.getUTCDay()] + ', ' + date;
}

export type Plan = {
  key: string;
  at: number;
  kind: 'topic' | 'quiz' | 'yz';
  title: string;
  /** «23:59 gacha» yoki «15:00 da» */
  when: string;
  go: () => void;
};
/** Bugungi rejalar: bugun (Toshkent) muddati tugaydigan, hali to'liq ball olinmagan mavzular va bugungi jonli o'yin. */
export function todayPlans(
  d: Data,
  lessons: Lesson[],
  live: LiveGame | null,
  lang: Lang,
  open: (l: Lesson) => void,
  now = Date.now(),
): Plan[] {
  const today = dayOf(now);
  const plans: Plan[] = [];
  for (const l of lessons) {
    const a = accessOf(d, l.id);
    if (a?.state !== 'score' || !a.due || a.due < now || dayOf(a.due) !== today) continue;
    if (topicPoints(d.user?.readingHistory?.[l.id]).total >= 100) continue;
    plans.push({
      key: 'topic-' + l.id,
      at: a.due,
      kind: 'topic',
      title: `${l.order + 1}-${tr(lang, 'mavzu', 'topic', 'тема')}: ${l.title}`,
      when: tr(lang, `${clock(a.due)} gacha`, `until ${clock(a.due)}`, `до ${clock(a.due)}`),
      go: () => open(l),
    });
  }
  if (
    live &&
    live.end > now &&
    dayOf(live.start) === today &&
    canJoinLive(d.user || undefined, live)
  )
    plans.push({
      key: 'live',
      at: live.start,
      kind: live.type,
      title: gameName(live, lang),
      when:
        live.start <= now
          ? tr(lang, 'hozir', 'now', 'сейчас')
          : tr(
              lang,
              `${clock(live.start)} da`,
              `at ${clock(live.start)}`,
              `в ${clock(live.start)}`,
            ),
      go: () => navigate(gamePath(live)),
    });
  return plans.sort((x, y) => x.at - y.at);
}

const PLAN_ICON = { topic: ClipboardCheck, quiz: Radio, yz: Keyboard } as const;

export function HomeBanner({
  name,
  board,
  avatarSpot,
  premium,
  lessons,
  open,
}: {
  name: string;
  board: AcademicBoard;
  /** avatar joyi (faqat talabaga) */
  avatarSpot: boolean;
  /** faol Premium obunachi — ism oldida Premium belgisi */
  premium: boolean;
  lessons: Lesson[];
  open: (l: Lesson) => void;
}) {
  const { data, lang } = useApp();
  const { data: news, now } = useNews();
  const n = now();
  const plans = todayPlans(data!, lessons, news?.live || null, lang, open, n);
  return (
    <section className={'home-banner' + (avatarSpot ? ' has-avatar-spot' : '')}>
      <div className="hb-main">
        <p className="hb-date">
          <CalendarClock size={15} aria-hidden="true" /> {todayLabel(lang, n)}
        </p>
        <h1 className="hb-name">
          <span>{name}</span>
          {premium && <SubscriberMark />}
        </h1>
        <div className="hb-plans">
          <h2>{tr(lang, 'Bugungi rejalar', 'Today’s plans', 'Планы на сегодня')}</h2>
          {plans.length ? (
            <ul>
              {plans.slice(0, 4).map((p) => {
                const Icon = PLAN_ICON[p.kind];
                return (
                  <li key={p.key}>
                    <button type="button" onClick={p.go}>
                      <Icon size={16} aria-hidden="true" />
                      <span className="hb-plan-title">{p.title}</span>
                      <em>{p.when}</em>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="hb-empty">
              {tr(
                lang,
                'Bugun rejalashtirilgan ish yo‘q',
                'Nothing is planned for today',
                'На сегодня ничего не запланировано',
              )}
            </p>
          )}
        </div>
      </div>
      {avatarSpot && (
        <div className="hb-avatar">{board.loading ? null : <HeroAvatar board={board} />}</div>
      )}
    </section>
  );
}
