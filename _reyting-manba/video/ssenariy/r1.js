/* 🎬 R1 · Kasbiy etika va xizmat sikli — animatsion video ssenariysi (sahna.html + film.js).
   Sahna turlari: title, list, steps, rule, dialog, compare, outro. lines — subtitr satrlari (vaqt matn uzunligidan
   hisoblanadi): s — "L"/"R" (chap/o'ng qahramon gapiradi, pufakcha chiqadi) yoki bo'sh (boshlovchi);
   on — shu satrda ko'rinadigan elementlar; note/icon — ekrandagi belgi. **qalin** — ajratilgan so'z. */
(function (root, S) {
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
  else root.SSENARIY = S;
})(this, {
  n: 1,
  title: 'Kasbiy etika va xizmat sikli',
  scenes: [
    {
      type: 'title',
      title: 'Kasbiy etika va **xizmat sikli**',
      sub: "Mehmonni kutib olishdan kuzatib qo'yishgacha",
      lines: [
        { t: "Assalomu alaykum! Men Aziz — ofitsiantman. Bugun xizmat siklini ko'rib chiqamiz." },
        { t: 'Mehmon restoranga taassurot uchun keladi. Uni esa biz yaratamiz.' },
      ],
    },
    {
      type: 'list',
      head: 'Zalga chiqishdan oldin: **ko‘rinish**',
      host: 'aziz',
      pose: 'chest',
      items: [
        { i: '👔', t: 'Toza, dazmollangan forma', d: 'Beyj ko‘rinadigan joyda' },
        { i: '✂️', t: 'Kalta, toza tirnoq', d: 'Uzuk va bilaguzuksiz' },
        { i: '👞', t: 'Yopiq, sirpanmaydigan poyabzal', d: 'Toza va qulay' },
        { i: '📵', t: 'Telefon va saqich — zaldan tashqarida', d: 'Atir juda yengil yoki yo‘q' },
      ],
      lines: [
        { t: "Mehmon sizni eshitishdan oldin ko'radi: forma toza, beyj joyida.", on: [0] },
        { t: 'Tirnoqlar kalta va toza. Uzuk va bilaguzuk taqilmaydi.', on: [1] },
        { t: 'Poyabzal yopiq va sirpanmaydigan.', on: [2] },
        { t: 'Telefon va saqich zalga chiqmaydi.', on: [3] },
      ],
    },
    {
      type: 'steps',
      head: 'Smenaoldi **brifingi** — 10–15 daqiqa',
      num: false,
      items: [
        { i: '📋', t: 'Bronlar', d: 'Kim, qachon, necha kishi' },
        { i: '🚫', t: 'Stop-list', d: 'Bugun yo‘q taomlar' },
        { i: '⭐', t: 'Kun taomi', d: 'Oshxona tavsiyasi' },
        { i: '🗺️', t: 'Bo‘limlar', d: 'Kim qaysi stolda' },
        { i: '🎯', t: 'Maqsad', d: 'Smena vazifasi' },
      ],
      lines: [
        { t: "Smena brifingdan boshlanadi: bugungi bronlar e'lon qilinadi.", on: [0] },
        { t: "Stop-list — bugun tugagan taomlar ro'yxati.", on: [1] },
        { t: "Kun taomi, bo'limlar taqsimoti va smena maqsadi.", on: [2, 3, 4] },
        { t: "Savolingizni shu yerda so'rang — mehmon oldida emas." },
      ],
    },
    {
      type: 'steps',
      head: 'Xizmat sikli — **10 qadam**',
      cols: 5,
      items: [
        { i: '👋', t: 'Kutib olish' },
        { i: '🪑', t: 'Joylashtirish' },
        { i: '🥤', t: 'Ichimlik taklifi' },
        { i: '📝', t: 'Buyurtma' },
        { i: '🍲', t: 'Taomni uzatish' },
        { i: '💬', t: 'Tekshirish' },
        { i: '👀', t: 'Stolni kuzatish' },
        { i: '🍰', t: 'Desert taklifi' },
        { i: '🧾', t: 'Hisob' },
        { i: '🤝', t: 'Kuzatib qo‘yish' },
      ],
      lines: [
        { t: "Xizmat sikli — o'n qadam: kutib olish, joylashtirish, ichimlik taklifi.", on: [0, 1, 2] },
        { t: 'Buyurtma, taomni uzatish va tekshirish.', on: [3, 4, 5] },
        { t: "Stolni kuzatish, desert, hisob va kuzatib qo'yish.", on: [6, 7, 8, 9] },
        { t: 'Tartib buzilsa, mehmon buni darhol sezadi.' },
      ],
    },
    {
      type: 'rule',
      head: 'Kutib olish: **30 soniya** qoidasi',
      big: '30',
      unit: 'soniya',
      items: [
        { i: '👀', t: 'Ko‘z bilan aloqa va tabassum', d: 'Band bo‘lsangiz ham' },
        { i: '👋', t: '«Assalomu alaykum! Xush kelibsiz!»' },
        { i: '❓', t: '«Stol band qilganmisiz? Necha kishisiz?»' },
      ],
      lines: [
        { t: "Mehmon kirdi — uni o'ttiz soniya ichida payqash shart." },
        { t: "Band bo'lsangiz ham — ko'z bilan aloqa va tabassum.", on: [0] },
        { t: "Keyin salom bering va bron bor-yo'qligini aniqlang.", on: [1, 2] },
      ],
    },
    {
      type: 'dialog',
      prop: 'stand',
      enter: 'R',
      left: { who: 'aziz', pose: 'chest' },
      right: { who: 'karimov' },
      lines: [
        { t: 'Birinchi vaziyat: mehmon stolni oldindan band qilgan.', note: '📖 Vaziyat A — bron bilan', quiet: true },
        { s: 'L', t: 'Assalomu alaykum, xush kelibsiz! Stol band qilganmisiz?' },
        { s: 'R', t: 'Ha, Karimov nomiga, soat yettiga.' },
        { s: 'L', t: "Janob Karimov, to'rt kishilik stol, deraza yonida — to'g'rimi?" },
        { s: 'R', t: "To'g'ri." },
        { t: 'Bron ovoz chiqarib tasdiqlandi: ism, vaqt, kishilar soni.', note: '✔ Ism · vaqt · kishilar soni', tone: 'ok', quiet: true },
        { s: 'L', t: "Bolalar stuli ham joyida. Marhamat, men kuzatib qo'yaman." },
        { t: "Maxsus so'rovni ofitsiantning o'zi eslatdi. Bron — bu va'da.", note: '⭐ Maxsus so‘rovni o‘zingiz eslating', tone: 'ok', quiet: true },
      ],
    },
    {
      type: 'dialog',
      prop: 'stand',
      enter: 'R',
      left: { who: 'aziz', pose: 'chest' },
      right: { who: 'dilnoza' },
      lines: [
        { t: 'Ikkinchi vaziyat: mehmon bronsiz keldi, stollar band.', note: '🚶 Vaziyat B — bronsiz', quiet: true },
        { s: 'L', t: 'Assalomu alaykum, xush kelibsiz! Necha kishisiz?' },
        { s: 'R', t: 'Ikki kishimiz, bron qilmagandik.' },
        { t: "«Joy yo'q» demang. Halol vaqt ayting va tanlov bering.", note: '⛔ «Joy yo‘q» — demang', tone: 'bad', quiet: true },
        { s: 'L', t: "Stol 15–20 daqiqada bo'shaydi. Kutish joyida o'tirsangiz, o'zim chaqiraman." },
        { s: 'R', t: 'Mayli, kutamiz.' },
        { t: "Kam va'da bering — ortig'i bilan bajaring.", icon: '⏱️', cap: '15–20 daqiqa', quiet: true },
      ],
    },
    {
      type: 'list',
      head: 'Stolga **joylashtirish**',
      host: 'aziz',
      pose: 'hand',
      items: [
        { i: '🚶', t: 'Kuzatib boring', d: 'Mehmondan 1–2 qadam oldinda' },
        { i: '🪑', t: 'Stulni tortib bering', d: 'Avval ayollar va keksalarga' },
        { i: '📖', t: 'Menyuni ochiq holda bering', d: 'Har bir mehmonga alohida' },
        { i: '🙋', t: 'O‘zingizni tanishtiring', d: 'Va ichimlik taklif qiling' },
      ],
      lines: [
        { t: "Stolni barmoq bilan ko'rsatmang — kuzatib boring.", on: [0] },
        { t: 'Stulni tortib bering: avval ayollar va keksalarga.', on: [1] },
        { t: 'Menyuni ochiq holda, har bir mehmonga alohida bering.', on: [2] },
        { t: "O'zingizni tanishtiring va ichimlik taklif qiling.", on: [3] },
      ],
    },
    {
      type: 'rule',
      head: 'Xizmat davomida: **2 daqiqa** qoidasi',
      big: '2',
      unit: 'daqiqa',
      items: [
        { i: '🍲', t: 'Taom uzatildi', d: 'Mehmon ikki luqma tatib ko‘rdi' },
        { i: '💬', t: '«Taom ma’qul bo‘ldimi?»', d: 'Muammo shu payt tuzatiladi' },
        { i: '🔄', t: 'Stolni har o‘tganda kuzating', d: 'Stakan, idish, non, salfetka' },
      ],
      lines: [
        { t: 'Taom uzatilgach, ikki daqiqa ichida tekshiring.', on: [0] },
        { t: "«Taom ma'qul bo'ldimi?» Muammo shu payt tuzatiladi.", on: [1] },
        { t: "Bo'sh stakan va idishni mehmon so'ramasidan oldin payqang.", on: [2] },
      ],
    },
    {
      type: 'dialog',
      prop: 'table',
      left: { who: 'aziz', pose: 'note' },
      right: { who: 'sardor' },
      lines: [
        { t: "Uchinchi vaziyat: mehmon chegirma so'radi.", note: '🧭 Vaziyat C — vakolat chegarasi', quiet: true },
        { s: 'R', t: 'Men doimiy mijozman. Chegirma qilib bering!' },
        { t: "Chegirma — ofitsiantning vakolatida emas. Va'da bermang.", note: '⛔ Vakolatsiz va’da berilmaydi', tone: 'bad', quiet: true },
        { s: 'L', t: 'Tushundim. Bu masalani administrator hal qiladi — hozir chaqiraman.' },
        { t: "Mas'ulga ayting: qaysi stol, nima bo'ldi, mehmon nima kutyapti.", note: '📣 Stol · voqea · mehmon kutgani', tone: 'ok', quiet: true },
      ],
    },
    {
      type: 'compare',
      head: 'Vakolat: **kim hal qiladi?**',
      a: {
        title: 'O‘zim hal qilaman',
        items: ['Pribor yoki salfetkani almashtirish', 'Kechikish uchun uzr va aniq vaqt', 'Hisobni buyurtma bilan solishtirish'],
      },
      b: {
        title: 'Mas’ulga yetkazaman',
        tone: 'warn',
        icon: '!',
        items: [
          { i: '🔺', t: 'Chegirma yoki bepul taom' },
          { i: '🔺', t: 'Allergiya — oshxona tasdiqlaydi' },
          { i: '🔺', t: 'Janjal, jarohat, salomatlik' },
        ],
      },
      lines: [
        { t: "O'zingiz hal qilasiz: pribor, uzr, hisobni tekshirish.", on: ['a0', 'a1', 'a2'] },
        { t: "Mas'ulga yetkazasiz: chegirma, allergiya, xavfsizlik.", on: ['b0', 'b1', 'b2'] },
        { t: '«Bilmayman» emas — «Hozir aniqlab beraman».' },
      ],
    },
    {
      type: 'dialog',
      left: { who: 'aziz', pose: 'wave' },
      right: { who: 'karimov' },
      lines: [
        { t: 'Oxirgi qadam — kuzatish. Mehmon yakunni eslab qoladi.', note: '🤝 Oxirgi taassurot', quiet: true },
        { s: 'L', t: "Rahmat, janob Karimov! Hammasi ma'qul bo'ldimi?" },
        { s: 'R', t: 'Juda yaxshi, rahmat!' },
        { s: 'L', t: "Yana kutib qolamiz. Xayr, salomat bo'ling!" },
        { t: 'Mehmon ketgach, stolni tekshiring: buyum qolmadimi?', icon: '📱', cap: 'Unutilgan buyum', quiet: true },
      ],
    },
    {
      type: 'outro',
      head: 'Esda qoladigan **6 ta qoida**',
      items: [
        { i: '👋', t: '30 soniyada salom' },
        { i: '⏱️', t: 'Halol kutish vaqti va tanlov' },
        { i: '🪑', t: 'Stolga kuzatib boring' },
        { i: '👀', t: '2 daqiqada tekshiring' },
        { i: '🧭', t: 'Vakolatsiz va’da bermang' },
        { i: '🤝', t: 'Rahmat va kuzatib qo‘yish' },
      ],
      next: '2. Sanitariya va xavfsiz xizmat',
      lines: [
        { t: "Takrorlaymiz: o'ttiz soniyada salom, halol vaqt, stolga kuzatish.", on: [0, 1, 2] },
        { t: 'Ikki daqiqada tekshiruv, vakolat chegarasi, samimiy xayrlashuv.', on: [3, 4, 5] },
        { t: "Keyingi mavzu — sanitariya va xavfsiz xizmat. Ko'rishguncha!", on: ['next'] },
      ],
    },
  ],
});
