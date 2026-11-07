/* 💼 «Biznes» — O'yin maydonidagi 12 oylik tadbirkorlik bellashuvi.
   Ikki o'yinchi (talaba va bot yoki ikki kursdosh) bir xil boshlang'ich kapital bilan bir xil turdagi biznesni ochadi.
   0-raund — biznes-reja: joy, uskuna (yangi, ishlatilgan yoki lizing), jamoa va ochilish reklamasi.
   So'ng 12 oy (12 raund): mahsulot darajasi, narx, hajm, uch kanal bo'yicha reklama, jamoa, investitsiyalar va moliya.
   Bozor uch mijoz guruhidan (segmentdan) iborat; har biri narx, sifat, obro' va qulaylikka turlicha qaraydi.
   Reklama — sizni bilishlari uchun, narx va sifat — sizni tanlashlari uchun; qoniqqan mijoz keyingi oy o'zi qaytadi.
   Hisob to'liq deterministik (Math.exp/pow ishlatilmaydi — brauzerlarda oxirgi raqamigacha bir xil bo'lmasligi mumkin):
   bir xil kalit (seed) va bir xil qarorlar ikkala kompyuterda aynan bir xil natija beradi — kursdoshlar o'yinida
   har kim faqat o'z qarorini yuboradi, natijani ikkalasi ham o'zida hisoblaydi.
   Pul — mln so'm, narx — ming so'm, hajm — birlik (porsiya, dona, o'quvchi). */

export type Tri = [string, string, string];
export type Lang = 'uz' | 'en' | 'ru';
export const tx = (lang: Lang, t: Tri) => (lang === 'en' ? t[1] : lang === 'ru' ? t[2] : t[0]);
const T = (uz: string, en: string, ru: string): Tri => [uz, en, ru];
export type Three<X> = [X, X, X];

/* ------------------------------------------------------------------ deterministik yordamchilar */
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
export const mix = (...n: number[]) =>
  n.reduce((h, x) => (Math.imul(h ^ (x >>> 0), 2654435761) >>> 0) ^ (h >>> 13), 0x9e3779b9);
export const r2 = (x: number) => Math.round(x * 100) / 100;
const r4 = (x: number) => Math.round(x * 10000) / 10000;
const cl = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
/** O'zbek va rus matnlari uchun bir xonali o'nlik son (vergul bilan): 3,5 */
const dc = (x: number) => x.toFixed(1).replace('.', ',');
const sum = (xs: number[]) => xs.reduce((a, x) => a + x, 0);
const three = <X>(f: (s: number) => X): Three<X> => [f(0), f(1), f(2)];
/** e^x faqat +, −, ×, ÷ bilan: Math.exp natijasi brauzerlarda oxirgi raqamda farq qilishi mumkin. */
export function dexp(x: number) {
  const y = cl(x, -30, 30);
  const k = Math.round(y / Math.LN2),
    r = y - k * Math.LN2;
  let term = 1,
    s = 1;
  for (let n = 1; n <= 16; n++) {
    term = (term * r) / n;
    s += term;
  }
  let p = 1;
  const f = k < 0 ? 0.5 : 2;
  for (let j = Math.abs(k); j > 0; j--) p *= f;
  return s * p;
}

export const MONTHS: Tri[] = [
  T('Yanvar', 'January', 'Январь'),
  T('Fevral', 'February', 'Февраль'),
  T('Mart', 'March', 'Март'),
  T('Aprel', 'April', 'Апрель'),
  T('May', 'May', 'Май'),
  T('Iyun', 'June', 'Июнь'),
  T('Iyul', 'July', 'Июль'),
  T('Avgust', 'August', 'Август'),
  T('Sentyabr', 'September', 'Сентябрь'),
  T('Oktyabr', 'October', 'Октябрь'),
  T('Noyabr', 'November', 'Ноябрь'),
  T('Dekabr', 'December', 'Декабрь'),
];
/** Kursning 15 mavzusi — har bir vaziyat va saboq shu mavzulardan biriga havola beradi (#lesson/m<N>). */
export const TOPICS: Tri[] = [
  T(
    'Tadbirkorlik tafakkuri va imkoniyatlar',
    'Entrepreneurial mindset and opportunities',
    'Предпринимательское мышление',
  ),
  T(
    'Mijoz muammosidan biznes g‘oya',
    'A business idea from a customer problem',
    'Бизнес-идея из проблемы клиента',
  ),
  T(
    'Mahsulotni kam xarajat bilan sinash',
    'Testing a product cheaply',
    'Дешёвая проверка продукта',
  ),
  T('Biznesni qonuniy rasmiylashtirish', 'Registering a business', 'Юридическое оформление'),
  T('Soliqlar va hujjatlar', 'Taxes and documents', 'Налоги и документы'),
  T('Biznes-model', 'Business model', 'Бизнес-модель'),
  T('CRM: mijozlar bilan ishlash tizimi', 'CRM', 'CRM'),
  T('Reklama va mijozga yetkazish', 'Advertising and delivery', 'Реклама и доставка'),
  T('G‘oyani taqdim etish', 'Pitching an idea', 'Презентация идеи'),
  T('Savdo va mijozlar bilan ishlash', 'Sales and customers', 'Продажи и клиенты'),
  T('Narxni shakllantirish', 'Pricing', 'Ценообразование'),
  T('Pul oqimini rejalashtirish', 'Cash-flow planning', 'Денежный поток'),
  T('Foyda va zarar tahlili', 'Profit and loss', 'Прибыль и убытки'),
  T('Biznes-reja va tashqi bozor', 'Business plan and export', 'Бизнес-план и экспорт'),
  T('Jamoa va xavflarni boshqarish', 'Team and risks', 'Команда и риски'),
];

/* ------------------------------------------------------------------ bizneslar */
export type BizId = 'somsa' | 'gadjet' | 'markaz';
export type Kind = 'perishable' | 'stock' | 'service';
export type LocId = 'uni' | 'bozor' | 'mahalla';
export type EquipId = 'new' | 'used' | 'lease';
export type InvId =
  'cap' | 'training' | 'delivery' | 'pos' | 'crm' | 'design' | 'extra' | 'branch' | 'research';
export type Seg = {
  icon: string;
  name: Tri;
  /** oylik potentsial (xizmatda — yangi yoziladiganlar) */
  size: number;
  season: number[];
  /** sezgirlik: sifat, narx, obro', qulaylik */
  a: number;
  b: number;
  g: number;
  d: number;
  /** «boshqa joydan olaman yoki olmayman» jozibasi */
  out: number;
  /** reklama qiyinligi (mln): qancha kichik bo'lsa, shuncha arzon yetib boriladi */
  k: number;
  /** xizmatda: shu oy oxirida qoladiganlar ulushi (masalan, imtihondan keyin abituriyent ketadi) */
  stay?: number[];
};
export type GradeDef = { name: Tri; hint: Tri; mult: number; q: number };
export type Biz = {
  id: BizId;
  icon: string;
  kind: Kind;
  name: Tri;
  about: Tri;
  unit: Tri;
  volName: Tri;
  price: { min: number; max: number; step: number; ref: number };
  /** standart darajada bir birlikning o'zgaruvchan xarajati (ming so'm) */
  cost: number;
  grades: Three<GradeDef>;
  segs: Three<Seg>;
  channels: Three<Tri>;
  staffName: Tri;
  perStaff: number;
  wage: number;
  staffMax: number;
  equipName: Tri;
  equip: Record<EquipId, { cost: number; monthly: number; cap: number; risk: number }>;
  rent: Record<LocId, number>;
  locAff: Record<LocId, Three<number>>;
  utilities: number;
  retention: number;
  /** perishable: 1 (sotilmagani isrof); stock: oyiga eskirish ulushi; service: 0 */
  waste: number;
  volStep: number;
  /** dollar kursi oshganda tannarx ko'paytmasi */
  fx: number;
  /** nuqsonli chiqib qaytariladigan ulush (daraja bo'yicha) */
  defect: Three<number>;
  /** daraja sig'imga ta'siri (xizmatda: premium — kichik guruhlar, ko'proq o'qituvchi kerak) */
  gradeCap: Three<number>;
  qty: { partner: number; export: number; bulk: number };
  deliveryConv: Three<number>;
  inv: { cap: Tri; delivery: Tri };
  extra: {
    icon: string;
    name: Tri;
    text: Tri;
    cost: number;
    upkeep: number;
    apply: (p: Player) => void;
  };
  mvp: { title: Tri; text: Tri };
  shock: { icon: string; title: Tri; text: Tri; lesson: Tri };
  reviews: { good: Tri; bad: Tri };
};

export const BUSINESSES: Biz[] = [
  {
    id: 'somsa',
    icon: '🥟',
    kind: 'perishable',
    name: T('Somsaxona', 'Somsa bakery', 'Самсахона'),
    about: T(
      'Tandir somsa va choy. Somsa har kuni yopiladi: sotilmagani isrof bo‘ladi — ishlab chiqarishni talabga moslash kerak.',
      'Tandoor somsa and tea. Somsa is baked every day: whatever is not sold is wasted — match production to demand.',
      'Тандырная самса и чай. Самса печётся каждый день: непроданное — в убыток.',
    ),
    unit: T('porsiya', 'portions', 'порций'),
    volName: T('Ishlab chiqarish', 'Production', 'Производство'),
    price: { min: 6, max: 24, step: 0.5, ref: 12 },
    cost: 5,
    grades: [
      {
        name: T('Arzon', 'Budget', 'Эконом'),
        hint: T('Arzon go‘sht va un', 'Cheap meat and flour', 'Дешёвое мясо и мука'),
        mult: 0.8,
        q: 30,
      },
      {
        name: T('Standart', 'Standard', 'Стандарт'),
        hint: T('Oddiy mol go‘shti', 'Regular beef', 'Обычная говядина'),
        mult: 1,
        q: 55,
      },
      {
        name: T('Premium', 'Premium', 'Премиум'),
        hint: T(
          'Qo‘y go‘shti, dumba, sariyog‘',
          'Lamb, tail fat, butter',
          'Баранина, курдюк, масло',
        ),
        mult: 1.35,
        q: 85,
      },
    ],
    segs: [
      {
        icon: '🎓',
        name: T('Talabalar', 'Students', 'Студенты'),
        size: 15000,
        season: [0.55, 1, 1.05, 1, 1, 0.75, 0.35, 0.35, 1.1, 1.1, 1.05, 0.95],
        a: 0.5,
        b: 1.8,
        g: 0.4,
        d: 0.6,
        out: 0.5,
        k: 5,
      },
      {
        icon: '💼',
        name: T('Ishchilar', 'Workers', 'Работающие'),
        size: 9000,
        season: [1.15, 1.1, 1, 0.95, 0.9, 0.85, 0.85, 0.85, 0.95, 1, 1.1, 1.15],
        a: 0.8,
        b: 1,
        g: 0.5,
        d: 1,
        out: 0.5,
        k: 7,
      },
      {
        icon: '👨‍👩‍👧',
        name: T('Oilalar', 'Families', 'Семьи'),
        size: 5000,
        season: [0.9, 0.9, 1.5, 1.1, 1, 1, 1, 1.1, 1.2, 1.2, 1, 1.3],
        a: 1.2,
        b: 0.6,
        g: 1,
        d: 0.6,
        out: 0.6,
        k: 6,
      },
    ],
    channels: [
      T('Instagram va Telegram', 'Instagram and Telegram', 'Instagram и Telegram'),
      T('Ofislarga yetkazish va hamkorlik', 'Office delivery and partners', 'Доставка в офисы'),
      T(
        'Mahalla tadbirlari va tavsiyalar',
        'Neighbourhood events and referrals',
        'Махалля и рекомендации',
      ),
    ],
    staffName: T('xodim (novvoy, sotuvchi)', 'staff (bakers, sellers)', 'сотрудники'),
    perStaff: 2000,
    wage: 3.5,
    staffMax: 12,
    equipName: T('Tandir va oshxona', 'Tandoor and kitchen', 'Тандыр и кухня'),
    equip: {
      new: { cost: 30, monthly: 0, cap: 9000, risk: 0 },
      used: { cost: 14, monthly: 0, cap: 8000, risk: 0.15 },
      lease: { cost: 0, monthly: 3, cap: 9000, risk: 0 },
    },
    rent: { uni: 8, bozor: 7, mahalla: 3.5 },
    locAff: { uni: [1, 0.35, 0.2], bozor: [0.35, 1, 0.5], mahalla: [0.2, 0.4, 1] },
    utilities: 2,
    retention: 0.35,
    waste: 1,
    volStep: 100,
    fx: 1.06,
    defect: [0.02, 0.005, 0],
    gradeCap: [1, 1, 1],
    qty: { partner: 1500, export: 1200, bulk: 2000 },
    deliveryConv: [0.3, 0.8, 0.3],
    inv: {
      cap: T('Ikkinchi tandir', 'A second tandoor', 'Второй тандыр'),
      delivery: T('Yetkazib berish (kuryer)', 'Delivery (courier)', 'Доставка (курьер)'),
    },
    extra: {
      icon: '🧼',
      name: T(
        'Gigiyena va halol sertifikati',
        'Hygiene and halal certificate',
        'Сертификат гигиены и халяль',
      ),
      text: T(
        'Obro‘ +5, oilalar ko‘proq ishonadi; sanitariya tekshiruvidan qo‘rqmaysiz.',
        'Brand +5, families trust you more; no fear of sanitary inspections.',
        'Репутация +5, семьи доверяют больше; проверки не страшны.',
      ),
      cost: 4,
      upkeep: 0,
      apply: (p) => {
        p.rep = cl(p.rep + 5, 0, 100);
        p.flags.licensed = 1;
        p.conv[2] = r2(p.conv[2] + 0.25);
      },
    },
    mvp: {
      title: T(
        'Yangi mahsulot: qovoqli va ko‘katli somsa',
        'New product: pumpkin and herb somsa',
        'Новинка: самса с тыквой и зеленью',
      ),
      text: T(
        'Novvoyingiz yangi somsa turini taklif qilmoqda. Mijozlarga yoqadimi — hali hech kim bilmaydi.',
        'Your baker suggests a new kind of somsa. Nobody knows yet whether customers will like it.',
        'Пекарь предлагает новую самсу. Понравится ли клиентам — неизвестно.',
      ),
    },
    shock: {
      icon: '🥩',
      title: T('Go‘sht narxi oshdi', 'Meat prices rose', 'Мясо подорожало'),
      text: T(
        'Bozorda go‘sht 12% qimmatladi. Ikki oy davomida har bir porsiyaning tannarxi ikkalangizda ham oshadi.',
        'Meat became 12% more expensive. For two months every portion costs both of you more.',
        'Мясо подорожало на 12%. Два месяца себестоимость выше у обоих.',
      ),
      lesson: T(
        'Xomashyo narxi sizga bog‘liq emas, lekin narx va marja — sizning qaroringiz. Tannarx oshganda kim narxni ko‘tardi, kim marjasini qurbon qildi?',
        'You cannot control raw material prices, but price and margin are your choice.',
        'Цены на сырьё вне контроля, а цена и маржа — ваш выбор.',
      ),
    },
    reviews: {
      good: T(
        'Somsa issiq, go‘shti ko‘p — zo‘r!',
        'Hot somsa, lots of meat — great!',
        'Горячая, мяса много — отлично!',
      ),
      bad: T('Somsa yog‘li va go‘shti kam…', 'Greasy somsa, little meat…', 'Жирная, мяса мало…'),
    },
  },
  {
    id: 'gadjet',
    icon: '📱',
    kind: 'stock',
    name: T('Gadjet do‘koni', 'Gadget shop', 'Магазин гаджетов'),
    about: T(
      'Telefon aksessuarlari: quloqchin, quvvatlagich, g‘ilof. Tovar import qilinadi (dollar kursi muhim), sotilmagani eskiradi.',
      'Phone accessories: earbuds, chargers, cases. Goods are imported (the dollar matters) and unsold stock becomes outdated.',
      'Аксессуары для телефонов. Товар импортный (важен курс), непроданное устаревает.',
    ),
    unit: T('dona', 'items', 'шт.'),
    volName: T('Xarid', 'Purchase', 'Закупка'),
    price: { min: 30, max: 160, step: 1, ref: 74 },
    cost: 40,
    grades: [
      {
        name: T('Arzon', 'Budget', 'Эконом'),
        hint: T('Nom-nishonsiz nusxalar', 'No-name copies', 'Копии без бренда'),
        mult: 0.7,
        q: 25,
      },
      {
        name: T('Standart', 'Standard', 'Стандарт'),
        hint: T('Ishonchli o‘rta brend', 'A reliable mid brand', 'Надёжный средний бренд'),
        mult: 1,
        q: 55,
      },
      {
        name: T('Premium', 'Premium', 'Премиум'),
        hint: T('Original, kafolatli', 'Original, with warranty', 'Оригинал с гарантией'),
        mult: 1.3,
        q: 85,
      },
    ],
    segs: [
      {
        icon: '🎓',
        name: T('Talabalar', 'Students', 'Студенты'),
        size: 3500,
        season: [0.8, 0.9, 1, 0.9, 0.9, 0.8, 0.6, 0.9, 1.45, 1.1, 1, 1.15],
        a: 0.5,
        b: 2,
        g: 0.4,
        d: 0.7,
        out: 0.5,
        k: 5,
      },
      {
        icon: '💼',
        name: T('Ishchilar', 'Workers', 'Работающие'),
        size: 2700,
        season: [1, 1, 1, 1, 1, 0.95, 0.9, 0.95, 1, 1, 1.05, 1.1],
        a: 0.9,
        b: 1.3,
        g: 0.6,
        d: 0.8,
        out: 0.5,
        k: 7,
      },
      {
        icon: '🎁',
        name: T('Sovg‘a izlovchilar', 'Gift buyers', 'Покупатели подарков'),
        size: 1900,
        season: [0.7, 1.3, 1.7, 0.9, 0.8, 0.8, 0.8, 0.9, 1, 1, 1.1, 1.9],
        a: 1.1,
        b: 0.9,
        g: 1,
        d: 0.5,
        out: 0.6,
        k: 6,
      },
    ],
    channels: [
      T(
        'Instagram, TikTok va Telegram',
        'Instagram, TikTok and Telegram',
        'Instagram, TikTok и Telegram',
      ),
      T(
        'OLX e’lonlari va korporativ takliflar',
        'OLX ads and corporate offers',
        'OLX и корпоративные предложения',
      ),
      T(
        'Bayram aksiyalari va sovg‘a qadoqlash',
        'Holiday deals and gift wrapping',
        'Праздничные акции и упаковка',
      ),
    ],
    staffName: T('sotuvchi', 'sellers', 'продавцы'),
    perStaff: 500,
    wage: 4.5,
    staffMax: 10,
    equipName: T(
      'Vitrina, ombor va kassa',
      'Display, storeroom and till',
      'Витрины, склад и касса',
    ),
    equip: {
      new: { cost: 18, monthly: 0, cap: 2200, risk: 0 },
      used: { cost: 8, monthly: 0, cap: 1900, risk: 0.12 },
      lease: { cost: 0, monthly: 2, cap: 2200, risk: 0 },
    },
    rent: { uni: 7, bozor: 8, mahalla: 3 },
    locAff: { uni: [1, 0.3, 0.3], bozor: [0.4, 1, 0.8], mahalla: [0.3, 0.4, 0.6] },
    utilities: 1.2,
    retention: 0.18,
    waste: 0.05,
    volStep: 20,
    fx: 1.15,
    defect: [0.12, 0.04, 0.01],
    gradeCap: [1, 1, 1],
    qty: { partner: 300, export: 250, bulk: 400 },
    deliveryConv: [0.6, 0.6, 0.3],
    inv: {
      cap: T(
        'Kattaroq ombor va vitrina',
        'A bigger storeroom and display',
        'Больше склад и витрина',
      ),
      delivery: T(
        'Onlayn do‘kon va yetkazish',
        'Online shop and delivery',
        'Онлайн-магазин и доставка',
      ),
    },
    extra: {
      icon: '🛡️',
      name: T('Kafolat va servis xizmati', 'Warranty and service', 'Гарантия и сервис'),
      text: T(
        'Sifat bahosi +8, mijozlar ko‘proq qoniqadi. Oyiga 1 mln xizmat xarajati.',
        'Perceived quality +8, happier customers. 1 mln a month to run.',
        'Качество +8, клиенты довольнее. 1 млн в месяц.',
      ),
      cost: 6,
      upkeep: 1,
      apply: (p) => {
        p.qBonus = r2(p.qBonus + 8);
        p.satBonus = r2(p.satBonus + 0.04);
      },
    },
    mvp: {
      title: T(
        'Yangi xizmat: g‘iloflarga ism va rasm bosish',
        'New service: printing names on cases',
        'Новая услуга: печать на чехлах',
      ),
      text: T(
        'Kichik printer bilan g‘iloflarga ism yoki rasm bosish mumkin. Bunga talab bormi — hali noma’lum.',
        'A small printer can put names or pictures on cases. Nobody knows yet if people want it.',
        'Маленький принтер печатает имена на чехлах. Есть ли спрос — неизвестно.',
      ),
    },
    shock: {
      icon: '📲',
      title: T(
        'Yangi smartfon modeli chiqdi',
        'A new phone model is out',
        'Вышла новая модель телефона',
      ),
      text: T(
        'Mashhur brend yangi modelni chiqardi: eski modellarga mos aksessuarlarning 25% i eskirdi, lekin ikki oy davomida yangi aksessuarlarga talab 15% yuqori.',
        'A popular brand released a new model: 25% of accessories in stock became outdated, but for two months demand is 15% higher.',
        'Вышла новая модель: 25% запасов устарели, но два месяца спрос выше на 15%.',
      ),
      lesson: T(
        'Texnologiya bozorida zaxira tez eskiradi. Ko‘p zaxira — muzlagan va qadrsizlanayotgan pul.',
        'In tech retail stock ages fast. Big inventory is frozen money that loses value.',
        'В технике запасы быстро устаревают — это замороженные деньги.',
      ),
    },
    reviews: {
      good: T(
        'Quloqchin sifatli, kafolati bor!',
        'Good earbuds, with warranty!',
        'Качественные наушники, есть гарантия!',
      ),
      bad: T(
        'Quvvatlagich bir haftada buzildi…',
        'The charger broke in a week…',
        'Зарядка сломалась за неделю…',
      ),
    },
  },
  {
    id: 'markaz',
    icon: '🎓',
    kind: 'service',
    name: T('O‘quv markazi', 'Learning centre', 'Учебный центр'),
    about: T(
      'Ingliz tili, IT va abituriyent kurslari. Tovar yo‘q — o‘quvchilar oyma-oy to‘laydi; qoniqqani qoladi, qolmagani ketadi.',
      'English, IT and university-prep courses. No goods — students pay monthly; satisfied ones stay, others leave.',
      'Английский, IT и подготовка к вузу. Ученики платят помесячно; довольные остаются.',
    ),
    unit: T('o‘quvchi', 'students', 'учеников'),
    volName: T('O‘rinlar', 'Seats', 'Места'),
    price: { min: 120, max: 650, step: 10, ref: 300 },
    cost: 45,
    grades: [
      {
        name: T('Arzon', 'Budget', 'Эконом'),
        hint: T(
          'Katta guruh, eski darslik',
          'Big groups, old books',
          'Большие группы, старые книги',
        ),
        mult: 0.6,
        q: 30,
      },
      {
        name: T('Standart', 'Standard', 'Стандарт'),
        hint: T('O‘rtacha guruh, yangi darslik', 'Medium groups, new books', 'Средние группы'),
        mult: 1,
        q: 55,
      },
      {
        name: T('Premium', 'Premium', 'Премиум'),
        hint: T(
          'Kichik guruh, xalqaro materiallar',
          'Small groups, international materials',
          'Малые группы, зарубежные материалы',
        ),
        mult: 1.6,
        q: 85,
      },
    ],
    segs: [
      {
        icon: '🏫',
        name: T('Maktab o‘quvchilari', 'School pupils', 'Школьники'),
        size: 215,
        season: [1, 0.8, 0.8, 0.7, 0.6, 0.4, 0.3, 0.7, 1.8, 1.2, 1, 0.8],
        a: 1.1,
        b: 0.8,
        g: 1,
        d: 0.5,
        out: 0.6,
        k: 6,
        stay: [1, 1, 1, 1, 0.95, 0.7, 0.75, 0.95, 1, 1, 1, 1],
      },
      {
        icon: '🎯',
        name: T('Abituriyentlar', 'University applicants', 'Абитуриенты'),
        size: 120,
        season: [0.9, 1, 1.2, 1.4, 1.4, 1.1, 0.4, 0.4, 1.2, 1, 0.9, 0.9],
        a: 1.3,
        b: 0.7,
        g: 0.8,
        d: 0.4,
        out: 0.5,
        k: 6,
        stay: [1, 1, 1, 1, 1, 0.95, 0.25, 0.7, 1, 1, 1, 1],
      },
      {
        icon: '💼',
        name: T('Kattalar', 'Adults', 'Взрослые'),
        size: 100,
        season: [1.3, 1, 1, 0.9, 0.9, 0.8, 0.7, 0.8, 1.3, 1.1, 1, 0.9],
        a: 0.8,
        b: 1,
        g: 0.6,
        d: 1,
        out: 0.5,
        k: 7,
        stay: [1, 1, 1, 1, 0.95, 0.85, 0.85, 0.9, 1, 1, 1, 1],
      },
    ],
    channels: [
      T('Maktablarda ochiq darslar', 'Open lessons at schools', 'Открытые уроки в школах'),
      T(
        'Telegram va Instagram (abituriyentlar)',
        'Telegram and Instagram (applicants)',
        'Telegram и Instagram',
      ),
      T('Korxonalar bilan kelishuv', 'Deals with companies', 'Договоры с компаниями'),
    ],
    staffName: T('o‘qituvchi', 'teachers', 'преподаватели'),
    perStaff: 50,
    wage: 5,
    staffMax: 10,
    equipName: T(
      'Sinfxona jihozlari va kompyuterlar',
      'Classroom furniture and computers',
      'Мебель и компьютеры',
    ),
    equip: {
      new: { cost: 24, monthly: 0, cap: 240, risk: 0 },
      used: { cost: 11, monthly: 0, cap: 200, risk: 0.12 },
      lease: { cost: 0, monthly: 2.4, cap: 240, risk: 0 },
    },
    rent: { uni: 7, bozor: 6.5, mahalla: 3.5 },
    locAff: { uni: [0.3, 1, 0.6], bozor: [0.5, 0.5, 1], mahalla: [1, 0.5, 0.3] },
    utilities: 1.5,
    retention: 0.72,
    waste: 0,
    volStep: 0,
    fx: 1.05,
    defect: [0, 0, 0],
    gradeCap: [1.1, 1, 0.85],
    qty: { partner: 30, export: 25, bulk: 40 },
    deliveryConv: [0.2, 0.5, 0.9],
    inv: {
      cap: T('Yangi sinfxona', 'A new classroom', 'Новый класс'),
      delivery: T(
        'Onlayn darslar platformasi',
        'Online lesson platform',
        'Платформа онлайн-уроков',
      ),
    },
    extra: {
      icon: '🏅',
      name: T(
        'Xalqaro sertifikat maqomi',
        'International exam-centre status',
        'Статус международного центра',
      ),
      text: T(
        'Obro‘ +8, abituriyentlar sizga ko‘proq ishonadi.',
        'Brand +8, applicants trust you more.',
        'Репутация +8, абитуриенты доверяют больше.',
      ),
      cost: 10,
      upkeep: 0,
      apply: (p) => {
        p.rep = cl(p.rep + 8, 0, 100);
        p.conv[1] = r2(p.conv[1] + 0.4);
      },
    },
    mvp: {
      title: T(
        'Yangi kurs: bolalar uchun robototexnika',
        'New course: robotics for kids',
        'Новый курс: робототехника',
      ),
      text: T(
        'Bir o‘qituvchi bolalar uchun robototexnika kursini ochishni taklif qilmoqda. Ota-onalar qiziqadimi — noma’lum.',
        'A teacher suggests a robotics course for kids. Will parents be interested? Nobody knows.',
        'Преподаватель предлагает курс робототехники. Будет ли интерес — неизвестно.',
      ),
    },
    shock: {
      icon: '📝',
      title: T(
        'Kirish imtihonlari tizimi o‘zgardi',
        'University entrance exams changed',
        'Изменилась система вступительных',
      ),
      text: T(
        'Yangi test tizimi e’lon qilindi: uch oy davomida abituriyentlar orasida tayyorlov kurslariga talab 40% oshadi.',
        'A new testing system was announced: for three months demand for prep courses rises by 40%.',
        'Объявлена новая система тестов: три месяца спрос на подготовку выше на 40%.',
      ),
      lesson: T(
        'Tashqi o‘zgarish — imkoniyat: kimda bo‘sh o‘rin va obro‘ bo‘lsa, yangi talabni o‘sha oladi.',
        'An external change is an opportunity: whoever has free seats and a good name takes the new demand.',
        'Внешние перемены — шанс для того, у кого есть места и репутация.',
      ),
    },
    reviews: {
      good: T(
        'O‘qituvchi zo‘r, natija bor!',
        'Great teacher, real progress!',
        'Отличный преподаватель, есть результат!',
      ),
      bad: T(
        'Guruh juda katta, foydasi kam…',
        'The group is too big, not much use…',
        'Группа слишком большая…',
      ),
    },
  },
];
export const bizOf = (id: string) => BUSINESSES.find((b) => b.id === id) || BUSINESSES[0];

