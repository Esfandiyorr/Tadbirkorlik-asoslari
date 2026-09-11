# Reyting, tasdiqlash va chat tizimi — manba fayllari

- `engine_css.txt` / `engine_js.txt` — reyting va ro'yxatdan o'tish dvigateli
- `chat_css.txt` / `chat_js.txt` — chap tomondagi talabalar chati
- `music_css.txt` / `music_js.txt` — o'ng tomondagi musiqa pleyeri
- `config.json` — ballar, o'qituvchi kodi, Firebase konfiguratsiyasi, mavzular va qo'shiqlar ro'yxati
- `inject.py` — hamma narsani barcha taqdimotlarga o'rnatadi (qayta ishga tushirsa yangilaydi)

## Firebase qoidalari (Rules)

Realtime Database → **Rules** bo'limiga faqat shuni qo'ying (eskisini butunlay o'chirib):

```json
{"rules":{"students":{".read":true,".write":true},"chat":{".read":true,".write":true}}}
```

`chat` bo'lmasa chat ishlamaydi.

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
- Haqoratli so'zlar, rasm/video havolalari va `<img>` avtomatik to'sib qo'yiladi;
  xabar 300 belgidan oshmaydi, ketma-ket yozish 2,5 soniyaga cheklangan.
- O'qituvchi kodini kiritgan brauzerda har bir xabar yonida 🗑 tugmasi chiqadi.

**Mavzuni ochish tartibi:** `config.json` da kerakli mavzuning `"open"` qiymatini `true` qiling →
mavzu faylini `yopiq-mavzular` shoxchasidan asosiy shoxchaga qaytaring → `python3 _reyting-manba/inject.py` →
commit va push. Papka nomi `_` bilan boshlangani uchun GitHub Pages uni saytga chiqarmaydi.
