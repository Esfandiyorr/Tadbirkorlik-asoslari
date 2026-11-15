# -*- coding: utf-8 -*-
"""R2 · Sanitariya va xavfsiz xizmat — «Restoran xodimlari malakasini oshirish» (RS 24), 2-mavzu.
Dastur: 1 soat nazariya + 1 soat amaliyot. Qo'l gigiyenasi, toza forma, xodim salomatligi haqida xabar berish, toza va
ishlatilgan idishlarni ajratish, ifloslanishning oldini olish. Issiq idish, ho'l pol va singan shisha bilan bog'liq xavflar.
Amaliy mashq: qo'l yuvishni namoyish qilish, ifloslangan anjomni almashtirish, to'kilgan suyuqlik joyini belgilash va
mas'ul xodimga xabar berish. Natija dalili: gigiyena va xavfga javob bo'yicha tekshiruv varag'i.
Raqamlar: JSST (WHO) — oziq-ovqat orqali yuqadigan kasalliklar bahosi (2015) va qo'l yuvish bo'yicha tavsiyalar;
Codex Alimentarius CXC 1-1969 — umumiy gigiyena tamoyillari. Mahalliy talablar — amaldagi sanitariya qoidalari va
restoran tartibi bo'yicha (dastur manbalari [6–8]).
Ishlatish:
  python3 _reyting-manba/yangi_mavzu.py _reyting-manba/matn/restoran_2_matn.py restoran-2.html "Sanitariya va xavfsiz xizmat" 2 "<tavsif>" mavzu-7.html "Restoran xizmati|Restaurant service"
  python3 _reyting-manba/inject.py
"""
exec(open(MATN_DIR + "restoran_umumiy.py", encoding="utf-8").read())

# ============================ 1. MUQOVA ============================
cover(2, "SANITARIYA VA XAVFSIZ XIZMAT",
      "Nega gigiyena — ofitsiantning ishi · ifloslanish yo'llari · <b>qo'lni qachon va qanday yuvish</b> · forma va shaxsiy gigiyena · "
      "<b>salomatlik haqida xabar berish</b> · toza va ishlatilgan idishlarni ajratish · idishni to'g'ri ushlash · "
      "<b>issiq idish, ho'l pol, singan shisha</b> · xavf haqida xabar berish.",
      "1 soat nazariya · 1 soat amaliyot", 21, 15)

# ============================ 2. MAQSAD ============================
slide("Maqsad va natijalar", "Maqsad va natijalar",
 kicker("Mavzuning maqsadi") +
 h2("Mashg'ulot yakunida tinglovchi " + G("nima qila oladi?")) +
 defn("Maqsad: tinglovchi <b>taom va mehmon o'rtasidagi oxirgi halqa</b> ekanini tushunadi: qo'l, forma, idish va sirt orqali "
      "ifloslanishning oldini oladi, o'z salomatligi haqida vaqtida xabar beradi va zaldagi uch asosiy xavfga — "
      "<b>issiq idish, ho'l pol, singan shisha</b> — to'g'ri javob qaytaradi.") +
 grid(3,
  card("green", "🧼", "Qo'lni yuvadi", "Qo'lni qachon yuvish shartligini biladi va 6 qadamli usulni to'g'ri namoyish qiladi."),
  card("blue", "👔", "Gigiyenaga rioya qiladi", "Toza forma, kalta tirnoq, yopilgan yara; kasallik belgisi bo'lsa — ishga chiqmasdan xabar beradi."),
  card("violet", "🍽️", "Idishni ajratadi", "Toza va ishlatilgan idishlar yo'lini kesishtirmaydi, stakan va priborni to'g'ri ushlaydi."),
  card("orange", "🔁", "Anjomni almashtiradi", "Yerga tushgan yoki ifloslangan anjomni artib qaytarmaydi — tozasini keltiradi."),
  card("pink", "⚠️", "Xavfni bartaraf etadi", "To'kilgan suyuqlik joyini belgilaydi, singan shishani xavfsiz yig'adi, issiq idish haqida ogohlantiradi."),
  card("cyan", "📣", "Xabar beradi", "Xavf va hodisa haqida mas'ul xodimga qisqa va aniq xabar beradi, qayd qilinishini ta'minlaydi.")))

# ============================ 3. REJA ============================
slide("Reja va tushunchalar", "Reja va tushunchalar",
 kicker("Mashg'ulot rejasi") +
 h2("Bugungi " + G("5 ta blok")) +
 '<div class="grid g5">' +
 card("green", "1️⃣", "Nega muhim", "Oziq-ovqat xavflari va ifloslanish yo'llari.") +
 card("blue", "2️⃣", "Qo'l va shaxsiy gigiyena", "Qachon, qanday yuvish; forma; salomatlik.") +
 card("violet", "3️⃣", "Idish va sirtlar", "Toza va iflos oqim, to'g'ri ushlash, salfetkalar.") +
 card("orange", "4️⃣", "Zaldagi xavflar", "Issiq idish, ho'l pol, singan shisha.") +
 card("pink", "5️⃣", "Xabar va amaliyot", "Mas'ulga yetkazish, tekshiruv varag'i.") +
 '</div>' +
 h3("🔑 Tayanch tushunchalar") +
 pills([("sanitariya", 1), ("gigiyena", 1), ("ifloslanish", 1), ("o'zaro ifloslanish", 1), ("qo'l gigiyenasi", 1), ("antiseptik", 0),
        ("tibbiy ko'rik", 0), ("sanitariya minimumi", 0), ("toza oqim", 1), ("iflos oqim", 1), ("tozalash", 0), ("dezinfeksiya", 0),
        ("xavfli harorat zonasi", 0), ("ogohlantirish belgisi", 1), ("singan shisha", 1), ("birinchi yordam", 0), ("tekshiruv varag'i", 1)]))

