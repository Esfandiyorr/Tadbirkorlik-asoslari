# -*- coding: utf-8 -*-
"""R7 · Buyurtma va zal bilan oshxona hamkorligi. POS — trening blankasi."""
exec(open(MATN_DIR + "restoran_davom.py", encoding="utf-8").read())

lesson_cover(7, "Buyurtma va zal bilan oshxona hamkorligi",
    "<b>Stol va o'rin</b> · taomlar ketma-ketligi · maxsus so'rov · demo POS va oshxona chiptasi · "
    "stop-list · vakolatli tuzatish · <b>uch yozuvning mosligi</b>.",
    "1 soat nazariya · 1 soat amaliyot", 17, 15)
goals([
    ("Yozib oladi", "Uch kishining buyurtmasini stol, o'rin, taom, miqdor va maxsus so'rov bilan qayd qiladi."),
    ("Tasdiqlaydi", "Buyurtmani mehmonga takrorlaydi va oshxonadan vaqt/so'rov javobini oladi."),
    ("Kiritadi", "Demo POS blankasi yoki trening rejimidagi tizimda buyurtma va kurslarni ajratadi."),
    ("Tuzatadi", "Yo'q taom uchun tekshirilgan muqobil taklif etadi; o'zgarishni vakolatli mas'ul bilan qayd qiladi.")],
    ["POS", "oshxona chiptasi", "o'rin raqami", "kurs", "stop-list", "modifikator", "tuzatish izi"])

page("Buyurtma: eshitishdan ko'ra aniqroq", defn("Buyurtmaning manzili — <b>stol + o'rin</b>. Bir stolda har xil allergiya, "
    "pishirish yoki hisob talabi bo'lishi mumkin. Raqamlarni brifingda kelishilgan yo'nalishda bering.") +
    table(["Maydon", "O'quv yozuvi"], [
        ["Stol/o'rin", "12-stol, 1-o'rin"], ["Taom va miqdor", "1 × tovuq, 1 × suv 0,5 l"],
        ["Kurs", "Salat — avval; asosiy taom — keyin"], ["Modifikator", "Achchiqsiz — oshxona imkonini tekshiradi"],
        ["Xavfsizlik so'rovi", "ALLERGIYA: sut; retsept va jarayon tasdig'i kutilmoqda"],
        ["Vaqt va tasdiq", "19:10 qayd; 19:13 mas'ul javobi; 20 daqiqa mehmon bilan kelishildi"]]))

page("Buyurtmani qabul qilish: olti qadam", grid(2,
    card("green", "1", "Tayyorlik", "Stop-list va bugungi narxni biling; blank/terminal tayyor, stol/o'rin aniq."),
    card("blue", "2", "Tinglash", "Gapni bo'lmang; taom, miqdor va xizmat tartibini yozing."),
    card("orange", "3", "Aniqlashtirish", "Allergiya/parhez, garnir, porsiya va ichimlik turini so'rang; bilmaganini tekshiring."),
    card("violet", "4", "Takrorlash", "Har o'rin bo'yicha taom, maxsus so'rov, narx va kutish vaqtini tasdiqlang."),
    card("green", "5", "Yuborish", "POSdagi to'g'ri kurs va modifikator; allergenni og'zaki ham yetkazing."),
    card("blue", "6", "Nazorat", "Oshxona qabul qildimi, tayyor taom qaydga mosmi, mehmon vaqtni bildimi?")))

page("Uch kishilik stol kartasi", table(["O'rin", "Mehmon so'rovi", "Tekshirish"], [
    ["1 · Ali", "1 tovuq, achchiqsiz, gazsiz suv 0,5 l", "Achchiqsiz tayyorlash mumkinmi? Suv hajmi to'g'rimi?"],
    ["2 · Sara", "1 baliq, sutga allergiya, choy", "Baliq bugun stop-listda; muqobilning tarkibi va alohida jarayoni tekshiriladi"],
    ["3 · Dilorom", "1 sabzavotli guruch, go'shtsiz, gazli suv 0,5 l", "Bulon va sousda go'sht bormi? Vegan deb taxmin qilinmaydi"]]) +
    quote("«Sara baliq buyurdi» deb yuborib bo'lmaydi: avval yo'qligi aytiladi va mos muqobilga mehmonning tasdig'i olinadi."))

