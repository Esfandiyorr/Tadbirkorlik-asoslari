# -*- coding: utf-8 -*-
"""R11 · Yakuniy nazariy imtihon: 30 × 1 + 2 × 5 = 40; o'tish 28.

Ochiq taqdimot — tayyorgarlik to'plami. Rasmiy nazorat va bayonnoma trenerda.
Savollar tartibi: servis 6; sanitariya/allergen 8; xalqaro/muloqot 6;
buyurtma/hisob 6; shikoyat/xavfsizlik 4.
"""
exec(open(MATN_DIR + "restoran_davom.py", encoding="utf-8").read())

lesson_cover(11, "Yakuniy nazariy imtihon",
    "<b>30 ta test + 2 ta vaziyatli topshiriq = 40 ball</b> · o'tish: kamida 28/40 · "
    "kirish shartlari · vaqt · baholash mezoni · tayyorgarlik testi va bayonnoma blankasi.",
    "2 soat imtihon", 24, 30)
page("Imtihonga kirish va tayyorgarlik", defn("Trener uchta dalilni tekshiradi: <b>kamida 18/20 modul soati</b>, "
    "<b>R2 sanitariya amaliy ishi</b> va <b>R5 allergen amaliy ishi</b> bajarilgan. Saytdagi dars ochilishi yoki test foizi "
    "davomat va amaliy ish bajarilganini avtomatik tasdiqlamaydi.") +
    table(["Tinglovchi: __________", "Dalil", "Trener belgisi"], [
        ["Modul davomati", "___ / 20 soat; jurnal: ___", "☐ Kamida 18"],
        ["Sanitariya", "R2 kuzatuv varag'i, sana: ___", "☐ Bajarilgan"],
        ["Allergen", "R5 buyurtma va tekshiruv qaydi, sana: ___", "☐ Bajarilgan"],
        ["Kirish", "Sana ___; trener ___", "☐ Ruxsat / ☐ Qayta tayyorgarlik"]]))
page("Vaqt va umumiy baholash", table(["Qism", "Vaqt", "Maksimum"], [
    ["Yo'riqnoma", "5 daqiqa", "—"], ["30 ta test", "35 daqiqa", "30 × 1 = 30"],
    ["2 ta vaziyatli topshiriq", "40 daqiqa (har biriga 20)", "2 × 5 = 10"],
    ["Jami", "80 daqiqa", "40 ball"]]) +
    quote("R11 o'tish: <b>kamida 28/40</b>. R12 alohida: kamida 45/60 va kritik xatosiz. Bir qismdagi yuqori ball ikkinchisining o'tish shartini almashtirmaydi."))
page("Savollar taqsimoti", table(["Yo'nalish", "Savol raqamlari", "Soni", "Tayanch dars"], [
    ["Servis", "1–6", "6", "R1, R3"], ["Sanitariya va allergenlar", "7–14", "8", "R2, R5"],
    ["Xorijiy mehmon va xalqaro amaliyot", "15–20", "6", "R4, R6"],
    ["Buyurtma va hisob", "21–26", "6", "R7, R8"], ["Shikoyat va xavfsizlik", "27–30", "4", "R9, R10"]]) +
    quote("Bu raqamlar manbadagi va bosma nusxadagi tartibdir. Saytdagi tayyorgarlik testida savollar va javoblar aralashtiriladi."))
page("Tinglovchi yo'riqnomasi", U("ol", "".join(U("li", x) for x in [
    "Trener bergan variant va javob blankasiga ism, sana va guruhni yozing.",
    "Har testga bitta javob: to'g'ri — 1, noto'g'ri yoki javobsiz — 0. Salbiy ball yo'q.",
    "Vaziyatlarda harakat ketma-ketligi, kim bilan aloqa, qayd va to'xtash qarorini yozing.",
    "Noaniq tarkib yoki xavfli vaziyatda taxmin qilmang; nima tekshirilishini aniq ayting.",
    "Vaqt tugaganda javoblarni topshiring; yakuniy bahoni baholovchi bayonnomaga kiritadi."
    ])) + quote("Saytdagi ochiq savollar va mezonlar <b>tayyorgarlik</b> uchun. Rasmiy imtihon trener nazoratidagi nusxada o'tkaziladi; brauzer natijasi rasmiy 40 ballik baho emas."))
