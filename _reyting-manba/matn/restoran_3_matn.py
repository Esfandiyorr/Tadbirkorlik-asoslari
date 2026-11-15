# -*- coding: utf-8 -*-
"""R3 · Stol servirovkasi va taom uzatish — «Restoran xodimlari malakasini oshirish» (RS 24), 3-mavzu.
Dastur: 2 soat amaliyot. Banket uchun dastlabki tayyorgarlik. Idish, qadah va anjomlarni menyuga mos joylashtirish,
patnisni muvozanatlash, issiq taomni ogohlantirib uzatish va stolni yig'ishtirish.
Amaliy mashq: ikki kishilik stolni ikki xil menyuga mos jihozlash; taomni buyurtma bergan mehmonga xavfsiz uzatish va
ishlatilgan idishlarni yig'ish. Natija dalili: tayyor stol va taom uzatish harakati nazorat ro'yxati bo'yicha tekshiriladi.
O'lchamlar (2 sm, 60 sm va h.k.) — klassik servis qoidalari; aniq standart restoran tartibida belgilanadi.
Ishlatish:
  python3 _reyting-manba/yangi_mavzu.py _reyting-manba/matn/restoran_3_matn.py restoran-3.html "Stol servirovkasi va taom uzatish" 3 "<tavsif>" mavzu-7.html "Restoran xizmati|Restaurant service"
  python3 _reyting-manba/inject.py
"""
exec(open(MATN_DIR + "restoran_umumiy.py", encoding="utf-8").read())

# ============================ 1. MUQOVA ============================
cover(3, "STOL SERVIROVKASI VA TAOM UZATISH",
      "<b>Mise en place</b> — smena oldi tayyorgarlik · dasturxon va <b>kuvert</b> · pichoq, vilka va qoshiqning joyi · qadahlar · "
      "ikki xil menyu — ikki xil servirovka · <b>banketga tayyorgarlik</b> · <b>patnisni muvozanatlash</b> · tarelkalarni tashish · "
      "taomni qaysi tomondan uzatish · issiq taom · <b>stolni yig'ishtirish</b>.",
      "2 soat amaliyot", 21, 15)

# ============================ 2. MAQSAD ============================
slide("Maqsad va natijalar", "Maqsad va natijalar",
 kicker("Mavzuning maqsadi") +
 h2("Mashg'ulot yakunida tinglovchi " + G("nima qila oladi?")) +
 defn("Maqsad: tinglovchi stolni <b>menyuga mos</b> jihozlaydi, patnis va tarelkalarni xavfsiz tashiydi, taomni <b>buyurtma bergan mehmonga</b> "
      "to'g'ri tomondan uzatadi va ishlatilgan idishlarni shovqinsiz, tartib bilan yig'adi. Bu mavzu to'liq amaliy: har bir qoida qo'lda bajariladi.") +
 grid(3,
  card("green", "🧺", "Tayyorlaydi", "Smena oldidan stol, dasturxon, idish va servis stansiyasini tekshirib, tayyor holatga keltiradi."),
  card("blue", "🍽️", "Jihozlaydi", "Kuvertni o'lcham va simmetriya qoidalari bo'yicha, menyudagi taomlarga mos pribor bilan qo'yadi."),
  card("violet", "🥂", "Qadah qo'yadi", "Qadah va stakanlarni to'g'ri joyga, oyoqchasidan ushlab, iz qoldirmasdan joylashtiradi."),
  card("orange", "⚖️", "Muvozanatlaydi", "Patnisni to'g'ri yuklaydi, bir qo'lda ko'taradi va bo'shatishda muvozanatni saqlaydi."),
  card("pink", "🤲", "Uzatadi", "Taomni to'g'ri mehmonga, to'g'ri tomondan, issiq idish haqida ogohlantirib uzatadi."),
  card("cyan", "♻️", "Yig'adi", "Ishlatilgan idish va priborni tartib bilan, shovqinsiz yig'ib, stolni keyingi taomga tayyorlaydi.")))

# ============================ 3. REJA ============================
slide("Reja va tushunchalar", "Reja va tushunchalar",
 kicker("Mashg'ulot rejasi") +
 h2("Bugungi " + G("5 ta blok")) +
 '<div class="grid g5">' +
 card("green", "1️⃣", "Tayyorgarlik", "Mise en place, dasturxon, servis stansiyasi.") +
 card("blue", "2️⃣", "Kuvert", "Tarelka, pribor, qadah va salfetkaning joyi.") +
 card("violet", "3️⃣", "Menyu va banket", "Ikki menyu — ikki servirovka; banket stoli.") +
 card("orange", "4️⃣", "Tashish va uzatish", "Patnis, tarelkalar, tomon va tartib.") +
 card("pink", "5️⃣", "Yig'ishtirish", "Idishni olish, stolni yangilash, amaliyot.") +
 '</div>' +
 h3("🔑 Tayanch tushunchalar") +
 pills([("mise en place", 1), ("servirovka", 1), ("kuvert", 1), ("molton", 0), ("dasturxon", 0), ("asosiy tarelka", 0),
        ("non tarelkasi", 0), ("pribor", 1), ("desert pribori", 0), ("qadah", 1), ("servis stansiyasi", 0), ("banket", 1),
        ("patnis", 1), ("ochiq qo'l qoidasi", 1), ("klosh", 0), ("yig'ishtirish", 1), ("nazorat ro'yxati", 1)]))

