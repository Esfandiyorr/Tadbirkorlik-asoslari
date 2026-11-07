'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Check, Lightbulb, RotateCcw } from 'lucide-react';
import { useApp } from './provider';
import { Button } from './ui/button';
import {
  LINE_NAMES,
  MONTHS,
  RULES,
  bizOf,
  capacity,
  clampDecision,
  earned,
  eventOf,
  forecast,
  lessons,
  planCash,
  tx,
  unitCost,
  worth,
  type Decision,
  type Game,
  type Lang,
  type Tri,
} from '@/lib/biznes';

/* 💼 «Biznes» o'yini ekranlari: oylik qarorlar, oy hisoboti va yakuniy tahlil (bot va kursdosh rejimi uchun umumiy). */

export const mln = (x: number, lang: Lang, sign = false) =>
  (sign && x > 0 ? '+' : '') +
  (Math.abs(x) >= 100 ? Math.round(x) : Math.round(x * 10) / 10).toLocaleString(
    lang === 'en' ? 'en-US' : 'ru-RU',
  ) +
  ' ' +
  tx(lang, ['mln', 'mln', 'млн']);
export const num = (x: number, lang: Lang) =>
  Math.round(x).toLocaleString(lang === 'en' ? 'en-US' : 'ru-RU');
const useLang = () => useApp().lang as Lang;
const useT = () => {
  const lang = useLang();
  return (uz: string, en: string, ru: string) => tx(lang, [uz, en, ru]);
};

/** Yuqori qism: oy, kassa, qarz, zaxira, sof kapital, sifat va obro'. */
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
    m = Math.min(g.month, RULES.months),
    last = g.history[g.history.length - 1];
  const myShare = last ? last.players[i].share : 50;
  return (
    <div className="bz-head">
      <div className="bz-head-top">
        <h2>
          <span aria-hidden="true">{b.icon}</span> {tx(lang, b.name)}
        </h2>
        <span className="bz-month" aria-label={L('Oy', 'Month', 'Месяц')}>
          {g.over
            ? L('Yakun', 'Final', 'Итог')
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
            className={k + 1 < g.month ? 'done' : k + 1 === g.month && !g.over ? 'now' : ''}
          />
        ))}
      </ol>
      <div className="bz-kpis">
        <div className={p.cash < 20 ? 'is-bad' : ''}>
          <span>{L('Kassa', 'Cash', 'Касса')}</span>
          <b>{mln(p.cash, lang)}</b>
        </div>
        <div>
          <span>{L('Qarz', 'Debt', 'Долг')}</span>
          <b>{mln(p.debt + p.soft, lang)}</b>
        </div>
        <div>
          <span>
            {L('Zaxira', 'Stock', 'Запас')} ({tx(lang, b.unit)})
          </span>
          <b>{num(p.stock, lang)}</b>
        </div>
        <div>
          <span>{L('Filiallar', 'Branches', 'Филиалы')}</span>
          <b>
            {p.branches}
            {p.pending ? ' (+' + p.pending + ')' : ''}
          </b>
        </div>
        <div className="bz-worth">
          <span>{L('Sof kapital', 'Net worth', 'Капитал')}</span>
          <b>{mln(worth(g, p), lang)}</b>
        </div>
      </div>
      <div className="bz-meters">
        <Meter label={L('Sifat', 'Quality', 'Качество')} v={p.quality} rival={r.quality} />
        <Meter label={L('Obro‘', 'Brand', 'Бренд')} v={p.brand} rival={r.brand} />
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
    </div>
  );
}
function Meter({ label, v, rival }: { label: string; v: number; rival: number }) {
  const L = useT();
  // Raqibning aniq qiymati ko'rinmaydi — faqat darajasi (bozorda ham shunday: raqib ichini bilmaysiz).
  const level = (x: number) =>
    x < 35
      ? L('past', 'low', 'низк.')
      : x < 65
        ? L('o‘rta', 'medium', 'средн.')
        : L('yuqori', 'high', 'высок.');
  return (
    <div className="bz-meter">
      <span>
        <span>
          {label}: <b>{Math.round(v)}</b>
        </span>
        <small>
          {L('raqib', 'rival', 'соперник')}: {level(rival)}
        </small>
      </span>
      <div>
        <i style={{ width: Math.max(2, Math.min(100, v)) + '%' }} />
      </div>
    </div>
  );
}

