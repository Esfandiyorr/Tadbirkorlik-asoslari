# -*- coding: utf-8 -*-
"""R4 · Xorijiy mehmon bilan muloqot — «Restoran xodimlari malakasini oshirish» (RS 24), 4-mavzu.
Dastur: 1 soat nazariya + 1 soat amaliyot. Til tanlovini so'rash, sodda va sekin gapirish, ismni hurmat bilan talaffuz
qilish, ikki tilli menyudan foydalanish. Madaniy yoki diniy ehtiyojni taxmin qilmasdan aniqlashtirish va buyurtmani qayta
tasdiqlash. Amaliy mashq: oddiy ingliz tilida ikki dialog — birida taom, porsiya va narxni izohlaydi; ikkinchisida parhez
so'rovini yozib oladi va oshxona bilan tekshirishini tushuntiradi. Natija dalili: mehmon tilni, buyurtma mazmunini va
keyingi qadamni tushunganini tasdiqlaydi.
Dasturdagi ishchi iboralar: Which language would you prefer? · Do you have any food allergies? · Let me check the
ingredients with our kitchen. · May I confirm your order? · Would you like one bill or separate bills?
Inglizcha iboralar <b>qalin</b>, yonida o'zbekcha ma'nosi. Narxlar — o'quv misoli.
Ishlatish:
  python3 _reyting-manba/restoran_yigish.py
"""
exec(open(MATN_DIR + "restoran_davom.py", encoding="utf-8").read())


def en(ibora, tarjima):
    """Inglizcha ibora va o'zbekcha ma'nosi"""
    return "<b>" + ibora + "</b> — " + tarjima


# ============================ 1. MUQOVA ============================
lesson_cover(4, "XORIJIY MEHMON BILAN MULOQOT",
      "<b>Til tanlovini so'rash</b> · sodda va sekin gapirish · ismni hurmat bilan talaffuz qilish · <b>ikki tilli menyu</b> · "
      "taom, porsiya va narxni izohlash · madaniy va diniy ehtiyojni <b>taxmin qilmasdan</b> aniqlashtirish · parhez so'rovi · "
      "<b>buyurtmani qayta tasdiqlash</b> · xizmat ingliz tilidagi ishchi iboralar.",
      "1 soat nazariya · 1 soat amaliyot", 21, 15)

# ============================ 2. MAQSAD ============================
slide("Maqsad va natijalar", "Maqsad va natijalar",
 kicker("Mavzuning maqsadi") +
 h2("Mashg'ulot yakunida tinglovchi " + G("nima qila oladi?")) +
 defn("Maqsad: tinglovchi xorijiy mehmon bilan <b>sodda ingliz tilida</b> xavfsiz va tushunarli muloqot qiladi: tilni aniqlaydi, taomni "
      "tushuntiradi, ehtiyojni <b>taxmin qilmasdan so'raydi</b> va buyurtmani qayta tasdiqlaydi. Mukammal grammatika emas — "
      "<b>mehmon to'g'ri tushungani</b> muhim.") +
 grid(3,
  card("green", "🌍", "Tilni aniqlaydi", "Mehmon qaysi tilda gaplashishni xohlashini so'raydi — tashqi ko'rinishga qarab taxmin qilmaydi."),
  card("blue", "🗣", "Sodda gapiradi", "Qisqa gaplar, sekin va aniq talaffuz, idiomasiz. Tushunilganini tekshiradi."),
  card("violet", "📖", "Menyuni tushuntiradi", "Ikki tilli menyudan foydalanib, taom tarkibi, porsiyasi va narxini izohlaydi."),
  card("orange", "🤝", "Ehtiyojni so'raydi", "Parhez, madaniy yoki diniy ehtiyojni neytral savol bilan aniqlashtiradi va yozib oladi."),
  card("pink", "👨‍🍳", "Oshxona bilan tekshiradi", "Bilmagan narsasini taxmin qilmaydi: «Let me check with our kitchen»."),
  card("cyan", "✅", "Tasdiqlaydi", "Buyurtmani takrorlaydi va mehmon keyingi qadamni tushunganiga ishonch hosil qiladi.")))

# ============================ 3. REJA ============================
slide("Reja va tushunchalar", "Reja va tushunchalar",
 kicker("Mashg'ulot rejasi") +
 h2("Bugungi " + G("5 ta blok")) +
 '<div class="grid g5">' +
 card("green", "1️⃣", "Til va salom", "Til tanlovi, kutib olish, ism va murojaat.") +
 card("blue", "2️⃣", "Sodda nutq", "7 qoida: qisqa, sekin, aniq, tekshirib.") +
 card("violet", "3️⃣", "Menyu", "Taomni tushuntirish, porsiya va narx.") +
 card("orange", "4️⃣", "Ehtiyoj", "Madaniy, diniy va parhez so'rovlari.") +
 card("pink", "5️⃣", "Tasdiq va amaliyot", "Buyurtmani tasdiqlash, hisob, ikki dialog.") +
 '</div>' +
 h3("🔑 Tayanch tushunchalar va so'zlar") +
 pills([("til tanlovi", 1), ("sodda nutq", 1), ("ikki tilli menyu", 1), ("ingredients — tarkib", 1), ("portion — porsiya", 0),
        ("spicy — achchiq", 0), ("allergy — allergiya", 1), ("dietary requirements — parhez talablari", 1), ("halal", 0),
        ("vegetarian", 0), ("to confirm — tasdiqlash", 1), ("bill — hisob", 1), ("separate — alohida", 0), ("receipt — chek", 0)]))

