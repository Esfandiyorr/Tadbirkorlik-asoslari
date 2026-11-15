# -*- coding: utf-8 -*-
"""R8 · Tavsiya berish va to'lovni rasmiylashtirish. Barcha narxlar — o'quv misoli."""
exec(open(MATN_DIR + "restoran_davom.py", encoding="utf-8").read())

lesson_cover(8, "Tavsiya berish va to'lovni rasmiylashtirish",
    "<b>Byudjet va rozilik</b> · taom va alkogolsiz ichimlik · suv, choy, qahva · narx va xizmat shartlari · "
    "hisobni ajratish · xato bandni tuzatish · <b>chek va qaytim</b>.",
    "1 soat nazariya · 1 soat amaliyot", 18, 15)
goals([
    ("Mos taklif beradi", "Mehmon didi, byudjeti va tekshirilgan parhez talabiga mos 1–2 variantni tushuntiradi."),
    ("Xavfsiz uzatadi", "Suv, choy va qahvani toza anjomda, issiq haqida ogohlantirib beradi."),
    ("Hisobni ajratadi", "Har o'rin buyurtmasi va umumiy bandlarni mehmonlar roziligi bilan taqsimlaydi."),
    ("Tekshiradi va yakunlaydi", "Xato bandni vakolatli mas'ul bilan tuzatadi; to'lov holati, tegishli chek va qaytimni tekshiradi.")],
    ["byudjet", "rozilik", "uyg'unlik", "xizmat haqi", "alohida hisob", "o'quv cheki", "qaytim"])

page("Tavsiya: avval ehtiyoj, keyin mahsulot", grid(2,
    card_ul("green", "❓", "Uch savol", ["Qanday ta'm yoki taomni xohlaysiz?", "Taxminiy byudjetingiz va vaqtingiz qancha?", "Allergiya yoki maxsus ovqatlanish talabi bormi?"]),
    card_ul("blue", "💬", "Mos taklif", ["Ikki aniq variant: tarkib, porsiya, narx, vaqt", "Qimmatrog'ini emas, ehtiyojga mosini tushuntirish", "Ichimlik qo'shimcha narxini oldindan aytish", "«Xohlaysizmi?» va mehmonning javobini kutish"])) +
    quote("«Eng yaxshisi shu» degan umumiy maqtovdan ko'ra, «Bu yengilroq, 15 daqiqada tayyor va byudjetingizga sig'adi» foydaliroq."))

page("Alkogolsiz ichimlik bilan uyg'unlik", table(["Taom/ehtiyoj", "Taklif misoli", "Tekshirish"], [
    ["Yog'li yoki ziravorli taom", "Gazsiz suv yoki shakarsiz choy", "Mehmon xohishi; davolash yoki hazmga kafolat va'da qilinmaydi"],
    ["Yengil salat", "Suv yoki yengil alkogolsiz ichimlik", "Shakar, gaz va porsiya hajmi"],
    ["Desert", "Choy yoki qahva", "Kofein xohishi; sut va sirop tarkibi"],
    ["Sut allergiyasi so'rovi", "Faqat tekshirilgan ichimlik va tayyorlash jarayoni", "O'simlik ichimligida soya/yong'oq bo'lishi va umumiy ko'pirtirgich"]]) +
    quote("Uyg'unlik — tavsiya. Mehmon «faqat suv» desa hurmat qilinadi, roziliksiz qo'shimcha buyurtma kiritilmaydi."))

page("Suvni uzatish", grid(2,
    card_ul("green", "💧", "Ketma-ketlik", ["Gazli/gazsiz va hajmni aniqlang", "Narxni ayting; pullik butilka ekanini yashirmang", "Stakanni pastki qismi yoki oyoqchasidan ushlang", "Butilkani restoran tartibi va mehmon roziligi bilan oching", "Suvni xavfsiz quyib, suhbat va shaxsiy masofani hurmat qiling"]),
    card_ul("orange", "🧊", "Qo'shimcha savol", ["Muz kerakmi? Sovuqmi yoki xona haroratidami?", "Muz — oziq-ovqat: toza maxsus qisqich/kurakcha", "Stakan bilan muz olinmaydi", "Stakan chetiga butilka og'zi tekkizilmaydi", "Bo'sh butilka yangi buyurtmaga mehmon roziligi o'rniga o'tmaydi"])))

page("Choy va qahva: issiq xizmat", table(["Bosqich", "Harakat"], [
    ["Buyurtma", "Qora/ko'k choy, qahva turi, porsiya, shakar/sut va qo'shimcha narx"],
    ["Tayyorlik", "Toza, darzsiz idish; issiq ichimlik uchun mos patnis; allergen so'rovini tekshirish"],
    ["Tashish", "Patnisni muvozanatlash; choynak og'zi mehmon va bolaga qaratilmaydi"],
    ["Uzatish", "«Ehtiyot bo'ling, issiq»; barqaror joy, mehmon ustidan cho'zilmaslik"],
    ["Qo'shimcha", "Sut, shakar, limon faqat kelishilgan va tarkibi tekshirilgan holda"]]) +
    quote("O'simlik ichimligi avtomatik allergensiz emas. Umumiy ko'pirtirgich yoki idishdagi sut qoldig'i ham tekshiriladi."))