# ============================ 4. NEGA MUHIM ============================
slide("Nega gigiyena — ofitsiantning ishi?", "Nega gigiyena — ofitsiantning ishi?",
 kicker("1-blok · Asos") +
 h2("Ofitsiant — taom va mehmon o'rtasidagi " + G("oxirgi halqa")) +
 defn("<b>Sanitariya</b> — taom, idish, xona va xodim tozaligini ta'minlaydigan qoidalar tizimi. <b>Gigiyena</b> — shu qoidalarni har kuni "
      "bajarish odati. Oshpaz taomni to'g'ri pishirgan bo'lsa ham, uni mehmonga <b>siz</b> yetkazasiz: iflos qo'l, stakan cheti yoki "
      "patnis taomni oxirgi soniyada ifloslantirishi mumkin.") +
 '<div class="grid g3" style="margin-top:16px">' +
 card("red", "🌍", "600 million", "Jahon sog'liqni saqlash tashkiloti (JSST) bahosiga ko'ra, har yili dunyoda taxminan <b>600 million</b> kishi — har 10 kishidan biri — ifloslangan oziq-ovqatdan kasallanadi.") +
 card("orange", "👀", "Mikrob ko'rinmaydi", "Toza ko'ringan qo'l — xavfsiz qo'l degani emas. Mikroblarni ko'z bilan ko'rib, hid yoki ta'm bilan sezib bo'lmaydi — faqat <b>tartib</b> himoya qiladi.") +
 card("violet", "🏷", "Bitta holat — butun obro'", "Bitta zaharlanish holati restoranni yopilishgacha olib borishi mumkin. Mehmon «o'sha restoran»ni eslab qoladi, kim aybdorligini emas.") +
 '</div>' +
 table(["Xavf turi", "Nima", "Zalda qayerdan keladi"], [
  ["🦠 <b>Biologik</b>", "Bakteriya, virus, parazit", "Yuvilmagan qo'l, yo'tal, iflos salfetka, uzoq turgan taom"],
  ["🧪 <b>Kimyoviy</b>", "Yuvish va dezinfeksiya vositalari", "Taom yonida turgan sprey, yorliqsiz idish, yaxshi chayilmagan stakan"],
  ["🔩 <b>Fizik</b>", "Shisha, soch, tirnoq, taqinchoq, plastir", "Singan stakan, yig'ilmagan soch, uzuk toshi, ko'chgan lak"],
  ["🥜 <b>Allergen</b>", "Yong'oq, sut, tuxum, kunjut va boshqalar", "Umumiy qoshiq, artilmagan stol, almashgan tarelka — 5-mavzuda"]]) +
 quote("📌 <b>Qoida:</b> ofitsiant taom pishirmaydi, lekin uni <b>buzishi</b> mumkin. Sanitariya — oshxonaning emas, butun jamoaning ishi."))

# ============================ 5. IFLOSLANISH YO'LLARI ============================
slide("Ifloslanish yo'llari", "Ifloslanish yo'llari",
 kicker("1.2 · Qanday o'tadi") +
 h2("Mikrob o'zi yurmaydi — uni " + G("biz tashiymiz")) +
 defn("<b>O'zaro ifloslanish</b> (kross-kontaminatsiya) — mikrob yoki allergenning bir joydan ikkinchisiga <b>qo'l, idish, salfetka yoki sirt</b> "
      "orqali o'tishi. Zaldagi ifloslanishning asosiy sababi — iflos narsaga tegib, keyin toza narsani ushlash.") +
 grid(3,
  card("red", "✋", "Qo'l", "Eng asosiy yo'l. Ishlatilgan tarelka → qo'l → toza stakan. Pul, telefon, eshik tutqichi, yuz va soch ham shu zanjirda."),
  card("orange", "🍽️", "Idish va anjom", "Ishlatilgan va toza idish bitta patnisda. Yerga tushgan vilka. Stakan chetidan ushlangan barmoq."),
  card("blue", "🧽", "Salfetka va sirt", "Bitta latta bilan stol ham, stul ham, patnis ham artiladi — mikrob hamma joyga tarqaladi."),
  card("violet", "🤧", "Havo va tomchi", "Yo'tal va aksirish taom, pribor va mehmon tomonga. Ochiq taom ustida gaplashish."),
  card("green", "👔", "Kiyim", "Fartuk bilan hojatxonaga kirish, qo'lni fartukka artish, ko'chadan forma bilan kelish."),
  card("pink", "🪰", "Zararkunanda", "Pashsha, suvarak, kemiruvchi. Ochiq qolgan chiqindi va taom qoldig'i ularni chaqiradi — ko'rsangiz, darhol xabar bering.")) +
 quote("🔗 <b>Zanjirni uzish</b> oson: iflos ishdan toza ishga o'tishda — <b>qo'lni yuving</b>. Shu bitta odat ko'p muammoning oldini oladi."))

# ============================ 6. QACHON YUVISH ============================
slide("Qo'lni qachon yuvish kerak?", "Qo'lni qachon yuvish kerak?",
 kicker("2-blok · Qo'l gigiyenasi") +
 h2("Qo'l yuviladi: " + G("iflos ishdan keyin, toza ishdan oldin")) +
 grid(2,
  card_ul("green", "⏰", "Albatta yuviladi", [
   "Ish boshlashdan oldin va har tanaffusdan keyin",
   "<b>Hojatxonadan keyin</b> — har doim, istisnosiz",
   "Ishlatilgan idish, chiqindi yoki iflos salfetkadan keyin",
   "Yo'talgan, aksirgan, burun artgandan keyin",
   "Yuz, soch, quloq yoki telefonga tegingandan keyin",
   "Pul yoki to'lov terminalini ushlagandan keyin",
   "Ovqatlangan, ichgan yoki chekkandan keyin",
   "Tozalash vositalari bilan ishlagandan keyin",
   "Yerdan biror narsa olgandan keyin"]),
  card_ul("orange", "🤔", "Ko'p uchraydigan bahonalar", [
   "«Hozirgina yuvgandim» — orasida nimaga tegdingiz?",
   "«Qo'lim toza ko'rinadi» — mikrob ko'rinmaydi",
   "«Vaqt yo'q, zal to'la» — yuvish 1 daqiqa, zaharlanish — haftalar",
   "«Qo'lqop kiyganman» — qo'lqop ham ifloslanadi, almashtiriladi",
   "«Antiseptik surtdim» — kir qo'lda antiseptik yaxshi ishlamaydi"], cls="cross")) +
 quote("🧭 <b>Oddiy mezon:</b> hozir qo'limda nima bo'ldi va keyin nimani ushlayman? Agar keyingisi — <b>toza idish, pribor, non yoki taom</b> bo'lsa, avval qo'l yuviladi."))

