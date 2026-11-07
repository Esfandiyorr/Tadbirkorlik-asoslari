import { describe, expect, it } from 'vitest';
import {
  BUSINESSES,
  EVENTS,
  INVEST,
  INV_ORDER,
  RULES,
  TOPICS,
  applySetup,
  badges,
  bizOf,
  botDecision,
  botSetup,
  canBuy,
  capacity,
  clampDecision,
  clampSetup,
  dexp,
  earned,
  eventOf,
  eventPlan,
  forecast,
  lessons,
  money,
  newGame,
  playMonth,
  replay,
  setupCost,
  strategyOf,
  worth,
  type BizId,
  type BotId,
  type Decision,
  type Game,
  type Setup,
} from '../lib/biznes';

/* 💼 «Biznes» o'yini: deterministik dvigatel (kursdoshlar o'yinida ikkala kompyuter bir xil hisoblaydi),
   biznes-reja, buxgalteriya (foyda va kassa), segmentlar, investitsiyalar, vaziyatlar va botlar. */

const BIZ: BizId[] = ['somsa', 'gadjet', 'markaz'];
const fin = (x: number) => Number.isFinite(x);
const sum = (xs: number[]) => xs.reduce((a, x) => a + x, 0);
const lineOf = (lines: { key: string; v: number }[], k: string) =>
  lines.find((l) => l.key === k)?.v || 0;
const PLAN: Setup = { loc: 'bozor', equip: 'lease', staff: 3, launch: 8 };
/** Shu shartga mos vaziyatlar rejasi bo'lgan birinchi urug' (seed). */
function seedWith(pred: (plan: string[]) => boolean) {
  for (let s = 1; s < 50000; s++) if (pred(eventPlan(s))) return s;
  throw new Error('seed topilmadi');
}
function started(biz: BizId, seed: number, a: Partial<Setup> = PLAN, z: Partial<Setup> = PLAN) {
  const g = newGame(biz, seed);
  applySetup(g, [a, z]);
  return g;
}
/** Oddiy oqilona qaror: standart sifat, odatiy narx, hajm — taxminiy talab. */
function steady(g: Game, i: number, extra: Partial<Decision> = {}): Partial<Decision> {
  const b = bizOf(g.biz),
    p = g.players[i];
  const d: Partial<Decision> = {
    price: b.price.ref,
    grade: 1,
    mkt: [3, 3, 3],
    staff: p.staff,
    choice: 0,
    ...extra,
  };
  const f = forecast(g, i, { ...d, volume: 0 });
  if (b.kind !== 'service')
    d.volume = Math.max(0, Math.min(f.demand, f.capacity) - (b.kind === 'stock' ? p.stock : 0));
  return { ...d, ...extra };
}
function botGame(biz: BizId, seed: number, a: BotId, z: BotId) {
  const g = newGame(biz, seed);
  const setup: [Setup, Setup] = [botSetup(g, 0, a), botSetup(g, 1, z)];
  applySetup(g, setup);
  const months: [Decision, Decision][] = [];
  while (!g.over) {
    const d: [Decision, Decision] = [botDecision(g, 0, a), botDecision(g, 1, z)];
    months.push(d);
    playMonth(g, d);
  }
  return { g, setup, months };
}

describe('mazmun', () => {
  it('uchala biznes, 15 mavzu va har bir vaziyat uch tilda to‘liq', () => {
    expect(BUSINESSES.map((b) => b.id)).toEqual(BIZ);
    expect(TOPICS).toHaveLength(15);
    for (const b of BUSINESSES) {
      expect([...b.name, ...b.about, ...b.unit].every(Boolean)).toBe(true);
      for (const s of b.segs) expect(s.season).toHaveLength(12);
      for (const e of EVENTS) {
        expect([...e.title(b), ...e.text(b), ...e.lesson(b)].every(Boolean)).toBe(true);
        expect(!!e.global !== !!e.options).toBe(true);
        expect(e.topic).toBeGreaterThanOrEqual(1);
        expect(e.topic).toBeLessThanOrEqual(15);
        for (const o of e.options || []) expect([...o.label, ...o.hint].every(Boolean)).toBe(true);
      }
      for (const id of INV_ORDER)
        expect([...INVEST[id].name(b), ...INVEST[id].text(b)].every(Boolean)).toBe(true);
    }
  });

  it('dexp — Math.exp bilan bir xil (faqat +, −, ×, ÷ bilan)', () => {
    for (let x = -12; x <= 12; x += 0.37)
      expect(Math.abs(dexp(x) / Math.exp(x) - 1)).toBeLessThan(1e-12);
  });
});

