import { it, expect } from 'vitest';
import brands from '../public/brands/brands.json';
import { makeQuestions } from '../components/brand-game';

it('every brand question has four different answers including the right one', () => {
  for (const level of ['easy', 'hard'] as const)
    for (let run = 0; run < 40; run++)
      for (const q of makeQuestions(brands as never, level, brands.length)) {
        const ids = q.options.map((o) => o.id);
        expect(new Set(ids).size).toBe(4);
        expect(ids).toContain(q.brand.id);
      }
});
