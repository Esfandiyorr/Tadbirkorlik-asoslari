/* 🎬 Animatsion videoni yig'ish:  node _reyting-manba/video/film.js r1
   sahna.html + ssenariy/r1.js → fayllar/video/R1.mp4 (H.264, 1080p, 25 kadr/s, CRF 28 — 4 daqiqalik video ~6–7 MB;
   ovozsiz audio yo'li bilan),
   R1.vtt (subtitr) va R1.jpg (muqova). Kadrlar bir nechta brauzer oynasida parallel olinadi (FILM_WORKERS, odatda 4):
   sahna vaqtga aniq bog'langan (FILM.seek), shuning uchun bo'laklar keyin bitta faylga ulanadi.
   Kerak: playwright (NODE_PATH=studyquest/node_modules), ffmpeg (libx264). Brauzer: SQ_BROWSER_EXECUTABLE. */
const { chromium } = require('playwright');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const name = process.argv[2];
if (!name) throw new Error('Ssenariy nomi kerak: node film.js r1');
const S = require('./ssenariy/' + name + '.js');
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'fayllar/video', name.toUpperCase());
const FPS = 25, W = 1280, H = 720, SCALE = +process.env.FILM_SCALE || 1.5;
const WORKERS = +process.env.FILM_WORKERS || 4;
const ONLY = process.env.FILM_SHOT; // «12.5,40» — faqat shu soniyalardagi kadrlarni PNG qilib saqlash (tekshirish uchun)
const PNG = process.env.FILM_PNG === '1'; // kadrlar odatda JPEG (tez); PNG ikki baravar sekin, fayl hajmi deyarli bir xil
const CUT = process.env.FILM_CUT; // «82,92» — faqat shu oraliq (soniya) yig'iladi: sinov uchun, natija <nom>-sinov.mp4

const stamp = (t) => {
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + s.toFixed(3).padStart(6, '0');
};
/** Subtitr satrini ikki qatorga teng bo'lib chiqadi (qator ~44 belgidan oshmasin). */
function wrap(text) {
  if (text.length <= 44) return text;
  const words = text.split(' ');
  let best = text, diff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
    const d = Math.abs(a.length - b.length);
    if (d < diff) { diff = d; best = a + '\n' + b; }
  }
  return best;
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.SQ_BROWSER_EXECUTABLE || undefined });
  const open = async () => {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => { console.error('Sahna xatosi:', e.message); process.exitCode = 1; });
    await page.goto('file://' + path.join(__dirname, 'sahna.html'));
    await page.evaluate(() => document.fonts.ready);
    const info = await page.evaluate((s) => FILM.load(s), S);
    return { page, info };
  };
  const first = await open();
  const { duration, cues, scenes } = first.info;
  console.log(name + ': ' + duration.toFixed(1) + ' s (' + (duration / 60).toFixed(1) + ' daqiqa), ' + scenes.length + ' sahna, ' + cues.length + ' subtitr');

  if (ONLY) {
    const dir = process.env.FILM_SHOT_DIR || os.tmpdir();
    for (const t of ONLY.split(',').map(Number)) {
      await first.page.evaluate((x) => FILM.seek(x), t);
      const file = path.join(dir, name + '-' + String(t).replace('.', '_') + '.png');
      await first.page.screenshot({ path: file });
      console.log('  kadr', t, '→', file);
    }
    await browser.close();
    return;
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  // --- subtitr (WebVTT)
  fs.writeFileSync(
    OUT + '.vtt',
    'WEBVTT\n\n' + cues.map((c, i) => (i + 1) + '\n' + stamp(c.a) + ' --> ' + stamp(c.b) + ' line:88%\n' + wrap(c.t) + '\n').join('\n'),
  );
  // --- muqova
  await first.page.evaluate((x) => FILM.seek(x), Math.min(3.2, scenes[0].len - 1));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'film-'));
  await first.page.screenshot({ path: path.join(tmp, 'poster.png') });
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(tmp, 'poster.png'), '-vf', 'scale=1280:-2', '-q:v', '4', OUT + '.jpg']);

  // --- kadrlar: bo'laklarga bo'lib, parallel
  const cut = CUT ? CUT.split(',').map(Number) : null;
  const first0 = cut ? Math.floor(cut[0] * FPS) : 0;
  const total = (cut ? Math.ceil(cut[1] * FPS) : Math.ceil(duration * FPS)) - first0, per = Math.ceil(total / WORKERS);
  const pages = [first, ...(await Promise.all(Array.from({ length: WORKERS - 1 }, open)))];
  let done = 0;
  const started = Date.now();
  const timer = setInterval(() => process.stdout.write('\r  kadrlar: ' + done + ' / ' + total + '   '), 2000);
  await Promise.all(pages.map(async ({ page }, k) => {
    const a = first0 + k * per, b = Math.min(first0 + total, a + per);
    if (a >= b) return;
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', PNG ? 'png' : 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', process.env.FILM_CRF || '28', '-tune', 'animation', '-pix_fmt', 'yuv420p',
      // kalit kadr kamdan-kam (10 soniyada bir): tekis grafikada fayl hajmining asosiy qismi aynan kalit kadrlarga ketadi
      '-g', process.env.FILM_GOP || String(FPS * 10), '-r', String(FPS), path.join(tmp, 'part' + k + '.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
    const closed = new Promise((res, rej) => ff.on('close', (c) => (c ? rej(new Error('ffmpeg ' + c)) : res())));
    for (let f = a; f < b; f++) {
      await page.evaluate((x) => FILM.seek(x), f / FPS);
      const buf = await page.screenshot(PNG ? { type: 'png' } : { type: 'jpeg', quality: 94 });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      done++;
    }
    ff.stdin.end();
    await closed;
  }));
  clearInterval(timer);
  console.log('\r  kadrlar: ' + total + ' / ' + total + ' (' + ((Date.now() - started) / 1000).toFixed(0) + ' s)');
  await browser.close();

  // --- ulash + ovozsiz audio yo'li (ba'zi ilovalar audiosiz videoni «GIF» deb ko'rsatadi)
  const list = path.join(tmp, 'list.txt');
  fs.writeFileSync(list, pages.map((_, k) => path.join(tmp, 'part' + k + '.mp4')).filter((f) => fs.existsSync(f)).map((f) => "file '" + f + "'").join('\n'));
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-f', 'lavfi', '-i', 'anullsrc=r=22050:cl=mono',
    '-shortest', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '8k', '-metadata', 'title=' + (S.title || name), '-movflags', '+faststart', OUT + (cut ? '-sinov' : '') + '.mp4'], { stdio: 'inherit' });
  if (r.status) throw new Error('ffmpeg (ulash) ' + r.status);
  fs.rmSync(tmp, { recursive: true, force: true });
  const mb = (fs.statSync(OUT + (cut ? '-sinov' : '') + '.mp4').size / 1048576).toFixed(2);
  console.log('  → ' + path.relative(ROOT, OUT) + (cut ? '-sinov' : '') + '.mp4 (' + mb + ' MB)' + (cut ? '' : ', .vtt, .jpg'));
})().catch((e) => { console.error(e); process.exit(1); });