# ============================ 4. NIMASI BOSHQACHA ============================
slide("Xorijiy mehmon: nimasi boshqacha?", "Xorijiy mehmon: nimasi boshqacha?",
 kicker("1-blok · Kontekst") +
 h2("Mehmon uchun bu yerda " + G("hamma narsa yangi")) +
 defn("Xorijiy mehmon tilni bilmaydi, taomlarni tanimaydi, narx va odatlarga ko'nikmagan. U sizga <b>ko'proq ishonishga majbur</b>: "
      "nima yeyishini, qancha to'lashini va nima bo'layotganini siz orqali biladi. Shuning uchun vazifa ikkita: <b>tushunarli</b> va <b>xavfsiz</b>.") +
 grid(3,
  card("blue", "🗣", "Til to'sig'i", "Mehmon savolini to'liq bera olmaydi yoki javobingizni yarim tushunadi. Tushunmagan mehmon ko'pincha <b>«yes» deb bosh irg'aydi</b>."),
  card("orange", "🍲", "Notanish taomlar", "«Norin», «hasip», «qazi» — mehmonga hech narsa demaydi. Tarkibni bilmasdan buyurtma berish — allergiya va diniy cheklov uchun <b>xavf</b>."),
  card("violet", "💵", "Narx va odatlar", "So'mdagi narx, xizmat haqi, choychaqa, non va choy pullikmi — mehmon bularni <b>oldindan</b> bilishni xohlaydi.")) +
 table(["Mehmon nimadan xavotirda", "Sizning javobingiz"], [
  ["«Meni tushunisharmikan?»", "Tilni so'raysiz, sekin va sodda gapirasiz"],
  ["«Bu taomda nima bor?»", "Tarkibni tushuntirasiz, bilmasangiz — oshxonadan so'raysiz"],
  ["«Qancha to'layman?»", "Narxni menyuda ko'rsatasiz, qo'shimcha to'lovlarni oldindan aytasiz"],
  ["«Menga mumkin bo'lmagan narsa tushib qolmasmikan?»", "Parhez va allergiyani so'rab, yozib olasiz va tasdiqlaysiz"],
  ["«Buyurtmam to'g'ri tushunildimi?»", "Buyurtmani ovoz chiqarib qayta tasdiqlaysiz"]]) +
 quote("📌 Xorijiy mehmon restoran bilan birga <b>mamlakat haqida</b> ham taassurot olib ketadi. Siz — uning uchun O'zbekiston mehmondo'stligining yuzi."))

# ============================ 5. TIL TANLOVI ============================
slide("Til tanlovini so'rash", "Til tanlovini so'rash",
 kicker("1.2 · Birinchi qadam") +
 h2("Taxmin qilmang — " + G("so'rang")) +
 defn("Mehmonning tashqi ko'rinishiga qarab til tanlash — xato: yevropacha ko'rinishli mehmon rus tilini bilmasligi, osiyolik mehmon esa "
      "ingliz tilida erkin gapirishi mumkin. To'g'ri yo'l — salomlashib, <b>tilni so'rash</b>.") +
 grid(2,
  card_ul("green", "👋", "Kutib olish iboralari", [
   en("Good morning / afternoon / evening!", "Xayrli tong / kun / kech!"),
   en("Welcome to our restaurant.", "Restoranimizga xush kelibsiz."),
   en("Which language would you prefer?", "Qaysi tilni afzal ko'rasiz?"),
   en("English, Russian or Uzbek?", "Ingliz, rus yoki o'zbek tilimi?"),
   en("Do you have a reservation?", "Stol band qilganmisiz?"),
   en("A table for two?", "Ikki kishilik stolmi?"),
   en("This way, please.", "Marhamat, bu yoqqa.")], cls="clean"),
  card_ul("blue", "🧭", "Qoidalar", [
   "Avval salom, keyin til haqidagi savol — 1-mavzudagi 30 soniya qoidasi o'zgarmaydi",
   "Mehmon tanlagan tilda davom eting; o'rtada boshqa tilga o'tib ketmang",
   "Tilni yaxshi bilmasangiz — yashirmang: <b>«My English is simple, but I will help you»</b>",
   "Kerak bo'lsa hamkasbni chaqiring: <b>«One moment, please. I will ask my colleague»</b>",
   "Mehmon tilingizni tuzatsa — rahmat ayting, xijolat bo'lmang"], cls="clean")) +
 quote("🙂 Tabassum va ochiq qo'l ishorasi barcha tillarda bir xil tushuniladi. So'z yetmasa — <b>menyuda ko'rsating</b>."))

# ============================ 6. SODDA NUTQ ============================
slide("Sodda va sekin gapirish", "Sodda va sekin gapirish",
 kicker("2-blok · Sodda nutq") +
 h2("Sodda nutqning " + G("7 qoidasi")) +
 grid(2,
  card_ul("green", "✅", "Shunday gapiring", [
   "<b>Qisqa gap:</b> bitta gapda bitta fikr",
   "<b>Sekin va aniq</b> — lekin baland emas: mehmon kar emas",
   "<b>Oddiy so'zlar:</b> idioma, sleng va qisqartmasiz",
   "<b>Tanlovli savol:</b> «Tea or coffee?» — «What would you like to drink?» dan osonroq",
   "<b>Raqamni ko'rsating:</b> narx va vaqtni menyuda yoki qog'ozda ko'rsating",
   "<b>Ko'rsatib gapiring:</b> menyu, surat, qo'l ishorasi",
   "<b>Tekshiring:</b> «Is that OK?» — va javobni kuting"], cls="clean"),
  card_ul("red", "⛔", "Bunday qilmang", [
   "Uzun, murakkab gap: «If you'd like, I could possibly suggest…»",
   "Tushunmagan mehmonga <b>balandroq</b> takrorlash",
   "O'sha gapni o'sha so'zlar bilan uch marta aytish",
   "Mehmonning gapini tugatmasdan «Yes, yes» deyish",
   "Hamkasb bilan mehmon oldida uning tushunmaydigan tilida kulishib gaplashish",
   "Tushunmay turib bosh irg'ash"], cls="cross")) +
 table(["⛔ Murakkab", "✅ Sodda"], [
  ["«Our chef's signature dish is a slow-cooked lamb shank…»", "<b>«This is lamb. It is cooked slowly. It is very soft.»</b>"],
  ["«It'll take a while, we're slammed tonight.»", "<b>«It will take 25 minutes. Is that OK?»</b>"],
  ["«Would you care for anything to drink at all?»", "<b>«Would you like water, tea or juice?»</b>"],
  ["«That's not on, I'm afraid.»", "<b>«Sorry, we do not have this dish today.»</b>"]]) +
 quote("🔁 Mehmon tushunmadimi? <b>Boshqa, soddaroq so'z</b> bilan ayting va ko'rsating. Balandroq aytish yordam bermaydi."))

