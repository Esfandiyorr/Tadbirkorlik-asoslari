# -*- coding: utf-8 -*-
"""M10 · Savdo jarayonini tashkil etish va mijozlar bilan ishlash — slaydlar va test (21 slayd: sodda tilda, to'liq suhbat
namunasi va animatsion video bilan) (yangi_mavzu.py uchun).
T, d, slide — yangi_mavzu.py beradi.  Ishlatish (shablon — mavzuning o'zi, dvigatel o'zgarmasin):
  python3 _reyting-manba/yangi_mavzu.py _reyting-manba/matn/mavzu_10_matn.py mavzu-10.html "Savdo jarayonini tashkil etish va mijozlar bilan ishlash" 10 "" mavzu-10.html
Video: fayllar/video/M10.mp4 (manba — _reyting-manba/video/ssenariy/m10.js).
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

def oddiy(uz, en):
    """💡 «Oddiy tilda» — har slayddagi asosiy fikr bir-ikki gapda."""
    return E("div", "💡 <b>Oddiy tilda:</b> " + uz, "💡 <b>In plain words:</b> " + en, 'class="quote" style="margin-top:12px"')

G = lambda x: '<span class="grad">' + x + '</span>'
VIDEO = "fayllar/video/M10"


# ============================ 1. MUQOVA ============================
slide("Muqova", "Cover",
 '<div class="inner title-wrap">'
 '<div class="big-logo terdu-logo" role="img" aria-label="Termiz davlat universiteti logotipi"></div><div>' +
 E("span", "M10-mavzu · Amaliy mashg'ulot · 2 soat", "Topic 10 · Practical class · 2 hours", 'class="kicker"') +
 E("h1", "SAVDO JARAYONINI TASHKIL ETISH VA MIJOZLAR BILAN ISHLASH", "ORGANISING THE SALES PROCESS AND WORKING WITH CUSTOMERS", 'class="grad"') +
 E("p", "Savdo — omad emas, <b>7 ta oddiy qadam</b>: mijozni topish, salomlashish, so'rash, taklif qilish, savollarga javob berish, kelishish va aloqada qolish.",
   "Selling is not luck but <b>7 simple steps</b>: find the customer, greet, ask, offer, answer questions, agree and stay in touch.", 'class="lead"') +
 '<div class="meta">' +
 E("div", "📚 Fan: <b>Tadbirkorlik asoslari</b>", "📚 Course: <b>Fundamentals of Entrepreneurship</b>") +
 E("div", "🎓 <b>Termiz davlat universiteti</b>", "🎓 <b>Termez State University</b>") +
 E("div", "🗂 <b>21</b> slayd · <b>15</b> ta test · 🎬 video", "🗂 <b>21</b> slides · <b>15</b> tests · 🎬 video") +
 E("div", "⌨️ <b>→</b> tugmasi bilan davom eting", "⌨️ Press <b>→</b> to continue") +
 '</div></div></div>')

# ============================ 2. MAQSAD ============================
slide("Maqsad va natijalar", "Aims and outcomes",
 E("span", "Mashg'ulotning maqsadi", "Aim of the class", 'class="kicker"') +
 E("h2", "Bugun nimani " + G("o'rganamiz?"), "What will we " + G("learn today?")) +
 E("div", "Maqsad: mijoz bilan qanday gaplashishni, uni qanday tinglashni va <b>halol yo'l bilan</b> qanday sotishni — birinchi salomdan qayta xaridgacha — qadamma-qadam o'rganish.",
   "Aim: to learn step by step how to talk to a customer, how to listen and how to sell <b>honestly</b> — from the first hello to a repeat purchase.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("green", "🪜", "7 qadamni bilaman", "I know the 7 steps", "Savdo qaysi qadamlardan iboratligini va har birida nima qilishni aytib bera olaman.", "I can name the steps of a sale and say what to do at each one.") +
 card("blue", "❓", "To'g'ri so'rayman", "I ask the right way", "Mijozga savol berib, unga aslida nima kerakligini bilib olaman.", "I ask questions and learn what the customer really needs.") +
 card("violet", "🎁", "Foydani aytaman", "I explain the benefit", "Mahsulotni «bu sizga nima beradi?» degan til bilan taklif qilaman.", "I present the product in the language of “what does it give you?”.") +
 card("orange", "🛡", "«Qimmat»ga javob beraman", "I answer “too expensive”", "E'tirozdan qo'rqmayman: bahslashmasdan, sabab va variant bilan javob beraman.", "I am not afraid of objections: I answer with reasons and options, without arguing.") +
 card("pink", "🧮", "Savdoni hisoblayman", "I count sales", "100 kishidan nechtasi sotib olganini va oylik tushumni hisoblay olaman.", "I can count how many of 100 people bought and the monthly revenue.") +
 card("cyan", "🤝", "Mijozni saqlayman", "I keep the customer", "Xariddan keyin ham aloqada bo'lib, mijozni qayta qaytaraman.", "I stay in touch after the sale and bring the customer back.") +
 '</div>')

# ============================ 3. REJA VA LUG'AT ============================
slide("Reja va lug'at", "Plan and glossary",
 E("span", "Mashg'ulot rejasi", "Class plan", 'class="kicker"') +
 E("h2", "4 ta blok va " + G("8 ta yangi so'z"), "4 blocks and " + G("8 new words")) +
 '<div class="grid g4">' +
 card("green", "1️⃣", "Savdo jarayoni", "The sales process", "7 qadam, mijozlarni yozib borish, birinchi salom.", "7 steps, recording customers, the first hello.") +
 card("blue", "2️⃣", "Suhbat", "The conversation", "Savol berish, taklif, «qimmat»ga javob, kelishuv.", "Asking, the offer, answering “too expensive”, the deal.") +
 card("violet", "3️⃣", "Raqamlar", "The numbers", "100 kishidan nechtasi sotib oldi va qancha pul tushdi.", "How many of 100 people bought and how much money came in.") +
 card("orange", "4️⃣", "Mijoz bilan do'stlik", "Long-term relations", "Qayta xarid, korxonalarga sotish, qiyin mijoz.", "Repeat purchases, selling to businesses, difficult customers.") +
 '</div>' + E("h3", "📖 Yangi so'zlar — oddiy tilda", "📖 New words — in plain language", 'style="margin-top:18px"') +
 table([("So'z", "Word"), ("Ma'nosi", "Meaning"), ("Misol", "Example")], [
  [TD("<b>Lid</b>", "<b>Lead</b>"), TD("Qiziqish bildirgan, lekin hali sotib olmagan odam", "Someone interested who has not bought yet"), TD("Instagramda «narxi qancha?» deb yozgan qiz", "A girl who wrote “how much?” on Instagram")],
  [TD("<b>Konversiya</b>", "<b>Conversion</b>"), TD("Qiziqqanlardan necha foizi sotib oldi", "What share of interested people bought"), TD("100 kishi yozdi, 20 tasi oldi → 20%", "100 people wrote, 20 bought → 20%")],
  [TD("<b>O'rtacha chek</b>", "<b>Average order</b>"), TD("Bitta xaridor o'rtacha qancha pul to'laydi", "How much one buyer pays on average"), TD("20 ta buyurtma = 5 mln → 250 000 so'm", "20 orders = 5 mln → 250,000 so'm")],
  [TD("<b>E'tiroz</b>", "<b>Objection</b>"), TD("Mijozning shubhasi yoki «lekin»i", "The customer's doubt or “but”"), TD("«Qimmat ekan», «O'ylab ko'raman»", "“It is expensive”, “I will think”")],
  [TD("<b>Upsell</b>", "<b>Upsell</b>"), TD("Kattaroq yoki yaxshiroq variantni taklif qilish", "Offering a bigger or better version"), TD("2 kg o'rniga 3 kg tort", "A 3 kg cake instead of 2 kg")],
  [TD("<b>Cross-sell</b>", "<b>Cross-sell</b>"), TD("Unga mos qo'shimcha mahsulot", "A matching extra product"), TD("Tortga shamlar va quti", "Candles and a box for the cake")],
  [TD("<b>Qayta xarid</b>", "<b>Repeat purchase</b>"), TD("Mijoz yana qaytib kelib sotib olishi", "The customer comes back and buys again"), TD("Keyingi tug'ilgan kunga yana buyurtma", "Another order for the next birthday")],
  [TD("<b>NPS</b>", "<b>NPS</b>"), TD("Mijozlar bizni do'stiga qanchalik tavsiya qiladi (ball)", "How much customers recommend us (a score)"), TD("«0 dan 10 gacha baholang»", "“Rate us from 0 to 10”", "g")]]))

# ============================ 4. SAVDO NIMA? ============================
slide("Savdo nima?", "What is selling?",
 E("span", "Kirish · Hayotiy misol", "Introduction · A real-life example", 'class="kicker"') +
 E("h2", "Savdo — aldash emas, " + G("yordam berish"), "Selling is not tricking but " + G("helping")) +
 E("div", "Savdo — mijozning muammosini hal qiladigan mahsulotni topib berish va buning uchun haq olish. Yaxshi sotuvchi keraksiz narsani tiqishtirmaydi — u mijozga <b>to'g'ri tanlov qilishga yordam beradi</b>.",
   "Selling means finding the product that solves the customer's problem and being paid for it. A good seller does not push useless things — they <b>help the customer choose well</b>.", 'class="def"') +
 '<div class="grid g2" style="margin-top:14px">' +
 '<div class="card" style="--c:var(--orange)"><span class="icon">🎂</span>' + E("h3", "Hikoya: «Shirin kun» qandolati", "Story: the “Shirin kun” bakery") +
 E("p", "Nilufar Termizda uyda tort pishiradi va Instagram orqali sotadi. Bir oyda unga <b>100 kishi</b> yozadi, lekin faqat <b>20 tasi</b> buyurtma beradi. Qolgan 80 kishi qayerga ketdi?",
   "Nilufar bakes cakes at home in Termez and sells them on Instagram. In a month <b>100 people</b> write to her but only <b>20</b> order. Where did the other 80 go?") +
 '<ul class="tick cross">' + E("li", "Javob 3 soatdan keyin yozildi — mijoz boshqa joydan oldi.", "The reply came 3 hours later — the customer bought elsewhere.") +
 E("li", "Darrov narx aytildi, nima kerakligi so'ralmadi.", "The price came at once; nobody asked what was needed.") +
 E("li", "«Qimmat» deyishganda Nilufar xafa bo'lib, jim qoldi.", "When people said “too expensive”, Nilufar got upset and said nothing.") + '</ul>' +
 E("small", "«Shirin kun» va Nilufar — o'quv uchun o'ylab topilgan misol. Mavzu oxirigacha shu qandolat va uning raqamlari ishlatiladi.", "“Shirin kun” and Nilufar are a made-up teaching example. The same bakery and its numbers are used to the end of the topic.", 'class="note"') + '</div>' +
 '<div>' + card_ul("green", "🔗", "Oldingi mavzular bilan bog'liqlik", "Links to earlier topics", [
  ("<b>7-mavzu</b> (CRM) mijozlarni <b>yozib borishni</b> o'rgatdi.", "<b>Topic 7</b> (CRM) taught how to <b>keep records</b> of customers."),
  ("<b>8-mavzu</b> (reklama) mijozni sizga <b>olib keladi</b>.", "<b>Topic 8</b> (advertising) <b>brings</b> the customer to you."),
  ("<b>10-mavzu</b> (savdo) kelgan odamni <b>xaridorga aylantiradi</b>.", "<b>Topic 10</b> (selling) <b>turns</b> that person into a buyer."),
  ("<b>11-mavzu</b> (narx) to'g'ri narxni qanday qo'yishni o'rgatadi.", "<b>Topic 11</b> (pricing) teaches how to set the right price.")], "tick") +
 '<div class="card" style="--c:var(--blue);margin-top:12px"><span class="icon">🎯</span>' + E("h3", "Bugungi savol", "Today's question") +
 E("p", "Qanday qilsak, 100 kishidan 20 tasi emas, <b>25–30 tasi</b> sotib oladi — hech kimni aldamasdan?",
   "What can we do so that <b>25–30</b> of 100 people buy instead of 20 — without tricking anyone?") + '</div></div></div>')

# ============================ 5. SAVDO JARAYONI ============================
slide("Savdo jarayoni: 7 qadam", "The sales process: 7 steps",
 E("span", "1-blok · Jarayon", "Block 1 · The process", 'class="kicker"') +
 E("h2", "Savdo — " + G("7 qadamli yo'l"), "Selling is " + G("a 7-step path")) +
 E("div", "Har qadamning o'z vazifasi bor. Qadamni tashlab ketsangiz, mijoz ham ketib qoladi. Misollar — Nilufarning «Shirin kun» qandolatidan.",
   "Every step has its own job. Skip a step and the customer leaves too. The examples come from Nilufar's “Shirin kun” bakery.", 'class="def"') +
 '<div class="chain" style="margin-top:14px">' +
 '<div class="link l1">' + E("h3", "1. Mijozni topish", "1. Find the customer") + E("p", "Instagram, tanishlar tavsiyasi, bozor. <i>Misol: tort rasmini joylash.</i>", "Instagram, friends' referrals, the market. <i>Example: posting a cake photo.</i>") + '</div>' +
 '<div class="link l2">' + E("h3", "2. Salomlashish", "2. Greet") + E("p", "Tez va iliq javob, o'zingizni tanishtirish. <i>«Assalomu alaykum, men Nilufar!»</i>", "A quick, warm reply and introducing yourself. <i>“Hello, I am Nilufar!”</i>") + '</div>' +
 '<div class="link l3">' + E("h3", "3. So'rash", "3. Ask") + E("p", "Nima va nega kerakligini bilish. <i>«Qanday tadbirga? Necha kishi?»</i>", "Find out what is needed and why. <i>“What event? How many people?”</i>") + '</div>' +
 '<div class="link l4">' + E("h3", "4. Taklif qilish", "4. Offer") + E("p", "Ehtiyojga mos 2–3 variant va aniq narx.", "2–3 options that fit the need and a clear price.") + '</div></div>' +
 '<div class="chain" style="margin-top:10px">' +
 '<div class="link l4">' + E("h3", "5. Savollarga javob", "5. Answer doubts") + E("p", "«Qimmat», «o'ylab ko'raman» — bahslashmasdan javob.", "“Too expensive”, “I will think” — answer without arguing.") + '</div>' +
 '<div class="link l3">' + E("h3", "6. Kelishish", "6. Agree") + E("p", "Kun, soat, narx, to'lov — aniq kelishiladi.", "Day, time, price, payment — agreed clearly.") + '</div>' +
 '<div class="link l2">' + E("h3", "7. Aloqada qolish", "7. Stay in touch") + E("p", "«Tort yoqdimi?» — fikr so'rash, keyingi taklif.", "“Did you like the cake?” — ask for feedback, a new offer.") + '</div></div>' +
 E("div", "📌 <b>Eng ko'p uchraydigan xato:</b> 2-qadamdan to'g'ri 4-qadamga sakrash — mijozga nima kerakligini so'ramay, darrov narx aytish. Natija: «qimmat ekan» yoki «o'ylab ko'raman».",
   "📌 <b>The most common mistake:</b> jumping from step 2 straight to step 4 — naming the price without asking what the customer needs. The result: “too expensive” or “I will think about it”.", 'class="quote" style="margin-top:12px"'))

# ============================ 6. MIJOZLARNI YOZIB BORISH ============================
slide("Mijozlarni yozib borish", "Recording customers",
 E("span", "1.2 · Mijozlar jadvali", "1.2 · The customer table", 'class="kicker"') +
 E("h2", "Yozilmagan mijoz — " + G("yo'qolgan mijoz"), "An unrecorded customer is " + G("a lost customer")) +
 E("div", "<b>Lid</b> — sizga yozgan, qo'ng'iroq qilgan yoki narx so'ragan, lekin hali sotib olmagan odam. Har bir lidni <b>oddiy jadvalga</b> yozing: kim, qayerdan keldi, qaysi qadamda turibdi, unga qachon yana yozasiz.",
   "A <b>lead</b> is someone who wrote, called or asked the price but has not bought yet. Write every lead into <b>a simple table</b>: who, where from, which step they are at, when you will write again.", 'class="def"') +
 '<div class="grid g2" style="margin-top:14px"><div style="min-width:0">' +
 '<div class="card" style="--c:var(--blue)">' + E("h3", "📒 Nilufarning jadvali (namuna)", "📒 Nilufar's table (sample)") +
 table([("Mijoz", "Customer"), ("Qayerdan", "Source"), ("Qaysi qadamda", "Step"), ("Keyingi aloqa", "Next contact")], [
  [TD("Dilnoza", "Dilnoza"), TD("Instagram", "Instagram"), TD("Taklif berildi", "Offer made"), TD("Ertaga 10:00", "Tomorrow 10:00")],
  [TD("Bobur", "Bobur"), TD("Do'stining tavsiyasi", "A friend's referral"), TD("Savol berilmoqda", "Asking questions"), TD("Bugun 17:00", "Today 17:00")],
  [TD("Kafe «Bahor»", "Café “Bahor”"), TD("Telegram", "Telegram"), TD("Kelishuv", "The deal"), TD("Juma", "Friday")],
  [TD("Malika", "Malika"), TD("Instagram", "Instagram"), TD("«Qimmat» dedi", "Said “too expensive”"), TD("2 kundan keyin", "In 2 days")],
  [TD("Sardor", "Sardor"), TD("O'zi kirib keldi", "Walked in"), TD("Sotib oldi ✅", "Bought ✅"), TD("1 haftadan keyin fikr so'rash", "Ask for feedback in 1 week", "g")]]) + '</div></div>' +
 '<div style="min-width:0">' + card_ul("green", "✅", "Jadval nima beradi?", "What does the table give?", [
  ("Kimga qachon yozishni <b>unutmaysiz</b>.", "You <b>do not forget</b> whom to write to and when."),
  ("Qayerdan <b>ko'proq mijoz</b> kelayotganini ko'rasiz (Instagrammi, tavsiyami).", "You see where <b>more customers</b> come from (Instagram or referrals)."),
  ("Mijozlar qaysi qadamda «to'xtab» qolayotgani ko'rinadi.", "You see at which step customers get stuck."),
  ("Bu — 7-mavzudagi <b>CRM ning eng oddiy ko'rinishi</b>: telefondagi Google Sheets yoki daftar ham yetadi.", "This is the <b>simplest form of the CRM</b> from topic 7: Google Sheets on a phone or a notebook is enough.")], "tick") +
 E("small", "Mijozning telefoni va boshqa shaxsiy ma'lumotini faqat uning roziligi bilan va faqat ish uchun saqlang; hech kimga bermang.",
   "Keep a customer's phone number and other personal data only with their consent and only for work; never give it to anyone.", 'class="note"') +
 '</div></div>')

# ============================ 7. BIRINCHI ALOQA ============================
slide("Birinchi aloqa", "The first contact",
 E("span", "1.3 · Birinchi taassurot", "1.3 · First impression", 'class="kicker"') +
 E("h2", "Birinchi 30 soniya: " + G("ishonchni qozonish"), "The first 30 seconds: " + G("winning trust")) +
 '<div class="grid g4">' +
 card("green", "😊", "Salom va ism", "Hello and name", "Tabassum, salom, o'z ismingiz va biznesingiz nomi.", "A smile, a hello, your name and your business name.") +
 card("blue", "👂", "Avval tinglang", "Listen first", "Darrov mahsulotni maqtamang — mijoz nima izlayotganini so'rang.", "Do not praise the product at once — ask what the customer is looking for.") +
 card("violet", "🙋", "Ismi bilan murojaat", "Use their name", "«Dilnoza opa, tushundim...» — odam o'zini qadrli his qiladi.", "“Dilnoza, I see...” — people feel valued.") +
 card("orange", "⏱", "Tez javob", "Reply fast", "Onlayn yozishmada <b>15 daqiqa</b> ichida javob bering.", "In online chats reply within <b>15 minutes</b>.") +
 '</div><div class="grid g2" style="margin-top:14px">' +
 '<div class="card" style="--c:var(--red)">' + E("h3", "❌ Yomon boshlanish", "❌ A weak start") +
 E("p", "«Nima kerak?» · «Narxi yozilgan, o'qing» · «Hozir bandman, keyin yozing»", "“What do you want?” · “The price is written, read it” · “I am busy, write later”", 'style="font-style:italic"') +
 '<ul class="tick cross">' + E("li", "Mijoz o'zini ortiqcha odamdek his qiladi", "The customer feels unwanted") +
 E("li", "Nima kerakligi haqida bitta ham savol yo'q", "Not a single question about what is needed") + '</ul></div>' +
 '<div class="card" style="--c:var(--green)">' + E("h3", "✅ Yaxshi boshlanish", "✅ A strong start") +
 E("p", "«Assalomu alaykum! Men Nilufar, «Shirin kun» qandolatidan. Tortni qanday tadbir uchun izlayapsiz — tug'ilgan kungami?»",
   "“Hello! I am Nilufar from the “Shirin kun” bakery. What event is the cake for — a birthday?”", 'style="font-style:italic"') +
 '<ul class="tick">' + E("li", "Tanishuv + ochiq savol", "An introduction + an open question") +
 E("li", "Mijoz o'zi gapira boshlaydi", "The customer starts talking") + '</ul></div></div>' +
 oddiy("odam sizdan sotib olishdan oldin <b>sizga ishonishi</b> kerak. Ishonch tez javob, salom va samimiy savoldan boshlanadi.",
       "before people buy from you they must <b>trust you</b>. Trust starts with a quick reply, a hello and a sincere question."))

# ============================ 8. EHTIYOJNI ANIQLASH ============================
slide("Savol berish: 4 tur (SPIN)", "Asking: 4 kinds (SPIN)",
 E("span", "2-blok · Suhbat", "Block 2 · The conversation", 'class="kicker"') +
 E("h2", "To'g'ri savol — " + G("yarim sotuv"), "The right question is " + G("half the sale")) +
 E("div", "<b>Ochiq savol</b> («qanday?», «nega?», «qachon?») — mijoz uzun javob beradi va o'zi gapiradi. <b>Yopiq savol</b> («ha» yoki «yo'q») — faqat aniqlashtirish uchun. Ochiq savollarni 4 tartibda berish qulay — buni qisqacha <b>SPIN</b> deyishadi.",
   "An <b>open question</b> (“how?”, “why?”, “when?”) gets a long answer and the customer talks. A <b>closed question</b> (“yes” or “no”) is only for checking. It helps to ask open questions in 4 steps — called <b>SPIN</b> for short.", 'class="def"') +
 table([("Savol turi", "Question type"), ("Nimani bilib olamiz?", "What do we learn?"), ("Misol (Nilufar so'raydi)", "Example (Nilufar asks)")], [
  [TD("<b>S — Vaziyat</b>", "<b>S — Situation</b>"), TD("Hozir nima bo'lyapti?", "What is happening now?"), TD("«Tadbir qachon va necha kishi bo'ladi?»", "“When is the event and how many people?”")],
  [TD("<b>P — Muammo</b>", "<b>P — Problem</b>"), TD("Nima yoqmayapti, nima qiyin?", "What is wrong or difficult?"), TD("«Oldin olgan tortingizda nima yoqmagan edi?»", "“What did you not like about your last cake?”")],
  [TD("<b>I — Oqibat</b>", "<b>I — Implication</b>"), TD("Muammo hal bo'lmasa, nima bo'ladi?", "What if the problem is not solved?"), TD("«Tort kech kelsa, mehmonlar oldida nima bo'ladi?»", "“If the cake is late, what happens in front of the guests?”")],
  [TD("<b>N — Foyda</b>", "<b>N — Need-payoff</b>"), TD("Yechim nima beradi? (buni mijoz o'zi aytadi)", "What will the solution give? (the customer says it)"), TD("«Tort aniq soatda kelsa, siz uchun qulay bo'ladimi?»", "“Would it help if the cake came exactly on time?”", "g")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("orange", "🧠", "70/30 qoidasi", "The 70/30 rule", "Suhbatning <b>70%</b>ida mijoz gapirsin, <b>30%</b>ida siz. Ko'p tinglagan sotuvchi aniqroq taklif beradi.",
      "The customer talks <b>70%</b> of the time and you <b>30%</b>. A seller who listens more makes a more accurate offer.") +
 card("blue", "🔁", "Eshitganingizni qaytaring", "Repeat what you heard", "«Demak, 20 kishi, shokoladli, shanba kuni soat 18:00 da. To'g'rimi?» — mijoz sizni eshitganingizni ko'radi.",
      "“So: 20 people, chocolate, Saturday at 18:00. Right?” — the customer sees that you listened.") + '</div>')

# ============================ 9. TAKLIF ============================
slide("Taklif: foydani ayting", "The offer: say the benefit",
 E("span", "2.2 · Taklif berish", "2.2 · Making the offer", 'class="kicker"') +
 E("h2", "Xususiyatni " + G("foydaga aylantiring"), "Turn the feature " + G("into a benefit")) +
 E("div", "Mijoz «tort nimadan qilingan?» deb emas, <b>«bu menga nima beradi?»</b> deb o'ylaydi. Shuning uchun 3 qadam bilan gapiring: <b>Xususiyat → Afzallik → Foyda</b> (inglizcha qisqartmasi — <b>FAB</b>). Tayyor qolip: «... <i>shuning uchun</i> ... , <i>bu sizga</i> ... beradi».",
   "The customer does not think “what is the cake made of?” but <b>“what does it give me?”</b>. So speak in 3 steps: <b>Feature → Advantage → Benefit</b> (<b>FAB</b>). A ready pattern: “... <i>so</i> ... , <i>which gives you</i> ...”.", 'class="def"') +
 '<div class="grid g3" style="margin-top:12px">' +
 card("blue", "🧁", "Xususiyat — nima?", "Feature — what?", "«Tort <b>yetkazishdan 6 soat oldin</b> pishiriladi.»", "“The cake is baked <b>6 hours before delivery</b>.”") +
 card("orange", "⭐", "Afzallik — shuning uchun", "Advantage — so", "«<b>Shuning uchun</b> u yangi va yumshoq bo'ladi.»", "“<b>So</b> it stays fresh and soft.”") +
 card("green", "🎉", "Foyda — sizga nima beradi", "Benefit — what you get", "«<b>Bu sizga</b> mehmonlar oldida xotirjamlik beradi — hamma maqtaydi.»", "“<b>That gives you</b> peace of mind in front of the guests — everyone will praise it.”") + '</div>' +
 E("h3", "Bitta narx emas — 3 ta variant bering", "Not one price — give 3 options", 'style="margin-top:14px"') +
 table([("Variant", "Option"), ("Nima kiradi", "What it includes"), ("Narx", "Price")], [
  [TD("<b>Oddiy</b>", "<b>Basic</b>"), TD("Tort 1,5 kg, oddiy bezak", "A 1.5 kg cake, basic decoration"), TD("200 000 so'm", "200,000 so'm")],
  [TD("<b>Standart</b> (ko'pchilik shuni tanlaydi)", "<b>Standard</b> (most choose it)"), TD("Tort 2 kg, bezak + yozuv + shamlar", "A 2 kg cake, decoration + lettering + candles"), TD("<b>250 000 so'm</b>", "<b>250,000 so'm</b>", "g")],
  [TD("<b>Premium</b>", "<b>Premium</b>"), TD("Tort 3 kg, maxsus bezak + shirinlik qutisi + yetkazib berish", "A 3 kg cake, special decoration + a dessert box + delivery"), TD("400 000 so'm", "400,000 so'm")]]) +
 oddiy("bitta narx aytsangiz, mijoz «ha» yoki «yo'q» deydi. 3 ta variant bersangiz, u <b>«qaysi biri?»</b> deb o'ylaydi. Narxni esa o'z xarajatingizdan kelib chiqib qo'ying (11-mavzu).",
       "with one price the customer says “yes” or “no”. With 3 options they think <b>“which one?”</b>. Set prices from your own costs (topic 11)."))

# ============================ 10. E'TIROZLAR ============================
slide("«Qimmat ekan»: e'tirozga javob", "“It is expensive”: answering objections",
 E("span", "2.3 · E'tirozlar", "2.3 · Objections", 'class="kicker"') +
 E("h2", "E'tiroz — rad javobi emas, " + G("savol"), "An objection is not a refusal but " + G("a question")) +
 E("div", "Mijoz «qimmat» desa, demak u hali <b>qiziqyapti</b> — aks holda jim chiqib ketardi. U aslida «nega shu narx?», «sizga ishonsam bo'ladimi?» deb so'rayapti. Bahslashmang — <b>tushunishga</b> harakat qiling.",
   "If the customer says “too expensive”, they are still <b>interested</b> — otherwise they would just leave. They are really asking “why this price?” or “can I trust you?”. Do not argue — <b>try to understand</b>.", 'class="def"') +
 table([("Mijoz aytadi", "The customer says"), ("❌ Noto'g'ri javob", "❌ A wrong answer"), ("✅ To'g'ri javob", "✅ A good answer")], [
  [TD("<b>«Qimmat ekan»</b>", "<b>“It is expensive”</b>"), TD("«Yo'q, arzon! Boshqalar undan ham qimmat!»", "“No, it is cheap! Others are even dearer!”", "r"), TD("«Tushunaman. Qancha atrofida mo'ljallagan edingiz? 200 000 lik oddiy variantni ham ko'rsataymi?»", "“I understand. What amount did you have in mind? Shall I show the 200,000 basic option?”", "g")],
  [TD("<b>«O'ylab ko'raman»</b>", "<b>“I will think about it”</b>"), TD("«Mayli, o'ylang.» (va unutish)", "“OK, think.” (and forget)", "r"), TD("«Albatta. Nimani o'ylab ko'rmoqchisiz — narxnimi, kunnimi? Ertaga soat 10 da yozsam bo'ladimi?»", "“Of course. What will you think over — the price or the day? May I write tomorrow at 10?”", "g")],
  [TD("<b>«Boshqa joyda arzon»</b>", "<b>“It is cheaper elsewhere”</b>"), TD("«Unda o'sha yerdan oling.»", "“Then buy it there.”", "r"), TD("«To'g'ri, narxlar har xil. Bizda tort yetkazishdan 6 soat oldin pishiriladi va soatga aniq yetkaziladi.»", "“True, prices differ. Ours is baked 6 hours before delivery and arrives exactly on time.”", "g")],
  [TD("<b>«Sifatiga ishonmayman»</b>", "<b>“I do not trust the quality”</b>"), TD("«Hamma ishonadi, siz nega ishonmaysiz?»", "“Everyone trusts us, why not you?”", "r"), TD("«Haqlisiz. Mijozlarimiz fikrini ko'rsataman; xohlasangiz, avval kichik 1 kg lik tortdan boshlang.»", "“Fair. I will show customer reviews; you can start with a small 1 kg cake.”", "g")]]) +
 E("h3", "Javob berishning 5 qadami", "5 steps to answer", 'style="margin-top:14px"') +
 '<div class="grid g5">' +
 card("blue", "👂", "1. Tinglang", "1. Listen", "Gapni bo'lmang.", "Do not interrupt.") +
 card("green", "🤝", "2. Tan oling", "2. Acknowledge", "«Tushunaman».", "“I understand”.") +
 card("violet", "❓", "3. Aniqlang", "3. Clarify", "Asl sababini so'rang.", "Ask for the real reason.") +
 card("orange", "💬", "4. Javob bering", "4. Answer", "Dalil yoki boshqa variant bilan.", "With proof or another option.") +
 card("pink", "👉", "5. Qadam so'rang", "5. Ask for a step", "«Davom etamizmi?»", "“Shall we go on?”") + '</div>')

# ============================ 11. KELISHUV ============================
slide("Kelishuvni yakunlash", "Closing the deal",
 E("span", "2.4 · Yakun", "2.4 · Closing", 'class="kicker"') +
 E("h2", "Kelishuvni " + G("bosimsiz yakunlash"), "Closing the deal " + G("without pressure")) +
 '<div class="grid g2"><div>' +
 card_ul("green", "🔔", "Mijoz tayyor ekanini qanday bilamiz?", "How do we know the customer is ready?", [
  ("Yetkazish kuni va to'lov haqida so'raydi.", "Asks about the delivery day and payment."),
  ("«Agar olsam...» deb gapira boshlaydi.", "Starts saying “If I buy...”."),
  ("Tafsilotlarni qayta so'raydi: o'lcham, rang, yozuv.", "Asks about details again: size, colour, lettering."),
  ("Yonidagi odam bilan maslahatlashadi yoki rasmni ko'rsatadi.", "Consults someone or shows the photo to them.")], "tick") + '</div><div>' +
 '<div class="card" style="--c:var(--blue)"><span class="icon">🔑</span>' + E("h3", "Yakunlashning 3 ta halol usuli", "3 honest ways to close") +
 '<ul class="tick">' + E("li", "<b>Tanlov bering:</b> «Standartni olamizmi yoki premiumni?»", "<b>Give a choice:</b> “Shall we take the standard or the premium?”") +
 E("li", "<b>Qisqa takrorlang:</b> «Shanba, 18:00, 2 kg, yozuv bilan — to'g'rimi?»", "<b>Sum it up:</b> “Saturday, 18:00, 2 kg, with lettering — right?”") +
 E("li", "<b>Keyingi qadamni ayting:</b> «Oldindan 50 000 so'm to'lasangiz, buyurtmani yozib qo'yaman.»", "<b>Name the next step:</b> “Pay a 50,000 so'm advance and I will book the order.”") + '</ul></div></div></div>' +
 '<div class="grid g2" style="margin-top:14px">' +
 card("red", "⚠️", "Qilmang!", "Do not!", "Soxta shoshiltirish («oxirgi dona qoldi!»), yolg'on chegirma, majburlash. Bunday mijoz ikkinchi marta qaytmaydi.",
      "Fake urgency (“only one left!”), false discounts, pressure. Such a customer never comes back.") +
 card("orange", "🙂", "«Yo'q» ham normal", "A “no” is normal", "Mijoz rad etsa, sababini muloyim so'rang va «Keyinroq yozsam maylimi?» deng. Bugungi «yo'q» bir oydan keyin «ha» bo'lishi mumkin.",
      "If the customer says no, politely ask why and say “May I write later?”. Today's “no” may be a “yes” in a month.") + '</div>')

# ============================ 12. NAMUNA: TO'LIQ SUHBAT ============================
def Q2(qadam, kim, uz, en, cls=""):
    """Suhbat qatori: qadam raqami va «Kim: gap»."""
    who = {"N": "👩‍🍳 <b>Nilufar:</b> ", "D": "🙋‍♀️ <b>Dilnoza:</b> "}[kim]
    return [TD("<b>" + qadam + "</b>", "<b>" + qadam + "</b>"), TD(who + "«" + uz + "»", who + "“" + en + "”", cls)]

slide("Namuna: to'liq suhbat", "Sample: a full conversation",
 E("span", "2.5 · 7 qadam bitta suhbatda", "2.5 · All 7 steps in one conversation", 'class="kicker"') +
 E("h2", "Nilufar va Dilnoza: " + G("savdo boshidan oxirigacha"), "Nilufar and Dilnoza: " + G("a sale from start to finish")) +
 E("p", "Dilnoza opa Instagramda tort rasmini ko'rib yozdi. Chap ustundagi raqam — 7 qadamdan qaysi biri ekanini ko'rsatadi.",
   "Dilnoza saw a cake photo on Instagram and wrote. The number on the left shows which of the 7 steps it is.", 'class="lead"') +
 table([("Qadam", "Step"), ("Suhbat", "The conversation")], [
  Q2("1", "D", "Assalomu alaykum! Tortlaringiz narxi qancha?", "Hello! How much are your cakes?"),
  Q2("2", "N", "Va alaykum assalom! Men Nilufar, «Shirin kun» qandolatidan. Ismingiz nima?", "Hello! I am Nilufar from the “Shirin kun” bakery. What is your name?"),
  Q2("3", "N", "Dilnoza opa, tort qanday tadbirga va necha kishiga kerak?", "Dilnoza, what event is the cake for and for how many people?"),
  Q2("3", "D", "O'g'limning tug'ilgan kuni, shanba, 20 kishi. O'tgan safar tort kech kelgan edi.", "My son's birthday, Saturday, 20 people. Last time the cake came late."),
  Q2("3", "N", "Tushundim: 20 kishi, shanba, vaqti juda muhim. Soat nechaga kerak?", "I see: 20 people, Saturday, and time really matters. What time do you need it?"),
  Q2("4", "N", "3 ta variant bor: oddiy 1,5 kg — 200 000, standart 2 kg yozuv va shamlar bilan — 250 000, premium 3 kg — 400 000. Tort yetkazishdan 6 soat oldin pishiriladi, shuning uchun yangi bo'ladi.", "There are 3 options: basic 1.5 kg — 200,000, standard 2 kg with lettering and candles — 250,000, premium 3 kg — 400,000. The cake is baked 6 hours before delivery, so it is fresh."),
  Q2("5", "D", "Standart biroz qimmatroq ekan...", "The standard is a bit expensive..."),
  Q2("5", "N", "Tushunaman. Qancha atrofida mo'ljallagan edingiz?", "I understand. What amount did you have in mind?"),
  Q2("5", "D", "200 000 atrofida.", "Around 200,000."),
  Q2("5", "N", "Unda oddiy 1,5 kg lik tortga yozuv va shamlarni qo'shamiz — jami 220 000. 20 kishiga yetadi.", "Then let us add lettering and candles to the basic 1.5 kg cake — 220,000 in total. It is enough for 20 people."),
  Q2("6", "N", "Demak: shanba, 18:00, 1,5 kg, yozuv va shamlar bilan, 220 000 so'm. To'g'rimi? 50 000 oldindan to'lasangiz, yozib qo'yaman.", "So: Saturday, 18:00, 1.5 kg, with lettering and candles, 220,000 so'm. Right? Pay 50,000 in advance and I will book it.", "g"),
  Q2("6", "D", "To'g'ri, hozir o'tkazaman!", "Right, I will send it now!", "g"),
  Q2("7", "N", "(yakshanba) Dilnoza opa, tort yoqdimi? Mehmonlar nima deyishdi?", "(Sunday) Dilnoza, did you like the cake? What did the guests say?")]) +
 oddiy("Nilufar <b>5 daqiqada</b> javob berdi, ism bilan murojaat qildi, narxdan oldin <b>3 ta savol</b> berdi, «qimmat»ga bahslashmay <b>mos variant</b> topdi va xariddan keyin <b>fikr so'radi</b> — keyingi buyurtma shu yerdan boshlanadi.",
       "Nilufar replied in <b>5 minutes</b>, used the customer's name, asked <b>3 questions</b> before the price, found <b>a fitting option</b> instead of arguing about “expensive” and <b>asked for feedback</b> after the sale — the next order starts there."))

# ============================ 13. SAVDO HISOBI ============================
slide("Savdo hisobi", "Counting sales",
 E("span", "3-blok · Raqamlar", "Block 3 · The numbers", 'class="kicker"') +
 E("h2", "Pul qayerdan " + G("ko'payadi?"), "Where does more money " + G("come from?")) +
 E("div", "Tushum (bir oyda tushgan pul) uchta songa bog'liq: <b>Tushum = so'ragan odamlar soni × konversiya × o'rtacha chek.</b> Uchtadan bittasi o'ssa, tushum ham o'sadi.",
   "Revenue (the money that comes in a month) depends on three numbers: <b>Revenue = number of people who asked × conversion × average order.</b> If one of them grows, revenue grows.", 'class="def"') +
 '<div class="grid g4" style="margin-top:14px">' +
 stat("100", "1-qadam: oyiga 100 kishi yozdi", "Step 1: 100 people wrote in a month") +
 stat("20%", "2-qadam: 20 tasi oldi → 20 ÷ 100 = 20%", "Step 2: 20 bought → 20 ÷ 100 = 20%", "o") +
 stat("250 000", "3-qadam: har biri o'rtacha 250 000 so'm", "Step 3: each paid 250,000 so'm on average", "v") +
 stat("5 mln", "Natija: 20 × 250 000 = 5 000 000 so'm", "Result: 20 × 250,000 = 5,000,000 so'm") + '</div>' +
 E("h3", "Qaysi yo'l pulni ko'proq oshiradi?", "Which way adds the most money?", 'style="margin-top:14px"') +
 table([("Variant", "Option"), ("Hisob", "Calculation"), ("Tushum", "Revenue"), ("Farq", "Difference")], [
  [TD("<b>A. Hozir</b>", "<b>A. Now</b>"), TD("100 × 20% × 250 000", "100 × 20% × 250,000"), TD("5 000 000", "5,000,000"), TD("—", "—")],
  [TD("<b>B. 25 kishi oladi</b> (tez javob, 3 variant)", "<b>B. 25 people buy</b> (fast replies, 3 options)"), TD("100 × 25% × 250 000", "100 × 25% × 250,000"), TD("6 250 000", "6,250,000"), TD("<b>+1 250 000</b>", "<b>+1,250,000</b>", "g")],
  [TD("<b>C. Chek 275 000</b> (shamlar va quti qo'shildi)", "<b>C. Average order 275,000</b> (candles and a box added)"), TD("100 × 20% × 275 000", "100 × 20% × 275,000"), TD("5 500 000", "5,500,000"), TD("+500 000", "+500,000")],
  [TD("<b>D. 105 kishi yozadi</b> (+5 kishi reklama orqali)", "<b>D. 105 people write</b> (+5 via ads)"), TD("105 × 20% × 250 000", "105 × 20% × 250,000"), TD("5 250 000", "5,250,000"), TD("+250 000", "+250,000")],
  [TD("<b>E. B va C birga</b>", "<b>E. B and C together</b>"), TD("100 × 25% × 275 000", "100 × 25% × 275,000"), TD("6 875 000", "6,875,000"), TD("<b>+1 875 000</b>", "<b>+1,875,000</b>", "g")]]) +
 oddiy("yangi mijoz qidirishdan oldin <b>yozgan odamlarni yo'qotmang</b>. Yaxshi gaplashib 100 kishidan 25 tasiga sotish reklamani ko'paytirishdan ancha foydali. Esda tuting: tushum ≠ foyda — xarajatni ham hisoblang.",
       "before looking for new customers, <b>do not lose the people who already wrote</b>. Selling to 25 of 100 by talking well is far more useful than more ads. Remember: revenue ≠ profit — count the costs too."))

# ============================ 14. SAQLASH ============================
slide("Mijozni saqlash", "Keeping the customer",
 E("span", "4-blok · Uzoq aloqa", "Block 4 · Long-term relations", 'class="kicker"') +
 E("h2", "Birinchi xarid — " + G("do'stlikning boshlanishi"), "The first purchase is " + G("the start of a friendship")) +
 E("div", "Yangi mijoz topish eski mijozga yana sotishdan <b>qimmatroq</b> (reklama, vaqt). Shuning uchun xariddan keyin ham aloqani uzmang: yaxshi xizmat — eng arzon reklama.",
   "Finding a new customer costs <b>more</b> than selling again to an old one (ads, time). So keep in touch after the sale: good service is the cheapest advertising.", 'class="def"') +
 '<div class="grid g2" style="margin-top:14px">' +
 '<div class="card" style="--c:var(--green)">' + E("h3", "📅 Xariddan keyin qachon yozamiz?", "📅 When do we write after the sale?") +
 table([("Qachon", "When"), ("Nima qilamiz", "What we do")], [
  [TD("<b>Ertasi kuni</b>", "<b>The next day</b>"), TD("«Tort yoqdimi?» — qisqa xabar", "“Did you like the cake?” — a short message")],
  [TD("<b>1 haftadan keyin</b>", "<b>After 1 week</b>"), TD("Fikr so'rash; rasmini joylashga ruxsat so'rash", "Ask for feedback; ask to post the photo")],
  [TD("<b>1 oydan keyin</b>", "<b>After 1 month</b>"), TD("Yangi tort yoki bayram aksiyasi haqida xabar", "A message about a new cake or a holiday offer")],
  [TD("<b>Yiliga bir marta</b>", "<b>Once a year</b>"), TD("Muhim sanada tabriklash (o'g'lining tug'ilgan kuni)", "Greetings on an important date (her son's birthday)")]]) + '</div>' +
 '<div>' + card_ul("blue", "🔁", "Ko'proq sotishning 4 halol yo'li", "4 honest ways to sell more", [
  ("<b>Upsell</b> — kattarog'ini taklif qilish: 20 kishiga 1,5 kg kam bo'lsa, 2 kg.", "<b>Upsell</b> — offer a bigger one: if 1.5 kg is too small for 20 people, 2 kg."),
  ("<b>Cross-sell</b> — mosini qo'shish: tort + shamlar + shirinlik qutisi.", "<b>Cross-sell</b> — add a match: a cake + candles + a dessert box."),
  ("<b>Tavsiya</b> — «Do'stingizga aytsangiz, ikkalangizga 10% chegirma».", "<b>Referral</b> — “Tell a friend and you both get 10% off”."),
  ("<b>Sodiqlik</b> — 5-buyurtmaga sovg'a.", "<b>Loyalty</b> — a gift on the 5th order.")], "tick") + '</div></div>' +
 E("small", "Qo'shimcha taklif mijozga <b>haqiqatan kerak</b> bo'lsa ishlaydi; majburlansa — ishonch yo'qoladi. Ruxsatsiz ommaviy xabar (spam) yubormang.",
   "An extra offer works if the customer <b>really needs it</b>; if forced, trust is lost. Do not send bulk messages without permission (spam).", 'class="note"'))

# ============================ 15. B2C VA B2B ============================
slide("Odamga va korxonaga sotish", "Selling to people and to businesses",
 E("span", "4.2 · Mijoz turi", "4.2 · Type of customer", 'class="kicker"') +
 E("h2", "Oddiy xaridor va " + G("korxona"), "An individual buyer and " + G("a business")) +
 E("div", "<b>B2C</b> (inglizcha «biznesdan iste'molchiga») — oddiy odamga sotish: Dilnoza opa o'g'liga tort oladi. <b>B2B</b> («biznesdan biznesga») — boshqa korxonaga sotish: «Bahor» kafesi har hafta shirinlik oladi.",
   "<b>B2C</b> (“business to consumer”) is selling to an ordinary person: Dilnoza buys a cake for her son. <b>B2B</b> (“business to business”) is selling to another company: café “Bahor” buys desserts every week.", 'class="def"') +
 table([("", ""), ("B2C — oddiy xaridor", "B2C — an individual"), ("B2B — korxona", "B2B — a business")], [
  [TD("<b>Kim qaror qiladi</b>", "<b>Who decides</b>"), TD("Bitta odam, ko'pincha tez", "One person, often quickly"), TD("Bir necha kishi: egasi, buxgalter, xaridor", "Several people: owner, accountant, buyer")],
  [TD("<b>Qancha vaqtda</b>", "<b>How long</b>"), TD("Daqiqalar, kunlar", "Minutes, days"), TD("Kunlar, haftalar", "Days, weeks")],
  [TD("<b>Nimaga qaraydi</b>", "<b>What they look at</b>"), TD("Ehtiyoj, his-tuyg'u, narx", "Need, feelings, price"), TD("Foyda, ishonchlilik, o'z vaqtida yetkazish", "Profit, reliability, on-time delivery")],
  [TD("<b>Hujjat</b>", "<b>Documents</b>"), TD("Chek yoki yozishma", "A receipt or a chat"), TD("Shartnoma, hisob-faktura", "A contract, an invoice")],
  [TD("<b>To'lov</b>", "<b>Payment</b>"), TD("Darrov: naqd yoki karta", "At once: cash or card"), TD("Ko'pincha keyinroq — kechikish xavfi bor", "Often later — there is a risk of delay", "r")],
  [TD("<b>Hajm</b>", "<b>Volume</b>"), TD("Kichik, mijoz ko'p", "Small, many customers"), TD("Katta, mijoz kam — har biri muhim", "Large, few customers — each matters", "g")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("green", "🏢", "Korxonaga sotishda", "When selling to a business", "Narx va shartlarni <b>yozma</b> kelishing, avval <b>sinov partiyasi</b> bering, to'lov kunini shartnomada aniq yozing.",
      "Agree prices and terms <b>in writing</b>, start with <b>a trial batch</b>, write the payment day clearly in the contract.") +
 card("orange", "☕", "Misol: «Bahor» kafesi", "Example: café “Bahor”", "Haftasiga 6 ta shirinlik, to'lov — har juma. Bitta shunday mijoz 12 ta oddiy mijozga teng bo'lishi mumkin.",
      "6 desserts a week, payment every Friday. One such customer can equal 12 ordinary ones.") + '</div>' +
 E("small", "Shartnoma va soliq qoidalari tez-tez yangilanadi. Yuridik kelishuvdan oldin lex.uz dagi amaldagi qoidalarni tekshiring yoki mutaxassisdan so'rang.",
   "Contract and tax rules change often. Before a legal agreement check the current rules on lex.uz or ask a specialist.", 'class="note"'))

# ============================ 16. QIYIN MIJOZ ============================
slide("Qiyin mijoz va odob", "Difficult customers and manners",
 E("span", "4.3 · Muloqot madaniyati", "4.3 · Communication culture", 'class="kicker"') +
 E("h2", "Har xil mijoz — " + G("har xil yondashuv"), "Different customers — " + G("different approaches")) +
 table([("Mijoz", "Customer"), ("Qanday tanish mumkin", "How to recognise"), ("Nima qilish kerak", "What to do")], [
  [TD("<b>⚡ Shoshqaloq</b>", "<b>⚡ In a hurry</b>"), TD("«Qisqa ayting, vaqtim yo'q»", "“Be brief, I have no time”"), TD("Asosiy foyda va narxni 2 gapda ayting, keyin so'rang.", "Say the main benefit and price in 2 sentences, then ask.", "g")],
  [TD("<b>🤔 Ikkilanuvchi</b>", "<b>🤔 Hesitant</b>"), TD("«Bilmadim... balki...»", "“I don't know... maybe...”"), TD("2 ta aniq variant bering, mijozlar fikrini ko'rsating, shoshiltirmang.", "Give 2 clear options, show reviews, do not rush.", "g")],
  [TD("<b>😠 Jahli chiqqan</b>", "<b>😠 Angry</b>"), TD("Baland ovoz yoki qattiq xabar", "A raised voice or a harsh message"), TD("Oxirigacha tinglang, «tushunaman, noqulay bo'libdi» deng, keyin yechim taklif qiling.", "Hear them out, say “I understand, that was unpleasant”, then offer a solution.", "g")],
  [TD("<b>🤐 Kam gapiradigan</b>", "<b>🤐 Quiet</b>"), TD("Qisqa javoblar", "Short answers"), TD("Ochiq savol bering, rasm yoki namuna ko'rsating, vaqt bering.", "Ask open questions, show a photo or sample, give time.", "g")],
  [TD("<b>💬 Ko'p so'raydigan</b>", "<b>💬 Asks a lot</b>"), TD("Bir savolni qayta-qayta beradi", "Asks the same thing again and again"), TD("Savollarni bitta xabarda ro'yxat qilib javob bering, keyin qaror so'rang.", "Answer all questions in one listed message, then ask for a decision.", "g")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card_ul("green", "🤝", "Muloqot odobi", "Good manners", [
  ("Mijozga hurmat bilan «Siz» deb murojaat qiling.", "Speak to the customer politely and respectfully."),
  ("Va'da bergan vaqtda javob bering.", "Reply at the time you promised."),
  ("Bilmagan narsangizga «tekshirib, aytaman» deng.", "Say “I will check and tell you” when you do not know."),
  ("Xato bo'lsa, mijozdan oldin o'zingiz ayting.", "If something goes wrong, tell the customer first.")], "tick") +
 card("red", "⚠️", "Chegara: halollik", "The limit: honesty", "Aldash, yashirin to'lov, yolg'on va'da, raqibni yomonlash — bir marta sotuv beradi, lekin <b>obro'ni butunlay yo'qotadi</b>. Mijozning shaxsiy ma'lumotini himoya qiling.",
      "Tricks, hidden fees, false promises, badmouthing rivals — they bring one sale but <b>ruin your reputation</b>. Protect the customer's personal data.") + '</div>')

# ============================ 17. O'LCHASH ============================
slide("Mijoz xursandmi? O'lchash", "Is the customer happy? Measuring",
 E("span", "4.4 · Ko'rsatkichlar", "4.4 · Metrics", 'class="kicker"') +
 E("h2", "Mijoz xursandmi? " + G("Raqam bilan tekshiring"), "Is the customer happy? " + G("Check it with numbers")) +
 E("div", "«Menimcha, hamma xursand» — bu taxmin. Har oy bir xil savollar bilan o'lchasangiz, nima yaxshilanayotganini <b>aniq ko'rasiz</b>.",
   "“I think everyone is happy” is a guess. Measure with the same questions every month and you will <b>see clearly</b> what is improving.", 'class="def"') +
 table([("Ko'rsatkich", "Metric"), ("Qanday hisoblanadi", "How to count"), ("Misol («Shirin kun»)", "Example (“Shirin kun”)")], [
  [TD("<b>Tavsiya indeksi (NPS)</b>", "<b>Recommendation score (NPS)</b>"), TD("tavsiya qiluvchilar % − tanqid qiluvchilar %", "promoters % − critics %"), TD("50 kishidan 30 tasi tavsiya qiladi (60%), 8 tasi tanqid (16%): 60 − 16 = <b>44</b>", "Of 50 people 30 recommend (60%), 8 criticise (16%): 60 − 16 = <b>44</b>")],
  [TD("<b>Qayta xarid</b>", "<b>Repeat purchases</b>"), TD("qayta olganlar ÷ barcha mijozlar × 100", "repeat buyers ÷ all customers × 100"), TD("60 mijozdan 21 tasi yana oldi: 21 ÷ 60 × 100 = <b>35%</b>", "21 of 60 customers bought again: 21 ÷ 60 × 100 = <b>35%</b>")],
  [TD("<b>Ketgan mijozlar (churn)</b>", "<b>Lost customers (churn)</b>"), TD("ketganlar ÷ oy boshidagi mijozlar × 100", "lost ÷ customers at the start × 100"), TD("80 mijozdan 8 tasi ketdi: <b>10%</b>", "8 of 80 customers left: <b>10%</b>", "r")],
  [TD("<b>Javob tezligi</b>", "<b>Reply speed</b>"), TD("birinchi javobgacha o'tgan vaqt", "time until the first reply"), TD("O'rtacha 12 daqiqa (maqsad — 15 dan kam)", "12 minutes on average (target: under 15)", "g")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("blue", "📋", "NPS ni qanday so'raymiz?", "How do we ask for NPS?", "«0 dan 10 gacha, bizni do'stingizga tavsiya qilasizmi?» <b>9–10</b> — tavsiya qiluvchi, <b>7–8</b> — betaraf, <b>0–6</b> — tanqid qiluvchi. Oxirida «nega?» deb so'rang.",
      "“From 0 to 10, would you recommend us to a friend?” <b>9–10</b> — promoter, <b>7–8</b> — neutral, <b>0–6</b> — critic. Finish with “why?”.") +
 card("green", "🔍", "Raqamlarni birga o'qing", "Read the numbers together", "Javob tez, lekin qayta xarid kam bo'lsa — muammo xizmatda emas, <b>mahsulot yoki narxda</b> bo'lishi mumkin.",
      "If replies are fast but repeat purchases are low, the problem may be in <b>the product or price</b>, not the service.") + '</div>')

# ============================ 18. VIDEO DARS ============================
slide("🎬 Video dars", "🎬 Video lesson",
 E("span", "Ko'ring va muhokama qiling", "Watch and discuss", 'class="kicker"') +
 E("h2", "🎬 Animatsion video: " + G("savdoning 7 qadami"), "🎬 Animated video: " + G("the 7 steps of a sale")) +
 '<figure class="video-wrap sq-film" style="margin:0"><video controls playsinline preload="none" poster="' + VIDEO + '.jpg" src="' + VIDEO + '.mp4" style="width:100%;max-height:58vh;border-radius:18px;background:#000">'
 '<track kind="subtitles" srclang="uz" label="O‘zbekcha" src="' + VIDEO + '.vtt" default></video>' +
 E("figcaption", "⏱ Davomiyligi — taxminan 5 daqiqa · ovozsiz, subtitr bilan (pleyerdagi «CC» tugmasi)", "⏱ About 5 minutes · silent, with subtitles (the “CC” button in the player)", 'style="margin-top:8px;color:var(--muted);font-size:14px"') + '</figure>' +
 '<div class="grid g3" style="margin-top:14px">' +
 card("green", "👋", "1. Salomlashish", "1. The greeting", "Nilufar suhbatni qanday boshladi? Qaysi savol bilan?", "How did Nilufar start the conversation? With which question?") +
 card("orange", "🛡", "2. «Qimmat ekan»", "2. “It is expensive”", "Dilnoza «qimmat» deganda Nilufar nima qildi? Nega bahslashmadi?", "What did Nilufar do when Dilnoza said “expensive”? Why did she not argue?") +
 card("violet", "🧮", "3. Raqamlar", "3. The numbers", "Konversiya 20% dan 25% ga chiqsa, tushum qanchaga o'sadi?", "If conversion rises from 20% to 25%, how much does revenue grow?") + '</div>')

# ============================ 19. AMALIY TOPSHIRIQ ============================
slide("Amaliy topshiriq", "Practical task",
 E("span", "Amaliy mashg'ulot · 2 soat", "Practical class · 2 hours", 'class="kicker"') +
 E("h2", "«Savdo " + G("rolli o'yini") + "» va savdo kartochkasi", "The “sales " + G("role play") + "” and a sales card") +
 E("p", "Juftlikda ishlaysiz: biri sotuvchi, biri mijoz, keyin rollar almashadi. Har kim o'z mahsuloti (yoki «Shirin kun» torti) uchun A4 varaqda «savdo kartochkasi» tayyorlaydi.",
   "Work in pairs: one is the seller, one is the customer, then swap. Everyone prepares an A4 “sales card” for their own product (or the “Shirin kun” cake).", 'class="lead"') +
 '<div class="grid g2"><div class="card" style="--c:var(--blue)">' + E("h3", "⏱ 120 daqiqalik reja", "⏱ The 120-minute plan") +
 table([("Vaqt", "Time"), ("Nima qilinadi", "What to do")], [
  [TD("0–15", "0–15"), TD("Mahsulot va 3 xil mijozni tanlash", "Choose a product and 3 kinds of customers")],
  [TD("15–40", "15–40"), TD("5 ta ochiq savol (SPIN) va «xususiyat → foyda» gapini yozish", "Write 5 open questions (SPIN) and a “feature → benefit” sentence")],
  [TD("40–60", "40–60"), TD("3 variantli narx va 4 ta e'tirozga javob tayyorlash", "Prepare a 3-option price and answers to 4 objections")],
  [TD("60–95", "60–95"), TD("Rolli o'yin: 5 daqiqadan, ikki marta (rollar almashadi)", "Role play: 5 minutes each, twice (roles swap)")],
  [TD("95–110", "95–110"), TD("Hisob: 100 kishi, konversiya, o'rtacha chek, tushum", "Calculation: 100 people, conversion, average order, revenue")],
  [TD("110–120", "110–120"), TD("Bir-biringizni baholash va xulosa", "Assess each other and wrap up")]]) + '</div>' +
 '<div><div class="card" style="--c:var(--green)">' + E("h3", "📋 Savdo kartochkasida bo'lsin", "📋 The sales card must have") +
 '<ul class="clean">' + E("li", "Mahsulot va 3 xil mijoz", "The product and 3 kinds of customers") +
 E("li", "5 ta ochiq savol (S, P, I, N tartibida)", "5 open questions (in S, P, I, N order)") +
 E("li", "«Xususiyat → afzallik → foyda» gapi va 3 variantli narx", "A “feature → advantage → benefit” sentence and a 3-option price") +
 E("li", "4 ta e'tiroz va ularga javob", "4 objections and the answers") +
 E("li", "Hisob: so'rov, konversiya, chek, tushum", "Calculation: enquiries, conversion, average order, revenue") +
 E("li", "Xariddan keyin qachon va nima deb yozishingiz", "When and what you will write after the sale") + '</ul></div>' +
 '<div class="card" style="--c:var(--amber);margin-top:12px">' + E("h3", "🏅 Baholash", "🏅 Assessment") +
 E("p", "Savollar va tinglash <b>30%</b> · taklif va e'tirozlar <b>30%</b> · hisob-kitob <b>25%</b> · halollik va odob <b>15%</b>.", "Questions and listening <b>30%</b> · offer and objections <b>30%</b> · calculation <b>25%</b> · honesty and manners <b>15%</b>.") + '</div></div></div>')

# ============================ 20. XULOSA ============================
slide("Xulosa va resurslar", "Summary and resources",
 E("span", "Xulosa · Mustaqil ish · Havolalar", "Summary · Independent work · Links", 'class="kicker"') +
 E("h2", "Eslab qoling: " + G("6 ta asosiy fikr"), "Remember: " + G("6 key ideas")) +
 '<div class="grid g2"><div>' +
 card_ul("green", "📌", "Esda qoladigan 6 ta fikr", "6 things to remember", [
  ("Savdo — <b>7 qadam</b>: topish, salom, so'rash, taklif, javob, kelishish, aloqada qolish.", "Selling is <b>7 steps</b>: find, greet, ask, offer, answer, agree, stay in touch."),
  ("Har bir yozgan odamni <b>jadvalga yozing</b>.", "<b>Write down</b> everyone who contacts you."),
  ("Ko'proq <b>tinglang</b>: ochiq savollar, 70/30 qoidasi.", "<b>Listen</b> more: open questions, the 70/30 rule."),
  ("Xususiyatni emas, <b>foydani</b> ayting va 3 variant bering.", "Talk about the <b>benefit</b>, not the feature, and give 3 options."),
  ("<b>«Qimmat» — bu savol:</b> tinglang, tan oling, so'rang, javob bering, qadam so'rang.", "<b>“Expensive” is a question:</b> listen, acknowledge, ask, answer, ask for a step."),
  ("Tushum = <b>so'rov × konversiya × chek</b>; eski mijozni saqlash — eng arzon o'sish.", "Revenue = <b>enquiries × conversion × average order</b>; keeping old customers is the cheapest growth.")]) +
 '<div class="card" style="--c:var(--amber);margin-top:12px">' + E("h3", "📓 Mustaqil ish: «Bir haftalik savdo daftari»", "📓 Independent work: “A one-week sales diary”") +
 '<ul class="clean">' + E("li", "7 kun davomida sizga yozgan yoki so'ragan har bir odamni jadvalga yozing.", "For 7 days write down everyone who wrote to you or asked.") +
 E("li", "Hafta oxirida konversiya, o'rtacha chek va tushumni hisoblang.", "At the end of the week count conversion, average order and revenue.") +
 E("li", "Mijozlar qaysi qadamda «to'xtab» qoldi? Nega?", "At which step did customers get stuck? Why?") +
 E("li", "Keyingi hafta uchun bitta yaxshilash rejasi yozing.", "Write one improvement plan for next week.") + '</ul>' +
 E("p", "Hajmi: 1–2 bet + jadval. Baholash: jadval 40% · hisob 30% · reja 30%.", "Size: 1–2 pages + a table. Marking: table 40% · calculation 30% · plan 30%.", 'style="font-size:13.5px;color:var(--muted)"') + '</div></div>' +
 '<div><div class="card" style="--c:var(--blue)">' + E("h3", "🔗 Foydali resurslar", "🔗 Useful resources") +
 E("p", "<b>Qonun va rasmiy manbalar:</b>", "<b>Law and official sources:</b>") +
 '<ul class="clean">' +
 E("li", '<a class="lnk" href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> — iste\'molchilar huquqlari, shartnoma va savdo qoidalari', '<a class="lnk" href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> — consumer rights, contract and trade rules') +
 E("li", '<a class="lnk" href="https://birdarcha.uz" target="_blank" rel="noopener">birdarcha.uz</a> — biznesni ro\'yxatdan o\'tkazish', '<a class="lnk" href="https://birdarcha.uz" target="_blank" rel="noopener">birdarcha.uz</a> — business registration') +
 E("li", '<a class="lnk" href="https://stat.uz" target="_blank" rel="noopener">stat.uz</a> — rasmiy statistika', '<a class="lnk" href="https://stat.uz" target="_blank" rel="noopener">stat.uz</a> — official statistics') +
 E("li", '<a class="lnk" href="https://ombudsman.uz" target="_blank" rel="noopener">ombudsman.uz</a> — Biznes ombudsmani', '<a class="lnk" href="https://ombudsman.uz" target="_blank" rel="noopener">ombudsman.uz</a> — the Business Ombudsman') + '</ul>' +
 E("p", "<b>Bepul vositalar:</b>", "<b>Free tools:</b>", 'style="margin-top:8px"') +
 E("p", '<a class="lnk" href="https://docs.google.com" target="_blank" rel="noopener">docs.google.com</a> — mijozlar jadvali va hisob · <a class="lnk" href="https://telegram.org" target="_blank" rel="noopener">telegram.org</a> — mijoz bilan yozishma',
   '<a class="lnk" href="https://docs.google.com" target="_blank" rel="noopener">docs.google.com</a> — customer table and calculations · <a class="lnk" href="https://telegram.org" target="_blank" rel="noopener">telegram.org</a> — chatting with customers') +
 E("p", "<b>O'qish uchun:</b> Neil Rackham — «SPIN Selling» · Dale Carnegie — «Do'st orttirish va odamlarga ta'sir qilish» (How to Win Friends and Influence People).", "<b>Further reading:</b> Neil Rackham — “SPIN Selling” · Dale Carnegie — “How to Win Friends and Influence People”.", 'style="margin-top:8px"') +
 E("small", "⚠️ Qonun va platforma qoidalari o'zgaradi. Har doim amaldagi rasmiy ma'lumotga tayaning.", "⚠️ Laws and platform rules change. Always rely on current official information.", 'class="note"') +
 '</div></div></div>')

# ============================ 21. TEST ============================
slide("TEST · Bilimni tekshirish", "TEST · Check your knowledge",
 E("span", "Yakuniy nazorat", "Final check", 'class="kicker"') +
 E("h2", "🧪 Test topshiriqlari — " + G("15 ta savol"), "🧪 Test tasks — " + G("15 questions")) +
 '<div class="scorebar"><span><span data-ui="score">Natija:</span> <b><span id="scoreNow">0</span> / <span id="scoreMax">15</span></b></span>'
 '<span><span data-ui="answered">Javob berildi:</span> <b id="answered">0</b></span><div class="spacer"></div>' +
 E("button", "↻ Testni qayta boshlash", "↻ Restart the test", 'class="btn warn" id="btnReset"') + '</div>'
 '<div id="testWrap"></div><div class="result" id="result"><div class="pct" id="pct">0%</div>' +
 E("h3", "Natija", "Result", 'id="resTitle" style="color:#fff;margin:10px 0 4px"') + '<p id="resTxt" style="color:#fff;opacity:.95;margin:0"></p></div>'
 '<div class="card" style="--c:var(--green);margin-top:18px;text-align:center">' +
 E("h3", "🎓 Rahmat! E'tiboringiz uchun tashakkur", "🎓 Thank you for your attention!") +
 E("p", "Keyingi mashg'ulotgacha <b>savdo kartochkasini</b> tugating va bir hafta davomida savdo daftarini yuriting. Keyingi mavzu — mahsulot narxini shakllantirish.",
   "Before the next class finish your <b>sales card</b> and keep the sales diary for a week. Next topic: pricing a product.") +
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
