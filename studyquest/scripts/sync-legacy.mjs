import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { adaptStudentRegistration } from './legacy-credentials.mjs';
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  root = path.resolve(app, '..'),
  out = path.join(app, 'public/legacy');
fs.mkdirSync(out, { recursive: true });
const config = JSON.parse(fs.readFileSync(path.join(root, '_reyting-manba/config.json'), 'utf8'));

/* 📝 Mavzu testlari (Sayt boshqaruvi → Mavzu testlari): asl savollar public/legacy/quiz/<mavzu>.json ga
   chiqariladi (muharrir shundan boshlaydi), taqdimot nusxasi esa administrator saqlagan savollarni oladi —
   <head> dagi /api/site/quiz skripti window.SQ_Q ni o'rnatadi, bo'lmasa asl savollar qoladi. */
const topicByFile = Object.fromEntries(config.topics.map((t) => [t.file, t]));
const testCount = {};
fs.mkdirSync(path.join(out, 'quiz'), { recursive: true });
/** `[` dan boshlangan massiv matnini (qatorlar ichidagi qavslarni hisobga olmay) qaytaradi. */
function arrayLiteral(src, start) {
  let depth = 0,
    quote = null;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'" || c === '`') quote = c;
    else if (c === '[' || c === '{') depth++;
    else if ((c === ']' || c === '}') && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error('Test savollari massivi yopilmagan');
}
function topicQuiz(entry, html) {
  const topic = topicByFile[entry],
    at = html.indexOf('\nvar Q=[');
  if (!topic || at < 0) return html;
  const questions = vm
    .runInNewContext('(' + arrayLiteral(html, at + 7) + ')')
    .map((x) =>
      Object.fromEntries(
        Object.entries({ q: x.q, a: x.a, c: x.c, o: x.o, e: x.e }).filter(
          ([, v]) => v !== undefined,
        ),
      ),
    );
  testCount[topic.id] = questions.length;
  fs.writeFileSync(
    path.join(out, 'quiz', topic.id + '.json'),
    JSON.stringify({ id: topic.id, questions }),
  );
  const swaps = [
    [
      '<script src="embed.js"></script>',
      '<script src="embed.js"></script><script src="/api/site/quiz?t=' + topic.id + '"></script>',
    ],
    ['\nvar Q=[', '\nvar Q=window.SQ_Q||['],
    ...(html.includes('\nvar QEN=[') ? [['\nvar QEN=[', '\nvar QEN=window.SQ_Q?null:[']] : []),
    ['+"_"+(s?s.id:"anon"); }', '+"_"+(s?s.id:"anon")+(window.SQ_QV?"_v"+window.SQ_QV:""); }'],
  ];
  for (const [from, to] of swaps) {
    if (!html.includes(from))
      throw new Error(entry + ': test dvigateli kutilganidek emas — ' + from);
    html = html.replace(from, to);
  }
  return html;
}
for (const entry of fs.readdirSync(root))
  if (/\.(html|js|css|png|webmanifest)$/.test(entry)) {
    let data = fs.readFileSync(path.join(root, entry));
    if (entry.endsWith('.html'))
      data = Buffer.from(
        data
          .toString()
          .replace(/<!-- PWA:BEGIN -->[\s\S]*?<!-- PWA:END -->\s*/g, '')
          .replace(/<!-- PLATFORM:BEGIN -->[\s\S]*?<!-- PLATFORM:END -->\s*/g, '')
          .replace(
            '<head>',
            '<head><script>window.STUDYQUEST_DEMO_COPY=' +
              String(
                process.env.STUDYQUEST_DEMO === 'true' && !process.argv.includes('--production'),
              ) +
              '</script><script src="demo-guard.js"></script><script src="embed.js"></script>',
          )
          .replace('</head>', '<link rel="stylesheet" href="embed.css"></head>')
          .replace(
            '</body>',
            '<script src="bridge.js"></script><script src="native-engine.js"></script></body>',
          ),
      );
    if (entry.endsWith('.html')) data = Buffer.from(topicQuiz(entry, data.toString()));
    if (entry === 'rt-engine.js')
      data = Buffer.from(
        data
          .toString()
          .replace(
            'function announceGate(next){',
            'function announceGate(next){ if(document.documentElement.classList.contains("sq-lesson")||document.documentElement.classList.contains("sq-chat")){next();return;}',
          )
          .replace(
            'if(u&&!ok) a.signOut();',
            'if(u&&!ok&&!document.documentElement.classList.contains("sq-embed")) a.signOut();',
          )
          .replace(
            'window.RT_ready&&window.RT&&RT.ok&&RT.ok()',
            'window.RT_ready&&window.RT&&((RT.ok&&RT.ok())||(RT.teacher&&RT.teacher()))',
          )
          .replace(
            /function pwaAsk\(([^)]*)\)\s*\{/,
            'function pwaAsk($1){ if(document.documentElement.classList.contains("sq-embed"))return;',
          ),
      );
    if (entry === 'rt-engine.js') data = Buffer.from(adaptStudentRegistration(data.toString()));
    fs.writeFileSync(path.join(out, entry), data);
  }
fs.cpSync(path.join(root, 'fayllar'), path.join(out, 'fayllar'), { recursive: true });
fs.copyFileSync(path.join(app, 'scripts/legacy-bridge.js'), path.join(out, 'bridge.js'));
fs.copyFileSync(path.join(app, 'scripts/native-engine.js'), path.join(out, 'native-engine.js'));
fs.copyFileSync(path.join(app, 'scripts/legacy-demo.js'), path.join(out, 'demo-guard.js'));
fs.copyFileSync(path.join(app, 'scripts/legacy-embed.js'), path.join(out, 'embed.js'));
fs.copyFileSync(path.join(app, 'scripts/legacy-embed.css'), path.join(out, 'embed.css'));
// Existing installed legacy workers cache versioned engine files indefinitely.
// Version the adapted copy by its actual content, rather than the source engine's hash.
const engineVersion = createHash('sha256')
  .update(fs.readFileSync(path.join(out, 'rt-engine.js')))
  .digest('hex')
  .slice(0, 10);
for (const file of fs.readdirSync(out).filter((name) => name.endsWith('.html'))) {
  const html = path.join(out, file);
  fs.writeFileSync(
    html,
    fs
      .readFileSync(html, 'utf8')
      .replace(/rt-engine\.js\?v=[a-f0-9]+/g, 'rt-engine.js?v=' + engineVersion),
  );
}
// Interfeysdagi kabi bitta apostrof uslubi: o‘/g‘ — ‘, tutuq belgisi — ’ (lib/uz-text.ts bilan bir xil).
const uzQuotes = (text) =>
  String(text || '')
    .replace(/([OoGg])['ʻʼ’`´](?![sS]\b)(?=[A-Za-z])/g, '$1‘')
    // so‘z oxiridagi g‘: «mablag'», «tog'».
    .replace(/([Gg])['ʻʼ`´](?=[\s.,;:!?)»"]|$)/g, '$1‘')
    .replace(/([A-Za-z])['ʼ`´](?=[A-Za-z])/g, '$1’');
const catalog = {
  manualPts: config.manualPts || 2,
  courses: config.courses,
  topics: config.topics.map((t) => ({
    id: t.id,
    title: uzQuotes(t.title),
    file: t.file,
    slides: t.slides,
    quiz: t.quiz,
    // Taqdimotdagi test savollari soni (0 — test o'rniga krossvord yoki masala).
    test: testCount[t.id] || 0,
    pdf: t.pdf,
    open: t.open,
    read: !!t.read,
    lim: !!t.lim,
    // O'qituvchi belgilagan boshlang'ich umumiy holat (lock/read/open) — legacy-access.ts accessMode.
    ...(t.mode ? { mode: t.mode, modeAt: t.modeAt } : {}),
  })),
  teacherH: config.teacherH,
  databaseURL: config.fbWeb.databaseURL || config.firebase.url,
  projectId: config.fbWeb.projectId,
};
fs.writeFileSync(path.join(app, 'lib/catalog.generated.json'), JSON.stringify(catalog, null, 2));
console.log('Copied existing lessons without changing source content or database records.');
