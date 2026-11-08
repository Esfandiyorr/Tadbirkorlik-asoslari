/* 🎨 8-mavzu topshirig'i «Biznesingiz uchun logotip»: har bir talabaga alohida biznes beriladi (nomi, faoliyati,
   mijozlari, xarakteri va logotip qayerda ishlatilishi). Talaba logotip chizib yuklaydi va ta'rif yozadi; sun'iy
   intellekt 5 mezon bo'yicha 10 ballik baho va maslahat beradi, o'qituvchi yakuniy bahoni tasdiqlaydi yoki o'zgartiradi.
   Havza: 42 biznes × 3 nom × 2 mijoz guruhi × 3 xarakter = 756 xil topshiriq — bir guruhda biznes takrorlanmaydi. */

export const LOGO_TOPIC = 'm8';
export const LOGO_MAX_TRIES = 3;
export const LOGO_DESC_MIN = 80;
export const LOGO_DESC_MAX = 1500;
export const LOGO_MAX_SCORE = 10;

export type Character = { uz: string; en: string };
export const CHARACTERS: Character[] = [
  { uz: 'ishonchli, an’anaviy, iliq', en: 'trustworthy, traditional, warm' },
  { uz: 'zamonaviy, tezkor, yosh', en: 'modern, fast, young' },
  { uz: 'nafis, premium, hashamatli', en: 'elegant, premium, luxurious' },
  { uz: 'do‘stona, quvnoq, rang-barang', en: 'friendly, cheerful, colourful' },
  { uz: 'tabiiy, ekologik, sog‘lom', en: 'natural, eco-friendly, healthy' },
  { uz: 'aniq, texnologik, tartibli', en: 'precise, technological, orderly' },
  { uz: 'kuchli, dinamik, g‘ayratli', en: 'strong, dynamic, energetic' },
  { uz: 'milliy, madaniy, faxrli', en: 'national, cultural, proud' },
];

export type Business = {
  k: string;
  icon: string;
  kind: string;
  what: string;
  names: [string, string, string];
  aud: [string, string];
  ch: [number, number, number];
  use: string;
};

