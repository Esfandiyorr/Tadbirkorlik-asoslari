# -*- coding: utf-8 -*-
"""R1 · Kasbiy etika va xizmat sikli — «Restoran xodimlari malakasini oshirish» (RS 24), 1-mavzu.
Dastur: 1 soat nazariya + 1 soat amaliyot. Kasbiy ko'rinish, smenaoldi brifingi, xizmat ketma-ketligi va vakolat
chegaralari; mehmonni kutib olish, stolga joylashtirish, xizmat davomida holatni tekshirish va kuzatish.
Amaliy mashq: bron bilan va bronsiz kelgan ikki mehmonni qabul qilish. Natija dalili: kuzatuv varag'i.
Ishlatish:
  python3 _reyting-manba/yangi_mavzu.py _reyting-manba/matn/restoran_1_matn.py restoran-1.html "Kasbiy etika va xizmat sikli" 1 "<tavsif>" mavzu-7.html "Restoran xizmati|Restaurant service"
  python3 _reyting-manba/inject.py
"""
exec(open(MATN_DIR + "restoran_umumiy.py", encoding="utf-8").read())

# ============================ 1. MUQOVA ============================
cover(1, "KASBIY ETIKA VA XIZMAT SIKLI",
      "Ofitsiant — restoranning yuzi · kasbiy odob va tashqi ko'rinish · smenaoldi <b>brifingi</b> · xizmatning <b>10 qadami</b> · "
      "mehmonni <b>kutib olish</b> va stolga joylashtirish · bron bilan va bronsiz kelgan mehmon · xizmat davomida <b>kuzatish</b> · "
      "<b>vakolat chegaralari</b> · xayrlashish va kuzatib qo'yish.",
      "1 soat nazariya · 1 soat amaliyot", 20, 15)

# ============================ 2. MAQSAD ============================
slide("Maqsad va natijalar", "Maqsad va natijalar",
 kicker("Mavzuning maqsadi") +
 h2("Mashg'ulot yakunida tinglovchi " + G("nima qila oladi?")) +
 defn("Maqsad: tinglovchi mehmonni <b>birinchi soniyadan oxirgi xayrlashuvgacha</b> bir xil sifatda kuzatib boradigan <b>xizmat siklini</b> "
      "egallaydi, kasbiy odob va tashqi ko'rinish talablariga rioya qiladi hamda <b>o'z vakolati chegarasini</b> aniq biladi.") +
 grid(3,
  card("green", "👋", "Kutib oladi", "Mehmonni 30 soniya ichida payqaydi, salomlashadi va bron bor-yo'qligini aniqlaydi."),
  card("blue", "🪑", "Joylashtiradi", "Mehmonga mos stolni taklif qiladi, kuzatib boradi, menyuni taqdim etadi."),
  card("violet", "⏱", "Vaqtni kelishadi", "Kutish vaqtini halol aytadi, tanlov beradi va va'dasini o'zi yangilaydi."),
  card("orange", "👀", "Kuzatadi", "Xizmat davomida stol holatini tekshiradi, mehmon signallarini o'qiydi."),
  card("pink", "🧭", "Chegarani biladi", "Nimani o'zi hal qilishini, nimani mas'ul xodimga yetkazishini ajratadi."),
  card("cyan", "🤝", "Yakunlaydi", "Xizmatni minnatdorlik bilan tugatadi, mehmonni kuzatadi, stolni qayta tayyorlaydi.")))

# ============================ 3. REJA ============================
slide("Reja va tushunchalar", "Reja va tushunchalar",
 kicker("Mashg'ulot rejasi") +
 h2("Bugungi " + G("5 ta blok")) +
 '<div class="grid g5">' +
 card("green", "1️⃣", "Kasb va etika", "Ofitsiant roli, mehmondo'stlik, 6 ta etika tamoyili.") +
 card("blue", "2️⃣", "Ko'rinish va muomala", "Forma, gigiyena, tana tili, to'g'ri iboralar.") +
 card("violet", "3️⃣", "Brifing", "Smena oldidan 10–15 daqiqa: bron, stop-list, bo'limlar.") +
 card("orange", "4️⃣", "Xizmat sikli", "10 qadam: kutib olishdan kuzatib qo'yishgacha.") +
 card("pink", "5️⃣", "Vakolat va amaliyot", "Qaror chegarasi, rol o'yini, kuzatuv varag'i.") +
 '</div>' +
 h3("🔑 Tayanch tushunchalar") +
 pills([("mehmon", 1), ("mehmondo'stlik", 1), ("kasbiy etika", 1), ("maxfiylik", 0), ("forma", 0), ("beyj", 0),
        ("brifing", 1), ("stop-list", 1), ("bron", 1), ("kutish ro'yxati", 0), ("xizmat sikli", 1), ("xostes", 0),
        ("2 daqiqa qoidasi", 1), ("mehmon signallari", 0), ("vakolat", 1), ("mas'ulga yetkazish", 0), ("kuzatuv varag'i", 1)]))

# ============================ 4. OFITSIANT — RESTORANNING YUZI ============================
slide("Ofitsiant — restoranning yuzi", "Ofitsiant — restoranning yuzi",
 kicker("1-blok · Kasb") +
 h2("Mehmon ovqat uchun emas, " + G("taassurot uchun") + " keladi") +
 defn("Mehmonning restoran haqidagi fikri uch narsadan yig'iladi: <b>taom, muhit va xizmat</b>. Taomni oshpaz tayyorlaydi, zalni dizayner "
      "bezagan — lekin mehmon ko'radigan, gaplashadigan va ishonadigan odam — <b>ofitsiant</b>. Siz restoran nomidan gapirasiz.") +
 grid(3,
  card("green", "🏠", "«Mijoz» emas — «mehmon»", "Mijoz xarid qiladi va ketadi. <b>Mehmon</b> esa uyingizga kelgan odam: uni kutib olasiz, joy ko'rsatasiz, ko'nglini so'raysiz va kuzatib qo'yasiz."),
  card("orange", "⚡", "Birinchi taassurot", "Mehmon restoran haqidagi dastlabki fikrini <b>birinchi daqiqada</b> — hali menyuni ochmasdan shakllantiradi. Uni keyin o'zgartirish qiyin."),
  card("pink", "🤫", "Norozi mehmon jim ketadi", "Ko'p mehmon shikoyat qilmaydi — shunchaki <b>qaytib kelmaydi</b> va tanishlariga aytadi. Shuning uchun muammoni o'zingiz payqashingiz kerak.")) +
 table(["Mehmon nimani kutadi", "Ofitsiant nima qiladi"], [
  ["<b>E'tibor</b> — meni payqashdimi?", "Kirgan zahoti ko'z bilan salomlashadi, kuttirib qo'ymaydi"],
  ["<b>Aniqlik</b> — buyurtmam to'g'ri keladimi?", "Buyurtmani takrorlab tasdiqlaydi, o'rin raqami bilan yozadi"],
  ["<b>Vaqt</b> — qancha kutaman?", "Kutish vaqtini oldindan va halol aytadi"],
  ["<b>Hurmat</b> — menga qanday qarashyapti?", "«Siz»lab, xotirjam ovozda, ism bilan murojaat qiladi"],
  ["<b>Xavfsizlik</b> — bu taom menga zarar qilmaydimi?", "Toza idish ishlatadi, allergiya so'rovini jiddiy qabul qiladi"]]) +
 quote("📌 <b>Eslab qoling:</b> mehmon nima yeganini unutishi mumkin, lekin restoranda o'zini <b>qanday his qilganini</b> eslab qoladi."))

