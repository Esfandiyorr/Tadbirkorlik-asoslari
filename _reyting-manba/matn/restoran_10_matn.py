# -*- coding: utf-8 -*-
"""R10 · To'liq smena bo'yicha amaliy mashq. 2 soat amaliyot, ikki stol."""
exec(open(MATN_DIR + "restoran_davom.py", encoding="utf-8").read())

lesson_cover(10, "To'liq smena bo'yicha amaliy mashq",
    "Brifing → tayyorgarlik → ikki stol → xorijiy mehmon → allergen so'rovi → buyurtma → "
    "kechikish → hisob → <b>smena topshirish</b>. Har tinglovchi bir to'liq xizmat siklini bajaradi.",
    "2 soat amaliyot", 17, 15)
goals([
    ("Uyg'unlashtiradi", "R1–R9dagi harakatlarni bitta xavfsiz va izchil xizmatga birlashtiradi."),
    ("Ustuvorlikni tanlaydi", "Ikki stolning ehtiyojini xavfsizlik, kutish va va'da asosida rejalashtiradi."),
    ("Mustaqil bajaradi", "Ofitsiant rolida kutib olishdan hisob va xayrlashuvgacha bir siklni tugatadi."),
    ("Topshiradi", "Yopilmagan vazifa, yangi mas'ul va muddatni keyingi smenaga aniq yetkazadi.")],
    ["brifing", "ikki stol", "ustuvorlik", "yopiq aloqa", "kuzatuv", "smena topshirish"],
    "8 daqiqa brifing + 10 tayyorgarlik + 3 × 18 daqiqa rol almashish + 8 daqiqa tahlil = 80 daqiqa")

page("Smena jihozlari va rollar", grid(2,
    card_ul("green", "🧰", "Jihoz", ["Ikki stol: 4 va 7, o'rin raqamli kartalar", "Menyu, retsept, allergen jadvali va oshxona javob kartalari", "Toza idish, sovuq taom maketi, bo'sh choynak va patnis", "Demo POS, chipta, hisob/o'quv chek blankalari, pul/karta maketi"]),
    card_ul("blue", "👥", "Uchlik", ["Ofitsiant — ikki stolni boshqaradi", "Mehmonlar vakili — ikki stol kartasini navbat bilan o'qiydi", "Oshxona vakili/kuzatuvchi — kartadagi javob va hodisalarni beradi", "Har 18 daqiqadan so'ng almashish; trener xavfsizlikni nazorat qiladi"])))

page("Smenaoldi brifingi", table(["Band", "Shu smena ma'lumoti"], [
    ["Stol 4", "Ikki mahalliy mehmon, tezroq xizmat so'raydi"],
    ["Stol 7", "Ikki xorijiy mehmon, ingliz tilini afzal ko'radi"],
    ["Stop-list", "Baliq bugun yo'q"],
    ["Maxsus so'rov", "7/1 mehmon yong'oqqa allergiyasini bildiradi; aniq turi suhbatda so'raladi"],
    ["Mas'ullar", "Zal sardori ___; oshxona vakili ___; kassa mas'uli ___"],
    ["Xizmat sharti", "R8dagi o'quv narxlari; mashqda kelishilgan 10% xizmat haqi; haqiqiy to'lov yo'q"]]) +
    quote("Kutish muddatlari mashq uchun qisqartirilgan. 18 daqiqalik aylanish haqiqiy restorandagi taom tayyorlash vaqti standarti emas."))

page("Mise en place: mehmon kelishidan oldin", table(["Tekshiruv", "Harakat"], [
    ["Xodim", "Qo'l gigiyenasi, toza forma, ishga tayyorlik"],
    ["Zal", "O'tish yo'li ochiq, stol barqaror, stul va menyu toza"],
    ["Kuvert", "Menyuga mos pribor, qadah, salfetka; R3 qoidasi"],
    ["Stansiya", "Zaxira toza anjom va ishlatilgan idish uchun alohida joy"],
    ["Axborot", "Stop-list, narx, retsept/jadval va mas'ullar ma'lum"],
    ["Blankalar", "Stol/o'rin bo'yicha buyurtma, POS, chipta va hodisa qaydi tayyor"]]))

page("Stol kartalari: bir vaqtda ikki ehtiyoj", grid(2,
    card_ul("green", "4", "4-stol", ["1-o'rin: tovuq va suv", "2-o'rin: salat va choy", "Ular vaqti cheklanganini aytadi", "Keyin taom kechikishi kartasi beriladi", "Bir hisob so'raydi; 132 000 so'm o'quv jami"]),
    card_ul("blue", "7", "7-stol", ["1-o'rin: ingliz tilida, grek yong'og'iga allergiya; baliq va gazsiz suv so'raydi", "2-o'rin: salat va choy", "Baliq yo'q — tekshirilgan tovuq muqobili taklif qilinadi", "Alohida hisob: 82 500 va 49 500", "Allergen javobini trener beradi, ofitsiant o'zi to'qimaydi"])))

