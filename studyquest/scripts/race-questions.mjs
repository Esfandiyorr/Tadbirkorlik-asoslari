// 🏁 Poyga o'yini uchun savollar: 1–10-mavzu taqdimotlaridagi test savollari (var Q=[…]) → lib/race-questions.json
// Ishga tushirish: node scripts/race-questions.mjs (studyquest papkasidan)
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

/** Taqdimotdagi literal ([…] yoki {…}) ni ajratib oladi: `marker` dan keyingi birinchi qavsdan boshlab. */
function literal(html, marker, open, close) {
  const at = html.indexOf(marker);
  if (at < 0) return null;
  const start = html.indexOf(open, at);
  let depth = 0;
  for (let i = start; i < html.length; i++) {
    if (html[i] === open) depth++;
    else if (html[i] === close && --depth === 0)
      return vm.runInNewContext('(' + html.slice(start, i + 1) + ')', {}, { timeout: 1000 });
  }
  return null;
}
// krossvord kataklarida apostrof va chiziqcha yo'q — to'g'ri yozilishi
const SPELL = { Tasischi: 'Ta’sischi', Yatt: 'YaTT', Eimzo: 'E-IMZO', Masuliyat: 'Mas’uliyat' };
const nice = (w) => {
  const x = w.charAt(0) + w.slice(1).toLowerCase();
  return SPELL[x] || x;
};
/** Krossvordli mavzu (test o'rniga): izoh → to'g'ri so'z + krossvorddagi boshqa 3 so'z. */
function fromCrossword(t, xw) {
  const bytes = Buffer.from(xw.g, 'base64');
  let grid = '';
  for (let k = 0; k < bytes.length; k++)
    grid += String.fromCharCode(bytes[k] ^ ((k * 37 + 91) & 255));
  const words = xw.words.map((w) => {
    let s = '';
    for (let i = 0; i < w.l; i++)
      s += grid.charAt((w.d === 'h' ? w.r : w.r + i) * xw.w + (w.d === 'h' ? w.c + i : w.c));
    return { clue: w.clue, word: nice(s) };
  });
  return words.map((w, i) => {
    const others = words.filter((x) => x.word !== w.word);
    const pick = [0, 1, 2].map((k) => others[(i * 3 + k * 5) % others.length].word);
    const opts = [...new Set([w.word, ...pick])].slice(0, 4);
    // to'g'ri javob o'rni savolga qarab almashadi
    const c = i % opts.length;
    [opts[0], opts[c]] = [opts[c], opts[0]];
    return {
      t,
      q: 'Krossvord: ' + w.clue.replace(/\s*…\s*$/, ' …'),
      a: opts,
      c,
      e: 'To‘g‘ri javob: ' + w.word,
    };
  });
}