export const LOCATIONS: { id: LocId; icon: string; name: Tri }[] = [
  {
    id: 'uni',
    icon: '🎓',
    name: T('Universitet yonida', 'Next to the university', 'У университета'),
  },
  {
    id: 'bozor',
    icon: '🏪',
    name: T('Markaziy bozor yonida', 'By the central bazaar', 'У центрального базара'),
  },
  {
    id: 'mahalla',
    icon: '🏘️',
    name: T('Mahalla ichida', 'Inside a neighbourhood', 'Внутри махалли'),
  },
];
export const EQUIPS: { id: EquipId; icon: string; name: Tri; text: Tri }[] = [
  {
    id: 'new',
    icon: '✨',
    name: T('Yangi uskuna', 'New equipment', 'Новое оборудование'),
    text: T(
      'Qimmat, lekin ishonchli — buzilmaydi.',
      'Expensive but reliable — never breaks.',
      'Дорого, но надёжно.',
    ),
  },
  {
    id: 'used',
    icon: '🔧',
    name: T('Ishlatilgan uskuna', 'Used equipment', 'Б/у оборудование'),
    text: T(
      'Arzon, lekin ba’zan buziladi: ta’mir va to‘xtab qolish.',
      'Cheap, but sometimes breaks: repairs and downtime.',
      'Дёшево, но иногда ломается.',
    ),
  },
  {
    id: 'lease',
    icon: '📄',
    name: T('Lizing', 'Leasing', 'Лизинг'),
    text: T(
      'Oldindan pul kerak emas, lekin har oy to‘lov.',
      'Nothing upfront, but a monthly payment.',
      'Без вложений сразу, но платёж каждый месяц.',
    ),
  },
];

/* ------------------------------------------------------------------ qoidalar */
export const RULES = {
  months: 12,
  startCash: 100,
  tax: 0.04,
  socialTax: 0.12,
  rate: 0.02,
  emergencyFee: 0.1,
  debtLimit: 150,
  loanMax: 40,
  assetValue: 0.6,
  mktMax: 12,
  launchMax: 20,
  hireCost: 0.5,
  fireCost: 1,
  awDecay: 0.2,
  startSkill: 40,
  startRep: 35,
};

/* ------------------------------------------------------------------ holat */
export type Setup = { loc: LocId; equip: EquipId; staff: number; launch: number; bot?: boolean };
export type Decision = {
  price: number;
  /** 0 — arzon, 1 — standart, 2 — premium */
  grade: number;
  /** ishlab chiqarish yoki xarid (xizmatda e'tiborga olinmaydi) */
  volume: number;
  /** uch kanal bo'yicha reklama (mln): har bir kanal o'z mijoz guruhiga yetib boradi */
  mkt: Three<number>;
  /** jamoa soni (yollash yoki bo'shatish) */
  staff: number;
  buy: InvId[];
  loan: number;
  repay: number;
  choice: number;
  /** o'yinchi chiqib ketgan — qarorni bot qilgan */
  bot?: boolean;
};
export type Last = {
  price: number;
  grade: number;
  mkt: Three<number>;
  volume: number;
  served: number;
  demand: number;
  segServed: Three<number>;
  sat: number;
  share: number;
  capFull: boolean;
  short: boolean;
};
export type Stats = {
  revenue: number;
  profit: number;
  lost: number;
  lostMoney: number;
  waste: number;
  wasteMoney: number;
  mkt: number;
  mktSeg: Three<number>;
  interest: number;
  emergency: number;
  fines: number;
  invest: number;
  hires: number;
  fires: number;
  capFull: number;
  lowCash: number;
  satSum: number;
  priceSum: number;
  gradeSum: number;
  marginSum: number;
  maxShare: number;
  profitMonths: number;
  debtMonths: number;
  segServed: Three<number>;
  volume: number;
  sold: number;
  goodPlan: number;
  overload: number;
  idleCash: number;
};
export type Player = {
  loc: LocId;
  equip: EquipId;
  cash: number;
  debt: number;
  /** investor ulushi (0..1) */
  equity: number;
  invested: number;
  staff: number;
  skill: number;
  rep: number;
  aw: Three<number>;
  awFloor: Three<number>;
  reg: Three<number>;
  stock: number;
  stockCost: number;
  recv: number;
  equipCap: number;
  equipRisk: number;
  assets: number;
  lease: number;
  upkeep: number;
  rent: number;
  prepaid: number;
  branches: number;
  conv: Three<number>;
  retBonus: number;
  qBonus: number;
  satBonus: number;
  wageMult: number;
  owned: Partial<Record<InvId, number>>;
  flags: Record<string, number>;
  bankrupt: boolean;
  last: Last;
  stats: Stats;
};
export type Line = { key: string; v: number };
export type SegResult = { n: number; demand: number; served: number; aw: number; reg: number };
export type PlayerMonth = {
  price: number;
  grade: number;
  volume: number;
  demand: number;
  served: number;
  spill: number;
  lost: number;
  b2b: number;
  bulk: number;
  waste: number;
  capacity: number;
  staff: number;
  quality: number;
  sat: number;
  rep: number;
  skill: number;
  segs: Three<SegResult>;
  revenue: number;
  profit: number;
  cash: number;
  debt: number;
  worth: number;
  money: number;
  share: number;
  mkt: Three<number>;
  bought: InvId[];
  hired: number;
  fired: number;
  emergency: number;
  choice: number;
  breakEven: number;
  lines: Line[];
  flow: Line[];
  notes: Tri[];
  reviews: Tri[];
  outcome?: Tri;
};
export type MonthRecord = {
  m: number;
  event: string;
  segN: Three<number>;
  players: [PlayerMonth, PlayerMonth];
};
export type SetupRecord = Setup & {
  equipCost: number;
  deposit: number;
  hiring: number;
  cash: number;
};
type Mod = { from: number; until: number; seg: Three<number>; cost: number; sens: number };
export type Game = {
  biz: BizId;
  seed: number;
  /** 0 — biznes-reja; 1..12 — oylar; 13 — o'yin tugagan */
  month: number;
  events: string[];
  players: [Player, Player];
  setup: [SetupRecord, SetupRecord] | null;
  mods: Mod[];
  history: MonthRecord[];
  over: boolean;
  /** 0 yoki 1 — g'olib, 2 — durang, -1 — hali yo'q */
  winner: number;
  /** oy boshidagi umumiy vaziyat: kassa (vaziyatdan oldin), foyda-zararga ta'siri va izohlar */
  pre: { cash: [number, number]; pnl: [number, number]; notes: [Tri[], Tri[]] };
};

/* ------------------------------------------------------------------ investitsiyalar */
type InvMech = {
  icon: string;
  from: number;
  max: number;
  repeat?: boolean;
  /** mulk sifatida qoladimi (60% qiymat bilan) yoki xarajatmi */
  asset: boolean;
  cost: (b: Biz, p: Player) => number;
  upkeep: (b: Biz) => number;
  apply: (p: Player, b: Biz, m: number) => void;
  name: (b: Biz) => Tri;
  text: (b: Biz) => Tri;
};
export const INV_ORDER: InvId[] = [
  'cap',
  'training',
  'delivery',
  'pos',
  'crm',
  'design',
  'extra',
  'branch',
  'research',
];
export const INVEST: Record<InvId, InvMech> = {
  cap: {
    icon: '⚙️',
    from: 1,
    max: 2,
    asset: true,
    cost: (b) => r2(b.equip.new.cost * 0.8),
    upkeep: () => 0,
    apply: (p, b) => {
      p.equipCap += Math.round(b.equip.new.cap * 0.6);
    },
    name: (b) => b.inv.cap,
    text: (b) =>
      T(
        `Uskuna sig‘imi +${Math.round(b.equip.new.cap * 0.6).toLocaleString('ru-RU')} ${b.unit[0]}. Yangi xodimlar ham kerak bo‘ladi.`,
        `Equipment capacity +${Math.round(b.equip.new.cap * 0.6).toLocaleString('en-US')} ${b.unit[1]}. You will need more staff too.`,
        `Мощность +${Math.round(b.equip.new.cap * 0.6).toLocaleString('ru-RU')} ${b.unit[2]}. Понадобятся и сотрудники.`,
      ),
  },
  training: {
    icon: '📚',
    from: 1,
    max: 99,
    repeat: true,
    asset: false,
    cost: (b, p) => r2(1.2 * p.staff),
    upkeep: () => 0,
    apply: (p) => {
      p.skill = cl(p.skill + 12, 0, 90);
    },
    name: () => T('Jamoa treningi', 'Team training', 'Обучение команды'),
    text: () =>
      T(
        'Mahorat +12 → sifat oshadi. Narxi jamoa soniga bog‘liq. Har oy qilish mumkin.',
        'Skill +12 → higher quality. Price depends on team size. Can be repeated monthly.',
        'Мастерство +12 → выше качество. Можно каждый месяц.',
      ),
  },
  delivery: {
    icon: '🛵',
    from: 1,
    max: 1,
    asset: true,
    cost: () => 7,
    upkeep: () => 2,
    apply: (p, b) => {
      p.conv = three((s) => r2(p.conv[s] + b.deliveryConv[s]));
    },
    name: (b) => b.inv.delivery,
    text: (b) => {
      const s = b.deliveryConv.indexOf(Math.max(...b.deliveryConv));
      return T(
        `Qulaylik oshadi, ayniqsa «${b.segs[s].name[0]}» uchun. Oyiga 2 mln xarajat.`,
        `More convenient, especially for “${b.segs[s].name[1]}”. 2 mln a month to run.`,
        `Удобнее, особенно для «${b.segs[s].name[2]}». 2 млн в месяц.`,
      );
    },
  },
  pos: {
    icon: '💳',
    from: 1,
    max: 1,
    asset: true,
    cost: () => 3,
    upkeep: () => 0.2,
    apply: (p) => {
      p.conv = three((s) => r2(p.conv[s] + 0.2));
      p.flags.control = 1;
    },
    name: () =>
      T('Kartadan to‘lov va kassa apparati', 'Card payments and a till', 'Оплата картой и касса'),
    text: () =>
      T(
        'Hamma mijozlar uchun qulayroq, kassa nazorat ostida bo‘ladi.',
        'Easier for every customer and the cash is under control.',
        'Удобнее всем клиентам, касса под контролем.',
      ),
  },
  crm: {
    icon: '⭐',
    from: 1,
    max: 1,
    asset: false,
    cost: () => 5,
    upkeep: () => 0.5,
    apply: (p, b) => {
      p.retBonus = r2(p.retBonus + (b.kind === 'service' ? 0.06 : 0.1));
    },
    name: () =>
      T(
        'Mijozlar bazasi (CRM) va sodiqlik kartasi',
        'Customer database (CRM) and loyalty card',
        'CRM и карта лояльности',
      ),
    text: () =>
      T(
        'Qoniqqan mijozlarning ko‘proq qismi qaytib keladi. Oyiga 0,5 mln.',
        'More satisfied customers come back. 0.5 mln a month.',
        'Больше довольных клиентов возвращаются. 0,5 млн в месяц.',
      ),
  },
  design: {
    icon: '🎨',
    from: 1,
    max: 1,
    asset: true,
    cost: () => 12,
    upkeep: () => 0,
    apply: (p) => {
      p.rep = cl(p.rep + 8, 0, 100);
      p.conv = [r2(p.conv[0] + 0.1), r2(p.conv[1] + 0.1), r2(p.conv[2] + 0.25)];
    },
    name: () => T('Ta’mir va interyer', 'Renovation and interior', 'Ремонт и интерьер'),
    text: () =>
      T(
        'Obro‘ +8, joy chiroyli — talabchan mijozlar ko‘proq keladi.',
        'Brand +8 and a nicer place — demanding customers come more.',
        'Репутация +8, требовательные клиенты приходят чаще.',
      ),
  },
  extra: {
    icon: '🏅',
    from: 1,
    max: 1,
    asset: false,
    cost: (b) => b.extra.cost,
    upkeep: (b) => b.extra.upkeep,
    apply: (p, b) => b.extra.apply(p),
    name: (b) => b.extra.name,
    text: (b) => b.extra.text,
  },
  branch: {
    icon: '🏬',
    from: 4,
    max: 1,
    asset: true,
    cost: (b) => r2(b.equip.new.cost + 8),
    upkeep: () => 0,
    apply: (p, b) => {
      p.equipCap += b.equip.new.cap;
      p.rent = r2(p.rent + b.rent[p.loc] * 0.8);
      p.awFloor = three((s) => r4(cl(p.awFloor[s] + 0.1, 0, 0.6)));
      p.conv = three((s) => r2(p.conv[s] + 0.15));
      p.branches++;
    },
    name: () => T('Ikkinchi filial', 'A second branch', 'Второй филиал'),
    text: () =>
      T(
        'Uskuna sig‘imi ikki baravar, sizni ko‘proq odam biladi. Qo‘shimcha ijara va yangi xodimlar kerak. 4-oydan.',
        'Double capacity and more people know you. Extra rent and new staff are needed. From month 4.',
        'Мощность вдвое, вас знают больше. Нужны аренда и сотрудники. С 4-го месяца.',
      ),
  },
  research: {
    icon: '🔍',
    from: 1,
    max: 99,
    repeat: true,
    asset: false,
    cost: () => 1.5,
    upkeep: () => 0,
    apply: (p, b, m) => {
      p.flags.research = m;
    },
    name: () => T('Bozor tadqiqoti', 'Market research', 'Исследование рынка'),
    text: () =>
      T(
        'Shu va keyingi oy talab prognozi aniqroq (±4%), raqibning qarorlari ko‘rinadi.',
        'This and next month your demand forecast is sharper (±4%) and you see your rival’s decisions.',
        'Прогноз точнее (±4%), видны решения соперника.',
      ),
  },
};
export function canBuy(g: Game, p: Player, id: InvId, m = g.month) {
  const inv = INVEST[id];
  if (!inv || m < inv.from) return false;
  if (inv.repeat) return true;
  return (p.owned[id] || 0) < inv.max;
}

/* ------------------------------------------------------------------ vaziyatlar */
type Ext = { bulk: number; capCut: number; penalty: number };
export type EvCtx = {
  g: Game;
  i: number;
  p: Player;
  rival: Player;
  biz: Biz;
  m: number;
  rnd: () => number;
  ext: Ext;
};
type Option = { label: Tri; hint: Tri; apply: (c: EvCtx) => Tri | void };
export type BotId = 0 | 1 | 2 | 3;
export type GameEvent = {
  id: string;
  icon: (b: Biz) => string;
  /** kursning qaysi mavzusiga tegishli (1..15) */
  topic: number;
  title: (b: Biz) => Tri;
  text: (b: Biz) => Tri;
  lesson: (b: Biz) => Tri;
  global?: (c: EvCtx) => void;
  options?: Option[];
  ai?: (c: EvCtx, bot: BotId) => number;
  after?: string;
  from?: number;
};
const weakestSeg = (c: EvCtx) => {
  const own = c.p.last.segServed;
  let best = 0,
    low = Infinity;
  for (let s = 0; s < 3; s++) {
    const total = own[s] + c.rival.last.segServed[s];
    const v = total > 0 ? own[s] / total : c.p.aw[s];
    if (v < low) {
      low = v;
      best = s;
    }
  }
  return best;
};
/** reklamaga eng sezgir (eng arzon yetib boriladigan) mijoz guruhi */
const socialSeg = (b: Biz) => {
  if (b.id === 'markaz') return 1;
  let s = 0;
  for (let k = 1; k < 3; k++) if (b.segs[k].k < b.segs[s].k) s = k;
  return s;
};
const fine = (p: Player, x: number) => {
  p.cash = r2(p.cash - x);
  p.stats.fines = r2(p.stats.fines + x);
};
const mvpHit = (g: Game) => rng(mix(g.seed, 404))() < 0.6;
const NONE: Option = {
  label: T('Hozircha yo‘q', 'Not now', 'Пока нет'),
  hint: T('Hech narsa o‘zgarmaydi', 'Nothing changes', 'Ничего не меняется'),
  apply: () => {},
};

