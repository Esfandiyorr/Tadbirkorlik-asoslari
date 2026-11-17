/* YouTube uchun yengil to'plam: ssenariy, SRT/VTT, tavsif, boblar va muqova.
   NODE_PATH=studyquest/node_modules SQ_BROWSER_EXECUTABLE=/usr/bin/chromium node _reyting-manba/video/youtube-kit.js /workspace/artifacts/restoran-r3-r6 r3 r4 r5 r6
   MP4 alohida film.js bilan shu papkaga yig'iladi; YouTube'ga avtomatik yuklanmaydi. */
const { chromium } = require("playwright");
const fs = require("node:fs/promises");
const path = require("node:path");
const { startPreview } = require("./preview-server");

const output = path.resolve(
  process.argv[2] || path.join(__dirname, "../../../artifacts/restoran-r3-r6"),
);
const ids = process.argv.slice(3).length
  ? process.argv.slice(3)
  : ["r3", "r4", "r5", "r6"];
const clean = (s) => String(s || "").replace(/\*\*/g, "");
const escape = (s) =>
  clean(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const timestamp = (t, separator = ",") => {
  const ms = Math.round(t * 1000);
  return (
    [
      Math.floor(ms / 3600000),
      Math.floor(ms / 60000) % 60,
      Math.floor(ms / 1000) % 60,
    ]
      .map((v) => String(v).padStart(2, "0"))
      .join(":") +
    separator +
    String(ms % 1000).padStart(3, "0")
  );
};
const chapterTime = (t) =>
  Math.floor(t / 60) + ":" + String(Math.floor(t % 60)).padStart(2, "0");

(async () => {
  if (ids.some((id) => !/^r(?:[1-9]|1[0-2])$/.test(id)))
    throw Error("Dars identifikatori noto‘g‘ri.");
  await fs.mkdir(path.join(output, "player/ssenariy"), { recursive: true });
  await fs.copyFile(
    path.join(__dirname, "sahna.html"),
    path.join(output, "player/sahna.html"),
  );
  for (const name of ["README.md", "AMALIYOT-R3-R6.md"])
    await fs.copyFile(path.join(__dirname, name), path.join(output, name));
  const preview = await startPreview();
  let browser;
  const rows = [];
  try {
    browser = await chromium.launch({
      executablePath: process.env.SQ_BROWSER_EXECUTABLE || undefined,
    });
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1.5,
    });
    await page.goto(preview.url);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => document.body.classList.add("preview"));
    for (const id of ids) {
      const source = path.join(__dirname, "ssenariy", id + ".js");
      const scenario = require(source);
      const errors = [];
      const listener = (e) => errors.push(e.message);
      page.on("pageerror", listener);
      const info = await page.evaluate((s) => FILM.load(s), scenario);
      if (
        !info.cues.length ||
        info.cues.some(
          (c, i) =>
            c.b <= c.a ||
            c.a < 0 ||
            c.b > info.duration ||
            (i && c.a < info.cues[i - 1].b),
        )
      )
        throw Error(id + ": subtitr vaqtlari mos emas.");
      await fs.copyFile(
        source,
        path.join(output, "player/ssenariy", id + ".js"),
      );
      const code = id.toUpperCase();
      const captions = (separator) =>
        info.cues
          .map(
            (c, i) =>
              `${i + 1}\n${timestamp(c.a, separator)} --> ${timestamp(c.b, separator)}\n${c.t}\n`,
          )
          .join("\n");
      await fs.writeFile(path.join(output, code + ".uz.srt"), captions(","));
      await fs.writeFile(
        path.join(output, code + ".uz.vtt"),
        "WEBVTT\n\n" + captions("."),
      );
      const chapters = info.scenes.map(
        (s, i) =>
          chapterTime(s.start) +
          " " +
          clean(
            scenario.scenes[i].head ||
              scenario.scenes[i].title ||
              "Amaliy suhbat",
          ),
      );
      const title = `${code} | ${scenario.title} | Restoran kursi`;
      if (title.length > 100)
        throw Error(id + ": YouTube sarlavhasi 100 belgidan uzun.");
      const description = [
        title,
        "",
        scenario.description || scenario.title,
        "Qisqa takrorlash videosi. To‘liq dars va amaliy mashqlar: https://tadbirkorlik-asoslari.vercel.app/#lesson/" +
          id,
        "O‘quv misollari. Videoni ko‘rish amaliy mashq va trener bahosini almashtirmaydi.",
        "",
        ...chapters,
        "",
        id === "r4"
          ? "Til: o‘zbekcha. Suhbatlarda inglizcha iboralar ham bor."
          : "Til: o‘zbekcha.",
        "Ovozsiz animatsiya: tushuntirish ekranda va subtitrda.",
      ].join("\n");
      await fs.writeFile(
        path.join(output, code + "-youtube.txt"),
        description + "\n",
      );
      const transcript = [
        "# " + code + " · " + scenario.title,
        "",
        "Ovoz yozish va amaliy mashq uchun ssenariy.",
        ...scenario.scenes.flatMap((s, i) => [
          "\n## " + chapters[i],
          ...(s.lines || []).map(
            (l) =>
              (l.s === "L" || l.s === "R" ? l.s + ": " : "") +
              clean(l.t) +
              (l.sub ? "\n\nTarjima: " + clean(l.sub) : ""),
          ),
        ]),
      ].join("\n\n");
      await fs.writeFile(path.join(output, code + "-ssenariy.md"), transcript);
      for (let i = 0; i < info.scenes.length; i++) {
        const scene = info.scenes[i];
        await page.evaluate(
          (t) => FILM.seek(t),
          scene.start + Math.min(3.2, scene.len - 0.5),
        );
        const shot = code + "-sahna-" + String(i + 1).padStart(2, "0") + ".jpg";
        await page.screenshot({
          path: path.join(output, shot),
          type: "jpeg",
          quality: 85,
        });
      }
      if (errors.length) throw Error(id + ": " + errors.join("; "));
      page.off("pageerror", listener);
      let mp4 = false;
      try {
        mp4 = (await fs.stat(path.join(output, code + ".mp4"))).size > 0;
      } catch {}
      rows.push({
        id,
        title: scenario.title,
        duration: info.duration,
        scenes: info.scenes.length,
        cues: info.cues.length,
        mp4,
      });
      console.log(
        code +
          ": " +
          chapterTime(info.duration) +
          ", " +
          info.scenes.length +
          " sahna, " +
          info.cues.length +
          " subtitr",
      );
    }
  } finally {
    await browser?.close();
    await preview.close();
  }
  await fs.writeFile(
    path.join(output, "manifest.json"),
    JSON.stringify({ lessons: rows, uploaded: false }, null, 2) + "\n",
  );
  const heading = rows.map((r) => r.id.toUpperCase()).join(", ");
  const html = `<!doctype html><html lang="uz"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>RS 24 · video to‘plami</title><style>body{max-width:1000px;margin:auto;padding:24px;font:17px/1.7 system-ui;color:#202a26}section{padding:20px 0;border-top:1px solid #ddd}a{color:#1e5b2b}img{width:100%;max-width:640px}li{margin:6px 0}</style><h1>RS 24 · ${heading} video va subtitrlar</h1><p>Videolar YouTube’ga yuklanmagan. Quyida ssenariy, subtitr, tavsif va brauzerda ko‘riladigan animatsiya bor. MP4 mavjud bo‘lsa alohida havola chiqadi. Animatsiyalar ovozsiz; tushuntirish ekranda va subtitrda.</p><p><a href="AMALIYOT-R3-R6.md">R3–R6 amaliy mashq varaqalari</a> · <a href="README.md">YouTube’ga joylash yo‘riqnomasi</a></p>${rows.map((r) => `<section><h2>${r.id.toUpperCase()} · ${escape(r.title)}</h2><p>${chapterTime(r.duration)} · ${r.scenes} sahna · ${r.cues} subtitr</p><img src="${r.id.toUpperCase()}-sahna-01.jpg" alt="${escape(r.title)} muqovasi"><ul><li><a href="player/sahna.html?s=${r.id}">Animatsiyani brauzerda ko‘rish</a></li><li><a href="${r.id.toUpperCase()}.uz.srt">YouTube uchun SRT</a> · <a href="${r.id.toUpperCase()}.uz.vtt">VTT</a></li><li><a href="${r.id.toUpperCase()}-youtube.txt">YouTube nomi, tavsifi va boblari</a></li><li><a href="${r.id.toUpperCase()}-ssenariy.md">Ssenariy va suhbatlar</a></li>${r.mp4 ? `<li><a href="${r.id.toUpperCase()}.mp4">MP4 video</a></li>` : ""}</ul></section>`).join("")}</html>`;
  await fs.writeFile(path.join(output, "index.html"), html);
  console.log("To‘plam:", output);
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