# ============================ 5. KASBIY ETIKA ============================
slide("Kasbiy etika: 6 tamoyil", "Kasbiy etika: 6 tamoyil",
 kicker("1.2 · Odob") +
 h2("Kasbiy etika — " + G("6 ta tamoyil")) +
 defn("<b>Kasbiy etika</b> — xodimning mehmon, hamkasb va ish beruvchi oldidagi xulq-atvor qoidalari. U yozilgan yo'riqnomadan kengroq: "
      "hech kim ko'rmayotgan paytda ham to'g'ri ish qilishni anglatadi.") +
 grid(3,
  card("green", "🤝", "1. Hurmat", "Har bir mehmonga <b>bir xil</b> munosabat: yoshi, kiyimi, millati, tili yoki buyurtma summasidan qat'i nazar."),
  card("blue", "⚖️", "2. Halollik", "Narx, tarkib va kutish vaqti haqida <b>faqat to'g'ri</b> ma'lumot. Hisobga ortiqcha narsa qo'shilmaydi, qaytim to'liq qaytariladi."),
  card("violet", "🤐", "3. Maxfiylik", "Mehmon kim bilan kelgani, nima haqida gaplashgani, karta ma'lumoti — <b>zaldan tashqariga chiqmaydi</b>. Ruxsatsiz suratga olinmaydi."),
  card("orange", "🛡", "4. Mas'uliyat", "Xato qildingizmi — <b>yashirmang</b>: darhol ayting va tuzating. Kech aytilgan xato ikki baravar qimmatga tushadi."),
  card("pink", "👥", "5. Jamoa", "«Bu mening stolim emas» degan gap yo'q. Hamkasbni mehmon oldida tanqid qilmaysiz, oshxonani ayblamaysiz."),
  card("cyan", "🎭", "6. O'zini tutish", "Shaxsiy kayfiyat xizmat xonasida qoladi. Mehmon bilan <b>bahslashilmaydi</b>, ovoz ko'tarilmaydi, hazil me'yorida.")) +
 quote("⚠️ <b>Halollik chegarasi:</b> mehmonga yoqish uchun ham yolg'on gapirilmaydi. «Ha, bu taomda yong'oq yo'q» deb <b>taxmin bilan</b> javob berish — "
       "etika emas, xavf. Bilmasangiz: «Hozir oshxonadan aniqlab beraman»."))

# ============================ 6. KASBIY KO'RINISH ============================
slide("Kasbiy ko'rinish", "Kasbiy ko'rinish",
 kicker("2-blok · Tashqi ko'rinish") +
 h2("Forma — restoran nomidan " + G("birinchi bo'lib gapiradi")) +
 defn("Mehmon sizni eshitishdan oldin <b>ko'radi</b>. Toza va tartibli ko'rinish ikki narsani bildiradi: restoranda <b>tartib bor</b> "
      "va taom <b>toza qo'llarda</b>. Ko'rinish talablari — moda emas, gigiyena va ishonch masalasi.") +
 grid(2,
  card_ul("green", "✅", "To'g'ri", [
   "Toza, dazmollangan forma va fartuk; tugmalar joyida",
   "Ism yozilgan belgi (beyj) — ko'rinadigan joyda",
   "Yopiq, sirpanmaydigan, toza va qulay poyabzal",
   "Soch yig'ilgan, yuz ochiq; soqol tartibli",
   "Tirnoqlar kalta va toza — lak va yasama tirnoqsiz",
   "Hid deyarli sezilmaydi: atir juda yengil yoki yo'q",
   "Cho'ntakda: ruchka, bloknot, ochqich, toza qo'l salfetkasi"]),
  card_ul("red", "⛔", "Noto'g'ri", [
   "G'ijim, dog'li yoki o'lchami to'g'ri kelmagan forma",
   "Katta uzuk, bilaguzuk, osilib turadigan zirak va zanjir",
   "Kuchli atir, tamaki yoki ter hidi",
   "Ochiq poyabzal, shippak, iflos krossovka",
   "Telefon qo'lda yoki mehmon ko'radigan joyda",
   "Saqich chaynash, zalda ovqat yeyish yoki ichish",
   "Qo'lni cho'ntakka solish, devorga yoki stolga suyanish"], cls="cross")) +
 grid(3,
  card("blue", "🪞", "1 daqiqalik tekshiruv", "Zalga chiqishdan oldin ko'zgu oldida yuqoridan pastga: <b>soch → yuz → forma → qo'l → poyabzal → cho'ntak</b>.", ),
  card("orange", "💍", "Nega taqinchoq mumkin emas?", "Uzuk va bilaguzuk ostida mikroblar to'planadi, tosh yoki zirak taomga tushishi mumkin. Batafsil — 2-mavzuda."),
  card("violet", "🧍", "Qomat ham forma", "Tik turing, qo'llar oldinda yoki orqada erkin. Bukchaygan qomat «charchadim, kelmang» deydi."), top=14))

