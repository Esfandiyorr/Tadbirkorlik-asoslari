/* 💼 «Biznes» — 12 oylik tadbirkorlik bellashuvi (O'yin maydoni). Ikki o'yinchi (talaba va bot yoki ikki kursdosh)
   bir xil kapital bilan bir xil biznesni boshlaydi; har oy narx, xarid, reklama, sifat, kredit va filial bo'yicha qaror
   qiladi, bozor ularni bir vaqtda solishtiradi. 12-oy oxirida kimning sof kapitali (ishlab topgan puli) ko'p — o'sha yutadi.
   Hisob to'liq deterministik: bir xil kalit (seed) va bir xil qarorlar ikkala kompyuterda aynan bir xil natija beradi —
   kursdoshlar o'yinida har kim faqat o'z qarorini yuboradi, natijani ikkalasi ham o'zida hisoblaydi.
   Pul — mln so'm, narx — ming so'm, hajm — dona. */

export type Tri = [string, string, string];
export type Lang = 'uz' | 'en' | 'ru';
export const tx = (lang: Lang, t: Tri) => (lang === 'en' ? t[1] : lang === 'ru' ? t[2] : t[0]);

/* ------------------------------------------------------------------ bizneslar */
export type BizId = 'kofe' | 'fastfud' | 'kiyim';
export type Biz = {
  id: BizId;
  icon: string;
  name: Tri;
  unit: Tri;
  about: Tri;
  price: { min: number; max: number; ref: number; step: number };
  /** bir dona tannarxi, ming so'm */
  cost: number;
  /** ikkala korxona uchun oylik bozor (dona) bazaviy narxda */
  market: number;
  /** bitta filialning oylik sig'imi (dona) */
  cap: number;
  /** bitta filialning oylik doimiy xarajati (ijara, ish haqi, kommunal), mln */
  fixed: number;
  branchCost: number;
  /** umumiy talabning narxga sezgirligi va raqobatda narxning og'irligi */
  elastic: number;
  sens: number;
  /** oy oxirida qolgan zaxiraning buziladigan qismi */
  spoil: number;
  buyStep: number;
  season: number[];
  seasonNote: Tri;
};
export const BUSINESSES: Biz[] = [
  {
    id: 'kofe',
    icon: '☕',
    name: ['Kofexona', 'Coffee shop', 'Кофейня'],
    unit: ['chashka', 'cups', 'чашек'],
    about: [
      'Talabalar shaharchasi yonida kofexona. Mijoz sifat va qulaylikni qadrlaydi, narxga o‘rtacha sezgir.',
      'A coffee shop next to the campus. Customers value quality and comfort and are moderately price-sensitive.',
      'Кофейня у студгородка. Клиенты ценят качество и уют, к цене умеренно чувствительны.',
    ],
    price: { min: 12, max: 45, ref: 25, step: 1 },
    cost: 10,
    market: 13000,
    cap: 7000,
    fixed: 52,
    branchCost: 90,
    elastic: 1.2,
    sens: 0.9,
    spoil: 0.2,
    buyStep: 100,
    season: [1.15, 1.1, 1.0, 0.95, 0.9, 0.85, 0.85, 0.88, 1.0, 1.05, 1.1, 1.2],
    seasonNote: [
      'Qishda issiq ichimliklarga talab oshadi, yozda pasayadi. Ortib qolgan sut va don 20% buziladi.',
      'Demand for hot drinks rises in winter and falls in summer. 20% of leftover milk and beans spoil.',
      'Зимой спрос на горячие напитки растёт, летом падает. 20% остатков молока и зёрен портится.',
    ],
  },
  {
    id: 'fastfud',
    icon: '🍔',
    name: ['Fast-fud', 'Fast food', 'Фастфуд'],
    unit: ['porsiya', 'portions', 'порций'],
    about: [
      'Burger va lavash do‘koni. Mijozlar narxga juda sezgir, mahsulot tez buziladi.',
      'A burger and wrap bar. Customers are very price-sensitive and food spoils fast.',
      'Бургерная. Клиенты очень чувствительны к цене, продукты быстро портятся.',
    ],
    price: { min: 15, max: 60, ref: 32, step: 1 },
    cost: 14,
    market: 10000,
    cap: 6000,
    fixed: 48,
    branchCost: 80,
    elastic: 1.5,
    sens: 1.15,
    spoil: 0.5,
    buyStep: 100,
    season: [0.9, 0.9, 1.0, 1.0, 1.05, 1.15, 1.2, 1.15, 1.0, 0.95, 0.95, 1.1],
    seasonNote: [
      'Yozda va bayramlarda talab yuqori. Sotilmagan mahsulotning yarmi buziladi — xaridni aniq hisoblang.',
      'Demand peaks in summer and on holidays. Half of unsold food spoils — plan purchases precisely.',
      'Летом и в праздники спрос выше. Половина непроданного портится — закупайте точно.',
    ],
  },
  {
    id: 'kiyim',
    icon: '👕',
    name: ['Kiyim do‘koni', 'Clothing store', 'Магазин одежды'],
    unit: ['dona', 'items', 'шт.'],
    about: [
      'Yoshlar kiyimlari do‘koni. Brend va sifat muhim, narx yuqori, mavsum keskin o‘zgaradi.',
      'A youth clothing store. Brand and quality matter, prices are high and seasons swing sharply.',
      'Магазин молодёжной одежды. Важны бренд и качество, цены высокие, сезонность резкая.',
    ],
    price: { min: 120, max: 450, ref: 250, step: 5 },
    cost: 145,
    market: 1300,
    cap: 1200,
    fixed: 32,
    branchCost: 90,
    elastic: 1.0,
    sens: 0.7,
    spoil: 0.08,
    buyStep: 20,
    season: [0.8, 0.8, 1.25, 1.0, 1.0, 0.9, 0.85, 1.2, 1.25, 1.0, 1.05, 1.35],
    seasonNote: [
      'Navro‘z (mart), o‘qish boshlanishi (avgust–sentyabr) va Yangi yil (dekabr) — eng qizg‘in oylar. Eski kolleksiya har oy 8% qadrsizlanadi.',
      'Navruz (March), back to school (Aug–Sep) and New Year (Dec) are the busiest months. Old stock loses 8% a month.',
      'Навруз (март), начало учёбы (авг–сен) и Новый год (дек) — самые горячие месяцы. Старая коллекция теряет 8% в месяц.',
    ],
  },
];
export const bizOf = (id: string) => BUSINESSES.find((b) => b.id === id) || BUSINESSES[0];
export const MONTHS: Tri[] = [
  ['Yanvar', 'January', 'Январь'],
  ['Fevral', 'February', 'Февраль'],
  ['Mart', 'March', 'Март'],
  ['Aprel', 'April', 'Апрель'],
  ['May', 'May', 'Май'],
  ['Iyun', 'June', 'Июнь'],
  ['Iyul', 'July', 'Июль'],
  ['Avgust', 'August', 'Август'],
  ['Sentyabr', 'September', 'Сентябрь'],
  ['Oktyabr', 'October', 'Октябрь'],
  ['Noyabr', 'November', 'Ноябрь'],
  ['Dekabr', 'December', 'Декабрь'],
];

/* ------------------------------------------------------------------ qoidalar */
export const RULES = {
  months: 12,
  startCash: 150,
  startQuality: 40,
  startBrand: 20,
  /** aylanmadan olinadigan soliq (tushumdan) */
  tax: 0.04,
  /** bank krediti: oyiga 2% (yiliga ~24%) */
  rate: 0.02,
  /** favqulodda qarz (kassa minusga tushsa): bir martalik 10% jarima */
  emergencyFee: 0.1,
  /** qarz chegarasi: undan oshsa — bankrot */
  debtLimit: 220,
  /** bir oyda olish mumkin bo'lgan kredit */
  loanMax: 80,
  maxBranches: 3,
  /** filial/uskunaning yakuniy (sotish) qiymati */
  assetValue: 0.6,
  /** zaxiraning yakuniy qiymati (tannarxdan) */
  stockValue: 0.8,
  adsMax: 40,
  qualityMax: 25,
};

/* ------------------------------------------------------------------ holat */
export type Decision = {
  price: number;
  buy: number;
  ads: number;
  quality: number;
  loan: number;
  repay: number;
  branch: boolean;
  /** shu oydagi vaziyat bo'yicha tanlov (variant raqami) */
  choice: number;
  /** o'yinchi chiqib ketgan — qarorni bot qilgan */
  bot?: boolean;
};
export type Player = {
  cash: number;
  debt: number;
  /** imtiyozli kredit (oyiga 1%) */
  soft: number;
  stock: number;
  stockCost: number;
  quality: number;
  brand: number;
  branches: number;
  pending: number;
  costMult: number;
  fixedMult: number;
  capMult: number;
  reach: number;
  commission: number;
  extraFixed: number;
  assets: number;
  flags: Record<string, number>;
  bankrupt: boolean;
  last: {
    price: number;
    demand: number;
    sold: number;
    share: number;
    capFull: boolean;
    ads: number;
    quality: number;
  };
  stats: {
    revenue: number;
    profit: number;
    lost: number;
    lostMoney: number;
    spoiled: number;
    spoiledMoney: number;
    interest: number;
    emergency: number;
    ads: number;
    quality: number;
    tax: number;
    lowCash: number;
    capFull: number;
    priceSum: number;
    marginSum: number;
  };
};
export type Line = { key: string; v: number };
export type PlayerMonth = {
  price: number;
  bought: number;
  demand: number;
  sold: number;
  lost: number;
  spoiled: number;
  corporate: number;
  revenue: number;
  profit: number;
  cash: number;
  debt: number;
  stock: number;
  share: number;
  worth: number;
  quality: number;
  brand: number;
  branches: number;
  lines: Line[];
  notes: Tri[];
  outcome?: Tri;
  choice: number;
  ads: number;
  qualityBudget: number;
  openedBranch: boolean;
  emergency: number;
};
export type MonthRecord = {
  m: number;
  event: string;
  demand: number;
  players: [PlayerMonth, PlayerMonth];
};
type Mod = { dem: number; sens: number; cost: number; until: number };
export type Game = {
  biz: BizId;
  seed: number;
  /** keyingi o'ynaladigan oy (1..12); 13 — o'yin tugagan */
  month: number;
  events: string[];
  players: [Player, Player];
  mods: Mod[];
  history: MonthRecord[];
  over: boolean;
  /** 0 yoki 1 — g'olib, 2 — durang, -1 — hali yo'q */
  winner: number;
  /** oy boshida qo'llangan umumiy vaziyat natijasi (foyda/zararga ta'siri va izohlar) */
  pre: { pnl: [number, number]; notes: [Tri[], Tri[]] };
};

/* ------------------------------------------------------------------ tasodif (kalitdan) */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const mix = (...n: number[]) =>
  n.reduce((h, x) => (Math.imul(h ^ (x >>> 0), 2654435761) >>> 0) ^ (h >>> 13), 0x9e3779b9);