page("Aylanish jadvali: 18 daqiqa", table(["Daqiqa", "Ofitsiantning harakati", "Kuzatuvchi"], [
    ["0–3", "Kutib olish, til, joylashtirish, byudjet/vaqt va allergen savoli", "7/1 allergiya kartasini ochadi"],
    ["3–6", "Retsept/jarayonni tekshirish, stop-list muqobili, buyurtma tasdig'i", "Oshxona javobini beradi"],
    ["6–9", "Demo POS, chipta, ichimlik va taom maketini xavfsiz uzatish", "4-stolga kechikish kartasi"],
    ["9–12", "Shikoyatni tinglash, yechim/vaqt, xizmatni tekshirish", "Yangi vaqt va variantlar"],
    ["12–15", "Hisob, xato band, ajratish, to'lov maketi va o'quv chek", "Xato desert bandi"],
    ["15–18", "Xayrlashuv, stolni tiklash, ochiq vazifa topshirish", "Individual varaq va qisqa fikr"]]))

page("Til va allergen: xavfsizlik ustuvor", dialog("blue", "🌍", "7/1 mehmoni", [
    ("O", "Which language would you prefer? Do you have any food allergies?"),
    ("M", "English. I have a walnut allergy. I would like fish."),
    ("O", "Thank you for telling me. We do not have fish today. Let me check a suitable alternative and the preparation with our kitchen."),
    ("Osh", "Maket A: tovuq retsepti va alohida toza jarayon tasdiqlangan; sous alohida, bezakda yong'oq yo'q."),
    ("O", "The kitchen has checked the chicken and separate preparation. The price is 65,000 soums. Would you like it?")]) +
    quote("Maket B: sous yorlig'i noma'lum. Bu kartada ofitsiant buyurtmani tasdiqlamaydi, taomni uzatmaydi va mas'ulni chaqiradi. To'xtash — to'g'ri natija."))

page("Ikki stol orasida ustuvorlik", table(["Holat", "Ustuvor harakat"], [
    ["Allergen taomi noaniq, boshqa stol hisob so'radi", "Noaniq taomni ajratish, mas'ulga xabar; hisobni hamkasbga aniq topshirish"],
    ["4-stol kechikdi, 7-stol buyurtma bermoqchi", "4-stolga kelishilgan xabarni yetkazish; 7-stolni payqab qisqa kutish vaqtini aytish"],
    ["Ichimlik to'kildi", "Yo'lni belgilash va xavfni bartaraf etishga yordam chaqirish; patnisni xavfsiz joyga qo'yish"],
    ["Hamkasb yordam berdi", "Stol, o'rin, bajarilgan va ochiq vazifani qayta tasdiqlash"]]) +
    quote("Tezlik xavfsizlikdan ustun emas. Vazifa topshirish — «4-stolga qarab tur» emas, «hisobni tekshirib ber, 2 daqiqada qaytaman» kabi aniq bo'ladi."))

page("Kechikish kartasi: va'dani yangilash", defn("4-stolga aytilgan vaqt o'tdi. Oshxona yana 10 daqiqa deydi. "
    "Ofitsiant mehmonning yangi tanlovini oladi va qayta xabar muddatini yozadi.") +
    table(["Qayd", "Namuna"], [
        ["Fakt", "Vaqti cheklangan 4-stol; aytilgan muddat o'tdi"],
        ["Mas'ul", "Oshxona vakili ___, zal sardori ___"],
        ["Yechim", "Kutish / tekshirilgan tezroq muqobil / vakolatli bekor qilish"],
        ["Mehmon tanlovi", "Kutishga rozi, yangi xabar 5 daqiqadan keyin"],
        ["Nazorat", "Aylanish vaqtida trenerga og'zaki yangi xabar, qaydga vaqt yozish"]]))

page("Hisob kartasi: uchta mos hujjat", table(["Hisob", "Asos", "10%", "Jami"], [
    ["4-stol umumiy", "120 000", "12 000", "132 000"],
    ["7-stol A: tovuq + suv", "75 000", "7 500", "82 500"],
    ["7-stol B: salat + choy", "45 000", "4 500", "49 500"]]) +
    quote("Trener 25 000 so'mlik buyurilmagan desertni qo'shadi. Ofitsiant buyurtmani tekshiradi, mas'ulga band va unga tegishli xizmat haqini tuzattiradi. "
          "Menyu, buyurtma va tuzatilgan hisob mos; o'quv chek ham shu summa. Hech qanday haqiqiy to'lov qilinmaydi."))