describe('vaziyatlar rejasi', () => {
  it('1-oy tinch, keyin 11 ta turli vaziyat; umumiylari ko‘pi bilan 4 ta; zanjirlar va «from» to‘g‘ri', () => {
    for (let s = 1; s <= 500; s++) {
      const plan = eventPlan(s * 31 + 7);
      expect(plan).toHaveLength(RULES.months);
      expect(plan[0]).toBe('');
      const ids = plan.slice(1);
      expect(new Set(ids).size).toBe(11);
      expect(
        ids.filter((id) => eventOf(id)!.global && !eventOf(id)!.after).length,
      ).toBeLessThanOrEqual(4);
      ids.forEach((id, k) => {
        const e = eventOf(id)!;
        expect(e.from || 0).toBeLessThanOrEqual(k + 2);
        if (e.after) {
          expect(ids.indexOf(e.after)).toBeGreaterThanOrEqual(0);
          expect(ids.indexOf(e.after)).toBeLessThan(k);
        }
      });
    }
  });
});

describe('biznes-reja (0-raund)', () => {
  it('pul taqsimoti: uskuna, 1-oy ijarasi, yollash va reklama — qolgani aylanma mablag‘', () => {
    const b = bizOf('somsa');
    expect(clampSetup(b, {})).toMatchObject({ loc: 'bozor', equip: 'lease', staff: 3, launch: 0 });
    expect(
      clampSetup(b, { loc: 'x' as never, equip: 'y' as never, staff: 99, launch: 99 }),
    ).toMatchObject({
      loc: 'bozor',
      equip: 'lease',
      staff: b.staffMax,
      launch: RULES.launchMax,
    });
    const s: Setup = { loc: 'uni', equip: 'new', staff: 4, launch: 10 };
    const c = setupCost(b, s);
    expect(c).toMatchObject({
      equipCost: 30,
      deposit: 8,
      hiring: 7,
      launch: 10,
      total: 55,
      left: 45,
    });
    const g = newGame('somsa', 5);
    expect(g.month).toBe(0);
    expect(() => playMonth(g, [{}, {}])).toThrow();
    applySetup(g, [s, { loc: 'mahalla', equip: 'used', staff: 2, launch: 0 }]);
    expect(g.month).toBe(1);
    const [p, q] = g.players;
    expect(p.cash).toBe(45);
    expect(p.flags.prepaidRent).toBe(8);
    // sof kapital: uskunaning 40% i darhol qadrsizlanadi, yollash va reklama — xarajat
    expect(worth(p)).toBeCloseTo(100 - 30 * 0.4 - 7 - 10, 5);
    expect(p.equipCap).toBe(9000);
    expect(q.equipRisk).toBeGreaterThan(0);
    // joy: yaqin guruh sizni oldindan biladi
    expect(p.aw[0]).toBeGreaterThan(p.aw[2]);
    expect(q.aw[2]).toBeGreaterThan(q.aw[0]);
    expect(() => applySetup(g, [s, s])).toThrow();
  });
});

