# -*- coding: utf-8 -*-
"""M10 · Savdo jarayonini tashkil etish va mijozlar bilan ishlash — slaydlar va test (yangi_mavzu.py uchun).
T, d, slide — yangi_mavzu.py beradi.  Ishlatish:
  python3 _reyting-manba/yangi_mavzu.py _reyting-manba/matn/mavzu_10_matn.py mavzu-10.html "Savdo jarayonini tashkil etish va mijozlar bilan ishlash" 10
"""

def E(tag, uz, en, attr=""):
    """Tarjimaga tayyor element: <tag data-i=N attr>uz</tag>"""
    return "<" + tag + " " + d(uz, en) + ((" " + attr) if attr else "") + ">" + uz + "</" + tag + ">"

def card(color, icon, uz_t, en_t, uz_p, en_p, style=""):
    return ('<div class="card" style="--c:var(--' + color + ');' + style + '">' +
            (('<span class="icon">' + icon + '</span>') if icon else "") +
            E("h3", uz_t, en_t) + E("p", uz_p, en_p) + '</div>')

def card_ul(color, icon, uz_t, en_t, items, cls="tick", style=""):
    """items: [(uz, en), ...]"""
    return ('<div class="card" style="--c:var(--' + color + ');' + style + '">' +
            (('<span class="icon">' + icon + '</span>') if icon else "") + E("h3", uz_t, en_t) +
            '<ul class="' + cls + '">' + "".join(E("li", u, e) for u, e in items) + '</ul></div>')

def TD(uz, en, cls=""):
    return E("td", uz, en, ('class="' + cls + '"') if cls else "")

def table(heads, rows):
    """heads: [(uz, en)], rows: [[TD(...), ...]]"""
    head = ('<thead><tr>' + "".join(E("th", u, e) for u, e in heads) + '</tr></thead>') if heads else ''
    return ('<div class="tw"><table>' + head + '<tbody>' +
            "".join("<tr>" + "".join(r) + "</tr>" for r in rows) + '</tbody></table></div>')

def stat(num, uz, en, cls=""):
    return '<div class="stat ' + cls + '"><div class="num">' + num + '</div>' + E("p", uz, en) + '</div>'


# ============================ 1. MUQOVA ============================
slide("Muqova", "Cover",
 '<div class="inner title-wrap">'
 '<div class="big-logo terdu-logo" role="img" aria-label="Termiz davlat universiteti logotipi"></div><div>' +
 E("span", "M10-mavzu · Amaliy mashg'ulot · 2 soat", "Topic 10 · Practical class · 2 hours", 'class="kicker"') +
 E("h1", "SAVDO JARAYONINI TASHKIL ETISH VA MIJOZLAR BILAN ISHLASH", "ORGANISING THE SALES PROCESS AND WORKING WITH CUSTOMERS", 'class="grad"') +
 E("p", "Savdo — tasodif emas, <b>qadamlar ketma-ketligi</b> · mijoz ehtiyojini aniqlash · e'tirozlar bilan ishlash · savdoni hisoblash · mijozni saqlab qolish.",
   "Selling is not luck but <b>a sequence of steps</b> · finding out the customer's need · handling objections · counting sales · keeping the customer.", 'class="lead"') +
 '<div class="meta">' +
 E("div", "📚 Fan: <b>Tadbirkorlik asoslari</b>", "📚 Course: <b>Fundamentals of Entrepreneurship</b>") +
 E("div", "🎓 <b>Termiz davlat universiteti</b>", "🎓 <b>Termez State University</b>") +
 E("div", "🗂 <b>18</b> slayd · <b>15</b> ta test", "🗂 <b>18</b> slides · <b>15</b> tests") +
 E("div", "⌨️ <b>→</b> tugmasi bilan davom eting", "⌨️ Press <b>→</b> to continue") +
 '</div></div></div>')

