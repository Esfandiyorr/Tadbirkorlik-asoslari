import catalog from './catalog.generated.json';
import type { Course, Module, Lesson, Quiz, Settings, Badge, User } from './types';
export const settings: Settings = {
  rewards: { lesson: 20, quiz: 50, perfect: 30, challenge: 25, course: 200 },
  levels: [
    { name: 'Beginner', xp: 0 },
    { name: 'Explorer', xp: 500 },
    { name: 'Scholar', xp: 1500 },
    { name: 'Expert', xp: 3500 },
    { name: 'Master', xp: 7000 },
  ],
};
export const badges: Badge[] = [
  { id: 'first', name: 'First Lesson', description: 'Birinchi darsni yakunlang', icon: 'book' },
  {
    id: 'quiz',
    name: 'Quiz Champion',
    description: 'Testdan muvaffaqiyatli o‘ting',
    icon: 'trophy',
  },
  { id: 'perfect', name: 'Perfect Score', description: 'Barcha javoblar to‘g‘ri', icon: 'star' },
  { id: 'streak', name: 'Seven-Day Streak', description: '7 kun ketma-ket o‘qing', icon: 'flame' },
  {
    id: 'explorer',
    name: 'Knowledge Explorer',
    description: '5 ta darsni yakunlang',
    icon: 'compass',
  },
  {
    id: 'course',
    name: 'Course Master',
    description: 'Kursni to‘liq tugating',
    icon: 'graduation',
  },
  {
    id: 'top',
    name: 'Top Student',
    description: 'Guruh yetakchiligi o‘qituvchi tomonidan tasdiqlangan',
    icon: 'medal',
  },
  {
    id: 'teacher',
    name: 'Teacher Approved',
    description: 'O‘qituvchi tasdiqlagan yutuq',
    icon: 'medal',
  },
];
export const course: Course = {
  id: 'tad-asoslari',
  title: 'Tadbirkorlik asoslari',
  description: 'Biznes g‘oyangizni bilim va amaliyot bilan rivojlantiring.',
  published: true,
  ownerId: 'system',
  difficulty: 'Boshlang‘ich',
  category: 'Biznes',
  illustration: 'business',
};
const groups = [
  ['intro', 'Tadbirkorlikka kirish', ['m1']],
  ['ideas', 'Biznes g‘oyalar', ['m2', 'm3']],
  ['market', 'Bozorni o‘rganish', ['m7']],
  ['model', 'Biznes modellari', ['m6']],
  ['marketing', 'Marketing va taqdimot', ['m8', 'm9']],
  [
    'finance',
    'Moliya va biznes boshqaruvi',
    ['m4', 'm5', 'm10', 'm11', 'm12', 'm13', 'm14', 'm15'],
  ],
] as const;
export const modules: Module[] = groups.map(([id, title], i) => ({
  id,
  courseId: course.id,
  title,
  order: i,
}));
export const lessons: Lesson[] = catalog.topics.map((t, i) => ({
  id: t.id,
  courseId: course.id,
  moduleId: groups.find((g) => (g[2] as readonly string[]).includes(t.id))?.[0] || 'intro',
  title: t.title.replace(/^M\d+\s*·\s*/, ''),
  order: i,
  slides: [],
  slideCount: t.slides,
  minSeconds: 60,
  published: true,
  legacyFile: t.file,
  ...(t.pdf ? { legacyPdf: t.pdf } : {}),
}));
export const quiz: Quiz = {
  id: 'entrepreneurship-check',
  lessonId: 'm7',
  title: 'CRM asoslari: tezkor tekshiruv',
  passingScore: 70,
  attempts: 3,
  timeLimit: 300,
  randomize: true,
  questions: [
    {
      id: 'q1',
      type: 'choice',
      prompt: 'CRM ning asosiy g‘oyasi nima?',
      options: [
        'Mijoz haqidagi barcha ma’lumot bitta joyda turadi',
        'Ofis uchun eng qimmat kompyuterlar sotib olinadi',
        'Har kuni barcha mijozlarga bir xil reklama yuboriladi',
      ],
      answer: 'Mijoz haqidagi barcha ma’lumot bitta joyda turadi',
      explanation:
        'CRM — strategiya, jarayon va texnologiya; mijoz tarixi har bir xodimga ko‘rinadi.',
    },
    {
      id: 'q2',
      type: 'boolean',
      prompt: 'Lid — bu allaqachon bir necha marta xarid qilgan doimiy mijoz.',
      answer: false,
      explanation: 'Lid — qiziqish bildirgan, lekin hali tekshirilmagan potensial mijoz.',
    },
    {
      id: 'q3',
      type: 'matching',
      prompt: 'Ko‘rsatkichlarni ularning ma’nosi bilan moslang.',
      pairs: ['LTV', 'CAC', 'NPS'],
      options: [
        'Mijozning butun munosabat davomidagi qiymati',
        'Bitta yangi mijozni jalb qilish narxi',
        'Mijozlarning tavsiya qilishga tayyorligi',
      ],
      answer: {
        LTV: 'Mijozning butun munosabat davomidagi qiymati',
        CAC: 'Bitta yangi mijozni jalb qilish narxi',
        NPS: 'Mijozlarning tavsiya qilishga tayyorligi',
      },
      explanation: 'Sog‘lom biznesda odatda LTV ÷ CAC ≥ 3 bo‘ladi.',
    },
    {
      id: 'q4',
      type: 'short',
      prompt:
        'Lid paydo bo‘lishidan bitim yopilgunicha bo‘lgan bosqichlar qanday ataladi? (ikki so‘z)',
      accepted: ['sotuv voronkasi', 'savdo voronkasi', 'voronka', 'sales funnel'],
      explanation:
        'Sotuv voronkasi har bosqichda qancha mijoz qolishini (konversiyani) ko‘rsatadi.',
    },
  ],
};
export const demoUsers: User[] = [
  ['demo-student', 'Madina Ergasheva', 'student'],
  ['demo-teacher', 'Isfandiyor Sayfiddinov', 'teacher'],
  ['demo-admin', 'Platforma administratori', 'admin'],
].map(([id, name, role]) => ({
  id,
  uid: id,
  name,
  role: role as User['role'],
  classId: role === 'student' ? 'AP-223' : '',
  learnerType: 'university',
  xp: 0,
  streak: 0,
  leaderboardVisible: true,
  createdAt: Date.now(),
}));
export { catalog };