describe('deterministik dvigatel', () => {
  it('bir xil urug‘, reja va qarorlar — bir xil natija (JSON orqali o‘tsa ham)', () => {
    for (const biz of BIZ) {
      const { g, setup, months } = botGame(biz, 4242, 3, 1);
      expect(g.over).toBe(true);
      expect(g.history).toHaveLength(RULES.months);
      const again = replay(
        biz,
        4242,
        JSON.parse(JSON.stringify(setup)),
        JSON.parse(JSON.stringify(months)),
      );
      expect(again).toEqual(g);
      const half = replay(biz, 4242, setup, months.slice(0, 6));
      expect(half.month).toBe(7);
      expect(half.history).toEqual(g.history.slice(0, 6));
      expect(replay(biz, 4242, null, []).month).toBe(0);
    }
  });

  it('noto‘g‘ri yoki g‘alati qarorlar qoidalarga moslanadi', () => {
    const g = started('somsa', 9),
      b = bizOf('somsa');
    expect(clampDecision(g, 0, {})).toMatchObject({
      price: b.price.ref,
      grade: 1,
      volume: 0,
      mkt: [0, 0, 0],
      staff: 3,
      buy: [],
      loan: 0,
      repay: 0,
    });
    expect(
      clampDecision(g, 0, {
        price: 999,
        grade: 7,
        volume: -5,
        mkt: [50, -3, 4.4],
        staff: 99,
        loan: 1000,
        buy: ['cap', 'cap', 'x' as never, 'pos'],
      }),
    ).toMatchObject({
      price: b.price.max,
      grade: 2,
      volume: 0,
      mkt: [RULES.mktMax, 0, 4],
      staff: b.staffMax,
      loan: RULES.loanMax,
      buy: ['cap', 'pos'],
    });
    expect(clampDecision(g, 0, { price: 12.3, volume: 1234 })).toMatchObject({
      price: 12.5,
      volume: 1200,
    });
    expect(clampDecision(g, 0, { price: NaN, grade: NaN })).toMatchObject({
      price: b.price.ref,
      grade: 0,
    });
    g.players[0].debt = 130;
    expect(clampDecision(g, 0, { loan: 40, repay: 500 })).toMatchObject({ loan: 20, repay: 130 });
    const s = seedWith((p) => (eventOf(p[1])?.options?.length || 0) >= 2);
    const e = started('gadjet', s);
    playMonth(e, [steady(e, 0), steady(e, 1)]);
    expect(clampDecision(e, 0, { choice: 9 }).choice).toBe(
      eventOf(e.events[1])!.options!.length - 1,
    );
    expect(clampDecision(e, 0, { choice: -1 }).choice).toBe(0);
    expect(clampDecision(started('markaz', 3), 0, { volume: 500 }).volume).toBe(0);
  });
});