export const EVENTS: GameEvent[] = [
  {
    id: 'survey',
    icon: () => '📋',
    topic: 2,
    title: () => T('Mijozlar nimani xohlaydi?', 'What do customers want?', 'Чего хотят клиенты?'),
    text: () =>
      T(
        'Marketing agentligi 2 mln so‘mga mijozlaringiz orasida so‘rovnoma o‘tkazishni taklif qilmoqda: nimadan norozi, nimani xohlaydi, qaysi guruh sizni tanlamayapti.',
        'An agency offers to survey your customers for 2 mln: what they dislike, what they want and which group ignores you.',
        'Агентство за 2 млн опросит клиентов: что не нравится, чего хотят, какая группа вас не выбирает.',
      ),
    lesson: () =>
      T(
        'Yaxshi biznes mijoz muammosidan boshlanadi. So‘rash arzon, taxmin qilish qimmat: so‘rovnoma qaysi guruhda bo‘sh joy borligini ko‘rsatadi.',
        'Good business starts from customer problems. Asking is cheap, guessing is expensive.',
        'Хороший бизнес начинается с проблем клиента. Спросить дёшево, гадать дорого.',
      ),
    options: [
      {
        label: T('So‘rovnoma o‘tkazish', 'Run the survey', 'Провести опрос'),
        hint: T(
          '2 mln · eng zaif guruhingiz uchun taklif yaxshilanadi',
          '2 mln · your offer improves for your weakest group',
          '2 млн · улучшение для слабой группы',
        ),
        apply: (c) => {
          c.p.cash = r2(c.p.cash - 2);
          const s = weakestSeg(c);
          c.p.conv[s] = r2(c.p.conv[s] + 0.35);
          c.p.satBonus = r2(c.p.satBonus + 0.03);
          const n = c.biz.segs[s].name;
          return T(
            `So‘rovnoma: «${n[0]}» sizdan boshqacha narsa kutayotgan ekan — taklifingiz ular uchun moslashtirildi.`,
            `Survey: “${n[1]}” expected something different — your offer was adapted for them.`,
            `Опрос: «${n[2]}» ждали другого — предложение адаптировано.`,
          );
        },
      },
      {
        label: T('Kerak emas', 'No need', 'Не нужно'),
        hint: T('Pul tejaladi', 'Saves money', 'Экономия'),
        apply: () => {},
      },
    ],
    ai: (c, bot) => (bot === 0 ? 1 : c.p.cash > 12 ? 0 : 1),
  },
  {
    id: 'mvp',
    icon: () => '🧪',
    topic: 3,
    title: (b) => b.mvp.title,
    text: (b) =>
      T(
        b.mvp.text[0] + ' Kichik sinov 3 mln turadi, darhol keng ishga tushirish — 12 mln.',
        b.mvp.text[1] + ' A small test costs 3 mln, a full launch right away — 12 mln.',
        b.mvp.text[2] + ' Небольшой тест — 3 млн, сразу запуск — 12 млн.',
      ),
    lesson: () =>
      T(
        'Yangi g‘oyani avval kichik va arzon sinab ko‘rish (MVP) xatoning narxini kamaytiradi: yoqmasa — oz yo‘qotasiz, yoqsa — keyin kengaytirasiz.',
        'Testing an idea small and cheap first (an MVP) lowers the cost of being wrong.',
        'Сначала дешёвый тест (MVP) — так ошибка стоит меньше.',
      ),
    options: [
      {
        label: T('Kichik sinov (MVP)', 'Small test (MVP)', 'Небольшой тест (MVP)'),
        hint: T(
          '3 mln · yoqsa, keyin kengaytiriladi',
          '3 mln · if it works, roll it out',
          '3 млн · если зайдёт — расширим',
        ),
        apply: (c) => {
          c.p.cash = r2(c.p.cash - 3);
          if (mvpHit(c.g)) {
            c.p.conv = three((s) => r2(c.p.conv[s] + 0.17));
            return T(
              'Sinov muvaffaqiyatli: mijozlarga yoqdi, mahsulot menyuga qo‘shildi.',
              'The test worked: customers liked it and it joined the range.',
              'Тест удался: клиентам понравилось.',
            );
          }
          return T(
            'Sinov ko‘rsatdiki, mijozlarga yoqmadi — atigi 3 mln yo‘qotdingiz.',
            'The test showed customers did not like it — you lost only 3 mln.',
            'Тест показал, что не понравилось — потеряно лишь 3 млн.',
          );
        },
      },
      {
        label: T('Darhol keng ishga tushirish', 'Launch fully right away', 'Сразу запустить'),
        hint: T(
          '12 mln · yoqsa — tezroq foyda, yoqmasa — katta zarar',
          '12 mln · faster gain or a big loss',
          '12 млн · быстрее выгода или большой убыток',
        ),
        apply: (c) => {
          c.p.cash = r2(c.p.cash - 12);
          if (mvpHit(c.g)) {
            c.p.conv = three((s) => r2(c.p.conv[s] + 0.2));
            c.p.rep = cl(c.p.rep + 4, 0, 100);
            return T(
              'Omadingiz keldi: yangi mahsulot mashhur bo‘ldi.',
              'Lucky: the new product became popular.',
              'Повезло: новинка стала популярной.',
            );
          }
          c.p.rep = cl(c.p.rep - 6, 0, 100);
          return T(
            'Yangi mahsulot yoqmadi: 12 mln va obro‘ning bir qismi ketdi.',
            'Customers did not like it: 12 mln and some of your reputation are gone.',
            'Новинка провалилась: 12 млн и часть репутации потеряны.',
          );
        },
      },
      NONE,
    ],
    ai: (c, bot) => (bot === 0 ? 2 : bot === 1 && c.p.cash > 40 ? 1 : c.p.cash > 15 ? 0 : 2),
  },
  {
    id: 'license',
    icon: () => '📑',
    topic: 4,
    title: () =>
      T('Ruxsatnoma va sertifikatlar', 'Permits and certificates', 'Разрешения и сертификаты'),
    text: () =>
      T(
        'Yong‘in xavfsizligi va sanitariya hujjatlarini rasmiylashtirish 4 mln turadi. Ko‘pchilik «keyin qilaman» deydi.',
        'Fire-safety and sanitary papers cost 4 mln. Many people say “later”.',
        'Пожарные и санитарные документы стоят 4 млн. Многие откладывают.',
      ),
    lesson: () =>
      T(
        'Qonuniy rasmiylashtirish — xarajat emas, sug‘urta: tekshiruv kelganda hujjatsiz biznes jarima to‘laydi va vaqtincha yopiladi.',
        'Proper permits are insurance, not a cost: without them an inspection brings fines and closure.',
        'Документы — это страховка: без них проверка означает штраф и закрытие.',
      ),
    options: [
      {
        label: T('Rasmiylashtirish', 'Get the papers', 'Оформить'),
        hint: T('4 mln', '4 mln', '4 млн'),
        apply: (c) => {
          c.p.cash = r2(c.p.cash - 4);
          c.p.flags.licensed = 1;
        },
      },
      {
        label: T('Keyinroq', 'Later', 'Позже'),
        hint: T(
          'Pul tejaladi, xavf qoladi',
          'Saves money, the risk stays',
          'Экономия, риск остаётся',
        ),
        apply: () => {},
      },
    ],
    ai: (c, bot) => (bot === 1 && c.p.cash < 30 ? 1 : 0),
  },
  {
    id: 'inspect',
    icon: () => '🚒',
    topic: 4,
    after: 'license',
    title: () =>
      T(
        'Sanitariya va yong‘in tekshiruvi',
        'Sanitary and fire inspection',
        'Санитарная и пожарная проверка',
      ),
    text: () =>
      T(
        'Tekshiruvchilar ikkala korxonaga ham kelishdi. Hujjati yo‘q joy jarima to‘laydi va bir necha kunga yopiladi.',
        'Inspectors visited both businesses. Those without papers pay a fine and close for a few days.',
        'Проверяющие пришли к обоим. Без документов — штраф и закрытие на несколько дней.',
      ),
    lesson: () =>
      T(
        'Hujjatlari tayyor korxona tekshiruvdan xotirjam o‘tdi. 4 mln tejash 10 mln jarima va mijozlarni yo‘qotishga aylandi.',
        'The business with papers passed calmly. Saving 4 mln turned into a 10 mln fine and lost customers.',
        'С документами проверка прошла спокойно; экономия обернулась штрафом.',
      ),
    global: (c) => {
      c.g.players.forEach((p, i) => {
        if (p.flags.licensed) {
          c.g.pre.notes[i].push(
            T(
              'Hujjatlaringiz joyida — tekshiruv muammosiz o‘tdi.',
              'Your papers were in order — no problems.',
              'Документы в порядке — проблем нет.',
            ),
          );
          return;
        }
        fine(p, 10);
        p.rep = cl(p.rep - 8, 0, 100);
        p.flags.closed = c.m;
        c.g.pre.notes[i].push(
          T(
            'Hujjat yo‘q: 10 mln jarima, obro‘ −8 va shu oy uch kunga yopildingiz (sig‘im −30%).',
            'No papers: a 10 mln fine, brand −8 and closed for three days this month (capacity −30%).',
            'Нет документов: штраф 10 млн, репутация −8, закрытие на 3 дня (−30% мощности).',
          ),
        );
      });
    },
  },
  {
    id: 'payroll',
    icon: () => '🧾',
    topic: 5,
    title: () =>
      T('Ish haqini qanday to‘laysiz?', 'How do you pay wages?', 'Как платить зарплату?'),
    text: () =>
      T(
        'Rasmiy ish haqiga 12% ijtimoiy soliq qo‘shiladi. Ba’zilar «konvertda» to‘lab tejaydi — lekin bu qonunbuzarlik.',
        'Official wages carry a 12% social tax. Some pay “in envelopes” to save — but that is illegal.',
        'С официальной зарплаты 12% соцналога. Некоторые платят «в конверте» — это незаконно.',
      ),
    lesson: () =>
      T(
        'Norasmiy ish haqi — vaqtinchalik tejash va katta xavf: soliq tekshiruvi jarima soladi, xodimlar esa himoyasiz qoladi. Rasmiy biznes grant va kreditga ham osonroq erishadi.',
        'Envelope wages are a short-term saving and a big risk; official businesses also get grants and loans more easily.',
        'Серые зарплаты — временная экономия и большой риск; «белому» бизнесу проще с грантами.',
      ),
    options: [
      {
        label: T('Rasmiy', 'Officially', 'Официально'),
        hint: T('Ish haqi xarajati +12%', 'Wage costs +12%', 'Расходы на зарплату +12%'),
        apply: (c) => {
          c.p.flags.official = 1;
        },
      },
      {
        label: T('Konvertda (norasmiy)', 'In envelopes (unofficial)', 'В конверте'),
        hint: T(
          'Tejaladi, lekin tekshiruv xavfi',
          'Saves money, risk of inspection',
          'Экономия, риск проверки',
        ),
        apply: (c) => {
          c.p.flags.grey = 1;
        },
      },
    ],
    ai: (c, bot) => (bot === 1 ? 1 : 0),
  },
  {
    id: 'taxcheck',
    icon: () => '🔍',
    topic: 5,
    after: 'payroll',
    title: () => T('Soliq tekshiruvi', 'Tax inspection', 'Налоговая проверка'),
    text: () =>
      T(
        'Soliq inspektori xodimlar ro‘yxati va to‘lovlarni tekshirdi.',
        'A tax inspector checked staff lists and payments.',
        'Налоговый инспектор проверил сотрудников и выплаты.',
      ),
    lesson: () =>
      T(
        'Rasmiy ishlagan korxona tekshiruvdan xotirjam o‘tdi; norasmiy ish haqi tejagan pulidan ko‘p jarima keltirdi.',
        'The official business passed calmly; envelope wages brought a fine bigger than the savings.',
        'Официальный бизнес прошёл спокойно; серые зарплаты принесли штраф больше экономии.',
      ),
    global: (c) => {
      c.g.players.forEach((p, i) => {
        if (!p.flags.grey) {
          c.g.pre.notes[i].push(
            T(
              'Hammasi rasmiy — tekshiruv muammosiz o‘tdi.',
              'Everything is official — no problems.',
              'Всё официально — без проблем.',
            ),
          );
          return;
        }
        if (rng(mix(c.g.seed, c.m, 77, i))() < 0.75) {
          fine(p, 15);
          p.rep = cl(p.rep - 6, 0, 100);
          p.flags.grey = 0;
          p.flags.official = 1;
          c.g.pre.notes[i].push(
            T(
              'Norasmiy ish haqi aniqlandi: 15 mln jarima, obro‘ −6 va endi rasmiy to‘laysiz.',
              'Envelope wages found: a 15 mln fine, brand −6, and now you pay officially.',
              'Серые зарплаты выявлены: штраф 15 млн, репутация −6.',
            ),
          );
        } else
          c.g.pre.notes[i].push(
            T(
              'Bu safar omadingiz keldi — lekin xavf saqlanib qoldi.',
              'Lucky this time — but the risk remains.',
              'В этот раз повезло — риск остался.',
            ),
          );
      });
    },
  },
  {
    id: 'partner',
    icon: () => '🤝',
    topic: 6,
    from: 3,
    title: () => T('Ulgurji hamkorlik taklifi', 'A wholesale partnership', 'Оптовое партнёрство'),
    text: (b) =>
      T(
        `Yirik tarmoq har oy ${b.qty.partner.toLocaleString('ru-RU')} ${b.unit[0]} ulgurji olmoqchi — narxingizdan 25% arzonroqqa. Bo‘sh sig‘imingiz bo‘lsa — qo‘shimcha savdo.`,
        `A big chain wants ${b.qty.partner.toLocaleString('en-US')} ${b.unit[1]} a month wholesale at 25% below your price.`,
        `Сеть хочет ${b.qty.partner.toLocaleString('ru-RU')} ${b.unit[2]} в месяц оптом на 25% дешевле.`,
      ),
    lesson: () =>
      T(
        'Biznes-model faqat mahsulot emas, balki uni kimga va qanday sotishingiz ham. Ulgurji kanal — kam marja, lekin katta va barqaror hajm.',
        'A business model is also how and to whom you sell. Wholesale means a thin margin but steady volume.',
        'Бизнес-модель — это и каналы продаж. Опт — малая маржа, но стабильный объём.',
      ),
    options: [
      {
        label: T('Shartnoma tuzish', 'Sign the contract', 'Подписать'),
        hint: T(
          'Har oy qo‘shimcha savdo (bo‘sh sig‘im hisobidan)',
          'Extra sales monthly (from spare capacity)',
          'Доп. продажи из свободной мощности',
        ),
        apply: (c) => {
          c.p.flags.partner = 1;
        },
      },
      {
        label: T('Rad etish', 'Decline', 'Отказаться'),
        hint: T('Faqat chakana savdo', 'Retail only', 'Только розница'),
        apply: () => {},
      },
    ],
    ai: (c, bot) => (bot === 2 ? 1 : 0),
  },
  {
    id: 'blogger',
    icon: () => '🤳',
    topic: 8,
    title: () =>
      T(
        'Mashhur bloger reklama taklif qilmoqda',
        'A popular blogger offers an ad',
        'Популярный блогер предлагает рекламу',
      ),
    text: (b) =>
      T(
        `Shahardagi mashhur bloger 7 mln so‘mga sizni reklama qiladi — uning obunachilari asosan «${b.segs[socialSeg(b)].name[0]}». Lekin blogerning obro‘si ham doim toza emas.`,
        `A well-known local blogger will promote you for 7 mln — mostly reaching “${b.segs[socialSeg(b)].name[1]}”. Bloggers are not always scandal-free.`,
        `Блогер прорекламирует за 7 млн — в основном «${b.segs[socialSeg(b)].name[2]}». Но скандалы бывают.`,
      ),
    lesson: () =>
      T(
        'Reklama kanali auditoriyangizga mos bo‘lishi kerak. Bloger tez natija beradi, lekin uning obro‘si sizning obro‘ingizga ham ta’sir qiladi.',
        'A channel must match your audience. A blogger is fast, but their reputation becomes part of yours.',
        'Канал должен совпадать с аудиторией. Репутация блогера становится вашей.',
      ),
    options: [
      {
        label: T('Reklama berish', 'Run the ad', 'Заказать рекламу'),
        hint: T(
          '7 mln · ko‘p odam sizni biladi',
          '7 mln · many more people know you',
          '7 млн · вас узнают многие',
        ),
        apply: (c) => {
          c.p.cash = r2(c.p.cash - 7);
          c.p.stats.mkt = r2(c.p.stats.mkt + 7);
          const s = socialSeg(c.biz);
          c.p.aw = three((k) =>
            r4(cl(c.p.aw[k] + (1 - c.p.aw[k]) * (k === s ? 0.35 : 0.1), 0, 0.95)),
          );
          if (rng(mix(c.g.seed, c.m, 61, c.i))() < 0.25) {
            c.p.rep = cl(c.p.rep - 8, 0, 100);
            return T(
              'Reklamadan keyin bloger janjalga qoldi — sizni ko‘p odam bildi, lekin obro‘ −8.',
              'The blogger got into a scandal — many know you now, but brand −8.',
              'Блогер попал в скандал — вас знают, но репутация −8.',
            );
          }
          return T(
            'Reklama yaxshi chiqdi: sizni ko‘p odam bildi.',
            'The ad went well: many people know you now.',
            'Реклама удалась.',
          );
        },
      },
      {
        label: T('Rad etish', 'Decline', 'Отказаться'),
        hint: T('Pul tejaladi', 'Saves money', 'Экономия'),
        apply: () => {},
      },
    ],
    ai: (c, bot) =>
      bot === 1 && c.p.cash > 25 ? 0 : bot === 3 && c.p.cash > 40 && c.m <= 8 ? 0 : 1,
  },
  {
    id: 'pitch',
    icon: () => '🎤',
    topic: 9,
    from: 4,
    title: () =>
      T(
        'Yoshlar biznes tanlovi',
        'Young entrepreneurs’ contest',
        'Конкурс молодых предпринимателей',
      ),
    text: () =>
      T(
        'Viloyat tanlovida g‘olib 25 mln so‘m grant oladi. Taqdimot tayyorlash 3 mln va vaqt talab qiladi. Hakamlar obro‘ va natijaga qaraydi.',
        'The regional contest winner gets a 25 mln grant. Preparing a pitch costs 3 mln. Judges look at reputation and results.',
        'Победитель конкурса получает грант 25 млн. Подготовка — 3 млн.',
      ),
    lesson: () =>
      T(
        'G‘oyani ishonarli taqdim eta olish — alohida ko‘nikma. Hakamlar yaxshi obro‘ va real natijani ko‘rishni xohlaydi.',
        'Pitching is a skill; judges want a good name and real results.',
        'Презентация — отдельный навык; жюри смотрит на репутацию и результаты.',
      ),
    options: [
      {
        label: T('Taqdimot tayyorlash', 'Prepare a pitch', 'Подготовить'),
        hint: T(
          '3 mln · g‘alaba ehtimoli obro‘ga bog‘liq',
          '3 mln · chances depend on your reputation',
          '3 млн · шанс зависит от репутации',
        ),
        apply: (c) => {
          c.p.cash = r2(c.p.cash - 3);
          const chance = cl(0.15 + c.p.rep / 200 + (c.p.stats.profit > 0 ? 0.1 : 0), 0.1, 0.75);
          if (rng(mix(c.g.seed, c.m, 83, c.i))() < chance) {
            c.p.cash = r2(c.p.cash + 25);
            c.p.rep = cl(c.p.rep + 5, 0, 100);
            return T(
              'Tabriklaymiz! Tanlovda g‘olib bo‘ldingiz: +25 mln grant, obro‘ +5.',
              'Congratulations! You won: +25 mln grant, brand +5.',
              'Победа! Грант 25 млн, репутация +5.',
            );
          }
          return T(
            'Bu safar yutolmadingiz, lekin hakamlar fikri foydali bo‘ldi.',
            'You did not win this time, but the feedback was useful.',
            'В этот раз не победили, но отзыв жюри полезен.',
          );
        },
      },
      {
        label: T('Qatnashmaslik', 'Skip it', 'Не участвовать'),
        hint: T('Hech narsa o‘zgarmaydi', 'Nothing changes', 'Ничего не меняется'),
        apply: () => {},
      },
    ],
    ai: (c, bot) => (bot === 0 ? 1 : c.p.rep > 45 ? 0 : 1),
  },
  {
    id: 'bulk',
    icon: () => '📦',
    topic: 10,
    title: () => T('Katta bir martalik buyurtma', 'A big one-off order', 'Крупный разовый заказ'),
    text: (b) =>
      T(
        `Tashkilot shu oy ${b.qty.bulk.toLocaleString('ru-RU')} ${b.unit[0]} buyurtma bermoqchi — narxingizdan 15% chegirma bilan. Yetkazolmasangiz — 5 mln jarima va obro‘ −6.`,
        `An organisation wants ${b.qty.bulk.toLocaleString('en-US')} ${b.unit[1]} this month at 15% off. Fail to deliver: 5 mln penalty and brand −6.`,
        `Организация хочет ${b.qty.bulk.toLocaleString('ru-RU')} ${b.unit[2]} со скидкой 15%. Не выполните — штраф 5 млн.`,
      ),
    lesson: () =>
      T(
        'Katta buyurtma — tayyor savdo, lekin va’da berishdan oldin sig‘im, xomashyo va jamoangizni hisoblang. Bajarilmagan va’da mijozni ham, obro‘ni ham yo‘qotadi.',
        'A big order is a ready sale, but check capacity, stock and team before promising.',
        'Крупный заказ — готовая продажа, но проверьте мощность и запасы.',
      ),
    options: [
      {
        label: T('Qabul qilish', 'Accept', 'Принять'),
        hint: T(
          'Shu oy hajm va sig‘im yetishi kerak',
          'You need the volume and capacity this month',
          'Нужны объём и мощность',
        ),
        apply: (c) => {
          c.ext.bulk = c.biz.qty.bulk;
        },
      },
      {
        label: T('Rad etish', 'Decline', 'Отказаться'),
        hint: T('Odatdagi savdo', 'Business as usual', 'Обычная торговля'),
        apply: () => {},
      },
    ],
    ai: (c, bot) =>
      bot === 0 ? 1 : capacity(c.biz, c.p) > c.p.last.served + c.biz.qty.bulk * 1.1 ? 0 : 1,
  },
  {
    id: 'review',
    icon: () => '💬',
    topic: 10,
    title: () =>
      T(
        'Telegram’da salbiy sharh tarqaldi',
        'A bad review is spreading on Telegram',
        'В Telegram разошёлся плохой отзыв',
      ),
    text: () =>
      T(
        'Norozi mijoz sizning xizmatingiz haqida qattiq sharh yozdi va u guruhlarda tarqalmoqda. Qanday javob berasiz?',
        'An unhappy customer wrote a harsh review and it is spreading in group chats. How do you respond?',
        'Недовольный клиент написал резкий отзыв. Как ответите?',
      ),
    lesson: () =>
      T(
        'Shikoyatga ochiq va tez javob berish obro‘ni tiklaydi; e’tiborsizlik — sekin, o‘chirishga urinish esa tez obro‘ yo‘qotishdir.',
        'A quick, open answer to a complaint rebuilds trust; ignoring it is slow damage, trying to delete it is fast damage.',
        'Открытый ответ восстанавливает доверие; игнор — медленный вред, удаление — быстрый.',
      ),
    options: [
      {
        label: T(
          'Ochiq javob va kompensatsiya',
          'Answer openly and compensate',
          'Ответить и компенсировать',
        ),
        hint: T('1 mln · obro‘ +4', '1 mln · brand +4', '1 млн · репутация +4'),
        apply: (c) => {
          c.p.cash = r2(c.p.cash - 1);
          c.p.rep = cl(c.p.rep + 4, 0, 100);
        },
      },
      {
        label: T('E’tibor bermaslik', 'Ignore it', 'Игнорировать'),
        hint: T('Obro‘ −6', 'Brand −6', 'Репутация −6'),
        apply: (c) => {
          c.p.rep = cl(c.p.rep - 6, 0, 100);
        },
      },
      {
        label: T('O‘chirishni talab qilish', 'Demand that it be deleted', 'Требовать удалить'),
        hint: T(
          'Odamlar buni yoqtirmaydi…',
          'People will not like it…',
          'Людям это не понравится…',
        ),
        apply: (c) => {
          c.p.rep = cl(c.p.rep - 12, 0, 100);
          return T(
            'Talabingiz skrinshot bo‘lib yanada ko‘proq tarqaldi: obro‘ −12.',
            'Your demand was screenshotted and spread even more: brand −12.',
            'Ваше требование разошлось скриншотами: репутация −12.',
          );
        },
      },
    ],
    ai: (c, bot) => (bot === 1 && c.p.cash < 5 ? 1 : 0),
  },
  {
    id: 'rentup',
    icon: () => '🏠',
    topic: 12,
    title: () =>
      T(
        'Ijara egasi narxni oshirmoqchi',
        'The landlord wants more rent',
        'Арендодатель повышает аренду',
      ),
    text: () =>
      T(
        'Bino egasi keyingi oydan ijarani 15% oshirmoqchi. Agar hozir 3 oylik ijarani oldindan to‘lasangiz, eski narx o‘yin oxirigacha saqlanadi.',
        'The landlord will raise the rent by 15%. Prepay 3 months now and the old rate stays to the end.',
        'Аренда вырастет на 15%. Оплатите 3 месяца вперёд — старая цена сохранится.',
      ),
    lesson: () =>
      T(
        'Bugungi pul va ertangi xarajat orasidagi tanlov — pul oqimini rejalashtirish. Kassa yetarli bo‘lsa, oldindan to‘lash tejaydi; yetmasa — kassani bo‘shatib qo‘yadi.',
        'Money today vs costs tomorrow is cash-flow planning: prepaying saves if you have cash, but can empty the till.',
        'Деньги сегодня или расходы завтра — это планирование денежного потока.',
      ),
    options: [
      {
        label: T('3 oyni oldindan to‘lash', 'Prepay 3 months', 'Оплатить 3 месяца'),
        hint: T(
          'Hozir ko‘p pul ketadi, keyin tejaladi',
          'A lot of cash now, savings later',
          'Много денег сейчас, экономия потом',
        ),
        apply: (c) => {
          const x = r2(c.p.rent * 3);
          c.p.cash = r2(c.p.cash - x);
          c.p.prepaid += 3;
          c.p.flags.prepaidRent = r2((c.p.flags.prepaidRent || 0) + x);
          return T(
            `${x} mln oldindan to‘landi: keyingi 3 oy ijara yo‘q va narx oshmaydi.`,
            `${x} mln prepaid: no rent for 3 months and no increase.`,
            `${x} млн вперёд: 3 месяца без аренды.`,
          );
        },
      },
      {
        label: T('Yangi narxga rozi bo‘lish', 'Accept the new rent', 'Согласиться'),
        hint: T('Ijara +15%', 'Rent +15%', 'Аренда +15%'),
        apply: (c) => {
          c.p.rent = r2(c.p.rent * 1.15);
        },
      },
    ],
    ai: (c) => (c.p.cash > c.p.rent * 3 + 35 ? 0 : 1),
  },
  {
    id: 'investor',
    icon: () => '💼',
    topic: 12,
    title: () => T('Investor taklifi', 'An investor’s offer', 'Предложение инвестора'),
    text: () =>
      T(
        'Mahalliy investor 40 mln so‘m bermoqchi. Evaziga biznesingizning 20% i unga tegishli bo‘ladi: o‘yin oxirida pulingizning beshdan biri uniki.',
        'A local investor offers 40 mln for 20% of your business: at the end a fifth of your money is theirs.',
        'Инвестор даёт 40 млн за 20% бизнеса: в конце пятая часть денег — его.',
      ),
    lesson: () =>
      T(
        'Investor puli — qarz emas, lekin bepul ham emas: u kelajakdagi foydangizning bir qismini oladi. Agar pulni o‘stira olmasangiz, bu eng qimmat pul bo‘lib chiqadi.',
        'Investor money is not a loan, but it is not free: it takes part of your future profit.',
        'Деньги инвестора — не долг, но и не бесплатны: он забирает часть будущей прибыли.',
      ),
    options: [
      {
        label: T('Qabul qilish', 'Accept', 'Принять'),
        hint: T('+40 mln, ulush 20%', '+40 mln, 20% stake', '+40 млн, доля 20%'),
        apply: (c) => {
          c.p.cash = r2(c.p.cash + 40);
          c.p.invested = r2(c.p.invested + 40);
          c.p.equity = r4(1 - (1 - c.p.equity) * 0.8);
        },
      },
      {
        label: T('Rad etish', 'Decline', 'Отказаться'),
        hint: T('Biznes to‘liq sizniki', 'You keep 100%', 'Бизнес полностью ваш'),
        apply: () => {},
      },
    ],
    ai: (c, bot) =>
      bot === 1 && c.p.cash < 40 && c.m <= 6 ? 0 : bot === 3 && c.p.cash < 20 ? 0 : 1,
  },
  {
    id: 'nasiya',
    icon: () => '📒',
    topic: 12,
    title: () =>
      T('Mijozlar nasiyaga so‘rayapti', 'Customers ask to buy on credit', 'Клиенты просят в долг'),
    text: () =>
      T(
        'Doimiy mijozlar «oylikdan keyin to‘layman» demoqda. Nasiyaga sotsangiz, savdo ko‘payadi, lekin tushumning bir qismi keyingi oy keladi, ba’zisi esa umuman qaytmaydi.',
        'Regulars ask to pay after payday. Selling on credit raises sales, but part of the money comes next month and some never comes.',
        'Продажа в долг увеличит выручку, но часть денег придёт позже, а часть не вернётся.',
      ),
    lesson: () =>
      T(
        'Foyda va kassa — bir xil narsa emas: nasiya savdoni oshiradi, lekin pul keyin keladi. Kassada pul qolmasa, foydali biznes ham qiyin ahvolga tushadi.',
        'Profit is not cash: credit sales grow revenue, but the money arrives later.',
        'Прибыль — не наличные: продажа в долг растит выручку, но деньги приходят позже.',
      ),
    options: [
      {
        label: T('Nasiyaga ruxsat berish', 'Allow credit', 'Разрешить долг'),
        hint: T(
          'Savdo +, tushumning 20% i keyingi oy, 4% qaytmaydi',
          'More sales; 20% paid next month, 4% never',
          'Продажи +, 20% позже, 4% не вернутся',
        ),
        apply: (c) => {
          c.p.flags.nasiya = 1;
          c.p.conv = [c.p.conv[0], r2(c.p.conv[1] + 0.15), r2(c.p.conv[2] + 0.3)];
        },
      },
      {
        label: T('Faqat naqd', 'Cash only', 'Только наличные'),
        hint: T('Hech narsa o‘zgarmaydi', 'Nothing changes', 'Ничего не меняется'),
        apply: () => {},
      },
    ],
    ai: (c, bot) => (bot === 0 ? 1 : c.p.cash > 35 ? 0 : 1),
  },
  {
    id: 'grant',
    icon: () => '🏛️',
    topic: 3,
    title: () => T('Davlat granti uchun ariza', 'A state grant application', 'Заявка на госгрант'),
    text: () =>
      T(
        'Kichik biznesni qo‘llab-quvvatlash dasturi 20 mln so‘m grant beradi. Hujjat tayyorlash 2 mln turadi; rasmiy ishlaydigan va ruxsatnomasi bor korxonalar ustun.',
        'A small-business programme gives 20 mln grants. Applying costs 2 mln; official and licensed businesses are preferred.',
        'Программа даёт гранты 20 млн. Заявка — 2 млн; преимущество у официальных.',
      ),
    lesson: () =>
      T(
        'Grant va imtiyozli mablag‘ — tayyor turganlarga: hujjatlari tartibli, rasmiy ishlaydigan biznes imkoniyatdan foydalanadi.',
        'Grants go to the prepared: businesses with their papers in order.',
        'Гранты получают подготовленные — с порядком в документах.',
      ),
    options: [
      {
        label: T('Ariza topshirish', 'Apply', 'Подать заявку'),
        hint: T(
          '2 mln · natija rasmiylikka bog‘liq',
          '2 mln · the result depends on being official',
          '2 млн · зависит от официальности',
        ),
        apply: (c) => {
          c.p.cash = r2(c.p.cash - 2);
          const chance =
            0.3 +
            (c.p.flags.licensed ? 0.2 : 0) +
            (c.p.flags.official ? 0.2 : 0) +
            (c.p.rep > 50 ? 0.1 : 0);
          if (rng(mix(c.g.seed, c.m, 91, c.i))() < chance) {
            c.p.cash = r2(c.p.cash + 20);
            return T(
              'Ariza qabul qilindi: +20 mln grant!',
              'Approved: a 20 mln grant!',
              'Одобрено: грант 20 млн!',
            );
          }
          return T(
            'Ariza rad etildi. Komissiya hujjatlar va rasmiylikni ko‘rmoqchi edi.',
            'Rejected. The committee wanted to see papers and official status.',
            'Отказ. Комиссия хотела видеть документы.',
          );
        },
      },
      {
        label: T('Topshirmaslik', 'Do not apply', 'Не подавать'),
        hint: T('Hech narsa o‘zgarmaydi', 'Nothing changes', 'Ничего не меняется'),
        apply: () => {},
      },
    ],
    ai: (c, bot) => (bot === 0 && !c.p.flags.official ? 1 : 0),
  },
  {
    id: 'export',
    icon: () => '🚚',
    topic: 14,
    from: 4,
    title: () =>
      T('Hayraton orqali eksport imkoniyati', 'Export through Hairatan', 'Экспорт через Хайратон'),
    text: (b) =>
      T(
        `Termiz chegarasi orqali qo‘shni davlat xaridori har oy ${b.qty.export.toLocaleString('ru-RU')} ${b.unit[0]} olmoqchi — narxingizning 90% iga. Sertifikat va logistika uchun 8 mln kerak.`,
        `A buyer across the Termez border wants ${b.qty.export.toLocaleString('en-US')} ${b.unit[1]} a month at 90% of your price. Certificates and logistics cost 8 mln.`,
        `Покупатель из-за границы хочет ${b.qty.export.toLocaleString('ru-RU')} ${b.unit[2]} в месяц по 90% цены. Подготовка — 8 млн.`,
      ),
    lesson: () =>
      T(
        'Tashqi bozor — yangi mijozlar va o‘sish, lekin avval hujjat, sifat va sig‘imga sarmoya kerak. Biznes-reja shu xarajatlar qachon qoplanishini ko‘rsatadi.',
        'Export brings new customers and growth, but needs an upfront investment in papers, quality and capacity.',
        'Экспорт — рост, но сначала вложения в документы и мощность.',
      ),
    options: [
      {
        label: T('Eksportga tayyorlanish', 'Prepare to export', 'Готовиться к экспорту'),
        hint: T(
          '8 mln · har oy qo‘shimcha savdo (bo‘sh sig‘imdan)',
          '8 mln · extra monthly sales (spare capacity)',
          '8 млн · доп. продажи',
        ),
        apply: (c) => {
          c.p.cash = r2(c.p.cash - 8);
          c.p.flags.export = 1;
        },
      },
      NONE,
    ],
    ai: (c, bot) => (bot === 0 ? 1 : c.p.cash > 25 && c.m <= 9 ? 0 : 1),
  },
  {
    id: 'poach',
    icon: () => '🧲',
    topic: 15,
    title: () =>
      T(
        'Eng yaxshi xodimingizni chaqirishyapti',
        'Your best employee is being poached',
        'Вашего лучшего сотрудника переманивают',
      ),
    text: () =>
      T(
        'Boshqa korxona eng tajribali xodimingizga ko‘proq maosh taklif qildi. Ish haqini oshirasizmi yoki ketishiga rozi bo‘lasizmi?',
        'Another business offered your most experienced employee more money. Raise wages or let them go?',
        'Другой бизнес предложил вашему лучшему сотруднику больше. Поднять зарплату или отпустить?',
      ),
    lesson: () =>
      T(
        'Tajribali xodim — biznesning eng qimmat «uskunasi». Uni yo‘qotish va yangisini o‘rgatish ko‘pincha ish haqini oshirishdan qimmatroq.',
        'An experienced employee is your most valuable “equipment”; replacing them often costs more than a raise.',
        'Опытный сотрудник — самое ценное «оборудование»; замена часто дороже прибавки.',
      ),
    options: [
      {
        label: T('Ish haqini oshirish', 'Give a raise', 'Повысить зарплату'),
        hint: T('Ish haqi xarajati +5%', 'Wage costs +5%', 'Зарплаты +5%'),
        apply: (c) => {
          c.p.wageMult = r2(c.p.wageMult + 0.05);
        },
      },
      {
        label: T('Ketishiga rozi bo‘lish', 'Let them go', 'Отпустить'),
        hint: T('Jamoa −1, mahorat −10', 'Team −1, skill −10', 'Команда −1, мастерство −10'),
        apply: (c) => {
          c.p.staff = Math.max(1, c.p.staff - 1);
          c.p.skill = cl(c.p.skill - 10, 0, 100);
        },
      },
    ],
    ai: (c, bot) => (bot === 1 ? 1 : 0),
  },
  {
    id: 'insurance',
    icon: () => '🛡️',
    topic: 15,
    title: () => T('Sug‘urta taklifi', 'An insurance offer', 'Предложение страховки'),
    text: () =>
      T(
        'Sug‘urta kompaniyasi uskuna va mulkni yong‘in, suv bosish va o‘g‘irlikdan oyiga 1 mln so‘mga sug‘urtalashni taklif qilmoqda.',
        'An insurer will cover your equipment and property against fire, flood and theft for 1 mln a month.',
        'Страховка имущества от пожара, затопления и кражи — 1 млн в месяц.',
      ),
    lesson: () =>
      T(
        'Sug‘urta — kichik va aniq xarajat evaziga kam ehtimolli, lekin katta zarardan himoya. Bitta baxtsiz hodisa biznesni yopib qo‘ymasligi kerak.',
        'Insurance trades a small certain cost for protection from a rare but large loss.',
        'Страховка — малый известный расход против редкого крупного убытка.',
      ),
    options: [
      {
        label: T('Sug‘urtalash', 'Get insured', 'Застраховаться'),
        hint: T('Oyiga 1 mln', '1 mln a month', '1 млн в месяц'),
        apply: (c) => {
          c.p.flags.insured = 1;
          c.p.upkeep = r2(c.p.upkeep + 1);
        },
      },
      {
        label: T('Rad etish', 'Decline', 'Отказаться'),
        hint: T('Xavf o‘zingizda', 'The risk is yours', 'Риск на вас'),
        apply: () => {},
      },
    ],
    ai: (c, bot) => (bot === 1 ? 1 : 0),
  },
  {
    id: 'disaster',
    icon: () => '🔥',
    topic: 15,
    after: 'insurance',
    title: () => T('Yong‘in va suv bosish', 'Fire and flooding', 'Пожар и затопление'),
    text: () =>
      T(
        'Kuchli yomg‘ir va elektr qisqa tutashuvi ikkala korxonaga ham zarar yetkazdi.',
        'Heavy rain and a short circuit damaged both businesses.',
        'Ливень и замыкание повредили оба бизнеса.',
      ),
    lesson: () =>
      T(
        'Sug‘urtasi bor korxona tez tiklandi; sug‘urtasiz korxona ta’mirga katta pul sarfladi va mijozlarini yo‘qotdi.',
        'The insured business recovered fast; the uninsured one paid for repairs and lost customers.',
        'Застрахованный быстро восстановился; незастрахованный потерял деньги и клиентов.',
      ),
    global: (c) => {
      c.g.players.forEach((p, i) => {
        if (p.flags.insured) {
          c.g.pre.notes[i].push(
            T(
              'Sug‘urta zararni to‘liq qopladi — siz hech narsa yo‘qotmadingiz.',
              'Insurance covered everything — you lost nothing.',
              'Страховка покрыла всё.',
            ),
          );
          return;
        }
        const lost = Math.floor(p.stock * 0.4);
        if (lost > 0) {
          p.stockCost = r2(p.stockCost * (1 - lost / p.stock));
          p.stock -= lost;
        }
        fine(p, 12);
        p.flags.closed = c.m;
        c.g.pre.notes[i].push(
          T(
            `Sug‘urta yo‘q: ta’mirga 12 mln ketdi${lost ? `, ${lost.toLocaleString('ru-RU')} ${c.biz.unit[0]} zaxira yaroqsiz bo‘ldi` : ''}, shu oy sig‘im −30%.`,
            `No insurance: 12 mln of repairs${lost ? `, ${lost.toLocaleString('en-US')} ${c.biz.unit[1]} ruined` : ''}, capacity −30% this month.`,
            `Страховки нет: ремонт 12 млн${lost ? `, испорчено ${lost.toLocaleString('ru-RU')} ${c.biz.unit[2]}` : ''}, мощность −30%.`,
          ),
        );
      });
    },
  },
  {
    id: 'theft',
    icon: () => '🕵️',
    topic: 15,
    title: () =>
      T('Kassada pul kam chiqmoqda', 'Cash is going missing', 'Из кассы пропадают деньги'),
    text: () =>
      T(
        'Hisob-kitobda har oy tushumning bir qismi yo‘qolayotgani ma’lum bo‘ldi. Kassa nazorati (apparat va hisob tizimi) 3 mln turadi.',
        'Part of the takings goes missing every month. A till and controls cost 3 mln.',
        'Каждый месяц пропадает часть выручки. Касса и контроль — 3 млн.',
      ),
    lesson: () =>
      T(
        'Ichki nazorat — ishonchsizlik emas, tartib: nazoratsiz kassa har oy jimgina foydani yeydi.',
        'Internal control is not distrust but order: an uncontrolled till quietly eats profit every month.',
        'Внутренний контроль — порядок, а не недоверие.',
      ),
    options: [
      {
        label: T('Nazorat o‘rnatish', 'Install controls', 'Ввести контроль'),
        hint: T('3 mln', '3 mln', '3 млн'),
        apply: (c) => {
          c.p.cash = r2(c.p.cash - 3);
          c.p.flags.control = 1;
        },
      },
      {
        label: T('Xodimlarga ishonaman', 'I trust my staff', 'Доверяю сотрудникам'),
        hint: T(
          'Har oy tushumning ~3% i yo‘qolishi mumkin',
          'About 3% of takings may vanish monthly',
          '~3% выручки могут пропадать',
        ),
        apply: (c) => {
          c.p.flags.theft = 1;
        },
      },
    ],
    ai: (c, bot) => (c.p.flags.control ? 1 : bot === 0 && c.p.cash < 10 ? 1 : 0),
  },
  {
    id: 'outage',
    icon: () => '⚡',
    topic: 15,
    title: () => T('Elektr uzilishlari', 'Power cuts', 'Отключения электричества'),
    text: () =>
      T(
        'Shu oy mahallada tez-tez elektr o‘chadi. Generator ijarasi 3 mln turadi, aks holda ish to‘xtab qoladi.',
        'This month the power keeps going off. Renting a generator costs 3 mln, otherwise work stops.',
        'В этом месяце часто отключают свет. Генератор — 3 млн.',
      ),
    lesson: () =>
      T(
        'Xavfni oldindan ko‘rish va zaxira reja tuzish — tadbirkorning vazifasi: to‘xtab qolgan kun — yo‘qotilgan mijoz.',
        'Spotting risks and having a plan B is the entrepreneur’s job: a lost day is lost customers.',
        'Предвидеть риски и иметь план Б — задача предпринимателя.',
      ),
    options: [
      {
        label: T('Generator ijarasi', 'Rent a generator', 'Арендовать генератор'),
        hint: T('3 mln · ish to‘xtamaydi', '3 mln · work goes on', '3 млн · работа идёт'),
        apply: (c) => {
          c.p.cash = r2(c.p.cash - 3);
        },
      },
      {
        label: T('Kutish', 'Wait it out', 'Переждать'),
        hint: T('Shu oy sig‘im −25%', 'Capacity −25% this month', 'Мощность −25%'),
        apply: (c) => {
          c.ext.capCut = Math.max(c.ext.capCut, 0.25);
        },
      },
    ],
    ai: (c) => (c.p.last.served > capacity(c.biz, c.p) * 0.75 ? 0 : 1),
  },
  {
    id: 'fx',
    icon: () => '💱',
    topic: 12,
    title: () => T('Dollar kursi oshdi', 'The dollar rose', 'Вырос курс доллара'),
    text: (b) =>
      T(
        `Dollar kursi keskin oshdi: uch oy davomida tannarx ${Math.round((b.fx - 1) * 100)}% qimmat. Bu ikkalangizga ham ta’sir qiladi.`,
        `The dollar jumped: for three months your unit costs are ${Math.round((b.fx - 1) * 100)}% higher. It hits both of you.`,
        `Доллар вырос: три месяца себестоимость выше на ${Math.round((b.fx - 1) * 100)}%.`,
      ),
    lesson: () =>
      T(
        'Valyuta xavfi — import qiluvchi biznesning doimiy hamrohi. Zaxira pul va moslashuvchan narx shunday paytda asqotadi.',
        'Currency risk is constant for importers; a cash reserve and flexible pricing help.',
        'Валютный риск постоянен для импортёра; помогает резерв и гибкая цена.',
      ),
    global: (c) => {
      c.g.mods.push({ from: c.m, until: c.m + 2, seg: [1, 1, 1], cost: c.biz.fx, sens: 1 });
    },
  },
  {
    id: 'shock',
    icon: (b) => b.shock.icon,
    topic: 1,
    title: (b) => b.shock.title,
    text: (b) => b.shock.text,
    lesson: (b) => b.shock.lesson,
    global: (c) => {
      const b = c.biz;
      if (b.id === 'somsa')
        c.g.mods.push({ from: c.m, until: c.m + 1, seg: [1, 1, 1], cost: 1.12, sens: 1 });
      else if (b.id === 'gadjet') {
        c.g.players.forEach((p) => {
          const lost = Math.floor(p.stock * 0.25);
          if (lost > 0) {
            p.stockCost = r2(p.stockCost * (1 - lost / p.stock));
            p.stock -= lost;
          }
        });
        c.g.mods.push({ from: c.m, until: c.m + 1, seg: [1.15, 1.15, 1.15], cost: 1, sens: 1 });
      } else c.g.mods.push({ from: c.m, until: c.m + 2, seg: [1, 1.4, 1], cost: 1, sens: 1 });
    },
  },
  {
    id: 'mall',
    icon: () => '🏬',
    topic: 1,
    title: () =>
      T(
        'Shaharda yirik savdo markazi ochildi',
        'A big mall opened in town',
        'В городе открылся торговый центр',
      ),
    text: () =>
      T(
        'Yangi savdo markazidagi tarmoq do‘konlar mijozlarning bir qismini o‘ziga tortadi — o‘yin oxirigacha bozor biroz kichrayadi.',
        'Chain stores in the new mall pull away some customers — the market shrinks a little until the end.',
        'Сетевые магазины в новом ТЦ забирают часть клиентов до конца игры.',
      ),
    lesson: () =>
      T(
        'Raqobat faqat siz va qo‘shni do‘kon emas: bozor doim o‘zgaradi. Kuchli brend va doimiy mijozlar bunday zarbaga chidamliroq.',
        'Competition is not only you and the shop next door; strong brands and loyal customers resist such shocks.',
        'Конкуренция шире, чем вы и сосед; лояльные клиенты держат удар.',
      ),
    global: (c) => {
      c.g.mods.push({ from: c.m, until: RULES.months, seg: [0.88, 0.9, 0.95], cost: 1, sens: 1 });
    },
  },
  {
    id: 'festival',
    icon: () => '🎉',
    topic: 8,
    title: () => T('Shahar festivali', 'A city festival', 'Городской фестиваль'),
    text: () =>
      T(
        'Shu oy shaharda katta festival: ko‘chalarda odam ko‘p, talab 30% yuqori. Hajm va jamoangiz yetadimi?',
        'A big festival this month: busy streets and 30% more demand. Do you have the volume and staff?',
        'Большой фестиваль: спрос выше на 30%. Хватит ли объёма и команды?',
      ),
    lesson: () =>
      T(
        'Talab oshgan payt — sig‘im va zaxirasi tayyor turganlarniki. Imkoniyatni ko‘rish uchun tayyor bo‘lish kerak.',
        'A demand spike belongs to those with capacity and stock ready.',
        'Всплеск спроса достаётся тем, у кого готовы мощность и запас.',
      ),
    global: (c) => {
      c.g.mods.push({ from: c.m, until: c.m, seg: [1.3, 1.3, 1.3], cost: 1, sens: 1 });
    },
  },
  {
    id: 'wageup',
    icon: () => '📈',
    topic: 15,
    title: () => T('Shaharda ish haqlari oshdi', 'Wages rose in town', 'В городе выросли зарплаты'),
    text: () =>
      T(
        'Ishchi kuchi qimmatladi: o‘yin oxirigacha ikkalangizda ham ish haqi xarajati 8% yuqori.',
        'Labour got more expensive: wage costs are 8% higher for both of you until the end.',
        'Труд подорожал: зарплаты выше на 8% у обоих.',
      ),
    lesson: () =>
      T(
        'Ish haqi — eng katta doimiy xarajatlardan biri. Jamoa hajmini talabga moslash va mahsuldorlikni oshirish shuning uchun muhim.',
        'Wages are a major fixed cost; sizing the team to demand matters.',
        'Зарплата — крупный постоянный расход; команду нужно подстраивать под спрос.',
      ),
    global: (c) => {
      c.g.players.forEach((p) => {
        p.wageMult = r2(p.wageMult * 1.08);
      });
    },
  },
  {
    id: 'pricewar',
    icon: () => '🏷️',
    topic: 11,
    title: () =>
      T('Shaharda chegirmalar mavsumi', 'Discount season in town', 'Сезон скидок в городе'),
    text: () =>
      T(
        'Ikki oy davomida hamma joyda aksiya: mijozlar narxga odatdagidan 30% sezgirroq bo‘ladi.',
        'For two months there are discounts everywhere: customers are 30% more price-sensitive.',
        'Два месяца везде скидки: клиенты на 30% чувствительнее к цене.',
      ),
    lesson: () =>
      T(
        'Narx — eng tez, lekin eng xavfli qurol: narx urushida marjangiz yo‘qoladi. Sifat va doimiy mijozlar narx urushidan himoya qiladi.',
        'Price is the fastest but riskiest weapon: price wars kill margins. Quality and loyalty protect you.',
        'Цена — быстрое, но опасное оружие; защищают качество и лояльность.',
      ),
    global: (c) => {
      c.g.mods.push({ from: c.m, until: c.m + 1, seg: [1, 1, 1], cost: 1, sens: 1.3 });
    },
  },
];
export const eventOf = (id: string) => EVENTS.find((e) => e.id === id);