# ============================ 7. QANDAY YUVISH ============================
slide("Qo'lni qanday yuvish kerak?", "Qo'lni qanday yuvish kerak?",
 kicker("2.2 · Usul") +
 h2("6 qadam, " + G("kamida 20 soniya ishqalash")) +
 defn("JSST tavsiyasiga ko'ra, sovun bilan qo'l yuvishning butun jarayoni <b>40–60 soniya</b> davom etadi, shundan kamida <b>20 soniyasi</b> — "
      "sovun bilan ishqalash. Tez «suvga tekkizib olish» qo'lni tozalamaydi.") +
 '<div class="grid g3" style="margin-top:16px">' +
 card("blue", "1️⃣", "Ho'llang", "Qo'lni oqar iliq suvda bilakkacha ho'llang.") +
 card("blue", "2️⃣", "Sovun", "Suyuq sovun oling — butun qo'l yuzasini qoplasin.") +
 card("green", "3️⃣", "Ishqalang — 20 soniya", "Kaft, qo'l usti, <b>barmoqlar orasi</b>, bosh barmoq, <b>tirnoq osti</b>, bilak.") +
 card("green", "4️⃣", "Chaying", "Oqar suv ostida sovunni to'liq chaying.") +
 card("orange", "5️⃣", "Quriting", "<b>Bir martalik</b> qog'oz sochiq bilan. Fartuk yoki umumiy sochiq — mumkin emas.") +
 card("orange", "6️⃣", "Jo'mrakni yoping", "Jo'mrakni qo'l bilan emas — <b>qog'oz sochiq</b> bilan yoping.") +
 '</div>' +
 grid(3,
  card("violet", "🧴", "Antiseptik", "Yuvish o'rnini <b>bosmaydi</b>, uni to'ldiradi. Toza va quruq qo'lga surtiladi; ko'rinadigan kir yoki yog' bo'lsa — avval yuviladi."),
  card("pink", "🧤", "Qo'lqop", "Qo'lqop — ikkinchi teri emas. Kiyishdan oldin qo'l yuviladi; ifloslansa, yirtilsa yoki ish turi o'zgarsa — <b>almashtiriladi</b>."),
  card("red", "🚰", "Qayerda yuviladi", "Faqat <b>qo'l yuvish rakovinasida</b>. Idish yuviladigan yoki taom tayyorlanadigan rakovinada qo'l yuvilmaydi."), top=14))

# ============================ 8. SHAXSIY GIGIYENA VA FORMA ============================
slide("Shaxsiy gigiyena va forma", "Shaxsiy gigiyena va forma",
 kicker("2.3 · Xodim") +
 h2("Toza forma — " + G("har smena")) +
 grid(2,
  card_ul("green", "✅", "Qoidalar", [
   "Forma <b>har smenada toza</b>; ko'cha kiyimi va poyabzali alohida saqlanadi",
   "Forma ish joyida kiyiladi — ko'chadan forma bilan kelinmaydi",
   "Soch yig'ilgan; soqol tartibli",
   "Tirnoq kalta, toza — lak va yasama tirnoqsiz",
   "Qo'l va bilakda taqinchoq, soat yo'q (istisnolar restoran tartibida)",
   "Kesik yoki yara — <b>suv o'tkazmaydigan plastir</b> va ustidan <b>qo'lqop</b>",
   "Ovqatlanish, ichish va chekish — faqat ajratilgan joyda"]),
  card_ul("red", "⛔", "Taqiqlanadi", [
   "Fartuk yoki forma bilan <b>hojatxonaga kirish</b>",
   "Qo'lni fartuk yoki shimga artish",
   "Taom, pribor yoki mehmon tomonga yo'talish, aksirish",
   "Zalda soch, yuz, burun, quloqqa teginish",
   "Barmoqni ho'llab menyu yoki chek varaqlash",
   "Saqich chaynash, zalda tatib ko'rish",
   "Ochiq yara bilan taom yoki idish ushlash"], cls="cross")) +
 grid(3,
  card("blue", "🤧", "Yo'tal va aksirish", "Mehmon va taomdan <b>teskari burilib</b>, bir martalik salfetkaga yoki tirsak bukilmasiga. Keyin — qo'l yuviladi."),
  card("orange", "🩹", "Plastir nega rangli?", "Oshxonada ko'pincha <b>ko'k</b> plastir ishlatiladi: u taomga tushsa, darhol ko'rinadi. Plastir ko'chsa — xabar bering."),
  card("violet", "🚪", "Hojatxonadan keyin", "Fartuk yechib kiriladi, chiqishda qo'l yuviladi, zalga qaytishdan oldin fartuk qayta taqiladi."), top=14))

# ============================ 9. SALOMATLIK HAQIDA XABAR ============================
slide("Salomatlik haqida xabar berish", "Salomatlik haqida xabar berish",
 kicker("2.4 · Xodim salomatligi") +
 h2("Kasalmisiz? " + G("Ishga chiqishdan oldin ayting")) +
 defn("Kasal xodim taomga tegmasa ham, idish, pribor va qo'l orqali <b>o'nlab mehmonga</b> infeksiya yuqtirishi mumkin. Shuning uchun "
      "belgilar haqida <b>smenagacha</b> mas'ul xodimga xabar berish — majburiyat. Yashirib ishlash — hamkasb va mehmonlarni xavfga qo'yish.") +
 grid(2,
  card_ul("red", "🚨", "Bu belgilar bo'lsa — darhol xabar bering", [
   "Ich ketishi yoki qusish",
   "Isitma, isitma bilan tomoq og'rig'i",
   "Teri yoki ko'z oqining sarg'ayishi",
   "Qo'l va bilakdagi yiringli yara, chipqon",
   "Kuchli yo'tal, tumov, ko'zdan oqish",
   "Oila a'zosida yuqumli ichak kasalligi aniqlangan bo'lsa"], cls="clean"),
  card_ul("green", "✅", "Mas'ul nima qiladi", [
   "Ishdan chetlatadi yoki taom va idishga aloqasi yo'q ishga o'tkazadi",
   "Kerak bo'lsa shifokorga yuboradi",
   "Ishga qaytish muddatini <b>shifokor va restoran tartibi</b> belgilaydi",
   "Xalqaro amaliyotda ich ketishi va qusishdan keyin belgilar to'xtagach yana <b>48 soat</b> kutiladi",
   "Xabar bergan xodim jazolanmaydi — yashirgan javobgar bo'ladi"], cls="clean")) +
 grid(2,
  card("blue", "📋", "Tibbiy ko'rik", "Umumiy ovqatlanish xodimlari ishga kirishda va keyin belgilangan muddatlarda <b>tibbiy ko'rikdan</b> o'tadi. Ko'rik natijalari tibbiy daftarchada qayd etiladi."),
  card("violet", "🎓", "Sanitariya minimumi", "Xodimlar <b>gigiyenik o'qitish</b>dan (sanitariya minimumi) o'tadi va bilimi tekshiriladi. Bu mavzu — o'sha bilimning zal xodimi uchun amaliy qismi."), top=14) +
 quote("⚖️ Aniq muddat va tartib <b>amaldagi sanitariya qoidalari</b> hamda restoranning ichki tartibida belgilanadi — brifingda aniqlab oling."))

