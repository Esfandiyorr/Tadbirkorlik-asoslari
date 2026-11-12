# 📱 «Tadbirkorlik asoslari»ni Play Market'ga chiqarish — qo'llanma

Sayt ilovaga **TWA** (Trusted Web Activity) usulida aylantiriladi: ilova saytning o'zini to'liq ekranda ochadi.
Saytga kiritilgan har bir o'zgarish ilovada ham darhol ko'rinadi — Play Market'ga qayta yuklash shart emas.

Saytning o'zida tayyor bo'lgan narsalar (kod tomoni):

| Talab | Holati | Qayerda |
|---|---|---|
| Maxfiylik siyosati (ochiq sahifa) | ✅ | `https://<sayt>/privacy` |
| Hisobni o'chirish sahifasi | ✅ | `https://<sayt>/delete-account` |
| Ilova ichidan hisobni o'chirishni so'rash | ✅ | Profil → «🗑 Hisobni o'chirish» |
| Chatda shikoyat qilish | ✅ | Talabalar chati → «🚩 Shikoyat qilish» |
| Ilova va sayt bog'lanishi (`assetlinks.json`) | ⏳ SHA-256 kiritilgach | Sayt boshqaruvi → 📱 Ilova |
| Manifest, ikonkalar, oflayn sahifa | ✅ | — |

Quyidagi qadamlarni **siz** bajarasiz (Google hisobi, to'lov va shaxsni tasdiqlash kerak bo'lgani uchun).

---

## 0-qadam. Avval hal qilinadigan ikki masala

1. **TerDU nomi va logotipi.** Ilovada universitet logotipi bor. Shaxsiy hisobdan chiqarilsa, Google buni
   «boshqa tashkilot nomidan chiqish» deb rad etishi mumkin. Universitetdan yozma ruxsatnoma oling (PDF) yoki
   ilovani universitetning tashkilot hisobidan chiqaring. Ruxsatnoma bo'lsa, uni Play Console'da ariza berishda
   ilova qiling.
2. **Domen.** Ilova sayt manziliga bog'lanadi. Keyinchalik o'z domeningizga o'tsangiz, ilovani qayta yasashga
   to'g'ri keladi. Domen o'zgarishi kutilsa — avval domenni ulang, keyin ilovani yasang.

## 1-qadam. Saytda ma'lumotlarni to'ldiring

Sayt → Boshqaruv → Sayt boshqaruvi → **📱 Ilova (Play Market)**:

- **Operator** — ma'lumotlar uchun kim javobgar (F.I.Sh. yoki tashkilot nomi);
- **Murojaat uchun email** — Google buni talab qiladi.

Bu ikkalasi maxfiylik siyosati sahifasida ko'rinadi. Paket nomi va SHA-256 ni 4-qadamda kiritasiz.

## 2-qadam. Google Play Console hisobi

1. <https://play.google.com/console> ga kiring, hisob oching. Bir martalik to'lov — **25 $**.
2. Hisob turi:
   - **Shaxsiy** — tez ochiladi, lekin yangi shaxsiy hisob ilovani «Production» ga chiqarishdan oldin
     **kamida 12 sinovchi bilan 14 kun yopiq sinov** o'tkazishi shart.
   - **Tashkilot** — D-U-N-S raqami kerak (bepul, lekin olish bir necha hafta), sinov sharti yo'q.
3. Shaxsingizni tasdiqlang (pasport), telefon va emailni tasdiqlang.

> Bu talablar (25 $, 12 sinovchi, 14 kun) o'zgarib turadi — aniq holatini Play Console'ning o'zida tekshiring.

## 3-qadam. Android paketini yasang (PWABuilder)