const r2 = (x: number) => Math.round(x * 100) / 100;
const cl = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/* ------------------------------------------------------------------ vaziyatlar */
export type EvCtx = {
  g: Game;
  i: number;
  p: Player;
  rival: Player;
  biz: Biz;
  m: number;
  rnd: () => number;
  /** shu oy uchun o'yinchiga xos qo'shimcha (masalan, korporativ buyurtma) */
  extra: { corporate: number; corporatePrice: number; capCut: number; cash: number };
};
type Option = { label: Tri; hint: Tri; apply: (c: EvCtx) => Tri | void };
export type GameEvent = {
  id: string;
  icon: string;
  title: Tri;
  text: (b: Biz) => Tri;
  lesson: Tri;
  /** hamma uchun (tanlovsiz) */
  global?: (c: EvCtx) => Tri | void;
  options?: Option[];
  /** botning tanlovi (o'rta va qiyin daraja) */
  ai?: (c: EvCtx) => number;
  /** zanjirning ikkinchi qismi: faqat shu vaziyatdan keyin */
  after?: string;
};
export const EVENTS: GameEvent[] = [
  {
    id: 'boom',
    icon: '📈',
    title: ['Talab keskin oshdi', 'Demand jumps', 'Спрос резко вырос'],
    text: (b) =>
      b.id === 'kofe'
        ? [
            'Qahraton sovuq boshlandi: bu oy issiq ichimliklarga talab 18% yuqori bo‘ladi.',
            'A cold snap has hit: demand for hot drinks will be 18% higher this month.',
            'Ударили морозы: в этом месяце спрос на горячие напитки будет на 18% выше.',
          ]
        : b.id === 'fastfud'
          ? [
              'Shaharda katta festival: bu oy ko‘chada odam ko‘p, talab 18% yuqori.',
              'A big city festival: the streets are full, demand is 18% higher this month.',
              'Большой городской фестиваль: людей много, спрос на 18% выше.',
            ]
          : [
              'Yangi mavsum kolleksiyalari chiqdi: bu oy xaridorlar 18% ko‘p.',
              'New season collections are out: 18% more shoppers this month.',
              'Вышли новые коллекции: в этом месяце покупателей на 18% больше.',
            ],
    lesson: [
      'Talab oshganda eng qimmat xato — zaxira yetishmasligi: mijoz bo‘sh qaytadi va raqibga ketadi. Yangilikni ko‘rib, xaridni darhol moslang.',
      'When demand rises, the costliest mistake is running out of stock: customers walk away to your rival. Adjust purchases right away.',
      'Когда спрос растёт, самая дорогая ошибка — нехватка товара: клиент уходит к конкуренту. Сразу корректируйте закупку.',
    ],
    global: (c) => {
      c.g.mods.push({ dem: 1.18, sens: 1, cost: 1, until: c.m });
    },
  },
  {
    id: 'costUp',
    icon: '🌾',
    title: ['Xomashyo qimmatladi', 'Raw materials got dearer', 'Сырьё подорожало'],
    text: (b) => [
      `Ta’minotchilar narxni oshirdi: 3 oy davomida har bir ${b.unit[0]} tannarxi 15% qimmat bo‘ladi.`,
      `Suppliers raised prices: for 3 months the cost of each of your ${b.unit[1]} is 15% higher.`,
      `Поставщики подняли цены: 3 месяца себестоимость ${b.unit[2]} на 15% выше.`,
    ],
    lesson: [
      'Tannarx oshsa uch yo‘l bor: narxni oshirish (mijoz kamayadi), marjani qisqartirish (foyda kamayadi) yoki boshqa xarajatni tejash. To‘g‘ri yo‘l mijozlaringiz narxga qanchalik sezgirligiga bog‘liq.',
      'When costs rise you can raise prices (fewer customers), accept a thinner margin (less profit) or cut other costs. The right choice depends on how price-sensitive your customers are.',
      'При росте себестоимости можно поднять цену (меньше клиентов), сократить маржу (меньше прибыли) или урезать другие расходы. Выбор зависит от чувствительности клиентов к цене.',
    ],
    global: (c) => {
      c.g.mods.push({ dem: 1, sens: 1, cost: 1.15, until: c.m + 2 });
    },
  },
  {
    id: 'fx',
    icon: '💵',
    title: ['Dollar kursi oshdi', 'The dollar rose', 'Курс доллара вырос'],
    text: () => [
      'Import qilinadigan xomashyo qimmatladi: tannarx endi doimiy ravishda 8% yuqori.',
      'Imported raw materials got more expensive: your unit cost is now permanently 8% higher.',
      'Импортное сырьё подорожало: себестоимость теперь постоянно на 8% выше.',
    ],
    lesson: [
      'Valyuta xavfi: xomashyosi chetdan keladigan biznes kurs o‘zgarishiga bog‘liq. Mahalliy yetkazib beruvchi yoki narxga «kurs tuzatmasi» bu xavfni kamaytiradi.',
      'Currency risk: a business that imports its inputs depends on the exchange rate. Local suppliers or currency clauses reduce the risk.',
      'Валютный риск: бизнес на импортном сырье зависит от курса. Местные поставщики снижают этот риск.',
    ],
    global: (c) => {
      for (const p of c.g.players) p.costMult = r2(p.costMult * 1.08);
    },
  },
  {
    id: 'rent',
    icon: '🏢',
    title: ['Ijara haqi oshdi', 'Rent went up', 'Аренда подорожала'],
    text: () => [
      'Bino egasi ijarani oshirdi: har bir filialning doimiy xarajati endi 10% yuqori.',
      'The landlord raised the rent: each branch’s fixed costs are now 10% higher.',
      'Арендодатель поднял плату: постоянные расходы каждого филиала выросли на 10%.',
    ],
    lesson: [
      'Doimiy xarajat oshsa, zararsizlik nuqtasi (foyda nolga teng bo‘ladigan sotuv hajmi) ko‘tariladi. Endi foydaga chiqish uchun ko‘proq sotish kerak.',
      'Higher fixed costs raise your break-even point — the sales volume where profit is zero. You now need to sell more to make money.',
      'Рост постоянных расходов поднимает точку безубыточности: чтобы заработать, нужно продавать больше.',
    ],
    global: (c) => {
      for (const p of c.g.players) p.fixedMult = r2(p.fixedMult * 1.1);
    },
  },
  {
    id: 'rival3',
    icon: '🏪',
    title: ['Uchinchi raqib ochildi', 'A third rival opened', 'Открылся третий конкурент'],
    text: () => [
      'Yaqin atrofda yangi do‘kon ochildi: 3 oy davomida bozor 15% kichikroq bo‘ladi.',
      'A new shop opened nearby: for 3 months the market will be 15% smaller.',
      'Рядом открылся новый магазин: 3 месяца рынок будет на 15% меньше.',
    ],
    lesson: [
      'Bozorga yangi o‘yinchi kirsa, umumiy «pirog» bo‘linadi. Omon qolish uchun ajralib turish kerak: sifat, obro‘ yoki eng arzon narx — hammasiga birdan erishib bo‘lmaydi.',
      'A new entrant splits the pie. To survive you must stand out — on quality, brand or lowest price; you cannot win on all at once.',
      'Новый игрок делит рынок. Чтобы выжить, нужно выделяться: качеством, брендом или ценой — всё сразу не получится.',
    ],
    global: (c) => {
      c.g.mods.push({ dem: 0.85, sens: 1, cost: 1, until: c.m + 2 });
    },
  },
  {
    id: 'slowdown',
    icon: '📉',
    title: ['Iqtisodiy sekinlashuv', 'Economic slowdown', 'Экономический спад'],
    text: () => [
      '2 oy davomida odamlar pulni tejaydi: talab 8% kam, mijozlar narxga ancha sezgir.',
      'For 2 months people save money: demand is 8% lower and customers are much more price-sensitive.',
      '2 месяца люди экономят: спрос на 8% ниже, клиенты гораздо чувствительнее к цене.',
    ],
    lesson: [
      'Talabning narx elastikligi: inqirozda mijoz har so‘mni sanaydi. Bunday paytda kichik chegirma katta ulush keltirishi, qimmat narx esa mijozni yo‘qotishi mumkin.',
      'Price elasticity of demand: in hard times customers count every coin. A small discount can win a big share, a high price can lose customers.',
      'Эластичность спроса: в кризис клиент считает каждую монету. Небольшая скидка может дать большую долю.',
    ],
    global: (c) => {
      c.g.mods.push({ dem: 0.92, sens: 1.4, cost: 1, until: c.m + 1 });
    },
  },
  {
    id: 'sale',
    icon: '🏷️',
    title: ['Chegirmalar mavsumi', 'Discount season', 'Сезон скидок'],
    text: () => [
      'Shahardagi barcha do‘konlar chegirma e’lon qildi: bu oy mijozlar narxni juda diqqat bilan solishtiradi.',
      'Every shop in town announced discounts: this month customers compare prices very carefully.',
      'Все магазины города объявили скидки: в этом месяце клиенты внимательно сравнивают цены.',
    ],
    lesson: [
      'Chegirma — vosita, maqsad emas. Ulush uchun narxni tushirsangiz, sotuv o‘sishi marjaning kamayishini qoplaydimi — shuni hisoblang.',
      'A discount is a tool, not a goal. If you cut prices for share, check that the extra sales cover the lost margin.',
      'Скидка — инструмент, а не цель. Проверьте, покрывает ли рост продаж потерю маржи.',
    ],
    global: (c) => {
      c.g.mods.push({ dem: 1.05, sens: 1.5, cost: 1, until: c.m });
    },
  },
  {
    id: 'viral',
    icon: '📱',
    title: ['Video tarqaldi', 'A video went viral', 'Видео стало вирусным'],
    text: () => [
      'Bloger ikkala do‘kon haqida video joyladi. Sifati yuqori bo‘lgan do‘konni maqtadi.',
      'A blogger posted a video about both shops and praised the one with higher quality.',
      'Блогер снял видео об обоих заведениях и похвалил то, где качество выше.',
    ],
    lesson: [
      'Sifat — eng arzon reklama: mamnun mijoz o‘zi boshqalarga aytadi («og‘zaki reklama»). Sifatga sarflangan pul obro‘ga ham ishlaydi.',
      'Quality is the cheapest advertising: happy customers tell others. Money spent on quality also builds your brand.',
      'Качество — самая дешёвая реклама: довольные клиенты рассказывают другим.',
    ],
    global: (c) => {
      const [a, b] = c.g.players,
        top = Math.abs(a.quality - b.quality) < 0.5 ? -1 : a.quality > b.quality ? 0 : 1;
      c.g.players.forEach((p, i) => {
        const up = top === -1 ? 7 : i === top ? 12 : 3;
        p.brand = r2(cl(p.brand + up, 0, 100));
        c.g.pre.notes[i].push(
          i === top
            ? [
                'Sizning sifatingiz yuqoriroq — bloger sizni maqtadi: obro‘ +12.',
                'Your quality was higher — the blogger praised you: brand +12.',
                'Ваше качество выше — блогер вас похвалил: бренд +12.',
              ]
            : top === -1
              ? [
                  'Sifat teng — ikkalangiz ham +7 obro‘ oldingiz.',
                  'Equal quality — you both gained 7 brand.',
                  'Качество равное — обоим +7 к бренду.',
                ]
              : [
                  'Raqibning sifati yuqoriroq — u ko‘proq maqtov oldi. Sizga +3.',
                  'Your rival’s quality was higher — it got the praise. You get +3.',
                  'Качество конкурента выше — хвалили его. Вам +3.',
                ],
        );
      });
    },
  },
  {
    id: 'accountant',
    icon: '🧮',
    title: ['Buxgalter kerakmi?', 'Hire an accountant?', 'Нужен бухгалтер?'],
    text: () => [
      'Tajribali buxgalter oyiga 2,5 mln so‘mga ishlashga tayyor. Hisob-kitob va soliq hisobotlarini tartibga soladi.',
      'An experienced accountant will work for 2.5 mln so‘m a month and keep your books and tax reports in order.',
      'Опытный бухгалтер готов работать за 2,5 млн сум в месяц и вести учёт и налоговую отчётность.',
    ],
    lesson: [
      'Rasmiy va to‘g‘ri hisob — xarajat emas, himoya: xatolar jarima va vaqt yo‘qotishiga olib keladi. Kichik doimiy xarajat katta tasodifiy zararning oldini oladi.',
      'Proper bookkeeping is protection, not a cost: mistakes lead to fines and lost time. A small fixed cost prevents a large random loss.',
      'Правильный учёт — защита, а не расход: ошибки ведут к штрафам. Небольшой постоянный расход предотвращает крупный убыток.',
    ],
    options: [
      {
        label: ['Yollash', 'Hire', 'Нанять'],
        hint: [
          '+2,5 mln/oy doimiy xarajat',
          '+2.5 mln/month fixed cost',
          '+2,5 млн/мес. постоянных расходов',
        ],
        apply: (c) => {
          c.p.flags.accountant = 1;
          c.p.extraFixed = r2(c.p.extraFixed + 2.5);
        },
      },
      {
        label: ['Hisobni o‘zim yuritaman', 'I’ll keep the books myself', 'Буду вести учёт сам'],
        hint: [
          'Pul tejaladi, lekin xato xavfi bor',
          'Saves money, but mistakes are possible',
          'Экономия, но возможны ошибки',
        ],
        apply: () => {},
      },
    ],
    ai: () => 0,
  },
  {
    id: 'audit',
    icon: '🔍',
    after: 'accountant',
    title: ['Soliq tekshiruvi', 'Tax inspection', 'Налоговая проверка'],
    text: () => [
      'Soliq inspektori ikkala korxonaning hujjatlarini tekshirdi. Hisobi tartibsiz korxonaga jarima solinishi mumkin.',
      'A tax inspector checked both businesses. A business with messy books may be fined.',
      'Налоговый инспектор проверил обе компании. Компанию с беспорядком в учёте могут оштрафовать.',
    ],
    lesson: [
      'Buxgalter yollagan korxona tekshiruvdan muammosiz o‘tdi. Doimiy kichik xarajat bilan kutilmagan katta jarimadan qochish — xavfni boshqarish.',
      'The business with an accountant passed without problems. Paying a small regular cost to avoid a large surprise fine is risk management.',
      'Компания с бухгалтером прошла проверку без проблем. Небольшой регулярный расход вместо крупного штрафа — управление рисками.',
    ],
    global: (c) => {
      c.g.players.forEach((p, i) => {
        if (p.flags.accountant) {
          c.g.pre.notes[i].push([
            'Hisobingiz tartibli — tekshiruv muammosiz o‘tdi.',
            'Your books were in order — the inspection went smoothly.',
            'Учёт в порядке — проверка прошла без проблем.',
          ]);
          return;
        }
        if (rng(mix(c.g.seed, c.m, 77, i))() < 0.75) {
          p.cash = r2(p.cash - 12);
          c.g.pre.notes[i].push([
            'Hisobda xatolar topildi: jarima −12 mln.',
            'Errors were found: a 12 mln fine.',
            'Найдены ошибки: штраф −12 млн.',
          ]);
        } else
          c.g.pre.notes[i].push([
            'Bu safar omadingiz keldi: xato topilmadi. Lekin xavf saqlanib qoldi.',
            'Lucky this time: no errors found. But the risk remains.',
            'На этот раз повезло: ошибок не нашли. Но риск остался.',
          ]);
      });
    },
  },
  {
    id: 'insurance',
    icon: '🛡️',
    title: ['Sug‘urta taklifi', 'Insurance offer', 'Предложение страховки'],
    text: () => [
      'Sug‘urta kompaniyasi mulk va zaxirani yong‘in, suv bosish va o‘g‘irlikdan himoya qilishni taklif qilmoqda: oyiga 1,5 mln so‘m.',
      'An insurer offers to cover your property and stock against fire, flooding and theft for 1.5 mln so‘m a month.',
      'Страховая предлагает защитить имущество и товар от пожара, затопления и кражи за 1,5 млн сум в месяц.',
    ],
    lesson: [
      'Sug‘urta — kichik va aniq xarajat evaziga kam ehtimolli, lekin katta zarardan himoya. Biznes bitta baxtsiz hodisadan yopilib qolmasligi kerak.',
      'Insurance trades a small certain cost for protection from an unlikely but large loss. One accident should not close your business.',
      'Страховка — небольшой известный расход ради защиты от редкого, но крупного убытка.',
    ],
    options: [
      {
        label: ['Sug‘urtalash', 'Get insured', 'Застраховаться'],
        hint: ['Oyiga 1,5 mln', '1.5 mln a month', '1,5 млн в месяц'],
        apply: (c) => {
          c.p.flags.insured = 1;
          c.p.extraFixed = r2(c.p.extraFixed + 1.5);
        },
      },
      {
        label: ['Rad etish', 'Decline', 'Отказаться'],
        hint: [
          'Pul tejaladi, xavf o‘zingizda',
          'Saves money, the risk is yours',
          'Экономия, риск на вас',
        ],
        apply: () => {},
      },
    ],
    ai: () => 0,
  },
  {
    id: 'fire',
    icon: '🔥',
    after: 'insurance',
    title: ['Omborda yong‘in', 'Fire in the storeroom', 'Пожар на складе'],
    text: () => [
      'Ikkala korxonaning omborida elektr simi sabab yong‘in chiqdi. Sug‘urtalanganlar zararni qoplatadi.',
      'Faulty wiring caused fires in both storerooms. Insured businesses get their losses covered.',
      'Из-за проводки на складах обеих компаний случился пожар. Застрахованным ущерб возместят.',
    ],
    lesson: [
      'Sug‘urtasi bor korxona bir hafta ichida ishga qaytdi. Sug‘urtasiz korxona zaxiraning bir qismini va ta’mirga katta pulni yo‘qotdi.',
      'The insured business was back at work within a week. The uninsured one lost part of its stock and a lot of money on repairs.',
      'Застрахованная компания вернулась к работе за неделю. Незастрахованная потеряла часть товара и много денег на ремонт.',
    ],
    global: (c) => {
      c.g.players.forEach((p, i) => {
        if (p.flags.insured) {
          c.g.pre.notes[i].push([
            'Sug‘urta zararni to‘liq qopladi — siz hech narsa yo‘qotmadingiz.',
            'Insurance covered the damage in full — you lost nothing.',
            'Страховка полностью покрыла ущерб — вы ничего не потеряли.',
          ]);
          return;
        }
        const lost = Math.floor(p.stock * 0.35);
        p.stockCost = r2(p.stock > 0 ? p.stockCost * (1 - lost / p.stock) : 0);
        p.stock -= lost;
        p.cash = r2(p.cash - 20);
        c.g.pre.notes[i].push([
          `Sug‘urta yo‘q edi: ${lost.toLocaleString('ru-RU')} ${c.biz.unit[0]} yondi, ta’mirga 20 mln ketdi.`,
          `No insurance: ${lost.toLocaleString('en-US')} ${c.biz.unit[1]} burned and repairs cost 20 mln.`,
          `Страховки не было: сгорело ${lost.toLocaleString('ru-RU')} ${c.biz.unit[2]}, ремонт — 20 млн.`,
        ]);
      });
    },
  },
  {
    id: 'supplier',
    icon: '📦',
    title: ['Arzon yetkazib beruvchi', 'A cheaper supplier', 'Дешёвый поставщик'],
    text: (b) => [
      `Yangi ta’minotchi xomashyoni 12% arzonroq beradi, lekin sifati pastroq: sifat darhol 10 ballga tushadi va har oy yana 2 ballga pasayadi. Har bir ${b.unit[0]} arzonlashadi.`,
      `A new supplier offers raw materials 12% cheaper but of lower quality: quality drops by 10 now and by 2 more each month. Each of your ${b.unit[1]} gets cheaper.`,
      `Новый поставщик даёт сырьё на 12% дешевле, но хуже: качество сразу −10 и далее −2 каждый месяц.`,
    ],
    lesson: [
      'Tannarxni tushirish foydani oshiradi, lekin sifat pasaysa mijoz va obro‘ yo‘qoladi. Arzon yo‘l tanlansa, narx ham arzon bo‘lishi kerak — aks holda mijoz tushunmaydi.',
      'Lower costs raise profit, but lower quality costs customers and reputation. If you go cheap, your price must be cheap too.',
      'Снижение себестоимости поднимает прибыль, но падение качества стоит клиентов и репутации.',
    ],
    options: [
      {
        label: ['Qabul qilish', 'Accept', 'Принять'],
        hint: [
          'Tannarx −12%, sifat −10 va har oy −2',
          'Cost −12%, quality −10 and −2 a month',
          'Себестоимость −12%, качество −10 и −2/мес.',
        ],
        apply: (c) => {
          c.p.costMult = r2(c.p.costMult * 0.88);
          c.p.quality = r2(cl(c.p.quality - 10, 0, 100));
          c.p.flags.cheap = 1;
        },
      },
      {
        label: ['Rad etish', 'Decline', 'Отказаться'],
        hint: ['Sifat saqlanadi', 'Quality is kept', 'Качество сохраняется'],
        apply: () => {},
      },
    ],
    ai: (c) => (c.biz.sens > 1 ? 0 : 1),
  },
  {
    id: 'softLoan',
    icon: '🏦',
    title: ['Imtiyozli kredit', 'A subsidised loan', 'Льготный кредит'],
    text: () => [
      'Yoshlar tadbirkorligini qo‘llab-quvvatlash dasturi: 60 mln so‘m kredit, foizi oyiga atigi 1% (oddiy bank krediti — 2%).',
      'A youth entrepreneurship programme offers a 60 mln so‘m loan at only 1% a month (a normal bank loan is 2%).',
      'Программа поддержки молодёжного бизнеса: кредит 60 млн сум всего под 1% в месяц (обычный — 2%).',
    ],
    lesson: [
      'Arzon kredit ham qarz: u faqat daromad keltiradigan joyga (zaxira, filial, uskuna) sarflansa foydali. Kassada bekor yotgan qarz har oy foiz «yeydi».',
      'A cheap loan is still debt: it only pays off if invested in something that earns (stock, a branch, equipment). Idle borrowed money just costs interest.',
      'Дешёвый кредит — всё равно долг: он выгоден, только если вложен в то, что приносит доход.',
    ],
    options: [
      {
        label: ['Kreditni olish', 'Take the loan', 'Взять кредит'],
        hint: [
          '+60 mln, oyiga 0,6 mln foiz',
          '+60 mln, 0.6 mln interest a month',
          '+60 млн, 0,6 млн процентов в месяц',
        ],
        apply: (c) => {
          c.p.cash = r2(c.p.cash + 60);
          c.p.soft = r2(c.p.soft + 60);
        },
      },
      {
        label: ['Rad etish', 'Decline', 'Отказаться'],
        hint: ['Qarzsiz ishlash', 'Stay debt-free', 'Работать без долга'],
        apply: () => {},
      },
    ],
    ai: (c) => (c.p.cash < 120 || c.p.last.capFull ? 0 : 1),
  },
  {
    id: 'influencer',
    icon: '🤳',
    title: ['Bloger reklamasi', 'An influencer deal', 'Реклама у блогера'],
    text: () => [
      'Mashhur bloger 15 mln so‘mga reklama taklif qilmoqda. Tajribaga ko‘ra 60% hollarda obro‘ 18 ballga oshadi, 40% hollarda esa atigi 4 ballga.',
      'A popular blogger offers an ad for 15 mln so‘m. Experience shows a 60% chance of +18 brand and a 40% chance of only +4.',
      'Популярный блогер предлагает рекламу за 15 млн сум: в 60% случаев бренд +18, в 40% — всего +4.',
    ],
    lesson: [
      'Kutilgan qiymat: 0,6 × 18 + 0,4 × 4 = 12,4 ball obro‘. Xuddi shu 15 mln oddiy reklamaga sarflansa ham shuncha atrofida obro‘ beradi, lekin kafolatli. Tavakkalchilikni har doim kutilgan foyda bilan solishtiring.',
      'Expected value: 0.6 × 18 + 0.4 × 4 = 12.4 brand points. The same 15 mln in regular ads gives about as much — but guaranteed. Always compare a gamble with its expected value.',
      'Ожидаемая ценность: 0,6 × 18 + 0,4 × 4 = 12,4 балла. Те же 15 млн в обычной рекламе дают примерно столько же, но гарантированно.',
    ],
    options: [
      {
        label: ['Reklama berish (15 mln)', 'Pay for the ad (15 mln)', 'Заплатить (15 млн)'],
        hint: ['60%: obro‘ +18 · 40%: +4', '60%: brand +18 · 40%: +4', '60%: бренд +18 · 40%: +4'],
        apply: (c) => {
          c.p.cash = r2(c.p.cash - 15);
          c.p.stats.ads = r2(c.p.stats.ads + 15);
          const lucky = c.rnd() < 0.6;
          c.p.brand = r2(cl(c.p.brand + (lucky ? 18 : 4), 0, 100));
          return lucky
            ? [
                'Omad kulib boqdi: video ommalashdi, obro‘ +18.',
                'Lucky: the video took off, brand +18.',
                'Повезло: видео выстрелило, бренд +18.',
              ]
            : [
                'Video kam ko‘rildi: obro‘ atigi +4.',
                'The video flopped: brand only +4.',
                'Видео не зашло: бренд всего +4.',
              ];
        },
      },
      {
        label: ['Rad etish', 'Decline', 'Отказаться'],
        hint: ['Pul o‘zingizda qoladi', 'Keep the money', 'Деньги остаются у вас'],
        apply: () => {},
      },
    ],
    ai: (c) => (c.p.cash > 70 ? 0 : 1),
  },
  {
    id: 'corporate',
    icon: '🤝',
    title: ['Katta korporativ buyurtma', 'A big corporate order', 'Крупный корпоративный заказ'],
    text: (b) => {
      const n = corporateSize(b);
      return [
        `Universitet tadbiri uchun shu oy ${n.toLocaleString('ru-RU')} ${b.unit[0]} buyurtma: narxingizdan 20% chegirma bilan. Yetkazib bera olmasangiz — jarima 6 mln va obro‘ −8.`,
        `A university event orders ${n.toLocaleString('en-US')} ${b.unit[1]} this month at 20% below your price. Fail to deliver and you pay a 6 mln penalty and lose 8 brand.`,
        `Заказ университета на ${n.toLocaleString('ru-RU')} ${b.unit[2]} в этом месяце со скидкой 20%. Не выполните — штраф 6 млн и бренд −8.`,
      ];
    },
    lesson: [
      'Katta buyurtma — tayyor sotuv, lekin chegirma marjani kamaytiradi va zaxira hamda sig‘im yetarli bo‘lishi shart. Qabul qilishdan oldin imkoniyatingizni hisoblang.',
      'A big order is a guaranteed sale, but the discount cuts the margin and you need the stock and capacity. Check your capacity before you say yes.',
      'Крупный заказ — гарантированная продажа, но скидка режет маржу, и нужны запас и мощности.',
    ],
    options: [
      {
        label: ['Qabul qilish', 'Accept', 'Принять'],
        hint: [
          'Zaxira va sig‘im yetishi kerak',
          'You need the stock and capacity',
          'Нужны запас и мощности',
        ],
        apply: (c) => {
          c.extra.corporate = corporateSize(c.biz);
        },
      },
      {
        label: ['Rad etish', 'Decline', 'Отказаться'],
        hint: ['Odatdagi savdo', 'Business as usual', 'Обычная торговля'],
        apply: () => {},
      },
    ],
    ai: (c) =>
      c.p.branches * c.biz.cap * c.p.capMult > c.p.last.sold + corporateSize(c.biz) * 1.1 ? 0 : 1,
  },
  {
    id: 'raise',
    icon: '👩‍🍳',
    title: ['Xodimlar ish haqini so‘ramoqda', 'Staff ask for a raise', 'Персонал просит прибавку'],
    text: () => [
      'Xodimlaringiz ish haqini oshirishni so‘ramoqda. Oshirsangiz doimiy xarajat 8% ortadi, lekin xizmat sifati yaxshilanadi. Rad etsangiz, eng yaxshi xodim raqibga o‘tib ketishi mumkin.',
      'Your staff ask for a raise. Saying yes adds 8% to fixed costs but improves service. Saying no may send your best worker to the rival.',
      'Сотрудники просят прибавку. Согласитесь — постоянные расходы +8%, но сервис лучше. Откажете — лучший сотрудник может уйти к конкуренту.',
    ],
    lesson: [
      'Xodimlar — asosiy resurs: ular ketsa sifat va ish tezligi tushadi, yangisini o‘rgatish esa qimmat. Ish haqi — xarajat, lekin sifatga investitsiya hamdir.',
      'Staff are a key resource: when they leave, quality and speed drop and training new people is expensive. Wages are a cost but also an investment in quality.',
      'Персонал — ключевой ресурс: уход сотрудников снижает качество, а обучение новых дорого.',
    ],
    options: [
      {
        label: ['Ish haqini oshirish', 'Give the raise', 'Повысить зарплату'],
        hint: [
          'Doimiy xarajat +8%, sifat +6',
          'Fixed costs +8%, quality +6',
          'Пост. расходы +8%, качество +6',
        ],
        apply: (c) => {
          c.p.fixedMult = r2(c.p.fixedMult * 1.08);
          c.p.quality = r2(cl(c.p.quality + 6, 0, 100));
        },
      },
      {
        label: ['Rad etish', 'Refuse', 'Отказать'],
        hint: [
          'Sifat −10, sig‘im −10%',
          'Quality −10, capacity −10%',
          'Качество −10, мощность −10%',
        ],
        apply: (c) => {
          c.p.quality = r2(cl(c.p.quality - 10, 0, 100));
          c.p.capMult = r2(c.p.capMult * 0.9);
          c.rival.quality = r2(cl(c.rival.quality + 3, 0, 100));
        },
      },
    ],
    ai: () => 0,
  },
  {
    id: 'complaint',
    icon: '😠',
    title: ['Ijtimoiy tarmoqda shikoyat', 'A complaint goes online', 'Жалоба в соцсетях'],
    text: () => [
      'Bir mijoz xizmatdan norozi bo‘lib, Telegram kanalda yozdi. Post tez tarqalmoqda.',
      'An unhappy customer wrote about you in a Telegram channel. The post is spreading fast.',
      'Недовольный клиент написал о вас в Telegram-канале. Пост быстро распространяется.',
    ],
    lesson: [
      'Muammoni tan olib tez javob berish obro‘ni saqlaydi, jim turish esa uni yemiradi. Bitta norozi mijoz o‘nlab mijozning fikriga ta’sir qiladi.',
      'Owning up and responding fast protects your reputation; silence erodes it. One unhappy customer influences dozens of others.',
      'Признать проблему и быстро ответить — значит сохранить репутацию; молчание её разрушает.',
    ],
    options: [
      {
        label: [
          'Uzr so‘rab, tovon to‘lash',
          'Apologise and compensate',
          'Извиниться и компенсировать',
        ],
        hint: ['3 mln, obro‘ −3', '3 mln, brand −3', '3 млн, бренд −3'],
        apply: (c) => {
          c.p.cash = r2(c.p.cash - 3);
          c.p.brand = r2(cl(c.p.brand - 3, 0, 100));
        },
      },
      {
        label: ['E’tibor bermaslik', 'Ignore it', 'Проигнорировать'],
        hint: ['Pul tejaladi', 'Saves money', 'Экономия'],
        apply: (c) => {
          c.p.brand = r2(cl(c.p.brand - 14, 0, 100));
          return [
            'Post tarqaldi: obro‘ −14.',
            'The post spread: brand −14.',
            'Пост разошёлся: бренд −14.',
          ];
        },
      },
    ],
    ai: () => 0,
  },
  {
    id: 'equipment',
    icon: '⚙️',
    title: ['Zamonaviy uskuna', 'Modern equipment', 'Современное оборудование'],
    text: (b) => [
      `Yangi uskuna 35 mln so‘m turadi: har bir ${b.unit[0]} tannarxi 8% kamayadi va sig‘im 15% oshadi.`,
      `New equipment costs 35 mln so‘m: unit cost falls by 8% and capacity rises by 15%.`,
      `Новое оборудование за 35 млн сум: себестоимость −8%, мощность +15%.`,
    ],
    lesson: [
      'Kapital xarajat (investitsiya) bir marta qilinadi, foydasi esa oyma-oy keladi. Qoplanish muddatini hisoblang: 35 mln ÷ oylik tejash = necha oy? O‘yin oxiriga yaqin bunday xarid o‘zini oqlamasligi mumkin.',
      'Capital spending is paid once and pays back month by month. Work out the payback period: 35 mln ÷ monthly saving = how many months? Near the end of the game it may not pay off.',
      'Капитальные затраты платятся сразу, а окупаются помесячно. Посчитайте срок окупаемости.',
    ],
    options: [
      {
        label: ['Sotib olish (35 mln)', 'Buy it (35 mln)', 'Купить (35 млн)'],
        hint: [
          'Tannarx −8%, sig‘im +15%',
          'Cost −8%, capacity +15%',
          'Себестоимость −8%, мощность +15%',
        ],
        apply: (c) => {
          c.p.cash = r2(c.p.cash - 35);
          c.p.costMult = r2(c.p.costMult * 0.92);
          c.p.capMult = r2(c.p.capMult * 1.15);
          c.p.assets = r2(c.p.assets + 35 * RULES.assetValue);
        },
      },
      {
        label: ['Rad etish', 'Decline', 'Отказаться'],
        hint: ['Pul kassada qoladi', 'Keep the cash', 'Деньги остаются в кассе'],
        apply: () => {},
      },
    ],
    ai: (c) => (c.m <= 8 && c.p.cash > 80 ? 0 : 1),
  },
  {
    id: 'franchise',
    icon: '🏷️',
    title: ['Franshiza taklifi', 'A franchise offer', 'Предложение франшизы'],
    text: () => [
      'Investor brendingiz nomidan boshqa shaharda do‘kon ochmoqchi va darhol 40 mln so‘m to‘lamoqchi. Lekin u yerdagi sifatni nazorat qila olmaysiz: obro‘ −10.',
      'An investor wants to open a shop under your brand in another city and will pay 40 mln so‘m now. But you cannot control quality there: brand −10.',
      'Инвестор хочет открыть заведение под вашим брендом в другом городе и заплатить 40 млн сразу. Но качество там вы не контролируете: бренд −10.',
    ],
    lesson: [
      'Franshiza — brendni «ijaraga berish»: tez pul, lekin brend boshqa qo‘lda. Obro‘ — uzoq vaqt yig‘iladigan, lekin tez yo‘qotiladigan aktiv.',
      'A franchise rents out your brand: quick money, but your brand is in someone else’s hands. Reputation takes long to build and little to lose.',
      'Франшиза — «аренда» бренда: быстрые деньги, но бренд в чужих руках. Репутацию долго строить и легко потерять.',
    ],
    options: [
      {
        label: ['Rozilik berish (+40 mln)', 'Agree (+40 mln)', 'Согласиться (+40 млн)'],
        hint: ['Obro‘ −10', 'Brand −10', 'Бренд −10'],
        apply: (c) => {
          c.p.cash = r2(c.p.cash + 40);
          c.p.brand = r2(cl(c.p.brand - 10, 0, 100));
        },
      },
      {
        label: ['Rad etish', 'Decline', 'Отказаться'],
        hint: ['Brend sizda qoladi', 'Keep your brand', 'Бренд остаётся у вас'],
        apply: () => {},
      },
    ],
    ai: (c) => (c.p.cash < 60 || c.m >= 10 ? 0 : 1),
  },
  {
    id: 'grant',
    icon: '🏆',
    title: ['Yoshlar granti', 'A youth business grant', 'Грант для молодёжи'],
    text: () => [
      'Davlat yosh tadbirkorlarga 25 mln so‘m grant beradi. Ariza uchun biznes-reja tayyorlash 2 mln turadi. Shart: mahsulot sifati kamida 55 ball.',
      'The state gives young entrepreneurs a 25 mln so‘m grant. Preparing the business plan costs 2 mln. Condition: product quality of at least 55.',
      'Государство даёт молодым предпринимателям грант 25 млн сум. Бизнес-план стоит 2 млн. Условие: качество не ниже 55.',
    ],
    lesson: [
      'Grant va dasturlar faqat shartni bajarganlarga beriladi. Ariza berishdan oldin talablarni o‘qing va o‘zingizni baholang — aks holda vaqt va pul behuda ketadi.',
      'Grants go only to those who meet the conditions. Read the requirements and assess yourself before applying, or you waste time and money.',
      'Гранты получают только те, кто выполняет условия. Сначала прочитайте требования и оцените себя.',
    ],
    options: [
      {
        label: ['Ariza topshirish (2 mln)', 'Apply (2 mln)', 'Подать заявку (2 млн)'],
        hint: ['Sifat ≥ 55 bo‘lsa +25 mln', '+25 mln if quality ≥ 55', '+25 млн при качестве ≥ 55'],
        apply: (c) => {
          c.p.cash = r2(c.p.cash - 2);
          if (c.p.quality >= 55) {
            c.p.cash = r2(c.p.cash + 25);
            return [
              'Grant olindi: +25 mln so‘m!',
              'Grant won: +25 mln so‘m!',
              'Грант получен: +25 млн сум!',
            ];
          }
          return [
            `Rad etildi: sifatingiz ${Math.round(c.p.quality)} ball, kamida 55 kerak edi.`,
            `Rejected: your quality is ${Math.round(c.p.quality)}, at least 55 was needed.`,
            `Отказ: качество ${Math.round(c.p.quality)}, нужно не менее 55.`,
          ];
        },
      },
      {
        label: ['Qatnashmaslik', 'Skip it', 'Не участвовать'],
        hint: ['Hech narsa o‘zgarmaydi', 'Nothing changes', 'Ничего не меняется'],
        apply: () => {},
      },
    ],
    ai: (c) => (c.p.quality >= 55 ? 0 : 1),
  },
  {
    id: 'delivery',
    icon: '🛵',
    title: ['Yetkazib berish xizmati', 'A delivery platform', 'Сервис доставки'],
    text: () => [
      'Yetkazib berish ilovasi hamkorlik taklif qilmoqda: ko‘proq mijoz sizni topadi, lekin har bir sotuvdan 6% komissiya olinadi.',
      'A delivery app offers a partnership: more customers will find you, but it takes a 6% commission on every sale.',
      'Приложение доставки предлагает партнёрство: вас найдёт больше клиентов, но с каждой продажи комиссия 6%.',
    ],
    lesson: [
      'Yangi savdo kanali qamrovni oshiradi, lekin komissiya marjani yeydi. Agar marjangiz kichik bo‘lsa, kanal sotuvni oshirsa ham foydani kamaytirishi mumkin.',
      'A new sales channel widens your reach but its commission eats into your margin. With a thin margin, a channel can grow sales yet shrink profit.',
      'Новый канал продаж расширяет охват, но комиссия съедает маржу. При низкой марже прибыль может упасть.',
    ],
    options: [
      {
        label: ['Ulanish', 'Join', 'Подключиться'],
        hint: [
          'Raqobatda +7 ball, komissiya 6%',
          '+7 in competition, 6% commission',
          '+7 в конкуренции, комиссия 6%',
        ],
        apply: (c) => {
          c.p.reach = r2(c.p.reach + 7);
          c.p.commission = r2(c.p.commission + 0.06);
        },
      },
      {
        label: ['Rad etish', 'Decline', 'Отказаться'],
        hint: ['Komissiyasiz', 'No commission', 'Без комиссии'],
        apply: () => {},
      },
    ],
    ai: (c) => (c.p.last.price > c.biz.cost * c.p.costMult * 1.7 ? 0 : 1),
  },
  {
    id: 'bulk',
    icon: '🚚',
    title: ['Ulgurji chegirma', 'A bulk discount', 'Оптовая скидка'],
    text: (b) => {
      const n = bulkSize(b);
      return [
        `Ta’minotchi ${n.toLocaleString('ru-RU')} ${b.unit[0]}lik zaxirani hozir 15% chegirma bilan sotmoqchi. Pul darhol to‘lanadi, zaxira omborda turadi (buzilish ham bor).`,
        `A supplier offers ${n.toLocaleString('en-US')} ${b.unit[1]} of stock now at 15% off. You pay now and the stock sits in storage (and can spoil).`,
        `Поставщик предлагает ${n.toLocaleString('ru-RU')} ${b.unit[2]} сейчас со скидкой 15%. Платить сразу, товар лежит на складе (и может портиться).`,
      ];
    },
    lesson: [
      'Aylanma mablag‘: chegirma bilan ko‘p xarid qilish arzon, lekin pul omborda «muzlaydi» va buzilish xavfi bor. Chegirma faqat tovar tez sotilsa foydali.',
      'Working capital: buying in bulk is cheaper, but the money is frozen in storage and stock can spoil. A discount only pays if the goods sell fast.',
      'Оборотные средства: оптом дешевле, но деньги «замораживаются» на складе, а товар может портиться.',
    ],
    options: [
      {
        label: ['Sotib olish', 'Buy it', 'Купить'],
        hint: ['Zaxira +, kassa −', 'Stock up, cash down', 'Запас +, касса −'],
        apply: (c) => {
          const n = bulkSize(c.biz),
            price = (n * c.biz.cost * c.p.costMult * 0.85) / 1000;
          if (c.p.cash < price)
            return [
              'Kassada pul yetmadi — xarid bo‘lmadi.',
              'Not enough cash — no purchase.',
              'Не хватило денег — покупки не было.',
            ];
          c.p.cash = r2(c.p.cash - price);
          c.p.stock += n;
          c.p.stockCost = r2(c.p.stockCost + price);
        },
      },
      {
        label: ['Rad etish', 'Decline', 'Отказаться'],
        hint: ['Odatdagi xarid', 'Buy as usual', 'Обычная закупка'],
        apply: () => {},
      },
    ],
    ai: (c) => (c.biz.spoil <= 0.2 && c.p.cash > 100 ? 0 : 1),
  },
  {
    id: 'outage',
    icon: '⚡',
    title: ['Elektr uzilishlari', 'Power cuts', 'Отключения света'],
    text: () => [
      'Bu oy hududda tez-tez elektr uziladi: generatorsiz korxonaning sig‘imi 30% kamayadi. Generator 12 mln so‘m turadi.',
      'Frequent power cuts this month: without a generator your capacity drops by 30%. A generator costs 12 mln so‘m.',
      'В этом месяце частые отключения света: без генератора мощность −30%. Генератор стоит 12 млн сум.',
    ],
    lesson: [
      'Biznes uzluksizligi: kutilmagan to‘xtash daromadni yo‘qotadi. Zaxira quvvat — bir martalik xarajat, lekin keyingi uzilishlarda ham himoya qiladi.',
      'Business continuity: unexpected stoppages lose revenue. A backup generator is a one-off cost that also protects you next time.',
      'Непрерывность бизнеса: простой теряет выручку. Генератор — разовый расход, который защищает и в будущем.',
    ],
    options: [
      {
        label: [
          'Generator olish (12 mln)',
          'Buy a generator (12 mln)',
          'Купить генератор (12 млн)',
        ],
        hint: ['Sig‘im to‘liq saqlanadi', 'Full capacity kept', 'Мощность сохраняется'],
        apply: (c) => {
          c.p.cash = r2(c.p.cash - 12);
          c.p.flags.generator = 1;
          c.p.assets = r2(c.p.assets + 12 * RULES.assetValue);
        },
      },
      {
        label: ['Kutib turish', 'Wait it out', 'Переждать'],
        hint: ['Bu oy sig‘im −30%', 'Capacity −30% this month', 'Мощность −30% в этом месяце'],
        apply: (c) => {
          c.extra.capCut = 0.3;
        },
      },
    ],
    ai: (c) => (c.p.last.capFull || c.p.last.sold > c.p.branches * c.biz.cap * 0.7 ? 0 : 1),
  },
];
export const eventOf = (id: string) => EVENTS.find((e) => e.id === id);
export const corporateSize = (b: Biz) => Math.round((b.market * 0.16) / b.buyStep) * b.buyStep;
export const bulkSize = (b: Biz) => Math.round((b.market * 0.45) / b.buyStep) * b.buyStep;

