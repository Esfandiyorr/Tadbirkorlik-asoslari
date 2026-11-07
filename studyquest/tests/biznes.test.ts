import { describe, expect, it } from 'vitest';
import {
  BUSINESSES,
  EVENTS,
  RULES,
  bizOf,
  botDecision,
  capacity,
  clampDecision,
  earned,
  eventOf,
  eventPlan,
  forecast,
  lessons,
  newGame,
  planCash,
  playMonth,
  replay,
  unitCost,
  worth,
  type BizId,
  type BotLevel,
  type Decision,
  type Game,
} from '../lib/biznes';

/* 💼 «Biznes» o'yini: deterministik dvigatel (kursdoshlar o'yinida ikkala kompyuter bir xil hisoblaydi),
   buxgalteriya (soliq, foiz, favqulodda qarz, bankrot), vaziyatlar zanjiri va botlar balansi. */

const BIZ: BizId[] = ['kofe', 'fastfud', 'kiyim'];
const fin = (x: number) => Number.isFinite(x);
const sum = (xs: { v: number }[]) => xs.reduce((a, l) => a + l.v, 0);
/** Shu ro'yxatdagi vaziyatlar rejada bo'lgan birinchi urug' (seed). */
function seedWith(pred: (plan: string[]) => boolean) {
  for (let s = 1; s < 20000; s++) if (pred(eventPlan(s))) return s;
  throw new Error('seed topilmadi');
}
/** Vaziyatda tanlov bo'lsa — berilgan variant, aks holda qiymati ahamiyatsiz. */
const steady = (g: Game, i: number, choice = 0): Partial<Decision> => {
  const b = bizOf(g.biz),
    p = g.players[i];
  const d: Partial<Decision> = { price: b.price.ref, ads: 8, quality: 6, choice };
  const f = forecast(g, i, { ...d, buy: 0 });
  d.buy = Math.max(0, Math.min(f.demand * 1.05, f.capacity) - p.stock);
  return d;
};
const fullGame = (
  biz: BizId,
  seed: number,
  a: (g: Game) => Partial<Decision>,
  z: (g: Game) => Partial<Decision>,
) => {
  const g = newGame(biz, seed);
  const months: [Decision, Decision][] = [];
  while (!g.over) {
    const d: [Decision, Decision] = [clampDecision(g, 0, a(g)), clampDecision(g, 1, z(g))];
    months.push(d);
    playMonth(g, d);
  }
  return { g, months };
};

describe('vaziyatlar rejasi', () => {
  it('har o‘yinda 11 ta vaziyat, ko‘pi bilan 4 tasi umumiy, zanjirlar to‘g‘ri tartibda', () => {
    for (let s = 1; s <= 400; s++) {
      const plan = eventPlan(s * 31 + 7);
      expect(plan).toHaveLength(RULES.months);
      expect(plan[0]).toBe('');
      const ids = plan.slice(1);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => eventOf(id))).toBe(true);
      expect(
        ids.filter((id) => eventOf(id)!.global && !eventOf(id)!.after).length,
      ).toBeLessThanOrEqual(4);
      for (const [k, id] of ids.entries()) {
        const after = eventOf(id)!.after;
        if (after)
          (expect(ids.indexOf(after)).toBeGreaterThanOrEqual(0),
            expect(ids.indexOf(after)).toBeLessThan(k));
      }
    }
    // har bir vaziyat matni uch tilda va har bir tanlov varianti izohli
    for (const e of EVENTS) {
      expect(e.title.every(Boolean)).toBe(true);
      expect(e.lesson.every(Boolean)).toBe(true);
      expect(e.text(BUSINESSES[0]).every(Boolean)).toBe(true);
      expect(!!e.global !== !!e.options).toBe(true);
      for (const o of e.options || []) expect([...o.label, ...o.hint].every(Boolean)).toBe(true);
    }
  });
});