# ============================ 4. MISE EN PLACE ============================
slide("Mise en place", "Mise en place",
 kicker("1-blok · Tayyorgarlik") +
 h2(G("Mise en place") + " — hamma narsa o'z joyida") +
 defn("<b>Mise en place</b> (fransuzcha «miz-an-plas» — «joyiga qo'yish») — mehmon kelguniga qadar bajariladigan barcha tayyorgarlik. "
      "Yaxshi tayyorgarlik xizmat paytida yugurishni yo'q qiladi: kerakli narsa <b>qo'l yetadigan joyda</b>, toza va yetarli miqdorda turadi.") +
 grid(3,
  card_ul("green", "🪑", "Zal va stol", [
   "Stol va stullar <b>liqillamaydi</b>, toza, tekis turadi",
   "O'tish yo'llari ochiq, stullar bir chiziqda",
   "Yoritish, harorat va musiqa tekshirilgan",
   "Menyular toza, yirtilmagan, stop-list bilan solishtirilgan"], cls="clean"),
  card_ul("blue", "🍽️", "Idish va pribor", [
   "Tarelka, stakan va pribor <b>sanalgan</b> — zaxirasi bilan",
   "Darz ketgan, cheti uchgan idish ajratib olingan",
   "Stakan va pribor <b>polirovka</b> qilingan — dog' va barmoq izisiz",
   "Polirovkada toza mato ishlatiladi, buyum yalang qo'l bilan ushlanmaydi"], cls="clean"),
  card_ul("violet", "🧰", "Servis stansiyasi", [
   "Zaxira pribor, salfetka, tuzdon va murchdon",
   "Toza patnislar va qo'l salfetkalari",
   "Suv, non savati, qisqich, ochqich",
   "Ishlatilgan idish uchun <b>alohida</b> joy"], cls="clean")) +
 quote("🔎 <b>Polirovka:</b> stakan bug'ga tutiladi yoki iliq suvga botiriladi va toza mato bilan artiladi; bir qo'l mato orqali stakan tagini ushlab turadi. "
       "Artilgan stakan yorug'likka qarab tekshiriladi."))

# ============================ 5. DASTURXON ============================
slide("Stol va dasturxon", "Stol va dasturxon",
 kicker("1.2 · Asos") +
 h2("Servirovka " + G("dasturxondan") + " boshlanadi") +
 grid(2,
  card_ul("green", "🧵", "Dasturxonni yopish", [
   "Avval stol tekshiriladi: liqillasa — oyog'i sozlanadi (qog'oz tiqilmaydi)",
   "Stolga <b>molton</b> — yumshoq ostki mato to'shaladi: shovqinni yutadi, dasturxonni ushlab turadi",
   "Dasturxon toza, dazmollangan, dog'siz; markaziy burmasi stol o'rtasidan o'tadi",
   "Chetlari har tomondan <b>bir xil</b> — taxminan 25–30 sm osilib turadi",
   "Burchaklari stol oyoqlarini yopadi; chok va yorliq pastga qaragan"], cls="clean"),
  card_ul("blue", "🔁", "Xizmat paytida almashtirish", [
   "Dasturxon mehmonlar oldida almashtirilganda stolning <b>yalang yuzasi ko'rinmasligi</b> kerak",
   "Yangi dasturxon eskisining ustidan yoyiladi, eskisi ostidan tortib olinadi",
   "Ishlatilgan dasturxon silkitilmaydi — ushoq bilan birga o'rab olinadi",
   "Kichik dog' — ustiga toza salfetka (naperon) yopiladi",
   "Ho'l yoki katta dog'li dasturxon — to'liq almashtiriladi"], cls="clean")) +
 grid(3,
  card("orange", "📐", "Simmetriya", "Stoldagi hamma narsa — tarelka, pribor, qadah — <b>bir chiziqda</b>. Qarama-qarshi kuvertlar bir-biriga aniq ro'para turadi."),
  card("violet", "🪑", "Stul", "Stul stolga taqab qo'yilmaydi: o'rindiq cheti dasturxon chetiga tegib turadi. Stul markazi tarelka markaziga to'g'ri keladi."),
  card("pink", "🌸", "Stol markazi", "Gul, sham, tuzdon va murchdon — mehmonlarning bir-birini ko'rishiga <b>xalaqit bermaydigan</b> balandlikda va hidsiz."), top=14))

# ============================ 6. KUVERT ============================
slide("Kuvert: bir mehmonning o'rni", "Kuvert: bir mehmonning o'rni",
 kicker("2-blok · Kuvert") +
 h2(G("Kuvert") + " — bir mehmon uchun to'liq jihoz") +
 defn("<b>Kuvert</b> (fransuzcha <i>couvert</i>) — stolda bir mehmon uchun qo'yiladigan idish, pribor, qadah va salfetka to'plami hamda "
      "shu mehmonga ajratilgan joy. Servirovka «necha kuvertga» deb sanaladi: 4 kishilik stol — 4 kuvert.") +
 '<div class="grid g4" style="margin-top:16px">' +
 card("green", "↔️", "60–80 sm", "Har bir mehmonga stol bo'ylab kamida <b>60 sm</b>, banketda qulayi — 70–80 sm joy ajratiladi.") +
 card("blue", "📏", "2 sm", "Tarelka cheti va priborlar dastasi stol chetidan <b>2 sm</b> — taxminan bir barmoq eni — ichkarida turadi.") +
 card("violet", "🍴", "0,5–1 sm", "Priborlar tarelkadan va bir-biridan <b>0,5–1 sm</b> oraliqda, bir-biriga parallel yotadi.") +
 card("orange", "3️⃣", "Ko'pi bilan 3 ta", "Klassik qoidaga ko'ra tarelkaning har tomoniga <b>3 tadan ortiq</b> pribor qo'yilmaydi; qolgani taom bilan keltiriladi.") +
 '</div>' +
 table(["Buyum", "Joyi", "E'tibor bering"], [
  ["🍽️ <b>Asosiy tarelka</b>", "Kuvert markazida, stul ro'parasida", "Emblemasi (logotipi) bo'lsa — mehmonga qarab, «soat 12» da"],
  ["🥖 <b>Non tarelkasi</b>", "Chap tomonda, vilkalardan chapda yoki yuqoriroqda", "Ustida sariyog' pichog'i, tig'i chapga qaragan"],
  ["🧻 <b>Salfetka</b>", "Asosiy tarelka ustida yoki uning chap tomonida", "Sodda buklanadi — qo'l qancha kam tegsa, shuncha toza"],
  ["🥂 <b>Qadahlar</b>", "O'ng tomonda, pichoq uchi ustida", "Batafsil — 8-slaydda"],
  ["🧂 <b>Tuzdon, murchdon</b>", "Stol markazida yoki har 2–4 mehmonga bittadan", "To'ldirilgan, teshiklari toza"]]) +
 quote("✋ <b>Tartib:</b> avval tarelka (yo'naltiruvchi), keyin pribor, keyin qadah, oxirida salfetka. Tarelka noto'g'ri tursa — qolgan hammasi qiyshayadi."))

