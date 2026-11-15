# -*- coding: utf-8 -*-
"""R5 · Menyu va allergenlar bilan ishlash. 1 soat nazariya + 1 soat amaliyot."""
exec(open(MATN_DIR + "restoran_davom.py", encoding="utf-8").read())

lesson_cover(5, "Menyu va allergenlar bilan ishlash",
    "Taomni aniq tushuntirish · <b>allergiya va intolerans</b> · retsept va allergen jadvali · "
    "oshxona bilan tasdiqlash · <b>allergenning boshqa taomga o'tishi</b> · xavfsiz javob bo'lmasa xizmatni to'xtatish.",
    "1 soat nazariya · 1 soat amaliyot", 17, 15)
goals([
    ("Menyuni izohlaydi", "Tarkib, porsiya, pishirish usuli va narxni amaldagi menyu bilan solishtiradi."),
    ("So'rovni aniqlaydi", "Allergiya, intolerans, diniy talab va shaxsiy xohishni hurmat bilan farqlaydi."),
    ("Tekshiradi", "Retsept, qadoq yorlig'i, allergen jadvali va tayyorlash sharoitini oshxona bilan tekshiradi."),
    ("Qayd qiladi", "Stol va o'rin, allergen, mas'ul javobi va mehmon tanlovini bitta buyurtma qaydiga yozadi.")],
    ["allergen", "intolerans", "retsept", "yorliq", "allergen jadvali", "o'zaro kontakt", "tasdiq"])

page("Menyu kartasi: to'rtta aniq ma'lumot", defn("Taom nomi tarkibni to'liq ochmaydi. Bir xil nomli taom ikki restoranda "
     "turlicha retseptda tayyorlanishi mumkin. Manba — shu smenadagi <b>tasdiqlangan retsept</b>.") +
     table(["Savol", "O'quv misoli — tovuqli salat"], [
         ["Nimadan?", "Tovuq, ko'kat, pomidor, yogurtli sous; sous va bezak ham tarkibga kiradi"],
         ["Qancha?", "250 g, bir kishilik; non alohida"],
         ["Qanday tayyorlanadi?", "Tovuq pishiriladi; sabzavot xom; sous uzatishdan oldin qo'shiladi"],
         ["Narxi qancha?", "45 000 so'm — o'quv narxi; xizmat haqi bo'lsa oldindan tushuntiriladi"]]) +
     quote("R4dagi «Let me check the ingredients with our kitchen» iborasi aynan shu yerda ishlatiladi."))

page("Allergiya, intolerans va xohish", table(["So'rov", "Mazmuni", "Xizmatdagi qaror"], [
    ["Allergiya", "Immun tizim reaksiyasi; ba'zan juda oz miqdor ham og'ir oqibatga olib keladi", "Maxsus belgi, oshxona tasdig'i, o'zaro kontaktni tekshirish"],
    ["Intolerans", "Masalan, laktozani hazm qilish qiyinligi; allergiya bilan bir xil emas", "Mehmon aytgan cheklovni yozish, aniq tarkibni tekshirish"],
    ["Diniy yoki axloqiy talab", "Halol, vegetarian yoki vegan so'rovi", "Talab chegarasini so'rash; taxminiy yorliq bermaslik"],
    ["Shaxsiy xohish", "Masalan, piyozni yoqtirmaslik", "Retseptni o'zgartirish mumkinligini oshxonadan aniqlash"]]) +
    quote("Mehmon uchun tashxis qo'ymang va «ozginasi zarar qilmaydi» demang. Noaniq so'rovni xavfsizlik masalasi sifatida mas'ulga yetkazing."))

page("Allergenlar: nomi yashirinishi mumkin", grid(2,
    card_ul("orange", "🥜", "Ko'p uchraydigan manbalar", [
        "Sut — qaymoq, sariyog', yogurt va ayrim souslarda",
        "Tuxum — mayonez, xamir, desert va ayrim glazurlarda",
        "Bug'doy — un, non, panirovka va ayrim souslarda",
        "Yer yong'oq va daraxt yong'oqlari — alohida guruhlar; pesto va bezakni ham tekshiring"]),
    card_ul("blue", "🔎", "Boshqa misollar", [
        "Baliq, qisqichbaqasimonlar va mollyuskalar",
        "Soya, kunjut, xantal, selderey, lyupin",
        "Sulfitlar — ayrim quritilgan meva va tayyor mahsulotlarda",
        "Bu misollar har qanday allergiyani qamramaydi: mehmon aytgan mahsulotning o'zini yozing"])) +
    quote("Allergen ro'yxatlari mamlakatga qarab farq qiladi (R6). Ko'rinadigan yong'oqni olib tashlash taomni allergen uchun xavfsiz qilmaydi."))