# ============================ 7. ISM VA MUROJAAT ============================
slide("Ism va murojaat", "Ism va murojaat",
 kicker("2.2 · Hurmat") +
 h2("Ismni " + G("to'g'ri talaffuz qilish") + " — hurmat belgisi") +
 grid(2,
  card_ul("green", "🙋", "Iboralar", [
   en("May I have your name, please?", "Ismingizni bilsam maylimi?"),
   en("How do you pronounce your name?", "Ismingiz qanday talaffuz qilinadi?"),
   en("Could you spell it, please?", "Harflab aytib bera olasizmi?"),
   en("Thank you, Mr Müller.", "Rahmat, janob Myuller."),
   en("Sir / Madam", "Janob / Xonim — ism noma'lum bo'lganda"),
   en("Sorry, did I say it correctly?", "Kechirasiz, to'g'ri aytdimmi?")], cls="clean"),
  card_ul("blue", "🧭", "Qoidalar", [
   "Ismni noto'g'ri aytgandan ko'ra — <b>so'rash</b> yaxshi: bu uyat emas, hurmat",
   "Bron paytida ismni <b>harflab</b> yozib oling va o'qilishini qavsda belgilang",
   "Murojaat: <b>Mr / Ms + familiya</b>. Ism bilan faqat mehmon o'zi taklif qilsa",
   "Ismni qisqartirmang, laqab qo'ymang, hazil qilmang",
   "Bir marta to'g'ri eshitgach — xizmat davomida shu ism bilan murojaat qiling"], cls="clean")) +
 grid(3,
  card("orange", "🤝", "Salomlashish", "Qo'l berishni <b>mehmon boshlaydi</b>. Ba'zi madaniyatlarda bosh irg'ash yoki qo'lni ko'ksiga qo'yish yetarli — mehmonga ergashing."),
  card("violet", "📏", "Masofa", "Turli madaniyatlarda qulay masofa har xil. Mehmon orqaga chekinsa — yaqinlashmang. Yelkaga qo'l tekkizilmaydi."),
  card("pink", "👀", "Ko'z bilan aloqa", "Do'stona, lekin tikilmasdan. Gaplashayotganda mehmonga qarang — menyuga yoki bloknotga emas."), top=14))

# ============================ 8. IKKI TILLI MENYU ============================
slide("Ikki tilli menyu bilan ishlash", "Ikki tilli menyu bilan ishlash",
 kicker("3-blok · Menyu") +
 h2("Taom nomini tarjima qilmang — " + G("tushuntiring")) +
 defn("Xorijiy turistlarga xizmat ko'rsatadigan korxonada menyu <b>davlat tilida va chet tilida</b> bo'lishi talab etiladi. Lekin menyu "
      "sizning o'rningizni bosmaydi: «Lagman» so'zi inglizcha harflarda ham mehmonga hech narsa demaydi. Uni <b>to'rt savol</b> bo'yicha tushuntiring.") +
 '<div class="grid g4" style="margin-top:16px">' +
 card("green", "🥩", "1. Nimadan?", "Asosiy mahsulot: <b>lamb, beef, chicken, rice, noodles, vegetables</b>.") +
 card("blue", "🔥", "2. Qanday pishgan?", "<b>Grilled, baked, steamed, fried, boiled</b> — qovurilgan, yopilgan, bug'da…") +
 card("violet", "🥗", "3. Nima bilan?", "<b>Served with</b> salad, bread, sauce — garnir va qo'shimchalar.") +
 card("orange", "🌶", "4. Qanday ta'm?", "<b>Spicy / not spicy, hot / cold, sweet, sour</b>; porsiya kattaligi.") +
 '</div>' +
 table(["Taom", "Sodda inglizcha tushuntirish"], [
  ["🍚 Osh (palov)", "<b>Rice cooked with lamb, carrots and onions.</b> Our national dish."],
  ["🥟 Somsa", "<b>Baked pastry with minced meat and onions.</b>"],
  ["🍜 Lag'mon", "<b>Hand-made noodles with beef and vegetables.</b> A little spicy."],
  ["🥟 Manti", "<b>Steamed dumplings with meat and onions.</b> Served with yoghurt."],
  ["🍢 Shashlik", "<b>Grilled meat on skewers.</b> Lamb, beef or chicken."],
  ["🍅 Achchiq-chuchuk", "<b>Fresh tomato and onion salad.</b> No oil."],
  ["🫓 Non", "<b>Traditional round bread, baked in a clay oven.</b>"]]) +
 quote("👉 Menyuni mehmon tomonga burib, taomni <b>barmoq bilan emas — ochiq kaft yoki ruchka uchi bilan</b> ko'rsating: «This one.»"))

# ============================ 9. PORSIYA VA NARX ============================
slide("Taom, porsiya va narxni izohlash", "Taom, porsiya va narxni izohlash",
 kicker("3.2 · Aniqlik") +
 h2("Mehmon " + G("nima, qancha va necha pul") + " ekanini bilishi kerak") +
 grid(3,
  card_ul("green", "🍽️", "Taom", [
   en("This dish is…", "Bu taom…"),
   en("It is made with…", "U …dan tayyorlangan"),
   en("It is not spicy.", "Achchiq emas."),
   en("It contains nuts / milk.", "Tarkibida yong'oq / sut bor."),
   en("I recommend…", "Men … ni tavsiya qilaman")], cls="clean"),
  card_ul("blue", "⚖️", "Porsiya", [
   en("The portion is for one person.", "Porsiya bir kishilik."),
   en("It is enough for two.", "Ikki kishiga yetadi."),
   en("It is about 300 grams.", "Taxminan 300 gramm."),
   en("A small or a large portion?", "Kichik yoki katta porsiya?"),
   en("Would you like to share?", "Bo'lishib yeysizmi?")], cls="clean"),
  card_ul("orange", "💵", "Narx", [
   en("The price is 65,000 soums.", "Narxi 65 000 so'm."),
   en("The price is per person.", "Narx bir kishi uchun."),
   en("Bread and tea are not included.", "Non va choy narxga kirmaydi."),
   en("Service is included.", "Xizmat haqi kiritilgan."),
   en("We accept cards.", "Karta qabul qilamiz.")], cls="clean")) +
 grid(2,
  card("red", "🔢", "Raqamlarda adashmang", "<b>Fifteen (15)</b> va <b>fifty (50)</b>, <b>sixteen</b> va <b>sixty</b> — eshitilishi o'xshash. Narxni aytish bilan birga <b>menyuda ko'rsating</b> yoki yozib bering. Ming — <b>thousand</b>: 65 000 — «sixty-five thousand»."),
  card("violet", "🧾", "Kutilmagan to'lov bo'lmasin", "Xizmat haqi, non, suv, sous alohida hisoblansa — buni <b>buyurtmadan oldin</b> ayting. Hisob kelganda bilgan mehmon o'zini aldangandek his qiladi."), top=14))

