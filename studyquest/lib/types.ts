export type Role = 'student' | 'teacher' | 'admin';
export type Lang = 'uz' | 'en' | 'ru';
export type ReadingHistory = {
  seenSlides: number;
  totalSlides: number;
  lastSlide: number;
  seconds: number;
  correctAnswers: number;
  score?: number;
  grade?: number;
  /** testdagi savollar (yoki krossvord so'zlari, masalalar) soni — 50 ball shunga bo'linadi */
  quizTotal?: number;
  /** mavzu bali qismlari: slaydlar (30), o'qish vaqti (20, 1 soat = to'liq), test (50);
   *  o'qituvchi baholaydigan topshirig'i bor mavzuda (8-mavzu) test testMax, topshiriq taskMax ball */
  parts?: { slides: number; time: number; test: number; task?: number };
  testMax?: number;
  taskMax?: number;
  status: 'new' | 'started' | 'read';
};
/** «score» — ball beriladi (due — muddat oxiri), «read» — 📖 o'qish rejimi, «locked» — 🔒 hali yopiq */
export type LessonAccess = { state: 'score' | 'read' | 'locked'; due?: number };
export type Actor = {
  id: string;
  uid: string;
  role: Role;
  name: string;
  email?: string;
  classId: string;
  academicPoints?: number;
  learnerType: 'university' | 'independent';
};
export type User = Actor & {
  mustChangePassword?: boolean;
  readingHistory?: Record<string, ReadingHistory>;
  legacyId?: string;
  legacyStatus?: string;
  legacyRegisteredAt?: number;
  academicTopics?: Record<string, Record<string, number>>;
  manualMarks?: Record<string, number>;
  xp: number;
  streak: number;
  lastStudyDay?: string;
  leaderboardVisible: boolean;
  createdAt: number;
};
export type Course = {
  id: string;
  title: string;
  description: string;
  published: boolean;
  ownerId: string;
  difficulty: string;
  category: string;
  illustration: string;
};
export type Module = { id: string; courseId: string; title: string; order: number };
export type Slide = { title: string; body: string; image?: string; video?: string };
export type Lesson = {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  order: number;
  slides: Slide[];
  slideCount: number;
  minSeconds: number;
  published: boolean;
  legacyFile?: string;
  legacyPdf?: string;
  materialId?: string;
};
export type Question = {
  id: string;
  type: 'choice' | 'boolean' | 'matching' | 'short';
  prompt: string;
  options?: string[];
  pairs?: string[];
  accepted?: string[];
  answer?: unknown;
  explanation: string;
};
export type Quiz = {
  id: string;
  lessonId: string;
  title: string;
  passingScore: number;
  attempts: number;
  timeLimit: number;
  randomize: boolean;
  questions: Question[];
};
export type Progress = {
  legacySeen?: number;
  legacySeconds?: number;
  id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  startedAt: number;
  updatedAt: number;
  seen: number[];
  last: number;
  completed: boolean;
};
export type Attempt = {
  id: string;
  userId: string;
  quizId: string;
  courseId: string;
  startedAt: number;
  submittedAt?: number;
  questionIds: string[];
  score?: number;
  correct?: number;
  passed?: boolean;
  answers?: Record<string, unknown>;
};
export type XpTransaction = {
  id: string;
  userId: string;
  courseId: string;
  kind: string;
  points: number;
  createdAt: number;
  classId: string;
};
export type Settings = {
  rewards: { lesson: number; quiz: number; perfect: number; challenge: number; course: number };
  levels: { name: string; xp: number }[];
};
export type Badge = { id: string; name: string; description: string; icon: string };
export type Data = {
  adminOnly?: boolean;
  studentPasswordSetup?: { completed: boolean; students: number; completedAt?: number };
  legacyMigration?: { students: number; syncedAt: number } | null;
  courses: Course[];
  modules: Module[];
  lessons: Lesson[];
  quizzes: Omit<Quiz, 'questions'>[];
  settings: Settings;
  badges: Badge[];
  mode: 'demo' | 'firebase' | 'legacy';
  limited?: boolean;
  serviceMessage?: string;
  user?: User;
  lessonAccess?: Record<string, LessonAccess>;
  progress?: Progress[];
  attempts?: Attempt[];
  transactions?: XpTransaction[];
  earned?: string[];
  activity?: { day: string; xp: number }[];
  notifications?: Record<string, unknown>[];
  subjects?: { id: string; title: string }[];
  classes?: { id: string; title: string; teacherId?: string }[];
  users?: User[];
  leaderboard?: { id: string; name: string; xp: number; classId: string }[];
  error?: string;
};
/** «Adminga xabar»: murojaat va administrator javobi. */
/** «Adminga xabar» suhbatidagi bitta xabar (talabaniki yoki administratorniki). */
export type SupportMessage = {
  id: string;
  /** suhbat egasi (talaba yoki o'qituvchi) */
  uid: string;
  /** kim yozgan: suhbat egasi yoki administrator/o'qituvchi (eski yozuvlarda yo'q — 'user') */
  from?: 'user' | 'staff';
  /** yozgan odamning ismi */
  name: string;
  role: string;
  /** suhbat egasining guruhi */
  group: string;
  cat: 'tech' | 'grade' | 'account' | 'idea' | 'avatar' | 'report' | 'other';
  text: string;
  at: number;
  /** suhbat egasining xabari: yuborildi → o'qildi → javob berildi */
  status: 'new' | 'read' | 'answered' | 'closed';
  /** qaysi xabarga javob (iqtibos) */
  re?: { id: string; text: string; name: string };
  /** administrator xabarida — suhbat egasining ismi */
  to?: string;
  /** eski ko'rinish: javob xabar ichida edi (o'qishda alohida xabarga aylantiriladi) */
  reply?: { text: string; at: number; by: string };
};
/** Administrator ro'yxatidagi bitta suhbat. */
export type SupportThread = {
  uid: string;
  name: string;
  group: string;
  role: string;
  last: SupportMessage;
  /** o'qilmagan xabarlar soni */
  unread: number;
  /** oxirgi xabar suhbat egasidan — javob kutyapti */
  waiting: boolean;
};