page("Mehmonga beriladigan savollar", dialog("green", "💬", "So'rovni yozib oling", [
    ("O", "Ovqatga allergiyangiz yoki maxsus ovqatlanish talablingiz bormi?"),
    ("M", "Yong'oqqa allergiyam bor."),
    ("O", "Qaysi yong'oq turiga ekanini aniqlashtirsam: yer yong'oqmi yoki bodom kabi daraxt yong'og'imi?"),
    ("M", "Bodom va grek yong'og'iga."),
    ("O", "Qayd qildim. Retsept va tayyorlash sharoitini oshxonadan tekshirib qaytaman. Hozircha buyurtmani tasdiqlamay turaman.")]) +
    quote("Mehmon aniq turini ayta olmasa — noaniqlikni yozing, tekshirishni kengaytiring. «Yengilmi yoki og'irmi?» javobiga qarab tartibni qisqartirmang."))

page("Allergen jadvalini qanday o'qiymiz?", defn("Quyidagi jadval — <b>o'quv misoli</b>, haqiqiy restoran menyusi emas. "
    "«Bor» — retsept tarkibida; «? » — ma'lumot yetarli emas. Bo'sh katak xavfsizlik tasdig'i hisoblanmaydi.") +
    table(["Taom", "Sut", "Tuxum", "Bug'doy", "Yong'oq", "O'zaro kontakt"], [
        ["Yogurtli salat", "Bor", "Retseptda yo'q", "Retseptda yo'q", "Retseptda yo'q", "Alohida tekshiriladi"],
        ["Pestoli makaron", "Bor", "?", "Bor", "Bor", "Alohida tekshiriladi"],
        ["Grilda tovuq", "? marinad", "? marinad", "? sous", "? sous", "Umumiy gril tekshiriladi"]]) +
    quote("Jadval sanasi va retsept versiyasini tekshiring. Bugun sous yoki yetkazib beruvchi almashgan bo'lsa, kechagi jadval yetarli emas."))

page("Tekshirish zanjiri: to'rtta manba", grid(2,
    card("green", "1", "Retsept", "Asosiy taom + marinad + sous + garnir + bezak. Taomni kim tayyorlaydi va retsept o'zgarganmi?"),
    card("blue", "2", "Qadoq va jadval", "Tayyor sous, ziravor aralashmasi va yarim tayyor mahsulot yorlig'i. «Izlari bo'lishi mumkin» yozuvi ham mas'ulga ko'rsatiladi."),
    card("orange", "3", "Jarayon", "Bir xil yog', gril, pichoq, taxta, qisqich yoki qo'l orqali allergen o'tishi mumkinmi?"),
    card("violet", "4", "Mas'ulning aniq javobi", "Qaysi taom, qaysi o'rin, qaysi allergen, qanday sharoit? «Bo'ladi» degan noaniq javobni aniqlashtiring.")))

page("Allergenning boshqa taomga o'tishi", defn("<b>O'zaro kontakt</b> — allergenning boshqa taomga tasodifan o'tishi. "
    "Bu mikroblar yuqishi bilan aynan bir narsa emas: pishirish allergenni ishonchli yo'qotmaydi.") +
    table(["Xavfli vaziyat", "To'g'ri harakat"], [
        ["Yong'oqli desertdan keyin o'sha qoshiq", "Ishni to'xtatish, mos tozalash va toza anjom bilan qayta tayyorlashni oshxonaga topshirish"],
        ["Bir yog'da baliq va kartoshka", "Umumiy frityur haqida xabar; xavfsiz alohida jarayon bo'lmasa shu variantni taklif qilmaslik"],
        ["Bufetda aralashgan qisqichlar", "Taom va qisqichni ajratish, mas'ulni chaqirish; mehmonni eski taomga yo'naltirmaslik"],
        ["Tayyor salat ustidagi yong'oqni terib olish", "Taomni qaytarish; shunchaki bezakni olib tashlab qayta uzatmaslik"]]))