# ============================ 10. DIALOG 1 ============================
slide("1-dialog: taom, porsiya va narx", "1-dialog: taom, porsiya va narx",
 kicker("3.3 · Namunaviy suhbat") +
 h2("1-dialog: " + G("«What is plov?»")) +
 grid(2,
  dialog("blue", "💬", "Suhbat", [
   ("O", "<b>Good evening! Welcome. Which language would you prefer?</b>"),
   ("X", "<b>English, please.</b>"),
   ("O", "<b>Of course. Here is the menu in English.</b>"),
   ("X", "<b>What is plov?</b>"),
   ("O", "<b>It is rice cooked with lamb, carrots and onions. It is not spicy.</b>"),
   ("X", "<b>How big is the portion?</b>"),
   ("O", "<b>It is about 350 grams. It is enough for one person.</b>"),
   ("X", "<b>And the price?</b>"),
   ("O", "<b>Sixty-five thousand soums. Here, on the menu. Bread and tea are not included.</b>"),
   ("X", "<b>OK. One plov and green tea, please.</b>"),
   ("O", "<b>May I confirm your order? One plov and one green tea. It will take about ten minutes.</b>"),
   ("X", "<b>Perfect, thank you.</b>")]),
  card_ul("green", "🔎", "Bu suhbatda nima to'g'ri qilindi", [
   "Til <b>so'raldi</b>, taxmin qilinmadi",
   "Taom to'rt savol bo'yicha tushuntirildi: nimadan, qanday, ta'mi",
   "Porsiya <b>gramm va kishi soni</b> bilan aytildi",
   "Narx aytildi <b>va menyuda ko'rsatildi</b>",
   "Narxga kirmaydigan narsalar oldindan aytildi",
   "Buyurtma <b>qayta tasdiqlandi</b>",
   "Keyingi qadam — kutish vaqti — aytildi"])) +
 quote("📝 <b>Tarjima:</b> palov — sabzi, piyoz va qo'y go'shti bilan pishirilgan guruch, achchiq emas; porsiya taxminan 350 g, bir kishiga yetadi; "
       "narxi 65 000 so'm, non va choy alohida; buyurtma: bitta palov, bitta ko'k choy; taxminan 10 daqiqa."))

# ============================ 11. MADANIY VA DINIY EHTIYOJ ============================
slide("Madaniy va diniy ehtiyoj", "Madaniy va diniy ehtiyoj",
 kicker("4-blok · Ehtiyoj") +
 h2("Ehtiyojni " + G("taxmin qilmang — aniqlashtiring")) +
 defn("Mehmonning millati, kiyimi yoki ismiga qarab «u buni yemaydi» yoki «unga buni taklif qilsa bo'ladi» deb qaror qilish — <b>stereotip</b>. "
      "Bir xil mamlakatdan kelgan ikki mehmonning ehtiyoji butunlay boshqa bo'lishi mumkin. To'g'ri yo'l: <b>hammaga bir xil, neytral savol</b>.") +
 grid(2,
  card_ul("green", "✅", "Neytral savollar", [
   en("Do you have any dietary requirements?", "Ovqatlanishda biror talabingiz bormi?"),
   en("Is there anything you do not eat?", "Yemaydigan narsangiz bormi?"),
   en("Do you have any food allergies?", "Biror ovqatga allergiyangiz bormi?"),
   en("Would you like me to explain the ingredients?", "Tarkibini tushuntirib beraymi?")], cls="clean"),
  card_ul("red", "⛔", "Bunday so'ralmaydi", [
   "«Siz musulmonmisiz?», «Qaysi dindansiz?» — shaxsiy savol",
   "«Sizlar buni yemaysizlar-ku» — taxmin va umumlashtirish",
   "«Nega go'sht yemaysiz?» — sabab so'ralmaydi",
   "Mehmon rad etgan narsani qayta-qayta taklif qilish",
   "So'rovga kulish yoki hamkasbga ko'z qisish"], cls="cross")) +
 table(["Mehmon aytishi mumkin", "Ma'nosi", "Sizning harakatingiz"], [
  ["<b>I am vegetarian.</b>", "Go'sht va baliq yemaydi", "Go'shtsiz taomlarni ko'rsating; sho'rva asosi va yog'ni oshxonadan aniqlang"],
  ["<b>I am vegan.</b>", "Hayvon mahsulotlarini umuman yemaydi (sut, tuxum, asal ham)", "Har taom tarkibini oshxona bilan tekshiring"],
  ["<b>Is it halal?</b>", "Taom halol qoidalariga mosmi", "Faqat aniq bilganingizni ayting; bilmasangiz — mas'uldan so'rang"],
  ["<b>No pork / no beef, please.</b>", "Cho'chqa / mol go'shti yemaydi", "Tarkibni, jumladan yog' va kolbasa mahsulotlarini tekshiring"],
  ["<b>No alcohol, please.</b>", "Spirtli ichimlik ichmaydi", "Sous va desert tarkibini ham tekshiring; alkogolsiz ichimlik taklif qiling"],
  ["<b>I am fasting.</b>", "Ro'za tutyapti", "Qachon ovqatlanishini so'rang, taomni o'sha vaqtga tayyorlating"]]) +
 quote("⚖️ <b>«Halol»</b>, <b>«vegan»</b>, <b>«glutensiz»</b> — bu va'da. Uni faqat <b>oshxona va mas'ul xodim tasdiqlagandan keyin</b> aytish mumkin."))

# ============================ 12. PARHEZ SO'ROVI ============================
slide("Parhez so'rovini yozib olish", "Parhez so'rovini yozib olish",
 kicker("4.2 · Parhez va allergiya") +
 h2("Eshitdim — yozdim — " + G("oshxonadan tekshirdim")) +
 defn("Parhez so'rovi ikki xil bo'ladi: <b>xohish</b> («piyozsiz bo'lsin») va <b>salomatlik talabi</b> (allergiya, intolerans). Ikkinchisida xato "
      "mehmon sog'lig'iga xavf soladi. Qaysi biri ekanini aniqlang va har ikkalasini ham <b>yozib oling</b>.") +
 '<div class="grid g4" style="margin-top:16px">' +
 card("blue", "👂", "1. Tinglang", "Mehmonni bo'lmang. Tushunmasangiz: <b>«Could you repeat that, please?»</b>") +
 card("green", "❓", "2. Aniqlashtiring", "<b>«Is it an allergy?»</b> — bu allergiyami yoki shunchaki xohishmi?") +
 card("orange", "📝", "3. Yozing", "So'rovni buyurtmaga <b>mehmon so'zlari bilan</b>, o'rin raqami bilan yozing.") +
 card("red", "👨‍🍳", "4. Tekshiring", "<b>«Let me check the ingredients with our kitchen.»</b> Javobni mehmonga qaytaring.") +
 '</div>' +
 grid(2,
  card_ul("green", "🗣", "Kerakli iboralar", [
   en("Do you have any food allergies?", "Ovqatga allergiyangiz bormi?"),
   en("Is it an allergy or a preference?", "Bu allergiyami yoki xohishmi?"),
   en("Let me write it down.", "Yozib olay."),
   en("Let me check the ingredients with our kitchen.", "Tarkibni oshxonamizdan tekshirib ko'ray."),
   en("I will be back in two minutes.", "Ikki daqiqada qaytaman."),
   en("The kitchen has checked the ingredients and preparation.", "Oshxona tarkib va tayyorlash jarayonini tekshirdi. Aniq natijani tushuntiring; umumiy xavfsizlik va'dasi bermang."),
   en("I am sorry, this dish contains nuts. May I suggest…", "Afsuski, bu taomda yong'oq bor. … ni taklif qilsam maylimi?")], cls="clean"),
  card_ul("red", "🚫", "Hech qachon", [
   "<b>«I think it's OK»</b> — «menimcha, bo'ladi» degan javob yo'q",
   "Tushunmay turib <b>«Yes»</b> deyish",
   "Tarjimon ilovasiga to'liq ishonib, allergiya haqida xulosa qilish",
   "So'rovni yodda saqlab, yozmaslik",
   "Oshxona javobisiz taomni uzatish"], cls="cross"), top=14) +
 quote("➡️ Allergenlar, tarkib jadvali va «ishonchli javob bo'lmasa — uzatmaslik» qoidasi — <b>5-mavzuda</b> batafsil."))

