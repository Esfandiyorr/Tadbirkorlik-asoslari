# Play Console shakllari uchun tayyor javoblar

Quyidagilar ilovaning hozirgi holatiga mos. Biror narsa o'zgarsa (masalan, reklama SDK'si yoki ilova ichida
to'lov qo'shilsa), javoblarni ham yangilang — noto'g'ri deklaratsiya ilovaning o'chirilishiga olib keladi.

## App access

**All or some functionality is restricted** → sinov hisobining login va parolini yozing.
Izoh (inglizcha): `Sign in with "Talaba hisobi" (Student account). The account is approved, has Premium and has access to every course, so all features are open. AI presentations: menu → "Taqdimot".`

## Ads — «Does your app contain ads?»

- 2-e'lon oynasida faqat o'z e'lonlaringiz yoki bepul joylangan grant/kurs xabarlari bo'lsa — **No**.
- Uchinchi tomon mahsuloti **pul evaziga** reklama qilinsa — **Yes**.

## Content rating (IARC so'rovnomasi)

- Category: **Reference, News, or Educational**
- Violence, sexuality, language, controlled substances, gambling: **No**
- Users can interact or exchange content (chat): **Yes**
  - Is the chat moderated / can users report or block? **Yes** (shikoyat qilish, so'kinish filtri, o'qituvchi nazorati)
- Shares user's location: **No**
- Allows purchases of digital goods: **No** (ilova ichida sotuv yo'q)
- Agar so'rovnomada **sun'iy intellekt (generative AI)** haqida savol chiqsa: **Yes** — ilova talabaning
  mavzusi bo'yicha taqdimot matnini AI yordamida tuzadi; nojo'ya mavzular rad etiladi, foydalanuvchi har bir
  natija ustidan ilovaning o'zida «🚩 Shikoyat» yubora oladi.

## Target audience and content

- Target age: **16–17** va **18 and over** (maxfiylik siyosatida «16 yoshdan katta» deyilgan — shunga mos)
- Appeals to children: **No**

## News app / COVID-19 / Government / Financial features / Health

Hammasi: **No**

## Data safety

**Does your app collect or share any of the required user data types?** → Yes
**Is all of the user data encrypted in transit?** → Yes
**Do you provide a way for users to request that their data is deleted?** → Yes →
URL: `https://<sayt>/delete-account`

Yig'iladigan ma'lumot turlari (hammasi: _Collected_, _Not shared_; «Shared» — yo'q, chunki ma'lumot faqat
ilova ishlashi uchun xizmat ko'rsatuvchilarga — Firebase, Vercel, Anthropic — beriladi, bu Google ta'rifida
«sharing» emas):

| Data type                                                                                                                         | Majburiymi                                       | Maqsad                                |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------- |
| Personal info → **Name**                                                                                                          | Required                                         | App functionality, Account management |
| Personal info → **Email address**                                                                                                 | Optional (faqat email bilan ro'yxatdan o'tganda) | Account management                    |
| Personal info → **User IDs**                                                                                                      | Required                                         | App functionality, Account management |
| Personal info → **Other info** (o'quv guruhi)                                                                                     | Optional                                         | App functionality                     |
| Messages → **Other in-app messages** (chat, administratorga xabar)                                                                | Optional                                         | App functionality                     |
| Photos and videos → **Photos** (topshiriqqa yuklangan rasm, chatdagi rasm)                                                        | Optional                                         | App functionality                     |
| App activity → **App interactions** (o'qilgan mavzular, test javoblari, ballar)                                                   | Required                                         | App functionality                     |
| App activity → **Other user-generated content** (taqdimot mavzulari)                                                              | Optional                                         | App functionality                     |
| Device or other IDs → **Device or other IDs** (bildirishnoma obunasi)                                                             | Optional                                         | App functionality                     |
| Financial info → **Purchase history** (obuna muddati, avatar yoki pullik kurs uchun «To'lov qildim» so'rovi va chek raqami izohi) | Optional                                         | App functionality, Account management |

Yig'ilmaydi: Location, Financial info'ning qolgan turlari (karta ma'lumotlari, kredit va h.k. — to'lov
saytdan tashqarida qilinadi), Health, Contacts, Calendar, Audio, Files, Web browsing,
App info and performance (crash/diagnostika SDK'si yo'q).

Har bir tur uchun: **Is this data processed ephemerally?** → No · **Can users choose whether it's collected?** →
«Optional» deb belgilanganlar uchun Yes.

## Store settings

- App category: **Education**
- Contact email: saytdagi «Murojaat uchun email» bilan bir xil
- Privacy policy: `https://<sayt>/privacy`