page("Test javoblari blankasi", table(["1–10", "11–20", "21–30"], [
    [f"{i}. ☐ A ☐ B ☐ C ☐ D", f"{i+10}. ☐ A ☐ B ☐ C ☐ D", f"{i+20}. ☐ A ☐ B ☐ C ☐ D"] for i in range(1,11)]) +
    U("p", "To'g'ri javoblar: ___ / 30 · Baholovchi: ___ · Sana: ___") +
    quote("Chop etishda yangi_mavzu generatori yaratgan taqdimotdagi savol tartibidan foydalaning. Aralashtirilgan brauzer testining tartibini bosma blankaga ko'chirmang."))

page("Vaziyat A: xorijiy mehmon va allergen", defn("7/1 mehmon ingliz tilini tanlaydi va <b>grek yong'og'iga allergiyasi</b> borligini aytadi. "
    "Salatdagi sous yorlig'i topilmadi; oshxona «o'xshash sous bo'lsa kerak» deydi. Mehmon shoshayotganini bildiradi.") +
    grid(2,
        card_ul("blue", "✍️", "Yozma javob — 20 daqiqa", ["Mehmonga nima deysiz? Sodda inglizcha ibora bilan yozing", "Qaysi tarkib va jarayonni kimdan tekshirasiz?", "Noaniq javobda qanday qaror qilasiz?", "Buyurtma va yakuniy yechimni qanday qayd etasiz?"]),
        card("green", "📝", "Javob joyi", "1. ____________________<br>2. ____________________<br>3. ____________________<br>4. ____________________<br>5. ____________________")))
page("Vaziyat A: baholash mezoni — 5 ball", table(["Mezon", "1 ball uchun dalil"], [
    ["1. Aniqlik", "Stol/o'rin va grek yong'og'i allergiyasini yozadi, mehmonga qayta tasdiqlaydi"],
    ["2. Manba", "Sous yorlig'i/retsept, bezak va boshqa tarkibni mas'uldan tekshiradi"],
    ["3. Jarayon", "Umumiy anjom/sirt va alohida tayyorlash imkonini oshxonadan so'raydi"],
    ["4. Xavfsiz qaror", "Noaniq sousli taomni uzatmaydi; mas'ulga yetkazadi, faqat tekshirilgan muqobil"],
    ["5. Muloqot va qayd", "Sodda ibora, keyingi qadam/vaqt va mehmon tanlovini qayd etadi"]]) +
    quote("Har mezon: dalil aniq bo'lsa 1, yo'q yoki qarama-qarshi bo'lsa 0. Namuna: «Let me check the ingredients and preparation with our kitchen. I cannot confirm this sauce yet.»"))

page("Vaziyat B: xato hisob va kechikish", defn("Ikki mehmon: A — tovuq 65 000 va suv 10 000; B — salat 30 000 va choy 15 000. "
    "Mashqda oldindan kelishilgan xizmat 10%. Hisobga buyurilmagan desert 25 000 qo'shilgan. Mehmonlar kechikishdan ham norozi "
    "va alohida hisob so'raydi. A 100 000 naqd beradi, B karta maketi bilan to'laydi.") +
    U("ol", "".join(U("li", x) for x in [
        "Shikoyatni qabul qilish va xato bandni tekshirish harakatlarini yozing.",
        "Kim tuzatadi, nima sabab bilan va qanday qayd qoladi?",
        "Xato umumiy, to'g'ri umumiy, A va B hisobini hamda A qaytimini hisoblang.",
        "Karta javobi noma'lum bo'lsa nima qilasiz? Qaysi hujjatlar mos bo'lishi kerak?"
    ])) + U("p", "Javob va hisob: __________________________________________________________"))
page("Vaziyat B: baholash mezoni — 5 ball", table(["Mezon", "1 ball uchun dalil"], [
    ["1. Shikoyat", "Tinglash, uzr, fakt va tekshirilgan yechim/muddat; ayblamaslik"],
    ["2. Tuzatish", "Buyurtmaga solishtirish, vakolatli mas'ul; desert va 2 500 xizmat haqini iz bilan olib tashlash"],
    ["3. Jami", "Xato 159 500; to'g'ri 132 000 (120 000 + 12 000)"],
    ["4. Ajratish/qaytim", "A 82 500, B 49 500; A qaytimi 17 500; A+B jami bilan mos"],
    ["5. To'lov va hujjat", "Noma'lum operatsiyani tekshirmasdan takrorlamaslik; hisob, tasdiq va tegishli chek mos"]]) +
    quote("Har satr to'liq bajarilsa 1, bajarilmasa 0. Baholovchi qaysi dalil yo'qligini yozadi. Hisobning sonli javobi bilan birga xizmat harakati ham baholanadi."))

