'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Check, Lightbulb, Minus, Plus, RotateCcw } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import {
  EQUIPS,
  FLOW_NAMES,
  INVEST,
  INV_ORDER,
  LINE_NAMES,
  LOCATIONS,
  MONTHS,
  RULES,
  TOPICS,
  badges,
  bizOf,
  canBuy,
  capacity,
  clampDecision,
  clampSetup,
  earned,
  eventOf,
  forecast,
  lessons,
  money,
  planCash,
  quality,
  setupCost,
  strategyOf,
  tx,
  unitCost,
  wages,
  worth,
  type Biz,
  type Decision,
  type Forecast,
  type Game,
  type InvId,
  type Lang,
  type Setup,
  type Tri,
} from '@/lib/biznes';

/* 💼 «Biznes» o'yini ekranlari: biznes-reja, oylik qarorlar, oy hisoboti va yakuniy tahlil
   (bot bilan ham, kursdosh bilan ham bir xil ishlatiladi). */

const loc = (lang: Lang) => (lang === 'en' ? 'en-US' : 'ru-RU');
export const mln = (x: number, lang: Lang, sign = false) =>
  (sign && x > 0 ? '+' : '') +
  (Math.abs(x) >= 100 ? Math.round(x) : Math.round(x * 10) / 10).toLocaleString(loc(lang)) +
  ' ' +
  tx(lang, ['mln', 'mln', 'млн']);
export const num = (x: number, lang: Lang) => Math.round(x).toLocaleString(loc(lang));
const price = (x: number, lang: Lang) => x.toLocaleString(loc(lang));
const pct = (x: number) => Math.round(x * 100) + '%';
const useLang = () => useApp().lang as Lang;
const useT = () => {
  const lang = useLang();
  return (uz: string, en: string, ru: string) => tx(lang, [uz, en, ru]);
};
const segShort = (b: Biz, s: number, lang: Lang) => b.segs[s].icon + ' ' + tx(lang, b.segs[s].name);

/** Kurs mavzusiga havola (saboq qaysi mavzuga tegishli). */
export function TopicChip({ n }: { n: number }) {
  const lang = useLang(),
    L = useT();
  return (
    <a className="bz-topic" href={'#lesson/m' + n}>
      <BookOpen size={14} aria-hidden="true" />
      {L(`${n}-mavzu`, `Topic ${n}`, `Тема ${n}`)}: {tx(lang, TOPICS[n - 1])}
    </a>
  );
}