describe('deterministik dvigatel', () => {
  it('bir xil urug‘ va qarorlar — bir xil natija (JSON orqali o‘tsa ham)', () => {
    for (const biz of BIZ) {
      const { g, months } = fullGame(
        biz,
        4242,
        (x) => botDecision(x, 0, 1),
        (x) => botDecision(x, 1, 2),
      );
      expect(g.over).toBe(true);
      expect(g.history).toHaveLength(RULES.months);
      // kursdoshlar o'yinida qarorlar bazadan JSON bo'lib keladi
      const again = replay(biz, 4242, JSON.parse(JSON.stringify(months)));
      expect(again).toEqual(g);
      // qisman qayta tiklash — o'sha oydagi holat bilan bir xil
      const half = replay(biz, 4242, months.slice(0, 6));
      expect(half.month).toBe(7);
      expect(half.history).toEqual(g.history.slice(0, 6));
    }
    expect(eventPlan(1)).toEqual(eventPlan(1));
    expect(new Set([1, 2, 3, 4, 5].map((s) => eventPlan(s).join())).size).toBeGreaterThan(1);
  });

  it('noto‘g‘ri yoki g‘alati qarorlar qoidalarga moslanadi', () => {
    const g = newGame('kofe', 9),
      b = bizOf('kofe');
    expect(clampDecision(g, 0, {})).toMatchObject({
      price: b.price.ref,
      buy: 0,
      ads: 0,
      quality: 0,
      loan: 0,
      repay: 0,
      branch: false,
    });
    expect(
      clampDecision(g, 0, { price: 999, buy: -50, ads: 500, quality: -3, loan: 1000, repay: 50 }),
    ).toMatchObject({
      price: b.price.max,
      buy: 0,
      ads: RULES.adsMax,
      quality: 0,
      loan: RULES.loanMax,
      repay: 0,
    });
    expect(clampDecision(g, 0, { price: 3, buy: 1234 })).toMatchObject({
      price: b.price.min,
      buy: 1200,
    });
    expect(clampDecision(g, 0, { price: NaN, buy: Number('x') })).toMatchObject({
      price: b.price.ref,
      buy: 0,
    });
    const k = newGame('kiyim', 9);
    expect(clampDecision(k, 0, { price: 252, buy: 333 })).toMatchObject({ price: 250, buy: 340 });
    // qarz chegarasi: jami qarz 220 mln dan oshmaydi; filiallar ko'pi bilan 3 ta
    g.players[0].debt = 200;
    g.players[0].branches = RULES.maxBranches;
    expect(clampDecision(g, 0, { loan: 80, branch: true })).toMatchObject({
      loan: 20,
      branch: false,
    });
    // tanlov variant chegarasida
    const s = seedWith((p) => !!eventOf(p[1])?.options);
    const e = replay('kofe', s, [[{}, {}]]);
    expect(clampDecision(e, 0, { choice: 9 }).choice).toBe(
      eventOf(e.events[1])!.options!.length - 1,
    );
    expect(clampDecision(e, 0, { choice: -1 }).choice).toBe(0);
  });
});