page("Oshxona bilan yopiq aloqa", dialog("blue", "👨‍🍳", "Qayta aytib tasdiqlash", [
    ("O", "8-stol, 2-o'rin: bodom va grek yong'og'iga ALLERGIYA. Tovuqning marinadi, sousi va grilini tekshirasizmi?"),
    ("Osh", "Marinad tarkibi tekshirildi, lekin umumiy grilda yong'oqli sous ishlatiladi. Alohida tayyorlash imkonini kafolatlay olmaymiz."),
    ("O", "Demak, bu gril taomini shu mehmon uchun tasdiqlamaymiz. Alohida toza jihozda tekshirilgan muqobil bormi?"),
    ("Osh", "Hozir ishonchli muqobil yo'q. Administratorga yetkazing.")]) +
    quote("Javob eshitilganini qayta ayting. Chipta/POSdagi ALLERGIYA belgisi og'zaki suhbatning o'rnini bosmaydi; ikkalasi ham kerak."))

page("Ishonchli javob yo'q: to'xtash qarori", grid(2,
    card_ul("red", "⛔", "Xizmatni to'xtating", ["Retsept yoki yorliq topilmadi", "Oshxona jarayonni ajrata olmaydi", "Buyurtma qaydi bilan tayyor tarelka mos emas", "Qaysi taom allergen so'roviga tegishli ekanligi noma'lum"]),
    card_ul("green", "💬", "Mehmonga tushuntiring", ["«Xavfsiz tayyorlash sharoitini tasdiqlay olmadik»", "«Shu sababli bu taomni sizga tavsiya qilmaymiz»", "Faqat tekshirilgan muqobilni va yangi vaqtni ayting", "Yechim bo'lmasa vakolatli mas'ulga yetkazing"])) +
    quote("Mehmonning roziligi noma'lum tarkibli taomni «allergensiz» deb uzatishga asos bo'lmaydi."))

page("Halol, vegetarian va vegan so'rovi", table(["So'rov", "Nimani aniqlashtirish kerak?"], [
    ["Halol", "Go'sht manbasi, marinad, spirtli qo'shimcha va tayyorlash sharoiti; tasdiqlanmagan sertifikatni va'da qilmang"],
    ["Vegetarian", "Go'sht/baliq buloni, jelatin va souslar; sut va tuxum iste'moli mehmonning talabiga bog'liq"],
    ["Vegan", "Sut, tuxum, asal va hayvon mahsulotlari; qo'shimcha va tayyorlash jarayoni"],
    ["Glutensiz", "Bug'doy va boshqa gluten manbalari, sous, un changi va umumiy jihozlar; tibbiy talabni aniq yozing"]]) +
    quote("«Vegan» belgisi yong'oq yoki soya yo'q degani emas. Parhez belgisi allergen tekshiruvini almashtirmaydi."))

page("Taomni uzatishdan oldingi oxirgi tekshiruv", grid(2,
    card("green", "📍", "Stol va o'rin", "8-stol, 2-o'rin. Mehmonning o'zidan buyurtmani tasdiqlang; allergiya haqida butun zalga ovoza qilmang."),
    card("blue", "🧾", "Chipta va tarelka", "Taom nomi, maxsus so'rov, mas'ul tasdig'i; bezak va sous oxirida almashmaganmi?"),
    card("orange", "✋", "Mos kelmasa", "Uzatmang. Taomni ajrating, oshxona mas'uliga qaytaring va to'g'ri javobni kuting."),
    card("violet", "🚨", "Alomat paydo bo'lsa", "Ovqatlanishni to'xtatishga yordam bering, darhol mas'ul va shoshilinch yordamni chaqiring (O'zbekistonda 103). Mehmonni yolg'iz qoldirmang; tibbiy tashxis yoki o'zboshimcha davolash qilmang.")))