/** 2–12-oylar uchun vaziyatlar ketma-ketligi (kalitdan): zanjirlar (sug'urta → yong'in, buxgalter → tekshiruv) tartib bilan. */
export function eventPlan(seed: number) {
  const r = rng(mix(seed, 1));
  const tails = new Set(EVENTS.filter((e) => e.after).map((e) => e.id));
  const pool = EVENTS.filter((e) => !tails.has(e.id)).map((e) => e.id);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  // Global (tanlovsiz) vaziyatlar 4 tadan oshmasin — har oy qaror qilish qiziqroq.
  const plan: string[] = [];
  let globals = 0;
  for (const id of pool) {
    if (plan.length >= 11) break;
    const e = eventOf(id)!;
    if (e.global) {
      if (globals >= 4) continue;
      globals++;
    }
    plan.push(id);
  }
  for (const tail of EVENTS.filter((e) => e.after)) {
    const at = plan.indexOf(tail.after!);
    if (at < 0 || at > 8 || r() > 0.8) continue;
    const slot = at + 2 + Math.floor(r() * (plan.length - at - 2));
    // davomi boshqa zanjirning boshlanishi yoki davomi o'rniga qo'yilmaydi (aks holda u «yetim» qoladi)
    const busy = (id: string) => !!eventOf(id)?.after || EVENTS.some((e) => e.after === id);
    if (slot < plan.length && !busy(plan[slot])) plan[slot] = tail.id;
  }
  return ['', ...plan];
}

