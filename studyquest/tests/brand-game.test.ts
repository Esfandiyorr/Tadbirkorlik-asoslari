import { it, expect } from 'vitest';
import brands from '../public/brands/brands.json';
import { makeQuestions } from '../components/brand-game';

it('every brand question has four different answers including the right one', () => {
  for (const level of ['easy', 'hard'] as const)
    for (let run = 0; run < 40; run++)
      for (const q of makeQuestions(brands as never, level, brands.length)) {
        expect(new Set(q.options).size).toBe(4);
        expect(q.options).toContain(q.kind === 'country' ? q.brand.country : q.brand.id);
      }
});

it('asks for the country when the logo already shows the company name', () => {
  const list = brands as { id: string; text?: boolean; country: string; fact: string[] }[];
  expect(list.length).toBeGreaterThanOrEqual(89);
  expect(new Set(list.map((b) => b.id)).size).toBe(list.length);
  for (const b of list)
    expect(
      b.fact.every((f) => f.length > 10),
      b.id,
    ).toBe(true);
  const qs = makeQuestions(brands as never, 'easy', brands.length);
  for (const q of qs)
    expect(q.kind).toBe((q.brand as { text?: boolean }).text ? 'country' : 'name');
  expect(qs.some((q) => q.kind === 'country')).toBe(true);
});