# ============================ 13. DIALOG 2 ============================
slide("2-dialog: parhez so'rovi", "2-dialog: parhez so'rovi",
 kicker("4.3 · Namunaviy suhbat") +
 h2("2-dialog: " + G("«I am allergic to nuts»")) +
 grid(2,
  dialog("orange", "💬", "Suhbat", [
   ("O", "<b>Are you ready to order?</b>"),
   ("X", "<b>Yes. But I am allergic to nuts.</b>"),
   ("O", "<b>Thank you for telling me. Let me write it down: nut allergy.</b>"),
   ("X", "<b>Is the chicken salad OK for me?</b>"),
   ("O", "<b>I am not sure. Let me check the ingredients with our kitchen. I will be back in two minutes.</b>"),
   ("X", "<b>Thank you.</b>"),
   ("O", "<b>Thank you for waiting. The salad contains walnuts. The chef has checked the recipe and separate preparation for a fresh portion.</b>"),
   ("X", "<b>Great. I will have that.</b>"),
   ("O", "<b>May I confirm? One chicken salad, no nuts — nut allergy. Is that correct?</b>"),
   ("X", "<b>Yes, correct.</b>")]),
  card_ul("green", "🔎", "Bu suhbatda nima to'g'ri qilindi", [
   "Mehmonga <b>rahmat aytildi</b> — allergiya haqida aytish oson emas",
   "So'rov darhol <b>yozib olindi</b>",
   "Ofitsiant <b>taxmin qilmadi</b>: «I am not sure»",
   "Qachon qaytishi aytildi — mehmon kutishni biladi",
   "Oshxona javobi <b>aniq</b> yetkazildi: nima bor va qanday yechim",
   "Buyurtma allergiya belgisi bilan <b>qayta tasdiqlandi</b>"])) +
 quote("📝 <b>O'quv sharti:</b> oshpaz retsept, sous, bezak va alohida tayyorlash jarayonini tekshirgan bo'lsagina bu javob ishlatiladi. "
       "Faqat toza idishning o'zi yetarli emas. O'zaro kontakt nazorati tasdiqlanmasa, taom uzatilmaydi; muqobil ham tekshiriladi."))

# ============================ 14. QAYTA TASDIQLASH ============================
slide("Buyurtmani qayta tasdiqlash", "Buyurtmani qayta tasdiqlash",
 kicker("5-blok · Tasdiq") +
 h2(G("«May I confirm your order?»") + " — eng muhim ibora") +
 defn("Til to'sig'i bor joyda xato ehtimoli yuqori. Uni ushlaydigan yagona ishonchli usul — buyurtmani <b>ovoz chiqarib takrorlash</b> va mehmonning "
      "<b>«Yes, correct»</b> deyishini kutish. Bu 30 soniya vaqt oladi va noto'g'ri taom, kechikish hamda norozilikdan qutqaradi.") +
 '<div class="grid g4" style="margin-top:16px">' +
 card("green", "🍽️", "1. Taomlar", "Har bir taom nomi va <b>miqdori</b>: «Two plov, one salad».") +
 card("blue", "✏️", "2. Maxsus so'rov", "«No onions», «not spicy», <b>«nut allergy»</b> — albatta takrorlanadi.") +
 card("orange", "🥤", "3. Ichimliklar", "Turi, issiq-sovuqligi, gazli-gazsizligi: «Still water, no ice».") +
 card("violet", "⏱", "4. Keyingi qadam", "<b>«It will take about 20 minutes.»</b> Mehmon nima bo'lishini biladi.") +
 '</div>' +
 grid(2,
  card_ul("green", "🗣", "Tasdiqlash iboralari", [
   en("May I confirm your order?", "Buyurtmangizni tasdiqlasam maylimi?"),
   en("So, that is… Is that correct?", "Demak, … To'g'rimi?"),
   en("Anything else?", "Yana biror narsa?"),
   en("Your food will be ready in about 20 minutes.", "Taomingiz taxminan 20 daqiqada tayyor bo'ladi."),
   en("I will bring the drinks first.", "Avval ichimliklarni olib kelaman.")], cls="clean"),
  card_ul("blue", "📄", "Natija dalili — mehmon uch narsani tushundi", [
   "<b>Til:</b> qaysi tilda xizmat ko'rsatilayotganini biladi va unga qulay",
   "<b>Buyurtma mazmuni:</b> nima, qancha va qanday shartlar bilan kelishini tasdiqladi",
   "<b>Keyingi qadam:</b> qancha kutishini yoki oshxonadan javob kutilayotganini biladi",
   "Uchalasi ham bo'lsa — muloqot muvaffaqiyatli"], cls="clean"), top=14))

# ============================ 15. TUSHUNMASANGIZ ============================
slide("Tushunmasangiz nima qilasiz?", "Tushunmasangiz nima qilasiz?",
 kicker("5.2 · Qiyin vaziyat") +
 h2("Tushunmaslik — ayb emas. " + G("Tushungandek ko'rsatish") + " — xato") +
 grid(2,
  card_ul("green", "🧰", "Qutqaruvchi iboralar", [
   en("Sorry, I did not understand.", "Kechirasiz, tushunmadim."),
   en("Could you repeat that, please?", "Qaytarib yubora olasizmi?"),
   en("Could you speak more slowly, please?", "Sekinroq gapira olasizmi?"),
   en("Could you show me on the menu?", "Menyuda ko'rsata olasizmi?"),
   en("Could you write it down, please?", "Yozib bera olasizmi?"),
   en("One moment, please. I will ask my colleague.", "Bir daqiqa. Hamkasbimdan so'rayman.")], cls="clean"),
  card_ul("blue", "🪜", "Qadamma-qadam", [
   "<b>1.</b> Qaytarishni so'rang — xotirjam, tabassum bilan",
   "<b>2.</b> Menyuda yoki suratda ko'rsatishni so'rang",
   "<b>3.</b> Yozib berishni so'rang — yozuvni o'qish osonroq",
   "<b>4.</b> Tilni yaxshiroq biladigan hamkasbni chaqiring",
   "<b>5.</b> Tarjimon ilovasi — faqat mehmon roziligi bilan va yordamchi sifatida",
   "<b>6.</b> Baribir aniq bo'lmasa — mas'ul xodimga yetkazing"], cls="clean")) +
 grid(3,
  card("red", "📱", "Tarjimon ilovasi", "Oddiy savollar uchun yordam beradi. Lekin <b>allergiya, tarkib va narx</b> masalasida xato tarjima xavfli — natijani albatta mehmon bilan qayta tasdiqlang."),
  card("orange", "😤", "Mehmon asabiylashsa", "Ovozni ko'tarmang, tezlashmang. <b>«I am sorry. I want to help you.»</b> Hamkasb yoki administratorni chaqiring."),
  card("violet", "🤐", "Mehmon haqida gaplashmang", "Mehmon tushunmaydi deb o'ylab, uning oldida u haqida gapirish — qo'pol xato. Ko'p mehmon siz o'ylagandan ko'proq tushunadi."), top=14))

