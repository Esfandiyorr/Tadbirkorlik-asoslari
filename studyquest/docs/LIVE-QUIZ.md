# Jonli test: kirish va server tekshiruvi

Asosiy manzil: `/#arena/play/live`. Arena kartasi, e’lonlar va eski `arena.html#/live`, `/legacy/arena.html#/live` havolalari shu sahnaga olib keladi. Sahna arenaning o‘z CSS’i bilan ko‘rsatiladi; chiqish tugmasi `#arena` ro‘yxatiga qaytaradi.

## Kim qatnashadi

- Saytga kirgan talaba, guruhsiz yoki mustaqil o‘quvchi, o‘qituvchi va administrator.
- Brauzer egaligi tasdiqlangan, universitet tasdig‘ini kutayotgan eski hisob. Bu istisno faqat jonli testga tegishli; boshqa dars yoki boshqaruv ruxsatini bermaydi.
- Hisobsiz mehmon: lobbi ochilgach 2–60 belgili ism bilan qo‘shiladi. 256-bit tasodifiy, `HttpOnly`, `SameSite=Lax` cookie uning joyini brauzer yangilanganda saqlaydi; ro‘yxatga faqat tokenning SHA-256 xeshi chiqadi.

E’lonlar (bir martalik katta oyna, kichik «Jonli test bor!» kartochkasi va boshlanish oldidagi ekran) ham guruhsiz va mustaqil o‘quvchilarga chiqadi; Yozuv marafoni hozircha guruh talabalari uchun.

Bloklangan yoki boshqa birovga tegishli hisob nomidan qatnashish rad etiladi. Mehmon uchun talabalar ro‘yxatida hisob yaratilmaydi. Boshqa guruh o‘yinlarining kirish tartibi saqlanadi.

## O‘yin qoidalari

`/api/live` mavjud `kahoot/{idx,games}` ma’lumotlarini o‘qiydi. Savol faqat o‘z vaqtida, to‘g‘ri javob va umumiy javoblar esa vaqt tugagach beriladi. To‘liq o‘yin faqat yakunda ochiladi. `mine` faqat shu ishtirokchining avval qabul qilingan javoblarini qaytaradi.

Qo‘shilish faqat lobbi vaqtida. Avval qo‘shilgan ishtirokchi sahifani yangilab joyini tiklay oladi. Javobning birinchi nusxasi o‘zgarishsiz qoladi; aynan shu javobning takroriy so‘rovi yana ball bermaydi. Ism, guruh, identifikator va vaqtni server tekshiradi. Brauzer yuborgan vaqt va akademik hisob nomi ishonchli manba hisoblanmaydi.

Qo‘shilish va javob yozish o‘yin bo‘yicha RTDB transaction ichida bajariladi: o‘qituvchi bekor qilgan o‘yin kechikkan javob bilan qayta yaratilmaydi, vaqt o‘zgarsa eski sahna so‘rovi rad etiladi. `students`, `owners`, dars ballari va oldingi natijalar yozuvlari bu API tomonidan o‘zgartirilmaydi. Mavjud ochko va sovrin hisoblash formulasi saqlanadi.

## Sahna va so‘rovlar

Arena sahifasi (≈0,5 MB) yuklanguncha `LiveQuizFrame` o‘z binafsha yuklanish ekranini ko‘rsatadi, arena esa `sq-direct` sinfini `<head>`dayoq qo‘yadi — yarim yuklangan eski sahifa va sarlavha ko‘rinmaydi.

`LiveQuizFrame` va `live-player.js` xabarlarining origin va oyna manbasi tekshiriladi. Ota sahifa faqat `/api/live` manziliga so‘rov yuboradi; iframe’ga token va parol berilmaydi. `arena-live.mjs` faqat yangi platformadagi nusxani moslaydi, asl `arena.html` va baholash dvigateli o‘zgartirilmaydi.

## Tekshirish

```bash
STUDYQUEST_DEMO=true npm run typecheck
STUDYQUEST_DEMO=true npm test
SQ_BROWSER_EXECUTABLE=/usr/bin/chromium npm run test:browser -- tests/browser/live-player.spec.ts
LIVE_RTDB_EMULATOR=1 npx vitest run tests/live-player-emulator.test.ts
```

RTDB transaction sinovi Java va mahalliy Firebase emulyatorini ishlatadi; u jonli bazaga ulanmaydi. JAR yo‘q bo‘lsa Google’ning rasmiy manzilidan olinadi. Firebase Node SDK lokal WebSocket uchun ham `HTTP_PROXY`ni ishlatadigan muhitda emulyator aloqasi tugashi mumkin; proksi cheklovlari o‘zgartirilmaydi. Ushbu tekshiruv GitHub Actions’da alohida qadam sifatida bajariladi.

Brauzer testi haqiqiy demo API orqali mehmonning qo‘shilishi va qayta kirishini tekshiradi. Vaqtga bog‘liq dizayn bosqichlari mahalliy test ma’lumotlari bilan tekshiriladi: lobbi, rangli savol tugmalari, halqali taymer, natija ustunlari va g‘oliblar shohsupasi. Rasmlar `tests/artifacts/live-*.png` ga yoziladi.