/** 12 oylik vaziyatlar rejasi: 1-oy tinch, keyin 11 ta vaziyat (umumiylari ko'pi bilan 4 ta) va zanjirlar. */
export function eventPlan(seed: number) {
  const r = rng(mix(seed, 1));
  const tails = new Set(EVENTS.filter((e) => e.after).map((e) => e.id));
  const pool = EVENTS.filter((e) => !tails.has(e.id)).map((e) => e.id);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const plan: string[] = [],
    later: string[] = [];
  let globals = 0;
  // vaziyat oyi = rejadagi o'rni + 2 (1-oy tinch); «from» oyidan oldin chiqadiganlari keyinga suriladi
  const fits = (id: string) => (eventOf(id)!.from || 0) <= plan.length + 2;
  for (const id of pool) {
    if (plan.length >= 11) break;
    const e = eventOf(id)!;
    if (e.global && globals >= 4) continue;
    if (!fits(id)) {
      later.push(id);
      continue;
    }
    if (e.global) globals++;
    plan.push(id);
    for (let k = 0; k < later.length && plan.length < 11;)
      if (fits(later[k])) plan.push(later.splice(k, 1)[0]);
      else k++;
  }
  const busy = (id: string) => !!eventOf(id)?.after || EVENTS.some((e) => e.after === id);
  for (const tail of EVENTS.filter((e) => e.after)) {
    const at = plan.indexOf(tail.after!);
    if (at < 0 || at > 8 || r() > 0.85) continue;
    const slot = at + 2 + Math.floor(r() * (plan.length - at - 2));
    if (slot < plan.length && !busy(plan[slot])) plan[slot] = tail.id;
  }
  return ['', ...plan];
}