/* ------------------------------------------------------------------ o'yin */
function newPlayer(): Player {
  return {
    cash: RULES.startCash,
    debt: 0,
    soft: 0,
    stock: 0,
    stockCost: 0,
    quality: RULES.startQuality,
    brand: RULES.startBrand,
    branches: 1,
    pending: 0,
    costMult: 1,
    fixedMult: 1,
    capMult: 1,
    reach: 0,
    commission: 0,
    extraFixed: 0,
    assets: 0,
    flags: {},
    bankrupt: false,
    last: { price: 0, demand: 0, sold: 0, share: 50, capFull: false, ads: 0, quality: 0 },
    stats: {
      revenue: 0,
      profit: 0,
      lost: 0,
      lostMoney: 0,
      spoiled: 0,
      spoiledMoney: 0,
      interest: 0,
      emergency: 0,
      ads: 0,
      quality: 0,
      tax: 0,
      lowCash: 0,
      capFull: 0,
      priceSum: 0,
      marginSum: 0,
    },
  };
}
export function newGame(biz: BizId, seed: number): Game {
  const b = bizOf(biz),
    g: Game = {
      biz,
      seed: seed >>> 0,
      month: 1,
      events: eventPlan(seed),
      players: [newPlayer(), newPlayer()],
      mods: [],
      history: [],
      over: false,
      winner: -1,
      pre: { pnl: [0, 0], notes: [[], []] },
    };
  for (const p of g.players) p.last.price = b.price.ref;
  startMonth(g);
  return g;
}
type Snap = { cash: number; soft: number; debt: number; stockCost: number; assets: number };
const snap = (p: Player): Snap => ({
  cash: p.cash,
  soft: p.soft,
  debt: p.debt,
  stockCost: p.stockCost,
  assets: p.assets,
});
/** Vaziyatning foyda/zararga ta'siri: kredit, investitsiya va zaxira xaridi foyda emas (faqat shakli o'zgaradi). */
const pnlOf = (a: Snap, b: Snap) =>
  r2(
    b.cash -
      a.cash -
      (b.soft - a.soft) -
      (b.debt - a.debt) +
      (b.stockCost - a.stockCost) +
      (b.assets - a.assets) / RULES.assetValue,
  );