# ============================ 7. PRIBOR ============================
slide("Priborlarni joylashtirish", "Priborlarni joylashtirish",
 kicker("2.2 · Pribor") +
 h2("Pichoq — o'ngda, vilka — chapda, tartib — " + G("tashqaridan ichkariga")) +
 grid(2,
  card_ul("green", "🍴", "Asosiy qoidalar", [
   "<b>Pichoq</b> — tarelkaning o'ng tomonida, <b>tig'i tarelkaga</b> qaragan",
   "<b>Qoshiq</b> — o'ngda, pichoqdan o'ngroqda, botig'i yuqoriga",
   "<b>Vilka</b> — tarelkaning chap tomonida, tishlari yuqoriga",
   "Priborlar <b>taomlar ketma-ketligida</b> yotadi: birinchi taomniki — eng chetda",
   "Mehmon «tashqaridan ichkariga» qarab oladi — o'ylab o'tirmaydi",
   "Dastalar pastki uchi bir chiziqda, stol chetidan 2 sm"], cls="clean"),
  card_ul("blue", "🍰", "Desert pribori", [
   "Tarelkaning <b>yuqorisida</b>, stol chetiga parallel yotadi",
   "Desert qoshig'i (yoki pichog'i) — dastasi <b>o'ngga</b>",
   "Desert vilkasi — uning ostida, dastasi <b>chapga</b>",
   "Desertdan oldin ular tarelka yoniga tushirib qo'yiladi",
   "Ko'p restoranlarda desert pribori desert bilan birga keltiriladi"], cls="clean")) +
 table(["Taom", "Pribor", "Joyi"], [
  ["🥗 Sovuq gazak, salat", "Gazak pichog'i va vilkasi (kichikroq)", "Eng chetda: pichoq o'ngda, vilka chapda"],
  ["🍲 Sho'rva", "Sho'rva qoshig'i", "O'ngda, pichoqlar orasida yoki eng o'ngda"],
  ["🐟 Baliq taomi", "Baliq pichog'i va vilkasi", "Asosiy pribordan tashqarida"],
  ["🍖 Asosiy taom", "Asosiy pichoq va vilka (eng kattasi)", "Tarelkaga eng yaqin"],
  ["🍰 Desert", "Desert qoshig'i va vilkasi", "Tarelka yuqorisida"],
  ["☕ Choy, qahva", "Choy qoshiqchasi", "Likopchada, piyola dastasi yonida"]]) +
 quote("🧤 Pribor faqat <b>dastasidan</b>, toza mato yoki salfetka orqali ushlanadi va stolga patnisda yoki salfetka yopilgan tarelkada olib kelinadi."))

# ============================ 8. QADAHLAR ============================
slide("Qadah va stakanlar", "Qadah va stakanlar",
 kicker("2.3 · Shisha idish") +
 h2("Birinchi qadah — " + G("pichoq uchi ustida")) +
 grid(2,
  card_ul("green", "🥂", "Joylashtirish", [
   "Asosiy qadah (odatda <b>suv</b> uchun) — asosiy pichoq uchidan 1–2 sm yuqorida",
   "Qolgan qadahlar undan <b>o'ngga</b>: bir chiziqda yoki diagonal bo'ylab",
   "Tartib — ishlatilish ketma-ketligida: birinchi ichimlik qadahi qo'lga eng yaqin",
   "Bir kuvertga odatda <b>3 tadan ko'p</b> qadah qo'yilmaydi",
   "Baland qadah past qadahni to'smasligi kerak"], cls="clean"),
  card_ul("red", "⛔", "Xatolar", [
   "Qadahni kosachasidan yoki chetidan ushlash — barmoq izi qoladi",
   "Stakanlarni bir-birining ichiga kiydirib olib kelish",
   "Qadahni to'nkarib qo'yish (faqat ochiq havoda, chang bo'lsa ruxsat etiladi)",
   "Cheti uchgan yoki xira stakanni «bilinmaydi» deb qo'yish",
   "Qadahlarni patnissiz, barmoqlar orasida «guldasta» qilib tashish"], cls="cross")) +
 grid(3,
  card("blue", "💧", "Suv", "Suv mehmon o'tirgach birinchi bo'lib taklif qilinadi. Qadah <b>uchdan ikki</b> qismigacha to'ldiriladi; shisha qadahga tegmaydi."),
  card("orange", "🍵", "Choy va qahva", "Piyola yoki chashka likopchasi bilan <b>o'ng tomonga</b> qo'yiladi, dastasi o'ngga qaraydi, qoshiqcha likopchada."),
  card("violet", "🧃", "Sharbat va boshqa ichimlik", "Har ichimlik o'z stakanida. Stakan stoldan ko'tarilmasdan to'ldiriladi; mehmon ustidan quyilmaydi."), top=14))

# ============================ 9. IKKI MENYU ============================
slide("Ikki menyu — ikki servirovka", "Ikki menyu — ikki servirovka",
 kicker("3-blok · Menyuga moslash") +
 h2("Servirovka " + G("menyudan") + " kelib chiqadi") +
 defn("Stolga faqat <b>shu menyu uchun kerakli</b> buyumlar qo'yiladi. Ortiqcha pribor — mehmon uchun jumboq va ortiqcha yuvish; "
      "yetishmagan pribor — xizmat paytida yugurish. Shuning uchun avval <b>menyu o'qiladi</b>, keyin stol jihozlanadi.") +
 grid(2,
  card_ul("green", "🥗", "Menyu A — kunduzgi (2 taom + choy)", [
   "<b>Taomlar:</b> mavsumiy salat → asosiy taom → choy",
   "Asosiy tarelka, salfetka",
   "O'ngda: asosiy pichoq, undan tashqarida gazak pichog'i",
   "Chapda: asosiy vilka, undan tashqarida gazak vilkasi",
   "Suv qadahi — pichoq uchi ustida",
   "Non tarelkasi — chapda",
   "Choy piyolasi — choy bilan birga keltiriladi"], cls="clean"),
  card_ul("blue", "🍽️", "Menyu B — to'liq (4 taom)", [
   "<b>Taomlar:</b> sovuq gazak → sho'rva → asosiy taom → desert",
   "Asosiy tarelka, salfetka",
   "O'ngda (ichkaridan tashqariga): asosiy pichoq, sho'rva qoshig'i, gazak pichog'i",
   "Chapda: asosiy vilka, gazak vilkasi",
   "Yuqorida: desert qoshig'i (dastasi o'ngga) va vilkasi (dastasi chapga)",
   "Suv qadahi va ichimlik qadahi",
   "Non tarelkasi sariyog' pichog'i bilan — chapda"], cls="clean")) +
 quote("🔄 Mehmon boshqa taom buyurtma qilsa (masalan, sho'rvadan voz kechsa) — ortiqcha pribor <b>olib qo'yiladi</b>, kerakligi <b>qo'shiladi</b>. "
       "Bu taom kelishidan <b>oldin</b>, patnisda yoki salfetkali tarelkada bajariladi."))

