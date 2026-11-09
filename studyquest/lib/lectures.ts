/* 📄 Ma'ruzalar: administrator har bir mavzuga ma'ruza fayllarini (PDF, Word, PowerPoint) yuklaydi, talabalar dars
   oynasidagi «📄 Ma'ruza» tugmasi orqali yuklab oladi. Vercel bitta so'rovda 4,5 MB dan ortiq qabul qilmaydi —
   shuning uchun fayl 2,5 MB lik bo'laklarga bo'linib yuklanadi va yuklab olishda brauzerda qayta yig'iladi. */

export const LECTURE_CHUNK = 2.5 * 1024 * 1024;
export const LECTURE_MAX = 30 * 1024 * 1024;
export const LECTURES_PER_TOPIC = 8;

export const LECTURE_TYPES = {
  pdf: { mime: 'application/pdf', icon: '📕', label: 'PDF' },
  docx: {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    icon: '📘',
    label: 'Word',
  },
  doc: { mime: 'application/msword', icon: '📘', label: 'Word' },
  pptx: {
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    icon: '📙',
    label: 'PowerPoint',
  },
  ppt: { mime: 'application/vnd.ms-powerpoint', icon: '📙', label: 'PowerPoint' },
} as const;
export type LectureExt = keyof typeof LECTURE_TYPES;
export const LECTURE_ACCEPT = '.pdf,.docx,.doc,.pptx,.ppt';

export const lectureExt = (name: string): LectureExt | null => {
  const ext = /\.([a-z0-9]+)$/i.exec(name.trim())?.[1]?.toLowerCase();
  return ext && ext in LECTURE_TYPES ? (ext as LectureExt) : null;
};

export type Lecture = {
  id: string;
  title: string;
  name: string;
  ext: LectureExt;
  size: number;
  chunks: number;
  at: number;
};

/** 3 456 789 → «3,3 MB». */
export function fileSize(n: number) {
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  return (Math.round((n / 1024 / 1024) * 10) / 10).toString().replace('.', ',') + ' MB';
}