page("Narx va to'lov shartlarini oldindan aytish", grid(2,
    card("green", "📖", "Menyu", "Narxning porsiya, dona yoki og'irlik birligini ko'rsating. Non, sous va ichimlik alohidami?"),
    card("blue", "🧾", "Xizmat haqi", "Bo'lsa, miqdori va hisoblash asosi buyurtmadan oldin tushuntiriladi; amaldagi talab va korxona tartibi tekshiriladi."),
    card("orange", "💳", "To'lov", "Naqd yoki qabul qilinadigan karta; terminal ishlamasa oldindan xabar. Mehmonni kutilmagan shartga qo'ymang."),
    card("violet", "🤝", "Choychaqa", "Ixtiyoriy. Xizmat haqi bilan aralashtirmang, hisobga roziliksiz qo'shmang va qaytimni o'zingizcha ushlab qolmang.")))

page("Hisobni tekshirish: beshta moslik", table(["Tekshiruv", "Savol"], [
    ["Menyu", "Shu vaqtdagi narx, porsiya va oshkor qilingan shartmi?"],
    ["Buyurtma", "Taom va sonlar mehmon tasdiqlagan yozuv bilan mosmi?"],
    ["Bajarilish", "Bekor qilingan yoki berilmagan taom qolib ketmadimi?"],
    ["Hisob", "Bandlar, chegirma va xizmat haqi mas'ul tasdig'i bilan to'g'rimi?"],
    ["To'lov/chek", "Yakuniy summa, usul va tegishli chek bir xilmi?"]]) +
    quote("Hisobni mehmonga berishdan oldin xodim tekshiradi. Bank terminali slipi bilan savdo/fiskal chek vazifasi bir xil emas; tegishli chek korxonaning qonuniy tartibi bo'yicha beriladi."))

page("O'quv menyusi va ikki mehmon", table(["Mahsulot", "Narx", "Kim buyurdi?"], [
    ["Tovuq ×1", "65 000", "A — 1-o'rin"], ["Gazsiz suv ×1", "10 000", "A — 1-o'rin"],
    ["Salat ×1", "30 000", "B — 2-o'rin"], ["Choy ×1", "15 000", "B — 2-o'rin"],
    ["Desert ×1", "25 000", "Hech kim buyurmagan — xato band"]]) +
    defn("<b>O'quv sharti:</b> menyuda oldindan ochiq ko'rsatilgan va kelishilgan 10% xizmat haqi bor deb olinadi. "
    "Bu mashqdagi foiz barcha restoran uchun majburiy qoida degani emas. Choychaqa hisoblanmaydi."))

page("Xato bandni mas'ul bilan tuzatish", dialog("orange", "🧾", "Desert buyurilmagan", [
    ("M", "Hisobimizda desert bor, biz buyurmagandik."),
    ("O", "Uzr so'rayman. Buyurtma va oshxona qaydini hozir tekshiraman."),
    ("A", "Desert xato kiritilgan. 25 000 so'm bandni va unga tegishli 2 500 so'm xizmat haqini tuzatishga ruxsat berdim."),
    ("O", "Tuzatilgan hisob: taomlar 120 000, xizmat 12 000, jami 132 000 so'm. Bir hisobmi yoki alohidami?")]) +
    table(["Holat", "Taomlar", "10%", "Jami"], [
        ["Xato", "145 000", "14 500", "159 500"], ["Tuzatilgan", "120 000", "12 000", "132 000"]]) +
    quote("Qayd: trening #012, desert xato kiritilgan, mas'ul ___, vaqt ___, eski va yangi summa. Faqat qo'lda ustidan chizib, kassani o'zgarishsiz qoldirmang."))

page("Hisobni ajratish: aniq kelishuv", table(["Hisob", "Bandlar", "Asos", "Xizmat 10%", "Jami"], [
    ["A", "Tovuq + suv", "75 000", "7 500", "82 500"],
    ["B", "Salat + choy", "45 000", "4 500", "49 500"],
    ["Tekshiruv", "A + B", "120 000", "12 000", "132 000"]]) +
    quote("Umumiy non yoki choynak bo'lsa, kim to'lashi yoki qanday bo'linishi so'raladi. Yarmini bo'lish har doim taomlar bo'yicha ajratish bilan bir xil emas."))

