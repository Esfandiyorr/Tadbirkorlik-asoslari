import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { getStorage } from 'firebase-admin/storage';
import { course, modules, lessons, quiz, settings, badges, demoUsers } from '../seed';
export type Row = Record<string, any>; // Repository boundary; service schemas validate every external input.
export interface Tx {
  get(collection: string, id: string): Promise<Row | null>;
  list(collection: string): Promise<Row[]>;
  set(collection: string, id: string, value: Row): void;
  delete(collection: string, id: string): void;
}
export interface Repository {
  get(c: string, id: string): Promise<Row | null>;
  list(c: string): Promise<Row[]>;
  transaction<T>(f: (tx: Tx) => Promise<T>): Promise<T>;
}
export const demo = () =>
  process.env.STUDYQUEST_DEMO === 'true' &&
  process.env.NODE_ENV !== 'production' &&
  !process.env.VERCEL;
export const configured = () =>
  !!(
    process.env.FIREBASE_PROJECT_ID &&
    ((process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS)
  );
export function adminApp() {
  if (!configured()) throw new Error('SETUP_REQUIRED');
  return (
    getApps()[0] ||
    initializeApp({
      credential: process.env.FIREBASE_CLIENT_EMAIL
        ? cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          })
        : applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    })
  );
}
export const authAdmin = () => getAuth(adminApp());
export const legacyDb = () => getDatabase(adminApp());
export const bucket = () => getStorage(adminApp()).bucket();
type State = Record<string, Record<string, Row>>;
export function initialState(): State {
  const s: State = {};
  for (const c of [
    'users',
    'subjects',
    'courses',
    'modules',
    'lessons',
    'presentations',
    'quizzes',
    'quizKeys',
    'quizAttempts',
    'enrollments',
    'progress',
    'xpTransactions',
    'achievements',
    'userAchievements',
    'leaderboards',
    'classes',
    'challenges',
    'notifications',
    'settings',
    'authLinks',
  ])
    s[c] = {};
  s.courses[course.id] = course;
  s.subjects.business = { id: 'business', title: 'Biznes va tadbirkorlik' };
  for (const x of modules) s.modules[x.id] = x;
  for (const x of lessons) s.lessons[x.id] = x;
  const { questions, ...meta } = quiz;
  s.quizzes[quiz.id] = meta;
  s.quizKeys[quiz.id] = { id: quiz.id, questions };
  s.settings.platform = settings;
  for (const x of badges) s.achievements[x.id] = x;
  for (const x of demoUsers) s.users[x.id] = x;
  s.classes['AP-223'] = { id: 'AP-223', title: 'AP-223' };
  s.challenges.daily = { id: 'daily', kind: 'pass-quiz', target: 1 };
  return s;
}
export class MemoryRepository implements Repository {
  state: State;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(state = initialState()) {
    this.state = state;
  }
  async get(c: string, id: string): Promise<Row | null> {
    const row = this.state[c]?.[id];
    return row ? structuredClone({ ...row, id }) : null;
  }
  async list(c: string): Promise<Row[]> {
    return structuredClone(
      Object.entries(this.state[c] || {}).map(([id, row]) => ({ ...row, id })),
    );
  }
  protected async persist() {}
  async transaction<T>(f: (tx: Tx) => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const next = structuredClone(this.state);
      const tx: Tx = {
        get: async (c, id) => (next[c]?.[id] ? structuredClone({ ...next[c][id], id }) : null),
        list: async (c) =>
          structuredClone(Object.entries(next[c] || {}).map(([id, row]) => ({ ...row, id }))),
        set: (c, id, v) => {
          (next[c] ??= {})[id] = JSON.parse(JSON.stringify(v));
        },
        delete: (c, id) => {
          delete next[c]?.[id];
        },
      };
      const result = await f(tx);
      const old = this.state;
      this.state = next;
      try {
        await this.persist();
      } catch (e) {
        this.state = old;
        throw e;
      }
      return result;
    });
    this.queue = run.catch(() => {});
    return run;
  }
}
class FileRepository extends MemoryRepository {
  static file = path.join(process.cwd(), '.studyquest-demo/data.json');
  static async open() {
    let state;
    try {
      state = JSON.parse(await fs.readFile(this.file, 'utf8'));
    } catch {
      state = initialState();
    }
    return new FileRepository(state);
  }
  protected async persist() {
    await fs.mkdir(path.dirname(FileRepository.file), { recursive: true });
    const temp = FileRepository.file + '.tmp';
    await fs.writeFile(temp, JSON.stringify(this.state));
    await fs.rename(temp, FileRepository.file);
  }
}
class FirebaseRepository implements Repository {
  db = getFirestore(adminApp());
  async get(c: string, id: string): Promise<Row | null> {
    const d = await this.db.collection(c).doc(id).get();
    return d.exists ? { ...d.data(), id: d.id } : null;
  }
  async list(c: string): Promise<Row[]> {
    const q = await this.db.collection(c).limit(1000).get();
    return q.docs.map((d) => ({ ...d.data(), id: d.id }));
  }
  async transaction<T>(f: (tx: Tx) => Promise<T>) {
    return this.db.runTransaction(async (t) => {
      const writes: (() => void)[] = [],
        pending = new Map<string, Row | null>();
      const tx: Tx = {
        get: async (c, id) => {
          const key = c + '/' + id;
          if (pending.has(key)) return structuredClone(pending.get(key)!);
          const d = await t.get(this.db.collection(c).doc(id));
          return d.exists ? { ...d.data(), id: d.id } : null;
        },
        list: async (c) =>
          (await t.get(this.db.collection(c).limit(1000))).docs.map((d) => ({
            ...d.data(),
            id: d.id,
          })),
        set: (c, id, v) => {
          pending.set(c + '/' + id, structuredClone(v));
          writes.push(() => t.set(this.db.collection(c).doc(id), JSON.parse(JSON.stringify(v))));
        },
        delete: (c, id) => {
          pending.set(c + '/' + id, null);
          writes.push(() => t.delete(this.db.collection(c).doc(id)));
        },
      };
      const result = await f(tx);
      writes.forEach((w) => w());
      return result;
    });
  }
}
const globalRepo = globalThis as unknown as { studyquestRepository?: Promise<Repository> };
export async function repository() {
  if (!globalRepo.studyquestRepository)
    globalRepo.studyquestRepository = demo()
      ? FileRepository.open()
      : Promise.resolve(new FirebaseRepository());
  return globalRepo.studyquestRepository;
}
export { FieldValue };