# ============================ 10. BANKET ============================
slide("Banketga dastlabki tayyorgarlik", "Banketga dastlabki tayyorgarlik",
 kicker("3.2 · Banket") +
 h2("Banket: " + G("reja qog'ozda, tartib zalda")) +
 defn("<b>Banket</b> — oldindan kelishilgan menyu va mehmonlar soni bilan o'tadigan tantanali tadbir. Uning muvaffaqiyati "
      "<b>tayyorgarlikda</b> hal bo'ladi: mehmonlar kirganida stol to'liq tayyor, jamoa esa kim nima qilishini biladi.") +
 '<div class="grid g4" style="margin-top:16px">' +
 card("green", "📋", "1. Buyurtma varag'i", "Mehmonlar soni, vaqt, menyu, stol shakli, maxsus so'rovlar (allergiya, bolalar, faxriy mehmon).") +
 card("blue", "🗺", "2. Stol sxemasi", "Stollar joylashuvi, o'tish yo'llari, servis stansiyalari, ofitsiantlar bo'limlari.") +
 card("violet", "🍽️", "3. Servirovka", "Dasturxon → tarelkalar → pribor → qadah → salfetka → bezak. Hammasi o'lchab, bir chiziqda.") +
 card("orange", "🗣", "4. Brifing", "Taomlar ketma-ketligi, uzatish ishorasi, kim qaysi stolda, allergiyali mehmon qayerda o'tiradi.") +
 '</div>' +
 grid(2,
  card_ul("green", "📐", "Banket stolida aniqlik", [
   "Avval tarelkalar qo'yiladi: birinchisi stol o'rtasiga, qolganlari undan teng oraliqda",
   "Qarama-qarshi kuvertlar aniq ro'para turadi",
   "Chiziqni tekshirish uchun ip, chizg'ich yoki stullar qatori ishlatiladi",
   "Qadahlar butun stol bo'ylab <b>bitta chiziq</b> hosil qiladi",
   "Oxirida stol boshidan qarab tekshiriladi: hech narsa chiziqdan chiqmagan"], cls="clean"),
  card_ul("orange", "⏱", "Vaqt va xavfsizlik", [
   "Sovuq gazaklar stolga mehmonlar kelishidan <b>biroz oldin</b> qo'yiladi — uzoq turmasin (2-mavzu)",
   "Non va suv — mehmonlar o'tirishidan sal oldin",
   "Zaxira: har 10 kuvertga kamida 1 ta ortiqcha pribor va qadah to'plami",
   "Banketda taom butun stolga <b>bir vaqtda</b>, ishora bo'yicha uzatiladi",
   "Allergiyali mehmonning taomi alohida belgilanadi va alohida olib chiqiladi"], cls="clean"), top=14))

# ============================ 11. PATNIS ============================
slide("Patnisni muvozanatlash", "Patnisni muvozanatlash",
 kicker("4-blok · Tashish") +
 h2("Patnis: og'iri — " + G("markazga") + ", ko'z — " + G("oldinga")) +
 grid(2,
  card_ul("green", "⚖️", "Yuklash va ko'tarish", [
   "Patnis toza, quruq; ustida <b>sirpanmaydigan qoplama</b> yoki nam salfetka",
   "<b>Og'ir va baland</b> buyumlar — markazga va tanaga yaqin tomonga",
   "Yengil va past buyumlar — chetlarga",
   "Patnis <b>chap qo'lda</b>: kaft va yoyilgan barmoqlar ustida, tirsak tanaga yaqin",
   "<b>O'ng qo'l bo'sh</b> — uzatish, eshik ochish va patnisni tutib turish uchun",
   "Yuklangan patnisga emas, <b>oldinga</b> qaraladi"], cls="clean"),
  card_ul("red", "⛔", "Xatolar", [
   "Patnisni chetidan barmoqlar bilan qisib ko'tarish",
   "Bir tomonni to'liq bo'shatib, ikkinchisini yuklangan holda qoldirish",
   "Patnisni <b>mehmon stoliga qo'yish</b>",
   "Patnisni mehmon boshi yoki yelkasi ustidan o'tkazish",
   "Ko'tara oladiganidan ortiq yuklash — ikki marta borgan yaxshi",
   "Bo'sh patnisni qo'ltiqqa qisib yoki tebratib yurish"], cls="cross")) +
 grid(3,
  card("blue", "🔄", "Bo'shatish", "Buyumlar navbat bilan <b>qarama-qarshi tomonlardan</b> olinadi — og'irlik markazi o'rtada qoladi. Har olishda chap qo'l muvozanatni sezadi."),
  card("orange", "🚪", "Harakat", "Zalda o'ng tomondan yuriladi. Burilish va eshik oldida ovoz bering: <b>«Orqangizdaman!»</b> To'satdan to'xtamang."),
  card("violet", "🥤", "Ichimlik patnisi", "Dumaloq patnis. To'la stakanlar markazda; stakan <b>pastki qismidan</b> olinadi; shisha — yorlig'i mehmonga qarab."), top=14))

# ============================ 12. TARELKALARNI TASHISH ============================
slide("Tarelkalarni qo'lda tashish", "Tarelkalarni qo'lda tashish",
 kicker("4.2 · Tarelka") +
 h2("Ikkita aniq tarelka — " + G("to'rtta xavflisidan yaxshi")) +
 grid(3,
  card("green", "1️⃣", "Birinchi tarelka", "Chap qo'lda: bosh barmoq va ko'rsatkich barmoq chetidan <b>qisadi</b>, bosh barmoq chet ustida yotadi — taomga tegmaydi."),
  card("blue", "2️⃣", "Ikkinchi tarelka", "Chap qo'lning bilagi, kaft cheti va qolgan barmoqlar ustiga <b>tayanadi</b>. Ikki tarelka bir-biriga tegmaydi."),
  card("violet", "3️⃣", "Uchinchi tarelka", "<b>O'ng qo'lda</b>. Aynan shu qo'l bilan mehmonga uzatiladi, keyin chap qo'ldagilar navbat bilan o'ng qo'lga o'tadi.")) +
 grid(2,
  card_ul("green", "✅", "Qoidalar", [
   "Tarelka <b>gorizontal</b> — sous oqmasin, bezak siljimasin",
   "Bosh barmoq tarelka chetida — taom va sousga tegmaydi",
   "Issiq tarelka — quruq qo'l salfetkasi bilan",
   "Bir stolning taomi <b>bir yurishda</b> yoki hamkasb bilan birga olib chiqiladi",
   "Kimga qaysi taom — oshxonadan chiqishdan <b>oldin</b> aniq (o'rin raqami)"], cls="clean"),
  card_ul("orange", "🎓", "Mashq qilish tartibi", [
   "Avval bo'sh tarelkalar bilan, keyin suv solingan tarelka bilan",
   "Ikki tarelkani ishonch bilan olib yurmaguncha uchinchisiga o'tilmaydi",
   "Sho'rva tarelkasi — tagida likopcha bilan, bittadan",
   "Shubha bo'lsa — patnis yoki ikkinchi yurish",
   "Tezlik emas — <b>ravonlik</b>: tarelka qo'lda silkinmaydi"], cls="clean"), top=14))

