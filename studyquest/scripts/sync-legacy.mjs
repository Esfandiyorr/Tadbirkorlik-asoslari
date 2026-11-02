import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
          .replace(
            '<head>',
            '<head><script>window.STUDYQUEST_DEMO_COPY=' +
              String(
                process.env.STUDYQUEST_DEMO === 'true' && !process.argv.includes('--production'),
              ) +
              '</script><script src="demo-guard.js"></script>',
          )
          .replace('</body>', '<script src="bridge.js"></script></body>'),
      );
    fs.writeFileSync(path.join(out, entry), data);
  }
fs.cpSync(path.join(root, 'fayllar'), path.join(out, 'fayllar'), { recursive: true });
fs.copyFileSync(path.join(app, 'scripts/legacy-bridge.js'), path.join(out, 'bridge.js'));
fs.copyFileSync(path.join(app, 'scripts/legacy-demo.js'), path.join(out, 'demo-guard.js'));
const config = JSON.parse(fs.readFileSync(path.join(root, '_reyting-manba/config.json'), 'utf8'));
const catalog = {
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
