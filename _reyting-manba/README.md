# Reyting tizimi — manba fayllari

- `engine_css.txt` / `engine_js.txt` — reyting dvigateli (CSS va JS)
- `config.json` — ballar, o'qituvchi kodi, Firebase konfiguratsiyasi va mavzular ro'yxati (ochiq/yopiq)
- `inject.py` — dvigatelni barcha taqdimotlarga o'rnatadi (qayta ishga tushirsa yangilaydi)

**Mavzuni ochish tartibi:** `config.json` da kerakli mavzuning `"open"` qiymatini `true` qiling →
mavzu faylini `yopiq-mavzular` shoxchasidan asosiy shoxchaga qaytaring → `python3 inject.py` →
commit va push. Papka nomi `_` bilan boshlangani uchun GitHub Pages uni saytga chiqarmaydi.