# ============================ 13. UZATISH QOIDALARI ============================
slide("Taomni uzatish qoidalari", "Taomni uzatish qoidalari",
 kicker("4.3 · Uzatish") +
 h2("To'g'ri mehmonga, " + G("to'g'ri tomondan")) +
 defn("<b>«Ochiq qo'l» qoidasi:</b> mehmonga doim kaftingiz qaragan bo'lsin, tirsagingiz emas. Ya'ni o'ng tomondan — <b>o'ng qo'l</b> bilan, "
      "chap tomondan — <b>chap qo'l</b> bilan xizmat qilinadi. Shunda qo'lingiz mehmonning yuzi oldidan kesib o'tmaydi.") +
 table(["Nima", "Qaysi tomondan", "Izoh"], [
  ["🍽️ Tarelkada tayyor taom", "<b>O'ngdan</b>, o'ng qo'l bilan", "Zamonaviy restoranlarning ko'pchiligidagi standart"],
  ["🥘 Umumiy lagandan taom solib berish", "<b>Chapdan</b>, lagan chap qo'lda", "Mehmon o'zi olsa ham — chapdan taklif qilinadi"],
  ["🥖 Non, sariyog'", "<b>Chapdan</b>", "Non tarelkasi chapda turadi"],
  ["🥤 Ichimlik quyish, stakan qo'yish", "<b>O'ngdan</b>", "Qadahlar o'ng tomonda turadi"],
  ["♻️ Ishlatilgan idishni olish", "<b>O'ngdan</b>", "Istisno: non tarelkasi — chapdan"]]) +
 grid(3,
  card("green", "👥", "Kimga birinchi", "Avval <b>mehmonlar</b>: ayollar, keksalar, bolalar; oxirida — mezbon (taklif qilgan kishi). Bir stolga taom <b>bir vaqtda</b> keladi."),
  card("blue", "🧭", "Tarelkaning yo'nalishi", "Taomning <b>asosiy qismi</b> (go'sht, baliq) mehmonga yaqin — «soat 6» da. Tarelka emblemasi — «soat 12» da."),
  card("orange", "🗣", "So'z bilan", "Taom nomi aytiladi: «Marhamat, qo'zi go'shtidan kabob». <b>«Kimga kabob?»</b> deb so'ralmaydi — buni o'rin raqami hal qiladi (7-mavzu)."), top=14) +
 quote("⚖️ Tomonlar restoranga qarab farq qilishi mumkin. Joy tor bo'lsa yoki mehmon devor yonida o'tirsa — <b>mehmonni bezovta qilmaydigan</b> tomon tanlanadi. Brifingda o'z standartingizni aniqlang."))

# ============================ 14. ISSIQ TAOM ============================
slide("Issiq taomni uzatish", "Issiq taomni uzatish",
 kicker("4.4 · Issiq taom") +
 h2("Issiq taom: " + G("tez, xavfsiz, ogohlantirib")) +
 grid(2,
  card_ul("green", "🔥", "Harakat tartibi", [
   "Taom tayyor bo'lishi bilan olinadi — uzatish oynasida kutib qolmaydi",
   "Issiq tarelka <b>quruq</b> qo'l salfetkasi bilan ushlanadi",
   "Mehmonga yaqinlashishda ovoz beriladi: «Kechirasiz», yoniga kelgach — <b>«Ehtiyot bo'ling, tarelka issiq»</b>",
   "Tarelka mehmon ustidan emas, <b>yonidan</b> va past balandlikda qo'yiladi",
   "Bolaning oldiga issiq idish qo'yilmaydi — kattalar tomonga suriladi",
   "Qo'yilgach: «Yoqimli ishtaha!»"], cls="clean"),
  card_ul("blue", "🍲", "Alohida holatlar", [
   "<b>Sho'rva:</b> chuqur tarelka tagida likopcha bilan; chetidan 1–1,5 sm bo'sh; bittadan olib boriladi",
   "<b>Klosh (qopqoq):</b> qopqoq mehmondan <b>teskari tomonga</b> ochiladi — bug' yuzga urmasin",
   "<b>Cho'yan idish, vishillab turgan taom:</b> yog'och taglikda, mehmonga tegmaslik haqida aytiladi",
   "<b>Choynak:</b> tumshug'i mehmondan teskari, dastasi qulay tomonga",
   "<b>Qahva, choy:</b> piyola likopchada, qoshiqcha o'ngda"], cls="clean")) +
 quote("🩹 Baribir to'kildimi yoki mehmon kuydimi? Yonida qoling, uzr so'rang, <b>mas'ulni chaqiring</b>. Birinchi yordam — 2-mavzuda: oqar sovuq suv, muz va yog' surtilmaydi."))