/** Qarorlar standart qiymati: o'tgan oydagidek (birinchi oy — bazaviy narx va taxminiy talab). */
export function defaultDecision(g: Game, i: number): Decision {
  const b = bizOf(g.biz),
    p = g.players[i],
    last = g.history[g.history.length - 1]?.players[i];
  const base: Partial<Decision> = {
    price: last?.price || b.price.ref,
    ads: last ? last.ads : 8,
    quality: last ? last.qualityBudget : 6,
    choice: -1,
  };
  // Xarid — eng muhim qaror, shuning uchun uni o'yinchi o'zi hisoblaydi: standart qiymat o'tgan oydagi xarid
  // (1-oyda — taxminiy talabning pastki chegarasidan ham kamroq), talab oralig'i esa slayder ostida ko'rsatiladi.
  let buy = last?.bought;
  if (buy == null) {
    const f = forecast(g, i, { ...base, buy: 0 });
    buy = Math.floor((Math.min(f.low, capacity(g, p)) * 0.9) / b.buyStep) * b.buyStep;
  }
  return { ...clampDecision(g, i, { ...base, buy }), choice: -1 };
}

/** Bir oylik qarorlar ekrani. */
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
    ev = eventOf(g.events[g.month - 1] || '');
  const [d, setD] = useState<Decision>(() => defaultDecision(g, i));
  const [tried, setTried] = useState(false);
  // Yangi oy boshlanganda — standart qiymatlar (o'yin holati har so'rovda qayta hisoblansa ham shu oy ichida saqlanadi).
  useEffect(
    () => {
      setD(defaultDecision(g, i));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [g.month, g.seed, i],
  );
  const set = (patch: Partial<Decision>) => setD((x) => ({ ...x, ...patch }));
  const f = forecast(g, i, d),
    cash = planCash(g, i, d),
    cost = unitCost(g, p),
    needChoice = !!ev?.options && d.choice < 0;
  // vaqt tugasa — joriy qarorlar o'zi yuboriladi (tanlanmagan vaziyatda — oxirgi variant, odatda «rad etish»)
  useEffect(() => {
    if (timer === 0 && !busy)
      onSubmit({ ...d, choice: d.choice < 0 ? (ev?.options?.length || 1) - 1 : d.choice });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer]);
  const maxBuy = Math.max(
    0,
    Math.floor(
      ((cash.available - (d.ads + d.quality + (d.branch ? b.branchCost : 0) + d.repay)) * 1000) /
        cost /
        b.buyStep,
    ) * b.buyStep,
  );
  const short = cash.left < 0 ? Math.ceil(-cash.left / 10) * 10 : 0;
  const loanRoom = Math.max(0, Math.min(RULES.loanMax, RULES.debtLimit - p.debt - p.soft));
  const tip = advisor(g, i, d, f, cash.left, lang, rivalName);
  const submit = () => {
    setTried(true);
    if (needChoice) {
      document.getElementById('bz-event')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onSubmit(d);
  };
  return (
    <div className="bz-play">
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
        <section className="bz-card bz-decide" aria-labelledby="bz-dh">
          <h3 id="bz-dh">
            {L('Bu oy qarorlaringiz', 'Your decisions this month', 'Ваши решения в этом месяце')} ·{' '}
            {tx(lang, MONTHS[g.month - 1])}
          </h3>
          <Slider
            id="bz-price"
            label={L(
              `Narx (1 ${b.unit[0]} uchun, ming so‘m)`,
              `Price (per unit, thousand so‘m)`,
              `Цена (за ед., тыс. сум)`,
            )}
            min={b.price.min}
            max={b.price.max}
            step={b.price.step}
            value={d.price}
            onChange={(v) => set({ price: v })}
            note={L(
              `Tannarx ${Math.round(cost)} · marja ${Math.round(((d.price - cost) / d.price) * 100)}% · raqib o‘tgan oy: ${g.players[1 - i].last.price}`,
              `Unit cost ${Math.round(cost)} · margin ${Math.round(((d.price - cost) / d.price) * 100)}% · rival last month: ${g.players[1 - i].last.price}`,
              `Себестоимость ${Math.round(cost)} · маржа ${Math.round(((d.price - cost) / d.price) * 100)}% · соперник: ${g.players[1 - i].last.price}`,
            )}
            bad={d.price <= cost}
          />
          <Slider
            id="bz-buy"
            label={L(`Xarid (${b.unit[0]})`, `Purchase (${b.unit[1]})`, `Закупка (${b.unit[2]})`)}
            min={0}
            max={Math.max(b.buyStep, Math.ceil((capacity(g, p) * 1.6) / b.buyStep) * b.buyStep)}
            step={b.buyStep}
            value={d.buy}
            onChange={(v) => set({ buy: v })}
            note={L(
              `Omborda ${num(p.stock, lang)} · taxminiy talab ${num(f.low, lang)}–${num(f.high, lang)} · sig‘im ${num(f.capacity, lang)} · xarid narxi ${mln(cash.buy, lang)}`,
              `In stock ${num(p.stock, lang)} · expected demand ${num(f.low, lang)}–${num(f.high, lang)} · capacity ${num(f.capacity, lang)} · cost ${mln(cash.buy, lang)}`,
              `На складе ${num(p.stock, lang)} · ожидаемый спрос ${num(f.low, lang)}–${num(f.high, lang)} · мощность ${num(f.capacity, lang)} · стоимость ${mln(cash.buy, lang)}`,
            )}
            bad={d.buy > maxBuy}
          />
          <div className="bz-two">
            <Slider
              id="bz-ads"
              label={L('Reklama (mln)', 'Advertising (mln)', 'Реклама (млн)')}
              min={0}
              max={RULES.adsMax}
              step={1}
              value={d.ads}
              onChange={(v) => set({ ads: v })}
              note={L(
                'Obro‘ni oshiradi, har oy 15% so‘nadi',
                'Builds brand; fades 15% a month',
                'Растит бренд; угасает на 15%/мес.',
              )}
            />
            <Slider
              id="bz-quality"
              label={L(
                'Sifat va o‘qitish (mln)',
                'Quality & training (mln)',
                'Качество и обучение (млн)',
              )}
              min={0}
              max={RULES.qualityMax}
              step={1}
              value={d.quality}
              onChange={(v) => set({ quality: v })}
              note={L(
                'Sifatni oshiradi, har oy 10% pasayadi',
                'Raises quality; decays 10% a month',
                'Растит качество; −10%/мес.',
              )}
            />
          </div>
          <details
            className="bz-finance"
            open={d.loan > 0 || d.repay > 0 || d.branch || cash.left < 0}
          >
            <summary>
              🏦 {L('Moliya va kengayish', 'Finance and growth', 'Финансы и рост')}
              {(d.loan > 0 || d.repay > 0 || d.branch) && <em>●</em>}
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
                step={10}
                value={Math.min(d.loan, loanRoom)}
                onChange={(v) => set({ loan: v })}
                note={L(
                  `Qarz chegarasi: ${RULES.debtLimit} mln`,
                  `Debt limit: ${RULES.debtLimit} mln`,
                  `Лимит долга: ${RULES.debtLimit} млн`,
                )}
              />
              <Slider
                id="bz-repay"
                label={L('Qarzni qaytarish (mln)', 'Repay debt (mln)', 'Погасить долг (млн)')}
                min={0}
                max={Math.max(0, Math.floor(Math.min(p.debt, p.cash)))}
                step={1}
                value={Math.min(d.repay, Math.floor(p.debt))}
                onChange={(v) => set({ repay: v })}
                disabled={p.debt < 1}
                note={
                  p.soft
                    ? L(
                        `Imtiyozli kredit (${mln(p.soft, lang)}) o‘yin oxirigacha qoladi`,
                        `The subsidised loan (${mln(p.soft, lang)}) stays to the end`,
                        `Льготный кредит (${mln(p.soft, lang)}) остаётся до конца`,
                      )
                    : ''
                }
              />
            </div>
            <label
              className={
                'bz-check' + (p.branches + p.pending >= RULES.maxBranches ? ' is-off' : '')
              }
            >
              <input
                type="checkbox"
                checked={d.branch}
                disabled={p.branches + p.pending >= RULES.maxBranches}
                onChange={(e) => set({ branch: e.target.checked })}
              />
              <span>
                🏬{' '}
                {L(
                  `Yangi filial ochish — ${b.branchCost} mln`,
                  `Open a new branch — ${b.branchCost} mln`,
                  `Открыть филиал — ${b.branchCost} млн`,
                )}
                <small>
                  {L(
                    `Keyingi oydan ishlaydi: sig‘im +${num(b.cap, lang)}, raqobatda ustunlik, har oy +${b.fixed} mln doimiy xarajat.`,
                    `Works from next month: capacity +${num(b.cap, lang)}, a competitive edge, +${b.fixed} mln fixed costs a month.`,
                    `Работает со следующего месяца: мощность +${num(b.cap, lang)}, преимущество, +${b.fixed} млн в месяц.`,
                  )}
                </small>
              </span>
            </label>
          </details>
        </section>
        <aside className="bz-card bz-plan" aria-label={L('Reja', 'Plan', 'План')}>
          <h3>{L('Reja bo‘yicha', 'Your plan', 'По плану')}</h3>
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
            <div>
              <dt>− {L('Xarid', 'Purchase', 'Закупка')}</dt>
              <dd>{mln(cash.buy, lang)}</dd>
            </div>
            <div>
              <dt>− {L('Reklama va sifat', 'Ads and quality', 'Реклама и качество')}</dt>
              <dd>{mln(d.ads + d.quality, lang)}</dd>
            </div>
            {d.branch && (
              <div>
                <dt>− {L('Filial', 'Branch', 'Филиал')}</dt>
                <dd>{mln(b.branchCost, lang)}</dd>
              </div>
            )}
            {d.repay > 0 && (
              <div>
                <dt>− {L('Qarz qaytarish', 'Repayment', 'Погашение')}</dt>
                <dd>{mln(d.repay, lang)}</dd>
              </div>
            )}
            <div className={'bz-total' + (cash.left < 0 ? ' is-bad' : '')}>
              <dt>{L('Qoladi', 'Left', 'Останется')}</dt>
              <dd>{mln(cash.left, lang)}</dd>
            </div>
          </dl>
          {cash.left < 0 && (
            <div className="bz-alert" role="alert">
              {L(
                `Pul ${mln(-cash.left, lang)} yetmayapti — xarid kamaytiriladi.`,
                `You are ${mln(-cash.left, lang)} short — the purchase will be cut.`,
                `Не хватает ${mln(-cash.left, lang)} — закупка будет сокращена.`,
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
          <div className="bz-forecast">
            <span>{L('Taxminiy natija', 'Expected result', 'Ожидаемый итог')}</span>
            <b className={f.profit >= 0 ? 'up' : 'down'}>{mln(f.profit, lang, true)}</b>
            <small>
              {L(
                `Sotuv ≈ ${num(f.sales, lang)} · ulush ≈ ${f.share}% · doimiy xarajat ${mln(p.branches * b.fixed * p.fixedMult + p.extraFixed, lang)}`,
                `Sales ≈ ${num(f.sales, lang)} · share ≈ ${f.share}% · fixed costs ${mln(p.branches * b.fixed * p.fixedMult + p.extraFixed, lang)}`,
                `Продажи ≈ ${num(f.sales, lang)} · доля ≈ ${f.share}% · пост. расходы ${mln(p.branches * b.fixed * p.fixedMult + p.extraFixed, lang)}`,
              )}
            </small>
            <small className="muted">
              {L(
                'Raqibning shu oydagi qarori hali noma’lum.',
                'Your rival’s move this month is still unknown.',
                'Ход соперника пока неизвестен.',
              )}
            </small>
          </div>
          <p className="bz-tip">
            <Lightbulb size={16} aria-hidden="true" /> <span>{tip}</span>
          </p>
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
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  note?: string;
  bad?: boolean;
  disabled?: boolean;
}) {
  const lang = useLang();
  return (
    <div className={'bz-slider' + (bad ? ' is-bad' : '') + (disabled ? ' is-off' : '')}>
      <label htmlFor={id}>
        <span>{label}</span>
        <b>{num(value, lang)}</b>
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
        {ev.icon}
      </div>
      <div className="bz-event-body">
        <span className="bz-kicker">{L('Yangi vaziyat', 'New situation', 'Новая ситуация')}</span>
        <h3 id="bz-evh">{tx(lang, ev.title)}</h3>
        <p>{tx(lang, ev.text(b))}</p>
        {notes.map((n, k) => (
          <p key={k} className="bz-outcome">
            ➜ {tx(lang, n)}
          </p>
        ))}
        {ev.options && (
          <div className="bz-options" role="radiogroup" aria-label={tx(lang, ev.title)}>
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
      </div>
    </section>
  );
}

/** Maslahatchi: holatga qarab bitta eng muhim maslahat. */
function advisor(
  g: Game,
  i: number,
  d: Decision,
  f: ReturnType<typeof forecast>,
  left: number,
  lang: Lang,
  rivalName: string,
) {
  const b = bizOf(g.biz),
    p = g.players[i],
    r = g.players[1 - i],
    cost = unitCost(g, p),
    T = (t: Tri) => tx(lang, t);
  if (d.price <= cost * 1.05)
    return T([
      'Narx tannarxga juda yaqin: har sotuvdan deyarli pul qolmaydi, doimiy xarajatlar zararga olib keladi.',
      'Your price is barely above cost: almost nothing is left per sale and fixed costs will cause a loss.',
      'Цена почти равна себестоимости: с продажи почти ничего не остаётся.',
    ]);
  if (left < 0)
    return T([
      'Rejadagi to‘lovlarga pul yetmayapti. Xaridni kamaytiring yoki kredit oling — aks holda zaxira kam qoladi.',
      'You cannot afford the plan. Buy less or borrow — otherwise you will be short of stock.',
      'Денег на план не хватает. Сократите закупку или возьмите кредит.',
    ]);
  if (p.stock + d.buy < Math.min(f.low, f.capacity) * 0.97)
    return T([
      'Zaxira taxminiy talabdan kam: mijozlar bo‘sh qaytib, raqibga ketadi va obro‘ pasayadi.',
      'Your stock is below expected demand: customers will leave for your rival and your brand will suffer.',
      'Запас ниже ожидаемого спроса: клиенты уйдут к сопернику.',
    ]);
  if (p.stock + d.buy > f.high * 1.35 && b.spoil >= 0.2)
    return T([
      `Xarid talabdan ancha ko‘p: ortgani buziladi (${Math.round(b.spoil * 100)}%). Ortiqcha zaxira — muzlagan pul.`,
      `You are buying far more than demand: leftovers spoil (${Math.round(b.spoil * 100)}%). Excess stock is frozen money.`,
      `Закупка сильно больше спроса: остатки портятся (${Math.round(b.spoil * 100)}%).`,
    ]);
  if (p.last.capFull && p.branches + p.pending < RULES.maxBranches)
    return T([
      'O‘tgan oy sig‘im to‘lib, mijozlar qaytdi. Narxni biroz oshirish yoki yangi filial ochish vaqti kelgan bo‘lishi mumkin.',
      'Last month you were at full capacity and turned customers away. Consider a slightly higher price or a new branch.',
      'В прошлом месяце мощности не хватило. Подумайте о цене чуть выше или новом филиале.',
    ]);
  if (r.last.price && d.price > r.last.price * 1.15)
    return T([
      `${rivalName} sizdan ancha arzon. Yuqori narxni sifat va obro‘ bilan oqlay olasizmi?`,
      `${rivalName} is much cheaper. Can your quality and brand justify the higher price?`,
      `${rivalName} заметно дешевле. Оправдают ли качество и бренд вашу цену?`,
    ]);
  if (p.debt > 0 && p.cash > 120)
    return T([
      'Kassada pul ko‘p, qarz esa foiz yeyapti. Qarzning bir qismini qaytarishni o‘ylab ko‘ring.',
      'You have plenty of cash while debt keeps costing interest. Consider repaying part of it.',
      'Денег много, а долг стоит процентов. Подумайте о частичном погашении.',
    ]);
  if (p.cash > 200 && g.month <= 9)
    return T([
      'Kassada katta pul bekor yotibdi. Uni o‘sishga — filial, sifat yoki reklamaga — ishlatsangiz ko‘proq daromad keltiradi.',
      'A lot of cash is sitting idle. Investing it in growth — a branch, quality or ads — can earn more.',
      'В кассе простаивают крупные деньги. Вложите их в рост.',
    ]);
  if (g.month >= 10 && d.branch)
    return T([
      'O‘yin oxiriga oz qoldi: yangi filial xarajatini qoplashga ulgurmasligi mumkin.',
      'The game is almost over: a new branch may not pay for itself in time.',
      'До конца игры мало времени: филиал может не окупиться.',
    ]);
  return T([
    'Talab mavsumga qarab o‘zgaradi. Xaridni taxminiy talab oralig‘ida qiling va kassada zaxira pul qoldiring.',
    'Demand changes with the season. Buy within the expected range and keep some cash in reserve.',
    'Спрос зависит от сезона. Закупайте в пределах прогноза и держите резерв.',
  ]);
}

/** Oy hisoboti: foyda-zarar, izohlar, saboq va raqibning harakati. */
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
  const news: Tri[] = [];
  const prevRv = g.history[h.m - 2]?.players[1 - i];
  if (prevRv && rv.price < prevRv.price)
    news.push([
      `Narxni ${prevRv.price} dan ${rv.price} ga tushirdi.`,
      `Cut the price from ${prevRv.price} to ${rv.price}.`,
      `Снизил цену с ${prevRv.price} до ${rv.price}.`,
    ]);
  else if (prevRv && rv.price > prevRv.price)
    news.push([
      `Narxni ${rv.price} ga ko‘tardi.`,
      `Raised the price to ${rv.price}.`,
      `Поднял цену до ${rv.price}.`,
    ]);
  if (rv.ads >= 14)
    news.push([
      'Katta reklama kampaniyasini boshladi.',
      'Launched a big ad campaign.',
      'Запустил крупную рекламную кампанию.',
    ]);
  if (rv.qualityBudget >= 10)
    news.push([
      'Xodimlarini o‘qitib, sifatni oshirmoqda.',
      'Is training staff to raise quality.',
      'Обучает персонал и повышает качество.',
    ]);
  if (rv.openedBranch)
    news.push(['Yangi filial ochmoqda.', 'Is opening a new branch.', 'Открывает новый филиал.']);
  if (rv.lost > b.buyStep)
    news.push([
      'Mijozlarining bir qismiga xizmat ko‘rsata olmadi.',
      'Could not serve some of its customers.',
      'Не смог обслужить часть клиентов.',
    ]);
  return (
    <div className="bz-report">
      <section className="bz-card" aria-labelledby="bz-rh">
        <h3 id="bz-rh">
          📊 {tx(lang, MONTHS[h.m - 1])}: {L('oy hisoboti', 'monthly report', 'отчёт за месяц')}
        </h3>
        <div className="bz-report-top">
          <div>
            <span>{L('Sotildi', 'Sold', 'Продано')}</span>
            <b>
              {num(me.sold + me.corporate, lang)} / {num(me.demand + me.corporate, lang)}
            </b>
            <small>{L('sotuv / talab', 'sales / demand', 'продажи / спрос')}</small>
          </div>
          <div>
            <span>{L('Sof foyda', 'Net profit', 'Чистая прибыль')}</span>
            <b className={me.profit >= 0 ? 'up' : 'down'}>{mln(me.profit, lang, true)}</b>
            <small>{L('shu oy', 'this month', 'за месяц')}</small>
          </div>
          <div>
            <span>{L('Sof kapital', 'Net worth', 'Капитал')}</span>
            <b>{mln(me.worth, lang)}</b>
            <small>
              {rivalName}: {mln(rv.worth, lang)}
            </small>
          </div>
        </div>
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
        {(me.outcome || me.notes.length > 0) && (
          <ul className="bz-notes">
            {me.outcome && <li>🎲 {tx(lang, me.outcome)}</li>}
            {me.notes.map((n, k) => (
              <li key={k}>{tx(lang, n)}</li>
            ))}
          </ul>
        )}
      </section>
      <div className="bz-cols">
        <section className="bz-card" aria-labelledby="bz-nh">
          <h3 id="bz-nh">🕵️ {rivalName}</h3>
          <p className="muted">
            {L('Narx', 'Price', 'Цена')}: <b>{rv.price}</b> · {L('sotuv', 'sales', 'продажи')}:{' '}
            <b>{num(rv.sold + rv.corporate, lang)}</b> · {L('ulush', 'share', 'доля')}:{' '}
            <b>{Math.round(rv.share)}%</b>
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
              {tx(lang, ev.title)}
            </h3>
            <p>{tx(lang, ev.lesson)}</p>
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

/** Yakuniy natija: g'olib, sof kapital grafigi, ko'rsatkichlar, shaxsiy saboqlar. */
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
    rv = g.players[1 - i],
    won = g.winner === i,
    tie = g.winner === 2;
  const tips = useMemo(() => lessons(g, i), [g, i]);
  const pts = g.history.map((h) => [h.players[i].worth, h.players[1 - i].worth]);
  const all = [RULES.startCash, ...pts.flat()],
    hi = Math.max(...all),
    lo = Math.min(...all, 0),
    W = 600,
    H = 200,
    x = (k: number) => 30 + (k * (W - 50)) / RULES.months,
    y = (v: number) => H - 24 - ((v - lo) / Math.max(1, hi - lo)) * (H - 40);
  const line = (j: number) =>
    [`${x(0)},${y(RULES.startCash)}`, ...pts.map((p, k) => `${x(k + 1)},${y(p[j])}`)].join(' ');
  const s = me.stats,
    rs = rv.stats;
  return (
    <div className="bz-final">
      <section
        className={'bz-card bz-verdict' + (won ? ' is-win' : tie ? ' is-tie' : ' is-loss')}
        aria-live="polite"
      >
        <span className="bz-verdict-icon" aria-hidden="true">
          {won ? '🏆' : tie ? '🤝' : me.bankrupt ? '💥' : '📉'}
        </span>
        <div>
          <h2>
            {won
              ? L(
                  'G‘alaba! Siz ko‘proq pul ishlab topdingiz',
                  'Victory! You earned more money',
                  'Победа! Вы заработали больше',
                )
              : tie
                ? L('Durang!', 'A draw!', 'Ничья!')
                : me.bankrupt
                  ? L('Bankrot bo‘ldingiz', 'You went bankrupt', 'Вы обанкротились')
                  : L(
                      'Raqib bu safar oldinda',
                      'Your rival won this time',
                      'В этот раз победил соперник',
                    )}
          </h2>
          <p>
            {me.bankrupt
              ? L(
                  'Qarz chegarasidan oshib ketdi. Tadbirkor uchun pul oqimi foydadan ham muhim: kassa bo‘sh qolsa, eng yaxshi g‘oya ham to‘xtaydi.',
                  'Your debt passed the limit. Cash flow matters even more than profit: when the till is empty, even the best idea stops.',
                  'Долг превысил лимит. Денежный поток важнее прибыли.',
                )
              : rv.bankrupt
                ? L(
                    `${rivalName} bankrot bo‘ldi va bozordan chiqdi.`,
                    `${rivalName} went bankrupt and left the market.`,
                    `${rivalName} обанкротился.`,
                  )
                : L(
                    `12 oyda siz ${mln(earned(g, me), lang, true)}, ${rivalName} esa ${mln(earned(g, rv), lang, true)} ishlab topdi.`,
                    `In 12 months you earned ${mln(earned(g, me), lang, true)} and ${rivalName} earned ${mln(earned(g, rv), lang, true)}.`,
                    `За 12 месяцев вы заработали ${mln(earned(g, me), lang, true)}, ${rivalName} — ${mln(earned(g, rv), lang, true)}.`,
                  )}
          </p>
        </div>
      </section>
      <div className="bz-cols">
        <section className="bz-card" aria-labelledby="bz-ch">
          <h3 id="bz-ch">
            📈 {L('Sof kapital oyma-oy', 'Net worth month by month', 'Капитал по месяцам')}
          </h3>
          <svg
            className="bz-chart"
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={L('Sof kapital grafigi', 'Net worth chart', 'График капитала')}
          >
            <line
              x1={x(0)}
              x2={x(12)}
              y1={y(RULES.startCash)}
              y2={y(RULES.startCash)}
              className="bz-chart-base"
            />
            <polyline points={line(1)} className="bz-chart-rival" />
            <polyline points={line(0)} className="bz-chart-me" />
            <text x={x(0)} y={y(RULES.startCash) - 6} className="bz-chart-label">
              {RULES.startCash}
            </text>
          </svg>
          <p className="bz-legend">
            <span className="me">■ {myName}</span> <span className="rv">■ {rivalName}</span>
          </p>
        </section>
        <section className="bz-card" aria-labelledby="bz-sh">
          <h3 id="bz-sh">🧾 {L('Natijalar', 'Results', 'Итоги')}</h3>
          <table className="bz-pl bz-compare">
            <thead>
              <tr>
                <th />
                <th>{myName}</th>
                <th>{rivalName}</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  [
                    L('Sof kapital', 'Net worth', 'Капитал'),
                    mln(worth(g, me), lang),
                    mln(worth(g, rv), lang),
                  ],
                  [
                    L('Ishlab topilgan pul', 'Money earned', 'Заработано'),
                    mln(earned(g, me), lang, true),
                    mln(earned(g, rv), lang, true),
                  ],
                  [
                    L('Jami tushum', 'Total revenue', 'Выручка'),
                    mln(s.revenue, lang),
                    mln(rs.revenue, lang),
                  ],
                  [
                    L('Boy berilgan sotuv', 'Missed sales', 'Упущенные продажи'),
                    num(s.lost, lang),
                    num(rs.lost, lang),
                  ],
                  [
                    L('Buzilgan zaxira', 'Spoiled stock', 'Испорчено'),
                    mln(s.spoiledMoney, lang),
                    mln(rs.spoiledMoney, lang),
                  ],
                  [L('Reklama', 'Advertising', 'Реклама'), mln(s.ads, lang), mln(rs.ads, lang)],
                  [
                    L('Foiz va jarimalar', 'Interest and fees', 'Проценты и штрафы'),
                    mln(s.interest + s.emergency * RULES.emergencyFee, lang),
                    mln(rs.interest + rs.emergency * RULES.emergencyFee, lang),
                  ],
                  [L('Filiallar', 'Branches', 'Филиалы'), String(me.branches), String(rv.branches)],
                ] as [string, string, string][]
              ).map(([k, a, z]) => (
                <tr key={k}>
                  <th scope="row">{k}</th>
                  <td>{a}</td>
                  <td>{z}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted bz-small">
            {L(
              'Sof kapital = kassa − qarzlar + zaxira (80%) + filial va uskunalar (60%).',
              'Net worth = cash − debts + stock (80%) + branches and equipment (60%).',
              'Капитал = касса − долги + запас (80%) + филиалы и оборудование (60%).',
            )}
          </p>
        </section>
      </div>
      <section className="bz-card bz-lessons" aria-labelledby="bz-lh2">
        <h3 id="bz-lh2">🎓 {L('Sizga shaxsiy saboqlar', 'Your personal lessons', 'Ваши уроки')}</h3>
        <ul>
          {tips.map((t, k) => (
            <li key={k}>
              <span aria-hidden="true">{t.icon}</span> {tx(lang, t.text)}
            </li>
          ))}
        </ul>
        <p className="bz-skills">
          {L(
            `Bu o‘yinda siz narx belgilash, talabni prognozlash, aylanma mablag‘ va kreditni boshqarish, investitsiya qarorlari va raqobat strategiyasini mashq qildingiz. Mavzu: ${tx(lang, b.name)}.`,
            `You practised pricing, demand forecasting, managing working capital and loans, investment decisions and competitive strategy. Business: ${tx(lang, b.name)}.`,
            `Вы потренировали ценообразование, прогноз спроса, управление оборотным капиталом и кредитами, инвестиционные решения и конкурентную стратегию.`,
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
