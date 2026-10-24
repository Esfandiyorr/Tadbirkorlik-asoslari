# Tadbirkorlik asoslari — interaktiv taqdimotlar platformasi (TerDU)

**Muassasa:** Termiz davlat universiteti · Fan: Tadbirkorlik asoslari

Sayt — 15 ta interaktiv taqdimot, ball va reyting tizimi, talabalar chati, o'yin arenasi va telefon ilovasi (PWA).
Istagan kishi taqdimotlarni o'qiydi; talaba ro'yxatdan o'tadi, testni ishlaydi va ball to'playdi; o'qituvchi hammasini panel orqali
boshqaradi (mavzuni ochish, baholash, e'lon, jonli test).

**[`index.html`](index.html) — portal (saytning bosh sahifasi):** havolaga kirgan har kim avval shuni ko'radi —
**ℹ️ «Bu sayt haqida»** (nima ekani, TerDU, o'qituvchi), **🎯 «Nima maqsadda ochilgan»**, 🧩 saytda nimalar borligi,
🚀 qanday foydalanish va **📚 «Fanlar»** ro'yxati (hozir — «Tadbirkorlik asoslari»; kelajakda qo'shiladigan fanlar ham shu
yerda chiqadi, o'qish uchun fanni tanlaysiz). Mehmonga «Bu sayt haqida» ochiq turadi, ro'yxatdan o'tgan talabaga yig'iq.

**[`tadbirkorlik-asoslari.html`](tadbirkorlik-asoslari.html) — fan sahifasi:** fan tanlangach shu sahifa ochiladi —
barcha mavzular kartochkalarda (🟢 ball beriladi · 📖 o'qish rejimi · 🔒 yopiq), tepada
«⏳ Bu hafta ball beradigan mavzu …, yakshanba 23:59 gacha» eslatmasi, ballari va reyting; «← Barcha fanlar» portalga qaytaradi.
**Ro'yxatdan o'tish shart emas** — pastdagi «👀 Mehmon rejimi» ga qarang.

| Fayl | Mavzu | Hajmi | Holati |
|---|---|---|---|
| [`mavzu-1.html`](mavzu-1.html) | **M1** — Tadbirkorlik tafakkuri va biznes imkoniyatlar | 18 slayd · 15 test | 📖 o'qish rejimi |
| [`mavzu-2.html`](mavzu-2.html) | **M2** — Mijoz muammosi asosida biznes g'oya | 24 slayd · 15 test | 📖 o'qish rejimi |
| [`mavzu-3.html`](mavzu-3.html) | **M3** — Mahsulotni kam xarajat bilan sinash (moliya va kredit) | 15 slayd · 15 test | 📖 o'qish rejimi |
| [`mavzu-4.html`](mavzu-4.html) | **M4** — Biznesni qonuniy rasmiylashtirish | 18 slayd · 🧩 krossvord | 📖 o'qish rejimi |
| [`mavzu-5.html`](mavzu-5.html) | **M5** — Soliqlar va hujjatlar | 18 slayd · 🧮 3 masala | 📖 o'qish rejimi |
| [`mavzu-6.html`](mavzu-6.html) | **M6** — Biznes-model qanday ishlaydi | 18 slayd · 15 test | 🔒 o'qituvchi ochadi |
| [`mavzu-7.html`](mavzu-7.html) | **M7** — Mijoz kim va unga nima kerak | 18 slayd · 15 test | 🔒 o'qituvchi ochadi |
| [`mavzu-8.html`](mavzu-8.html) | **M8** — Mahsulotni reklama qilish va mijozga yetkazish | 18 slayd · 15 test | 🔒 o'qituvchi ochadi |
| [`mavzu-9.html`](mavzu-9.html) | **M9** — Biznes g'oyani taqdim etish va tadbirkorlik yo'lini boshlash | 18 slayd · 15 test | 🔒 o'qituvchi ochadi |
| [`mavzu-10.html`](mavzu-10.html) | **M10** — Savdo jarayonini tashkil etish va mijozlar bilan ishlash | 18 slayd · 15 test | 🔒 o'qituvchi ochadi |
| [`mavzu-11.html`](mavzu-11.html) | **M11** — Mahsulot narxini shakllantirish | 18 slayd · 15 test | 🔒 o'qituvchi ochadi |
| [`mavzu-12.html`](mavzu-12.html) | **M12** — Biznesda pul oqimini rejalashtirish: kirim, chiqim va mablag' jalb qilish | 18 slayd · 15 test | 🔒 o'qituvchi ochadi |
| [`mavzu-13.html`](mavzu-13.html) | **M13** — Biznesda foyda va zarar tahlili | 18 slayd · 15 test | 🔒 o'qituvchi ochadi |
| [`mavzu-14.html`](mavzu-14.html) | **M14** — Biznes-reja tuzish va mahsulotni tashqi bozorga olib chiqish | 18 slayd · 15 test | 🔒 o'qituvchi ochadi |
| [`mavzu-15.html`](mavzu-15.html) | **M15** — Jamoani shakllantirish, xodimlarni boshqarish va xavflarni aniqlash | 18 slayd · 15 test | 🔒 o'qituvchi ochadi |

«Holati» — `config.json` dagi boshlang'ich holat; har bir guruh uchun haqiqiy holatni o'qituvchi panelda belgilaydi
(pastda «🏆 Reyting tizimi va mavzularni ochish»).

## Ishga tushirish

Sayt GitHub Pages orqali ishlaydi — talabalarga bosh sahifa havolasi yuboriladi. U **portalni** (`index.html`) ochadi:
sayt haqida, maqsad va fanlar; fanni tanlagach — **fan sahifasi** (mavzular ro'yxati va holati): talaba 🟢 mavzuga kirib ishlaydi (ball),
📖 mavzuni o'qiydi. Avtomatik boshqa sahifaga o'tish yo'q. Har bir taqdimotda mavzular ro'yxatida «🏠 Fan sahifasi» va
«🌐 Barcha fanlar» havolalari bor; logotip — fan sahifasiga olib boradi.
Eski «index.html#5» havolalari 1-mavzuning shu slaydini ochadi (`mavzu-1.html#5`).
Ball, reyting va chat uchun internet kerak (Firebase Realtime Database).

**👀 Mehmon rejimi (hisobsiz kirganlar):** saytni qiziqib ochgan har kim ro'yxatdan o'tmasdan taqdimotlarni **faqat o'qish**
rejimida ko'ra oladi — o'qituvchi hammaga ochgan (📖 o'qish rejimi yoki hammaga ball beradigan) mavzular. Hali ochilmagan
mavzu mehmonga ham yopiq («hali ochilmagan»): mehmon **hech qaysi guruhga kirmagan talaba bilan bir xil** ko'radi — faqat bir guruhga
yoki bir talabaga ochilgan mavzu mehmonga ochilmaydi. Yopiq mavzuga to'g'ridan-to'g'ri havola bilan kirilsa ham qulf oynasi chiqadi
(Esc, klaviatura va `#N` bilan ochilmaydi), **chop etish / «📥 PDF»** da ham slaydlar chiqmaydi. Mehmon uchun: ball hisoblanmaydi, vaqt sanalmaydi, bazaga hech narsa yozilmaydi,
chat va reyting ko'rinmaydi. **Testni, krossvordni yoki masalalarni boshlash** tugmasi bosilsa, yopiladigan oyna chiqadi —
«Testni ishlash va ball olish uchun hisobingizga kiring yoki ro'yxatdan o'ting» (Kirish / Ro'yxatdan o'tish yorliqlari,
o'qituvchi uchun ham havola). Kirgach shu sahifada davom etadi (sahifa qayta yuklanmaydi); mavzu o'qish rejimida bo'lsa,
test odatdagidek yopiq turadi. Taqdimot ko'rilayotganda (va portal, fan sahifasida) **topbarda chapdan ikkita tugma** turadi:
«🔑 Kirish» (hisobi bor) va «🎓 Ro'yxatdan o'tish» (yangi) — mos yorliqli oyna ochiladi; kirgach ikkalasi yo'qoladi.

**➕ Yangi fan qo'shish:** (1) `config.json` → `courses` ga `{id, icon, title, desc, first}` qo'shing — `first` shu fanning mavzular
sahifasi (`tadbirkorlik-asoslari.html` ning nusxasi, masalan `yangi-fan.html`); (2) shu fanning mavzularini `topics` ga qo'shing
va har biriga `"course": "<fan id>"` yozing (yozilmasa — birinchi fan); (3) `inject.py` dagi `DECKS` ga yangi mavzu sahifalarini va fan sahifasini
(`home='course'`) qo'shing; (4) `python3 _reyting-manba/inject.py`. Portal fanni o'zi ro'yxatga oladi (mavzular soni, «bu hafta ball
beradi» belgisi), mavzular ro'yxati va raqamlash fan ichida bo'ladi.

**🛠 Texnik ishlar rejimi (saytni vaqtincha yopish):** `config.json` → `"maintenance": {"on": true, "uz": "…", "en": "…"}`.
Yoqilganda **o'qituvchidan boshqa hamma** (talaba ham, mehmon ham) har bir sahifada (portal, fan sahifasi, taqdimotlar)
«🛠 Texnik ishlar ketyapti» ekranini ko'radi — `uz`/`en` matni shu yerda chiqadi; ball, vaqt va chat ishga tushmaydi, bazaga
hech narsa yozilmaydi, chop etilmaydi. O'qituvchi ekrandagi «🔑 O'qituvchi» orqali Google bilan kirsa (yoki shu qurilmada avval kirgan bo'lsa)
ekran yo'qoladi va sayt odatdagidek ishlaydi. Yoqish/o'chirish: `on` ni `true`/`false` qilib `python3 _reyting-manba/inject.py`, so'ng push.
Sahifasi allaqachon ochiq turgan talabaga o'zgarish keyingi yangilanishda (sahifani qayta ochganda) ko'rinadi. O'yin arenasi (`arena.html`)
alohida: uni yopish uchun u yerdagi `ARENA_OPEN=false`.

**🔗 Havola nomi va logo:** saytning havolasi Telegram, WhatsApp, Facebook va boshqalarga yuborilganda nomi
**«IsfandiyorSayfiddinov»**, rasmi — yangi logo: TerDU gerbi + Isfandiyor Sayfiddinov
(`fayllar/havola-isfandiyor.jpg`, 1200×630, 300 KB dan kichik; kvadrat variant — `fayllar/logo-isfandiyor.png`).
Teglar har bir sahifada (`og:title`, `og:image`, `twitter:card`) `inject.py` orqali qo'yiladi; ular `config.json` dagi
`siteUrl` (saytning haqiqiy manzili — o'z domeni bo'lsa shuni yozing) va `linkName` dan olinadi. Mavzu sahifalarida tavsif
«N-mavzu: …». Logoni qayta yaratish: `cd tests && node ../_reyting-manba/logo/yasash.js` (shablon — `_reyting-manba/logo/logo.html`).
Telegram havola rasmini eslab qoladi — o'zgartirgandan keyin yangilanishi uchun havolani @WebpageBot ga yuboring.

**Muhim:** taqdimotlardagi umumiy kod (`rt-engine.js`, `rt-engine.css`) avtomatik yaratiladi — ularni qo'lda
tahrirlamang. Manba `_reyting-manba/` papkasida; o'zgartirgandan keyin `python3 _reyting-manba/inject.py`.

## M1 — Tadbirkorlik tafakkuri (18 slayd)

Muqova · maqsad · reja va tushunchalar · tadbirkorlik ta'rifi va 4 ustuni · tadbirkorning kapitali · O'zbekiston statistikasi · 5 ta shakl · mikro va kichik biznes · startap ≠ yangi biznes · oilaviy va ijtimoiy tadbirkorlik · xodim vs tadbirkor tafakkuri · 7 belgi va 5 xato · muammo manbalari va 4 filtr · Muammo–Yechim–Mijoz–Daromad zanjiri · xulosa va mustaqil ish · 🎁 eng boy tadbirkorlar va kompaniyalar · 🎁 qiziqarli faktlar · 🧪 test.

## M2 — Mijoz muammosi asosida g'oya (18 slayd)

Muqova · maqsad · reja va tushunchalar · mijoz muammosining 3 qatlami ("dori" va "vitamin") · bozordagi 6 turdagi bo'shliq · 4 usulning qiyosi · **kuzatish** · **mijoz bilan suhbat (Mom Test)** · **so'rovnoma** · **fikrlar shturmi** (HMW, SCAMPER, 6-3-5) · insayt → gipoteza, ICE ball va saralash matritsasi · qiymat taklifi · **MVP nima va nima emas** (skeytbord qoidasi) · **eng kam xarajatli MVP turlari** (namuna, katalog, raqamli maket, landing, konsyerj, pre-order) · MVPni sinash va davom/pivot/to'xtat qarori · xulosa va mustaqil ish · 🎁 mashhur kompaniyalarning birinchi MVPlari · 🧪 test.

## M3 — Mahsulotni kam xarajat bilan sinash va moliyalashtirish (15 slayd)

Muqova · maqsad · reja va tushunchalar · **avval arzon sinov, keyin katta pul** (pulning 3 bosqichi) ·
**moliyalashtirishning 8 ta manbai** · qaysi bosqichda qaysi pul + kredit va investor qiyosi ·
**kreditning afzalliklari va xavflari** · **biznes krediti ≠ iste'mol krediti** (9 mezon bo'yicha jadval) ·
amaliy hisob: bir xil 30 mln so'm — ikki xil natija · **garov va kafillik** ·
**imtiyozli davr, annuitet/differensial to'lov va samarali stavka** · **pul oqimi (cash flow) tahlili** ·
kreditga 7 qadamda tayyorgarlik va 5 tipik xato · xulosa, mustaqil ish va **foydali havolalar** · 🧪 15 savolli test.

## M4 — Biznesni qonuniy rasmiylashtirish (18 slayd)

Muqova · maqsad · reja va tushunchalar · **nega rasmiylashtirish kerak** (8 sabab) · shaklni tanlash mezonlari ·
**YaTT** · **MChJ** · **oilaviy korxona va kooperativ** · to'rt shaklning qiyosiy jadvali ·
**onlayn ro'yxatdan o'tish: 5 qadam** (birdarcha.uz) · **firma nomi** · **yuridik manzil** · **E-IMZO** ·
**litsenziya, ruxsatnoma va bildirishnoma** · **noqonuniy faoliyatning huquqiy xavflari** ·
xulosa, mustaqil ish va foydali havolalar · 🎬 **tadbirkorlik haqidagi eng mashhur kinolar** ·
🧩 **interaktiv krossvord** (18 ta so'z, 16×17 panjara).

### Krossvord haqida
Kataklarga to'g'ridan-to'g'ri yozish, so'z yo'nalishini bosib almashtirish, `Tekshirish` (to'g'ri/xato kataklarni bo'yaydi)
va `Tozalash` tugmalari bor. Javoblar sahifa kodida kodlangan holda turadi, ularni ko'rsatadigan tugma yo'q.
**2 ta urinish**, har biriga 25 daqiqa (`⏹ Yakunlash` bilan oldinroq tugatish mumkin); 2-urinish toza kataklar bilan
boshlanadi, har so'z uchun ball bir marta beriladi. O'qituvchining 🔓 tugmasi ikkala urinishdan keyin yana bittasini beradi.
Urinishlar **akkauntda** saqlanadi (`students/<id>/xw/m4 = {n, s, e, f, d}`): boshqa brauzer/telefondan kirish yoki
brauzer xotirasini tozalash urinishlarni qaytadan boshlamaydi; urinish akkauntga yozilmasa (internet yo'q) boshlanmaydi.
Urinish davomida va 1-urinishdan keyin qaysi so'z to'g'riligi ko'rsatilmaydi — faqat topilganlar soni; ball urinish
tugaganda beriladi. To'g'ri/xato kataklar va `Tekshirish` faqat oxirgi urinishdan keyin ochiladi. Kataklardagi harflar
yozilgan qurilmada qoladi. Kiritilgan harflar brauzer xotirasida saqlanadi,
til almashtirilganda ham yo'qolmaydi. Savollar ikki tilda.

## M5 — Soliqlar va hujjatlar (18 slayd)

Muqova · maqsad · reja va tushunchalar · **soliq — jarima emas, xarajat** · soliq rejimlari ·
**soddalashtirilgan tartib (aylanma solig'i)** · **umumiy tizim (QQS + foyda solig'i)** · rejimlarning qiyosiy jadvali ·
ish haqi va mulk bo'yicha boshqa to'lovlar · **soliq imtiyozlari** · **my.soliq.uz kabineti** ·
**elektron hisobot topshirish tartibi** · **hisob-faktura (EHF)** · **chek va yuk xati** ·
**daromad-xarajat daftari** (namuna jadval bilan) · xulosa, mustaqil ish va havolalar ·
💳 **kredit to'lovi kalkulyatori** · 🧮 **3 ta masala**.

### Kalkulyator va masalalar

Annuitet formulasi bosqichma-bosqich tushuntirilgan. Kalkulyatorga summa, yillik stavka, muddat va imtiyozli davrni
kiritsangiz — oylik to'lov, jami to'lov, ortiqcha to'lov va uning ulushi darhol hisoblanadi.

**Masalalar — 30 daqiqalik nazorat.** Masalalar avval ko'rinmaydi: «▶ Boshlash» bosilgach 30 daqiqa vaqt boshlanadi;
boshlash oynasida va ishlash paytida «📓 Masalani qanday ishlaganingizni amaliy daftaringizga yozing — o'qituvchi
tekshiradi» eslatmasi turadi. 12 xil masala turi 3 toifada (soliq: aylanma solig'i, QQS, foyda solig'i, JShDS ·
kredit: oylik to'lov, jami to'lov, ortiqcha to'lov, imtiyozli davr · tahlil: rejimlarni taqqoslash, muddatlar farqi,
maksimal kredit, ustama + QQS). Har talabaga har toifadan bittadan — **jami 3 ta**; tur guruhdoshlari orasida eng kam
tushganidan tanlanadi (`arena/ms/m5/<guruh>`), raqamlar esa har kimga alohida yaratiladi. Har masalaga 2 ta urinish,
xato javobga yo'nalish aytilmaydi; masala matnini nusxalab bo'lmaydi (belgilash, Ctrl+C, o'ng tugma o'chiq);
skrinshotga qarshi: kartalarda talabaning ism-familiyasi, guruhi va sanasi yozilgan suv belgisi, sahifadan chiqilganda
masalalar xiralashadi, PrtSc bosilsa yashiriladi va xotira tozalanadi, chop etish (Ctrl+P) o'chiq — brauzer telefon/OS
skrinshotini to'liq bloklay olmaydi, shuning uchun asosiy himoya — suv belgisi va har kimga alohida raqamlar; yechimlar va to'g'ri javoblar faqat vaqt tugagach (yoki «⏹ Yakunlash»dan keyin)
ko'rsatiladi. Holat akkauntda (`students/<id>/ms/m5 = {s, e, f, set, r}`) — boshqa qurilmadan kirsa ham o'sha
masalalar va o'sha vaqt davom etadi. O'qituvchining 🔓 tugmasi yangi masalalar bilan yana bitta urinish beradi.
Ball: 3 ta masala = testning 50 bali (har biri ≈ 16,7).


## 🏆 Reyting tizimi va mavzularni ochish

**Talaba uchun:** o'qish uchun hisob shart emas (mehmon rejimi); ball to'plash va test uchun ism, familiya, guruh va 4 raqamli PIN bilan ro'yxatdan o'tadi (yoki kiradi); o'qituvchi
tasdiqlagach ball hisoblana boshlaydi. Yuqori panelda 🏆 tugmasi: **reyting**, **shaxsiy natija**, **mavzular**
va **o'qituvchi bo'limi**.

**Ball (har mavzu — 100 ball):**

| Qism | Ball |
|---|---|
| Ko'rilgan slaydlar ulushi | 30 |
| Faol o'qish vaqti (1 soat va undan ko'p — to'liq) | 20 |
| Test / krossvord / masalalardagi to'g'ri javoblar ulushi | 50 |
| Amaliy dars bahosi (o'qituvchi qo'yadi) | baho × 2 (qo'shimcha) |
| ⚡ Jonli test va ⌨️ Yozuv Marafoni sovrinlari | qo'shimcha |

Har bir slayd va savol faqat **bir marta** sanaladi (qaysi qurilmadan kirilmasin). Mavzu bahosi (1–5) shu
100 balldan chiqadi: 90+ → 5, 75+ → 4, 60+ → 3, 40+ → 2.

**Ball muddati — yakshanbagacha:** o'qituvchi mavzuni guruhga (yoki hammaga, yoki alohida talabaga) ochgan paytdan
o'sha haftaning **yakshanba kuni 23:59** gacha (Toshkent vaqti) ball beriladi. Ochilgan vaqt bazada server soati bilan
saqlanadi: `meta/access/<mavzu>/g/<guruh>` = vaqt (`s/<talaba>` — alohida talaba, `at` — «hammaga»).
Muddat tugagach mavzu **📖 o'qish rejimiga** o'tadi: slaydlarni barcha guruhlar o'qiy oladi, lekin ball berilmaydi,
test/krossvord/masala ishlanmaydi, PDF yuklab/chop etib bo'lmaydi. Topbarda «📖 O'qish rejimi» belgisi turadi,
talaba mavzuni ochganda ogohlantirish chiqadi. Avval to'plangan ballar saqlanib qoladi.
`config.json` da `"read": true` qo'yilgan mavzular (hozir M1–M5) va vaqt o'rniga `true` turgan eski yozuvlar ham
o'qish rejimida. O'qituvchi panelida (👥 Talabalar → 📂 Mavzuni guruhlarga ochish) 🟢 — ball beriladi (muddati bilan),
📖 — o'qish rejimi, 🔒 — yopiq; 📖 guruhni bosish unga yana yakshanbagacha ball beradi. Guruhiga yopiq mavzuda ball
berilmaydi, yopiq mavzuning eski nusxasi bazaga qayta yozilmaydi. **🔒 Yopiq mavzuda ball olganlar** (Baholash va
reyting) adashib ochilgan mavzudagi ballarni mavzu + guruh bo'yicha bir bosishda o'chiradi.

**📋 «Menga nima qoldi?»** — ball beriladigan mavzuda topbarda ⏳ qolgan vaqt (masalan «2 kun») turadi. Bosilsa:
muddat, ko'rilmagan slaydlar (bosib o'tiladi), o'qish vaqti, test holati («Testga o'tish») va boshqa ochiq mavzular.

**Reyting:** umumiy ro'yxat ball bo'yicha; **«👥 Mening guruhim»** filtri bilan talaba o'zini guruhdoshlari bilan
solishtiradi (o'rin guruh ichida, yonida umumiy o'rni). O'qituvchi istalgan guruhni tanlaydi. Nik (o'qituvchi
tasdig'i bilan) va 1–10-o'rindagilar uchun qator foni bor; o'qituvchi istalgan talabaga fon qo'ya oladi.

**O'qituvchi paneli** (🏆 → 🔑 O'qituvchi, Google hisobi bilan kirish):
- 👥 **Talabalar** — tasdiqlash, guruhlar, nik so'rovlari, mavzularni ochish; ro'yxatlar alifbo tartibida
  (ism yoki familiya bo'yicha — tanlov tugmasi);
- 📊 **Baholash va reyting** — mavzular bo'yicha baholar (ism ustuni qotirilgan, mavzu tanlansa amaliy baho
  bir bosishda 1–5), ball tekshiruvi, CSV;
- 📢 **E'lon yuborish** — e'lon, so'rovnoma, telefonga bildirishnoma va avtomatik eslatmalar;
- ⚡ **Jonli test** — Kahoot uslubidagi test.

**Yakuniy testni hammaga qayta ochish:** `_reyting-manba/config.json` dagi `reopen` maydoni, masalan
`"reopen": {"m1": {"id": "2026-10-19", "until": "2026-10-22T23:59:59+05:00"}}`. Shu `id` dan keyin boshlangan
urinishlar alohida sanaladi (`prog/<mavzu>/qg/<id>`): `until` gacha har bir talabaga 2 ta yangi ball beriladigan
urinish. Muddat tugagach odatdagi hisob qaytadi. Bitta talabaga alohida — Baholash jadvalidagi 🔓 tugmasi.

**`yopiq-mavzular` shoxchasi** — saytning faqat M1–M9 bor nusxasi (qolgan mavzular fayl sifatida ham yo'q).

**Baza:** Firebase Realtime Database (`_reyting-manba/config.json` dagi `firebase` va `fbWeb`). O'qituvchi Google
orqali kiradi (Gmail izi `teacherH`), talabalar anonim kalit bilan — har kim faqat o'z yozuviga yoza oladi.

## 🔐 Firebase qoidalari (xavfsiz rejim)

O'qituvchi paneli → 👥 Talabalar → pastdagi **📋 Firebase qoidalari** tugmasi Gmail manzilingiz qo'yilgan tayyor
qoidalarni beradi: nusxa olib, *console.firebase.google.com → Realtime Database → Rules* ga qo'yiladi va **Publish**.

- **💬 Chat va 🖼 rasmlar:** talaba faqat **yangi** xabar qo'sha oladi — o'z nomidan, tasdiqlangan hisobdan,
  server vaqti bilan (400 belgigacha). Xabarni o'zgartirish yoki o'chirish — **faqat o'qituvchi**. Istisno —
  avtomatik tozalash: 1 haftadan eski xabar va rasm, 1 kundan eski video. Rasm/video faqat o'qituvchi ruxsat
  bergan talabadan qabul qilinadi.
- **🎮 Arena:** o'yin xonalari odatdagidek ishlaydi, lekin butun arenani yoki uning bo'limini birdaniga
  o'chirish — faqat o'qituvchi.
- Talabalar yozuvi (`students/<id>`) — faqat egasi (anonim kalit) va o'qituvchi; `meta` — faqat o'qituvchi.

Qoidalar Firebase emulyatorida tekshirilgan (chat, rasm, arena — 28 ta holat).

## 🎵 Qo'shiqlar (fon musiqasi)

Har bir taqdimotning **o'ng chekkasida 🎵 tugmasi** turadi — bosilganda qo'shiqlar ro'yxati ochiladi:
ijro/to'xtatish, oldingi/keyingi, takrorlash, ovoz balandligi va vaqt chizig'i bor. Tanlangan qo'shiq,
ovoz darajasi va takrorlash holati brauzerda eslab qolinadi.

**Yangi qo'shiq qo'shish:** mp3 faylni repozitoriyaga yuklang va `_reyting-manba/config.json` dagi
`tracks` ro'yxatiga qo'shing:

```json
"tracks": [
  {"file": "Musofir.mp3", "title": "Musofir", "artist": ""},
  {"file": "Yangi.mp3",   "title": "Yangi qo'shiq", "artist": "Ijrochi"}
]
```

So'ng `python3 _reyting-manba/inject.py` ni ishga tushirib, o'zgarishni push qiling — yoki shunchaki
menga ayting, qo'shib beraman.

## Imkoniyatlar

- 🌐 **UZ ⇄ ENG til almashtirish** — `L` tugmasi yoki yuqoridagi 🌐 tugma: barcha slaydlar, jadvallar, interfeys va test to'liq ingliz tiliga o'tadi (tanlov saqlanadi)
- 🌙 **Tun / Kun rejimi** — `D` tugmasi; tanlov brauzer xotirasida saqlanadi
- ⌨️ **Klaviatura:** `→ / Space / PgDn` keyingi, `← / PgUp` oldingi, `Home/End`, `1…9` slayd raqami, `O` slaydlar ro'yxati, `L` uz/eng, `F` to'liq ekran, `T` vaqt hisoblagich, `P` PDF, `?` yordam, `Esc` yopish
- 📱 **Swipe** — telefonda chapga/o'ngga surish
- ▦ Slaydlar ro'yxati (overview), progress chizig'i, ma'ruza taymeri
- 🖨 PDF / chop etish rejimi — har bir slayd alohida sahifada
- 🧪 Interaktiv test: darhol tekshirish, izohli javob, ball, foiz va yakuniy baho
- 💾 Oxirgi ochilgan slayd har bir mavzu uchun alohida eslab qolinadi

## Tarjima (UZ / ENG)

Barcha taqdimotlar to'liq ikki tilli: slayd matnlari, jadvallar, tugmalar, yordam oynasi va test savollari
inglizcha variantga ega. Tarjimalar HTML fayl ichida (`EN` lug'ati va `QEN` massivi) saqlanadi —
tugma bosilganda sahifa qayta yuklanmaydi, test javoblari ham saqlanib qoladi.

## Logotip

Taqdimotlarda universitetning rasmiy gerbi — `logo_tersu.png` — ishlatiladi. U har bir sahifaga alohida
singdirilmaydi (ilgari har sahifaga 71 KB qo'shilardi): bitta fayl bir marta yuklanadi va keshdan olinadi.
Logotipni almashtirish uchun `logo_tersu.png` ni yangisi bilan almashtirish yetarli.

## ⚡ Tezlik

Reyting tizimi, chat, musiqa va avatar kodi barcha taqdimotlarda bir xil — u `rt-engine.js` va `rt-engine.css`
fayllarida turadi (`inject.py` yaratadi) va sahifalarga `?v=<iz>` bilan ulanadi. Brauzer/ilova uni bir marta
yuklaydi, keyingi mavzularda xotiradan oladi (`sw.js`: versiyali fayllar keshdan darhol). Natijada har bir
taqdimot ~670 KB (siqilganda ~236 KB) o'rniga ~130 KB (siqilganda ~42 KB).

## 📲 Telefon ilovasi (PWA)

Sayt telefonga ilova sifatida o'rnatiladi — Play Market/App Store shart emas.

- **Android (Chrome):** saytni oching — pastda «📲 TerDU ilovasini o'rnating» taklifi chiqadi, **O'rnatish** ni bosing.
  Taklif chiqmasa: Chrome menyusi (⋮) → «Ilovani o'rnatish» / «Bosh ekranga qo'shish».
- **iPhone/iPad (Safari):** ⬆️ **Ulashish** → **«Bosh ekranga qo'shish»** (Add to Home Screen).
- **Har bir taqdimot tepasida «📲 Ilovani yuklash» tugmasi:** Chrome/Edge da tizimning o'rnatish oynasini ochadi,
  boshqa brauzer va iPhone'da qadamma-qadam yo'riqnoma ko'rsatadi (ilova ichida ochilganda tugma ko'rinmaydi).
- **Bir martalik tavsiya xabari:** har bir qurilmada bir marta «📲 TerDU ilovasini o'rnating» oynasi chiqadi
  (`config.json` → `pwaMsg`; qiymat o'zgartirilsa xabar hammaga yana bir marta chiqadi).

Ilova to'liq ekranda, TerDU belgisi bilan ochiladi va sayt bilan bitta kod: saytdagi har bir yangilanish ilovada ham
darhol ko'rinadi. Internet yo'q paytda oldin ochilgan sahifalar saqlangan nusxadan ochiladi (ball, chat va jonli test
uchun internet kerak).

Fayllar: `manifest.webmanifest`, `sw.js` (service worker: avval internet, bo'lmasa saqlangan nusxa; Firebase va
audio/video keshlanmaydi), `pwa.js` (o'rnatish taklifi), `fayllar/ilova/` (belgilar). Sahifalarga ulanishi
`_reyting-manba/inject.py` orqali (`<!-- PWA:BEGIN -->` bloki).

**Eslatma (iPhone):** iOS'da o'rnatilgan ilova Safari bilan xotirani bo'lishmaydi — talaba ilovada bir marta
ism, familiya va PIN bilan **🔑 Kirish** qiladi; ballari bazadan tiklanadi.

### 🔔 E'lon bildirishnomalari (Web Push)

O'qituvchi e'lon yuborganda, bildirishnomani yoqqan talabalar telefoniga xabar keladi (ilova yopiq bo'lsa ham).

- **Talaba qayerdan yoqadi:** **portalda va fan sahifasida** «🔔 E'lonlar telefoningizga kelsin → **Yoqish**» bloki,
  yoki 🏆 → **«Mening ma'lumotim» → 🔔 Telefonga bildirishnoma** (doim turadi). Blok holatni ko'rsatadi: o'chiq / yoqilgan
  («🧪 Sinov» — telefon bildirishnomani ko'rsata olishini tekshiradi) / brauzerda bloklangan (qanday ochish:
  manzil satridagi 🔒 → Ruxsatlar → Bildirishnomalar; ilovada — telefon Sozlamalar → Ilovalar → TerDU → Bildirishnomalar) /
  iPhone'da ilova o'rnatilmagan. Sahifa ochilganda pastda bir martalik taklif ham chiqadi.
  Android'da brauzerda ham, ilovada ham ishlaydi; iPhone'da faqat **bosh ekranga o'rnatilgan ilovada** (iOS 16.4+).
- **O'qituvchi e'lon yuborganda** natija ko'rinadi: «📲 Bildirishnoma: 12 / 15 qurilmaga yetdi», hech kim obuna bo'lmagan
  bo'lsa — «Hech bir talaba bildirishnomani yoqmagan», sozlanmagan bo'lsa — «🔕 … sozlanmagan», Worker javob bermasa — ogohlantirish.
- **O'qituvchi (bir marta sozlanadi, bepul):** panel → 📢 **E'lon yuborish** → 🔔 **Telefonga bildirishnoma**:
  1. «🔑 Kalit va kodni yaratish» — kalit juftligi brauzerda yaratiladi, ochiq kalit `meta/push/pub` ga yoziladi,
     maxfiy kalit faqat tayyor kod ichida chiqadi (bazaga yozilmaydi);
  2. Cloudflare'da bepul **Worker** ochib, shu kodni qo'yish (`fayllar/push-worker.js` — shablon);
  3. Worker manzilini panelga qo'yish → tekshiriladi va `meta/push/url` ga yoziladi.
  Shundan keyin har bir e'lon bilan birga bildirishnoma ketadi («E'lon yuborilganda telefonlarga ham yuborilsin»
  belgisi bilan o'chirish mumkin), «🧪 Sinov» faqat o'qituvchining o'z qurilmasiga yuboradi.
- **Qanday ishlaydi:** obuna `students/<id>/push/<k> = {e, p, a, t}` ga yoziladi; Worker o'qituvchi tokenini Google
  orqali tekshiradi (Gmail izi `teacherH` ga teng bo'lishi kerak), obunalarni o'qiydi va VAPID + aes128gcm
  (RFC 8291/8292) bilan yuboradi, eskirgan obunalarni (404/410) o'chiradi. Bildirishnomani `sw.js` ko'rsatadi;
  bosilganda sayt ochiladi (ochiq bo'lsa — o'sha oyna oldinga chiqadi).

### ⏰ Avtomatik eslatmalar

- **Mavzu ochilganda:** o'qituvchi mavzuni guruhga ochsa, o'sha guruh talabalariga «📗 N-mavzu ochildi — ball
  … yakshanba 23:59 gacha» xabari boradi (hammaga ochilsa — hammaga, bitta talabaga — o'shanga). Panelda
  «Mavzu guruhga ochilganda … xabar yuborilsin» belgisi bilan o'chiriladi. Hozirgi Worker bilan ishlaydi.
- **Shanba kechqurun:** har shanba 20:00 da ball muddati ertaga tugaydigan va mavzuni hali to'liq (100 ball)
  bajarmagan talabalarga «⏳ Ertaga 23:59 da ball muddati tugaydi — 6-mavzu: 40 / 100 ball» eslatmasi boradi.
  Buning uchun Worker bir marta yangilanadi (v2): panel → 📢 E'lon yuborish → 🔔 → **🔄 Worker kodini yangilash** —
  Cloudflare'dagi eski kodni joylaysiz, panel kalitlaringizni saqlab yangi kodni beradi; uni Cloudflare'ga qo'yib
  **Deploy**, so'ng *Settings → Triggers → Cron Triggers* ga `0 15 * * 6` (shanba 20:00, Toshkent) qo'shiladi.
  «⏰ Eslatmani hozir yuborish» — qo'lda yuborish.

## 🧪 Avtomatik sinovlar (GitHub Actions)

`tests/` papkasida brauzer sinovlari bor (Playwright, Chromium). Ular haqiqiy sahifalarni soxta (xotiradagi)
Firebase bilan ochib tekshiradi: portal va fanlar ro'yxati, texnik ishlar rejimi, yopiq mavzularning mehmonga ham yopiqligi, mehmon rejimi (hisobsiz o'qish, topbarda Kirish/Ro'yxatdan o'tish, test uchun kirish), havola nomi va rasmi,
kirish va yo'naltirish, o'qish rejimi va ball muddati, «Menga nima qoldi?»,
reyting (guruh filtri, nik, qator foni), o'qituvchi paneli (baholash, alifbo, mavzu ochish, push), chat;
shuningdek bildirishnoma Worker'ining eslatma mantiqi (haqiqiy shifrlash bilan).

```bash
cd tests && npm install && npx playwright install chromium   # bir marta
npm test                                                      # hammasi
```

Har bir `push` va pull request'da `.github/workflows/tests.yml` ularni GitHub'da avtomatik ishga tushiradi —
biror narsa buzilsa, GitHub'da qizil ❌ ko'rinadi.