# ============================ 15. XIZMAT DAVOMIDA ============================
slide("Xizmat davomida stolni saqlash", "Xizmat davomida stolni saqlash",
 kicker("5-blok · Stol holati") +
 h2("Stol har taomdan oldin " + G("qayta tayyorlanadi")) +
 grid(3,
  card("green", "🍴", "Priborni moslash", "Keyingi taom kelishidan <b>oldin</b> kerakli pribor qo'shiladi, ortiqchasi olinadi. Yangi pribor — salfetkali tarelkada, dastasidan."),
  card("blue", "🥖", "Non va suv", "Non savati bo'shasa — so'ramasdan to'ldiriladi yoki taklif qilinadi. Suv qadahi yarmidan pastga tushsa — quyiladi."),
  card("violet", "🧹", "Ushoqlarni tozalash", "Asosiy taomdan keyin, desertdan <b>oldin</b>: non tarelkasi, tuzdon olinadi, ushoqlar maxsus cho'tka yoki buklangan salfetka bilan tarelkaga supuriladi.")) +
 grid(2,
  card_ul("orange", "⏳", "Idishni qachon olish", [
   "Klassik standart: stoldagi <b>hamma mehmon tugatgach</b> — birovni shoshirmaslik uchun",
   "Belgi: pichoq va vilka tarelkada yonma-yon (1-mavzu)",
   "Ishonch bo'lmasa — so'raladi: «Olib ketsam maylimi?»",
   "Ba'zi restoranlarda tugatgan mehmonning idishi darhol olinadi — <b>standartni brifingda aniqlang</b>",
   "Bo'sh stakan, ishlatilgan salfetka, bo'sh shisha — kutmasdan olinadi"], cls="clean"),
  card_ul("red", "⛔", "Bezovta qiluvchi xatolar", [
   "Mehmon hali yeyayotganda tarelkaga qo'l cho'zish",
   "Tarelkalarni mehmon oldida ustma-ust taxlash",
   "Idishlarni bir-biriga urib, shovqin bilan yig'ish",
   "Mehmonlar suhbatini kesib, o'rtadan qo'l uzatish",
   "Ishlatilgan priborni dasturxonga qo'yib ketish"], cls="cross"), top=14))

# ============================ 16. YIG'ISHTIRISH ============================
slide("Stolni yig'ishtirish", "Stolni yig'ishtirish",
 kicker("5.2 · Texnika") +
 h2("Yig'ishtirish: " + G("o'ngdan, shovqinsiz, tartib bilan")) +
 '<div class="grid g4" style="margin-top:8px">' +
 card("green", "1️⃣", "Birinchi tarelka", "O'ngdan, o'ng qo'l bilan olinadi va chap qo'lga o'tkaziladi. U — <b>asos</b>: pribor va qoldiq shunga yig'iladi.") +
 card("blue", "2️⃣", "Priborlar", "Vilka bosh barmoq bilan tarelkaga bosib turiladi, pichoq uning <b>ostiga</b> ko'ndalang kiritiladi — sirpanmaydi.") +
 card("violet", "3️⃣", "Ikkinchi tarelka", "Chap bilakka qo'yiladi. Undagi qoldiq va pribor birinchi tarelkaga suriladi — <b>mehmondan burilib</b>.") +
 card("orange", "4️⃣", "Keyingilari", "Bo'sh tarelkalar ikkinchisining ustiga taxlanadi. Chap qo'l to'lsa — to'xtab, olib chiqiladi.") +
 '</div>' +
 grid(2,
  card_ul("green", "📋", "Olish tartibi", [
   "Avval katta idishlar: lagan, umumiy salat idishi",
   "Keyin tarelka va priborlar — mehmonma-mehmon, soat mili bo'yicha",
   "Keyin non tarelkasi (chapdan), tuzdon, sous idishlari",
   "Stakan va qadahlar — <b>patnisda</b>, pastki qismidan ushlab",
   "Oxirida ushoqlar tozalanadi, desertga pribor qo'yiladi"], cls="clean"),
  card_ul("blue", "🔄", "Mehmon ketgach — to'liq yangilash", [
   "Barcha idish yig'iladi, unutilgan buyum tekshiriladi (1-mavzu)",
   "Dasturxon almashtiriladi yoki stol tozalanib dezinfeksiya qilinadi (2-mavzu)",
   "Stullar tekislanadi, o'rindiq va pol ko'zdan kechiriladi",
   "Yangi kuvertlar restoran standarti bo'yicha qo'yiladi",
   "Stol 2–3 daqiqada keyingi mehmonga tayyor"], cls="clean"), top=14) +
 quote("🤫 Yaxshi yig'ishtirish — mehmon payqamay qolgan yig'ishtirish. Qoldiq hech qachon mehmon ko'z oldida sidirilmaydi; ishlatilgan idish toza idish bilan aralashmaydi."))

# ============================ 17. XATOLAR ============================
slide("Ko'p uchraydigan xatolar", "Ko'p uchraydigan xatolar",
 kicker("Takrorlash") +
 h2("Tekshirib oling: " + G("to'g'ri") + " yoki " + G("noto'g'ri")) +
 table(["⛔ Noto'g'ri", "✅ To'g'ri", "Nega"], [
  ["Pichoq tig'i tashqariga qaragan", "Tig'i tarelkaga qaragan", "Xavfsizlik va an'ana"],
  ["Priborlar har xil balandlikda", "Dastalar bir chiziqda, chetdan 2 sm", "Tartib va simmetriya"],
  ["Qadah kosachasidan ushlangan", "Oyoqchasidan yoki pastidan", "Iz qolmaydi, gigiyena"],
  ["Menyuda yo'q taom uchun pribor qo'yilgan", "Faqat shu menyu uchun kerakli pribor", "Ortiqcha buyum chalg'itadi"],
  ["Patnis mehmon stoliga qo'yilgan", "Patnis qo'lda yoki servis stansiyasida", "Patnis tagi toza emas"],
  ["Og'ir buyum patnis chetida", "Og'ir buyum markazda", "Muvozanat"],
  ["Tirsak mehmon yuzi oldida", "«Ochiq qo'l»: o'ngdan — o'ng qo'l", "Mehmon qulayligi"],
  ["«Kimga sho'rva?» deb so'rash", "O'rin raqami bo'yicha, taom nomini aytib", "Kasbiy mahorat belgisi"],
  ["Qoldiq mehmon oldida sidirilgan", "Mehmondan burilib yoki oshxonada", "Ishtaha va estetika"]]) +
 quote("🎯 <b>Nazorat savoli:</b> stolga begona ko'z bilan qarang — mehmon o'tirganda nimani birinchi ko'radi? Qiyshiq pribor va xira stakan butun taassurotni buzadi."))

