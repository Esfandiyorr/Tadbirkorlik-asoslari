/* 💼 Pullik xizmatlar: foydalanuvchi kerakli ishini yozib buyurtma beradi — buyurtmasida «🤖 Sun'iy intellekt yordamida
   tayyorlanmoqda» yozuvi chiqadi, buyurtma esa administratorga yozishma (chat) bo'lib keladi. Administrator natijani
   tayyorlab yuklaydi va yuboradi, foydalanuvchi shu yerdan yuklab oladi va baho qo'yadi. To'lov ish jarayonini
   to'xtatmaydi: foydalanuvchi «To'lov qildim» deydi, administrator tasdiqlaydi. Server — lib/server/services.ts.
   Brauzer va server uchun umumiy turlar, yo'nalishlar katalogi va fayl qoidalari shu yerda. */

export type Tri = [string, string, string];

/** Katalogdagi guruh (kartadagi kichik yorliq va saralash tugmalari). */
export const SERVICE_GROUPS = {
  study: ['O‘qish', 'Study', 'Учёба'],
  create: ['Ijod', 'Creative', 'Творчество'],
  tech: ['Texnologiya', 'Tech', 'Технологии'],
  business: ['Biznes', 'Business', 'Бизнес'],
} satisfies Record<string, Tri>;
export type ServiceGroup = keyof typeof SERVICE_GROUPS;

/** Yo'nalish. help — ilmiy ish: jamoa yozib bermaydi, yordam beradi (reja, manbalar, tahrir, rasmiylashtirish). */
export type ServiceKind = {
  id: string;
  icon: string;
  /** katalog kartasidagi katta rasm (emoji) */
  art: string;
  group: ServiceGroup;
  /** kartaning rang o'tishi: [to'q (matn ostida), och] */
  tone: [string, string];
  name: Tri;
  text: Tri;
  /** buyurtma shaklidagi «Nima kerak?» maydoni uchun misol */
  hint: Tri;
  help?: boolean;
};