# ============================ 7. MUOMALA MADANIYATI ============================
slide("Muomala madaniyati", "Muomala madaniyati",
 kicker("2.2 · Muloqot") +
 h2("Avval " + G("tana tili") + ", keyin so'z") +
 defn("Mehmon bilan muloqotning katta qismi so'zsiz kechadi: <b>ko'z bilan aloqa, tabassum, qomat va masofa</b>. So'zlaringiz to'g'ri bo'lsa-yu, "
      "yuzingiz befarq bo'lsa — mehmon yuzingizga ishonadi.") +
 grid(3,
  card("green", "📏", "3 metr va 1,5 metr qoidasi", "Mehmon sizdan <b>3 metr</b> masofada — ko'z bilan aloqa va tabassum. <b>1,5 metr</b> yaqinlashdi — ovoz chiqarib salom. Xalqaro mehmondo'stlikda bu «10 va 5» qoidasi deb ataladi."),
  card("blue", "🗣", "Ovoz va masofa", "Xotirjam, aniq, shoshmasdan gapiring. Mehmon ustiga engashmang — <b>yarim qadam</b> masofa saqlang. Suhbatni bo'lmang: pauzani kuting."),
  card("violet", "🧒", "Hammaga salom", "Stoldagi <b>har bir kishi</b> — mehmon: bolaga ham, keksaga ham alohida e'tibor. Faqat «hisobni to'laydigan» odamga qarab gapirmang.")) +
 table(["⛔ Aytilmaydi", "✅ O'rniga aytiladi"], [
  ["«Bilmayman»", "«Hozir aniqlab beraman»"],
  ["«Yo'q, bu taom tugagan»", "«Afsuski, bugun bu taom tugadi. O'rniga … tavsiya qilaman»"],
  ["«Bu mening stolim emas»", "«Hozir yordam beraman» yoki «Ofitsiantingizni hozir chaqiraman»"],
  ["«Kutib turing»", "«Bir daqiqa vaqt bersangiz, hozir qaytaman»"],
  ["«Nima olasiz?»", "«Buyurtma berishga tayyormisiz yoki yana biroz vaqt beraymi?»"],
  ["«Bu oshxonaning aybi»", "«Uzr so'rayman. Hozir tuzatamiz»"]]) +
 quote("💬 <b>Uch sehrli so'z</b> har bir muloqotda: <b>«Marhamat»</b>, <b>«Rahmat»</b>, <b>«Uzr»</b>. Ular hech qachon ortiqcha bo'lmaydi."))

# ============================ 8. BRIFING ============================
slide("Smenaoldi brifingi", "Smenaoldi brifingi",
 kicker("3-blok · Tayyorgarlik") +
 h2("Brifing: smena oldidan " + G("10–15 daqiqa")) +
 defn("<b>Brifing</b> — smena boshlanishidan oldin zal jamoasining qisqa yig'ilishi. Maqsad: hamma zalga <b>bir xil ma'lumot</b> bilan chiqadi — "
      "kim qayerda ishlaydi, bugun nima bor va nima yo'q, kim keladi.") +
 grid(3,
  card("green", "📋", "Bugungi bronlar", "Soat, kishilar soni, stol raqami. Maxsus so'rovlar: tug'ilgan kun, bolalar stuli, allergiya, ish uchrashuvi, xorijiy mehmonlar."),
  card("red", "🚫", "Stop-list", "<b>Stop-list</b> — bugun tugagan yoki tayyorlanmaydigan taom va ichimliklar ro'yxati. Mehmonga yo'q taomni taklif qilmaslik uchun."),
  card("orange", "⭐", "Kun taomi va tavsiya", "Oshxona nimani tavsiya qiladi, yangi taom tarkibi, qaysi taom uzoq (20+ daqiqa) tayyorlanadi."),
  card("blue", "🗺", "Bo'limlar taqsimoti", "Kim qaysi stollar uchun javobgar, kim eshik oldida kutib oladi, kim yordamchi. Hech bir stol «egasiz» qolmaydi."),
  card("violet", "👔", "Ko'rinish tekshiruvi", "Forma, qo'l, tirnoq, beyj, poyabzal. Kamchilik zalga chiqishdan <b>oldin</b> tuzatiladi."),
  card("pink", "🎯", "Smena maqsadi", "Bitta aniq vazifa: masalan, «har stolga 30 soniyada salom». Kechagi xato va undan chiqarilgan xulosa.")) +
 quote("❓ <b>Savol bering:</b> tushunmagan narsangizni brifingda so'rang — mehmon oldida emas. <b>Brifingda so'ralmagan savol zalda xatoga aylanadi.</b>"))

# ============================ 9. XIZMAT SIKLI ============================
slide("Xizmat sikli: 10 qadam", "Xizmat sikli: 10 qadam",
 kicker("4-blok · Xizmat ketma-ketligi") +
 h2("Xizmat sikli — " + G("10 qadam")) +
 defn("<b>Xizmat sikli</b> — mehmon eshikdan kirganidan chiqib ketgunicha bo'lgan qadamlar ketma-ketligi. Tartib buzilsa (masalan, taom keldi, "
      "pribor yo'q) — mehmon buni darhol sezadi. Har bir qadamning o'z <b>vaqt me'yori</b> bor.") +
 '<div class="grid g5" style="margin-top:16px">' +
 card("green", "1️⃣", "Kutib olish", "30 soniya ichida salom, bronni aniqlash.") +
 card("green", "2️⃣", "Joylashtirish", "Stolga kuzatish, stul, menyu.") +
 card("blue", "3️⃣", "Ichimlik taklifi", "Suv yoki ichimlik — 2–3 daqiqada.") +
 card("blue", "4️⃣", "Buyurtma", "Yozish, takrorlab tasdiqlash.") +
 card("violet", "5️⃣", "Taomni uzatish", "To'g'ri mehmonga, to'g'ri tartibda.") +
 card("violet", "6️⃣", "Tekshirish", "2 daqiqa ichida: «Ma'qul bo'ldimi?»") +
 card("orange", "7️⃣", "Stolni kuzatish", "Bo'sh idish, stakan, non.") +
 card("orange", "8️⃣", "Desert taklifi", "Shirinlik, choy yoki qahva.") +
 card("pink", "9️⃣", "Hisob", "So'ralgach 2–3 daqiqada.") +
 card("pink", "🔟", "Kuzatish", "Rahmat, xayr, stolni tayyorlash.") +
 '</div>' +
 quote("🧭 <b>Bu mavzuda</b> 1, 2, 6 va 10-qadamlarni chuqur o'rganamiz. Taomni uzatish — 3-mavzuda, buyurtma — 7-mavzuda, hisob va to'lov — 8-mavzuda. "
       "Vaqt me'yorlari namunaviy: aniq raqamlar <b>restoran tartibida</b> belgilanadi."))

