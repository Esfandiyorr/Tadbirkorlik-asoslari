/* 📦 Jonli test uchun tayyor savollar to'plamlari. Administrator «Sayt boshqaruvi → Jonli test → Savollar banki»da
   bir bosishda bankka qo'shadi (bankda bor savollar o'tkazib yuboriladi) — keyin o'yin tuzishda «9-mavzu» bo'limidan
   tanlanadi. Savollar qisqa (telefonda tez o'qiladi), variantlar uzunligi yaqin — javobni uzunligidan topib bo'lmaydi. */

export type LivePackQuestion = { t: string; o: [string, string, string, string]; c: number };
export type LivePack = {
  id: string;
  /** savollar banki bo'limi (LIVE_SECTIONS dagi id) */
  tp: string;
  name: [string, string, string];
  questions: LivePackQuestion[];
};

/** 9-mavzu: Biznes g'oyani taqdim etish va tadbirkorlik yo'lini boshlash (mavzu-9.html, 22 slayd). */
const M9: LivePackQuestion[] = [
  {
    t: '«Lift pitch» (qisqa taqdimot) odatda qancha vaqtga mo‘ljallanadi?',
    o: ['10 soniya', '5 daqiqa', '60 soniya', '15 daqiqa'],
    c: 2,
  },
  {
    t: 'Taqdimot qaysi qism bilan boshlanishi tavsiya etiladi?',
    o: ['Moliya', 'Muammo', 'Jamoa', 'So‘rov'],
    c: 1,
  },
  {
    t: 'Zararsiz nuqta (dona hisobida) qanday hisoblanadi?',
    o: [
      'Doimiy xarajat × birlik narxi',
      'Sarmoya ÷ oylik umumiy tushum',
      'Doimiy xarajat ÷ birlik foydasi',
      'Sotish narxi − doimiy xarajat',
    ],
    c: 2,
  },
  {
    t: 'Narx 30 000 so‘m, birlik xarajati 20 000 so‘m, oylik doimiy xarajat 2 000 000 so‘m. Zararsiz miqdor?',
    o: ['100 dona', '200 dona', '150 dona', '250 dona'],
    c: 1,
  },
  {
    t: 'Mijoz suhbatida haqiqiy muammoni qaysi savol yaxshiroq ochadi?',
    o: [
      '«G‘oyam sizga yoqdimi?»',
      '«Sotib olarmidingiz?»',
      '«Oxirgi marta qachon bo‘ldi?»',
      '«Narxi sizga to‘g‘rimi?»',
    ],
    c: 2,
  },
  {
    t: 'UVP (noyob taklif) nimani bildiradi?',
    o: [
      'Mahsulot tannarxi hisob-kitobini',
      'Raqobatchilar umumiy sonini',
      'Kreditni qaytarish muddatini',
      'Mijoz nega aynan sizni tanlashini',
    ],
    c: 3,
  },
  {
    t: 'MVP nima?',
    o: [
      'G‘oyani sinash uchun eng oddiy variant',
      'Mukammal, to‘liq tayyor mahsulot',
      'Bankka kredit arizasining shakli',
      'Raqobatchilarning to‘liq ro‘yxati',
    ],
    c: 0,
  },
  {
    t: 'Qaysi hisob bozorni «pastdan yuqoriga» baholashga misol?',
    o: [
      'Aholining 1 foizi sotib oladi, deb olish',
      'Men yetadigan 2 000 kishining 5 foizi',
      'Boshqa davlat bozorini ko‘chirib olish',
      'Soha hisobotidagi raqamning yarmi',
    ],
    c: 1,
  },
  {
    t: 'Investor uchun eng kuchli isbot qaysi?',
    o: [
      'Postga kelgan yuzlab layklar',
      'Do‘stlarning ijobiy fikri',
      'Pul to‘lab qaytgan mijozlar',
      'Katta bozor haqidagi raqam',
    ],
    c: 2,
  },
  {
    t: 'Bank biznes taqdimotida birinchi navbatda nimaga qaraydi?',
    o: [
      'Logotip va qadoq dizayniga',
      'Jamoadagi xodimlar soniga',
      'G‘oyaning qanchalik yangiligiga',
      'Oylik tushum va to‘lov manbaiga',
    ],
    c: 3,
  },
  {
    t: '«Raqobatchilaringiz kim?» savoliga eng kuchli javob qaysi?',
    o: [
      '«Raqobatchimiz umuman yo‘q»',
      '«Ular zaif, biz qo‘rqmaymiz»',
      '«Buni keyinroq aytib beraman»',
      '«2 tasi bor, farqimiz — qandsiz»',
    ],
    c: 3,
  },
  {
    t: 'MVP sinovidan oldin nima albatta yozib qo‘yiladi?',
    o: ['Muvaffaqiyat mezoni', 'Kredit summasi', 'Logotip varianti', 'Ijara shartnomasi'],
    c: 0,
  },
  {
    t: 'Sinov natijasi past bo‘lsa, «pivot» nimani anglatadi?',
    o: [
      'Biznesni butunlay yopib qo‘yish',
      'Yo‘nalishni o‘zgartirib qayta sinash',
      'Narxni ikki baravar oshirish',
      'Yangi kredit olib kengayish',
    ],
    c: 1,
  },
  {
    t: 'MChJ ishtirokchisi jamiyat qarzlari uchun odatda nima bilan javob beradi?',
    o: [
      'Butun shaxsiy mulki bilan',
      'Oilasining mulki bilan',
      'Hech qanday javob bermaydi',
      'Kiritgan ulushi doirasida',
    ],
    c: 3,
  },
  {
    t: 'Taqdimotdagi «Marketing» slaydi asosan qaysi mavzuga tayanadi?',
    o: [
      '8-mavzu: reklama va yetkazish',
      '2-mavzu: mijoz muammosi',
      '4-mavzu: rasmiylashtirish',
      '5-mavzu: soliq va hujjatlar',
    ],
    c: 0,
  },
];

export const LIVE_PACKS: LivePack[] = [
  {
    id: 'm9',
    tp: 'm9',
    name: [
      '9-mavzu: Biznes g‘oyani taqdim etish',
      'Topic 9: Presenting a business idea',
      'Тема 9: Презентация бизнес-идеи',
    ],
    questions: M9,
  },
];

/** Savol matnini solishtirish (server «sameText» bilan bir xil). */
export const samePackText = (a: string, b: string) =>
  a.trim().toLowerCase().replace(/\s+/g, ' ') === b.trim().toLowerCase().replace(/\s+/g, ' ');