# ============================ 10. TOZA VA ISHLATILGAN IDISH ============================
slide("Toza va ishlatilgan idishlar", "Toza va ishlatilgan idishlar",
 kicker("3-blok · Idish") +
 h2("Ikki oqim: " + G("toza") + " va " + G("ishlatilgan") + " — kesishmaydi") +
 defn("Zalda idishning ikki yo'li bor: <b>toza oqim</b> (oshxona va servis stansiyasidan mehmon stoliga) va <b>iflos oqim</b> "
      "(mehmon stolidan idish yuvish bo'limiga). Bu ikki yo'l — patnisda ham, stansiyada ham, qo'lingizda ham — <b>kesishmasligi</b> kerak.") +
 grid(2,
  card_ul("green", "✅", "To'g'ri", [
   "Toza va ishlatilgan idish uchun <b>alohida patnis</b>",
   "Servis stansiyasida toza idish — yuqorida va yopiq, ishlatilgani — alohida joyda",
   "Ishlatilgan idish yig'ilgach — qo'l yuviladi yoki antiseptik, keyin toza idish",
   "Taom qoldig'i idish yuvish bo'limida, belgilangan idishga tashlanadi",
   "Toza priborlar dastasi yuqoriga qarab saqlanadi va salfetkada olib boriladi"], cls="clean"),
  card_ul("red", "⛔", "Noto'g'ri", [
   "Bitta patnisda ishlatilgan tarelka va toza stakan",
   "Ishlatilgan idishni yig'ib, shu qo'l bilan non savatini uzatish",
   "Qoldiqni mehmon ko'z oldida, zalda bir tarelkadan ikkinchisiga sidirish",
   "Ishlatilgan idishni toza idishlar javoniga «bir daqiqaga» qo'yish",
   "Mehmon tegmagan nonni keyingi stolga berish"], cls="cross")) +
 grid(3,
  card("orange", "🥖", "Qaytgan taom", "Stoldan qaytgan non, sous, limon, sariyog' — mehmon tegmagan ko'rinsa ham — <b>boshqa mehmonga berilmaydi</b>."),
  card("blue", "🧊", "Muz va ichimlik", "Muz faqat <b>kurakcha yoki qisqich</b> bilan olinadi — qo'l yoki stakan bilan emas. Kurakcha muz ichida qoldirilmaydi."),
  card("violet", "🕐", "Kutib qolgan taom", "Tayyor taom uzatish oynasida turmasin: issiq taom — <b>issiq</b>, sovuq taom — <b>sovuq</b> yetkaziladi. Xona haroratida jami 2 soatdan ortiq turgan taom uzatilmaydi."), top=14))

# ============================ 11. IDISHNI TO'G'RI USHLASH ============================
slide("Idish va anjomni to'g'ri ushlash", "Idish va anjomni to'g'ri ushlash",
 kicker("3.2 · Qo'l qayerga tegadi") +
 h2("Mehmon og'ziga tegadigan joyga " + G("qo'l tegmaydi")) +
 table(["Buyum", "✅ To'g'ri ushlash", "⛔ Noto'g'ri"], [
  ["🥛 <b>Stakan</b>", "Pastki uchdan bir qismidan yoki tagidan", "Chetidan, ichiga barmoq solib, bir qo'lda «guldasta» qilib"],
  ["🍷 <b>Qadah</b>", "Oyoqchasidan", "Kosachasidan yoki chetidan"],
  ["🍽️ <b>Tarelka</b>", "Chetidan, bosh barmoq chet ustida yotadi", "Bosh barmoq taom tomonga kirib turadi"],
  ["🍴 <b>Pribor</b>", "Faqat dastasidan, salfetka yoki tarelkada", "Tishlari, tig'i yoki qoshiq kosasidan"],
  ["☕ <b>Piyola, chashka</b>", "Tagidan yoki dastasidan", "Chetidan, barmoq ichkarida"],
  ["🥖 <b>Non, limon, muz</b>", "Qisqich, kurakcha yoki qo'lqop bilan", "Yalang qo'l bilan"],
  ["🧻 <b>Salfetka</b>", "Toza qo'l bilan, chetidan", "Fartuk cho'ntagidan g'ijim holda"]]) +
 grid(3,
  card("red", "⬇️", "Yerga tushdi", "Yerga tushgan pribor, salfetka yoki non <b>artib qaytarilmaydi</b>. Tushganini iflos idishlar joyiga olib boring, qo'lni yuving, <b>tozasini</b> keltiring."),
  card("orange", "🔍", "Uzatishdan oldin qarang", "Stakanda lab bo'yog'i izi, tarelka chetida dog', priborda suv dog'i bormi? Shubha bo'lsa — almashtiring, mehmon payqashini kutmang."),
  card("green", "🧺", "Qo'l salfetkasi (ruchnik)", "Faqat issiq idishni ushlash va patnis uchun. U bilan yuz, qo'l, stol yoki priborni artish mumkin emas; ifloslansa — almashtiriladi."), top=14))

# ============================ 12. SIRTLAR VA SALFETKALAR ============================
slide("Sirtlar va salfetkalar", "Sirtlar va salfetkalar",
 kicker("3.3 · Tozalash") +
 h2(G("Tozalash") + " va " + G("dezinfeksiya") + " — ikki xil ish") +
 defn("<b>Tozalash</b> — ko'rinadigan kir, yog' va qoldiqni olib tashlash. <b>Dezinfeksiya</b> — toza sirtdagi mikroblar sonini xavfsiz "
      "darajagacha kamaytirish. Tartib doim bir xil: <b>avval tozalash, keyin dezinfeksiya</b> — kir ustidan sepilgan vosita ishlamaydi.") +
 grid(3,
  card("green", "🎨", "Har ishga — o'z salfetkasi", "Stol, stul, patnis va hojatxona uchun <b>alohida</b> salfetka (ko'p restoranlarda rang bo'yicha ajratiladi). Bitta latta — bitta vazifa."),
  card("blue", "🪑", "Stolni tayyorlash", "Mehmon ketgach: idish yig'iladi → qoldiq supuriladi → stol tozalanadi → dezinfeksiya → quritiladi → yangi servirovka. Ho'l stolga pribor qo'yilmaydi."),
  card("orange", "👆", "Ko'p tegiladigan joylar", "Menyu, tuzdon va murchdon, to'lov terminali, stul suyanchig'i, eshik tutqichi, bolalar stuli — muntazam artiladi.")) +
 grid(2,
  card_ul("red", "🧪", "Kimyoviy vositalar", [
   "Faqat <b>yorliqli</b> idishda saqlanadi — ichimlik shishasiga quyilmaydi",
   "Taom, idish va muzdan alohida, pastki javonda turadi",
   "Mehmon o'tirgan stol yonida va ochiq taom ustida sepilmaydi",
   "Ikki xil vosita aralashtirilmaydi",
   "Ishlatgandan keyin qo'l yuviladi"], cls="clean"),
  card_ul("violet", "🗑", "Chiqindi", [
   "Chiqindi idishi qopqoqli, oyoq pedali bilan ochiladi",
   "To'lmasdan oldin bo'shatiladi — toshib turmasin",
   "Chiqindi olib chiqilgach, qo'l yuviladi",
   "Chiqindi qopi zal orqali, mehmonlar orasidan olib o'tilmaydi",
   "Zararkunanda izi (pashsha, suvarak) ko'rinsa — xabar beriladi"], cls="clean"), top=14))