page("Naqd to'lov: qaytimni tekshirish", defn("A hisobi: <b>82 500 so'm</b>. Mehmon <b>100 000 so'm</b> berdi. "
    "Qaytim = 100 000 − 82 500 = <b>17 500 so'm</b>.") +
    grid(2,
        card_ul("green", "💵", "Ketma-ketlik", ["Qabul qilingan summani aniq ayting", "Kassa qaydi va chekni tartib bo'yicha rasmiylashtiring", "Qaytimni sanab, chek bilan taqdim eting", "Mehmon o'zi aytmaguncha qaytimni choychaqa deb olmang"]),
        card_ul("blue", "🔎", "Nazorat", ["To'lov summasi yakuniy hisobga mos", "Qaytim hisobdan mustaqil qayta tekshirildi", "Mashqda faqat qog'oz pul maketi ishlatiladi", "Shaxsiy pul va kassani aralashtirmang"])))

page("Karta to'lovi: holatni tekshirish", grid(2,
    card_ul("green", "💳", "Xavfsiz to'lov", ["B hisobi: 49 500 so'mni mehmon ko'radi", "Terminal mehmon ko'z oldida; karta uzoqqa olib ketilmaydi", "PINni mehmonning o'zi teradi; so'ralmaydi va kuzatilmaydi", "Tasdiq holati va tegishli chek tekshiriladi"]),
    card_ul("orange", "⏳", "Javob kelmasa", ["Darhol ikkinchi marta yechishga urinmang", "Kassir va provayder tartibi bo'yicha birinchi operatsiya holatini tekshiring", "Mehmonga aniqlashtirilayotganini ayting", "Takror to'lov yoki qaytarish faqat tasdiqlangan holat va vakolat bilan"])))

page("O'quv cheki: moslikni yakunlash", table(["O'QUV CHEKI — haqiqiy savdo hujjati emas", "A", "B"], [
    ["Taom va ichimliklar", "75 000", "45 000"], ["Oldindan kelishilgan xizmat 10%", "7 500", "4 500"],
    ["To'lash kerak", "82 500", "49 500"], ["Usul", "Naqd", "Karta — maket"],
    ["Berilgan summa", "100 000", "49 500"], ["Qaytim", "17 500", "0"], ["Trening qaydi", "#012-A", "#012-B"]]) +
    quote("Menyu → tasdiqlangan buyurtma → tuzatilgan hisob → to'lov → o'quv cheki bir xil bo'lishi kerak. Haqiqiy chek korxonaning tegishli tizimidan olinadi."))

page("Amaliy mashq: tavsiya va ikkita hisob", defn("40 daqiqa: 5 brifing, 10 ehtiyoj va tavsiya, 15 hisob/xato/to'lov mashqi, "
    "10 tekshiruv va rol almashish. Trening pullari, karta maketi, menyu va chek blankasi kerak.") +
    U("ol", "".join(U("li", x) for x in [
        "Mehmon byudjetini so'rang; ichimlikni narxi bilan taklif qilib, roziligini oling.",
        "Suv va bo'sh choynakni xavfsiz uzatishni namoyish qiling; qaynoq suvsiz mashq qiling.",
        "Xato desert bandini buyurtma bilan solishtirib, mas'ulga tuzattiring.",
        "Hisobni A va Bga ajrating; A uchun 100 000 dan qaytimni, B uchun karta holatini tekshiring.",
        "Ikki o'quv cheki va tuzatish qaydini tayyorlang; juftlikka mustaqil tekshirtiring."
    ])))
checklist([
    ("Tavsiya", "Byudjet va ehtiyoj so'raldi, ichimlikka rozilik olindi"),
    ("Xizmat", "Suv/choy toza, barqaror va xavfsiz uzatildi"),
    ("Narx", "Qo'shimcha to'lov va shart oldindan aytildi"),
    ("Tuzatish", "Xato band va tegishli xizmat haqi mas'ul bilan tuzatildi"),
    ("Ajratish", "82 500 + 49 500 = 132 000 mosligi tekshirildi"),
    ("Yakun", "Qaytim 17 500; to'lov holati, o'quv chek va qayd mos")],
    "Menyu, buyurtma, tuzatish qaydi, ajratilgan ikki hisob va ikkita o'quv cheki.")
recap([
    ("Rozilik", "Tavsiya mehmonning tanloviga yordam beradi; qo'shimcha majburlanmaydi."),
    ("Oldindan aniqlik", "Narx, porsiya va to'lov sharti hisobdan oldin tushuntiriladi."),
    ("Vakolatli tuzatish", "Xato band va unga bog'liq summa iz bilan tuzatiladi."),
    ("Hisob = to'lov = chek", "Alohida hisoblar yig'indisi va qaytim qayta tekshiriladi.")],
    "R9 · Shikoyat va inklyuziv xizmat: tinglash, kelishilgan yechim, qulay o'rin va yordamga rozilik.",
    "Shu hisobni xizmat haqi bo'lmagan holatda qayta hisoblang: jami 120 000; A 75 000, B 45 000, A qaytimi 25 000.")