export const SERVICE_KINDS: ServiceKind[] = [
  {
    id: 'taqdimot',
    icon: '🎞',
    art: '📊',
    group: 'study',
    tone: ['#c2410c', '#fb923c'],
    name: ['Taqdimot', 'Presentation', 'Презентация'],
    text: [
      'Mavzuingiz bo‘yicha chiroyli dizayndagi PowerPoint taqdimot',
      'A well-designed PowerPoint presentation on your topic',
      'Презентация PowerPoint с красивым дизайном по вашей теме',
    ],
    hint: [
      'Mavzu, slaydlar soni, til, qaysi fan uchun, o‘qituvchining talablari',
      'Topic, number of slides, language, which subject, the teacher’s requirements',
      'Тема, число слайдов, язык, предмет, требования преподавателя',
    ],
  },
  {
    id: 'kurs-ishi',
    icon: '📘',
    art: '📘',
    group: 'study',
    tone: ['#1d4ed8', '#60a5fa'],
    name: ['Kurs ishi', 'Course paper', 'Курсовая работа'],
    text: [
      'Reja, manbalar, tahrir, GOST bo‘yicha rasmiylashtirish va antiplagiat tekshiruvi',
      'Outline, sources, editing, formatting to the standard and a plagiarism check',
      'План, источники, редактура, оформление по ГОСТ и проверка на антиплагиат',
    ],
    hint: [
      'Mavzu, fan, hozir qaysi bosqichdasiz, qanday yordam kerak (reja, tahrir, rasmiylashtirish …)',
      'Topic, subject, how far you are, what help you need (outline, editing, formatting …)',
      'Тема, предмет, на каком вы этапе, какая помощь нужна (план, редактура, оформление …)',
    ],
    help: true,
  },
  {
    id: 'bmi',
    icon: '🎓',
    art: '🎓',
    group: 'study',
    tone: ['#6d28d9', '#c084fc'],
    name: ['BMI (bitiruv malakaviy ishi)', 'Graduation thesis', 'ВКР (выпускная работа)'],
    text: [
      'Reja va tuzilma, manbalar, ilmiy tahrir, rasmiylashtirish, himoya taqdimoti',
      'Structure, sources, academic editing, formatting and the defence presentation',
      'Структура, источники, научная редактура, оформление, презентация к защите',
    ],
    hint: [
      'Mavzu, yo‘nalish, ilmiy rahbar talablari, tayyor qismlar va qanday yordam kerak',
      'Topic, field, supervisor’s requirements, what is ready and what help you need',
      'Тема, направление, требования руководителя, что готово и какая помощь нужна',
    ],
    help: true,
  },
  {
    id: 'referat',
    icon: '📄',
    art: '📝',
    group: 'study',
    tone: ['#0f766e', '#2dd4bf'],
    name: ['Referat va mustaqil ish', 'Essay and assignment', 'Реферат и самостоятельная'],
    text: [
      'Reja, adabiyotlar ro‘yxati, tahrir va to‘g‘ri rasmiylashtirish',
      'Outline, a reading list, editing and correct formatting',
      'План, список литературы, редактура и правильное оформление',
    ],
    hint: [
      'Mavzu, fan, hajmi (bet), topshirish sanasi va qanday yordam kerak',
      'Topic, subject, length (pages), due date and what help you need',
      'Тема, предмет, объём (страниц), срок сдачи и какая помощь нужна',
    ],
    help: true,
  },
  {
    id: 'maqola',
    icon: '📰',
    art: '🔬',
    group: 'study',
    tone: ['#0369a1', '#38bdf8'],
    name: ['Ilmiy maqola', 'Research article', 'Научная статья'],
    text: [
      'Tahrir, annotatsiya va tarjima, jurnal talablariga moslab rasmiylashtirish',
      'Editing, abstract and translation, formatting to the journal’s rules',
      'Редактура, аннотация и перевод, оформление по требованиям журнала',
    ],
    hint: [
      'Maqola mavzusi, qaysi jurnal yoki konferensiya, til va nima qilish kerak',
      'Article topic, which journal or conference, language and what is needed',
      'Тема статьи, журнал или конференция, язык и что нужно сделать',
    ],
    help: true,
  },
  {
    id: 'kitob',
    icon: '📚',
    art: '📚',
    group: 'create',
    tone: ['#be185d', '#f472b6'],
    name: ['Kitob chiqarish', 'Book publishing', 'Издание книги'],
    text: [
      'Sahifalash, muqova dizayni, tahrir va nashrga (bosmaxonaga) tayyorlash',
      'Layout, cover design, editing and preparing the file for print',
      'Вёрстка, дизайн обложки, редактура и подготовка к печати',
    ],
    hint: [
      'Kitob nomi, hajmi, format (A5, A4 …), muqova g‘oyasi, nusxa soni',
      'Title, length, format (A5, A4 …), cover idea, number of copies',
      'Название, объём, формат (A5, A4 …), идея обложки, тираж',
    ],
  },
  {
    id: 'biznes-reja',
    icon: '💼',
    art: '💼',
    group: 'business',
    tone: ['#15803d', '#4ade80'],
    name: ['Biznes-reja', 'Business plan', 'Бизнес-план'],
    text: [
      'G‘oyangiz uchun hisob-kitobli biznes-reja: bozor, xarajat, daromad',
      'A business plan with numbers for your idea: market, costs, income',
      'Бизнес-план с расчётами для вашей идеи: рынок, затраты, доход',
    ],
    hint: [
      'Biznes g‘oyasi, shahar, boshlang‘ich sarmoya, kim uchun (bank, grant, o‘zingiz)',
      'Business idea, city, starting capital, who it is for (bank, grant, yourself)',
      'Бизнес-идея, город, стартовый капитал, для кого (банк, грант, для себя)',
    ],
  },
  {
    id: 'sayt',
    icon: '🌐',
    art: '🌐',
    group: 'tech',
    tone: ['#4338ca', '#818cf8'],
    name: ['Sayt yaratish', 'Website', 'Создание сайта'],
    text: [
      'Vizitka sayt, portfolio yoki kichik onlayn do‘kon',
      'A business-card site, portfolio or small online shop',
      'Сайт-визитка, портфолио или небольшой интернет-магазин',
    ],
    hint: [
      'Sayt nima uchun, qaysi bo‘limlar kerak, namuna saytlar, domen bormi',
      'What the site is for, which pages, example sites, do you have a domain',
      'Для чего сайт, какие разделы, примеры, есть ли домен',
    ],
  },
  {
    id: 'dizayn',
    icon: '🎨',
    art: '🎨',
    group: 'create',
    tone: ['#a21caf', '#e879f9'],
    name: ['Dizayn', 'Design', 'Дизайн'],
    text: [
      'Logotip, banner, poster, vizitka va ijtimoiy tarmoq uchun rasmlar',
      'Logo, banner, poster, business card and social media images',
      'Логотип, баннер, постер, визитка и картинки для соцсетей',
    ],
    hint: [
      'Nima kerak, o‘lcham, ranglar, matn va namuna (bo‘lsa — fayl biriktiring)',
      'What you need, size, colours, text and an example (attach a file if you have one)',
      'Что нужно, размер, цвета, текст и пример (приложите файл, если есть)',
    ],
  },
  {
    id: 'tarjima',
    icon: '🌍',
    art: '🌍',
    group: 'study',
    tone: ['#0e7490', '#22d3ee'],
    name: ['Tarjima', 'Translation', 'Перевод'],
    text: [
      'O‘zbek, rus va ingliz tillari o‘rtasida matn va hujjat tarjimasi',
      'Texts and documents between Uzbek, Russian and English',
      'Тексты и документы между узбекским, русским и английским',
    ],
    hint: [
      'Qaysi tildan qaysi tilga, hajmi, mavzusi (faylni biriktiring)',
      'From which language into which, length, subject (attach the file)',
      'С какого языка на какой, объём, тематика (приложите файл)',
    ],
  },
  {
    id: 'hujjat',
    icon: '📝',
    art: '🗂️',
    group: 'business',
    tone: ['#b45309', '#fbbf24'],
    name: ['Hujjat va rasmiylashtirish', 'Documents and formatting', 'Документы и оформление'],
    text: [
      'Word va Excel’da matnni tartiblash, jadval, rezyume, ariza va xatlar',
      'Tidy Word and Excel files, tables, CVs, applications and letters',
      'Оформление в Word и Excel, таблицы, резюме, заявления и письма',
    ],
    hint: [
      'Qanday hujjat, nima o‘zgarishi kerak, talablar (faylni biriktiring)',
      'Which document, what to change, the requirements (attach the file)',
      'Какой документ, что изменить, требования (приложите файл)',
    ],
  },
  {
    id: 'video',
    icon: '🎬',
    art: '🎬',
    group: 'create',
    tone: ['#be123c', '#fb7185'],
    name: ['Video montaj', 'Video editing', 'Видеомонтаж'],
    text: [
      'Taqdimot videosi, reklama roligi, subtitr va musiqa qo‘shish',
      'Presentation videos, promo clips, subtitles and music',
      'Видео к защите, рекламный ролик, субтитры и музыка',
    ],
    hint: [
      'Video nima haqida, davomiyligi, materiallar qayerda (havola yoki fayl)',
      'What the video is about, length, where the footage is (link or file)',
      'О чём видео, длительность, где материалы (ссылка или файл)',
    ],
  },
  {
    id: 'boshqa',
    icon: '✨',
    art: '🚀',
    group: 'business',
    tone: ['#334155', '#94a3b8'],
    name: ['Boshqa xizmat', 'Something else', 'Другая услуга'],
    text: [
      'Ro‘yxatda yo‘q ishni yozing — imkoni bo‘lsa, tayyorlab beramiz',
      'Describe work that is not listed — we will do it if we can',
      'Опишите работу, которой нет в списке, — сделаем, если сможем',
    ],
    hint: [
      'Nima kerakligini batafsil yozing',
      'Describe in detail what you need',
      'Подробно опишите, что нужно',
    ],
  },
];
export const serviceKind = (id: string) => SERVICE_KINDS.find((k) => k.id === id);