# ============================ 13. ZALDAGI XAVFLAR ============================
slide("Zaldagi xavflar", "Zaldagi xavflar",
 kicker("4-blok · Xavfsizlik") +
 h2("Uch asosiy xavf: " + G("issiq, sirpanchiq, o'tkir")) +
 defn("Zaldagi jarohatlarning ko'pchiligi uchta sababdan kelib chiqadi: <b>kuyish</b> (issiq idish va suyuqlik), <b>yiqilish</b> (ho'l pol, "
      "to'siq) va <b>kesilish</b> (singan shisha, pichoq). Uchalasining ham oldini olish mumkin — agar xavfni <b>birinchi ko'rgan odam</b> harakat qilsa.") +
 grid(3,
  card("red", "🔥", "Issiq idish", "Issiq tarelka, sho'rva, choynak, qahva. Kuyish — ofitsiant va mehmon uchun eng ko'p uchraydigan jarohat."),
  card("blue", "💧", "Ho'l pol", "To'kilgan ichimlik, yog', muz bo'lagi, yuvilgan pol. Yiqilish — eng og'ir oqibatli hodisalardan."),
  card("violet", "🥂", "Singan shisha", "Stakan, tarelka, shisha. Bo'laklar taomga, muzga va poyabzalga tushadi.")) +
 grid(2,
  card_ul("green", "🧠", "Xavfsiz harakat odatlari", [
   "Zalda <b>yugurilmaydi</b> — tez, lekin xotirjam yuriladi",
   "Eshikdan o'tishda «kirish» va «chiqish» tomoni saqlanadi",
   "Burchakda va hamkasb ortida ovoz bering: <b>«Orqangizdaman!»</b>",
   "Patnis ko'rishni to'smaydigan balandlikda, og'ir buyum markazda",
   "O'tish yo'lida sumka, stul, sim, quti qoldirilmaydi"], cls="clean"),
  card_ul("orange", "👟", "Tayyorgarlik", [
   "Yopiq, sirpanmaydigan poyabzal — bog'ichi bog'langan",
   "Ko'tara oladiganingizdan ortiq yuk olmang — ikki marta boring",
   "Og'ir buyumni tizzani bukib, belni tik tutib ko'taring",
   "Birinchi yordam qutisi va o't o'chirgich qayerdaligini biling",
   "Evakuatsiya chiqishlari doim ochiq va to'silmagan bo'lsin"], cls="clean"), top=14))

# ============================ 14. ISSIQ IDISH ============================
slide("Xavf: issiq idish va suyuqlik", "Xavf: issiq idish va suyuqlik",
 kicker("4.1 · Kuyish") +
 h2("Avval " + G("ogohlantiring") + ", keyin uzating") +
 grid(2,
  card_ul("green", "✅", "Xavfsiz uzatish", [
   "Issiq idish <b>quruq</b> qo'l salfetkasi bilan ushlanadi — ho'l mato issiqlikni o'tkazadi",
   "Mehmonga oldindan ayting: <b>«Ehtiyot bo'ling, tarelka issiq»</b>",
   "Issiq taom mehmon <b>ustidan</b> emas, yonidan uzatiladi",
   "Bolaning qo'li yetadigan joyga issiq idish qo'yilmaydi",
   "Sho'rva va choy to'ldirib quyilmaydi — chetidan 1–1,5 sm bo'sh qoladi",
   "Choynak va qahva idishi patnis markazida, tumshug'i ichkariga qarab"], cls="clean"),
  card_ul("red", "⛔", "Xatolar", [
   "Issiq tarelkani yalang qo'l bilan «tez yetkazib qo'yaman» deb olib borish",
   "Ogohlantirmasdan mehmon oldiga qo'yish",
   "Mehmonlar boshi ustidan patnis o'tkazish",
   "Bolali stolda issiq choyni chetga qo'yish",
   "Oshxona eshigidan ogohlantirishsiz, orqa bilan chiqish"], cls="cross")) +
 grid(3,
  card("blue", "🚿", "Kuyganda", "Kuygan joyni darhol <b>oqar sovuq suv</b> ostida kamida 10–20 daqiqa ushlang. Uzuk va soatni shish boshlanmasdan yeching."),
  card("orange", "🚫", "Nima qilinmaydi", "Muz, yog', qatiq, tish pastasi <b>surtilmaydi</b>. Pufakcha yorilmaydi. Yopishgan kiyim yulib olinmaydi."),
  card("red", "📣", "Xabar bering", "Mehmon kuysa — yonida qoling, mas'ulni chaqiring. Kuyish katta yoki yuzda bo'lsa — tez yordam: <b>103</b>."), top=14))

