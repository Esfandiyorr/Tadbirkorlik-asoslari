# -*- coding: utf-8 -*-
"""R9 · Shikoyat va inklyuziv xizmat. Yechim, muddat, rozilik va xavfsizlik."""
exec(open(MATN_DIR + "restoran_davom.py", encoding="utf-8").read())

lesson_cover(9, "Shikoyat va inklyuziv xizmat",
    "Tinglash va aniqlashtirish · <b>yechim va muddat</b> · vakolat chegarasi · "
    "yordamga rozilik · qulay o'rin · <b>xavfsizlikka tahdidda yordam chaqirish</b> · shikoyat qaydi.",
    "1 soat nazariya · 1 soat amaliyot", 17, 15)
goals([
    ("Tinglaydi", "Gapni bo'lmasdan muammoni eshitadi, faktni va mehmon kutayotgan yechimni aniqlashtiradi."),
    ("Kelishadi", "Vakolati doirasida yechim, mas'ul va tekshirilgan muddatni kelishadi; qayta xabar vaqtini aytadi."),
    ("Yordamni so'raydi", "Mehmonning o'ziga murojaat qiladi; qulay joy yoki yordam turini rozilik bilan taklif etadi."),
    ("Qayd etadi", "Muammo, mas'ul, muddat, yechim va mehmon javobini yozadi; xavfda darhol yordam chaqiradi.")],
    ["faol tinglash", "aniqlashtirish", "vakolat", "muddat", "inklyuziv xizmat", "rozilik", "hodisa qaydi"])

page("Shikoyatni qabul qilish: besh qadam", grid(2,
    card("green", "1", "Tinglang", "Mehmonga qarang, gapini bo'lmang, xotirjam ovozda javob bering."),
    card("blue", "2", "Aniqlashtiring", "«Siz buyurtmani 25 daqiqa oldin berdingiz, to'g'rimi?» Faktni takrorlang."),
    card("orange", "3", "Uzr va mas'uliyat", "«Kechikish uchun uzr so'rayman. Hozir holatni tekshiraman». Ayblov yoki bahs yo'q."),
    card("violet", "4", "Yechim va vaqt", "Tekshirilgan variantlar; mehmon tanlovi; kim va qachon qaytishi."),
    card("green", "5", "Tekshiring va yozing", "Va'da bajarildimi? Mehmon javobini oling, yopilmagan vazifani mas'ulga topshiring.")))

page("Gapni himoya emas, yechim tomon olib boring", table(["Muammoni kuchaytiradi", "Yechimga yordam beradi"], [
    ["«Bu mening aybim emas»", "«Vaziyatni tekshirib, yechimni aytaman»"],
    ["«Oshxona sekin ishlayapti»", "«Taom kutilganidan kechikdi. Mas'ul bilan yangi vaqtni aniqlayman»"],
    ["«Siz noto'g'ri tushundingiz»", "«Buyurtmada nima kelishganimizni birga tekshirib olaylik»"],
    ["«Hozir keladi» — tekshirmasdan", "«2 daqiqada holatni aniqlab qaytaman» — va qaytish"],
    ["«Tinchlaning!»", "«Sizni tushundim. Qaysi yechim sizga qulay bo'lishini ko'raylik»"]]) +
    quote("Uzr so'rash — tekshirilmagan sababni o'ylab topish yoki vakolatsiz kompensatsiya va'da qilish emas."))

page("Kechikkan taom: tekshirilgan yechim", dialog("blue", "⏱", "25 daqiqa kutgan mehmon", [
    ("M", "Bizga 20 daqiqa deyishgandi, 25 daqiqa bo'ldi!"),
    ("O", "Kechikish uchun uzr. 2 daqiqada oshxonadan aniq holatni bilib qaytaman."),
    ("Osh", "Yana taxminan 10 daqiqa. Muqobil sho'rva 5 daqiqa; tarkibi va narxi shu kartada."),
    ("O", "Asosiy taomga yana taxminan 10 daqiqa kerak. Kutishingiz yoki tekshirilgan sho'rvani tanlashingiz mumkin. Bekor qilishni istasangiz, mas'ulni chaqiraman."),
    ("M", "Asosiy taomni kutamiz."),
    ("O", "Rahmat. 5 daqiqadan keyin holatni yana aytaman.")]) +
    quote("Yangi va'dani o'zingiz nazorat qiling. Muddat yana o'zgarsa, mehmon so'rashini kutmang."))

