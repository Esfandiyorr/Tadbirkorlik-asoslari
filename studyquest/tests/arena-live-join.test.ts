import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { adaptArenaLiveJoin } from '../scripts/legacy-credentials.mjs';

/* ⚡ Jonli test: umumiy «1111» kod bilan kirgan talaba (brauzerda kalit o'rnida "shared1111") arenada «Qo'shilish»
   ni bosganda to'xtab qolmasligi kerak. Asl arena.html o'zgarmaydi — moslama faqat yangi platforma nusxasiga qo'llanadi. */
const source = fs.readFileSync(path.resolve(__dirname, '../../arena.html'), 'utf8');
const adapted: string = adaptArenaLiveJoin(source);
/** Moslangan arenadan bitta funksiyani matni bo'yicha ajratib oladi. */
function fn(name: string) {
  const start = adapted.indexOf('function ' + name + '(');
  expect(start).toBeGreaterThan(0);
  let depth = 0;
  for (let i = adapted.indexOf('{', start); i < adapted.length; i++) {
    if (adapted[i] === '{') depth++;
    else if (adapted[i] === '}' && --depth === 0) return adapted.slice(start, i + 1);
  }
  throw new Error(name);
}
function sandbox(me: Record<string, unknown> | null, response: { ok: boolean }) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const ctx: Record<string, unknown> = {
    ME: me,
    SA: { uid: 'anon-uid' },
    BASE: 'https://db.example',
    saToken: (_make: boolean, cb: (t: string) => void) => cb('id-token'),
    tmo: (p: Promise<unknown>) => p,
    fetch: (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return Promise.resolve(response);
    },
  };
  vm.createContext(ctx);
  vm.runInContext(fn('claimMe'), ctx);
  return { ctx, calls };
}
const claim = (ctx: Record<string, unknown>) =>
  new Promise<boolean>((done) => (ctx.claimMe as (cb: (ok: boolean) => void) => void)(done));

describe('arena live quiz joining on the new platform', () => {
  it('leaves the original arena file untouched and patches only the platform copy', () => {
    expect(source).not.toContain('ME.pk==="shared1111"');
    expect(adapted).toContain('ME.pk==="shared1111"');
    expect(adapted).not.toContain('Avval istalgan mavzu taqdimotini ochib');
    // asl moslama qayta qo'llanmaydi (sync-legacy har safar asl fayldan boshlaydi)
    expect(() => adaptArenaLiveJoin(adapted)).toThrow();
  });

  it('confirms a shared-code student through the server instead of writing a fake key', async () => {
    const { ctx, calls } = sandbox({ id: 'S123', pk: 'shared1111' }, { ok: true });
    expect(await claim(ctx)).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('/api/student-login');
    expect(calls[0].init?.method).toBe('POST');
    expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe(
      'Bearer id-token',
    );
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({ id: 'S123', session: true });
    // bazadagi owners/<id> ga "shared1111" yozilmaydi
    expect(calls.some((c) => c.url.includes('/owners/'))).toBe(false);
    const refused = sandbox({ id: 'S123', pk: 'shared1111' }, { ok: false });
    expect(await claim(refused.ctx)).toBe(false);
  });

  it('keeps the original key claim for students with a personal password', async () => {
    const { ctx, calls } = sandbox({ id: 'S9', pk: 'p2:abc' }, { ok: true });
    expect(await claim(ctx)).toBe(true);
    expect(calls[0].url).toBe('https://db.example/owners/S9/anon-uid.json?auth=id-token');
    expect(calls[0].init?.method).toBe('PUT');
    expect(JSON.parse(String(calls[0].init?.body))).toBe('p2:abc');
    expect(await claim(sandbox(null, { ok: true }).ctx)).toBe(false);
  });

  it('still tries to join when the owner check failed — the database rule decides', () => {
    const join = fn('lvJoin');
    expect(join).not.toContain('if(!LV.own)');
    expect(join).toContain('if(!ME||!ME.id)');
    const kput = vi.fn();
    const ctx: Record<string, unknown> = {
      KS: { unlock() {} },
      LV: { own: false, d: '2026-11-11', p: {}, meta: { start: 2e12 } },
      ME: { id: 'S1', name: 'Ali', surname: 'Valiyev', group: 'AP-223' },
      L: (uz: string) => uz,
      kput,
      document: { getElementById: () => null },
      snow: () => 1e12,
    };
    vm.createContext(ctx);
    vm.runInContext(join, ctx);
    (ctx.lvJoin as (b: null) => void)(null);
    expect(kput).toHaveBeenCalledTimes(1);
    expect(kput.mock.calls[0][0]).toBe('games/2026-11-11/p/S1');
    expect(kput.mock.calls[0][1]).toMatchObject({ n: 'Ali Valiyev', g: 'AP-223' });
  });

  it('explains a refused join: late, not confirmed, or not approved', () => {
    const join = fn('lvJoin');
    expect(join).toContain("Qo'shilish vaqti tugadi — o'yin boshlanib bo'lgan");
    expect(join).toContain('Saytdan chiqib, ism, familiya va kodingiz bilan qayta kiring');
    expect(join).toContain('/#login');
    // Yozuv marafoni jonli rejimi ham egalik tekshiruvida to'xtab qolmaydi
    expect(adapted).toContain('if(!own&&!(me&&me.id)){');
  });
});