# ============================ 18. AMALIY MASHQ ============================
slide("Amaliy mashq", "Amaliy mashq",
 kicker("Amaliyot · 2 soat") +
 h2("Ikki kishilik stol — " + G("ikki xil menyu")) +
 defn("Juftlikda ishlanadi. Har tinglovchi stolni avval <b>Menyu A</b>, keyin <b>Menyu B</b> bo'yicha jihozlaydi; so'ng sherigi «mehmon» bo'lib o'tiradi, "
      "tinglovchi unga taomni uzatadi va ishlatilgan idishlarni yig'adi. Sherik nazorat ro'yxatini to'ldiradi, keyin rollar almashadi.") +
 grid(3,
  card_ul("green", "1️⃣", "Bosqich · Servirovka", [
   "Dasturxon, 2 kuvert",
   "Menyu A — 6 daqiqa",
   "Menyu B ga qayta jihozlash — 6 daqiqa",
   "O'lchamlar: 2 sm, simmetriya"], cls="clean"),
  card_ul("blue", "2️⃣", "Bosqich · Uzatish", [
   "Patnisda 2 stakan suv",
   "2 tarelka «issiq taom» (suv bilan)",
   "To'g'ri mehmonga, o'ngdan",
   "Ogohlantirish va taom nomi"], cls="clean"),
  card_ul("orange", "3️⃣", "Bosqich · Yig'ishtirish", [
   "Ruxsat so'rash",
   "Tarelka va priborni yig'ish",
   "Stakanlar — patnisda",
   "Stolni keyingi taomga tayyorlash"], cls="clean")) +
 table(["Nazorat ro'yxati mezoni", "Kuzatiladigan harakat", "Ha / Yo'q"], [
  ["<b>Kuvert</b>", "Tarelka va dastalar chetdan 2 sm, bir chiziqda; pichoq tig'i tarelkaga", "☐"],
  ["<b>Menyuga moslik</b>", "Faqat shu menyu uchun kerakli pribor va qadah qo'yilgan", "☐"],
  ["<b>Gigiyena</b>", "Pribor dastasidan, qadah oyoqchasidan ushlandi; iz qolmagan", "☐"],
  ["<b>Patnis</b>", "Og'ir buyum markazda; patnis stolga qo'yilmadi; muvozanat saqlandi", "☐"],
  ["<b>Uzatish</b>", "To'g'ri mehmonga, to'g'ri tomondan, issiq haqida ogohlantirib", "☐"],
  ["<b>Yig'ishtirish</b>", "Ruxsat so'radi, shovqinsiz yig'di, qoldiqni mehmondan burilib surdi", "☐"]]) +
 quote("📄 <b>Natija dalili:</b> tayyor stol va taom uzatish harakati nazorat ro'yxati bo'yicha tekshiriladi."))

# ============================ 19. VIDEO ============================
video_slide(3, "stolni jihozlashdan yig'ishtirishgacha", "3", [
 ("green", "🍽️", "1. Kuvert", "Pichoq, vilka va qadah qayerga qo'yildi? Stol chetidan qancha masofa qoldirildi?"),
 ("orange", "⚖️", "2. Patnis", "Og'ir buyumlar patnisning qayeriga qo'yildi? Patnis qaysi qo'lda edi?"),
 ("violet", "🤲", "3. Uzatish", "Taom qaysi tomondan va qaysi qo'l bilan uzatildi? Ofitsiant nima dedi?")])

# ============================ 20. XULOSA ============================
slide("Xulosa", "Xulosa",
 kicker("Yakun") +
 h2("Esda qoladigan " + G("6 ta qoida")) +
 grid(3,
  card("green", "🧺", "Avval tayyorgarlik", "Mise en place: hamma narsa toza, sanalgan va qo'l yetadigan joyda."),
  card("blue", "📏", "2 sm va bir chiziq", "Tarelka va dastalar stol chetidan 2 sm; pichoq o'ngda, vilka chapda."),
  card("violet", "📖", "Menyuga moslab", "Faqat kerakli pribor: tashqaridan ichkariga, taomlar tartibida."),
  card("orange", "⚖️", "Og'iri markazda", "Patnis chap qo'lda, o'ng qo'l bo'sh; patnis mehmon stoliga qo'yilmaydi."),
  card("pink", "🤲", "Ochiq qo'l", "O'ngdan — o'ng qo'l bilan; avval mehmonlar; issiq taom haqida ogohlantiring."),
  card("cyan", "🤫", "Shovqinsiz yig'ing", "Hamma tugatgach, o'ngdan; qoldiq mehmon oldida sidirilmaydi.")) +
 '<div class="grid g2" style="margin-top:16px">' +
 card_ul("green", "📚", "Mustahkamlash uchun", [
  "Uyda bitta kuvertni ikki xil menyuga qo'yib, suratga oling va nazorat ro'yxati bilan solishtiring",
  "Patnisda 4 stakan suv bilan xona bo'ylab yurib, to'kmasdan bo'shatishni mashq qiling",
  "Ish joyingizdagi standartni aniqlang: taom qaysi tomondan uzatiladi, idish qachon olinadi"], cls="clean") +
 card("blue", "➡️", "Keyingi mavzu", "<b>4-mavzu. Xorijiy mehmon bilan muloqot:</b> til tanlovini so'rash, sodda va sekin gapirish, ikki tilli menyu, xizmat ingliz tilidagi ishchi iboralar.") +
 '</div>')

# ============================ 21. TEST ============================
test_slide(15, "Keyingi mashg'ulotgacha uyda <b>bitta kuvertni ikki xil menyuga</b> qo'yib ko'ring va o'z restoraningizdagi uzatish standartini aniqlab keling.")

