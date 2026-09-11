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
   oxirida `Q=[{q,a,c,e,qe,ae,ee}, ...]` — 15 ta savol.
2. `tekshir(Q)` — har bir savolda 4 variant uzunligi farqi 4 belgidan oshmasligini
   tekshiradi (talab: to'g'ri va noto'g'ri javoblar bir xil uzunlikda).
3. `python3 _reyting-manba/yangi_mavzu.py mavzu_N_matn.py mavzu-N.html "Sarlavha" N`
4. `config.json` → `topics` ga `{"id":"mN","file":"mavzu-N.html","open":false}` qo'shing,
   `inject.py` dagi `DECKS` ga ham qo'shing, so'ng `python3 _reyting-manba/inject.py`.
5. Yangi mavzu **yopiq** holda `yopiq-mavzular` shoxchasiga, `config.json` va
   qayta o'rnatilgan `index.html` asosiy shoxchaga commit qilinadi.


## O'yin arenasi (`arena.html`)

Talabalar o'rtasidagi 2–4 kishilik musobaqa: xona yaratiladi, kod yoki havola
bilan qo'shiladi, 3–10 ta mini-o'yin ketma-ket o'ynaladi, har raundda o'rin
bo'yicha ball beriladi (100 / 75 / 50 / 25, teng natijalar o'rtacha oladi).

- Kirish: darsdagi hisob bilan (`terdu_student`), o'qituvchi tasdig'i talab qilinadi.
- Ma'lumotlar: `arena/rooms/<KOD>` (meta, players, state, scores, pts, tot),
  `arena/public/<KOD>` — ochiq musobaqalar ro'yxati, `arena/hist/<talaba>` — tarix.
- Host raundni boshlaydi va ballni hisoblaydi; host 25 soniya ko'rinmasa,
  ro'yxatdagi birinchi faol o'yinchi uning o'rnini egallaydi.
- Xonalar 24 soatdan keyin avtomatik o'chiriladi (`arena/meta/cleanAt` qulfi bilan).
- 10 ta o'yin: viktorina, so'z topish, 2048, ilon, xotira kartalari, tez yozish,
  reaksiya, matematika, rasm topish (birgalikda chiziladi), uch toshcha.

**Cheklov (halol eslatma):** sayt GitHub Pages'da, ya'ni serversiz ishlaydi.
Shuning uchun ballni serverda qayta hisoblash imkoni yo'q. Himoya choralari:
har bir o'yinchi faqat o'z natijasini yozadi, bir raundga bitta natija
qabul qilinadi, natija raund oynasidan tashqarida hisobga olinmaydi va
hammasi o'qituvchiga ko'rinadigan bazada saqlanadi. Bu oddiy aldashni
to'xtatadi, lekin brauzer konsolini biladigan talabani to'xtata olmaydi.