# ============================ 15. HO'L POL ============================
slide("Xavf: ho'l pol", "Xavf: ho'l pol",
 kicker("4.2 · Yiqilish") +
 h2("To'kildimi? " + G("Tashlab ketmang")) +
 defn("To'kilgan suyuqlik ustidan kimdir o'tishi uchun <b>bir necha soniya</b> yetarli. Shuning uchun asosiy qoida: xavfni ko'rgan odam joyni "
      "<b>tashlab ketmaydi</b> — latta olib kelishga ketgan paytingizda kimdir yiqilishi mumkin.") +
 '<div class="grid g5" style="margin-top:16px">' +
 card("red", "1️⃣", "To'xtang", "Joyda qoling yoki hamkasbni qoldiring.") +
 card("orange", "2️⃣", "Belgilang", "«Ehtiyot bo'ling, ho'l pol» belgisi yoki stul.") +
 card("blue", "3️⃣", "Ogohlantiring", "Yaqin mehmon va hamkasblarga ayting.") +
 card("green", "4️⃣", "Tozalang", "Polni quruq holatgacha arting.") +
 card("violet", "5️⃣", "Xabar bering", "Mas'ulga ayting; belgini pol qurigach oling.") +
 '</div>' +
 grid(3,
  card("orange", "🛢", "Yog' va sous", "Suv bilan artilsa, yoyilib ketadi. Avval qog'oz sochiq bilan shimdiriladi, keyin yog'ni ketkazadigan vosita bilan yuviladi."),
  card("blue", "🧊", "Muz va meva bo'lagi", "Kichkina ko'rinadi, lekin eng sirpanchiq. Ko'rgan zahoti olinadi — «keyin» degan gap yo'q."),
  card("violet", "🌧", "Kirish eshigi", "Yomg'ir va qorda eshik oldi doim ho'l: gilamcha, belgi va tez-tez artish. Soyabon uchun alohida joy."), top=14) +
 quote("⚠️ Belgi qo'yish — tozalash o'rnini <b>bosmaydi</b>. Belgi faqat tozalab bo'lguningizcha odamlarni himoya qiladi."))

# ============================ 16. SINGAN SHISHA ============================
slide("Xavf: singan shisha", "Xavf: singan shisha",
 kicker("4.3 · Kesilish") +
 h2("Shisha sinsa — " + G("qo'l bilan yig'ilmaydi")) +
 grid(2,
  card_ul("green", "✅", "Harakat tartibi", [
   "<b>To'xtating:</b> joyni to'sing, mehmonlarni ogohlantiring — «Iltimos, shu yerdan o'tmang»",
   "Yirik bo'laklarni <b>supurgi va xokandoz</b> bilan yig'ing",
   "Mayda zarralarni <b>nam qog'oz sochiq</b> bilan arting — ular ko'rinmaydi",
   "Hammasini <b>alohida mustahkam idishga</b> («singan shisha») soling",
   "Stol ustida singan bo'lsa — dasturxon va salfetkalar almashtiriladi",
   "Mas'ulga xabar bering; hodisa qayd qilinadi"], cls="clean"),
  card_ul("red", "⛔", "Bunday qilinmaydi", [
   "Bo'laklarni yalang qo'l bilan terish",
   "Oddiy chiqindi qopiga tashlash — qopni ko'targan odam kesiladi",
   "Bo'laklarni salfetkaga o'rab cho'ntakka solish",
   "Faqat ko'ringan yirik bo'laklarni olib, artmasdan ketish",
   "Yaqindagi ochiq taomni «tegmagan bo'lsa kerak» deb qoldirish"], cls="cross")) +
 grid(3,
  card("red", "🧊", "Muz va taom yonida", "Shisha <b>muz idishi, ochiq taom yoki ichimlik</b> yonida sinsa — ularning <b>hammasi tashlanadi</b>. Shisha zarrasini muz ichidan topib bo'lmaydi."),
  card("orange", "🥛", "Darz ketgan idish", "Cheti uchgan yoki darz ketgan stakan va tarelka <b>ishlatilmaydi</b> — darhol olib qo'yiladi va mas'ulga beriladi."),
  card("blue", "🩹", "Kesilganda", "Qon ketayotgan joyni toza salfetka bilan bosing, mas'ulga ayting. Yara yopilmaguncha taom va idishga tegilmaydi; qon tekkan sirt dezinfeksiya qilinadi."), top=14))

# ============================ 17. XABAR BERISH ============================
slide("Xavf haqida xabar berish", "Xavf haqida xabar berish",
 kicker("5-blok · Xabar") +
 h2(G("Ko'rdim — to'xtatdim — belgiladim — xabar berdim")) +
 defn("Xavfni bartaraf etishning o'zi yetarli emas: <b>mas'ul xodim bilishi</b> kerak. Shunda sabab topiladi (oqayotgan muzlatkich, "
      "siniq plitka), hodisa qayd qilinadi va keyingi smena ogohlantiriladi.") +
 '<div class="grid g4" style="margin-top:16px">' +
 card("blue", "👀", "1. Ko'rdim", "Xavfni payqadim — yonidan o'tib ketmayman.") +
 card("red", "✋", "2. To'xtatdim", "Odamlarni ogohlantirdim, joyni to'sdim.") +
 card("orange", "⚠️", "3. Belgiladim", "Belgi qo'ydim yoki xavfni olib tashladim.") +
 card("green", "📣", "4. Xabar berdim", "Mas'ulga aytdim: qayerda, nima, kimga zarar.") +
 '</div>' +
 table(["Vaziyat", "🟢 O'zim bajaraman", "🔺 Darhol mas'ulga"], [
  ["Ichimlik to'kildi", "Belgi, artish", "Sabab takrorlansa (masalan, oqayotgan uskuna)"],
  ["Stakan sindi", "To'sish, yig'ish, alohida idish", "Mehmon yoki xodim kesilgan bo'lsa"],
  ["Mehmon kuydi yoki yiqildi", "Yonida qolaman, yordam chaqiraman", "<b>Har doim</b> — hodisa qayd qilinadi"],
  ["Gaz hidi, tutun, uchqun", "Hech narsani yoqmayman va o'chirmayman", "<b>Darhol</b>; yong'in — 101, gaz — 104"],
  ["Zararkunanda izi", "Joyni eslab qolaman", "Smena oxirini kutmasdan"],
  ["O'zimda kasallik belgisi", "Ishni to'xtataman", "Smenagacha yoki belgi paydo bo'lishi bilan"]]) +
 quote("📞 <b>Favqulodda raqamlar:</b> 101 — yong'in, 103 — tez yordam, 104 — gaz xizmati, 112 — yagona qutqaruv raqami. Restoran manzilini aniq aytishni biling."))