describe('foyda va kassa', () => {
  it('har oy: foyda qatorlari yig‘indisi = sof foyda, kassa oqimi yig‘indisi = kassa o‘zgarishi', () => {
    for (const biz of BIZ)
      for (const [a, z] of [
        [3, 1],
        [2, 0],
      ] as [BotId, BotId][]) {
        const { g } = botGame(biz, 900 + a * 10 + z, a, z);
        for (const i of [0, 1]) {
          let cash = g.setup![i].cash;
          for (const h of g.history) {
            const x = h.players[i];
            expect(sum(x.lines.map((l) => l.v))).toBeCloseTo(x.profit, 1);
            expect(cash + sum(x.flow.map((l) => l.v))).toBeCloseTo(x.cash, 1);
            cash = x.cash;
          }
          // 12 oylik foyda = sof kapital o'zgarishi (investor puli foyda emas)
          const p = g.players[i],
            s = g.setup![i];
          const start = s.cash + s.equipCost * RULES.assetValue + s.deposit;
          expect(sum(g.history.map((h) => h.players[i].profit))).toBeCloseTo(
            worth(p) - start - p.invested,
            1,
          );
          expect([p.cash, p.debt, p.stock, p.rep, p.skill, worth(p)].every(fin)).toBe(true);
          expect(p.cash).toBeGreaterThanOrEqual(0);
          expect(p.stock).toBeGreaterThanOrEqual(0);
        }
      }
  });

  it('somsaxona: ortiqcha ishlab chiqarilgani isrof, kami — mijoz raqibga', () => {
    const g = started('somsa', 77);
    const rec = playMonth(g, [
      { price: 12, grade: 1, volume: 9000, mkt: [3, 3, 3], staff: 5 },
      { price: 12, grade: 1, volume: 1000, mkt: [3, 3, 3], staff: 3 },
    ]);
    const [a, z] = rec.players;
    expect(z.served).toBe(1000);
    expect(z.lost).toBeGreaterThan(500);
    expect(a.spill).toBeGreaterThan(0);
    expect(a.waste).toBe(a.volume - a.served);
    expect(lineOf(a.lines, 'waste')).toBeCloseTo((-a.waste * 5) / 1000, 1);
    expect(lineOf(a.lines, 'tax')).toBeCloseTo(-a.revenue * RULES.tax, 2);
    expect(lineOf(a.lines, 'rent')).toBe(-7);
    expect(a.flow.find((l) => l.key === 'fixed')!.v).toBeCloseTo(-(5 * 3.5 + 2 + 3), 2); // 1-oy ijarasi oldindan to'langan
    expect(a.notes.some((n) => n[0].includes('isrof'))).toBe(true);
    expect(z.notes.some((n) => n[0].includes('mahsulot yetmadi'))).toBe(true);
  });

  it('gadjet do‘koni: zaxira keyingi oyga o‘tadi va eskiradi; arzon tovar qaytariladi', () => {
    const g = started('gadjet', 12);
    playMonth(g, [
      { price: 74, grade: 0, volume: 2200, mkt: [3, 3, 3], staff: 3 },
      { price: 74, grade: 2, volume: 600, mkt: [3, 3, 3], staff: 3 },
    ]);
    const [a, z] = g.history[0].players;
    const left = 2200 - a.served;
    expect(left).toBeGreaterThan(0);
    expect(a.waste).toBe(Math.floor(left * 0.05));
    expect(g.players[0].stock).toBe(left - a.waste);
    expect(g.players[0].stockCost).toBeGreaterThan(0);
    expect(lineOf(a.lines, 'returns')).toBeLessThan(0);
    expect(Math.abs(lineOf(z.lines, 'returns'))).toBeLessThan(Math.abs(lineOf(a.lines, 'returns')));
    expect(a.sat).toBeLessThan(z.sat);
  });

  it('o‘quv markazi: qoniqqan o‘quvchilar qoladi, premium — kichik guruhlar', () => {
    const g = started('markaz', 21);
    const b = bizOf('markaz');
    expect(capacity(b, g.players[0], 2)).toBe(Math.round(150 * 0.85));
    expect(capacity(b, g.players[0], 0)).toBe(Math.round(150 * 1.1));
    playMonth(g, [steady(g, 0), steady(g, 1)]);
    const first = g.history[0].players[0];
    expect(sum(g.players[0].reg)).toBeGreaterThan(first.served * 0.5);
    playMonth(g, [steady(g, 0), steady(g, 1)]);
    expect(g.history[1].players[0].segs.reduce((a, s) => a + s.reg, 0)).toBeGreaterThan(0);
  });

  it('kredit foizi 2%, qarz oy oxirida qaytariladi; kassa minusga tushsa — favqulodda qarz, chegaradan oshsa — bankrot', () => {
    const g = started('somsa', 31);
    playMonth(g, [steady(g, 0, { loan: 40 }), steady(g, 1)]);
    expect(g.players[0].debt).toBe(40);
    expect(lineOf(g.history[0].players[0].lines, 'interest')).toBe(-0.8);
    playMonth(g, [steady(g, 0, { repay: 25 }), steady(g, 1)]);
    expect(g.players[0].debt).toBe(15);
    // kassa yo'q, savdo yo'q — bank favqulodda qarz beradi
    g.players[0].cash = 2;
    playMonth(g, [{ price: 12, volume: 0, mkt: [0, 0, 0], staff: 3 }, steady(g, 1)]);
    const x = g.history[2].players[0];
    expect(x.emergency).toBeGreaterThan(0);
    expect(g.players[0].cash).toBe(0);
    expect(lineOf(x.lines, 'emergency')).toBeCloseTo(-x.emergency * RULES.emergencyFee, 2);
    expect(g.over).toBe(false);
    g.players[0].debt = RULES.debtLimit - 1;
    playMonth(g, [{ price: 12, volume: 0, mkt: [0, 0, 0], staff: 3 }, steady(g, 1)]);
    expect(g.players[0].bankrupt).toBe(true);
    expect(g.over).toBe(true);
    expect(g.winner).toBe(1);
  });

  it('jamoa: yollash va bo‘shatish pulli, yangi xodim mahoratni pasaytiradi; sig‘im — jamoa va uskunaning kichigi', () => {
    const g = started('somsa', 41),
      b = bizOf('somsa');
    expect(capacity(b, g.players[0])).toBe(6000);
    const skill = g.players[0].skill;
    playMonth(g, [steady(g, 0, { staff: 6 }), steady(g, 1, { staff: 2 })]);
    const [a, z] = g.history[0].players;
    expect(lineOf(a.lines, 'hiring')).toBe(-3 * 3.5 * RULES.hireCost);
    expect(lineOf(z.lines, 'hiring')).toBe(-3.5 * RULES.fireCost);
    expect(g.players[0].skill).toBeLessThan(skill + 2.5);
    expect(capacity(b, g.players[0])).toBe(9000); // uskuna cheklaydi
  });
});

