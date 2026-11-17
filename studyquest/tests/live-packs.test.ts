import { expect, it } from 'vitest';
import { LIVE_PACKS } from '../lib/live-packs';
import { LIVE_SECTIONS } from '../lib/live-quiz';

/* 📦 Jonli test to'plamlari: server qabul qiladigan shaklda (savol 8–200, 4 ta variant 1–120 belgi, c 0–3),
   bo'lim mavjud, savollar takrorlanmaydi va to'g'ri javobni variant uzunligidan topib bo'lmaydi. */
it('every ready pack matches the live bank rules', () => {
  expect(LIVE_PACKS.length).toBeGreaterThan(0);
  for (const p of LIVE_PACKS) {
    expect(LIVE_SECTIONS.some((s) => s.id === p.tp)).toBe(true);
    const seen = new Set<string>();
    for (const q of p.questions) {
      expect(q.t.trim().length).toBeGreaterThanOrEqual(8);
      expect(q.t.length).toBeLessThanOrEqual(200);
      expect(q.o).toHaveLength(4);
      expect(q.c).toBeGreaterThanOrEqual(0);
      expect(q.c).toBeLessThanOrEqual(3);
      for (const o of q.o) expect(o.trim().length).toBeGreaterThan(0);
      for (const o of q.o) expect(o.length).toBeLessThanOrEqual(120);
      expect(new Set(q.o.map((o) => o.toLowerCase())).size).toBe(4);
      const lens = q.o.map((o) => o.length);
      expect(Math.min(...lens) / Math.max(...lens), q.t).toBeGreaterThanOrEqual(0.7);
      const key = q.t.toLowerCase().replace(/\s+/g, ' ');
      expect(seen.has(key), q.t).toBe(false);
      seen.add(key);
    }
  }
});

it('topic 9 has 15 questions with the correct answers spread over all four places', () => {
  const m9 = LIVE_PACKS.find((p) => p.id === 'm9')!;
  expect(m9.tp).toBe('m9');
  expect(m9.questions).toHaveLength(15);
  const at = [0, 1, 2, 3].map((i) => m9.questions.filter((q) => q.c === i).length);
  expect(Math.min(...at)).toBeGreaterThanOrEqual(3);
  // hisob savoli: (30 000 − 20 000) → 2 000 000 ÷ 10 000 = 200 dona
  const calc = m9.questions.find((q) => q.t.includes('Zararsiz miqdor'))!;
  expect(calc.o[calc.c]).toBe('200 dona');
});