/** Administrator yo'nalish uchun yozadigan narx («50 000 so'mdan») va muddat («3–5 kun»), yoki yo'nalishni yopadi. */
export type ServiceSetting = { price?: string; days?: string; off?: boolean };
/** Katalogdagi yo'nalish: asosiy ma'lumot + administrator sozlamasi + nechta odam foydalangani / kutayotgani. */
export type ServiceCard = ServiceKind &
  ServiceSetting & {
    /** shu xizmatga buyurtma bergan foydalanuvchilar soni */
    used: number;
    /** «tez orada» paytida shu xizmatni kutayotganini bildirganlar soni */
    wants: number;
  };

/** Buyurtma holati. */
export const SERVICE_STATUSES = ['work', 'review', 'done', 'cancel'] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];
/** Buyurtma yo'li: work (tayyorlanmoqda — buyurtma administratorga keldi) → review (natija yuborildi, buyurtmachi
    tekshiradi; tuzatish so'rasa yana work) → done (qabul qilindi, baho); istalgan paytda cancel. */
export const STATUS_LABEL: Record<ServiceStatus, [string, Tri]> = {
  work: [
    '🤖',
    [
      'Sun’iy intellekt yordamida tayyorlanmoqda',
      'Being prepared with AI',
      'Готовится с помощью ИИ',
    ],
  ],
  review: ['📥', ['Tayyor — tekshiring', 'Ready — check it', 'Готово — проверьте']],
  done: ['✅', ['Yakunlandi', 'Completed', 'Завершён']],
  cancel: ['✖', ['Bekor qilingan', 'Cancelled', 'Отменён']],
};
/** Vazifa hali tugamagan (buyurtmachi bir vaqtda ko'pi bilan ACTIVE_MAX tasini ochiq tutadi). */
export const isActive = (s: ServiceStatus) => s !== 'done' && s !== 'cancel';
export const ACTIVE_MAX = 5;
/** Buyurtmachi yozadigan summa (so'm). */
export const BUDGET_MIN = 5000;
export const BUDGET_MAX = 50_000_000;
/** 150000 → «150 000 so'm». */
export const formatSum = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' so‘m';

