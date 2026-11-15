/* 🎬 R3 · Stol servirovkasi va taom uzatish — animatsion video ssenariysi (sahna.html + film.js). Tuzilishi — r1.js da.
   «kuvert» sahnasi — bir mehmon o'rnining yuqoridan ko'rinishi: buyumlar satrma-satr joyiga qo'yiladi
   (on: plate, knife, fork, spoon, knife2, fork2, glass, glass2, bread, dessert, napkin, rule). */
(function (root, S) {
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
  else root.SSENARIY = S;
})(this, {
  n: 3,
  title: 'Stol servirovkasi va taom uzatish',
  scenes: [
    {
      type: 'title',
      title: 'Stol servirovkasi va **taom uzatish**',
      sub: "Kuvertdan yig'ishtirishgacha",
      lines: [
        { t: 'Assalomu alaykum! Bugun stolni jihozlaymiz va taom uzatamiz.' },
        { t: "Bu mavzu to'liq amaliy: har bir qoida qo'lda bajariladi." },
      ],
    },
    {
      type: 'list',
      head: '**Mise en place** — hamma narsa o‘z joyida',
      host: 'aziz',
      pose: 'hand',
      items: [
        { i: '🪑', t: 'Stol liqillamaydi', d: 'Stullar bir chiziqda' },
        { i: '🧵', t: 'Dasturxon toza va tekis', d: 'Chetlari bir xil osilgan' },
        { i: '✨', t: 'Stakan va pribor yaltiraydi', d: 'Dog‘ va barmoq izisiz' },
        { i: '🧰', t: 'Servis stansiyasi to‘la', d: 'Zaxira pribor va salfetka' },
      ],
      lines: [
        { t: 'Mehmon kelguniga qadar stol va stullar tekshiriladi.', on: [0] },
        { t: 'Dasturxon toza, dazmollangan, chetlari bir xil.', on: [1] },
        { t: "Stakan va pribor artiladi — dog' va barmoq izi qolmaydi.", on: [2] },
        { t: 'Zaxira pribor va salfetka servis stansiyasida tayyor.', on: [3] },
      ],
    },
    {
      type: 'kuvert',
      lines: [
        { t: 'Kuvert — bir mehmon uchun to‘liq jihoz. Avval tarelka qo‘yiladi.', on: ['plate'], note: '🍽️ Tarelka — stol chetidan 2 sm' },
        { t: "Pichoq — o'ngda, tig'i tarelkaga qaragan.", on: ['knife'], note: '🔪 Pichoq — o‘ngda, tig‘i tarelkaga' },
        { t: 'Vilka — chapda, tishlari yuqoriga.', on: ['fork'], note: '🍴 Vilka — chapda' },
        { t: "Sho'rva qoshig'i — o'ngda, pichoqdan tashqarida.", on: ['spoon'], note: '🥄 Qoshiq — o‘ngda' },
        { t: 'Gazak pribori — eng chetda: tartib tashqaridan ichkariga.', on: ['knife2', 'fork2'], note: '↔️ Tashqaridan ichkariga' },
        { t: 'Suv qadahi — pichoq uchi ustida.', on: ['glass', 'glass2'], note: '🥂 Qadah — pichoq uchi ustida' },
        { t: 'Non tarelkasi — chap tomonda.', on: ['bread'], note: '🥖 Non tarelkasi — chapda' },
        { t: 'Desert pribori — tarelka yuqorisida.', on: ['dessert'], note: '🍰 Desert pribori — yuqorida' },
        { t: 'Salfetka — tarelkada. Dastalar bir chiziqda, chetdan ikki santimetr.', on: ['napkin', 'rule'], note: '📏 Dastalar bir chiziqda — 2 sm', tone: 'ok' },
      ],
    },
    {
      type: 'compare',
      head: 'Ikki menyu — **ikki servirovka**',
      a: { title: 'Menyu A: salat + asosiy taom', icon: 'A', items: ['Asosiy pichoq va vilka', 'Gazak pichog‘i va vilkasi', 'Suv qadahi, non tarelkasi'] },
      b: {
        title: 'Menyu B: to‘liq, 4 taom',
        tone: 'warn',
        icon: 'B',
        items: [
          { i: '➕', t: 'Sho‘rva qoshig‘i' },
          { i: '➕', t: 'Desert qoshig‘i va vilkasi' },
          { i: '➕', t: 'Ikkinchi qadah' },
        ],
      },
      lines: [
        { t: "Stolga faqat shu menyu uchun kerakli pribor qo'yiladi.", on: ['a0', 'a1', 'a2'] },
        { t: "To'liq menyuda sho'rva qoshig'i va desert pribori qo'shiladi.", on: ['b0', 'b1', 'b2'] },
        { t: "Mehmon taomni o'zgartirsa — pribor ham almashtiriladi." },
      ],
    },
    {
      type: 'compare',
      head: 'Patnis: **og‘iri — markazga**',
      a: { title: 'To‘g‘ri', items: ['Og‘ir va baland buyum — markazda', 'Patnis chap qo‘lda, kaft ustida', 'O‘ng qo‘l bo‘sh — uzatish uchun'] },
      b: { title: 'Noto‘g‘ri', items: ['Og‘ir buyum chetda', 'Patnisni mehmon stoliga qo‘yish', 'Bir tomonni to‘liq bo‘shatish'] },
      lines: [
        { t: "Og'ir va baland buyumlar patnis markaziga qo'yiladi.", on: ['a0'] },
        { t: "Patnis chap qo'lda, o'ng qo'l uzatish uchun bo'sh.", on: ['a1', 'a2'] },
        { t: "Patnis mehmon stoliga qo'yilmaydi, bir tomoni bo'shatilmaydi.", on: ['b0', 'b1', 'b2'] },
      ],
    },
    {
      type: 'dialog',
      prop: 'table',
      left: { who: 'malika', pose: 'tray' },
      right: { who: 'dilnoza' },
      lines: [
        { t: 'Taom tayyor. Kimga qaysi taom — oshxonadan chiqishdan oldin aniq.', note: '🧭 O‘rin raqami bo‘yicha', quiet: true },
        { s: 'L', t: "Kechirasiz… Ehtiyot bo'ling, tarelka issiq." },
        { s: 'L', t: "Marhamat, qo'zi go'shtidan kabob. Yoqimli ishtaha!" },
        { s: 'R', t: 'Rahmat!' },
        { t: "Taom o'ngdan, o'ng qo'l bilan uzatildi — bu «ochiq qo'l» qoidasi.", note: '🤲 O‘ngdan — o‘ng qo‘l bilan', tone: 'ok', quiet: true },
      ],
    },
    {
      type: 'list',
      head: 'Uzatish: **qaysi tomondan?**',
      host: 'malika',
      pose: 'hand',
      items: [
        { i: '🍽️', t: 'Tarelkadagi taom — o‘ngdan', d: 'O‘ng qo‘l bilan' },
        { i: '🥖', t: 'Non va lagandan solish — chapdan', d: 'Non tarelkasi chapda' },
        { i: '🥤', t: 'Ichimlik — o‘ngdan', d: 'Qadahlar o‘ng tomonda' },
        { i: '👥', t: 'Avval mehmonlar', d: 'Oxirida — mezbon' },
      ],
      lines: [
        { t: "Tarelkadagi tayyor taom — o'ng tomondan.", on: [0] },
        { t: 'Non va lagandan solib berish — chapdan.', on: [1] },
        { t: "Ichimlik — o'ngdan: qadahlar o'sha tomonda.", on: [2] },
        { t: 'Avval mehmonlar, oxirida — mezbon. Bir stolga bir vaqtda.', on: [3] },
      ],
    },
    {
      type: 'steps',
      head: 'Yig‘ishtirish: **o‘ngdan, shovqinsiz**',
      items: [
        { i: '🙋', t: 'Ruxsat so‘rang', d: '«Olib ketsam maylimi?»' },
        { i: '🍽️', t: 'Birinchi tarelka — asos', d: 'Chap qo‘lga o‘tadi' },
        { i: '🍴', t: 'Priborlar — tarelkada', d: 'Pichoq vilka ostida' },
        { i: '🥛', t: 'Stakanlar — patnisda', d: 'Pastki qismidan' },
      ],
      lines: [
        { t: "Hamma tugatgach, ruxsat so'rab yig'ing — o'ngdan.", on: [0] },
        { t: "Birinchi tarelka — asos: pribor va qoldiq shunga yig'iladi.", on: [1, 2] },
        { t: 'Stakanlar patnisda, pastki qismidan ushlanadi.', on: [3] },
        { t: 'Qoldiq mehmon oldida sidirilmaydi.' },
      ],
    },
    {
      type: 'outro',
      head: 'Esda qoladigan **6 ta qoida**',
      items: [
        { i: '🧺', t: 'Avval tayyorgarlik' },
        { i: '📏', t: '2 sm va bir chiziq' },
        { i: '📖', t: 'Pribor — menyuga mos' },
        { i: '⚖️', t: 'Og‘iri — markazda' },
        { i: '🤲', t: 'O‘ngdan — o‘ng qo‘l' },
        { i: '🤫', t: 'Shovqinsiz yig‘ing' },
      ],
      next: '4. Xorijiy mehmon bilan muloqot',
      lines: [
        { t: 'Takrorlaymiz: tayyorgarlik, ikki santimetr, menyuga mos pribor.', on: [0, 1, 2] },
        { t: "Og'iri markazda, o'ngdan o'ng qo'l bilan, shovqinsiz yig'ishtirish.", on: [3, 4, 5] },
        { t: "Keyingi mavzu — xorijiy mehmon bilan muloqot. Ko'rishguncha!", on: ['next'] },
      ],
    },
  ],
});
