/* 🎞 Taqdimot (sun'iy intellekt): server ham, brauzer ham ishlatadigan umumiy turlar (server — lib/server/slides.ts). */

export const SLIDE_LANGS = ['uz', 'ru', 'en'] as const;
export type SlideLang = (typeof SLIDE_LANGS)[number];
export const SLIDE_LEVELS = ['simple', 'student', 'expert'] as const;
export type SlideLevel = (typeof SLIDE_LEVELS)[number];
export const SLIDES_MIN = 5;
export const SLIDES_MAX = 15;

export type DeckSlide = {
  title: string;
  /** 2–6 ta qisqa band */
  bullets: string[];
  /** ma'ruzachi uchun izoh (slaydda ko'rinmaydi) */
  notes: string;
};
export type Deck = { title: string; subtitle: string; slides: DeckSlide[] };
export type DeckRequest = {
  topic: string;
  n: number;
  lang: SlideLang;
  level: SlideLevel;
  note?: string;
};
/** Saqlangan taqdimot (ro'yxatda — slaydlarsiz) */
export type DeckMeta = {
  id: string;
  topic: string;
  title: string;
  n: number;
  lang: SlideLang;
  at: number;
};
export type SavedDeck = DeckMeta & { deck: Deck };

/** Taqdimot ko'rinishi (rang mavzusi) — sayt ichida ham, PowerPoint faylida ham bir xil. */
export const DECK_THEMES = [
  {
    id: 'violet',
    name: ['Binafsha', 'Violet', 'Фиолетовая'],
    bg: '#4C1D95',
    bg2: '#7C3AED',
    ink: '#FFFFFF',
    soft: '#EDE9FE',
    accent: '#FBBF24',
    body: '#1F2937',
    page: '#FFFFFF',
  },
  {
    id: 'ocean',
    name: ['Okean', 'Ocean', 'Океан'],
    bg: '#0C4A6E',
    bg2: '#0284C7',
    ink: '#FFFFFF',
    soft: '#E0F2FE',
    accent: '#FDE047',
    body: '#0F172A',
    page: '#FFFFFF',
  },
  {
    id: 'forest',
    name: ['O‘rmon', 'Forest', 'Лес'],
    bg: '#14532D',
    bg2: '#16A34A',
    ink: '#FFFFFF',
    soft: '#DCFCE7',
    accent: '#FDBA74',
    body: '#14241A',
    page: '#FFFFFF',
  },
  {
    id: 'sunset',
    name: ['Shafaq', 'Sunset', 'Закат'],
    bg: '#9A3412',
    bg2: '#F97316',
    ink: '#FFFFFF',
    soft: '#FFEDD5',
    accent: '#FEF08A',
    body: '#27170F',
    page: '#FFFBF5',
  },
  {
    id: 'mono',
    name: ['Qat’iy', 'Classic', 'Строгая'],
    bg: '#111827',
    bg2: '#374151',
    ink: '#FFFFFF',
    soft: '#F3F4F6',
    accent: '#F59E0B',
    body: '#111827',
    page: '#FFFFFF',
  },
] as const;
export type DeckThemeId = (typeof DECK_THEMES)[number]['id'];
export const deckTheme = (id: string) => DECK_THEMES.find((t) => t.id === id) || DECK_THEMES[0];
