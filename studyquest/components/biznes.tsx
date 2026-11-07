'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bot, Copy, LogIn, Users } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import { navigate } from './dashboard';
import { arenaBase, newCode, ROOM_CODE, rt, seg, type ArenaMe } from './arena-online';
import { DecisionForm, FinalReport, MonthReport, BizHeader, mln } from './biznes-play';
import {
  BOT_NAMES,
  BUSINESSES,
  RULES,
  bizOf,
  botDecision,
  clampDecision,
  earned,
  replay,
  tx,
  type BizId,
  type BotLevel,
  type Decision,
  type Lang,
} from '@/lib/biznes';

/* 💼 «Biznes» — O'yin maydonidagi tadbirkorlik bellashuvi: bot bilan yoki kursdosh bilan (12 oy, 12 raund).
   Kursdoshlar o'yini asl arena bazasida: arena/biz/<KOD> = {meta: {biz, seed, host}, p: {o'yinchilar}, d: {m<oy>: {id: qaror}},
   s: {id: so'nggi faollik}}; taklif — arena/binv/<kimga>/<kimdan>. Har kim faqat o'z qarorini yozadi, natijani ikkalasi
   ham bir xil hisoblaydi (lib/biznes.ts deterministik). Natija reytingga qo'shilmaydi — bu mashq o'yini. */

const SAVE = 'biz_bot_v1',
  BEST = 'biz_best_v1',
  TURN_SECONDS = 150;
const useLang = () => useApp().lang as Lang;
const useT = () => {
  const lang = useLang();
  return (uz: string, en: string, ru: string) => tx(lang, [uz, en, ru]);
};
type BotSave = {
  biz: BizId;
  level: BotLevel;
  seed: number;
  months: [Decision, Decision][];
  seen: number;
};
const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
function load<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}
function store(key: string, v: unknown) {
  try {
    if (v === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(v));
  } catch {}
}
const fullName = (m: ArenaMe | null) => (m ? [m.name, m.surname].filter(Boolean).join(' ') : '');

/** Kursdosh bilan o'yin uchun xona ochish (taklif yuborilsa — `to` bilan). Xona kodini qaytaradi. */
export async function createBizRoom(
  base: string,
  me: ArenaMe,
  biz: BizId,
  to?: { id: string; name: string },
) {
  let code = newCode();
  for (let k = 0; k < 4 && (await rt(base, 'GET', seg('biz', code, 'meta'))); k++) code = newCode();
  const now = { '.sv': 'timestamp' };
  await rt(base, 'PUT', seg('biz', code), {
    meta: {
      v: 1,
      biz,
      seed: randomSeed(),
      host: me.id,
      at: now,
      ...(to ? { to: to.id, toName: to.name } : {}),
    },
    p: { [me.id]: { n: me.name, s: me.surname, g: me.group, at: now } },
  });
  await rt(base, 'PUT', seg('bizidx', code), now).catch(() => {});
  void cleanup(base);
  return code;
}
/** Bir kundan eski xonalarni tozalash (bir martada ko'pi bilan 10 ta). */
async function cleanup(base: string) {
  try {
    const idx = (await rt<Record<string, number>>(base, 'GET', 'bizidx')) || {};
    const old = Object.entries(idx)
      .filter(([, at]) => typeof at === 'number' && Date.now() - at > 86400000)
      .slice(0, 10);
    for (const [code] of old) {
      await rt(base, 'DELETE', seg('biz', code)).catch(() => {});
      await rt(base, 'DELETE', seg('bizidx', code)).catch(() => {});
    }
  } catch {}
}

export function BiznesGame({ code, me }: { code?: string; me: ArenaMe | null }) {
  const L = useT();
  return (
    <div className="bz">
      <div className="arena-bar">
        <Button variant="ghost" onClick={() => navigate(code ? 'arena/biznes' : 'arena')}>
          <ArrowLeft size={18} />
          {code ? L('Biznes', 'Business', 'Бизнес') : L('Barcha o‘yinlar', 'All games', 'Все игры')}
        </Button>
        <h1>💼 {L('Biznes', 'Business', 'Бизнес')}</h1>
      </div>
      {code ? <RoomGame code={code} me={me} /> : <BotOrHome me={me} />}
    </div>
  );
}