page("Yakuniy nazariy bayonnoma", table(["Maydon", "To'ldiriladi"], [
    ["Tinglovchi / sana / variant", "____________________________"],
    ["Kirish dalillari", "Davomat ___/20; R2 ___; R5 ___; trener ___"],
    ["Test", "___ / 30"], ["Vaziyat A", "___ / 5; izoh ___"], ["Vaziyat B", "___ / 5; izoh ___"],
    ["Jami", "___ / 40"], ["Natija", "☐ O'tdi (≥28) ☐ Qayta tayyorgarlik (<28)"],
    ["Baholovchi / imzo", "____________________________"],
    ["Qayta mashq va muddat", "____________________________"]]) +
    quote("Saytdagi mashq testi faqat 30 savolni tekshiradi. Ikki yozma topshiriqni baholovchi tekshiradi; jami 40 ballni brauzer foizidan chiqarmang."))
page("Natijani tushunish", grid(2,
    card("green", "✓", "Misol: 24 + 3 + 4", "31/40 — R11dan o'tdi. R12 uchun alohida kamida 45/60 va kritik xatosiz natija kerak."),
    card("orange", "↻", "Misol: 23 + 2 + 2", "27/40 — o'tmadi. Xato yo'nalish bo'yicha qayta tayyorgarlik va trener belgilagan qayta baholash."),
    card("blue", "🧭", "Zaif yo'nalish", "Sanitariya/allergen bo'lsa R2/R5; hisob bo'lsa R7/R8; muloqot/shikoyat bo'lsa R4/R9ga qayting."),
    card("violet", "📄", "Saqlanadigan dalil", "Javob blankasi, vaziyatli javoblar va imzolangan bayonnoma trenerning kurs hujjatlarida saqlanadi.")))
page("Keyingi bosqich: amaliy imtihon", defn("R12da 12 daqiqalik xizmat vaziyati: xorijiy mehmon, allergen, kechikish va alohida hisob. "
    "6 mezon × 10 ball = 60; o'tish ≥45/60 va kritik xatosiz.") +
    quote("Quyidagi 30 savolni 35 daqiqalik <b>tayyorgarlik mashqi</b> sifatida bajaring. Natija — to'g'ri javoblar / 30. "
    "Bu mashq asosiy fanning ballariga qo'shilmaydi, imtihonga avtomatik ruxsat yoki sertifikat bermaydi."))