# ============================ TEST SAVOLLARI ============================
# SV — 4 variantli savol (uzunligi teng, to'g'ri javob raqami), SO — ochiq savol (bitta so'z yoki son)
Q = [
 SV("Asosiy pichoq kuvertda qayerga va qanday qo'yiladi?",
    ["Tarelkaning o'ng tomoniga, tig'i tarelkaga qarab",
     "Tarelkaning chap tomoniga, tig'i tarelkaga qarab",
     "Tarelkaning o'ng tomoniga, tig'i tashqariga qarab",
     "Tarelkaning yuqorisiga, tig'i mehmonga qaratib"], 0,
    "Pichoq — o'ngda, tig'i tarelkaga; vilka — chapda, tishlari yuqoriga; qoshiq — o'ngda."),
 SV("Bir necha taomli menyuda priborlar qanday tartibda joylashtiriladi?",
    ["Birinchi taomniki eng chetda — tashqaridan ichkariga",
     "Eng katta pribor chetda, eng kichigi tarelka yonida",
     "Hamma pichoqlar chapda, hamma vilkalar esa o'ngda",
     "Tartib yo'q — mehmon o'ziga qulayini tanlab oladi"], 0,
    "Priborlar taomlar ketma-ketligida yotadi: mehmon tashqaridan ichkariga qarab oladi."),
 SO("Tarelka cheti va priborlar dastasi stol chetidan necha santimetr ichkarida turadi? <i>(faqat son)</i>",
    ["2", "2 sm", "ikki", "2sm", "2 santimetr"],
    "Klassik qoida — 2 sm, taxminan bir barmoq eni. Dastalar pastki uchi bir chiziqda yotadi."),
 SV("Asosiy (suv) qadahi kuvertda qayerga qo'yiladi?",
    ["O'ng tomonda, asosiy pichoq uchining ustida",
     "Chap tomonda, asosiy vilka uchining ustida",
     "Tarelkaning qoq o'rtasida, salfetka ustida",
     "Non tarelkasining yonida, eng chap tomonda"], 0,
    "Qadahlar o'ng tomonda turadi: birinchisi pichoq uchi ustida, qolganlari undan o'ngga."),
 SV("Non tarelkasi kuvertning qaysi tomonida turadi?",
    ["Chap tomonda — vilkalardan chapda yoki yuqorida",
     "O'ng tomonda — pichoq va qoshiqdan o'ngroqda",
     "Asosiy tarelkaning ustida, salfetkaning ostida",
     "Stol markazida, tuzdon va murchdonning yonida"], 0,
    "Non tarelkasi — chapda; ustida sariyog' pichog'i. Shuning uchun non ham chapdan uzatiladi."),
 SV("Patnisga buyumlar qanday yuklanadi?",
    ["Og'ir va baland buyumlar markazga, yengili chetga",
     "Og'ir buyumlar chetga, yengillari esa markazga",
     "Hamma buyum bir tomonga, bo'shatish oson bo'lsin",
     "Baland buyumlar oldinga, ko'rishni to'sib tursin"], 0,
    "Og'irlik markazi kaft ustida bo'lishi kerak. Bo'shatishda ham buyumlar qarama-qarshi tomonlardan navbat bilan olinadi."),
 SV("Yuklangan patnis qanday ushlanadi?",
    ["Chap qo'lda, kaft ustida; o'ng qo'l esa bo'sh",
     "Ikki qo'l bilan chetidan qisib, ko'krak oldida",
     "O'ng qo'lda, chap qo'l bilan esa taom uzatiladi",
     "Qo'ltiqqa qisib, ikkala qo'l ham bo'sh qoladi"], 0,
    "Patnis chap qo'lda, tirsak tanaga yaqin. O'ng qo'l uzatish va muvozanat uchun bo'sh turadi."),
 SV("«Ochiq qo'l» qoidasi nimani anglatadi?",
    ["Mehmonning o'ng tomonidan — o'ng qo'l bilan xizmat qilish",
     "Mehmonning o'ng tomonidan — chap qo'l bilan xizmat qilish",
     "Taomni har doim ikki qo'llab, mehmonning oldidan uzatish",
     "Patnisni ochiq kaftda, mehmonning boshi ustidan o'tkazish"], 0,
    "Mehmonga kaft qaragan bo'ladi, tirsak emas: o'ngdan — o'ng qo'l, chapdan — chap qo'l bilan."),
 SV("Qopqoqli (klosh ostidagi) issiq taom mehmon oldida qanday ochiladi?",
    ["Qopqoq mehmondan teskari tomonga qiyalatib ochiladi",
     "Qopqoq mehmon tomonga qiyalatib, juda tez ochiladi",
     "Qopqoq tik ko'tarilib, mehmon ustidan olib o'tiladi",
     "Qopqoqni mehmonning o'zi ochadi, ofitsiant tegmaydi"], 0,
    "Bug' mehmonning yuziga urmasligi uchun qopqoq undan teskari tomonga ochiladi."),
 SV("Klassik standartga ko'ra ishlatilgan tarelkalar qachon yig'iladi?",
    ["Stoldagi barcha mehmonlar ovqatlanib bo'lgach",
     "Birinchi mehmon tugatishi bilanoq, shu zahoti",
     "Mehmonlar restorandan chiqib ketgandan keyin",
     "Keyingi taom stolga olib kelinganidan so'ng"], 0,
    "Hamma tugatgach — hech kimni shoshirmaslik uchun. Restoran standarti boshqacha bo'lishi mumkin: brifingda aniqlanadi."),
 SV("Yig'ishtirishda taom qoldig'i qanday suriladi?",
    ["Mehmondan burilib, birinchi (asos) tarelkaga",
     "Mehmon oldida, tarelkadan tarelkaga sidirib",
     "Stol ustida, dasturxonga yoyilgan salfetkaga",
     "To'g'ridan-to'g'ri patnis ustiga, idishsiz"], 0,
    "Qoldiq mehmon ko'z oldida sidirilmaydi: ofitsiant stoldan burilib yoki oshxonada bajaradi."),
 SV("Desert priborlari dastlabki servirovkada qayerga qo'yiladi?",
    ["Tarelkaning yuqorisiga, stol chetiga parallel",
     "Tarelkaning o'ng tomoniga, pichoqdan ichkarida",
     "Non tarelkasi ustiga, sariyog' pichog'i yoniga",
     "Qadahlarning orqasiga, stol markaziga yaqin"], 0,
    "Desert qoshig'i (dastasi o'ngga) va vilkasi (dastasi chapga) tarelka yuqorisida yotadi yoki desert bilan keltiriladi."),
 SO("Mehmon kelguniga qadar bajariladigan tayyorgarlik fransuzcha qanday ataladi? <i>(o'zbekcha o'qilishi ham qabul qilinadi)</i>",
    ["mise en place", "miz an plas", "mizanplas", "miz-an-plas", "mise-en-place", "mizan plas", "miseenplace"],
    "Mise en place («miz-an-plas») — «joyiga qo'yish»: zal, stol, idish va servis stansiyasini tayyorlash."),
 SO("Bir mehmonga stol bo'ylab kamida necha santimetr joy ajratiladi? <i>(faqat son)</i>",
    ["60", "60 sm", "oltmish", "60sm"],
    "Kamida 60 sm; banketda qulayi — 70–80 sm."),
 SO("Klassik qoidaga ko'ra tarelkaning bir tomoniga ko'pi bilan nechta pribor qo'yiladi? <i>(faqat son)</i>",
    ["3", "uch", "3 ta", "uchta"],
    "Har tomonga 3 tadan ortiq emas; qolgan priborlar taom bilan birga keltiriladi."),
]
