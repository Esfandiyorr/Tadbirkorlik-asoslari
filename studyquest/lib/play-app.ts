/* 📱 Sayt Play Market ilovasi (TWA) ichida ochilganmi? Ilova saytni `/?src=play` manzili bilan ochadi
   (PWABuilder'da Start URL), Android esa `android-app://…` manbasini beradi. Belgi shu oynaning seansida saqlanadi
   (sessionStorage) — TWA Chrome bilan umumiy xotiradan foydalangani uchun doimiy saqlanmaydi.
   Nima uchun kerak: Google Play qoidasiga ko'ra ilova ichida raqamli mahsulot uchun tashqi to'lov usuliga yo'naltirish
   mumkin emas — shuning uchun ilovada obuna narxi va to'lov yo'riqnomasi ko'rsatilmaydi (components/premium.tsx). */
const KEY = 'sq-play';
export function isPlayApp() {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem(KEY) === '1') return true;
    const hit =
      new URLSearchParams(location.search).get('src') === 'play' ||
      document.referrer.startsWith('android-app://');
    if (hit) sessionStorage.setItem(KEY, '1');
    return hit;
  } catch {
    return false;
  }
}
