# -*- coding: utf-8 -*-
"""M12 · Biznesda pul oqimini rejalashtirish: kirim, chiqim va mablag' jalb qilish — slaydlar va test (yangi_mavzu.py uchun).
T, d, slide — yangi_mavzu.py beradi.  Ishlatish:
  python3 _reyting-manba/yangi_mavzu.py _reyting-manba/matn/mavzu_12_matn.py mavzu-12.html "Biznesda pul oqimini rejalashtirish: kirim, chiqim va mablag' jalb qilish" 12
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
 E("span", "M12-mavzu · Amaliy mashg'ulot · 2 soat", "Topic 12 · Practical class · 2 hours", 'class="kicker"') +
 E("h1", "BIZNESDA PUL OQIMINI REJALASHTIRISH: KIRIM, CHIQIM VA MABLAG' JALB QILISH", "PLANNING CASH FLOW IN A BUSINESS: INCOME, SPENDING AND RAISING FUNDS", 'class="grad"') +
 E("p", "Foyda ≠ pul · <b>pul qachon keladi va qachon ketadi</b> · 6 oylik pul oqimi rejasi · kassa uzilishi va uni yopish · qarz narxi va zaxira jamg'arma.",
   "Profit ≠ cash · <b>when money comes in and when it goes out</b> · a 6-month cash-flow plan · the cash gap and how to close it · the cost of debt and a reserve fund.", 'class="lead"') +
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
 E("div", "Maqsad: talaba biznesidagi pul harakatini <b>oldindan rejalashtirishni</b> — qachon qancha pul kelishi va ketishini, qayerda pul yetishmasligini va uni qanday yopishni hisoblashni o'rganadi.",
   "Aim: the student learns to <b>plan the movement of money in advance</b> — how much comes in and goes out and when, where cash will run short and how to cover it.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("green", "💡", "Foyda va pulni farqlaydi", "Tells profit from cash", "Nega foydali biznes ham pulsiz qolishi mumkinligini tushuntiradi.", "Explains why even a profitable business can run out of cash.") +
 card("blue", "📥", "Kirim va chiqimni yozadi", "Records income and spending", "Pul oqimining 3 turini ajratib, har birini o'z vaqtida yozadi.", "Separates the 3 types of cash flow and records each at the right time.") +
 card("violet", "📅", "Reja tuzadi", "Builds a plan", "6 oylik pul oqimi rejasini tuzib, oylik qoldiqni hisoblaydi.", "Builds a 6-month cash-flow plan and calculates the monthly balance.") +
 card("orange", "🕳", "Uzilishni topadi", "Finds the gap", "Kassa uzilishi qachon va qancha bo'lishini oldindan ko'radi.", "Sees in advance when a cash gap will appear and how deep it will be.") +
 card("pink", "🏦", "Mablag' jalb qiladi", "Raises funds", "Ehtiyojga mos manba, summa va muddatni tanlab, qarz narxini hisoblaydi.", "Chooses a source, sum and term that fit the need and calculates the cost of debt.") +
 card("cyan", "🛡", "Zaxira yaratadi", "Builds a reserve", "Kutilmagan holat uchun xavfsizlik yostiqchasini rejalashtiradi.", "Plans a safety cushion for unexpected events.") +
 '</div>')

# ============================ 3. REJA ============================
slide("Reja va tushunchalar", "Plan and concepts",
 E("span", "Mashg'ulot rejasi", "Class plan", 'class="kicker"') +
 E("h2", "Bugungi <span class=\"grad\">4 ta blok</span>", "Today's <span class=\"grad\">4 blocks</span>") +
 '<div class="grid g4">' +
 card("green", "1️⃣", "Pul harakati", "Money movement", "Foyda va pul farqi, pul oqimining 3 turi, kirim va chiqim.", "Profit vs cash, the 3 types of cash flow, income and spending.") +
 card("blue", "2️⃣", "Reja", "The plan", "6 oylik jadval, kassa uzilishi, uni yopish usullari.", "A 6-month table, the cash gap, ways to close it.") +
 card("violet", "3️⃣", "Aylanma pul", "Working capital", "Debitor va kreditor qarz, pul aylanish sikli.", "Receivables and payables, the cash conversion cycle.") +
 card("orange", "4️⃣", "Mablag' va himoya", "Funds and protection", "Mablag' jalb qilish, qarz narxi, zaxira, pul nazorati.", "Raising funds, the cost of debt, reserves, cash control.") +
 '</div>' + E("h3", "🔑 Tayanch tushunchalar", "🔑 Key concepts", 'style="margin-top:22px"') +
 E("div",
   '<span class="pill g">pul oqimi</span><span class="pill">kirim</span><span class="pill">chiqim</span><span class="pill g">sof pul oqimi</span>'
   '<span class="pill">boshlang\'ich va yakuniy qoldiq</span><span class="pill g">kassa uzilishi</span><span class="pill">operatsion faoliyat</span><span class="pill">investitsion faoliyat</span>'
   '<span class="pill">moliyaviy faoliyat</span><span class="pill g">debitor qarz</span><span class="pill g">kreditor qarz</span><span class="pill">aylanma mablag\'</span>'
   '<span class="pill">pul aylanish sikli</span><span class="pill">avans</span><span class="pill g">qarz narxi (foiz)</span><span class="pill">qarzni qoplash koeffitsienti</span>'
   '<span class="pill g">zaxira jamg\'arma</span><span class="pill">nasiya</span>',
   '<span class="pill g">cash flow</span><span class="pill">cash in</span><span class="pill">cash out</span><span class="pill g">net cash flow</span>'
   '<span class="pill">opening and closing balance</span><span class="pill g">cash gap</span><span class="pill">operating activities</span><span class="pill">investing activities</span>'
   '<span class="pill">financing activities</span><span class="pill g">receivables</span><span class="pill g">payables</span><span class="pill">working capital</span>'
   '<span class="pill">cash conversion cycle</span><span class="pill">advance payment</span><span class="pill g">cost of debt (interest)</span><span class="pill">debt service coverage</span>'
   '<span class="pill g">reserve fund</span><span class="pill">sale on credit</span>'))

# ============================ 4. FOYDA ≠ PUL ============================
slide("Foyda ≠ pul", "Profit ≠ cash",
 E("span", "1-blok · Pul harakati", "Block 1 · Money movement", 'class="kicker"') +
 E("h2", "Foydali biznes ham <span class=\"grad\">pulsiz qolishi mumkin</span>", "Even a profitable business <span class=\"grad\">can run out of cash</span>") +
 E("div", "<b>Foyda</b> — davr davomida tushum xarajatdan qancha ko'p bo'lgani. <b>Pul</b> — hozir kassada va kartada bor mablag'. Ular har xil vaqtda harakatlanadi: sotuv bugun, pul esa bir oydan keyin kelishi mumkin.",
   "<b>Profit</b> is how much revenue exceeded costs over a period. <b>Cash</b> is the money in the till and on the card right now. They move at different times: the sale is today, but the money may come a month later.", 'class="def"') +
 '<div class="grid g4" style="margin-top:14px">' +
 stat("10 mln", "do'konlarga nasiyaga sotildi (foyda 3 mln)", "sold to shops on credit (profit 3 million)") +
 stat("0", "shu oy kassaga tushgan pul", "cash received this month", "o") +
 stat("6 mln", "shu oy to'lanishi shart: mato, ish haqi, ijara", "must be paid this month: fabric, wages, rent", "v") +
 stat("−6 mln", "hisobda foyda bor, kassada esa teshik", "profit on paper, a hole in the till") + '</div>' +
 '<div class="grid g2" style="margin-top:14px">' +
 card_ul("red", "⚠️", "Pul yetishmasligining tez-tez uchraydigan sabablari", "Common causes of cash shortage", [
  ("Mijozlarga <b>nasiya</b> berish, pulni kech yig'ish.", "Selling <b>on credit</b> and collecting money late."),
  ("Xomashyoni <b>oldindan va ko'p</b> sotib olish.", "Buying raw materials <b>early and in bulk</b>."),
  ("<b>Mavsumiylik:</b> xarajat bir oyda, sotuv boshqa oyda.", "<b>Seasonality:</b> costs in one month, sales in another."),
  ("Tez o'sish: ko'proq buyurtma — ko'proq oldindan xarajat.", "Fast growth: more orders mean more spending up front."),
  ("Shaxsiy va biznes pulini aralashtirish.", "Mixing personal and business money.")], "tick cross") +
 card("green", "🧠", "Asosiy qoida", "The key rule", "Biznes zarardan emas, ko'pincha <b>pul tugashidan</b> to'xtaydi. Shuning uchun foydani oylik, pulni esa <b>haftalik</b> kuzating va oldindan rejalashtiring.",
      "Businesses usually stop not from losses but from <b>running out of cash</b>. So track profit monthly but cash <b>weekly</b>, and plan ahead.") + '</div>')

# ============================ 5. 3 TURI ============================
slide("Pul oqimining 3 turi", "The 3 types of cash flow",
 E("span", "1.2 · Tasnif", "1.2 · Classification", 'class="kicker"') +
 E("h2", "Pul qayerdan keladi va <span class=\"grad\">qayerga ketadi?</span>", "Where does money come from and <span class=\"grad\">where does it go?</span>") +
 E("div", "Barcha pul harakatini 3 guruhga ajrating. Shunda sog'lom biznesni ko'rish oson: asosiy pul <b>operatsion</b> faoliyatdan kelishi kerak, qarzdan emas.",
   "Split all money movements into 3 groups. Then a healthy business is easy to see: the main money should come from <b>operating</b> activities, not from debt.", 'class="def"') +
 table([("Tur", "Type"), ("Kirim (+)", "Cash in (+)"), ("Chiqim (−)", "Cash out (−)"), ("Sog'lom holat", "Healthy state")], [
  [TD("<b>🔄 Operatsion</b> (kundalik ish)", "<b>🔄 Operating</b> (daily work)"), TD("Mijozlardan tushum, avanslar", "Revenue from customers, advances"), TD("Xomashyo, ish haqi, ijara, kommunal, soliq", "Raw materials, wages, rent, utilities, tax"), TD("Ko'pincha <b>musbat</b>", "Usually <b>positive</b>", "g")],
  [TD("<b>🏗 Investitsion</b> (uzoq muddatli)", "<b>🏗 Investing</b> (long-term)"), TD("Eski uskunani sotish", "Selling old equipment"), TD("Uskuna, mashina, binoni ta'mirlash", "Equipment, a vehicle, building repairs"), TD("O'sish davrida <b>manfiy</b> — bu normal", "<b>Negative</b> when growing — this is normal")],
  [TD("<b>🏦 Moliyaviy</b> (pul manbalari)", "<b>🏦 Financing</b> (sources of money)"), TD("Kredit, investor ulushi, grant, egasining puli", "A loan, investor money, a grant, the owner's money"), TD("Kreditni qaytarish, foiz, egasiga dividend", "Repaying a loan, interest, dividends to the owner"), TD("Vaqtinchalik yordam, doimiy tayanch emas", "A temporary help, not a permanent crutch", "r")]]) +
 '<div class="grid g3" style="margin-top:14px">' +
 card("green", "✅", "Yaxshi belgi", "A good sign", "Operatsion oqim har oy musbat; investitsiya shu puldan yoki rejali kreditdan qilinadi.", "Operating flow is positive every month; investment is paid from it or from a planned loan.") +
 card("orange", "⚠️", "Ogohlantirish", "A warning", "Operatsion oqim manfiy, lekin kassa qarz hisobiga to'ldirilyapti — muammo yashirinmoqda.", "Operating flow is negative but the till is topped up with loans — the problem is being hidden.") +
 card("blue", "📌", "Eslatma", "A reminder", "Kreditni qaytarish <b>xarajat emas</b>, moliyaviy chiqim; foiz esa xarajat.", "Repaying a loan is <b>not an expense</b> but a financing outflow; the interest is an expense.") + '</div>')

# ============================ 6. KIRIMLAR ============================
slide("Kirimlar: qachon pul keladi?", "Cash in: when does money arrive?",
 E("span", "1.3 · Kirim", "1.3 · Cash in", 'class="kicker"') +
 E("h2", "Sotuv bo'ldi — <span class=\"grad\">pul qachon keladi?</span>", "The sale happened — <span class=\"grad\">when does the money arrive?</span>") +
 E("div", "Pul oqimi rejasida kirim <b>sotuv kuni</b> emas, <b>pul haqiqatan tushgan kun</b> bo'yicha yoziladi. To'lov turi kirim vaqtini o'zgartiradi.",
   "In a cash-flow plan income is recorded on the day <b>money actually arrives</b>, not on <b>the day of sale</b>. The payment type changes when cash comes in.", 'class="def"') +
 table([("To'lov turi", "Payment type"), ("Pul qachon tushadi", "When money arrives"), ("Xavf", "Risk"), ("Maslahat", "Tip")], [
  [TD("<b>💵 Naqd / karta</b>", "<b>💵 Cash / card</b>"), TD("Shu kuni (kartada 1–3 kun bo'lishi mumkin)", "The same day (cards may take 1–3 days)"), TD("Past", "Low", "g"), TD("Karta komissiyasini hisobga oling", "Account for card fees")],
  [TD("<b>📥 Avans (oldindan to'lov)</b>", "<b>📥 Advance payment</b>"), TD("Ish boshlanishidan oldin", "Before the work begins"), TD("Juda past", "Very low", "g"), TD("Katta buyurtmada 30–50% so'rang", "Ask for 30–50% on large orders")],
  [TD("<b>🧾 Nasiya (keyin to'lov)</b>", "<b>🧾 Sale on credit</b>"), TD("15, 30, 60 kundan keyin — yoki umuman yo'q", "After 15, 30, 60 days — or never"), TD("Yuqori", "High", "r"), TD("Muddatni yozma kelishing, eslatib turing", "Agree terms in writing and send reminders")],
  [TD("<b>🛒 Marketpleys</b>", "<b>🛒 Marketplace</b>"), TD("Platforma qoidasiga ko'ra, odatda bir necha kun yoki haftadan keyin", "Under the platform's rules, usually after days or weeks"), TD("O'rta", "Medium"), TD("To'lov jadvalini oldindan bilib oling", "Learn the payout schedule in advance")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("blue", "📅", "Misol: «Nafis» tikuv ustaxonasi", "Example: the “Nafis” sewing workshop", "Maktab formasini tikadi. Avgustda 30 mln so'mlik sotuv bo'ladi, lekin mato va furnitura <b>iyun–iyul</b>da sotib olinadi. Ana shu yerda pul muammosi boshlanadi.",
      "It sews school uniforms. August sales reach 30 million so'm, but fabric and accessories are bought in <b>June–July</b>. That is where the cash problem begins.") +
 card("green", "💡", "Kirimni tezlashtirish yo'llari", "Ways to speed up cash in", "Avans so'rash · tez to'laganga kichik chegirma · nasiyani faqat ishonchli mijozga · har hafta qarzdorlar ro'yxatini ko'rish.",
      "Ask for advances · a small discount for paying fast · credit only to reliable customers · review the debtor list every week.") + '</div>' +
 E("small", "«Nafis» — o'quv uchun to'qib chiqarilgan shartli misol; raqamlar haqiqiy biznesdan olinmagan.", "“Nafis” is a made-up teaching example; the figures are not from a real business.", 'class="note"'))

# ============================ 7. CHIQIMLAR ============================
slide("Chiqimlar: pul qachon ketadi?", "Cash out: when does money leave?",
 E("span", "1.4 · Chiqim", "1.4 · Cash out", 'class="kicker"') +
 E("h2", "Chiqimlarni <span class=\"grad\">kalendarga</span> joylang", "Put your spending <span class=\"grad\">on a calendar</span>") +
 E("div", "Har bir chiqimning <b>summasi</b> bilan birga <b>to'lov sanasini</b> ham yozing. Bir xil summa oyning boshida yoki oxirida to'lanishi kassaga turlicha ta'sir qiladi.",
   "Write down the <b>payment date</b> of every outflow as well as its <b>amount</b>. The same sum paid at the start or the end of a month affects the till differently.", 'class="def"') +
 '<div class="grid g4" style="margin-top:14px">' +
 card("blue", "🔁", "Doimiy", "Fixed", "Har oy bir xil: ijara, ish haqi, internet, kredit to'lovi.", "The same every month: rent, wages, internet, loan instalments.") +
 card("violet", "📦", "O'zgaruvchan", "Variable", "Sotuv bilan birga o'zgaradi: mato, ip, qadoq, yetkazish.", "Changes with sales: fabric, thread, packaging, delivery.") +
 card("orange", "📆", "Mavsumiy", "Seasonal", "Faqat ma'lum oylarda: mavsum oldidan xomashyo, qo'shimcha ishchi.", "Only in certain months: raw material before the season, extra staff.") +
 card("red", "⚡", "Bir martalik", "One-off", "Uskuna, ta'mir, jarima, kutilmagan buzilish.", "Equipment, repairs, a fine, an unexpected breakdown.") + '</div>' +
 E("h3", "«Nafis» oylik chiqimlari (ming so'm)", "“Nafis” monthly outflows (thousand so'm)", 'style="margin-top:14px"') +
 table([("Modda", "Item"), ("Iyun", "Jun"), ("Iyul", "Jul"), ("Avgust", "Aug"), ("Sentyabr", "Sep"), ("Oktyabr", "Oct"), ("Noyabr", "Nov")], [
  [TD("Mato va furnitura", "Fabric and accessories"), TD("12 000", "12,000"), TD("10 000", "10,000"), TD("4 000", "4,000"), TD("2 000", "2,000"), TD("2 000", "2,000"), TD("2 000", "2,000")],
  [TD("Ish haqi", "Wages"), TD("4 000", "4,000"), TD("4 000", "4,000"), TD("6 000", "6,000"), TD("4 000", "4,000"), TD("4 000", "4,000"), TD("4 000", "4,000")],
  [TD("Ijara va kommunal", "Rent and utilities"), TD("1 500", "1,500"), TD("1 500", "1,500"), TD("1 500", "1,500"), TD("1 500", "1,500"), TD("1 500", "1,500"), TD("1 500", "1,500")],
  [TD("Reklama, transport, boshqa", "Ads, transport, other"), TD("500", "500"), TD("500", "500"), TD("1 000", "1,000"), TD("500", "500"), TD("500", "500"), TD("500", "500")],
  [TD("<b>Jami chiqim</b>", "<b>Total outflow</b>"), TD("<b>18 000</b>", "<b>18,000</b>", "r"), TD("<b>16 000</b>", "<b>16,000</b>", "r"), TD("<b>12 500</b>", "<b>12,500</b>"), TD("<b>8 000</b>", "<b>8,000</b>"), TD("<b>8 000</b>", "<b>8,000</b>"), TD("<b>8 000</b>", "<b>8,000</b>")]]) +
 E("small", "Soliq to'lovlari va hisobot muddatlarini ham kalendarga kiriting. Amaldagi soliq turlari va sanalarini soliq xizmati sayti yoki buxgalter bilan aniqlang.",
   "Put tax payments and reporting deadlines on the calendar too. Confirm current tax types and dates on the tax service website or with an accountant.", 'class="note"'))

# ============================ 8. 6 OYLIK REJA ============================
slide("6 oylik pul oqimi rejasi", "A 6-month cash-flow plan",
 E("span", "2-blok · Reja", "Block 2 · The plan", 'class="kicker"') +
 E("h2", "«Nafis»: <span class=\"grad\">6 oylik pul oqimi</span> (ming so'm)", "“Nafis”: <span class=\"grad\">6-month cash flow</span> (thousand so'm)") +
 E("div", "<b>Yakuniy qoldiq = boshlang'ich qoldiq + kirim − chiqim.</b> Har oyning yakuniy qoldig'i keyingi oyning boshlang'ich qoldig'iga aylanadi.",
   "<b>Closing balance = opening balance + cash in − cash out.</b> Each month's closing balance becomes the next month's opening balance.", 'class="def"') +
 table([("", ""), ("Iyun", "Jun"), ("Iyul", "Jul"), ("Avgust", "Aug"), ("Sentyabr", "Sep"), ("Oktyabr", "Oct"), ("Noyabr", "Nov")], [
  [TD("<b>Boshlang'ich qoldiq</b>", "<b>Opening balance</b>"), TD("5 000", "5,000"), TD("−9 000", "−9,000", "r"), TD("−19 000", "−19,000", "r"), TD("−1 500", "−1,500", "r"), TD("12 500", "12,500"), TD("11 500", "11,500")],
  [TD("<b>+ Kirim</b> (sotuv)", "<b>+ Cash in</b> (sales)"), TD("4 000", "4,000"), TD("6 000", "6,000"), TD("30 000", "30,000", "g"), TD("22 000", "22,000", "g"), TD("7 000", "7,000"), TD("7 000", "7,000")],
  [TD("<b>− Chiqim</b>", "<b>− Cash out</b>"), TD("18 000", "18,000"), TD("16 000", "16,000"), TD("12 500", "12,500"), TD("8 000", "8,000"), TD("8 000", "8,000"), TD("8 000", "8,000")],
  [TD("<b>= Sof pul oqimi</b>", "<b>= Net cash flow</b>"), TD("−14 000", "−14,000", "r"), TD("−10 000", "−10,000", "r"), TD("+17 500", "+17,500", "g"), TD("+14 000", "+14,000", "g"), TD("−1 000", "−1,000"), TD("−1 000", "−1,000")],
  [TD("<b>Yakuniy qoldiq</b>", "<b>Closing balance</b>"), TD("<b>−9 000</b>", "<b>−9,000</b>", "r"), TD("<b>−19 000</b>", "<b>−19,000</b>", "r"), TD("<b>−1 500</b>", "<b>−1,500</b>", "r"), TD("<b>12 500</b>", "<b>12,500</b>", "g"), TD("<b>11 500</b>", "<b>11,500</b>", "g"), TD("<b>10 500</b>", "<b>10,500</b>", "g")]]) +
 '<div class="grid g3" style="margin-top:14px">' +
 stat("+5 500", "6 oylik jami sof oqim: biznes foydali", "6-month total net flow: the business is profitable", "") +
 stat("−19 000", "iyul oxiridagi eng chuqur nuqta", "the deepest point at the end of July", "o") +
 stat("3 oy", "qoldiq manfiy bo'lgan oylar (iyun–avgust)", "months with a negative balance (June–August)", "v") + '</div>' +
 E("div", "🧠 <b>Xulosa:</b> 6 oyda biznes 5,5 mln so'm ishlaydi, lekin yozda <b>19 mln so'mlik teshik</b> bor. Rejasiz egasi buni iyulda, mato puli to'lanmay qolganda biladi — rejali egasi esa may oyida yechim izlaydi.",
   "🧠 <b>Conclusion:</b> over 6 months the business earns 5.5 million so'm, but there is a <b>19 million so'm hole</b> in summer. Without a plan the owner discovers it in July, when the fabric cannot be paid for; with a plan they look for a solution in May.", 'class="quote" style="margin-top:12px"'))

# ============================ 9. KASSA UZILISHI ============================
slide("Kassa uzilishi", "The cash gap",
 E("span", "2.2 · Kassa uzilishi", "2.2 · The cash gap", 'class="kicker"') +
 E("h2", "Kassa uzilishi: <span class=\"grad\">qachon, qancha va nega?</span>", "The cash gap: <span class=\"grad\">when, how much and why?</span>") +
 E("div", "<b>Kassa uzilishi</b> — to'lovlarni amalga oshirish uchun pul yetmay qoladigan davr. Rejadagi <b>eng chuqur manfiy qoldiq</b> — sizga kerak bo'ladigan qo'shimcha mablag'ning eng kichik miqdori.",
   "A <b>cash gap</b> is a period when there is not enough money to make payments. The <b>deepest negative balance</b> in the plan is the minimum extra funding you will need.", 'class="def"') +
 '<div class="grid g2" style="margin-top:14px">' +
 '<div class="card" style="--c:var(--red)">' + E("h3", "📉 «Nafis»da uzilish qanday paydo bo'ldi?", "📉 How the gap appeared at “Nafis”") +
 '<ul class="tick">' + E("li", "Iyun–iyulda mato uchun <b>22 mln</b> to'landi, sotuv esa 10 mln.", "In June–July <b>22 million</b> was paid for fabric, while sales were 10 million.") +
 E("li", "Asosiy tushum (52 mln) avgust–sentyabrda keladi.", "The main income (52 million) arrives in August–September.") +
 E("li", "Boshlang'ich zaxira (5 mln) yetarli emas edi.", "The opening reserve (5 million) was not enough.") +
 E("li", "Natija: iyul oxirida <b>−19 mln</b>, avgust oxirida ham −1,5 mln.", "Result: <b>−19 million</b> at the end of July and still −1.5 million at the end of August.") + '</ul></div>' +
 '<div class="card" style="--c:var(--blue)">' + E("h3", "🧮 Qancha mablag' kerak?", "🧮 How much funding is needed?") +
 table(None, [
  [TD("Eng chuqur manfiy qoldiq", "Deepest negative balance"), TD("19 000", "19,000")],
  [TD("+ Xavfsizlik zaxirasi (kutilmagan xarajat)", "+ Safety reserve (unexpected costs)"), TD("3 000", "3,000")],
  [TD("<b>= Jalb qilinadigan mablag'</b>", "<b>= Funds to raise</b>"), TD("<b>22 000 ming so'm</b>", "<b>22,000 thousand so'm</b>", "g")],
  [TD("Kerak bo'ladigan muddat", "Period needed"), TD("Iyun → sentyabr (≈ 4 oy)", "June → September (≈ 4 months)")]]) + '</div></div>' +
 '<div class="grid g3" style="margin-top:14px">' +
 card("orange", "1️⃣", "Qachon?", "When?", "Qaysi oydan boshlanib, qaysi oyda tugaydi — bu manba muddatini belgilaydi.", "Which month it starts and ends — this sets the term of the source.") +
 card("violet", "2️⃣", "Qancha?", "How much?", "Eng chuqur nuqta + zaxira. Kamroq olsangiz, yana pul izlaysiz.", "The deepest point + a reserve. Take less and you will be looking for money again.") +
 card("green", "3️⃣", "Nega?", "Why?", "Sababini bilsangiz, uni qarzsiz ham kamaytirish yo'lini topasiz (keyingi slayd).", "Knowing the cause helps you shrink it even without a loan (next slide).") + '</div>')

# ============================ 10. UZILISHNI YOPISH ============================
slide("Kassa uzilishini yopish", "Closing the cash gap",
 E("span", "2.3 · Yechimlar", "2.3 · Solutions", 'class="kicker"') +
 E("h2", "Qarz olishdan oldin — <span class=\"grad\">uzilishni kichraytiring</span>", "Before borrowing, <span class=\"grad\">make the gap smaller</span>") +
 '<div class="grid g3">' +
 card("green", "📥", "Kirimni oldinga suring", "Bring cash in earlier", "Maktablar va do'konlardan <b>avans</b> so'rang; erta to'laganlarga kichik chegirma bering.", "Ask schools and shops for an <b>advance</b>; give a small discount for early payment.") +
 card("blue", "📤", "Chiqimni keyinga suring", "Push cash out later", "Mato yetkazib beruvchi bilan to'lovning bir qismini <b>keyinroq</b> to'lashni kelishing.", "Agree with the fabric supplier to pay part of the bill <b>later</b>.") +
 card("violet", "📦", "Zaxirani kamaytiring", "Hold less stock", "Matoni bir martada emas, buyurtmaga qarab <b>bosqichma-bosqich</b> oling.", "Buy fabric <b>in stages</b> to match orders instead of all at once.") + '</div>' +
 E("h3", "B ssenariy: 30% avans + mato to'lovining yarmi keyinga (ming so'm)", "Scenario B: a 30% advance + half the fabric bill deferred (thousand so'm)", 'style="margin-top:14px"') +
 table([("", ""), ("Iyun", "Jun"), ("Iyul", "Jul"), ("Avgust", "Aug"), ("Sentyabr", "Sep")], [
  [TD("Kirim", "Cash in"), TD("4 000", "4,000"), TD("6 000 + avans 9 000 = <b>15 000</b>", "6,000 + advance 9,000 = <b>15,000</b>", "g"), TD("30 000 − 9 000 = 21 000", "30,000 − 9,000 = 21,000"), TD("22 000", "22,000")],
  [TD("Chiqim", "Cash out"), TD("18 000", "18,000"), TD("16 000 − 5 000 = <b>11 000</b>", "16,000 − 5,000 = <b>11,000</b>", "g"), TD("12 500 + 5 000 = 17 500", "12,500 + 5,000 = 17,500"), TD("8 000", "8,000")],
  [TD("<b>Yakuniy qoldiq</b>", "<b>Closing balance</b>"), TD("<b>−9 000</b>", "<b>−9,000</b>", "r"), TD("<b>−5 000</b>", "<b>−5,000</b>"), TD("<b>−1 500</b>", "<b>−1,500</b>"), TD("<b>12 500</b>", "<b>12,500</b>", "g")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 stat("−19 000 → −9 000", "eng chuqur nuqta ikki baravardan ko'proq kamaydi", "the deepest point fell by more than half", "") +
 stat("22 000 → 12 000", "kerakli mablag' (zaxira bilan)", "funds needed (with the reserve)", "v") + '</div>' +
 E("small", "Kelishuvlarni (avans, to'lovni kechiktirish) <b>yozma</b> rasmiylashtiring va va'dani bajaring: yetkazib beruvchining ishonchi ham sizning «kapitalingiz».",
   "Put agreements (advances, deferred payments) <b>in writing</b> and keep your word: a supplier's trust is part of your “capital” too.", 'class="note"'))

# ============================ 11. AYLANMA MABLAG' ============================
slide("Debitor, kreditor va pul aylanish sikli", "Receivables, payables and the cash cycle",
 E("span", "3-blok · Aylanma pul", "Block 3 · Working capital", 'class="kicker"') +
 E("h2", "Pul biznesda <span class=\"grad\">necha kun «qamalib» qoladi?</span>", "How many days is money <span class=\"grad\">“locked up” in the business?</span>") +
 '<div class="grid g3">' +
 card("orange", "🧾", "Debitor qarz", "Receivables", "<b>Sizga</b> qarzdor bo'lganlar: nasiyaga olgan mijozlar. Bu pul hali sizning kassangizda emas.", "Those who owe <b>you</b>: customers who bought on credit. This money is not yet in your till.") +
 card("blue", "📑", "Kreditor qarz", "Payables", "<b>Siz</b> qarzdor bo'lganlar: hali to'lanmagan yetkazib beruvchi, ijara, ish haqi.", "Those <b>you</b> owe: suppliers, rent or wages not yet paid.") +
 card("violet", "📦", "Zaxira", "Inventory", "Omborda turgan mato, yarim tayyor va tayyor mahsulot — pul, faqat boshqa shaklda.", "Fabric, work in progress and finished goods in stock — money in another form.") + '</div>' +
 E("div", "<b>Pul aylanish sikli = zaxira kunlari + debitor kunlari − kreditor kunlari.</b> Bu — mato uchun pul to'lagan kundan mijozdan pul olgan kungacha bo'lgan davr.",
   "<b>Cash conversion cycle = inventory days + receivable days − payable days.</b> It is the period from paying for fabric to receiving money from the customer.", 'class="def" style="margin-top:14px"') +
 table([("", ""), ("Zaxira kunlari", "Inventory days"), ("Debitor kunlari", "Receivable days"), ("Kreditor kunlari", "Payable days"), ("Sikl", "Cycle")], [
  [TD("<b>Hozir</b>", "<b>Now</b>"), TD("30", "30"), TD("20", "20"), TD("15", "15"), TD("30 + 20 − 15 = <b>35 kun</b>", "30 + 20 − 15 = <b>35 days</b>", "r")],
  [TD("<b>Yaxshilangan</b>", "<b>Improved</b>"), TD("20 (bosqichli xarid)", "20 (staged buying)"), TD("10 (avans, eslatma)", "10 (advances, reminders)"), TD("25 (kelishuv)", "25 (agreement)"), TD("20 + 10 − 25 = <b>5 kun</b>", "20 + 10 − 25 = <b>5 days</b>", "g")]]) +
 E("div", "💡 Sikl qanchalik qisqa bo'lsa, biznesga shunchalik <b>kam aylanma pul</b> kerak bo'ladi. Siklni 30 kunga qisqartirish ko'pincha qarz olishdan arzonroq.",
   "💡 The shorter the cycle, the <b>less working capital</b> the business needs. Cutting the cycle by 30 days is often cheaper than taking a loan.", 'class="quote" style="margin-top:10px"'))

# ============================ 12. MABLAG' JALB QILISH ============================
slide("Mablag' jalb qilish", "Raising funds",
 E("span", "4-blok · Mablag' va himoya", "Block 4 · Funds and protection", 'class="kicker"') +
 E("h2", "Manbani <span class=\"grad\">ehtiyoj muddatiga</span> moslang", "Match the source <span class=\"grad\">to the length of the need</span>") +
 E("div", "<b>Qoida:</b> qisqa muddatli ehtiyoj (mavsumiy xomashyo) — <b>qisqa muddatli</b> manba bilan; uzoq muddatli ehtiyoj (uskuna) — <b>uzoq muddatli</b> manba bilan yopiladi. Aks holda yoki to'lovga pul yetmaydi, yoki ortiqcha foiz to'laysiz.",
   "<b>Rule:</b> a short-term need (seasonal raw materials) is covered with a <b>short-term</b> source; a long-term need (equipment) with a <b>long-term</b> source. Otherwise either repayment money runs out or you pay too much interest.", 'class="def"') +
 table([("Ehtiyoj", "Need"), ("Mos manba", "Fitting source"), ("Mos kelmaydigan manba", "Unsuitable source")], [
  [TD("<b>Mavsumiy kassa uzilishi</b> (3–4 oy)", "<b>A seasonal cash gap</b> (3–4 months)"), TD("Mijoz avansi, yetkazib beruvchi krediti, qisqa muddatli bank krediti yoki overdraft", "Customer advances, supplier credit, a short-term bank loan or an overdraft", "g"), TD("5 yillik kredit — mavsum tugagach ham foiz to'laysiz", "A 5-year loan — you keep paying interest after the season", "r")],
  [TD("<b>Uskuna xaridi</b> (5–7 yil ishlaydi)", "<b>Buying equipment</b> (works 5–7 years)"), TD("O'rta va uzoq muddatli kredit, lizing, investor, grant", "A medium- or long-term loan, leasing, an investor, a grant", "g"), TD("3 oylik qarz — uskuna hali pul topib ulgurmaydi", "A 3-month loan — the machine has not earned the money yet", "r")],
  [TD("<b>Yangi biznesni boshlash</b>", "<b>Starting a new business</b>"), TD("O'z jamg'armasi, oila, grant, investor (9-mavzu)", "Own savings, family, a grant, an investor (topic 9)", "g"), TD("Qimmat qisqa muddatli qarz", "Expensive short-term debt", "r")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card_ul("blue", "📋", "Mablag' so'rashdan oldin tayyorlang", "Prepare before asking for funds", [
  ("6–12 oylik <b>pul oqimi rejasi</b> (shu mavzudagi jadval).", "A 6–12-month <b>cash-flow plan</b> (the table from this topic)."),
  ("Pul <b>nimaga</b> va <b>qachon</b> sarflanadi — moddalar bo'yicha.", "<b>What</b> the money is for and <b>when</b> — item by item."),
  ("Qaytarish manbasi: <b>qaysi oydagi kirimdan</b> to'lanadi.", "Repayment source: <b>which month's income</b> will repay it."),
  ("Kafolat yoki garov, oldingi savdo tarixi.", "A guarantee or collateral, previous sales history.")], "clean") +
 card("orange", "🔗", "9-mavzu bilan bog'liqlik", "Link to topic 9", "Manbalarning afzalligi va xavfi 9-mavzuda batafsil ko'rilgan. Bu yerda asosiy savol: <b>qancha, qachon va qaysi kirimdan qaytariladi?</b>",
      "The pros and cons of each source were covered in topic 9. Here the key question is: <b>how much, when, and from which income will it be repaid?</b>") + '</div>')

# ============================ 13. QARZ NARXI ============================
slide("Qarz narxi va to'lov qobiliyati", "The cost of debt and ability to repay",
 E("span", "4.2 · Qarz", "4.2 · Debt", 'class="kicker"') +
 E("h2", "Qarz ham <span class=\"grad\">xarajat</span> — uni oldindan hisoblang", "Debt is <span class=\"grad\">a cost</span> too — calculate it in advance") +
 '<div class="grid g2">' +
 '<div class="card" style="--c:var(--blue)">' + E("h3", "🧮 Oddiy foiz hisobi (shartli)", "🧮 A simple-interest calculation (sample)") +
 E("p", "<b>Foiz = qarz × yillik stavka × (oylar ÷ 12)</b>", "<b>Interest = loan × annual rate × (months ÷ 12)</b>") +
 table(None, [
  [TD("Qarz", "Loan"), TD("12 000 000 so'm", "12,000,000 so'm")],
  [TD("Yillik stavka (shartli)", "Annual rate (sample)"), TD("24%", "24%")],
  [TD("Muddat", "Term"), TD("4 oy", "4 months")],
  [TD("<b>Foiz</b>", "<b>Interest</b>"), TD("12 000 000 × 24% × 4 ÷ 12 = <b>960 000</b>", "12,000,000 × 24% × 4 ÷ 12 = <b>960,000</b>", "r")],
  [TD("<b>Jami qaytariladi</b>", "<b>Total repaid</b>"), TD("<b>12 960 000 so'm</b>", "<b>12,960,000 so'm</b>")]]) +
 E("p", "B ssenariy tufayli 22 mln emas, 12 mln olinadi — foizda <b>800 000 so'm</b> tejaladi.", "Thanks to scenario B, 12 million is borrowed instead of 22 million — saving <b>800,000 so'm</b> in interest.", 'style="margin-top:8px"') + '</div>' +
 '<div class="card" style="--c:var(--green)">' + E("h3", "🛡 Qarzni qoplash koeffitsienti", "🛡 Debt service coverage") +
 E("p", "<b>Koeffitsient = oylik sof operatsion pul oqimi ÷ oylik qarz to'lovi</b>", "<b>Ratio = monthly net operating cash flow ÷ monthly loan payment</b>") +
 table([("Holat", "Case"), ("Hisob", "Calculation"), ("Natija", "Result")], [
  [TD("Xavfsiz", "Safe"), TD("5 000 000 ÷ 3 240 000", "5,000,000 ÷ 3,240,000"), TD("<b>≈ 1,5</b>", "<b>≈ 1.5</b>", "g")],
  [TD("Chegarada", "Borderline"), TD("3 600 000 ÷ 3 240 000", "3,600,000 ÷ 3,240,000"), TD("≈ 1,1", "≈ 1.1")],
  [TD("Xavfli", "Risky"), TD("2 500 000 ÷ 3 240 000", "2,500,000 ÷ 3,240,000"), TD("<b>≈ 0,8</b>", "<b>≈ 0.8</b>", "r")]]) +
 E("p", "Koeffitsient <b>1,25 dan past</b> bo'lsa, bir yomon oy to'lovni buzishi mumkin. 1 dan past — to'lovga pul yetmaydi.", "Below <b>1.25</b>, one bad month may break the repayment. Below 1, there is not enough money to pay.", 'style="margin-top:8px"') + '</div></div>' +
 E("small", "Stavka, komissiya, sug'urta va garov shartlari bank va mahsulotga qarab farq qiladi. Shartnomadagi <b>umumiy (to'liq) narxni</b> so'rang va bir nechta taklifni solishtiring.",
   "Rates, fees, insurance and collateral terms differ by bank and product. Ask for the <b>total (full) cost</b> in the contract and compare several offers.", 'class="note"'))

# ============================ 14. ZAXIRA ============================
slide("Zaxira va ssenariylar", "Reserves and scenarios",
 E("span", "4.3 · Himoya", "4.3 · Protection", 'class="kicker"') +
 E("h2", "Xavfsizlik yostiqchasi: <span class=\"grad\">yomon oyga tayyor turing</span>", "A safety cushion: <span class=\"grad\">be ready for a bad month</span>") +
 E("div", "<b>Zaxira jamg'arma</b> — faqat favqulodda holat uchun ajratilgan pul. Kichik biznes uchun mo'ljal: kamida <b>3 oylik doimiy xarajat</b>.",
   "A <b>reserve fund</b> is money set aside for emergencies only. A target for a small business: at least <b>3 months of fixed costs</b>.", 'class="def"') +
 '<div class="grid g3" style="margin-top:14px">' +
 stat("5,5 mln", "«Nafis»ning oylik doimiy xarajati (ish haqi + ijara)", "“Nafis” monthly fixed costs (wages + rent)") +
 stat("× 3", "oy — mo'ljal", "months — the target", "o") +
 stat("16,5 mln", "zaxira jamg'arma maqsadi", "the reserve fund target", "v") + '</div>' +
 E("h3", "Uch ssenariy: avgust–sentyabr sotuvi o'zgarsa (ming so'm)", "Three scenarios: if August–September sales change (thousand so'm)", 'style="margin-top:14px"') +
 table([("Ssenariy", "Scenario"), ("Avgust + sentyabr kirimi", "Aug + Sep cash in"), ("Noyabr oxiri qoldig'i", "End-of-November balance"), ("Nima qilinadi", "What to do")], [
  [TD("<b>😊 Yaxshi</b> (+20%)", "<b>😊 Good</b> (+20%)"), TD("62 400", "62,400"), TD("20 900", "20,900", "g"), TD("Ortiqchasini zaxiraga, keyin uskunaga", "Surplus to the reserve, then to equipment")],
  [TD("<b>😐 Asosiy</b>", "<b>😐 Base</b>"), TD("52 000", "52,000"), TD("10 500", "10,500"), TD("Reja bo'yicha", "As planned")],
  [TD("<b>😟 Yomon</b> (−20%)", "<b>😟 Bad</b> (−20%)"), TD("41 600", "41,600"), TD("100", "100", "r"), TD("Xarajatni qisqartirish, nasiyani yig'ish, zaxiradan foydalanish", "Cut costs, collect debts, use the reserve", "r")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("green", "✅", "Zaxirani qanday yig'ish?", "How to build the reserve", "Har oy tushumning 5–10% ini alohida hisobga o'tkazing. Yaxshi oylarda ko'proq. Zaxiradan olingan pulni birinchi imkoniyatda qaytaring.",
      "Move 5–10% of revenue to a separate account every month — more in good months. Return any money taken from the reserve at the first chance.") +
 card("orange", "📌", "Yomon ssenariyni ham hisoblang", "Calculate the bad scenario too", "Rejani faqat «hammasi yaxshi bo'ladi» deb tuzmang. Agar yomon ssenariyda ham qoldiq manfiy bo'lmasa — reja ishonchli.",
      "Do not plan only for “everything will be fine”. If the balance stays positive even in the bad case, the plan is reliable.") + '</div>')

# ============================ 15. PUL NAZORATI ============================
slide("Pul nazorati amaliyoti", "Cash control in practice",
 E("span", "4.4 · Kundalik tartib", "4.4 · Daily routine", 'class="kicker"') +
 E("h2", "Pulni boshqarishning <span class=\"grad\">7 ta odati</span>", "<span class=\"grad\">7 habits</span> of managing cash") +
 '<div class="grid g2">' +
 card_ul("green", "📒", "Har kuni va har hafta", "Every day and every week", [
  ("<b>Biznes va shaxsiy pulni ajrating:</b> alohida karta yoki hisob.", "<b>Separate business and personal money:</b> a separate card or account."),
  ("Har bir kirim va chiqimni <b>shu kuni</b> yozing (daftar yoki jadval).", "Record every inflow and outflow <b>the same day</b> (a notebook or a table)."),
  ("Har <b>dushanba</b>: qoldiq, qarzdorlar ro'yxati, shu hafta to'lovlari.", "Every <b>Monday</b>: the balance, the debtor list, this week's payments."),
  ("Egasining maoshini belgilang — kassadan «kerak bo'lganda» olmang.", "Set the owner's salary — do not take from the till “when needed”.")], "tick") +
 card_ul("blue", "📅", "Har oy va har chorak", "Every month and every quarter", [
  ("Reja va fakt pul oqimini <b>solishtiring</b>: qayerda farq bor va nega?", "<b>Compare</b> planned and actual cash flow: where is the difference and why?"),
  ("Rejani <b>keyingi 3–6 oyga</b> uzaytiring (sirg'aluvchi reja).", "Extend the plan <b>3–6 months ahead</b> (a rolling plan)."),
  ("Soliq va qarz to'lovlari sanasini <b>oldindan</b> kalendarga qo'ying.", "Put tax and loan payment dates on the calendar <b>in advance</b>.")], "tick") + '</div>' +
 E("h3", "Haftalik pul hisoboti (namuna)", "A weekly cash report (sample)", 'style="margin-top:14px"') +
 table([("Ko'rsatkich", "Item"), ("Summa", "Amount"), ("Izoh", "Note")], [
  [TD("Hafta boshidagi qoldiq", "Balance at the start of the week"), TD("3 200 000", "3,200,000"), TD("Karta + kassa", "Card + till")],
  [TD("Kutilayotgan kirim", "Expected cash in"), TD("+4 500 000", "+4,500,000", "g"), TD("Shundan 2 mln — maktab avansi", "Of which 2 million is a school advance")],
  [TD("Rejadagi chiqim", "Planned cash out"), TD("−5 100 000", "−5,100,000", "r"), TD("Mato 3 mln, ish haqi 2 mln, boshqa 0,1 mln", "Fabric 3 million, wages 2 million, other 0.1 million")],
  [TD("<b>Hafta oxiri qoldig'i (prognoz)</b>", "<b>End-of-week balance (forecast)</b>"), TD("<b>2 600 000</b>", "<b>2,600,000</b>"), TD("Zaxiradan past emas — xavfsiz", "Not below the reserve — safe", "g")]]) +
 E("small", "Hisob-kitob va soliq hisobotini yuritish talablari biznes shakliga bog'liq. Amaldagi qoidalarni soliq xizmati va lex.uz orqali yoki buxgalter bilan aniqlang.",
   "Bookkeeping and tax reporting requirements depend on the business form. Confirm current rules via the tax service and lex.uz or with an accountant.", 'class="note"'))

# ============================ 16. AMALIY TOPSHIRIQ ============================
slide("Amaliy topshiriq", "Practical task",
 E("span", "Amaliy mashg'ulot · 2 soat", "Practical class · 2 hours", 'class="kicker"') +
 E("h2", "«6 oylik <span class=\"grad\">pul oqimi rejasi»</span>", "The “6-month <span class=\"grad\">cash-flow plan”</span>") +
 E("p", "Har bir talaba (yoki 2 kishilik guruh) o'z biznesi uchun 6 oylik pul oqimi rejasini tuzib, kassa uzilishini topadi va yopish rejasini asoslaydi.", "Each student (or a pair) builds a 6-month cash-flow plan for their own business, finds the cash gap and justifies a plan to close it.", 'class="lead"') +
 '<div class="grid g2"><div class="card" style="--c:var(--blue)">' + E("h3", "⏱ 120 daqiqalik reja", "⏱ The 120-minute plan") +
 table([("Vaqt", "Time"), ("Nima qilinadi", "What to do")], [
  [TD("0–20", "0–20"), TD("Kirim manbalari va to'lov turlari, qachon tushishi", "Income sources, payment types and when money arrives")],
  [TD("20–45", "20–45"), TD("Chiqimlar kalendari: doimiy, o'zgaruvchan, mavsumiy, bir martalik", "A spending calendar: fixed, variable, seasonal, one-off")],
  [TD("45–70", "45–70"), TD("6 oylik jadval: qoldiq, kirim, chiqim, sof oqim", "The 6-month table: balance, in, out, net flow")],
  [TD("70–90", "70–90"), TD("Kassa uzilishi va B ssenariy (avans, kechiktirish)", "The cash gap and scenario B (advances, deferrals)")],
  [TD("90–105", "90–105"), TD("Mablag' ehtiyoji, foiz va qoplash koeffitsienti", "Funding need, interest and coverage ratio")],
  [TD("105–120", "105–120"), TD("Himoya va o'zaro baholash", "Defence and peer assessment")]]) + '</div>' +
 '<div><div class="card" style="--c:var(--green)">' + E("h3", "📋 Rejada bo'lishi shart", "📋 The plan must contain") +
 '<ul class="clean">' + E("li", "Kirim va chiqimlar ro'yxati, to'lov sanalari bilan", "A list of inflows and outflows with payment dates") +
 E("li", "6 oylik jadval va oylik yakuniy qoldiq", "A 6-month table and the monthly closing balance") +
 E("li", "Kassa uzilishi: qachon, qancha, nega", "The cash gap: when, how much, why") +
 E("li", "Uzilishni kichraytirishning kamida 2 usuli", "At least 2 ways to shrink the gap") +
 E("li", "Mablag' manbasi, summa, muddat va foiz", "Funding source, amount, term and interest") +
 E("li", "Yaxshi, asosiy va yomon ssenariy", "Good, base and bad scenarios") + '</ul></div>' +
 '<div class="card" style="--c:var(--amber);margin-top:12px">' + E("h3", "🏅 Baholash", "🏅 Assessment") +
 E("p", "Jadval to'g'riligi <b>35%</b> · uzilish tahlili <b>25%</b> · yechim va manba asosi <b>25%</b> · himoya <b>15%</b>.", "Accuracy of the table <b>35%</b> · gap analysis <b>25%</b> · solution and source rationale <b>25%</b> · defence <b>15%</b>.") + '</div></div></div>')

# ============================ 17. XULOSA ============================
slide("Xulosa va resurslar", "Summary and resources",
 E("span", "Xulosa · Mustaqil ish · Havolalar", "Summary · Independent work · Links", 'class="kicker"') +
 E("h2", "Yakuniy <span class=\"grad\">xulosa</span> va <span class=\"grad\">foydali resurslar</span>", "The final <span class=\"grad\">summary</span> and <span class=\"grad\">useful resources</span>") +
 '<div class="grid g2"><div>' +
 card_ul("green", "📌", "Esda qoladigan 6 ta fikr", "6 things to remember", [
  ("<b>Foyda ≠ pul:</b> biznes ko'pincha pul tugashidan to'xtaydi.", "<b>Profit ≠ cash:</b> businesses usually stop when cash runs out."),
  ("Pul oqimi <b>3 turda</b>: operatsion, investitsion, moliyaviy; asosiy pul operatsiondan kelsin.", "Cash flow has <b>3 types</b>: operating, investing, financing; the main money should come from operations."),
  ("Yakuniy qoldiq = <b>boshlang'ich + kirim − chiqim</b>; kirim pul tushgan kuni yoziladi.", "Closing balance = <b>opening + in − out</b>; income is recorded when cash arrives."),
  ("Eng chuqur manfiy qoldiq + zaxira = <b>kerakli mablag'</b>.", "The deepest negative balance + a reserve = <b>the funds needed</b>."),
  ("Qarzdan oldin: <b>avans, kechiktirish, kam zaxira</b> — siklni qisqartiring.", "Before borrowing: <b>advances, deferrals, lower stock</b> — shorten the cycle."),
  ("Qisqa ehtiyojga qisqa manba; qoplash koeffitsienti ≥ 1,25; zaxira ≥ 3 oylik doimiy xarajat.", "Short needs, short sources; coverage ≥ 1.25; reserve ≥ 3 months of fixed costs.")]) +
 '<div class="card" style="--c:var(--amber);margin-top:12px">' + E("h3", "📓 Mustaqil ish: «4 haftalik pul kundaligi»", "📓 Independent work: “A 4-week cash diary”") +
 '<ul class="clean">' + E("li", "4 hafta davomida (shaxsiy yoki biznes) har bir kirim va chiqimni yozing.", "For 4 weeks record every inflow and outflow (personal or business).") +
 E("li", "Ularni operatsion, investitsion va moliyaviy turlarga ajrating.", "Split them into operating, investing and financing.") +
 E("li", "Haftalik qoldiq va keyingi oy prognozini tuzing.", "Make weekly balances and a forecast for next month.") +
 E("li", "Xulosa: qayerda pul «oqib ketyapti» va nima o'zgartirasiz?", "Conclusion: where is money “leaking” and what will you change?") + '</ul>' +
 E("p", "Hajmi: 1–2 bet + jadval. Baholash: yozuvlar to'liqligi 40% · tahlil 30% · asoslangan xulosa 30%.", "Size: 1–2 pages + a table. Marking: completeness of records 40% · analysis 30% · reasoned conclusion 30%.", 'style="font-size:13.5px;color:var(--muted)"') + '</div></div>' +
 '<div><div class="card" style="--c:var(--blue)">' + E("h3", "🔗 Foydali resurslar", "🔗 Useful resources") +
 E("p", "<b>Qonun va rasmiy manbalar:</b>", "<b>Law and official sources:</b>") +
 '<ul class="clean">' +
 E("li", '<a class="lnk" href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> — buxgalteriya hisobi, soliq va kredit munosabatlari qonunlari', '<a class="lnk" href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> — laws on accounting, tax and lending') +
 E("li", '<a class="lnk" href="https://cbu.uz" target="_blank" rel="noopener">cbu.uz</a> — Markaziy bank: asosiy stavka, moliyaviy savodxonlik', '<a class="lnk" href="https://cbu.uz" target="_blank" rel="noopener">cbu.uz</a> — the Central Bank: policy rate, financial literacy') +
 E("li", '<a class="lnk" href="https://soliq.uz" target="_blank" rel="noopener">soliq.uz</a> — soliq xizmati: soliq turlari va muddatlari', '<a class="lnk" href="https://soliq.uz" target="_blank" rel="noopener">soliq.uz</a> — the tax service: tax types and deadlines') +
 E("li", '<a class="lnk" href="https://stat.uz" target="_blank" rel="noopener">stat.uz</a> — rasmiy statistika', '<a class="lnk" href="https://stat.uz" target="_blank" rel="noopener">stat.uz</a> — official statistics') + '</ul>' +
 E("p", "<b>Bepul vositalar:</b>", "<b>Free tools:</b>", 'style="margin-top:8px"') +
 E("p", '<a class="lnk" href="https://docs.google.com" target="_blank" rel="noopener">docs.google.com</a> — pul oqimi jadvali (Google Sheets) · telefon kalendari — to\'lov sanalari eslatmasi',
   '<a class="lnk" href="https://docs.google.com" target="_blank" rel="noopener">docs.google.com</a> — cash-flow spreadsheet (Google Sheets) · phone calendar — payment-date reminders') +
 E("p", "<b>O'qish uchun:</b> Mike Michalowicz — «Profit First» · Karen Berman, Joe Knight — «Financial Intelligence for Entrepreneurs».", "<b>Further reading:</b> Mike Michalowicz — “Profit First” · Karen Berman, Joe Knight — “Financial Intelligence for Entrepreneurs”.", 'style="margin-top:8px"') +
 E("small", "⚠️ Foiz stavkalari, soliq va kredit shartlari o'zgaradi. Har doim amaldagi rasmiy ma'lumotga tayaning.", "⚠️ Interest rates, taxes and loan terms change. Always rely on current official information.", 'class="note"') +
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
 E("p", "Keyingi mashg'ulotgacha <b>6 oylik pul oqimi rejasini</b> tugallang — keyingi mavzu: biznesda foyda va zarar tahlili.",
   "Before the next class, finish your <b>6-month cash-flow plan</b> — the next topic: profit and loss analysis in a business.") +
 E("p", "Termiz davlat universiteti · Tadbirkorlik asoslari", "Termez State University · Fundamentals of Entrepreneurship", 'style="color:var(--muted);font-size:13.5px"') + '</div>')

# ============================ TEST SAVOLLARI ============================
Q = [
 # 1 — foyda ≠ pul (to'g'ri: B)
 dict(q="Hisobotda foyda bor, lekin biznesning kassasida to'lov uchun pul yo'q. Buning eng ehtimolli sababi nima?",
      a=["Buxgalter foydani noto'g'ri hisoblagan, aslida biznes zararda",
         "Sotuv nasiyaga bo'lgan yoki pul xarajatlardan keyinroq kelmoqda",
         "Foyda hisobotga kiritilgach, pul avtomatik ravishda bankda qoladi",
         "Biznesda pul ko'p bo'lsa, foyda doim kamroq ko'rinib qolar ekan"], c=1,
      e="Foyda sotuv bo'lgan davrda hisoblanadi, pul esa haqiqatan tushganda keladi. Nasiya va oldindan to'langan xarajatlar foyda bor paytda ham kassani bo'shatib qo'yadi.",
      qe="The report shows a profit, but the business has no cash in the till for payments. What is the most likely reason?",
      ae=["The accountant made a mistake; in fact the business is at a loss",
         "Sales were on credit or the cash arrives later than the spending",
         "Once profit is reported, the money automatically stays in the bank",
         "When a business has a lot of cash, its profit always looks smaller"],
      ee="Profit is counted in the period of the sale, while cash comes when it actually arrives. Credit sales and costs paid in advance can empty the till even while there is a profit."),
 # 2 — investitsion (to'g'ri: D)
 dict(q="Yangi tikuv mashinasini sotib olish uchun to'langan pul pul oqimining qaysi turiga kiradi?",
      a=["Operatsion faoliyat — chunki u kundalik ishlab chiqarishga kerak",
         "Moliyaviy faoliyat — chunki pul bankdagi hisobdan to'langan edi",
         "Hech qaysi turga kirmaydi, chunki uskuna pul emas, mol-mulkdir",
         "Investitsion faoliyat — chunki u uzoq muddat ishlaydigan aktivdir"], c=3,
      e="Uzoq muddat foydalaniladigan aktiv (uskuna, mashina, bino) xaridi — investitsion faoliyat. Operatsion faoliyat — kundalik xarajatlar, moliyaviy — kredit va investor puli.",
      qe="Money paid to buy a new sewing machine belongs to which type of cash flow?",
      ae=["Operating activity — because it is needed for daily production",
         "Financing activity — because it was paid from a bank account",
         "It belongs to no type, since equipment is property, not money",
         "Investing activity — because it is an asset used for many years"],
      ee="Buying a long-term asset (equipment, a vehicle, a building) is an investing activity. Operating means daily costs; financing means loans and investor money."),
 # 3 — moliyaviy (to'g'ri: A)
 dict(q="Quyidagilardan qaysi biri moliyaviy faoliyat bo'yicha pul kirimi hisoblanadi?",
      a=["Bankdan olingan kredit pulining hisobga tushishi",
         "Do'kondan nasiyaga olingan mahsulot uchun to'lov",
         "Mijozdan maktab formasi uchun olingan avans puli",
         "Eski tikuv mashinasini sotishdan tushgan mablag'"], c=0,
      e="Kredit, investor ulushi va grant — moliyaviy kirim. Mijoz to'lovi va avansi operatsion kirim, eski uskunani sotish esa investitsion kirim hisoblanadi.",
      qe="Which of the following is a cash inflow from financing activities?",
      ae=["A bank loan arriving in the business's account",
         "Payment from a shop for goods taken on credit",
         "A customer's advance paid for school uniforms",
         "Money from the sale of an old sewing machine"],
      ee="Loans, investor money and grants are financing inflows. Customer payments and advances are operating inflows; selling old equipment is an investing inflow."),
 # 4 — sof oqim (to'g'ri: C)
 dict(q="Oy davomida kirim 12 000 000 so'm, chiqim 15 500 000 so'm bo'ldi. Sof pul oqimi qancha?",
      a=["+3 500 000 so'm", "−2 500 000 so'm", "−3 500 000 so'm", "+27 500 000 so'm"], c=2,
      e="Sof pul oqimi = kirim − chiqim = 12 000 000 − 15 500 000 = −3 500 000 so'm.",
      qe="During the month cash in was 12,000,000 so'm and cash out 15,500,000 so'm. What is the net cash flow?",
      ae=["+3,500,000 so'm", "−2,500,000 so'm", "−3,500,000 so'm", "+27,500,000 so'm"],
      ee="Net cash flow = cash in − cash out = 12,000,000 − 15,500,000 = −3,500,000 so'm."),
 # 5 — yakuniy qoldiq (to'g'ri: B)
 dict(q="Oy boshida qoldiq 4 000 000, kirim 20 000 000, chiqim 17 000 000 so'm. Oy oxiridagi qoldiq qancha?",
      a=["3 000 000 so'm", "7 000 000 so'm", "21 000 000 so'm", "41 000 000 so'm"], c=1,
      e="Yakuniy qoldiq = boshlang'ich + kirim − chiqim = 4 000 000 + 20 000 000 − 17 000 000 = 7 000 000 so'm.",
      qe="The opening balance is 4,000,000, cash in 20,000,000 and cash out 17,000,000 so'm. What is the closing balance?",
      ae=["3,000,000 so'm", "7,000,000 so'm", "21,000,000 so'm", "41,000,000 so'm"],
      ee="Closing balance = opening + in − out = 4,000,000 + 20,000,000 − 17,000,000 = 7,000,000 so'm."),
 # 6 — kassa uzilishi (to'g'ri: D)
 dict(q="«Kassa uzilishi» tushunchasi nimani bildiradi?",
      a=["Kassa apparatining texnik nosozlik tufayli ishlamay qolishini",
         "Oyning oxirida kassadagi pulni bankka topshirish jarayonini",
         "Bir yil davomida biznes zarar bilan ishlaganini bildiradi",
         "To'lovlarni qilishga pul yetmay qoladigan davrni bildiradi"], c=3,
      e="Kassa uzilishi — biznes umuman foydali bo'lsa ham, ma'lum davrda to'lovlarga pul yetmay qolishi. Rejadagi eng chuqur manfiy qoldiq uning hajmini ko'rsatadi.",
      qe="What does the term “cash gap” mean?",
      ae=["The cash register stops working because of a technical fault",
          "The process of taking the till's cash to the bank at month-end",
          "It means the business worked at a loss throughout a whole year",
          "It means a period when there is not enough money for payments"],
      ee="A cash gap is a period when there is not enough money for payments, even if the business is profitable overall. The deepest negative balance in the plan shows its size."),
 # 7 — mos manba (to'g'ri: A)
 dict(q="Mavsum oldidan 3 oylik pul yetishmovchiligini yopish uchun qaysi yo'l eng mos keladi?",
      a=["Mijoz avansi va qisqa muddatli manba bilan yopib, mavsumda qaytarish",
         "5 yillik uzoq muddatli kredit olib, har oy kam-kamdan to'lab borish",
         "Asosiy tikuv mashinasini sotib, pulni xomashyoga sarflab yuborish",
         "Barcha xodimlarni mavsumgacha ishdan bo'shatib, so'ng qayta olish"], c=0,
      e="Qisqa muddatli ehtiyoj qisqa muddatli manba bilan yopiladi: avans, yetkazib beruvchi krediti yoki qisqa kredit mavsum tushumidan qaytariladi. Uzoq kredit ortiqcha foizga olib keladi.",
      qe="Which way best covers a 3-month cash shortage before the season?",
      ae=["Use advances and a short-term source, repaid from season income",
         "Take a 5-year loan and repay it in small amounts every month",
         "Sell the main sewing machine to spend the money on materials",
         "Lay off all staff until the season and then hire them all again"],
      ee="A short-term need is covered by a short-term source: advances, supplier credit or a short loan repaid from season income. A long loan leads to unnecessary interest."),
 # 8 — pul aylanish sikli (to'g'ri: C)
 dict(q="Zaxira 40 kun turadi, mijozlar 25 kunda to'laydi, yetkazib beruvchiga 30 kunda to'lanadi. Pul aylanish sikli necha kun?",
      a=["15 kun", "25 kun", "35 kun", "95 kun"], c=2,
      e="Sikl = zaxira kunlari + debitor kunlari − kreditor kunlari = 40 + 25 − 30 = 35 kun.",
      qe="Stock is held for 40 days, customers pay in 25 days and the supplier is paid in 30 days. How many days is the cash conversion cycle?",
      ae=["15 days", "25 days", "35 days", "95 days"],
      ee="Cycle = inventory days + receivable days − payable days = 40 + 25 − 30 = 35 days."),
 # 9 — debitor qarz (to'g'ri: B)
 dict(q="«Debitor qarz» deganda nima tushuniladi?",
      a=["Biznes yetkazib beruvchiga hali to'lamagan pul",
         "Mijozlarning biznesga hali to'lanmagan qarzlari",
         "Bankdan olingan va hali qaytarilmagan kredit",
         "Egasi biznesdan shaxsiy ehtiyoj uchun olgan pul"], c=1,
      e="Debitor qarz — sizga qarzdorlar (nasiyaga olgan mijozlar). Siz yetkazib beruvchiga qarzdor bo'lsangiz, bu kreditor qarz.",
      qe="What is meant by “receivables”?",
      ae=["Money the business still owes its suppliers",
         "Money that customers still owe the business",
         "A bank loan that has not been repaid yet",
         "Money the owner took out for personal needs"],
      ee="Receivables are what others owe you (customers who bought on credit). When you owe a supplier, that is a payable."),
 # 10 — foiz (to'g'ri: A)
 dict(q="10 000 000 so'm qarz yillik 24% oddiy foiz bilan 6 oyga olindi. Foiz summasi qancha?",
      a=["1 200 000 so'm", "2 400 000 so'm", "600 000 so'm", "1 440 000 so'm"], c=0,
      e="Foiz = qarz × yillik stavka × (oylar ÷ 12) = 10 000 000 × 24% × 6 ÷ 12 = 1 200 000 so'm.",
      qe="A loan of 10,000,000 so'm is taken for 6 months at 24% simple annual interest. What is the interest?",
      ae=["1,200,000 so'm", "2,400,000 so'm", "600,000 so'm", "1,440,000 so'm"],
      ee="Interest = loan × annual rate × (months ÷ 12) = 10,000,000 × 24% × 6 ÷ 12 = 1,200,000 so'm."),
 # 11 — qoplash koeffitsienti (to'g'ri: B)
 dict(q="Oylik sof operatsion pul oqimi 2 500 000, oylik kredit to'lovi 2 000 000 so'm. Qarzni qoplash koeffitsienti qancha?",
      a=["0,80", "1,25", "1,50", "2,00"], c=1,
      e="Koeffitsient = 2 500 000 ÷ 2 000 000 = 1,25. Bu tavsiya etilgan quyi chegarada — bir yomon oy to'lovni qiyinlashtirishi mumkin.",
      qe="Monthly net operating cash flow is 2,500,000 and the monthly loan payment is 2,000,000 so'm. What is the debt service coverage ratio?",
      ae=["0.80", "1.25", "1.50", "2.00"],
      ee="Ratio = 2,500,000 ÷ 2,000,000 = 1.25. This is at the recommended lower limit — one bad month could make payment difficult."),
 # 12 — zaxira (to'g'ri: D)
 dict(q="Oylik doimiy xarajat 4 000 000 so'm. 3 oylik xavfsizlik zaxirasi qancha bo'lishi kerak?",
      a=["4 000 000 so'm", "6 000 000 so'm", "8 000 000 so'm", "12 000 000 so'm"], c=3,
      e="Zaxira = oylik doimiy xarajat × 3 = 4 000 000 × 3 = 12 000 000 so'm.",
      qe="Monthly fixed costs are 4,000,000 so'm. How big should a 3-month safety reserve be?",
      ae=["4,000,000 so'm", "6,000,000 so'm", "8,000,000 so'm", "12,000,000 so'm"],
      ee="Reserve = monthly fixed costs × 3 = 4,000,000 × 3 = 12,000,000 so'm."),
 # 13 — pulni ajratish (to'g'ri: C)
 dict(q="Nega biznes pulini shaxsiy puldan alohida (alohida karta yoki hisobda) saqlash tavsiya etiladi?",
      a=["Chunki shaxsiy kartada biznes pulini saqlash har doim jarimaga olib keladi",
         "Chunki alohida hisobdagi pul bankda hech qachon foiz to'lamaydi va tejaladi",
         "Chunki shundagina biznesning haqiqiy kirim, chiqim va foydasi ko'rinadi",
         "Chunki egasi biznes pulidan o'ziga hech qachon maosh ololmaydigan bo'ladi"], c=2,
      e="Pul aralashsa, biznes qancha ishlayotgani va qayerga pul ketayotganini ko'rib bo'lmaydi. Alohida hisob — aniq hisob-kitob va to'g'ri qarorlar asosi.",
      qe="Why is it recommended to keep business money separate from personal money (a separate card or account)?",
      ae=["Because keeping business money on a personal card always leads to a fine",
         "Because money in a separate account never pays bank fees and is saved",
         "Because only then are the business's real income, costs and profit clear",
         "Because then the owner can never take a salary from the business money"],
      ee="When money is mixed you cannot see how much the business earns or where money goes. A separate account is the basis of accurate records and good decisions."),
 # 14 — mablag' ehtiyoji (to'g'ri: B)
 dict(q="Rejadagi eng chuqur manfiy qoldiq 15 000 000 so'm, kutilmagan xarajat uchun zaxira 3 000 000 so'm. Qancha mablag' jalb qilish kerak?",
      a=["12 000 000 so'm", "18 000 000 so'm", "15 000 000 so'm", "45 000 000 so'm"], c=1,
      e="Jalb qilinadigan mablag' = eng chuqur manfiy qoldiq + zaxira = 15 000 000 + 3 000 000 = 18 000 000 so'm.",
      qe="The deepest negative balance in the plan is 15,000,000 so'm and the reserve for unexpected costs is 3,000,000 so'm. How much funding should be raised?",
      ae=["12,000,000 so'm", "18,000,000 so'm", "15,000,000 so'm", "45,000,000 so'm"],
      ee="Funds to raise = deepest negative balance + reserve = 15,000,000 + 3,000,000 = 18,000,000 so'm."),
 # 15 — kreditor qarz (to'g'ri: D)
 dict(q="Yetkazib beruvchi bilan to'lovni 30 kunga kechiktirishni kelishish pul oqimiga qanday ta'sir qiladi?",
      a=["Mahsulot tannarxi kamayadi, chunki kechiktirilgan to'lov arzonroq",
         "Biznes foydasi shu oyning o'zida avtomatik ravishda ikki marta oshadi",
         "Hech qanday ta'sir qilmaydi, chunki to'lov summasi o'zgarmay qoladi",
         "Pul aylanish sikli qisqaradi va aylanma pulga ehtiyoj kamayib qoladi"], c=3,
      e="Kreditor kunlari oshsa, pul aylanish sikli qisqaradi: pul biznesda uzoqroq qoladi, kassa uzilishi kamayadi. Lekin kelishilgan muddatda to'lash — ishonch sharti.",
      qe="How does agreeing to pay a supplier 30 days later affect cash flow?",
      ae=["The cost of the product falls, because a deferred payment is cheaper",
         "The business's profit automatically doubles in that very same month",
         "It has no effect at all, because the amount to be paid stays the same",
         "The cash conversion cycle shortens and less working capital is needed"],
      ee="More payable days shorten the cash conversion cycle: money stays in the business longer and the cash gap shrinks. But paying on the agreed date is a condition of trust."),
]