describe('oylik hisob-kitob', () => {
  it('tushum, tannarx, soliq (4%) va kassa bir-biriga mos keladi', () => {
    const g = newGame('kofe', 77),
      b = bizOf('kofe');
    expect(g.events[0]).toBe('');
    const d = { price: 26, buy: 6000, ads: 10, quality: 5, choice: 0 };
    const plan = planCash(g, 0, d);
    expect(plan.buy).toBe(60);
    expect(plan.left).toBe(150 - 60 - 15);
    const rec = playMonth(g, [d, d]);
    const me = rec.players[0],
      line = (k: string) => me.lines.find((l) => l.key === k)?.v || 0;
    expect(me.revenue).toBeCloseTo((me.sold * 26) / 1000, 2);
    expect(line('tax')).toBeCloseTo(-me.revenue * RULES.tax, 2);
    expect(line('fixed')).toBe(-b.fixed);
    expect(line('ads')).toBe(-10);
    expect(line('quality')).toBe(-5);
    expect(line('interest')).toBe(0);
    expect(sum(me.lines)).toBeCloseTo(me.profit, 1);
    // kassa: 150 − xarid − reklama/sifat + tushum − doimiy − soliq
    expect(me.cash).toBeCloseTo(150 - 60 - 15 + me.revenue - b.fixed + line('tax'), 1);
    // sof kapital = kassa − qarz + zaxira (80%)
    const p = g.players[0];
    expect(worth(g, p)).toBeCloseTo(p.cash + p.stockCost * RULES.stockValue, 2);
    expect(earned(g, p)).toBeCloseTo(worth(g, p) - RULES.startCash, 2);
    // bir xil qaror va bir xil boshlang'ich holat — bozor teng bo'linadi
    expect(rec.players[1].sold).toBe(me.sold);
    expect(me.share).toBe(50);
  });

  it('kredit foizi oyiga 2%, qaytarish qarzni kamaytiradi', () => {
    const g = newGame('fastfud', 5);
    playMonth(g, [{ ...steady(g, 0), loan: 50 }, steady(g, 1)]);
    expect(g.players[0].debt).toBe(50);
    expect(g.history[0].players[0].lines.find((l) => l.key === 'interest')?.v).toBe(-1);
    const cash = g.players[0].cash;
    playMonth(g, [{ ...steady(g, 0), repay: 30 }, steady(g, 1)]);
    expect(g.players[0].debt).toBe(20);
    expect(g.history[1].players[0].lines.find((l) => l.key === 'interest')?.v).toBeCloseTo(-0.4, 5);
    expect(g.players[0].cash).toBeLessThan(cash + 40);
  });

  it('kassa minusga tushsa — favqulodda qarz (+10%), chegaradan oshsa — bankrot', () => {
    const g = newGame('kofe', 11),
      b = bizOf('kofe');
    g.players[0].cash = 5;
    playMonth(g, [{ price: 25, buy: 0, choice: 0 }, steady(g, 1)]);
    const me = g.history[0].players[0];
    expect(me.sold).toBe(0);
    expect(me.emergency).toBe(b.fixed - 5);
    expect(g.players[0].cash).toBe(0);
    expect(g.players[0].debt).toBeCloseTo((b.fixed - 5) * 1.1, 2);
    expect(me.lines.find((l) => l.key === 'emergency')?.v).toBeCloseTo(-(b.fixed - 5) * 0.1, 2);
    expect(me.notes.some((n) => n[0].includes('favqulodda'))).toBe(true);
    expect(g.over).toBe(false);
    // qarz 220 mln dan oshdi — o'yin tugaydi, raqib g'olib
    g.players[0].debt = 200;
    playMonth(g, [{ price: 25, buy: 0, choice: 0 }, steady(g, 1)]);
    expect(g.players[0].bankrupt).toBe(true);
    expect(g.over).toBe(true);
    expect(g.winner).toBe(1);
    expect(() => playMonth(g, [{}, {}])).toThrow();
  });

  it('filial keyingi oydan ishlaydi: sig‘im ortadi, doimiy xarajat ham', () => {
    const g = newGame('kofe', 21),
      b = bizOf('kofe');
    playMonth(g, [{ ...steady(g, 0), branch: true }, steady(g, 1)]);
    const p = g.players[0];
    expect(g.history[0].players[0].openedBranch).toBe(true);
    expect(p.branches).toBe(2);
    expect(capacity(g, p)).toBe(2 * b.cap);
    expect(p.assets).toBe(b.branchCost * RULES.assetValue);
    const rec = playMonth(g, [steady(g, 0), steady(g, 1)]);
    expect(rec.players[0].lines.find((l) => l.key === 'fixed')?.v).toBeLessThanOrEqual(
      -2 * b.fixed,
    );
  });

  it('ortiqcha zaxira buziladi, kam zaxira — mijoz raqibga o‘tadi', () => {
    const g = newGame('fastfud', 3),
      b = bizOf('fastfud');
    const rec = playMonth(g, [
      { price: b.price.ref, buy: 6000, ads: 8, quality: 6 },
      { price: b.price.ref, buy: 1000, ads: 8, quality: 6 },
    ]);
    const [a, z] = rec.players;
    expect(z.sold).toBe(1000);
    expect(z.lost).toBeGreaterThan(1000);
    expect(z.notes.some((n) => n[0].startsWith('Zaxira tugadi'))).toBe(true);
    expect(a.notes.some((n) => n[0].startsWith('Raqibga sig‘magan'))).toBe(true);
    expect(a.sold).toBeGreaterThan(z.sold);
    expect(a.share).toBeGreaterThan(50);
    const left = 6000 - a.sold;
    expect(a.spoiled).toBe(Math.floor(left * b.spoil));
    expect(a.stock).toBe(left - a.spoiled);
  });
});