# ============================ 10. KUTIB OLISH ============================
slide("Mehmonni kutib olish", "Mehmonni kutib olish",
 kicker("4.1 · Birinchi qadam") +
 h2("Kutib olish: " + G("30 soniya qoidasi")) +
 defn("Mehmon eshikdan kirgach, uni <b>30 soniya ichida</b> kimdir payqashi shart. Band bo'lsangiz ham — ko'z bilan, bosh irg'ab yoki "
      "<b>«Hozir yoningizga boraman»</b> deb. E'tiborsiz qolgan mehmon uchun har daqiqa besh daqiqadek tuyuladi.") +
 grid(2,
  card_ul("green", "👋", "Kutib olishning 4 qadami", [
   "<b>Ko'z va tabassum</b> — mehmonni payqaganingizni bildiring",
   "<b>Salom</b> — «Assalomu alaykum! Xush kelibsiz!»",
   "<b>Aniqlash</b> — «Stol band qilganmisiz? Necha kishisiz?»",
   "<b>Yo'naltirish</b> — stolga kuzatib boring yoki kutish haqida aniq ma'lumot bering"], cls="clean"),
  card_ul("red", "⛔", "Ko'p uchraydigan xatolar", [
   "Mehmon eshik oldida turibdi — hech kim qaramayapti",
   "Salomsiz: «Necha kishi?»",
   "«Joy yo'q» deb qo'l siltash va orqa o'girish",
   "«O'zingiz bo'sh joy topib o'tiring»",
   "Kiyimiga yoki mashinasiga qarab muomalani o'zgartirish"], cls="cross")) +
 grid(3,
  card("blue", "🧑‍💼", "Xostes bo'lmasa", "Eshik oldida alohida xodim (xostes) yo'q bo'lsa, mehmonni <b>birinchi ko'rgan ofitsiant</b> kutib oladi — stol kimniki bo'lishidan qat'i nazar."),
  card("orange", "⭐", "Doimiy mehmon", "Ismini eslab qoling: «Xush kelibsiz, Dilnoza opa!» Sevimli stolini taklif qiling — lekin shaxsiy odatlarini boshqalar oldida aytmang."),
  card("violet", "🌍", "Xorijiy mehmon", "Salomdan keyin tilni aniqlang: «Good evening! Welcome!» Batafsil — 4-mavzuda."), top=14))

# ============================ 11. BRON BILAN ============================
slide("Bron bilan kelgan mehmon", "Bron bilan kelgan mehmon",
 kicker("4.2 · Bron") +
 h2("Bron — bu " + G("restoranning va'dasi")) +
 grid(2,
  card_ul("green", "📖", "Harakat tartibi", [
   "Ism va vaqtni so'rang, bron jurnalidan (yoki planshetdan) toping",
   "Ovoz chiqarib tasdiqlang: ism, vaqt, kishilar soni",
   "Stol tayyor — darhol kuzatib boring",
   "Stol hali tayyor emas — <b>aniq vaqtni</b> ayting va kutish joyini taklif qiling",
   "Bronda yozilgan maxsus so'rovni (bolalar stuli, tug'ilgan kun, allergiya) <b>o'zingiz</b> eslatib tasdiqlang"], cls="clean"),
  dialog("blue", "💬", "Namunaviy suhbat", [
   ("O", "Assalomu alaykum, xush kelibsiz! Stol band qilganmisiz?"),
   ("M", "Ha, Karimov nomiga, soat yettiga."),
   ("O", "Bir soniya… Janob Karimov, to'rt kishilik stol, deraza yonida — to'g'rimi?"),
   ("M", "To'g'ri."),
   ("O", "Stolingiz tayyor. Bolalar stuli ham so'ragan ekansiz — joyida turibdi. Marhamat, men kuzatib qo'yaman.")])) +
 grid(2,
  card("red", "🔎", "Bron topilmasa", "<b>Bahslashmang</b> va «Sizda bron yo'q» demang. «Kechirasiz, hozir tekshiraman» deng, administratorni chaqiring. Xato kimda bo'lishidan qat'i nazar, vazifa — mehmonni <b>joylashtirish yo'lini topish</b>."),
  card("orange", "⏰", "Mehmon kechiksa", "Band qilingan stol necha daqiqa ushlab turilishi <b>restoran tartibida</b> belgilanadi (ko'p joyda — 15 daqiqa atrofida). Bu muddatni biling va stolni ruxsatsiz boshqa mehmonga bermang."), top=14) +
 quote("📌 Bron qilgan mehmon <b>kutmasligi</b> kerak. Agar kutishga to'g'ri kelsa — sababini, aniq vaqtni ayting va uzr so'rang."))

# ============================ 12. BRONSIZ MEHMON ============================
slide("Bronsiz mehmon va kutish vaqti", "Bronsiz mehmon va kutish vaqti",
 kicker("4.3 · Kutish vaqti") +
 h2("Bo'sh stol yo'q: " + G("rad etmang — tanlov bering")) +
 defn("Bronsiz kelgan mehmon ham — mehmon. Bo'sh stol bo'lmasa, vazifangiz «joy yo'q» deyish emas, balki <b>halol vaqt aytish</b> va "
      "<b>tanlov berish</b>: kutish, kutish ro'yxatiga yozilish yoki boshqa vaqtga bron.") +
 grid(2,
  card_ul("green", "🧭", "Harakat tartibi", [
   "«Necha kishisiz?» — kishilar sonini aniqlang",
   "Bo'sh stol bor — joylashtiring (band qilingan stolga emas!)",
   "Bo'sh stol yo'q — <b>real</b> kutish vaqtini ayting",
   "Tanlov bering: kutish joyi, kutish ro'yxati, boshqa vaqtga bron",
   "Va'da qilingan vaqt o'tyaptimi — <b>o'zingiz</b> borib yangilang"], cls="clean"),
  dialog("blue", "💬", "Namunaviy suhbat", [
   ("O", "Assalomu alaykum, xush kelibsiz! Necha kishisiz?"),
   ("M", "Ikki kishimiz, bron qilmagandik."),
   ("O", "Hozir barcha stollar band. Taxminan 15–20 daqiqada ikki kishilik stol bo'shaydi. Kutish joyida o'tirib tursangiz, stol tayyor bo'lishi bilan o'zim chaqiraman. Ma'qulmi?"),
   ("M", "Mayli, kutamiz."),
   ("O", "Rahmat! Ismingizni yozib qo'yay…")])) +
 grid(3,
  card("orange", "🎯", "Kam va'da — ko'p ish", "15 daqiqa deb o'ylasangiz — <b>«15–20 daqiqa»</b> deng. 12 daqiqada chaqirsangiz, mehmon xursand. «5 daqiqa» deb 20 daqiqa kuttirsangiz — ishonch yo'qoladi."),
  card("violet", "📝", "Kutish ro'yxati", "Ism, kishilar soni, kelgan vaqt, aytilgan muddat. Navbat <b>kelish tartibida</b> — tanish-bilish bo'yicha emas."),
  card("red", "🚧", "Bron qilingan stol", "Bo'sh ko'rinsa ham bermang. Faqat administrator ruxsati bilan va vaqtini aytib: «Bu stol soat 20:00 gacha bo'sh».", ), top=14))