describe('investitsiyalar', () => {
  it('sig‘im, filial (4-oydan), takrorlanadigan trening; mulk 60% qiymatda qoladi', () => {
    const g = started('somsa', 51),
      b = bizOf('somsa'),
      p = g.players[0];
    expect(canBuy(g, p, 'branch')).toBe(false);
    expect(canBuy(g, p, 'training')).toBe(true);
    const cap0 = p.equipCap;
    playMonth(g, [steady(g, 0, { buy: ['cap', 'training', 'branch'] }), steady(g, 1)]);
    const x = g.history[0].players[0];
    expect(x.bought).toEqual(['cap', 'training']);
    expect(p.equipCap).toBe(cap0 + Math.round(b.equip.new.cap * 0.6));
    expect(p.owned).toMatchObject({ cap: 1, training: 1 });
    // uskuna — mulk: 40% qadrsizlanish foyda-zararda, trening — to'liq xarajat
    expect(lineOf(x.lines, 'invest')).toBeCloseTo(-(INVEST.cap.cost(b, p) * 0.4 + 1.2 * 3), 2);
    playMonth(g, [steady(g, 0, { buy: ['cap'] }), steady(g, 1)]);
    expect(canBuy(g, p, 'cap')).toBe(false);
    expect(canBuy(g, p, 'training')).toBe(true);
    g.month = 4;
    expect(canBuy(g, p, 'branch')).toBe(true);
  });

  it('bozor tadqiqoti prognozni aniqroq qiladi; pul yetmasa investitsiya qilinmaydi', () => {
    const g = started('gadjet', 61);
    expect(forecast(g, 0, steady(g, 0)).spread).toBe(0.12);
    playMonth(g, [steady(g, 0, { buy: ['research'] }), steady(g, 1)]);
    expect(forecast(g, 0, steady(g, 0)).spread).toBe(0.04);
    g.players[1].cash = 5;
    playMonth(g, [steady(g, 0), { ...steady(g, 1), buy: ['design'], volume: 0 }]);
    expect(g.history[1].players[1].bought).toEqual([]);
    expect(g.history[1].players[1].notes.some((n) => n[0].includes('pul yetmadi'))).toBe(true);
  });
});

describe('mijozlar guruhlari', () => {
  it('arzon narx talabalarni, premium sifat oilalarni tortadi; reklama o‘z guruhiga yetadi', () => {
    const g = started(
      'somsa',
      71,
      { loc: 'bozor', equip: 'lease', staff: 4, launch: 6 },
      { loc: 'bozor', equip: 'lease', staff: 4, launch: 6 },
    );
    const cheap = forecast(g, 0, { price: 10, grade: 0, mkt: [3, 3, 3], staff: 4 });
    const premium = forecast(g, 0, { price: 15, grade: 2, mkt: [3, 3, 3], staff: 4 });
    expect(cheap.segs[0].demand).toBeGreaterThan(premium.segs[0].demand);
    expect(premium.segs[2].demand).toBeGreaterThan(cheap.segs[2].demand);
    const toStudents = forecast(g, 0, { price: 12, grade: 1, mkt: [9, 0, 0], staff: 4 });
    const toFamilies = forecast(g, 0, { price: 12, grade: 1, mkt: [0, 0, 9], staff: 4 });
    expect(toStudents.segs[0].aw).toBeGreaterThan(toFamilies.segs[0].aw);
    expect(toFamilies.segs[2].aw).toBeGreaterThan(toStudents.segs[2].aw);
  });
});

