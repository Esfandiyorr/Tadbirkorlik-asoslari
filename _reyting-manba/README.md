# Reyting, tasdiqlash va chat tizimi — manba fayllari

- `engine_css.txt` / `engine_js.txt` — reyting va ro'yxatdan o'tish dvigateli
- `chat_css.txt` / `chat_js.txt` — chap tomondagi talabalar chati
- `music_css.txt` / `music_js.txt` — o'ng tomondagi musiqa pleyeri
- `config.json` — ballar, o'qituvchi kodi, Firebase konfiguratsiyasi, mavzular va qo'shiqlar ro'yxati
- `inject.py` — hamma narsani barcha taqdimotlarga o'rnatadi (qayta ishga tushirsa yangilaydi)

## Firebase qoidalari (Rules)

Realtime Database → **Rules** bo'limiga faqat shuni qo'ying (eskisini butunlay o'chirib):

```json
{"rules":{"students":{".read":true,".write":true},"chat":{".read":true,".write":true},"media":{".read":true,".write":true},"meta":{".read":true,".write":true},"arena":{".read":true,".write":true}}}
```

Beshala bo'lim ham kerak: `chat` — xabarlar, `media` — rasm va videolar,
`meta` — tozalash vaqti, `arena` — o'yin musobaqalari. `media` bo'lmasa rasm yuborishda "Fayl yuborilmadi" chiqadi.

**Tekshirish:** 🏆 → 🔑 O'qituvchi → **🔎 Chat tekshiruvi** tugmasi to'rttala bo'limga
sinov yozuvi yozib ko'radi va qaysi biri yopiqligini ko'rsatadi.

## Yangi talabani tasdiqlash

1. Talaba ism, familiya va guruhini kiritadi → ekranda “⏳ O'qituvchi tasdig'ini kuting” chiqadi.
2. Siz 🏆 tugmasi → **🔑 O'qituvchi** bo'limiga kirasiz (kod: `config.json` dagi `teacher`).
3. “⏳ Tasdiq kutmoqda” ro'yxatidan **✅ Tasdiqlash** yoki **❌ Rad etish** ni bosasiz.
4. Talabaning sahifasi 12 soniyada o'zi ochiladi (yoki u 🔄 Tekshirish ni bosadi).

Tasdiqlanmagan talabaga ball berilmaydi va chat ochilmaydi. Tasdiqlangan talabani keyin
**🚫 Bloklash** orqali chiqarib yuborish mumkin — uning sahifasi 1 daqiqada o'zi yopiladi.

## Chat

- Chap chetdagi 💬 tugmasi orqali ochiladi; faqat tasdiqlangan talabalar yozadi.
- Qoidalar eslatmasi chat tepasida doim turadi.
- Haqoratli so'zlar avtomatik to'sib qo'yiladi; xabar 300 belgidan oshmaydi,
  ketma-ket yozish 2,5 soniyaga cheklangan.
- O'qituvchi kodini kiritgan brauzerda har bir xabar yonida 🗑 tugmasi,
  chat tepasida esa 🧹 (hammasini tozalash) tugmasi chiqadi.

### Rasm va video

- Odatda **hamma talabaga yopiq**: 📎 tugmasi ko'rinmaydi, rasm/video havolalari to'siladi.
- O'qituvchi bo'limida tasdiqlangan talaba yonidagi **🔒 Rasm yopiq / 🖼 Rasm ochiq**
  tugmasi bilan har bir talabaga alohida ruxsat beriladi yoki qaytarib olinadi
  (`students/<id>/media` maydoni). Talabada 5 soniyada o'zi ochiladi.
- Rasm brauzerda 1000 px gacha kichraytiriladi va JPEG ga siqiladi (~10-150 KB).
- Video **5 MB gacha** — bu Realtime Database cheklovi: video base64 matn bo'lib
  saqlanadi, bitta matn maydoni esa ~10 MB dan oshmaydi. Kattaroq video uchun
  YouTube (pleyer bo'lib chiqadi) yoki Google Drive/Telegram havolasi.
- Ruxsat berilgan talabaning havolalari bosiladigan bo'ladi (`lk` maydoni);
  ruxsatsizlarda havola oddiy matn bo'lib qoladi.
- Media asosiy xabardan alohida `media/` bo'limida saqlanadi va faqat ko'rilganda
  yuklanadi — shuning uchun har 5 soniyalik yangilanish trafikni yemaydi.

### Haftalik tozalash

- Har qanday ochiq sahifa yarim soatda bir marta `meta/cleanAt` ni tekshiradi va:
  - **videolarni 1 kundan keyin** o'chiradi (media yozuvi o'chadi, xabarda matn bo'lsa
    matni qoladi va "🎬 Video muddati tugadi" deb ko'rsatiladi, matnsiz bo'lsa xabar ham o'chadi);
  - **matn va rasmlarni 7 kundan keyin** butunlay o'chiradi.
- Video kaliti `v` bilan, rasm kaliti `m` bilan boshlanadi — muddat shu bo'yicha ajratiladi.
- Vaqt kalitning ichida saqlanadi (`c00001736…_ab12`), shuning uchun tozalash
  xabar matnini yuklamasdan (`?shallow=true`) ishlaydi.

**Mavzuni ochish tartibi:** `config.json` da kerakli mavzuning `"open"` qiymatini `true` qiling →
mavzu faylini `yopiq-mavzular` shoxchasidan asosiy shoxchaga qaytaring → `python3 _reyting-manba/inject.py` →
commit va push. Papka nomi `_` bilan boshlangani uchun GitHub Pages uni saytga chiqarmaydi.

## Yangi mavzu qo'shish (tez yo'l)

`yangi_mavzu.py` — tayyor taqdimotdan **faqat matnni** almashtiradigan yig'uvchi.
Reyting, chat, musiqa, uz/eng, test dvigateli, tun/kun, klaviatura — hammasi
shablondan o'zgarishsiz o'tadi.

1. `mavzu_N_matn.py` yozing: `slide(sarlavha, sarlavha_en, HTML)` bilan slaydlar,
   har bir matn `d(uz, en)` orqali (u `data-i="N"` qaytaradi va EN lug'atiga yozadi),
   oxirida `Q=[{q,a,c,e,qe,ae,ee}, ...]` — 15 ta savol. **Ochiq savol** (talaba javobni o'zi yozadi — bitta so'z
   yoki son): `{q, o:[qabul qilinadigan javoblar], e, qe, oe:[...], ee}`. Tekshiruvda katta-kichik harf, tutuq belgisi,
   bo'shliq va kirill/lotin farq qilmaydi, 6+ harfli so'zda bitta harf xatosi kechiriladi, son javobda faqat raqamlar
   solishtiriladi. Ochiq savolni qo'llaydigan test dvigateli `mavzu-6.html` da — shablon sifatida uni bering (6-argument).
2. `tekshir(Q)` — har bir savolda 4 variant uzunligi farqi 4 belgidan oshmasligini
   tekshiradi (talab: to'g'ri va noto'g'ri javoblar bir xil uzunlikda).
3. `python3 _reyting-manba/yangi_mavzu.py mavzu_N_matn.py mavzu-N.html "Sarlavha" N` (ochiq savollar bo'lsa oxiriga `"" mavzu-6.html`)
4. `config.json` → `topics` ga `{"id":"mN","file":"mavzu-N.html","open":false}` qo'shing,
   `inject.py` dagi `DECKS` ga ham qo'shing, so'ng `python3 _reyting-manba/inject.py`.
5. Yangi mavzu **yopiq** holda `yopiq-mavzular` shoxchasiga, `config.json` va
   qayta o'rnatilgan `index.html` asosiy shoxchaga commit qilinadi.


## O'yin arenasi (`arena.html`)

Talabalar o'rtasidagi 2–4 kishilik musobaqa: xona yaratiladi, kod yoki havola
bilan qo'shiladi, 3–10 ta mini-o'yin ketma-ket o'ynaladi, har raundda o'rin
bo'yicha ball beriladi (100 / 75 / 50 / 25, teng natijalar o'rtacha oladi).

- Kirish: darsdagi hisob bilan (`terdu_student`), o'qituvchi tasdig'i talab qilinadi.
- Ma'lumotlar: `arena/rooms/<KOD>` (meta, players, state, scores, pts, tot) va
  `arena/public/<KOD>` — ochiq musobaqalar ro'yxati. **Tarix saqlanmaydi.**
- Host raundni boshlaydi va ballni hisoblaydi; host 25 soniya ko'rinmasa,
  ro'yxatdagi birinchi faol o'yinchi uning o'rnini egallaydi.
- **Arena ballari dars reytingidan butunlay ajratilgan:** ular `students/` ga
  yozilmaydi, hech qayerda to'planmaydi va musobaqa tugashi bilan ahamiyatini
  yo'qotadi. O'yin — talabalar uchun kichik chalg'ish, baho vositasi emas.
- Tugagan xona 3 daqiqadan keyin o'chiriladi, tashlab ketilgani 6 soatdan keyin
  (`arena/meta/cleanAt` qulfi bilan).
- **14 ta o'yin:** viktorina, so'z topish, 2048, **ilon dueli** (2 kishilik), xotira kartalari, tez yozish,
  reaksiya, matematika, rasm topish, **josus (3–12 kishi)**, uch toshcha,
  **shashka**, **shaxmat**, **jang maydoni** (Risk uslubidagi strategiya).
- **Josus:** 25 ta joy, har birida 8 ta rol (qorovul, shifokor, farrosh…);
  3–7 kishida 1 ta josus, 8–13 da 2 ta, 14+ da 3 ta josus bo'ladi va ular
  bir-birini biladi.
- **Ilon dueli:** ikki o'yinchi bitta maydonda. Harakat sekin (450 ms),
  shuning uchun o'ylab yurish kerak. Sinxronlash determinatsiyalangan:
  ikkala brauzer bir xil urug'dan bir xil o'yinni hisoblaydi, faqat
  yo'nalish o'zgarishlari (tik raqami bilan) bazaga yoziladi va butun
  o'yin har kadrda qaytadan hisoblanadi — kechikkan buyruq ham o'z
  joyiga tushadi. Raqibning tanasiga, devorga yoki o'ziga urilsa — mag'lub;
  peshma-pesh urilsa — durrang.
- **Jang maydoni:** 30 ta olti burchakli hudud, 5 ta mintaqa bonusi, 14 ta
  karta, energiya (10 + 5×egallangan hudud, maks 25), qo'shin = hudud/2 +
  bonuslar. Raund: rejalashtirish (62 s) → bir vaqtda simulyatsiya → natija.
  8 raund yoki maxfiy topshiriq bajarilgunicha. Jamoa rejimi 2×2 ham bor.
- **Xona 20 kishigacha:** yaratishda 4/6/8/12/16/20 tanlanadi. Ball o'rin bo'yicha
  taqsimlanadi (1-o'rin 100, oxirgisi 10). Juftlik o'yinlari (uch toshcha,
  shashka, shaxmat) o'yinchilarni juftlarga bo'ladi, toq qolgani o'rtacha ball oladi.
- **Yolg'iz mashq:** bosh sahifadagi 🎯 tugmasi bitta kishilik xona ochadi.
- **🟢 Hozir onlayn va taklif:** arenaga kirgan talaba `arena/on/<sid>` ga har 15 soniyada belgi qo'yadi (server vaqti,
  45 soniyadan eskisi oflayn). Bosh sahifada onlaynlar ro'yxati (🟢 bo'sh / 🎮 o'yinda) va «⚔️ Taklif» tugmasi: o'yin
  tanlanadi (Shashka, Shaxmat, To'rttalik, Puzzle duel) → taklif qiluvchi 2 kishilik yopiq xona ochadi (`meta.duel`) va
  `arena/inv/<kimga>/<kimdan>` ga yozadi. Taklif olgan talabada oyna chiqadi (60 soniya): **Qabul** — xonaga kiradi va host
  o'yinni darhol boshlaydi; **Rad** — `meta.dec`, taklif qiluvchida «rad etdi». Javob bo'lmasa — «javob bermadi», qayta
  taklif qilish mumkin. O'yin oxirida «🔁 Revansh».
- **⏳ Kutilayotgan o'yinlar:** «O'yin ochish» — bitta o'yinli ochiq xona (`meta.quick`, `arena/public/<KOD>`: `n`/`max`).
  Ro'yxatda o'yin, kim ochgani, joylar (●●○) va «yana N joy» ko'rinadi; joylar to'lganda o'yin o'zi boshlanadi va
  ro'yxatdan chiqadi (host «Boshlash» ni ertaroq ham bosishi mumkin).
- **Yangi o'yinlar:** 🧩 **Puzzle duel** (juftlik, 4×4, har biriga boshqa rasm; kim birinchi yig'sa — g'olib, raqibning
  taxtasi qotadi), 🖼 **Jamoaviy puzzle** (hamma bitta rasmni birga yig'adi: 2 kishi — 4×4, 5 daqiqa; 3–4 — 5×5, 8 daqiqa;
  5+ — 6×6, 10 daqiqa; qadamlar `rooms/<KOD>/pz/r<N>/m` da, har bir brauzer bir xil tartibda qo'llaydi), 🟡 **To'rttalik**
  (Connect Four), 🔢 **Sudoku poygasi** (6×6, hammaga bir xil; har qanday to'g'ri yechim qabul qilinadi). Puzzle rasmlari
  saytning o'zida SVG bilan chiziladi (13 ta: Samarqand, Toshkent, Parij, Nyu-York, Dubay, Tokio, London, bozor, bank,
  zavod, port, startap, fermer xo'jaligi) — tashqi fayl va litsenziya talab qilmaydi.

**Cheklov (halol eslatma):** sayt GitHub Pages'da, ya'ni serversiz ishlaydi.
Shuning uchun ballni serverda qayta hisoblash imkoni yo'q. Himoya choralari:
har bir o'yinchi faqat o'z natijasini yozadi, bir raundga bitta natija
qabul qilinadi, natija raund oynasidan tashqarida hisobga olinmaydi va
hammasi o'qituvchiga ko'rinadigan bazada saqlanadi. Bu oddiy aldashni
to'xtatadi, lekin brauzer konsolini biladigan talabani to'xtata olmaydi.


## ⌨️ Yozuv Marafoni (`arena.html#/yozuv`)

Tez yozish poygasi: matnni qancha tez va to'g'ri yozsang, yuguruvching shuncha
tez yuguradi. Yuguruvchining yo'lakdagi o'rni = matnning to'g'ri yozilgan qismi.

**Fayllar** (`inject.py` ularni `arena.html` ga alohida `<script>` bloklari qilib qo'yadi):

| Fayl | Nima |
|---|---|
| `yozuv.js` | O'yinning o'zi (`YZ` moduli): stadion grafikasi (Canvas), 48 xil yuguruvchi, yozish mexanikasi, mashq, jonli poyga, natija ekrani, ovozlar |
| `yozuv_matnlar.json` | Matnlar: faqat tadbirkorlik va iqtisod mavzusida, lotin alifbosida — o'zbekcha va inglizcha × 3 daraja (oson, o'rta, qiyin), har birida 15 ta. `fayllar/yozuv-matnlar.json` ga ham nusxa ko'chiriladi (o'qituvchi formasi uchun) |
| `yozuv_ball.js` | Rasmiy natija hisobi `yzScore()` — arenaga va taqdimot dvigateliga (`/*@YZBALL@*/` o'rniga) **aynan bir xil** qo'yiladi |

**Mashq poygasi** — server shart emas: 0–5 ta bot (tezligi talabaning so'nggi
natijalariga moslashadi) va shaxsiy rekord "sharpasi". Rekordlar
`localStorage` da (`yz_pb_v1`, `yz_hist_v1`, `yz_look_v1`, `yz_set_v1`);
eng yaxshi natija qiziqish uchun `arena/yzrec/<til>/<sid>` ga ham yoziladi
(reytingga ta'sir qilmaydi).

**Yozish qoidalari:** xato harf qizil, to'g'risi yashil; so'z faqat to'liq
to'g'ri yozilib bo'shliq bosilganda qabul qilinadi. Tutuq belgisining
barcha ko'rinishlari (' ‘ ’ ʻ ʼ ` ´) bir xil qabul qilinadi; kirill harf
yozilsa, klaviaturani lotin (EN) tiliga o'tkazish eslatiladi. Qo'yish (paste) va
bir urinishda 2 tadan ortiq belgi (avtomatik to'ldirish) qabul qilinmaydi.

**Jonli poyga** — o'qituvchi taqdimotdagi panelda («⚡ Jonli test» bo'limi →
«⌨️ Yozuv marafoni: jonli poyga tuzish») tuzadi: rejim (🏁 marra yoki
⏱ 1/2/3/5 daqiqa), til, daraja, matn (tasodifiy, ro'yxatdan yoki o'zi
yozgan), sana-vaqt, lobbi, kamida necha kishi, eslatma. Mavjud
`kahoot` qoidalari ishlatiladi, yangi qoida kerak emas:

- `kahoot/idx/<sana-yHHMM>` — `{type:"yz", sp:true, start, open, end, mode, dur, lang, lvl, min, note}`;
  kalit kunlik jonli testniki bilan to'qnashmaydi.
- `kahoot/games/<kalit>/q/0/t` — matn (startdan 4 soniya oldin ochiladi);
  `q/i`, `k/i` (i = 1…so'zlar soni) — har bir so'z nazorat nuqtasi.
- qo'shilish: `p/<sid>` (faqat lobbi vaqtida); talaba i-so'zni tugatganda
  `a/i/<sid> = {c:0, t: server vaqti}` bir marta yoziladi.
- `arena/yz/<kalit>/<sid>` — jonli o'rinlar (faqat animatsiya uchun), 2 kundan keyin tozalanadi.

O'rin: eng uzoq yetgan nazorat nuqtasi → unga ertaroq yetgan. Soniyasiga 15
belgidan tez natija shubhali deb belgilanadi. Kamida `min` kishi qatnashsa,
**1-o'rin +5, 2-o'rin +4, 3-o'rin +3 ball** umumiy reytingga qo'shiladi
(`khTotals`/`khAuto` → `gScore()`), poyga taqdimotlarda 20 daqiqa oldin
katta e'lon bilan ko'rsatiladi.

**Do'stlar bilan poyga (xona)** — talabalarning o'zi ochadi (Yozuv Marafoni o'qituvchi
tomonidan ochiq bo'lsagina): «➕ Xona ochish» → 4 belgili kod, 2–6 kishi kod yoki
«ochiq xonalar» ro'yxati orqali kiradi, xona egasi «▶ Poygani boshlash» ni bosadi
(5 soniyadan keyin start). Ma'lumot `arena/yzr/<KOD>` da (`meta` + `pl`), natija
o'yinchilar brauzerida hisoblanadi va **reytingga ta'sir qilmaydi**. «Shu xonada yana»
— egasi yangi matn bilan yangi raund ochadi; egasi chiqsa, xona keyingi o'yinchiga o'tadi;
6 soatdan eski xonalar tozalanadi.