export const BUSINESSES: Business[] = [
  {
    k: 'non',
    icon: '🥖',
    kind: 'Tandir non sexi',
    what: 'tandirda non, patir va somsa pishiradi',
    names: ['Zarafshon non', 'Oltin bug‘doy', 'Termiz tandiri'],
    aud: ['mahalladagi oilalar', 'kafe va restoranlar (ulgurji)'],
    ch: [0, 7, 3],
    use: 'non qopi, do‘kon peshlavhasi va yetkazish mashinasi',
  },
  {
    k: 'qahva',
    icon: '☕',
    kind: 'Qahvaxona',
    what: 'qahva, choy, shirinliklar va o‘qish uchun sokin zal',
    names: ['Bug‘doy qahva', 'Surxon Coffee', 'Kitob va qahva'],
    aud: ['talabalar', 'ofis xodimlari'],
    ch: [1, 3, 2],
    use: 'stakan, menyu va Instagram sahifasi',
  },
  {
    k: 'gul',
    icon: '💐',
    kind: 'Gul do‘koni',
    what: 'guldastalar va bayram bezaklari, uyga yetkazib berish bilan',
    names: ['Lola gullari', 'Bahor guli', 'Gulzor'],
    aud: ['yigitlar va oilalar', 'to‘y va tadbir tashkilotchilari'],
    ch: [2, 3, 4],
    use: 'qadoq lentasi, kichik kartochka va Telegram kanal',
  },
  {
    k: 'mebel',
    icon: '🪑',
    kind: 'Mebel ustaxonasi',
    what: 'buyurtma asosida yog‘och mebel yasaydi',
    names: ['Chinor mebel', 'Usta Karim', 'Yog‘och uy'],
    aud: ['yosh oilalar', 'ofis va maktablar'],
    ch: [0, 2, 4],
    use: 'mebel yorlig‘i, katalog va yuk mashinasi',
  },
  {
    k: 'avtoyuvish',
    icon: '🚗',
    kind: 'Avtomobil yuvish shoxobchasi',
    what: 'tez yuvish, salon tozalash va bug‘ bilan yuvish',
    names: ['Toza yo‘l', 'Ko‘pik', 'Yaltiroq'],
    aud: ['taksi haydovchilari', 'shaxsiy avtomobil egalari'],
    ch: [1, 6, 3],
    use: 'peshlavha, xodimlar formasi va chegirma kartasi',
  },
  {
    k: 'it',
    icon: '💻',
    kind: 'IT o‘quv markazi',
    what: 'dasturlash, dizayn va robototexnika kurslari',
    names: ['Kod akademiyasi', 'Raqamli avlod', 'ByteTermiz'],
    aud: ['maktab o‘quvchilari (12–17 yosh)', 'ish izlayotgan yoshlar'],
    ch: [5, 1, 3],
    use: 'sertifikat, sayt va futbolkalar',
  },
  {
    k: 'til',
    icon: '🗣',
    kind: 'Ingliz tili kursi',
    what: 'IELTS va so‘zlashuv kurslari',
    names: ['Speak Up Termiz', 'Til ko‘prigi', 'Global so‘z'],
    aud: ['abituriyentlar', 'xorijda ishlamoqchi bo‘lganlar'],
    ch: [1, 0, 3],
    use: 'daftar, sertifikat va Instagram',
  },
  {
    k: 'fitnes',
    icon: '🏋️',
    kind: 'Fitnes zal',
    what: 'trenajyorlar, guruh mashg‘ulotlari va shaxsiy murabbiy',
    names: ['Temir iroda', 'Sog‘lom Termiz', 'Pulse'],
    aud: ['18–35 yoshli yigitlar', 'ayollar (alohida zal)'],
    ch: [6, 4, 1],
    use: 'abonement kartasi, sport sumka va peshlavha',
  },
  {
    k: 'oyinchoq',
    icon: '🧸',
    kind: 'Bolalar o‘yinchoqlari do‘koni',
    what: 'rivojlantiruvchi o‘yinchoqlar va konstruktorlar',
    names: ['Quvnoq olam', 'Ayiqcha', 'Kichkintoy'],
    aud: ['yosh ota-onalar', 'bobo-buvilar (sovg‘a uchun)'],
    ch: [3, 4, 0],
    use: 'qadoq qutisi, sovg‘a paketi va vitrina',
  },
  {
    k: 'atelye',
    icon: '🧵',
    kind: 'Milliy liboslar ateli',
    what: 'atlas va adras liboslar tikadi',
    names: ['Atlas nafosati', 'Sohibjamol', 'Adras uyi'],
    aud: ['kelinlar va to‘y liboslari', 'chet ellik sayyohlar'],
    ch: [7, 2, 0],
    use: 'kiyim yorlig‘i, sovg‘a qutisi va sayt',
  },
  {
    k: 'asal',
    icon: '🍯',
    kind: 'Asalarichilik xo‘jaligi',
    what: 'tog‘ asali va asalari mahsulotlari',
    names: ['Boysun asali', 'Tog‘ guli', 'Arichilar'],
    aud: ['sog‘lom turmush tarafdorlari', 'xorijiy xaridorlar (eksport)'],
    ch: [4, 0, 7],
    use: 'shisha banka yorlig‘i, qopqoq va marketpleys sahifasi',
  },
  {
    k: 'qoqi',
    icon: '🍑',
    kind: 'Quritilgan meva korxonasi',
    what: 'o‘rik, mayiz va qovun qoqisi',
    names: ['Surxon quyoshi', 'Shirin vodiy', 'Oltin o‘rik'],
    aud: ['supermarketlar', 'chet el ulgurji xaridorlari'],
    ch: [4, 7, 2],
    use: 'qadoq paket, karton quti va ko‘rgazma stendi',
  },
  {
    k: 'vet',
    icon: '🐾',
    kind: 'Veterinariya klinikasi',
    what: 'uy hayvonlari va chorva mollarini davolash',
    names: ['Do‘st panja', 'VetSalomat', 'Chorva shifo'],
    aud: ['mushuk va it egalari', 'fermerlar'],
    ch: [0, 3, 5],
    use: 'peshlavha, retsept blanki va chaqiruv mashinasi',
  },
  {
    k: 'tish',
    icon: '🦷',
    kind: 'Stomatologiya klinikasi',
    what: 'tish davolash, protez va oqartirish',
    names: ['Oq tabassum', 'DentaPlus', 'Inju tish'],
    aud: ['bolalar va ularning ota-onalari', 'kattalar (estetik xizmat)'],
    ch: [5, 0, 2],
    use: 'peshlavha, xodimlar kiyimi va eslatma SMS',
  },
  {
    k: 'sayohat',
    icon: '🏛',
    kind: 'Sayyohlik agentligi',
    what: 'Surxondaryoning tarixiy joylariga (Fayoztepa, Qoratepa, Qadimiy Termiz) sayohatlar',
    names: ['Qadimiy Termiz', 'Buddaviy yo‘l', 'Surxon safari'],
    aud: ['chet ellik sayyohlar', 'maktab va talabalar ekskursiyalari'],
    ch: [7, 1, 2],
    use: 'avtobus, bukletlar va sayt',
  },
  {
    k: 'mehmon',
    icon: '🏡',
    kind: 'Mehmon uyi',
    what: 'oilaviy mehmon uyi va milliy nonushta',
    names: ['Oqsaroy mehmon uyi', 'Bog‘i Eram', 'Termiz darvozasi'],
    aud: ['xorijiy sayyohlar (backpackerlar)', 'xizmat safaridagi mutaxassislar'],
    ch: [0, 7, 2],
    use: 'bron qilish sahifasi, kalit taqinchog‘i va peshlavha',
  },
  {
    k: 'lavash',
    icon: '🌯',
    kind: 'Fast-food (lavash va burger)',
    what: 'tez tayyorlanadigan taomlar, kechasi ham ochiq',
    names: ['Lavash Express', 'Olov grill', 'Tungi oshxona'],
    aud: ['talabalar', 'taksi haydovchilari'],
    ch: [1, 6, 3],
    use: 'qadoq qog‘ozi, stakan va yetkazish sumkasi',
  },
  {
    k: 'choyxona',
    icon: '🫖',
    kind: 'Choyxona',
    what: 'palov, choy va milliy taomlar',
    names: ['Oqsoqol choyxonasi', 'Sharq dasturxoni', 'Ko‘k choynak'],
    aud: ['mahalla erkaklari', 'oilaviy tadbirlar'],
    ch: [7, 0, 3],
    use: 'peshlavha, menyu va dasturxon',
  },
  {
    k: 'kitob',
    icon: '📚',
    kind: 'Kitob do‘koni',
    what: 'badiiy va o‘quv kitoblar, kitobxonlar klubi',
    names: ['Kitob olami', 'Sahifa', 'Ilm ziyo'],
    aud: ['talabalar', 'bolalar va ota-onalar'],
    ch: [0, 3, 5],
    use: 'paket, xatcho‘p va Instagram',
  },
  {
    k: 'telefon',
    icon: '📱',
    kind: 'Telefon ta’mirlash ustaxonasi',
    what: 'ekran almashtirish, batareya va dasturiy xizmat',
    names: ['Tez usta', 'MobiFix', 'Ekran shifo'],
    aud: ['talabalar', 'keksalar (oddiy va ishonchli xizmat)'],
    ch: [5, 1, 0],
    use: 'kafolat taloni, stiker va peshlavha',
  },
  {
    k: 'velo',
    icon: '🚲',
    kind: 'Velosiped va samokat ijarasi',
    what: 'shahar bo‘ylab soatbay ijara',
    names: ['Pedal', 'Yashil yo‘l', 'Termiz Bike'],
    aud: ['yoshlar', 'sayyohlar'],
    ch: [4, 1, 3],
    use: 'velosiped ramasi, mobil ilova belgisi va to‘xtash joyi',
  },
  {
    k: 'kir',
    icon: '🧺',
    kind: 'Kir yuvish va kimyoviy tozalash',
    what: 'kiyim, gilam va parda tozalash, olib ketib-keltirish bilan',
    names: ['Oppoq', 'Toza kiyim', 'Ko‘pik servis'],
    aud: ['band ishlaydigan oilalar', 'mehmonxonalar'],
    ch: [5, 4, 1],
    use: 'paket, kvitansiya va yetkazish mashinasi',
  },
  {
    k: 'foto',
    icon: '📷',
    kind: 'Fotostudiya',
    what: 'portret, to‘y va mahsulot suratlari',
    names: ['Kadr', 'Yorug‘ lahza', 'Foto Surxon'],
    aud: ['yangi turmush qurganlar', 'onlayn do‘konlar (mahsulot surati)'],
    ch: [2, 1, 3],
    use: 'suratlardagi suv belgisi, sayt va vizitka',
  },
  {
    k: 'toyxona',
    icon: '🎉',
    kind: 'To‘yxona',
    what: 'to‘y va tadbirlar uchun zal, oshpaz va bezak',
    names: ['Saodat saroyi', 'Gulshan to‘yxonasi', 'Oltin zal'],
    aud: ['kelin-kuyov oilalari', 'korporativ tadbirlar'],
    ch: [2, 7, 0],
    use: 'taklifnoma, peshlavha va video intro',
  },
  {
    k: 'tort',
    icon: '🎂',
    kind: 'Tort va shirinliklar ustaxonasi',
    what: 'buyurtma asosida tortlar va pishiriqlar',
    names: ['Shirin orzu', 'Asal tort', 'Qandolat uyi'],
    aud: ['tug‘ilgan kun tayyorlayotgan ota-onalar', 'kafe va restoranlar'],
    ch: [3, 2, 0],
    use: 'tort qutisi, stiker va Instagram',
  },
  {
    k: 'sut',
    icon: '🥛',
    kind: 'Organik sut mahsulotlari fermasi',
    what: 'sut, qatiq, suzma va pishloq',
    names: ['Sof sut', 'Yaylov', 'Ona sigir'],
    aud: ['yosh onalar', 'do‘konlar va maktab oshxonalari'],
    ch: [4, 0, 3],
    use: 'idish yorlig‘i, quti va yuk mashinasi',
  },
  {
    k: 'issiqxona',
    icon: '🍅',
    kind: 'Issiqxona xo‘jaligi',
    what: 'qishda pomidor va bodring yetishtiradi',
    names: ['Yashil vodiy', 'Qishki hosil', 'Termiz agro'],
    aud: ['bozor ulgurjichilari', 'qo‘shni davlatlarga eksport'],
    ch: [4, 5, 6],
    use: 'karton quti, sertifikat va yuk mashinasi',
  },
  {
    k: 'kulol',
    icon: '🏺',
    kind: 'Kulolchilik ustaxonasi',
    what: 'qo‘lda yasalgan lagan, kosa va suvenirlar',
    names: ['Usta loy', 'Surxon sopol', 'Ko‘k kosa'],
    aud: ['sayyohlar', 'restoranlar (milliy idishlar)'],
    ch: [7, 0, 2],
    use: 'mahsulot tamg‘asi, sovg‘a qutisi va ko‘rgazma',
  },
  {
    k: 'gilam',
    icon: '🧶',
    kind: 'Gilam to‘qish korxonasi',
    what: 'qo‘lda to‘qilgan gilam va sholchalar',
    names: ['Naqsh', 'Ipak yo‘li gilami', 'Bobomeros'],
    aud: ['uyini bezatayotgan oilalar', 'xorijiy kolleksionerlar'],
    ch: [7, 2, 0],
    use: 'gilam yorlig‘i, katalog va sayt',
  },
  {
    k: 'sovun',
    icon: '🧼',
    kind: 'Tabiiy sovun va kosmetika',
    what: 'o‘simlik moylaridan qo‘lda sovun va kremlar',
    names: ['Rayhon', 'Sof teri', 'Tabiat sirlari'],
    aud: ['yosh qizlar va ayollar', 'sovg‘a sotib oluvchilar'],
    ch: [4, 2, 3],
    use: 'qadoq qog‘ozi, yorliq va Instagram',
  },
  {
    k: 'bogcha',
    icon: '🎈',
    kind: 'Xususiy bolalar bog‘chasi',
    what: '3–6 yoshli bolalar uchun ingliz tili va rivojlantiruvchi mashg‘ulotlar',
    names: ['Quyoshcha', 'Bilimdon bolajon', 'Kamalak'],
    aud: ['ishlaydigan yosh ota-onalar', 'bolasiga chet tili o‘rgatmoqchi oilalar'],
    ch: [3, 0, 4],
    use: 'bolalar formasi, avtobus va darvoza peshlavhasi',
  },
  {
    k: 'dorixona',
    icon: '💊',
    kind: 'Dorixona',
    what: 'dorilar, vitaminlar va tibbiy buyumlar, 24 soat ochiq',
    names: ['Shifo dorixonasi', 'Salomatlik+', 'Davo'],
    aud: ['keksalar', 'yosh oilalar (bolalar dorilari)'],
    ch: [0, 5, 4],
    use: 'peshlavha, paket va chek',
  },
  {
    k: 'optika',
    icon: '👓',
    kind: 'Optika saloni',
    what: 'ko‘zoynak, linza va ko‘rish tekshiruvi',
    names: ['Aniq nigoh', 'Ko‘z nuri', 'Optima'],
    aud: ['talabalar va o‘quvchilar', 'keksalar'],
    ch: [5, 2, 1],
    use: 'ko‘zoynak g‘ilofi, salfetka va peshlavha',
  },
  {
    k: 'ev',
    icon: '⚡',
    kind: 'Elektromobil quvvatlash stansiyasi',
    what: 'shahar va trassada tez quvvatlash',
    names: ['Volt yo‘l', 'Yashil quvvat', 'Charge UZ'],
    aud: ['elektromobil egalari', 'taksi parklari'],
    ch: [5, 4, 1],
    use: 'stansiya ustuni, mobil ilova belgisi va yo‘l ko‘rsatkichi',
  },
  {
    k: 'quyosh',
    icon: '☀️',
    kind: 'Quyosh panellarini o‘rnatish xizmati',
    what: 'uy va fermalarga quyosh elektr stansiyasi o‘rnatadi',
    names: ['Quyosh energiya', 'Surxon Solar', 'Nur uy'],
    aud: ['xususiy uy egalari', 'fermer xo‘jaliklari'],
    ch: [4, 5, 0],
    use: 'furgon, kafolat hujjati va sayt',
  },
  {
    k: 'qurilish',
    icon: '🧱',
    kind: 'Qurilish materiallari do‘koni',
    what: 'g‘isht, sement, bo‘yoq va asboblar',
    names: ['Mustahkam', 'Usta bozor', 'Poydevor'],
    aud: ['uy quruvchilar', 'qurilish brigadalari'],
    ch: [6, 0, 5],
    use: 'yuk mashinasi, kaska va peshlavha',
  },
  {
    k: 'logistika',
    icon: '🚚',
    kind: 'Yuk tashish kompaniyasi',
    what: 'viloyatlararo va xalqaro yuk tashish',
    names: ['Termiz Trans', 'Chegara ekspress', 'Karvon'],
    aud: ['savdo korxonalari', 'fermerlar'],
    ch: [6, 0, 5],
    use: 'tirkama, hujjatlar va xodimlar formasi',
  },
  {
    k: 'kiyim',
    icon: '👗',
    kind: 'Onlayn kiyim do‘koni',
    what: 'yoshlar uchun zamonaviy kiyimlar, Telegram orqali sotuv',
    names: ['Trend Termiz', 'Style Box', 'Libos'],
    aud: ['16–25 yoshli qizlar', '16–25 yoshli yigitlar'],
    ch: [1, 2, 3],
    use: 'paket, Telegram avatarkasi va kiyim yorlig‘i',
  },
  {
    k: 'zoo',
    icon: '🐠',
    kind: 'Uy hayvonlari do‘koni',
    what: 'yem, akvarium va aksessuarlar',
    names: ['Mushukcha', 'Zoo dunyo', 'Baliqcha'],
    aud: ['bolali oilalar', 'it va qush boquvchilar'],
    ch: [3, 4, 0],
    use: 'paket, peshlavha va Instagram',
  },
  {
    k: 'musiqa',
    icon: '🎻',
    kind: 'Musiqa maktabi',
    what: 'dutor, rubob, fortepiano va vokal darslari',
    names: ['Navo', 'Dutor sadosi', 'Ohang'],
    aud: ['6–14 yoshli bolalar', 'kattalar (sevimli mashg‘ulot)'],
    ch: [7, 2, 3],
    use: 'afisha, sertifikat va sahna banneri',
  },
  {
    k: 'salon',
    icon: '💅',
    kind: 'Go‘zallik saloni',
    what: 'soch turmagi, manikyur va kelin pardozi',
    names: ['Malika', 'Nafis', 'Gulruh'],
    aud: ['kelinlar', 'ishlaydigan ayollar'],
    ch: [2, 3, 1],
    use: 'peshlavha, vizitka va Instagram',
  },
  {
    k: 'barber',
    icon: '💈',
    kind: 'Sartaroshxona',
    what: 'erkaklar soch turmagi va soqol olish',
    names: ['Usta Bobur', 'Barber Termiz', 'Qaychi'],
    aud: ['16–30 yoshli yigitlar', 'otalar va o‘g‘illar'],
    ch: [6, 1, 0],
    use: 'peshlavha, Instagram va chegirma kartasi',
  },
];

