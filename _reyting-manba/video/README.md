# Restoran kursi: video tayyorlash va YouTube orqali ulash

R1–R12 darslari saytda mavjud. Ushbu bosqich R4–R6 amaliy mashqlarini boyitadi, R3–R6 uchun ssenariy va subtitr to‘plamini chiqaradi hamda restoran kursiga YouTube havolasini boshqaruvdan qo‘shish imkonini beradi. [Trener varaqalari](AMALIYOT-R3-R6.md) mavjud mashg‘ulotlarni to‘ldiradi.

## Saqlash usuli

Yangi videolarni YouTube’ga **Unlisted** holatida joylash server va Git omborining o‘sishini kamaytiradi. Saytda dars matni, mashqlar va video havolasi saqlanadi. Unlisted videoni havolasi bor boshqa odam ham ko‘ra oladi; bu pullik videoni ko‘chirish yoki ulashishdan himoya qilmaydi. YouTube ishlashi internet va xizmat mavjudligiga bog‘liq, shu sabab matnli darslar saqlanadi.

Hozirgi R1/R2 MP4lari jami taxminan 10,4 MB. Ular saqlangan; eski dars ichida ham ularga havolalar bor. YouTube nusxasi, subtitr va barcha pleyerlar tekshirilmasdan ularni o‘chirmang. Oddiy o‘chirish Git tarixini kichraytirmaydi; bu ish Git tarixini qayta yozmaydi.

## Trener uchun joylash tartibi

1. Tayyor MP4ni kursga tegishli YouTube kanaliga yuklang. Avval Unlisted ko‘rinishini tanlang; saytga joylashga ruxsat yoqilganini tekshiring.
2. To‘plamdagi `R4-youtube.txt` nom, tavsif va boblarini kiriting. Kurs uchun alohida pleylist ochish mumkin.
3. YouTube Studio subtitr bo‘limida tilni **Uzbek** tanlab, `R4.uz.srt` faylini vaqt belgilari bilan yuklang va e’lon qiling. Ushbu animatsiyalar ovozsiz: tushuntirish ekranda va subtitrda. Avtomatik ovoz tanishga tayanmang.
4. Telefon va kompyuterda subtitr, boblar, video ochilishi hamda darsga havolani tekshiring. Bolalar uchun mo‘ljallanganlik va boshqa kanal parametrlarini haqiqiy auditoriya asosida belgilang.
5. Saytda administrator sifatida **Sayt boshqaruvi → Mavzu videolari → Video kursi → Restoran xodimlari malakasini oshirish** bo‘limini oching. Tegishli R-darsni tanlab, haqiqiy YouTube URL va tushunarli nomni qo‘shing.
6. Restoran kursiga ruxsati bor hisob bilan darsdagi **Video** tugmasini tekshiring. Ruxsatsiz hisobga havola berilmaydi. YouTube oynasi faqat tugma bosilganda yuklanadi; restoran videosida o‘zbekcha subtitr so‘raladi. YouTube foydalanuvchi sozlamalari va mavjud trekka qarab subtitr ko‘rsatadi.
7. YouTube havolasi bor darsda shu pleyer asosiy tugma bo‘ladi. Havola olib tashlansa R1/R2ning mavjud MP4 tugmasi qaytadi. Video ochilmasa tashqi YouTube havolasi yoki dars matni bilan davom etish mumkin.

Bu vositalar YouTube’ga avtomatik yuklamaydi. Kanal paroli yoki tokeni kodga kiritilmaydi. Haqiqiy video havolasi bo‘lmaguncha saytdagi darsga sinov identifikatori qo‘shilmaydi.

## Manbalardan to‘plam chiqarish

Repozitoriy ildizidan, Node.js, Playwright, Chromium, Python va FFmpeg mavjud muhitda:

```bash
NODE_PATH=studyquest/node_modules SQ_BROWSER_EXECUTABLE=/usr/bin/chromium \
  node _reyting-manba/video/youtube-kit.js /workspace/artifacts/restoran-r3-r6 r3 r4 r5 r6
```

Bu buyruq haqiqiy animatsiya vaqtlaridan SRT/VTT, ssenariy matni, YouTube tavsifi va boblar, 9 ta sahna rasmi hamda brauzerda ko‘riladigan animatsiyani chiqaradi. `manifest.json` qaysi MP4lar mavjudligini alohida ko‘rsatadi. `index.html` to‘plamni ochish sahifasi. R3 ssenariysi avvalgi manbadan olinadi; R3 darsi o‘zgartirilmaydi.

MP4ni alohida chiqarish:

```bash
NODE_PATH=studyquest/node_modules SQ_BROWSER_EXECUTABLE=/usr/bin/chromium \
  FILM_OUT_DIR=/workspace/artifacts/restoran-r3-r6 \
  node _reyting-manba/video/film.js r4
```

`r4` o‘rniga navbat bilan `r3`, `r5`, `r6` ishlatiladi. Film 1920×1080, 25 kadr/soniya, H.264 MP4 hamda VTT va muqova chiqaradi. Subtitr MP4 ichiga kuydirilmaydi; YouTube’ga SRT alohida yuklanadi. MP4 chiqqach to‘plam buyrug‘ini qayta ishlating: ochish sahifasida video havolasi paydo bo‘ladi.

`FILM_OUT_DIR` berilmasa eski standart joy `fayllar/video` ishlatiladi. Yangi ishda katta videolarni Gitga qo‘shmaslik uchun tashqi artefakt papkasini ko‘rsating. Ko‘rish serveri faqat mahalliy kompyuterda, ruxsat etilgan sahna va ssenariy fayllarini beradi.

## Saqlanishi kerak bo‘lgan ma’lumotlar

Video qo‘shish faqat saytning `videos/<dars>` yozuvini o‘zgartiradi. Akademik ballar, o‘qish tarixi, imtihon mezonlari va R1–R3 dars manbalari bu ishda o‘zgartirilmaydi. Pullik kursning video ro‘yxati autentifikatsiya va kurs ruxsatini tekshiradi hamda umumiy keshga qo‘yilmaydi. Oddiy birinchi kursning avvalgi ochiq video ishlashi saqlanadi.