1. <https://www.pwabuilder.com> ni oching, sayt manzilini kiriting, **Start** ni bosing.
2. **Package For Stores → Android → Generate Package**. Sozlamalar:
   - **Package ID**: `uz.terdu.tadbirkorlik` (yoki o'zingizniki; keyin o'zgartirib bo'lmaydi);
   - **App name**: `Tadbirkorlik asoslari`;
   - **Start URL**: `/?src=play` (shu bilan ilova «Play Market ilovasi» ekanini biladi — 7-qadamga qarang);
   - **Signing key**: «Create new» (yangi kalit yaratilsin).
3. ZIP faylni yuklab oling. Ichida:
   - `app-release-bundle.aab` — Play Console'ga yuklanadigan fayl;
   - `signing.keystore` va `signing-key-info.txt` — **imzo kaliti va paroli**.

> ⚠️ `signing.keystore` va parolini xavfsiz joyda (masalan, shaxsiy bulut + fleshka) saqlang va hech kimga bermang.
> Yo'qotsangiz, ilovani yangilab bo'lmaydi. Bu fayllarni GitHub'ga yuklamang.

## 4-qadam. Ilovani yarating va saytga bog'lang

1. Play Console → **Create app**: nom `Tadbirkorlik asoslari`, til — o'zbek, turi — **App**, **Free**.
2. **Test and release → Testing → Closed testing** → yangi «track» yarating → `.aab` faylni yuklang.
3. **Test and release → Setup → App integrity → App signing** sahifasidan
   **SHA-256 certificate fingerprint** ni nusxalang.
4. Saytda: Sayt boshqaruvi → 📱 Ilova → **Paket nomi** (3-qadamdagi Package ID) va **SHA-256** ni kiriting →
   Saqlash. `signing-key-info.txt` dagi SHA-256 ham bo'lsa, uni ikkinchi qatorga qo'shing.
5. Tekshirish: `https://<sayt>/.well-known/assetlinks.json` ochilganda paket nomi va iz ko'rinishi kerak.
   Shundan keyin ilova saytni brauzer manzil satrisiz, to'liq ekranda ochadi.

## 5-qadam. Do'kon sahifasini to'ldiring

**Grow users → Store presence → Main store listing**:

- Nom, qisqa va to'liq tavsif — `dokon-matni.md` faylidan (o'zbek, rus, ingliz);
- **App icon** 512×512 — `rasmlar/icon-512.png`;
- **Feature graphic** 1024×500 — `rasmlar/feature-graphic.png`;
- **Phone screenshots** (kamida 2 ta) — `rasmlar/telefon-*.png`.

## 6-qadam. «App content» shakllari

`play-console-javoblari.md` faylida har bir savolga tayyor javob bor:

- **Privacy policy** — `https://<sayt>/privacy`
- **App access** — sinov hisobi (pastga qarang)
- **Ads**, **Content rating**, **Target audience** (18+), **Data safety**
- **Data safety → Delete account URL** — `https://<sayt>/delete-account`

**Google tekshiruvchisi uchun sinov hisobi.** Saytda oddiy talaba hisobi oching (masalan, ism: `Google`,
familiya: `Tekshiruvchi`, guruh: istalgan), o'qituvchi sifatida uni tasdiqlang va unga obuna bering
(Sayt boshqaruvi → 💎 Obuna). Login va parolni «App access» bo'limiga yozing.

## 7-qadam. Pullik obuna va Google qoidalari — muhim

Google Play qoidasiga ko'ra, **ilova ichida** raqamli mahsulot (obuna, pullik bo'lim) sotilsa, to'lov faqat
**Google Play Billing** orqali bo'lishi kerak. Ilova ichida «Click/Payme orqali to'lang» deb yo'riqnoma berish
qoidabuzarlik hisoblanadi va ilova rad etilishi yoki o'chirilishi mumkin.

Shuning uchun sayt shunday ishlaydi:

- **Brauzerda (sayt)** — «💎 Obuna bo'lish» oynasida narx va to'lov yo'riqnomasi ko'rinadi.
- **Play Market ilovasida** (Start URL `/?src=play` bo'lgani uchun) — narx va to'lov yo'riqnomasi
  **ko'rsatilmaydi**; faqat «bu imkoniyat obunachilar uchun» deyiladi. Obunasi bor talaba ilovada ham
  hamma narsadan foydalanadi.

Ya'ni obuna **saytda** rasmiylashtiriladi, ilova esa undan foydalanish uchun. Keyinchalik ilova ichida ham
sotmoqchi bo'lsangiz, Google Play Billing ulash kerak bo'ladi (Google 15–30 % komissiya oladi; O'zbekistonda
sotuvchi hisobi ochish mumkinligini Play Console'da tekshiring).

## 8-qadam. Sinov va chiqarish

1. Yopiq sinovga 12+ talabaning Gmail manzilini qo'shing, ularga sinov havolasini yuboring; ular ilovani
   o'rnatib, 14 kun davomida ishlatsin (shaxsiy hisob uchun).
2. Sinov tugagach: **Production → Create new release** → o'sha `.aab` → **Send for review**.
3. Google tekshiruvi odatda bir necha kun. Rad etilsa, sababi emailga keladi — menga yuboring, tuzatamiz.

## Yangilash

Saytdagi o'zgarishlar ilovada o'zi chiqadi. Ilovaning o'zini (nom, ikonka, paket) o'zgartirish kerak bo'lsagina
PWABuilder'da **o'sha imzo kaliti bilan** yangi `.aab` yasab, Play Console'ga yuklaysiz (versiya raqamini
bittaga oshiring).

## iPhone

Bu ilova faqat Android uchun. iPhone'da talabalar saytni Safari'da ochib, «Ulashish → Bosh ekranga qo'shish»
orqali o'rnatadi. App Store — alohida va qimmatroq jarayon (yiliga 99 $, Mac kompyuter kerak).