page("Smena topshirish: yopilmagan vazifa", defn("Xizmat yakunlangan bo'lsa ham barcha ish tugagan bo'lmasligi mumkin. "
    "Keyingi xodim nimani, qachon va kim bilan tekshirishini bilishi kerak.") +
    table(["Maydon", "Misol"], [
        ["Stol/vazifa", "4-stol kechikishining sababini smena tahliliga kiritish"],
        ["Hozirgi holat", "Mehmon xizmatni tugatdi, hisob yopildi; sabab hali tekshirilmoqda"],
        ["Keyingi qadam", "Oshxona sardoridan jarayon sababini olish"],
        ["Yangi mas'ul va muddat", "Keyingi smena sardori ___, brifinggacha ___"],
        ["Qabul tasdig'i", "Qabul qiluvchi vazifani qayta aytdi va blankani imzoladi"]]) +
    quote("Smena topshirishda allergiya kabi shaxsiy ma'lumot faqat hali xizmatga zarur bo'lsa, kerakli mas'ulga beriladi."))

page("Kuzatuvchi: fikrni fakt bilan ayting", grid(2,
    card("green", "✓", "Kuchli harakat", "«7/1 allergenini yozib, oshxona javobini qayta aytdingiz» — aniq kuzatilgan harakat."),
    card("orange", "↻", "Qayta mashq", "«4-stolga qayta xabar va'dasini unutdingiz. Keyingi aylanishda vaqtni qaydga yozib tekshiring»."),
    card("blue", "📝", "Har bir tinglovchiga alohida", "Bir guruhning yaxshi natijasi barcha ishtirokchilar mustaqil bajarganini anglatmaydi."),
    card("violet", "🧭", "Rivojlanish rejasi", "Bitta kuchli va bitta yaxshilash harakati; qayta mashq sanasi va kuzatuvchi.")))

page("Xavfsizlikda to'xtatish va qayta mashq", grid(2,
    card_ul("red", "✋", "Trener to'xtatadi", ["Tasdiqsiz allergen taomi uzatilmoqda", "Ifloslangan anjom qayta qo'yilmoqda", "Issiq idish yoki to'silgan yo'l bilan bevosita xavf", "Yordam talab qiladigan hodisa e'tiborsiz qolmoqda"]),
    card_ul("green", "↻", "Qayta boshlash", ["Xavfli buyum yoki jarayon ajratiladi", "Nima uchun to'xtatilgani fakt bilan aytiladi", "To'g'ri harakat qayta namoyish qilinadi", "Individual varaqda yordam darajasi va keyingi mashq qayd etiladi"])) +
    quote("Bu R10 — tayyorgarlik mashqi. R12da kritik xato amaliy imtihon natijasini bekor qilishiga oldindan e'tibor bering."))
checklist([
    ("Brifing va gigiyena", "Stop-list, rol, qo'l va toza/iflos oqim tekshirildi"),
    ("Kutib olish", "Ikki stol payqaldi, til va ehtiyoj so'raldi"),
    ("Allergen", "So'rov, retsept/jarayon, mas'ul va to'xtash qarori to'g'ri"),
    ("Buyurtma/uzatish", "POS, chipta, stol/o'rin va taom mos"),
    ("Shikoyat", "Yechim, muddat va qayta xabar bajarildi"),
    ("Hisob", "Xato band tuzatildi, ajratilgan hisob va chek mos"),
    ("Yakun", "Minnatdorlik, stolni tiklash va ochiq vazifa topshirildi")],
    "Har tinglovchining bitta to'liq sikl varag'i, ikki stol hujjatlari va yangi mas'ul qabul qilgan ochiq vazifa qaydi.")
recap([
    ("Xavfsizlik birinchi", "Noaniqlikda to'xtash va yordam so'rash — kasbiy qaror."),
    ("Aloqa yopiladi", "Mehmon, zal, oshxona va kassa bir xil ma'lumot bilan ishlaydi."),
    ("Har kishi bajaradi", "Ofitsiant roli barchaga navbat bilan beriladi."),
    ("Ochiq ish topshiriladi", "Vazifa, holat, keyingi qadam, mas'ul va muddat qayd qilinadi.")],
    "R11 va R12 · Yakuniy nazariy va amaliy imtihon. Kirish: kamida 18/20 modul soati, R2 sanitariya va R5 allergen amaliy ishlari bajarilgan.",
    "Individual varaqdagi eng zaif bitta harakatni qayta mashq qiling; R11/R12 mezonlari bilan o'zingizni solishtiring.")