describe('vaziyatlar', () => {
  it('sug‘urta → yong‘in: sug‘urtalangan hech narsa yo‘qotmaydi', () => {
    const s = seedWith((p) => p.includes('fire'));
    const plan = eventPlan(s),
      at = plan.indexOf('insurance'),
      fire = plan.indexOf('fire');
    expect(at).toBeGreaterThan(0);
    // rejadagi k-o'rin (k+1)-oyga to'g'ri keladi
    const g = newGame('kofe', s);
    while (g.month < fire + 1)
      playMonth(g, [steady(g, 0, 0), steady(g, 1, g.month === at + 1 ? 1 : 0)]);
    // yong'in oy boshida — qarordan oldin — qo'llanadi
    expect(g.month).toBe(fire + 1);
    expect(g.players[0].flags.insured).toBe(1);
    expect(g.players[1].flags.insured).toBeUndefined();
    expect(g.pre.pnl[0]).toBe(0);
    expect(g.pre.pnl[1]).toBeLessThanOrEqual(-20);
    expect(g.pre.notes[0][0][0]).toContain('Sug‘urta zararni');
    expect(g.pre.notes[1][0][0]).toContain('Sug‘urta yo‘q edi');
    // va shu oy hisobotida «vaziyat» qatori bo'lib chiqadi
    const rec = playMonth(g, [steady(g, 0), steady(g, 1)]);
    expect(rec.players[1].lines.find((l) => l.key === 'event')?.v).toBeLessThanOrEqual(-20);
    expect(rec.players[0].lines.find((l) => l.key === 'event')).toBeUndefined();
  });

  it('buxgalter → soliq tekshiruvi: buxgalteri borga jarima yo‘q', () => {
    const s = seedWith((p) => p.includes('audit'));
    const plan = eventPlan(s),
      at = plan.indexOf('accountant'),
      audit = plan.indexOf('audit');
    const g = newGame('fastfud', s);
    while (g.month < audit + 1)
      playMonth(g, [steady(g, 0, 0), steady(g, 1, g.month === at + 1 ? 1 : 0)]);
    expect(g.players[0].flags.accountant).toBe(1);
    expect(g.players[1].flags.accountant).toBeUndefined();
    expect(g.pre.pnl[0]).toBe(0);
    expect([0, -12]).toContain(g.pre.pnl[1]);
  });

  it('korporativ buyurtma: zaxira yetmasa jarima va obro‘ pasayadi', () => {
    const s = seedWith((p) => p[1] === 'corporate');
    const g = newGame('kofe', s);
    playMonth(g, [steady(g, 0), steady(g, 1)]);
    expect(g.events[g.month - 1]).toBe('corporate');
    const brand = g.players[0].brand;
    const rec = playMonth(g, [
      { ...steady(g, 0, 0), buy: 0 },
      { ...steady(g, 1, 0), buy: 7000 },
    ]);
    expect(rec.players[0].lines.find((l) => l.key === 'penalty')?.v).toBe(-6);
    expect(rec.players[0].notes.some((n) => n[0].includes('to‘liq bajarilmadi'))).toBe(true);
    expect(g.players[0].brand).toBeLessThan(brand);
    expect(rec.players[1].corporate).toBeGreaterThan(0);
    expect(rec.players[1].lines.find((l) => l.key === 'penalty')).toBeUndefined();
  });
});