# ============================ 13. JOYLASHTIRISH ============================
slide("Stolga joylashtirish", "Stolga joylashtirish",
 kicker("4.4 · Ikkinchi qadam") +
 h2("Stolga " + G("kuzatib boring") + ", qo'l bilan ko'rsatib yubormang") +
 grid(2,
  card_ul("green", "🪑", "Joylashtirish tartibi", [
   "«Marhamat, men bilan yuring» — mehmondan <b>1–2 qadam oldinda</b>, uning tezligida yuring",
   "Stolni ochiq kaft bilan ko'rsating: «Mana shu stol ma'qulmi?»",
   "Stulni tortib bering — avval ayollar va keksalarga",
   "Menyuni <b>ochiq holda</b>, har bir mehmonga alohida bering",
   "Ortiqcha priborni oling yoki yetmaganini qo'shing",
   "O'zingizni tanishtiring: «Bugun sizga men, Aziz, xizmat qilaman»",
   "Suv yoki ichimlik taklif qiling va menyu bilan tanishishga vaqt bering"], cls="clean"),
  card_ul("red", "⛔", "Bunday qilinmaydi", [
   "Uzoqdan barmoq bilan: «Anavi yerga o'tiring»",
   "Mehmondan ancha oldinda tez yurib ketish",
   "Menyuni stolga tashlab, indamay ketish",
   "Tozalanmagan stolga o'tqazish",
   "Bolali oilani o'tish yo'li yoki oshxona eshigi oldiga joylashtirish"], cls="cross")) +
 table(["Mehmon", "Qulay stol"], [
  ["👨‍👩‍👧 Bolali oila", "Burchakroq, o'tish yo'lidan chetda; bolalar stuli oldindan qo'yiladi"],
  ["🧓 Keksa yoki harakatlanishi qiyin mehmon", "Kirishga yaqin, zinasiz, suyanchiqli qulay stul"],
  ["💼 Ish uchrashuvi", "Tinchroq joy — karnay va oshxona eshigidan uzoq"],
  ["💑 Ikki kishi", "Ikki kishilik stol; imkon bo'lsa deraza yoni"],
  ["🎉 Katta guruh", "Birlashtirilgan stol oldindan tayyorlanadi, o'rinlar sanaladi"]]) +
 quote("🔁 Mehmonga taklif qilingan stol yoqmadimi? <b>Bahslashmang</b> — bo'sh stollar ichidan boshqasini taklif qiling. Xohlagan stoli band qilingan bo'lsa, sababini ayting."))

# ============================ 14. KUZATISH ============================
slide("Xizmat davomida kuzatish", "Xizmat davomida kuzatish",
 kicker("4.5 · Holatni tekshirish") +
 h2("Yaxshi ofitsiant " + G("ko'rinmaydi, lekin doim yonida")) +
 defn("Mehmon qo'l ko'tarib sizni chaqirishga majbur bo'lmasligi kerak. Buning uchun stolni <b>doimiy kuzatasiz</b> va mehmon "
      "so'ramasidan oldin ehtiyojini payqaysiz.") +
 grid(3,
  card("green", "⏱", "2 daqiqa — 2 luqma qoidasi", "Taom uzatilgach <b>2 daqiqa ichida</b> (mehmon ikki luqma tatib ko'rgach) qisqa tekshiruv: «Taom ma'qul bo'ldimi?» Muammo bo'lsa — aynan shu payt tuzatish mumkin."),
  card("blue", "🔄", "Zalni «skanerlash»", "Har o'tganingizda o'z stollaringizga qarang: <b>bo'sh stakan, tugagan non, ishlatilgan idish, tushgan salfetka</b>. Zaldan hech qachon bo'sh qo'l bilan chiqmang."),
  card("violet", "🤐", "Jim xizmat", "Suv quyish, bo'sh idishni olish, priborni almashtirish — suhbatni <b>bo'lmasdan</b>, so'zsiz bajariladi. Savol faqat kerak bo'lganda.")) +
 table(["Mehmon signali", "Nimani bildiradi", "Sizning harakatingiz"], [
  ["Menyu yopib qo'yildi", "Tanlab bo'ldi", "Yaqinlashing: «Buyurtma berishga tayyormisiz?»"],
  ["Atrofga alanglayapti", "Sizni qidiryapti", "Darhol ko'z bilan javob bering va boring"],
  ["Pichoq va vilka tarelkada <b>yonma-yon</b>", "Ovqatlanib bo'ldi", "«Olib ketsam maylimi?» deb so'rab, idishni oling"],
  ["Pichoq va vilka <b>kesishgan</b> yoki chetda", "Hali davom etadi", "Tarelkaga tegmang"],
  ["Stakan yarmidan kam", "Ichimlik tugayapti", "To'ldiring yoki yana taklif qiling"],
  ["Hamyon chiqdi, ustki kiyimga qo'l cho'zildi", "Hisob kerak", "«Hisobni keltiraymi?»"]]) +
 quote("⚖️ <b>Me'yor:</b> har 3 daqiqada «Hammasi yaxshimi?» deb so'rash ham xato. Og'zi to'la mehmonga savol berilmaydi; bir mehmon hali yeyayotgan bo'lsa, "
       "qolganlarning tarelkasi olinishi <b>restoran standartiga</b> bog'liq — brifingda aniqlang."))