/* ------------------------------------------------------------------ yuqori qism */
export function BizHeader({
  g,
  i,
  rivalName,
  timer,
}: {
  g: Game;
  i: number;
  rivalName: string;
  timer?: number | null;
}) {
  const lang = useLang(),
    L = useT(),
    b = bizOf(g.biz),
    p = g.players[i],
    r = g.players[1 - i],
    m = Math.min(g.month, RULES.months);
  const place = LOCATIONS.find((x) => x.id === p.loc)!;
  const myShare = g.history.length ? p.last.share : 50;
  const regulars = p.reg[0] + p.reg[1] + p.reg[2];
  const cap = capacity(b, p, p.last.grade);
  const level = (x: number) =>
    x < 35
      ? L('past', 'low', 'низк.')
      : x < 65
        ? L('o‘rta', 'medium', 'средн.')
        : L('yuqori', 'high', 'высок.');
  return (
    <div className="bz-head">
      <div className="bz-head-top">
        <h2>
          <span aria-hidden="true">{b.icon}</span> {tx(lang, b.name)}
        </h2>
        {g.month > 0 && (
          <span className="bz-chip">
            {place.icon} {tx(lang, place.name)}
          </span>
        )}
        <span className="bz-month" aria-label={L('Oy', 'Month', 'Месяц')}>
          {g.over
            ? L('Yakun', 'Final', 'Итог')
            : g.month === 0
              ? L('Biznes-reja', 'Business plan', 'Бизнес-план')
              : tx(lang, MONTHS[m - 1]) + ' · ' + m + ' / ' + RULES.months}
        </span>
        {timer != null && (
          <span className={'bz-timer' + (timer <= 20 ? ' is-low' : '')} role="timer">
            ⏱ {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
          </span>
        )}
      </div>
      <ol className="bz-steps" aria-hidden="true">
        {MONTHS.map((_, k) => (
          <li
            key={k}
            className={k + 1 < g.month || g.over ? 'done' : k + 1 === g.month ? 'now' : ''}
          />
        ))}
      </ol>
      {g.month > 0 && (
        <>
          <div className="bz-kpis">
            <div className={p.cash < 15 ? 'is-bad' : ''}>
              <span>{L('Kassa', 'Cash', 'Касса')}</span>
              <b>{mln(p.cash, lang)}</b>
            </div>
            <div>
              <span>{L('Qarz', 'Debt', 'Долг')}</span>
              <b>{mln(p.debt, lang)}</b>
            </div>
            <div>
              <span>{L('Doimiy mijozlar', 'Regulars', 'Постоянные')}</span>
              <b>{num(regulars, lang)}</b>
            </div>
            <div>
              <span>
                {L('Sig‘im', 'Capacity', 'Мощность')} · {p.staff} 👥
              </span>
              <b>{num(cap, lang)}</b>
            </div>
            <div className="bz-worth">
              <span>{L('Sizning pulingiz', 'Your money', 'Ваши деньги')}</span>
              <b>{mln(money(p), lang)}</b>
            </div>
          </div>
          <div className="bz-meters">
            <Meter
              label={L('Sifat', 'Quality', 'Качество')}
              v={quality(b, p, p.last.grade)}
              rival={level(quality(b, r, r.last.grade))}
              rivalLabel={L('raqib', 'rival', 'соперник')}
            />
            <Meter
              label={L('Obro‘', 'Reputation', 'Репутация')}
              v={p.rep}
              rival={level(r.rep)}
              rivalLabel={L('raqib', 'rival', 'соперник')}
            />
            <div className="bz-share" aria-label={L('Bozor ulushi', 'Market share', 'Доля рынка')}>
              <div className="bz-share-labels">
                <span>
                  {L('Siz', 'You', 'Вы')} {Math.round(myShare)}%
                </span>
                <span>
                  {rivalName} {Math.round(100 - myShare)}%
                </span>
              </div>
              <div className="bz-share-bar">
                <i style={{ width: myShare + '%' }} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
function Meter({
  label,
  v,
  rival,
  rivalLabel,
}: {
  label: string;
  v: number;
  rival: string;
  rivalLabel: string;
}) {
  return (
    <div className="bz-meter">
      <span>
        <span>
          {label}: <b>{Math.round(v)}</b>
        </span>
        <small>
          {rivalLabel}: {rival}
        </small>
      </span>
      <div>
        <i style={{ width: Math.max(2, Math.min(100, v)) + '%' }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ umumiy boshqaruv elementlari */
function Slider({
  id,
  label,
  min,
  max,
  step,
  value,
  onChange,
  note,
  bad,
  disabled,
  unit,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  note?: React.ReactNode;
  bad?: boolean;
  disabled?: boolean;
  unit?: string;
}) {
  const lang = useLang();
  return (
    <div className={'bz-slider' + (bad ? ' is-bad' : '') + (disabled ? ' is-off' : '')}>
      <label htmlFor={id}>
        <span>{label}</span>
        <b>
          {price(value, lang)}
          {unit ? ' ' + unit : ''}
        </b>
      </label>
      <div className="bz-slider-row">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={Math.min(max, Math.max(min, value))}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <input
          type="number"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
        />
      </div>
      {note && <small>{note}</small>}
    </div>
  );
}
function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  note,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  note?: React.ReactNode;
}) {
  const L = useT();
  return (
    <div className="bz-stepper">
      <span className="bz-stepper-label">{label}</span>
      <div className="bz-stepper-row">
        <button
          type="button"
          aria-label={L('Kamaytirish', 'Decrease', 'Меньше')}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          <Minus size={16} />
        </button>
        <output aria-live="polite">{value}</output>
        <button
          type="button"
          aria-label={L('Ko‘paytirish', 'Increase', 'Больше')}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          <Plus size={16} />
        </button>
      </div>
      {note && <small>{note}</small>}
    </div>
  );
}
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <p className="bz-tip">
      <Lightbulb size={16} aria-hidden="true" /> <span>{children}</span>
    </p>
  );
}

/* ------------------------------------------------------------------ 0-raund: biznes-reja */
export function SetupForm({
  g,
  onSubmit,
  busy,
  timer,
  submitLabel,
}: {
  g: Game;
  onSubmit: (s: Setup) => void;
  busy?: boolean;
  timer?: number | null;
  submitLabel: string;
}) {
  const lang = useLang(),
    L = useT(),
    b = bizOf(g.biz);
  const [s, setS] = useState<Setup>(() =>
    clampSetup(b, { loc: 'bozor', equip: 'lease', staff: 3, launch: 8 }),
  );
  const set = (patch: Partial<Setup>) => setS((x) => clampSetup(b, { ...x, ...patch }));
  const c = setupCost(b, s),
    e = b.equip[s.equip];
  const cap = Math.min(s.staff * b.perStaff, e.cap);
  const monthly =
    Math.round((b.rent[s.loc] + s.staff * b.wage + b.utilities + e.monthly) * 10) / 10;
  useEffect(() => {
    if (timer === 0 && !busy) onSubmit(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer]);
  const tip =
    c.left < monthly * 1.3
      ? L(
          `Aylanma mablag‘ juda kam: 1-oyda xarid, ish haqi va boshqa xarajatlarga kamida ${Math.round(monthly * 1.3)} mln kerak bo‘ladi. Uskunani lizingga oling yoki reklamani kamaytiring.`,
          `Very little working capital left: month 1 needs at least ${Math.round(monthly * 1.3)} mln for purchases, wages and costs.`,
          `Мало оборотных средств: в 1-й месяц нужно минимум ${Math.round(monthly * 1.3)} млн.`,
        )
      : s.staff * b.perStaff > e.cap + b.perStaff * 0.5
        ? L(
            `Uskuna oyiga ${num(e.cap, lang)} ${b.unit[0]}dan ortig‘iga yetmaydi — ortiqcha xodimga ish haqi behuda ketadi.`,
            `The equipment cannot handle more than ${num(e.cap, lang)} ${b.unit[1]} a month — extra staff would be idle.`,
            `Оборудование не потянет больше ${num(e.cap, lang)} — лишние сотрудники простаивают.`,
          )
        : s.launch === 0
          ? L(
              'Ochilish reklamasisiz sizni deyarli hech kim bilmaydi — birinchi oylar sekin o‘tadi.',
              'Without a launch campaign almost nobody knows you yet.',
              'Без рекламы открытия вас почти никто не знает.',
            )
          : L(
              'Joy qaysi mijozlar guruhiga yaqin bo‘lishingizni belgilaydi: arzon ijara — kam odam, qimmat ijara — ko‘p odam.',
              'Location decides which customer group you are close to: cheap rent means fewer passers-by.',
              'Место определяет близость к группе клиентов: дешёвая аренда — меньше людей.',
            );
  const parts: [string, number, string][] = [
    [L('Uskuna', 'Equipment', 'Оборудование'), c.equipCost, 'eq'],
    [L('1-oy ijarasi', 'Month 1 rent', 'Аренда 1-го мес.'), c.deposit, 'rent'],
    [L('Jamoa yollash', 'Hiring', 'Найм'), c.hiring, 'hire'],
    [L('Ochilish reklamasi', 'Launch ads', 'Реклама открытия'), c.launch, 'ads'],
    [
      L('Aylanma mablag‘ (qoladi)', 'Working capital (left)', 'Оборотные (остаток)'),
      Math.max(0, c.left),
      'left',
    ],
  ];
  return (
    <div className="bz-play">
      <section className="bz-card bz-intro">
        <span className="bz-kicker">
          {L('0-raund · biznes-reja', 'Round 0 · business plan', 'Раунд 0 · бизнес-план')}
        </span>
        <h3>
          {L(
            `Sizda ${RULES.startCash} mln so‘m bor. ${tx(lang, b.name)}ni qayerda va qanday ochasiz?`,
            `You have ${RULES.startCash} mln so‘m. Where and how will you open your ${tx(lang, b.name).toLowerCase()}?`,
            `У вас ${RULES.startCash} млн сум. Где и как откроете ${tx(lang, b.name).toLowerCase()}?`,
          )}
        </h3>
        <p className="muted">{tx(lang, b.about)}</p>
      </section>
      <div className="bz-cols">
        <div className="bz-stack">
          <section className="bz-card" aria-labelledby="bz-loc">
            <h3 id="bz-loc">📍 {L('Joy', 'Location', 'Место')}</h3>
            <div className="bz-choice" role="radiogroup" aria-labelledby="bz-loc">
              {LOCATIONS.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  role="radio"
                  aria-checked={s.loc === x.id}
                  className={s.loc === x.id ? 'is-on' : ''}
                  onClick={() => set({ loc: x.id })}
                >
                  <span className="bz-choice-icon" aria-hidden="true">
                    {x.icon}
                  </span>
                  <b>{tx(lang, x.name)}</b>
                  <small>
                    {L('Ijara', 'Rent', 'Аренда')}: {mln(b.rent[x.id], lang)}/{L('oy', 'mo', 'мес')}
                  </small>
                  <span className="bz-aff">
                    {b.segs.map((sg, k) => {
                      const dots = Math.max(1, Math.round(b.locAff[x.id][k] * 3));
                      return (
                        <span key={k} title={tx(lang, sg.name)}>
                          {sg.icon} {'●'.repeat(dots)}
                          <i>{'●'.repeat(3 - dots)}</i>
                        </span>
                      );
                    })}
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="bz-card" aria-labelledby="bz-eq">
            <h3 id="bz-eq">
              ⚙️ {L('Uskuna', 'Equipment', 'Оборудование')}: {tx(lang, b.equipName).toLowerCase()}
            </h3>
            <div className="bz-choice" role="radiogroup" aria-labelledby="bz-eq">
              {EQUIPS.map((x) => {
                const q = b.equip[x.id];
                return (
                  <button
                    key={x.id}
                    type="button"
                    role="radio"
                    aria-checked={s.equip === x.id}
                    className={s.equip === x.id ? 'is-on' : ''}
                    onClick={() => set({ equip: x.id })}
                  >
                    <span className="bz-choice-icon" aria-hidden="true">
                      {x.icon}
                    </span>
                    <b>{tx(lang, x.name)}</b>
                    <small>
                      {q.cost ? mln(q.cost, lang) : L('0 so‘m', '0 so‘m', '0 сум')}
                      {q.monthly
                        ? ' + ' + mln(q.monthly, lang) + '/' + L('oy', 'mo', 'мес')
                        : ''} · {L('sig‘im', 'capacity', 'мощн.')} {num(q.cap, lang)}
                    </small>
                    <small className="muted">{tx(lang, x.text)}</small>
                  </button>
                );
              })}
            </div>
          </section>
          <section className="bz-card bz-two">
            <Stepper
              label={L(
                `Jamoa: ${tx(lang, b.staffName)}`,
                `Team: ${tx(lang, b.staffName)}`,
                `Команда: ${tx(lang, b.staffName)}`,
              )}
              value={s.staff}
              min={1}
              max={b.staffMax}
              onChange={(v) => set({ staff: v })}
              note={L(
                `Har biri oyiga ~${num(b.perStaff, lang)} ${b.unit[0]} · ish haqi ${mln(b.wage, lang)}/oy · yollash ${mln(b.wage * RULES.hireCost, lang)}`,
                `Each handles ~${num(b.perStaff, lang)} ${b.unit[1]}/month · wage ${mln(b.wage, lang)} · hiring ${mln(b.wage * RULES.hireCost, lang)}`,
                `Каждый ~${num(b.perStaff, lang)} в мес. · зарплата ${mln(b.wage, lang)}`,
              )}
            />
            <Slider
              id="bz-launch"
              label={L(
                'Ochilish reklamasi (mln)',
                'Launch campaign (mln)',
                'Реклама открытия (млн)',
              )}
              min={0}
              max={RULES.launchMax}
              step={1}
              value={s.launch}
              onChange={(v) => set({ launch: v })}
              note={L(
                'Hamma guruhlarga birdan: sizni birinchi oydanoq bilishadi.',
                'Reaches all groups: people know you from month 1.',
                'Для всех групп сразу.',
              )}
            />
          </section>
        </div>
        <aside className="bz-card bz-plan" aria-label={L('Byudjet', 'Budget', 'Бюджет')}>
          <h3>💰 {L('100 mln qayerga ketadi', 'Where the 100 mln goes', 'Куда уходят 100 млн')}</h3>
          <div className="bz-budget" aria-hidden="true">
            {parts.map(([, v, k]) => (
              <i
                key={k}
                className={'bz-b-' + k}
                style={{ width: (Math.max(0, v) / RULES.startCash) * 100 + '%' }}
              />
            ))}
          </div>
          <dl>
            {parts.map(([nm, v, k]) => (
              <div
                key={k}
                className={
                  k === 'left' ? 'bz-total' + (c.left < monthly * 1.3 ? ' is-bad' : '') : ''
                }
              >
                <dt>
                  <i className={'bz-dot bz-b-' + k} aria-hidden="true" /> {nm}
                </dt>
                <dd>{mln(v, lang)}</dd>
              </div>
            ))}
          </dl>
          <div className="bz-forecast">
            <span>
              {L('Har oylik doimiy xarajat', 'Monthly fixed costs', 'Постоянные расходы в месяц')}
            </span>
            <b>{mln(monthly, lang)}</b>
            <small>
              {L('ijara, ish haqi, kommunal', 'rent, wages, utilities', 'аренда, зарплата, ком.')}
              {e.monthly ? L(', lizing', ', lease', ', лизинг') : ''} ·{' '}
              {L('sig‘im', 'capacity', 'мощность')} {num(cap, lang)} {b.unit[0]}/
              {L('oy', 'mo', 'мес')}
            </small>
          </div>
          <Tip>{tip}</Tip>
          <Button className="bz-go" disabled={busy} onClick={() => onSubmit(s)}>
            <Check size={17} />
            {submitLabel}
          </Button>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ oylik qarorlar */
/** Qarorlar standart qiymati: o'tgan oydagidek. Hajmni o'yinchining o'zi hisoblaydi (1-oyda — taxminiy talabdan kam). */
export function defaultDecision(g: Game, i: number): Decision {
  const b = bizOf(g.biz),
    p = g.players[i],
    last = g.history[g.history.length - 1]?.players[i];
  const base: Partial<Decision> = {
    price: last?.price || b.price.ref,
    grade: last ? last.grade : 1,
    mkt: last ? last.mkt : [2, 2, 2],
    staff: p.staff,
    buy: [],
  };
  let volume = last?.volume;
  if (volume == null && b.kind !== 'service') {
    const f = forecast(g, i, { ...base, volume: 0 });
    volume = Math.floor((Math.min(f.low, f.capacity) * 0.9) / (b.volStep || 1)) * (b.volStep || 1);
  }
  return { ...clampDecision(g, i, { ...base, volume: volume || 0 }), choice: -1 };
}
/** Hajm talabga moslangan holdagi prognoz (kartochkalarni solishtirish uchun: hajm cheklovi natijani yashirmasin). */
function fitted(g: Game, i: number, d: Decision) {
  const b = bizOf(g.biz),
    p = g.players[i];
  if (b.kind === 'service') return forecast(g, i, d);
  const probe = forecast(g, i, { ...d, volume: 0 }),
    step = b.volStep || 1;
  const need = Math.min(probe.demand, probe.capacity) - (b.kind === 'stock' ? p.stock : 0);
  return forecast(g, i, { ...d, volume: Math.max(0, Math.round(need / step) * step) });
}
/** Investitsiya kartochkasi uchun prognoz: oylik foyda qanchaga o'zgaradi va o'zini necha oyda qoplaydi. */
function investEffect(g: Game, i: number, d: Decision, id: InvId) {
  const b = bizOf(g.biz),
    p = g.players[i],
    inv = INVEST[id],
    cost = inv.cost(b, p);
  const others = d.buy.filter((x) => x !== id);
  const f0 = fitted(g, i, { ...d, buy: others }),
    f1 = fitted(g, i, { ...d, buy: [...others, id] });
  let monthly = f1.profit - f0.profit + (inv.asset ? cost * (1 - RULES.assetValue) : cost);
  if (id === 'crm')
    monthly +=
      f0.sales * (b.kind === 'service' ? 0.06 : 0.1) * ((d.price - f0.unitCost) / 1000) * 0.9;
  return {
    cost,
    monthly: Math.round(monthly * 10) / 10,
    payback: monthly > 0.05 ? cost / monthly : Infinity,
  };
}

export function DecisionForm({
  g,
  i,
  rivalName,
  onSubmit,
  busy,
  timer,
  submitLabel,
}: {
  g: Game;
  i: number;
  rivalName: string;
  onSubmit: (d: Decision) => void;
  busy?: boolean;
  timer?: number | null;
  submitLabel: string;
}) {
  const lang = useLang(),
    L = useT(),
    b = bizOf(g.biz),
    p = g.players[i],
    r = g.players[1 - i],
    ev = eventOf(g.events[g.month - 1] || '');
  const [d, setD] = useState<Decision>(() => defaultDecision(g, i));
  const [tried, setTried] = useState(false);
  useEffect(
    () => {
      setD(defaultDecision(g, i));
      setTried(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [g.month, g.seed, i],
  );
  const set = (patch: Partial<Decision>) => setD((x) => ({ ...x, ...patch }));
  const f = forecast(g, i, d),
    cash = planCash(g, i, d),
    cost = unitCost(g, p, d.grade),
    needChoice = !!ev?.options && d.choice < 0;
  const cap = f.capacity,
    staffCap = Math.round(d.staff * b.perStaff * b.gradeCap[d.grade]),
    equipCap = Math.round(p.equipCap * b.gradeCap[d.grade]);
  useEffect(() => {
    if (timer === 0 && !busy)
      onSubmit({ ...d, choice: d.choice < 0 ? (ev?.options?.length || 1) - 1 : d.choice });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer]);
  const loanRoom = Math.max(0, Math.min(RULES.loanMax, RULES.debtLimit - p.debt));
  const short = cash.left < 0 ? Math.ceil(-cash.left / 5) * 5 : 0;
  const research = !!p.flags.research && p.flags.research >= g.month - 1;
  const effects = useMemo(
    () =>
      Object.fromEntries(
        INV_ORDER.filter((id) => canBuy(g, p, id)).map((id) => [id, investEffect(g, i, d, id)]),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [g, i, d],
  );
  const submit = () => {
    setTried(true);
    if (needChoice) {
      document.getElementById('bz-event')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onSubmit(d);
  };
  const toggle = (id: InvId) =>
    set({ buy: d.buy.includes(id) ? d.buy.filter((x) => x !== id) : [...d.buy, id] });
  return (
    <div className="bz-play">
      {g.month === 1 && g.setup && <RivalSetup g={g} i={i} rivalName={rivalName} />}
      {ev && (
        <EventCard
          g={g}
          i={i}
          choice={d.choice}
          onChoice={(c) => set({ choice: c })}
          warn={tried && needChoice}
        />
      )}
      <div className="bz-cols">
        <div className="bz-stack">
          <section className="bz-card bz-decide" aria-labelledby="bz-ph">
            <h3 id="bz-ph">🏷️ {L('Mahsulot va narx', 'Product and price', 'Продукт и цена')}</h3>
            <div
              className="bz-grade"
              role="radiogroup"
              aria-label={L('Mahsulot darajasi', 'Product level', 'Уровень продукта')}
            >
              {b.grades.map((x, k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={d.grade === k}
                  className={d.grade === k ? 'is-on' : ''}
                  onClick={() => set({ grade: k })}
                >
                  <b>{tx(lang, x.name)}</b>
                  <small>{tx(lang, x.hint)}</small>
                  <small>
                    {L('tannarx', 'unit cost', 'себест.')} {price(unitCost(g, p, k), lang)}
                    {b.gradeCap[k] !== 1
                      ? ` · ${L('sig‘im', 'capacity', 'мощн.')} ${b.gradeCap[k] > 1 ? '+' : '−'}${Math.round(Math.abs(b.gradeCap[k] - 1) * 100)}%`
                      : ''}
                  </small>
                </button>
              ))}
            </div>
            <Slider
              id="bz-price"
              label={L(
                `Narx (1 ${b.unit[0]}, ming so‘m)`,
                'Price (per unit, thousand so‘m)',
                'Цена (за ед., тыс. сум)',
              )}
              min={b.price.min}
              max={b.price.max}
              step={b.price.step}
              value={d.price}
              onChange={(v) => set({ price: v })}
              bad={d.price <= cost}
              note={L(
                `Tannarx ${price(cost, lang)} · marja ${pct((d.price - cost) / d.price)} · bozorda odatiy narx ${price(b.price.ref, lang)} · ${rivalName}: ${price(r.last.price, lang)}`,
                `Unit cost ${price(cost, lang)} · margin ${pct((d.price - cost) / d.price)} · usual market price ${price(b.price.ref, lang)} · ${rivalName}: ${price(r.last.price, lang)}`,
                `Себест. ${price(cost, lang)} · маржа ${pct((d.price - cost) / d.price)} · обычная цена ${price(b.price.ref, lang)} · ${rivalName}: ${price(r.last.price, lang)}`,
              )}
            />
            {b.kind !== 'service' && (
              <Slider
                id="bz-volume"
                label={L(
                  `${tx(lang, b.volName)} (${b.unit[0]})`,
                  `${tx(lang, b.volName)} (${b.unit[1]})`,
                  `${tx(lang, b.volName)} (${b.unit[2]})`,
                )}
                min={0}
                max={Math.max(
                  b.volStep,
                  Math.ceil((b.kind === 'perishable' ? cap : cap * 1.6) / b.volStep) * b.volStep,
                )}
                step={b.volStep}
                value={d.volume}
                onChange={(v) => set({ volume: v })}
                bad={cash.left < 0}
                note={L(
                  `Taxminiy talab ${num(f.low, lang)}–${num(f.high, lang)}${research ? ' (tadqiqot: aniq)' : ''} · sig‘im ${num(cap, lang)}${b.kind === 'stock' ? ` · omborda ${num(p.stock, lang)}` : ''} · narxi ${mln(cash.purchase, lang)}${b.kind === 'perishable' ? ' · sotilmagani isrof' : ''}`,
                  `Expected demand ${num(f.low, lang)}–${num(f.high, lang)} · capacity ${num(cap, lang)}${b.kind === 'stock' ? ` · in stock ${num(p.stock, lang)}` : ''} · costs ${mln(cash.purchase, lang)}`,
                  `Спрос ${num(f.low, lang)}–${num(f.high, lang)} · мощность ${num(cap, lang)}${b.kind === 'stock' ? ` · на складе ${num(p.stock, lang)}` : ''} · стоимость ${mln(cash.purchase, lang)}`,
                )}
              />
            )}
          </section>
          <section className="bz-card" aria-labelledby="bz-mh">
            <h3 id="bz-mh">
              📣{' '}
              {L(
                'Reklama — qaysi mijozlarga?',
                'Advertising — which customers?',
                'Реклама — для кого?',
              )}
            </h3>
            {b.segs.map((sg, s) => (
              <div className="bz-channel" key={s}>
                <Slider
                  id={'bz-mkt' + s}
                  label={`${sg.icon} ${tx(lang, b.channels[s])} → ${tx(lang, sg.name)}`}
                  min={0}
                  max={RULES.mktMax}
                  step={1}
                  value={d.mkt[s]}
                  unit={L('mln', 'mln', 'млн')}
                  onChange={(v) =>
                    set({ mkt: d.mkt.map((x, k) => (k === s ? v : x)) as Decision['mkt'] })
                  }
                />
                <div className="bz-aw">
                  <span>
                    {L('Sizni biladi', 'Aware of you', 'Знают вас')}: {pct(p.aw[s])} →{' '}
                    <b>{pct(f.segs[s].aw)}</b>
                  </span>
                  <div aria-hidden="true">
                    <i style={{ width: f.segs[s].aw * 100 + '%' }} />
                  </div>
                  <small>
                    {L('talab', 'demand', 'спрос')} ≈ {num(f.segs[s].demand, lang)} /{' '}
                    {num(f.segs[s].n, lang)}
                  </small>
                </div>
              </div>
            ))}
            <small className="muted">
              {L(
                'Har oy sizni biladiganlarning 20% i unutadi. Har keyingi million kamroq yangi odamga yetadi.',
                'Every month 20% of people forget you. Each extra million reaches fewer new people.',
                'Каждый месяц 20% забывают вас; каждый следующий миллион даёт меньше.',
              )}
            </small>
          </section>
          <section className="bz-card" aria-labelledby="bz-th">
            <h3 id="bz-th">👥 {L('Jamoa', 'Team', 'Команда')}</h3>
            <Stepper
              label={tx(lang, b.staffName)}
              value={d.staff}
              min={1}
              max={b.staffMax}
              onChange={(v) => set({ staff: v })}
              note={
                <>
                  {L('Sig‘im', 'Capacity', 'Мощность')}: <b>{num(cap, lang)}</b> {b.unit[0]} ·{' '}
                  {staffCap < equipCap
                    ? L(
                        `cheklov — jamoa (uskuna ${num(equipCap, lang)} gacha yetadi)`,
                        `limited by the team (equipment allows ${num(equipCap, lang)})`,
                        'ограничено командой',
                      )
                    : L(
                        `cheklov — uskuna (jamoa ${num(staffCap, lang)} ga yetadi)`,
                        `limited by equipment (the team could do ${num(staffCap, lang)})`,
                        'ограничено оборудованием',
                      )}{' '}
                  · {L('ish haqi', 'wages', 'зарплата')}{' '}
                  {mln(wages(b, { ...p, staff: d.staff }), lang)}/{L('oy', 'mo', 'мес')} ·{' '}
                  {L('mahorat', 'skill', 'мастерство')} {Math.round(p.skill)}
                  {d.staff > p.staff
                    ? ` · ${L('yollash', 'hiring', 'найм')} ${mln((d.staff - p.staff) * b.wage * RULES.hireCost, lang)}`
                    : ''}
                  {d.staff < p.staff
                    ? ` · ${L('bo‘shatish', 'severance', 'увольнение')} ${mln((p.staff - d.staff) * b.wage * RULES.fireCost, lang)}`
                    : ''}
                </>
              }
            />
          </section>
          <section className="bz-card" aria-labelledby="bz-ih">
            <h3 id="bz-ih">🚀 {L('Investitsiyalar', 'Investments', 'Инвестиции')}</h3>
            <div className="bz-invest">
              {INV_ORDER.map((id) => {
                const inv = INVEST[id],
                  on = d.buy.includes(id),
                  owned = p.owned[id] || 0,
                  can = canBuy(g, p, id),
                  eff = effects[id];
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={on}
                    disabled={!can}
                    className={
                      'bz-inv' + (on ? ' is-on' : '') + (owned && !inv.repeat ? ' is-owned' : '')
                    }
                    onClick={() => toggle(id)}
                  >
                    <span className="bz-inv-top">
                      <span aria-hidden="true">{id === 'extra' ? b.extra.icon : inv.icon}</span>
                      <b>{tx(lang, inv.name(b))}</b>
                    </span>
                    <small>{tx(lang, inv.text(b))}</small>
                    <span className="bz-inv-cost">
                      {can
                        ? mln(inv.cost(b, p), lang)
                        : owned
                          ? '✓ ' + L('Bor', 'Owned', 'Есть')
                          : L(
                              `${inv.from}-oydan`,
                              `From month ${inv.from}`,
                              `С ${inv.from}-го мес.`,
                            )}
                      {can && inv.upkeep(b)
                        ? ` + ${mln(inv.upkeep(b), lang)}/${L('oy', 'mo', 'мес')}`
                        : ''}
                      {owned > 0 && inv.repeat ? ` · ${owned}×` : ''}
                    </span>
                    {eff && id !== 'research' && (
                      <span className={'bz-inv-eff' + (eff.monthly > 0.05 ? ' up' : '')}>
                        {eff.monthly > 0.05
                          ? L(
                              `Prognoz: oyiga ${mln(eff.monthly, lang, true)} · o‘zini ~${Math.max(1, Math.round(eff.payback))} oyda qoplaydi`,
                              `Forecast: ${mln(eff.monthly, lang, true)}/month · pays back in ~${Math.max(1, Math.round(eff.payback))} months`,
                              `Прогноз: ${mln(eff.monthly, lang, true)}/мес · окупится за ~${Math.max(1, Math.round(eff.payback))} мес.`,
                            )
                          : L(
                              'Prognoz: hozir foyda ko‘rinmaydi',
                              'Forecast: no visible gain now',
                              'Прогноз: выгоды пока не видно',
                            )}
                      </span>
                    )}
                    {can && (
                      <span className="bz-inv-pick">
                        {on
                          ? '✓ ' + L('Tanlandi', 'Selected', 'Выбрано')
                          : L('Tanlash', 'Select', 'Выбрать')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
          <details className="bz-card bz-finance" open={d.loan > 0 || d.repay > 0 || cash.left < 0}>
            <summary>
              🏦 {L('Moliya: kredit va qarz', 'Finance: loans and debt', 'Финансы: кредит и долг')}
              {(d.loan > 0 || d.repay > 0) && <em>●</em>}
            </summary>
            <div className="bz-two">
              <Slider
                id="bz-loan"
                label={L(
                  'Kredit olish (mln, oyiga 2%)',
                  'Borrow (mln, 2% a month)',
                  'Кредит (млн, 2%/мес.)',
                )}
                min={0}
                max={loanRoom}
                step={5}
                value={Math.min(d.loan, loanRoom)}
                onChange={(v) => set({ loan: v })}
                note={L(
                  `Qarz chegarasi: ${RULES.debtLimit} mln — undan oshsa bankrot`,
                  `Debt limit: ${RULES.debtLimit} mln — above it you go bankrupt`,
                  `Лимит долга: ${RULES.debtLimit} млн`,
                )}
              />
              <Slider
                id="bz-repay"
                label={L(
                  'Qarzni qaytarish (oy oxirida, mln)',
                  'Repay debt (at month end, mln)',
                  'Погасить долг (млн)',
                )}
                min={0}
                max={Math.max(0, Math.floor(p.debt))}
                step={1}
                value={Math.min(d.repay, Math.floor(p.debt))}
                onChange={(v) => set({ repay: v })}
                disabled={p.debt < 1}
                note={
                  p.equity > 0
                    ? L(
                        `Investor ulushi: ${pct(p.equity)}`,
                        `Investor’s stake: ${pct(p.equity)}`,
                        `Доля инвестора: ${pct(p.equity)}`,
                      )
                    : ''
                }
              />
            </div>
          </details>
        </div>
        <aside className="bz-card bz-plan" aria-label={L('Reja', 'Plan', 'План')}>
          <h3>{L('Pul rejasi', 'Cash plan', 'План денег')}</h3>
          <dl>
            <div>
              <dt>{L('Kassada', 'In cash', 'В кассе')}</dt>
              <dd>{mln(p.cash, lang)}</dd>
            </div>
            {d.loan > 0 && (
              <div>
                <dt>+ {L('Kredit', 'Loan', 'Кредит')}</dt>
                <dd>{mln(d.loan, lang)}</dd>
              </div>
            )}
            {cash.invest > 0 && (
              <div>
                <dt>− {L('Investitsiyalar', 'Investments', 'Инвестиции')}</dt>
                <dd>{mln(cash.invest, lang)}</dd>
              </div>
            )}
            {cash.hire > 0 && (
              <div>
                <dt>− {L('Yollash / bo‘shatish', 'Hiring / severance', 'Найм / увольнение')}</dt>
                <dd>{mln(cash.hire, lang)}</dd>
              </div>
            )}
            {b.kind !== 'service' && (
              <div>
                <dt>− {tx(lang, b.volName)}</dt>
                <dd>{mln(cash.purchase, lang)}</dd>
              </div>
            )}
            <div>
              <dt>− {L('Reklama', 'Advertising', 'Реклама')}</dt>
              <dd>{mln(cash.marketing, lang)}</dd>
            </div>
            <div className={'bz-total' + (cash.left < 0 ? ' is-bad' : '')}>
              <dt>{L('Savdogacha qoladi', 'Left before sales', 'Остаток до продаж')}</dt>
              <dd>{mln(cash.left, lang)}</dd>
            </div>
          </dl>
          <small className="muted">
            {L(
              `Oy davomida savdo tushumi keladi, oy oxirida ijara, ish haqi va boshqa doimiy xarajatlar (~${mln(cash.fixed, lang)}) to‘lanadi.`,
              `Sales money arrives during the month; at the end rent, wages and other fixed costs (~${mln(cash.fixed, lang)}) are paid.`,
              `Выручка приходит в течение месяца, в конце платятся постоянные расходы (~${mln(cash.fixed, lang)}).`,
            )}
          </small>
          {cash.left < 0 && (
            <div className="bz-alert" role="alert">
              {L(
                `Pul ${mln(-cash.left, lang)} yetmayapti — avval xarid, keyin reklama qisqaradi.`,
                `You are ${mln(-cash.left, lang)} short — the purchase and then ads will be cut.`,
                `Не хватает ${mln(-cash.left, lang)} — сократятся закупка и реклама.`,
              )}
              {short <= loanRoom - d.loan && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => set({ loan: Math.min(loanRoom, d.loan + short) })}
                >
                  🏦 {L(`${short} mln kredit olish`, `Borrow ${short} mln`, `Взять ${short} млн`)}
                </Button>
              )}
            </div>
          )}
          <ForecastBox f={f} b={b} />
          <Tip>{advisor(g, i, d, f, cash.left, cash.fixed, lang, rivalName)}</Tip>
          <Button className="bz-go" disabled={busy} onClick={submit}>
            <Check size={17} />
            {submitLabel}
          </Button>
          {tried && needChoice && (
            <p className="bz-alert" role="alert">
              {L(
                'Avval vaziyat bo‘yicha qaror qiling (yuqorida).',
                'First decide on the situation (above).',
                'Сначала решите ситуацию (выше).',
              )}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
function ForecastBox({ f, b }: { f: Forecast; b: Biz }) {
  const lang = useLang(),
    L = useT();
  return (
    <div className="bz-forecast">
      <span>{L('Taxminiy oylik foyda', 'Expected profit this month', 'Ожидаемая прибыль')}</span>
      <b className={f.profit >= 0 ? 'up' : 'down'}>{mln(f.profit, lang, true)}</b>
      <small>
        {L('Sotuv', 'Sales', 'Продажи')} ≈ {num(f.sales, lang)} · {L('talab', 'demand', 'спрос')} ≈{' '}
        {num(f.demand, lang)} · {L('sifat', 'quality', 'качество')} {Math.round(f.quality)}
      </small>
      {f.breakEven > 0 && (
        <small>
          {L('Zararsizlik nuqtasi', 'Break-even point', 'Точка безубыточности')}:{' '}
          <b>{num(f.breakEven, lang)}</b> {b.unit[0]}
        </small>
      )}
      <small className="muted">
        {L(
          'Raqib o‘tgan oydagidek harakat qiladi deb hisoblangan.',
          'Assumes your rival repeats last month.',
          'Предполагается, что соперник повторит прошлый месяц.',
        )}
      </small>
    </div>
  );
}
function RivalSetup({ g, i, rivalName }: { g: Game; i: number; rivalName: string }) {
  const lang = useLang(),
    L = useT(),
    s = g.setup![1 - i];
  const place = LOCATIONS.find((x) => x.id === s.loc)!,
    eq = EQUIPS.find((x) => x.id === s.equip)!;
  return (
    <p className="bz-card bz-rivalsetup">
      🕵️{' '}
      {L(`${rivalName} ham ochildi`, `${rivalName} has opened too`, `${rivalName} тоже открылся`)}:{' '}
      {place.icon} {tx(lang, place.name)} · {eq.icon} {tx(lang, eq.name).toLowerCase()} · {s.staff}{' '}
      👥 · {L('ochilish reklamasi', 'launch ads', 'реклама открытия')} {mln(s.launch, lang)}
    </p>
  );
}

function EventCard({
  g,
  i,
  choice,
  onChoice,
  warn,
}: {
  g: Game;
  i: number;
  choice: number;
  onChoice: (c: number) => void;
  warn: boolean;
}) {
  const lang = useLang(),
    L = useT(),
    b = bizOf(g.biz),
    ev = eventOf(g.events[g.month - 1] || '')!;
  const notes = g.pre.notes[i] || [];
  return (
    <section
      id="bz-event"
      className={'bz-card bz-event' + (warn ? ' is-warn' : '')}
      aria-labelledby="bz-evh"
    >
      <div className="bz-event-icon" aria-hidden="true">
        {ev.icon(b)}
      </div>
      <div className="bz-event-body">
        <span className="bz-kicker">
          {ev.options
            ? L(
                'Yangi vaziyat — qaror kerak',
                'New situation — your call',
                'Новая ситуация — решайте',
              )
            : L('Yangilik', 'News', 'Новости')}
        </span>
        <h3 id="bz-evh">{tx(lang, ev.title(b))}</h3>
        <p>{tx(lang, ev.text(b))}</p>
        {notes.map((n, k) => (
          <p key={k} className="bz-outcome">
            ➜ {tx(lang, n)}
          </p>
        ))}
        {ev.options && (
          <div className="bz-options" role="radiogroup" aria-label={tx(lang, ev.title(b))}>
            {ev.options.map((o, k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={choice === k}
                className={choice === k ? 'is-on' : ''}
                onClick={() => onChoice(k)}
              >
                <b>{tx(lang, o.label)}</b>
                <small>{tx(lang, o.hint)}</small>
              </button>
            ))}
          </div>
        )}
        <TopicChip n={ev.topic} />
      </div>
    </section>
  );
}

/** Maslahatchi: holatga qarab bitta eng muhim maslahat. */
function advisor(
  g: Game,
  i: number,
  d: Decision,
  f: Forecast,
  left: number,
  fixedCosts: number,
  lang: Lang,
  rivalName: string,
) {
  const b = bizOf(g.biz),
    p = g.players[i],
    r = g.players[1 - i],
    cost = unitCost(g, p, d.grade),
    T = (t: Tri) => tx(lang, t);
  const total = f.segs[0].n + f.segs[1].n + f.segs[2].n;
  const blind = f.segs
    .map((x, s) => ({ s, n: x.n, aw: x.aw }))
    .filter((x) => x.aw < 0.25)
    .sort((x, y) => y.n - x.n)[0];
  if (d.price <= cost * 1.08)
    return T([
      'Narx tannarxga juda yaqin: har sotuvdan deyarli pul qolmaydi, doimiy xarajatlar zararga olib keladi.',
      'Your price is barely above unit cost: almost nothing is left per sale, fixed costs will cause a loss.',
      'Цена почти равна себестоимости: с продажи почти ничего не остаётся.',
    ]);
  if (left < 0)
    return T([
      'Rejadagi to‘lovlarga pul yetmayapti. Hajmni, investitsiyani yoki reklamani kamaytiring yoki kredit oling.',
      'You cannot afford the plan. Cut volume, investments or ads, or borrow.',
      'Денег на план не хватает. Сократите расходы или возьмите кредит.',
    ]);
  if (left + f.revenue * 0.9 < fixedCosts)
    return T([
      `Oy oxirida ijara va ish haqiga ~${Math.round(fixedCosts)} mln kerak. Savdodan keyin ham pul yetmasligi mumkin — bank 10% jarima bilan favqulodda qarz beradi.`,
      `At month end ~${Math.round(fixedCosts)} mln is needed for rent and wages; you may run short and pay a 10% emergency fee.`,
      `В конце месяца нужно ~${Math.round(fixedCosts)} млн; денег может не хватить.`,
    ]);
  if (
    b.kind !== 'service' &&
    d.volume + (b.kind === 'stock' ? p.stock : 0) < Math.min(f.low, f.capacity) * 0.95
  )
    return T([
      'Hajm taxminiy talabdan kam: mijozlar bo‘sh qaytib, raqibga ketadi va obro‘ pasayadi.',
      'Your volume is below expected demand: customers will leave for your rival and your reputation will suffer.',
      'Объём ниже ожидаемого спроса: клиенты уйдут к сопернику.',
    ]);
  if (b.kind === 'perishable' && d.volume > f.high * 1.2)
    return T([
      'Ishlab chiqarish talabdan ancha ko‘p: sotilmagan mahsulot isrof bo‘ladi.',
      'You are producing far more than demand: unsold product is wasted.',
      'Производство сильно больше спроса: непроданное пропадёт.',
    ]);
  if (b.kind === 'stock' && d.volume + p.stock > f.high * 1.6)
    return T([
      'Omborda talabdan ancha ko‘p tovar bo‘ladi: har oy 5% i eskiradi. Ortiqcha zaxira — muzlagan pul.',
      'You will hold far more stock than demand; 5% becomes outdated every month. Excess stock is frozen money.',
      'Запас сильно больше спроса; 5% устаревает каждый месяц.',
    ]);
  if (f.capacity < f.demand * 0.9)
    return d.staff * b.perStaff < p.equipCap
      ? T([
          'Talab sig‘imdan ko‘p: jamoani kengaytiring, aks holda mijozlar raqibga ketadi.',
          'Demand exceeds capacity: grow your team, or customers go to your rival.',
          'Спрос выше мощности: расширьте команду.',
        ])
      : T([
          'Talab uskuna sig‘imidan ko‘p: uskuna yoki filialga sarmoya vaqti kelgan bo‘lishi mumkin.',
          'Demand exceeds equipment capacity: time to invest in equipment or a branch?',
          'Спрос выше мощности оборудования: пора инвестировать?',
        ]);
  if (d.staff * b.perStaff > p.equipCap + b.perStaff)
    return T([
      'Jamoa uskuna sig‘imidan katta: ortiqcha xodimlar ishsiz turadi, ish haqi esa to‘lanadi.',
      'Your team is bigger than the equipment allows: extra staff are idle but still paid.',
      'Команда больше, чем позволяет оборудование.',
    ]);
  if (d.mkt[0] + d.mkt[1] + d.mkt[2] === 0)
    return T([
      'Reklamasiz har oy sizni biladiganlarning 20% i unutadi — talab sekin-asta kamayadi.',
      'Without ads 20% of people forget you every month — demand will slowly fall.',
      'Без рекламы 20% забывают вас каждый месяц.',
    ]);
  if (blind && blind.n > total * 0.25)
    return T([
      `«${b.segs[blind.s].name[0]}» guruhi sizni deyarli bilmaydi (${pct(blind.aw)}). Ularga mos kanalga reklama bering yoki ongli ravishda boshqa guruhga ixtisoslashing.`,
      `“${b.segs[blind.s].name[1]}” hardly know you (${pct(blind.aw)}). Advertise in their channel or specialise on purpose.`,
      `«${b.segs[blind.s].name[2]}» почти не знают вас (${pct(blind.aw)}).`,
    ]);
  if (r.last.price && d.price > r.last.price * 1.15 && d.grade <= r.last.grade)
    return T([
      `${rivalName} sizdan ancha arzon, sifatingiz esa undan yuqori emas. Yuqori narxni nima oqlaydi?`,
      `${rivalName} is much cheaper and your quality is not higher. What justifies your price?`,
      `${rivalName} заметно дешевле, а качество не выше.`,
    ]);
  if (p.cash > 100 && g.month <= 9)
    return T([
      'Kassada katta pul bekor yotibdi. Investitsiya kartochkalaridagi prognozni ko‘ring: qaysi biri o‘zini tez qoplaydi?',
      'A lot of cash is idle. Check the forecasts on the investment cards: which pays back fastest?',
      'В кассе много свободных денег. Какая инвестиция окупится быстрее?',
    ]);
  return T([
    'Narxni ±5% o‘zgartirib ko‘ring va taxminiy foyda qanday o‘zgarishini solishtiring: eng yaxshi narx ko‘pincha «odatiy» narx emas.',
    'Try moving the price by ±5% and compare the expected profit: the best price is often not the “usual” one.',
    'Попробуйте изменить цену на ±5% и сравните прибыль.',
  ]);
}

/* ------------------------------------------------------------------ oy hisoboti */
export function MonthReport({
  g,
  i,
  at,
  rivalName,
  onNext,
  nextLabel,
}: {
  g: Game;
  i: number;
  /** qaysi oy hisoboti (g.history indeksi) — ko'rilmagan oylar ketma-ket ko'rsatiladi */
  at: number;
  rivalName: string;
  onNext: () => void;
  nextLabel: string;
}) {
  const lang = useLang(),
    L = useT(),
    b = bizOf(g.biz),
    h = g.history[Math.min(at, g.history.length - 1)],
    me = h.players[i],
    rv = h.players[1 - i],
    ev = eventOf(h.event);
  const [tab, setTab] = useState<'pl' | 'cash'>('pl');
  const prevRv = g.history[h.m - 2]?.players[1 - i];
  const news: Tri[] = [];
  if (prevRv && rv.price < prevRv.price)
    news.push([
      `Narxni ${price(prevRv.price, 'uz')} dan ${price(rv.price, 'uz')} ga tushirdi.`,
      `Cut the price from ${price(prevRv.price, 'en')} to ${price(rv.price, 'en')}.`,
      `Снизил цену с ${price(prevRv.price, 'ru')} до ${price(rv.price, 'ru')}.`,
    ]);
  else if (prevRv && rv.price > prevRv.price)
    news.push([
      `Narxni ${price(rv.price, 'uz')} ga ko‘tardi.`,
      `Raised the price to ${price(rv.price, 'en')}.`,
      `Поднял цену до ${price(rv.price, 'ru')}.`,
    ]);
  if (!prevRv || rv.grade !== prevRv.grade) {
    const n = b.grades[rv.grade].name;
    news.push([
      `Mahsulot darajasi: ${n[0].toLowerCase()}.`,
      `Product level: ${n[1].toLowerCase()}.`,
      `Уровень: ${n[2].toLowerCase()}.`,
    ]);
  }
  const top = rv.mkt.indexOf(Math.max(...rv.mkt));
  if (rv.mkt[top] >= 5) {
    const n = b.segs[top].name;
    news.push([
      `Ko‘proq «${n[0]}»ga reklama qilmoqda.`,
      `Advertising mostly to “${n[1]}”.`,
      `Реклама в основном для «${n[2]}».`,
    ]);
  }
  for (const id of rv.bought) {
    const n = INVEST[id].name(b);
    if (id !== 'research')
      news.push([`Investitsiya: ${n[0]}.`, `Invested in: ${n[1]}.`, `Инвестиция: ${n[2]}.`]);
  }
  if (rv.hired)
    news.push([
      `${rv.hired} ta yangi xodim yolladi.`,
      `Hired ${rv.hired} new staff.`,
      `Нанял ${rv.hired} сотрудников.`,
    ]);
  if (rv.lost > (b.volStep || 2))
    news.push([
      'Mijozlarining bir qismiga xizmat ko‘rsata olmadi.',
      'Could not serve some of its customers.',
      'Не смог обслужить часть клиентов.',
    ]);
  const startCash = r2(me.cash - me.flow.reduce((a, l) => a + l.v, 0));
  return (
    <div className="bz-report">
      <section className="bz-card" aria-labelledby="bz-rh">
        <h3 id="bz-rh">
          📊 {tx(lang, MONTHS[h.m - 1])}: {L('oy hisoboti', 'monthly report', 'отчёт за месяц')}
        </h3>
        <div className="bz-report-top">
          <div>
            <span>{L('Mijozlar', 'Customers', 'Клиенты')}</span>
            <b>
              {num(me.served, lang)} / {num(me.demand + me.bulk + me.b2b, lang)}
            </b>
            <small>{L('xizmat / talab', 'served / demand', 'обслужено / спрос')}</small>
          </div>
          <div>
            <span>{L('Sof foyda', 'Net profit', 'Чистая прибыль')}</span>
            <b className={me.profit >= 0 ? 'up' : 'down'}>{mln(me.profit, lang, true)}</b>
            <small>
              {L('kassa', 'cash', 'касса')}: {mln(me.cash, lang)}
            </small>
          </div>
          <div>
            <span>{L('Sizning pulingiz', 'Your money', 'Ваши деньги')}</span>
            <b>{mln(me.money, lang)}</b>
            <small>
              {rivalName}: {mln(rv.money, lang)}
            </small>
          </div>
        </div>
        <div className="bz-market">
          <h4>
            🗺️{' '}
            {L(
              'Bozor: mijozlar kimdan oldi?',
              'The market: who did customers buy from?',
              'Рынок: у кого купили?',
            )}
          </h4>
          {b.segs.map((sg, s) => {
            const n = Math.max(1, h.segN[s], me.segs[s].served + rv.segs[s].served);
            const mine = me.segs[s].served,
              theirs = rv.segs[s].served;
            return (
              <div className="bz-seg" key={s}>
                <span className="bz-seg-name">{segShort(b, s, lang)}</span>
                <div className="bz-seg-bar" aria-hidden="true">
                  <i className="me" style={{ width: (mine / n) * 100 + '%' }} />
                  <i className="rv" style={{ width: (theirs / n) * 100 + '%' }} />
                </div>
                <small>
                  {L('siz', 'you', 'вы')} {num(mine, lang)} · {rivalName} {num(theirs, lang)} ·{' '}
                  {L('boshqa joydan / olmadi', 'elsewhere / none', 'в другом месте')}{' '}
                  {num(Math.max(0, h.segN[s] - mine - theirs), lang)}
                </small>
              </div>
            );
          })}
        </div>
        <div className="bz-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'pl'}
            className={tab === 'pl' ? 'is-on' : ''}
            onClick={() => setTab('pl')}
          >
            {L('Foyda va zarar', 'Profit and loss', 'Прибыли и убытки')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'cash'}
            className={tab === 'cash' ? 'is-on' : ''}
            onClick={() => setTab('cash')}
          >
            {L('Pul oqimi (kassa)', 'Cash flow', 'Денежный поток')}
          </button>
        </div>
        {tab === 'pl' ? (
          <table className="bz-pl">
            <tbody>
              {me.lines.map((l) => (
                <tr key={l.key}>
                  <th scope="row">{tx(lang, LINE_NAMES[l.key] || [l.key, l.key, l.key])}</th>
                  <td className={l.v >= 0 ? 'up' : 'down'}>{mln(l.v, lang, true)}</td>
                </tr>
              ))}
              <tr className="bz-pl-total">
                <th scope="row">{L('Sof foyda', 'Net profit', 'Чистая прибыль')}</th>
                <td className={me.profit >= 0 ? 'up' : 'down'}>{mln(me.profit, lang, true)}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <table className="bz-pl">
            <tbody>
              <tr>
                <th scope="row">
                  {L('Oy boshidagi kassa', 'Cash at the start', 'Касса на начало')}
                </th>
                <td>{mln(startCash, lang)}</td>
              </tr>
              {me.flow.map((l) => (
                <tr key={l.key}>
                  <th scope="row">{tx(lang, FLOW_NAMES[l.key] || [l.key, l.key, l.key])}</th>
                  <td className={l.v >= 0 ? 'up' : 'down'}>{mln(l.v, lang, true)}</td>
                </tr>
              ))}
              <tr className="bz-pl-total">
                <th scope="row">{L('Oy oxiridagi kassa', 'Cash at the end', 'Касса на конец')}</th>
                <td>{mln(me.cash, lang)}</td>
              </tr>
            </tbody>
          </table>
        )}
        <p className="bz-small muted">
          {tab === 'pl'
            ? L(
                `Zararsizlik nuqtasi: oyiga ~${num(me.breakEven, lang)} ${b.unit[0]} — shundan ko‘p sotilsa, doimiy xarajatlar qoplanadi.`,
                `Break-even: ~${num(me.breakEven, lang)} ${b.unit[1]} a month covers your fixed costs.`,
                `Безубыточность: ~${num(me.breakEven, lang)} в месяц.`,
              )
            : L(
                'Foyda va kassa bir xil emas: investitsiya, kredit, nasiya va zaxira kassani o‘zgartiradi, lekin foydani emas.',
                'Profit is not cash: investments, loans, credit and stock move cash but not profit.',
                'Прибыль — не касса: инвестиции, кредиты и запасы меняют кассу, но не прибыль.',
              )}
        </p>
        {(me.outcome || me.notes.length > 0) && (
          <ul className="bz-notes">
            {me.outcome && <li>🎲 {tx(lang, me.outcome)}</li>}
            {me.notes.map((n, k) => (
              <li key={k}>{tx(lang, n)}</li>
            ))}
          </ul>
        )}
        <div className="bz-reviews">
          <h4>💬 {L('Mijozlar fikri', 'What customers say', 'Отзывы клиентов')}</h4>
          {me.reviews.map((x, k) => (
            <q key={k}>{tx(lang, x)}</q>
          ))}
          <small>
            {L('Qoniqish', 'Satisfaction', 'Удовлетворённость')}: <b>{pct(me.sat)}</b> ·{' '}
            {L('obro‘', 'reputation', 'репутация')} {Math.round(me.rep)}
          </small>
        </div>
      </section>
      <div className="bz-cols">
        <section className="bz-card" aria-labelledby="bz-nh">
          <h3 id="bz-nh">🕵️ {rivalName}</h3>
          <p className="muted">
            {L('Narx', 'Price', 'Цена')}: <b>{price(rv.price, lang)}</b> ·{' '}
            {L('mijozlar', 'customers', 'клиенты')}: <b>{num(rv.served, lang)}</b> ·{' '}
            {L('ulush', 'share', 'доля')}: <b>{Math.round(rv.share)}%</b> · 👥 {rv.staff}
          </p>
          {news.length ? (
            <ul className="bz-news">
              {news.map((n, k) => (
                <li key={k}>{tx(lang, n)}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">
              {L(
                'Bu oy sezilarli harakat qilmadi.',
                'No notable moves this month.',
                'Заметных шагов не было.',
              )}
            </p>
          )}
        </section>
        {ev && (
          <section className="bz-card bz-lesson" aria-labelledby="bz-lh">
            <h3 id="bz-lh">
              <BookOpen size={17} aria-hidden="true" /> {L('Saboq', 'Lesson', 'Урок')}:{' '}
              {tx(lang, ev.title(b))}
            </h3>
            <p>{tx(lang, ev.lesson(b))}</p>
            <TopicChip n={ev.topic} />
          </section>
        )}
      </div>
      <Button className="bz-go bz-next" onClick={onNext}>
        {nextLabel}
        <ArrowRight size={17} />
      </Button>
    </div>
  );
}
const r2 = (x: number) => Math.round(x * 100) / 100;

/* ------------------------------------------------------------------ yakuniy tahlil */
export function FinalReport({
  g,
  i,
  myName,
  rivalName,
  onAgain,
  againLabel,
}: {
  g: Game;
  i: number;
  myName: string;
  rivalName: string;
  onAgain?: () => void;
  againLabel?: string;
}) {
  const lang = useLang(),
    L = useT(),
    b = bizOf(g.biz),
    me = g.players[i],
    rv = g.players[1 - i];
  const won = g.winner === i,
    tie = g.winner === 2;
  const tips = useMemo(() => lessons(g, i), [g, i]);
  const marks = useMemo(() => badges(g, i), [g, i]);
  const startOf = (k: number) => {
    const s = g.setup?.[k];
    return s ? r2(s.cash + s.equipCost * RULES.assetValue + s.deposit) : RULES.startCash;
  };
  const series = [i, 1 - i].map((k) => [startOf(k), ...g.history.map((h) => h.players[k].money)]);
  const all = series.flat(),
    lo = Math.min(0, ...all),
    hi = Math.max(RULES.startCash * 1.2, ...all);
  const W = 560,
    H = 200,
    x = (k: number) => 20 + (k * (W - 40)) / RULES.months,
    y = (v: number) => H - 20 - ((v - lo) / (hi - lo || 1)) * (H - 40);
  const rows: [string, string, string][] = [
    [
      L('Ishlab topilgan pul', 'Money earned', 'Заработано'),
      mln(earned(me), lang, true),
      mln(earned(rv), lang, true),
    ],
    [
      L('Sizga tegishli pul', 'Money that is yours', 'Ваши деньги'),
      mln(money(me), lang),
      mln(money(rv), lang),
    ],
    [
      L('Sof kapital (investor bilan)', 'Net worth (incl. investor)', 'Капитал'),
      mln(worth(me), lang),
      mln(worth(rv), lang),
    ],
    [
      L('Jami tushum', 'Total revenue', 'Выручка'),
      mln(me.stats.revenue, lang),
      mln(rv.stats.revenue, lang),
    ],
    [
      L('Xizmat ko‘rsatilmagan mijozlar', 'Customers not served', 'Не обслужено'),
      num(me.stats.lost, lang),
      num(rv.stats.lost, lang),
    ],
    [
      L('Isrof / eskirish', 'Waste / obsolescence', 'Потери'),
      num(me.stats.waste, lang),
      num(rv.stats.waste, lang),
    ],
    [L('Reklama', 'Advertising', 'Реклама'), mln(me.stats.mkt, lang), mln(rv.stats.mkt, lang)],
    [
      L('Investitsiyalar', 'Investments', 'Инвестиции'),
      mln(me.stats.invest, lang),
      mln(rv.stats.invest, lang),
    ],
    [
      L('Foiz va jarimalar', 'Interest and fines', 'Проценты и штрафы'),
      mln(me.stats.interest + me.stats.fines, lang),
      mln(rv.stats.interest + rv.stats.fines, lang),
    ],
    [L('Obro‘', 'Reputation', 'Репутация'), String(Math.round(me.rep)), String(Math.round(rv.rep))],
  ];
  return (
    <div className="bz-final">
      <section
        className={'bz-card bz-verdict' + (won ? ' is-win' : tie ? ' is-tie' : ' is-loss')}
        aria-live="polite"
      >
        <span className="bz-verdict-icon" aria-hidden="true">
          {won ? '🏆' : tie ? '🤝' : '📉'}
        </span>
        <div>
          <h2>
            {won
              ? L(
                  'G‘alaba! Siz ko‘proq pul ishlab topdingiz',
                  'You win! You earned more',
                  'Победа! Вы заработали больше',
                )
              : tie
                ? L('Durang', 'A draw', 'Ничья')
                : L(
                    'Raqib bu safar oldinda',
                    'Your rival is ahead this time',
                    'В этот раз соперник впереди',
                  )}
          </h2>
          <p>
            {me.bankrupt
              ? L(
                  'Qarz chegaradan oshib ketdi — biznes bankrot bo‘ldi.',
                  'Debt went over the limit — the business went bankrupt.',
                  'Долг превысил лимит — банкротство.',
                )
              : rv.bankrupt
                ? L(
                    `${rivalName} bankrot bo‘ldi.`,
                    `${rivalName} went bankrupt.`,
                    `${rivalName} обанкротился.`,
                  )
                : L(
                    `12 oyda siz ${mln(earned(me), lang, true)}, ${rivalName} esa ${mln(earned(rv), lang, true)} ishlab topdi.`,
                    `In 12 months you earned ${mln(earned(me), lang, true)} and ${rivalName} ${mln(earned(rv), lang, true)}.`,
                    `За 12 месяцев вы заработали ${mln(earned(me), lang, true)}, ${rivalName} — ${mln(earned(rv), lang, true)}.`,
                  )}
          </p>
          <p className="bz-small">
            🧭 {L('Sizning strategiyangiz', 'Your strategy', 'Ваша стратегия')}:{' '}
            <b>{tx(lang, strategyOf(g, i))}</b>
          </p>
        </div>
      </section>
      <div className="bz-cols">
        <section className="bz-card" aria-labelledby="bz-ch">
          <h3 id="bz-ch">
            📈 {L('Pulingiz oyma-oy', 'Your money month by month', 'Ваши деньги по месяцам')}
          </h3>
          <svg
            className="bz-chart"
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={L('Grafik', 'Chart', 'График')}
          >
            <line
              className="bz-chart-base"
              x1={20}
              x2={W - 20}
              y1={y(RULES.startCash)}
              y2={y(RULES.startCash)}
            />
            <text className="bz-chart-label" x={22} y={y(RULES.startCash) - 4}>
              {RULES.startCash}
            </text>
            {series.map((s, k) => (
              <polyline
                key={k}
                className={k === 0 ? 'bz-chart-me' : 'bz-chart-rival'}
                points={s.map((v, n) => `${x(n)},${y(v)}`).join(' ')}
              />
            ))}
          </svg>
          <p className="bz-legend">
            <span className="me">■ {myName}</span>
            <span className="rv">■ {rivalName}</span>
          </p>
        </section>
        <section className="bz-card" aria-labelledby="bz-th2">
          <h3 id="bz-th2">🧾 {L('Natijalar', 'Results', 'Итоги')}</h3>
          <table className="bz-pl bz-compare">
            <thead>
              <tr>
                <th />
                <th>{myName}</th>
                <th>{rivalName}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([k, a, z]) => (
                <tr key={k}>
                  <th scope="row">{k}</th>
                  <td>{a}</td>
                  <td>{z}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
      {marks.length > 0 && (
        <section className="bz-card" aria-labelledby="bz-bh">
          <h3 id="bz-bh">🏅 {L('Yutuqlaringiz', 'Your badges', 'Ваши награды')}</h3>
          <ul className="bz-badges">
            {marks.map((m) => (
              <li key={m.id}>
                <span aria-hidden="true">{m.icon}</span>
                <b>{tx(lang, m.name)}</b>
                <small>{tx(lang, m.text)}</small>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="bz-card bz-lessons" aria-labelledby="bz-sh">
        <h3 id="bz-sh">🎓 {L('Sizga shaxsiy saboqlar', 'Your personal lessons', 'Ваши уроки')}</h3>
        {tips.length ? (
          <ul>
            {tips.map((t, k) => (
              <li key={k}>
                <span aria-hidden="true">{t.icon}</span>
                <div>
                  <p>{tx(lang, t.text)}</p>
                  <TopicChip n={t.topic} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            {L(
              'Zo‘r o‘yin: katta xatolar bo‘lmadi. Endi kuchliroq raqib bilan sinab ko‘ring!',
              'Great game: no big mistakes. Try a stronger rival!',
              'Отличная игра! Попробуйте соперника сильнее.',
            )}
          </p>
        )}
        <p className="bz-skills">
          {L(
            `Bu o‘yinda siz biznes-reja, joy va uskuna tanlash, narx belgilash, talabni prognozlash, mijozlar guruhini tanlash, jamoa, investitsiya qoplanishi, kredit va investor, foyda va kassa farqini mashq qildingiz. Biznes: ${tx(lang, b.name)}.`,
            `You practised a business plan, location and equipment, pricing, forecasting, choosing customer groups, team, investment payback, loans and investors, and profit vs cash. Business: ${tx(lang, b.name)}.`,
            'Вы потренировали бизнес-план, ценообразование, прогноз спроса, выбор сегментов, команду, окупаемость, кредиты и денежный поток.',
          )}
        </p>
      </section>
      {onAgain && (
        <Button className="bz-go" onClick={onAgain}>
          <RotateCcw size={17} />
          {againLabel}
        </Button>
      )}
    </div>
  );
}