# ============================ 18. AMALIY MASHQ ============================
slide("Amaliy mashq", "Amaliy mashq",
 kicker("Amaliyot · 1 soat") +
 h2("Uch stansiya: " + G("qo'l, anjom, pol")) +
 defn("Guruh uch stansiya bo'ylab aylanadi. Har stansiyada bir tinglovchi bajaradi, sherigi <b>tekshiruv varag'ini</b> to'ldiradi, "
      "keyin rollar almashadi. Trener har stansiyani avval o'zi namoyish qiladi.") +
 grid(3,
  card_ul("blue", "🧼", "1-stansiya · Qo'l yuvish", [
   "6 qadamni ovoz chiqarib aytib bajaradi",
   "Ishqalash kamida 20 soniya",
   "Barmoqlar orasi, bosh barmoq, tirnoq osti",
   "Qog'oz sochiq, jo'mrakni sochiq bilan yopish"], cls="clean"),
  card_ul("orange", "🍴", "2-stansiya · Anjom", [
   "Xizmat paytida vilka yerga tushadi",
   "Tushgan vilkani iflos idishlar joyiga olib boradi",
   "Qo'lni yuvadi yoki antiseptik ishlatadi",
   "Toza vilkani dastasidan, salfetkada keltiradi"], cls="clean"),
  card_ul("green", "💧", "3-stansiya · To'kilgan suv", [
   "O'tish yo'lida suv to'kilgan",
   "Joyni tashlab ketmaydi, belgi qo'yadi",
   "Quruq holatgacha artadi",
   "Mas'ulga xabar beradi: qayerda, nima"], cls="clean")) +
 table(["Tekshiruv varag'i mezoni", "Kuzatiladigan harakat", "Ha / Yo'q"], [
  ["<b>Qo'l gigiyenasi</b>", "6 qadam to'liq, ishqalash 20 soniyadan kam emas", "☐"],
  ["<b>Toza anjom</b>", "Tushgan anjomni qaytarmadi, tozasini dastasidan keltirdi", "☐"],
  ["<b>Iflos va toza oqim</b>", "Iflos anjomdan keyin qo'lni tozaladi", "☐"],
  ["<b>Xavfni belgilash</b>", "Joyni tashlab ketmadi, belgi qo'ydi, ogohlantirdi", "☐"],
  ["<b>Xabar berish</b>", "Mas'ulga qayerda va nima bo'lganini aytdi", "☐"]]) +
 quote("📄 <b>Natija dalili:</b> gigiyena va xavfga javob bo'yicha tekshiruv varag'i to'ldiriladi. Bu mashq yakuniy imtihonga kirish sharti hisoblanadi."))

# ============================ 19. VIDEO ============================
video_slide(2, "toza qo'l va xavfsiz zal", "3", [
 ("blue", "🧼", "1. Qo'l yuvish", "Videoda qo'l yuvishning nechta qadami ko'rsatildi? Qaysi qadam eng ko'p unutiladi?"),
 ("orange", "🍴", "2. Tushgan pribor", "Ofitsiant yerga tushgan vilka bilan nima qildi? Nega artib qaytarmadi?"),
 ("green", "⚠️", "3. Xavf", "Suv to'kilganda va stakan singanda birinchi harakat nima bo'ldi?")])

# ============================ 20. XULOSA ============================
slide("Xulosa", "Xulosa",
 kicker("Yakun") +
 h2("Esda qoladigan " + G("6 ta qoida")) +
 grid(3,
  card("blue", "🧼", "20 soniya", "Iflos ishdan keyin, toza ishdan oldin — sovun bilan kamida 20 soniya ishqalab yuving."),
  card("red", "🤒", "Kasalmisiz — ayting", "Ich ketishi, qusish, isitma, yiringli yara — ishga chiqishdan oldin xabar bering."),
  card("violet", "🍽️", "Ikki oqim", "Toza va ishlatilgan idish — alohida patnis, alohida joy, orasida toza qo'l."),
  card("orange", "🔁", "Tushdimi — almashtiring", "Yerga tushgan narsa artib qaytarilmaydi. Og'izga tegadigan joyga qo'l tegmaydi."),
  card("green", "⚠️", "Tashlab ketmang", "Ho'l pol va singan shisha: to'xtating, belgilang, tozalang, xabar bering."),
  card("pink", "🔥", "Ogohlantiring", "Issiq idish — quruq salfetka bilan va «Ehtiyot bo'ling, issiq» deb.")) +
 '<div class="grid g2" style="margin-top:16px">' +
 card_ul("green", "📚", "Mustahkamlash uchun", [
  "Uyda qo'l yuvishni sekundomer bilan bajarib ko'ring — 20 soniya qancha ekanini his qiling",
  "Ish joyingizda aniqlang: qo'l yuvish rakovinasi, ogohlantirish belgisi, singan shisha idishi, birinchi yordam qutisi qayerda",
  "Restoraningizda kasallik haqida kimga va qanday xabar berilishini bilib oling"], cls="clean") +
 card("blue", "➡️", "Keyingi mavzu", "<b>3-mavzu. Stol servirovkasi va taom uzatish:</b> idish, qadah va anjomlarni menyuga mos joylashtirish, patnisni muvozanatlash, issiq taomni uzatish va stolni yig'ishtirish.") +
 '</div>')

# ============================ 21. TEST ============================
test_slide(15, "Keyingi mashg'ulotgacha ish joyingizdagi <b>qo'l yuvish joyi, ogohlantirish belgisi va birinchi yordam qutisi</b> qayerdaligini aniqlab keling.")

