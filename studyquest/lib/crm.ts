export const crmRevision = 'crm-2026-11-04';
export const crmCount = 22;
export const crmTitle = 'CRM — mijozlar bilan munosabatlarni boshqarish';
export function revisionReading(value: any) {
  const seen = [
    ...new Set<number>(
      (Array.isArray(value?.seen) ? value.seen : Object.keys(value?.seen || {}).map(Number)).filter(
        (n: unknown): n is number => Number.isInteger(n) && Number(n) >= 0 && Number(n) < crmCount,
      ),
    ),
  ];
  return {
    seen,
    last: Number.isInteger(value?.last) ? Math.max(0, Math.min(crmCount - 1, value.last)) : 0,
  };
}
export function crmMeta<T extends Record<string, any>>(lesson: T): T {
  return lesson.id === 'm7'
    ? { ...lesson, title: crmTitle, slideCount: crmCount, legacyPdf: '/crm/CRM-taqdimot.pdf' }
    : lesson;
}