# ============================ 15. VAKOLAT CHEGARALARI ============================
slide("Vakolat chegaralari", "Vakolat chegaralari",
 kicker("5-blok · Qaror chegarasi") +
 h2("Nimani " + G("o'zim hal qilaman") + ", nimani mas'ulga yetkazaman?") +
 defn("<b>Vakolat</b> — xodim mustaqil qaror qila oladigan ishlar doirasi. Chegarani bilish — zaiflik emas, <b>kasbiy mahorat</b>: "
      "vakolatsiz berilgan va'da (chegirma, «allergen yo'q», «bepul desert») mehmonni ham, restoranni ham xavf ostiga qo'yadi.") +
 table(["Vaziyat", "🟢 O'zim hal qilaman", "🔺 Mas'ulga yetkazaman"], [
  ["Pribor tushdi, salfetka kerak", "Darhol tozasini keltiraman", "—"],
  ["Taom kechikyapti", "Uzr so'rayman, oshxonadan aniq vaqtni bilib aytaman", "Kechikish uzoq bo'lsa — administratorga"],
  ["Mehmon chegirma yoki bepul taom so'radi", "Tinglayman, <b>va'da bermayman</b>", "Administrator qaror qiladi"],
  ["Hisobda xato bor", "Buyurtma bilan solishtiraman", "Tuzatishni vakolatli xodim rasmiylashtiradi"],
  ["Allergiya haqida savol", "So'rovni aniq yozib olaman", "<b>Oshxona tasdiqlaydi</b> — taxmin qilmayman"],
  ["Mehmon janjal qilyapti yoki mast", "Xotirjam turaman, bahslashmayman", "Darhol administrator yoki qo'riqlash xizmati"],
  ["Mehmon o'zini yomon his qildi", "Yonida qolaman, yordam chaqiraman", "Administrator; kerak bo'lsa tez yordam — <b>103</b>"]]) +
 grid(3,
  card("green", "🗝", "Oltin ibora", "«Bilmayman» emas — <b>«Hozir aniqlab beraman»</b>. «Bo'ladi» deyishdan oldin o'zingizdan so'rang: bunga vakolatim bormi?"),
  card("orange", "📣", "Yetkazish — 3 savol", "Mas'ulga qisqa va aniq: <b>qaysi stol</b>, <b>nima bo'ldi</b>, <b>mehmon nima kutyapti</b>. Mehmonga esa kim kelishini va qachon kelishini ayting."),
  card("red", "🚨", "Kechiktirib bo'lmaydi", "Salomatlik va xavfsizlikka tahdid (allergik reaksiya, jarohat, yong'in, janjal) — <b>darhol</b> yetkaziladi. Bu yerda «o'zim hal qilaman» yo'q."), top=14))

# ============================ 16. YAKUNLASH VA KUZATISH ============================
slide("Xizmatni yakunlash va kuzatish", "Xizmatni yakunlash va kuzatish",
 kicker("4.6 · Oxirgi qadam") +
 h2("Oxirgi daqiqa — " + G("oxirgi taassurot")) +
 defn("Psixologlar buni <b>«cho'qqi va yakun» qoidasi</b> deb ataydi: odam voqeani eng kuchli lahzasi va <b>qanday tugagani</b> bo'yicha eslab qoladi. "
      "Mazali kechki ovqat sovuq xayrlashuv bilan tugasa — mehmon aynan shuni eslab ketadi.") +
 grid(2,
  card_ul("green", "🤝", "Yakunlash tartibi", [
   "Hisobni mehmon <b>so'raganda</b> keltiring — shoshirmang; so'ralgach 2–3 daqiqada",
   "To'lovdan keyin chek va qaytimni <b>to'liq</b> qaytaring",
   "Fikr so'rang: «Bugun hammasi ma'qul bo'ldimi?»",
   "Minnatdorlik: «Rahmat, janob Karimov! Yana kutib qolamiz»",
   "Turishda stulni torting, ustki kiyimni olishga yordam bering",
   "Eshikkacha kuzating yoki ko'z bilan xayrlashing"], cls="clean"),
  card_ul("blue", "🔍", "Mehmon ketgach", [
   "Stol va stullarni tekshiring: <b>telefon, hamyon, sumka, soyabon, ko'zoynak</b>",
   "Buyum topildimi — mehmon hali yaqin bo'lsa, yetkazing",
   "Yetolmadingizmi — administratorga topshiring, jurnalga qayd qilinadi",
   "Topilgan buyumni cho'ntakka solish yoki «ertaga beraman» deb olib ketish — <b>taqiqlanadi</b>",
   "Stolni 2–3 daqiqada keyingi mehmonga tayyorlang"], cls="clean")) +
 quote("💬 Mehmon tanqid aytsa — bu sovg'a: <b>rahmat ayting</b>, o'zingizni oqlamang va fikrni administratorga yetkazing. "
       "Jim ketgan norozi mehmondan ko'ra, aytib ketgan mehmon foydaliroq."))

# ============================ 17. AMALIY MASHQ ============================
slide("Amaliy mashq", "Amaliy mashq",
 kicker("Amaliyot · 1 soat") +
 h2("Rol o'yini: " + G("ikki mehmon — ikki vaziyat")) +
 defn("Uch kishilik guruhlarda ishlanadi: <b>ofitsiant</b>, <b>mehmon</b> va <b>kuzatuvchi</b>. Har vaziyat 4–5 daqiqa, so'ng kuzatuvchi varaq bo'yicha "
      "fikr bildiradi va rollar almashadi. Har bir tinglovchi ikkala vaziyatda ham ofitsiant bo'lib chiqadi.") +
 grid(2,
  card_ul("green", "📖", "Vaziyat A — bron bilan", [
   "Karimovlar oilasi, 4 kishi, soat 19:00 ga bron",
   "Bronda yozilgan: bolalar stuli kerak",
   "Stol yana 5 daqiqada tayyor bo'ladi",
   "<b>Vazifa:</b> kutib oling, bronni tasdiqlang, vaqtni tushuntiring, joylashtiring, menyuni taqdim eting"], cls="clean"),
  card_ul("orange", "🚶", "Vaziyat B — bronsiz", [
   "Ikki kishi, bron qilmagan, biroz shoshyapti",
   "Barcha stollar band; ikki kishilik stol 15–20 daqiqada bo'shaydi",
   "Bitta stol bo'sh ko'rinadi, lekin u 20:00 ga band qilingan",
   "<b>Vazifa:</b> vaqtni halol ayting, tanlov bering, kutish ro'yxatiga yozing, va'dani yangilang"], cls="clean")) +
 table(["Kuzatuv varag'i mezoni", "Kuzatiladigan harakat", "Ha / Yo'q"], [
  ["<b>Kutib olish</b>", "30 soniya ichida ko'z bilan aloqa, tabassum va salom", "☐"],
  ["<b>E'tibor</b>", "Ism bilan murojaat qildi, maxsus so'rovni o'zi tasdiqladi", "☐"],
  ["<b>Vaqtni kelishish</b>", "Real vaqtni aytdi, tanlov berdi, va'dani yangiladi", "☐"],
  ["<b>Joylashtirish</b>", "Kuzatib bordi, stulni tortdi, menyuni ochiq holda berdi", "☐"],
  ["<b>Kuzatish</b>", "Rahmat aytdi, unutilgan buyumni tekshirdi, qayta taklif qildi", "☐"]]) +
 quote("📄 <b>Natija dalili:</b> kuzatuv varag'ida kutib olish, e'tibor, vaqtni kelishish va kuzatish qayd etiladi. Varaq trenerga topshiriladi."))