page("Demo POS: kiritish blankasi", defn("Bu — <b>trening blankasi</b>. Uni chop eting yoki o'qituvchi bergan sinov POSida "
    "xuddi shu ustunlarni to'ldiring. Haqiqiy savdo cheki va to'lov yaratilmaydi.") +
    table(["Stol/o'rin", "Kurs", "Taom/ichimlik", "Soni", "Maxsus belgi", "Holat"], [
        ["12/1", "Asosiy", "Tovuq", "1", "Achchiqsiz — tasdiq: ___", "Yuborilmagan"],
        ["12/1", "Ichimlik", "Gazsiz suv 0,5 l", "1", "", "___"],
        ["12/2", "Asosiy", "Muqobil: ___", "1", "ALLERGIYA: sut; mas'ul: ___", "Tasdiq kutilmoqda"],
        ["12/2", "Ichimlik", "Choy", "1", "Qo'shimcha sut alohida so'raladi", "___"],
        ["12/3", "Asosiy", "Sabzavotli guruch", "1", "Go'shtsiz; bulon tekshirildi: ___", "___"],
        ["12/3", "Ichimlik", "Gazli suv 0,5 l", "1", "", "___"]]) +
    quote("Yuborishdan oldin o'rin, miqdor va allergen belgisini yana bir marta tekshiring. Tugmalar nomi haqiqiy POSga qarab farq qiladi."))

page("Kurs va modifikatorni ajratish", grid(2,
    card_ul("green", "🍽️", "Kurs — qachon chiqadi?", ["Ichimlik, gazak, asosiy taom, desert", "Birga chiqadimi yoki keyingi signalni kutadimi?", "Bir stolning asosiy taomlari bir vaqtda tayyor bo'lishi kelishiladi", "Keyingi kurs uchun oshxonaga aniq signal beriladi"]),
    card_ul("blue", "✏️", "Modifikator — qanday tayyorlanadi?", ["Achchiqsiz, sous alohida, garnirni almashtirish", "Allergiya belgisi oddiy xohishdan ajratiladi", "Erkin izohga qo'shimcha oshxona bilan og'zaki aloqa", "Maxsus so'rov narx yoki vaqtni o'zgartirsa oldindan aytiladi"])))

page("Oshxona chiptasi: buyurtmaning nusxasi", table(["Chipta maydoni", "12-stol misoli"], [
    ["Vaqt va buyurtma", "19:13 · trening #012"], ["O'rin 1", "Tovuq ×1, achchiqsiz — oshxona tasdiqladi"],
    ["O'rin 2", "MUQOBIL tovuq ×1; ALLERGIYA: sut; soussiz, retsept va alohida jarayonni mas'ul tasdiqladi"],
    ["O'rin 3", "Sabzavotli guruch ×1; go'shtsiz, sabzavot buloni tasdiqlangan"],
    ["Chiqish", "Asosiy taomlar birga; mas'ul: ___; taxminiy vaqt: ___"]]) +
    quote("Bu javoblar mashq kartasidir. Haqiqiy restoranda retsept va jarayon tekshirilmaguncha ayni muqobil xavfsiz deb olinmaydi."))