# 1–6: servis
choice("Bron jurnalda topilmadi. Kasbiy javob qaysi?", "Xotirjam tekshirib, administrator bilan joylashtirish yechimini topish", "Mehmonni yolg'onchiga chiqarish", "Bronni tekshirmay ketkazish", "Boshqa bron stolini ruxsatsiz berish", "R1: bron muammosi bahs bilan emas, tekshirish va mas'ul bilan hal qilinadi.")
choice("Smena brifingining asosiy natijasi?", "Jamoada bron, stop-list, vazifa va maxsus so'rovlar bo'yicha bir xil axborot", "Faqat chiroyli forma", "Faqat barcha telefonni zaryadlash", "Faqat menyu muqovasini almashtirish", "R1: brifing xizmatning axborot tayyorgarligi.")
choice("Menyuda yo'q taom uchun pribor qo'yish kerakmi?", "Yo'q; kuvert menyudagi ketma-ketlikka mos bo'ladi", "Ha; imkon qadar ko'p", "Faqat chapga hamma pribor", "Faqat desert pribori yetadi", "R3: anjomlar menyuga mos va tashqaridan ichkariga tartibda.")
choice("Patnisni bo'shatishda muhim qoida?", "Muvozanatni saqlab, og'irlikni bir tomonga yig'maslik", "Bir tomonni birdan bo'shatish", "Mehmon boshidan oshirish", "Og'ir buyumni chetga qo'yish", "R3: og'irlik markazi tayanch ustida qoladi.")
choice("Issiq taomni uzatishda nima qilinadi?", "To'g'ri o'rin tekshirilib, issiq idish haqida ogohlantiriladi", "Tarelka mehmon ustidan uzatiladi", "Bug' mehmon tomon ochiladi", "Patnis bolaga tutqaziladi", "R3: xavfsiz uzatish tezlikdan ustun.")
choice("Mehmon ketganda buyumi qolgan. To'g'ri harakat?", "Restoran tartibida mas'ulga topshirish va qayd qilish", "Shaxsiy foydalanish", "Chatga egasining suratini tarqatish", "Hech kimga aytmaslik", "R1: mehmon mulki va maxfiyligi himoya qilinadi.")
# 7–14: sanitariya va allergenlar
choice("Ishlatilgan idishdan keyin toza pribor ushlashdan oldin?", "Qo'l gigiyenasini bajarish va oqimlarni ajratish", "Qo'lni fartukka artish", "Faqat priborni hidlash", "O'sha qo'lqopda davom etish", "R2: toza va iflos oqim aralashtirilmaydi.")
choice("Yerga tushgan vilka bilan nima qilinadi?", "Ajratilib, o'rniga toza vilka keltiriladi", "Salfetkada artilib qaytariladi", "Suvga tekkizib beriladi", "Boshqa mehmonga qo'yiladi", "R2: ifloslangan anjom xizmatga qaytarilmaydi.")
choice("Xodimda qusish va ich ketish bor. Qaror?", "Smenagacha mas'ulga xabar, ishga qaytish tartibini tekshirish", "Yashirib ishga chiqish", "Faqat atir sepish", "Qo'lqop bilan hamma ishni bajarish", "R2: salomatlik haqida xabar oziq-ovqat xavfsizligining qismi.")
choice("Stakan qanday ushlanadi?", "Ichish chetiga tegmasdan pastki qismi yoki oyoqchasidan", "Ichki qismiga barmoq solib", "Og'zidan qisib", "Mehmon ichadigan chetidan", "R2/R3: oziq-ovqat va og'iz tegadigan sirt himoyalanadi.")
choice("Yong'oqli sousni qaynatish allergen xavfini ishonchli yo'qotadimi?", "Yo'q; tekshirilgan tarkib va ajratilgan jarayon kerak", "Ha; har doim", "Faqat tuz qo'shilsa", "Faqat kichik porsiyada", "R5: pishirish allergenni ishonchli yo'qotish usuli emas.")
choice("Allergen jadvalidagi noma'lum katakda nima qilasiz?", "Retsept, yorliq va mas'ul bilan tekshiraman", "Allergen yo'q deyman", "Menyudan narxni o'chiraman", "Mehmonga ozroq beraman", "R5: ma'lumot yo'qligi xavfsizlik dalili emas.")
choice("Vegan taomga yong'oq allergiyasi so'rovi keldi. Nima kerak?", "Allergen tarkibi va umumiy jihozni alohida tekshirish", "Vegan yozuviga tayanish", "Faqat porsiyani kamaytirish", "Faqat taomni isitish", "R5: parhez belgisi allergen tekshiruvini almashtirmaydi.")
choice("Oshxona alohida tayyorlashni tasdiqlay olmadi. Qaror?", "Taomni uzatmaslik, mas'ul va tekshirilgan muqobilni izlash", "Mehmon shoshsa uzatish", "Bezakni olib berish", "So'rovni yashirish", "R5: noaniq xavfsizlikda xizmat to'xtatiladi.")
# 15–20: xorijiy mehmon va xalqaro amaliyot
choice("Mehmon tilini qanday bilasiz?", "Salomlashib, qaysi tilni afzal ko'rishini so'rab", "Kiyimiga qarab", "Faqat millatiga qarab", "Hamma bilan bir xil chet tilda", "R4: til taxmin qilinmaydi.")
choice("Mehmon inglizcha tushunmadi. Keyingi qadam?", "Soddaroq gap va menyuda ko'rsatib qayta tasdiqlash", "Balandroq baqirish", "Tushungandek bosh irg'ash", "Savolni e'tiborsiz qoldirish", "R4: sodda nutq va tushunilganini tekshirish.")
choice("«Let me check the ingredients with our kitchen» nima uchun?", "Tarkibni taxminsiz oshxonadan tekshirish uchun", "Narxni yashirish uchun", "Hisobni ajratish uchun", "Mehmonni kuzatish uchun", "R4/R5: tekshirish vaqti va keyingi qadam ham aytiladi.")
choice("WorldSkills va mahalliy qonun bir xilmi?", "Yo'q; kasbiy mezon va majburiy talab farqlanadi", "Ha; barcha mamlakatda", "Faqat sertifikat bo'lsa bir xil", "Faqat banketda bir xil", "R6: manba maqomi va sohasi ajratiladi.")
choice("Bufetdagi har taom uchun qanday tayyorgarlik kerak?", "Ishonchli belgi, alohida anjom, saqlash nazorati va mas'ul", "Faqat katta idish", "Bitta umumiy qisqich", "Faqat bezak", "R6: axborot va jarayon birga boshqariladi.")
choice("YI 14 va AQSh 9 allergenni qiyoslashda nima muhim?", "Hudud va qo'llanish sohasi, jumladan qadoqlangan mahsulot konteksti", "Faqat sonni yodlash", "AQShda boshqa allergiya yo'q deyish", "Birini hamma joyda qonun qilish", "R6: ro'yxat restoran talablari bilan kontekstsiz tenglashtirilmaydi.")
# 21–26: buyurtma va hisob
choice("Allergen buyurtmasi qanday manzillanadi?", "Stol/o'rin, aniq so'rov, POS belgisi va oshxona tasdig'i bilan", "Faqat taom nomi bilan", "Faqat mehmon kiyimi bilan", "Faqat terminal raqami bilan", "R7: buyurtma aniq mehmon va so'rovga bog'lanadi.")
choice("Yo'q taomni muqobilga qachon almashtirasiz?", "Tarkib, narx va vaqt tekshirilib, mehmon tasdiqlagach", "Oshxona istagan zahoti", "Mehmon bilmasdan", "Faqat chipta chiqsa", "R7: mehmon tanlovi va yozuvlar yangilanadi.")
choice("Yuborilgan POS yozuvini izsiz o'chirish o'rniga?", "Vakolatli tuzatish, sabab, vaqt va mas'ul qaydi", "Begona parol bilan kirish", "Xatoni yashirish", "Mehmonga ortiqcha to'latish", "R7: o'zgarish izi saqlanadi.")
choice("Hisob asosi 120 000, kelishilgan xizmat 10%. Jami?", "132 000 so'm", "121 000 so'm", "120 010 so'm", "144 000 so'm", "R8: 120 000 × 1,10 = 132 000.")
choice("82 500 hisobga 100 000 naqd berildi. Qaytim?", "17 500 so'm", "27 500 so'm", "7 500 so'm", "18 500 so'm", "R8: berilgan pul minus yakuniy hisob.")
choice("Terminal javobi kelmadi. To'g'ri harakat?", "Birinchi operatsiya holatini tekshirmay takror yechmaslik", "Darhol yana yechish", "PINni yozib olish", "Hisobni ikki barobar qilish", "R8: ikki marta yechish xavfi oldi olinadi.")
# 27–30: shikoyat va xavfsizlik
choice("Kechikish shikoyati qanday yakunlanadi?", "Yechim, mas'ul, muddat va mehmon javobini qayd qilish bilan", "Faqat bahslashish bilan", "Oshxonani ayblash bilan", "Hisobni yashirish bilan", "R9: muammo nazorat qilinadigan vazifaga aylantiriladi.")
choice("Harakatlanish yordami kerak deb o'yladingiz. Avval?", "Mehmonning o'zidan qanday yordam qulayligini so'rash", "Aravachasini darhol surish", "Faqat hamrohiga buyruq berish", "Mehmonni ko'tarish", "R9: yordam rozilik va mehmon ko'rsatmasi bilan.")
choice("Mehmon nafas olishda qiynalmoqda. Birinchi yo'nalish?", "Darhol mas'ul va shoshilinch yordamni chaqirish", "Avval hisobni to'latish", "10 daqiqa kutish", "O'zim dori belgilash", "R9: salomatlik xavfi oddiy shikoyat navbatida turmaydi.")
choice("Keyingi smenaga ochiq vazifa qanday topshiriladi?", "Holat, keyingi qadam, yangi mas'ul, muddat va qabul tasdig'i bilan", "Faqat «bir ish bor» deb", "Jurnalni o'chirib", "Faqat mehmon ismi bilan", "R10: vazifa egasiz va muddatsiz qolmaydi.")

# Bosma nusxa savollari interaktiv test ishga tushirilmasa ham ko'rinadi.
for start in range(0, 30, 3):
    body = ""
    for i in range(start, start + 3):
        item = Q[i]
        body += h3("%d. %s" % (i + 1, item["q"]), top=12)
        body += U("ol", "".join(U("li", answer) for answer in item["a"]), 'type="A"')
    page("Nazariy savollar %d–%d" % (start + 1, start + 3), body, "Bosma tayyorgarlik varianti · Har savol 1 ball")

test_slide(30, "Tayyorgarlik testi tugagach, 2 ta vaziyatli javobni yozing va <b>baholovchiga</b> tekshirtiring. Rasmiy natija — bayonnomada.")
