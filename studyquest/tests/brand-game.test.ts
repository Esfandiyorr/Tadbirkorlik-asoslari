import { it, expect } from 'vitest';
import brands from '../public/brands/brands.json';
import { existsSync } from 'node:fs';
import { makeQuestions, poolOf } from '../components/brand-game';

it('every brand question has four different answers including the right one', () => {
  for (const level of ['easy', 'medium', 'hard'] as const)
    for (let run = 0; run < 40; run++)
      for (const q of makeQuestions(brands as never, level, brands.length)) {
        expect(new Set(q.options).size).toBe(4);
        expect(q.options).toContain(
          q.kind === 'country' ? q.brand.country : q.kind === 'cat' ? q.brand.cat : q.brand.id,
        );
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
  const qs = makeQuestions(brands as never, 'hard', brands.length);
  for (const q of qs)
    if ((q.brand as { text?: boolean }).text) expect(['country', 'cat']).toContain(q.kind);
    else expect(q.kind).toBe('name');
  expect(qs.some((q) => q.kind !== 'name')).toBe(true);
});

it('levels grow from famous brands to all of them, and pictures exist for raster logos', () => {
  const list = brands as { id: string; tier?: number; img?: string; text?: boolean }[];
  const easy = poolOf(list as never, 'easy'),
    medium = poolOf(list as never, 'medium'),
    hard = poolOf(list as never, 'hard');
  expect(easy.length).toBeGreaterThanOrEqual(40);
  expect(medium.length).toBeGreaterThan(easy.length);
  expect(hard.length).toBe(list.length);
  // Oson darajadagi savollar faqat 1-daraja brendlari va ular orasidagi variantlardan tuziladi.
  for (const q of makeQuestions(list as never, 'easy', 60)) {
    expect((q.brand as { tier?: number }).tier).toBe(1);
    if (q.kind === 'name')
      for (const o of q.options) expect(list.find((b) => b.id === o)?.tier).toBe(1);
  }
  for (const b of list.filter((x) => x.img)) expect(existsSync('public' + b.img), b.id).toBe(true);
  // Mamlakat savolida AQSh doim variantlar orasida bo'ladi.
  for (const q of makeQuestions(list as never, 'hard', list.length))
    if (q.kind === 'country') expect(q.options).toContain('us');
});