/* ------------------------------------------------------------------ o'yin holati */
const emptyStats = (): Stats => ({
  revenue: 0,
  profit: 0,
  lost: 0,
  lostMoney: 0,
  waste: 0,
  wasteMoney: 0,
  mkt: 0,
  mktSeg: [0, 0, 0],
  interest: 0,
  emergency: 0,
  fines: 0,
  invest: 0,
  hires: 0,
  fires: 0,
  capFull: 0,
  lowCash: 0,
  satSum: 0,
  priceSum: 0,
  gradeSum: 0,
  marginSum: 0,
  maxShare: 0,
  profitMonths: 0,
  debtMonths: 0,
  segServed: [0, 0, 0],
  volume: 0,
  sold: 0,
  goodPlan: 0,
  overload: 0,
  idleCash: 0,
});
function newPlayer(b: Biz): Player {
  return {
    loc: 'bozor',
    equip: 'lease',
    cash: RULES.startCash,
    debt: 0,
    equity: 0,
    invested: 0,
    staff: 3,
    skill: RULES.startSkill,
    rep: RULES.startRep,
    aw: [0, 0, 0],
    awFloor: [0, 0, 0],
    reg: [0, 0, 0],
    stock: 0,
    stockCost: 0,
    recv: 0,
    equipCap: b.equip.lease.cap,
    equipRisk: 0,
    assets: 0,
    lease: 0,
    upkeep: 0,
    rent: b.rent.bozor,
    prepaid: 0,
    branches: 1,
    conv: [0, 0, 0],
    retBonus: 0,
    qBonus: 0,
    satBonus: 0,
    wageMult: 1,
    owned: {},
    flags: {},
    bankrupt: false,
    last: {
      price: b.price.ref,
      grade: 1,
      mkt: [2, 2, 2],
      volume: 0,
      served: 0,
      demand: 0,
      segServed: [0, 0, 0],
      sat: 0.6,
      share: 50,
      capFull: false,
      short: false,
    },
    stats: emptyStats(),
  };
}
export function newGame(biz: BizId, seed: number): Game {
  const b = bizOf(biz);
  return {
    biz: b.id,
    seed: seed >>> 0,
    month: 0,
    events: eventPlan(seed),
    players: [newPlayer(b), newPlayer(b)],
    setup: null,
    mods: [],
    history: [],
    over: false,
    winner: -1,
    pre: { cash: [RULES.startCash, RULES.startCash], pnl: [0, 0], notes: [[], []] },
  };
}

/* ------------------------------------------------------------------ biznes-reja (0-raund) */
const LOC_IDS: LocId[] = ['uni', 'bozor', 'mahalla'];
const EQUIP_IDS: EquipId[] = ['new', 'used', 'lease'];
export function setupCost(b: Biz, s: Setup) {
  const equipCost = b.equip[s.equip].cost,
    deposit = b.rent[s.loc],
    hiring = r2(s.staff * b.wage * RULES.hireCost),
    total = r2(equipCost + deposit + hiring + s.launch);
  return { equipCost, deposit, hiring, launch: s.launch, total, left: r2(RULES.startCash - total) };
}
export function clampSetup(b: Biz, s: Partial<Setup>): Setup {
  const loc = LOC_IDS.includes(s.loc as LocId) ? (s.loc as LocId) : 'bozor';
  const equip = EQUIP_IDS.includes(s.equip as EquipId) ? (s.equip as EquipId) : 'lease';
  const staff = cl(Math.round(Number(s.staff) || 3), 1, b.staffMax);
  let launch = cl(Math.round(Number(s.launch) || 0), 0, RULES.launchMax);
  const over = setupCost(b, { loc, equip, staff, launch }).left;
  if (over < 0) launch = Math.max(0, launch + Math.floor(over));
  return { loc, equip, staff, launch, ...(s.bot ? { bot: true } : {}) };
}
/** Ikkala o'yinchining biznes-rejasi qabul qilinadi va 1-oy boshlanadi. */
export function applySetup(g: Game, raw: [Partial<Setup>, Partial<Setup>]) {
  if (g.month !== 0) throw new Error('Biznes-reja allaqachon qabul qilingan');
  const b = bizOf(g.biz);
  const recs = raw.map((x, i) => {
    const s = clampSetup(b, x),
      c = setupCost(b, s),
      p = g.players[i],
      e = b.equip[s.equip];
    p.loc = s.loc;
    p.equip = s.equip;
    p.equipCap = e.cap;
    p.equipRisk = e.risk;
    p.lease = e.monthly;
    p.assets = r2(e.cost * RULES.assetValue);
    p.rent = b.rent[s.loc];
    // birinchi oy ijarasi biznes-rejada oldindan to'lanadi (garov)
    p.prepaid = 1;
    p.flags.prepaidRent = c.deposit;
    p.staff = s.staff;
    p.cash = r2(RULES.startCash - c.total);
    const aff = b.locAff[s.loc];
    p.awFloor = three((k) => r4(aff[k] * 0.3));
    p.aw = three((k) => {
      const a0 = p.awFloor[k];
      return r4(cl(a0 + (1 - a0) * (1 - dexp(-(s.launch / 3) / (b.segs[k].k * 0.8))), 0, 0.95));
    });
    p.stats.mkt = s.launch;
    p.stats.mktSeg = three(() => r2(s.launch / 3));
    p.stats.hires = s.staff;
    return {
      ...s,
      equipCost: c.equipCost,
      deposit: c.deposit,
      hiring: c.hiring,
      cash: p.cash,
    } as SetupRecord;
  });
  g.setup = recs as [SetupRecord, SetupRecord];
  g.month = 1;
  startMonth(g);
}

/* ------------------------------------------------------------------ hisob-kitob */
function modsNow(g: Game, m: number) {
  let seg: Three<number> = [1, 1, 1],
    cost = 1,
    sens = 1;
  for (const x of g.mods)
    if (m >= x.from && m <= x.until) {
      const cur = seg;
      seg = three((s) => cur[s] * x.seg[s]);
      cost *= x.cost;
      sens *= x.sens;
    }
  return { seg, cost, sens };
}
export const wages = (b: Biz, p: Player) =>
  r2(p.staff * b.wage * p.wageMult * (p.flags.official ? 1 + RULES.socialTax : 1));
const fixedOf = (b: Biz, p: Player) =>
  r2(p.rent + wages(b, p) + b.utilities * (1 + 0.5 * (p.branches - 1)) + p.lease + p.upkeep);
export const capacity = (b: Biz, p: Player, grade = 1) =>
  Math.round(Math.min(p.staff * b.perStaff, p.equipCap) * b.gradeCap[cl(Math.round(grade), 0, 2)]);
export const quality = (b: Biz, p: Player, grade: number) =>
  r2(cl(b.grades[cl(Math.round(grade), 0, 2)].q * 0.6 + p.skill * 0.4 + p.qBonus, 0, 100));
export const unitCost = (g: Game, p: Player, grade: number, m = g.month) => {
  const b = bizOf(g.biz);
  return r2(b.cost * b.grades[cl(Math.round(grade), 0, 2)].mult * modsNow(g, m).cost);
};
/** Sof kapital: kassa − qarz + mulk (60%) + zaxira + nasiya qarzdorlar. */
export const worth = (p: Player) =>
  r2(p.cash - p.debt + p.assets + p.stockCost + p.recv + (p.flags.prepaidRent || 0));
/** Sizga tegishli pul: investor ulushi chiqarib tashlanadi. */
export const money = (p: Player) => {
  const w = worth(p);
  return w > 0 ? r2(w * (1 - p.equity)) : w;
};
export const earned = (p: Player) => r2(money(p) - RULES.startCash);

/** Reklamadan keyingi tanilganlik (shu oy uchun): unutish, reklama, og'izdan-og'izga. */
function awareness(b: Biz, p: Player, mkt: Three<number>): Three<number> {
  return three((s) => {
    const seg = b.segs[s];
    let a = p.aw[s] * (1 - RULES.awDecay);
    a += (1 - a) * (1 - dexp(-Math.max(0, mkt[s]) / seg.k));
    a += (1 - a) * 0.06 * (p.rep / 100);
    return r4(cl(Math.max(a, p.awFloor[s]), 0, 0.95));
  });
}
function utility(b: Biz, s: number, p: Player, price: number, grade: number, sens: number) {
  const seg = b.segs[s],
    q = quality(b, p, grade);
  return (
    (seg.a * (q - 50)) / 28 -
    seg.b * sens * 4 * (price / b.price.ref - 1) +
    (seg.g * (p.rep - 50)) / 40 +
    seg.d * (b.locAff[p.loc][s] * 0.8 + p.conv[s])
  );
}

type Res = {
  aw: Three<number>;
  q: number;
  uc: number;
  cap: number;
  produced: number;
  returns: number;
  refund: number;
  segN: Three<number>;
  segReg: Three<number>;
  segNew: Three<number>;
  segServed: Three<number>;
  demand: number;
  served: number;
  spill: number;
  lostOwn: number;
  bulkServed: number;
  b2b: number;
  revenue: number;
  units: number;
  cogs: number;
  wasteUnits: number;
  wasteCost: number;
  sat: number;
  short: number;
  overload: number;
};
/** Bir oy bozorini hisoblash (holatni o'zgartirmaydi). ps — shu oy investitsiya va jamoadan keyingi holat. */
function resolve(
  g: Game,
  ps: [Player, Player],
  ds: [Decision, Decision],
  m: number,
  noise: number,
  ext: [Ext, Ext],
): [Res, Res] {
  const b = bizOf(g.biz),
    md = modsNow(g, m);
  const segN = three((s) =>
    Math.round(b.segs[s].size * b.segs[s].season[m - 1] * md.seg[s] * noise),
  );
  const aw = ps.map((p, i) => awareness(b, p, ds[i].mkt));
  const reg = ps.map((p, i) => {
    const up = p.last.price > 0 ? ds[i].price / p.last.price - 1 : 0;
    const stay = cl(1 - 1.5 * Math.max(0, up), 0.4, 1);
    return three((s) => p.reg[s] * stay);
  });
  const U = ps.map((p, i) => three((s) => utility(b, s, p, ds[i].price, ds[i].grade, md.sens)));
  const segNew: Three<number>[] = [
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let s = 0; s < 3; s++) {
    const N = b.kind === 'service' ? segN[s] : Math.max(0, segN[s] - reg[0][s] - reg[1][s]);
    const e0 = dexp(b.segs[s].out),
      e = [dexp(U[0][s]), dexp(U[1][s])];
    for (let i = 0; i < 2; i++) {
      const j = 1 - i,
        ai = aw[i][s],
        aj = aw[j][s];
      segNew[i][s] =
        N * (ai * aj * (e[i] / (e0 + e[i] + e[j])) + ai * (1 - aj) * (e[i] / (e0 + e[i])));
    }
  }
  const out = ps.map((p, i) => {
    const d = ds[i],
      cap = Math.round(capacity(b, p, d.grade) * (1 - ext[i].capCut));
    const uc = r2(b.cost * b.grades[d.grade].mult * md.cost);
    const produced = b.kind === 'perishable' ? Math.min(d.volume, cap) : 0;
    const sellCap =
      b.kind === 'perishable'
        ? produced
        : b.kind === 'stock'
          ? Math.min(p.stock + d.volume, cap)
          : cap;
    const bulkServed = Math.min(ext[i].bulk, sellCap);
    const segDemand = three((s) => reg[i][s] + segNew[i][s]);
    const demand = sum(segDemand);
    const room = Math.max(0, sellCap - bulkServed);
    const served = Math.floor(Math.min(demand, room));
    // avval doimiy mijozlar, keyin yangilari (guruhlar bo'yicha mutanosib)
    const regTotal = sum(reg[i]);
    const regServed = Math.min(regTotal, served),
      newServed = served - regServed,
      newTotal = sum(segNew[i]);
    const segServed = three(
      (s) =>
        (regTotal > 0 ? (reg[i][s] / regTotal) * regServed : 0) +
        (newTotal > 0 ? (segNew[i][s] / newTotal) * newServed : 0),
    );
    return { cap, uc, produced, sellCap, bulkServed, segDemand, demand, served, room, segServed };
  });
  // xizmat ko'rsatilmagan mijozlarning 40% i raqibga o'tadi (uning bo'sh joyi bo'lsa)
  const spill = [0, 0];
  const spillSeg: Three<number>[] = [
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < 2; i++) {
    const j = 1 - i,
      unmet = Math.max(0, out[j].demand - out[j].served),
      spare = Math.max(0, out[i].room - out[i].served);
    spill[i] = Math.floor(Math.min(unmet * 0.4, spare));
    const unmetSeg = three((s) => Math.max(0, out[j].segDemand[s] - out[j].segServed[s]));
    const tot = sum(unmetSeg);
    spillSeg[i] = three((s) => (tot > 0 ? (unmetSeg[s] / tot) * spill[i] : 0));
  }
  const res = ps.map((p, i): Res => {
    const o = out[i],
      d = ds[i];
    const left = Math.max(0, o.room - o.served - spill[i]);
    const b2bWant = (p.flags.partner ? b.qty.partner : 0) + (p.flags.export ? b.qty.export : 0);
    const b2b = Math.floor(Math.min(b2bWant, left));
    const partnerPart = p.flags.partner ? Math.min(b2b, b.qty.partner) : 0;
    const exportPart = b2b - partnerPart;
    const units = o.served + spill[i] + o.bulkServed + b2b;
    // nuqsonli mahsulot qaytariladi: pul mijozga qaytadi, mahsulot yo'qoladi
    const defect = b.defect[d.grade];
    const returns = Math.floor((o.served + spill[i]) * defect);
    const refund = r2((returns * d.price) / 1000);
    const revenue = r2(
      ((o.served + spill[i]) * d.price +
        o.bulkServed * d.price * 0.85 +
        partnerPart * d.price * 0.75 +
        exportPart * d.price * 0.9) /
        1000 -
        refund,
    );
    let cogs = 0,
      wasteUnits = 0,
      wasteCost = 0;
    if (b.kind === 'perishable') {
      cogs = r2((units * o.uc) / 1000);
      wasteUnits = Math.max(0, o.produced - units);
      wasteCost = r2((wasteUnits * o.uc) / 1000);
    } else if (b.kind === 'stock') {
      const have = p.stock + d.volume,
        value = p.stockCost + (d.volume * o.uc) / 1000;
      const avgCost = have > 0 ? (value * 1000) / have : o.uc;
      cogs = r2((units * avgCost) / 1000);
      wasteUnits = Math.floor((have - units) * b.waste);
      wasteCost = r2((wasteUnits * avgCost) / 1000);
    } else cogs = r2((units * o.uc) / 1000);
    const segServed = three((s) => o.segServed[s] + spillSeg[i][s]);
    const short = o.demand > 0 ? Math.max(0, o.demand - o.served) / o.demand : 0;
    const util = o.cap > 0 ? units / o.cap : 1;
    const overload = Math.max(0, util - 0.92) * 3;
    const q = quality(b, p, d.grade);
    const sat = r4(
      cl(
        0.6 +
          (0.35 * (q - 50)) / 50 -
          0.45 * (d.price / b.price.ref - 1) -
          0.6 * short -
          0.3 * overload -
          1.5 * defect +
          p.satBonus,
        0.05,
        0.98,
      ),
    );
    return {
      aw: aw[i],
      q,
      uc: o.uc,
      cap: o.cap,
      produced: o.produced,
      returns,
      refund,
      segN,
      segReg: reg[i],
      segNew: segNew[i],
      segServed,
      demand: o.demand,
      served: o.served,
      spill: spill[i],
      lostOwn: Math.max(0, o.demand - o.served),
      bulkServed: o.bulkServed,
      b2b,
      revenue,
      units,
      cogs,
      wasteUnits,
      wasteCost,
      sat,
      short,
      overload,
    };
  });
  return [res[0], res[1]];
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
  const grade = cl(Math.round(Number(d.grade ?? 1)) || 0, 0, 2);
  const staff = cl(Math.round(Number(d.staff) || p.staff), 1, b.staffMax);
  const raw = Array.isArray(d.mkt) ? d.mkt : [0, 0, 0];
  const mkt = three((s) => cl(Math.round(Number(raw[s]) || 0), 0, RULES.mktMax));
  const step = b.volStep || 1;
  const volMax =
    b.kind === 'perishable' ? 3 * b.equip.new.cap : b.kind === 'stock' ? 2 * b.equip.new.cap : 0;
  const volume =
    b.kind === 'service' ? 0 : cl(Math.round((Number(d.volume) || 0) / step) * step, 0, volMax);
  const loan = cl(
    Math.round((Number(d.loan) || 0) / 5) * 5,
    0,
    Math.max(0, Math.min(RULES.loanMax, RULES.debtLimit - p.debt)),
  );
  const repay = cl(Math.round(Number(d.repay) || 0), 0, Math.floor(p.debt));
  const seen = new Set<InvId>();
  const buy = (Array.isArray(d.buy) ? d.buy : []).filter((x): x is InvId => {
    if (!INV_ORDER.includes(x as InvId) || seen.has(x as InvId)) return false;
    seen.add(x as InvId);
    return true;
  });
  const ev = eventOf(g.events[g.month - 1] || '');
  const choice = ev?.options ? cl(Math.round(Number(d.choice) || 0), 0, ev.options.length - 1) : 0;
  return {
    price,
    grade,
    volume,
    mkt,
    staff,
    buy,
    loan,
    repay,
    choice,
    ...(d.bot ? { bot: true } : {}),
  };
}

