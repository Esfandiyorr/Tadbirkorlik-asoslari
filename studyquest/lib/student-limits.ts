/* 🎚 «Talabalar bilan ishlash» → «Bo'limlar»: administrator yoki o'qituvchi guruhga yoki alohida talabaga sayt
   bo'limlarini yopadi (masalan, guruhga faqat taqdimotlarni o'qishni qoldiradi).
   Saqlanadi: site/limits = { g: {<guruh>: LimitRule}, u: {<foydalanuvchi>: LimitRule} }.
   LimitRule.f — bo'lim → false (yopiq) / true (ochiq). Guruh qoidasida faqat yopilganlar; talabaning o'z qoidasi
   guruhnikidan ustun (guruhda yopiq bo'lsa ham bitta talabaga ochish yoki aksincha yopish mumkin).
   Server tekshiradi (darslar, jonli o'yin, obuna, xizmatlar, chat, reyting), menyu esa yopilganlarni ko'rsatmaydi. */

export const FEATURES = [
  'lessons',
  'tests',
  'arena',
  'live',
  'library',
  'services',
  'premium',
  'chat',
  'ranking',
  'badges',
] as const;
export type Feature = (typeof FEATURES)[number];
export type FeatureRule = Partial<Record<Feature, boolean>>;
export type LimitRule = { f: FeatureRule; at: number; by: string; name?: string; group?: string };
export type LimitStore = { g?: Record<string, LimitRule>; u?: Record<string, LimitRule> };

export const FEATURE_INFO: Record<Feature, { icon: string; uz: string; en: string; ru: string }> = {
  lessons: {
    icon: '📖',
    uz: 'Taqdimotlarni o‘qish',
    en: 'Reading presentations',
    ru: 'Чтение презентаций',
  },
  tests: {
    icon: '📝',
    uz: 'Mavzu testlari va ball',
    en: 'Topic tests and points',
    ru: 'Тесты по темам и баллы',
  },
  arena: { icon: '🎮', uz: 'Arena (o‘yinlar)', en: 'Arena (games)', ru: 'Арена (игры)' },
  live: {
    icon: '⚡',
    uz: 'Jonli test va poyga',
    en: 'Live quiz and race',
    ru: 'Живой тест и гонка',
  },
  library: { icon: '📚', uz: 'Kutubxona', en: 'Library', ru: 'Библиотека' },
  services: { icon: '💼', uz: 'Pullik xizmatlar', en: 'Paid services', ru: 'Платные услуги' },
  premium: { icon: '💎', uz: 'Obuna bo‘lish', en: 'Subscribing', ru: 'Оформление подписки' },
  chat: { icon: '💬', uz: 'Adminga xabar', en: 'Messages to admin', ru: 'Сообщения админу' },
  ranking: { icon: '🏆', uz: 'Reyting', en: 'Leaderboard', ru: 'Рейтинг' },
  badges: { icon: '🏅', uz: 'Yutuqlar', en: 'Achievements', ru: 'Достижения' },
};

/** «Faqat taqdimotlarni o'qish»: taqdimotlar ochiq (ball va testsiz), qolgan hamma bo'lim yopiq. */
export const READ_ONLY: FeatureRule = Object.fromEntries(
  FEATURES.map((f) => [f, f === 'lessons']),
) as FeatureRule;

/** Guruh nomi kaliti (RTDB kalitida . # $ [ ] / bo'lmaydi). */
export const groupLimitKey = (g: unknown) =>
  String(g ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.#$[\]/]/g, '_')
    .slice(0, 60);
/** Foydalanuvchi kaliti — obuna va kursga ruxsat yozuvlaridagidek. */
export const userLimitKey = (uid: unknown) =>
  String(uid ?? '')
    .replace(/[^A-Za-z0-9_-]/g, '_')
    .slice(0, 120);

/** Faqat yopilganlar (ochiq — standart holat, saqlanmaydi). */
export function groupRule(f: FeatureRule): FeatureRule {
  return Object.fromEntries(FEATURES.filter((k) => f[k] === false).map((k) => [k, false]));
}
/** Talaba qoidasi: faqat aniq tanlanganlar (true yoki false); tanlanmagani — guruh bo'yicha. */
export function userRule(f: FeatureRule): FeatureRule {
  return Object.fromEntries(
    FEATURES.filter((k) => typeof f[k] === 'boolean').map((k) => [k, f[k] as boolean]),
  );
}

/** Talaba uchun yopiq bo'limlar: avval talabaning o'z qoidasi, keyin guruhniki. Taqdimotlar yopiq bo'lsa — test ham. */
export function closedFeatures(
  store: LimitStore | null | undefined,
  uid: string,
  group: string | undefined,
): Feature[] {
  const g = group ? store?.g?.[groupLimitKey(group)]?.f : undefined;
  const u = store?.u?.[userLimitKey(uid)]?.f;
  const closed = FEATURES.filter((k) => (u?.[k] ?? g?.[k] ?? true) === false);
  if (closed.includes('lessons') && !closed.includes('tests')) closed.push('tests');
  return closed;
}

/** Mavzular holatiga cheklov: taqdimot yopiq — hamma mavzu yopiq; test yopiq — ball beriladigan mavzu 📖 o'qish rejimida. */
export function limitLessonAccess<T extends { state: string }>(
  access: Record<string, T>,
  closed: readonly Feature[],
): Record<string, T | { state: 'locked' } | { state: 'read' }> {
  if (!closed.includes('lessons') && !closed.includes('tests')) return access;
  return Object.fromEntries(
    Object.entries(access).map(([id, a]) => [
      id,
      closed.includes('lessons')
        ? { state: 'locked' as const }
        : a.state === 'score'
          ? { state: 'read' as const }
          : a,
    ]),
  );
}

/** Talabaga shu bo'lim yopilganmi (server Data.user.closed ga yozadi). */
export const isClosed = (u: { closed?: readonly Feature[] } | null | undefined, f: Feature) =>
  !!u?.closed?.includes(f);

export const CLOSED_TEXT = {
  uz: 'Bu bo‘lim siz uchun yopilgan. Savol bo‘lsa, o‘qituvchingizga murojaat qiling.',
  en: 'This section is closed for you. Ask your teacher if you have questions.',
  ru: 'Этот раздел для вас закрыт. С вопросами обращайтесь к преподавателю.',
};