/** Oy boshi: umumiy (tanlovsiz) vaziyat darhol qo'llanadi — o'yinchilar qaror qilishdan oldin oqibatini ko'radi. */
function startMonth(g: Game) {
  g.pre = { pnl: [0, 0], notes: [[], []] };
  if (g.over || g.month > RULES.months) return;
  const ev = eventOf(g.events[g.month - 1] || '');
  if (!ev?.global) return;
  const before = g.players.map(snap);
  ev.global({
    g,
    i: 0,
    p: g.players[0],
    rival: g.players[1],
    biz: bizOf(g.biz),
    m: g.month,
    rnd: rng(mix(g.seed, g.month, 5)),
    extra: { corporate: 0, corporatePrice: 0, capCut: 0, cash: 0 },
  });
  g.pre.pnl = g.players.map((p, i) => pnlOf(before[i], snap(p))) as [number, number];
}
export const unitCost = (g: Game, p: Player) =>
  bizOf(g.biz).cost *
  p.costMult *
  g.mods.filter((x) => x.until >= g.month).reduce((a, x) => a * x.cost, 1);
const modsNow = (g: Game, m: number) =>
  g.mods
    .filter((x) => x.until >= m)
    .reduce((a, x) => ({ dem: a.dem * x.dem, sens: a.sens * x.sens }), { dem: 1, sens: 1 });
