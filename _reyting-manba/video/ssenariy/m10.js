/* 🎬 M10 · Savdo jarayonini tashkil etish va mijozlar bilan ishlash — animatsion video ssenariysi (sahna.html + film.js).
   Taqdimotdagi hikoyaning davomi: «Shirin kun» qandolati, sotuvchi Nilufar va mijoz Dilnoza opa.
   Sahna turlari: title, list, steps, rule, dialog, compare, outro. lines — subtitr satrlari (vaqt matn uzunligidan
   hisoblanadi): s — "L"/"R" (chap/o'ng qahramon gapiradi, pufakcha chiqadi) yoki bo'sh (boshlovchi);
   on — shu satrda ko'rinadigan elementlar; note/icon — ekrandagi belgi. **qalin** — ajratilgan so'z.
   bg: "dokon" — suhbatlar qandolat do'konida; kurs/kursTo/icon/floats — chip va muqova yozuvlari.
   Yig'ish: NODE_PATH=studyquest/node_modules node _reyting-manba/video/film.js m10 → fayllar/video/M10.mp4 */
(function (root, S) {
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
  else root.SSENARIY = S;
})(this, {
  n: 10,
  title: 'Savdo jarayonini tashkil etish va mijozlar bilan ishlash',
  kurs: 'Tadbirkorlik asoslari',
  kursTo: 'TADBIRKORLIK ASOSLARI · TERMIZ DAVLAT UNIVERSITETI',
  icon: '🤝',
  bg: 'dokon',
  floats: [
    ['🎂', 900, 96, 0.9],
    ['🛍️', 1110, 230, 1.2],
    ['💬', 860, 470, 1.5],
    ['🧾', 1130, 520, 1.8],
  ],
  scenes: [
    {
      type: 'title',
      title: 'Savdo jarayoni va **mijozlar bilan ishlash**',
      sub: 'Mijozni topishdan qayta xaridgacha — 7 qadam',
      host: 'nilufar',
      lines: [
        { t: "Assalomu alaykum! Men Nilufar, «Shirin kun» qandolatidan. Uyda tort pishirib, Instagramda sotaman." },
        { t: "Bugun savdo nima ekanini va mijoz bilan qanday gaplashishni ko'rib chiqamiz." },
      ],
    },
    {
      type: 'compare',
      head: '100 kishi yozdi — **faqat 20 tasi** sotib oldi',
      a: {
        title: 'Oldin: mijozni yo‘qotdim',
        tone: 'bad',
        icon: '✕',
        items: [
          { i: '⏰', t: 'Javob 3 soatdan keyin' },
          { i: '💸', t: 'Darrov narx — savol yo‘q' },
          { i: '😶', t: '«Qimmat» deyishsa — jim qoldim' },
        ],
      },
      b: {
        title: 'Endi: mijozni saqlayman',
        tone: 'good',
        icon: '✓',
        items: [
          { i: '⚡', t: '15 daqiqada javob' },
          { i: '❓', t: 'Avval so‘rayman, keyin taklif' },
          { i: '🤝', t: 'Bahslashmay, variant beraman' },
        ],
      },
      lines: [
        { t: 'Bir oyda menga 100 kishi yozdi, lekin faqat 20 tasi tort oldi. Qolgan 80 kishi qayerga ketdi?' },
        { t: "Kech javob berdim, darrov narx aytdim, «qimmat» deyishsa jim qoldim.", on: ['a0', 'a1', 'a2'] },
        { t: "Endi tez javob beraman, avval so'rayman va bahslashmay variant taklif qilaman.", on: ['b0', 'b1', 'b2'] },
      ],
    },
    {
      type: 'steps',
      head: 'Savdo — **7 qadamli yo‘l**',
      items: [
        { i: '🔎', t: 'Mijozni topish', d: 'Instagram, tavsiya' },
        { i: '👋', t: 'Salomlashish', d: 'Tez va iliq' },
        { i: '❓', t: 'So‘rash', d: 'Nima va nega kerak' },
        { i: '🎁', t: 'Taklif', d: '2–3 variant' },
        { i: '🛡️', t: 'Savollarga javob', d: 'Bahslashmasdan' },
        { i: '🤝', t: 'Kelishish', d: 'Kun, soat, narx' },
        { i: '💬', t: 'Aloqada qolish', d: '«Yoqdimi?»' },
      ],
      lines: [
        { t: "Savdo — omad emas, 7 ta qadam: mijozni topish, salomlashish va so'rash.", on: [0, 1, 2] },
        { t: 'Keyin taklif qilish, savollarga javob berish va kelishish.', on: [3, 4, 5] },
        { t: 'Oxirgi qadam — xariddan keyin ham aloqada qolish.', on: [6] },
        { t: "Eng ko'p xato: so'ramasdan darrov narx aytish." },
      ],
    },
    {
      type: 'dialog',
      enter: 'R',
      left: { who: 'nilufar', pose: 'chest' },
      right: { who: 'dilnoza' },
      lines: [
        { t: "Dilnoza opa Instagramda tort rasmini ko'rib, qandolatga keldi.", note: '👋 1–2-qadam: salomlashish', quiet: true },
        { s: 'R', t: 'Assalomu alaykum! Tortlaringiz narxi qancha?' },
        { s: 'L', t: 'Va alaykum assalom! Men Nilufar. Ismingiz nima?' },
        { s: 'R', t: 'Dilnoza.' },
        { s: 'L', t: 'Dilnoza opa, tort qanday tadbirga va necha kishiga kerak?' },
        { t: "Darrov narx aytilmadi — avval ochiq savol berildi.", note: '✔ Avval savol, keyin narx', tone: 'ok', quiet: true },
      ],
    },
    {
      type: 'list',
      head: 'To‘g‘ri savol — **yarim sotuv** (SPIN)',
      host: 'nilufar',
      pose: 'hand',
      items: [
        { i: '📍', t: 'Vaziyat', d: '«Tadbir qachon, necha kishi?»' },
        { i: '⚠️', t: 'Muammo', d: '«Oldingi tortda nima yoqmadi?»' },
        { i: '⏳', t: 'Oqibat', d: '«Tort kech kelsa, nima bo‘ladi?»' },
        { i: '🎯', t: 'Foyda', d: '«Aniq soatda kelsa, qulaymi?»' },
      ],
      lines: [
        { t: "Ochiq savol mijozni gapirtiradi. Avval vaziyatni so'raymiz.", on: [0] },
        { t: "Keyin muammoni: oldin nima yoqmagan edi?", on: [1] },
        { t: "Muammo hal bo'lmasa nima bo'lishini so'raymiz.", on: [2] },
        { t: "Oxirida yechimning foydasini mijozning o'zi aytadi.", on: [3] },
        { t: 'Qoida: suhbatning 70 foizida mijoz gapirsin, 30 foizida siz.' },
      ],
    },
    {
      type: 'dialog',
      left: { who: 'nilufar', pose: 'note' },
      right: { who: 'dilnoza' },
      lines: [
        { t: '3-qadam: Nilufar so‘raydi va tinglaydi.', note: '❓ 3-qadam: so‘rash', quiet: true },
        { s: 'R', t: "O'g'limning tug'ilgan kuni, shanba kuni, 20 kishi." },
        { s: 'R', t: "O'tgan safar tort kech kelib, mehmonlar oldida uyalib qolgandim." },
        { s: 'L', t: "Tushundim: 20 kishi, shanba, vaqti juda muhim. Soat nechaga kerak?" },
        { s: 'R', t: 'Soat oltiga.' },
        { t: 'Nilufar eshitganini qaytarib aytdi — mijoz uni tinglashganini his qildi.', note: '🔁 Eshitganingizni qaytaring', tone: 'ok', quiet: true },
      ],
    },
    {
      type: 'steps',
      head: 'Xususiyat → Afzallik → **Foyda**',
      items: [
        { i: '🧁', t: 'Xususiyat', d: '6 soat oldin pishiriladi' },
        { i: '⭐', t: 'Afzallik', d: 'Shuning uchun yangi va yumshoq' },
        { i: '🎉', t: 'Foyda', d: 'Mehmonlar oldida xotirjamlik' },
      ],
      lines: [
        { t: "Mijoz «tort nimadan?» deb emas, «bu menga nima beradi?» deb o'ylaydi." },
        { t: 'Xususiyat: tort yetkazishdan 6 soat oldin pishiriladi.', on: [0] },
        { t: "Afzallik: shuning uchun u yangi va yumshoq bo'ladi.", on: [1] },
        { t: 'Foyda: bu sizga mehmonlar oldida xotirjamlik beradi.', on: [2] },
      ],
    },
    {
      type: 'rule',
      head: 'Bitta narx emas — **3 ta variant**',
      big: '3',
      unit: 'variant',
      items: [
        { i: '🙂', t: 'Oddiy · 1,5 kg', d: '200 000 so‘m' },
        { i: '⭐', t: 'Standart · 2 kg', d: '250 000 so‘m — ko‘pchilik shuni tanlaydi' },
        { i: '👑', t: 'Premium · 3 kg', d: '400 000 so‘m' },
      ],
      lines: [
        { t: 'Bitta narx aytsangiz, mijoz faqat «ha» yoki «yo‘q» deydi.' },
        { t: "3 ta variant bering: oddiy, standart va premium.", on: [0, 1, 2] },
        { t: "Endi mijoz «qaysi biri?» deb o'ylaydi — tanlov uning qo'lida." },
      ],
    },
    {
      type: 'dialog',
      left: { who: 'nilufar', pose: 'chest' },
      right: { who: 'dilnoza' },
      lines: [
        { s: 'R', t: 'Standart biroz qimmatroq ekan...' },
        { t: "Bahslashmang: «qimmat» — rad javobi emas, savol.", note: '⛔ «Yo‘q, arzon!» — demang', tone: 'bad', quiet: true },
        { s: 'L', t: 'Tushunaman. Qancha atrofida mo‘ljallagan edingiz?' },
        { s: 'R', t: 'Ikki yuz ming atrofida.' },
        { s: 'L', t: "Unda oddiy tortga yozuv va shamlarni qo'shamiz — jami 220 ming. 20 kishiga yetadi." },
        { s: 'R', t: "Ana bu menga to'g'ri keladi!" },
      ],
    },
    {
      type: 'steps',
      head: '«Qimmat»ga javob — **5 qadam**',
      cols: 5,
      items: [
        { i: '👂', t: 'Tinglang', d: 'Gapni bo‘lmang' },
        { i: '🤝', t: 'Tan oling', d: '«Tushunaman»' },
        { i: '❓', t: 'Aniqlang', d: 'Asl sababi nima?' },
        { i: '💬', t: 'Javob bering', d: 'Dalil yoki variant' },
        { i: '👉', t: 'Qadam so‘rang', d: '«Davom etamizmi?»' },
      ],
      lines: [
        { t: "E'tirozga javob 5 qadam: tinglang, tan oling, aniqlang.", on: [0, 1, 2] },
        { t: "Keyin dalil yoki boshqa variant bilan javob bering.", on: [3] },
        { t: "Oxirida keyingi qadamni so'rang: «Davom etamizmi?»", on: [4] },
      ],
    },
    {
      type: 'dialog',
      left: { who: 'nilufar', pose: 'note' },
      right: { who: 'dilnoza' },
      lines: [
        { t: '6-qadam: kelishuvni bosimsiz yakunlash.', note: '🤝 6-qadam: kelishish', quiet: true },
        { s: 'L', t: "Demak: shanba, soat oltida, yozuv va shamlar bilan, 220 ming. To'g'rimi?" },
        { s: 'R', t: "To'g'ri!" },
        { s: 'L', t: "50 ming oldindan to'lasangiz, buyurtmani yozib qo'yaman." },
        { t: 'Takrorlab tasdiqlash — eng halol yakun.', note: '✔ Kun · soat · narx · to‘lov', tone: 'ok', quiet: true },
        { t: "Yakshanba kuni Nilufar o'zi yozdi: «Tort yoqdimi?»", icon: '💬', cap: '7-qadam: aloqada qolish', quiet: true },
      ],
    },
    {
      type: 'rule',
      head: 'Konversiya: **100 kishidan nechtasi** oldi?',
      big: '20',
      unit: 'foiz',
      items: [
        { i: '👥', t: '100 kishi yozdi', d: 'Bir oyda' },
        { i: '🛒', t: '20 tasi oldi × 250 000 so‘m', d: 'O‘rtacha chek' },
        { i: '💰', t: 'Tushum: 5 000 000 so‘m', d: '20 × 250 000' },
        { i: '📈', t: '25% bo‘lsa — 6 250 000 so‘m', d: 'Reklamasiz, faqat yaxshi suhbat bilan' },
      ],
      lines: [
        { t: '100 kishidan 20 tasi oldi — bu konversiya, 20 foiz.', on: [0, 1] },
        { t: "Har biri o'rtacha 250 ming to'ladi — oyiga 5 million so'm.", on: [2] },
        { t: "Yaxshi suhbat bilan 25 kishi olsa — 6 million 250 ming. Reklamasiz!", on: [3] },
      ],
    },
    {
      type: 'list',
      head: 'Xariddan keyin: **aloqada qoling**',
      host: 'nilufar',
      pose: 'hand',
      items: [
        { i: '📩', t: 'Ertasi kuni', d: '«Tort yoqdimi?»' },
        { i: '⭐', t: '1 haftadan keyin', d: 'Fikr va rasm uchun ruxsat' },
        { i: '🎁', t: '1 oydan keyin', d: 'Yangi taklif yoki aksiya' },
        { i: '🎂', t: 'Yiliga bir marta', d: 'Muhim sanada tabrik' },
      ],
      lines: [
        { t: "Yangi mijoz topish eski mijozga yana sotishdan qimmatroq." },
        { t: "Ertasi kuni so'rang: tort yoqdimi?", on: [0] },
        { t: "Bir haftadan keyin fikr so'rang, bir oydan keyin yangi taklif yuboring.", on: [1, 2] },
        { t: 'Muhim sanada tabriklang — mijoz sizni eslab qoladi.', on: [3] },
      ],
    },
    {
      type: 'outro',
      head: 'Esda qoladigan **qoidalar**',
      host: 'nilufar',
      items: [
        { i: '⚡', t: '15 daqiqada javob bering' },
        { i: '❓', t: 'Avval so‘rang, keyin taklif qiling' },
        { i: '🎁', t: 'Foydani ayting va 3 variant bering' },
        { i: '🛡️', t: '«Qimmat» — bu savol, bahslashmang' },
        { i: '🤝', t: 'Xariddan keyin aloqada qoling' },
      ],
      next: '11-mavzu · Mahsulot narxini shakllantirish',
      lines: [
        { t: "Tez javob bering va avval so'rang.", on: [0, 1] },
        { t: "Foydani ayting, 3 variant bering va «qimmat»dan qo'rqmang.", on: [2, 3] },
        { t: 'Xariddan keyin ham aloqada qoling. Keyingi mavzu — narxni shakllantirish. Omad!', on: [4, 'next'] },
      ],
    },
  ],
});
