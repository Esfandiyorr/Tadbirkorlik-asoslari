# Play Console shakllari uchun tayyor javoblar

Quyidagilar ilovaning hozirgi holatiga mos. Biror narsa o'zgarsa (masalan, reklama SDK'si yoki ilova ichida
to'lov qo'shilsa), javoblarni ham yangilang — noto'g'ri deklaratsiya ilovaning o'chirilishiga olib keladi.

## App access
**All or some functionality is restricted** → sinov hisobining login va parolini yozing.
Izoh (inglizcha): `Sign in with "Talaba hisobi" (Student account). The account is approved and has Premium.`

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

## Target audience and content
- Target age: **18 and over** (faqat shu)
- Appeals to children: **No**

## News app / COVID-19 / Government / Financial features / Health
Hammasi: **No**

## Data safety

**Does your app collect or share any of the required user data types?** → Yes
**Is all of the user data encrypted in transit?** → Yes
**Do you provide a way for users to request that their data is deleted?** → Yes →
URL: `https://<sayt>/delete-account`

Yig'iladigan ma'lumot turlari (hammasi: *Collected*, *Not shared*; «Shared» — yo'q, chunki ma'lumot faqat
ilova ishlashi uchun xizmat ko'rsatuvchilarga — Firebase, Vercel, Anthropic — beriladi, bu Google ta'rifida
«sharing» emas):

| Data type | Majburiymi | Maqsad |
|---|---|---|
| Personal info → **Name** | Required | App functionality, Account management |
| Personal info → **Email address** | Optional (faqat email bilan ro'yxatdan o'tganda) | Account management |
| Personal info → **User IDs** | Required | App functionality, Account management |
| Personal info → **Other info** (o'quv guruhi) | Optional | App functionality |
| Messages → **Other in-app messages** (chat, administratorga xabar) | Optional | App functionality |
| Photos and videos → **Photos** (topshiriqqa yuklangan rasm, chatdagi rasm) | Optional | App functionality |
| App activity → **App interactions** (o'qilgan mavzular, test javoblari, ballar) | Required | App functionality |
| App activity → **Other user-generated content** (taqdimot mavzulari) | Optional | App functionality |
| Device or other IDs → **Device or other IDs** (bildirishnoma obunasi) | Optional | App functionality |

Yig'ilmaydi: Location, Financial info, Health, Contacts, Calendar, Audio, Files, Web browsing,
App info and performance (crash/diagnostika SDK'si yo'q).

Har bir tur uchun: **Is this data processed ephemerally?** → No · **Can users choose whether it's collected?** →
«Optional» deb belgilanganlar uchun Yes.

## Store settings
- App category: **Education**
- Contact email: saytdagi «Murojaat uchun email» bilan bir xil
- Privacy policy: `https://<sayt>/privacy`