page("Vakolat: nimalarni mas'ul hal qiladi?", table(["Ofitsiant", "Vakolatli mas'ul"], [
    ["Tinglash, uzr, faktni tekshirish", "Kompensatsiya, chegirma, pul qaytarish"],
    ["Bo'sh va mos o'rinni taklif qilish", "Bronni ko'chirish va katta joylashuv o'zgarishi"],
    ["Tekshirilgan vaqt va muqobilni tushuntirish", "Tayyorlangan taomni bekor qilish tartibi"],
    ["Xavfni payqab uzatishni to'xtatish, yordam chaqirish", "Hodisa boshqaruvi va tegishli xizmatlar bilan hamkorlik"]]) +
    quote("«Hammasi bepul bo'ladi» deyishdan oldin vakolatingizni tekshiring. Xavf bo'lsa esa yordam chaqirish mas'ul kelgunicha kechiktirilmaydi."))

page("Inklyuziv xizmat: mehmonning o'zidan so'rang", defn("<b>Inklyuziv xizmat</b> — turli ehtiyojli mehmon xizmatdan hurmat va qulaylik "
    "bilan foydalanishi uchun sharoit yaratish. Yordam turini tashqi ko'rinishdan taxmin qilmang.") +
    grid(2,
        card_ul("green", "🤝", "Rozilik bilan", ["«Sizga qanday yordam qulay bo'ladi?»", "Bevosita mehmonning o'ziga murojaat qiling", "Hamrohni mehmon o'rniga javob berishga majburlamang", "Rad javobini hurmat qiling; keyin kerak bo'lsa yordam borligini ayting"]),
        card_ul("blue", "🧭", "Qulay muhit", ["Yo'lak va chiqish to'silmagan", "Menyu va to'lov terminali yetib boradigan joyda", "Shovqin yoki yoritish ehtiyojini so'rash", "Muammoni boshqa mehmonlarga oshkor qilmaslik"])))

page("Harakatlanish uchun qulay o'rin", dialog("green", "🪑", "Tanlov va rozilik", [
    ("M", "Aravacham bilan kirib o'tirishga qulayroq joy bormi?"),
    ("O", "Albatta. Keng yo'lak yonidagi ikki bo'sh stolni ko'rsataymi? Sizga qaysi tomondan yaqinlashish qulay?"),
    ("M", "Deraza yonidagisi. Bitta stulni olib qo'ysangiz yetadi."),
    ("O", "Stulni olib qo'yaman. Aravachangizga tegmasdan yo'lni bo'shataman."),
    ("M", "Rahmat, o'zim joylashaman.")]) +
    quote("Aravacha, hassa va boshqa yordamchi vosita mehmonning shaxsiy makonidir. Ruxsatsiz ushlamang yoki surmang. Chiqish yo'lini bo'sh saqlang."))

page("Ko'rish yoki eshitish ehtiyoji", grid(2,
    card_ul("blue", "📖", "Ko'rish bilan bog'liq", ["O'zingizni tanishtiring, yordam turini so'rang", "Menyuni narxi va tarkibi bilan o'qib berishni taklif qiling", "Buyumni qayerga qo'yganingizni aniq tushuntiring", "Yetaklash kerak bo'lsa mehmon aytgan usulni qo'llang, tortmang"]),
    card_ul("green", "✍️", "Eshitish bilan bog'liq", ["Yuzingiz ko'rinadigan joyda, odatiy aniq ovozda gapiring", "Yozma menyu yoki qisqa yozuvni taklif qiling", "Buyurtma, narx va vaqtni yozib tasdiqlang", "Baqirmang; mehmon tanlagan aloqa usulini hurmat qiling"])))

page("Bola, keksa mehmon va til ehtiyoji", table(["Ehtiyoj", "Hurmatli yechim"], [
    ["Bola bilan kelgan oila", "Mos stulni rozilik bilan taklif qilish; issiq idishni boladan uzoq tutish; yo'lakni bo'sh saqlash"],
    ["Ko'proq vaqt kerak", "Shoshirmaslik, sodda tanlovlar va aniq yozma narx; bolalarcha murojaat qilmaslik"],
    ["Til to'sig'i", "R4: tilni so'rash, sodda nutq, menyuda ko'rsatish, tushunilganini tasdiqlash"],
    ["Tinchroq joy", "Bo'sh va mos variantlarni ko'rsatish; restoran imkonidan tashqari va'da bermaslik"]]) +
    quote("Bir guruhga mansublik barcha mehmonlarning ehtiyoji bir xil degani emas. Qaror mehmonning o'zi bilan kelishiladi."))

page("Oddiy shikoyatmi yoki zudlikdagi xavfmi?", table(["Vaziyat", "Birinchi yo'nalish"], [
    ["Taom kechikdi, lekin xavf yo'q", "Tinglash → oshxonadan vaqt → yechim → nazorat"],
    ["Taomda singan shisha gumoni", "Yeyishni/uzatishni to'xtatish, taomni ajratish, darhol mas'ulga xabar"],
    ["Allergik reaksiya yoki og'ir salomatlik alomati", "Darhol mas'ul va shoshilinch tibbiy yordam (103); mehmon yolg'iz qolmasin"],
    ["Tutun/yong'in yoki zo'ravonlik tahdidi", "O'z xavfsizligini saqlash, korxonaning favqulodda tartibi va tegishli yordam xizmatini chaqirish"]]) +
    quote("Tibbiy tashxis qo'ymang va o'zboshimcha dori bermang. O'qitilgan yordamchi yoki dispetcher ko'rsatmasiga amal qiling; oddiy shikoyat blankasi yordamni kechiktirmasin."))

