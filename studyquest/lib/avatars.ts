/* 🎭 Avatarlar kutubxonasi (mukofot). Rasmlar: public/avatars/<id>.webp (fon olib tashlangan).
   Qahramonlar tasvirlari ularning mualliflik huquqi egalariga tegishli; saytda faqat o'quv maqsadida. */
export const AVATAR_IDS = [
  'sonic',
  'ralph',
  'po',
  'mcqueen',
  'walle',
  'minion',
  'judy',
  'bogo',
  'joy',
  'mario',
] as const;
export type AvatarId = (typeof AVATAR_IDS)[number];
/** Umumiy reytingning nechta birinchi o'rni avatar oladi. */
export const AVATAR_TOP = 10;

type Tri = readonly [string, string, string];
export const AVATARS: Record<AvatarId, { name: Tri; from: string }> = {
  sonic: { name: ['Sonik', 'Sonic', 'Соник'], from: 'Sonic the Hedgehog · Sega' },
  ralph: { name: ['Ralf', 'Ralph', 'Ральф'], from: 'Wreck-It Ralph · Disney' },
  po: { name: ['Po', 'Po', 'По'], from: 'Kung Fu Panda · DreamWorks' },
  mcqueen: {
    name: ['Chaqmoq Makkvin', 'Lightning McQueen', 'Молния Маккуин'],
    from: 'Cars · Disney/Pixar',
  },
  walle: { name: ['VALL-I', 'WALL-E', 'ВАЛЛ-И'], from: 'WALL-E · Disney/Pixar' },
  minion: { name: ['Qirol Bob', 'King Bob', 'Король Боб'], from: 'Minions · Illumination' },
  judy: { name: ['Djudi Xopps', 'Judy Hopps', 'Джуди Хоппс'], from: 'Zootopia · Disney' },
  bogo: { name: ['Boshliq Bogo', 'Chief Bogo', 'Шеф Буйволсон'], from: 'Zootopia · Disney' },
  joy: { name: ['Quvonch', 'Joy', 'Радость'], from: 'Inside Out · Disney/Pixar' },
  mario: { name: ['Mario', 'Mario', 'Марио'], from: 'Super Mario · Nintendo' },
};
export const avatarSrc = (id: string) => '/avatars/' + id + '.webp';
export const isAvatar = (id: unknown): id is AvatarId =>
  typeof id === 'string' && (AVATAR_IDS as readonly string[]).includes(id);

/** Kutubxonadagi avatar (asl 10 tasi va administrator yuklaganlari): nomi uch tilda, manbasi va rasm manzili. */
export type AvatarItem = {
  id: string;
  name: [string, string, string];
  from: string;
  src: string;
  custom?: boolean;
  off?: boolean;
};
export const BUILTIN_AVATARS: AvatarItem[] = AVATAR_IDS.map((id) => ({
  id,
  name: [...AVATARS[id].name] as [string, string, string],
  from: AVATARS[id].from,
  src: avatarSrc(id),
}));
/** Avatar kaliti: asl nomlar yoki administrator qo'shgani (c + raqam/harf). */
export const AVATAR_ID = /^[a-z][a-z0-9-]{1,39}$/;