choice("Ikki stolda ham vazifa bor, allergen taomi noma'lum. Nima ustun?", "Noaniq taomni to'xtatish va mas'ulga xabar", "Avval qimmat hisob", "Avval bezak", "Taomni taxminan uzatish", "Xavfsizlik kutish navbatidan ustun.")
choice("R10da har bir tinglovchi nima bajarishi kerak?", "Kamida bitta to'liq ofitsiant xizmat sikli", "Faqat kuzatish", "Faqat bir test", "Faqat chek sanash", "Rollar almashadi, individual kuzatuv yuritiladi.")
choice("Smenaoldi brifingida nima tekshiriladi?", "Bron/stol, stop-list, maxsus so'rov, rol va mas'ullar", "Faqat musiqa", "Faqat surat", "Faqat internet tezligi", "Barcha xodimlar bir xil dolzarb axborot bilan boshlaydi.")
choice("7/1da grek yong'og'i allergiyasi. Muqobilni qachon tasdiqlaysiz?", "Retsept/jarayon va mehmon tanlovi tasdiqlangach", "Baliq yo'q degan zahoti", "Tovuq oq rangli bo'lsa", "Narxi mos kelsa", "Muqobil so'rovga xavfsiz va mehmon uchun maqbul bo'lishi kerak.")
choice("Yordam so'raganda vazifa qanday topshiriladi?", "Stol, aniq ish, holat va qaytish vaqti bilan", "«Qarab tur» deb", "Hech qanday ma'lumotsiz", "Faqat stol rasmini yuborib", "Topshiriqni oluvchi qayta aytib tasdiqlaydi.")
choice("4-stol shikoyatidan keyin qanday qayd kerak?", "Fakt, mas'ul, yechim, muddat va mehmon javobi", "Faqat «norozi»", "Faqat mehmon kiyimi", "Faqat taom rangi", "Qayd bajariladigan vazifani va nazoratni ko'rsatadi.")
choice("7-stol ikki hisobi 82 500 va 49 500. Jami?", "132 000 so'm", "120 000 so'm", "145 000 so'm", "159 500 so'm", "Alohida hisoblar umumiy summa bilan solishtiriladi.")
choice("Smena topshirish qaydida nima bo'ladi?", "Vazifa, holat, keyingi qadam, yangi mas'ul va muddat", "Faqat eski ofitsiant ismi", "Faqat bugungi tushum", "Faqat ochilish vaqti", "Yangi mas'ul vazifani qabul qilganini tasdiqlaydi.")
choice("Kuzatuvchi foydali fikrni qanday beradi?", "Aniq kuzatilgan harakat va keyingi mashq bilan", "Shaxsni tanqid qilib", "Faqat «yomon» deb", "Guruhni bir xil baholab", "Fikr xulq va natijaga qaratiladi.")
choice("Trener xavfli uzatishni ko'rdi. Nima qiladi?", "To'xtatadi, xavfni ajratadi va to'g'ri harakatni qayta mashq qildiradi", "Tezlik uchun davom ettiradi", "Faqat oxirida aytadi", "Taomni yashiradi", "Tayyorlov mashqida xavfsizlik darhol tiklanadi.")
choice("18 daqiqalik aylanish haqiqiy tayyorlash standarti bo'ladimi?", "Yo'q; bu qisqartirilgan trening jadvali", "Ha; barcha taom uchun", "Faqat xorijiy mehmonga", "Faqat bufetda", "Haqiqiy vaqt oshxona bilan tekshiriladi.")
choice("R10da to'lov qanday bajariladi?", "Pul va karta maketi, o'quv chek bilan", "Bankdan haqiqiy pul yechib", "Talabaning PINini olib", "Begona mijoz hisobida", "Mashqda real savdo operatsiyasi yo'q.")
choice("Allergen sousining yorlig'i noma'lum kartada to'g'ri natija?", "Uzatishni to'xtatish va mas'ulni chaqirish", "Mehmon rozi bo'lsa allergensiz deyish", "Sousni kamroq qo'yish", "Qaynatib uzatish", "To'xtash ham muvaffaqiyatli xavfsiz qaror bo'lishi mumkin.")
choice("Imtihonga kirish uchun nima kerak?", "Kamida 18/20 modul soati, sanitariya va allergen amaliy ishlari", "Faqat pullik kursga kirish ruxsati", "Faqat bitta test", "Faqat guruhdagi boshqa kishining varag'i", "Kirish sharti trener tomonidan dalillar bilan tekshiriladi.")
choice("R10ning natija dalili nima?", "Individual varaq, ikki stol hujjatlari va ochiq vazifa topshirig'i", "Faqat umumiy guruh surati", "Faqat taklif qilingan taomlar", "Faqat video ko'rish", "Har tinglovchining mustaqil harakati ko'rinishi kerak.")