page("Keskin vaziyatda xotirjam aloqa", grid(2,
    card_ul("green", "🗣", "Qiling", ["Xotirjam ovoz, qisqa gap va xavfsiz masofa", "«Mas'ulni hozir chaqiraman» — kim va qachon", "Bahsni tomoshaga aylantirmasdan, maxfiylikni saqlash", "O'zingizni xavfga qo'ymasdan hamkasb va mas'uldan yordam"]),
    card_ul("red", "⛔", "Qilmang", ["Mehmonni masxara qilish yoki ayblash", "Roziligisiz ushlash, yo'lini to'sish", "Janjalni o'zingiz jismonan hal qilishga urinish", "Hodisa suratini shaxsiy chatga tarqatish"])))

page("Shikoyat qaydi: yopiladigan vazifa", table(["Maydon", "O'quv yozuvi"], [
    ["Vaqt/stol", "19:35 · 12-stol"], ["Fakt", "20 daqiqa deyilgan; 25 daqiqa o'tgan, asosiy taom kelmagan"],
    ["Mas'ul", "Zal sardori ___; oshxona javobi ___"],
    ["Yechim/muddat", "Mehmon 10 daqiqa kutishga rozi; 19:40da yangi xabar"],
    ["Bajarildi", "19:40 xabar, 19:45 taom uzatildi; mehmon «rahmat» dedi"],
    ["Ochiq vazifa", "Kechikish sababini smena tahliliga yetkazish; mas'ul ___"]]) +
    quote("Faktni yozing, shaxsga baho bermang. Faqat xizmatga zarur ma'lumot; ortiqcha tibbiy/shaxsiy tafsilotni umumiy jurnalga kiritmang."))

page("Amaliy mashq: shikoyat va qulay joy", defn("40 daqiqa: 5 brifing; uchta ishtirokchi 3 × 8 daqiqada rollarni almashtiradi; "
    "11 daqiqa qayd va tahlil. Har aylanishda ikki qisqa vaziyat bajariladi.") +
    grid(2,
        card_ul("blue", "A", "Kechikish", ["Mehmon 25 daqiqa kutgan; oshxona kartasi yana 10 daqiqa deydi", "Tinglang, uzr, tekshirish va yechimni kelishing", "5 daqiqada xabar va'dasini bajaring", "Mas'ul, muddat, yechim va javobni qayd qiling"]),
        card_ul("green", "B", "Qulay o'rin", ["Mehmon kengroq o'tish joyini so'raydi", "Yordam turini mehmonning o'zidan so'rang", "Ikki xavfsiz stolni ko'rsatib tanlov va rozilik oling", "Stulni olib qo'ying; yordamchi vositaga ruxsatsiz tegmang"])))
checklist([
    ("Tinglash", "Gap bo'linmadi, fakt qayta aytildi"),
    ("Yechim", "Oshxona va mas'ul bilan tekshirilgan variantlar berildi"),
    ("Muddat", "Yechim va qayta xabar vaqti alohida kelishildi"),
    ("Rozilik", "Yordam turi mehmondan so'raldi, tanlovi hurmat qilindi"),
    ("Xavfsizlik", "Qulay yo'l ochiq, xavf kartasida yordam darhol chaqirildi"),
    ("Qayd", "Mas'ul, muddat, yechim va mehmon javobi yozildi")],
    "Bitta to'liq shikoyat qaydi va qulay o'rin taklifining kuzatuv varag'i.")
recap([
    ("Avval eshiting", "Faktni aniqlang; mehmon yoki hamkasbni ayblamang."),
    ("Yechim + vaqt", "Tekshirilgan va vakolatli yechim, mas'ul va qayta xabar vaqti."),
    ("Yordamga rozilik", "Qanday yordam kerakligini mehmonning o'zi aytadi."),
    ("Xavfni ajrating", "Salomatlik yoki xavfsizlik tahdidida oddiy navbat kutilmaydi.")],
    "R10 · To'liq smena: ikki stol, xorijiy mehmon, allergen, kechikish va alohida hisob bir mashqda.",
    "Ish joyingizda qulay kirish, o'tish yo'li va favqulodda aloqa tartibini tekshirib, bitta yaxshilash taklifini yozing.")

