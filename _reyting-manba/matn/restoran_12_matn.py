# -*- coding: utf-8 -*-
"""R12 · Yakuniy amaliy imtihon. 6 × 10 = 60; ≥45 va kritik xatosiz.

Savol testi yo'q: baholovchi kuzatuvi va chop etiladigan bayonnoma.
"""
exec(open(MATN_DIR + "restoran_davom.py", encoding="utf-8").read())

lesson_cover(12, "Yakuniy amaliy imtihon",
    "Har tinglovchiga <b>12 daqiqa</b> · ikki bir xil stansiya · xorijiy mehmon va allergen · "
    "kechikish va alohida hisob · <b>6 mezon × 10 = 60 ball</b> · o'tish ≥45/60 va kritik xatosiz.",
    "2 soat imtihon", 14, 0)
page("Kirish shartlari va baholovchi", defn("Kirish: <b>kamida 18/20 modul soati</b>, R2 sanitariya va R5 allergen "
    "amaliy ishlari bajarilgan. Trener jurnal va individual varaqlar bilan tekshiradi. R11 va R12 natijalari alohida qayd etiladi.") +
    table(["Tashkilot", "Tartib"], [
        ["Stansiyalar", "2 ta bir xil stansiya, har birida bittadan baholovchi"],
        ["Guruh", "Har stansiyada 5 tagacha tinglovchi; bir vaqtda ikki tinglovchi baholanadi"],
        ["Vaqt", "10 daqiqa umumiy yo'riqnoma + 5 × 12 daqiqa + 10 daqiqa tiklash/yakun = 80 daqiqa"],
        ["Katta guruh", "Qo'shimcha baholash oqimi tashkil qilinadi; 12 daqiqa qisqartirilmaydi"],
        ["Muhit", "Sovuq taom maketi, bo'sh choynak, pul/karta maketi; haqiqiy to'lov va allergen taomi yo'q"]]))

page("Ikki stansiyaning bir xil jihozlari", table(["To'plam", "Tekshiruv"], [
    ["Stol va ikki o'rin", "Bir xil menyu, stol/o'rin raqami va servirovka kamchiligi"],
    ["Menyu va retsept", "R8 o'quv narxlari; sous, bezak, allergen jadvali va jarayon kartasi"],
    ["Servis", "Toza pribor, patnis, stakan, tarelka va sovuq taom maketi"],
    ["Hujjat", "Buyurtma, demo POS, chipta, shikoyat, hisob va o'quv chek blankasi"],
    ["Baholash", "Bir xil mezon, kritik xato ro'yxati, soat va bayonnoma"]]) +
    quote("Baholovchilar boshlashdan oldin bitta namuna ijroni mezon bilan solishtiradi. Har tinglovchidan keyin stansiya dastlabki holatga qaytariladi."))

page("Tinglovchi vaziyat kartasi", defn("7-stolga ikki xorijiy mehmon keladi. Ingliz tilini afzal ko'radi. "
    "1-o'rindagi mehmon <b>grek yong'og'iga allergiyasi</b> borligini bildiradi. Baliq va gazsiz suv so'raydi, lekin baliq stop-listda. "
    "2-o'rin salat va choy so'raydi. Xizmatda kechikish paydo bo'ladi; oxirida <b>alohida hisob</b> so'raladi.") +
    U("ol", "".join(U("li", x) for x in [
        "Qo'l, toza jihoz va stolning menyuga mosligini tekshiring.",
        "Til, ehtiyoj va allergenni aniqlang; oshxona bilan tarkib va jarayonni tasdiqlang.",
        "Tekshirilgan muqobilni narx/vaqt bilan taklif qilib, buyurtmani yozing va takrorlang.",
        "Taom maketini xavfsiz uzating; kechikish shikoyatiga yechim va vaqtni kelishing.",
        "Xato bandni mas'ulga tuzattiring, ikki hisob va o'quv chekni taqdim eting, xayrlashing."
    ])))

page("12 daqiqalik yo'nalish", table(["Daqiqa", "Vazifa"], [
    ["0–1", "Gigiyena, idish va kuvert tekshiruvi"], ["1–3", "Kutib olish, til, ehtiyoj va menyu"],
    ["3–5", "Allergen, oshxona javobi va tekshirilgan muqobil"], ["5–7", "Buyurtma, demo POS/chipta va uzatish"],
    ["7–9", "Kechikish, yechim, mas'ul va muddat"], ["9–11", "Tuzatish, alohida hisob, to'lov maketi va chek"],
    ["11–12", "Mehmon javobi, xayrlashuv va qaydni yakunlash"]]) +
    quote("Bu taqsimot — ishni rejalash uchun. Baholovchi 12 daqiqani boshqaradi; tezlik uchun xavfsizlik qadami tashlab ketilmaydi."))