# ============================ 16. HISOB VA XAYRLASHUV ============================
slide("Hisob va xayrlashuv", "Hisob va xayrlashuv",
 kicker("5.3 · Yakun") +
 h2(G("«One bill or separate bills?»")) +
 grid(2,
  card_ul("green", "🧾", "Hisob iboralari", [
   en("Would you like the bill?", "Hisobni keltiraymi?"),
   en("Would you like one bill or separate bills?", "Hisob bittami yoki alohidami?"),
   en("Cash or card?", "Naqdmi yoki karta?"),
   en("Here is your bill. The total is 240,000 soums.", "Mana hisobingiz. Jami 240 000 so'm."),
   en("Service is included / not included.", "Xizmat haqi kiritilgan / kiritilmagan."),
   en("Here is your receipt and your change.", "Mana chekingiz va qaytimingiz.")], cls="clean"),
  card_ul("blue", "👋", "Xayrlashuv iboralari", [
   en("Was everything OK?", "Hammasi ma'qul bo'ldimi?"),
   en("Thank you very much.", "Katta rahmat."),
   en("Have a nice evening!", "Kechangiz xayrli o'tsin!"),
   en("Enjoy your stay in Uzbekistan!", "O'zbekistonda vaqtingiz chog' o'tsin!"),
   en("We hope to see you again.", "Sizni yana ko'rishdan umidvormiz."),
   en("Shall I call a taxi for you?", "Sizga taksi chaqiraymi?")], cls="clean")) +
 grid(3,
  card("orange", "💳", "To'lov", "Karta terminali mehmon <b>ko'z oldida</b> ishlatiladi; karta ko'zdan uzoqqa olib ketilmaydi. Chet el valyutasi qabul qilinmasa — buni xotirjam tushuntiring."),
  card("violet", "💵", "Choychaqa", "So'ralsa — halol javob bering: xizmat haqi hisobga kiritilganmi yoki yo'q. Choychaqa <b>so'ralmaydi</b> va unga ishora qilinmaydi."),
  card("pink", "🗺", "Qo'shimcha yordam", "Yo'l, taksi, yaqin bankomat haqidagi savolga yordam bering. Bilmasangiz — administratordan so'rang."), top=14) +
 quote("🧾 Hisobni ajratish va to'lovni rasmiylashtirish tartibi — <b>8-mavzuda</b> batafsil."))

# ============================ 17. ISHCHI IBORALAR ============================
slide("Ishchi iboralar: cho'ntak lug'ati", "Ishchi iboralar: cho'ntak lug'ati",
 kicker("Takrorlash") +
 h2("Yod olinadigan " + G("15 ta ibora")) +
 table(["Vaziyat", "Inglizcha", "O'zbekcha"], [
  ["👋 Kutib olish", "<b>Good evening! Welcome.</b>", "Xayrli kech! Xush kelibsiz."],
  ["🌍 Til", "<b>Which language would you prefer?</b>", "Qaysi tilni afzal ko'rasiz?"],
  ["🪑 Joylashtirish", "<b>This way, please.</b>", "Marhamat, bu yoqqa."],
  ["📖 Menyu", "<b>Here is the menu.</b>", "Mana menyu."],
  ["🥜 Allergiya", "<b>Do you have any food allergies?</b>", "Ovqatga allergiyangiz bormi?"],
  ["📝 Buyurtma", "<b>Are you ready to order?</b>", "Buyurtma berishga tayyormisiz?"],
  ["👨‍🍳 Tekshirish", "<b>Let me check the ingredients with our kitchen.</b>", "Tarkibni oshxonadan tekshirib ko'ray."],
  ["✅ Tasdiqlash", "<b>May I confirm your order?</b>", "Buyurtmangizni tasdiqlasam maylimi?"],
  ["⏱ Vaqt", "<b>It will take about 20 minutes.</b>", "Taxminan 20 daqiqa vaqt oladi."],
  ["🔥 Ogohlantirish", "<b>Careful, the plate is hot.</b>", "Ehtiyot bo'ling, tarelka issiq."],
  ["🍽️ Uzatish", "<b>Enjoy your meal!</b>", "Yoqimli ishtaha!"],
  ["💬 Tekshiruv", "<b>Is everything OK?</b>", "Hammasi joyidami?"],
  ["🙏 Uzr", "<b>I am sorry. I will fix it now.</b>", "Uzr so'rayman. Hozir tuzataman."],
  ["🧾 Hisob", "<b>Would you like one bill or separate bills?</b>", "Hisob bittami yoki alohidami?"],
  ["👋 Xayrlashuv", "<b>Thank you. Have a nice evening!</b>", "Rahmat. Kechangiz xayrli o'tsin!"]]) +
 quote("🗣 Iboralarni <b>ovoz chiqarib</b> mashq qiling: ko'z bilan o'qilgan ibora kerakli paytda tilga kelmaydi."))