choice("Shikoyatni qabul qilishning birinchi qadami?", "Gapni bo'lmasdan tinglab, faktni aniqlash", "O'zimni oqlash", "Oshxonani ayblash", "Darhol bepul xizmat va'da qilish", "Yechim muammo to'g'ri tushunilgandan keyin tanlanadi.")
choice("«Hozir keladi» deyishdan oldin nima kerak?", "Oshxonadan tekshirilgan holat va vaqt", "Mehmonni jim qilish", "Tasodifiy muddat", "Hisobni chiqarish", "Tekshirilmagan va'da ishonchni kamaytiradi.")
choice("Chegirmani kim tasdiqlaydi?", "Vakolatli mas'ul", "Har qanday ofitsiant istagancha", "Qo'shni stol mehmoni", "Kuzatuvchi talaba", "Kompensatsiya restoran vakolat tartibiga kiradi.")
choice("Qulay o'rin so'ragan mehmon bilan kimga gapirasiz?", "Bevosita mehmonning o'ziga", "Faqat hamrohiga", "Faqat butun zalga", "Faqat oshxonaga", "Mehmon o'z ehtiyoji va tanlovining egasi.")
choice("Aravachani qachon surish mumkin?", "Mehmon roziligi va ko'rsatmasi bilan", "Yordam kerak deb o'ylasam", "Har doim salomdan oldin", "Yo'lni tezroq bo'shatish uchun", "Yordamchi vositaga ruxsatsiz tegilmaydi.")
choice("Eshitishda qiynalgan mehmonga mos usul?", "Yozma menyu va narx/vaqtni yozib tasdiqlashni taklif qilish", "Baqirish", "Hamrohiga barcha qarorni topshirish", "Buyurtmani taxmin qilish", "Mehmon uchun qulay aloqa usuli so'raladi.")
choice("Mehmon yordamni rad etdi. Nima qilasiz?", "Tanlovini hurmat qilib, kerak bo'lsa yordam borligini aytaman", "Baribir ushlab yetaklayman", "Xizmatdan bosh tortaman", "Hamrohidan majburlashni so'rayman", "Rozilik inklyuziv xizmatning bir qismi.")
choice("Allergik reaksiya alomati bo'lsa, nima ustun?", "Darhol mas'ul va shoshilinch tibbiy yordam chaqirish", "Avval shikoyat blankasini tugatish", "Avval hisobni yopish", "Taomni ko'proq pishirish", "Yordamni hujjat yoki hisob uchun kechiktirmang.")
choice("Shikoyat qaydida nimalar bo'ladi?", "Fakt, mas'ul, muddat, yechim va mehmon javobi", "Mehmon haqida haqoratli baho", "PIN va karta paroli", "Faqat taom rasmi", "Fakt va bajariladigan vazifa qayd qilinadi.")
choice("Qayta xabar va'dasi bajarilmay qolishi mumkin. Nima qilasiz?", "Muddatdan oldin holatni yangilab, mas'ul va mehmonni xabardor qilaman", "Mehmon unutishini kutaman", "Jurnalni o'chiraman", "Hamkasbni ayblayman", "Va'da holati faol nazorat qilinadi.")
choice("Taomda shisha gumoni bor. Birinchi yo'l?", "Yeyish/uzatishni to'xtatib, taomni ajratish va mas'ulga bildirish", "Ko'rinadigan bo'lakni olib qaytarish", "Choychaqa taklif qilish", "Mehmonni tezroq yeyishga undash", "Bu xavfsizlik hodisasi, oddiy ta'm shikoyati emas.")
choice("Mehmonni ko'rish ehtiyojida qanday qo'llaysiz?", "Menyuni o'qib berishni taklif qilib, buyum joyini aniq tushuntiraman", "So'ramasdan qo'lidan tortaman", "Narxlarni aytmayman", "Faqat hamrohiga qarayman", "Yordam turi so'raladi va mehmonning usuli hurmat qilinadi.")
choice("Xavfsiz joylashuvning belgisi?", "O'tish va chiqish yo'li ochiq, terminal/menyuga yetish qulay", "Aravacha chiqish eshigi oldida", "Bola yonida issiq choynak", "Stullar yo'lakni to'sgan", "Qulaylik bilan birga xavfsiz chiqish ham tekshiriladi.")
choice("«Bu mening aybim emas» o'rniga nima deysiz?", "«Holatni tekshirib, yechimni aytaman»", "«Oshxona doim shunday»", "«Siz kutishni bilmaysiz»", "«Boshqa restoranga boring»", "Muloqot mas'uliyat va yechimga yo'naltiriladi.")
choice("Hodisa rasmini shaxsiy chatga yuborish mumkinmi?", "Yo'q; zarur qayd faqat vakolatli tartibda yuritiladi", "Ha; mehmon norozi bo'lsa", "Ha; faqat hamkasblarga", "Ha; hazil uchun", "Mehmonning maxfiyligi va xizmatga zarur ma'lumot chegarasi saqlanadi.")