export type Brief = {
  code: string;
  k: string;
  icon: string;
  kind: string;
  what: string;
  name: string;
  aud: string;
  character: Character;
  use: string;
};

/** «non:1:0:2» → biznes ma'lumoti (nom, mijozlar, xarakter); noto'g'ri kod — null. */
export function briefOf(code: string): Brief | null {
  const [k, n, a, c] = code.split(':');
  const b = BUSINESSES.find((x) => x.k === k);
  const ni = Number(n),
    ai = Number(a),
    ci = Number(c);
  if (!b || !(ni in b.names) || !(ai in b.aud) || !(ci in b.ch)) return null;
  return {
    code,
    k,
    icon: b.icon,
    kind: b.kind,
    what: b.what,
    name: b.names[ni],
    aud: b.aud[ai],
    character: CHARACTERS[b.ch[ci]],
    use: b.use,
  };
}

/** Yangi topshiriq: guruhda eng kam berilgan biznes, keyin umuman eng kam ishlatilgan va hali berilmagan birikma.
 *  used — allaqachon berilgan kodlar va ularning guruhi; rnd — 0..1 tasodifiy son manbai (sinovlarda doimiy). */
export function pickBrief(
  used: { code: string; group: string }[],
  group: string,
  rnd: () => number = Math.random,
): string {
  const taken = new Set(used.map((u) => u.code));
  const count = (k: string, g?: string) =>
    used.filter((u) => u.code.split(':')[0] === k && (g === undefined || u.group === g)).length;
  const score = (b: Business) => count(b.k, group) * 1000 + count(b.k);
  const best = Math.min(...BUSINESSES.map(score));
  const pool = BUSINESSES.filter((b) => score(b) === best);
  const b = pool[Math.floor(rnd() * pool.length) % pool.length];
  const combos: string[] = [];
  for (let n = 0; n < 3; n++)
    for (let a = 0; a < 2; a++) for (let c = 0; c < 3; c++) combos.push([b.k, n, a, c].join(':'));
  const free = combos.filter((x) => !taken.has(x));
  const list = free.length ? free : combos;
  return list[Math.floor(rnd() * list.length) % list.length];
}

