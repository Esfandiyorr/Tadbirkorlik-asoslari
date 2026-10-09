# -*- coding: utf-8 -*-
"""M13 · Biznesda foyda va zarar tahlili — slaydlar va test (yangi_mavzu.py uchun).
T, d, slide — yangi_mavzu.py beradi.  Ishlatish:
  python3 _reyting-manba/yangi_mavzu.py _reyting-manba/matn/mavzu_13_matn.py mavzu-13.html "Biznesda foyda va zarar tahlili" 13
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
 E("span", "M13-mavzu · Amaliy mashg'ulot · 2 soat", "Topic 13 · Practical class · 2 hours", 'class="kicker"') +
 E("h1", "BIZNESDA FOYDA VA ZARAR TAHLILI", "PROFIT AND LOSS ANALYSIS IN A BUSINESS", 'class="grad"') +
 E("p", "Foyda va zarar hisoboti qanday tuziladi · <b>yalpi, operatsion va sof foyda</b> · rentabellik · reja va fakt farqi · qaysi mahsulot pul topadi · foydani oshirishning 5 yo'li.",
   "How a profit and loss statement is built · <b>gross, operating and net profit</b> · profitability · plan versus actual · which product makes money · 5 ways to raise profit.", 'class="lead"') +
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
 E("div", "Maqsad: talaba biznesning oylik <b>foyda va zarar hisobotini</b> tuzishni, uni o'qib, foyda qayerdan kelayotgani va qayerda yo'qolayotganini <b>raqamlar bilan</b> aniqlashni o'rganadi.",
   "Aim: the student learns to build a business's monthly <b>profit and loss statement</b>, to read it and to find <b>with numbers</b> where profit comes from and where it is lost.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("green", "🧾", "Hisobot tuzadi", "Builds the statement", "Tushumdan sof foydagacha bo'lgan zinapoyani to'g'ri tartibda yozadi.", "Writes the ladder from revenue down to net profit in the right order.") +
 card("blue", "📐", "Marjalarni hisoblaydi", "Calculates margins", "Yalpi, operatsion va sof marjani, investitsiya qaytimini topadi.", "Finds gross, operating and net margin and return on investment.") +
 card("violet", "⚖️", "Reja va faktni solishtiradi", "Compares plan and actual", "Farqni hajm, narx va xarajat ta'siriga ajratib tushuntiradi.", "Splits the difference into volume, price and cost effects.") +
 card("orange", "🥇", "Mahsulotlarni baholaydi", "Rates the products", "Qaysi mahsulot eng ko'p hissa qo'shishini va qaysi biri «yeb» qo'yayotganini ko'radi.", "Sees which product contributes most and which one “eats” the profit.") +
 card("pink", "🔧", "Foydani oshiradi", "Raises profit", "Narx, hajm, tannarx va doimiy xarajatning ta'sirini solishtirib, eng kuchli yo'lni tanlaydi.", "Compares the effect of price, volume, cost and overheads and chooses the strongest lever.") +
 card("cyan", "🔗", "Foyda va pulni bog'laydi", "Links profit and cash", "Sof foyda bilan kassadagi pul nega farq qilishini tushuntiradi.", "Explains why net profit and cash in the till differ.") +
 '</div>')

# ============================ 3. REJA ============================
slide("Reja va tushunchalar", "Plan and concepts",
 E("span", "Mashg'ulot rejasi", "Class plan", 'class="kicker"') +
 E("h2", "Bugungi <span class=\"grad\">4 ta blok</span>", "Today's <span class=\"grad\">4 blocks</span>") +
 '<div class="grid g4">' +
 card("green", "1️⃣", "Hisobot", "The statement", "Foyda va zarar hisoboti, uning zinapoyasi, namunaviy oy.", "The P&amp;L statement, its ladder, a sample month.") +
 card("blue", "2️⃣", "Ko'rsatkichlar", "Ratios", "Marjalar, xarajat tuzilmasi, zararsiz tushum, xavfsizlik zaxirasi.", "Margins, cost structure, break-even revenue, margin of safety.") +
 card("violet", "3️⃣", "Tahlil", "Analysis", "Reja va fakt, mahsulotlar bo'yicha foyda, foyda richaglari.", "Plan vs actual, profit by product, profit levers.") +
 card("orange", "4️⃣", "Qaror", "Decisions", "Zarar tashxisi, foyda va pul farqi, oylik nazorat.", "Diagnosing losses, profit vs cash, monthly control.") +
 '</div>' + E("h3", "🔑 Tayanch tushunchalar", "🔑 Key concepts", 'style="margin-top:22px"') +
 E("div",
   '<span class="pill g">foyda va zarar hisoboti</span><span class="pill">tushum</span><span class="pill">sotilgan mahsulot tannarxi</span><span class="pill g">yalpi foyda</span>'
   '<span class="pill">operatsion xarajatlar</span><span class="pill g">operatsion foyda</span><span class="pill g">sof foyda</span><span class="pill">amortizatsiya</span>'
   '<span class="pill g">marja</span><span class="pill">rentabellik</span><span class="pill">ROI</span><span class="pill">zararsiz tushum</span>'
   '<span class="pill">xavfsizlik zaxirasi</span><span class="pill g">reja-fakt tahlili</span><span class="pill">hissa</span><span class="pill">mahsulot aralashmasi</span>'
   '<span class="pill">foyda richagi</span><span class="pill">qoplanish muddati</span>',
   '<span class="pill g">profit and loss statement</span><span class="pill">revenue</span><span class="pill">cost of goods sold</span><span class="pill g">gross profit</span>'
   '<span class="pill">operating expenses</span><span class="pill g">operating profit</span><span class="pill g">net profit</span><span class="pill">depreciation</span>'
   '<span class="pill g">margin</span><span class="pill">profitability</span><span class="pill">ROI</span><span class="pill">break-even revenue</span>'
   '<span class="pill">margin of safety</span><span class="pill g">plan-vs-actual analysis</span><span class="pill">contribution</span><span class="pill">product mix</span>'
   '<span class="pill">profit lever</span><span class="pill">payback period</span>'))

# ============================ 4. HISOBOT NIMA ============================
slide("Foyda va zarar hisoboti nima?", "What is a P&L statement?",
 E("span", "1-blok · Hisobot", "Block 1 · The statement", 'class="kicker"') +
 E("h2", "Biznes <span class=\"grad\">pul ishladimi yoki yo'qotdimi?</span>", "Did the business <span class=\"grad\">make money or lose it?</span>") +
 E("div", "<b>Foyda va zarar hisoboti</b> — ma'lum davr (oy, chorak, yil) uchun <b>tushum</b>dan barcha <b>xarajat</b>larni ayirib, natija — <b>foyda yoki zarar</b>ni ko'rsatadigan jadval.",
   "A <b>profit and loss statement</b> is a table for a period (a month, a quarter, a year) that subtracts all <b>costs</b> from <b>revenue</b> and shows the result — <b>a profit or a loss</b>.", 'class="def"') +
 table([("", ""), ("Foyda va zarar hisoboti", "P&amp;L statement"), ("Pul oqimi rejasi (12-mavzu)", "Cash-flow plan (topic 12)")], [
  [TD("<b>Savoli</b>", "<b>Question</b>"), TD("Biznes foydali ishlayaptimi?", "Is the business profitable?"), TD("To'lovlarga pul yetadimi?", "Is there enough cash for payments?")],
  [TD("<b>Tushum qachon yoziladi</b>", "<b>When revenue is recorded</b>"), TD("Sotuv bo'lgan davrda (nasiya ham)", "In the period of the sale (credit sales too)"), TD("Pul haqiqatan tushganda", "When cash actually arrives")],
  [TD("<b>Uskuna xaridi</b>", "<b>Buying equipment</b>"), TD("Bir martada emas — amortizatsiya orqali bo'lib yoziladi", "Not at once — spread out through depreciation"), TD("To'langan kuni to'liq chiqim", "A full outflow on the day it is paid")],
  [TD("<b>Kredit</b>", "<b>A loan</b>"), TD("Faqat <b>foiz</b> xarajat hisoblanadi", "Only the <b>interest</b> is an expense"), TD("Olinishi kirim, qaytarilishi chiqim", "Receiving it is inflow, repaying it is outflow")]]) +
 '<div class="grid g3" style="margin-top:14px">' +
 card("blue", "🥟", "Bugungi misol", "Today's example", "«Somsa uyi» — kichik somsaxona: go'shtli, kartoshkali, oshqovoqli somsa va choy. Bir oylik natijani tahlil qilamiz.", "“Somsa uyi” — a small somsa bakery: meat, potato and pumpkin somsa and tea. We analyse one month.") +
 card("green", "📅", "Davr", "Period", "Kichik biznesda hisobotni <b>har oy</b> tuzing — muammo 1 oyda ko'rinadi, yil oxirida emas.", "In a small business build the statement <b>every month</b> — problems show up in a month, not at year-end.") +
 card("orange", "🧭", "Maqsad", "Purpose", "Hisobot — o'tmish tarixi emas, <b>keyingi oy qarori</b> uchun asbob.", "The statement is not history — it is a tool for <b>next month's decisions</b>.") + '</div>' +
 E("small", "«Somsa uyi» — o'quv uchun to'qib chiqarilgan shartli misol; raqamlar haqiqiy biznesdan olinmagan.", "“Somsa uyi” is a made-up teaching example; the figures are not from a real business.", 'class="note"'))

# ============================ 5. ZINAPOYA ============================
slide("Hisobot zinapoyasi", "The statement ladder",
 E("span", "1.2 · Tuzilma", "1.2 · Structure", 'class="kicker"') +
 E("h2", "Tushumdan sof foydagacha: <span class=\"grad\">5 pog'ona</span>", "From revenue to net profit: <span class=\"grad\">5 steps</span>") +
 '<div class="chain">' +
 '<div class="link l1">' + E("h3", "1. Tushum", "1. Revenue") + E("p", "Davr davomida sotilgan barcha mahsulot va xizmat qiymati.", "The value of all goods and services sold in the period.") + '</div>' +
 '<div class="link l2">' + E("h3", "− Sotilgan mahsulot tannarxi", "− Cost of goods sold") + E("p", "Faqat sotilgan mahsulotga ketgan xomashyo va to'g'ridan-to'g'ri xarajat.", "Raw materials and direct costs of the goods actually sold.") + '</div>' +
 '<div class="link l3">' + E("h3", "= 2. Yalpi foyda", "= 2. Gross profit") + E("p", "Mahsulotning o'zi qancha pul topadi.", "How much the product itself earns.") + '</div></div>' +
 '<div class="chain" style="margin-top:10px">' +
 '<div class="link l4">' + E("h3", "− Operatsion xarajatlar", "− Operating expenses") + E("p", "Ish haqi, ijara, kommunal, reklama, amortizatsiya.", "Wages, rent, utilities, advertising, depreciation.") + '</div>' +
 '<div class="link l3">' + E("h3", "= 3. Operatsion foyda", "= 3. Operating profit") + E("p", "Biznes modeli ishlayaptimi — asosiy ko'rsatkich.", "Is the business model working — the key figure.") + '</div>' +
 '<div class="link l2">' + E("h3", "− Foiz = 4. Soliqdan oldingi", "− Interest = 4. Pre-tax") + E("p", "Kredit foizi ayriladi.", "Loan interest is subtracted.") + '</div>' +
 '<div class="link l1">' + E("h3", "− Soliq = 5. Sof foyda", "− Tax = 5. Net profit") + E("p", "Egasiga va rivojlanishga qoladigan pul.", "The money left for the owner and for growth.") + '</div></div>' +
 '<div class="grid g2" style="margin-top:14px">' +
 card("blue", "🧠", "Nega pog'onalab?", "Why step by step?", "Har pog'ona boshqa savolga javob beradi: yalpi foyda — <b>mahsulot va narx</b>, operatsion foyda — <b>boshqaruv</b>, sof foyda — <b>moliyalashtirish va soliq</b>.",
      "Each step answers a different question: gross profit — <b>product and price</b>, operating profit — <b>management</b>, net profit — <b>financing and tax</b>.") +
 card("orange", "🧾", "Amortizatsiya", "Depreciation", "Uskuna narxi u ishlaydigan yillarga bo'lib xarajatga yoziladi. Masalan, 30 mln so'mlik pech 5 yil ishlasa: 30 ÷ 60 oy = <b>500 000 so'm/oy</b>.",
      "Equipment cost is spread over the years it works. For example, a 30-million-so'm oven working 5 years: 30 ÷ 60 months = <b>500,000 so'm/month</b>.") + '</div>')

# ============================ 6. NAMUNAVIY OY ============================
slide("«Somsa uyi»: bir oylik hisobot", "“Somsa uyi”: one month's statement",
 E("span", "1.3 · Namuna", "1.3 · Sample", 'class="kicker"') +
 E("h2", "«Somsa uyi»: <span class=\"grad\">oktyabr oyi hisoboti</span>", "“Somsa uyi”: <span class=\"grad\">the October statement</span>") +
 '<div class="grid g2"><div style="min-width:0">' +
 table([("Modda", "Item"), ("So'm", "So'm"), ("Tushumga nisbatan", "Share of revenue")], [
  [TD("<b>Tushum</b> (6 000 somsa + 3 000 choy)", "<b>Revenue</b> (6,000 somsa + 3,000 teas)"), TD("<b>40 000 000</b>", "<b>40,000,000</b>"), TD("100%", "100%")],
  [TD("− Sotilgan mahsulot tannarxi (go'sht, un, piyoz, choy)", "− Cost of goods sold (meat, flour, onion, tea)"), TD("16 000 000", "16,000,000"), TD("40%", "40%")],
  [TD("<b>= Yalpi foyda</b>", "<b>= Gross profit</b>"), TD("<b>24 000 000</b>", "<b>24,000,000</b>", "g"), TD("<b>60%</b>", "<b>60%</b>", "g")],
  [TD("− Ish haqi (5 kishi)", "− Wages (5 people)"), TD("9 000 000", "9,000,000"), TD("22,5%", "22.5%")],
  [TD("− Ijara", "− Rent"), TD("4 000 000", "4,000,000"), TD("10%", "10%")],
  [TD("− Kommunal (gaz, elektr, suv)", "− Utilities (gas, power, water)"), TD("2 500 000", "2,500,000"), TD("6,25%", "6.25%")],
  [TD("− Reklama", "− Advertising"), TD("1 000 000", "1,000,000"), TD("2,5%", "2.5%")],
  [TD("− Amortizatsiya va boshqa", "− Depreciation and other"), TD("1 500 000", "1,500,000"), TD("3,75%", "3.75%")],
  [TD("<b>= Operatsion foyda</b>", "<b>= Operating profit</b>"), TD("<b>6 000 000</b>", "<b>6,000,000</b>", "g"), TD("<b>15%</b>", "<b>15%</b>")],
  [TD("− Kredit foizi", "− Loan interest"), TD("500 000", "500,000"), TD("1,25%", "1.25%")],
  [TD("− Soliq (shartli)", "− Tax (sample)"), TD("1 600 000", "1,600,000"), TD("4%", "4%")],
  [TD("<b>= Sof foyda</b>", "<b>= Net profit</b>"), TD("<b>3 900 000</b>", "<b>3,900,000</b>", "g"), TD("<b>9,75%</b>", "<b>9.75%</b>", "g")]]) + '</div>' +
 '<div style="min-width:0">' +
 card_ul("blue", "🔎", "Hisobotni qanday o'qish kerak?", "How to read the statement", [
  ("Har <b>100 so'm</b> tushumdan: 40 so'm xomashyoga, 45 so'm ish haqi va boshqa operatsion xarajatlarga, 5,25 so'm foiz va soliqqa ketadi, <b>9,75 so'm</b> foyda qoladi.", "From every <b>100 so'm</b> of revenue: 40 goes on raw materials, 45 on wages and other operating costs, 5.25 on interest and tax, and <b>9.75</b> remains as profit."),
  ("Eng katta xarajat — <b>xomashyo</b>, keyin <b>ish haqi</b>. Foydani oshirish yo'li ham avvalo shu yerda.", "The largest costs are <b>raw materials</b>, then <b>wages</b>. The way to raise profit starts there too."),
  ("Foiz va soliq oldidan biznes 15% operatsion foyda bilan ishlaydi — model sog'lom.", "Before interest and tax the business runs at a 15% operating profit — the model is healthy.")], "tick") +
 E("small", "Soliq turi va stavkasi biznes shakli va soliq rejimiga bog'liq. Misoldagi 4% — faqat shartli raqam; o'z holatingiz uchun soliq xizmati yoki buxgalterdan aniqlang.",
   "The type and rate of tax depend on the business form and tax regime. The 4% in the example is a sample figure only; confirm yours with the tax service or an accountant.", 'class="note"') + '</div></div>')

# ============================ 7. RENTABELLIK ============================
slide("Rentabellik ko'rsatkichlari", "Profitability ratios",
 E("span", "2-blok · Ko'rsatkichlar", "Block 2 · Ratios", 'class="kicker"') +
 E("h2", "Foydani <span class=\"grad\">foizda</span> o'lchang", "Measure profit <span class=\"grad\">in percentages</span>") +
 E("div", "Mutlaq summa (3,9 mln) bir oyni boshqasi bilan yoki boshqa biznes bilan solishtirishga yetmaydi. <b>Marja</b> — tushumning necha foizi foyda bo'lib qolganini ko'rsatadi.",
   "An absolute figure (3.9 million) is not enough to compare months or businesses. A <b>margin</b> shows what percentage of revenue remains as profit.", 'class="def"') +
 '<div class="grid g4" style="margin-top:14px">' +
 stat("60%", "yalpi marja = 24 ÷ 40", "gross margin = 24 ÷ 40") +
 stat("15%", "operatsion marja = 6 ÷ 40", "operating margin = 6 ÷ 40", "o") +
 stat("9,75%", "sof marja = 3,9 ÷ 40", "net margin = 3.9 ÷ 40", "v") +
 stat("≈ 20,5 oy", "qoplanish = 80 ÷ 3,9", "payback = 80 ÷ 3.9") + '</div>' +
 table([("Ko'rsatkich", "Ratio"), ("Formula", "Formula"), ("Nimani ko'rsatadi", "What it shows")], [
  [TD("<b>Yalpi marja</b>", "<b>Gross margin</b>"), TD("yalpi foyda ÷ tushum × 100", "gross profit ÷ revenue × 100"), TD("Narx va xomashyo nisbati to'g'rimi", "Whether price and raw-material cost are in balance")],
  [TD("<b>Operatsion marja</b>", "<b>Operating margin</b>"), TD("operatsion foyda ÷ tushum × 100", "operating profit ÷ revenue × 100"), TD("Biznes qanchalik samarali boshqarilmoqda", "How efficiently the business is run")],
  [TD("<b>Sof marja</b>", "<b>Net margin</b>"), TD("sof foyda ÷ tushum × 100", "net profit ÷ revenue × 100"), TD("Har 100 so'm tushumdan egasiga qancha qoladi", "How much of every 100 so'm reaches the owner")],
  [TD("<b>Investitsiya qaytimi (yillik ROI)</b>", "<b>Return on investment (annual ROI)</b>"), TD("yillik sof foyda ÷ investitsiya × 100", "annual net profit ÷ investment × 100"), TD("3,9 × 12 ÷ 80 ≈ <b>58,5%</b> — kiritilgan pul qanchalik yaxshi ishlaydi", "3.9 × 12 ÷ 80 ≈ <b>58.5%</b> — how well the invested money works", "g")]]) +
 E("small", "Boshlang'ich investitsiya (pech, muzlatgich, ta'mir, mebel) — 80 mln so'm deb olingan. Marjalarni boshqa soha bilan emas, <b>o'z sohangizdagi</b> o'xshash biznes va o'z oldingi oylaringiz bilan solishtiring.",
   "The starting investment (oven, freezer, repairs, furniture) is assumed to be 80 million so'm. Compare margins not with other industries but with similar businesses <b>in your own field</b> and with your previous months.", 'class="note"'))

# ============================ 8. ZARARSIZ TUSHUM ============================
slide("Zararsiz tushum va xavfsizlik zaxirasi", "Break-even revenue and margin of safety",
 E("span", "2.2 · Chegara", "2.2 · The threshold", 'class="kicker"') +
 E("h2", "Qancha sotsak, <span class=\"grad\">zarar ko'rmaymiz?</span>", "How much must we sell <span class=\"grad\">to avoid a loss?</span>") +
 E("div", "Mahsulot ko'p bo'lsa, zararsiz nuqtani donada emas, <b>so'mda</b> hisoblash qulay: <b>zararsiz tushum = doimiy xarajatlar ÷ yalpi marja</b>.",
   "With many products it is easier to calculate break-even in <b>so'm</b> rather than units: <b>break-even revenue = fixed costs ÷ gross margin</b>.", 'class="def"') +
 '<div class="grid g3" style="margin-top:14px">' +
 '<div class="card" style="--c:var(--blue)">' + E("h3", "1. Doimiy xarajatlar", "1. Fixed costs") +
 table(None, [[TD("Operatsion xarajatlar", "Operating expenses"), TD("18 000 000", "18,000,000")], [TD("Kredit foizi", "Loan interest"), TD("500 000", "500,000")],
  [TD("<b>Jami</b>", "<b>Total</b>"), TD("<b>18 500 000</b>", "<b>18,500,000</b>")]]) + '</div>' +
 '<div class="card" style="--c:var(--violet)">' + E("h3", "2. Zararsiz tushum", "2. Break-even revenue") +
 E("p", "18 500 000 ÷ 0,60 ≈ <b>30 800 000 so'm</b>", "18,500,000 ÷ 0.60 ≈ <b>30,800,000 so'm</b>", 'style="font-size:17px"') +
 E("p", "Oyiga shundan kam sotilsa — zarar.", "Selling less than this in a month means a loss.") + '</div>' +
 '<div class="card" style="--c:var(--green)">' + E("h3", "3. Xavfsizlik zaxirasi", "3. Margin of safety") +
 E("p", "(40,0 − 30,8) ÷ 40,0 ≈ <b>23%</b>", "(40.0 − 30.8) ÷ 40.0 ≈ <b>23%</b>", 'style="font-size:17px"') +
 E("p", "Sotuv 23% gacha tushsa ham zarar yo'q.", "Sales can fall by up to 23% without a loss.") + '</div></div>' +
 '<div class="grid g2" style="margin-top:14px">' +
 card("orange", "📏", "Zaxira qancha bo'lishi kerak?", "How big should the margin be?", "Taxminiy mo'ljal: <b>20% dan past</b> — xavfli (bir yomon oy zararga olib chiqadi), <b>20–40%</b> — me'yorda, <b>40% dan yuqori</b> — barqaror.",
      "A rough guide: <b>below 20%</b> is risky (one bad month means a loss), <b>20–40%</b> is normal, <b>above 40%</b> is stable.") +
 card("red", "🧾", "Soliq tushumga bog'liq bo'lsa", "If tax depends on revenue", "Aylanmadan olinadigan soliq (shartli 4%) har bir sotuvdan ketadi, ya'ni marjani kamaytiradi: 18,5 ÷ (0,60 − 0,04) ≈ <b>33 mln</b>. Zaxira 17% ga tushadi.",
      "A tax on turnover (4% in the sample) is taken from every sale, so it lowers the margin: 18.5 ÷ (0.60 − 0.04) ≈ <b>33 million</b>. The margin of safety falls to 17%.") + '</div>')

# ============================ 9. REJA VA FAKT ============================
slide("Reja va fakt tahlili", "Plan vs actual analysis",
 E("span", "3-blok · Tahlil", "Block 3 · Analysis", 'class="kicker"') +
 E("h2", "Noyabr: foyda <span class=\"grad\">6 mln dan 2 mln ga</span> tushdi. Nega?", "November: profit <span class=\"grad\">fell from 6 to 2 million</span>. Why?") +
 table([("Modda (ming so'm)", "Item (thousand so'm)"), ("Reja", "Plan"), ("Fakt", "Actual"), ("Farq", "Difference")], [
  [TD("<b>Tushum</b>", "<b>Revenue</b>"), TD("40 000", "40,000"), TD("36 000", "36,000"), TD("−4 000 (−10%)", "−4,000 (−10%)", "r")],
  [TD("Sotilgan mahsulot tannarxi", "Cost of goods sold"), TD("16 000 (40%)", "16,000 (40%)"), TD("15 800 (43,9%)", "15,800 (43.9%)", "r"), TD("−200", "−200")],
  [TD("<b>Yalpi foyda</b>", "<b>Gross profit</b>"), TD("24 000 (60%)", "24,000 (60%)"), TD("20 200 (56,1%)", "20,200 (56.1%)"), TD("−3 800", "−3,800", "r")],
  [TD("Operatsion xarajatlar", "Operating expenses"), TD("18 000", "18,000"), TD("18 200", "18,200"), TD("+200", "+200", "r")],
  [TD("<b>Operatsion foyda</b>", "<b>Operating profit</b>"), TD("<b>6 000</b>", "<b>6,000</b>"), TD("<b>2 000</b>", "<b>2,000</b>", "r"), TD("<b>−4 000</b>", "<b>−4,000</b>", "r")]]) +
 E("h3", "4 000 ming so'mlik farqning sabablari", "The causes of the 4,000-thousand difference", 'style="margin-top:14px"') +
 '<div class="grid g3">' +
 card("orange", "📉", "Hajm ta'siri: −2 400", "Volume effect: −2,400", "Sotuv 4 000 ga kam. Har bir so'm sotuv 60 tiyin yalpi foyda berardi: 4 000 × 60% = <b>2 400</b>. Sabab: yangi raqobatchi ochildi.",
      "Sales were 4,000 lower. Every so'm of sales gave 60 tiyin of gross profit: 4,000 × 60% = <b>2,400</b>. Cause: a new competitor opened.") +
 card("red", "🥩", "Xomashyo ta'siri: −1 400", "Raw-material effect: −1,400", "Ulush 40% qolganda tannarx 36 000 × 40% = 14 400 bo'lardi; fakt 15 800. Farq <b>1 400</b> — go'sht narxi oshgan va isrof ko'paygan.",
      "At a 40% share the cost would have been 36,000 × 40% = 14,400; it was 15,800. The <b>1,400</b> gap is from dearer meat and more waste.") +
 card("violet", "🏢", "Xarajat ta'siri: −200", "Expense effect: −200", "Gaz hisobi qishda oshgan. Kichik, lekin kuzatib borish kerak.", "The gas bill rose in winter. Small, but worth watching.") + '</div>' +
 E("div", "🧠 <b>Tekshiruv:</b> 2 400 + 1 400 + 200 = <b>4 000</b>. Endi chora aniq: raqobatchiga javob (sifat, xizmat, yangi taklif) va go'sht xaridi hamda isrofni nazorat qilish.",
   "🧠 <b>Check:</b> 2,400 + 1,400 + 200 = <b>4,000</b>. Now the action is clear: respond to the competitor (quality, service, a new offer) and control meat purchasing and waste.", 'class="quote" style="margin-top:12px"'))

# ============================ 10. MAHSULOTLAR BO'YICHA ============================
slide("Mahsulotlar bo'yicha foyda", "Profit by product",
 E("span", "3.2 · Mahsulot aralashmasi", "3.2 · Product mix", 'class="kicker"') +
 E("h2", "Qaysi mahsulot <span class=\"grad\">haqiqatan pul topadi?</span>", "Which product <span class=\"grad\">really makes the money?</span>") +
 table([("Mahsulot", "Product"), ("Narx", "Price"), ("Tannarx", "Cost"), ("Hissa (1 dona)", "Contribution (1 unit)"), ("Marja", "Margin"), ("Sotuv", "Sold"), ("Jami hissa", "Total contribution"), ("Ulushi", "Share")], [
  [TD("<b>Go'shtli somsa</b>", "<b>Meat somsa</b>"), TD("7 000", "7,000"), TD("3 500", "3,500"), TD("3 500", "3,500"), TD("50%", "50%"), TD("3 000", "3,000"), TD("<b>10 500 000</b>", "<b>10,500,000</b>", "g"), TD("44%", "44%")],
  [TD("<b>Kartoshkali somsa</b>", "<b>Potato somsa</b>"), TD("4 000", "4,000"), TD("1 400", "1,400"), TD("2 600", "2,600"), TD("65%", "65%"), TD("2 000", "2,000"), TD("5 200 000", "5,200,000"), TD("22%", "22%")],
  [TD("<b>Oshqovoqli somsa</b>", "<b>Pumpkin somsa</b>"), TD("5 000", "5,000"), TD("1 800", "1,800"), TD("3 200", "3,200"), TD("64%", "64%"), TD("1 000", "1,000"), TD("3 200 000", "3,200,000"), TD("13%", "13%")],
  [TD("<b>Choy va ichimlik</b>", "<b>Tea and drinks</b>"), TD("2 000", "2,000"), TD("300", "300"), TD("1 700", "1,700"), TD("<b>85%</b>", "<b>85%</b>", "g"), TD("3 000", "3,000"), TD("5 100 000", "5,100,000"), TD("21%", "21%")],
  [TD("<b>Jami</b>", "<b>Total</b>"), TD("", ""), TD("", ""), TD("", ""), TD("60%", "60%"), TD("", ""), TD("<b>24 000 000</b>", "<b>24,000,000</b>"), TD("100%", "100%")]]) +
 '<div class="grid g3" style="margin-top:14px">' +
 card("green", "🥩", "Asosiy «dvigatel»", "The main “engine”", "Go'shtli somsa marjasi eng past (50%), lekin <b>jami hissaning 44%</b>ini beradi. Uning sifati va go'sht narxi — eng muhim nazorat nuqtasi.",
      "Meat somsa has the lowest margin (50%) but gives <b>44% of total contribution</b>. Its quality and the price of meat are the key control point.") +
 card("blue", "🍵", "Yashirin imkoniyat", "A hidden opportunity", "Choy marjasi 85%. Har somsa xaridoriga choy taklif qilinsa va 1 000 ta qo'shimcha sotilsa: <b>+1 700 000 so'm</b> hissa.",
      "Tea has an 85% margin. If tea is offered to every somsa buyer and 1,000 more are sold: <b>+1,700,000 so'm</b> contribution.") +
 card("orange", "⚠️", "Marja ≠ hissa", "Margin ≠ contribution", "Yuqori foizli, lekin kam sotiladigan mahsulot kam pul keltiradi. Qarorni <b>foiz × hajm</b> bo'yicha qabul qiling.",
      "A high-percentage product that sells little brings little money. Decide on <b>percentage × volume</b>.") + '</div>')

# ============================ 11. FOYDA RICHAGLARI ============================
slide("Foydani oshirishning 5 yo'li", "5 ways to raise profit",
 E("span", "3.3 · Richaglar", "3.3 · Levers", 'class="kicker"') +
 E("h2", "5% o'zgarish — <span class=\"grad\">foydaga qancha ta'sir qiladi?</span>", "A 5% change — <span class=\"grad\">how much does it move profit?</span>") +
 E("div", "Asosiy holat: tushum 40 mln, tannarx 16 mln, operatsion xarajat 18 mln, <b>operatsion foyda 6 mln</b>. Har bir richagni alohida 5% ga o'zgartiramiz (qolganlari o'zgarmaydi).",
   "Base case: revenue 40 million, cost of goods 16 million, operating expenses 18 million, <b>operating profit 6 million</b>. We move each lever by 5% on its own (the rest stays the same).", 'class="def"') +
 table([("Richag", "Lever"), ("Hisob", "Calculation"), ("Operatsion foyda o'zgarishi", "Change in operating profit"), ("Foiz", "Percent")], [
  [TD("<b>1. Narx +5%</b> (sotuv hajmi o'zgarmasa)", "<b>1. Price +5%</b> (if volume holds)"), TD("40 mln × 5%", "40 million × 5%"), TD("<b>+2 000 000</b>", "<b>+2,000,000</b>", "g"), TD("<b>+33%</b>", "<b>+33%</b>", "g")],
  [TD("<b>2. Sotuv hajmi +5%</b>", "<b>2. Sales volume +5%</b>"), TD("24 mln yalpi foyda × 5%", "24 million gross profit × 5%"), TD("+1 200 000", "+1,200,000"), TD("+20%", "+20%")],
  [TD("<b>3. Doimiy xarajat −5%</b>", "<b>3. Fixed costs −5%</b>"), TD("18 mln × 5%", "18 million × 5%"), TD("+900 000", "+900,000"), TD("+15%", "+15%")],
  [TD("<b>4. Xomashyo tannarxi −5%</b>", "<b>4. Raw-material cost −5%</b>"), TD("16 mln × 5%", "16 million × 5%"), TD("+800 000", "+800,000"), TD("+13%", "+13%")],
  [TD("<b>5. Mahsulot aralashmasi</b>", "<b>5. Product mix</b>"), TD("+1 000 choy (hissa 1 700)", "+1,000 teas (1,700 contribution)"), TD("+1 700 000", "+1,700,000"), TD("+28%", "+28%")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("green", "🧠", "Xulosa", "Conclusion", "Narx — eng kuchli richag, lekin eng xavflisi ham: mijoz ketsa, foyda kamayadi (11-mavzu). Ko'pincha <b>bir nechta kichik o'zgarish</b> birgalikda eng yaxshi natija beradi.",
      "Price is the strongest lever but also the riskiest: if customers leave, profit falls (topic 11). Often <b>several small changes</b> together give the best result.") +
 card("blue", "🛠", "«Somsa uyi» rejasi", "“Somsa uyi” plan", "Choyni har xaridga taklif qilish · go'shtni 2 yetkazib beruvchidan solishtirib olish · isrofni kunlik yozish · kechqurun qolgan somsaga 30% chegirma (isrofdan yaxshi).",
      "Offer tea with every purchase · compare meat from 2 suppliers · record waste daily · 30% off leftover somsa in the evening (better than waste).") + '</div>')

# ============================ 12. ZARAR TASHXISI ============================
slide("Zarar tashxisi", "Diagnosing losses",
 E("span", "4-blok · Qaror", "Block 4 · Decisions", 'class="kicker"') +
 E("h2", "Zarar belgisi qayerda — <span class=\"grad\">sababi o'sha yerda</span>", "Where the symptom is, <span class=\"grad\">the cause is there too</span>") +
 table([("Belgi", "Symptom"), ("Ehtimoliy sabab", "Possible cause"), ("Nimani tekshirish kerak", "What to check")], [
  [TD("<b>Tushum kamaydi</b>", "<b>Revenue fell</b>"), TD("Mijoz kamaydi, raqobatchi, mavsum, sifat pasaygan", "Fewer customers, a competitor, the season, lower quality"), TD("Kunlik mijozlar soni, o'rtacha chek, mijoz fikri", "Daily customer count, average order, feedback")],
  [TD("<b>Yalpi marja tushdi</b>", "<b>Gross margin fell</b>"), TD("Xomashyo qimmatlashdi, isrof, o'g'irlik, chegirma ko'p", "Dearer raw materials, waste, theft, too many discounts"), TD("Xarid narxlari, retsept me'yori, isrof daftari", "Purchase prices, recipe norms, the waste log")],
  [TD("<b>Operatsion xarajat o'sdi</b>", "<b>Operating costs rose</b>"), TD("Ortiqcha xodim, ijara, kommunal, nazoratsiz xarajat", "Too many staff, rent, utilities, uncontrolled spending"), TD("Har bir modda tushumning necha foizi", "Each item as a percentage of revenue")],
  [TD("<b>Foyda bor, pul yo'q</b>", "<b>Profit but no cash</b>"), TD("Nasiya, zaxira ko'paygan, kredit qaytarilgan", "Credit sales, more stock, loan repayments"), TD("Pul oqimi rejasi (12-mavzu)", "The cash-flow plan (topic 12)")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 '<div class="card" style="--c:var(--orange)">' + E("h3", "🎃 «Zarar ko'rsatayotgan» mahsulotni darhol yopmang", "🎃 Do not close a “loss-making” product at once") +
 E("p", "Faraz qilaylik, oshqovoqli somsaga doimiy xarajatdan 3,5 mln so'm «ulush» yozildi: 3,2 − 3,5 = <b>−0,3 mln</b> — go'yo zarar.", "Suppose 3.5 million so'm of fixed costs is “allocated” to pumpkin somsa: 3.2 − 3.5 = <b>−0.3 million</b> — apparently a loss.") +
 E("p", "Lekin uni to'xtatsangiz, ijara va ish haqi kamaymaydi — biznes <b>3,2 mln hissani yo'qotadi</b> va umumiy foyda 3,9 dan 0,7 mln ga tushadi. Hissa musbat bo'lsa, mahsulot doimiy xarajatni qoplashga yordam beryapti.",
   "But if you stop it, rent and wages do not fall — the business <b>loses 3.2 million of contribution</b> and total profit drops from 3.9 to 0.7 million. If contribution is positive, the product is helping to cover fixed costs.", 'style="margin-top:6px"') + '</div>' +
 card_ul("green", "✅", "Zarar bo'lsa, harakat tartibi", "Order of action when there is a loss", [
  ("Hisobotni <b>pog'onama-pog'ona</b> o'qing: qaysi pog'onada farq paydo bo'ldi?", "Read the statement <b>step by step</b>: at which step did the gap appear?"),
  ("Farqni <b>hajm, narx va xarajat</b> ta'siriga ajrating.", "Split the gap into <b>volume, price and cost</b> effects."),
  ("Eng katta ta'sir uchun <b>bitta aniq chora</b> va muddat belgilang.", "Set <b>one clear action</b> and a deadline for the biggest effect."),
  ("Keyingi oy natijani tekshiring.", "Check the result next month.")], "tick") + '</div>')

# ============================ 13. FOYDA VA PUL ============================
slide("Foyda va pul o'rtasidagi ko'prik", "The bridge between profit and cash",
 E("span", "4.2 · Ko'prik", "4.2 · The bridge", 'class="kicker"') +
 E("h2", "Sof foyda 3,9 mln, kassa esa <span class=\"grad\">atigi 1,6 mln ga</span> oshdi", "Net profit is 3.9 million, but cash rose <span class=\"grad\">by only 1.6 million</span>") +
 E("div", "Foyda — hisob natijasi, pul — haqiqiy harakat. Ularni bog'laydigan «ko'prik» qaysi summalar foydada bor, lekin kassada yo'qligini (yoki aksincha) ko'rsatadi.",
   "Profit is an accounting result; cash is real movement. The “bridge” between them shows which sums are in profit but not in the till (or the other way round).", 'class="def"') +
 table([("Qadam", "Step"), ("So'm", "So'm"), ("Izoh", "Note")], [
  [TD("<b>Sof foyda</b>", "<b>Net profit</b>"), TD("3 900 000", "3,900,000"), TD("Foyda va zarar hisobotidan", "From the P&amp;L statement")],
  [TD("+ Amortizatsiya", "+ Depreciation"), TD("+500 000", "+500,000", "g"), TD("Xarajat yozilgan, lekin pul chiqmagan", "Recorded as a cost, but no cash left")],
  [TD("− Debitor qarz o'sdi", "− Receivables grew"), TD("−1 000 000", "−1,000,000", "r"), TD("Kafelarga nasiyaga somsa berildi", "Somsa supplied to cafés on credit")],
  [TD("− Zaxira ko'paydi", "− Stock increased"), TD("−800 000", "−800,000", "r"), TD("Arzon paytda go'sht ko'proq olinib, muzlatildi", "Extra meat bought cheaply and frozen")],
  [TD("− Kredit asosiy qarzi qaytarildi", "− Loan principal repaid"), TD("−1 000 000", "−1,000,000", "r"), TD("Xarajat emas, lekin pul chiqadi", "Not an expense, but cash goes out")],
  [TD("<b>= Kassadagi pul o'zgarishi</b>", "<b>= Change in cash</b>"), TD("<b>+1 600 000</b>", "<b>+1,600,000</b>"), TD("12-mavzudagi pul oqimi bilan mos keladi", "Matches the cash flow in topic 12")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("blue", "🔗", "Ikki hisobot — bir biznes", "Two reports — one business", "Foyda va zarar hisoboti <b>biznes foydalimi</b>, pul oqimi esa <b>to'lovga pul bormi</b> degan savolga javob beradi. Ikkalasini ham har oy ko'ring.",
      "The P&amp;L answers <b>is the business profitable</b>; the cash flow answers <b>is there money to pay</b>. Look at both every month.") +
 card("orange", "⚠️", "Ogohlantirish belgisi", "A warning sign", "Foyda bir necha oy ketma-ket kassa o'sishidan ancha katta bo'lsa — nasiya va zaxira nazoratdan chiqmoqda.",
      "If profit is much larger than the cash increase for several months in a row, credit sales and stock are getting out of control.") + '</div>')

# ============================ 14. KO'RSATKICHLAR PANELI ============================
slide("Oylik nazorat paneli", "A monthly control panel",
 E("span", "4.3 · Nazorat", "4.3 · Control", 'class="kicker"') +
 E("h2", "Har oy <span class=\"grad\">8 ta raqamni</span> tekshiring", "Check <span class=\"grad\">8 numbers</span> every month") +
 table([("Ko'rsatkich", "Indicator"), ("«Somsa uyi» maqsadi", "“Somsa uyi” target"), ("Oktyabr", "October"), ("Noyabr", "November"), ("Holat", "Status")], [
  [TD("Tushum", "Revenue"), TD("≥ 40 mln", "≥ 40 million"), TD("40,0", "40.0"), TD("36,0", "36.0"), TD("🔴", "🔴")],
  [TD("Yalpi marja", "Gross margin"), TD("≥ 58%", "≥ 58%"), TD("60%", "60%"), TD("56,1%", "56.1%"), TD("🔴", "🔴")],
  [TD("Ish haqi ulushi", "Wages share"), TD("≤ 25%", "≤ 25%"), TD("22,5%", "22.5%"), TD("25%", "25%"), TD("🟡", "🟡")],
  [TD("Operatsion xarajat ulushi", "Operating cost share"), TD("≤ 46%", "≤ 46%"), TD("45%", "45%"), TD("50,6%", "50.6%"), TD("🔴", "🔴")],
  [TD("Operatsion marja", "Operating margin"), TD("≥ 12%", "≥ 12%"), TD("15%", "15%"), TD("5,6%", "5.6%"), TD("🔴", "🔴")],
  [TD("Xavfsizlik zaxirasi", "Margin of safety"), TD("≥ 20%", "≥ 20%"), TD("23%", "23%"), TD("7%", "7%"), TD("🔴", "🔴")],
  [TD("Isrof (tannarxdan)", "Waste (of cost)"), TD("≤ 3%", "≤ 3%"), TD("2,5%", "2.5%"), TD("5%", "5%"), TD("🔴", "🔴")],
  [TD("O'rtacha chek", "Average order"), TD("≥ 13 000", "≥ 13,000"), TD("13 300", "13,300"), TD("13 100", "13,100"), TD("🟢", "🟢")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card_ul("green", "📅", "Oylik tartib (1 soat)", "A monthly routine (1 hour)", [
  ("Oyning <b>3-sanasigacha</b>: hisobotni yopish (tushum, xarid, xarajatlar).", "By the <b>3rd of the month</b>: close the statement (revenue, purchases, expenses)."),
  ("Panelni to'ldirish va 🔴 belgilarni topish.", "Fill in the panel and find the 🔴 marks."),
  ("Har 🔴 uchun sabab va <b>bitta chora</b>.", "For each 🔴, a cause and <b>one action</b>."),
  ("Keyingi oy rejasini yangilash.", "Update next month's plan.")], "clean") +
 card("orange", "📜", "Rasmiy hisobot ham bor", "There is official reporting too", "Bu panel — boshqaruv uchun. Soliq va statistika hisobotlari alohida, belgilangan shakl va muddatda topshiriladi. Talablarni soliq xizmati va buxgalter bilan aniqlang.",
      "This panel is for management. Tax and statistical reports are separate, in set forms and by set deadlines. Confirm the requirements with the tax service and an accountant.") + '</div>')

# ============================ 15. AMALIY KEYS ============================
slide("Amaliy keys: qaror qabul qiling", "Case: make a decision",
 E("span", "4.4 · Keys", "4.4 · Case", 'class="kicker"') +
 E("h2", "«Somsa uyi» egasining <span class=\"grad\">3 ta taklifi</span>", "The “Somsa uyi” owner's <span class=\"grad\">3 proposals</span>") +
 E("div", "Noyabrda foyda 2 mln ga tushdi. Egasining oldida 3 ta variant bor. Har birini hisob bilan baholang (ming so'mda, bir oy uchun).",
   "In November profit fell to 2 million. The owner has 3 options. Evaluate each with a calculation (thousand so'm, per month).", 'class="def"') +
 '<div class="grid g3" style="margin-top:14px">' +
 '<div class="card" style="--c:var(--red)">' + E("h3", "A. Barcha narxni 15% tushirish", "A. Cut all prices by 15%") +
 E("p", "Maqsad — raqobatchidan mijozlarni qaytarish.", "Goal: win customers back from the competitor.") +
 E("p", "Tushum 36 000 × 0,85 = 30 600 bo'ladi, tannarx o'zgarmaydi (15 800). Yalpi foyda 14 800, operatsion foyda <b>−3 400</b>. Avvalgi foydaga (2 000) qaytish uchun sotuv taxminan +36% oshishi kerak.",
   "Revenue becomes 36,000 × 0.85 = 30,600 while cost stays 15,800. Gross profit 14,800, operating profit <b>−3,400</b>. Getting back to the old profit (2,000) would need about +36% more sales.", 'style="margin-top:6px"') + '</div>' +
 '<div class="card" style="--c:var(--orange)">' + E("h3", "B. Bitta xodimni qisqartirish", "B. Cut one employee") +
 E("p", "Ish haqi 1 800 ga kamayadi.", "Wages fall by 1,800.") +
 E("p", "Operatsion foyda 2 000 + 1 800 = <b>3 800</b>. Lekin navbat uzayadi, xizmat sekinlashadi — mijozlar yana kamayishi mumkin.",
   "Operating profit 2,000 + 1,800 = <b>3,800</b>. But queues grow and service slows — customers may fall further.", 'style="margin-top:6px"') + '</div>' +
 '<div class="card" style="--c:var(--green)">' + E("h3", "C. Marja va xizmatni tiklash", "C. Restore margin and service") +
 E("p", "Isrofni 5% dan 2,5% ga (+400), go'shtni boshqa yetkazib beruvchidan (+1 000), har xaridga choy (+1 000 choy → +1 700).",
   "Cut waste from 5% to 2.5% (+400), buy meat from another supplier (+1,000), tea with every purchase (+1,000 teas → +1,700).") +
 E("p", "Operatsion foyda 2 000 + 3 100 = <b>5 100</b>, mijoz va jamoa saqlanadi.", "Operating profit 2,000 + 3,100 = <b>5,100</b>; customers and team are kept.", 'style="margin-top:6px"') + '</div></div>' +
 E("div", "🧠 <b>Muhokama savoli:</b> nega katta chegirma (A) eng tez, lekin eng xavfli yo'l? Sizning biznesingizda C variantga o'xshash qanday 3 ta kichik chora bor?",
   "🧠 <b>Discussion question:</b> why is a big discount (A) the fastest but riskiest route? What 3 small actions similar to option C exist in your business?", 'class="quote" style="margin-top:12px"'))

# ============================ 16. AMALIY TOPSHIRIQ ============================
slide("Amaliy topshiriq", "Practical task",
 E("span", "Amaliy mashg'ulot · 2 soat", "Practical class · 2 hours", 'class="kicker"') +
 E("h2", "«Foyda va zarar <span class=\"grad\">tahlili»</span>", "The “profit and loss <span class=\"grad\">analysis”</span>") +
 E("p", "Har bir talaba (yoki 2 kishilik guruh) o'z biznesi uchun 2 oylik foyda va zarar hisobotini tuzib, reja-fakt tahlili va 3 ta chora taklif qiladi.", "Each student (or a pair) builds a 2-month P&amp;L for their own business, does a plan-vs-actual analysis and proposes 3 actions.", 'class="lead"') +
 '<div class="grid g2"><div class="card" style="--c:var(--blue)">' + E("h3", "⏱ 120 daqiqalik reja", "⏱ The 120-minute plan") +
 table([("Vaqt", "Time"), ("Nima qilinadi", "What to do")], [
  [TD("0–25", "0–25"), TD("1-oy hisoboti: tushum, tannarx, operatsion xarajat, foiz, soliq", "Month 1 statement: revenue, cost, operating costs, interest, tax")],
  [TD("25–40", "25–40"), TD("Yalpi, operatsion, sof marja va ROI", "Gross, operating, net margin and ROI")],
  [TD("40–55", "40–55"), TD("Zararsiz tushum va xavfsizlik zaxirasi", "Break-even revenue and margin of safety")],
  [TD("55–80", "55–80"), TD("2-oy (fakt) va farqni hajm, narx, xarajatga ajratish", "Month 2 (actual) and splitting the gap into volume, price, cost")],
  [TD("80–100", "80–100"), TD("Mahsulotlar bo'yicha hissa va 3 ta chora", "Contribution by product and 3 actions")],
  [TD("100–120", "100–120"), TD("Himoya va o'zaro baholash", "Defence and peer assessment")]]) + '</div>' +
 '<div><div class="card" style="--c:var(--green)">' + E("h3", "📋 Ishda bo'lishi shart", "📋 The work must contain") +
 '<ul class="clean">' + E("li", "2 oylik foyda va zarar hisoboti (pog'onama-pog'ona)", "A 2-month P&amp;L statement (step by step)") +
 E("li", "3 ta marja, ROI va qoplanish muddati", "3 margins, ROI and the payback period") +
 E("li", "Zararsiz tushum va xavfsizlik zaxirasi", "Break-even revenue and margin of safety") +
 E("li", "Reja-fakt jadvali va farq sabablari", "A plan-vs-actual table and the causes of the gap") +
 E("li", "Mahsulotlar bo'yicha hissa jadvali", "A contribution-by-product table") +
 E("li", "Hisob bilan asoslangan 3 ta chora", "3 actions justified with numbers") + '</ul></div>' +
 '<div class="card" style="--c:var(--amber);margin-top:12px">' + E("h3", "🏅 Baholash", "🏅 Assessment") +
 E("p", "Hisobot to'g'riligi <b>35%</b> · ko'rsatkichlar <b>20%</b> · tahlil va sabablar <b>25%</b> · choralar va himoya <b>20%</b>.", "Accuracy of the statement <b>35%</b> · ratios <b>20%</b> · analysis and causes <b>25%</b> · actions and defence <b>20%</b>.") + '</div></div></div>')

# ============================ 17. XULOSA ============================
slide("Xulosa va resurslar", "Summary and resources",
 E("span", "Xulosa · Mustaqil ish · Havolalar", "Summary · Independent work · Links", 'class="kicker"') +
 E("h2", "Yakuniy <span class=\"grad\">xulosa</span> va <span class=\"grad\">foydali resurslar</span>", "The final <span class=\"grad\">summary</span> and <span class=\"grad\">useful resources</span>") +
 '<div class="grid g2"><div>' +
 card_ul("green", "📌", "Esda qoladigan 6 ta fikr", "6 things to remember", [
  ("Hisobot zinapoyasi: <b>tushum → yalpi → operatsion → sof foyda</b>; har pog'ona o'z savoliga javob.", "The ladder: <b>revenue → gross → operating → net profit</b>; each step answers its own question."),
  ("Foydani <b>foizda</b> o'lchang: yalpi, operatsion, sof marja va ROI.", "Measure profit <b>in percentages</b>: gross, operating, net margin and ROI."),
  ("Zararsiz tushum = <b>doimiy xarajat ÷ yalpi marja</b>; zaxira 20% dan kam bo'lmasin.", "Break-even revenue = <b>fixed costs ÷ gross margin</b>; keep the margin of safety above 20%."),
  ("Reja-fakt farqini <b>hajm, narx/xomashyo va xarajat</b> ta'siriga ajrating.", "Split plan-vs-actual gaps into <b>volume, price/material and cost</b> effects."),
  ("Mahsulotni <b>foiz × hajm</b> bo'yicha baholang; musbat hissali mahsulotni shoshib yopmang.", "Judge products by <b>percentage × volume</b>; do not rush to close a product with positive contribution."),
  ("Foyda ≠ pul: amortizatsiya, nasiya, zaxira va qarz to'lovi ularni farqlantiradi.", "Profit ≠ cash: depreciation, credit sales, stock and loan repayments separate them.")]) +
 '<div class="card" style="--c:var(--amber);margin-top:12px">' + E("h3", "📓 Mustaqil ish: «Kichik biznes tahlili»", "📓 Independent work: “A small-business analysis”") +
 '<ul class="clean">' + E("li", "Tanish kichik biznes (do'kon, oshxona, ustaxona) bilan suhbatlashing.", "Talk to a small business you know (a shop, canteen or workshop).") +
 E("li", "Ruxsat bilan taxminiy oylik tushum va xarajatlarni yozing.", "With permission, note approximate monthly revenue and costs.") +
 E("li", "Foyda va zarar hisobotini va 3 ta marjani hisoblang.", "Build the P&amp;L and calculate the 3 margins.") +
 E("li", "Foydani oshirish uchun 3 ta asosli taklif yozing.", "Write 3 reasoned proposals to raise profit.") + '</ul>' +
 E("p", "Hajmi: 1–2 bet + jadval. Maxfiy ma'lumotni nomsiz va umumlashtirib yozing. Baholash: hisobot 40% · tahlil 30% · takliflar 30%.", "Size: 1–2 pages + a table. Keep confidential data anonymous and general. Marking: statement 40% · analysis 30% · proposals 30%.", 'style="font-size:13.5px;color:var(--muted)"') + '</div></div>' +
 '<div><div class="card" style="--c:var(--blue)">' + E("h3", "🔗 Foydali resurslar", "🔗 Useful resources") +
 E("p", "<b>Qonun va rasmiy manbalar:</b>", "<b>Law and official sources:</b>") +
 '<ul class="clean">' +
 E("li", '<a class="lnk" href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> — buxgalteriya hisobi to\'g\'risidagi qonun va milliy standartlar', '<a class="lnk" href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> — the accounting law and national standards') +
 E("li", '<a class="lnk" href="https://soliq.uz" target="_blank" rel="noopener">soliq.uz</a> — soliq rejimlari va hisobot shakllari', '<a class="lnk" href="https://soliq.uz" target="_blank" rel="noopener">soliq.uz</a> — tax regimes and reporting forms') +
 E("li", '<a class="lnk" href="https://stat.uz" target="_blank" rel="noopener">stat.uz</a> — sohalar bo\'yicha statistika', '<a class="lnk" href="https://stat.uz" target="_blank" rel="noopener">stat.uz</a> — statistics by industry') +
 E("li", '<a class="lnk" href="https://ifrs.org" target="_blank" rel="noopener">ifrs.org</a> — xalqaro moliyaviy hisobot standartlari (MHXS)', '<a class="lnk" href="https://ifrs.org" target="_blank" rel="noopener">ifrs.org</a> — International Financial Reporting Standards') + '</ul>' +
 E("p", "<b>Bepul vositalar:</b>", "<b>Free tools:</b>", 'style="margin-top:8px"') +
 E("p", '<a class="lnk" href="https://docs.google.com" target="_blank" rel="noopener">docs.google.com</a> — foyda va zarar hisoboti shabloni (Google Sheets)',
   '<a class="lnk" href="https://docs.google.com" target="_blank" rel="noopener">docs.google.com</a> — a P&amp;L template (Google Sheets)') +
 E("p", "<b>O'qish uchun:</b> Karen Berman, Joe Knight — «Financial Intelligence for Entrepreneurs» · Mike Michalowicz — «Profit First» · Eliyahu Goldratt — «The Goal».", "<b>Further reading:</b> Karen Berman, Joe Knight — “Financial Intelligence for Entrepreneurs” · Mike Michalowicz — “Profit First” · Eliyahu Goldratt — “The Goal”.", 'style="margin-top:8px"') +
 E("small", "⚠️ Soliq stavkalari va hisobot talablari o'zgaradi. Har doim amaldagi rasmiy ma'lumotga tayaning.", "⚠️ Tax rates and reporting requirements change. Always rely on current official information.", 'class="note"') +
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
 E("p", "Keyingi mashg'ulotgacha <b>foyda va zarar tahlilini</b> tugallang — keyingi mavzu: biznes-reja tuzish va mahsulotni tashqi bozorga olib chiqish.",
   "Before the next class, finish your <b>profit and loss analysis</b> — the next topic: writing a business plan and taking a product to foreign markets.") +
 E("p", "Termiz davlat universiteti · Tadbirkorlik asoslari", "Termez State University · Fundamentals of Entrepreneurship", 'style="color:var(--muted);font-size:13.5px"') + '</div>')

# ============================ TEST SAVOLLARI ============================
Q = [
 # 1 — yalpi foyda (to'g'ri: B)
 dict(q="Oylik tushum 50 000 000, sotilgan mahsulot tannarxi 20 000 000 so'm. Yalpi foyda qancha?",
      a=["20 000 000 so'm", "30 000 000 so'm", "35 000 000 so'm", "70 000 000 so'm"], c=1,
      e="Yalpi foyda = tushum − sotilgan mahsulot tannarxi = 50 000 000 − 20 000 000 = 30 000 000 so'm.",
      qe="Monthly revenue is 50,000,000 and the cost of goods sold is 20,000,000 so'm. What is the gross profit?",
      ae=["20,000,000 so'm", "30,000,000 so'm", "35,000,000 so'm", "70,000,000 so'm"],
      ee="Gross profit = revenue − cost of goods sold = 50,000,000 − 20,000,000 = 30,000,000 so'm."),
 # 2 — operatsion foyda (to'g'ri: A)
 dict(q="Yalpi foyda 30 000 000, operatsion xarajatlar 22 000 000 so'm. Operatsion foyda qancha?",
      a=["8 000 000 so'm", "12 000 000 so'm", "22 000 000 so'm", "52 000 000 so'm"], c=0,
      e="Operatsion foyda = yalpi foyda − operatsion xarajatlar = 30 000 000 − 22 000 000 = 8 000 000 so'm.",
      qe="Gross profit is 30,000,000 and operating expenses are 22,000,000 so'm. What is the operating profit?",
      ae=["8,000,000 so'm", "12,000,000 so'm", "22,000,000 so'm", "52,000,000 so'm"],
      ee="Operating profit = gross profit − operating expenses = 30,000,000 − 22,000,000 = 8,000,000 so'm."),
 # 3 — sof marja (to'g'ri: B)
 dict(q="Sof foyda 4 000 000, tushum 50 000 000 so'm. Sof marja necha foiz?",
      a=["4%", "8%", "12%", "20%"], c=1,
      e="Sof marja = sof foyda ÷ tushum × 100 = 4 000 000 ÷ 50 000 000 × 100 = 8%.",
      qe="Net profit is 4,000,000 and revenue is 50,000,000 so'm. What is the net margin?",
      ae=["4%", "8%", "12%", "20%"],
      ee="Net margin = net profit ÷ revenue × 100 = 4,000,000 ÷ 50,000,000 × 100 = 8%."),
 # 4 — xarajat emas (to'g'ri: C)
 dict(q="Quyidagilardan qaysi biri foyda va zarar hisobotida xarajat sifatida yozilmaydi?",
      a=["Ustaxona va do'kon uchun to'langan oylik ijara haqi",
         "Xodimlarga shu oy uchun hisoblangan ish haqi summasi",
         "Bankka shu oy qaytarilgan kreditning asosiy qarzi",
         "Pech va muzlatgichning shu oy uchun eskirish ulushi"], c=2,
      e="Kreditning asosiy qarzini qaytarish — xarajat emas, moliyaviy pul chiqimi. Xarajat sifatida faqat kredit foizi yoziladi. Ijara, ish haqi va amortizatsiya — xarajat.",
      qe="Which of the following is not recorded as an expense in the P&amp;L statement?",
      ae=["The monthly rent paid for the workshop and the shop",
          "The wages calculated for employees for this month",
          "The principal part of a loan repaid to the bank",
          "The share of oven and freezer wear for this month"],
      ee="Repaying loan principal is not an expense but a financing cash outflow. Only the loan interest is recorded as an expense. Rent, wages and depreciation are expenses."),
 # 5 — zararsiz tushum (to'g'ri: D)
 dict(q="Oylik doimiy xarajatlar 12 000 000 so'm, yalpi marja 40%. Zararsiz tushum qancha?",
      a=["4 800 000 so'm", "16 800 000 so'm", "20 000 000 so'm", "30 000 000 so'm"], c=3,
      e="Zararsiz tushum = doimiy xarajatlar ÷ yalpi marja = 12 000 000 ÷ 0,40 = 30 000 000 so'm.",
      qe="Monthly fixed costs are 12,000,000 so'm and the gross margin is 40%. What is the break-even revenue?",
      ae=["4,800,000 so'm", "16,800,000 so'm", "20,000,000 so'm", "30,000,000 so'm"],
      ee="Break-even revenue = fixed costs ÷ gross margin = 12,000,000 ÷ 0.40 = 30,000,000 so'm."),
 # 6 — xavfsizlik zaxirasi (to'g'ri: A)
 dict(q="Haqiqiy tushum 40 mln, zararsiz tushum 30 mln so'm. Xavfsizlik zaxirasi necha foiz?",
      a=["25%", "33%", "75%", "10%"], c=0,
      e="Xavfsizlik zaxirasi = (haqiqiy − zararsiz) ÷ haqiqiy × 100 = (40 − 30) ÷ 40 × 100 = 25%.",
      qe="Actual revenue is 40 million and break-even revenue is 30 million so'm. What is the margin of safety?",
      ae=["25%", "33%", "75%", "10%"],
      ee="Margin of safety = (actual − break-even) ÷ actual × 100 = (40 − 30) ÷ 40 × 100 = 25%."),
 # 7 — yalpi marja tushishi (to'g'ri: C)
 dict(q="Narxlar o'zgarmagan, lekin yalpi marja 60% dan 55% ga tushdi. Eng ehtimolli sabab qaysi?",
      a=["Ijara haqi oshgani sababli operatsion xarajatlar ko'paygan",
         "Kredit foizi oshib, bankka to'lanadigan summa ko'payib qolgan",
         "Xomashyo qimmatlashgan yoki isrof va yo'qotishlar ko'paygan",
         "Yangi xodim olingani sababli oylik ish haqi xarajati oshgan"], c=2,
      e="Yalpi marja faqat tushum va sotilgan mahsulot tannarxiga bog'liq. Narx o'zgarmagan bo'lsa, sabab — xomashyo narxi yoki isrof. Ijara, ish haqi va foiz yalpi foydadan keyin ayriladi.",
      qe="Prices did not change, but the gross margin fell from 60% to 55%. What is the most likely cause?",
      ae=["Operating expenses grew because the rent went up",
          "The loan interest rose and more is paid to the bank",
          "Raw materials became dearer or waste and losses grew",
          "Wage costs rose because a new employee was hired"],
      ee="Gross margin depends only on revenue and the cost of goods sold. If prices did not change, the cause is raw-material cost or waste. Rent, wages and interest are subtracted after gross profit."),
 # 8 — eng ko'p hissa (to'g'ri: B)
 dict(q="A: hissa 2 000 so'm, 500 dona; B: 1 500 so'm, 900 dona; C: 4 000 so'm, 280 dona; D: 2 500 so'm, 400 dona. Qaysi mahsulot jami eng ko'p hissa beradi?",
      a=["A mahsulot", "B mahsulot", "C mahsulot", "D mahsulot"], c=1,
      e="A = 1 000 000; B = 1 350 000; C = 1 120 000; D = 1 000 000. Bir dona hissasi eng kichik bo'lsa ham, B ko'p sotilgani uchun eng ko'p hissa beradi.",
      qe="A: contribution 2,000 so'm, 500 units; B: 1,500 so'm, 900 units; C: 4,000 so'm, 280 units; D: 2,500 so'm, 400 units. Which product gives the most total contribution?",
      ae=["Product A", "Product B", "Product C", "Product D"],
      ee="A = 1,000,000; B = 1,350,000; C = 1,120,000; D = 1,000,000. Although its unit contribution is the smallest, B gives the most because it sells the most."),
 # 9 — foyda bor, pul kam (to'g'ri: D)
 dict(q="Oyda sof foyda 3 900 000 so'm, lekin kassadagi pul atigi 1 600 000 ga oshdi. Qaysi izoh to'g'ri bo'lishi mumkin?",
      a=["Hisobotda xato bor, chunki foyda va pul doim teng bo'lishi shart",
         "Amortizatsiya kassadan qo'shimcha pul chiqib ketishiga olib kelgan",
         "Soliq ikki marta to'langan, shuning uchun kassadagi pul kam qolgan",
         "Nasiya va zaxira ko'paygan, kreditning asosiy qismi qaytarilgan"], c=3,
      e="Debitor qarz va zaxira o'sishi hamda kredit asosiy qarzini qaytarish pulni kamaytiradi, lekin foydaga ta'sir qilmaydi. Amortizatsiya esa aksincha — xarajat, lekin pul chiqmaydi.",
      qe="Net profit for the month is 3,900,000 so'm, but cash rose by only 1,600,000. Which explanation could be right?",
      ae=["The statement is wrong: profit and cash must always be equal",
         "Depreciation caused extra money to leave the till this month",
         "Tax was paid twice, which is why so little cash is left now",
         "Credit sales and stock grew, and loan principal was repaid"],
      ee="Growth in receivables and stock and repaying loan principal reduce cash without affecting profit. Depreciation is the opposite — an expense with no cash outflow."),
 # 10 — eng kuchli richag (to'g'ri: A)
 dict(q="Tushum 40 mln, tannarx 16 mln, operatsion xarajat 18 mln so'm. Qaysi 5% o'zgarish operatsion foydani eng ko'p oshiradi (qolganlari o'zgarmasa)?",
      a=["Mahsulot narxini 5% ga oshirish",
         "Xomashyo narxini 5% ga tushirish",
         "Ijara va maoshni 5% ga kamaytirish",
         "Sotuv hajmini 5% ga ko'paytirish"], c=0,
      e="Narx +5% → +2 000 000; hajm +5% → +1 200 000; doimiy xarajat −5% → +900 000; tannarx −5% → +800 000. Narx eng kuchli richag, lekin mijoz ketish xavfini ham hisobga olish kerak.",
      qe="Revenue is 40 million, cost of goods 16 million and operating costs 18 million so'm. Which 5% change raises operating profit the most (others unchanged)?",
      ae=["Raising the selling price by 5%",
         "Cutting raw-material cost by 5%",
         "Cutting the rent and wages by 5%",
         "Raising the sales volume by 5%"],
      ee="Price +5% → +2,000,000; volume +5% → +1,200,000; fixed costs −5% → +900,000; cost of goods −5% → +800,000. Price is the strongest lever, but the risk of losing customers must be considered."),
 # 11 — musbat hissali mahsulot (to'g'ri: B)
 dict(q="Mahsulotning hissasi musbat, lekin unga doimiy xarajat «ulushi» yozilgach, u zarar ko'rsatmoqda. To'g'ri qaror qaysi?",
      a=["Uni darhol to'xtatish, chunki hisobotda u hozir zarar ko'rsatmoqda",
         "Shoshilmaslik, chunki u doimiy xarajatlarni qoplashga yordam bermoqda",
         "Uning narxini ikki baravar oshirib, sotuvni butunlay to'xtatib qo'yish",
         "Doimiy xarajatlarni faqat shu mahsulotga yozib, qolganlarini oqlash"], c=1,
      e="Mahsulotni to'xtatsangiz, ijara va ish haqi kamaymaydi — faqat uning hissasi yo'qoladi va umumiy foyda kamayadi. Musbat hissali mahsulot doimiy xarajatni qoplashga yordam beradi.",
      qe="A product has a positive contribution, but after a “share” of fixed costs is allocated it shows a loss. What is the right decision?",
      ae=["Stop it at once, because the statement shows it making a loss",
         "Do not rush, because it is helping to cover the fixed costs",
         "Double its price so that its sales stop altogether as well",
         "Charge all fixed costs to this product to justify the others"],
      ee="If you stop the product, rent and wages do not fall — only its contribution disappears and total profit falls. A product with positive contribution helps cover fixed costs."),
 # 12 — amortizatsiya (to'g'ri: C)
 dict(q="«Amortizatsiya» nimani anglatadi?",
      a=["Uskunani sotib olish uchun bankdan olingan kreditning foizini",
         "Uskuna buzilganda uni ta'mirlash uchun ketadigan xarajatni",
         "Uskuna narxini u ishlaydigan davrga bo'lib, xarajatga yozishni",
         "Eski uskunani sotishdan biznesga tushadigan qo'shimcha pulni"], c=2,
      e="Amortizatsiya — uzoq muddatli aktiv (pech, muzlatgich) narxini foydalanish yillariga bo'lib, har oy xarajat sifatida yozish. Masalan, 30 mln ÷ 60 oy = 500 000 so'm/oy.",
      qe="What does “depreciation” mean?",
      ae=["The interest on a bank loan taken to buy the equipment",
          "The cost of repairing the equipment when it breaks down",
          "Spreading the cost of equipment over its working life",
          "Extra money the business gets from selling old equipment"],
      ee="Depreciation is spreading the price of a long-term asset (an oven, a freezer) over its years of use and recording it as a monthly expense. For example, 30 million ÷ 60 months = 500,000 so'm/month."),
 # 13 — qoplanish (to'g'ri: D)
 dict(q="Boshlang'ich investitsiya 60 000 000 so'm, oylik sof foyda 3 000 000 so'm. Qoplanish muddati qancha?",
      a=["5 oy", "12 oy", "18 oy", "20 oy"], c=3,
      e="Qoplanish muddati = investitsiya ÷ oylik sof foyda = 60 000 000 ÷ 3 000 000 = 20 oy.",
      qe="The starting investment is 60,000,000 so'm and monthly net profit is 3,000,000 so'm. What is the payback period?",
      ae=["5 months", "12 months", "18 months", "20 months"],
      ee="Payback period = investment ÷ monthly net profit = 60,000,000 ÷ 3,000,000 = 20 months."),
 # 14 — reja-fakt maqsadi (to'g'ri: A)
 dict(q="Reja va fakt tahlilining asosiy maqsadi nima?",
      a=["Farqning sababini topib, keyingi oy uchun aniq chora belgilash",
         "Rejani faktga moslab o'zgartirib, farqni hisobotdan yo'qotish",
         "Xodimlardan kim aybdor ekanini topib, ularni jazolash uchun",
         "Soliq idorasiga topshirish uchun majburiy hisobot tayyorlash"], c=0,
      e="Reja-fakt tahlili farqni hajm, narx va xarajat ta'siriga ajratib, uning sababini topadi va keyingi oy uchun aniq chora belgilashga yordam beradi.",
      qe="What is the main purpose of plan-vs-actual analysis?",
      ae=["To find the gap's cause and set a clear step for next month",
         "To change the plan to match the actual and so remove the gap",
         "To find which employee is to blame and then to punish them",
         "To prepare a mandatory report to submit to the tax office"],
      ee="Plan-vs-actual analysis splits the gap into volume, price and cost effects, finds its cause and helps set a clear action for next month."),
 # 15 — xarajat ulushi (to'g'ri: C)
 dict(q="Oylik operatsion xarajatlar 18 000 000, tushum 40 000 000 so'm. Operatsion xarajatlar tushumning necha foizini tashkil qiladi?",
      a=["18%", "40%", "45%", "55%"], c=2,
      e="Ulush = operatsion xarajatlar ÷ tushum × 100 = 18 000 000 ÷ 40 000 000 × 100 = 45%.",
      qe="Monthly operating expenses are 18,000,000 and revenue is 40,000,000 so'm. What percentage of revenue are operating expenses?",
      ae=["18%", "40%", "45%", "55%"],
      ee="Share = operating expenses ÷ revenue × 100 = 18,000,000 ÷ 40,000,000 × 100 = 45%."),
]