page("Zal–oshxona: qayta aytib tasdiqlash", dialog("blue", "📣", "O'rin, so'rov va vaqt", [
    ("O", "12-stol, 2-o'rin. Sutga ALLERGIYA. Baliq yo'q ekan. Qaysi muqobilning tarkibi va alohida jarayonini tekshira olasiz?"),
    ("Osh", "Mashq kartasida soussiz tovuq tasdiqlangan; alohida toza jihoz bilan 25 daqiqa."),
    ("O", "12/2: sut allergiyasi, soussiz tovuq, alohida jihoz, 25 daqiqa. Mehmonga taklif qilib javobini yetkazaman."),
    ("M", "Roziman."),
    ("O", "Mehmon tasdiqladi. Trening buyurtmasini yangiladim. Iltimos, qabul qilganingizni tasdiqlang.")]) +
    quote("Mehmon hali tasdiqlamagan muqobil oshxonaga tayyorlash uchun yuborilmaydi."))

page("Stop-list: yo'q taomga to'g'ri javob", grid(2,
    card_ul("red", "🚫", "Xato yo'l", ["Yo'q taomni va'da qilib keyin almashtirish", "Allergen so'rovini tekshirmasdan «shunga o'xshash» taklif", "Qimmatroq muqobilni narxsiz kiritish", "Mehmon tasdig'isiz chipta yuborish"]),
    card_ul("green", "✅", "To'g'ri ketma-ketlik", ["Yo'qligini ayting va uzr so'rang", "Oshxona tasdiqlagan mos muqobilni toping", "Tarkib, narx farqi va yangi vaqtni tushuntiring", "Mehmon tanlovini qayta tasdiqlab yozuvlarni yangilang"])))

page("Vakolatli tuzatish va qayd izi", table(["Vaziyat", "Harakat va yozuv"], [
    ["Yuborilmagan buyurtmada xato", "To'g'ri o'rin/miqdorni tekshirib tuzating, mehmon bilan tasdiqlang"],
    ["Oshxonaga yuborilgan buyurtma", "Darhol mas'ul va oshxonaga xabar, tayyorlash holatini tekshirish; vakolatli bekor/tuzatish"],
    ["Narx, chegirma yoki qaytarish", "Faqat vakolatli xodim; sabab, vaqt va tasdiq qaydi"],
    ["Allergen so'rovi o'zgardi", "Uzatishni to'xtating; eski taomni ajrating, qayta tekshiring, yangi tasdiq oling"]]) +
    quote("Asl yozuvni izsiz yo'qotmang. Boshqa xodim paroli bilan kirmang. Kim, qachon, nimani va nima sababli o'zgartirgani ko'rinsin."))

page("Kutish vaqti va kechikish", dialog("orange", "⏱", "Vaqtni yangilash", [
    ("Osh", "12-stol asosiy taomlari yana 10 daqiqaga kechikadi."),
    ("O", "Tasdiqlayman: yana taxminan 10 daqiqa. Sabab va mumkin bo'lgan muqobilni mas'ul bilan tekshiraman."),
    ("O", "Kechirasiz, taomingiz kutilganidan kechikdi. Yana taxminan 10 daqiqa kerak. Kutishni xohlaysizmi yoki mas'ul bilan boshqa variantni ko'raylikmi?"),
    ("M", "Kutamiz."),
    ("O", "Rahmat. 5 daqiqadan so'ng holatni yana aytaman.")]) +
    quote("Bu misoldagi 5 daqiqa — yangi xabar va'dasi. Uni taomning tayyor bo'lish vaqti deb aralashtirmang."))

page("Uzatish: uchta yozuv mosmi?", table(["Tekshiruv", "Mos kelishi kerak"], [
    ["Mehmon tasdig'i", "Nima, qancha, qaysi shart, narx va vaqt"],
    ["Demo POS yozuvi", "Xuddi shu o'rin, taom, miqdor va maxsus belgi"],
    ["Oshxona chiptasi", "Shu buyurtma va oshxona qabul qilgan ko'rsatma"],
    ["Tayyor taom", "Chipta bilan bir xil, alohida so'rovni oshxona mas'uli tasdiqlagan"]]) +
    quote("Nomuvofiqlik bo'lsa taomni «kimniki?» deb stolga qo'yib ketmang. Avval tekshiring. R3dagi xavfsiz uzatish qoidalari saqlanadi."))

