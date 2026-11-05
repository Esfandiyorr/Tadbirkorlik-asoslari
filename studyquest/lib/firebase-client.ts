'use client';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
export function firebaseAuth() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) return null;
  const app =
    getApps()[0] ||
    initializeApp({
      apiKey,
      projectId,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  return getAuth(app);
}

/** Google/Firebase serveriga ulanib bo'lmadi (internet uzildi, tarmoq cheklovi yoki o'rnatilgan ilova ichidagi oyna). */
export const isNetworkError = (e: unknown) =>
  (e as { code?: string } | null)?.code === 'auth/network-request-failed';
export function networkMessage(lang: string) {
  return lang === 'en'
    ? 'Could not reach the Google sign-in server. Check your internet connection and try again. If the site is installed as an app, try opening it in the Chrome browser.'
    : lang === 'ru'
      ? 'Не удалось связаться с сервером входа Google. Проверьте интернет и попробуйте снова. Если сайт установлен как приложение, откройте его в браузере Chrome.'
      : 'Google kirish serveriga ulanib bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring. Sayt telefonga ilova sifatida o‘rnatilgan bo‘lsa, Chrome brauzerida ochib ko‘ring.';
}
/** Kirish kalitini olish: tarmoq bir zum uzilsa, 1,5 soniyadan keyin yana bir marta urinadi. */
export async function freshIdToken(user: { getIdToken: () => Promise<string> }, lang: string) {
  try {
    return await user.getIdToken();
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    await new Promise((r) => setTimeout(r, 1500));
    try {
      return await user.getIdToken();
    } catch (again) {
      throw isNetworkError(again) ? new Error(networkMessage(lang)) : again;
    }
  }
}