page("Amaliy mashq: yong'oq allergiyasi", defn("Uchlik: ofitsiant, mehmon va oshxona vakili/kuzatuvchi. "
    "Jihoz: demo menyu, retsept, allergen jadvali, sous yorlig'i, buyurtma blankasi. <b>40 daqiqa:</b> 5 tayyorgarlik + "
    "3 × 8 daqiqalik rol almashish + 11 daqiqa tahlil.") +
    table(["Bosqich", "Vazifa"], [
        ["1. Mehmon", "Bodom va grek yong'og'iga allergiyasini bildiradi, tovuqli salatni so'raydi"],
        ["2. Ofitsiant", "Stol/o'rin va allergenni yozadi; sous, bezak va umumiy anjomni tekshiradi"],
        ["3. Oshxona kartasi A", "Sous yorlig'i noma'lum — ofitsiant uzatishni to'xtatishi kerak"],
        ["4. Oshxona kartasi B", "Retsept va alohida toza jihoz tasdiqlangan muqobilni taklif qiladi"],
        ["5. Natija", "Mehmon tanlovi, oshxona mas'uli, vaqt va uzatish tekshiruvi yoziladi"]]))
checklist([
    ("Aniqlik", "Allergen turi, stol va o'rin aniq qayd etildi"),
    ("Manba", "Retsept, sous yorlig'i va jadvalning dolzarbligi tekshirildi"),
    ("Jarayon", "Umumiy jihoz va yog' orqali o'tish xavfi so'raldi"),
    ("Aloqa", "Oshxona javobi qayta tasdiqlandi, buyurtmaga belgi qo'yildi"),
    ("To'xtash", "Noma'lum sous holatida taom uzatilmadi"),
    ("Yechim", "Tekshirilgan yechim va mehmon tanlovi qayd etildi")],
    "Stol: ___ O'rin: ___ Allergen: ___ Retsept/jadval sanasi: ___ Oshxona javobi va mas'ul: ___ "
    "Qaror: ___ Mehmon tasdig'i: ___ Vaqt: ___. Bu amaliy ish imtihonga kirish shartlaridan biridir.")
recap([
    ("Taxmin qilmang", "Taom nomi va tashqi ko'rinishi tarkibning dalili emas."),
    ("Hammasini tekshiring", "Sous, garnir, bezak, yorliq va umumiy jihoz ham hisobga olinadi."),
    ("Qayta tasdiqlang", "Mehmon → ofitsiant → oshxona → ofitsiant → mehmon zanjiri yopiladi."),
    ("Ishonch bo'lmasa to'xtang", "Yong'oqni terib olish yoki «ozgina» deb uzatish yechim emas.")],
    "R6 · Xalqaro mezonlar va xizmat uslublari: bir menyuni individual xizmat va bufetga moslash.",
    "O'zingiz ishlaydigan menyudan 3 ta taomning sous va bezagigacha tarkib kartasini tuzing; taxminiy joylarni savol belgisi bilan mas'ulga bering.")