describe('botlar va balans', () => {
  it('bot bot bilan 12 oy o‘ynaydi: g‘olib aniqlanadi, sonlar buzilmaydi', () => {
    for (const biz of BIZ)
      for (const [x, y] of [
        [0, 2],
        [1, 1],
        [2, 0],
      ] as [BotLevel, BotLevel][]) {
        const { g } = fullGame(
          biz,
          1000 + x * 10 + y,
          (q) => botDecision(q, 0, x),
          (q) => botDecision(q, 1, y),
        );
        expect([0, 1, 2]).toContain(g.winner);
        for (const p of g.players) {
          expect([p.cash, p.debt, p.stock, p.quality, p.brand, worth(g, p)].every(fin)).toBe(true);
          expect(p.stock).toBeGreaterThanOrEqual(0);
          expect(p.cash).toBeGreaterThanOrEqual(0);
        }
        for (const h of g.history)
          for (const pm of h.players) expect(sum(pm.lines)).toBeCloseTo(pm.profit, 1);
        // saboqlar: 1–4 ta, uch tilda
        for (const i of [0, 1]) {
          const ls = lessons(g, i);
          expect(ls.length).toBeGreaterThan(0);
          expect(ls.length).toBeLessThanOrEqual(4);
          for (const l of ls) expect(l.text.every(Boolean)).toBe(true);
        }
      }
  });

  it('qiyin bot oson botdan kuchliroq, tannarxdan arzon sotish esa zarar', () => {
    let hard = 0,
      cheapLoss = 0;
    const N = 40;
    for (let s = 1; s <= N; s++) {
      const biz = BIZ[s % 3];
      const { g } = fullGame(
        biz,
        s * 977,
        (q) => botDecision(q, 0, 2),
        (q) => botDecision(q, 1, 0),
      );
      if (g.winner === 0) hard++;
      // narxni eng past qilib, ko'p sotishga urinish — har sotuvdan pul qolmaydi
      const cheap = fullGame(
        biz,
        s * 977,
        (q) => ({ ...steady(q, 0), price: bizOf(biz).price.min }),
        (q) => botDecision(q, 1, 1),
      ).g;
      if (earned(cheap, cheap.players[0]) < 0) cheapLoss++;
    }
    expect(hard / N).toBeGreaterThan(0.8);
    expect(cheapLoss / N).toBeGreaterThan(0.8);
  });

  it('o‘ylab qaror qilgan o‘yinchi o‘rta botni ko‘pincha yutadi', () => {
    let wins = 0,
      profit = 0;
    const N = 30;
    for (let s = 1; s <= N; s++) {
      const biz = BIZ[s % 3];
      const { g } = fullGame(
        biz,
        s * 31337,
        (q) => {
          const p = q.players[0],
            b = bizOf(q.biz),
            ev = eventOf(q.events[q.month - 1]);
          // narx: sig'im to'lsa — biroz yuqori, ulush kamaysa — biroz past, lekin tannarxdan 40% yuqori
          let price = p.last.price;
          if (q.month > 1)
            price = Math.max(
              unitCost(q, p) * 1.4,
              price * (p.last.capFull ? 1.04 : p.last.share < 42 ? 0.98 : 1),
            );
          const d: Partial<Decision> = { price, ads: 10, quality: 8 };
          const f = forecast(q, 0, { ...d, buy: 0 });
          d.buy = Math.max(0, Math.min(f.demand * 1.06, f.capacity) - p.stock);
          const need = (d.buy * unitCost(q, p)) / 1000 + 18;
          if (
            p.last.capFull &&
            q.month <= 8 &&
            p.branches + p.pending < RULES.maxBranches &&
            p.cash - need > b.branchCost + 15
          )
            d.branch = true;
          // vaziyat izohini o'qib, oqilona variantni tanlaydi
          d.choice = ev?.ai
            ? ev.ai({
                g: q,
                i: 0,
                p,
                rival: q.players[1],
                biz: b,
                m: q.month,
                rnd: () => 0.5,
                extra: { corporate: 0, corporatePrice: 0, capCut: 0, cash: 0 },
              })
            : 1;
          const out = need + (d.branch ? b.branchCost : 0);
          if (p.cash < out)
            d.loan = Math.min(RULES.loanMax, Math.ceil((out - p.cash + 10) / 10) * 10);
          return d;
        },
        (q) => botDecision(q, 1, 1),
      );
      if (g.winner === 0) wins++;
      profit += earned(g, g.players[0]);
    }
    expect(wins / N).toBeGreaterThan(0.5);
    expect(profit / N).toBeGreaterThan(50);
  });
});