page("Baholovchi kartasi: bir xil signallar", table(["Signal", "Baholovchi/rol ijrochisi beradigan javob"], [
    ["Allergen so'ralganda", "Walnut allergy — grek yong'og'i. Boshqa so'rov bo'lsa tinglovchi uni ham qayd etadi"],
    ["Retsept/jarayon tekshirilganda", "Mashq A: soussiz tovuq retsepti va alohida toza jihoz tasdiqlangan; narx 65 000, vaqt 20 daqiqa"],
    ["Kechikish", "Asosiy taomga yana taxminan 10 daqiqa; mehmon shikoyat qiladi"],
    ["Hisob", "Buyurilmagan desert 25 000 va unga 10% qo'shilgan"],
    ["Tuzatish so'ralganda", "Vakolatli mas'ul band va unga tegishli 2 500 xizmat haqini bekor qilishni tasdiqlaydi"],
    ["To'lov", "A 100 000 maket naqd, B 49 500 karta maketi; rozilik va chek tekshiriladi"]]) +
    quote("Taom tekshirilmasdan oshxona javobi oldindan aytib berilmaydi. Qayta baholashda teng qiyinlikdagi kartalar qo'llanadi; o'zgarish bayonnomada yoziladi."))

page("Ball darajalari: 0, 5 yoki 10", grid(3,
    card("red", "0", "Bajarilmadi", "Mezonning asosiy harakati bajarilmadi yoki qarama-qarshi harakat qilindi. Kuzatilgan fakt yoziladi."),
    card("orange", "5", "Qisman", "Mezonning bir qismi to'g'ri, ammo bir dalil yo'q yoki yo'naltiruvchi yordamdan keyin tuzatildi. Kamchilik qayd etiladi."),
    card("green", "10", "To'liq va mustaqil", "Quyidagi mezon dalillari to'liq, aniq va yo'naltiruvchi yordamsiz bajarildi.")) +
    quote("Baholovchi oddiy rol javobini beradi, yechimni o'rgatmaydi. Xavfsizlik uchun aralashish kerak bo'lsa darhol to'xtatadi va kritik xatoni tekshiradi."))

page("Mezonlar 1–2: xavfsizlik va uzatish", table(["Mezon", "10 ball uchun kuzatiladigan dalillar"], [
    ["1. Gigiyena va xavfsizlik", "Qo'l gigiyenasi; toza/ishlatilgan oqim ajratilgan; tushgan/iflos anjom almashtirilgan; yo'l va issiq idish xavfi nazorat qilingan"],
    ["2. Servirovka va taom uzatish", "Menyuga mos kuvert; anjomlar to'g'ri; patnis muvozanatli; stol/o'rin va buyurtma mos; xavfsiz tomondan ogohlantirib uzatish"]]) +
    quote("Har bir mezonga alohida 0/5/10 qo'yiladi. Masalan, to'g'ri servirovka, ammo noqulay uzatish usuli yordamdan keyin tuzatilsa — qisman 5; kritik xavf bo'lsa alohida bekor qilish qoidasi ishlaydi."))

page("Mezonlar 3–4: muloqot va allergen", table(["Mezon", "10 ball uchun kuzatiladigan dalillar"], [
    ["3. Xorijiy mehmon bilan muloqot", "Til tanlovi so'raldi; sodda nutq/menyu bilan tushuntirdi; tarkib, porsiya, narx va keyingi qadamni mehmon tushunganini tasdiqladi"],
    ["4. Menyu va allergenlar", "Aniq allergen yozildi; retsept, sous/bezak va umumiy jihoz tekshirildi; oshxona javobi qayta aytildi; faqat tasdiqlangan taom to'g'ri o'ringa uzatildi"]]) +
    quote("Talaffuzdagi kichik xato avtomatik nol emas: mezon — mazmun to'g'ri tushunilganimi? Allergen bo'yicha xavfli taxmin esa oddiy til xatosi sifatida baholanmaydi."))

page("Mezonlar 5–6: hisob va hamkorlik", table(["Mezon", "10 ball uchun kuzatiladigan dalillar"], [
    ["5. Buyurtma va hisob", "Stol/o'rin, miqdor, so'rov va POS/chipta mos; xato band mas'ul bilan tuzatildi; alohida hisob, qaytim, to'lov holati va o'quv chek mos"],
    ["6. Shikoyat va hamkorlik", "Gapni bo'lmasdan tingladi; uzr va fakt; oshxona/mas'ul bilan yechim hamda muddat; mehmon tanlovi; qayta xabar va yakuniy qayd"]]) +
    quote("A 82 500 + B 49 500 = 132 000. A 100 000 maket pul bersa qaytim 17 500. Narx va 10% xizmat — aynan shu oldindan kelishilgan o'quv vaziyatiga tegishli."))