/* ---------- 📎 fayllar ---------- */
/** Vercel bitta so'rovda 4,5 MB dan ortiq qabul qilmaydi — fayl 2,5 MB lik bo'laklarga bo'linib yuklanadi va
    yuklab olishda brauzerda qayta yig'iladi. */
export const FILE_CHUNK = 2.5 * 1024 * 1024;
/** talaba biriktiradigan fayl (namuna, talablar) va jamoa yuklaydigan tayyor ish */
export const FILE_MAX = { in: 10 * 1024 * 1024, out: 30 * 1024 * 1024 } as const;
export const FILES_PER_ORDER = { in: 3, out: 6 } as const;
/** tayyor ish topshirilgandan keyin fayllar shuncha kun saqlanadi */
export const KEEP_DAYS = 90;

export const FILE_TYPES = {
  pdf: { mime: 'application/pdf', icon: '📕' },
  docx: {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    icon: '📘',
  },
  doc: { mime: 'application/msword', icon: '📘' },
  pptx: {
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    icon: '📙',
  },
  ppt: { mime: 'application/vnd.ms-powerpoint', icon: '📙' },
  xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', icon: '📗' },
  xls: { mime: 'application/vnd.ms-excel', icon: '📗' },
  zip: { mime: 'application/zip', icon: '🗜' },
  png: { mime: 'image/png', icon: '🖼' },
  jpg: { mime: 'image/jpeg', icon: '🖼' },
  jpeg: { mime: 'image/jpeg', icon: '🖼' },
} as const;
export type FileExt = keyof typeof FILE_TYPES;
export const FILE_ACCEPT = Object.keys(FILE_TYPES)
  .map((e) => '.' + e)
  .join(',');