export const capacity = (g: Game, p: Player) =>
  Math.round(p.branches * bizOf(g.biz).cap * p.capMult);
/** Sof kapital: kassa − qarzlar + zaxira (80%) + filial va uskunalar (60%). */
export const worth = (g: Game, p: Player) =>
  r2(p.cash - p.debt - p.soft + p.stockCost * RULES.stockValue + p.assets);
export const earned = (g: Game, p: Player) => r2(worth(g, p) - RULES.startCash);

/** Raqobatdagi jozibadorlik: sifat, obro', filiallar, kanal va narx. */
function appeal(b: Biz, p: Player, price: number, sens: number) {
  return (
    0.55 * p.quality +
    0.45 * p.brand +
    8 * (p.branches - 1) +
    p.reach -
    b.sens * sens * 100 * (price / b.price.ref - 1)
  );
}
/** Bozor: umumiy talab va ulush (narx, sifat, obro'). noise — shu oydagi tasodif (1 — o'rtacha). */
export function market(g: Game, prices: [number, number], m: number, noise = 1) {
  const b = bizOf(g.biz),
    mods = modsNow(g, m),
    [p0, p1] = g.players;
  const a0 = appeal(b, p0, prices[0], mods.sens),
    a1 = appeal(b, p1, prices[1], mods.sens);
  // Har doim bir qism mijoz odatiga ko'ra keladi (6%): eng qimmat yoki eng zaif do'kon ham butunlay bo'sh qolmaydi.
  const s0 = 0.06 + 0.88 / (1 + Math.exp((a1 - a0) / 12));
  const avg = s0 * prices[0] + (1 - s0) * prices[1];
  const priceFx = cl(Math.pow(b.price.ref / avg, b.elastic), 0.45, 1.7);
  const brandFx = 0.9 + 0.002 * (p0.brand + p1.brand);
  const total =
    b.market * b.season[m - 1] * Math.pow(1.015, m - 1) * mods.dem * priceFx * brandFx * noise;
  return { total, share: [s0, 1 - s0] as [number, number] };
}

/** Qarorni qoidalarga moslash (ikkala kompyuterda bir xil). */
export function clampDecision(g: Game, i: number, d: Partial<Decision>): Decision {
  const b = bizOf(g.biz),
    p = g.players[i];
  const price = cl(
    Math.round((Number(d.price) || b.price.ref) / b.price.step) * b.price.step,
    b.price.min,
    b.price.max,
  );
  const ads = cl(Math.round(Number(d.ads) || 0), 0, RULES.adsMax),
    quality = cl(Math.round(Number(d.quality) || 0), 0, RULES.qualityMax);
  const loan = cl(
    Math.round((Number(d.loan) || 0) / 10) * 10,
    0,
    Math.max(0, Math.min(RULES.loanMax, RULES.debtLimit - p.debt - p.soft)),
  );
  const repay = cl(Math.round(Number(d.repay) || 0), 0, p.debt);
  const branch = !!d.branch && p.branches + p.pending < RULES.maxBranches;
  const buy = Math.max(0, Math.round((Number(d.buy) || 0) / b.buyStep) * b.buyStep);
  const ev = eventOf(g.events[g.month - 1] || '');
  const choice = ev?.options ? cl(Math.round(Number(d.choice) || 0), 0, ev.options.length - 1) : 0;
  return { price, buy, ads, quality, loan, repay, branch, choice, ...(d.bot ? { bot: true } : {}) };
}