page("Kritik xato: amaliy natija bekor bo'ladi", defn("Quyidagi xavfsizlik xatolari oldindan tushuntiriladi. Baholovchi xavfni darhol "
    "to'xtatadi, kuzatilgan harakat va vaqtni yozadi. <b>Jami ball yuqori bo'lsa ham R12 natijasi bekor</b>.") +
    table(["Kritik xato", "Kuzatiladigan misol"], [
        ["Tasdiqsiz allergen taomini uzatish", "So'rovni bilib turib tarkib/jarayonni tekshirmasdan, noma'lum sousni xavfsiz deb taqdim etish"],
        ["Ma'lum ifloslanishga qaramay uzatish", "Yerga tushgan anjomni tozalash tartibisiz qayta qo'yish yoki shisha gumonli taomni uzatish"],
        ["Bevosita xavfga javob bermaslik", "Baholovchi bergan jiddiy salomatlik/xavfsizlik signalida xizmatni davom ettirib, yordam chaqirmaslik"]]) +
    quote("Noaniqlikni payqab <b>uzatishni to'xtatish</b> kritik xato emas — to'g'ri xavfsiz qaror. Qolgan dalillar shu qaror va mas'ul bilan muloqot orqali baholanadi."))

page("Natijani hisoblash: ikki shart", table(["Misol", "Jami", "Kritik xato", "R12 natijasi"], [
    ["10 + 10 + 5 + 10 + 5 + 5", "45/60", "Yo'q", "O'tdi"],
    ["10 + 10 + 10 + 10 + 10 + 5", "55/60", "Bor", "Bekor — qayta tayyorgarlik"],
    ["5 + 10 + 5 + 10 + 5 + 5", "40/60", "Yo'q", "O'tmadi — 45ga yetmagan"]]) +
    quote("O'tish formulasi: <b>jami ≥45 VA kritik xato yo'q</b>. R11 uchun alohida ≥28/40 talab etiladi; umumiy foiz bilan bir shartni ikkinchisiga almashtirmang."))

page("Individual amaliy bayonnoma", table(["Tinglovchi: ___ Sana: ___ Stansiya: ___", "Ball", "Kuzatuv dalili"], [
    ["1. Gigiyena va xavfsizlik", "☐ 0 ☐ 5 ☐ 10", "___"],
    ["2. Servirovka va taom uzatish", "☐ 0 ☐ 5 ☐ 10", "___"],
    ["3. Xorijiy mehmon bilan muloqot", "☐ 0 ☐ 5 ☐ 10", "___"],
    ["4. Menyu va allergenlar", "☐ 0 ☐ 5 ☐ 10", "___"],
    ["5. Buyurtma va hisob", "☐ 0 ☐ 5 ☐ 10", "___"],
    ["6. Shikoyat va hamkorlik", "☐ 0 ☐ 5 ☐ 10", "___"],
    ["Jami", "___ / 60", "Boshlanish ___ Tugash ___"],
    ["Kritik xato", "☐ Yo'q ☐ Bor", "Qaysi harakat, vaqt: ___"],
    ["Natija", "☐ O'tdi ☐ O'tmadi ☐ Bekor", "Baholovchi va imzo: ___"]]) +
    quote("Bayonnomaga buyurtma, chipta, ikki hisob/o'quv chek va shikoyat qaydi ilova qilinadi. Trener hujjatlarni kurs tartibi bo'yicha saqlaydi."))

page("Yakuniy fikr va qayta tayyorgarlik", grid(2,
    card("green", "✓", "Aniq dalil", "Baholovchi bir kuchli harakat va mezon bo'yicha bitta rivojlanish vazifasini aytadi."),
    card("blue", "↻", "Qayta mashq", "Past mezon yoki kritik xato bo'yicha tegishli R2/R5/R7/R8/R9 mashqi bajariladi; yangi baholash vaqti trener bilan belgilanadi."),
    card("violet", "📄", "Ikki natija", "R11 ___/40, R12 ___/60, kritik xato ___; ikkala o'tish sharti alohida tekshiriladi."),
    card("orange", "🤝", "Kasbiy odat", "Taxmin o'rniga tekshirish, rozilik, aniq aloqa va qayd keyingi smenalarda ham davom etadi.")) +
    quote("Bu sahifa imtihonga tayyorgarlik va baholovchi blankalaridir. Saytda test bosish orqali rasmiy baho, imtihonga ruxsat yoki sertifikat avtomatik berilmaydi."))

# Amaliy imtihon kuzatuv bilan baholanadi, bo'sh yoki sun'iy test yaratilmaydi.
Q = []