export const fileExt = (name: string): FileExt | null => {
  const ext = /\.([a-z0-9]+)$/i.exec(name.trim())?.[1]?.toLowerCase();
  return ext && ext in FILE_TYPES ? (ext as FileExt) : null;
};
/** 3 456 789 → «3,3 MB». */
export function fileSize(n: number) {
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  return (Math.round((n / 1024 / 1024) * 10) / 10).toString().replace('.', ',') + ' MB';
}

/** in — buyurtmachi biriktirgan, out — administrator tayyorlagan natija. */
export type OrderFile = {
  id: string;
  side: 'in' | 'out';
  name: string;
  ext: FileExt;
  size: number;
  chunks: number;
  at: number;
};
export type OrderMsg = {
  id: string;
  /** user — buyurtmachi, team — administrator */
  from: 'user' | 'team';
  text: string;
  at: number;
};

export type ServiceOrder = {
  id: string;
  /** buyurtmachi (foydalanuvchi kaliti) */
  uk: string;
  kind: string;
  title: string;
  text: string;
  /** buyurtmachi to'lay oladigan summa (so'm) */
  budget: number;
  /** talaba xohlagan muddat (YYYY-MM-DD) */
  due?: string;
  /** telefon yoki Telegram (faqat buyurtmachi va administratorga) */
  contact?: string;
  status: ServiceStatus;
  at: number;
  upd: number;
  /** buyurtmachi «To'lov qildim» degan vaqt va izohi (chek raqami) */
  paidAt?: number;
  paidNote?: string;
  /** administrator to'lovni tasdiqlagan vaqt */
  payOk?: number;
  deliveredAt?: number;
  doneAt?: number;
  /** bekor qilish sababi */
  reason?: string;
  /** natija havolasi (katta fayl, sayt manzili, Google Drive …) */
  link?: string;
  /** fayllar muddati o'tib o'chirilgan */
  expired?: boolean;
  /** buyurtmachining bahosi (1–5) va fikri */
  rating?: number;
  review?: string;
  files: OrderFile[];
  msgs: OrderMsg[];
};
/** Administrator ko'radigan vazifa: buyurtmachi ma'lumotlari bilan. */
export type AdminOrder = ServiceOrder & {
  name: string;
  group?: string;
  email?: string;
  role?: string;
};
export type ServicesView = {
  /** bo'lim ishga tushganmi; yo'q bo'lsa — «tez orada» oynasi va taklif yuborish, buyurtma qabul qilinmaydi */
  open: boolean;
  /** 🔒 bo'lim menyuda ko'rinadimi; yo'q bo'lsa — vaqtincha yopiq (faqat administrator ko'radi) */
  shown: boolean;
  catalog: ServiceCard[];
  /** xizmatlardan foydalangan / kutayotgan odamlar soni (har biri bir marta sanaladi) */
  people: number;
  fans: number;
  /** bajarilgan buyurtmalar soni */
  done: number;
  signedIn: boolean;
  /** to'lov yo'riqnomasi (faqat kirgan foydalanuvchiga) */
  how?: string;
  /** mening buyurtmalarim */
  orders?: ServiceOrder[];
};
export type ServicesAdminView = {
  open: boolean;
  shown: boolean;
  catalog: ServiceCard[];
  people: number;
  fans: number;
  how: string;
  orders: AdminOrder[];
  /** saqlangan fayllarning umumiy hajmi */
  used: number;
};