page("Amaliy mashq: uch kishilik buyurtma", defn("40 daqiqa: 5 yo'riqnoma, 3 × 8 daqiqa rollar almashuvi, 11 daqiqa solishtirish. "
    "Rollar: ofitsiant, mehmonlar vakili, oshxona/kuzatuvchi. Har kishi kamida bir marta ofitsiant bo'ladi.") +
    U("ol", "".join(U("li", x) for x in [
        "12-stol kartasidagi uch buyurtmani yozing va takrorlang.",
        "Sut allergiyasini oshxona bilan tekshiring; yo'q baliq uchun muqobil oling.",
        "Muqobilning tarkibi, narxi va 25 daqiqa vaqtini mehmon bilan tasdiqlang.",
        "Demo POS blankasini va oshxona chiptasini to'ldiring.",
        "Trener bitta noto'g'ri o'rin yoki kechikish kartasini beradi: vakolatli tuzatishni qayd qiling.",
        "Mehmon qaydi, POS va chiptani satrma-satr solishtiring."
    ])))
checklist([
    ("Manzil", "Uchala o'rin va buyurtma ajratildi"),
    ("Tasdiq", "Taom, miqdor, maxsus so'rov, narx va vaqt takrorlandi"),
    ("Allergen", "Belgi va og'zaki oshxona tasdig'i bor"),
    ("Muqobil", "Yo'q taom faqat mehmon roziligi bilan almashtirildi"),
    ("Tuzatish", "Sabab, vaqt va vakolatli mas'ul qayd etildi"),
    ("Moslik", "Mehmon qaydi, POS blankasi va chipta bir xil")],
    "Trening #012: mehmon tasdig'i, to'ldirilgan demo POS, oshxona chiptasi va tuzatish qaydi.")
recap([
    ("Stol + o'rin", "Buyurtma har bir mehmonga aniq biriktiriladi."),
    ("Takrorlash", "Taxmin o'rniga mehmon va oshxonaning aniq javobi olinadi."),
    ("Uch yozuv", "Mehmon tasdig'i, POS va chipta mosligi taom chiqishidan oldin tekshiriladi."),
    ("O'zgarish izi", "Muqobil, bekor qilish va narx tuzatishi mas'ul bilan qayd etiladi.")],
    "R8 · Tavsiya berish va to'lovni rasmiylashtirish: byudjet, ichimlik, alohida hisob va xato band.",
    "O'z ish joyingizda buyurtmani bekor qilishga kim vakolatli ekanini va tuzatish qaydi qayerda qolishini yozing.")