/** Bir oyni o'ynash: ikkala o'yinchining qarori bilan. O'yin holatini o'zgartiradi va oy hisobotini qaytaradi. */
export function playMonth(g: Game, raw: [Partial<Decision>, Partial<Decision>]): MonthRecord {
  if (g.over) throw new Error('O‘yin tugagan');
  const b = bizOf(g.biz),
    m = g.month,
    ev = eventOf(g.events[m - 1] || '');
  const ds = [clampDecision(g, 0, raw[0]), clampDecision(g, 1, raw[1])] as [Decision, Decision];
  const extra = [0, 1].map(() => ({ corporate: 0, corporatePrice: 0, capCut: 0, cash: 0 }));
  const outcomes: (Tri | undefined)[] = [undefined, undefined];
  const before = g.players.map(snap);
  // 1) Vaziyat (umumiysi oy boshida qo'llangan; tanlovlisi — hozir, har kimning o'z tanlovi bilan)
  if (ev?.options)
    g.players.forEach((p, i) => {
      outcomes[i] =
        ev.options![ds[i].choice].apply({
          g,
          i,
          p,
          rival: g.players[1 - i],
          biz: b,
          m,
          rnd: rng(mix(g.seed, m, 9, i)),
          extra: extra[i],
        }) || undefined;
    });
  const eventPnl = g.players.map((p, i) => r2(g.pre.pnl[i] + pnlOf(before[i], snap(p))));
  const preNotes = g.pre.notes;
  // 2) Moliya va investitsiya: kredit, qarzni qaytarish, filial
  const opened = [false, false];
  g.players.forEach((p, i) => {
    const d = ds[i];
    p.cash = r2(p.cash + d.loan);
    p.debt = r2(p.debt + d.loan);
    const repay = Math.min(d.repay, Math.max(0, p.cash), p.debt);
    p.cash = r2(p.cash - repay);
    p.debt = r2(p.debt - repay);
    if (d.branch && p.cash >= b.branchCost) {
      p.cash = r2(p.cash - b.branchCost);
      p.pending++;
      p.assets = r2(p.assets + b.branchCost * RULES.assetValue);
      opened[i] = true;
    }
  });
  // 3) Xarid, reklama va sifat — kassadagi puldan (yetmasa, avval xarid qisqaradi)
  const spend = g.players.map((p, i) => {
    const d = ds[i],
      cost = unitCost(g, p);
    let ads = d.ads,
      q = d.quality,
      buy = d.buy;
    const room = Math.max(0, p.cash);
    if (ads + q > room) {
      const k = room / (ads + q);
      ads = Math.floor(ads * k);
      q = Math.floor(q * k);
    }
    const left = Math.max(0, room - ads - q);
    buy = Math.min(buy, Math.floor(left / ((cost * b.buyStep) / 1000)) * b.buyStep);
    const paid = r2((buy * cost) / 1000);
    p.cash = r2(p.cash - paid - ads - q);
    p.stock += buy;
    p.stockCost = r2(p.stockCost + paid);
    return { ads, q, buy, paid, cost };
  });
  // 4) Bozor
  const noise = 0.94 + rng(mix(g.seed, m, 3))() * 0.12;
  const mk = market(g, [ds[0].price, ds[1].price], m, noise);
  const cap = g.players.map((p, i) =>
    Math.round(capacity(g, p) * (p.flags.generator ? 1 : 1 - extra[i].capCut)),
  );
  const capTotal = [...cap];
  const sold = [0, 0],
    corp = [0, 0],
    corpFail = [false, false];
  // korporativ buyurtma birinchi bajariladi
  g.players.forEach((p, i) => {
    const n = extra[i].corporate;
    if (!n) return;
    const can = Math.min(n, p.stock, cap[i]);
    corp[i] = can;
    p.stock -= can;
    cap[i] -= can;
    corpFail[i] = can < n;
  });
  const demand = mk.share.map((s) => mk.total * s);
  const served = g.players.map((p, i) => Math.floor(Math.min(demand[i], p.stock, cap[i])));
  const unmet = demand.map((d, i) => Math.max(0, d - served[i]));
  // xizmat ko'rsatilmagan mijozlarning yarmi raqibga o'tadi (zaxira va sig'imi bo'lsa)
  const spill = g.players.map((p, i) => {
    const j = 1 - i;
    return Math.floor(
      Math.max(0, Math.min(unmet[j] * 0.5, p.stock - served[i], cap[i] - served[i])),
    );
  });
  g.players.forEach((p, i) => {
    sold[i] = served[i] + spill[i];
    p.stock -= sold[i];
  });
  const months: PlayerMonth[] = [];
  g.players.forEach((p, i) => {
    const d = ds[i],
      s = spend[i],
      avgCost =
        p.stock + sold[i] + corp[i] > 0
          ? p.stockCost / (p.stock + sold[i] + corp[i])
          : s.cost / 1000;
    const corpPrice = d.price * 0.8;
    const revenue = r2((sold[i] * d.price + corp[i] * corpPrice) / 1000);
    const cogs = r2(avgCost * (sold[i] + corp[i]));
    p.stockCost = r2(Math.max(0, p.stockCost - cogs));
    // buzilish (qolgan zaxiradan)
    const spoiled = Math.floor(p.stock * b.spoil);
    const spoilMoney = p.stock > 0 ? r2((p.stockCost * spoiled) / p.stock) : 0;
    p.stock -= spoiled;
    p.stockCost = r2(Math.max(0, p.stockCost - spoilMoney));
    const fixed = r2(p.branches * b.fixed * p.fixedMult + p.extraFixed);
    const interest = r2(p.debt * RULES.rate + p.soft * 0.01);
    const tax = r2(revenue * RULES.tax);
    const commission = r2(revenue * p.commission);
    const penalty = corpFail[i] ? 6 : 0;
    p.cash = r2(p.cash + revenue - fixed - interest - tax - commission - penalty);
    // kassa minusga tushsa — bank favqulodda qarz beradi (10% jarima bilan); chegaradan oshsa — bankrot
    let emergency = 0;
    if (p.cash < 0) {
      emergency = r2(-p.cash);
      p.debt = r2(p.debt + emergency * (1 + RULES.emergencyFee));
      p.cash = 0;
      p.stats.emergency = r2(p.stats.emergency + emergency);
    }
    if (p.debt + p.soft > RULES.debtLimit) p.bankrupt = true;
    const profit = r2(
      revenue -
        cogs -
        spoilMoney -
        fixed -
        s.ads -
        s.q -
        interest -
        tax -
        commission -
        penalty +
        eventPnl[i] -
        emergency * RULES.emergencyFee,
    );
    // obro' va sifat (keyingi oyga ta'sir qiladi)
    const lostOwn = Math.max(0, demand[i] - served[i]),
      lostShare = demand[i] > 0 ? lostOwn / demand[i] : 0;
    p.quality = r2(cl(p.quality * 0.9 + 3 * Math.sqrt(s.q) - (p.flags.cheap ? 2 : 0), 0, 100));
    p.brand = r2(
      cl(
        p.brand * 0.85 +
          3.2 * Math.sqrt(s.ads) +
          0.05 * (p.quality - 50) -
          Math.min(6, 12 * lostShare) -
          (corpFail[i] ? 8 : 0),
        0,
        100,
      ),
    );
    p.branches += p.pending;
    p.pending = 0;
    const unitMargin = d.price - s.cost;
    const st = p.stats;
    st.revenue = r2(st.revenue + revenue);
    st.profit = r2(st.profit + profit);
    st.lost += Math.round(lostOwn);
    st.lostMoney = r2(st.lostMoney + (Math.round(lostOwn) * Math.max(0, unitMargin)) / 1000);
    st.spoiled += spoiled;
    st.spoiledMoney = r2(st.spoiledMoney + spoilMoney);
    st.interest = r2(st.interest + interest);
    st.ads = r2(st.ads + s.ads);
    st.quality = r2(st.quality + s.q);
    st.tax = r2(st.tax + tax);
    if (p.cash < 20) st.lowCash++;
    const outOfStock = p.stock + spoiled < b.buyStep / 2;
    // sig'im to'ldi: shu oy sig'imgacha sotildi va baribir mijoz qaytdi
    const capFull = sold[i] + corp[i] >= capTotal[i] - b.buyStep && lostOwn >= b.buyStep / 2;
    if (capFull) st.capFull++;
    st.priceSum += d.price;
    st.marginSum += unitMargin / d.price;
    p.last = {
      price: d.price,
      demand: Math.round(demand[i]),
      sold: sold[i],
      share: 0,
      capFull,
      ads: s.ads,
      quality: s.q,
    };
    const notes: Tri[] = [...preNotes[i]];
    if (lostOwn >= b.buyStep / 2)
      notes.push(
        outOfStock && !capFull
          ? [
              `Zaxira tugadi: ${Math.round(lostOwn).toLocaleString('ru-RU')} ta mijoz bo‘sh qaytdi.`,
              `You ran out of stock: ${Math.round(lostOwn).toLocaleString('en-US')} customers left empty-handed.`,
              `Не хватило товара: ${Math.round(lostOwn).toLocaleString('ru-RU')} клиентов ушли ни с чем.`,
            ]
          : [
              `Sig‘im yetmadi: ${Math.round(lostOwn).toLocaleString('ru-RU')} ta mijozga xizmat ko‘rsatilmadi.`,
              `Not enough capacity: ${Math.round(lostOwn).toLocaleString('en-US')} customers were not served.`,
              `Не хватило мощности: ${Math.round(lostOwn).toLocaleString('ru-RU')} клиентов не обслужены.`,
            ],
      );
    if (spoiled > 0 && spoilMoney >= 1)
      notes.push([
        `${spoiled.toLocaleString('ru-RU')} ${b.unit[0]} buzildi (−${spoilMoney.toFixed(1)} mln).`,
        `${spoiled.toLocaleString('en-US')} ${b.unit[1]} spoiled (−${spoilMoney.toFixed(1)} mln).`,
        `${spoiled.toLocaleString('ru-RU')} ${b.unit[2]} испортилось (−${spoilMoney.toFixed(1)} млн).`,
      ]);
    if (spill[i] > 0)
      notes.push([
        `Raqibga sig‘magan ${spill[i].toLocaleString('ru-RU')} ta mijoz sizga keldi.`,
        `${spill[i].toLocaleString('en-US')} customers your rival could not serve came to you.`,
        `${spill[i].toLocaleString('ru-RU')} клиентов, которых не обслужил конкурент, пришли к вам.`,
      ]);
    if (corp[i] || corpFail[i])
      notes.push(
        corpFail[i]
          ? [
              `Korporativ buyurtma to‘liq bajarilmadi: jarima 6 mln, obro‘ −8.`,
              `The corporate order was not fully delivered: 6 mln penalty, brand −8.`,
              `Корпоративный заказ выполнен не полностью: штраф 6 млн, бренд −8.`,
            ]
          : [
              `Korporativ buyurtma bajarildi: ${corp[i].toLocaleString('ru-RU')} ${b.unit[0]}.`,
              `Corporate order delivered: ${corp[i].toLocaleString('en-US')} ${b.unit[1]}.`,
              `Корпоративный заказ выполнен: ${corp[i].toLocaleString('ru-RU')} ${b.unit[2]}.`,
            ],
      );
    if (emergency)
      notes.push([
        `Kassa yetmadi: bank ${emergency.toFixed(1)} mln favqulodda qarz berdi (+10% jarima).`,
        `You ran out of cash: the bank lent ${emergency.toFixed(1)} mln as an emergency loan (+10% fee).`,
        `Не хватило денег: банк выдал ${emergency.toFixed(1)} млн экстренного кредита (+10% штраф).`,
      ]);
    if (d.buy > s.buy)
      notes.push([
        'Kassada pul yetmagani uchun xarid qisqartirildi.',
        'Your purchase was reduced because cash ran short.',
        'Закупка сокращена из-за нехватки денег.',
      ]);
    months.push({
      price: d.price,
      bought: s.buy,
      demand: Math.round(demand[i]),
      sold: sold[i],
      lost: Math.round(lostOwn),
      spoiled,
      corporate: corp[i],
      revenue,
      profit,
      cash: p.cash,
      debt: r2(p.debt + p.soft),
      stock: p.stock,
      share: 0,
      worth: 0,
      quality: p.quality,
      brand: p.brand,
      branches: p.branches,
      choice: d.choice,
      ads: s.ads,
      qualityBudget: s.q,
      openedBranch: opened[i],
      emergency,
      lines: [
        { key: 'revenue', v: revenue },
        { key: 'cogs', v: -cogs },
        { key: 'spoil', v: -spoilMoney },
        { key: 'fixed', v: -fixed },
        { key: 'ads', v: -s.ads },
        { key: 'quality', v: -s.q },
        { key: 'interest', v: -interest },
        { key: 'tax', v: -tax },
        { key: 'commission', v: -commission },
        { key: 'penalty', v: -penalty },
        { key: 'event', v: eventPnl[i] },
        { key: 'emergency', v: emergency ? -r2(emergency * RULES.emergencyFee) : 0 },
      ].filter((l) => Math.abs(l.v) >= 0.005),
      notes,
      ...(outcomes[i] ? { outcome: outcomes[i] } : {}),
    });
  });
  const totalSold = sold[0] + sold[1];
  months.forEach((x, i) => {
    x.share = totalSold ? Math.round((1000 * sold[i]) / totalSold) / 10 : 50;
    g.players[i].last.share = x.share;
    x.worth = worth(g, g.players[i]);
  });
  const rec: MonthRecord = {
    m,
    event: ev?.id || '',
    demand: Math.round(mk.total),
    players: months as [PlayerMonth, PlayerMonth],
  };
  g.history.push(rec);
  g.month++;
  const [a, z] = g.players;
  if (a.bankrupt || z.bankrupt || g.month > RULES.months) {
    g.over = true;
    const wa = worth(g, a),
      wz = worth(g, z);
    g.winner =
      a.bankrupt && !z.bankrupt
        ? 1
        : z.bankrupt && !a.bankrupt
          ? 0
          : Math.abs(wa - wz) < 0.5
            ? 2
            : wa > wz
              ? 0
              : 1;
  }
  startMonth(g);
  return rec;
}

/** Qarorlar ro'yxatidan o'yinni qayta tiklash (kursdoshlar o'yinida ikkala tomon ham shu bilan hisoblaydi). */
export function replay(biz: BizId, seed: number, months: [Partial<Decision>, Partial<Decision>][]) {
  const g = newGame(biz, seed);
  for (const d of months) {
    if (g.over) break;
    playMonth(g, d);
  }
  return g;
}

/* ------------------------------------------------------------------ yordamchilar (ekran uchun) */
/** Shu oy talabining taxmini (raqib narxi o'tgan oydagidek deb). */
export function forecast(g: Game, i: number, d: Partial<Decision>) {
  const b = bizOf(g.biz),
    m = g.month,
    rival = g.players[1 - i];
  const prices: [number, number] = [0, 0];
  prices[i] = Number(d.price) || b.price.ref;
  prices[1 - i] = rival.last.price || b.price.ref;
  const mk = market(g, prices, m);
  const demand = mk.total * mk.share[i];
  const p = g.players[i],
    cost = unitCost(g, p);
  const cap = capacity(g, p);
  const avail = p.stock + (Number(d.buy) || 0);
  const sales = Math.min(demand, avail, cap);
  const revenue = (sales * prices[i]) / 1000;
  const fixed = p.branches * b.fixed * p.fixedMult + p.extraFixed;
  const profit =
    revenue -
    (sales * cost) / 1000 -
    fixed -
    (Number(d.ads) || 0) -
    (Number(d.quality) || 0) -
    (p.debt + (Number(d.loan) || 0)) * RULES.rate -
    p.soft * 0.01 -
    revenue * (RULES.tax + p.commission);
  return {
    demand: Math.round(demand),
    low: Math.round(demand * 0.88),
    high: Math.round(demand * 1.12),
    share: Math.round(mk.share[i] * 100),
    capacity: cap,
    sales: Math.round(sales),
    profit: r2(profit),
    unitCost: r2(cost),
  };
}
/** Bu oy rejadagi to'lovlar (xarid + reklama + sifat + filial − kredit + qaytarish). */
export function planCash(g: Game, i: number, d: Partial<Decision>) {
  const b = bizOf(g.biz),
    p = g.players[i];
  const buy = ((Number(d.buy) || 0) * unitCost(g, p)) / 1000;
  const out =
    buy +
    (Number(d.ads) || 0) +
    (Number(d.quality) || 0) +
    (d.branch ? b.branchCost : 0) +
    (Number(d.repay) || 0);
  return {
    buy: r2(buy),
    out: r2(out),
    available: r2(p.cash + (Number(d.loan) || 0)),
    left: r2(p.cash + (Number(d.loan) || 0) - out),
  };
}