choice("Ichimlikni hisobga qachon qo'shasiz?", "Narxni aytib, mehmon roziligidan keyin", "Tavsiya qilganim zahoti", "Mehmon jim bo'lsa", "Har bir stolga avtomatik", "Tavsiya buyurtma emas; mehmon tanlovi olinadi.")
choice("Byudjetga mos tavsiya qanday?", "Tarkib, porsiya, narx va vaqt bilan 1–2 mos variant", "Eng qimmat taomni majburlash", "Narxni yashirib maqtash", "Faqat ofitsiant yoqtirganini berish", "Tavsiya mehmon ehtiyoji va imkoniga mos bo'ladi.")
choice("Sut allergiyasida o'simlik ichimligi avtomatik xavfsizmi?", "Yo'q; tarkib va umumiy jihoz tekshiriladi", "Ha; o'simlik bo'lsa kifoya", "Faqat issiq bo'lsa", "Faqat qimmat bo'lsa", "Soya/yong'oq va umumiy ko'pirtirgichdagi sut qoldig'i ham xavf bo'lishi mumkin.")
choice("Xizmat haqi bo'lsa, qachon tushuntiriladi?", "Buyurtmadan oldin miqdori va hisoblash asosi bilan", "Faqat to'lovdan keyin", "Hech qachon", "Mehmon chet ellik bo'lsa yashiriladi", "Kutilmagan to'lov nizoga olib keladi; amaldagi talab ham tekshiriladi.")
choice("Choychaqa va qaytimga oid to'g'ri harakat?", "Qaytimni to'liq berib, choychaqani mehmon ixtiyoriga qoldirish", "Qaytimni avtomatik ushlab qolish", "Hisobga roziliksiz qo'shish", "Ko'proq to'lashga undash", "Choychaqa ixtiyoriy, xizmat haqi bilan bir xil emas.")
choice("Xato desert 25 000, unga xizmat 2 500. Qancha tuzatiladi?", "27 500 so'm", "25 000 so'm", "2 500 so'm", "30 000 so'm", "Band bekor bo'lsa, unga bog'liq xizmat haqi ham qayta hisoblanadi.")
choice("120 000 so'mga kelishilgan 10% xizmat bilan jami qancha?", "132 000 so'm", "130 000 so'm", "120 010 so'm", "144 000 so'm", "120 000 + 12 000 = 132 000.")
choice("A: 75 000 va 10% xizmat. To'lash kerak?", "82 500 so'm", "80 000 so'm", "75 010 so'm", "85 000 so'm", "75 000 + 7 500 = 82 500.")
choice("A 82 500 uchun 100 000 berdi. Qaytim?", "17 500 so'm", "25 000 so'm", "7 500 so'm", "18 500 so'm", "100 000 − 82 500 = 17 500.")
choice("Hisoblar 82 500 va 49 500. Tekshiruv jami?", "132 000 so'm", "122 000 so'm", "142 000 so'm", "130 500 so'm", "Ajratilgan hisoblar yig'indisi umumiy hisobga teng bo'lishi kerak.")
choice("Terminal javobi noma'lum. Birinchi to'g'ri qadam?", "Kassir bilan operatsiya holatini tekshirish", "Darhol yana pul yechish", "Karta PINini yozib olish", "Mehmonni ikki marta to'latish", "Avvalgi to'lov tasdiqlanmasdan takrorlash ikki marta yechimga olib kelishi mumkin.")
choice("PIN bilan kim ishlaydi?", "Mehmonning o'zi, maxfiy holda", "Ofitsiant uni ayttirib oladi", "Kassir uni daftarga yozadi", "Boshqa mehmon teradi", "PIN so'ralmaydi, saqlanmaydi va kuzatilmaydi.")
choice("Bank terminali slipi nimani avtomatik almashtirmaydi?", "Tegishli savdo/fiskal chekni", "Stol raqamini", "Taom nomini", "Patnisni", "To'lov tasdig'i va savdo chekining vazifasi farqlanadi.")
choice("Umumiy choynakni ikki hisobga qanday bo'lasiz?", "Mehmonlar bilan kim to'lashi yoki bo'linishini kelishaman", "Har biriga to'liq narx yozaman", "O'zim xohlaganiga qo'shaman", "Ikkalasidan yashiraman", "Umumiy bandlar rozilik bilan taqsimlanadi.")
choice("Mashq to'lovida nima ishlatiladi?", "Qog'oz pul va karta maketi, o'quv cheki", "Haqiqiy bank kartasidan yechish", "Talabaning PIN kodi", "Begona mijoz hisobi", "O'quv mashqi haqiqiy to'lov yaratmaydi.")