# ============================ 18. VIDEO ============================
video_slide(1, "mehmonni kutib olishdan kuzatishgacha", "4", [
 ("green", "👋", "1. Kutib olish", "Ofitsiant mehmonni necha soniyada payqadi? Band bo'lganida qanday ishora berdi?"),
 ("orange", "⏱", "2. Kutish vaqti", "Bronsiz mehmonga vaqt qanday aytildi? Qanday tanlovlar taklif qilindi?"),
 ("violet", "🧭", "3. Vakolat", "Mehmon chegirma so'raganda ofitsiant nima dedi va kimga murojaat qildi?")])

# ============================ 19. XULOSA ============================
slide("Xulosa", "Xulosa",
 kicker("Yakun") +
 h2("Esda qoladigan " + G("6 ta qoida")) +
 grid(3,
  card("green", "👋", "30 soniya", "Kirgan mehmon 30 soniya ichida payqaladi — band bo'lsangiz ham ko'z bilan."),
  card("blue", "⏱", "Halol vaqt", "Kutish vaqtini real ayting, tanlov bering, va'dani o'zingiz yangilang."),
  card("violet", "🪑", "Kuzatib boring", "Stolni barmoq bilan ko'rsatmang — kuzatib boring, stulni torting, menyuni bering."),
  card("orange", "👀", "2 daqiqa qoidasi", "Taomdan keyin 2 daqiqa ichida tekshiring; stolni har o'tganda kuzating."),
  card("pink", "🧭", "Vakolat", "«Bilmayman» emas — «Hozir aniqlab beraman». Vakolatsiz va'da berilmaydi."),
  card("cyan", "🤝", "Yaxshi yakun", "Rahmat, unutilgan buyumni tekshirish, eshikkacha kuzatish.")) +
 '<div class="grid g2" style="margin-top:16px">' +
 card_ul("green", "📚", "Mustahkamlash uchun", [
  "Namunaviy suhbatlarni (11–12-slaydlar) ovoz chiqarib uch marta mashq qiling",
  "O'z restoraningiz tartibini aniqlang: bron necha daqiqa ushlanadi, kim chegirma bera oladi",
  "«Aytilmaydi / o'rniga aytiladi» jadvalini yod oling"], cls="clean") +
 card("blue", "➡️", "Keyingi mavzu", "<b>2-mavzu. Sanitariya va xavfsiz xizmat:</b> qo'l gigiyenasi, toza va ishlatilgan idishlarni ajratish, issiq idish, ho'l pol va singan shisha bilan bog'liq xavflar.") +
 '</div>')

# ============================ 20. TEST ============================
test_slide(15, "Keyingi mashg'ulotgacha namunaviy suhbatlarni mashq qiling va o'z ish joyingizdagi <b>bron va vakolat tartibini</b> aniqlab keling.")