/* ------------------------------------------------------------------ bot */
export type BotLevel = 0 | 1 | 2;
export const BOT_NAMES: Tri[] = [
  ['«Tez Start» (oson)', '“Quick Start” (easy)', '«Быстрый старт» (лёгкий)'],
  ['«Bozor Ustasi» (o‘rta)', '“Market Pro” (medium)', '«Мастер рынка» (средний)'],
  ['«Temir Biznes» (qiyin)', '“Iron Business” (hard)', '«Железный бизнес» (сложный)'],
];
/** Bot qarori: talabni prognoz qiladi, narx va xaridni moslaydi, pulni taqsimlaydi. Faqat kalitdan tasodif — deterministik. */
export function botDecision(g: Game, i: number, level: BotLevel): Decision {
  const b = bizOf(g.biz),
    m = g.month,
    p = g.players[i],
    rival = g.players[1 - i],
    r = rng(mix(g.seed, m, 31, i, level));
  const err = [0.3, 0.12, 0.04][level];
  const ev = eventOf(g.events[m - 1] || '');
  // narx
  let price = p.last.price || b.price.ref;
  if (m === 1) price = b.price.ref + (level === 0 ? (r() - 0.5) * 6 * b.price.step : 0);
  else if (level === 0) price += Math.round((r() - 0.5) * 4) * b.price.step;
  else {
    const cost = unitCost(g, p);
    if (p.last.capFull) price *= 1.05;
    else if (p.last.share < 45) price *= level === 2 ? 0.96 : 0.98;
    else if (p.last.share > 60) price *= 1.02;
    if (level === 2 && rival.last.price && rival.last.price < price * 0.9)
      price = Math.max(price * 0.97, rival.last.price * 1.04);
    price = Math.max(price, cost * 1.35);
  }
  // talab prognozi
  const prices: [number, number] = [0, 0];
  prices[i] = price;
  prices[1 - i] = rival.last.price || b.price.ref;
  const mk = market(g, prices, m);
  const expect = mk.total * mk.share[i] * (1 + (r() - 0.5) * 2 * err);
  const cap = capacity(g, p);
  const target = Math.min(expect * (1 + [0.25, 0.1, 0.06][level]), cap * 1.02);
  let buy = Math.max(0, target - p.stock);
  // pulni taqsimlash
  const ads = cl(
    Math.round([4 + r() * 10, 8, 10 + (rival.last.ads > 10 ? 3 : 0)][level]),
    0,
    RULES.adsMax,
  );
  const quality = cl(Math.round([2 + r() * 8, 6, 8][level]), 0, RULES.qualityMax);
  const cost = unitCost(g, p);
  let loan = 0,
    repay = 0,
    branch = false;
  const fixed = p.branches * b.fixed * p.fixedMult + p.extraFixed;
  const need = (buy * cost) / 1000 + ads + quality + fixed * 0.3;
  if (p.cash < need) loan = cl(Math.ceil((need - p.cash + 10) / 10) * 10, 0, RULES.loanMax);
  else if (level > 0 && p.debt > 0 && p.cash - need > 60)
    repay = Math.min(p.debt, Math.floor(p.cash - need - 40));
  if (
    level > 0 &&
    p.last.capFull &&
    p.branches < RULES.maxBranches &&
    m <= 9 &&
    p.cash - need > b.branchCost + (level === 2 ? 20 : 50)
  )
    branch = true;
  buy = Math.min(
    buy,
    Math.max(0, ((p.cash + loan - ads - quality - (branch ? b.branchCost : 0)) * 1000) / cost),
  );
  let choice = 0;
  if (ev?.options) {
    if (level === 0) choice = Math.floor(r() * ev.options.length);
    else
      choice = ev.ai
        ? ev.ai({
            g,
            i,
            p,
            rival,
            biz: b,
            m,
            rnd: r,
            extra: { corporate: 0, corporatePrice: 0, capCut: 0, cash: 0 },
          })
        : 1;
  }
  return clampDecision(g, i, { price, buy, ads, quality, loan, repay, branch, choice });
}

/* ------------------------------------------------------------------ yakuniy tahlil */
export type Lesson = { icon: string; text: Tri; weight: number };
/** O'yinchining 12 oylik qarorlaridan shaxsiy saboqlar (eng katta pul ta'siri bo'yicha). */
export function lessons(g: Game, i: number): Lesson[] {
  const b = bizOf(g.biz),
    p = g.players[i],
    s = p.stats,
    n = Math.max(1, g.history.length),
    out: Lesson[] = [];
  const avgPrice = s.priceSum / n,
    margin = (s.marginSum / n) * 100;
  if (s.lostMoney > 5)
    out.push({
      icon: '📦',
      weight: s.lostMoney,
      text: [
        `Zaxira yoki sig‘im yetishmagani uchun ${s.lost.toLocaleString('ru-RU')} ta sotuvni boy berdingiz — bu taxminan ${Math.round(s.lostMoney)} mln so‘m yo‘qotilgan foyda. Talabni o‘tgan oy sotuvi va mavsumga qarab prognoz qiling va biroz zaxira bilan xarid qiling.`,
        `You missed ${s.lost.toLocaleString('en-US')} sales because of stock or capacity shortages — about ${Math.round(s.lostMoney)} mln so‘m of lost profit. Forecast demand from last month’s sales and the season, and buy with a small safety margin.`,
        `Из-за нехватки товара или мощности упущено ${s.lost.toLocaleString('ru-RU')} продаж — около ${Math.round(s.lostMoney)} млн сум прибыли.`,
      ],
    });
  if (s.spoiledMoney > 5)
    out.push({
      icon: '🗑️',
      weight: s.spoiledMoney,
      text: [
        `Ortiqcha xarid tufayli ${s.spoiled.toLocaleString('ru-RU')} ${b.unit[0]} buzildi — ${Math.round(s.spoiledMoney)} mln so‘m isrof. Ortiqcha zaxira — muzlagan pul: kerakli miqdorni hisoblab oling.`,
        `Over-buying spoiled ${s.spoiled.toLocaleString('en-US')} ${b.unit[1]} — ${Math.round(s.spoiledMoney)} mln so‘m wasted. Excess stock is frozen money: buy what you can sell.`,
        `Из-за лишних закупок испорчено ${s.spoiled.toLocaleString('ru-RU')} ${b.unit[2]} — ${Math.round(s.spoiledMoney)} млн сум.`,
      ],
    });
  if (margin < 30)
    out.push({
      icon: '🏷️',
      weight: 30 - margin,
      text: [
        `O‘rtacha narxingiz ${Math.round(avgPrice)} ming so‘m, marja atigi ${Math.round(margin)}%. Juda arzon narx ko‘p mijoz keltiradi, lekin har sotuvdan qoladigan pul doimiy xarajatlarni yopmasligi mumkin.`,
        `Your average price was ${Math.round(avgPrice)} thousand so‘m with a margin of only ${Math.round(margin)}%. Very low prices bring customers, but the money left per sale may not cover fixed costs.`,
        `Средняя цена ${Math.round(avgPrice)} тыс. сум, маржа всего ${Math.round(margin)}%.`,
      ],
    });
  else if (margin > 62)
    out.push({
      icon: '💸',
      weight: (margin - 62) / 2,
      text: [
        `Marjangiz juda yuqori (${Math.round(margin)}%). Qimmat narx mijozni raqibga yuboradi — ulushingizni kuzating.`,
        `Your margin was very high (${Math.round(margin)}%). A high price sends customers to your rival — watch your market share.`,
        `Ваша маржа очень высокая (${Math.round(margin)}%). Высокая цена уводит клиентов к конкуренту.`,
      ],
    });
  if (s.interest + s.emergency * RULES.emergencyFee > 8)
    out.push({
      icon: '🏦',
      weight: s.interest + s.emergency * RULES.emergencyFee,
      text: [
        `Kredit foizlari va jarimalarga ${Math.round(s.interest + s.emergency * RULES.emergencyFee)} mln so‘m to‘ladingiz.${s.emergency ? ' Kassa bir necha marta bo‘sh qoldi — favqulodda qarz eng qimmati.' : ''} Qarzni faqat foyda keltiradigan ishga oling va ortiqcha pul bo‘lsa qaytaring.`,
        `You paid ${Math.round(s.interest + s.emergency * RULES.emergencyFee)} mln so‘m in interest and fees.${s.emergency ? ' Your till ran dry — emergency loans are the most expensive.' : ''} Borrow only for what earns money and repay when you have spare cash.`,
        `Вы заплатили ${Math.round(s.interest + s.emergency * RULES.emergencyFee)} млн сум процентов и штрафов.`,
      ],
    });
  if (s.capFull >= 3 && p.branches === 1)
    out.push({
      icon: '🏬',
      weight: 15,
      text: [
        `${s.capFull} oy davomida sig‘imingiz to‘lib qoldi, lekin filial ochmadingiz. O‘sib borayotgan talab — kengayish uchun signal (yangi filial yoki uskuna).`,
        `For ${s.capFull} months you were at full capacity but did not open a branch. Growing demand is a signal to expand (a branch or equipment).`,
        `${s.capFull} мес. мощность была загружена полностью, но вы не открыли филиал.`,
      ],
    });
  if (s.ads > 0 && s.ads / n > 22)
    out.push({
      icon: '📣',
      weight: (s.ads / n - 22) * 2,
      text: [
        `Reklamaga oyiga o‘rtacha ${Math.round(s.ads / n)} mln sarfladingiz. Reklamaning samarasi kamayib boradi: har keyingi millionning qaytimi oldingisidan kam.`,
        `You spent about ${Math.round(s.ads / n)} mln a month on ads. Advertising has diminishing returns: each extra million brings less than the one before.`,
        `Вы тратили на рекламу около ${Math.round(s.ads / n)} млн в месяц. У рекламы убывающая отдача.`,
      ],
    });
  else if (s.ads / n < 3)
    out.push({
      icon: '📣',
      weight: 8,
      text: [
        'Reklamaga deyarli pul sarflamadingiz: obro‘ har oy 15% so‘nadi. Oz bo‘lsa ham doimiy reklama mijozlar sizni eslab qolishi uchun kerak.',
        'You spent almost nothing on ads: brand fades by 15% a month. Small but steady advertising keeps customers remembering you.',
        'Вы почти не тратили на рекламу: бренд угасает на 15% в месяц.',
      ],
    });
  if (s.quality / n < 3)
    out.push({
      icon: '⭐',
      weight: 8,
      text: [
        'Sifatga deyarli pul ajratmadingiz. Sifat har oy pasayadi, u esa ham ulush, ham obro‘ va grant kabi imkoniyatlar uchun muhim.',
        'You invested almost nothing in quality. Quality decays every month and matters for share, reputation and chances like grants.',
        'Вы почти не вкладывали в качество, а оно влияет на долю, репутацию и гранты.',
      ],
    });
  if (s.lowCash >= 3)
    out.push({
      icon: '💧',
      weight: 10,
      text: [
        `${s.lowCash} oy kassangizda 20 mln dan kam pul qoldi. Har doim kutilmagan holatlar uchun zaxira pul saqlang — pul oqimi foydadan ham muhim.`,
        `For ${s.lowCash} months you had less than 20 mln in cash. Always keep a reserve for surprises — cash flow matters even more than profit.`,
        `${s.lowCash} мес. в кассе было меньше 20 млн. Держите резерв — денежный поток важнее прибыли.`,
      ],
    });
  out.sort((a, z) => z.weight - a.weight);
  if (!out.length)
    out.push({
      icon: '🏅',
      weight: 1,
      text: [
        'Pulni muvozanatli taqsimladingiz: zaxira, narx va investitsiyalar o‘rinli bo‘ldi. Endi qiyinroq raqib bilan sinab ko‘ring!',
        'You allocated money in a balanced way: stock, price and investments were well judged. Try a harder rival next!',
        'Вы сбалансированно распределили деньги. Попробуйте более сильного соперника!',
      ],
    });
  return out.slice(0, 4);
}
export const LINE_NAMES: Record<string, Tri> = {
  revenue: ['Tushum', 'Revenue', 'Выручка'],
  cogs: ['Sotilgan tovar tannarxi', 'Cost of goods sold', 'Себестоимость продаж'],
  spoil: ['Buzilgan zaxira', 'Spoiled stock', 'Испорченный товар'],
  fixed: ['Doimiy xarajatlar (ijara, ish haqi)', 'Fixed costs (rent, wages)', 'Постоянные расходы'],
  ads: ['Reklama', 'Advertising', 'Реклама'],
  quality: ['Sifat va o‘qitish', 'Quality and training', 'Качество и обучение'],
  interest: ['Kredit foizi', 'Loan interest', 'Проценты по кредиту'],
  tax: ['Aylanma solig‘i (4%)', 'Turnover tax (4%)', 'Налог с оборота (4%)'],
  commission: ['Yetkazib berish komissiyasi', 'Delivery commission', 'Комиссия доставки'],
  penalty: ['Jarima', 'Penalty', 'Штраф'],
  event: ['Vaziyat (bir martalik)', 'Situation (one-off)', 'Ситуация (разово)'],
  emergency: ['Favqulodda qarz jarimasi', 'Emergency loan fee', 'Штраф экстренного кредита'],
};
