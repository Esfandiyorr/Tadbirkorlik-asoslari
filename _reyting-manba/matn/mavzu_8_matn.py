# -*- coding: utf-8 -*-
"""M8 · Mahsulotni reklama qilish va mijozga yetkazish — slaydlar va test (yangi_mavzu.py uchun).
T, d, slide — yangi_mavzu.py beradi.  Ishlatish:
  python3 _reyting-manba/yangi_mavzu.py _reyting-manba/matn/mavzu_8_matn.py mavzu-8.html "Mahsulotni reklama qilish va mijozga yetkazish" 8
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
 E("span", "M8-mavzu · Amaliy mashg'ulot · 2 soat", "Topic 8 · Practical class · 2 hours", 'class="kicker"') +
 E("h1", "MAHSULOTNI REKLAMA QILISH VA MIJOZGA YETKAZISH", "ADVERTISING A PRODUCT AND DELIVERING IT TO THE CUSTOMER", 'class="grad"') +
 E("p", "Mijoz sizni qanday topadi · reklama kanali va matni · <b>reklama o'zini oqlaydimi</b> · mahsulotni mijozga yetkazish · buyurtma va shikoyat bilan ishlash.",
   "How a customer finds you · the advertising channel and message · <b>does the advertising pay off</b> · delivering the product · handling orders and complaints.", 'class="lead"') +
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
 E("div", "Maqsad: talaba mahsulotini <b>kimga, qayerda va qanday xabar bilan</b> ko'rsatishni hamda uni mijozga <b>o'z vaqtida, butun va foydali</b> yetkazishni o'rganadi — reklamaga sarflangan har bir so'm hisob-kitob bilan ishlaydi.",
   "Aim: the student learns <b>to whom, where and with what message</b> to show a product, and how to deliver it <b>on time, intact and profitably</b> — every som spent on advertising works on the basis of calculation.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("green", "🎯", "Mijozni aniqlaydi", "Defines the customer", "Kimga sotayotganini va u qayerda vaqt o'tkazishini aniq yozadi.", "Writes down exactly who the buyer is and where they spend their time.") +
 card("blue", "📣", "Kanal tanlaydi", "Chooses a channel", "Byudjetiga mos 2–3 ta reklama kanalini asoslab tanlaydi.", "Chooses 2–3 advertising channels that fit the budget and explains why.") +
 card("violet", "✍️", "Matn yozadi", "Writes the copy", "AIDA formulasi bo'yicha qisqa, halol va sotadigan reklama matni tuzadi.", "Writes a short, honest, selling advertisement using the AIDA formula.") +
 card("orange", "📊", "Hisoblaydi", "Calculates", "CTR, konversiya, CAC va ROAS ni hisoblab, reklama foydali yoki zararli ekanini aniqlaydi.", "Calculates CTR, conversion, CAC and ROAS to see whether advertising earns or loses money.") +
 card("pink", "🚚", "Yetkazishni tashkil qiladi", "Organises delivery", "Yetkazish usulini, narxini va muddatini mahsulotga qarab belgilaydi.", "Sets the delivery method, price and time to suit the product.") +
 card("cyan", "🤝", "Mijozni saqlaydi", "Keeps the customer", "Kechikish va shikoyatni to'g'ri hal qilib, mijozni qayta xaridga qaytaradi.", "Handles delays and complaints well and brings the customer back to buy again.") +
 '</div>')

# ============================ 3. REJA ============================
slide("Reja va tushunchalar", "Plan and concepts",
 E("span", "Mashg'ulot rejasi", "Class plan", 'class="kicker"') +
 E("h2", "Bugungi <span class=\"grad\">4 ta blok</span>", "Today's <span class=\"grad\">4 blocks</span>") +
 '<div class="grid g4">' +
 card("green", "1️⃣", "Mijoz yo'li", "Customer journey", "Mijoz ko'rgandan qayta xaridgacha qanday yo'ldan o'tadi.", "The path a customer takes from first seeing you to buying again.") +
 card("blue", "2️⃣", "Reklama", "Advertising", "Kanal, matn, rasm-video va halol reklama qoidalari.", "Channels, copy, photo and video, and the rules of honest advertising.") +
 card("violet", "3️⃣", "Natijani o'lchash", "Measuring results", "CTR, konversiya, CAC, ROAS — reklama foyda keltirdimi?", "CTR, conversion, CAC, ROAS — did the advertising make a profit?") +
 card("orange", "4️⃣", "Yetkazish va xizmat", "Delivery and service", "Yetkazish usullari, narxi, buyurtma jarayoni va shikoyat.", "Delivery methods, cost, the order process and complaints.") +
 '</div>' + E("h3", "🔑 Tayanch tushunchalar", "🔑 Key concepts", 'style="margin-top:22px"') +
 E("div",
   '<span class="pill g">mijoz yo\'li (voronka)</span><span class="pill">auditoriya</span><span class="pill">reklama kanali</span><span class="pill g">AIDA</span>'
   '<span class="pill">taklif (offer)</span><span class="pill">harakatga chaqiriq</span><span class="pill g">CTR</span><span class="pill g">konversiya</span>'
   '<span class="pill g">CAC</span><span class="pill g">ROAS</span><span class="pill">zararsiz nuqta</span><span class="pill">qayta xarid</span>'
   '<span class="pill">yetkazish usuli</span><span class="pill">oxirgi chaqirim</span><span class="pill g">naqd va oldindan to\'lov</span><span class="pill">qadoqlash</span>'
   '<span class="pill">yetkazish muddati</span><span class="pill">shikoyat bilan ishlash</span>',
   '<span class="pill g">customer journey (funnel)</span><span class="pill">audience</span><span class="pill">advertising channel</span><span class="pill g">AIDA</span>'
   '<span class="pill">offer</span><span class="pill">call to action</span><span class="pill g">CTR</span><span class="pill g">conversion</span>'
   '<span class="pill g">CAC</span><span class="pill g">ROAS</span><span class="pill">break-even point</span><span class="pill">repeat purchase</span>'
   '<span class="pill">delivery method</span><span class="pill">last mile</span><span class="pill g">cash vs prepayment</span><span class="pill">packaging</span>'
   '<span class="pill">delivery time</span><span class="pill">complaint handling</span>'))

# ============================ 4. MIJOZ YO'LI ============================
slide("Mijoz yo'li", "The customer journey",
 E("span", "1-blok", "Block 1", 'class="kicker"') +
 E("h2", "Mijoz yo'li: <span class=\"grad\">ko'rgandan qayta xaridgacha</span>", "The customer journey: <span class=\"grad\">from first look to repeat purchase</span>") +
 E("div", "Hech kim reklamani ko'rgan zahoti sotib olmaydi. Mijoz <b>5 bosqichdan</b> o'tadi — reklamaning vazifasi uni har bosqichda keyingisiga olib chiqish.",
   "Nobody buys the moment they see an advertisement. A customer goes through <b>5 stages</b> — the job of advertising is to move them to the next stage each time.", 'class="def"') +
 '<div class="grid g5" style="margin-top:14px">' +
 card("green", "👀", "1. Bilib oladi", "1. Notices", "Post, video yoki tavsiyani ko'radi. <b>Vazifa:</b> e'tiborni tortish.", "Sees a post, a video or a recommendation. <b>Your job:</b> catch attention.") +
 card("teal", "🤔", "2. Qiziqadi", "2. Gets interested", "Narx, sifat va sharhlarni ko'radi. <b>Vazifa:</b> ishonch uyg'otish.", "Looks at the price, quality and reviews. <b>Your job:</b> build trust.") +
 card("blue", "💬", "3. Qaror qiladi", "3. Decides", "«Narxi qancha? Qachon keladi?» deb yozadi. <b>Vazifa:</b> tez va aniq javob.", "Writes “How much? When will it arrive?”. <b>Your job:</b> answer fast and clearly.") +
 card("violet", "🛒", "4. Sotib oladi", "4. Buys", "To'lov va manzil. <b>Vazifa:</b> buyurtmani osonlashtirish.", "Payment and address. <b>Your job:</b> make ordering easy.") +
 card("orange", "🔁", "5. Qaytadi", "5. Comes back", "Qayta xarid qiladi, do'stiga aytadi. <b>Vazifa:</b> yaxshi xizmat.", "Buys again and tells a friend. <b>Your job:</b> good service.") +
 '</div>' + E("h3", "Shartli voronka: «eko-sumka» reklamasi", "A sample funnel: an “eco-bag” advertisement", 'style="margin-top:16px"') +
 '<div class="grid g4">' +
 stat("10 000", "kishi reklamani ko'rdi", "people saw the advertisement") +
 stat("300", "kishi bosdi (CTR = 3%)", "people clicked (CTR = 3%)", "o") +
 stat("60", "kishi «narxi qancha?» deb yozdi", "people wrote “how much?”", "v") +
 stat("12", "kishi sotib oldi (konversiya = 4%)", "people bought (conversion = 4%)") +
 '</div>' +
 E("div", "Ko'p hollarda mijoz aynan <b>so'rovdan xaridgacha</b> yo'qoladi: javob kechiksa yoki noaniq bo'lsa, u boshqa sotuvchiga o'tib ketadi. Shuning uchun reklama bilan birga <b>tez javob</b> ham sotuvning bir qismi.",
   "In many cases customers are lost <b>between the enquiry and the purchase</b>: if the answer is late or vague, they move to another seller. That is why a <b>fast reply</b> is part of the sale, just like the advertisement.", 'class="quote" style="margin-top:12px"'))

# ============================ 5. REKLAMA KANALLARI ============================
slide("Reklama kanallari", "Advertising channels",
 E("span", "2-blok · Reklama", "Block 2 · Advertising", 'class="kicker"') +
 E("h2", "Reklamaning <span class=\"grad\">8 ta kanali</span>", "<span class=\"grad\">8 advertising channels</span>") +
 table([("Kanal", "Channel"), ("Kimga mos", "Best for"), ("Ijobiy tomoni", "Advantage"), ("Salbiy tomoni", "Drawback")], [
  [TD("<b>🗣 Og'zaki tavsiya</b>", "<b>🗣 Word of mouth</b>"), TD("Har qanday boshlovchi", "Any beginner"), TD("Bepul, ishonch yuqori", "Free, high trust", "g"), TD("Tarqalishi sekin", "Spreads slowly")],
  [TD("<b>📱 Telegram kanal va guruh</b>", "<b>📱 Telegram channel and group</b>"), TD("Yoshlar, mahalliy xaridorlar", "Young people, local buyers"), TD("Doimiy auditoriya, to'g'ridan-to'g'ri yozishadi", "A steady audience who write to you directly", "g"), TD("Obunachi yig'ish uchun vaqt kerak", "It takes time to gather subscribers")],
  [TD("<b>📸 Instagram va TikTok video</b>", "<b>📸 Instagram and TikTok video</b>"), TD("Ko'zga yoqadigan mahsulot: kiyim, taom, hunar", "Visual products: clothes, food, crafts"), TD("Keng qamrov, vizual ta'sir", "Wide reach, strong visual effect", "g"), TD("Doimiy kontent kerak, algoritmlar o'zgaradi", "Needs constant content; algorithms change", "r")],
  [TD("<b>🛒 E'lon saytlari va marketpleys</b>", "<b>🛒 Classified sites and marketplaces</b>"), TD("Tayyor, standart mahsulot", "Ready, standard products"), TD("Xaridor allaqachon sotib olishga tayyor", "The buyer is already ready to buy", "g"), TD("Raqobat kuchli, komissiya bo'lishi mumkin", "Strong competition; there may be a commission")],
  [TD("<b>🎯 Targetli (pullik) reklama</b>", "<b>🎯 Targeted (paid) ads</b>"), TD("Kimga sotishni aniq bilganlar", "Those who know exactly who to sell to"), TD("Aniq auditoriya, natijani o'lchasa bo'ladi", "A precise audience and measurable results", "g"), TD("Pul ketadi, sozlashni bilish kerak", "Costs money; needs set-up skills", "r")],
  [TD("<b>🌟 Blogger va mikroinfluenser</b>", "<b>🌟 Bloggers and micro-influencers</b>"), TD("Yangi mahsulotni tanitish", "Introducing a new product"), TD("Auditoriyaning ishonchi", "The audience's trust", "g"), TD("Natija kafolatlanmagan", "The result is not guaranteed")],
  [TD("<b>🧾 Varaqa, vizitka, yarmarka</b>", "<b>🧾 Flyers, business cards, fairs</b>"), TD("Mahalliy mijoz, oziq-ovqat, xizmat", "Local customers, food, services"), TD("Mijoz bilan bevosita muloqot", "Direct contact with the customer", "g"), TD("Natijani o'lchash qiyin", "Hard to measure the result")],
  [TD("<b>📩 Mavjud mijozga xabar</b>", "<b>📩 Messages to existing customers</b>"), TD("Qayta sotuv", "Repeat sales"), TD("Eng arzon sotuv", "The cheapest sale", "g"), TD("Faqat rozilik berganlarga — spam emas!", "Only to those who agreed — never spam!", "r")]]) +
 E("small", "Eslatma: platformalarning shartlari va narxlari tez o'zgaradi — reklama berishdan oldin amaldagi qoida va tarifni platformaning o'zidan tekshiring.",
   "Note: platform rules and prices change quickly — before you advertise, check the current rules and tariffs on the platform itself.", 'class="note"'))

# ============================ 6. KANAL TANLASH ============================
slide("Kanalni tanlash", "Choosing a channel",
 E("span", "2.2 · Qaror", "2.2 · Decision", 'class="kicker"') +
 E("h2", "Kanalni <span class=\"grad\">qanday tanlash kerak?</span>", "How to <span class=\"grad\">choose a channel?</span>") +
 E("div", "Eng yaxshi kanal — eng katta yoki eng arzon emas, <b>mijozingiz o'zi faol va ishonadigan</b> kanal. Avval mijozni aniqlang, keyin kanalni.",
   "The best channel is not the biggest or the cheapest — it is the one where <b>your customer is active and trusts what they read</b>. Define the customer first, then the channel.", 'class="def"') +
 '<div class="grid g3" style="margin-top:14px">' +
 card("green", "👥", "1. Mijozim kim?", "1. Who is my customer?", "Yoshi, kasbi, qayerda yashashi, nimaga pul sarflashi. «Hamma» — mijoz emas.", "Age, occupation, where they live, what they spend money on. “Everyone” is not a customer.") +
 card("blue", "📍", "2. U qayerda?", "2. Where are they?", "Qaysi ilova va platformada eng ko'p vaqt o'tkazadi? Shu yerga boring.", "Which app or platform do they spend most time on? Go there.") +
 card("violet", "💰", "3. Qancha pulim bor?", "3. How much money do I have?", "Bepul kanaldan boshlang, natijani ko'rib, keyin pullik reklamaga o'ting.", "Start with free channels, look at the results, then move to paid advertising.") +
 '</div>' + E("h3", "Reklama byudjetining 70–20–10 qoidasi", "The 70–20–10 rule for an advertising budget", 'style="margin-top:16px"') +
 '<div class="grid g3">' +
 card("green", "", "70% — ishlayotgan kanalga", "70% — a channel that works", "Natija bergan kanalga ko'proq pul qo'ying.", "Put most of your money into the channel that has produced results.") +
 card("orange", "", "20% — yangi sinov", "20% — a new test", "Yangi kanal yoki usulni kichik hajmda sinab ko'ring.", "Try a new channel or method on a small scale.") +
 card("blue", "", "10% — tajriba", "10% — experiments", "Jasoratli g'oyalar: yangi format, hamkorlik, mavsumiy aksiya.", "Bold ideas: a new format, a partnership, a seasonal promotion.") +
 '</div>' +
 E("div", "📌 <b>Misol («eko-sumka»):</b> mijoz — 18–30 yoshdagi talaba qizlar; ular Instagram va Telegramda faol. Reja: <b>Instagram video + Telegram kanal</b>; byudjet — 600 000 so'm: 420 000 ishlayotganiga, 120 000 yangi sinovga, 60 000 tajribaga.",
   "📌 <b>Example (“eco-bag”):</b> the customer is a female student aged 18–30, active on Instagram and Telegram. Plan: <b>Instagram video + a Telegram channel</b>; budget — 600,000 so'm: 420,000 for what works, 120,000 for new tests, 60,000 for experiments.", 'class="quote" style="margin-top:12px"') +
 E("small", "Bir vaqtda hamma kanalga emas: 1–2 kanalda boshlang va kamida 2 hafta natijani kuzating.", "Do not start everywhere at once: begin with 1–2 channels and watch the results for at least 2 weeks.", 'class="note"'))

# ============================ 7. REKLAMA MATNI ============================
slide("Reklama matni: AIDA", "Ad copy: AIDA",
 E("span", "2.3 · Matn yozish", "2.3 · Writing copy", 'class="kicker"') +
 E("h2", "Sotadigan matn: <span class=\"grad\">AIDA formulasi</span>", "Copy that sells: <span class=\"grad\">the AIDA formula</span>") +
 '<div class="grid g4">' +
 card("red", "👁", "A — Attention (diqqat)", "A — Attention", "Sarlavha 3 soniyada ushlab qolsin: savol, raqam yoki mijoz muammosi.", "The headline must hold the reader in 3 seconds: a question, a number or the customer's problem.") +
 card("orange", "💡", "I — Interest (qiziqish)", "I — Interest", "Mijozga nima foyda berishini yozing — xususiyat emas, natija.", "Say what the customer gains — the result, not just the features.") +
 card("green", "❤️", "D — Desire (istak)", "D — Desire", "Dalil keltiring: foto, o'lcham, material, mijoz fikri, kafolat.", "Give proof: a photo, size, material, a customer's review, a guarantee.") +
 card("blue", "👉", "A — Action (harakat)", "A — Action", "Aniq qadamni ayting: «Telegramga SUMKA deb yozing».", "State one clear step: “Write SUMKA to us on Telegram”.") +
 '</div><div class="grid g2" style="margin-top:14px">' +
 '<div class="card" style="--c:var(--red)">' + E("h3", "❌ Yomon reklama", "❌ A weak advertisement") +
 E("p", "«Sumkalar sotiladi! Arzon va sifatli. Yozing.»", "“Bags for sale! Cheap and high quality. Write to us.”", 'style="font-style:italic"') +
 '<ul class="tick cross">' + E("li", "Sarlavha yo'q — e'tiborni tortmaydi", "No headline — it catches no attention") +
 E("li", "«Arzon va sifatli» — hamma shunday yozadi, dalil yo'q", "“Cheap and high quality” — everyone writes that; there is no proof") +
 E("li", "Narx, muddat va aloqa yo'li noaniq", "The price, the delivery time and how to order are unclear") + '</ul></div>' +
 '<div class="card" style="--c:var(--green)">' + E("h3", "✅ Yaxshi reklama (shartli)", "✅ A strong advertisement (sample)") +
 E("p", "«🌿 Kitob, noutbuk va tushlik — bitta sumkada. Qo'lda tikilgan, paxta matosi, 38×42 sm. <b>80 000 so'm</b>. Shahar bo'ylab 1 kunda yetkazamiz. Buyurtma: Telegramga <b>SUMKA</b> deb yozing.»",
   "“🌿 Your book, laptop and lunch — in one bag. Hand-sewn, cotton fabric, 38×42 cm. <b>80,000 so'm</b>. Delivered across the city in 1 day. To order: write <b>SUMKA</b> to us on Telegram.”", 'style="font-style:italic"') +
 '<ul class="tick">' + E("li", "Sarlavha mijoz muammosini ushlaydi", "The headline speaks to the customer's problem") +
 E("li", "Dalil: material va o'lcham", "Proof: material and size") +
 E("li", "Narx, muddat va keyingi qadam aniq", "Price, time and the next step are clear") + '</ul></div></div>')

# ============================ 8. RASM VA VIDEO ============================
slide("Rasm, video va kontent reja", "Photo, video and a content plan",
 E("span", "2.4 · Kontent", "2.4 · Content", 'class="kicker"') +
 E("h2", "Mahsulot <span class=\"grad\">o'zini sotsin:</span> rasm, video, reja", "Let the product <span class=\"grad\">sell itself:</span> photo, video, plan") +
 '<div class="grid g2"><div>' +
 card_ul("green", "📷", "Yaxshi rasm va video qoidalari", "Rules for good photos and videos", [
  ("<b>Tabiiy yorug'lik.</b> Deraza yonida, kunduzi suratga oling.", "<b>Natural light.</b> Shoot by a window in the daytime."),
  ("<b>Haqiqiy ko'rinish.</b> Mahsulot rasmi real rangi va o'lchamiga mos bo'lsin.", "<b>A true look.</b> The picture must match the real colour and size."),
  ("<b>Masshtab.</b> Odam qo'lida yoki ishlatilayotgan paytda ko'rsating.", "<b>Scale.</b> Show it in a hand or while it is being used."),
  ("<b>Birinchi 3 soniya.</b> Videoni eng qiziqarli lavha bilan boshlang.", "<b>The first 3 seconds.</b> Start the video with the most interesting moment."),
  ("<b>Narx va aloqa ochiq.</b> Mijoz uni qidirib yurmasin.", "<b>Open price and contact.</b> The customer should not have to search for them."),
  ("<b>Mijoz fikri.</b> Ruxsat bilan sharh va foto joylang.", "<b>Customer proof.</b> Post reviews and photos with permission.")]) +
 '</div><div>' + '<div class="card" style="--c:var(--blue)">' + E("h3", "🗓 1 haftalik kontent reja (shartli)", "🗓 A one-week content plan (sample)") +
 table([("Kun", "Day"), ("Nima joylanadi", "What is posted")], [
  [TD("Dushanba", "Monday"), TD("Mahsulot taqdimoti: foto + narx", "Product introduction: photo + price")],
  [TD("Seshanba", "Tuesday"), TD("Qanday ishlatiladi: qisqa video", "How it is used: a short video")],
  [TD("Chorshanba", "Wednesday"), TD("Mijoz fikri yoki sharhi", "A customer's opinion or review")],
  [TD("Payshanba", "Thursday"), TD("Tayyorlash jarayoni — «kulissa ortida»", "The making of it — “behind the scenes”")],
  [TD("Juma", "Friday"), TD("Cheklangan taklif: muddat va miqdor aniq", "A limited offer: clear deadline and quantity")],
  [TD("Shanba", "Saturday"), TD("Savol-javob: mijozlar so'raganlar", "Q&A: what customers asked")],
  [TD("Yakshanba", "Sunday"), TD("Natijani sanab chiqish va keyingi hafta rejasi", "Count the results and plan the next week")]]) + '</div>' +
 E("div", "Haftasiga <b>3–4 ta sifatli post</b> ko'p emas, doimiy bo'lgan <b>kam post</b> tasodifiy ko'p postdan yaxshi.", "<b>3–4 quality posts</b> a week is enough — <b>few but regular</b> posts beat many random ones.", 'class="quote" style="margin-top:12px"') +
 '</div></div>')

# ============================ 9. HALOL REKLAMA ============================
slide("Halol reklama", "Honest advertising",
 E("span", "2.5 · Qoida va huquq", "2.5 · Rules and law", 'class="kicker"') +
 E("h2", "Halol reklama: <span class=\"grad\">nima mumkin, nima xavfli?</span>", "Honest advertising: <span class=\"grad\">what is fine and what is risky?</span>") +
 '<div class="grid g2">' +
 card_ul("green", "✅", "Mumkin", "Allowed", [
  ("Tekshirsa bo'ladigan faktlar: narx, material, o'lcham, muddat.", "Facts anyone can check: price, material, size, time."),
  ("Haqiqiy foto va videolar — o'z mahsulotingiz.", "Real photos and videos of your own product."),
  ("Chegirma haqiqiy bo'lsa: eski va yangi narx rost, muddat aniq.", "A genuine discount: the old and new prices are true and the deadline is clear."),
  ("Mijoz sharhini uning roziligi bilan joylash.", "Posting a customer's review with their consent."),
  ("Qaytarish va almashtirish shartlarini oldindan yozish.", "Writing the return and exchange terms in advance.")]) +
 card_ul("red", "⚠️", "Xavfli yoki mumkin emas", "Risky or not allowed", [
  ("Dalilsiz «eng yaxshi», «yagona», «100% kafolat» deyish.", "Claiming “the best”, “the only one” or “100% guaranteed” without proof."),
  ("Soxta sharh yoki uydirilgan «−50%» chegirma.", "Fake reviews or an invented “−50%” discount."),
  ("Boshqa brend yoki raqib suratini o'zingiznikidek ko'rsatish.", "Showing another brand's or a rival's photo as your own."),
  ("Raqibni yomonlash yoki mazax qilish.", "Running down or mocking a competitor."),
  ("Mijoz roziligisiz telefon raqamini yig'ib, xabar yuborish (spam).", "Collecting phone numbers and sending messages without consent (spam).")], "tick cross") +
 '</div>' +
 E("div", "Aldangan mijoz qaytmaydi, shikoyat yozadi va boshqalarga aytadi. <b>Halollik — eng arzon va eng uzoq ishlaydigan reklama.</b>",
   "A deceived customer does not return, files a complaint and tells others. <b>Honesty is the cheapest and longest-lasting advertising.</b>", 'class="quote" style="margin-top:12px"') +
 E("small", "Reklama «Reklama to'g'risida»gi qonun, iste'molchilar huquqlarini himoya qilish va shaxsga doir ma'lumotlar to'g'risidagi qonunlar bilan tartibga solinadi; dori, oziq-ovqat qo'shimchalari, bolalar mahsulotlari va boshqa maxsus mahsulotlar uchun qo'shimcha talablar bor. Amaldagi tahrirni lex.uz saytida tekshiring.",
   "Advertising is regulated by the Law “On Advertising” and the laws on consumer protection and on personal data; medicines, food supplements, children's products and some other goods have extra requirements. Check the current version on lex.uz.", 'class="note"'))

# ============================ 10. KO'RSATKICHLAR ============================
slide("Reklama ko'rsatkichlari", "Advertising metrics",
 E("span", "3-blok · Hisob-kitob", "Block 3 · Calculation", 'class="kicker"') +
 E("h2", "Reklama <span class=\"grad\">o'zini oqlaydimi?</span> 5 ta ko'rsatkich", "Does the advertising <span class=\"grad\">pay off?</span> 5 metrics") +
 E("div", "Reklamaga sarflangan pul <b>xarajat</b> emas, <b>sarmoya</b> bo'lishi kerak. Buning uchun har bir reklamadan keyin quyidagi 5 sonni hisoblang.",
   "Money spent on advertising should be an <b>investment</b>, not just a <b>cost</b>. To check that, calculate these 5 numbers after every campaign.", 'class="def"') +
 table([("Ko'rsatkich", "Metric"), ("Formula", "Formula"), ("Misol («eko-sumka»)", "Example (“eco-bag”)")], [
  [TD("<b>CTR</b> — bosish ulushi", "<b>CTR</b> — click-through rate"), TD("bosishlar ÷ ko'rishlar × 100", "clicks ÷ views × 100"), TD("300 ÷ 10 000 × 100 = <b>3%</b>", "300 ÷ 10,000 × 100 = <b>3%</b>")],
  [TD("<b>Konversiya</b> — xarid ulushi", "<b>Conversion</b> — share who buy"), TD("xaridlar ÷ bosishlar × 100", "purchases ÷ clicks × 100"), TD("12 ÷ 300 × 100 = <b>4%</b>", "12 ÷ 300 × 100 = <b>4%</b>")],
  [TD("<b>CAC</b> — bitta mijoz narxi", "<b>CAC</b> — cost of one customer"), TD("reklama xarajati ÷ yangi mijozlar", "ad spend ÷ new customers"), TD("600 000 ÷ 12 = <b>50 000 so'm</b>", "600,000 ÷ 12 = <b>50,000 so'm</b>", "r")],
  [TD("<b>ROAS</b> — reklama qaytimi", "<b>ROAS</b> — return on ad spend"), TD("reklamadan tushum ÷ reklama xarajati", "revenue from ads ÷ ad spend"), TD("960 000 ÷ 600 000 = <b>1,6</b>", "960,000 ÷ 600,000 = <b>1.6</b>")],
  [TD("<b>Sotuvdan foyda</b> (1 dona)", "<b>Profit per sale</b> (1 item)"), TD("narx − tannarx − qadoq − yetkazish", "price − cost − packaging − delivery"), TD("80 000 − 40 000 − 3 000 − 7 000 = <b>30 000 so'm</b>", "80,000 − 40,000 − 3,000 − 7,000 = <b>30,000 so'm</b>", "g")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("orange", "🧠", "Zararsiz nuqta ROAS", "Break-even ROAS", "Zararsiz ROAS = narx ÷ sotuvdan foyda = 80 000 ÷ 30 000 ≈ <b>2,7</b>. ROAS bundan past bo'lsa, reklama <b>zarar</b> keltiradi.", "Break-even ROAS = price ÷ profit per sale = 80,000 ÷ 30,000 ≈ <b>2.7</b>. If ROAS is lower, the advertising <b>loses money</b>.") +
 card("red", "⚠️", "Tuzoq: «ROAS 1,6 — yomon emas»", "The trap: “ROAS 1.6 is not bad”", "Tushum reklama puldan ko'p ko'rinadi, lekin tushum foyda emas. Tushumdan tannarx va yetkazish ham ketadi.", "Revenue looks bigger than the ad spend, but revenue is not profit. Cost and delivery come out of it too.") +
 '</div>')

# ============================ 11. MISOL ============================
slide("Misol: 600 000 so'm", "Example: 600,000 so'm",
 E("span", "3.2 · Amaliy hisob", "3.2 · Practical calculation", 'class="kicker"') +
 E("h2", "Bir xil <span class=\"grad\">600 000 so'm</span> — uch xil natija", "The same <span class=\"grad\">600,000 so'm</span> — three different results") +
 E("p", "Shartli misol: sumka narxi <b>80 000</b>, sotuvdan foyda <b>30 000</b> so'm, reklama byudjeti <b>600 000</b> so'm.", "A sample: the bag costs <b>80,000</b>, profit per sale is <b>30,000</b> so'm, the ad budget is <b>600,000</b> so'm.", 'class="lead"') +
 '<div class="grid g3">' +
 '<div class="card" style="--c:var(--red)">' + E("h3", "A. Hozirgi holat", "A. The current situation") +
 table(None, [
  [TD("Xaridlar", "Purchases"), TD("12 ta", "12")], [TD("CAC", "CAC"), TD("50 000 so'm", "50,000 so'm", "r")], [TD("Tushum", "Revenue"), TD("960 000", "960,000")],
  [TD("ROAS", "ROAS"), TD("1,6", "1.6")], [TD("Sof natija", "Net result"), TD("<b>−240 000 so'm</b>", "<b>−240,000 so'm</b>", "r")]]) +
 E("p", "12 × 30 000 = 360 000 foyda, reklama 600 000 → <b>zarar</b>.", "12 × 30,000 = 360,000 profit, ads 600,000 → <b>a loss</b>.", 'style="margin-top:8px"') + '</div>' +
 '<div class="card" style="--c:var(--green)">' + E("h3", "B. Konversiya oshdi", "B. Conversion improved") +
 table(None, [
  [TD("Xaridlar", "Purchases"), TD("24 ta", "24")], [TD("CAC", "CAC"), TD("25 000 so'm", "25,000 so'm", "g")], [TD("Tushum", "Revenue"), TD("1 920 000", "1,920,000")],
  [TD("ROAS", "ROAS"), TD("3,2", "3.2")], [TD("Sof natija", "Net result"), TD("<b>+120 000 so'm</b>", "<b>+120,000 so'm</b>", "g")]]) +
 E("p", "Yaxshi post, tez javob, aniq narx — shu bilan xaridlar ikki baravar.", "A better post, fast replies and a clear price — purchases doubled.", 'style="margin-top:8px"') + '</div>' +
 '<div class="card" style="--c:var(--blue)">' + E("h3", "C. Qayta xarid", "C. Repeat purchase") +
 table(None, [
  [TD("Mijozlar", "Customers"), TD("12 ta, har biri 2 marta", "12, each buys twice")], [TD("CAC", "CAC"), TD("50 000 so'm", "50,000 so'm")], [TD("Tushum", "Revenue"), TD("1 920 000", "1,920,000")],
  [TD("ROAS", "ROAS"), TD("3,2", "3.2")], [TD("Sof natija", "Net result"), TD("<b>+120 000 so'm</b>", "<b>+120,000 so'm</b>", "g")]]) +
 E("p", "Har mijozdan 60 000 foyda &gt; CAC 50 000 — mijozning umr bo'yi qiymati (LTV) yutadi.", "60,000 profit per customer &gt; CAC 50,000 — the customer's lifetime value (LTV) wins.", 'style="margin-top:8px"') + '</div></div>' +
 E("div", "🧠 <b>Xulosa:</b> reklamani to'xtatishdan oldin 2 narsani tekshiring — <b>konversiyani oshirish</b> (matn, javob tezligi) va <b>qayta xaridga</b> olib kelish. Zararning sababi ko'pincha kanalda emas, sotuv jarayonida bo'ladi.",
   "🧠 <b>Conclusion:</b> before you stop advertising, check two things — <b>raising conversion</b> (copy, speed of reply) and <b>bringing customers back</b>. The cause of a loss is often not the channel but the sales process.", 'class="quote" style="margin-top:12px"'))

# ============================ 12. YETKAZISH USULLARI ============================
slide("Yetkazish usullari", "Delivery methods",
 E("span", "4-blok · Yetkazish", "Block 4 · Delivery", 'class="kicker"') +
 E("h2", "Mijozga yetkazishning <span class=\"grad\">5 ta yo'li</span>", "<span class=\"grad\">5 ways</span> to get the product to the customer") +
 table([("Usul", "Method"), ("Qachon mos", "When it fits"), ("Ijobiy tomoni", "Advantage"), ("Salbiy tomoni", "Drawback")], [
  [TD("<b>🚶 O'zi yetkazish yoki olib ketish punkti</b>", "<b>🚶 Self-delivery or a pick-up point</b>"), TD("Bir shahar yoki mahalla, buyurtma kam", "One city or neighbourhood, few orders"), TD("Arzon, nazorat to'liq, mijoz bilan bevosita aloqa", "Cheap, full control, direct contact with the customer", "g"), TD("Vaqtingizni oladi, o'sishni cheklaydi", "Takes your time and limits growth", "r")],
  [TD("<b>🛵 Shahar ichidagi kuryer yoki taksi-yetkazish xizmati</b>", "<b>🛵 A city courier or taxi-delivery service</b>"), TD("Shahar ichida tez yetkazish kerak", "You need fast delivery inside the city"), TD("Tez, ko'p buyurtmani ko'taradi", "Fast; copes with many orders", "g"), TD("Har yetkazish pullik, sifat kuryerga bog'liq", "Each delivery costs money; quality depends on the courier")],
  [TD("<b>📦 Viloyatlararo: pochta va kuryerlik kompaniyalari</b>", "<b>📦 Between regions: post and courier companies</b>"), TD("Boshqa viloyatga, kichik va yengil mahsulot", "To another region; small, light products"), TD("Butun mamlakat bo'ylab, tarifi oldindan ma'lum", "Nationwide, with a tariff known in advance", "g"), TD("Muddat va butunlik ustidan nazorat kam", "Little control over time and condition")],
  [TD("<b>🏬 Marketpleys ombori</b>", "<b>🏬 A marketplace warehouse</b>"), TD("Tayyor mahsulot ko'p miqdorda", "A large quantity of ready products"), TD("Saqlash va yetkazishni marketpleys bajaradi", "The marketplace stores and delivers", "g"), TD("Komissiya, talablar, mijoz bilan aloqa kam", "Commission, requirements, little contact with the customer", "r")],
  [TD("<b>💻 Raqamli yetkazish</b>", "<b>💻 Digital delivery</b>"), TD("Kurs, dizayn, konsultatsiya, fayl", "A course, design, consultation, a file"), TD("Zaxira va yo'l xarajati yo'q, bir zumda", "No stock or travel cost, instant", "g"), TD("To'lovni nazorat qilish va nusxa ko'chirishdan himoya", "Payment control and protection from copying")]]) +
 E("div", "Usulni tanlashda 3 savol: <b>mahsulot qanday</b> (og'irligi, mo'rtligi)? <b>Mijoz qayerda</b> (shahar, viloyat)? <b>Buyurtma qancha</b> (kuniga nechta)?",
   "Three questions for choosing: <b>what is the product</b> (weight, fragility)? <b>Where is the customer</b> (city, region)? <b>How many orders</b> (per day)?", 'class="quote" style="margin-top:12px"') +
 E("small", "Tariflar va muddatlar xizmatga qarab o'zgaradi — buyurtma berishdan oldin aniq narx va muddatni xizmatning o'zidan so'rang.",
   "Tariffs and times differ between services — ask the service itself for the exact price and time before you order.", 'class="note"'))

# ============================ 13. YETKAZISH IQTISODI ============================
slide("Yetkazish narxi va shartlari", "Delivery cost and terms",
 E("span", "4.2 · Qoidalar", "4.2 · Terms", 'class="kicker"') +
 E("h2", "Yetkazish: <span class=\"grad\">narx, to'lov va va'da</span>", "Delivery: <span class=\"grad\">price, payment and promise</span>") +
 '<div class="grid g3">' +
 card_ul("blue", "💸", "Yetkazishni kim to'laydi?", "Who pays for delivery?", [
  ("<b>Mijoz:</b> tarif aniq ko'rsatiladi, narx past ko'rinadi.", "<b>The customer:</b> the tariff is shown clearly and the price looks lower."),
  ("<b>Siz:</b> yetkazish narxga kiritilgan, mijozga «bepul».", "<b>You:</b> delivery is built into the price, “free” for the customer."),
  ("<b>Chegaradan bepul:</b> masalan, 300 000 so'mdan yuqori buyurtmada — o'rtacha chekni oshiradi.", "<b>Free above a threshold:</b> e.g. orders over 300,000 so'm — this raises the average order.")]) +
 card_ul("violet", "💳", "To'lov usuli", "Payment method", [
  ("<b>Oldindan to'lov:</b> xavfsiz, buyurtma jiddiy.", "<b>Prepayment:</b> safe, and the order is serious."),
  ("<b>Yetkazilganda naqd:</b> qulay, lekin mijoz rad etishi mumkin.", "<b>Cash on delivery:</b> convenient, but the customer may refuse."),
  ("<b>Qisman avans</b> (masalan, 30%): o'rta yo'l — xavf kamayadi.", "<b>A partial advance</b> (e.g. 30%): the middle way — less risk.")]) +
 card_ul("orange", "⏱", "Muddat va qadoq", "Time and packaging", [
  ("<b>Kam va'da qiling, ko'p bering:</b> muddatni biroz uzunroq ayting, vaqtida yoki oldin yetkazing.", "<b>Under-promise, over-deliver:</b> quote a slightly longer time, then deliver on time or earlier."),
  ("<b>Qadoq</b> mahsulotni himoya qiladi va brendni ko'rsatadi: yorliq, «rahmat» kartochkasi.", "<b>Packaging</b> protects the product and shows your brand: a label, a thank-you card."),
  ("Qadoq narxini tannarxga qo'shing!", "Add the cost of packaging to your unit cost!")]) +
 '</div><div class="grid g2" style="margin-top:14px">' +
 card("red", "📍", "Oxirgi chaqirim", "The last mile", "Mahsulot ombordan <b>mijoz eshigigacha</b> bo'lgan so'nggi bosqich. U ko'pincha eng qimmat va eng ko'p muammo bo'ladigan qism.", "The final stage from the warehouse <b>to the customer's door</b>. It is often the most expensive part and the one with the most problems.") +
 card("green", "🧮", "Narxga yetkazishni qo'shing", "Add delivery to the price", "Misol: sumka tannarxi 40 000 + qadoq 3 000 + yetkazish 7 000 = <b>50 000</b>. Narxni 80 000 qo'ysangiz, foyda 30 000 so'm.", "Example: bag cost 40,000 + packaging 3,000 + delivery 7,000 = <b>50,000</b>. At a price of 80,000 the profit is 30,000 so'm.") +
 '</div>')

# ============================ 14. BUYURTMA JARAYONI ============================
slide("Buyurtma jarayoni", "The order process",
 E("span", "4.3 · Jarayon", "4.3 · Process", 'class="kicker"') +
 E("h2", "Buyurtma: <span class=\"grad\">8 qadamda xatosiz</span>", "An order: <span class=\"grad\">8 steps without mistakes</span>") +
 '<div class="chain">' +
 '<div class="link l1">' + E("h3", "1. So'rov", "1. Enquiry") + E("p", "Mijoz yozadi: mahsulot, miqdor.", "The customer writes: product, quantity.") + E("p", "Javob — 15 daqiqa ichida", "Reply within 15 minutes", 'style="font-size:12.5px"') + '</div>' +
 '<div class="link l2">' + E("h3", "2. Tasdiqlash", "2. Confirmation") + E("p", "Narx, yetkazish narxi, manzil, vaqt — yozma.", "Price, delivery price, address, time — in writing.") + E("p", "Kelishuv bir joyda", "One agreement in one place", 'style="font-size:12.5px"') + '</div>' +
 '<div class="link l3">' + E("h3", "3. To'lov", "3. Payment") + E("p", "Avans yoki to'liq to'lov; chek yoki skrinshot.", "An advance or full payment; a receipt or screenshot.") + E("p", "To'lov holatini yozib qo'ying", "Record the payment status", 'style="font-size:12.5px"') + '</div>' +
 '<div class="link l4">' + E("h3", "4. Qadoqlash", "4. Packing") + E("p", "Tekshirish, qadoq, yorliq, rahmat kartochkasi.", "Check, pack, label, thank-you card.") + E("p", "Jo'natishdan oldin foto", "Take a photo before sending", 'style="font-size:12.5px"') + '</div></div>' +
 '<div class="chain" style="margin-top:10px">' +
 '<div class="link l4">' + E("h3", "5. Yo'lga chiqdi", "5. On the way") + E("p", "Mijozga xabar: kuryer, taxminiy vaqt.", "Message to the customer: courier, estimated time.") + '</div>' +
 '<div class="link l3">' + E("h3", "6. Topshirish", "6. Handover") + E("p", "Mijoz tekshiradi; qabul qilgani haqida tasdiq (foto yoki xabar).", "The customer checks it; confirmation of receipt (photo or message).") + '</div>' +
 '<div class="link l2">' + E("h3", "7. Fikr so'rash", "7. Ask for feedback") + E("p", "1–2 kundan keyin: «Hammasi yoqdimi?»", "A day or two later: “Is everything fine?”") + '</div>' +
 '<div class="link l1">' + E("h3", "8. Qayta taklif", "8. Offer again") + E("p", "Fikr yaxshi bo'lsa — sharh so'rang va keyingi taklifni yuboring.", "If the feedback is good — ask for a review and send the next offer.") + '</div></div>' +
 '<div class="grid g2" style="margin-top:14px">' +
 card_ul("blue", "📒", "Buyurtma kartochkasi (jadval)", "An order card (a table)", [
  ("Mijoz ismi va telefoni", "Customer name and phone"), ("Mahsulot, miqdor, narx", "Product, quantity, price"), ("Yetkazish narxi va manzil", "Delivery price and address"),
  ("Va'da qilingan muddat", "Promised time"), ("To'lov holati: avans / to'liq / naqd", "Payment status: advance / full / cash"), ("Yetkazildi / fikr / qayta xarid", "Delivered / feedback / repeat purchase")], "clean") +
 card("amber", "💡", "Nega yozib borish kerak?", "Why keep records?", "Daftar yoki jadval sizni «kim nima uchun to'lagan»ini unutishdan saqlaydi, va'dani ushlab turishga yordam beradi hamda reklamaning haqiqiy natijasini (qaysi kanaldan kim keldi) ko'rsatadi.", "A notebook or table stops you forgetting who paid for what, helps you keep promises, and shows the true result of advertising (which channel each customer came from).") +
 '</div>')

# ============================ 15. SHIKOYAT ============================
slide("Muammo va shikoyat", "Problems and complaints",
 E("span", "4.4 · Xizmat", "4.4 · Service", 'class="kicker"') +
 E("h2", "Muammo chiqsa: <span class=\"grad\">mijozni yo'qotmang</span>", "When a problem happens: <span class=\"grad\">do not lose the customer</span>") +
 table([("Vaziyat", "Situation"), ("❌ Yomon javob", "❌ A poor reply"), ("✅ To'g'ri javob", "✅ A good reply")], [
  [TD("<b>Kuryer kechikdi</b>", "<b>The courier is late</b>"), TD("«Kuryer aybdor, men nima qilay?»", "“The courier is to blame, what can I do?”", "r"), TD("«Kechirasiz, kechikdi. Buyurtma yo'lda, 16:00 gacha yetadi. Keyingi buyurtmaga 10% chegirma.»", "“Sorry for the delay. It is on its way and will arrive by 16:00. 10% off your next order.”", "g")],
  [TD("<b>Mahsulot shikastlangan</b>", "<b>The product is damaged</b>"), TD("«Siz noto'g'ri ochgandirsiz.»", "“You probably opened it wrongly.”", "r"), TD("«Kechirasiz. Rasmini yuboring, 24 soatda almashtiramiz yoki pulini qaytaramiz.»", "“Sorry. Send us a photo; we will replace it within 24 hours or refund you.”", "g")],
  [TD("<b>Boshqa mahsulot keldi</b>", "<b>The wrong item arrived</b>"), TD("«Sizdan shunday buyurtma kelgan.»", "“That is what you ordered.”", "r"), TD("«Buyurtmani tekshirdik, xato bizda. To'g'risini bugun yuboramiz, xarajat bizdan.»", "“We checked the order; the mistake is ours. We send the right one today at our cost.”", "g")],
  [TD("<b>«O'ylab ko'raman»</b>", "<b>“I will think about it”</b>"), TD("«Ixtiyoringiz. Boshqa gap yo'q.»", "“As you wish. Nothing more to say.”", "r"), TD("«Albatta. Savolingiz bo'lsa yozing; 2 kundan keyin eslatib qo'yaman.»", "“Of course. Write if you have questions; I will remind you in 2 days.”", "g")]]) +
 E("h3", "Shikoyat bilan ishlashning 4 qadami", "The 4 steps of handling a complaint", 'style="margin-top:14px"') +
 '<div class="grid g4">' +
 card("blue", "👂", "1. Tinglang", "1. Listen", "Gapini bo'lmay, muammoni oxirigacha eshiting.", "Hear the problem to the end without interrupting.") +
 card("orange", "🙏", "2. Kechirim so'rang", "2. Apologise", "Aybdor kim bo'lishidan qat'i nazar: «Noqulaylik uchun kechirasiz».", "Whoever is at fault: “Sorry for the inconvenience”.") +
 card("green", "🔧", "3. Yechim bering", "3. Offer a solution", "Aniq va muddatli: almashtirish, qaytarish, chegirma.", "Specific and with a deadline: a replacement, a refund, a discount.") +
 card("violet", "🙌", "4. Rahmat deng", "4. Say thank you", "Xabar bergani uchun minnatdorchilik bildiring va natijani so'rang.", "Thank them for telling you and ask about the outcome.") +
 '</div>' +
 E("small", "Qaytarish va almashtirish shartlari (muddat, holat) iste'molchilar huquqlarini himoya qilish to'g'risidagi qonun bilan belgilanadi — ularni reklamada va buyurtmada oldindan yozing.",
   "Return and exchange terms (time limit, condition) are set by the consumer protection law — state them in the advertisement and the order in advance.", 'class="note"'))

# ============================ 16. AMALIY TOPSHIRIQ ============================
slide("Amaliy topshiriq", "Practical task",
 E("span", "Amaliy mashg'ulot · 2 soat", "Practical class · 2 hours", 'class="kicker"') +
 E("h2", "«Reklama va yetkazish <span class=\"grad\">kartochkasi»</span>", "The “Advertising and delivery <span class=\"grad\">card”</span>") +
 E("p", "Har bir talaba (yoki 2 kishilik guruh) o'z mahsuloti uchun bitta A4 kartochka tayyorlaydi.", "Each student (or a pair) prepares one A4 card for their own product.", 'class="lead"') +
 '<div class="grid g2"><div class="card" style="--c:var(--blue)">' + E("h3", "⏱ 120 daqiqalik reja", "⏱ The 120-minute plan") +
 table([("Vaqt", "Time"), ("Nima qilinadi", "What to do")], [
  [TD("0–15", "0–15"), TD("Mahsulot va mijozni tanlash (kim? qayerda? nima muammosi?)", "Choose the product and the customer (who? where? what problem?)")],
  [TD("15–40", "15–40"), TD("2 ta kanal tanlash va 7 kunlik kontent reja", "Choose 2 channels and a 7-day content plan")],
  [TD("40–65", "40–65"), TD("AIDA bo'yicha reklama matni + rasm-video g'oyasi", "An AIDA advertisement + a photo/video idea")],
  [TD("65–85", "65–85"), TD("Hisob: sotuvdan foyda, CAC, ROAS, zararsiz nuqta", "Calculation: profit per sale, CAC, ROAS, break-even")],
  [TD("85–100", "85–100"), TD("Yetkazish usuli, narxi, muddati va to'lov", "Delivery method, cost, time and payment")],
  [TD("100–120", "100–120"), TD("2 daqiqalik taqdimot va o'zaro baholash", "A 2-minute presentation and peer assessment")]]) + '</div>' +
 '<div><div class="card" style="--c:var(--green)">' + E("h3", "📋 Kartochkada bo'lishi shart", "📋 The card must contain") +
 '<ul class="clean">' + E("li", "Mahsulot, mijoz portreti (1–2 jumla)", "Product and customer portrait (1–2 sentences)") +
 E("li", "Tanlangan 2 kanal va nega aynan shular", "The 2 chosen channels and why exactly these") +
 E("li", "Tayyor reklama matni (AIDA bilan)", "The finished advertisement (using AIDA)") +
 E("li", "Hisob: foyda, CAC, ROAS, zararsiz ROAS", "Calculation: profit, CAC, ROAS, break-even ROAS") +
 E("li", "Yetkazish usuli, narxi, muddati, to'lov turi", "Delivery method, cost, time, payment type") +
 E("li", "Bitta mumkin bo'lgan shikoyat va javobingiz", "One possible complaint and your reply") + '</ul></div>' +
 '<div class="card" style="--c:var(--amber);margin-top:12px">' + E("h3", "🏅 Baholash", "🏅 Assessment") +
 E("p", "Reklama matni <b>25%</b> · hisob-kitob <b>30%</b> · yetkazish va xizmat <b>25%</b> · taqdimot <b>20%</b>.", "Advertisement <b>25%</b> · calculation <b>30%</b> · delivery and service <b>25%</b> · presentation <b>20%</b>.") + '</div></div></div>')

# ============================ 17. XULOSA ============================
slide("Xulosa va resurslar", "Summary and resources",
 E("span", "Xulosa · Mustaqil ish · Havolalar", "Summary · Independent work · Links", 'class="kicker"') +
 E("h2", "Yakuniy <span class=\"grad\">xulosa</span> va <span class=\"grad\">foydali resurslar</span>", "The final <span class=\"grad\">summary</span> and <span class=\"grad\">useful resources</span>") +
 '<div class="grid g2"><div>' +
 card_ul("green", "📌", "Esda qoladigan 6 ta fikr", "6 things to remember", [
  ("Mijoz <b>5 bosqichdan</b> o'tadi; reklama uni har bosqichda keyingisiga olib chiqadi.", "A customer passes <b>5 stages</b>; advertising moves them on at each one."),
  ("Kanal — eng katta emas, <b>mijoz faol bo'lgan</b> joy. Byudjet: 70–20–10.", "The channel is not the biggest one but where <b>the customer is active</b>. Budget: 70–20–10."),
  ("Matn <b>AIDA</b> bilan: diqqat, qiziqish, istak, aniq harakat. Reklama — halol.", "Copy follows <b>AIDA</b>: attention, interest, desire, a clear action. Advertising must be honest."),
  ("Reklama foydalimi, <b>CAC va ROAS</b> aytadi. Zararsiz ROAS = narx ÷ sotuvdan foyda.", "<b>CAC and ROAS</b> tell you if advertising pays. Break-even ROAS = price ÷ profit per sale."),
  ("Yetkazish usulini <b>mahsulot, masofa va buyurtma soni</b> belgilaydi; narxga qo'shing.", "<b>The product, the distance and the number of orders</b> decide the method; add its cost to the price."),
  ("Shikoyat — mijozni saqlab qolish imkoni: tingla, kechirim so'ra, yechim ber.", "A complaint is a chance to keep the customer: listen, apologise, solve.")]) +
 '<div class="card" style="--c:var(--amber);margin-top:12px">' + E("h3", "📓 Mustaqil ish: «30 kunlik sinov»", "📓 Independent work: the “30-day test”") +
 '<ul class="clean">' + E("li", "Bitta kanalni tanlang (bepul yoki 300 000 so'mgacha).", "Pick one channel (free or up to 300,000 so'm).") +
 E("li", "Har kuni yozing: ko'rish, bosish, so'rov, xarid.", "Write down every day: views, clicks, enquiries, purchases.") +
 E("li", "30 kundan keyin CTR, konversiya, CAC va ROAS ni hisoblang.", "After 30 days calculate CTR, conversion, CAC and ROAS.") +
 E("li", "Xulosa: davom etamizmi, o'zgartiramizmi yoki to'xtatamizmi?", "Conclusion: continue, change or stop?") + '</ul>' +
 E("p", "Hajmi: 1–2 bet + jadval. Baholash: jadval aniqligi 40% · hisob 30% · asoslangan xulosa 30%.", "Size: 1–2 pages + a table. Marking: accuracy of the table 40% · calculation 30% · reasoned conclusion 30%.", 'style="font-size:13.5px;color:var(--muted);margin-top:6px"') + '</div></div>' +
 '<div><div class="card" style="--c:var(--blue)">' + E("h3", "🔗 Foydali resurslar", "🔗 Useful resources") +
 E("p", "<b>Qonun va rasmiy manbalar:</b>", "<b>Law and official sources:</b>") +
 '<ul class="clean">' +
 E("li", '<a class="lnk" href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> — «Reklama to\'g\'risida», iste\'molchilar huquqlari va shaxsga doir ma\'lumotlar qonunlari',
   '<a class="lnk" href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> — the laws on advertising, consumer rights and personal data') +
 E("li", '<a class="lnk" href="https://birdarcha.uz" target="_blank" rel="noopener">birdarcha.uz</a> — biznesni ro\'yxatdan o\'tkazish', '<a class="lnk" href="https://birdarcha.uz" target="_blank" rel="noopener">birdarcha.uz</a> — business registration') +
 E("li", '<a class="lnk" href="https://stat.uz" target="_blank" rel="noopener">stat.uz</a> — rasmiy statistika', '<a class="lnk" href="https://stat.uz" target="_blank" rel="noopener">stat.uz</a> — official statistics') +
 E("li", '<a class="lnk" href="https://ombudsman.uz" target="_blank" rel="noopener">ombudsman.uz</a> — Biznes ombudsmani', '<a class="lnk" href="https://ombudsman.uz" target="_blank" rel="noopener">ombudsman.uz</a> — the Business Ombudsman') + '</ul>' +
 E("p", "<b>Bepul vositalar:</b>", "<b>Free tools:</b>", 'style="margin-top:8px"') +
 E("p", '<a class="lnk" href="https://www.canva.com" target="_blank" rel="noopener">canva.com</a> — rasm va post dizayni · <a class="lnk" href="https://www.capcut.com" target="_blank" rel="noopener">capcut.com</a> — qisqa video tahrirlash · <a class="lnk" href="https://telegram.org" target="_blank" rel="noopener">telegram.org</a> — kanal va bot',
   '<a class="lnk" href="https://www.canva.com" target="_blank" rel="noopener">canva.com</a> — image and post design · <a class="lnk" href="https://www.capcut.com" target="_blank" rel="noopener">capcut.com</a> — short-video editing · <a class="lnk" href="https://telegram.org" target="_blank" rel="noopener">telegram.org</a> — channels and bots') +
 E("p", "<b>O'qish uchun:</b> Seth Godin — «This Is Marketing» · Jonah Berger — «Contagious» · Philip Kotler — «Marketing 5.0».", "<b>Further reading:</b> Seth Godin — “This Is Marketing” · Jonah Berger — “Contagious” · Philip Kotler — “Marketing 5.0”.", 'style="margin-top:8px"') +
 E("small", "⚠️ Platformalarning shartlari, narxlari va qonun tahrirlari o'zgaradi. Har doim amaldagi rasmiy ma'lumotga tayaning.", "⚠️ Platform terms, prices and versions of laws change. Always rely on current official information.", 'class="note"') +
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
 E("p", "Keyingi mashg'ulotgacha o'z mahsulotingiz uchun <b>reklama va yetkazish kartochkasini</b> tugallang — keyingi mavzu: g'oyani taqdim etish va tadbirkorlik yo'lini boshlash.",
   "Before the next class, finish the <b>advertising and delivery card</b> for your own product — the next topic: presenting your idea and starting your entrepreneurial path.") +
 E("p", "Termiz davlat universiteti · Tadbirkorlik asoslari", "Termez State University · Fundamentals of Entrepreneurship", 'style="color:var(--muted);font-size:13.5px"') + '</div>')

# ============================ TEST SAVOLLARI ============================
Q = [
 # 1 — mijoz yo'li (to'g'ri: B)
 dict(q="Mijoz Instagramdagi postingizni ko'rib, «Narxi qancha, qachon yetkazasiz?» deb yozdi. U mijoz yo'lining qaysi bosqichida?",
      a=["Xabardorlik bosqichida: u mahsulot borligini endigina bilib olgan edi",
         "Qaror bosqichida: u narx va muddatni so'rab, sotib olishga yaqinlashdi",
         "Xarid bosqichida: u to'lov qilib, buyurtmani rasmiylashtirib bo'lgan",
         "Qaytish bosqichida: u shu sotuvchidan avval ham xarid qilgan mijoz edi"], c=1,
      e="«Narxi qancha, qachon yetkazasiz?» — qaror bosqichi savoli: mijoz sotib olishni o'ylayapti, shuning uchun unga tez va aniq javob berish sotuvni hal qiladi.",
      qe="A customer saw your Instagram post and wrote “How much is it and when will you deliver?”. Which stage of the customer journey are they at?",
      ae=["Awareness: they have only just learned that this product exists",
         "Decision: they ask about price and time and are close to buying",
         "Purchase: they have paid and have already placed the order in full",
         "Return: they are a customer who has bought from this seller before"],
      ee="“How much and when?” is a decision-stage question: the customer is thinking of buying, so a fast and clear answer decides the sale."),
 # 2 — kanal tanlash (to'g'ri: C)
 dict(q="Yangi biznesda reklama kanalini tanlashda birinchi navbatda qaysi kanalga e'tibor berish kerak?",
      a=["Obunachisi eng ko'p bo'lgan kanalga, chunki auditoriyasi katta",
         "Raqobatchilar hammasi reklama qilayotgan kanalga, ular adashmaydi",
         "Mijozingiz eng ko'p vaqt o'tkazadigan va unga ishonadigan kanalga",
         "Reklama narxi eng arzon bo'lgan kanalga, byudjet tejalishi uchun"], c=2,
      e="Reklama aynan sizning mijozingizga yetishi kerak: katta yoki arzon kanal emas, mijoz o'zi faol bo'lgan kanal natija beradi.",
      qe="When choosing an advertising channel for a new business, what should you look at first?",
      ae=["The channel with the most subscribers, because its audience is large",
         "The channel all competitors advertise on, because they cannot be wrong",
         "The channel where your customer is most active and trusts the content",
         "The channel with the lowest advertising price, so the budget is saved"],
      ee="Advertising must reach exactly your customer: not the big or the cheap channel, but the one where the customer is active gives results."),
 # 3 — 70-20-10 (to'g'ri: B)
 dict(q="Reklama byudjetining «70–20–10» qoidasida 20 foiz nimaga ajratiladi?",
      a=["Natija berayotgan kanalni yanada kengaytirib, kuchaytirishga",
         "Yangi kanal yoki yangi usulni kichik hajmda sinab ko'rishga",
         "Reklama to'xtagan paytlar uchun zaxira jamg'armasi tuzishga",
         "Doimiy mijozlarga sovg'alar va maxsus chegirmalar berishga"], c=1,
      e="70% ishlayotgan kanalga ketadi, 20% yangi kanal yoki usulni kichik hajmda sinashga, 10% esa jasoratli tajribalarga.",
      qe="In the “70–20–10” rule for an advertising budget, what is the 20 percent spent on?",
      ae=["Strengthening the channel that already brings in results",
         "Testing a new channel or a new method on a small scale",
         "Building a reserve fund for times when ads are stopped",
         "Giving gifts and special discounts to regular customers"],
      ee="70% goes to the channel that works, 20% to testing a new channel or method on a small scale, and 10% to bold experiments."),
 # 4 — AIDA, A=Action (to'g'ri: A)
 dict(q="AIDA formulasidagi oxirgi «A» harfi (Action) reklama matnida nimani bildiradi?",
      a=["Mijozga keyingi aniq qadamni aytish, masalan: «Telegramga yozing»",
         "Mahsulotning barcha texnik xususiyatlarini ketma-ket sanab chiqish",
         "Diqqatni tortadigan jarangdor sarlavhani matnning boshiga qo'yish",
         "Mijozlarning fikr va sharhlarini ham matn tagiga qo'shib qo'yish"], c=0,
      e="Action — harakatga chaqiriq: mijoz keyin nima qilishini aniq bilsin (yozish, qo'ng'iroq qilish, buyurtma berish).",
      qe="In the AIDA formula, what does the last letter “A” (Action) mean in an advertisement?",
      ae=["Telling the customer one clear step, e.g. “Message us on Telegram”",
         "Listing all the technical features of the product one after another",
         "Placing a catchy headline that grabs attention at the text's start",
         "Adding customers' opinions and reviews under the text, as proof"],
      ee="Action is the call to action: the customer must know exactly what to do next (write, call, place an order)."),
 # 5 — halol reklama (to'g'ri: D)
 dict(q="Quyidagi reklama jumlalaridan qaysi biri halol hisoblanadi va uni tekshirib ko'rish mumkin?",
      a=["Shahardagi eng yaxshi sumkalar faqat bizning do'konda sotiladi",
         "Bu sumka har qanday yuk ostida hech qachon yirtilmaydi, kafolat",
         "Raqobatchilar sumkasi tez yirtiladi, bizniki esa umrbod chidaydi",
         "Matosi paxtadan, o'lchami 38×42 sm, og'irligi taxminan 220 gramm"], c=3,
      e="Material, o'lcham va og'irlik kabi faktlarni tekshirish mumkin. «Eng yaxshi», «hech qachon», «umrbod» kabi iboralar dalilsiz bo'lsa, aldamchi reklama hisoblanadi.",
      qe="Which of the following advertising sentences is honest and can be verified?",
      ae=["The best bags in the whole city are sold only in our shop",
         "This bag never tears under any load, guaranteed for sure",
         "Rivals' bags tear quickly, while ours lasts for a lifetime",
         "Cotton fabric, size 38×42 cm, and weight of about 220 grams"],
      ee="Facts such as material, size and weight can be checked. Phrases like “the best”, “never”, “for a lifetime” without proof make the advertisement misleading."),
 # 6 — CAC hisobi (to'g'ri: B)
 dict(q="Reklamaga 600 000 so'm sarflandi va 15 ta yangi mijoz keldi. Bitta mijozni jalb qilish narxi (CAC) qancha?",
      a=["25 000 so'm", "40 000 so'm", "60 000 so'm", "90 000 so'm"], c=1,
      e="CAC = reklama xarajati ÷ yangi mijozlar soni = 600 000 ÷ 15 = 40 000 so'm.",
      qe="600,000 so'm was spent on advertising and 15 new customers came. What is the cost of acquiring one customer (CAC)?",
      ae=["25,000 so'm", "40,000 so'm", "60,000 so'm", "90,000 so'm"],
      ee="CAC = ad spend ÷ number of new customers = 600,000 ÷ 15 = 40,000 so'm."),
 # 7 — zararsiz ROAS (to'g'ri: A)
 dict(q="Mahsulot narxi 80 000 so'm, undan sof foyda 30 000 so'm. Reklamaning ROAS ko'rsatkichi 1,6 chiqdi. Qaysi xulosa to'g'ri?",
      a=["Reklama zarar keltiryapti: foydali bo'lishi uchun ROAS kamida 2,7 bo'lishi kerak",
         "Reklama foydali: ROAS birdan katta bo'lsa, biznes har doim daromadda bo'ladi",
         "Reklama o'zini oqlayapti, chunki tushum reklama xarajatidan ancha oshib ketdi",
         "Xulosa chiqarib bo'lmaydi: ROAS bilan birga mijozlar soni ham ko'rilishi shart"], c=0,
      e="Zararsiz ROAS = narx ÷ sotuvdan foyda = 80 000 ÷ 30 000 ≈ 2,7. ROAS 1,6 bundan past — tushum bor, lekin tannarx va yetkazishdan keyin foyda reklamani qoplamaydi.",
      qe="The product price is 80,000 so'm and the profit from it is 30,000 so'm. The advertising ROAS came out at 1.6. Which conclusion is right?",
      ae=["The advertising loses money: to be profitable, ROAS must be at least 2.7",
          "The advertising is profitable: if ROAS is above one, a business always earns",
          "The advertising pays off, because revenue far exceeds the advertising cost",
          "No conclusion is possible: the number of customers must also be reviewed"],
      ee="Break-even ROAS = price ÷ profit per sale = 80,000 ÷ 30,000 ≈ 2.7. ROAS 1.6 is below it — there is revenue, but after cost and delivery the profit does not cover the ads."),
 # 8 — CAC > foyda (to'g'ri: C)
 dict(q="Birinchi sotuvda mijoz narxi (CAC) 50 000, sotuvdan foyda esa 30 000 so'm. Biznes uchun eng to'g'ri harakat qaysi?",
      a=["Reklamani zudlik bilan to'xtatib, mahsulotni sotuvdan butunlay olib tashlash",
         "Reklama xarajatini yanada oshirish, mijozlar ko'payganda zarar o'zi yopiladi",
         "Konversiyani oshirish yoki mijozni qayta xaridga qaytarib, foydani oshirish",
         "Narxni tannarxdan pastroq qo'yib, mijozlarni birdaniga ko'paytirib yuborish"], c=2,
      e="Zararning sababi odatda sotuv jarayonida: yaxshiroq matn, tez javob va qayta xarid mijoz qiymatini oshiradi. Avval shuni tuzating, keyin reklamani kengaytiring.",
      qe="At the first sale the customer cost (CAC) is 50,000 and the profit per sale is 30,000 so'm. What is the best action for the business?",
      ae=["Stop the advertising at once and take the product off sale entirely",
         "Raise the ad spend, because the loss covers itself as customers grow",
         "Raise conversion or bring customers back to buy again, to grow profit",
         "Set the price below cost, to attract a great many customers at once"],
      ee="The cause of a loss is usually in the sales process: better copy, fast replies and repeat purchases raise customer value. Fix that first, then scale the advertising."),
 # 9 — yetkazish usuli (to'g'ri: D)
 dict(q="Siz kichik va yengil mahsulotni boshqa viloyatga, haftasiga 3–4 buyurtma bilan sotasiz. Qaysi yetkazish usuli eng mos?",
      a=["Har buyurtmaga o'zingiz borib, mahsulotni qo'lma-qo'l topshirib kelish",
         "Marketpleys omboriga katta partiyani topshirib, uni saqlatib qo'yish",
         "Shahar ichidagi taksi-yetkazish xizmatidan viloyatga ham foydalanish",
         "Tarifi va kuzatuvi bor pochta yoki kuryerlik kompaniyasini tanlash"], c=3,
      e="Kam buyurtma, yengil mahsulot va boshqa viloyat — pochta yoki kuryerlik kompaniyasi eng mantiqli: tarifi oldindan ma'lum, mahsulot kuzatiladi, vaqtingiz tejaladi.",
      qe="You sell a small, light product to another region with 3–4 orders a week. Which delivery method fits best?",
      ae=["Going yourself to every order and handing the product over by hand",
         "Handing a large batch to a marketplace warehouse to be stored there",
         "Using a city taxi-delivery service for the other region as well",
         "Choosing a post or courier company that has a tariff and tracking"],
      ee="Few orders, a light product and another region — a post or courier company makes the most sense: the tariff is known in advance, the parcel is tracked and your time is saved."),
 # 10 — naqd to'lov xavfi (to'g'ri: A)
 dict(q="Mijozlar yetkazilganda naqd to'lashni tanlasa, sotuvchi uchun qaysi xavf mavjud?",
      a=["Mijoz buyurtmani rad etsa, yetkazish xarajati sotuvchi zimmasida qoladi",
         "Naqd to'lovda yetkazib beruvchi pulni qabul qilishga umuman haqli bo'lmaydi",
         "Naqd to'langanda mijozga har qanday chegirma berish qonun bilan taqiqlanadi",
         "Mijoz kartasidan pul yechilmay qolgani sababli buyurtma o'zi bekor bo'ladi"], c=0,
      e="Naqd to'lovning asosiy xavfi — mijoz eshikka kelgan mahsulotni rad etishi: yetkazish va qaytarish xarajati sotuvchiga tushadi. Shuning uchun ko'pincha qisman avans so'raladi.",
      qe="If customers choose to pay cash on delivery, which risk exists for the seller?",
      ae=["If the customer refuses the order, the delivery cost stays on the seller",
         "With cash payment the delivery person has no right to take the money",
         "When paying in cash, giving the customer any discount is banned by law",
         "As no money is taken from the customer's card, the order cancels itself"],
      ee="The main risk of cash on delivery is that the customer refuses the product at the door: the delivery and return costs fall on the seller. That is why a partial advance is often requested."),
 # 11 — bepul yetkazish chegarasi (to'g'ri: C)
 dict(q="Do'kon «300 000 so'mdan yuqori buyurtmaga yetkazish bepul» deb e'lon qildi. Bu qoidaning asosiy maqsadi nima?",
      a=["Yetkazish xarajatini butunlay yo'qotib, sotuvchi hisobidan to'lamaslik",
         "Faqat boy mijozlarni tanlab olib, qolganlarni sotuvdan chetlashtirish",
         "Mijozni ko'proq xarid qilishga undab, o'rtacha buyurtmani kattalashtirish",
         "Soliq to'lashda yetkazish xarajatini hisobdan butunlay chiqarib tashlash"], c=2,
      e="Bepul yetkazish chegarasi mijozni bir necha mahsulotni birga olishga undaydi — o'rtacha chek oshadi va yetkazish xarajati ko'proq tushumga taqsimlanadi.",
      qe="A shop announced “delivery is free for orders over 300,000 so'm”. What is the main purpose of this rule?",
      ae=["Removing the delivery cost completely so the seller does not pay it",
         "Selecting only wealthy customers and keeping the others out of sales",
         "Encouraging customers to buy more and raising the average order amount",
         "Removing the delivery cost from the accounts entirely when paying tax"],
      ee="A free-delivery threshold encourages the customer to buy several items together — the average order grows and the delivery cost is spread over more revenue."),
 # 12 — oxirgi chaqirim (to'g'ri: D)
 dict(q="Logistikada «oxirgi chaqirim» iborasi nimani anglatadi?",
      a=["Mahsulot ishlab chiqarilgan joydan omborgacha bo'lgan eng uzun yo'lni",
         "Kuryer bir kunda bosib o'tadigan masofaning so'nggi bir kilometrini",
         "Mijoz buyurtmani qabul qilgach, to'lov o'tadigan oxirgi daqiqalarni",
         "Mahsulot ombordan mijozning eshigigacha bo'lgan so'nggi bosqichni"], c=3,
      e="Oxirgi chaqirim — mahsulot ombordan mijozning eshigigacha yetib boradigan so'nggi bosqich. U ko'pincha eng qimmat va muammoli qism bo'ladi.",
      qe="In logistics, what does the phrase “last mile” mean?",
      ae=["The longest route from where the product is made to the warehouse",
         "The final kilometre of the distance a courier covers in one day",
         "The last minutes of payment after the customer accepts the order",
         "The final stage from the warehouse to the customer's front door"],
      ee="The last mile is the final stage in which the product travels from the warehouse to the customer's door. It is often the most expensive and problematic part."),
 # 13 — shikoyat (to'g'ri: C)
 dict(q="Mijoz mahsulot shikastlangan holda kelganini yozdi. Javobning eng yaxshi boshlanishi qaysi?",
      a=["Qadoqlashda kuryer aybdor, shuning uchun avval u bilan bog'lanib ko'ring",
         "Siz mahsulotni noto'g'ri ochgan bo'lishingiz mumkin, avval rasm yuboring",
         "Kechirasiz. Rasmini yuboring, 24 soatda almashtiramiz yoki pul qaytaramiz",
         "Bunday holat juda kam uchraydi, shuning uchun biroz kutib turing, iltimos"], c=2,
      e="To'g'ri javob kechirim so'raydi va aniq, muddatli yechim beradi. Mijozni ayblash yoki kuttirish uni yo'qotishga olib keladi.",
      qe="A customer wrote that the product arrived damaged. What is the best way to begin the reply?",
      ae=["The courier is to blame for the packing, so please contact them first",
         "You may have opened the product the wrong way, so send a photo first",
         "Sorry. Send a photo and we will replace it in 24 hours or refund you",
         "This case is very rare, so please wait a little while we look at it"],
      ee="A good reply apologises and offers a clear solution with a deadline. Blaming the customer or making them wait leads to losing them."),
 # 14 — kam va'da, ko'p bering (to'g'ri: A)
 dict(q="Nega yetkazish muddatini real muddatdan biroz uzunroq va'da qilish maqsadga muvofiq?",
      a=["Mijoz erta olsa mamnun bo'ladi, biroz kechiksa ham ishonch yo'qolmaydi",
         "Mijoz uzoqroq kutganda tovar uchun ko'proq pul to'lashga rozi bo'ladi",
         "Qonun yetkazish muddatini real vaqtdan uzunroq yozishni majburiy qiladi",
         "Shunda sotuvchi buyurtmani hech qachon tezroq yetkazishga intilmaydi"], c=0,
      e="«Kam va'da qiling, ko'p bering» qoidasi: mijoz va'dadan oldin olsa xursand bo'ladi, kichik kechikish bo'lsa ham ishonch saqlanadi.",
      qe="Why is it sensible to promise a delivery time slightly longer than the real one?",
      ae=["The customer is pleased if it comes early, and trust stays if late",
         "When the customer waits longer, they agree to pay more for the goods",
         "The law makes it compulsory to write a time longer than the real one",
         "That way the seller will never try to deliver the order any sooner"],
      ee="The “under-promise, over-deliver” rule: the customer is happy if it arrives before the promise, and trust survives even a small delay."),
 # 15 — qayta sotuv (to'g'ri: B)
 dict(q="Quyidagi usullardan qaysi biri odatda yangi mijoz jalb qilishdan arzonroq sotuv beradi?",
      a=["Yangi kanalda qimmatroq targetli reklamani ishga tushirish",
         "Mavjud mijozga qayta taklif yuborib, tavsiya so'rab ko'rish",
         "Narxni vaqtincha tushirib, barcha obunachilarga e'lon qilish",
         "Blogger bilan hamkor bo'lib, bir martalik e'lon joylashtirish"], c=1,
      e="Mijoz sizni allaqachon biladi va ishonadi — unga qayta sotish yoki uning tavsiyasini olish yangi mijoz topishdan arzonroq. Shu sabab xizmat sifati reklama ham hisoblanadi.",
      qe="Which of the following methods usually gives a cheaper sale than winning a new customer?",
      ae=["Launching a more expensive targeted advertisement on a new channel",
         "Sending existing customers a repeat offer and asking for referrals",
         "Lowering the price for a while and announcing it to all subscribers",
         "Partnering with a blogger and placing a one-off announcement post"],
      ee="The customer already knows and trusts you — selling to them again or getting their recommendation is cheaper than finding a new one. That is why service quality is advertising too."),
]