# ============================ 2. MAQSAD ============================
slide("Maqsad va natijalar", "Aims and outcomes",
 E("span", "Mashg'ulotning maqsadi", "Aim of the class", 'class="kicker"') +
 E("h2", "Mashg'ulot yakunida talaba <span class=\"grad\">nimani qila oladi?</span>", "By the end of the class the student <span class=\"grad\">can:</span>") +
 E("div", "Maqsad: talaba savdoni <b>tartibli jarayon</b> sifatida tashkil etishni — mijozni topishdan qayta xaridgacha — hamda mijoz bilan <b>ishonchli va halol</b> muloqot qilishni o'rganadi.",
   "Aim: the student learns to organise selling as an <b>orderly process</b> — from finding a customer to a repeat purchase — and to talk with customers in a <b>trusting and honest</b> way.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("green", "🪜", "Jarayonni quradi", "Builds the process", "Savdoni 7 bosqichga bo'lib, har bosqichda nima qilishni biladi.", "Splits selling into 7 steps and knows what to do at each step.") +
 card("blue", "❓", "Ehtiyojni aniqlaydi", "Finds the need", "Ochiq savollar bilan mijoz nimani xohlashini va nega kerakligini bilib oladi.", "Uses open questions to learn what the customer wants and why.") +
 card("violet", "🎁", "Taklif beradi", "Makes an offer", "Mahsulotning xususiyatini mijoz foydasiga aylantirib, 2–3 variant taklif qiladi.", "Turns product features into customer benefits and offers 2–3 options.") +
 card("orange", "🛡", "E'tirozga javob beradi", "Answers objections", "«Qimmat», «o'ylab ko'raman» kabi gaplarga bosimsiz va asosli javob beradi.", "Answers “too expensive” or “I will think about it” without pressure and with reasons.") +
 card("pink", "📊", "Savdoni hisoblaydi", "Counts sales", "Konversiya, o'rtacha chek va tushumni hisoblab, qayerda yo'qotayotganini topadi.", "Calculates conversion, average order and revenue and finds where sales are lost.") +
 card("cyan", "🤝", "Mijozni saqlaydi", "Keeps the customer", "Qayta xarid va tavsiya uchun mijoz bilan aloqani yo'lga qo'yadi.", "Sets up contact with customers for repeat purchases and referrals.") +
 '</div>')

# ============================ 3. REJA ============================
slide("Reja va tushunchalar", "Plan and concepts",
 E("span", "Mashg'ulot rejasi", "Class plan", 'class="kicker"') +
 E("h2", "Bugungi <span class=\"grad\">4 ta blok</span>", "Today's <span class=\"grad\">4 blocks</span>") +
 '<div class="grid g4">' +
 card("green", "1️⃣", "Savdo jarayoni", "The sales process", "7 bosqich, mijozlarni yozib borish, birinchi aloqa.", "7 steps, recording customers, the first contact.") +
 card("blue", "2️⃣", "Muloqot", "Conversation", "Ehtiyojni aniqlash, taklif, e'tirozlar, kelishuv.", "Finding the need, the offer, objections, the deal.") +
 card("violet", "3️⃣", "Raqamlar", "The numbers", "Konversiya, o'rtacha chek, tushum, mijoz qiymati.", "Conversion, average order, revenue, customer value.") +
 card("orange", "4️⃣", "Mijoz bilan uzoq aloqa", "Long-term relations", "Qayta xarid, B2B savdo, qiyin mijoz, o'lchash.", "Repeat purchases, B2B sales, difficult customers, measuring.") +
 '</div>' + E("h3", "🔑 Tayanch tushunchalar", "🔑 Key concepts", 'style="margin-top:22px"') +
 E("div",
   '<span class="pill g">savdo jarayoni</span><span class="pill g">lid (potensial mijoz)</span><span class="pill">birinchi aloqa</span><span class="pill g">ehtiyojni aniqlash</span>'
   '<span class="pill g">SPIN savollari</span><span class="pill g">FAB (xususiyat-afzallik-foyda)</span><span class="pill">e\'tiroz</span><span class="pill">kelishuvni yopish</span>'
   '<span class="pill g">konversiya</span><span class="pill g">o\'rtacha chek</span><span class="pill">upsell</span><span class="pill">cross-sell</span>'
   '<span class="pill">qayta xarid</span><span class="pill g">NPS</span><span class="pill">B2C va B2B</span><span class="pill">mijozni yo\'qotish (churn)</span>'
   '<span class="pill">mijozlar bazasi (CRM)</span>',
   '<span class="pill g">sales process</span><span class="pill g">lead (prospect)</span><span class="pill">first contact</span><span class="pill g">needs discovery</span>'
   '<span class="pill g">SPIN questions</span><span class="pill g">FAB (feature-advantage-benefit)</span><span class="pill">objection</span><span class="pill">closing the deal</span>'
   '<span class="pill g">conversion</span><span class="pill g">average order value</span><span class="pill">upsell</span><span class="pill">cross-sell</span>'
   '<span class="pill">repeat purchase</span><span class="pill g">NPS</span><span class="pill">B2C and B2B</span><span class="pill">customer churn</span>'
   '<span class="pill">customer database (CRM)</span>'))

# ============================ 4. SAVDO JARAYONI ============================
slide("Savdo jarayoni: 7 qadam", "The sales process: 7 steps",
 E("span", "1-blok · Jarayon", "Block 1 · The process", 'class="kicker"') +
 E("h2", "Savdo — <span class=\"grad\">7 qadamli yo'l</span>", "Selling is <span class=\"grad\">a 7-step path</span>") +
 E("div", "Yaxshi sotuvchi «ilhom»ga emas, <b>tartibga</b> tayanadi. Har bosqichning o'z maqsadi bor — keyingi bosqichga o'tish uchun nima qilish kerakligini bilsangiz, mijoz yo'qolmaydi.",
   "A good seller relies on <b>order</b>, not “inspiration”. Every step has its own aim — if you know what it takes to reach the next step, you will not lose the customer.", 'class="def"') +
 '<div class="chain" style="margin-top:14px">' +
 '<div class="link l1">' + E("h3", "1. Mijoz topish", "1. Find customers") + E("p", "Reklama, tavsiya, ko'cha, do'kon — lid yig'iladi.", "Advertising, referrals, walk-ins — leads are collected.") + '</div>' +
 '<div class="link l2">' + E("h3", "2. Birinchi aloqa", "2. First contact") + E("p", "Salomlashish, o'zingizni tanishtirish, muloqotni boshlash.", "Greeting, introducing yourself, starting the talk.") + '</div>' +
 '<div class="link l3">' + E("h3", "3. Ehtiyoj", "3. Need") + E("p", "Savol berib, mijoz nimani va nega xohlashini aniqlash.", "Asking questions to learn what the customer wants and why.") + '</div>' +
 '<div class="link l4">' + E("h3", "4. Taklif", "4. Offer") + E("p", "Ehtiyojga mos 2–3 variant va aniq narx.", "2–3 options that fit the need, with a clear price.") + '</div></div>' +
 '<div class="chain" style="margin-top:10px">' +
 '<div class="link l4">' + E("h3", "5. E'tirozlar", "5. Objections") + E("p", "Shubha va savollarga halol, bosimsiz javob.", "Honest, pressure-free answers to doubts and questions.") + '</div>' +
 '<div class="link l3">' + E("h3", "6. Kelishuv", "6. The deal") + E("p", "Narx, muddat, to'lov va keyingi qadam — aniq kelishiladi.", "Price, time, payment and the next step are agreed clearly.") + '</div>' +
 '<div class="link l2">' + E("h3", "7. Kuzatish", "7. Follow-up") + E("p", "Xarid keyin: «hammasi joyidami?», qayta taklif, tavsiya.", "After purchase: “is everything fine?”, a new offer, a referral.") + '</div></div>' +
 E("div", "📌 <b>Eng ko'p xato:</b> 2-qadamdan to'g'ri 4-qadamga sakrash — mijoz nima xohlashini bilmasdan taklif berish. Natija: «qimmat» yoki «o'ylab ko'raman».",
   "📌 <b>The most common mistake:</b> jumping from step 2 straight to step 4 — making an offer without knowing what the customer wants. The result: “too expensive” or “I will think about it”.", 'class="quote" style="margin-top:12px"'))

# ============================ 5. MIJOZLARNI YOZIB BORISH ============================
slide("Lidlarni yozib borish", "Recording leads",
 E("span", "1.2 · Mijozlar bazasi", "1.2 · The customer database", 'class="kicker"') +
 E("h2", "Yozilmagan mijoz — <span class=\"grad\">yo'qolgan mijoz</span>", "An unrecorded customer is <span class=\"grad\">a lost customer</span>") +
 E("div", "Savdo kuchayganda hammasini yodda saqlab bo'lmaydi. Har bir so'rovni <b>oddiy jadvalga</b> yozing: kim, qayerdan keldi, nima qiziqtirdi, hozir qaysi qadamda va keyingi aloqa qachon.",
   "As sales grow you cannot keep everything in your head. Write every enquiry into <b>a simple table</b>: who, where from, what they were interested in, which step they are at and when to contact them next.", 'class="def"') +
 '<div class="grid g2" style="margin-top:14px"><div style="min-width:0">' +
 '<div class="card" style="--c:var(--blue)">' + E("h3", "📒 Oddiy mijozlar jadvali (namuna)", "📒 A simple customer table (sample)") +
 table([("Mijoz", "Customer"), ("Manba", "Source"), ("Qadam", "Step"), ("Keyingi aloqa", "Next contact")], [
  [TD("Dilnoza", "Dilnoza"), TD("Instagram", "Instagram"), TD("Taklif berildi", "Offer made"), TD("Ertaga 10:00", "Tomorrow 10:00")],
  [TD("Bobur", "Bobur"), TD("Do'stidan tavsiya", "A friend's referral"), TD("Ehtiyoj aniqlanmoqda", "Finding the need"), TD("Bugun 17:00", "Today 17:00")],
  [TD("Kafe «Bahor»", "Café “Bahor”"), TD("Telegram", "Telegram"), TD("Kelishuv", "The deal"), TD("Juma", "Friday")],
  [TD("Malika", "Malika"), TD("Instagram", "Instagram"), TD("E'tiroz: narx", "Objection: price"), TD("2 kundan keyin", "In 2 days")],
  [TD("Sardor", "Sardor"), TD("Ko'chadan kirdi", "Walked in"), TD("Sotib oldi", "Bought"), TD("1 haftada fikr so'rash", "Feedback in 1 week", "g")]]) + '</div></div>' +
 '<div style="min-width:0">' + card_ul("green", "✅", "Jadval nimaga yordam beradi?", "How does the table help?", [
  ("Kim bilan qachon gaplashishni <b>unutmaysiz</b>.", "You <b>do not forget</b> whom to talk to and when."),
  ("Qaysi manbadan <b>ko'proq mijoz</b> kelayotganini ko'rasiz.", "You see which source brings <b>more customers</b>."),
  ("Mijoz qaysi qadamda to'xtab qolayotgani ayon bo'ladi.", "It becomes clear at which step customers stall."),
  ("Hamkor yoki xodim ishga qo'shilsa, ma'lumot tayyor turadi.", "If a partner or employee joins, the information is ready.")], "tick") +
 E("small", "Mijozlarning telefon va shaxsiy ma'lumotini faqat ularning roziligi bilan va faqat ish uchun saqlang; uchinchi shaxsga bermang.",
   "Keep customers' phone numbers and personal data only with their consent and only for work; never pass them to third parties.", 'class="note"') +
 '</div></div>')

# ============================ 6. BIRINCHI ALOQA ============================
slide("Birinchi aloqa", "The first contact",
 E("span", "1.3 · Birinchi taassurot", "1.3 · First impression", 'class="kicker"') +
 E("h2", "Birinchi 30 soniya: <span class=\"grad\">ishonchni qanday uyg'otish?</span>", "The first 30 seconds: <span class=\"grad\">how to win trust</span>") +
 '<div class="grid g4">' +
 card("green", "😊", "Salom va ism", "Greeting and name", "Tabassum, salom, o'z ismingiz va do'koningiz nomi.", "A smile, a greeting, your name and the name of your business.") +
 card("blue", "👂", "Avval tinglang", "Listen first", "Darrov mahsulotni maqtamang — mijoz nimani izlayotganini so'rang.", "Do not start praising the product — ask what the customer is looking for.") +
 card("violet", "🎯", "Mijozning ismi", "The customer's name", "Ismi bilan murojaat qiling: «Dilnoza opa, tushundim...».", "Address them by name: “Dilnoza, I understand...”.") +
 card("orange", "⏱", "Tez javob", "A quick reply", "Onlayn yozishmada 15 daqiqa ichida javob bering.", "In online chats reply within 15 minutes.") +
 '</div><div class="grid g2" style="margin-top:14px">' +
 '<div class="card" style="--c:var(--red)">' + E("h3", "❌ Yomon boshlanish", "❌ A weak start") +
 E("p", "«Nima kerak?» · «Narxi yozilgan, qarang» · «Hozir band edim, keyinroq yozing»", "“What do you want?” · “The price is written, look” · “I was busy, write later”", 'style="font-style:italic"') +
 '<ul class="tick cross">' + E("li", "Mijoz o'zini xalaqit beruvchi his qiladi", "The customer feels they are a nuisance") +
 E("li", "Ehtiyoj haqida bitta ham savol yo'q", "Not a single question about the need") + '</ul></div>' +
 '<div class="card" style="--c:var(--green)">' + E("h3", "✅ Yaxshi boshlanish (qandolat misoli)", "✅ A strong start (a bakery example)") +
 E("p", "«Assalomu alaykum! Men Nilufar, «Shirin kun» qandolatidan. Qanday tort izlayapsiz — tug'ilgan kun uchunmi yoki boshqa tadbirgami?»",
   "“Hello! I am Nilufar from the “Shirin kun” bakery. What cake are you looking for — a birthday or another event?”", 'style="font-style:italic"') +
 '<ul class="tick">' + E("li", "Tanishuv + ochiq savol", "An introduction + an open question") +
 E("li", "Mijoz o'zi gapira boshlaydi", "The customer starts talking by themselves") + '</ul></div></div>' +
 E("small", "«Shirin kun» — o'quv uchun to'qib chiqarilgan shartli misol. Keyingi slaydlarda ham shu qandolat va uning raqamlari ishlatiladi.", "“Shirin kun” is a made-up teaching example. The following slides use the same bakery and its numbers.", 'class="note"'))

# ============================ 7. EHTIYOJNI ANIQLASH ============================
slide("Ehtiyojni aniqlash: SPIN", "Finding the need: SPIN",
 E("span", "2-blok · Muloqot", "Block 2 · Conversation", 'class="kicker"') +
 E("h2", "To'g'ri savol — <span class=\"grad\">yarim sotuv</span>", "The right question is <span class=\"grad\">half the sale</span>") +
 E("div", "<b>Ochiq savol</b> («nima uchun», «qanday», «qachon») mijozni gapirtiradi; <b>yopiq savol</b> («ha/yo'q») faqat tasdiqlash uchun. Ehtiyojni aniqlashda <b>SPIN</b> tartibi yaxshi ishlaydi.",
   "An <b>open question</b> (“why”, “how”, “when”) makes the customer talk; a <b>closed question</b> (“yes/no”) is only for confirming. The <b>SPIN</b> order works well for finding the need.", 'class="def"') +
 table([("Savol turi", "Question type"), ("Maqsadi", "Purpose"), ("Misol (qandolat)", "Example (bakery)")], [
  [TD("<b>S — Situation</b> (vaziyat)", "<b>S — Situation</b>"), TD("Hozirgi holatni bilish", "Learn the current situation"), TD("«Tadbir qachon va nechta mehmon bo'ladi?»", "“When is the event and how many guests will there be?”")],
  [TD("<b>P — Problem</b> (muammo)", "<b>P — Problem</b>"), TD("Qiyinchilikni aniqlash", "Find the difficulty"), TD("«Oldin tortni qayerdan olgan edingiz, nima yoqmadi?»", "“Where did you get cakes before, what did you not like?”")],
  [TD("<b>I — Implication</b> (oqibat)", "<b>I — Implication</b>"), TD("Muammo qanchalik jiddiy ekanini ko'rsatish", "Show how serious the problem is"), TD("«Tort kech kelsa, mehmonlar oldida nima bo'ladi?»", "“If the cake arrives late, what happens in front of the guests?”")],
  [TD("<b>N — Need-payoff</b> (foyda)", "<b>N — Need-payoff</b>"), TD("Yechimning foydasini mijozning o'zi aytsin", "Let the customer name the benefit of the solution"), TD("«Aniq vaqtda, tayyor holda yetkazilsa, sizga qulay bo'ladimi?»", "“Would it help if it were delivered on time and ready?”", "g")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("orange", "🧠", "Qoida: 70/30", "The 70/30 rule", "Muloqotning <b>70%</b>ini mijoz gapirsin, siz <b>30%</b>ini. Qancha ko'p tinglasangiz, shuncha aniq taklif berasiz.",
      "The customer should speak for <b>70%</b> of the conversation and you for <b>30%</b>. The more you listen, the more accurate your offer.") +
 card("blue", "📝", "Eshitganingizni takrorlang", "Repeat what you heard", "«Tushunishimcha, 20 kishilik, shokoladli, shanba kuni, vaqti aniq kerak. To'g'rimi?» — mijoz sizni eshitganini his qiladi.",
      "“If I understand, 20 people, chocolate, Saturday, an exact time. Right?” — the customer feels heard.") + '</div>')

# ============================ 8. TAKLIF ============================
slide("Taklif: FAB va 3 variant", "The offer: FAB and 3 options",
 E("span", "2.2 · Taklif berish", "2.2 · Making the offer", 'class="kicker"') +
 E("h2", "Xususiyatni <span class=\"grad\">foydaga aylantiring</span>", "Turn the feature <span class=\"grad\">into a benefit</span>") +
 E("div", "Mijoz «tarkibi qanday» deb emas, <b>«bu menga nima beradi?»</b> deb o'ylaydi. <b>FAB</b>: Xususiyat (Feature) → Afzallik (Advantage) → Foyda (Benefit).",
   "The customer does not think “what is it made of” but <b>“what does it give me?”</b>. <b>FAB</b>: Feature → Advantage → Benefit.", 'class="def"') +
 '<div class="grid g3" style="margin-top:12px">' +
 card("blue", "🧁", "F — Xususiyat", "F — Feature", "«Tort 2 kun oldin emas, <b>yetkazishdan 6 soat oldin</b> pishiriladi.»", "“The cake is baked <b>6 hours before delivery</b>, not 2 days earlier.”") +
 card("orange", "⭐", "A — Afzallik", "A — Advantage", "«Shuning uchun u <b>yangi va yumshoq</b> bo'ladi.»", "“So it stays <b>fresh and soft</b>.”") +
 card("green", "🎉", "B — Foyda", "B — Benefit", "«Mehmonlaringiz oldida <b>xotirjam bo'lasiz</b>, tort ta'rifini eshitasiz.»", "“You will be <b>calm in front of your guests</b> and hear praise for the cake.”") + '</div>' +
 E("h3", "Narxda 3 ta variant bering: «yaxshi — yanada yaxshi — eng yaxshi»", "Give 3 price options: “good — better — best”", 'style="margin-top:14px"') +
 table([("Paket", "Package"), ("Tarkibi", "What it includes"), ("Narx", "Price")], [
  [TD("<b>Oddiy</b>", "<b>Basic</b>"), TD("Tort 1,5 kg, oddiy bezak", "A 1.5 kg cake, basic decoration"), TD("200 000 so'm", "200,000 so'm")],
  [TD("<b>Standart</b> (ko'pchilik tanlaydi)", "<b>Standard</b> (most choose it)"), TD("Tort 2 kg, bezak + yozuv + shamlar", "A 2 kg cake, decoration + lettering + candles"), TD("<b>250 000 so'm</b>", "<b>250,000 so'm</b>", "g")],
  [TD("<b>Premium</b>", "<b>Premium</b>"), TD("Tort 3 kg, maxsus bezak + shirinlik qutisi + yetkazish", "A 3 kg cake, special decoration + a dessert box + delivery"), TD("400 000 so'm", "400,000 so'm")]]) +
 E("small", "Uchta variant mijozga <b>tanlash erkinligini</b> beradi: «ha/yo'q» o'rniga «qaysi biri?» degan savol paydo bo'ladi. Narxlarni o'zingizning haqiqiy xarajatingizga qarab belgilang.",
   "Three options give the customer <b>freedom of choice</b>: instead of “yes/no” the question becomes “which one?”. Set prices from your own real costs.", 'class="note"'))

# ============================ 9. E'TIROZLAR ============================
slide("E'tirozlar bilan ishlash", "Handling objections",
 E("span", "2.3 · E'tirozlar", "2.3 · Objections", 'class="kicker"') +
 E("h2", "E'tiroz — <span class=\"grad\">rad javobi emas, savol</span>", "An objection is <span class=\"grad\">not a refusal but a question</span>") +
 E("div", "Mijoz e'tiroz bildirsa, u hali <b>qiziqyapti</b> degani: ko'pincha u ishonch, qiymat yoki vaqt haqida savol beryapti. Munozara emas, <b>tushunish</b> kerak.",
   "If a customer raises an objection, they are still <b>interested</b>: they are often asking about trust, value or time. Do not argue — <b>understand</b>.", 'class="def"') +
 table([("E'tiroz", "Objection"), ("❌ Yomon javob", "❌ A weak answer"), ("✅ To'g'ri javob", "✅ A good answer")], [
  [TD("<b>«Qimmat ekan»</b>", "<b>“It is expensive”</b>"), TD("«Yo'q, bu arzon, boshqalar undan ham qimmat!»", "“No, it is cheap, others are even more expensive!”", "r"), TD("«Tushunaman. Nimaga nisbatan qimmat deb o'yladingiz? Byudjetingiz qancha? 200 000 lik oddiy variantni ham ko'rsataymi?»", "“I understand. Compared to what do you find it expensive? What is your budget? Shall I show the 200,000 basic option?”", "g")],
  [TD("<b>«O'ylab ko'raman»</b>", "<b>“I will think about it”</b>"), TD("«Ixtiyoringiz, o'ylang.»", "“As you wish, think.”", "r"), TD("«Albatta. Eng ko'p nimani o'ylab ko'rmoqchisiz — narxnimi, vaqtnimi? Ertaga soat 10 da yozib qo'yaymi?»", "“Of course. What exactly will you think over — the price or the time? Shall I message you tomorrow at 10?”", "g")],
  [TD("<b>«Boshqa joyda arzon»</b>", "<b>“It is cheaper elsewhere”</b>"), TD("«Unda o'sha yerdan oling.»", "“Then buy it there.”", "r"), TD("«To'g'ri, narx har xil. Ularning tarkibi va yetkazish shartlarini solishtirdingizmi? Bizda tort yetkazishdan 6 soat oldin pishiriladi.»", "“True, prices differ. Did you compare their ingredients and delivery terms? Ours is baked 6 hours before delivery.”", "g")],
  [TD("<b>«Sifatiga ishonmayman»</b>", "<b>“I do not trust the quality”</b>"), TD("«Hamma bizga ishonadi, siz nega ishonmaysiz?»", "“Everyone trusts us, why don't you?”", "r"), TD("«To'g'ri. Mijozlarimiz fikri va tort rasmlarini ko'rsataman; xohlasangiz, kichik 1 kg lik tortdan boshlang.»", "“Fair. I will show customer reviews and photos; if you wish, start with a small 1 kg cake.”", "g")]]) +
 E("h3", "5 qadamli javob usuli", "A 5-step way to answer", 'style="margin-top:14px"') +
 '<div class="grid g5">' +
 card("blue", "👂", "1. Tinglang", "1. Listen", "Gapni bo'lmang.", "Do not interrupt.") +
 card("green", "🤝", "2. Tan oling", "2. Acknowledge", "«Tushunaman».", "“I understand”.") +
 card("violet", "❓", "3. Aniqlang", "3. Clarify", "Asl sababini so'rang.", "Ask for the real reason.") +
 card("orange", "💬", "4. Javob bering", "4. Answer", "Dalil va variant bilan.", "With proof and an option.") +
 card("pink", "👉", "5. Qadam so'rang", "5. Ask for a step", "«Davom etamizmi?».", "“Shall we continue?”.") + '</div>')

# ============================ 10. KELISHUV ============================
slide("Kelishuvni yakunlash", "Closing the deal",
 E("span", "2.4 · Yakun", "2.4 · Closing", 'class="kicker"') +
 E("h2", "Kelishuvni <span class=\"grad\">bosimsiz yakunlash</span>", "Closing the deal <span class=\"grad\">without pressure</span>") +
 '<div class="grid g2"><div>' +
 card_ul("green", "🔔", "Mijoz tayyor bo'lganining belgilari", "Signs the customer is ready", [
  ("Yetkazish muddati va to'lov haqida so'raydi.", "Asks about delivery time and payment."),
  ("«Agar olsam...» deb gapirishni boshlaydi.", "Starts talking with “If I buy...”."),
  ("Tafsilotlarni qaytarib so'raydi: o'lcham, rang, miqdor.", "Asks again about details: size, colour, quantity."),
  ("Hamrohi bilan maslahatlashadi yoki rasmni ko'rsatadi.", "Consults a companion or shows the picture to someone.")], "tick") + '</div><div>' +
 '<div class="card" style="--c:var(--blue)"><span class="icon">🔑</span>' + E("h3", "Yopishning 3 halol usuli", "3 honest ways to close") +
 '<ul class="tick">' + E("li", "<b>Tanlov:</b> «Standart variantni olamizmi yoki premiumni?»", "<b>A choice:</b> “Shall we take the standard or the premium?”") +
 E("li", "<b>Xulosa:</b> «Shanba, 18:00, 2 kg, yozuv bilan — to'g'ri yozdimmi?»", "<b>A summary:</b> “Saturday, 18:00, 2 kg, with lettering — did I get that right?”") +
 E("li", "<b>Keyingi qadam:</b> «Avans to'lasangiz, buyurtmani qayd qilaman.»", "<b>The next step:</b> “Once you pay an advance, I will register the order.”") + '</ul></div></div></div>' +
 '<div class="grid g2" style="margin-top:14px">' +
 card("red", "⚠️", "Nimani qilmaslik kerak", "What not to do", "Soxta shoshilinchlik («oxirgi dona!»), yolg'on chegirma, qaror qabul qilishga majbur qilish. Bunday savdo mijozni keyin qaytarmaydi.",
      "Fake urgency (“the last one!”), a false discount, forcing a decision. Such a sale will not bring the customer back.") +
 card("orange", "🙂", "«Yo'q» ni ham qabul qiling", "Accept a “no” too", "Mijoz rad etsa, sababini muloyim so'rang va «Keyinroq yozishimga ruxsatingiz bormi?» deng. Bugungi «yo'q» — bir oydan keyingi «ha» bo'lishi mumkin.",
      "If the customer says no, politely ask why and say “May I message you later?”. Today's “no” may become a “yes” in a month.") + '</div>')

# ============================ 11. SAVDO HISOBI ============================
slide("Savdo hisobi", "Counting sales",
 E("span", "3-blok · Raqamlar", "Block 3 · The numbers", 'class="kicker"') +
 E("h2", "Tushum qayerdan <span class=\"grad\">o'sadi?</span>", "Where does revenue <span class=\"grad\">grow from?</span>") +
 E("div", "<b>Tushum = so'rovlar soni × konversiya × o'rtacha chek.</b> Uchta ko'rsatkichdan istalgani o'ssa, tushum ham o'sadi. Qaysi biri eng arzon yo'l bilan o'sishini hisoblab ko'ring.",
   "<b>Revenue = number of enquiries × conversion × average order.</b> If any of the three grows, revenue grows. Work out which one can be raised most cheaply.", 'class="def"') +
 '<div class="grid g4" style="margin-top:14px">' +
 stat("100", "oyiga so'rov", "enquiries a month") +
 stat("20%", "konversiya (20 ta buyurtma)", "conversion (20 orders)", "o") +
 stat("250 000", "o'rtacha chek, so'm", "average order, so'm", "v") +
 stat("5 mln", "oylik tushum: 5 000 000 so'm", "monthly revenue: 5,000,000 so'm") + '</div>' +
 E("h3", "Qaysi yo'l tushumni ko'proq oshiradi?", "Which route raises revenue the most?", 'style="margin-top:14px"') +
 table([("Variant", "Option"), ("Hisob", "Calculation"), ("Tushum", "Revenue"), ("O'zgarish", "Change")], [
  [TD("<b>A. Hozirgi holat</b>", "<b>A. The current situation</b>"), TD("100 × 20% × 250 000", "100 × 20% × 250,000"), TD("5 000 000", "5,000,000"), TD("—", "—")],
  [TD("<b>B. Konversiya 25% bo'ldi</b> (tez javob, 3 variant)", "<b>B. Conversion reaches 25%</b> (quick reply, 3 options)"), TD("100 × 25% × 250 000", "100 × 25% × 250,000"), TD("6 250 000", "6,250,000"), TD("<b>+1 250 000</b>", "<b>+1,250,000</b>", "g")],
  [TD("<b>C. O'rtacha chek 275 000</b> (+10%, shamlar va quti qo'shildi)", "<b>C. Average order 275,000</b> (+10%, candles and a box added)"), TD("100 × 20% × 275 000", "100 × 20% × 275,000"), TD("5 500 000", "5,500,000"), TD("+500 000", "+500,000")],
  [TD("<b>D. So'rovlar 105 ta</b> (+5%)", "<b>D. 105 enquiries</b> (+5%)"), TD("105 × 20% × 250 000", "105 × 20% × 250,000"), TD("5 250 000", "5,250,000"), TD("+250 000", "+250,000")],
  [TD("<b>E. B + C birga</b>", "<b>E. B + C together</b>"), TD("100 × 25% × 275 000", "100 × 25% × 275,000"), TD("6 875 000", "6,875,000"), TD("<b>+1 875 000</b>", "<b>+1,875,000</b>", "g")]]) +
 E("div", "🧠 <b>Xulosa:</b> yangi mijoz izlashdan oldin <b>mavjud so'rovlarni yo'qotmang</b> — konversiyani 5 punktga oshirish reklamani 5% ko'paytirishdan 5 baravar foydaliroq. Tushum ≠ foyda: har bir variantda xarajatni ham hisoblang.",
   "🧠 <b>Conclusion:</b> before looking for new customers, <b>stop losing the enquiries you have</b> — raising conversion by 5 points is 5 times more valuable than raising enquiries by 5%. Revenue ≠ profit: count costs in every option too.", 'class="quote" style="margin-top:10px"'))

# ============================ 12. SAQLASH ============================
slide("Mijozni saqlash", "Keeping the customer",
 E("span", "4-blok · Uzoq aloqa", "Block 4 · Long-term relations", 'class="kicker"') +
 E("h2", "Birinchi xarid — <span class=\"grad\">munosabatning boshlanishi</span>", "The first purchase is <span class=\"grad\">the start of a relationship</span>") +
 E("div", "Yangi mijoz topish odatda mavjud mijozga qayta sotishdan <b>qimmatroq</b>. Shuning uchun xariddan keyin ham aloqani saqlang: yaxshi xizmat — eng arzon reklama.",
   "Finding a new customer usually costs <b>more</b> than selling again to an existing one. So keep in touch after the purchase: good service is the cheapest advertising.", 'class="def"') +
 '<div class="grid g2" style="margin-top:14px">' +
 '<div class="card" style="--c:var(--green)">' + E("h3", "📅 Xariddan keyingi aloqa jadvali", "📅 After-sale contact schedule") +
 table([("Qachon", "When"), ("Nima qilinadi", "What to do")], [
  [TD("<b>1-kun</b>", "<b>Day 1</b>"), TD("«Hammasi joyidami? Yoqdimi?» — qisqa xabar", "“Is everything fine? Did you like it?” — a short message")],
  [TD("<b>1-hafta</b>", "<b>Week 1</b>"), TD("Fikr va sharh so'rash; rasm joylashga ruxsat", "Ask for feedback and a review; permission to post the photo")],
  [TD("<b>1-oy</b>", "<b>Month 1</b>"), TD("Yangi taklif yoki mavsumiy aksiya haqida xabar", "A message about a new offer or a seasonal promotion")],
  [TD("<b>Yiliga bir marta</b>", "<b>Once a year</b>"), TD("Mijozning muhim sanasi (tug'ilgan kun) bilan tabriklash", "Greet the customer on an important date (a birthday)")]]) + '</div>' +
 '<div>' + card_ul("blue", "🔁", "Qo'shimcha sotuv usullari", "Ways to sell more", [
  ("<b>Upsell:</b> kattaroq yoki yaxshiroq variantni taklif qilish (2 kg o'rniga 3 kg).", "<b>Upsell:</b> offering a bigger or better version (3 kg instead of 2 kg)."),
  ("<b>Cross-sell:</b> unga mos boshqa mahsulot (tort + shamlar + shirinlik qutisi).", "<b>Cross-sell:</b> a matching extra product (a cake + candles + a dessert box)."),
  ("<b>Tavsiya:</b> «Do'stlaringizga ham tavsiya qilsangiz, 10% chegirma beramiz.»", "<b>Referral:</b> “If you recommend us to friends, we give 10% off.”"),
  ("<b>Sodiqlik:</b> 5-buyurtma — sovg'a yoki chegirma.", "<b>Loyalty:</b> the 5th order — a gift or a discount.")], "tick") + '</div></div>' +
 E("small", "Qo'shimcha taklif mijozga <b>haqiqatan foyda</b> bersa — ishlaydi; majburan o'tkazilsa — ishonchni yo'qotadi. Ruxsatsiz ommaviy xabar (spam) yubormang.",
   "An extra offer works if it gives the customer <b>real benefit</b>; if forced, it destroys trust. Do not send bulk messages without permission (spam).", 'class="note"'))

# ============================ 13. B2C VA B2B ============================
slide("B2C va B2B savdo", "B2C and B2B sales",
 E("span", "4.2 · Mijoz turi", "4.2 · Type of customer", 'class="kicker"') +
 E("h2", "Oddiy xaridorga va <span class=\"grad\">korxonaga sotish</span>", "Selling to a consumer and <span class=\"grad\">selling to a business</span>") +
 table([("", ""), ("B2C — oddiy xaridor", "B2C — an individual customer"), ("B2B — korxona yoki tadbirkor", "B2B — a business customer")], [
  [TD("<b>Qaror qiluvchi</b>", "<b>Decision maker</b>"), TD("Odatda bitta odam (ko'pincha tezda)", "Usually one person (often quickly)"), TD("Ko'pincha bir necha kishi: egasi, buxgalter, xaridchi", "Often several people: owner, accountant, buyer")],
  [TD("<b>Qaror muddati</b>", "<b>Time to decide</b>"), TD("Daqiqalar, soatlar, kunlar", "Minutes, hours, days"), TD("Kunlar, haftalar", "Days, weeks")],
  [TD("<b>Nimaga qaraydi</b>", "<b>What they look at</b>"), TD("Ehtiyoj, his-tuyg'u, narx, qulaylik", "Need, emotion, price, convenience"), TD("Foyda, ishonchlilik, muddat, barqaror yetkazish", "Profit, reliability, time, stable delivery")],
  [TD("<b>Hujjat</b>", "<b>Documents</b>"), TD("Ko'pincha chek yoki yozishma", "Often a receipt or a chat"), TD("Shartnoma, hisob-faktura, yetkazish hujjatlari", "A contract, an invoice, delivery documents")],
  [TD("<b>To'lov</b>", "<b>Payment</b>"), TD("Darrov: naqd yoki karta", "Immediately: cash or card"), TD("Ko'pincha keyinroq yoki bosqichma-bosqich — kechikish xavfi bor", "Often later or in instalments — there is a risk of delay", "r")],
  [TD("<b>Hajm</b>", "<b>Volume</b>"), TD("Kichik, ko'p mijoz", "Small, many customers"), TD("Katta, kam mijoz — har biri muhim", "Large, few customers — each matters", "g")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("green", "🏢", "B2B da nima qilish kerak?", "What to do in B2B", "Ulgurji narx va shartlarni yozma kelishing, <b>sinov partiyasi</b> taklif qiling, to'lov muddatini shartnomada aniq belgilang, mas'ul kishi bilan doimiy aloqada bo'ling.",
      "Agree wholesale prices and terms in writing, offer <b>a trial batch</b>, set the payment deadline clearly in the contract and keep regular contact with a responsible person.") +
 card("orange", "📞", "Misol: kafe «Bahor»", "Example: café “Bahor”", "«Shirin kun» kafega haftasiga 6 ta kichik shirinlik yetkazsa: sinov hafta, ulgurji narx, aniq yetkazish vaqti, to'lov — har juma kuni. Bitta shunday mijoz 12 ta oddiy mijozga teng bo'lishi mumkin.",
      "If “Shirin kun” delivers 6 small desserts a week to a café: a trial week, a wholesale price, an exact delivery time, payment every Friday. One such customer can equal 12 ordinary ones.") + '</div>' +
 E("small", "Shartnoma, hisob-faktura va soliq qoidalari tez-tez yangilanadi. Yuridik kelishuvlardan oldin lex.uz dagi amaldagi qoidalarni tekshiring yoki mutaxassis bilan maslahatlashing.",
   "Contract, invoice and tax rules are updated often. Before legal agreements, check the current rules on lex.uz or consult a specialist.", 'class="note"'))

# ============================ 14. QIYIN MIJOZ ============================
slide("Qiyin mijoz va odob", "Difficult customers and etiquette",
 E("span", "4.3 · Muloqot madaniyati", "4.3 · Communication culture", 'class="kicker"') +
 E("h2", "Har xil mijoz — <span class=\"grad\">har xil yondashuv</span>", "Different customers — <span class=\"grad\">different approaches</span>") +
 table([("Mijoz turi", "Customer type"), ("Belgisi", "Sign"), ("Qanday ishlash", "How to work with them")], [
  [TD("<b>⚡ Shoshqaloq</b>", "<b>⚡ In a hurry</b>"), TD("«Qisqa ayting, vaqtim yo'q»", "“Be brief, I have no time”"), TD("Asosiy foyda va narxni 2 jumlada ayting, keyin so'rang.", "State the main benefit and the price in 2 sentences, then ask.", "g")],
  [TD("<b>🤔 Ikkilanuvchi</b>", "<b>🤔 Hesitant</b>"), TD("«Bilmadim... balki...»", "“I don't know... maybe...”"), TD("Aniq 2 variant bering, sharh va kafolat ko'rsating, shoshiltirmang.", "Offer 2 clear options, show reviews and a guarantee, do not rush.", "g")],
  [TD("<b>😠 G'azablangan</b>", "<b>😠 Angry</b>"), TD("Baland ovoz yoki qattiq yozuv", "A raised voice or harsh writing"), TD("Gapini oxirigacha tinglang, his-tuyg'uni tan oling («tushunaman, noqulay bo'ldi»), keyin yechim bering.", "Hear them out, acknowledge the feeling (“I understand, that was inconvenient”), then offer a solution.", "g")],
  [TD("<b>🤐 Jim</b>", "<b>🤐 Quiet</b>"), TD("Qisqa javoblar, ko'p so'ramaydi", "Short answers, asks little"), TD("Ochiq savol bering, tanlash uchun vaqt bering, rasm yoki namuna ko'rsating.", "Ask open questions, give time to choose, show a picture or a sample.", "g")],
  [TD("<b>💬 Ko'p so'raydigan</b>", "<b>💬 Asks a lot</b>"), TD("Bir xil savolni qayta-qayta so'raydi", "Asks the same question again and again"), TD("Savollarni sanab chiqing, bitta xabarda javob bering, keyin qaror so'rang.", "List the questions, answer in one message, then ask for a decision.", "g")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card_ul("green", "🤝", "Muloqot odobi", "Etiquette", [
  ("Mijozni «sen» deb emas, hurmat bilan «Siz» deb chaqiring.", "Address the customer politely and respectfully."),
  ("Va'da bergan vaqtda javob bering va aloqaga chiqing.", "Reply and get in touch at the time you promised."),
  ("Bilmagan narsangizni «tekshirib, aytaman» deb ayting.", "Say “I will check and tell you” about what you do not know."),
  ("Xato bo'lsa, oldin o'zingiz xabar bering.", "If a mistake happens, tell the customer first.")], "tick") +
 card("red", "⚠️", "Chegara: halollik", "The limit: honesty", "Mijozni aldash, yashirin to'lov, soxta va'da, raqibni yomonlash — qisqa muddatda sotuv beradi, lekin <b>obro'ni yo'qotadi</b>. Shaxsiy ma'lumotni himoya qiling.",
      "Deceiving customers, hidden fees, false promises, running down rivals — they may bring a sale in the short term but <b>cost your reputation</b>. Protect personal data.") + '</div>')

# ============================ 15. O'LCHASH ============================
slide("Mijoz bilan ishlashni o'lchash", "Measuring customer work",
 E("span", "4.4 · Ko'rsatkichlar", "4.4 · Metrics", 'class="kicker"') +
 E("h2", "Mijoz xursandmi? <span class=\"grad\">Raqam bilan tekshiring</span>", "Is the customer happy? <span class=\"grad\">Check it with numbers</span>") +
 table([("Ko'rsatkich", "Metric"), ("Formula", "Formula"), ("Misol («Shirin kun»)", "Example (“Shirin kun”)")], [
  [TD("<b>NPS</b> — tavsiya indeksi", "<b>NPS</b> — net promoter score"), TD("tavsiya qiluvchilar % − tanqidchilar %", "promoters % − detractors %"), TD("50 javobdan 30 tasi tavsiya qiladi (60%), 8 tasi tanqid qiladi (16%): 60 − 16 = <b>44</b>", "Of 50 replies 30 promote (60%), 8 criticise (16%): 60 − 16 = <b>44</b>")],
  [TD("<b>Qayta xarid ulushi</b>", "<b>Repeat purchase rate</b>"), TD("qayta olganlar ÷ barcha mijozlar × 100", "repeat buyers ÷ all customers × 100"), TD("60 mijozdan 21 tasi qayta oldi: 21 ÷ 60 × 100 = <b>35%</b>", "Of 60 customers 21 bought again: 21 ÷ 60 × 100 = <b>35%</b>")],
  [TD("<b>Mijozni yo'qotish (churn)</b>", "<b>Customer churn</b>"), TD("ketganlar ÷ davr boshidagi mijozlar × 100", "lost ÷ customers at the start × 100"), TD("Oy boshida 80 mijoz, 8 tasi ketdi: <b>10%</b>", "80 customers at the start of the month, 8 left: <b>10%</b>", "r")],
  [TD("<b>Javob tezligi</b>", "<b>Reply speed</b>"), TD("so'rovga birinchi javob vaqti", "time to the first reply"), TD("O'rtacha 12 daqiqa (maqsad — 15 dan kam)", "12 minutes on average (the target is under 15)", "g")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("blue", "📋", "NPS ni qanday so'raladi?", "How to ask for NPS", "«0 dan 10 gacha, do'stingizga bizni tavsiya qilish ehtimoli qancha?» <b>9–10</b> — tavsiya qiluvchi, <b>7–8</b> — betaraf, <b>0–6</b> — tanqidchi. Natijaga «nega?» savolini qo'shing.",
      "“From 0 to 10, how likely are you to recommend us to a friend?” <b>9–10</b> — promoter, <b>7–8</b> — neutral, <b>0–6</b> — detractor. Add the question “why?”.") +
 card("green", "🔍", "Raqam nimani ko'rsatadi?", "What the numbers show", "Qayta xarid past, javob tezligi yaxshi bo'lsa — muammo xizmatda emas, <b>mahsulot yoki narxda</b> bo'lishi mumkin. Har ko'rsatkichni boshqalari bilan birga o'qing.",
      "If repeat purchases are low but reply speed is good, the problem may lie in <b>the product or price</b>, not service. Read each metric together with the others.") + '</div>' +
 E("small", "Namunadagi raqamlar o'quv uchun shartli. O'z biznesingizda har oy bir xil usulda o'lchang — shunda o'zgarishni ko'rasiz.",
   "The sample numbers are made up for teaching. In your own business measure the same way every month — then you will see the change.", 'class="note"'))

# ============================ 16. AMALIY TOPSHIRIQ ============================
slide("Amaliy topshiriq", "Practical task",
 E("span", "Amaliy mashg'ulot · 2 soat", "Practical class · 2 hours", 'class="kicker"') +
 E("h2", "«Savdo <span class=\"grad\">rolli o'yini»</span> va savdo kartochkasi", "The “sales <span class=\"grad\">role play”</span> and a sales card") +
 E("p", "Juftlikda: biri sotuvchi, biri mijoz. Keyin rollar almashadi. Har bir talaba o'z mahsuloti uchun A4 «savdo kartochkasi» tayyorlaydi.", "In pairs: one is the seller, one is the customer. Then the roles swap. Each student prepares an A4 “sales card” for their own product.", 'class="lead"') +
 '<div class="grid g2"><div class="card" style="--c:var(--blue)">' + E("h3", "⏱ 120 daqiqalik reja", "⏱ The 120-minute plan") +
 table([("Vaqt", "Time"), ("Nima qilinadi", "What to do")], [
  [TD("0–15", "0–15"), TD("Mahsulot va 3 ta mijoz turini tanlash", "Choose the product and 3 customer types")],
  [TD("15–40", "15–40"), TD("Ehtiyoj savollari (SPIN) va FAB bo'yicha taklif yozish", "Write needs questions (SPIN) and an FAB offer")],
  [TD("40–60", "40–60"), TD("3 variantli narx va 4 ta e'tirozga javob tayyorlash", "Prepare a 3-option price and answers to 4 objections")],
  [TD("60–95", "60–95"), TD("Rolli o'yin: 5 daqiqadan, ikki marta (rollar almashadi)", "Role play: 5 minutes each, twice (roles swap)")],
  [TD("95–110", "95–110"), TD("Savdo hisobi: konversiya, o'rtacha chek, tushum", "Sales calculation: conversion, average order, revenue")],
  [TD("110–120", "110–120"), TD("O'zaro baholash va xulosa", "Peer assessment and wrap-up")]]) + '</div>' +
 '<div><div class="card" style="--c:var(--green)">' + E("h3", "📋 Savdo kartochkasida bo'lishi shart", "📋 The sales card must contain") +
 '<ul class="clean">' + E("li", "Mahsulot va mijoz turi (3 ta)", "The product and customer types (3)") +
 E("li", "5 ta ochiq savol (SPIN bo'yicha)", "5 open questions (using SPIN)") +
 E("li", "FAB taklifi va 3 variantli narx", "An FAB offer and a 3-option price") +
 E("li", "4 ta e'tiroz va asosli javoblar", "4 objections and reasoned answers") +
 E("li", "Hisob: so'rov, konversiya, chek, tushum", "Calculation: enquiries, conversion, average order, revenue") +
 E("li", "Xariddan keyingi aloqa rejasi", "A post-sale contact plan") + '</ul></div>' +
 '<div class="card" style="--c:var(--amber);margin-top:12px">' + E("h3", "🏅 Baholash", "🏅 Assessment") +
 E("p", "Muloqot va savollar <b>30%</b> · taklif va e'tirozlar <b>30%</b> · hisob-kitob <b>25%</b> · halollik va madaniyat <b>15%</b>.", "Conversation and questions <b>30%</b> · offer and objections <b>30%</b> · calculation <b>25%</b> · honesty and manners <b>15%</b>.") + '</div></div></div>')

# ============================ 17. XULOSA ============================
slide("Xulosa va resurslar", "Summary and resources",
 E("span", "Xulosa · Mustaqil ish · Havolalar", "Summary · Independent work · Links", 'class="kicker"') +
 E("h2", "Yakuniy <span class=\"grad\">xulosa</span> va <span class=\"grad\">foydali resurslar</span>", "The final <span class=\"grad\">summary</span> and <span class=\"grad\">useful resources</span>") +
 '<div class="grid g2"><div>' +
 card_ul("green", "📌", "Esda qoladigan 6 ta fikr", "6 things to remember", [
  ("Savdo — <b>7 qadam</b>: topish, aloqa, ehtiyoj, taklif, e'tiroz, kelishuv, kuzatish.", "Selling is <b>7 steps</b>: find, contact, need, offer, objection, deal, follow-up."),
  ("Har lidni <b>jadvalga yozing</b>: manba, qadam, keyingi aloqa.", "<b>Record every lead in a table</b>: source, step, next contact."),
  ("Ko'proq <b>tinglang</b>: ochiq savollar (SPIN), 70/30 qoidasi.", "<b>Listen</b> more: open questions (SPIN), the 70/30 rule."),
  ("Xususiyatni <b>foydaga aylantiring</b> (FAB) va 3 variant bering.", "<b>Turn features into benefits</b> (FAB) and give 3 options."),
  ("<b>E'tiroz — savol:</b> tinglang, tan oling, aniqlang, javob bering, qadam so'rang.", "<b>An objection is a question:</b> listen, acknowledge, clarify, answer, ask for a step."),
  ("Tushum = <b>so'rov × konversiya × chek</b>; mijozni saqlash — eng arzon o'sish.", "Revenue = <b>enquiries × conversion × average order</b>; keeping customers is the cheapest growth.")]) +
 '<div class="card" style="--c:var(--amber);margin-top:12px">' + E("h3", "📓 Mustaqil ish: «Haftalik savdo hisoboti»", "📓 Independent work: “A weekly sales report”") +
 '<ul class="clean">' + E("li", "7 kun davomida har bir so'rovni jadvalga yozing (manba, qadam, natija).", "For 7 days record every enquiry in a table (source, step, result).") +
 E("li", "Hafta oxirida konversiya, o'rtacha chek va tushumni hisoblang.", "At the end of the week calculate conversion, average order and revenue.") +
 E("li", "Mijozlar eng ko'p qaysi qadamda to'xtadi? Sababini yozing.", "At which step did customers stall most? Write down why.") +
 E("li", "Keyingi hafta uchun bitta yaxshilash rejasi tuzing.", "Make one improvement plan for next week.") + '</ul>' +
 E("p", "Hajmi: 1–2 bet + jadval. Baholash: jadval aniqligi 40% · hisob 30% · asoslangan reja 30%.", "Size: 1–2 pages + a table. Marking: accuracy of the table 40% · calculation 30% · reasoned plan 30%.", 'style="font-size:13.5px;color:var(--muted)"') + '</div></div>' +
 '<div><div class="card" style="--c:var(--blue)">' + E("h3", "🔗 Foydali resurslar", "🔗 Useful resources") +
 E("p", "<b>Qonun va rasmiy manbalar:</b>", "<b>Law and official sources:</b>") +
 '<ul class="clean">' +
 E("li", '<a class="lnk" href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> — iste\'molchilar huquqlari, shartnoma va savdo qoidalari', '<a class="lnk" href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> — consumer rights, contract and trade rules') +
 E("li", '<a class="lnk" href="https://birdarcha.uz" target="_blank" rel="noopener">birdarcha.uz</a> — biznesni ro\'yxatdan o\'tkazish', '<a class="lnk" href="https://birdarcha.uz" target="_blank" rel="noopener">birdarcha.uz</a> — business registration') +
 E("li", '<a class="lnk" href="https://stat.uz" target="_blank" rel="noopener">stat.uz</a> — rasmiy statistika', '<a class="lnk" href="https://stat.uz" target="_blank" rel="noopener">stat.uz</a> — official statistics') +
 E("li", '<a class="lnk" href="https://ombudsman.uz" target="_blank" rel="noopener">ombudsman.uz</a> — Biznes ombudsmani', '<a class="lnk" href="https://ombudsman.uz" target="_blank" rel="noopener">ombudsman.uz</a> — the Business Ombudsman') + '</ul>' +
 E("p", "<b>Bepul vositalar:</b>", "<b>Free tools:</b>", 'style="margin-top:8px"') +
 E("p", '<a class="lnk" href="https://docs.google.com" target="_blank" rel="noopener">docs.google.com</a> — mijozlar jadvali va hisob · <a class="lnk" href="https://telegram.org" target="_blank" rel="noopener">telegram.org</a> — mijoz bilan yozishma va kanal',
   '<a class="lnk" href="https://docs.google.com" target="_blank" rel="noopener">docs.google.com</a> — customer table and calculations · <a class="lnk" href="https://telegram.org" target="_blank" rel="noopener">telegram.org</a> — chat with customers and a channel') +
 E("p", "<b>O'qish uchun:</b> Neil Rackham — «SPIN Selling» · Robert Cialdini — «Influence» · Dale Carnegie — «How to Win Friends and Influence People».", "<b>Further reading:</b> Neil Rackham — “SPIN Selling” · Robert Cialdini — “Influence” · Dale Carnegie — “How to Win Friends and Influence People”.", 'style="margin-top:8px"') +
 E("small", "⚠️ Qonun va platforma qoidalari o'zgaradi. Har doim amaldagi rasmiy ma'lumotga tayaning.", "⚠️ Laws and platform rules change. Always rely on current official information.", 'class="note"') +
 '</div></div></div>')

# ============================ 18. TEST ============================
slide("TEST · Bilimni tekshirish", "TEST · Check your knowledge",
 E("span", "Yakuniy nazorat", "Final check", 'class="kicker"') +
 E("h2", "🧪 Test topshiriqlari — <span class=\"grad\">15 ta savol</span>", "🧪 Test tasks — <span class=\"grad\">15 questions</span>") +
 '<div class="scorebar"><span><span data-ui="score">Natija:</span> <b><span id="scoreNow">0</span> / <span id="scoreMax">15</span></b></span>'
 '<span><span data-ui="answered">Javob berildi:</span> <b id="answered">0</b></span><div class="spacer"></div>' +
 E("button", "↻ Testni qayta boshlash", "↻ Restart the test", 'class="btn warn" id="btnReset"') + '</div>'
 '<div id="testWrap"></div><div class="result" id="result"><div class="pct" id="pct">0%</div>' +
 E("h3", "Natija", "Result", 'id="resTitle" style="color:#fff;margin:10px 0 4px"') + '<p id="resTxt" style="color:#fff;opacity:.95;margin:0"></p></div>'
 '<div class="card" style="--c:var(--green);margin-top:18px;text-align:center">' +
 E("h3", "🎓 Rahmat! E'tiboringiz uchun tashakkur", "🎓 Thank you for your attention!") +
 E("p", "Keyingi mashg'ulotgacha <b>savdo kartochkasini</b> tugallang va bir hafta davomida so'rovlarni yozib boring — keyingi mavzu: mahsulot narxini shakllantirish.",
   "Before the next class, finish your <b>sales card</b> and record enquiries for a week — the next topic: pricing a product.") +
 E("p", "Termiz davlat universiteti · Tadbirkorlik asoslari", "Termez State University · Fundamentals of Entrepreneurship", 'style="color:var(--muted);font-size:13.5px"') + '</div>')

# ============================ TEST SAVOLLARI ============================
Q = [
 # 1 — ehtiyojni aniqlash (to'g'ri: B)
 dict(q="Mijoz bilan ehtiyojni aniqlash bosqichida sotuvchi eng avvalo nima qilishi kerak?",
      a=["Mahsulotning barcha afzalliklarini darhol tez sanab chiqishi kerak",
         "Ochiq savollar berib, mijozni gapirtirib, diqqat bilan tinglashi",
         "Mijozga narxni aytib, chegirma borligini avvaldan ma'lum qilishi",
         "Mijozning gapini bo'lib, asosiy fikrni o'zi tezroq aytib qo'yishi"], c=1,
      e="Ehtiyoj bosqichining maqsadi — mijoz nimani va nega xohlashini bilish. Buning uchun ochiq savollar beriladi va mijoz gapiradi, sotuvchi tinglaydi.",
      qe="At the needs stage of a sale, what should the seller do first?",
      ae=["Quickly list every advantage of the product one after another",
         "Ask open questions, get the customer talking and listen closely",
         "Tell the customer the price and announce the discount in advance",
         "Interrupt the customer and state the main point themselves sooner"],
      ee="The aim of the needs stage is to learn what the customer wants and why. For that, open questions are asked: the customer speaks and the seller listens."),
 # 2 — SPIN: oqibat (to'g'ri: C)
 dict(q="«Tort kech kelsa, mehmonlar oldida nima bo'ladi?» savoli SPIN ning qaysi turiga kiradi?",
      a=["S — vaziyat savoli, chunki u hozirgi holatni aniqlashga qaratilgan",
         "P — muammo savoli, chunki u mijozdagi qiyinchilikni ochib beradi",
         "I — oqibat savoli, chunki u muammoning jiddiyligini ko'rsatadi",
         "N — foyda savoli, chunki u yechimning afzalligini ochib beradi"], c=2,
      e="Oqibat (Implication) savoli muammo hal qilinmasa nima bo'lishini ko'rsatadi va mijozga muammo qanchalik jiddiyligini his qildiradi.",
      qe="Which SPIN type does the question “If the cake arrives late, what happens in front of the guests?” belong to?",
      ae=["S — a situation question, as it aims to find out the current state",
         "P — a problem question, as it reveals the customer's difficulty",
         "I — an implication question, as it shows how serious the problem is",
         "N — a need-payoff question, as it reveals the solution's advantage"],
      ee="An Implication question shows what will happen if the problem is not solved and makes the customer feel how serious it is."),
 # 3 — FAB: foyda (to'g'ri: A)
 dict(q="«Tort yetkazishdan 6 soat oldin pishiriladi» — bu FAB formulasining qaysi qismi?",
      a=["F — xususiyat: u mahsulotning o'ziga xos jihatini oddiy aytadi",
         "A — afzallik: u mahsulotni boshqalardan ustun qilib ko'rsatadi",
         "B — foyda: u mijoz nima olishini to'g'ridan-to'g'ri tushuntiradi",
         "Bu FAB ga kirmaydi, chunki bu gapda mijoz haqida hech narsa yo'q"], c=0,
      e="Bu gap — mahsulotning xususiyati (Feature). Uni afzallik («yangi va yumshoq») va foydaga («mehmonlar oldida xotirjamlik») aylantirish kerak.",
      qe="“The cake is baked 6 hours before delivery” — which part of the FAB formula is this?",
      ae=["F — feature: it simply states a particular trait of the product",
         "A — advantage: it presents the product as better than the others",
         "B — benefit: it directly explains what the customer will receive",
         "It is not part of FAB, as it says nothing at all about the customer"],
      ee="This statement is a feature of the product. It should be turned into an advantage (“fresh and soft”) and a benefit (“calm in front of the guests”)."),
 # 4 — "qimmat" e'tirozi (to'g'ri: D)
 dict(q="Mijoz «Qimmat ekan» dedi. Eng to'g'ri javob qaysi?",
      a=["Yo'q, bu arzon, boshqa joylarda narx bundan ancha yuqoriroq turadi",
         "Narxni darhol tushirib, mijoz xohlagan summaga rozi bo'lib qo'ying",
         "Unda boshqa joydan oling, bizning narxni o'zgartirishimiz shart emas",
         "Nimaga nisbatan qimmat? Byudjetingiz qancha? Soddasini ko'rsataymi?"], c=3,
      e="Mijozning e'tirozi ko'pincha savol: u nimani solishtiryapti va byudjeti qancha? Aniqlashtirib, soddaroq variant taklif qilinadi. Bahslashish yoki darhol narx tushirish noto'g'ri.",
      qe="A customer said “It is expensive”. Which answer is the most appropriate?",
      ae=["No, it is cheap, prices elsewhere are far higher than this one",
         "Drop the price at once and agree to the sum the customer wants",
         "Then buy elsewhere, our price does not have to be changed at all",
         "Expensive compared to what? What is your budget? A simpler one?"],
      ee="A customer's objection is often a question: what are they comparing with and what is their budget? Clarify it and offer a simpler option. Arguing or dropping the price at once is wrong."),
 # 5 — konversiya (to'g'ri: B)
 dict(q="Oyiga 80 ta so'rov keldi, 20 tasi buyurtma berdi. Konversiya qancha?",
      a=["20%", "25%", "30%", "40%"], c=1,
      e="Konversiya = buyurtmalar ÷ so'rovlar × 100 = 20 ÷ 80 × 100 = 25%.",
      qe="80 enquiries came in a month and 20 of them placed an order. What is the conversion?",
      ae=["20%", "25%", "30%", "40%"],
      ee="Conversion = orders ÷ enquiries × 100 = 20 ÷ 80 × 100 = 25%."),
 # 6 — tushum (to'g'ri: D)
 dict(q="Oyiga 40 ta buyurtma bo'ldi, o'rtacha chek 180 000 so'm. Oylik tushum qancha?",
      a=["4 500 000 so'm", "5 400 000 so'm", "6 800 000 so'm", "7 200 000 so'm"], c=3,
      e="Tushum = buyurtmalar soni × o'rtacha chek = 40 × 180 000 = 7 200 000 so'm.",
      qe="There were 40 orders in a month and the average order is 180,000 so'm. What is the monthly revenue?",
      ae=["4,500,000 so'm", "5,400,000 so'm", "6,800,000 so'm", "7,200,000 so'm"],
      ee="Revenue = number of orders × average order = 40 × 180,000 = 7,200,000 so'm."),
 # 7 — qaysi yo'l ko'proq (to'g'ri: A)
 dict(q="100 so'rovdan 20 ta buyurtma, o'rtacha chek 250 000. Qaysi o'zgarish tushumni ko'proq oshiradi?",
      a=["Konversiyani 25% gacha ko'tarish: tushum 1 250 000 so'mga oshadi",
         "O'rtacha chekni 10% ga ko'tarish: tushum 500 000 so'mga oshadi",
         "So'rovlar sonini 5% ga ko'paytirish: tushum 250 000 so'mga oshadi",
         "Narxni 5% ga tushirish: tushum o'zgarmaydi, buyurtma ko'payadi"], c=0,
      e="25% konversiyada 100 × 25% × 250 000 = 6 250 000 (+1 250 000). Boshqa variantlar: chek +10% → +500 000, so'rov +5% → +250 000. Mavjud so'rovlarni yo'qotmaslik eng foydali.",
      qe="Of 100 enquiries 20 become orders and the average order is 250,000. Which change raises revenue the most?",
      ae=["Raising conversion to 25%, so revenue grows by 1,250,000 so'm",
         "Raising the average order by 10%: revenue grows by 500,000 so'm",
         "Raising the number of enquiries by 5%: revenue rises 250,000 so'm",
         "Cutting the price by 5%: revenue stays the same, orders go up"],
      ee="At 25% conversion, 100 × 25% × 250,000 = 6,250,000 (+1,250,000). Other options: order +10% → +500,000, enquiries +5% → +250,000. Not losing existing enquiries is the most valuable."),
 # 8 — cross-sell (to'g'ri: C)
 dict(q="Mijoz tort buyurtma qildi, sotuvchi unga shamlar va shirinlik qutisini ham taklif qildi. Bu nima deyiladi?",
      a=["Upsell — o'sha mahsulotning kattaroq variantini taklif qilish usuli",
         "Qayta xarid — mijozning avval olgan mahsulotini yana buyurtma qilishi",
         "Cross-sell — asosiy mahsulotga mos qo'shimcha mahsulot taklif qilish",
         "Chegirma — narxni vaqtincha tushirib, mijozni xarid qilishga undash"], c=2,
      e="Cross-sell — sotib olinayotgan mahsulotga mos boshqa mahsulotni taklif qilish. Upsell esa o'sha mahsulotning kattaroq yoki yaxshiroq variantini taklif qilishdir.",
      qe="A customer ordered a cake and the seller also offered candles and a dessert box. What is this called?",
      ae=["Upsell — a way of offering a bigger version of that same product",
         "Repeat purchase — the customer ordering again what was bought before",
         "Cross-sell — offering an extra product that matches the main product",
         "A discount — temporarily lowering the price to encourage a purchase"],
      ee="Cross-sell is offering another product that matches what is being bought. Upsell is offering a bigger or better version of that same product."),
 # 9 — NPS (to'g'ri: B)
 dict(q="50 ta javobdan 30 tasi tavsiya qiluvchi, 12 tasi betaraf, 8 tasi tanqidchi. NPS qancha?",
      a=["32", "44", "52", "60"], c=1,
      e="Tavsiya qiluvchilar 30 ÷ 50 = 60%, tanqidchilar 8 ÷ 50 = 16%. NPS = 60 − 16 = 44.",
      qe="Of 50 replies 30 are promoters, 12 neutral and 8 detractors. What is the NPS?",
      ae=["32", "44", "52", "60"],
      ee="Promoters 30 ÷ 50 = 60%, detractors 8 ÷ 50 = 16%. NPS = 60 − 16 = 44."),
 # 10 — qayta xarid ulushi (to'g'ri: A)
 dict(q="60 ta mijozdan 21 tasi qayta xarid qildi. Qayta xarid ulushi qancha?",
      a=["35%", "21%", "40%", "65%"], c=0,
      e="Qayta xarid ulushi = 21 ÷ 60 × 100 = 35%.",
      qe="Of 60 customers 21 bought again. What is the repeat purchase rate?",
      ae=["35%", "21%", "40%", "65%"],
      ee="Repeat purchase rate = 21 ÷ 60 × 100 = 35%."),
 # 11 — yopish signali (to'g'ri: D)
 dict(q="Quyidagilardan qaysi biri mijoz xarid qilishga tayyor ekanining belgisi hisoblanadi?",
      a=["U jim turadi va hech savol bermay, telefoniga qarab o'tiraveradi",
         "U har gapda narxni boshqa joyniki bilan solishtirib, tortishadi",
         "U «keyinroq yozaman» deb, suhbatni tezda tugatishga urinib ko'radi",
         "U yetkazish muddati va to'lov usuli haqida aniq so'ray boshlaydi"], c=3,
      e="Muddat va to'lov kabi amaliy savollar — mijoz qaror qabul qilishga yaqinlashgani belgisi. Bunda sotuvchi xulosa qilib, keyingi qadamni taklif qilishi kerak.",
      qe="Which of the following is a sign that a customer is ready to buy?",
      ae=["They stay silent, ask nothing and just sit looking at their phone",
         "They compare the price with other places in every sentence, arguing",
         "They say “I will write later” and try to finish the talk quickly",
         "They begin asking exactly about delivery time and payment method"],
      ee="Practical questions such as time and payment are a sign the customer is close to deciding. The seller should then summarise and propose the next step."),
 # 12 — B2B (to'g'ri: C)
 dict(q="B2B savdoning oddiy xaridorga sotuvdan (B2C) asosiy farqi nimada?",
      a=["B2B da narx umuman muhim emas, faqat mahsulot rangi hal qiladi",
         "B2B da mijoz doim naqd to'laydi va hech qanday hujjat so'ramaydi",
         "B2B da qaror bir necha kishi bilan kelishiladi, shartnoma tuziladi",
         "B2B da sotuvchi mijoz bilan gaplashmaydi, faqat reklama sotadi"], c=2,
      e="Korxonalar bilan savdoda qaror odatda bir necha kishi (egasi, buxgalter, xaridchi) bilan kelishiladi, shartnoma va to'lov muddati aniq belgilanadi, jarayon uzoqroq davom etadi.",
      qe="What is the main difference of B2B sales from selling to an individual (B2C)?",
      ae=["In B2B price does not matter, only the product colour decides",
         "In B2B the customer always pays cash and asks for no documents",
         "In B2B the decision is agreed with several people, by contract",
         "In B2B the seller does not talk to the customer, only ads sell"],
      ee="In sales to businesses the decision is usually agreed with several people (owner, accountant, buyer), a contract and payment deadline are set clearly and the process takes longer."),
 # 13 — g'azablangan mijoz (to'g'ri: B)
 dict(q="Mijoz g'azab bilan shikoyat yozdi. Sotuvchining birinchi harakati qanday bo'lishi kerak?",
      a=["Xatoga mijozning o'zi sababchi ekanini birinchi bo'lib tushuntirishi",
         "Gapini tinglab, noqulaylikni tan olib, so'ng yechim taklif qilishi",
         "Javob bermay turib, mijoz o'zi tinchlanguncha bir necha kun kutishi",
         "Darhol chegirma va'da qilib, nima bo'lganini so'rab ham o'tirmasligi"], c=1,
      e="G'azablangan mijozga avval his-tuyg'uni tan olish va tinglash kerak, shundan keyin aniq yechim beriladi. Ayblash, kuttirish yoki so'ramasdan chegirma berish muammoni hal qilmaydi.",
      qe="A customer wrote an angry complaint. What should the seller's first action be?",
      ae=["First explain that the customer is the one at fault for the error",
         "Hear them out, acknowledge the inconvenience, then offer a solution",
         "Not reply and wait several days until the customer calms down alone",
         "Promise a discount at once without even asking what had happened"],
      ee="With an angry customer one first acknowledges the feeling and listens, and only then gives a clear solution. Blaming, delaying or giving a discount without asking does not solve the problem."),
 # 14 — "yo'q" javobi (to'g'ri: A)
 dict(q="Mijoz muloyimlik bilan «Yo'q, olmayman» dedi. Eng to'g'ri harakat qaysi?",
      a=["Sababini muloyim so'rab, keyin yozishga ruxsat so'rash va rahmat aytish",
         "Mijozni ko'ndirish uchun «oxirgi dona qoldi» deb shoshilinchlik yaratish",
         "Narxni yarmiga tushirib, mijoz fikrini o'zgartirishga qayta urinib ko'rish",
         "Suhbatni indamay tugatib, mijozni jadvaldan butunlay o'chirib tashlash"], c=0,
      e="Mijozning «yo'q»i bugungi qaror, abadiy emas. Sababini bilish va keyin aloqa qilishga ruxsat so'rash kelajakdagi sotuvga eshik ochadi. Soxta shoshilinchlik ishonchni yo'qotadi.",
      qe="A customer politely said “No, I will not buy”. Which action is the most appropriate?",
      ae=["Politely ask why, then ask permission to write later and say thank you",
         "Create urgency with “the last one is left” in order to convince them",
         "Cut the price in half and try once more to change the customer's mind",
         "End the talk in silence and delete the customer from the table for good"],
      ee="A customer's “no” is today's decision, not forever. Learning the reason and asking permission to get in touch opens the door to a future sale. False urgency destroys trust."),
 # 15 — jadval vazifasi (to'g'ri: D)
 dict(q="Nima uchun har bir so'rovni manbasi, qadami va keyingi aloqa sanasi bilan jadvalga yozib borish kerak?",
      a=["Soliq idoralariga ko'rsatish uchun, boshqa foydasi umuman yo'q",
         "Mijozga yuborish uchun, chunki jadvalni mijoz ham ko'rishi shart",
         "Faqat xodimlar sonini hisoblash va ish haqini belgilash uchun",
         "Hech kim esdan chiqmasligi va yaxshi manba ko'rinib turishi uchun"], c=3,
      e="Jadval kim bilan qachon gaplashishni eslatadi, qaysi manbadan ko'proq mijoz kelayotganini ko'rsatadi va mijoz qaysi qadamda to'xtab qolayotganini aniqlashga yordam beradi.",
      qe="Why should every enquiry be recorded in a table with its source, step and next contact date?",
      ae=["To show it to tax offices, with no other benefit whatsoever",
         "To send it to the customer, since the customer must also see it",
         "Only to count the number of employees and to set their wages",
         "So nobody is forgotten and the best source of customers shows"],
      ee="The table reminds you whom to talk to and when, shows which source brings more customers and helps find the step where customers stall."),
]