# ============================ 18. AMALIY MASHQ ============================
slide("Amaliy mashq", "Amaliy mashq",
 kicker("Amaliyot · 1 soat") +
 h2("Ikki dialog — " + G("oddiy ingliz tilida")) +
 defn("Juftlikda ishlanadi: bir tinglovchi — <b>ofitsiant</b>, ikkinchisi — <b>xorijiy mehmon</b> (faqat ingliz tilida gapiradi), trener yoki uchinchi "
      "tinglovchi — kuzatuvchi. Har dialog 4–5 daqiqa. «Mehmon» vazifa kartochkasini oladi va ataylab bitta gapni tushunmagandek ko'rsatadi.") +
 grid(2,
  card_ul("blue", "1️⃣", "1-dialog · Taom, porsiya, narx", [
   "<b>A kartochka:</b> 350 g osh — 50 000 so'm; non alohida. Narxlar faqat mashq uchun",
   "Ofitsiant tilni aniqlaydi va taomni to'rt savol bo'yicha tushuntiradi",
   "Porsiya kattaligi va narxni aytadi, menyuda ko'rsatadi",
   "Mehmon narxni 5 000 deb tushunadi: menyuda ko'rsatib, tushunilganini qayta tekshiring",
   "Buyurtmani tasdiqlaydi va kutish vaqtini aytadi"], cls="clean"),
  card_ul("orange", "2️⃣", "2-dialog · Parhez so'rovi", [
   "<b>B kartochka:</b> mehmon grek yong'og'iga allergiyasini aytadi va salat so'raydi",
   "Ofitsiant allergiya yoki xohish ekanini aniqlaydi va yozib oladi",
   "«Let me check the ingredients with our kitchen» deydi, qachon qaytishini aytadi",
   "Trener avval «bo'ladi» deydi: retsept, sous va alohida jarayon bo'yicha aniq javob so'rang",
   "Tasdiq bor bo'lsa maxsus belgi bilan qayta tasdiqlang; bo'lmasa taomni uzatmang"], cls="clean")) +
 table(["Kuzatuv mezoni", "Kuzatiladigan harakat", "Ha / Yo'q"], [
  ["<b>Til</b>", "Tilni so'radi; sodda, sekin va qisqa gaplar bilan gapirdi", "☐"],
  ["<b>Tushuntirish</b>", "Taom tarkibi, porsiya va narxni aniq aytdi, menyuda ko'rsatdi", "☐"],
  ["<b>Ehtiyoj</b>", "So'rovni taxmin qilmadi: aniqlashtirdi va yozib oldi", "☐"],
  ["<b>Tekshirish</b>", "Bilmaganini oshxonadan tekshirishini va qachon qaytishini aytdi", "☐"],
  ["<b>Tasdiqlash</b>", "Buyurtmani takrorladi; mehmon «correct» dedi; keyingi qadam aytildi", "☐"]]) +
 quote("📄 <b>Natija dalili:</b> «mehmon» tilni, buyurtma mazmunini va keyingi qadamni tushunganini tasdiqlaydi."))

# ============================ 19. NAMUNAVIY SUHBATLAR ============================
page("Namuna: ikki qisqa suhbat", grid(2,
 dialog("green", "📖", "1. Taom va narx", [
  ("O", "Good evening! Which language would you prefer?"),
  ("X", "English, please. What is plov?"),
  ("O", "Our plov is rice with lamb, carrots and onions. One portion is 350 grams. It costs 50,000 soums. Bread is extra."),
  ("X", "One portion, please."),
  ("O", "Do you have any food allergies or dietary requirements?"),
  ("X", "No, thank you."),
  ("O", "May I confirm: one plov, no bread? It takes about 15 minutes."),
  ("X", "Yes, correct.")], "Tarkib, porsiya va narx shu mashq menyusiga tegishli. Haqiqiy retsept bilan tekshiriladi."),
 dialog("orange", "🥜", "2. Allergen so'rovi", [
  ("X", "I have a walnut allergy. Can I have this salad?"),
  ("O", "A walnut allergy. Thank you for telling me. Let me check the ingredients and preparation with our kitchen."),
  ("Osh", "Maket javob: tarkib va alohida toza jihoz tekshirildi; yogurtli sousda sut bor. Yong'oq qo'shilmaydi."),
  ("O", "The kitchen has checked the recipe and separate preparation. The sauce contains milk. Would you like this salad?"),
  ("X", "Yes. I do not have a milk allergy."),
  ("O", "One salad, walnut allergy noted. I will confirm your plate with the kitchen before serving.")],
  "Maket javobi bo'lmasa yoki sharoit tasdiqlanmasa, taom uzatilmaydi.")))

# ============================ 20. XULOSA ============================
slide("Xulosa", "Xulosa",
 kicker("Yakun") +
 h2("Esda qoladigan " + G("6 ta qoida")) +
 grid(3,
  card("green", "🌍", "Tilni so'rang", "«Which language would you prefer?» — tashqi ko'rinishga qarab taxmin qilinmaydi."),
  card("blue", "🗣", "Sodda va sekin", "Qisqa gap, oddiy so'z, tanlovli savol. Balandroq emas — soddaroq."),
  card("violet", "📖", "Tushuntiring", "Nimadan, qanday pishgan, nima bilan, qanday ta'm; porsiya va narx — menyuda."),
  card("orange", "🤝", "Taxmin qilmang", "Parhez, madaniy va diniy ehtiyoj neytral savol bilan so'raladi."),
  card("pink", "👨‍🍳", "Tekshiring", "«Let me check the ingredients with our kitchen» — «I think» degan javob yo'q."),
  card("cyan", "✅", "Tasdiqlang", "«May I confirm your order?» — va keyingi qadamni ayting.")) +
 '<div class="grid g2" style="margin-top:16px">' +
 card_ul("green", "📚", "Mustahkamlash uchun", [
  "15 ta iborani kartochkaga yozing va har kuni ovoz chiqarib takrorlang",
  "Restoraningiz menyusidan 5 ta taomni to'rt savol bo'yicha inglizcha tushuntirib yozing",
  "Ikkala dialogni hamkasbingiz bilan rollarga bo'lib o'qing"], cls="clean") +
 card("blue", "➡️", "Keyingi mavzu", "<b>5-mavzu. Menyu va allergenlar bilan ishlash:</b> tarkib, porsiya va pishirish usuli; allergiya va intolerans; allergen jadvali; allergenning boshqa taomga o'tish xavfi.") +
 '</div>')

# ============================ 21. TEST ============================
test_slide(15, "Bu — <b>tayyorgarlik mashqi</b>. Keyingi mashg'ulotgacha 15 ta ishchi iborani takrorlang va o'z menyuingizdagi 5 ta taomni inglizcha tushuntirib keling.")