choice("Taom ustidagi yong'oqni olib tashlasangiz, allergiyasi bor mehmonga uzatish mumkinmi?", "Yo'q; yangi, tekshirilgan jarayonda tayyorlash kerak", "Ha; ko'rinadigan yong'oq qolmasa yetadi", "Ha; sousni ko'paytirish kifoya", "Faqat taomni qizdirib berish kerak", "Allergen zarralari qolishi mumkin; qizdirish ham ishonchli yechim emas.")
choice("Allergen jadvalidagi bo'sh katak nimani anglatadi?", "Xavfsizlik tasdig'i emas; ma'nosi va tarkib tekshiriladi", "Allergen mutlaqo yo'q", "Taom bolalar uchun", "Taom alohida pishirilgan", "Bo'sh yoki noma'lum ma'lumotni «yo'q» deb talqin qilmang.")
choice("Laktoza intoleransi va sut allergiyasi bir xilmi?", "Yo'q; ikkalasida ham mehmon cheklovi yozilib, tarkib tekshiriladi", "Ha; farqiga e'tibor berilmaydi", "Intolerans bo'lsa sutni majburlash mumkin", "Allergiyada ozgina sut mumkin", "Mexanizmi har xil, lekin xodim cheklovni jiddiy qabul qiladi va tashxis qo'ymaydi.")
choice("Qaysi ma'lumot buyurtmada bo'lishi kerak?", "Stol/o'rin, aniq allergen, oshxona javobi va mehmon tanlovi", "Faqat mehmonning ismi", "Faqat taom narxi", "Faqat «maxsus mehmon» belgisi", "Aniq qayd keyingi xodimga taxminsiz xizmatni davom ettirishga yordam beradi.")
choice("Umumiy frityurda baliq va kartoshka pishadi. Nima tekshiriladi?", "Allergenning yog' orqali boshqa taomga o'tish xavfi", "Kartoshkaning faqat rangi", "Qoshiqning narxi", "Taom nomining inglizchasi", "Tarkibda bo'lmagan allergen umumiy yog' orqali o'tishi mumkin.")
choice("Bugun sous yetkazib beruvchisi o'zgardi. Nima qilasiz?", "Yangi yorliq va retseptni mas'ul bilan qayta tekshiraman", "Eski jadvalga tayanaman", "Mehmonni tatib ko'rishga undayman", "Faqat sous rangini solishtiraman", "Jadval yangi tarkib bilan mos bo'lishi kerak.")
choice("Mehmon «yong'oq» dedi. Qanday aniqlashtirasiz?", "Qaysi turi ekanini so'rayman, javobni yozaman", "O'zim bodom deb belgilayman", "Allergiya yengil bo'lsa yozmayman", "Yong'oq haqida savol bermayman", "Yer yong'oq va daraxt yong'oqlari bir xil guruh emas.")
choice("Vegan taom yong'oqqa allergiyasi bor mehmon uchun avtomatik xavfsizmi?", "Yo'q; tarkib va jarayon alohida tekshiriladi", "Ha; barcha o'simlik taomlari xavfsiz", "Faqat issiq bo'lsa xavfsiz", "Narxi yuqori bo'lsa xavfsiz", "Vegan taomda yong'oq, soya yoki kunjut bo'lishi mumkin.")
choice("Oshxona «bo'ladi» deb noaniq javob berdi. Nima qilasiz?", "Taom, allergen va tayyorlash sharoitini qayta tasdiqlayman", "Darhol uzataman", "Faqat narxni so'rayman", "Allergiya belgisini o'chiraman", "Yopiq aloqa aniq ma'lumotni qayta aytib tasdiqlashni talab etadi.")
choice("Tarelkaga chiqishda noma'lum bezak qo'shilgan. Qaroringiz?", "Uzatishni to'xtatib, tarkib va qaydni tekshiraman", "Bezagini yashirib uzataman", "Faqat yong'oqni ajrataman", "Mehmonga keyin aytaman", "Oxirgi bezak ham retsept va allergen nazoratiga kiradi.")
choice("Halol ekanini aniq bilmasangiz, nima deysiz?", "Mas'uldan manba va tayyorlash sharoitini tekshiraman", "Milliy taom bo'lgani uchun halol deyman", "Mehmon kiyimiga qarab javob beraman", "Qimmat bo'lsa halol deyman", "Tasdiqlanmagan da'vo qilinmaydi.")
choice("Qadoqda «izlari bo'lishi mumkin» yozilgan. Nima qilasiz?", "Yozuvni mas'ulga yetkazib, xavfsiz variantni tekshiraman", "Iz juda oz deb e'tiborsiz qoldiraman", "Yorliqni olib tashlayman", "Taomni ko'proq pishiraman", "Ogohlantirishni xodim o'zicha bekor qilmaydi.")
choice("Mehmonda ovqatdan keyin nafas qiyinlashdi. Birinchi yo'nalish?", "Xizmatni to'xtatib, mas'ul va shoshilinch yordamni darhol chaqirish", "Hisobni tezroq keltirish", "Bir oz kutib kuzatish", "O'zim tashxis qo'yib dori tanlash", "Xavfsizlik vaziyati oddiy shikoyatdan ustun; mehmon yolg'iz qoldirilmaydi.")
choice("Allergen jadvalidan tashqari nima tekshiriladi?", "Retsept, qadoq, sous-bezak va tayyorlash jarayoni", "Faqat menyu muqovasi", "Faqat taom harorati", "Faqat mehmonning tili", "Bitta jadval retsept o'zgarishi va o'zaro kontaktni to'liq kafolatlamaydi.")
choice("Xavfsiz muqobil topilmadi. To'g'ri javob?", "Tasdiqlay olmaganimni aytib, taomni uzatmayman va mas'ulni chaqiraman", "Mehmon rozi bo'lsa allergensiz deyman", "Oddiy taomni maxsus deb chiqaraman", "Muammoni oshxonadan yashiraman", "Xavfsiz javob bo'lmasa uzatish to'xtaydi va vaziyat qayd etiladi.")