describe('vaziyatlar', () => {
  const play = (biz: BizId, seed: number, until: number, pick: (g: Game, i: number) => number) => {
    const g = started(biz, seed);
    while (g.month < until)
      playMonth(g, [steady(g, 0, { choice: pick(g, 0) }), steady(g, 1, { choice: pick(g, 1) })]);
    return g;
  };
  it('sug‘urta → yong‘in: sug‘urtalangan hech narsa yo‘qotmaydi', () => {
    const s = seedWith((p) => p.includes('disaster'));
    const plan = eventPlan(s);
    const g = play('gadjet', s, plan.indexOf('disaster') + 1, (x, i) =>
      x.events[x.month - 1] === 'insurance' ? i : 0,
    );
    expect(g.players[0].flags.insured).toBe(1);
    expect(g.players[1].flags.insured).toBeUndefined();
    expect(g.pre.pnl[0]).toBe(0);
    expect(g.pre.pnl[1]).toBeLessThanOrEqual(-12);
    expect(g.players[1].flags.closed).toBe(g.month);
    const rec = playMonth(g, [steady(g, 0), steady(g, 1)]);
    expect(lineOf(rec.players[1].lines, 'event')).toBeLessThanOrEqual(-12);
    expect(rec.players[1].capacity).toBeLessThan(rec.players[0].capacity);
  });

  it('ruxsatnoma → tekshiruv, rasmiy ish haqi → soliq tekshiruvi', () => {
    const s = seedWith((p) => p.includes('inspect'));
    const g = play('somsa', s, eventPlan(s).indexOf('inspect') + 1, (x, i) =>
      x.events[x.month - 1] === 'license' ? i : 0,
    );
    expect(g.pre.pnl[0]).toBe(0);
    expect(g.pre.pnl[1]).toBeLessThanOrEqual(-10);
    const t = seedWith((p) => p.includes('taxcheck'));
    const h = play('markaz', t, eventPlan(t).indexOf('taxcheck') + 1, (x, i) =>
      x.events[x.month - 1] === 'payroll' ? i : 0,
    );
    expect(h.players[0].flags.official).toBe(1);
    expect(h.pre.pnl[0]).toBe(0);
    expect([0, -15]).toContain(h.pre.pnl[1]);
  });

  it('investor: pul beradi, lekin o‘yin oxirida ulushini oladi', () => {
    const s = seedWith((p) => p.indexOf('investor') >= 1 && p.indexOf('investor') <= 4);
    const at = eventPlan(s).indexOf('investor') + 1;
    const g = play('somsa', s, at, () => 0);
    const cash = g.players[0].cash;
    playMonth(g, [steady(g, 0, { choice: 0 }), steady(g, 1, { choice: 1 })]);
    expect(g.players[0].equity).toBe(0.2);
    expect(g.players[0].invested).toBe(40);
    expect(g.history.at(-1)!.players[0].flow.find((l) => l.key === 'investor')!.v).toBe(40);
    expect(g.players[0].cash).toBeGreaterThan(cash);
    expect(money(g.players[0])).toBeCloseTo(worth(g.players[0]) * 0.8, 1);
    expect(lineOf(g.history.at(-1)!.players[0].lines, 'event')).toBe(0);
  });

  it('MVP: bozor javobi ikkala o‘yinchi uchun bir xil; kichik sinov kam yo‘qotadi', () => {
    const s = seedWith((p) => p[1] === 'mvp');
    const g = started('gadjet', s);
    playMonth(g, [steady(g, 0), steady(g, 1)]);
    const before = [g.players[0].cash, g.players[1].cash];
    playMonth(g, [steady(g, 0, { choice: 0 }), steady(g, 1, { choice: 1 })]);
    const [a, z] = g.history[1].players;
    expect(a.outcome).toBeTruthy();
    expect(z.outcome).toBeTruthy();
    expect(lineOf(a.lines, 'event')).toBe(-3);
    expect(lineOf(z.lines, 'event')).toBe(-12);
    const hit = a.outcome![0].includes('muvaffaqiyatli');
    expect(z.outcome![0].includes('Omadingiz keldi')).toBe(hit);
    expect(before.every(fin)).toBe(true);
  });

  it('katta buyurtma: yetkazilmasa jarima va obro‘ pasayadi; nasiya — pul keyingi oy', () => {
    const s = seedWith((p) => p[1] === 'bulk');
    const g = started('somsa', s);
    playMonth(g, [steady(g, 0), steady(g, 1)]);
    const rep = g.players[0].rep;
    playMonth(g, [
      { ...steady(g, 0, { choice: 0 }), volume: 0 },
      { ...steady(g, 1, { choice: 0, staff: 5 }), volume: 9000 },
    ]);
    const [a, z] = g.history[1].players;
    expect(lineOf(a.lines, 'penalty')).toBe(-5);
    expect(a.notes.some((n) => n[0].includes('to‘liq bajarilmadi'))).toBe(true);
    expect(g.players[0].rep).toBeLessThan(rep + 10);
    expect(z.bulk).toBe(2000);
    const n = seedWith((p) => p[1] === 'nasiya');
    const h = started('somsa', n);
    playMonth(h, [steady(h, 0), steady(h, 1)]);
    playMonth(h, [steady(h, 0, { choice: 0 }), steady(h, 1, { choice: 1 })]);
    expect(h.players[0].recv).toBeCloseTo(h.history[1].players[0].revenue * 0.2, 1);
    playMonth(h, [steady(h, 0), steady(h, 1)]);
    expect(lineOf(h.history[2].players[0].lines, 'baddebt')).toBeLessThan(0);
    expect(h.history[2].players[0].flow.find((l) => l.key === 'collected')!.v).toBeGreaterThan(0);
  });
});

