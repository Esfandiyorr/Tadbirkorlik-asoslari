import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  root = path.resolve(app, '..'),
  out = path.join(app, 'public/legacy');
fs.mkdirSync(out, { recursive: true });
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
const config = JSON.parse(fs.readFileSync(path.join(root, '_reyting-manba/config.json'), 'utf8'));
const catalog = {
  manualPts: config.manualPts || 2,
  courses: config.courses,
  topics: config.topics.map((t) => ({
    id: t.id,
    title: t.title,
    file: t.file,
    slides: t.slides,
    quiz: t.quiz,
    pdf: t.pdf,
    open: t.open,
    read: !!t.read,
    lim: !!t.lim,
  })),
  teacherH: config.teacherH,
  databaseURL: config.fbWeb.databaseURL,
};
fs.writeFileSync(path.join(app, 'lib/catalog.generated.json'), JSON.stringify(catalog, null, 2));
console.log('Copied existing lessons without changing source content or database records.');