type Snap = {
  cash: number;
  debt: number;
  stockCost: number;
  assets: number;
  recv: number;
  invested: number;
  prepaid: number;
};
const snap = (p: Player): Snap => ({
  cash: p.cash,
  debt: p.debt,
  stockCost: p.stockCost,
  assets: p.assets,
  recv: p.recv,
  invested: p.invested,
  prepaid: p.flags.prepaidRent || 0,
});
/** Vaziyatning foyda/zararga ta'siri: kredit, investor puli, mulk va zaxira foyda emas (faqat shakli o'zgaradi). */
const pnlOf = (a: Snap, b: Snap) =>
  r2(
    b.cash -
      a.cash -
      (b.debt - a.debt) +
      (b.stockCost - a.stockCost) +
      (b.assets - a.assets) +
      (b.recv - a.recv) +
      (b.prepaid - a.prepaid) -
      (b.invested - a.invested),
  );

/** Oy boshi: umumiy (tanlovsiz) vaziyat darhol qo'llanadi — o'yinchilar qaror qilishdan oldin oqibatini ko'radi. */
function startMonth(g: Game) {
  g.pre = { cash: [g.players[0].cash, g.players[1].cash], pnl: [0, 0], notes: [[], []] };
  if (g.over || g.month < 1 || g.month > RULES.months) return;
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
    ext: { bulk: 0, capCut: 0, penalty: 0 },
  });
  g.pre.pnl = g.players.map((p, i) => pnlOf(before[i], snap(p))) as [number, number];
}

const pushFlow = (flow: Line[], key: string, v: number) => {
  if (Math.abs(v) < 0.005) return;
  const x = flow.find((l) => l.key === key);
  if (x) x.v = r2(x.v + v);
  else flow.push({ key, v: r2(v) });
};

