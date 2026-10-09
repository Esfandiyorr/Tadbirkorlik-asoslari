# -*- coding: utf-8 -*-
"""M14 · Biznes-reja tuzish va mahsulotni tashqi bozorga olib chiqish — slaydlar va test (yangi_mavzu.py uchun).
T, d, slide — yangi_mavzu.py beradi.  Ishlatish:
  python3 _reyting-manba/yangi_mavzu.py _reyting-manba/matn/mavzu_14_matn.py mavzu-14.html "Biznes-reja tuzish va mahsulotni tashqi bozorga olib chiqish" 14
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
 E("span", "M14-mavzu · Amaliy mashg'ulot · 2 soat", "Topic 14 · Practical class · 2 hours", 'class="kicker"') +
 E("h1", "BIZNES-REJA TUZISH VA MAHSULOTNI TASHQI BOZORGA OLIB CHIQISH", "WRITING A BUSINESS PLAN AND TAKING A PRODUCT TO FOREIGN MARKETS", 'class="grad"') +
 E("p", "Biznes-reja kim uchun va nima uchun · <b>biznes model kanvasi va 10 bo'lim</b> · moliyaviy reja va ssenariylar · eksportga tayyorlik · bozor tanlash · hujjatlar, Incoterms, to'lov va eksport narxi.",
   "Who a business plan is for and why · <b>the business model canvas and 10 sections</b> · the financial plan and scenarios · export readiness · choosing a market · documents, Incoterms, payment and export pricing.", 'class="lead"') +
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
 E("div", "Maqsad: talaba o'z g'oyasi uchun <b>ishonchli biznes-reja</b> tuzishni hamda mahsulotni <b>tashqi bozorga</b> chiqarish uchun bozor, kanal, hujjat, yetkazish va narx bo'yicha asosli qaror qabul qilishni o'rganadi.",
   "Aim: the student learns to write <b>a credible business plan</b> for their idea and to make reasoned decisions on market, channel, documents, delivery and price for taking a product to <b>foreign markets</b>.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("green", "🧩", "Modelni chizadi", "Maps the model", "Biznes model kanvasining 9 blokini o'z g'oyasi uchun to'ldiradi.", "Fills in the 9 blocks of the business model canvas for their idea.") +
 card("blue", "📘", "Reja yozadi", "Writes the plan", "Biznes-rejaning 10 bo'limini va 1 betlik rezyumeni tuzadi.", "Writes the 10 sections of a business plan and a one-page summary.") +
 card("violet", "📊", "Moliyani asoslaydi", "Grounds the finances", "Farazlar, 3 ssenariy va qoplanish muddatini hisoblaydi.", "Calculates assumptions, 3 scenarios and the payback period.") +
 card("orange", "🌍", "Bozor tanlaydi", "Chooses a market", "Eksportga tayyorlikni baholab, tashqi bozorni mezonlar bilan tanlaydi.", "Assesses export readiness and chooses a foreign market by criteria.") +
 card("pink", "📄", "Shartlarni biladi", "Knows the terms", "Asosiy eksport hujjatlari, Incoterms va to'lov usullarini farqlaydi.", "Tells apart the main export documents, Incoterms and payment methods.") +
 card("cyan", "🏷", "Eksport narxini hisoblaydi", "Prices for export", "Zavod narxidan xorijdagi tokcha narxigacha bo'lgan zanjirni hisoblaydi.", "Calculates the chain from the factory price to the shelf price abroad.") +
 '</div>')

# ============================ 3. REJA ============================
slide("Reja va tushunchalar", "Plan and concepts",
 E("span", "Mashg'ulot rejasi", "Class plan", 'class="kicker"') +
 E("h2", "Bugungi <span class=\"grad\">4 ta blok</span>", "Today's <span class=\"grad\">4 blocks</span>") +
 '<div class="grid g4">' +
 card("green", "1️⃣", "Biznes-reja", "The business plan", "Kim uchun, biznes model kanvasi, 10 bo'lim, rezyume.", "Who it is for, the canvas, 10 sections, the summary.") +
 card("blue", "2️⃣", "Moliyaviy reja", "The financial plan", "Farazlar, hisobotlar, 3 ssenariy, tez-tez uchraydigan xatolar.", "Assumptions, statements, 3 scenarios, common mistakes.") +
 card("violet", "3️⃣", "Tashqi bozor", "Foreign markets", "Eksportga tayyorlik, bozor tanlash, kanallar.", "Export readiness, choosing a market, channels.") +
 card("orange", "4️⃣", "Eksport amaliyoti", "Export practice", "Hujjatlar, Incoterms, to'lov usullari, eksport narxi.", "Documents, Incoterms, payment methods, export pricing.") +
 '</div>' + E("h3", "🔑 Tayanch tushunchalar", "🔑 Key concepts", 'style="margin-top:22px"') +
 E("div",
   '<span class="pill g">biznes-reja</span><span class="pill g">biznes model kanvasi</span><span class="pill">rezyume</span><span class="pill">qiymat taklifi</span>'
   '<span class="pill g">farazlar</span><span class="pill">ssenariy tahlili</span><span class="pill">qoplanish muddati</span><span class="pill g">eksportga tayyorlik</span>'
   '<span class="pill">maqsadli bozor</span><span class="pill">distribyutor</span><span class="pill g">eksport shartnomasi</span><span class="pill">invoys</span>'
   '<span class="pill">kelib chiqish sertifikati</span><span class="pill">fitosanitariya sertifikati</span><span class="pill g">Incoterms</span><span class="pill">akkreditiv</span>'
   '<span class="pill">valyuta xavfi</span><span class="pill g">eksport narxi</span>',
   '<span class="pill g">business plan</span><span class="pill g">business model canvas</span><span class="pill">executive summary</span><span class="pill">value proposition</span>'
   '<span class="pill g">assumptions</span><span class="pill">scenario analysis</span><span class="pill">payback period</span><span class="pill g">export readiness</span>'
   '<span class="pill">target market</span><span class="pill">distributor</span><span class="pill g">export contract</span><span class="pill">invoice</span>'
   '<span class="pill">certificate of origin</span><span class="pill">phytosanitary certificate</span><span class="pill g">Incoterms</span><span class="pill">letter of credit</span>'
   '<span class="pill">currency risk</span><span class="pill g">export price</span>'))

# ============================ 4. NIMA UCHUN ============================
slide("Biznes-reja nima uchun kerak?", "Why a business plan?",
 E("span", "1-blok · Biznes-reja", "Block 1 · The business plan", 'class="kicker"') +
 E("h2", "Biznes-reja — <span class=\"grad\">fikrlash vositasi</span>, qog'oz emas", "A business plan is <span class=\"grad\">a thinking tool</span>, not paperwork") +
 E("div", "<b>Biznes-reja</b> — g'oya qanday qilib pul topishini, buning uchun qancha mablag', qancha vaqt va qanday qadamlar kerakligini <b>raqamlar bilan</b> ko'rsatadigan hujjat. U avvalo <b>sizning o'zingiz</b> uchun.",
   "A <b>business plan</b> is a document that shows <b>with numbers</b> how an idea will make money and how much funding, time and which steps it needs. It is first of all <b>for you</b>.", 'class="def"') +
 table([("Kim o'qiydi", "Who reads it"), ("Asosiy savoli", "Their main question"), ("Rejada nimaga urg'u bering", "What to stress in the plan")], [
  [TD("<b>🧑 O'zingiz va jamoa</b>", "<b>🧑 You and your team</b>"), TD("Nima, qachon va kim qiladi?", "What, when and who?"), TD("Qadamlar, muddat, mas'ul, nazorat ko'rsatkichlari", "Steps, deadlines, owners, control indicators")],
  [TD("<b>🏦 Bank</b>", "<b>🏦 A bank</b>"), TD("Qarz qaytariladimi?", "Will the loan be repaid?"), TD("Pul oqimi, qoplash koeffitsienti, garov", "Cash flow, coverage ratio, collateral")],
  [TD("<b>💼 Investor</b>", "<b>💼 An investor</b>"), TD("Qancha o'sadi va qancha qaytadi?", "How much will it grow and return?"), TD("Bozor, o'sish, jamoa, chiqish yo'li", "Market, growth, team, exit")],
  [TD("<b>🎁 Grant yoki davlat dasturi</b>", "<b>🎁 A grant or state programme</b>"), TD("Jamiyatga nima beradi?", "What does it give society?"), TD("Ish o'rinlari, eksport, mahalliy xomashyo, aniq byudjet", "Jobs, exports, local raw materials, a clear budget")],
  [TD("<b>🤝 Xorijiy hamkor</b>", "<b>🤝 A foreign partner</b>"), TD("Siz bilan ishlash ishonchlimi?", "Is it safe to work with you?"), TD("Sifat, hajm barqarorligi, sertifikatlar, tajriba", "Quality, steady volume, certificates, track record")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("blue", "📄", "Qisqa reja (1–2 bet)", "A short plan (1–2 pages)", "Biznes model kanvasi + asosiy raqamlar. G'oyani tekshirish va o'zingiz uchun reja tuzishda yetarli.", "The canvas + key figures. Enough to test an idea and plan for yourself.") +
 card("green", "📚", "To'liq reja (15–25 bet)", "A full plan (15–25 pages)", "Bank, investor yoki grant uchun. Bugungi misol: <b>TerMeva</b> (9-mavzudagi shartli quritilgan meva biznesi) ishlab chiqarishni kengaytirib, eksportni boshlamoqchi.",
      "For a bank, investor or grant. Today's example: <b>TerMeva</b> (the sample dried-fruit business from topic 9) wants to expand production and start exporting.") + '</div>' +
 E("small", "TerMeva — o'quv uchun to'qib chiqarilgan shartli misol; raqamlar haqiqiy biznesdan olinmagan.", "TerMeva is a made-up teaching example; the figures are not from a real business.", 'class="note"'))

# ============================ 5. KANVA ============================
slide("Biznes model kanvasi", "The business model canvas",
 E("span", "1.2 · Bir betda model", "1.2 · The model on one page", 'class="kicker"') +
 E("h2", "TerMeva: <span class=\"grad\">9 blokda biznes modeli</span>", "TerMeva: <span class=\"grad\">the business model in 9 blocks</span>") +
 '<div class="grid g3">' +
 card("violet", "🤝", "1. Asosiy hamkorlar", "1. Key partners", "Bog'dorchilik fermerlari, qadoq ishlab chiqaruvchi, laboratoriya, transport kompaniyasi, xorijiy distribyutor.", "Orchard farmers, a packaging maker, a laboratory, a transport company, a foreign distributor.") +
 card("blue", "⚙️", "2. Asosiy faoliyat", "2. Key activities", "Meva xaridi va saralash, quritish, qadoqlash, sifat nazorati, sotuv.", "Buying and sorting fruit, drying, packing, quality control, sales.") +
 card("green", "💎", "3. Qiymat taklifi", "3. Value proposition", "Mahalliy, qandsiz, tarkibi ochiq yozilgan quritilgan meva — uyga yetkazib beriladi va sovg'abop qadoqda.", "Local, sugar-free dried fruit with full ingredients on the label — home delivery and gift packaging.") +
 card("orange", "🏭", "4. Asosiy resurslar", "4. Key resources", "Quritish liniyasi, sertifikatlar, malakali jamoa, fermerlar bilan shartnomalar.", "A drying line, certificates, a skilled team, contracts with farmers.") +
 card("pink", "💬", "5. Mijoz bilan munosabat", "5. Customer relationships", "Telegram orqali shaxsiy xizmat, doimiy mijozga obuna, distribyutor bilan uzoq muddatli shartnoma.", "Personal service on Telegram, subscriptions for regulars, a long-term contract with a distributor.") +
 card("cyan", "🚚", "6. Kanallar", "6. Channels", "O'z onlayn do'koni, mahalliy do'konlar, marketpleys, xorijda distribyutor.", "Own online shop, local stores, marketplaces, a distributor abroad.") +
 card("teal", "👥", "7. Mijozlar segmentlari", "7. Customer segments", "Sog'lom ovqatlanuvchi oilalar, sovg'a xaridorlari, kafe va do'konlar, qo'shni davlatdagi xaridorlar.", "Health-conscious families, gift buyers, cafés and shops, buyers in a neighbouring country.") +
 card("red", "💸", "8. Xarajatlar tuzilmasi", "8. Cost structure", "Xomashyo va qadoq (tushumning ~55%), ish haqi, ijara, sertifikatlash, transport.", "Raw materials and packaging (~55% of revenue), wages, rent, certification, transport.") +
 card("amber", "💰", "9. Daromad manbalari", "9. Revenue streams", "Chakana qadoqlar, sovg'a to'plamlari, ulgurji va eksport partiyalari.", "Retail packs, gift sets, wholesale and export batches.") + '</div>' +
 E("small", "Kanvani avval qalam bilan to'ldiring va mijozlar bilan tekshiring; to'liq biznes-reja shu kanvadan «o'sib» chiqadi.", "Fill in the canvas in pencil first and test it with customers; the full plan “grows” out of it.", 'class="note"'))

# ============================ 6. TUZILMA ============================
slide("Biznes-rejaning 10 bo'limi", "The 10 sections of a business plan",
 E("span", "1.3 · Tuzilma", "1.3 · Structure", 'class="kicker"') +
 E("h2", "Biznes-reja <span class=\"grad\">nimalardan iborat?</span>", "What does a business plan <span class=\"grad\">consist of?</span>") +
 table([("№", "No."), ("Bo'lim", "Section"), ("Nimani yozasiz", "What you write"), ("Maslahat", "Tip")], [
  [TD("1", "1"), TD("<b>Rezyume</b>", "<b>Executive summary</b>"), TD("Butun rejaning 1 betlik qisqacha mazmuni", "A one-page summary of the whole plan"), TD("Oxirida yozing, boshida qo'ying", "Write it last, put it first", "g")],
  [TD("2", "2"), TD("<b>Kompaniya va jamoa</b>", "<b>Company and team</b>"), TD("Kim siz, huquqiy shakl, jamoa tajribasi", "Who you are, legal form, team experience"), TD("Faqat ishga aloqador tajriba", "Only relevant experience")],
  [TD("3", "3"), TD("<b>Mahsulot</b>", "<b>Product</b>"), TD("Muammo, yechim, qiymat taklifi", "Problem, solution, value proposition"), TD("Rasm va texnik ko'rsatkich", "Photos and specifications")],
  [TD("4", "4"), TD("<b>Bozor tahlili</b>", "<b>Market analysis</b>"), TD("Mijoz, bozor hajmi, raqobat", "Customer, market size, competition"), TD("Pastdan yuqoriga hisob (9-mavzu)", "Bottom-up estimate (topic 9)")],
  [TD("5", "5"), TD("<b>Marketing va sotuv</b>", "<b>Marketing and sales</b>"), TD("Narx, kanal, reklama, sotuv rejasi", "Price, channels, advertising, sales plan"), TD("8–11-mavzular", "Topics 8–11")],
  [TD("6", "6"), TD("<b>Ishlab chiqarish</b>", "<b>Operations</b>"), TD("Jarayon, uskuna, xomashyo, sifat", "Process, equipment, raw materials, quality"), TD("Quvvat va cheklovlarni yozing", "State capacity and limits")],
  [TD("7", "7"), TD("<b>Tashkiliy reja</b>", "<b>Organisation</b>"), TD("Lavozimlar, xodimlar, ish haqi", "Roles, staff, wages"), TD("15-mavzu", "Topic 15")],
  [TD("8", "8"), TD("<b>Moliyaviy reja</b>", "<b>Financial plan</b>"), TD("Investitsiya, foyda-zarar, pul oqimi, qoplanish", "Investment, P&amp;L, cash flow, payback"), TD("Farazlarni ochiq yozing", "State assumptions openly", "g")],
  [TD("9", "9"), TD("<b>Xavflar</b>", "<b>Risks</b>"), TD("Asosiy xavflar va ularga qarshi choralar", "Main risks and responses"), TD("Yashirmang — tayyorligingizni ko'rsating", "Do not hide them — show you are ready")],
  [TD("10", "10"), TD("<b>Ilovalar</b>", "<b>Appendices</b>"), TD("Shartnomalar, sertifikatlar, narxnomalar, so'rov natijalari", "Contracts, certificates, price quotes, survey results"), TD("Har bir raqamning manbasi", "A source for every figure")]]) +
 E("small", "Grant va kredit dasturlari o'z shablonini talab qilishi mumkin. Avval talab qilingan shaklni oling, keyin shu 10 bo'limni unga moslang.", "Grant and loan programmes may require their own template. Get the required form first, then fit these 10 sections into it.", 'class="note"'))

# ============================ 7. REZYUME ============================
slide("Rezyume: 1 betda butun reja", "The summary: the whole plan on one page",
 E("span", "1.4 · Rezyume", "1.4 · Executive summary", 'class="kicker"') +
 E("h2", "Ko'p o'quvchi <span class=\"grad\">faqat rezyumeni</span> o'qiydi", "Many readers <span class=\"grad\">read only the summary</span>") +
 E("div", "Rezyume 6 ta savolga qisqa va raqamli javob beradi: <b>muammo, yechim, bozor, isbot, pul, so'rov</b>. U eng oxirida — reja tayyor bo'lgach yoziladi.",
   "The summary gives short, numeric answers to 6 questions: <b>problem, solution, market, proof, money, the ask</b>. It is written last — once the plan is ready.", 'class="def"') +
 '<div class="grid g2" style="margin-top:14px">' +
 '<div class="card" style="--c:var(--red)">' + E("h3", "❌ Zaif rezyume", "❌ A weak summary") +
 E("p", "«Kompaniyamiz yuqori sifatli mahsulot ishlab chiqaradi. Bozor juda katta va o'sib bormoqda. Biz bozorda yetakchi bo'lishni maqsad qilganmiz. Investitsiya kerak.»",
   "“Our company produces high-quality products. The market is huge and growing. We aim to become the market leader. Investment is needed.”", 'style="font-style:italic"') +
 '<ul class="tick cross">' + E("li", "Bitta ham raqam yo'q", "Not a single number") + E("li", "Mijoz va muammo noaniq", "Customer and problem are unclear") + E("li", "Qancha pul, nimaga — noma'lum", "How much money and for what — unknown") + '</ul></div>' +
 '<div class="card" style="--c:var(--green)">' + E("h3", "✅ Kuchli rezyume (shartli)", "✅ A strong summary (sample)") +
 E("p", "«TerMeva 2 yildan beri mahalliy mevani qandsiz quritib sotadi: o'tgan yil 1 500 kg, doimiy mijozlar 300 ta oila. Qo'shni davlatdagi distribyutor yiliga 1 000 kg ga qiziqish bildirdi. Quritish liniyasi va sertifikatlash uchun <b>120 mln so'm</b> kerak. Asosiy ssenariyda yillik tushum 360 mln, sof foyda 48 mln, qoplanish — <b>2,5 yil</b>.»",
   "“For 2 years TerMeva has dried local fruit without sugar: 1,500 kg sold last year, 300 regular families. A distributor in a neighbouring country has shown interest in 1,000 kg a year. We need <b>120 million so'm</b> for a drying line and certification. In the base case annual revenue is 360 million, net profit 48 million, payback <b>2.5 years</b>.”", 'style="font-style:italic"') + '</div></div>' +
 '<div class="grid g3" style="margin-top:14px">' +
 card("blue", "📏", "Hajmi", "Length", "1 bet, 250–400 so'z. Har jumlada bitta fikr.", "One page, 250–400 words. One idea per sentence.") +
 card("violet", "🔢", "Raqamlar", "Numbers", "Kamida 5 ta: sotuv, mijoz, bozor, investitsiya, qoplanish.", "At least 5: sales, customers, market, investment, payback.") +
 card("orange", "🎯", "So'rov", "The ask", "Aniq summa, nimaga sarflanishi va qanday qaytishi.", "An exact sum, what it is for and how it comes back.") + '</div>')

# ============================ 8. MOLIYAVIY REJA ============================
slide("Moliyaviy reja", "The financial plan",
 E("span", "2-blok · Moliyaviy reja", "Block 2 · The financial plan", 'class="kicker"') +
 E("h2", "Raqamlar — <span class=\"grad\">farazlardan</span> boshlanadi", "The numbers start <span class=\"grad\">from assumptions</span>") +
 E("div", "Moliyaviy reja — 3 hisobot (foyda va zarar, pul oqimi, investitsiya rejasi) va ularning asosidagi <b>farazlar</b>. Har bir faraz <b>manbasi</b> bilan yoziladi — o'quvchi uni tekshira olishi kerak.",
   "The financial plan is 3 statements (P&amp;L, cash flow, investment plan) and the <b>assumptions</b> behind them. Each assumption is written with its <b>source</b> — the reader must be able to check it.", 'class="def"') +
 '<div class="grid g2" style="margin-top:14px"><div style="min-width:0">' +
 '<div class="card" style="--c:var(--blue)">' + E("h3", "📋 Asosiy farazlar (1-yil)", "📋 Key assumptions (year 1)") +
 table([("Faraz", "Assumption"), ("Qiymat", "Value"), ("Manba", "Source")], [
  [TD("Ichki sotuv", "Domestic sales"), TD("1 500 kg", "1,500 kg"), TD("O'tgan yil savdosi", "Last year's sales")],
  [TD("Ichki narx", "Domestic price"), TD("160 000 so'm/kg", "160,000 so'm/kg"), TD("Amaldagi narxnoma", "Current price list")],
  [TD("Eksport hajmi", "Export volume"), TD("1 000 kg", "1,000 kg"), TD("Distribyutor xati", "Distributor's letter")],
  [TD("Eksport narxi (EXW)", "Export price (EXW)"), TD("120 000 so'm/kg", "120,000 so'm/kg"), TD("Muzokara", "Negotiation")],
  [TD("Xomashyo va qadoq", "Raw materials and packaging"), TD("tushumning 55%", "55% of revenue"), TD("Fermer shartnomalari", "Farmer contracts")],
  [TD("Doimiy xarajatlar", "Fixed costs"), TD("100 mln/yil", "100 million/year"), TD("Ijara, ish haqi rejasi", "Rent, wage plan")]]) + '</div></div>' +
 '<div style="min-width:0"><div class="card" style="--c:var(--green)">' + E("h3", "🧾 Yillik natija (asosiy ssenariy, mln so'm)", "🧾 Annual result (base case, million so'm)") +
 table(None, [
  [TD("Tushum: 1 500 × 160 000 + 1 000 × 120 000", "Revenue: 1,500 × 160,000 + 1,000 × 120,000"), TD("<b>360</b>", "<b>360</b>")],
  [TD("− Xomashyo va qadoq (55%)", "− Raw materials and packaging (55%)"), TD("198", "198")],
  [TD("= Yalpi foyda", "= Gross profit"), TD("162", "162")],
  [TD("− Doimiy xarajatlar (ish haqi 54, ijara 18, marketing va sertifikat 10, amortizatsiya 12, boshqa 6)", "− Fixed costs (wages 54, rent 18, marketing and certification 10, depreciation 12, other 6)"), TD("100", "100")],
  [TD("= Operatsion foyda", "= Operating profit"), TD("62", "62")],
  [TD("− Soliq (shartli)", "− Tax (sample)"), TD("14", "14")],
  [TD("<b>= Sof foyda</b>", "<b>= Net profit</b>"), TD("<b>48</b>", "<b>48</b>", "g")]]) +
 E("p", "Investitsiya 120 mln: quritish liniyasi 70, qadoqlash uskunasi 20, sertifikat va laboratoriya 10, aylanma mablag' 20. <b>Qoplanish: 120 ÷ 48 = 2,5 yil.</b>",
   "Investment 120 million: drying line 70, packing equipment 20, certification and lab 10, working capital 20. <b>Payback: 120 ÷ 48 = 2.5 years.</b>", 'style="margin-top:8px"') + '</div></div></div>')

# ============================ 9. SSENARIYLAR VA XATOLAR ============================
slide("Ssenariylar va reja xatolari", "Scenarios and plan mistakes",
 E("span", "2.2 · Tekshiruv", "2.2 · Stress test", 'class="kicker"') +
 E("h2", "Reja <span class=\"grad\">yomon holatda ham</span> yashay oladimi?", "Can the plan survive <span class=\"grad\">a bad case too?</span>") +
 table([("Ssenariy", "Scenario"), ("Nima o'zgaradi", "What changes"), ("Tushum", "Revenue"), ("Sof foyda", "Net profit"), ("Qoplanish", "Payback")], [
  [TD("<b>😟 Pessimistik</b>", "<b>😟 Pessimistic</b>"), TD("Eksport kechikadi, ichki sotuv kam; xomashyo qimmatroq (yalpi marja 45%)", "Exports are delayed, domestic sales are lower; raw materials dearer (gross margin 45%)"), TD("280 mln", "280 million"), TD("15 mln", "15 million", "r"), TD("8 yil", "8 years", "r")],
  [TD("<b>😐 Asosiy</b>", "<b>😐 Base</b>"), TD("Farazlar jadvali bo'yicha", "As in the assumptions table"), TD("360 mln", "360 million"), TD("48 mln", "48 million"), TD("2,5 yil", "2.5 years")],
  [TD("<b>😊 Optimistik</b>", "<b>😊 Optimistic</b>"), TD("Ikkinchi distribyutor, sovg'a to'plamlari ko'p sotiladi", "A second distributor, strong gift-set sales"), TD("450 mln", "450 million"), TD("85 mln", "85 million", "g"), TD("≈ 1,4 yil", "≈ 1.4 years", "g")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card_ul("red", "⚠️", "Biznes-rejaning 6 ta tipik xatosi", "6 typical business-plan mistakes", [
  ("Faqat <b>optimistik</b> raqamlar, farazlar va manbalar yo'q.", "Only <b>optimistic</b> figures, with no assumptions or sources."),
  ("«Bozor 36 mln kishi, 1% olsa ham...» — yuqoridan pastga hisob.", "“The market is 36 million people, even 1%...” — a top-down guess."),
  ("Raqobatchi «yo'q» deb yozish.", "Writing that there are “no competitors”."),
  ("Pul oqimi yo'q — faqat foyda hisoblangan.", "No cash flow — only profit is calculated."),
  ("Internetdan ko'chirilgan umumiy matnlar.", "Generic text copied from the internet."),
  ("Xavflar bo'limi bo'sh yoki «xavf yo'q».", "The risks section is empty or says “no risks”.")], "tick cross") +
 card("green", "🧠", "Xulosa", "Conclusion", "Pessimistik ssenariyda ham TerMeva zarar ko'rmaydi, lekin qoplanish 8 yilga cho'ziladi. Demak, <b>eksport shartnomasini oldindan imzolash</b> va xomashyo narxini fermerlar bilan qotirish — asosiy shartlar. Buni rejada ochiq yozing.",
      "Even in the pessimistic case TerMeva makes no loss, but payback stretches to 8 years. So <b>signing the export contract in advance</b> and fixing raw-material prices with farmers are key conditions. State this openly in the plan.") + '</div>')

# ============================ 10. EKSPORTGA TAYYORLIK ============================
slide("Eksportga tayyorlik", "Export readiness",
 E("span", "3-blok · Tashqi bozor", "Block 3 · Foreign markets", 'class="kicker"') +
 E("h2", "Eksportga <span class=\"grad\">tayyormisiz?</span> 8 savollik test", "Are you <span class=\"grad\">ready to export?</span> An 8-question check") +
 E("div", "Eksport — ichki savdoning «kattaroq» shakli emas: talablar, hujjatlar va xavflar ko'proq. Har savolga <b>0</b> (yo'q), <b>1</b> (qisman) yoki <b>2</b> (ha) ball qo'ying.",
   "Exporting is not just a “bigger” version of domestic trade: there are more requirements, documents and risks. Score each question <b>0</b> (no), <b>1</b> (partly) or <b>2</b> (yes).", 'class="def"') +
 table([("Savol", "Question"), ("TerMeva", "TerMeva")], [
  [TD("1. Mahsulot ichki bozorda kamida 1 yil barqaror sotilyaptimi?", "1. Has the product sold steadily at home for at least a year?"), TD("2", "2", "g")],
  [TD("2. Sifat har partiyada bir xilmi (standart, nazorat)?", "2. Is quality the same in every batch (standard, checks)?"), TD("1", "1")],
  [TD("3. Qo'shimcha hajmni ishlab chiqarish quvvati bormi?", "3. Is there capacity for extra volume?"), TD("1", "1")],
  [TD("4. Kerakli sertifikatlar va laboratoriya xulosalari bormi?", "4. Are the required certificates and lab reports in place?"), TD("0", "0", "r")],
  [TD("5. Qadoq va yorliq maqsadli bozor tili va talabiga mosmi?", "5. Do packaging and labels fit the target market's language and rules?"), TD("1", "1")],
  [TD("6. Eksport narxi xarajatlar bilan hisoblanganmi?", "6. Is the export price calculated with all costs?"), TD("2", "2", "g")],
  [TD("7. 2–3 oy to'lovni kutishga aylanma mablag' bormi?", "7. Is there working capital to wait 2–3 months for payment?"), TD("1", "1")],
  [TD("8. Jamoada tashqi savdo tajribasi yoki maslahatchi bormi?", "8. Does the team have foreign-trade experience or an adviser?"), TD("1", "1")],
  [TD("<b>Jami</b>", "<b>Total</b>"), TD("<b>9 / 16</b>", "<b>9 / 16</b>")]]) +
 '<div class="grid g3" style="margin-top:14px">' +
 card("red", "0–6", "Hali erta", "Too early", "Avval ichki bozorda mustahkamlaning.", "Strengthen the domestic business first.") +
 card("orange", "7–11", "Tayyorgarlik bosqichi", "Getting ready", "Zaif joylarni (TerMeva: sertifikat) 3–6 oyda tuzating, kichik sinov partiyasi bilan boshlang.", "Fix weak points (TerMeva: certificates) in 3–6 months and start with a small trial batch.") +
 card("green", "12–16", "Tayyor", "Ready", "Bozor tanlash va hamkor izlashga o'ting.", "Move on to choosing a market and finding a partner.") + '</div>')

# ============================ 11. BOZOR TANLASH ============================
slide("Tashqi bozorni tanlash", "Choosing a foreign market",
 E("span", "3.2 · Bozor tanlash", "3.2 · Market choice", 'class="kicker"') +
 E("h2", "Qaysi davlatdan <span class=\"grad\">boshlash kerak?</span>", "Which country <span class=\"grad\">to start with?</span>") +
 E("div", "Bozorni «eng katta» yoki «eng mashhur» deb emas, <b>vaznli mezonlar</b> bo'yicha tanlang. Har mezonga 1–5 ball qo'yiladi, ball vaznga ko'paytirilib qo'shiladi.",
   "Choose a market not as “the biggest” or “the best known” but by <b>weighted criteria</b>. Each criterion gets 1–5 points; points are multiplied by the weight and added up.", 'class="def"') +
 table([("Mezon", "Criterion"), ("Vazn", "Weight"), ("Bozor A — qo'shni davlat", "Market A — a neighbour"), ("Bozor B — katta, uzoqroq", "Market B — large, further"), ("Bozor C — premium, uzoq", "Market C — premium, far")], [
  [TD("Talab hajmi", "Size of demand"), TD("25%", "25%"), TD("3", "3"), TD("5", "5"), TD("4", "4")],
  [TD("Masofa va logistika", "Distance and logistics"), TD("20%", "20%"), TD("5", "5"), TD("3", "3"), TD("1", "1")],
  [TD("Talablar va hujjatlar soddaligi", "Simplicity of rules and documents"), TD("20%", "20%"), TD("4", "4"), TD("3", "3"), TD("2", "2")],
  [TD("Raqobat (kamroq — yaxshi)", "Competition (less is better)"), TD("15%", "15%"), TD("3", "3"), TD("2", "2"), TD("3", "3")],
  [TD("Til va madaniy yaqinlik", "Language and cultural closeness"), TD("10%", "10%"), TD("5", "5"), TD("4", "4"), TD("2", "2")],
  [TD("To'lov xavfi (past — yaxshi)", "Payment risk (low is better)"), TD("10%", "10%"), TD("4", "4"), TD("3", "3"), TD("4", "4")],
  [TD("<b>Vaznli ball</b>", "<b>Weighted score</b>"), TD("100%", "100%"), TD("<b>3,90</b>", "<b>3.90</b>", "g"), TD("3,45", "3.45"), TD("2,65", "2.65", "r")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("green", "🧮", "Hisob namunasi (A)", "Sample calculation (A)", "3×0,25 + 5×0,20 + 4×0,20 + 3×0,15 + 5×0,10 + 4×0,10 = <b>3,90</b>. TerMeva birinchi bo'lib A bozoridan, kichik sinov partiyasi bilan boshlaydi.",
      "3×0.25 + 5×0.20 + 4×0.20 + 3×0.15 + 5×0.10 + 4×0.10 = <b>3.90</b>. TerMeva starts with market A, using a small trial batch.") +
 card("blue", "🔎", "Ma'lumotni qayerdan olish?", "Where to get data?", "Import statistikasi (trademap.org), maqsadli bozor talablari (rasmiy saytlar, savdo vakolatxonalari), ko'rgazmalar va distribyutor bilan suhbat. Ballni his bilan emas, dalil bilan qo'ying.",
      "Import statistics (trademap.org), the target market's rules (official sites, trade missions), fairs and talks with distributors. Score with evidence, not feelings.") + '</div>' +
 E("small", "A, B, C — o'quv uchun umumlashtirilgan bozorlar; ballar shartli. Haqiqiy davlat uchun talab va qoidalarni o'sha davlatning rasmiy manbalaridan tekshiring.",
   "A, B and C are generalised teaching markets; the scores are made up. For a real country, check demand and rules in that country's official sources.", 'class="note"'))

# ============================ 12. EKSPORT KANALLARI ============================
slide("Eksport kanallari", "Export channels",
 E("span", "3.3 · Kanal", "3.3 · Channel", 'class="kicker"') +
 E("h2", "Mahsulot xorijdagi mijozga <span class=\"grad\">qanday yetib boradi?</span>", "How does the product <span class=\"grad\">reach a customer abroad?</span>") +
 table([("Kanal", "Channel"), ("Qanday ishlaydi", "How it works"), ("Afzalligi", "Advantage"), ("Kamchiligi", "Drawback")], [
  [TD("<b>🤝 Distribyutor / importyor</b>", "<b>🤝 Distributor / importer</b>"), TD("Xorijiy kompaniya partiyani sotib oladi va o'z tarmog'ida sotadi", "A foreign company buys the batch and sells it through its network"), TD("Mahalliy bozorni, qoidalarni va do'konlarni biladi", "Knows the local market, rules and shops", "g"), TD("Narxning katta qismini oladi, brend nazorati kam", "Takes a big share of the price; less brand control", "r")],
  [TD("<b>🏪 To'g'ridan-to'g'ri do'konlarga</b>", "<b>🏪 Directly to shops</b>"), TD("Siz o'zingiz xorijdagi do'kon va tarmoqlar bilan shartnoma tuzasiz", "You sign contracts with shops and chains abroad yourself"), TD("Marja va mijoz bilan aloqa sizda", "You keep the margin and the customer relationship", "g"), TD("Ko'p vaqt, til, mahalliy kompaniya kerak bo'lishi mumkin", "Much time, language, may need a local company", "r")],
  [TD("<b>🌐 Xalqaro marketpleys</b>", "<b>🌐 International marketplace</b>"), TD("Platforma orqali chet eldagi xaridorga sotish", "Selling to buyers abroad through a platform"), TD("Tez boshlash, kichik hajm bilan sinash", "Quick start, test with small volumes", "g"), TD("Komissiya, platforma qoidalari, kuchli raqobat", "Commission, platform rules, strong competition", "r")],
  [TD("<b>🎪 Ko'rgazma va B2B uchrashuvlar</b>", "<b>🎪 Fairs and B2B meetings</b>"), TD("Xalqaro ko'rgazmada stend yoki savdo missiyasida qatnashish", "A stand at an international fair or joining a trade mission"), TD("Bir joyda ko'p xaridor, ishonch shakllanadi", "Many buyers in one place; trust is built", "g"), TD("Tayyorgarlik va safar xarajati", "Preparation and travel costs", "r")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("green", "🎯", "TerMeva tanlovi", "TerMeva's choice", "Birinchi yil — A bozorida <b>bitta distribyutor</b> orqali (sinov partiyasi 200 kg, keyin yiliga 1 000 kg). Parallel ravishda xalqaro marketpleysda sovg'a to'plamlarini sinash.",
      "Year one — <b>one distributor</b> in market A (a 200 kg trial batch, then 1,000 kg a year). In parallel, test gift sets on an international marketplace.") +
 card("orange", "📝", "Distribyutor bilan shartnomada", "In the distributor contract", "Hudud va eksklyuzivlik, minimal hajm, narx va uni qayta ko'rish tartibi, to'lov muddati, marketing majburiyatlari, shartnomani bekor qilish shartlari.",
      "Territory and exclusivity, minimum volume, price and how it is reviewed, payment terms, marketing duties, termination terms.") + '</div>')

# ============================ 13. HUJJATLAR ============================
slide("Eksport hujjatlari", "Export documents",
 E("span", "4-blok · Eksport amaliyoti", "Block 4 · Export practice", 'class="kicker"') +
 E("h2", "Eksport partiyasi bilan <span class=\"grad\">qaysi hujjatlar boradi?</span>", "Which documents <span class=\"grad\">travel with an export batch?</span>") +
 table([("Hujjat", "Document"), ("Nima uchun kerak", "What it is for"), ("Kim tayyorlaydi", "Who prepares it")], [
  [TD("<b>📜 Eksport shartnomasi (kontrakt)</b>", "<b>📜 Export contract</b>"), TD("Tovar, narx, miqdor, yetkazish sharti (Incoterms), to'lov, nizolarni hal qilish tartibi", "Goods, price, quantity, delivery term (Incoterms), payment, dispute resolution"), TD("Sotuvchi va xaridor", "Seller and buyer")],
  [TD("<b>🧾 Invoys (hisob-faktura)</b>", "<b>🧾 Commercial invoice</b>"), TD("Partiya qiymati — bojxona va to'lov uchun asos", "The value of the batch — the basis for customs and payment"), TD("Sotuvchi", "Seller")],
  [TD("<b>📦 Qadoqlash varaqasi</b>", "<b>📦 Packing list</b>"), TD("Qutilar soni, og'irligi, tarkibi — tekshirish uchun", "Number of boxes, weights, contents — for checking"), TD("Sotuvchi", "Seller")],
  [TD("<b>🚛 Transport hujjati</b>", "<b>🚛 Transport document</b>"), TD("Yukni tashuvchiga topshirilganini tasdiqlaydi (avtomobilda — CMR yuk xati)", "Confirms the goods were handed to the carrier (by road — a CMR consignment note)"), TD("Tashuvchi", "Carrier")],
  [TD("<b>🏷 Kelib chiqish sertifikati</b>", "<b>🏷 Certificate of origin</b>"), TD("Tovar qaysi mamlakatda ishlab chiqarilganini tasdiqlaydi; boj imtiyozlari uchun muhim", "Confirms where the goods were made; important for customs preferences"), TD("Vakolatli organ", "Authorised body")],
  [TD("<b>🌿 Fitosanitariya sertifikati</b>", "<b>🌿 Phytosanitary certificate</b>"), TD("O'simlik mahsulotlari zararkunanda va kasalliklardan xoli ekanini tasdiqlaydi", "Confirms plant products are free of pests and diseases"), TD("Karantin xizmati", "Plant quarantine service")],
  [TD("<b>🧪 Sifat va xavfsizlik hujjatlari</b>", "<b>🧪 Quality and safety documents</b>"), TD("Laboratoriya xulosasi, maqsadli bozor talab qiladigan sertifikatlar", "Lab reports and certificates the target market requires"), TD("Laboratoriya, sertifikatlash organi", "Laboratory, certification body")],
  [TD("<b>🛃 Bojxona deklaratsiyasi</b>", "<b>🛃 Customs declaration</b>"), TD("Tovarni eksport rejimida rasmiylashtirish", "Clearing the goods for export"), TD("Sotuvchi yoki bojxona brokeri", "Seller or customs broker")]]) +
 E("small", "Hujjatlar ro'yxati mahsulot turi, maqsadli davlat va amaldagi kelishuvlarga qarab o'zgaradi. Partiyadan oldin talablarni bojxona xizmati, karantin organi va xaridor bilan yozma aniqlang.",
   "The list of documents depends on the product, the destination country and current agreements. Before each batch, confirm requirements in writing with customs, the quarantine authority and the buyer.", 'class="note"'))

# ============================ 14. INCOTERMS VA TO'LOV ============================
slide("Incoterms va to'lov usullari", "Incoterms and payment methods",
 E("span", "4.2 · Shartlar", "4.2 · Terms", 'class="kicker"') +
 E("h2", "Kim nima uchun to'laydi va <span class=\"grad\">xavf qachon o'tadi?</span>", "Who pays for what and <span class=\"grad\">when does risk pass?</span>") +
 E("div", "<b>Incoterms</b> — Xalqaro savdo palatasi (ICC) qoidalari: transport, sug'urta, bojxona rasmiylashtiruvi va xavf sotuvchi bilan xaridor o'rtasida qanday taqsimlanishini belgilaydi. Shartnomada yozing, masalan: «DAP, [shahar], Incoterms 2020».",
   "<b>Incoterms</b> are International Chamber of Commerce (ICC) rules that set how transport, insurance, customs clearance and risk are split between seller and buyer. Write it in the contract, e.g. “DAP, [city], Incoterms 2020”.", 'class="def"') +
 table([("Shart", "Term"), ("Sotuvchi nima qiladi", "What the seller does"), ("Xavf qayerda o'tadi", "Where risk passes"), ("Kimga qulay", "Who it suits")], [
  [TD("<b>EXW</b> — zavoddan", "<b>EXW</b> — Ex Works"), TD("Tovarni o'z hududida tayyorlab qo'yadi; qolgan hammasini xaridor qiladi", "Makes goods available at its premises; the buyer does everything else"), TD("Sotuvchining omborida", "At the seller's premises"), TD("Yangi eksportchi, tajribali xaridor", "A new exporter, an experienced buyer")],
  [TD("<b>FCA</b> — tashuvchiga topshirish", "<b>FCA</b> — Free Carrier"), TD("Eksport rasmiylashtiruvini qilib, xaridor tashuvchisiga belgilangan joyda topshiradi", "Clears for export and hands goods to the buyer's carrier at the named place"), TD("Tashuvchiga topshirilganda", "On handover to the carrier"), TD("Ko'p holatda muvozanatli tanlov", "A balanced choice in many cases", "g")],
  [TD("<b>DAP</b> — joyga yetkazish", "<b>DAP</b> — Delivered at Place"), TD("Belgilangan manzilgacha yetkazadi; import rasmiylashtiruvi va boj — xaridorda", "Delivers to the named destination; import clearance and duty are the buyer's"), TD("Manzilda, tushirishdan oldin", "At destination, before unloading"), TD("Xaridor uchun qulay, sotuvchiga xavf ko'proq", "Convenient for the buyer, more risk for the seller")],
  [TD("<b>DDP</b> — boj to'langan holda", "<b>DDP</b> — Delivered Duty Paid"), TD("Manzilgacha yetkazadi va import boji hamda rasmiylashtiruvini ham to'laydi", "Delivers and also pays import duty and clearance"), TD("Manzilda", "At destination"), TD("Faqat import qoidalarini yaxshi biladigan sotuvchiga", "Only for a seller who knows the import rules well", "r")]]) +
 E("h3", "To'lov usullari: sotuvchi uchun xavf darajasi", "Payment methods: risk level for the seller", 'style="margin-top:14px"') +
 '<div class="grid g4">' +
 card("green", "1️⃣", "Oldindan to'lov", "Advance payment", "Eng xavfsiz. Lekin xaridor rozi bo'lishi qiyin.", "The safest. But hard for the buyer to accept.") +
 card("blue", "2️⃣", "Akkreditiv", "Letter of credit", "Bank hujjatlar taqdim etilganda to'lashni kafolatlaydi. Xavf past, bank xarajati bor.", "A bank guarantees payment against documents. Low risk, with bank fees.") +
 card("orange", "3️⃣", "Hujjatli inkasso", "Documentary collection", "Hujjatlar bank orqali to'lov evaziga beriladi. O'rtacha xavf.", "Documents are released through a bank against payment. Medium risk.") +
 card("red", "4️⃣", "Keyin to'lov", "Open account", "Tovar jo'natiladi, pul 30–90 kunda. Sotuvchi uchun eng xavfli.", "Goods are shipped, money comes in 30–90 days. The riskiest for the seller.") + '</div>' +
 E("small", "<b>Valyuta xavfi:</b> narx xorijiy valyutada bo'lsa, to'lov kunigacha kurs o'zgarib, so'mdagi tushum kamayishi mumkin. Valyuta operatsiyalari qoidalarini cbu.uz va bank bilan aniqlang.",
   "<b>Currency risk:</b> if the price is in a foreign currency, the rate may change before payment and the income in so'm may fall. Confirm foreign-exchange rules with cbu.uz and your bank.", 'class="note"'))

# ============================ 15. EKSPORT NARXI ============================
slide("Eksport narxini hisoblash", "Calculating the export price",
 E("span", "4.3 · Narx zanjiri", "4.3 · The price chain", 'class="kicker"') +
 E("h2", "120 000 so'mlik mahsulot xorijda <span class=\"grad\">nega 214 500 turadi?</span>", "Why does a 120,000-so'm product <span class=\"grad\">cost 214,500 abroad?</span>") +
 E("div", "Eksport narxi — zavod narxi emas. Unga transport, hujjatlar, sug'urta va vositachilar ustamasi qo'shiladi. Zanjirni oxirigacha hisoblab, <b>xorijdagi tokcha narxini</b> raqobatchilar bilan solishtiring.",
   "The export price is not the factory price. Transport, documents, insurance and intermediaries' markups are added. Calculate the chain to the end and compare the <b>shelf price abroad</b> with competitors.", 'class="def"') +
 '<div class="grid g2" style="margin-top:14px"><div style="min-width:0">' +
 table([("Bosqich (1 kg)", "Step (1 kg)"), ("So'm", "So'm")], [
  [TD("Tannarx", "Unit cost"), TD("90 000", "90,000")],
  [TD("<b>EXW narx</b> (TerMeva foydasi bilan)", "<b>EXW price</b> (with TerMeva's profit)"), TD("<b>120 000</b>", "<b>120,000</b>")],
  [TD("+ Transport (manzilgacha)", "+ Transport (to destination)"), TD("8 000", "8,000")],
  [TD("+ Hujjatlar va eksport rasmiylashtiruvi", "+ Documents and export clearance"), TD("3 000", "3,000")],
  [TD("+ Sug'urta", "+ Insurance"), TD("1 000", "1,000")],
  [TD("<b>= DAP narx</b>", "<b>= DAP price</b>"), TD("<b>132 000</b>", "<b>132,000</b>")],
  [TD("+ Distribyutor ustamasi 25%", "+ Distributor markup 25%"), TD("165 000", "165,000")],
  [TD("+ Do'kon ustamasi 30%", "+ Shop markup 30%"), TD("<b>214 500</b>", "<b>214,500</b>", "r")]]) + '</div>' +
 '<div style="min-width:0">' +
 card("orange", "🔍", "Raqobatchi bilan solishtirish", "Comparing with competitors", "Agar A bozorida o'xshash mahsulot tokchada ~200 000 so'mga teng narxda bo'lsa, TerMeva <b>7% qimmatroq</b>. Yo farqni ko'rsatish (qandsiz, sovg'a qadoq), yo zanjirni qisqartirish kerak.",
      "If a similar product sits on market A's shelves at about 200,000 so'm, TerMeva is <b>7% dearer</b>. Either show the difference (sugar-free, gift packaging) or shorten the chain.") +
 card_ul("green", "🛠", "Narxni qanday pasaytirish mumkin?", "How can the price be lowered?", [
  ("Kattaroq partiya — 1 kg ga transport arzonlashadi.", "Larger batches — transport per kg gets cheaper."),
  ("FCA shartida ishlash — transportni xaridor tashkil qiladi.", "Working on FCA terms — the buyer organises transport."),
  ("Distribyutor ustamasini hajm evaziga kamaytirish.", "Lowering the distributor's markup in return for volume."),
  ("Yengilroq qadoq — og'irlik va narx kamayadi.", "Lighter packaging — less weight and cost.")], "tick", "margin-top:12px") + '</div></div>' +
 E("small", "Import boji, QQS va boshqa soliqlar maqsadli davlat qoidalariga va savdo kelishuvlariga bog'liq; bu misolda hisobga olinmagan. Haqiqiy hisobda ularni albatta qo'shing.",
   "Import duty, VAT and other taxes depend on the destination country's rules and trade agreements; they are not included in this example. Always add them in a real calculation.", 'class="note"'))

# ============================ 16. AMALIY TOPSHIRIQ ============================
slide("Amaliy topshiriq", "Practical task",
 E("span", "Amaliy mashg'ulot · 2 soat", "Practical class · 2 hours", 'class="kicker"') +
 E("h2", "«Mini biznes-reja <span class=\"grad\">va eksport kartochkasi»</span>", "The “mini business plan <span class=\"grad\">and export card”</span>") +
 E("p", "Har bir talaba (yoki 2 kishilik guruh) o'z g'oyasi uchun 5 betlik mini biznes-reja va mahsulotni bitta tashqi bozorga chiqarish kartochkasini tayyorlaydi.", "Each student (or a pair) prepares a 5-page mini business plan for their idea and a card for taking the product to one foreign market.", 'class="lead"') +
 '<div class="grid g2"><div class="card" style="--c:var(--blue)">' + E("h3", "⏱ 120 daqiqalik reja", "⏱ The 120-minute plan") +
 table([("Vaqt", "Time"), ("Nima qilinadi", "What to do")], [
  [TD("0–20", "0–20"), TD("Biznes model kanvasi (9 blok)", "The business model canvas (9 blocks)")],
  [TD("20–45", "20–45"), TD("Farazlar jadvali, yillik natija, qoplanish", "Assumptions table, annual result, payback")],
  [TD("45–60", "45–60"), TD("3 ssenariy va 3 ta asosiy xavf", "3 scenarios and 3 key risks")],
  [TD("60–80", "60–80"), TD("Eksportga tayyorlik testi va bozor tanlash matritsasi", "The export-readiness check and market matrix")],
  [TD("80–100", "80–100"), TD("Kanal, hujjatlar, Incoterms, to'lov va eksport narxi", "Channel, documents, Incoterms, payment and export price")],
  [TD("100–120", "100–120"), TD("1 betlik rezyume va 3 daqiqalik himoya", "A one-page summary and a 3-minute defence")]]) + '</div>' +
 '<div><div class="card" style="--c:var(--green)">' + E("h3", "📋 Ishda bo'lishi shart", "📋 The work must contain") +
 '<ul class="clean">' + E("li", "Rezyume (1 bet, kamida 5 ta raqam)", "A summary (1 page, at least 5 figures)") +
 E("li", "Kanva va farazlar jadvali manbalari bilan", "The canvas and an assumptions table with sources") +
 E("li", "Yillik natija, 3 ssenariy, qoplanish muddati", "Annual result, 3 scenarios, payback period") +
 E("li", "Tayyorlik bali va bozor tanlash hisobi", "Readiness score and the market-choice calculation") +
 E("li", "Kanal, hujjatlar ro'yxati, Incoterms va to'lov usuli", "Channel, list of documents, Incoterms and payment method") +
 E("li", "Eksport narxi zanjiri va raqobatchi bilan solishtirish", "The export price chain and a competitor comparison") + '</ul></div>' +
 '<div class="card" style="--c:var(--amber);margin-top:12px">' + E("h3", "🏅 Baholash", "🏅 Assessment") +
 E("p", "Biznes-reja mantiqi va raqamlar <b>35%</b> · eksport qarorlari asosi <b>30%</b> · rezyume sifati <b>15%</b> · himoya <b>20%</b>.", "Plan logic and figures <b>35%</b> · reasoning for export decisions <b>30%</b> · summary quality <b>15%</b> · defence <b>20%</b>.") + '</div></div></div>')

# ============================ 17. XULOSA ============================
slide("Xulosa va resurslar", "Summary and resources",
 E("span", "Xulosa · Mustaqil ish · Havolalar", "Summary · Independent work · Links", 'class="kicker"') +
 E("h2", "Yakuniy <span class=\"grad\">xulosa</span> va <span class=\"grad\">foydali resurslar</span>", "The final <span class=\"grad\">summary</span> and <span class=\"grad\">useful resources</span>") +
 '<div class="grid g2"><div>' +
 card_ul("green", "📌", "Esda qoladigan 6 ta fikr", "6 things to remember", [
  ("Biznes-reja — avvalo <b>o'zingiz uchun</b>; o'quvchiga qarab urg'uni o'zgartiring.", "A business plan is first <b>for you</b>; shift the emphasis to suit the reader."),
  ("Kanva → 10 bo'lim → <b>rezyume oxirida</b> yoziladi, boshida turadi.", "Canvas → 10 sections → <b>the summary is written last</b> but placed first."),
  ("Har raqamning <b>farazi va manbasi</b> bo'lsin; 3 ssenariyni hisoblang.", "Every figure needs <b>an assumption and a source</b>; calculate 3 scenarios."),
  ("Eksportdan oldin <b>tayyorlikni</b> baholang; bozorni vaznli mezonlar bilan tanlang.", "Assess <b>readiness</b> before exporting; choose markets by weighted criteria."),
  ("Hujjatlar, <b>Incoterms</b> va to'lov usulini shartnomada aniq yozing.", "State documents, <b>Incoterms</b> and the payment method clearly in the contract."),
  ("Eksport narxini <b>tokchagacha</b> hisoblang va raqobatchi bilan solishtiring.", "Calculate the export price <b>to the shelf</b> and compare with competitors.")]) +
 '<div class="card" style="--c:var(--amber);margin-top:12px">' + E("h3", "📓 Mustaqil ish: «Bitta bozor tadqiqoti»", "📓 Independent work: “One market study”") +
 '<ul class="clean">' + E("li", "O'z mahsulotingiz uchun bitta xorijiy bozorni tanlang.", "Choose one foreign market for your product.") +
 E("li", "trademap.org dan import hajmi va asosiy yetkazib beruvchilarni toping.", "Find import volumes and main suppliers on trademap.org.") +
 E("li", "Shu bozordagi 3 ta o'xshash mahsulot narxini yozing.", "Record the prices of 3 similar products in that market.") +
 E("li", "Eksport narxi zanjirini hisoblab, xulosa yozing: kirish mumkinmi?", "Calculate the export price chain and conclude: can you enter?") + '</ul>' +
 E("p", "Hajmi: 2 bet + jadval. Baholash: ma'lumot manbalari 35% · hisob 35% · asoslangan xulosa 30%.", "Size: 2 pages + a table. Marking: data sources 35% · calculation 35% · reasoned conclusion 30%.", 'style="font-size:13.5px;color:var(--muted)"') + '</div></div>' +
 '<div><div class="card" style="--c:var(--blue)">' + E("h3", "🔗 Foydali resurslar", "🔗 Useful resources") +
 E("p", "<b>Qonun va rasmiy manbalar:</b>", "<b>Law and official sources:</b>") +
 '<ul class="clean">' +
 E("li", '<a class="lnk" href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> — tashqi iqtisodiy faoliyat, bojxona va valyuta qonunlari', '<a class="lnk" href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> — laws on foreign trade, customs and currency') +
 E("li", '<a class="lnk" href="https://customs.uz" target="_blank" rel="noopener">customs.uz</a> — bojxona xizmati: rasmiylashtirish tartibi', '<a class="lnk" href="https://customs.uz" target="_blank" rel="noopener">customs.uz</a> — the customs service: clearance procedures') +
 E("li", '<a class="lnk" href="https://cbu.uz" target="_blank" rel="noopener">cbu.uz</a> — Markaziy bank: valyuta kurslari va qoidalar', '<a class="lnk" href="https://cbu.uz" target="_blank" rel="noopener">cbu.uz</a> — the Central Bank: exchange rates and rules') +
 E("li", '<a class="lnk" href="https://stat.uz" target="_blank" rel="noopener">stat.uz</a> — tashqi savdo statistikasi', '<a class="lnk" href="https://stat.uz" target="_blank" rel="noopener">stat.uz</a> — foreign-trade statistics') + '</ul>' +
 E("p", "<b>Xalqaro manbalar:</b>", "<b>International sources:</b>", 'style="margin-top:8px"') +
 E("p", '<a class="lnk" href="https://www.trademap.org" target="_blank" rel="noopener">trademap.org</a> — import-eksport statistikasi (ITC) · <a class="lnk" href="https://www.intracen.org" target="_blank" rel="noopener">intracen.org</a> — Xalqaro savdo markazi qo\'llanmalari · <a class="lnk" href="https://iccwbo.org" target="_blank" rel="noopener">iccwbo.org</a> — Incoterms qoidalari',
   '<a class="lnk" href="https://www.trademap.org" target="_blank" rel="noopener">trademap.org</a> — import-export statistics (ITC) · <a class="lnk" href="https://www.intracen.org" target="_blank" rel="noopener">intracen.org</a> — International Trade Centre guides · <a class="lnk" href="https://iccwbo.org" target="_blank" rel="noopener">iccwbo.org</a> — the Incoterms rules') +
 E("p", "<b>O'qish uchun:</b> Alexander Osterwalder — «Business Model Generation» · Rhonda Abrams — «Successful Business Plan» · ITC — «Export Quality Management» qo'llanmasi.", "<b>Further reading:</b> Alexander Osterwalder — “Business Model Generation” · Rhonda Abrams — “Successful Business Plan” · ITC — the “Export Quality Management” guide.", 'style="margin-top:8px"') +
 E("small", "⚠️ Bojxona, valyuta va sertifikatlash talablari o'zgaradi. Har bir partiyadan oldin amaldagi rasmiy ma'lumotga tayaning.", "⚠️ Customs, currency and certification requirements change. Rely on current official information before every batch.", 'class="note"') +
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
 E("p", "Keyingi mashg'ulotgacha <b>mini biznes-reja va eksport kartochkasini</b> tugallang — keyingi mavzu: jamoani shakllantirish, xodimlarni boshqarish va xavflarni aniqlash.",
   "Before the next class, finish your <b>mini business plan and export card</b> — the next topic: building a team, managing staff and identifying risks.") +
 E("p", "Termiz davlat universiteti · Tadbirkorlik asoslari", "Termez State University · Fundamentals of Entrepreneurship", 'style="color:var(--muted);font-size:13.5px"') + '</div>')

# ============================ TEST SAVOLLARI ============================
Q = [
 # 1 — rezyume (to'g'ri: C)
 dict(q="Biznes-rejaning rezyumesi (qisqacha mazmuni) qachon yozilishi tavsiya etiladi?",
      a=["Eng birinchi bo'lib, chunki u rejaning boshida joylashadi",
         "Moliyaviy reja bo'limidan oldin, bozor tahlili bilan birga",
         "Eng oxirida, reja tayyor bo'lgach — lekin boshiga qo'yiladi",
         "Umuman yozilmaydi, chunki o'quvchi butun rejani o'qiydi"], c=2,
      e="Rezyume butun rejaning qisqacha mazmuni, shuning uchun u barcha bo'limlar tayyor bo'lgach yoziladi. Lekin ko'p o'quvchi faqat uni o'qigani uchun rejaning boshiga qo'yiladi.",
      qe="When is it recommended to write the executive summary of a business plan?",
      ae=["First of all, because it sits at the very start of the plan",
         "Before the financial plan, together with the market analysis",
         "Last, once the plan is ready — but placed at the very start",
         "It is not written at all, since readers read the whole plan"],
      ee="The summary condenses the whole plan, so it is written once all sections are ready. But since many readers read only the summary, it is placed at the start."),
 # 2 — farazlar (to'g'ri: A)
 dict(q="Moliyaviy rejani ishonchli qiladigan eng muhim narsa nima?",
      a=["Har bir raqamning farazi va manbasi ochiq yozilgan bo'lishi",
         "Raqamlar imkon qadar katta va jozibador qilib ko'rsatilishi",
         "Jadval va grafiklar soni ko'p va rang-barang bo'lishi kerak",
         "Faqat bitta, eng ehtimolli ssenariy keltirilgan bo'lishi"], c=0,
      e="O'quvchi raqamlarga ishonishi uchun ular qaysi farazga (narx, hajm, xarajat) va qaysi manbaga (shartnoma, so'rov, o'tgan yil savdosi) asoslanganini ko'rishi kerak.",
      qe="What matters most in making a financial plan credible?",
      ae=["Every figure has its assumption and source stated openly",
         "The figures are shown as large and attractive as possible",
         "There are many colourful tables and charts in the plan",
         "Only a single scenario, the most likely one, is presented"],
      ee="For the reader to trust the figures, they must see which assumption (price, volume, cost) and which source (a contract, a survey, last year's sales) each one rests on."),
 # 3 — ssenariy (to'g'ri: D)
 dict(q="Biznes-rejada pessimistik, asosiy va optimistik ssenariylarni hisoblashdan maqsad nima?",
      a=["Investorga eng yuqori natijani ko'rsatib, uni tezroq ko'ndirish",
         "Rejaning hajmini oshirib, uni yanada jiddiy ko'rinadigan qilish",
         "Bank talab qilgani uchun, biznesga esa hech qanday foydasi yo'q",
         "Reja yomon sharoitda ham yashay olish-olmasligini tekshirish"], c=3,
      e="Ssenariylar rejaning qanchalik mustahkamligini ko'rsatadi: yomon holatda zarar bormi, qoplanish qancha cho'ziladi, qaysi shartlar eng muhim.",
      qe="What is the purpose of calculating pessimistic, base and optimistic scenarios in a business plan?",
      ae=["To show the investor the best result and persuade them faster",
         "To make the plan longer so that it looks more serious and solid",
         "Because a bank requires it; it has no real use for the business",
         "To see whether the plan can survive under bad conditions too"],
      ee="Scenarios show how robust the plan is: is there a loss in the bad case, how long does payback stretch, and which conditions matter most."),
 # 4 — qoplanish (to'g'ri: B)
 dict(q="Investitsiya 120 mln so'm, yillik sof foyda 48 mln so'm. Qoplanish muddati qancha?",
      a=["2 yil", "2,5 yil", "3 yil", "4 yil"], c=1,
      e="Qoplanish muddati = investitsiya ÷ yillik sof foyda = 120 ÷ 48 = 2,5 yil.",
      qe="The investment is 120 million so'm and annual net profit is 48 million so'm. What is the payback period?",
      ae=["2 years", "2.5 years", "3 years", "4 years"],
      ee="Payback period = investment ÷ annual net profit = 120 ÷ 48 = 2.5 years."),
 # 5 — kanva bloki (to'g'ri: C)
 dict(q="Biznes model kanvasining qaysi bloki «Mijoz nega aynan bizni tanlaydi?» degan savolga javob beradi?",
      a=["Asosiy resurslar",
         "Mijoz segmentlari",
         "Qiymat taklifi",
         "Daromad manbalari"], c=2,
      e="Qiymat taklifi — mahsulot mijozga qanday muammoni hal qilib, qanday foyda berishi va uni raqobatchilardan nima ajratib turishi.",
      qe="Which block of the business model canvas answers “Why does the customer choose us?”",
      ae=["Key resources", "Customer segments", "Value proposition", "Revenue streams"],
      ee="The value proposition is which problem the product solves for the customer, what benefit it gives and what sets it apart from competitors."),
 # 6 — eksportga tayyorlik (to'g'ri: A)
 dict(q="Eksportni boshlashdan oldin quyidagilardan qaysi biri eng muhim tayyorlik belgisi hisoblanadi?",
      a=["Barqaror sifat va qo'shimcha hajmni ishlab chiqarish quvvati",
         "Xorijiy tilda chiroyli va qimmat veb-sayt ochib qo'yilgani",
         "Rahbarning chet elga ko'p marta sayohat qilgan tajribasi bor",
         "Ichki bozorda mahsulot hali sotilmagan, yangi va noma'lum"], c=0,
      e="Xorijiy xaridor har partiyada bir xil sifat va kelishilgan hajmni kutadi. Shuning uchun barqaror sifat va quvvat — eksportga tayyorlikning asosiy belgisi.",
      qe="Before starting to export, which of the following is the most important sign of readiness?",
      ae=["Steady quality and capacity to produce extra volume",
         "A beautiful, expensive website in a foreign language",
         "The manager has travelled abroad many times before",
         "The product is new and has not yet been sold at home"],
      ee="A foreign buyer expects the same quality and the agreed volume in every batch. So steady quality and capacity are the main signs of export readiness."),
 # 7 — vaznli ball (to'g'ri: C)
 dict(q="Bozor «talab» mezoni bo'yicha 4 ball (vazni 60%), «logistika» bo'yicha 3 ball (vazni 40%) oldi. Vaznli ball qancha?",
      a=["3,4", "3,5", "3,6", "7,0"], c=2,
      e="Vaznli ball = 4 × 0,6 + 3 × 0,4 = 2,4 + 1,2 = 3,6.",
      qe="A market scored 4 for “demand” (weight 60%) and 3 for “logistics” (weight 40%). What is its weighted score?",
      ae=["3.4", "3.5", "3.6", "7.0"],
      ee="Weighted score = 4 × 0.6 + 3 × 0.4 = 2.4 + 1.2 = 3.6."),
 # 8 — distribyutor (to'g'ri: B)
 dict(q="Yangi bozorga distribyutor orqali kirishning asosiy afzalligi nimada?",
      a=["Distribyutor narxni hech qachon oshirmaydi va ustama ham olmaydi",
         "U mahalliy bozor, qoidalar va do'kon tarmog'ini allaqachon biladi",
         "Distribyutor bilan ishlaganda hech qanday hujjat talab qilinmaydi",
         "Sotuvchi mijozlar bilan to'g'ridan-to'g'ri ishlab, marjani saqlaydi"], c=1,
      e="Distribyutor mahalliy bozor, qoidalar va savdo tarmog'ini biladi — bu kirishni tezlashtiradi. Evaziga u narxning bir qismini oladi va brend nazorati kamayadi.",
      qe="What is the main advantage of entering a new market through a distributor?",
      ae=["A distributor never raises the price and takes no markup at all",
          "It already knows the local market, the rules and the shop network",
          "No documents at all are required when working with a distributor",
          "The seller works directly with customers and keeps the margin"],
      ee="A distributor knows the local market, rules and retail network — this speeds up entry. In return it takes part of the price and brand control is reduced."),
 # 9 — EXW (to'g'ri: D)
 dict(q="Shartnomada «EXW» sharti yozilgan. Bu nimani anglatadi?",
      a=["Sotuvchi tovarni xaridor omboriga yetkazib, import bojini ham to'laydi",
         "Sotuvchi tovarni xaridor manziliga yetkazadi, importni xaridor qiladi",
         "Sotuvchi eksportni rasmiylashtirib, tovarni tashuvchiga topshiradi",
         "Sotuvchi tovarni o'z hududida tayyorlaydi, qolganini xaridor qiladi"], c=3,
      e="EXW (zavoddan) — sotuvchi uchun eng kam majburiyat: tovar uning hududida topshiriladi, yuklash, eksport rasmiylashtiruvi, transport va xavf xaridor zimmasida.",
      qe="The contract says “EXW”. What does this mean?",
      ae=["The seller delivers to the buyer's warehouse and pays import duty too",
         "The seller delivers to the buyer's address; the buyer handles import",
         "The seller clears for export and hands goods to the buyer's carrier",
         "The seller readies goods at its premises; the buyer does the rest"],
      ee="EXW (Ex Works) is the minimum obligation for the seller: goods are handed over at its premises, and loading, export clearance, transport and risk are the buyer's."),
 # 10 — DAP (to'g'ri: B)
 dict(q="«DAP» shartida sotuvchining asosiy majburiyati qaysi?",
      a=["Tovarni faqat o'z omborida tayyorlab qo'yish bilan cheklanadi",
         "Tovarni manzilgacha yetkazish; import rasmiylashtiruvi xaridorda",
         "Tovarni manzilgacha yetkazib, import boji va soliqlarini to'lash",
         "Tovarni faqat kemaga yuklab, sug'urtani xaridorga topshirish"], c=1,
      e="DAP — sotuvchi tovarni belgilangan manzilgacha yetkazadi, xavf ham shu yergacha unda. Import bojxona rasmiylashtiruvi va bojlar esa xaridor zimmasida (DDP dan farqi shu).",
      qe="Under “DAP”, what is the seller's main obligation?",
      ae=["It is limited to making the goods ready at its own warehouse",
          "Delivering to the destination; import clearance is the buyer's",
          "Delivering to the destination and paying import duty and taxes",
          "Only loading the goods onto a ship and passing insurance on"],
      ee="Under DAP the seller delivers to the named destination and bears the risk until then. Import customs clearance and duties are the buyer's (this is the difference from DDP)."),
 # 11 — to'lov usuli (to'g'ri: A)
 dict(q="Birinchi marta ishlayotgan, tanish bo'lmagan xorijiy xaridor bilan sotuvchi uchun eng xavfsiz to'lov sharti qaysi?",
      a=["Tovar jo'natilishidan oldin to'liq oldindan to'lov",
         "Tovar yetib borgandan keyin 90 kun ichida to'lash",
         "Tovar sotilgandan keyingina to'lov (konsignatsiya)",
         "Jo'natilgandan so'ng 60 kunlik ochiq hisob bilan"], c=0,
      e="To'liq oldindan to'lovda pul tovar jo'natilishidan oldin keladi — sotuvchi uchun xavf deyarli yo'q. Keyin to'lov va konsignatsiyada xavf eng yuqori.",
      qe="With a new, unknown foreign buyer, which payment term is safest for the seller?",
      ae=["Full advance payment before the goods are shipped",
         "Payment within 90 days after the goods have arrived",
         "Payment only once the goods are sold (consignment)",
         "An open account, payable 60 days after the shipment"],
      ee="With full advance payment the money arrives before shipment — almost no risk for the seller. Deferred payment and consignment carry the highest risk."),
 # 12 — kelib chiqish sertifikati (to'g'ri: C)
 dict(q="Kelib chiqish sertifikati qanday maqsadda talab qilinadi?",
      a=["Tovar zararkunanda va kasalliklardan xoli ekanini tasdiqlash",
         "Partiyadagi qutilar soni va og'irligini batafsil ko'rsatish",
         "Tovar qaysi davlatda ishlab chiqarilganini rasmiy tasdiqlash",
         "Tovarni tashuvchiga topshirilganini rasmiy qayd etib qo'yish"], c=2,
      e="Kelib chiqish sertifikati tovarning ishlab chiqarilgan mamlakatini tasdiqlaydi — bu boj imtiyozlari va savdo kelishuvlarini qo'llash uchun muhim. Zararkunandadan xolilikni fitosanitariya sertifikati tasdiqlaydi.",
      qe="What is a certificate of origin required for?",
      ae=["To confirm the goods are free of pests and diseases",
          "To show the number and weight of boxes in the batch",
          "To confirm the country where the goods were made",
          "To record officially that goods went to the carrier"],
      ee="A certificate of origin confirms the country where the goods were made — important for applying customs preferences and trade agreements. Freedom from pests is confirmed by a phytosanitary certificate."),
 # 13 — eksport narxi (to'g'ri: C)
 dict(q="EXW narx 50 000, transport 5 000, hujjatlar 2 000, sug'urta 1 000 so'm; distribyutor 25% ustama qo'yadi. Distribyutorning sotish narxi qancha?",
      a=["58 000 so'm", "62 500 so'm", "72 500 so'm", "75 000 so'm"], c=2,
      e="DAP narx = 50 000 + 5 000 + 2 000 + 1 000 = 58 000. Distribyutor narxi = 58 000 × 1,25 = 72 500 so'm.",
      qe="The EXW price is 50,000, transport 5,000, documents 2,000 and insurance 1,000 so'm; the distributor adds a 25% markup. What is the distributor's selling price?",
      ae=["58,000 so'm", "62,500 so'm", "72,500 so'm", "75,000 so'm"],
      ee="DAP price = 50,000 + 5,000 + 2,000 + 1,000 = 58,000. Distributor price = 58,000 × 1.25 = 72,500 so'm."),
 # 14 — valyuta xavfi (to'g'ri: D)
 dict(q="Narx xorijiy valyutada belgilangan, to'lov 60 kundan keyin keladi. Sotuvchi uchun valyuta xavfi nimada?",
      a=["Xaridor to'lovni faqat so'mda qilishga majbur bo'lib qoladi",
         "Bojxona tovarni valyuta sababli qaytarib yuborishi mumkin",
         "Transport narxi endi valyuta kursiga bog'liq bo'lmay qoladi",
         "Kurs o'zgarib, so'mdagi tushum rejadagidan kamayishi mumkin"], c=3,
      e="Shartnoma tuzilgan kundan to'lov kunigacha valyuta kursi o'zgarishi mumkin: kurs sotuvchiga noqulay o'zgarsa, so'mdagi tushum rejadagidan kam bo'ladi.",
      qe="The price is set in a foreign currency and payment comes after 60 days. What is the currency risk for the seller?",
      ae=["The buyer becomes obliged to make the payment in so'm",
          "Customs may send the goods back because of the currency",
          "The transport price stops depending on the currency",
          "The rate may change and the income in so'm may fall"],
      ee="The exchange rate may change between signing the contract and payment: if it moves against the seller, income in so'm will be lower than planned."),
 # 15 — reja xatosi (to'g'ri: B)
 dict(q="Quyidagilardan qaysi biri biznes-rejaning eng jiddiy xatosi hisoblanadi?",
      a=["Rejada xavflar bo'limi alohida ajratilib, batafsil yozilgan",
         "Raqamlar faqat optimistik, farazlar va manbalar yozilmagan",
         "Rezyume bir betdan oshmagan va unda beshta raqam keltirilgan",
         "Bozor hajmi mijozlar soni asosida pastdan yuqoriga hisoblangan"], c=1,
      e="Faqat optimistik va manbasiz raqamlar rejani ishonchsiz qiladi: o'quvchi ularni tekshira olmaydi, egasi esa yomon holatga tayyor bo'lmaydi. Qolgan variantlar — to'g'ri amaliyot.",
      qe="Which of the following is the most serious mistake in a business plan?",
      ae=["The plan has a separate and detailed section on the risks",
         "Figures are all optimistic, without assumptions or sources",
         "The summary is no longer than a page and gives five figures",
         "Market size is estimated bottom-up from customer numbers"],
      ee="Only optimistic, unsourced figures make a plan unreliable: the reader cannot check them and the owner is not prepared for a bad case. The other options are good practice."),
]
