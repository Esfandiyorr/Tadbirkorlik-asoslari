/* 🎬 R2 · Sanitariya va xavfsiz xizmat — animatsion video ssenariysi (sahna.html + film.js). Tuzilishi — r1.js da. */
(function (root, S) {
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
  else root.SSENARIY = S;
})(this, {
  n: 2,
  title: 'Sanitariya va xavfsiz xizmat',
  scenes: [
    {
      type: 'title',
      host: 'malika',
      title: 'Sanitariya va **xavfsiz xizmat**',
      sub: "Toza qo'l, toza idish, xavfsiz zal",
      lines: [
        { t: 'Assalomu alaykum! Men Malika. Bugun — gigiyena va xavfsizlik haqida.' },
        { t: "Ofitsiant — taom va mehmon o'rtasidagi oxirgi halqa." },
      ],
    },
    {
      type: 'list',
      head: 'Mikrob o‘zi yurmaydi — **biz tashiymiz**',
      host: 'malika',
      pose: 'hand',
      items: [
        { i: '✋', t: 'Qo‘l', d: 'Iflos idish → qo‘l → toza stakan' },
        { i: '🍽️', t: 'Idish va anjom', d: 'Bitta patnisda toza va ishlatilgan' },
        { i: '🧽', t: 'Salfetka va sirt', d: 'Bitta latta — hamma joyga' },
        { i: '🤧', t: 'Yo‘tal va aksirish', d: 'Taom va mehmon tomonga' },
      ],
      lines: [
        { t: "Asosiy yo'l — qo'l: iflos idishdan toza stakanga.", on: [0] },
        { t: 'Toza va ishlatilgan idish bitta patnisda.', on: [1] },
        { t: 'Bitta latta bilan stol ham, patnis ham artilsa.', on: [2] },
        { t: "Yo'tal va aksirish — taom tomonga emas, tirsakka.", on: [3] },
      ],
    },
    {
      type: 'steps',
      head: 'Qo‘l yuvish — **6 qadam**',
      cols: 3,
      items: [
        { i: '💧', t: 'Ho‘llang', d: 'Oqar iliq suvda' },
        { i: '🧴', t: 'Sovun oling', d: 'Butun qo‘lni qoplasin' },
        { i: '🤲', t: 'Ishqalang', d: 'Kamida 20 soniya' },
        { i: '🚿', t: 'Chaying', d: 'Sovunni to‘liq' },
        { i: '🧻', t: 'Quriting', d: 'Bir martalik sochiq bilan' },
        { i: '🚰', t: 'Jo‘mrakni yoping', d: 'Qo‘l bilan emas — sochiq bilan' },
      ],
      lines: [
        { t: "Qo'lni ho'llang va sovun oling.", on: [0, 1] },
        { t: "Ishqalang: barmoqlar orasi, bosh barmoq, tirnoq osti.", on: [2] },
        { t: 'Chaying va bir martalik sochiq bilan quriting.', on: [3, 4] },
        { t: "Jo'mrakni qo'l bilan emas — sochiq bilan yoping.", on: [5] },
      ],
    },
    {
      type: 'rule',
      head: 'Ishqalash: kamida **20 soniya**',
      big: '20',
      unit: 'soniya',
      items: [
        { i: '⏰', t: 'Iflos ishdan keyin, toza ishdan oldin' },
        { i: '🚻', t: 'Hojatxonadan keyin — har doim' },
        { i: '🧴', t: 'Antiseptik yuvish o‘rnini bosmaydi' },
      ],
      lines: [
        { t: "Qo'l yuviladi: iflos ishdan keyin, toza ishdan oldin.", on: [0] },
        { t: 'Hojatxonadan keyin — har doim, istisnosiz.', on: [1] },
        { t: "Antiseptik yuvish o'rnini bosmaydi — uni to'ldiradi.", on: [2] },
      ],
    },
    {
      type: 'dialog',
      left: { who: 'malika', pose: 'chest' },
      right: { who: 'admin' },
      lines: [
        { t: "Ertalab Malikada isitma va qorin og'rig'i boshlandi.", note: '🤒 Vaziyat: kasallik belgisi', quiet: true },
        { s: 'L', t: "Menda isitma bor, qornim og'riyapti. Bugun ishlay olmayman." },
        { s: 'R', t: "To'g'ri qildingiz. Dam oling, shifokorga boring." },
        { t: 'Belgini yashirib ishlash — mehmon va hamkasblar uchun xavf.', note: '✔ Smenagacha xabar bering', tone: 'ok', quiet: true },
      ],
    },
    {
      type: 'compare',
      head: 'Idish: **ikki oqim** kesishmaydi',
      a: { title: 'Toza oqim', items: ['Alohida patnis', 'Stakan — pastki qismidan', 'Pribor — faqat dastasidan'] },
      b: {
        title: 'Ishlatilgan oqim',
        tone: 'warn',
        icon: '↩',
        items: [
          { i: '🔸', t: 'Alohida patnis va joy' },
          { i: '🔸', t: 'Keyin — qo‘l yuviladi' },
          { i: '🔸', t: 'Qaytgan non qayta berilmaydi' },
        ],
      },
      lines: [
        { t: "Toza idish: alohida patnis, og'izga tegadigan joyga qo'l tegmaydi.", on: ['a0', 'a1', 'a2'] },
        { t: "Ishlatilgan idish: alohida joy, keyin qo'l yuviladi.", on: ['b0', 'b1'] },
        { t: 'Stoldan qaytgan non boshqa mehmonga berilmaydi.', on: ['b2'] },
      ],
    },
    {
      type: 'dialog',
      prop: 'table',
      left: { who: 'aziz', pose: 'chest' },
      right: { who: 'dilnoza' },
      lines: [
        { t: 'Xizmat paytida vilka yerga tushdi.', icon: '🍴', cap: 'Tushgan pribor', quiet: true },
        { t: 'Uni artib qaytarish mumkin emas!', note: '⛔ Artib qaytarilmaydi', tone: 'bad', quiet: true },
        { s: 'L', t: 'Kechirasiz! Hozir tozasini keltiraman.' },
        { t: "Qo'l tozalanadi, yangi vilka dastasidan keltiriladi.", note: '✔ Yangi pribor — dastasidan', tone: 'ok', quiet: true },
      ],
    },
    {
      type: 'dialog',
      prop: 'table',
      left: { who: 'malika', pose: 'tray' },
      right: { who: 'karimov' },
      lines: [
        { s: 'L', t: "Ehtiyot bo'ling, tarelka issiq!" },
        { s: 'R', t: 'Rahmat, ogohlantirganingiz uchun.' },
        { t: 'Issiq idish — quruq salfetkada, mehmon yonidan uzatiladi.', note: '🔥 Avval ogohlantiring', tone: 'warn', quiet: true },
      ],
    },
    {
      type: 'steps',
      head: 'Ho‘l pol: **tashlab ketmang**',
      items: [
        { i: '✋', t: 'To‘xtang', d: 'Joyda qoling' },
        { i: '⚠️', t: 'Belgilang', d: 'Belgi yoki stul' },
        { i: '🗣️', t: 'Ogohlantiring', d: 'Mehmon va hamkasbni' },
        { i: '🧹', t: 'Tozalang', d: 'Quruq holatgacha' },
        { i: '📣', t: 'Xabar bering', d: 'Mas’ul xodimga' },
      ],
      lines: [
        { t: "Suv to'kildi. Joyni tashlab ketmang!", on: [0] },
        { t: "Belgi qo'ying va odamlarni ogohlantiring.", on: [1, 2] },
        { t: "Quruq holatgacha arting va mas'ulga xabar bering.", on: [3, 4] },
      ],
    },
    {
      type: 'compare',
      head: 'Shisha sindi: **qo‘l bilan yig‘ilmaydi**',
      a: { title: 'To‘g‘ri', items: ['Joyni to‘sish, ogohlantirish', 'Supurgi va xokandoz', 'Alohida mustahkam idish'] },
      b: { title: 'Noto‘g‘ri', items: ['Qo‘l bilan terish', 'Oddiy chiqindi qopiga tashlash', 'Yonidagi muzni qoldirish'] },
      lines: [
        { t: "Joyni to'sing, supurgi bilan yig'ing, alohida idishga soling.", on: ['a0', 'a1', 'a2'] },
        { t: "Qo'l bilan termang va oddiy qopga tashlamang.", on: ['b0', 'b1'] },
        { t: "Yonidagi ochiq muz va taom to'liq almashtiriladi.", on: ['b2'] },
      ],
    },
    {
      type: 'list',
      head: 'Xavf haqida **xabar berish**',
      host: 'aziz',
      pose: 'hand',
      items: [
        { i: '👀', t: 'Ko‘rdim', d: 'Yonidan o‘tib ketmayman' },
        { i: '✋', t: 'To‘xtatdim', d: 'Odamlarni ogohlantirdim' },
        { i: '⚠️', t: 'Belgiladim', d: 'Belgi qo‘ydim yoki olib tashladim' },
        { i: '📣', t: 'Xabar berdim', d: 'Qayerda, nima bo‘ldi' },
      ],
      lines: [
        { t: "Xavfni ko'rdingizmi — yonidan o'tib ketmang, to'xtating.", on: [0, 1] },
        { t: "Belgilang va mas'ulga ayting: qayerda, nima bo'ldi.", on: [2, 3] },
        { t: "Tez yordam — 103, yong'in — 101." },
      ],
    },
    {
      type: 'outro',
      host: 'malika',
      head: 'Esda qoladigan **6 ta qoida**',
      items: [
        { i: '🧼', t: '20 soniya ishqalab yuving' },
        { i: '🤒', t: 'Kasalmisiz — ayting' },
        { i: '🍽️', t: 'Toza va iflos — alohida' },
        { i: '🔁', t: 'Tushdimi — almashtiring' },
        { i: '⚠️', t: 'Xavfni tashlab ketmang' },
        { i: '🔥', t: 'Issiq — ogohlantiring' },
      ],
      next: '3. Stol servirovkasi va taom uzatish',
      lines: [
        { t: "Takrorlaymiz: toza qo'l, sog'lom xodim, ikki oqim.", on: [0, 1, 2] },
        { t: 'Tushgan narsa almashtiriladi, xavf belgilanadi, issiq haqida ogohlantiriladi.', on: [3, 4, 5] },
        { t: "Keyingi mavzu — stol servirovkasi va taom uzatish. Ko'rishguncha!", on: ['next'] },
      ],
    },
  ],
});