/** Bir oyni o'ynash: ikkala o'yinchining qarori bilan. O'yin holatini o'zgartiradi va oy hisobotini qaytaradi. */
export function playMonth(g: Game, raw: [Partial<Decision>, Partial<Decision>]): MonthRecord {
  if (g.over || g.month < 1) throw new Error(g.over ? 'O‘yin tugagan' : 'Avval biznes-reja');
  const b = bizOf(g.biz),
    m = g.month,
    ev = eventOf(g.events[m - 1] || '');
  const ds = [clampDecision(g, 0, raw[0]), clampDecision(g, 1, raw[1])] as [Decision, Decision];
  const ext: [Ext, Ext] = [
    { bulk: 0, capCut: 0, penalty: 0 },
    { bulk: 0, capCut: 0, penalty: 0 },
  ];
  const outcomes: (Tri | undefined)[] = [undefined, undefined];
  const flows: Line[][] = [[], []];
  const notes: Tri[][] = [[...g.pre.notes[0]], [...g.pre.notes[1]]];
  g.players.forEach((p, i) => pushFlow(flows[i], 'event', p.cash - g.pre.cash[i]));
  const before = g.players.map(snap);
  // 1) Tanlovli vaziyat — har kim o'z tanlovi bilan
  if (ev?.options)
    g.players.forEach((p, i) => {
      const c0 = p.cash,
        inv0 = p.invested;
      outcomes[i] =
        ev.options![ds[i].choice].apply({
          g,
          i,
          p,
          rival: g.players[1 - i],
          biz: b,
          m,
          rnd: rng(mix(g.seed, m, 9, i)),
          ext: ext[i],
        }) || undefined;
      const fromInvestor = r2(p.invested - inv0);
      pushFlow(flows[i], 'investor', fromInvestor);
      pushFlow(flows[i], 'event', p.cash - c0 - fromInvestor);
    });
  const eventPnl = g.players.map((p, i) => r2(g.pre.pnl[i] + pnlOf(before[i], snap(p))));
  g.players.forEach((p, i) => {
    if (p.flags.closed === m) ext[i].capCut = Math.max(ext[i].capCut, 0.3);
  });
  // 2) Moliya: kredit; 3) investitsiyalar; 4) jamoa; 5) uskuna nosozligi
  const invCost = [0, 0],
    invExpense = [0, 0],
    hireCost = [0, 0],
    hired = [0, 0],
    fired = [0, 0],
    repair = [0, 0],
    bought: InvId[][] = [[], []];
  g.players.forEach((p, i) => {
    const d = ds[i];
    if (d.loan > 0) {
      p.cash = r2(p.cash + d.loan);
      p.debt = r2(p.debt + d.loan);
      pushFlow(flows[i], 'loan', d.loan);
    }
    for (const id of d.buy) {
      const inv = INVEST[id];
      if (!canBuy(g, p, id, m)) continue;
      const cost = inv.cost(b, p);
      if (p.cash < cost) {
        const n = inv.name(b);
        notes[i].push(
          T(
            `«${n[0]}» uchun pul yetmadi.`,
            `Not enough money for “${n[1]}”.`,
            `Не хватило денег на «${n[2]}».`,
          ),
        );
        continue;
      }
      p.cash = r2(p.cash - cost);
      pushFlow(flows[i], 'invest', -cost);
      invCost[i] = r2(invCost[i] + cost);
      if (inv.asset) {
        p.assets = r2(p.assets + cost * RULES.assetValue);
        invExpense[i] = r2(invExpense[i] + cost * (1 - RULES.assetValue));
      } else invExpense[i] = r2(invExpense[i] + cost);
      p.upkeep = r2(p.upkeep + inv.upkeep(b));
      inv.apply(p, b, m);
      p.owned[id] = (p.owned[id] || 0) + 1;
      bought[i].push(id);
    }
    if (d.staff > p.staff) {
      hired[i] = d.staff - p.staff;
      p.skill = r2((p.skill * p.staff + 25 * hired[i]) / d.staff);
      hireCost[i] = r2(hired[i] * b.wage * RULES.hireCost);
    } else if (d.staff < p.staff) {
      fired[i] = p.staff - d.staff;
      hireCost[i] = r2(fired[i] * b.wage * RULES.fireCost);
    }
    p.staff = d.staff;
    if (hireCost[i]) {
      p.cash = r2(p.cash - hireCost[i]);
      pushFlow(flows[i], 'hiring', -hireCost[i]);
    }
    // ishlatilgan uskuna ba'zan buziladi
    if (p.equipRisk && rng(mix(g.seed, m, 21, i))() < p.equipRisk) {
      ext[i].capCut = Math.max(ext[i].capCut, 0.3);
      repair[i] = 4;
      p.cash = r2(p.cash - 4);
      pushFlow(flows[i], 'repair', -4);
      notes[i].push(
        T(
          'Ishlatilgan uskuna buzildi: ta’mirga 4 mln, bir necha kun ish to‘xtadi (sig‘im −30%).',
          'The used equipment broke: 4 mln of repairs and a few days of downtime (capacity −30%).',
          'Б/у оборудование сломалось: ремонт 4 млн, простой (−30%).',
        ),
      );
    }
  });
  // 6) Xarid yoki ishlab chiqarish va reklama — kassadagi puldan (yetmasa qisqaradi)
  const paidVol = [0, 0],
    paidMkt = [0, 0];
  g.players.forEach((p, i) => {
    const d = ds[i],
      uc = unitCost(g, p, d.grade, m),
      step = b.volStep || 1;
    if (b.kind !== 'service') {
      const cap = Math.round(capacity(b, p, d.grade) * (1 - ext[i].capCut));
      let vol =
        b.kind === 'perishable' ? Math.min(d.volume, Math.floor(cap / step) * step) : d.volume;
      const afford = Math.max(0, Math.floor((Math.max(0, p.cash) * 1000) / uc / step) * step);
      if (vol > afford) {
        notes[i].push(
          T(
            `Kassada pul yetmagani uchun ${b.volName[0].toLowerCase()} ${vol.toLocaleString('ru-RU')} dan ${afford.toLocaleString('ru-RU')} ga qisqardi.`,
            `${b.volName[1]} was cut from ${vol.toLocaleString('en-US')} to ${afford.toLocaleString('en-US')} — not enough cash.`,
            `${b.volName[2]} сокращено до ${afford.toLocaleString('ru-RU')} — не хватило денег.`,
          ),
        );
        vol = afford;
      }
      d.volume = vol;
      paidVol[i] = r2((vol * uc) / 1000);
      p.cash = r2(p.cash - paidVol[i]);
      pushFlow(flows[i], 'purchase', -paidVol[i]);
    }
    const mk = sum(d.mkt);
    if (mk > Math.max(0, p.cash)) {
      const k = Math.max(0, p.cash) / mk;
      const cut = d.mkt;
      d.mkt = three((s) => Math.floor(cut[s] * k));
      notes[i].push(
        T(
          'Pul yetmagani uchun reklama qisqartirildi.',
          'Advertising was cut — not enough cash.',
          'Реклама сокращена — не хватило денег.',
        ),
      );
    }
    paidMkt[i] = sum(d.mkt);
    p.cash = r2(p.cash - paidMkt[i]);
    pushFlow(flows[i], 'marketing', -paidMkt[i]);
  });
  // 7) Bozor
  const noise = 0.94 + rng(mix(g.seed, m, 3))() * 0.12;
  const res = resolve(g, g.players, ds, m, noise, ext);
  const months: PlayerMonth[] = [];
  g.players.forEach((p, i) => {
    const d = ds[i],
      r = res[i],
      st = p.stats,
      flow = flows[i];
    // tushum (nasiya bo'lsa — bir qismi keyingi oy) va o'tgan oy nasiyasi
    const credit = p.flags.nasiya ? r2(r.revenue * 0.2) : 0;
    p.cash = r2(p.cash + r.revenue - credit);
    pushFlow(flow, 'revenue', r.revenue - credit);
    const collected = r2(p.recv * 0.96),
      badDebt = r2(p.recv - collected);
    if (p.recv) {
      p.cash = r2(p.cash + collected);
      pushFlow(flow, 'collected', collected);
    }
    p.recv = credit;
    // zaxira
    if (b.kind === 'stock') {
      p.stock = p.stock + d.volume - r.units - r.wasteUnits;
      p.stockCost = r2(Math.max(0, p.stockCost + paidVol[i] - r.cogs - r.wasteCost));
      if (p.stock <= 0) {
        p.stock = 0;
        p.stockCost = 0;
      }
    } else if (b.kind === 'service') {
      p.cash = r2(p.cash - r.cogs);
      pushFlow(flow, 'purchase', -r.cogs);
    }
    // doimiy xarajatlar (oldindan to'langan ijara — o'sha puldan), foiz, soliq
    const rent = p.rent;
    let rentCash = p.rent;
    if (p.prepaid > 0) {
      p.prepaid--;
      const pre = p.flags.prepaidRent || 0,
        used = Math.min(pre, p.rent);
      p.flags.prepaidRent = r2(pre - used);
      rentCash = r2(p.rent - used);
    }
    const wage = wages(b, p),
      util = r2(b.utilities * (1 + 0.5 * (p.branches - 1)) + p.upkeep),
      lease = p.lease;
    const interest = r2(p.debt * RULES.rate);
    const tax = r2(r.revenue * RULES.tax);
    const leak = p.flags.theft && !p.flags.control ? r2(r.revenue * 0.03) : 0;
    let penalty = 0;
    if (ext[i].bulk && r.bulkServed < ext[i].bulk) {
      penalty = 5;
      p.rep = cl(p.rep - 6, 0, 100);
      notes[i].push(
        T(
          `Katta buyurtma to‘liq bajarilmadi (${r.bulkServed.toLocaleString('ru-RU')} / ${ext[i].bulk.toLocaleString('ru-RU')}): 5 mln jarima, obro‘ −6.`,
          `The big order was not fully delivered (${r.bulkServed} / ${ext[i].bulk}): 5 mln penalty, brand −6.`,
          'Крупный заказ не выполнен полностью: штраф 5 млн, репутация −6.',
        ),
      );
    } else if (ext[i].bulk)
      notes[i].push(
        T(
          `Katta buyurtma bajarildi: ${r.bulkServed.toLocaleString('ru-RU')} ${b.unit[0]}.`,
          `Big order delivered: ${r.bulkServed.toLocaleString('en-US')} ${b.unit[1]}.`,
          `Крупный заказ выполнен: ${r.bulkServed.toLocaleString('ru-RU')} ${b.unit[2]}.`,
        ),
      );
    p.cash = r2(p.cash - rentCash - wage - util - lease - interest - tax - leak - penalty);
    pushFlow(flow, 'fixed', -r2(rentCash + wage + util + lease));
    pushFlow(flow, 'interest', -interest);
    pushFlow(flow, 'tax', -r2(tax + leak + penalty));
    st.fines = r2(st.fines + penalty);
    // oy oxirida qarzni qaytarish (kassada bor puldan)
    const repay = Math.min(d.repay, Math.max(0, Math.floor(p.cash)), Math.floor(p.debt));
    if (repay > 0) {
      p.cash = r2(p.cash - repay);
      p.debt = r2(p.debt - repay);
      pushFlow(flow, 'repay', -repay);
    }
    // kassa minusga tushsa — bank favqulodda qarz beradi (10% jarima bilan); chegaradan oshsa — bankrot
    let emergency = 0;
    if (p.cash < 0) {
      emergency = r2(-p.cash);
      p.debt = r2(p.debt + emergency * (1 + RULES.emergencyFee));
      p.cash = 0;
      pushFlow(flow, 'emergency', emergency);
      st.emergency = r2(st.emergency + emergency);
      notes[i].push(
        T(
          `Kassa yetmadi: bank ${dc(emergency)} mln favqulodda qarz berdi (+10% jarima).`,
          `You ran out of cash: the bank lent ${emergency.toFixed(1)} mln as an emergency loan (+10% fee).`,
          `Не хватило денег: банк выдал ${dc(emergency)} млн экстренно (+10%).`,
        ),
      );
    }
    if (p.debt > RULES.debtLimit) p.bankrupt = true;
    // foyda-zarar
    const lines: Line[] = [
      { key: 'revenue', v: r2(r.revenue + r.refund) },
      { key: 'returns', v: -r.refund },
      { key: 'cogs', v: -r.cogs },
      { key: 'waste', v: -r.wasteCost },
      { key: 'rent', v: -rent },
      { key: 'wages', v: -wage },
      { key: 'utilities', v: -util },
      { key: 'lease', v: -lease },
      { key: 'marketing', v: -paidMkt[i] },
      { key: 'hiring', v: -hireCost[i] },
      { key: 'invest', v: -invExpense[i] },
      { key: 'interest', v: -interest },
      { key: 'tax', v: -tax },
      { key: 'leak', v: -leak },
      { key: 'baddebt', v: -badDebt },
      { key: 'penalty', v: -(penalty + repair[i]) },
      { key: 'event', v: eventPnl[i] },
      { key: 'emergency', v: emergency ? -r2(emergency * RULES.emergencyFee) : 0 },
    ]
      .map((l) => ({ key: l.key, v: r2(l.v) }))
      .filter((l) => Math.abs(l.v) >= 0.005);
    const profit = r2(sum(lines.map((l) => l.v)));
    // obro', mahorat, tanilganlik, doimiy mijozlar
    p.aw = r.aw;
    p.rep = r2(cl(p.rep * 0.75 + r.sat * 25, 0, 100));
    p.skill = r2(cl(p.skill + (p.skill < 65 ? 2.5 : 0) - (r.overload > 0 ? 3 : 0), 0, 90));
    const ret = Math.min(0.95, b.retention + p.retBonus);
    p.reg = three((s) => {
      const x = r.segServed[s];
      if (b.kind === 'service')
        return Math.round(
          x * Math.min(0.97, ret * (0.55 + 0.6 * r.sat)) * (b.segs[s].stay?.[m - 1] ?? 1),
        );
      return Math.round(Math.min(r.segN[s] * 0.6, x * Math.min(0.9, ret * (0.4 + r.sat))));
    });
    const half = Math.max(1, (b.volStep || 2) / 2);
    const capFull = r.units >= r.cap * 0.97 && r.lostOwn >= half;
    const lostOwn = Math.round(r.lostOwn);
    const unitMargin = d.price - r.uc;
    // statistika
    st.revenue = r2(st.revenue + r.revenue);
    st.profit = r2(st.profit + profit);
    st.lost += lostOwn;
    st.lostMoney = r2(st.lostMoney + (lostOwn * Math.max(0, unitMargin)) / 1000);
    st.waste += r.wasteUnits;
    st.wasteMoney = r2(st.wasteMoney + r.wasteCost);
    st.mkt = r2(st.mkt + paidMkt[i]);
    st.mktSeg = three((s) => r2(st.mktSeg[s] + d.mkt[s]));
    st.interest = r2(st.interest + interest);
    st.invest = r2(st.invest + invCost[i]);
    st.hires += hired[i];
    st.fires += fired[i];
    if (capFull) st.capFull++;
    if (p.cash < 10) st.lowCash++;
    if (p.cash > 120 && p.debt === 0) st.idleCash++;
    if (r.overload > 0) st.overload++;
    if (profit > 0) st.profitMonths++;
    if (p.debt > 0) st.debtMonths++;
    st.satSum = r2(st.satSum + r.sat);
    st.priceSum = r2(st.priceSum + d.price / b.price.ref);
    st.gradeSum += d.grade;
    st.marginSum = r2(st.marginSum + unitMargin / d.price);
    st.segServed = three((s) => Math.round(st.segServed[s] + r.segServed[s]));
    if (b.kind !== 'service') {
      const have = b.kind === 'perishable' ? r.produced : p.stock + r.units + r.wasteUnits;
      st.volume += b.kind === 'perishable' ? r.produced : d.volume;
      st.sold += r.units;
      const need = r.demand + r.bulkServed + r.b2b;
      if (need > 0 && Math.abs(have - need) / need < 0.1) st.goodPlan++;
    }
    p.last = {
      price: d.price,
      grade: d.grade,
      mkt: d.mkt,
      volume: d.volume,
      served: r.units,
      demand: Math.round(r.demand),
      segServed: three((s) => Math.round(r.segServed[s])),
      sat: r.sat,
      share: 0,
      capFull,
      short: lostOwn > 0,
    };
    // izohlar
    if (lostOwn >= half) {
      const why =
        b.kind === 'service' || capFull
          ? T(
              'sig‘im (jamoa yoki uskuna) yetmadi',
              'capacity (team or equipment) ran out',
              'не хватило мощности',
            )
          : T('mahsulot yetmadi', 'you ran out of product', 'не хватило товара');
      notes[i].push(
        T(
          `${lostOwn.toLocaleString('ru-RU')} ta mijozga xizmat ko‘rsatilmadi — ${why[0]}.`,
          `${lostOwn.toLocaleString('en-US')} customers were not served — ${why[1]}.`,
          `${lostOwn.toLocaleString('ru-RU')} клиентов не обслужены — ${why[2]}.`,
        ),
      );
    }
    if (r.wasteUnits > 0 && r.wasteCost >= 0.5)
      notes[i].push(
        b.kind === 'perishable'
          ? T(
              `${r.wasteUnits.toLocaleString('ru-RU')} ${b.unit[0]} sotilmay qoldi va isrof bo‘ldi (−${dc(r.wasteCost)} mln).`,
              `${r.wasteUnits.toLocaleString('en-US')} ${b.unit[1]} were not sold and wasted (−${r.wasteCost.toFixed(1)} mln).`,
              `${r.wasteUnits.toLocaleString('ru-RU')} ${b.unit[2]} не продано и выброшено.`,
            )
          : T(
              `${r.wasteUnits.toLocaleString('ru-RU')} ${b.unit[0]} eskirdi (−${dc(r.wasteCost)} mln). Omborda ${p.stock.toLocaleString('ru-RU')} qoldi.`,
              `${r.wasteUnits.toLocaleString('en-US')} ${b.unit[1]} became outdated (−${r.wasteCost.toFixed(1)} mln). ${p.stock.toLocaleString('en-US')} left in stock.`,
              `${r.wasteUnits.toLocaleString('ru-RU')} ${b.unit[2]} устарело. На складе ${p.stock.toLocaleString('ru-RU')}.`,
            ),
      );
    if (r.returns > 0 && r.refund >= 0.5)
      notes[i].push(
        T(
          `${r.returns.toLocaleString('ru-RU')} ${b.unit[0]} nuqsonli chiqib qaytarildi — pul mijozlarga qaytarildi (−${dc(r.refund)} mln).`,
          `${r.returns.toLocaleString('en-US')} ${b.unit[1]} were faulty and refunded (−${r.refund.toFixed(1)} mln).`,
          `${r.returns.toLocaleString('ru-RU')} ${b.unit[2]} вернули как брак (−${dc(r.refund)} млн).`,
        ),
      );
    if (r.spill > 0)
      notes[i].push(
        T(
          `Raqibga sig‘magan ${r.spill.toLocaleString('ru-RU')} ta mijoz sizga keldi.`,
          `${r.spill.toLocaleString('en-US')} customers your rival could not serve came to you.`,
          `${r.spill.toLocaleString('ru-RU')} клиентов соперника пришли к вам.`,
        ),
      );
    if (r.b2b > 0)
      notes[i].push(
        T(
          `Ulgurji va eksport bo‘yicha ${r.b2b.toLocaleString('ru-RU')} ${b.unit[0]} sotildi.`,
          `${r.b2b.toLocaleString('en-US')} ${b.unit[1]} sold wholesale or for export.`,
          `Оптом и на экспорт продано ${r.b2b.toLocaleString('ru-RU')} ${b.unit[2]}.`,
        ),
      );
    if (hired[i])
      notes[i].push(
        T(
          `${hired[i]} ta yangi ${b.staffName[0]} yollandi — yangi xodimlar hali tajribasiz (mahorat ${Math.round(p.skill)}).`,
          `${hired[i]} new ${b.staffName[1]} hired — still inexperienced (skill ${Math.round(p.skill)}).`,
          `Нанято ${hired[i]} — пока без опыта.`,
        ),
      );
    if (fired[i])
      notes[i].push(
        T(
          `${fired[i]} ta xodim bo‘shatildi (bir oylik maosh to‘landi).`,
          `${fired[i]} staff let go (one month’s pay).`,
          `Уволено ${fired[i]} (выплачен оклад).`,
        ),
      );
    if (leak)
      notes[i].push(
        T(
          `Nazoratsiz kassadan ${dc(leak)} mln yo‘qoldi.`,
          `${leak.toFixed(1)} mln vanished from the uncontrolled till.`,
          `Из кассы пропало ${dc(leak)} млн.`,
        ),
      );
    if (credit)
      notes[i].push(
        T(
          `${dc(credit)} mln nasiyaga sotildi — keyingi oy keladi.`,
          `${credit.toFixed(1)} mln sold on credit — arrives next month.`,
          `${dc(credit)} млн в долг — придут позже.`,
        ),
      );
    if (repay)
      notes[i].push(
        T(
          `Qarzdan ${repay} mln qaytarildi.`,
          `${repay} mln of debt repaid.`,
          `Погашено ${repay} млн долга.`,
        ),
      );
    const breakEven =
      unitMargin > 0 ? Math.round((r2(p.rent + wage + util + lease) * 1000) / unitMargin) : 0;
    months.push({
      price: d.price,
      grade: d.grade,
      volume: b.kind === 'perishable' ? r.produced : d.volume,
      demand: Math.round(r.demand),
      served: r.units,
      spill: r.spill,
      lost: lostOwn,
      b2b: r.b2b,
      bulk: r.bulkServed,
      waste: r.wasteUnits,
      capacity: r.cap,
      staff: p.staff,
      quality: r.q,
      sat: r.sat,
      rep: p.rep,
      skill: p.skill,
      segs: three((s) => ({
        n: r.segN[s],
        demand: Math.round(r.segReg[s] + r.segNew[s]),
        served: Math.round(r.segServed[s]),
        aw: r.aw[s],
        reg: Math.round(r.segReg[s]),
      })),
      revenue: r.revenue,
      profit,
      cash: p.cash,
      debt: p.debt,
      worth: worth(p),
      money: money(p),
      share: 0,
      mkt: d.mkt,
      bought: bought[i],
      hired: hired[i],
      fired: fired[i],
      emergency,
      choice: d.choice,
      breakEven,
      lines,
      flow,
      notes: notes[i],
      reviews: reviewsOf(b, r, d, p),
      ...(outcomes[i] ? { outcome: outcomes[i] } : {}),
    });
  });
  const total = months[0].served + months[1].served;
  months.forEach((x, i) => {
    x.share = total ? Math.round((1000 * x.served) / total) / 10 : 50;
    g.players[i].last.share = x.share;
    g.players[i].stats.maxShare = Math.max(g.players[i].stats.maxShare, x.share);
  });
  const rec: MonthRecord = {
    m,
    event: ev?.id || '',
    segN: res[0].segN,
    players: months as [PlayerMonth, PlayerMonth],
  };
  g.history.push(rec);
  g.month++;
  const [a, z] = g.players;
  if (a.bankrupt || z.bankrupt || g.month > RULES.months) {
    g.over = true;
    const wa = money(a),
      wz = money(z);
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

/** Mijozlar fikri: shu oydagi eng muhim 2–3 sabab. */
function reviewsOf(b: Biz, r: Res, d: Decision, p: Player): Tri[] {
  const out: [number, Tri][] = [];
  const pr = d.price / b.price.ref;
  if (r.q >= 66) out.push([r.q - 60, b.reviews.good]);
  if (r.q < 42 || r.returns > r.units * 0.05)
    out.push([Math.max(50 - r.q, (r.returns / Math.max(1, r.units)) * 300), b.reviews.bad]);
  if (pr > 1.12)
    out.push([
      (pr - 1) * 100,
      T(
        'Narxi qimmat, boshqa joyga borsam ham bo‘lardi.',
        'Pricey — I could go elsewhere.',
        'Дороговато.',
      ),
    ]);
  if (pr < 0.9)
    out.push([(1 - pr) * 80, T('Narxi hamyonbop 👍', 'Great price 👍', 'Отличная цена 👍')]);
  if (r.short > 0.08)
    out.push([
      r.short * 100,
      b.kind === 'service'
        ? T(
            'Joy yo‘q ekan, ro‘yxatga yozib qo‘yishdi…',
            'No places left, I was put on a waiting list…',
            'Мест нет, записали в очередь…',
          )
        : T(
            'Kelsam, tugab qolibdi 😕',
            'I came and it was sold out 😕',
            'Пришёл — всё распродано 😕',
          ),
    ]);
  if (r.overload > 0)
    out.push([
      r.overload * 60,
      T(
        'Navbat uzun, xodimlar ulgurmayapti.',
        'Long queues, the staff can’t keep up.',
        'Длинные очереди.',
      ),
    ]);
  if (p.conv[1] >= 0.6)
    out.push([
      12,
      T('Yetkazib berish juda qulay!', 'Delivery is so convenient!', 'Доставка очень удобна!'),
    ]);
  if (p.rep >= 65)
    out.push([
      p.rep - 55,
      T(
        'Do‘stlarim tavsiya qilgan edi — to‘g‘ri ekan.',
        'My friends recommended it — they were right.',
        'Друзья советовали — не зря.',
      ),
    ]);
  if (!out.length)
    out.push([1, T('Yomon emas, odatdagidek.', 'Not bad, as usual.', 'Неплохо, как обычно.')]);
  return out
    .sort((x, y) => y[0] - x[0])
    .slice(0, 3)
    .map((x) => x[1]);
}

/** Qarorlar ro'yxatidan o'yinni qayta tiklash (kursdoshlar o'yinida ikkala tomon ham shu bilan hisoblaydi). */
export function replay(
  biz: BizId,
  seed: number,
  setup: [Partial<Setup>, Partial<Setup>] | null,
  months: [Partial<Decision>, Partial<Decision>][],
) {
  const g = newGame(biz, seed);
  if (!setup) return g;
  applySetup(g, setup);
  for (const d of months) {
    if (g.over) break;
    playMonth(g, d);
  }
  return g;
}

/* ------------------------------------------------------------------ ekran va botlar uchun yordamchilar */
const clonePlayer = (p: Player): Player => ({
  ...p,
  aw: [...p.aw] as Three<number>,
  awFloor: [...p.awFloor] as Three<number>,
  reg: [...p.reg] as Three<number>,
  conv: [...p.conv] as Three<number>,
  owned: { ...p.owned },
  flags: { ...p.flags },
  last: { ...p.last },
  stats: { ...p.stats },
});
/** Raqibning shu oydagi taxminiy qarori: o'tgan oydagidek (1-oyda — standart). */
function rivalGuess(g: Game, j: number): Decision {
  const p = g.players[j];
  return {
    price: p.last.price,
    grade: p.last.grade,
    volume: 1e9,
    mkt: p.last.mkt,
    staff: p.staff,
    buy: [],
    loan: 0,
    repay: 0,
    choice: 0,
  };
}
export type Forecast = {
  demand: number;
  low: number;
  high: number;
  segs: Three<{ n: number; demand: number; aw: number }>;
  capacity: number;
  sales: number;
  revenue: number;
  unitCost: number;
  cogs: number;
  waste: number;
  fixed: number;
  marketing: number;
  profit: number;
  breakEven: number;
  quality: number;
  /** kutilayotgan mijozlar qoniqishi (0..1) */
  sat: number;
  share: number;
  /** aniqlik: bozor tadqiqoti bo'lsa ±4%, aks holda ±12% */
  spread: number;
};
/** Shu oy uchun prognoz: raqib o'tgan oydagidek harakat qiladi deb faraz qilinadi. */
export function forecast(g: Game, i: number, raw: Partial<Decision>): Forecast {
  const b = bizOf(g.biz),
    m = Math.max(1, Math.min(RULES.months, g.month));
  const d = clampDecision(g, i, raw);
  const ps = [clonePlayer(g.players[0]), clonePlayer(g.players[1])] as [Player, Player];
  const p = ps[i];
  let invExpense = 0;
  for (const id of d.buy) {
    const inv = INVEST[id];
    if (!canBuy(g, p, id, m)) continue;
    const cost = inv.cost(b, p);
    invExpense += inv.asset ? cost * (1 - RULES.assetValue) : cost;
    p.upkeep = r2(p.upkeep + inv.upkeep(b));
    inv.apply(p, b, m);
  }
  if (d.staff > p.staff) p.skill = r2((p.skill * p.staff + 25 * (d.staff - p.staff)) / d.staff);
  const hire =
    d.staff > p.staff
      ? (d.staff - p.staff) * b.wage * RULES.hireCost
      : (p.staff - d.staff) * b.wage * RULES.fireCost;
  p.staff = d.staff;
  const ds: [Decision, Decision] = i === 0 ? [d, rivalGuess(g, 1)] : [rivalGuess(g, 0), d];
  const ext: [Ext, Ext] = [
    { bulk: 0, capCut: 0, penalty: 0 },
    { bulk: 0, capCut: 0, penalty: 0 },
  ];
  ps.forEach((x, k) => {
    if (x.flags.closed === m) ext[k].capCut = 0.3;
  });
  const both = resolve(g, ps, ds, m, 1, ext),
    r = both[i],
    o = both[1 - i];
  const fixed = fixedOf(b, p);
  const mk = sum(d.mkt);
  const interest = (p.debt + d.loan) * RULES.rate;
  const tax = r.revenue * RULES.tax;
  const profit = r2(
    r.revenue - r.cogs - r.wasteCost - fixed - mk - interest - tax - invExpense - hire,
  );
  const margin = d.price - r.uc;
  const spread = p.flags.research && p.flags.research >= m - 1 ? 0.04 : 0.12;
  const demand = Math.round(r.demand);
  return {
    demand,
    low: Math.round(demand * (1 - spread)),
    high: Math.round(demand * (1 + spread)),
    segs: three((s) => ({
      n: r.segN[s],
      demand: Math.round(r.segReg[s] + r.segNew[s]),
      aw: r.aw[s],
    })),
    capacity: r.cap,
    sales: r.units,
    revenue: r.revenue,
    unitCost: r.uc,
    cogs: r.cogs,
    waste: r.wasteCost,
    fixed,
    marketing: mk,
    profit,
    breakEven: margin > 0 ? Math.round(((fixed + mk) * 1000) / margin) : 0,
    quality: r.q,
    sat: r.sat,
    share: Math.round((100 * r.demand) / Math.max(1, r.demand + o.demand)),
    spread,
  };
}
/** Bu oy rejadagi to'lovlar: investitsiya, jamoa, xarid, reklama (kredit qo'shiladi). */
export function planCash(g: Game, i: number, raw: Partial<Decision>) {
  const b = bizOf(g.biz),
    p = g.players[i],
    d = clampDecision(g, i, raw);
  const invest = r2(sum(d.buy.filter((id) => canBuy(g, p, id)).map((id) => INVEST[id].cost(b, p))));
  const hire = r2(
    d.staff > p.staff
      ? (d.staff - p.staff) * b.wage * RULES.hireCost
      : (p.staff - d.staff) * b.wage * RULES.fireCost,
  );
  const purchase = b.kind === 'service' ? 0 : r2((d.volume * unitCost(g, p, d.grade)) / 1000);
  const marketing = sum(d.mkt);
  const available = r2(p.cash + d.loan);
  const out = r2(invest + hire + purchase + marketing);
  return {
    invest,
    hire,
    purchase,
    marketing,
    available,
    out,
    left: r2(available - out),
    fixed: fixedOf(b, p),
  };
}

/* ------------------------------------------------------------------ botlar */
export const BOTS: { icon: string; name: Tri; style: Tri; level: Tri }[] = [
  {
    icon: '🐢',
    name: T('Ehtiyotkor Anvar', 'Careful Anvar', 'Осторожный Анвар'),
    style: T(
      'Xavfdan qochadi: o‘rtacha narx, kam reklama, qarz olmaydi va kam sarmoya qiladi.',
      'Avoids risk: average price, little advertising, no loans, few investments.',
      'Избегает риска: средняя цена, мало рекламы, без кредитов.',
    ),
    level: T('oson', 'easy', 'лёгкий'),
  },
  {
    icon: '💸',
    name: T('Arzonchi Bobur', 'Bargain Bobur', 'Бобур-дискаунтер'),
    style: T(
      'Narx bilan kurashadi: arzon mahsulot, katta hajm va talabalarga reklama.',
      'Fights on price: cheap product, big volume, ads for students.',
      'Борется ценой: дёшево, большой объём.',
    ),
    level: T('o‘rta', 'medium', 'средний'),
  },
  {
    icon: '👑',
    name: T('Sifatchi Dilnoza', 'Quality Dilnoza', 'Дилноза-премиум'),
    style: T(
      'Sifat bilan ajralib turadi: premium mahsulot, yuqori narx, jamoa treningi va obro‘.',
      'Stands out on quality: premium product, high price, training and reputation.',
      'Делает ставку на качество и репутацию.',
    ),
    level: T('o‘rta', 'medium', 'средний'),
  },
  {
    icon: '🧠',
    name: T('Strateg Jasur', 'Strategist Jasur', 'Стратег Жасур'),
    style: T(
      'Bozorni hisoblaydi: bo‘sh joyni topadi, narx va reklamani har oy moslaydi, pulni oqilona taqsimlaydi.',
      'Calculates the market: finds gaps, adjusts price and ads monthly, allocates money wisely.',
      'Считает рынок: ищет ниши, гибко меняет цену и рекламу.',
    ),
    level: T('qiyin', 'hard', 'сложный'),
  },
];
/** Bot biznes-rejasi (raqibning tanlovini bilmaydi). */
export function botSetup(g: Game, i: number, bot: BotId): Setup {
  const b = bizOf(g.biz);
  const byAff = (s: number) => LOC_IDS.reduce((x, y) => (b.locAff[y][s] > b.locAff[x][s] ? y : x));
  const staffFor = (n: number) => cl(Math.ceil(n / b.perStaff), 1, b.staffMax);
  const base = sum(b.segs.map((s) => s.size)) * 0.22;
  if (bot === 0)
    return clampSetup(b, {
      loc: 'mahalla',
      equip: 'used',
      staff: staffFor(base * 0.75),
      launch: 4,
    });
  if (bot === 1)
    return clampSetup(b, { loc: byAff(0), equip: 'new', staff: staffFor(base * 1.1), launch: 12 });
  if (bot === 2) {
    let s = 0;
    for (let k = 1; k < 3; k++) if (b.segs[k].a > b.segs[s].a) s = k;
    return clampSetup(b, { loc: byAff(s), equip: 'new', staff: staffFor(base * 0.9), launch: 10 });
  }
  // Strateg: birinchi oy natijasini har bir joy uchun solishtiradi (raqib standart deb faraz qilinadi)
  let best: Setup = clampSetup(b, {}),
    top = -Infinity;
  for (const loc of LOC_IDS) {
    const s = clampSetup(b, { loc, equip: 'lease', staff: staffFor(base), launch: 12 });
    const t = newGame(g.biz, g.seed);
    applySetup(t, i === 0 ? [s, { loc: 'bozor' }] : [{ loc: 'bozor' }, s]);
    const f = forecast(t, i, {
      price: b.price.ref,
      grade: 1,
      mkt: [3, 3, 3],
      volume: 1e9,
      staff: s.staff,
    });
    const score = f.profit - b.rent[loc];
    if (score > top) {
      top = score;
      best = s;
    }
  }
  return best;
}
/** «Strateg»ning kelajakni qanchalik hisobga olishi (tanilganlik va qoniqish qiymati). */
export const STRATEG = { aw: 0, sat: 0, budgets: [5, 9] };
const STYLE = [
  { grade: 1, price: 1, mkt: [1, 1, 1], budget: 4, buffer: 0.95 },
  { grade: 0, price: 0.86, mkt: [3, 1, 0], budget: 8, buffer: 1.05 },
  { grade: 2, price: 1.25, mkt: [0, 1, 2], budget: 8, buffer: 1.02 },
  { grade: 1, price: 1, mkt: [1, 1, 1], budget: 9, buffer: 1.03 },
];
function botEventChoice(g: Game, i: number, bot: BotId) {
  const ev = eventOf(g.events[g.month - 1] || '');
  if (!ev?.options) return 0;
  const c: EvCtx = {
    g,
    i,
    p: g.players[i],
    rival: g.players[1 - i],
    biz: bizOf(g.biz),
    m: g.month,
    rnd: rng(mix(g.seed, g.month, 33, i)),
    ext: { bulk: 0, capCut: 0, penalty: 0 },
  };
  return ev.ai ? ev.ai(c, bot) : ev.options.length - 1;
}
export function botDecision(g: Game, i: number, bot: BotId): Decision {
  const b = bizOf(g.biz),
    p = g.players[i],
    m = g.month,
    st = STYLE[bot],
    r = rng(mix(g.seed, m, 31, i, bot));
  const ref = b.price.ref,
    cost = (grade: number) => unitCost(g, p, grade);
  const mktOf = (w: number[], budget: number): Three<number> => {
    const tot = sum(w) || 1;
    return three((s) => Math.round((budget * w[s]) / tot));
  };
  // xizmatda arzon sifat ota-onalarni qochiradi — «Arzonchi» u yerda faqat narx bilan kurashadi
  let grade = bot === 1 && b.kind === 'service' ? 1 : st.grade,
    price = ref * st.price,
    mkt = mktOf(st.mkt, st.budget);
  if (bot === 0) price = ref + Math.round((r() - 0.5) * 2) * b.price.step;
  if (bot === 1 && b.kind === 'service') price = ref * 0.92;
  if (bot === 1 || bot === 2) {
    price = p.last.price && m > 1 ? p.last.price : price;
    if (p.last.capFull) price *= 1.04;
    else if (m > 1 && p.last.share < 40) price *= 0.97;
    price = cl(price, ref * (bot === 1 ? 0.75 : 1.1), ref * (bot === 1 ? 1 : 1.45));
    price = Math.max(price, cost(grade) * 1.35);
  }
  const plan = (pr: number, gr: number, mk: Three<number>) =>
    forecast(g, i, { price: pr, grade: gr, mkt: mk, volume: 1e9, staff: p.staff, buy: [] });
  if (bot === 3) {
    // Strateg: bir nechta strategiyani solishtiradi (shu oy foydasi + tanilganlik va sifatning kelajakdagi qiymati)
    let best = -Infinity;
    const presets: number[][] = [
      [1, 1, 1],
      [3, 1, 1],
      [1, 3, 1],
      [1, 1, 3],
    ];
    const left = Math.max(0, RULES.months - m);
    // narxni keskin emas, bosqichma-bosqich o'zgartiradi (doimiy mijozlar keskin qimmatlashuvni yoqtirmaydi)
    const prices =
      m === 1
        ? [0.95, 1, 1.08, 1.18].map((k) => ref * k)
        : [0.94, 1, 1.06].map((k) => p.last.price * k);
    for (const gr of [0, 1, 2])
      for (const pv of prices)
        for (const w of presets)
          for (const budget of STRATEG.budgets) {
            const pr = cl(Math.round(pv / b.price.step) * b.price.step, b.price.min, b.price.max);
            if (pr < cost(gr) * 1.25) continue;
            const mk = mktOf(w, budget);
            const f = plan(pr, gr, mk);
            const unit = (pr - cost(gr)) / 1000;
            const awGain =
              sum(f.segs.map((x, s) => (x.aw - p.aw[s]) * x.n)) * unit * STRATEG.aw * left;
            // qoniqqan mijoz qaytadi va obro' oshadi — kelajakdagi savdo
            const satGain =
              (f.sat - 0.55) *
              f.sales *
              unit *
              Math.min(1, b.retention * 1.4) *
              Math.min(4, left) *
              STRATEG.sat;
            const score = f.profit + awGain + satGain - (m > 1 && gr !== p.last.grade ? 3 : 0);
            if (score > best) {
              best = score;
              grade = gr;
              price = pr;
              mkt = mk;
            }
          }
  }
  price = cl(Math.round(price / b.price.step) * b.price.step, b.price.min, b.price.max);
  const f = plan(price, grade, mkt);
  // jamoa: kutilayotgan talabga moslash
  const want = f.demand * 1.05 + (p.flags.partner ? b.qty.partner * 0.5 : 0);
  const per = b.perStaff * b.gradeCap[grade];
  let staff = p.staff;
  // uskuna sig'imidan ortiq xodim foydasiz (agar uskuna olinmasa)
  const need = Math.min(
    Math.ceil(want / per),
    Math.ceil(p.equipCap / b.perStaff) + (p.last.capFull ? 1 : 0),
  );
  if (bot === 0) {
    if (p.last.capFull && p.stats.capFull >= 2) staff = p.staff + 1;
  } else if (need > p.staff) staff = Math.min(need, p.staff + 2, b.staffMax);
  else if (need < p.staff - 1 && bot === 3) staff = p.staff - 1;
  // investitsiyalar
  const buy: InvId[] = [];
  const reserve = [30, 15, 20, 20][bot];
  let cash = p.cash;
  const tryBuy = (id: InvId) => {
    if (!canBuy(g, p, id)) return;
    const c = INVEST[id].cost(b, p);
    if (cash - c < reserve) return;
    cash -= c;
    buy.push(id);
  };
  const equipLimited = p.equipCap <= staff * b.perStaff && p.last.capFull;
  if (bot === 1) {
    if (m === 1) tryBuy('pos');
    if (equipLimited && m <= 9) tryBuy('cap');
    if (m === 3) tryBuy('delivery');
  } else if (bot === 2) {
    if (m === 1) tryBuy('design');
    if (m === 2) tryBuy('extra');
    if (m === 3) tryBuy('crm');
    if (m % 3 === 1 && m < 11) tryBuy('training');
    if (equipLimited && m <= 8) tryBuy('cap');
  } else if (bot === 3) {
    if (equipLimited && m <= 8) tryBuy(p.owned.cap ? 'branch' : 'cap');
    // har bir investitsiyani prognoz bilan baholaydi: o'zini o'yin oxirigacha qoplaydimi
    const base = forecast(g, i, { price, grade, mkt, volume: 1e9, staff, buy }).profit;
    for (const id of ['delivery', 'pos', 'crm', 'design', 'extra', 'training'] as InvId[]) {
      if (!canBuy(g, p, id) || buy.includes(id)) continue;
      const c = INVEST[id].cost(b, p);
      const gain =
        forecast(g, i, { price, grade, mkt, volume: 1e9, staff, buy: [...buy, id] }).profit -
        base +
        (INVEST[id].asset ? c * 0.4 : c);
      if (gain > 0 && c / gain <= (RULES.months - m) / 2.2) tryBuy(id);
    }
  }
  // hajm: prognozga zaxira bilan
  const capNow =
    Math.min(
      staff * b.perStaff,
      p.equipCap + (buy.includes('cap') ? Math.round(b.equip.new.cap * 0.6) : 0),
    ) * b.gradeCap[grade];
  const err = [0.15, 0.08, 0.06, 0.03][bot];
  const expect =
    (f.demand + (p.flags.partner ? b.qty.partner : 0) + (p.flags.export ? b.qty.export : 0)) *
    (1 + (r() - 0.5) * 2 * err);
  let volume = 0;
  if (b.kind === 'perishable') volume = Math.min(capNow, expect * st.buffer);
  else if (b.kind === 'stock')
    volume = Math.max(0, Math.min(capNow * 1.1, expect * st.buffer) - p.stock);
  if (b.volStep) volume = Math.floor(volume / b.volStep) * b.volStep;
  // moliya
  const hireOut = staff > p.staff ? (staff - p.staff) * b.wage * RULES.hireCost : 0;
  const plannedOut =
    (b.kind === 'service' ? 0 : (volume * cost(grade)) / 1000) +
    sum(mkt) +
    sum(buy.map((id) => INVEST[id].cost(b, p))) +
    hireOut;
  const fixedNext = fixedOf(b, p);
  let loan = 0,
    repay = 0;
  if (bot !== 0 && p.cash - plannedOut < fixedNext * 0.6)
    loan = cl(Math.ceil((plannedOut + fixedNext * 0.6 - p.cash) / 5) * 5, 0, RULES.loanMax);
  else if (bot === 0 && p.cash - plannedOut < fixedNext * 0.3 && b.volStep)
    volume = Math.max(
      0,
      Math.floor(((p.cash - sum(mkt) - fixedNext * 0.3) * 1000) / cost(grade) / b.volStep) *
        b.volStep,
    );
  if (p.debt > 0 && p.cash - plannedOut > fixedNext * 2 + 20)
    repay = Math.min(p.debt, Math.floor(p.cash - plannedOut - fixedNext * 1.5));
  return clampDecision(g, i, {
    price,
    grade,
    volume,
    mkt,
    staff,
    buy,
    loan,
    repay,
    choice: botEventChoice(g, i, bot),
  });
}

/* ------------------------------------------------------------------ yakuniy tahlil */
export type Lesson = { icon: string; topic: number; text: Tri; weight: number };
/** O'yinchining 12 oylik qarorlaridan shaxsiy saboqlar (eng katta pul ta'siri bo'yicha, 4 tagacha). */
export function lessons(g: Game, i: number): Lesson[] {
  const b = bizOf(g.biz),
    p = g.players[i],
    rv = g.players[1 - i],
    s = p.stats,
    n = Math.max(1, g.history.length),
    out: Lesson[] = [];
  const margin = (s.marginSum / n) * 100,
    avgPrice = s.priceSum / n;
  if (s.lostMoney > 5)
    out.push({
      icon: '📦',
      topic: 10,
      weight: s.lostMoney,
      text: T(
        `${s.lost.toLocaleString('ru-RU')} ta mijozga xizmat ko‘rsata olmadingiz — taxminan ${Math.round(s.lostMoney)} mln so‘m foyda qo‘ldan ketdi. Talabni oldindan hisoblang va jamoa, uskuna yoki hajmni vaqtida oshiring.`,
        `You could not serve ${s.lost.toLocaleString('en-US')} customers — about ${Math.round(s.lostMoney)} mln of lost profit. Forecast demand and grow team, equipment or volume in time.`,
        `Не обслужено ${s.lost.toLocaleString('ru-RU')} клиентов — около ${Math.round(s.lostMoney)} млн упущенной прибыли.`,
      ),
    });
  if (s.wasteMoney > 5)
    out.push({
      icon: '🗑️',
      topic: 13,
      weight: s.wasteMoney,
      text: T(
        `${s.waste.toLocaleString('ru-RU')} ${b.unit[0]} ${b.kind === 'perishable' ? 'isrof bo‘ldi' : 'eskirdi'} — ${Math.round(s.wasteMoney)} mln so‘m. Hajmni o‘tgan oy savdosi va mavsumga qarab rejalashtiring.`,
        `${s.waste.toLocaleString('en-US')} ${b.unit[1]} were ${b.kind === 'perishable' ? 'wasted' : 'outdated'} — ${Math.round(s.wasteMoney)} mln. Plan volume from last month’s sales and the season.`,
        `Потери: ${s.waste.toLocaleString('ru-RU')} ${b.unit[2]} — ${Math.round(s.wasteMoney)} млн.`,
      ),
    });
  if (margin < 35)
    out.push({
      icon: '🏷️',
      topic: 11,
      weight: (35 - margin) * 1.5,
      text: T(
        `O‘rtacha marjangiz ${Math.round(margin)}% edi: har bir sotuvdan kam pul qoldi. Narxni tannarx, raqib narxi va mijoz qadrlaydigan qiymatga qarab belgilang.`,
        `Your average margin was ${Math.round(margin)}%: little was left from each sale. Price from cost, rival prices and customer value.`,
        `Средняя маржа ${Math.round(margin)}% — с каждой продажи оставалось мало.`,
      ),
    });
  if (avgPrice > 1.18 && p.last.share < 45)
    out.push({
      icon: '💸',
      topic: 11,
      weight: (avgPrice - 1) * 60,
      text: T(
        `Narxingiz bozordan ${Math.round((avgPrice - 1) * 100)}% yuqori edi va ulushingiz kamaydi. Yuqori narxni sifat, xizmat va obro‘ bilan oqlash kerak.`,
        `Your price was ${Math.round((avgPrice - 1) * 100)}% above the market and your share fell. A high price needs quality, service and reputation.`,
        `Цена выше рынка на ${Math.round((avgPrice - 1) * 100)}%, доля снизилась.`,
      ),
    });
  const totalServed = s.segServed.map((x, k) => x + rv.stats.segServed[k]);
  const sizes = b.segs.map((x) => x.size);
  const big = sizes.indexOf(Math.max(...sizes));
  const shareBig = totalServed[big] ? s.segServed[big] / totalServed[big] : 0.5;
  if (shareBig < 0.3)
    out.push({
      icon: '🎯',
      topic: 8,
      weight: (0.3 - shareBig) * 100,
      text: T(
        `Eng katta mijozlar guruhi — «${b.segs[big].name[0]}» — asosan raqibingizga ketdi (sizda ${Math.round(shareBig * 100)}%). Ular uchun to‘g‘ri kanal va to‘g‘ri taklifni toping yoki ongli ravishda boshqa guruhga ixtisoslashing.`,
        `The biggest group — “${b.segs[big].name[1]}” — went mostly to your rival (you had ${Math.round(shareBig * 100)}%). Find the right channel and offer, or specialise deliberately.`,
        `Крупнейшая группа «${b.segs[big].name[2]}» ушла к сопернику.`,
      ),
    });
  if (s.mkt > 60 && sum(p.aw) / 3 < 0.45)
    out.push({
      icon: '📣',
      topic: 8,
      weight: s.mkt * 0.2,
      text: T(
        `Reklamaga ${Math.round(s.mkt)} mln sarfladingiz, lekin sizni bilganlar kam qoldi. Bitta kanalga ko‘p pul tikishdan ko‘ra, har bir guruhga mos kanalga taqsimlash samaraliroq — har keyingi million kamroq natija beradi.`,
        `You spent ${Math.round(s.mkt)} mln on ads but awareness stayed low. Each extra million in one channel brings less; spread it across fitting channels.`,
        `Потрачено ${Math.round(s.mkt)} млн на рекламу, но узнаваемость низкая.`,
      ),
    });
  if (s.emergency > 0 || s.interest > 8)
    out.push({
      icon: '🏦',
      topic: 12,
      weight: s.interest + s.emergency * 0.3 + 5,
      text:
        s.emergency > 0
          ? T(
              `Kassa ${Math.round(s.emergency)} mln ga yetmay qolgan oylar bo‘ldi — bank 10% jarima bilan qarz berdi. Har oy kamida bir oylik doimiy xarajatga teng zaxira pul qoldiring.`,
              `Some months you ran short by ${Math.round(s.emergency)} mln and paid a 10% emergency fee. Keep at least one month of fixed costs in cash.`,
              'Не хватало денег — банк брал 10% штраф. Держите резерв.',
            )
          : T(
              `Kreditlar uchun ${Math.round(s.interest)} mln foiz to‘ladingiz. Qarz foyda keltiradigan ishga olinsa — yaxshi, kassa teshigini yamash uchun olinsa — qimmat.`,
              `You paid ${Math.round(s.interest)} mln of interest. Borrow for things that earn, not to patch holes.`,
              `Проценты по кредитам: ${Math.round(s.interest)} млн.`,
            ),
    });
  if (s.idleCash >= 4)
    out.push({
      icon: '💤',
      topic: 12,
      weight: s.idleCash * 3,
      text: T(
        `${s.idleCash} oy davomida kassada 120 mln dan ortiq pul bekor turdi. Ishlamaydigan pul o‘smaydi: sig‘im, sifat yoki yangi bozorga sarmoya qilish mumkin edi.`,
        `For ${s.idleCash} months more than 120 mln sat idle. Idle money does not grow — invest in capacity, quality or new markets.`,
        `${s.idleCash} мес. в кассе лежало больше 120 млн без дела.`,
      ),
    });
  if (p.equity > 0)
    out.push({
      icon: '🤝',
      topic: 12,
      weight: worth(p) * p.equity * 0.4,
      text: T(
        `Investor ulushi (${Math.round(p.equity * 100)}%) evaziga o‘yin oxirida ${Math.round(worth(p) * p.equity)} mln uniki bo‘ldi. Investor puli qarz emas, lekin biznes o‘sgan sari qimmatlashadi.`,
        `Your investor’s ${Math.round(p.equity * 100)}% stake took ${Math.round(worth(p) * p.equity)} mln at the end. Equity is not a loan, but it gets expensive as you grow.`,
        `Доля инвестора (${Math.round(p.equity * 100)}%) забрала ${Math.round(worth(p) * p.equity)} млн.`,
      ),
    });
  if (s.fines >= 10)
    out.push({
      icon: '⚖️',
      topic: 5,
      weight: s.fines,
      text: T(
        `Jarima va to‘lovlarga ${Math.round(s.fines)} mln ketdi. Hujjatlar, rasmiy ish haqi va bajarilgan va’dalar — eng arzon himoya.`,
        `Fines and penalties cost you ${Math.round(s.fines)} mln. Papers, official wages and kept promises are the cheapest protection.`,
        `Штрафы обошлись в ${Math.round(s.fines)} млн.`,
      ),
    });
  if (s.satSum / n < 0.5)
    out.push({
      icon: '😐',
      topic: 7,
      weight: (0.5 - s.satSum / n) * 120,
      text: T(
        'Mijozlar ko‘pincha qoniqmadi, shuning uchun doimiy mijozlar kam bo‘ldi. Qaytib kelgan mijoz — reklamasiz savdo: sifat, narx va xizmat muvozanatini toping.',
        'Customers were often unhappy, so few came back. A returning customer is a sale without ads: balance quality, price and service.',
        'Клиенты часто были недовольны — постоянных мало.',
      ),
    });
  if (s.overload >= 3)
    out.push({
      icon: '😓',
      topic: 15,
      weight: s.overload * 4,
      text: T(
        `${s.overload} oy jamoangiz haddan tashqari yuklandi: navbatlar, charchoq va sifat pasaydi. Jamoa hajmini talabga moslang.`,
        `For ${s.overload} months your team was overloaded: queues, fatigue and lower quality. Size your team to demand.`,
        `${s.overload} мес. команда была перегружена.`,
      ),
    });
  if (s.capFull >= 4 && !p.owned.cap && !p.owned.branch)
    out.push({
      icon: '🚀',
      topic: 14,
      weight: s.capFull * 5,
      text: T(
        `${s.capFull} oy sig‘imingiz to‘lib qoldi, lekin kengaymadingiz. Barqaror o‘sib borayotgan talab — kengayish uchun signal: biznes-rejada buni oldindan ko‘zda tuting.`,
        `Capacity was full for ${s.capFull} months, but you did not grow. Rising demand is a signal to expand — plan it ahead.`,
        `Мощность была заполнена ${s.capFull} мес., но вы не расширились.`,
      ),
    });
  return out.sort((x, y) => y.weight - x.weight).slice(0, 4);
}

export type Badge = { id: string; icon: string; name: Tri; text: Tri };
/** Yutuq nishonlari (o'yin oxirida). */
export function badges(g: Game, i: number): Badge[] {
  const b = bizOf(g.biz),
    p = g.players[i],
    s = p.stats,
    n = Math.max(1, g.history.length),
    out: Badge[] = [];
  if (s.debtMonths === 0 && !p.bankrupt)
    out.push({
      id: 'nodebt',
      icon: '🏦',
      name: T('Qarzsiz yo‘l', 'Debt-free', 'Без долгов'),
      text: T('Bir marta ham qarz olmadingiz.', 'You never borrowed.', 'Ни разу не брали в долг.'),
    });
  if (s.maxShare >= 60)
    out.push({
      id: 'leader',
      icon: '👑',
      name: T('Bozor yetakchisi', 'Market leader', 'Лидер рынка'),
      text: T(
        'Bir oyda mijozlarning 60% idan ko‘pi sizniki edi.',
        'Over 60% of customers in a month.',
        'Больше 60% клиентов за месяц.',
      ),
    });
  if (b.kind !== 'service' && s.volume > 0 && s.waste / s.volume < 0.04)
    out.push({
      id: 'nowaste',
      icon: '♻️',
      name: T('Isrofsiz', 'Zero waste', 'Без потерь'),
      text: T('Isrof 4% dan kam bo‘ldi.', 'Waste stayed under 4%.', 'Потери меньше 4%.'),
    });
  if (p.rep >= 72)
    out.push({
      id: 'loved',
      icon: '😍',
      name: T('Mijozlar sevimlisi', 'Customers’ favourite', 'Любимец клиентов'),
      text: T('Obro‘ingiz 72 dan yuqori.', 'Reputation above 72.', 'Репутация выше 72.'),
    });
  if (s.profitMonths >= n - 1 && n >= 12)
    out.push({
      id: 'steady',
      icon: '📈',
      name: T('Barqaror foyda', 'Steady profit', 'Стабильная прибыль'),
      text: T(
        'Deyarli har oy foyda bilan yopildi.',
        'Nearly every month ended in profit.',
        'Почти каждый месяц с прибылью.',
      ),
    });
  if (b.kind !== 'service' && s.goodPlan >= 7)
    out.push({
      id: 'planner',
      icon: '🎯',
      name: T('Aniq rejalashtiruvchi', 'Precise planner', 'Точный планировщик'),
      text: T(
        '7+ oy hajm talabga ±10% aniqlikda mos keldi.',
        'Volume matched demand within ±10% for 7+ months.',
        '7+ месяцев объём совпал со спросом.',
      ),
    });
  if (s.invest >= 40 && earned(p) > 0)
    out.push({
      id: 'investor',
      icon: '🧠',
      name: T('Sarmoya ustasi', 'Smart investor', 'Умный инвестор'),
      text: T(
        '40 mln dan ortiq sarmoya qildingiz va foydada qoldingiz.',
        'Invested 40+ mln and stayed in profit.',
        'Вложили 40+ млн и остались в прибыли.',
      ),
    });
  if (s.emergency > 0 && earned(p) > 0)
    out.push({
      id: 'phoenix',
      icon: '🔥',
      name: T('Inqirozdan chiqqan', 'Comeback', 'Камбэк'),
      text: T(
        'Kassa bo‘shab qolgan bo‘lsa ham, foydada yakunladingiz.',
        'You ran out of cash once, but finished in profit.',
        'Был кассовый разрыв, но итог в плюсе.',
      ),
    });
  if (p.skill >= 70)
    out.push({
      id: 'team',
      icon: '🤝',
      name: T('Jamoa quruvchi', 'Team builder', 'Строитель команды'),
      text: T(
        'Jamoangiz mahorati 70 dan yuqori.',
        'Team skill above 70.',
        'Мастерство команды выше 70.',
      ),
    });
  if (p.flags.official && p.flags.licensed)
    out.push({
      id: 'clean',
      icon: '📜',
      name: T('Halol biznes', 'Clean business', 'Честный бизнес'),
      text: T(
        'Rasmiy ish haqi va barcha hujjatlar joyida.',
        'Official wages and all papers in order.',
        'Официальные зарплаты и документы.',
      ),
    });
  return out;
}

/** O'yinchining strategiyasi qanday bo'ldi (yakuniy ekran uchun). */
export function strategyOf(g: Game, i: number): Tri {
  const b = bizOf(g.biz),
    s = g.players[i].stats,
    n = Math.max(1, g.history.length);
  const pr = s.priceSum / n,
    gr = s.gradeSum / n,
    seg = s.mktSeg.indexOf(Math.max(...s.mktSeg)),
    focused = Math.max(...s.mktSeg) > sum(s.mktSeg) * 0.5;
  const base: Tri =
    pr < 0.93 && gr < 0.8
      ? T('Arzon narx (xarajat yetakchiligi)', 'Low price (cost leadership)', 'Низкая цена')
      : pr > 1.08 && gr > 1.3
        ? T(
            'Sifat va premium (farqlanish)',
            'Quality and premium (differentiation)',
            'Качество и премиум',
          )
        : T(
            'Muvozanatli (o‘rta narx, o‘rta sifat)',
            'Balanced (mid price, mid quality)',
            'Сбалансированная',
          );
  return focused
    ? T(
        `${base[0]} · asosiy e’tibor: ${b.segs[seg].name[0]}`,
        `${base[1]} · focus: ${b.segs[seg].name[1]}`,
        `${base[2]} · фокус: ${b.segs[seg].name[2]}`,
      )
    : base;
}

export const LINE_NAMES: Record<string, Tri> = {
  revenue: T('Tushum', 'Revenue', 'Выручка'),
  returns: T('Qaytarilgan mahsulot', 'Refunds for faulty goods', 'Возвраты брака'),
  cogs: T('Sotilgan mahsulot tannarxi', 'Cost of goods sold', 'Себестоимость'),
  waste: T('Isrof va eskirish', 'Waste and obsolescence', 'Потери'),
  rent: T('Ijara', 'Rent', 'Аренда'),
  wages: T('Ish haqi', 'Wages', 'Зарплата'),
  utilities: T('Kommunal va xizmatlar', 'Utilities and services', 'Коммунальные и сервисы'),
  lease: T('Lizing to‘lovi', 'Lease payment', 'Лизинг'),
  marketing: T('Reklama', 'Advertising', 'Реклама'),
  hiring: T('Xodim yollash / bo‘shatish', 'Hiring / letting go', 'Найм / увольнение'),
  invest: T(
    'Investitsiya qadrsizlanishi va xizmatlar',
    'Investment write-down and services',
    'Списание вложений',
  ),
  interest: T('Kredit foizi', 'Loan interest', 'Проценты'),
  tax: T('Aylanma solig‘i (4%)', 'Turnover tax (4%)', 'Налог с оборота (4%)'),
  leak: T('Kassadan yo‘qotish', 'Missing cash', 'Пропажа из кассы'),
  baddebt: T('Qaytmagan nasiya', 'Unpaid credit', 'Невозвращённый долг'),
  penalty: T('Jarima va ta’mir', 'Penalties and repairs', 'Штрафы и ремонт'),
  event: T('Vaziyat (bir martalik)', 'Situation (one-off)', 'Ситуация'),
  emergency: T('Favqulodda qarz jarimasi', 'Emergency loan fee', 'Штраф экстренного кредита'),
};
export const FLOW_NAMES: Record<string, Tri> = {
  revenue: T('Savdodan tushgan pul', 'Cash from sales', 'Деньги от продаж'),
  collected: T('Nasiyadan qaytgan pul', 'Credit collected', 'Возврат долгов'),
  purchase: T('Xarid / ishlab chiqarish', 'Purchases / production', 'Закупка / производство'),
  marketing: T('Reklama', 'Advertising', 'Реклама'),
  fixed: T(
    'Ijara, ish haqi, kommunal, lizing',
    'Rent, wages, utilities, lease',
    'Аренда, зарплата, ком.',
  ),
  invest: T('Investitsiyalar', 'Investments', 'Инвестиции'),
  hiring: T('Yollash / bo‘shatish', 'Hiring / letting go', 'Найм / увольнение'),
  repair: T('Ta’mir', 'Repairs', 'Ремонт'),
  interest: T('Kredit foizi', 'Interest', 'Проценты'),
  tax: T('Soliq va jarimalar', 'Tax and penalties', 'Налоги и штрафы'),
  loan: T('Olingan kredit', 'Loan received', 'Получен кредит'),
  repay: T('Qarz qaytarildi', 'Debt repaid', 'Погашение долга'),
  investor: T('Investor puli', 'Investor money', 'Деньги инвестора'),
  event: T('Vaziyatlar', 'Situations', 'Ситуации'),
  emergency: T('Favqulodda qarz', 'Emergency loan', 'Экстренный кредит'),
};
