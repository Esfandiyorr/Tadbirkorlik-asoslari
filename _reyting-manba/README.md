# Reyting, tasdiqlash va chat tizimi — manba fayllari

- `engine_css.txt` / `engine_js.txt` — reyting va ro'yxatdan o'tish dvigateli
- `chat_css.txt` / `chat_js.txt` — chap tomondagi talabalar chati
- `music_css.txt` / `music_js.txt` — o'ng tomondagi musiqa pleyeri
- `config.json` — ballar, o'qituvchi kodi, Firebase konfiguratsiyasi, mavzular va qo'shiqlar ro'yxati
- `inject.py` — hamma narsani barcha taqdimotlarga o'rnatadi (qayta ishga tushirsa yangilaydi)

## Firebase qoidalari (Rules)

Realtime Database → **Rules** bo'limiga faqat shuni qo'ying (eskisini butunlay o'chirib):

```json
{"rules":{"students":{".read":true,".write":true},"chat":{".read":true,".write":true},"media":{".read":true,".write":true},"meta":{".read":true,".write":true}}}
```

To'rttala bo'lim ham kerak: `chat` — xabarlar, `media` — rasm va videolar,
`meta` — haftalik tozalash vaqti.

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