/** 5-mavzuda test ham, krossvord ham yo'q (3 ta hisoblash masalasi) — savollar slayd matni asosida. */
const TOPIC5 = [
  [
    'Taqdimotga ko‘ra soliq nima?',
    [
      'Davlat byudjetiga to‘lanadigan majburiy va qaytarilmas to‘lov',
      'Faqat qoidabuzarlik uchun olinadigan jarima',
      'Bankka to‘lanadigan kredit foizi',
      'Ixtiyoriy xayriya badali',
    ],
    0,
    'Soliq — davlat byudjetiga to‘lanadigan majburiy va qaytarilmas to‘lov.',
  ],
  [
    'Narxni belgilashda to‘g‘ri tartib qaysi?',
    [
      'Avval narx, keyin soliq qayerdan chiqishini o‘ylash',
      'Tannarx + soliq + boshqa xarajat + foyda = narx',
      'Raqobatchi narxidan 10 % arzon qilish',
      'Tannarx + foyda = narx, soliq keyin topiladi',
    ],
    1,
    'Soliq oldindan hisoblanib, narxga xarajat sifatida kiritiladi.',
  ],
  [
    'Aylanma solig‘i nimadan hisoblanadi?',
    ['Sof foydadan', 'Xodimlar ish haqidan', 'Tushumdan (yalpi aylanmadan)', 'Mol-mulk qiymatidan'],
    2,
    'Soddalashtirilgan tartibda baza — tushum, xarajat hisobga olinmaydi.',
  ],
  [
    'Oylik tushum 60 000 000 so‘m, aylanma solig‘i stavkasi 4 %. Soliq qancha?',
    ['600 000 so‘m', '1 200 000 so‘m', '6 000 000 so‘m', '2 400 000 so‘m'],
    3,
    '60 000 000 × 4 % = 2 400 000 so‘m.',
  ],
  [
    'QQSning amaldagi asosiy stavkasi taqdimotda qancha deb berilgan?',
    ['12 %', '15 %', '4 %', '20 %'],
    0,
    'QQS asosiy stavkasi — 12 %.',
  ],
  [
    'Sotuvdagi QQS 1 200 000, xomashyo xaridi QQSi 700 000 so‘m. Byudjetga qancha QQS to‘lanadi?',
    ['1 900 000 so‘m', '500 000 so‘m', '1 200 000 so‘m', '700 000 so‘m'],
    1,
    'Hisoblangan QQS − hisobga olinadigan QQS: 1 200 000 − 700 000 = 500 000.',
  ],
  [
    'Foyda solig‘ining asosiy stavkasi qancha?',
    ['12 %', '4 %', '15 %', '25 %'],
    2,
    'Foyda solig‘i — sof foydadan, asosiy stavka 15 %.',
  ],
  [
    'Umumiy tizimda hujjat bilan tasdiqlanmagan xarajat nima bo‘ladi?',
    [
      'Ikki barobar hisobga olinadi',
      'Faqat yil oxirida hisobga olinadi',
      'Avtomatik QQSga aylanadi',
      'Soliqni kamaytirmaydi',
    ],
    3,
    'Xarajat faqat hujjat bilan tasdiqlansa chegiriladi.',
  ],
  [
    'Yillik aylanma belgilangan chegaradan oshsa nima bo‘ladi?',
    [
      'Majburiy ravishda umumiy tizimga o‘tiladi',
      'Soliq butunlay bekor qilinadi',
      'Faoliyat to‘xtatiladi',
      'Hech narsa o‘zgarmaydi',
    ],
    0,
    'Chegaradan oshganda umumiy tizimga o‘tish majburiy.',
  ],
  [
    'Soddalashtirilgan tartibning asosiy kamchiligi qaysi?',
    [
      'Hisobot juda murakkab',
      'Xarajat hisobga olinmaydi — zarar ko‘rilsa ham soliq to‘lanadi',
      'QQS ikki marta to‘lanadi',
      'Malakali buxgalter majburiy',
    ],
    1,
    'Baza — tushum, shuning uchun zarar bo‘lsa ham aylanma solig‘i bor.',
  ],
  [
    'JShDS nima va u qanday to‘lanadi?',
    [
      'Korxona mol-mulkiga solinadigan soliq',
      'Suvdan foydalanish uchun to‘lov',
      'Xodim ish haqidan ushlab qolinib byudjetga o‘tkaziladigan daromad solig‘i',
      'Eksport uchun bojxona to‘lovi',
    ],
    2,
    'JShDS — jismoniy shaxslardan olinadigan daromad solig‘i, asosiy stavka 12 %.',
  ],
  [
    'my.soliq.uz shaxsiy kabinetiga qanday kiriladi?',
    [
      'Faqat soliq idorasiga borib',
      'Telefon raqami va SMS orqali',
      'Bank kartasi bilan',
      'E-IMZO (ERI kaliti) yoki OneID orqali',
    ],
    3,
    'Kabinetga E-IMZO kaliti yoki OneID orqali, STIR bilan kiriladi.',
  ],
];

const out = [];
for (const [q, a, c, e] of TOPIC5) out.push({ t: 5, q, a, c, e });
for (let t = 1; t <= 10; t++) {
  if (t === 5) continue;
  const html = readFileSync(new URL(`../../mavzu-${t}.html`, import.meta.url), 'utf8');
  const start = html.indexOf('var Q=[');
  if (start < 0) {
    const xw = literal(html, 'var XW=', '{', '}');
    if (!xw) throw new Error(`mavzu-${t}.html: savollar topilmadi`);
    out.push(...fromCrossword(t, xw));
    continue;
  }
  let depth = 0,
    end = -1;
  for (let i = start + 6; i < html.length; i++) {
    if (html[i] === '[') depth++;
    else if (html[i] === ']' && --depth === 0) {
      end = i + 1;
      break;
    }
  }
  const list = vm.runInNewContext('(' + html.slice(start + 6, end) + ')', {}, { timeout: 1000 });
  for (const x of list) {
    // ochiq javobli savollar (o: […] — «bitta so'z yozing») poygaga mos emas: faqat 4 variantli test
    if (typeof x.q !== 'string' || !Array.isArray(x.a) || typeof x.c !== 'number') continue;
    const text = (v) =>
      String(v)
        .replace(/<[^>]+>/g, '')
        .trim();
    out.push({ t, q: text(x.q), a: x.a.map(text), c: x.c, e: text(x.e || '') });
  }
}
writeFileSync(
  new URL('../lib/race-questions.json', import.meta.url),
  JSON.stringify(out, null, 1) + '\n',
);
console.log(out.length + ' ta savol');