describe('botlar, saboqlar va yutuqlar', () => {
  it('to‘rt bot har biznesda 12 oy o‘ynaydi: g‘olib aniqlanadi, saboqlar va nishonlar to‘g‘ri', () => {
    for (const biz of BIZ)
      for (const [a, z] of [
        [0, 3],
        [1, 2],
        [3, 3],
      ] as [BotId, BotId][]) {
        const { g } = botGame(biz, 1000 + a * 10 + z, a, z);
        expect([0, 1, 2]).toContain(g.winner);
        for (const i of [0, 1]) {
          const ls = lessons(g, i);
          expect(ls.length).toBeLessThanOrEqual(4);
          for (const l of ls) {
            expect(l.text.every(Boolean)).toBe(true);
            expect(l.topic).toBeGreaterThanOrEqual(1);
            expect(l.topic).toBeLessThanOrEqual(15);
          }
          for (const x of badges(g, i)) expect([...x.name, ...x.text].every(Boolean)).toBe(true);
          expect(strategyOf(g, i).every(Boolean)).toBe(true);
        }
      }
  });

  it('qiyin bot osondan kuchli, o‘ylamay o‘ynash (hech narsani o‘zgartirmaslik) zarar keltiradi', () => {
    let hard = 0,
      idleLoss = 0;
    const N = 12;
    for (let s = 1; s <= N; s++) {
      const biz = BIZ[s % 3];
      if (botGame(biz, s * 977, 3, 0).g.winner === 0) hard++;
      // hamma narsa 1-oydagidek: hajm o'zgarmaydi, reklama yo'q
      const g = started(biz, s * 977);
      const b = bizOf(biz);
      const fixedVol = b.kind === 'service' ? 0 : Math.round(b.equip.lease.cap * 0.3);
      while (!g.over)
        playMonth(g, [
          { price: b.price.ref, grade: 1, volume: fixedVol, mkt: [0, 0, 0], staff: 3 },
          botDecision(g, 1, 1),
        ]);
      if (earned(g.players[0]) < 0) idleLoss++;
    }
    expect(hard / N).toBeGreaterThan(0.8);
    expect(idleLoss / N).toBeGreaterThan(0.8);
  });
});
