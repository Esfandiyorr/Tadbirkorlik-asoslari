import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { expect, it } from 'vitest';
import config from '../../_reyting-manba/config.json';
import { catalog } from '../lib/seed';
import { canReadLegacy, weekEnd } from '../lib/server/legacy-access';
const student = {
  id: 'legacy_alice',
  classId: 'AP-223',
  learnerType: 'university' as const,
  role: 'student' as const,
};
const closed = { lim: true, g: {}, s: {}, at: 0 };
const source = readFileSync('../_reyting-manba/engine_js.txt', 'utf8');
const functions = source.slice(
  source.indexOf('function accRec('),
  source.indexOf('function tcHere('),
);
const engine = vm.createContext({
  ACC: {},
  independent: (s: any) => s?.learnerType === 'independent',
  gkey: (s: string) => s.trim(),
});
vm.runInContext(functions, engine);
it('opens topics one through seven across groups in both server and original engine', () => {
  for (const topic of catalog.topics.slice(0, 7)) {
    engine.ACC = { [topic.id]: closed };
    expect(canReadLegacy(topic, closed, student), topic.id).toBe(true);
    expect(canReadLegacy(topic, closed, { ...student, classId: 'AP-224' }), topic.id).toBe(true);
    // 1–6 — 📖 o'qish rejimi; 7 — 🟢 hammaga ochiq: o'sha hafta ball beradi, keyin o'zi o'qish rejimiga o'tadi.
    const open = topic.id === 'm7' && Date.now() < weekEnd((topic as { modeAt: number }).modeAt);
    expect(engine.accState(topic, { id: 'alice', group: 'AP-223' }), topic.id).toBe(
      open ? 'score' : 'read',
    );
  }
});
it('keeps topics eight through fifteen closed by default and honors administrator openings', () => {
  for (const topic of catalog.topics.slice(7)) {
    engine.ACC = {};
    expect(canReadLegacy(topic, null, student), topic.id).toBe(false);
    expect(engine.accState(topic, { id: 'alice', group: 'AP-223' }), topic.id).toBe('');
    const opened = { lim: false, at: Date.now() };
    engine.ACC = { [topic.id]: opened };
    expect(canReadLegacy(topic, opened, student), topic.id).toBe(true);
    expect(engine.accState(topic, { id: 'alice', group: 'AP-223' }), topic.id).toBe('score');
  }
});
it('keeps the generated server catalog and every embedded presentation access configuration aligned', () => {
  expect(catalog.topics).toHaveLength(15);
  for (const topic of config.topics) {
    const generated = catalog.topics.find((t) => t.id === topic.id)!;
    expect(generated.read).toBe(!!('read' in topic && topic.read));
    const html = readFileSync('../' + topic.file, 'utf8');
    const embedded = JSON.parse(html.match(/var RT_CFG=(\{[^\n]*\});if\(RT_CFG/)![1]);
    expect(embedded.topics).toEqual(config.topics);
  }
});