export type LogoParts = {
  fit: number;
  simple: number;
  legible: number;
  color: number;
  desc: number;
};
export const LOGO_CRITERIA: {
  key: keyof LogoParts;
  max: number;
  uz: string;
  en: string;
  ru: string;
}[] = [
  {
    key: 'fit',
    max: 3,
    uz: 'Biznesga, mijozlarga va xarakterga mosligi',
    en: 'Fit with the business, customers and character',
    ru: 'Соответствие бизнесу, клиентам и характеру',
  },
  {
    key: 'simple',
    max: 2,
    uz: 'Soddalik va esda qolishi',
    en: 'Simplicity and memorability',
    ru: 'Простота и запоминаемость',
  },
  {
    key: 'legible',
    max: 2,
    uz: 'O‘qilishi, kichik o‘lchamda va oq-qorada ishlashi',
    en: 'Legibility, working small and in black and white',
    ru: 'Читаемость, работа в малом размере и в ч/б',
  },
  {
    key: 'color',
    max: 1,
    uz: 'Rang va kompozitsiya',
    en: 'Colour and composition',
    ru: 'Цвет и композиция',
  },
  {
    key: 'desc',
    max: 2,
    uz: 'Ta’rif: g‘oya aniq va asosli tushuntirilgan',
    en: 'Description: a clear, well-argued idea',
    ru: 'Описание: ясная и обоснованная идея',
  },
];

export type LogoAi = {
  score: number;
  parts: LogoParts;
  summary: string;
  good: string[];
  fix: string[];
  notLogo?: boolean;
  copied?: string;
  model: string;
  at: number;
};
export type LogoTaskStatus = 'new' | 'pending' | 'graded' | 'queued' | 'failed';
/** Talaba ko'radigan holat. */
export type LogoTaskView = {
  brief: Brief;
  status: LogoTaskStatus;
  img?: string;
  desc?: string;
  sentAt?: number;
  ai?: LogoAi;
  tries: { at: number; score: number }[];
  left: number;
  best?: number;
  final?: { score: number; by: string; at: number; note?: string };
  error?: string;
  open: boolean;
  aiReady: boolean;
};
/** O'qituvchi ro'yxatidagi qator. */
export type LogoTaskRow = Omit<LogoTaskView, 'open' | 'aiReady'> & {
  uid: string;
  name: string;
  group: string;
  extra: number;
};
