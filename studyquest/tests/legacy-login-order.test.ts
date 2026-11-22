import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { expect, it } from 'vitest';
import { adaptStudentRegistration } from '../scripts/legacy-credentials.mjs';

/* Yangi kirish sahifasi: talaba «Ism Familiya» yoki «Familiya Ism» deb yozsa ham hisobi topiladi.
   Asl rt-engine.js dagi findMe moslashtirilgan nusxada haqiqiy kod bilan tekshiriladi. */
const source = adaptStudentRegistration(
  fs.readFileSync(path.resolve(__dirname, '../../rt-engine.js'), 'utf8'),
);

function fn(name: string) {
  const start = source.indexOf('function ' + name + '(');
  expect(start, name).toBeGreaterThanOrEqual(0);
  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(name);
}

function engine(students: Record<string, unknown>[]) {
  const claimed: string[] = [];
  const context = vm.createContext({
    cloudOn: true,
    BASE: 'https://db.example',
    T: (uz: string) => uz,
    document: { getElementById: () => null },
    cloudList: (cb: (a: unknown[]) => void) => cb(students),
    claimOwn: (id: string, _key: string, cb: (ok: boolean) => void) => {
      claimed.push(id);
      cb(true);
    },
    fetch: () => Promise.resolve({ ok: false, json: async () => null }),
    claimed,
  });
  vm.runInContext(
    ['nrm', 'hash32', 'pkey', 'pinOk', 'passwordOk', 'findMe'].map(fn).join('\n'),
    context,
  );
  return context as vm.Context & {
    pkey: (n: string, sn: string, pin: string) => string;
    findMe: (n: string, sn: string, pin: string, cb: (hit: unknown) => void) => void;
    claimed: string[];
  };
}

const login = (e: ReturnType<typeof engine>, n: string, sn: string, pin: string) =>
  new Promise<{ id: string } | null>((resolve) =>
    e.findMe(n, sn, pin, (hit) => resolve(hit as { id: string } | null)),
  );

it('finds the account whether the name or the surname is typed first', async () => {
  const probe = engine([]);
  const ali = {
    id: 'ali1',
    name: 'Ali',
    surname: 'Valiyev',
    status: 'ok',
    authVersion: 1,
    pk: probe.pkey('Ali', 'Valiyev', '4321'),
  };
  const e = engine([ali]);
  expect((await login(e, 'Ali', 'Valiyev', '4321'))?.id).toBe('ali1');
  expect((await login(e, 'valiyev', 'ALI', '4321'))?.id).toBe('ali1');
  // noto'g'ri parol yoki boshqa odam — topilmaydi
  expect(await login(e, 'Valiyev', 'Ali', '1234')).toBeNull();
  expect(await login(e, 'Ali', 'Karimov', '4321')).toBeNull();
  expect(e.claimed).toEqual(['ali1', 'ali1']);
});

it('registration takes the group and the «not a student» answer from the new sign-in page', () => {
  expect(source).toContain('window.SQ_REG.learnerType==="independent"');
  expect(source).toContain(
    'group:selectedType==="independent"?"":String((window.SQ_REG&&window.SQ_REG.group)||"")',
  );
});
