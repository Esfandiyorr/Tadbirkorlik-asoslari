import 'server-only';

export const quotaMessage =
  'Ma’lumotlar bazasi kvotasi tugagan. Mavjud darslardan foydalanishingiz mumkin; boshqaruv amallari vaqtincha ishlamaydi.';

export function quotaExceeded(error: unknown): boolean {
  const e = error as { code?: number | string; message?: string } | null;
  return (
    e?.code === 8 ||
    e?.code === 'RESOURCE_EXHAUSTED' ||
    /(?:RESOURCE_EXHAUSTED|quota exceeded)/i.test(e?.message || '')
  );
}

export class QuotaError extends Error {
  code = 'RESOURCE_EXHAUSTED';
  constructor() {
    super(quotaMessage);
  }
}

// Per-server cooldown: repeated refreshes do not hammer an exhausted database.
export class QuotaGate {
  private retryAt = 0;
  constructor(
    private now = Date.now,
    private cooldown = 60000,
  ) {}
  async run<T>(operation: () => Promise<T>): Promise<T> {
    if (this.now() < this.retryAt) throw new QuotaError();
    try {
      return await operation();
    } catch (error) {
      if (!quotaExceeded(error)) throw error;
      this.retryAt = this.now() + this.cooldown;
      throw new QuotaError();
    }
  }
}