function BotOrHome({ me }: { me: ArenaMe | null }) {
  const [game, setGame] = useState<BotSave | null>(() =>
    typeof window === 'undefined' ? null : load<BotSave>(SAVE),
  );
  const [home, setHome] = useState(true);
  if (game && !home)
    return <BotGame save={game} me={me} onChange={setGame} onQuit={() => setHome(true)} />;
  return (
    <Home
      me={me}
      saved={game}
      onContinue={() => setHome(false)}
      onBot={(biz, level) => {
        const s: BotSave = { biz, level, seed: randomSeed(), months: [], seen: 0 };
        store(SAVE, s);
        setGame(s);
        setHome(false);
      }}
    />
  );
}

function Home({
  me,
  saved,
  onContinue,
  onBot,
}: {
  me: ArenaMe | null;
  saved: BotSave | null;
  onContinue: () => void;
  onBot: (biz: BizId, level: BotLevel) => void;
}) {
  const lang = useLang(),
    L = useT(),
    { data, toast } = useApp();
  const [biz, setBiz] = useState<BizId>('kofe'),
    [joinCode, setJoinCode] = useState(''),
    [busy, setBusy] = useState(false);
  const base = useMemo(() => arenaBase(data?.mode === 'demo'), [data?.mode]);
  const best = typeof window === 'undefined' ? null : load<Record<string, number>>(BEST);
  const savedGame = useMemo(
    () => (saved ? replay(saved.biz, saved.seed, saved.months) : null),
    [saved],
  );
  const canDuel = !!me && !!base;
  async function openRoom() {
    if (!me || !base) return;
    setBusy(true);
    try {
      navigate('arena/biznes/' + (await createBizRoom(base, me, biz)));
    } catch {
      toast(
        L(
          'Xona ochilmadi — internetni tekshiring',
          'Could not open a room — check the connection',
          'Не удалось открыть комнату — проверьте интернет',
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="bz-home">
      <section className="bz-hero">
        <div>
          <span className="bz-kicker">
            {L('Tadbirkorlik simulyatori', 'Business simulator', 'Бизнес-симулятор')}
          </span>
          <h2>
            {L(
              '12 oy — 12 raund. Kim ko‘proq pul ishlab topadi?',
              '12 months — 12 rounds. Who earns more?',
              '12 месяцев — 12 раундов. Кто заработает больше?',
            )}
          </h2>
          <p>
            {L(
              `Siz va raqibingiz bir xil biznesni ${RULES.startCash} mln so‘m kapital bilan boshlaysiz. Har oy narxni, xaridni, reklama va sifatga sarflanadigan pulni, kredit va kengayishni o‘zingiz hal qilasiz. Har oy yangi vaziyat chiqadi — kurs ko‘tariladi, xodim ish haqi so‘raydi, bloger reklama taklif qiladi… 12-oy oxirida sof kapitali ko‘p bo‘lgan yutadi.`,
              `You and your rival start the same business with ${RULES.startCash} mln so‘m. Each month you set the price, the purchase, ad and quality budgets, loans and growth. Every month brings a new situation — the dollar rises, staff ask for a raise, a blogger offers an ad… After month 12, the higher net worth wins.`,
              `Вы и соперник начинаете одинаковый бизнес с капиталом ${RULES.startCash} млн сум. Каждый месяц вы решаете цену, закупку, бюджеты на рекламу и качество, кредиты и рост. Каждый месяц — новая ситуация. После 12-го месяца побеждает тот, у кого больше капитал.`,
            )}
          </p>
          <ul
            className="bz-learn"
            aria-label={L('Nimani o‘rganasiz', 'What you learn', 'Чему научитесь')}
          >
            {[
              L('narx belgilash', 'pricing', 'ценообразование'),
              L('talabni prognozlash', 'demand forecasting', 'прогноз спроса'),
              L('pulni taqsimlash', 'allocating money', 'распределение денег'),
              L('kredit va foiz', 'loans and interest', 'кредиты и проценты'),
              L('investitsiya', 'investment', 'инвестиции'),
              L('raqobat strategiyasi', 'competitive strategy', 'конкуренция'),
              L('xavfni boshqarish', 'risk management', 'управление рисками'),
            ].map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <span className="bz-hero-art" aria-hidden="true">
          <i>☕</i>
          <i>📈</i>
          <i>💰</i>
          <i>🏦</i>
        </span>
      </section>
      {saved && savedGame && !savedGame.over && (
        <div className="bz-card bz-continue">
          <span>
            {bizOf(saved.biz).icon}{' '}
            {L(
              `Tugallanmagan o‘yin: ${tx(lang, bizOf(saved.biz).name)}, ${savedGame.month}-oy, raqib ${tx(lang, BOT_NAMES[saved.level])}`,
              `Unfinished game: ${tx(lang, bizOf(saved.biz).name)}, month ${savedGame.month}, rival ${tx(lang, BOT_NAMES[saved.level])}`,
              `Незаконченная игра: ${tx(lang, bizOf(saved.biz).name)}, месяц ${savedGame.month}`,
            )}
          </span>
          <Button onClick={onContinue}>▶ {L('Davom ettirish', 'Continue', 'Продолжить')}</Button>
        </div>
      )}
      <section className="bz-card" aria-labelledby="bz-h1">
        <h3 id="bz-h1">1. {L('Biznesni tanlang', 'Choose a business', 'Выберите бизнес')}</h3>
        <div className="bz-biz" role="radiogroup" aria-labelledby="bz-h1">
          {BUSINESSES.map((x) => (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={biz === x.id}
              className={biz === x.id ? 'is-on' : ''}
              onClick={() => setBiz(x.id)}
            >
              <span className="bz-biz-icon" aria-hidden="true">
                {x.icon}
              </span>
              <b>{tx(lang, x.name)}</b>
              <small>{tx(lang, x.about)}</small>
              <small className="bz-biz-season">📅 {tx(lang, x.seasonNote)}</small>
              {best?.[x.id] != null && (
                <small className="bz-best">
                  🏅 {L('Eng yaxshi natijangiz', 'Your best', 'Ваш рекорд')}:{' '}
                  {mln(best[x.id], lang, true)}
                </small>
              )}
            </button>
          ))}
        </div>
      </section>
      <section className="bz-card" aria-labelledby="bz-h2">
        <h3 id="bz-h2">2. {L('Raqibni tanlang', 'Choose your rival', 'Выберите соперника')}</h3>
        <div className="bz-rivals">
          <div className="bz-rival">
            <h4>
              <Bot size={18} /> {L('Bot bilan', 'Against a bot', 'С ботом')}
            </h4>
            <p className="muted">
              {L(
                'Istalgan payt, vaqt cheklanmagan.',
                'Any time, no time limit.',
                'В любое время, без ограничения.',
              )}
            </p>
            {([0, 1, 2] as BotLevel[]).map((lv) => (
              <Button
                key={lv}
                variant={lv === 1 ? 'default' : 'outline'}
                onClick={() => onBot(biz, lv)}
              >
                {tx(lang, BOT_NAMES[lv])}
              </Button>
            ))}
          </div>
          <div className="bz-rival">
            <h4>
              <Users size={18} /> {L('Kursdosh bilan', 'Against a classmate', 'С однокурсником')}
            </h4>
            {canDuel ? (
              <>
                <p className="muted">
                  {L(
                    `Xona oching va kodni do‘stingizga ayting yoki «O‘yin maydoni»dagi «Hozir onlayn» ro‘yxatidan taklif yuboring. Har oyga ${Math.round((TURN_SECONDS / 60) * 10) / 10} daqiqa.`,
                    `Open a room and share the code, or invite someone from “Online now” on the Arena page. ${Math.round((TURN_SECONDS / 60) * 10) / 10} minutes per month.`,
                    `Откройте комнату и сообщите код или пригласите из списка «Сейчас онлайн». ${Math.round((TURN_SECONDS / 60) * 10) / 10} мин. на месяц.`,
                  )}
                </p>
                <Button disabled={busy} onClick={() => void openRoom()}>
                  ➕ {L('Xona ochish', 'Open a room', 'Открыть комнату')}
                </Button>
                <form
                  className="bz-join"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const c = joinCode.trim().toUpperCase();
                    if (ROOM_CODE.test(c)) navigate('arena/biznes/' + c);
                    else
                      toast(
                        L(
                          'Kod 4 ta belgidan iborat',
                          'The code has 4 characters',
                          'Код из 4 символов',
                        ),
                      );
                  }}
                >
                  <input
                    aria-label={L('Xona kodi', 'Room code', 'Код комнаты')}
                    placeholder={L('Kod, masalan K7QM', 'Code, e.g. K7QM', 'Код, напр. K7QM')}
                    maxLength={4}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  />
                  <Button type="submit" variant="outline">
                    <LogIn size={16} />
                    {L('Qo‘shilish', 'Join', 'Войти')}
                  </Button>
                </form>
              </>
            ) : (
              <p className="muted">
                {me
                  ? L(
                      'Kursdosh bilan onlayn o‘yin bu (demo) muhitda o‘chirilgan.',
                      'Online games with classmates are off in this (demo) environment.',
                      'Онлайн-игра с однокурсником в этой (демо) среде отключена.',
                    )
                  : L(
                      'Kursdosh bilan o‘ynash uchun guruh arenasiga talaba hisobingiz bilan kiring.',
                      'Sign in with your student account to play against classmates.',
                      'Чтобы играть с однокурсником, войдите под студенческим аккаунтом.',
                    )}
              </p>
            )}
          </div>
        </div>
      </section>
      <details className="bz-card bz-rules">
        <summary>📘 {L('O‘yin qoidalari', 'How to play', 'Правила игры')}</summary>
        <ul>
          <li>
            {L(
              'Har oy: avval vaziyat (agar bo‘lsa) bo‘yicha qaror, so‘ng narx, xarid, reklama, sifat, kredit va filial.',
              'Each month: decide on the situation (if any), then price, purchase, ads, quality, loans and branches.',
              'Каждый месяц: решение по ситуации, затем цена, закупка, реклама, качество, кредит и филиал.',
            )}
          </li>
          <li>
            {L(
              'Bozor ikkala korxonani bir vaqtda solishtiradi: arzonroq narx, yuqori sifat va obro‘ ko‘proq mijoz olib keladi.',
              'The market compares both businesses at once: lower price, higher quality and brand win more customers.',
              'Рынок сравнивает обе компании сразу: ниже цена, выше качество и бренд — больше клиентов.',
            )}
          </li>
          <li>
            {L(
              'Zaxira yetmasa — mijoz raqibga ketadi; ortib qolsa — bir qismi buziladi. Sig‘im (filiallar) ham chegaralangan.',
              'Run out of stock and customers go to your rival; leftovers partly spoil. Capacity (branches) is limited too.',
              'Не хватит товара — клиент уйдёт; остатки портятся. Мощность ограничена.',
            )}
          </li>
          <li>
            {L(
              'Tushumdan 4% aylanma solig‘i olinadi. Kredit — oyiga 2%. Kassa minusga tushsa, bank favqulodda qarz beradi (+10% jarima); qarz 220 mln dan oshsa — bankrot.',
              '4% turnover tax on revenue. Loans cost 2% a month. If cash goes negative the bank lends in an emergency (+10% fee); debt above 220 mln means bankruptcy.',
              'Налог с оборота 4%. Кредит — 2% в месяц. При минусе банк даёт экстренный кредит (+10%); долг выше 220 млн — банкротство.',
            )}
          </li>
          <li>
            {L(
              'G‘olib — 12-oy oxirida sof kapitali (kassa − qarz + zaxira + filiallar) ko‘p bo‘lgan o‘yinchi.',
              'The winner has the higher net worth (cash − debt + stock + branches) after month 12.',
              'Побеждает тот, у кого больше капитал (касса − долг + запас + филиалы) после 12-го месяца.',
            )}
          </li>
          <li>
            {L(
              'Natija reytingga qo‘shilmaydi — bu mashq o‘yini.',
              'Results do not count towards the ranking — it is practice.',
              'Результат не влияет на рейтинг — это тренировка.',
            )}
          </li>
        </ul>
      </details>
    </div>
  );
}

function saveBest(biz: BizId, value: number) {
  const best = load<Record<string, number>>(BEST) || {};
  if (best[biz] == null || value > best[biz])
    store(BEST, { ...best, [biz]: Math.round(value * 10) / 10 });
}

function BotGame({
  save,
  me,
  onChange,
  onQuit,
}: {
  save: BotSave;
  me: ArenaMe | null;
  onChange: (s: BotSave | null) => void;
  onQuit: () => void;
}) {
  const lang = useLang(),
    L = useT();
  const g = useMemo(() => replay(save.biz, save.seed, save.months), [save]);
  const rival = tx(lang, BOT_NAMES[save.level]),
    myName = fullName(me) || L('Siz', 'You', 'Вы');
  const update = (s: BotSave) => {
    store(SAVE, s);
    onChange(s);
  };
  useEffect(() => {
    if (g.over && save.seen >= g.history.length) saveBest(save.biz, earned(g, g.players[0]));
  }, [g, save.seen, save.biz]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [save.seen, save.months.length]);
  let body;
  if (save.seen < g.history.length)
    body = (
      <MonthReport
        g={g}
        i={0}
        at={save.seen}
        rivalName={rival}
        nextLabel={
          g.over && save.seen + 1 >= g.history.length
            ? L('Yakuniy natija', 'Final result', 'Итог')
            : L('Keyingi oy', 'Next month', 'Следующий месяц')
        }
        onNext={() => update({ ...save, seen: save.seen + 1 })}
      />
    );
  else if (g.over)
    body = (
      <FinalReport
        g={g}
        i={0}
        myName={myName}
        rivalName={rival}
        againLabel={L('Yana o‘ynash', 'Play again', 'Играть снова')}
        onAgain={() => {
          store(SAVE, null);
          onChange(null);
          onQuit();
        }}
      />
    );
  else
    body = (
      <DecisionForm
        g={g}
        i={0}
        rivalName={rival}
        submitLabel={L('Oyni boshlash', 'Run the month', 'Начать месяц')}
        onSubmit={(d) =>
          update({
            ...save,
            months: [...save.months, [clampDecision(g, 0, d), botDecision(g, 1, save.level)]],
          })
        }
      />
    );
  return (
    <>
      <BizHeader g={g} i={0} rivalName={rival} />
      {body}
      {!g.over && (
        <p className="bz-quit">
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  L(
                    'O‘yindan chiqasizmi? Keyin davom ettirish mumkin.',
                    'Leave the game? You can continue later.',
                    'Выйти из игры? Можно продолжить позже.',
                  ),
                )
              )
                onQuit();
            }}
          >
            {L('Keyinroq davom ettiraman', 'I’ll continue later', 'Продолжу позже')}
          </button>
        </p>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ kursdosh bilan */
type RoomData = {
  meta?: {
    v: number;
    biz: BizId;
    seed: number;
    host: string;
    at?: number;
    to?: string;
    toName?: string;
    dec?: string;
  };
  p?: Record<string, { n?: string; s?: string; g?: string; at?: number }>;
  d?: Record<string, Record<string, Decision>>;
  s?: Record<string, number>;
};
function RoomGame({ code, me }: { code: string; me: ArenaMe | null }) {
  const lang = useLang(),
    L = useT(),
    { data, toast } = useApp();
  const base = useMemo(() => arenaBase(data?.mode === 'demo'), [data?.mode]);
  const [room, setRoom] = useState<RoomData | null | undefined>(undefined),
    [failed, setFailed] = useState(false),
    [busy, setBusy] = useState(false),
    [seen, setSeen] = useState(() => {
      try {
        return Number(sessionStorage.getItem('biz_seen_' + code)) || 0;
      } catch {
        return 0;
      }
    }),
    [timer, setTimer] = useState<number | null>(null),
    [replace, setReplace] = useState(false);
  const skew = useRef(0),
    joined = useRef(false);
  const valid = ROOM_CODE.test(code);
  const poll = useCallback(async () => {
    if (!base || !valid) return;
    try {
      const v = await rt<RoomData>(base, 'GET', seg('biz', code));
      setRoom(v);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [base, code, valid]);
  // so'rab turish (2 soniyada) va faollik belgisi (10 soniyada)
  useEffect(() => {
    if (!base || !valid || !me) return;
    let live = true;
    void poll();
    const t1 = setInterval(() => !document.hidden && void poll(), 2000);
    const beat = async () => {
      const t0 = Date.now();
      try {
        const v = await rt<number>(base, 'PUT', seg('biz', code, 's', me.id), {
          '.sv': 'timestamp',
        });
        if (live && typeof v === 'number') skew.current = v - Math.round((t0 + Date.now()) / 2);
      } catch {}
    };
    void beat();
    const t2 = setInterval(beat, 10000);
    return () => {
      live = false;
      clearInterval(t1);
      clearInterval(t2);
    };
  }, [base, code, valid, me, poll]);
  const players = room?.p ? Object.keys(room.p) : [];
  const host = room?.meta?.host || '';
  const order = host ? [host, ...players.filter((x) => x !== host)].slice(0, 2) : [];
  const mine = me ? order.indexOf(me.id) : -1;
  const full = order.length >= 2;
  // xonaga qo'shilish (bo'sh joy bo'lsa)
  useEffect(() => {
    if (!base || !me || !room?.meta || joined.current) return;
    if (players.includes(me.id)) {
      joined.current = true;
      return;
    }
    if (players.length >= 2 || room.meta.dec) return;
    joined.current = true;
    void rt(base, 'PUT', seg('biz', code, 'p', me.id), {
      n: me.name,
      s: me.surname,
      g: me.group,
      at: { '.sv': 'timestamp' },
    })
      .then(poll)
      .catch(() => (joined.current = false));
  }, [base, me, room, players, code, poll]);
  const months = useMemo(() => {
    const out: [Decision, Decision][] = [];
    if (order.length < 2) return out;
    for (let m = 1; m <= RULES.months; m++) {
      const x = room?.d?.['m' + m];
      if (!x?.[order[0]] || !x?.[order[1]]) break;
      out.push([x[order[0]], x[order[1]]]);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.d, order.join()]);
  const g = useMemo(
    () => (room?.meta ? replay(room.meta.biz, room.meta.seed, months) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [room?.meta?.biz, room?.meta?.seed, months],
  );
  const opp = mine >= 0 ? order[1 - mine] : '';
  const oppInfo = opp ? room?.p?.[opp] : undefined;
  const rivalName =
    [oppInfo?.n, oppInfo?.s].filter(Boolean).join(' ') || L('Raqib', 'Rival', 'Соперник');
  const myMove = g && me && !g.over ? room?.d?.['m' + g.month]?.[me.id] : undefined;
  const oppMove = g && opp && !g.over ? room?.d?.['m' + g.month]?.[opp] : undefined;
  const oppAge = opp && room?.s?.[opp] ? Date.now() + skew.current - room.s[opp] : Infinity;
  const oppGone = oppAge > 45000;
  // har oyga vaqt (faqat qaror ekrani ochiq turganda)
  const turnKey = g && !g.over && seen >= g.history.length && !myMove ? g.month : 0;
  useEffect(() => {
    if (!turnKey) {
      setTimer(null);
      return;
    }
    const t0 = Date.now();
    setTimer(TURN_SECONDS);
    const t = setInterval(
      () => setTimer(Math.max(0, TURN_SECONDS - Math.round((Date.now() - t0) / 1000))),
      1000,
    );
    return () => clearInterval(t);
  }, [turnKey]);
  const mark = (n: number) => {
    setSeen(n);
    try {
      sessionStorage.setItem('biz_seen_' + code, String(n));
    } catch {}
  };
  // Xona egasi raqib kutilayotganda biznes turini almashtira oladi (o'yin hali boshlanmagan).
  async function pickBiz(id: BizId) {
    if (!base || !room?.meta || id === room.meta.biz) return;
    setRoom((r) => (r?.meta ? { ...r, meta: { ...r.meta, biz: id } } : r));
    try {
      await rt(base, 'PUT', seg('biz', code, 'meta', 'biz'), id);
    } catch {
      toast(
        L(
          'Saqlanmadi — qayta urinib ko‘ring',
          'Not saved — please try again',
          'Не сохранено — попробуйте ещё раз',
        ),
      );
    }
    void poll();
  }
  async function submit(d: Decision) {
    if (!g || !me || !base) return;
    setBusy(true);
    try {
      await rt(base, 'PUT', seg('biz', code, 'd', 'm' + g.month, me.id), clampDecision(g, mine, d));
      await poll();
    } catch {
      toast(
        L(
          'Qaror yuborilmadi — qayta urinib ko‘ring',
          'Not sent — please try again',
          'Не отправлено — попробуйте ещё раз',
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  // raqib chiqib ketgan bo'lsa (va o'yinchi rozi bo'lsa) — uning o'rniga bot qaror qiladi
  useEffect(() => {
    if (!replace || !g || g.over || !base || !opp || oppMove || !oppGone) return;
    const d = { ...botDecision(g, 1 - mine, 1), bot: true };
    void rt(base, 'PUT', seg('biz', code, 'd', 'm' + g.month, opp), d)
      .then(poll)
      .catch(() => {});
  }, [replace, g, base, opp, oppMove, oppGone, mine, code, poll]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [seen, g?.month]);

  if (!valid)
    return (
      <p className="bz-card">
        {L('Xona kodi noto‘g‘ri.', 'Invalid room code.', 'Неверный код комнаты.')}
      </p>
    );
  if (!me || !base)
    return (
      <p className="bz-card">
        {me
          ? L(
              'Kursdosh bilan onlayn o‘yin bu (demo) muhitda o‘chirilgan.',
              'Online games with classmates are off in this (demo) environment.',
              'Онлайн-игра с однокурсником в этой (демо) среде отключена.',
            )
          : L(
              'Kursdosh bilan o‘ynash uchun talaba hisobingiz bilan kiring.',
              'Sign in with your student account to play against a classmate.',
              'Войдите под студенческим аккаунтом, чтобы играть с однокурсником.',
            )}
      </p>
    );
  if (room === undefined) return <div className="skeleton h-64" />;
  if (!room?.meta)
    return (
      <div className="bz-card">
        <p>
          {failed
            ? L(
                'Aloqa yo‘q — qayta urinilmoqda…',
                'No connection — retrying…',
                'Нет связи — повторяем…',
              )
            : L(
                'Bunday xona topilmadi yoki o‘yin tugagan.',
                'Room not found or the game is over.',
                'Комната не найдена или игра окончена.',
              )}
        </p>
        <Button variant="outline" onClick={() => navigate('arena/biznes')}>
          {L('Ortga', 'Back', 'Назад')}
        </Button>
      </div>
    );
  const b = bizOf(room.meta.biz);
  if (mine < 0)
    return (
      <div className="bz-card">
        <p>
          {full
            ? L(
                'Bu xonada allaqachon ikki kishi o‘ynayapti.',
                'Two players are already in this room.',
                'В комнате уже два игрока.',
              )
            : L('Xonaga qo‘shilinmoqda…', 'Joining the room…', 'Входим в комнату…')}
        </p>
      </div>
    );
  if (!full)
    return (
      <div className="bz-card bz-lobby">
        <span className="bz-lobby-icon" aria-hidden="true">
          {b.icon}
        </span>
        <h2>
          {tx(lang, b.name)} · {L('raqib kutilmoqda', 'waiting for a rival', 'ждём соперника')}
        </h2>
        {room.meta.dec ? (
          <p className="bz-alert" role="alert">
            {L(
              `${room.meta.dec} taklifni rad etdi.`,
              `${room.meta.dec} declined the invite.`,
              `${room.meta.dec} отклонил приглашение.`,
            )}
          </p>
        ) : (
          <p>
            {room.meta.toName
              ? L(
                  `${room.meta.toName}ga taklif yuborildi. Javobini kuting yoki kodni ayting:`,
                  `An invite was sent to ${room.meta.toName}. Wait or share the code:`,
                  `Приглашение отправлено ${room.meta.toName}. Ждите или сообщите код:`,
                )
              : L(
                  'Kodni do‘stingizga ayting: O‘yin maydoni → Biznes → «Qo‘shilish».',
                  'Share the code: Arena → Business → “Join”.',
                  'Сообщите код: Арена → Бизнес → «Войти».',
                )}
          </p>
        )}
        {me.id === host && !room.meta.dec && (
          <div
            className="bz-lobby-biz"
            role="radiogroup"
            aria-label={L('Biznes turi', 'Business type', 'Вид бизнеса')}
          >
            {BUSINESSES.map((x) => (
              <button
                key={x.id}
                type="button"
                role="radio"
                aria-checked={room.meta!.biz === x.id}
                className={room.meta!.biz === x.id ? 'is-on' : ''}
                onClick={() => void pickBiz(x.id)}
              >
                <span aria-hidden="true">{x.icon}</span> {tx(lang, x.name)}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          className="bz-code"
          onClick={() => {
            void navigator.clipboard?.writeText(code).then(
              () => toast(L('Kod nusxalandi', 'Code copied', 'Код скопирован')),
              () => {},
            );
          }}
          aria-label={L('Xona kodi — nusxalash', 'Room code — copy', 'Код комнаты — копировать')}
        >
          {code} <Copy size={18} />
        </button>
        <Button
          variant="outline"
          onClick={() => {
            void rt(base, 'DELETE', seg('biz', code)).catch(() => {});
            navigate('arena/biznes');
          }}
        >
          {L('Bekor qilish', 'Cancel', 'Отменить')}
        </Button>
      </div>
    );
  if (!g) return null;
  const myName = fullName(me) || L('Siz', 'You', 'Вы');
  let body;
  if (seen < g.history.length)
    body = (
      <MonthReport
        g={g}
        i={mine}
        at={seen}
        rivalName={rivalName}
        nextLabel={
          g.over && seen + 1 >= g.history.length
            ? L('Yakuniy natija', 'Final result', 'Итог')
            : L('Keyingi oy', 'Next month', 'Следующий месяц')
        }
        onNext={() => mark(seen + 1)}
      />
    );
  else if (g.over)
    body = (
      <FinalReport
        g={g}
        i={mine}
        myName={myName}
        rivalName={rivalName}
        againLabel={L('Yangi o‘yin', 'New game', 'Новая игра')}
        onAgain={() => navigate('arena/biznes')}
      />
    );
  else if (myMove)
    body = (
      <div className="bz-card bz-wait" role="status">
        <span className="bz-spinner" aria-hidden="true" />
        <h3>
          {L(
            `${rivalName} qaror qilmoqda…`,
            `${rivalName} is deciding…`,
            `${rivalName} принимает решение…`,
          )}
        </h3>
        <p className="muted">
          {L(
            `Sizning qaroringiz yuborildi: narx ${myMove.price}, xarid ${myMove.buy}, reklama ${myMove.ads} mln, sifat ${myMove.quality} mln.`,
            `Your decision was sent: price ${myMove.price}, purchase ${myMove.buy}, ads ${myMove.ads} mln, quality ${myMove.quality} mln.`,
            `Решение отправлено: цена ${myMove.price}, закупка ${myMove.buy}, реклама ${myMove.ads} млн, качество ${myMove.quality} млн.`,
          )}
        </p>
        {oppGone && !replace && (
          <div className="bz-alert">
            {L(
              `${rivalName} javob bermayapti (aloqa uzilgan).`,
              `${rivalName} is not responding (disconnected).`,
              `${rivalName} не отвечает (связь потеряна).`,
            )}
            <Button size="sm" onClick={() => setReplace(true)}>
              🤖{' '}
              {L(
                'Uning o‘rniga bot o‘ynasin',
                'Let a bot play for them',
                'Пусть за него играет бот',
              )}
            </Button>
          </div>
        )}
      </div>
    );
  else
    body = (
      <DecisionForm
        g={g}
        i={mine}
        rivalName={rivalName}
        busy={busy}
        timer={timer}
        submitLabel={L('Qarorni yuborish', 'Send my decision', 'Отправить решение')}
        onSubmit={(d) => void submit(d)}
      />
    );
  return (
    <>
      <BizHeader
        g={g}
        i={mine}
        rivalName={rivalName}
        timer={!myMove && seen >= g.history.length && !g.over ? timer : null}
      />
      <p className="bz-vs">
        👥 {myName} <b>vs</b> {rivalName} · {L('xona', 'room', 'комната')} {code}
      </p>
      {body}
    </>
  );
}