choice("Buyurtmaning aniq manzili nima?", "Stol va o'rin raqami", "Faqat mehmon kiyimi", "Faqat ofitsiant ismi", "Faqat kelish vaqti", "Bir stolda turli maxsus so'rovlar bo'lishi mumkin.")
choice("Kurs nimani belgilaydi?", "Taomning qaysi bosqichda chiqishini", "Mehmon yoshini", "To'lov valyutasini", "Allergenning miqdorini", "Gazak, asosiy taom va desert chiqish tartibi kelishiladi.")
choice("Modifikator misoli qaysi?", "Sous alohida, oshxona tasdig'i bilan", "12-stol", "Ofitsiant ismi", "19:10", "Modifikator buyurtma qanday bajarilishini aniqlaydi.")
choice("Sut allergiyasi faqat erkin izohga yozilsa yetarlimi?", "Yo'q; aniq belgi va oshxona bilan og'zaki tasdiq ham kerak", "Ha; oshxona o'zi ko'radi", "Faqat mehmon eslasa yetadi", "Faqat kassir bilsa yetadi", "Xavfsizlik so'rovi ikki yo'l bilan yetkazilib, qabul qilingani tekshiriladi.")
choice("Taom stop-listda. Keyingi qadam?", "Tekshirilgan muqobil, narx va vaqtni mehmon bilan kelishish", "O'zim istagan taomni yuborish", "Baliq o'rniga yashirin tovuq qo'yish", "Oshxonani mehmon oldida ayblash", "Muqobil mehmonning tasdig'isiz buyurtmaga aylanmaydi.")
choice("Mehmon hali muqobilni tasdiqlamadi. Nima qilasiz?", "Javobni kutaman, tayyorlashga yubormayman", "Darhol tayyorlataman", "Eski buyurtmani to'langan deyman", "O'rin raqamini o'chiraman", "Tarkib, narx va vaqt bo'yicha mehmon tanlovi olinadi.")
choice("Yuborilgan buyurtmada noto'g'ri miqdor topildi. Nima qilasiz?", "Oshxona va mas'ulga darhol xabar berib, vakolatli tuzatishni qayd qilaman", "Yozuvni izsiz o'chiraman", "Ortiqcha taomni majburan sotaman", "Hech kimga aytmay kutaman", "Tayyorlash holati va tuzatish izi saqlanadi.")
choice("Uch yozuv mosligi qaysilar?", "Mehmon tasdig'i, POS va oshxona chiptasi", "Menyu rasmi, stul va deraza", "Forma, patnis va soat", "Kassa qog'ozi, telefon va beyj", "Taom va maxsus so'rov bir xil bo'lishi tekshiriladi.")
choice("Kechikish ma'lum bo'ldi. Nima qilasiz?", "Yangi vaqtni tekshirib, mehmonni o'zim xabardor qilaman", "Mehmon so'ramaguncha indamayman", "Taxminan 2 daqiqa deyman", "Qimmat ichimlikni roziliksiz olib kelaman", "R1dagi halol vaqt va R9dagi yechim kelishuvi qo'llanadi.")
choice("Maxsus tarelka qaysi o'ringa tegishli ekani noma'lum. Qaroringiz?", "Uzatishni to'xtatib, chipta va mas'ul bilan tekshirish", "Bo'sh o'ringa qo'yish", "Hamma tatib ko'rsin deyish", "Faqat bezagini olib tashlash", "Xavfsizlik so'rovida taxmin bilan uzatilmaydi.")
choice("POSni o'rgatish uchun qaysi muhit ishlatiladi?", "Trening blankasi yoki haqiqiy to'lovsiz sinov rejimi", "Begona xodimning shaxsiy hisobi", "Tasodifiy haqiqiy mijoz hisobi", "Talabaning bank kartasi", "Mashq savdo va to'lov yaratmasligi kerak.")
choice("Narx tuzatishi kim tomonidan bajariladi?", "Restoran tartibidagi vakolatli xodim", "Har qanday mehmon", "Har qanday talaba yashirincha", "Faqat oshxona yordamchisi istagancha", "Vakolat, sabab va vaqt qayd etiladi.")
choice("Go'shtsiz guruch so'rovini tekshirishda nima muhim?", "Bulon va sous tarkibini aniqlash", "Faqat guruch rangini ko'rish", "Vegetarian degan belgini taxminan qo'yish", "Faqat porsiya og'irligini so'rash", "Go'sht bo'lagi ko'rinmasligi bulonda go'sht yo'q degani emas.")
choice("«Yana 10 daqiqa, 5 daqiqada xabar beraman» deganda 5 daqiqa nima?", "Yangi xabar berish va'dasi", "Taomning aniq tayyorlik vaqti", "Bepul xizmat muddati", "Hisobni bekor qilish vaqti", "Taom va axborotni yangilash vaqti alohida kelishiladi.")
choice("Oshxona javobini qanday yopiq tasdiqlaysiz?", "Stol/o'rin, so'rov va vaqtni qayta aytib javob kutaman", "Faqat bosh irg'ayman", "Chiptani o'qimasdan ketaman", "Mehmonga o'zimcha va'da qilaman", "Qayta aytish tushunmovchilikni aniqlaydi.")