# ============================ TEST SAVOLLARI ============================
# SV — 4 variantli savol (uzunligi teng, to'g'ri javob raqami), SO — ochiq savol (bitta so'z yoki son)
Q = [
 SV("Siz boshqa stolga taom olib ketyapsiz, shu payt eshikdan mehmon kirdi. To'g'ri harakat qaysi?",
   ["Ko'z bilan salomlashib, «Hozir yoningizga boraman» deb bildiraman",
    "Avval taomni uzatib bo'laman, mehmon esa eshik oldida kutib turadi",
    "Taomni yaqin stolga qo'yib, darhol mehmonni stolga kuzatib boraman",
    "Bu xostesning ishi bo'lgani uchun mehmonga hech e'tibor qaratmayman"], 0,
   "Mehmon 30 soniya ichida payqalishi kerak. Band bo'lsangiz — ko'z bilan aloqa va qisqa ishora yetarli; taomni tashlab ketish ham xato."),
 SO("Mehmon eshikdan kirgach, uni necha soniya ichida payqab, salomlashish kerak? <i>(faqat son)</i>",
   ["30", "30 soniya", "o'ttiz", "ottiz", "30s"],
   "30 soniya qoidasi: band bo'lsangiz ham ko'z bilan yoki «Hozir yoningizga boraman» deb mehmonni payqaganingizni bildirasiz."),
 SV("Bronsiz kelgan ikki mehmon uchun stol taxminan 15 daqiqada bo'shaydi. Qaysi javob to'g'ri?",
   ["«15–20 daqiqada stol bo'shaydi, kutish joyida o'tirsangiz, o'zim chaqiraman»",
    "«Besh daqiqada stol bo'shaydi, shu yerda tik turib kutib tursangiz bo'ladi»",
    "«Hozir joy yo'q, bron qilmagansiz, boshqa kuni oldindan qo'ng'iroq qiling»",
    "«Anavi bo'sh stolga o'tiravering, u band qilingan, lekin hali kelishmadi»"], 0,
   "Real vaqt aytiladi (kam va'da — ko'p ish), tanlov beriladi. Band qilingan stol ruxsatsiz berilmaydi."),
 SV("Mehmon taom tarkibi haqida so'radi, siz aniq bilmaysiz. Qaysi javob kasbiy etikaga mos?",
   ["«Hozir oshxonadan aniqlab, sizga aytaman»",
    "«Bilmayman, menyuda yozilgan bo'lsa kerak»",
    "«Menimcha, unda bunday narsa yo'q, oling»",
    "«Bu savolni borib oshpazdan o'zingiz so'rang»"], 0,
   "«Bilmayman» o'rniga — «Hozir aniqlab beraman». Taxmin bilan javob berish, ayniqsa tarkib va allergiya haqida, xavfli."),
 SO("Bugun tugagan yoki tayyorlanmaydigan taom va ichimliklar ro'yxati qanday ataladi? <i>(bitta so'z, defis bilan)</i>",
   ["stop-list", "stoplist", "stop list", "stop-listi", "stop list ro'yxati", "стоп-лист"],
   "Stop-list brifingda e'lon qilinadi — mehmonga yo'q taomni taklif qilmaslik uchun."),
 SV("Mehmon «doimiy mijozman» deb chegirma so'radi. Ofitsiantning to'g'ri harakati qaysi?",
   ["Tinglaydi, va'da bermaydi va administratorga yetkazadi",
    "Mehmon xafa bo'lmasligi uchun o'zi chegirma berib yuboradi",
    "«Bizda chegirma yo'q» deb gapni qisqa qilib ketib qoladi",
    "Chegirma o'rniga hisobdan bitta taomni o'chirib qo'yadi"], 0,
   "Chegirma — ofitsiant vakolatiga kirmaydi. Vakolatsiz va'da berilmaydi: qarorni administrator qabul qiladi."),
 SO("Taom uzatilgach, mehmondan «Ma'qul bo'ldimi?» deb necha daqiqa ichida so'raladi? <i>(faqat son)</i>",
   ["2", "2 daqiqa", "ikki", "ikki daqiqa", "2 daqiqada"],
   "2 daqiqa — 2 luqma qoidasi: muammo bo'lsa, uni aynan shu payt tuzatish mumkin."),
 SV("Qaysi tashqi ko'rinish kasbiy talablarga mos keladi?",
   ["Toza forma, yig'ilgan soch, kalta tirnoq, yopiq tufli",
    "Toza forma, katta uzuk va bilaguzuk, yopiq poyabzal",
    "Dazmollangan forma, kuchli atir, ochiq yozgi poyabzal",
    "Toza forma, yoyilgan soch, lak surilgan uzun tirnoq"], 0,
   "Taqinchoq, kuchli atir, uzun yoki lakli tirnoq va ochiq poyabzal — gigiyena va xavfsizlik talablariga zid."),
 SV("Restoranga taniqli sportchi keldi. Maxfiylik tamoyiliga ko'ra ofitsiant nima qiladi?",
   ["Odatdagidek xizmat qiladi, suratga olmaydi va hech kimga aytmaydi",
    "Yashirincha suratga olib, do'stlariga Telegram orqali yuboradi",
    "Restoran reklamasi uchun ijtimoiy tarmoqqa darhol post qo'yadi",
    "Boshqa stoldagi mehmonlarga kim kelganini aytib, maqtanib yuradi"], 0,
   "Mehmon kim bilan kelgani va nima qilgani zaldan tashqariga chiqmaydi. Ruxsatsiz suratga olinmaydi."),
 SV("Mehmon «stol band qilganman» dedi, lekin jurnalda uning ismi yo'q. To'g'ri harakat qaysi?",
   ["«Kechirasiz, hozir tekshiraman» deb administratorni chaqiraman",
    "«Sizning ismingiz yo'q, demak, bron qilmagansiz» deb aytaman",
    "Mehmonga kim bilan gaplashganini eslab ko'rishni taklif qilaman",
    "Jurnalni mehmonga ko'rsatib, xato unda ekanini isbotlab beraman"], 0,
   "Bahslashilmaydi: xato kimda bo'lishidan qat'i nazar, vazifa — mehmonni joylashtirish yo'lini topish."),
 SV("Mehmonni stolga qanday kuzatib borish to'g'ri?",
   ["Mehmondan 1–2 qadam oldinda, unga moslab yuraman",
    "Stolni uzoqdan barmoq bilan ko'rsatib yuboraman",
    "Tez yurib, mehmonni stol yonida kutib turaman",
    "Mehmonning orqasidan yurib, yo'lni aytib boraman"], 0,
   "Ofitsiant yo'l boshlaydi, lekin mehmondan uzoqlashib ketmaydi; stolni ochiq kaft bilan ko'rsatadi."),
 SV("Mehmon pichoq va vilkani tarelkaga yonma-yon qo'ydi. Bu nimani bildiradi?",
   ["Ovqatlanib bo'ldi — so'rab, tarelkani olish mumkin",
    "Hali davom etadi — tarelkaga tegish mumkin emas",
    "Taom yoqmadi — darhol administrator chaqiriladi",
    "Hisob so'rayapti — darhol chek olib kelish kerak"], 0,
   "Yonma-yon qo'yilgan pribor — «tugatdim» belgisi. Kesishgan yoki chetga qo'yilgan pribor — «davom etaman»."),
 SV("Mehmon ketgach, stulda telefon qolganini ko'rdingiz, mehmonga yetolmadingiz. Nima qilasiz?",
   ["Administratorga topshiraman, jurnalga qayd qilinadi",
    "Cho'ntagimga solib, ertaga egasini qidirib ko'raman",
    "Stol ustida qoldiraman, egasi o'zi qaytib kelar",
    "Hamkasbimga berib, o'zim ishimni davom ettiraman"], 0,
   "Topilgan buyum administratorga topshiriladi va qayd etiladi. Uni o'zida saqlash taqiqlanadi."),
 SV("Mehmon stol yonida hushini yo'qotayozdi. Vakolat chegarasiga ko'ra to'g'ri harakat qaysi?",
   ["Yonida qolib, darhol administratorni va yordam chaqiraman",
    "O'zim dori topib beraman va hech kimga xabar bermayman",
    "Boshqa mehmonlar ko'rmasligi uchun sekin zaldan chiqaraman",
    "Smena tugaguncha kuzataman, keyin mas'ulga aytib qo'yaman"], 0,
   "Salomatlik va xavfsizlikka tahdid darhol yetkaziladi. Dori berish ofitsiant vakolatiga kirmaydi; tez yordam — 103."),
 SO("Smena boshlanishidan oldin o'tkaziladigan 10–15 daqiqalik qisqa yig'ilish qanday ataladi? <i>(bitta so'z)</i>",
   ["brifing", "briefing", "brifingi", "брифинг"],
   "Brifingda bronlar, stop-list, kun taomi, bo'limlar taqsimoti va smena maqsadi aytiladi."),
]