# ============================ TEST SAVOLLARI ============================
# SV — 4 variantli savol (uzunligi teng, to'g'ri javob raqami), SO — ochiq savol (bitta so'z yoki son)
Q = [
 SV("Restoranga xorijiy mehmon kirdi. Qaysi tilda gaplashishni qanday aniqlaysiz?",
    ["Salomlashib, «Which language would you prefer?» deb so'rayman",
     "Tashqi ko'rinishiga qarab, o'zim mos tilni tanlab olaman",
     "Darhol rus tilida gapiraman, chunki uni hamma tushunadi",
     "Mehmon o'zi gapirmaguncha, indamay kutib turaveraman"], 0,
    "Til taxmin qilinmaydi: salomdan keyin mehmonning o'zidan so'raladi."),
 SV("Qaysi javob sodda nutq qoidalariga mos keladi?",
    ["«This is lamb. It is cooked slowly. It is very soft.»",
     "«It's our chef's slow-braised signature lamb shank.»",
     "«Well, basically, it's kind of a lamb thing, you know.»",
     "«The lamb, which is braised, is rather tender, I'd say.»"], 0,
    "Qisqa gaplar, bitta gapda bitta fikr, oddiy so'zlar — idioma va murakkab tuzilmalarsiz."),
 SV("Mehmon aytganingizni tushunmadi. To'g'ri harakat qaysi?",
    ["Soddaroq so'z bilan qayta aytaman va menyuda ko'rsataman",
     "O'sha gapni balandroq ovozda yana bir marta takrorlayman",
     "Tushunmaganiga e'tibor bermay, buyurtmani yozib ketaman",
     "Hamkasbimga o'zbekchada mehmon haqida gapirib beraman"], 0,
    "Balandroq aytish yordam bermaydi. Boshqa, soddaroq so'z tanlanadi va ko'rsatib tushuntiriladi."),
 SV("Mehmon «What is plov?» deb so'radi. Qaysi javob eng tushunarli?",
    ["«Rice cooked with lamb, carrots and onions.»",
     "«Plov is plov. It is a very famous Uzbek food.»",
     "«It is our national pride, everybody loves it.»",
     "«You will see when it comes. It is delicious.»"], 0,
    "Taom nomi tarjima qilinmaydi — tushuntiriladi: nimadan, qanday pishgan, qanday ta'm."),
 SO("Iborani to'ldiring: «Would you like one bill or ____ bills?» <i>(bitta inglizcha so'z)</i>",
    ["separate", "seperate", "separate bills"],
    "«Would you like one bill or separate bills?» — «Hisob bittami yoki alohidami?»"),
 SV("Mehmon «Is this dish halal?» deb so'radi, siz aniq bilmaysiz. Nima deysiz?",
    ["«Let me check with our kitchen. One moment, please.»",
     "«Yes, of course, everything here is always halal.»",
     "«I think it is OK. You can try it and see, madam.»",
     "«I do not know. Please ask somebody else, sorry.»"], 0,
    "«Halol» — va'da. Uni faqat oshxona va mas'ul xodim tasdiqlagandan keyin aytish mumkin."),
 SV("Mehmonning parhez yoki diniy ehtiyojini qanday aniqlash to'g'ri?",
    ["Hammaga bir xil savol: «Do you have any dietary requirements?»",
     "Millati va kiyimiga qarab, nimani yemasligini o'zim taxmin qilaman",
     "To'g'ridan-to'g'ri so'rayman: «What is your religion, please?»",
     "Hech narsa so'ramayman, mehmon o'zi aytmasa — demak, talab yo'q"], 0,
    "Ehtiyoj taxmin qilinmaydi va din haqida so'ralmaydi: hammaga neytral savol beriladi."),
 SV("Buyurtmani qabul qilgach, uni tasdiqlash uchun qaysi ibora ishlatiladi?",
    ["«May I confirm your order?»",
     "«Are you ready to order?»",
     "«Would you like the bill?»",
     "«Do you have a reservation?»"], 0,
    "«May I confirm your order?» — keyin taomlar, miqdor, maxsus so'rov va kutish vaqti takrorlanadi."),
 SO("Iborani to'ldiring: «Do you have any food ____?» — «Ovqatga allergiyangiz bormi?» <i>(bitta inglizcha so'z)</i>",
    ["allergies", "allergy", "alergies", "allergys"],
    "«Do you have any food allergies?» — har bir xorijiy mehmonga beriladigan xavfsizlik savoli."),
 SV("Bron jurnalida mehmonning ismi «Nguyen». Uni qanday talaffuz qilishni bilmaysiz. Nima qilasiz?",
    ["«How do you pronounce your name?» deb so'rayman",
     "Yozilganidek o'qiyman, xato bo'lsa ham mayli",
     "Ismni aytmay, faqat «Hey» deb murojaat qilaman",
     "Qulay bo'lishi uchun ismni qisqartirib aytaman"], 0,
    "Ismni noto'g'ri aytgandan ko'ra so'rash yaxshi — bu hurmat belgisi."),
 SV("Mehmon tez gapirdi va siz tushunmadingiz. Qaysi javob to'g'ri?",
    ["«Sorry. Could you repeat that, please?»",
     "«Yes, yes, OK, no problem, thank you.»",
     "«I do not speak English. Goodbye, sir.»",
     "«Speak Uzbek, please. This is Uzbekistan.»"], 0,
    "Tushunmaslik ayb emas; tushungandek «yes» deyish — xato. Qaytarishni yoki menyuda ko'rsatishni so'rang."),
 SV("Narxni xorijiy mehmonga qanday aytish to'g'ri?",
    ["Aytaman va menyuda ko'rsataman; qo'shimcha to'lovni oldindan aytaman",
     "Faqat og'zaki, tez aytaman; qo'shimcha to'lovni hisobda ko'radi",
     "Narxni aytmayman, chunki u menyuda inglizcha yozib qo'yilgan",
     "Dollarda taxminan aytaman, so'mdagi narxni hisobda ko'radi"], 0,
    "Fifteen va fifty kabi raqamlar oson adashtiriladi: narx ko'rsatiladi, xizmat haqi kabi to'lovlar oldindan aytiladi."),
 SO("Iborani to'ldiring: «Let me check the ingredients with our ____.» <i>(bitta inglizcha so'z — «oshxona»)</i>",
    ["kitchen", "kichen", "kitchin", "chef"],
    "«Let me check the ingredients with our kitchen» — «Tarkibni oshxonamizdan tekshirib ko'ray»."),
 SV("Muloqot muvaffaqiyatli bo'lganini nimadan bilasiz (natija dalili)?",
    ["Mehmon tilni, buyurtma mazmunini va keyingi qadamni tushundi",
     "Mehmon har bir gapimga jilmayib, «yes, yes» deb javob berdi",
     "Men biror marta ham grammatik xato qilmasdan gapira oldim",
     "Suhbat juda qisqa bo'ldi va mehmon hech narsa so'ramadi"], 0,
    "Mukammal grammatika emas — mehmon uch narsani tushungani muhim: til, buyurtma, keyingi qadam."),
 SO("Inglizcha «spicy» so'zi taom haqida gapirilganda o'zbekcha nimani bildiradi? <i>(bitta so'z)</i>",
    ["achchiq", "achiq", "o'tkir", "achchiq taom", "qalampirli"],
    "Spicy — achchiq. «It is not spicy» — «Achchiq emas»."),
]
