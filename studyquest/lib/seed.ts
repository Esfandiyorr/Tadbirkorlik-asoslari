import { crmMeta } from './crm';
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
export const lessons: Lesson[] = catalog.topics.map((t, i) =>
  crmMeta({
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
  }),
);
export const quiz: Quiz = {
  id: 'entrepreneurship-check',
  lessonId: 'm7',
  title: 'Mijoz va bozorni tushunish',
  passingScore: 70,
  attempts: 3,
  timeLimit: 300,
  randomize: true,
  questions: [
    {
      id: 'q1',
      type: 'choice',
      prompt: 'Biznes g‘oyani tekshirishda avval nima o‘rganiladi?',
      options: ['Mijozning haqiqiy muammosi', 'Ofis bezagi', 'Eng qimmat uskuna'],
      answer: 'Mijozning haqiqiy muammosi',
      explanation: 'Avval muammo va unga bo‘lgan talab tekshiriladi.',
    },
    {
      id: 'q2',
      type: 'boolean',
      prompt: 'SAM — butun dunyodagi barcha xaridorlar soni.',
      answer: false,
      explanation: 'SAM — biznesingiz xizmat ko‘rsata oladigan bozor qismi.',
    },
    {
      id: 'q3',
      type: 'matching',
      prompt: 'Atamalarni ularning ma’nosi bilan moslang.',
      pairs: ['TAM', 'SAM', 'SOM'],
      options: [
        'Umumiy mumkin bo‘lgan bozor',
        'Xizmat ko‘rsatish mumkin bo‘lgan bozor',
        'Amalda egallash rejalashtirilgan bozor',
      ],
      answer: {
        TAM: 'Umumiy mumkin bo‘lgan bozor',
        SAM: 'Xizmat ko‘rsatish mumkin bo‘lgan bozor',
        SOM: 'Amalda egallash rejalashtirilgan bozor',
      },
      explanation: 'Bozor umumiy imkoniyatdan amaliy rejangizgacha torayadi.',
    },
    {
      id: 'q4',
      type: 'short',
      prompt: 'Mijoz bilan muammoni o‘rganish uchun o‘tkaziladigan suhbat qanday ataladi?',
      accepted: ['intervyu', 'mijoz intervyusi', 'interview'],
      explanation: 'Mijoz intervyusi haqiqiy ehtiyoj va tajribani bilishga yordam beradi.',
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