# ============================ TEST SAVOLLARI ============================
# SV — 4 variantli savol (uzunligi teng, to'g'ri javob raqami), SO — ochiq savol (bitta so'z yoki son)
Q = [
 SV("Siz stoldan ishlatilgan tarelkalarni yig'dingiz. Keyingi ishingiz — toza qadahlarni olib borish. Avval nima qilasiz?",
    ["Qo'limni sovun bilan yuvaman yoki antiseptik ishlataman",
     "Qo'limni fartugimga artib, darhol qadahlarni olaman",
     "Hech narsa qilmayman, chunki tarelkaga taom tegmagan",
     "Qadahlarni o'sha patnisga tarelkalar yoniga qo'yaman"], 0,
    "Iflos ishdan toza ishga o'tishda qo'l tozalanadi. Toza va ishlatilgan idish bitta patnisda olib yurilmaydi."),
 SO("Qo'l yuvishda sovun bilan kamida necha soniya ishqalash kerak? <i>(faqat son)</i>",
    ["20", "20 soniya", "yigirma", "20s"],
    "Butun jarayon 40–60 soniya, shundan kamida 20 soniyasi — sovun bilan ishqalash (JSST tavsiyasi)."),
 SV("Antiseptik haqidagi qaysi fikr to'g'ri?",
    ["U yuvish o'rnini bosmaydi: kir qo'l avval yuviladi",
     "U sovundan kuchli, shuning uchun yuvish shart emas",
     "Uni ho'l qo'lga surtsa, ta'siri yanada kuchayadi",
     "Bir marta surtilsa, butun smenaga yetarli bo'ladi"], 0,
    "Antiseptik toza va quruq qo'lda ishlaydi. Ko'rinadigan kir yoki yog' bo'lsa — avval sovun bilan yuviladi."),
 SV("Ertalab sizda ich ketishi va qusish boshlandi, bugun smenangiz bor. To'g'ri harakat qaysi?",
    ["Ishga chiqmasdan oldin mas'ul xodimga xabar beraman",
     "Dori ichib ishga chiqaman, hech kimga aytmayman",
     "Ishga chiqaman, lekin faqat ichimliklarni tashiyman",
     "Smenaning yarmigacha ishlab, keyin javob so'rayman"], 0,
    "Bu belgilar bilan ishlash mehmon va hamkasblarga xavf. Xabar smenagacha beriladi; qaytish muddatini shifokor va restoran tartibi belgilaydi."),
 SO("Qo'ldagi kichik kesik suv o'tkazmaydigan plastir bilan yopiladi. Uning ustidan nima kiyiladi? <i>(bitta so'z)</i>",
    ["qo'lqop", "qolqop", "qo‘lqop", "qo'lqoplar", "perchatka", "bir martalik qo'lqop"],
    "Plastir ko'chib taomga tushmasligi va yara idishga tegmasligi uchun ustidan qo'lqop kiyiladi."),
 SV("Suv solingan stakanni mehmonga uzatishda uni qayeridan ushlash kerak?",
    ["Pastki qismidan — lab tegadigan chetiga tegmasdan",
     "Yuqori chetidan — shunda stakan qo'ldan tushmaydi",
     "Ichiga barmoq solib — bir qo'lda to'rttasini olib",
     "Kaft bilan ustidan yopib — ichiga chang tushmaydi"], 0,
    "Mehmon og'ziga tegadigan joyga qo'l tegmaydi: stakan — pastidan, qadah — oyoqchasidan, pribor — dastasidan."),
 SV("Xizmat paytida vilka yerga tushdi. To'g'ri harakat qaysi?",
    ["Uni olib ketaman, qo'limni tozalab, yangisini keltiraman",
     "Toza salfetka bilan artib, mehmonga qaytarib beraman",
     "Fartugimga yaxshilab artaman va joyiga qaytarib qo'yaman",
     "Mehmon o'zi so'ramaguncha uni stol ostida qoldiraman"], 0,
    "Yerga tushgan anjom artib qaytarilmaydi. Tushgani iflos idishlar joyiga boradi, qo'l tozalanadi, tozasi dastasidan keltiriladi."),
 SV("O'zaro ifloslanish (kross-kontaminatsiya) nima?",
    ["Mikrob yoki allergenning bir joydan boshqasiga o'tishi",
     "Idishlarni yuvish mashinasida ikki marta yuvish usuli",
     "Bitta taomga ikki xil sousni birga aralashtirib berish",
     "Xodimlarning smena davomida o'zaro vazifa almashishi"], 0,
    "Mikrob va allergen qo'l, idish, salfetka va sirt orqali o'tadi. Zanjirni uzadigan asosiy odat — qo'l yuvish."),
 SV("O'tish yo'lida ichimlik to'kilganini ko'rdingiz. Birinchi harakatingiz qaysi?",
    ["Joyni tashlab ketmay, belgi qo'yaman va ogohlantiraman",
     "Latta olib kelish uchun darhol oshxonaga yuguraman",
     "Smena tugagach farroshga aytish uchun eslab qolaman",
     "Mehmonlar o'zi ko'radi deb, ishimni davom ettiraman"], 0,
    "Latta olib kelguningizcha kimdir yiqilishi mumkin. Avval joy belgilanadi va odamlar ogohlantiriladi, keyin tozalanadi."),
 SV("Bar yonida stakan sindi, bo'laklar ochiq muz idishi yoniga sochildi. Muz bilan nima qilinadi?",
    ["Idishdagi muzning hammasi tashlanadi va yangisi solinadi",
     "Ustki qatlami olib tashlanadi, qolgani ishlatilaveradi",
     "Muz ko'zdan kechiriladi, shisha ko'rinmasa ishlatiladi",
     "Muz suvda chayib olinadi va qaytadan idishga solinadi"], 0,
    "Shisha zarrasini muz ichidan ko'rib bo'lmaydi. Singan shisha yonidagi ochiq muz, taom va ichimlik to'liq almashtiriladi."),
 SV("Singan stakan bo'laklari qanday yig'iladi?",
    ["Supurgi va xokandoz bilan, maydasi nam qog'oz sochiqda",
     "Qo'l bilan terib olib, oddiy chiqindi qopiga tashlanadi",
     "Salfetkaga o'rab, vaqtincha fartuk cho'ntagiga solinadi",
     "Yirik bo'laklari olinadi, maydasi esa keyin supuriladi"], 0,
    "Shisha qo'l bilan yig'ilmaydi va oddiy qopga tashlanmaydi: bo'laklar alohida mustahkam idishga solinadi."),
 SV("Oshxonadan juda issiq tarelka chiqdi. Uni mehmonga qanday uzatasiz?",
    ["Quruq salfetka bilan ushlab, «Ehtiyot bo'ling, issiq» deyman",
     "Ho'l salfetka bilan ushlab, tezroq stolga qo'yib ketaman",
     "Yalang qo'l bilan olib, tez yugurib borib stolga qo'yaman",
     "Mehmonning yelkasi ustidan indamasdan uning oldiga qo'yaman"], 0,
    "Ho'l mato issiqlikni o'tkazadi. Issiq idish quruq salfetkada, mehmon yonidan va albatta ogohlantirib uzatiladi."),
 SO("Tez tibbiy yordam chaqirish uchun qaysi raqam teriladi? <i>(faqat son)</i>",
    ["103", "112"],
    "103 — tez yordam, 101 — yong'in, 104 — gaz xizmati, 112 — yagona qutqaruv raqami."),
 SV("Stoldan mehmon tegmagandek ko'ringan non savati qaytdi. U bilan nima qilinadi?",
    ["Boshqa mehmonga berilmaydi — iflos oqimga ketadi",
     "Keyingi stolga beriladi, chunki unga tegilmagan",
     "Ustiga salfetka yopib, kechki smenaga saqlanadi",
     "Yangi non bilan aralashtirib, savat to'ldiriladi"], 0,
    "Stoldan qaytgan non, sous, limon — tegilmagan ko'rinsa ham — boshqa mehmonga berilmaydi."),
 SO("Tayyor taom xona haroratida jami ko'pi bilan necha soat turishi mumkin? <i>(faqat son)</i>",
    ["2", "2 soat", "ikki", "ikki soat"],
    "Xavfli harorat zonasida (taxminan 5–60 °C) mikroblar tez ko'payadi. Jami 2 soatdan ortiq turgan taom uzatilmaydi."),
]
