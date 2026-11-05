import { it, expect } from 'vitest';
import { uzQuotes } from '../lib/uz-text';

it('brings lesson text to the same apostrophe style as the interface', () => {
  expect(uzQuotes("Mijoz muammosi asosida biznes g'oya")).toBe(
    'Mijoz muammosi asosida biznes g‘oya',
  );
  expect(uzQuotes("Narxi 25 000 so'm, ta'lim va mablag' jalb qilish.")).toBe(
    'Narxi 25 000 so‘m, ta’lim va mablag‘ jalb qilish.',
  );
  expect(uzQuotes("O'ZBEKISTON")).toBe('O‘ZBEKISTON');
  expect(uzQuotes('oʻqituvchi va qo’shimcha')).toBe('o‘qituvchi va qo‘shimcha');
  // Inglizcha egalik qo‘shimchasi o (yoki g) bilan tugasa ham ‘ ga aylanmaydi.
  expect(uzQuotes("Rovio's Angry Birds")).toBe('Rovio’s Angry Birds');
  expect(uzQuotes('Hech qanday belgi yo‘q')).toBe('Hech qanday belgi yo‘q');
  expect(uzQuotes("'Biznes' so'zi")).toBe("'Biznes' so‘zi");
});
