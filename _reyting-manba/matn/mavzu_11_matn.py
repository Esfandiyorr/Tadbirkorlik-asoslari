# -*- coding: utf-8 -*-
"""M11 · Mahsulot narxini shakllantirish — slaydlar va test (yangi_mavzu.py uchun).
T, d, slide — yangi_mavzu.py beradi.  Ishlatish:
  python3 _reyting-manba/yangi_mavzu.py _reyting-manba/matn/mavzu_11_matn.py mavzu-11.html "Mahsulot narxini shakllantirish" 11
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
 E("span", "M11-mavzu · Amaliy mashg'ulot · 2 soat", "Topic 11 · Practical class · 2 hours", 'class="kicker"') +
 E("h1", "MAHSULOT NARXINI SHAKLLANTIRISH", "PRICING A PRODUCT", 'class="grad"') +
 E("p", "Narx «ko'z bilan» qo'yilmaydi · <b>tannarx, raqobat va mijoz qiymati</b> · ustama va marja farqi · narx strategiyalari · chegirma tuzog'i · narxni oshirish va kanal bo'yicha narx.",
   "A price is not set “by eye” · <b>cost, competition and customer value</b> · the difference between markup and margin · pricing strategies · the discount trap · raising prices and pricing by channel.", 'class="lead"') +
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
 E("div", "Maqsad: talaba o'z mahsuloti uchun narxni <b>hisob-kitob asosida</b> belgilashni — xarajatni qoplaydigan, mijoz to'lashga tayyor va raqobatda yashay oladigan narxni topishni o'rganadi.",
   "Aim: the student learns to set a price for their own product <b>on the basis of calculation</b> — a price that covers costs, that customers are willing to pay and that survives competition.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("green", "🧾", "Tannarxni hisoblaydi", "Calculates unit cost", "O'zgaruvchan va doimiy xarajatni ajratib, bitta mahsulotning to'liq tannarxini topadi.", "Separates variable and fixed costs and finds the full cost of one unit.") +
 card("blue", "➕", "Ustama va marjani farqlaydi", "Tells markup from margin", "Bir xil foydani ustama va marja sifatida to'g'ri hisoblaydi va adashmaydi.", "Calculates the same profit correctly as a markup and as a margin without mixing them up.") +
 card("violet", "🔭", "Bozorni o'rganadi", "Studies the market", "Raqobatchilar narxini va mijoz to'lashga tayyor oraliqni aniqlaydi.", "Finds competitors' prices and the range customers are willing to pay.") +
 card("orange", "♟", "Strategiya tanlaydi", "Chooses a strategy", "Kirish, qaymoq olish, qiymatga asoslangan va boshqa strategiyalardan mosini tanlaydi.", "Chooses a fitting strategy: penetration, skimming, value-based and others.") +
 card("pink", "🏷", "Chegirmani hisoblaydi", "Calculates discounts", "Chegirma foydani qanchaga kamaytirishini va qancha ko'p sotish kerakligini hisoblaydi.", "Calculates how much a discount cuts profit and how many more sales it requires.") +
 card("cyan", "🔄", "Narxni boshqaradi", "Manages the price", "Narxni oshirish, kanal va mijoz turiga qarab narx belgilashni rejalashtiradi.", "Plans price rises and sets prices by channel and customer type.") +
 '</div>')

# ============================ 3. REJA ============================
slide("Reja va tushunchalar", "Plan and concepts",
 E("span", "Mashg'ulot rejasi", "Class plan", 'class="kicker"') +
 E("h2", "Bugungi <span class=\"grad\">4 ta blok</span>", "Today's <span class=\"grad\">4 blocks</span>") +
 '<div class="grid g4">' +
 card("green", "1️⃣", "Narx asoslari", "Price basics", "Narxning 3 chegarasi, tannarx, ustama va marja.", "The 3 limits of a price, unit cost, markup and margin.") +
 card("blue", "2️⃣", "Bozor va mijoz", "Market and customer", "Raqobatchilar narxi, mijoz qiymati, narx strategiyalari.", "Competitors' prices, customer value, pricing strategies.") +
 card("violet", "3️⃣", "Raqamlar", "The numbers", "Zararsiz nuqta, chegirma tuzog'i, narxni oshirish.", "Break-even point, the discount trap, raising prices.") +
 card("orange", "4️⃣", "Amaliyot", "Practice", "Kanal bo'yicha narx, narx belgilash algoritmi, halollik.", "Pricing by channel, a pricing algorithm, honesty.") +
 '</div>' + E("h3", "🔑 Tayanch tushunchalar", "🔑 Key concepts", 'style="margin-top:22px"') +
 E("div",
   '<span class="pill g">tannarx</span><span class="pill">o\'zgaruvchan xarajat</span><span class="pill">doimiy xarajat</span><span class="pill g">to\'liq tannarx</span>'
   '<span class="pill g">ustama (markup)</span><span class="pill g">marja</span><span class="pill">hissa (narx − o\'zgaruvchan xarajat)</span><span class="pill">zararsiz nuqta</span>'
   '<span class="pill">raqobatchi narxi</span><span class="pill g">mijoz qiymati</span><span class="pill">kirish strategiyasi</span><span class="pill">qaymoq olish</span>'
   '<span class="pill">psixologik narx</span><span class="pill">langar narx</span><span class="pill g">chegirma</span><span class="pill">narx elastikligi</span>'
   '<span class="pill">ulgurji va chakana narx</span><span class="pill">komissiya</span>',
   '<span class="pill g">unit cost</span><span class="pill">variable cost</span><span class="pill">fixed cost</span><span class="pill g">full cost</span>'
   '<span class="pill g">markup</span><span class="pill g">margin</span><span class="pill">contribution (price − variable cost)</span><span class="pill">break-even point</span>'
   '<span class="pill">competitor price</span><span class="pill g">customer value</span><span class="pill">penetration strategy</span><span class="pill">skimming</span>'
   '<span class="pill">psychological price</span><span class="pill">anchor price</span><span class="pill g">discount</span><span class="pill">price elasticity</span>'
   '<span class="pill">wholesale and retail price</span><span class="pill">commission</span>'))

# ============================ 4. NARXNING 3 CHEGARASI ============================
slide("Narxning 3 chegarasi", "The 3 limits of a price",
 E("span", "1-blok · Narx asoslari", "Block 1 · Price basics", 'class="kicker"') +
 E("h2", "To'g'ri narx <span class=\"grad\">uch narsa orasida</span> yotadi", "The right price lies <span class=\"grad\">between three things</span>") +
 E("div", "Narx — bu xarajatni qoplash, mijozni topish va raqobatda qolish o'rtasidagi <b>muvozanat</b>. Bittasini unutsangiz, yo zarar ko'rasiz, yo mijozni yo'qotasiz.",
   "A price is a <b>balance</b> between covering costs, finding customers and staying in the competition. Forget one of them and you either make a loss or lose customers.", 'class="def"') +
 '<div class="grid g3" style="margin-top:14px">' +
 card("red", "⬇️", "1. Pastki chegara — tannarx", "1. The floor — unit cost", "Narx to'liq tannarxdan past bo'lsa, har bir sotuv <b>zarar</b>. Bu chegaradan pastga faqat qisqa muddatli aksiyada tushish mumkin.",
      "If the price is below full cost, every sale is <b>a loss</b>. You may go below this line only in a short promotion.") +
 card("blue", "↔️", "2. Mo'ljal — raqobatchilar", "2. The reference — competitors", "Mijoz narxingizni boshqalarniki bilan <b>solishtiradi</b>. Farqingiz bo'lmasa, raqobatchidan qimmat sotish qiyin.",
      "The customer <b>compares</b> your price with others. Without a real difference it is hard to sell above a competitor.") +
 card("green", "⬆️", "3. Yuqori chegara — mijoz qiymati", "3. The ceiling — customer value", "Mijoz mahsulot unga beradigan <b>foydadan</b> ko'p to'lamaydi. Qiymatni oshirsangiz, yuqori chegara ham ko'tariladi.",
      "A customer will not pay more than the <b>benefit</b> the product gives them. Raise the value and the ceiling rises too.") + '</div>' +
 '<div class="grid g3" style="margin-top:14px">' +
 stat("16 000", "to'liq tannarx — pastki chegara", "full cost — the floor", "o") +
 stat("20–28 ming", "hunarmand raqobatchilar narxi", "handmade competitors' prices", "v") +
 stat("18–28 ming", "mijozlar «arzimaydi» deydigan oraliq", "the range customers call “worth it”") + '</div>' +
 E("div", "📌 <b>Misol («Toza tong» qo'lda yasalgan sovun, 100 gramm):</b> narx 16 000 dan yuqori, 28 000 dan past bo'lishi kerak. Keyingi slaydlarda shu oraliqdan aniq narxni topamiz.",
   "📌 <b>Example (“Toza tong” handmade soap, 100 grams):</b> the price must be above 16,000 and below 28,000. In the next slides we find an exact price within this range.", 'class="quote" style="margin-top:12px"') +
 E("small", "«Toza tong» — o'quv uchun to'qib chiqarilgan shartli misol; raqamlar haqiqiy bozor narxlari emas.", "“Toza tong” is a made-up teaching example; the figures are not real market prices.", 'class="note"'))

# ============================ 5. TANNARX ============================
slide("Tannarx: xarajatlarni yig'ish", "Unit cost: adding up costs",
 E("span", "1.2 · Tannarx", "1.2 · Unit cost", 'class="kicker"') +
 E("h2", "Bitta sovun <span class=\"grad\">aslida qanchaga tushadi?</span>", "What does one bar of soap <span class=\"grad\">really cost?</span>") +
 E("div", "<b>O'zgaruvchan xarajat</b> har bir dona bilan birga oshadi (xomashyo, qadoq). <b>Doimiy xarajat</b> sotuv bo'lmasa ham to'lanadi (ijara, kommunal). To'liq tannarx ikkalasini ham qoplashi kerak.",
   "<b>Variable costs</b> grow with every unit (raw material, packaging). <b>Fixed costs</b> are paid even with no sales (rent, utilities). The full cost must cover both.", 'class="def"') +
 '<div class="grid g3" style="margin-top:14px">' +
 '<div class="card" style="--c:var(--blue)">' + E("h3", "1. O'zgaruvchan (1 dona)", "1. Variable (1 unit)") +
 table(None, [
  [TD("Yog' va moylar", "Fats and oils"), TD("6 000", "6,000")],
  [TD("Ishqor va qo'shimchalar", "Lye and additives"), TD("1 500", "1,500")],
  [TD("Efir moyi (hid)", "Essential oil (scent)"), TD("2 500", "2,500")],
  [TD("Qadoq va yorliq", "Packaging and label"), TD("2 000", "2,000")],
  [TD("<b>Jami</b>", "<b>Total</b>"), TD("<b>12 000 so'm</b>", "<b>12,000 so'm</b>", "r")]]) + '</div>' +
 '<div class="card" style="--c:var(--violet)">' + E("h3", "2. Doimiy (oyiga)", "2. Fixed (per month)") +
 table(None, [
  [TD("Ustaxona ijarasi", "Workshop rent"), TD("1 000 000", "1,000,000")],
  [TD("Kommunal xizmatlar", "Utilities"), TD("300 000", "300,000")],
  [TD("Reklama", "Advertising"), TD("500 000", "500,000")],
  [TD("Uskuna eskirishi", "Equipment wear"), TD("200 000", "200,000")],
  [TD("<b>Jami</b>", "<b>Total</b>"), TD("<b>2 000 000 so'm</b>", "<b>2,000,000 so'm</b>", "r")]]) + '</div>' +
 '<div class="card" style="--c:var(--green)">' + E("h3", "3. To'liq tannarx", "3. Full cost") +
 E("p", "Oyiga <b>500 dona</b> ishlab chiqarish rejalashtirilgan.", "<b>500 units</b> a month are planned.") +
 E("p", "Doimiy ulush: 2 000 000 ÷ 500 = <b>4 000</b>", "Fixed share: 2,000,000 ÷ 500 = <b>4,000</b>") +
 E("p", "To'liq tannarx: 12 000 + 4 000 = <b>16 000 so'm</b>", "Full cost: 12,000 + 4,000 = <b>16,000 so'm</b>", 'style="font-size:17px"') + '</div></div>' +
 '<div class="grid g2" style="margin-top:14px">' +
 card("red", "⚠️", "Ko'p unutiladigan xarajatlar", "Commonly forgotten costs", "O'z mehnatingiz haqi, yetkazish, karta orqali to'lov komissiyasi, brak va buzilgan mahsulot, soliq. Ularni ham hisobga qo'shing.",
      "Your own labour, delivery, card payment fees, defects and spoiled goods, tax. Add them to the calculation too.") +
 card("orange", "🧠", "Diqqat: reja o'zgarsa, tannarx o'zgaradi", "Note: if the plan changes, so does the cost", "Agar oyiga 500 emas, 250 dona sotilsa, doimiy ulush 8 000 ga, to'liq tannarx esa <b>20 000</b> ga chiqadi. Kam sotuvda bitta mahsulot qimmatroqqa tushadi.",
      "If 250 units are sold instead of 500, the fixed share rises to 8,000 and the full cost to <b>20,000</b>. With lower sales each unit costs more.") + '</div>')

# ============================ 6. USTAMA VA MARJA ============================
slide("Ustama va marja", "Markup and margin",
 E("span", "1.3 · Xarajat asosida narx", "1.3 · Cost-based price", 'class="kicker"') +
 E("h2", "Ustama ≠ marja: <span class=\"grad\">eng ko'p uchraydigan xato</span>", "Markup ≠ margin: <span class=\"grad\">the most common mistake</span>") +
 E("div", "<b>Xarajat asosida narx:</b> narx = to'liq tannarx × (1 + ustama). <b>Ustama</b> tannarxga nisbatan, <b>marja</b> esa narxga nisbatan hisoblanadi — foyda bir xil, foizlar har xil.",
   "<b>Cost-plus price:</b> price = full cost × (1 + markup). <b>Markup</b> is calculated on cost, <b>margin</b> on price — the profit is the same but the percentages differ.", 'class="def"') +
 '<div class="grid g3" style="margin-top:14px">' +
 card("blue", "🧾", "Narx", "Price", "16 000 × (1 + 0,5) = <b>24 000 so'm</b><br>Foyda: 24 000 − 16 000 = 8 000", "16,000 × (1 + 0.5) = <b>24,000 so'm</b><br>Profit: 24,000 − 16,000 = 8,000") +
 card("orange", "➕", "Ustama (tannarxdan)", "Markup (on cost)", "8 000 ÷ 16 000 × 100 = <b>50%</b>", "8,000 ÷ 16,000 × 100 = <b>50%</b>") +
 card("green", "📐", "Marja (narxdan)", "Margin (on price)", "8 000 ÷ 24 000 × 100 ≈ <b>33%</b>", "8,000 ÷ 24,000 × 100 ≈ <b>33%</b>") + '</div>' +
 E("h3", "Ustama va marja jadvali", "Markup and margin table", 'style="margin-top:14px"') +
 table([("Ustama", "Markup"), ("Tannarx 16 000 bo'lsa, narx", "Price if cost is 16,000"), ("Marja", "Margin"), ("Izoh", "Note")], [
  [TD("25%", "25%"), TD("20 000", "20,000"), TD("20%", "20%"), TD("Raqobat kuchli, hajm katta bo'lsa", "When competition is strong and volume is high")],
  [TD("50%", "50%"), TD("24 000", "24,000"), TD("33%", "33%", "g"), TD("Ko'p kichik biznes uchun o'rtacha daraja", "A typical level for many small businesses")],
  [TD("100%", "100%"), TD("32 000", "32,000"), TD("50%", "50%"), TD("Noyob yoki qo'l mehnati ko'p mahsulot", "A unique or labour-intensive product")],
  [TD("150%", "150%"), TD("40 000", "40,000"), TD("60%", "60%"), TD("Kuchli brend yoki premium segment", "A strong brand or the premium segment")]]) +
 E("div", "⚠️ <b>Tuzoq:</b> «50% ustama qo'ydim — demak, 50% chegirma bera olaman» deb o'ylash. Yo'q: 24 000 ning 50% i — 12 000, bu tannarx (16 000) dan ham past. Chegirmani har doim <b>marjaga</b> qarab hisoblang.",
   "⚠️ <b>The trap:</b> thinking “I added a 50% markup, so I can give a 50% discount”. No: 50% off 24,000 is 12,000, below the cost of 16,000. Always judge discounts against the <b>margin</b>.", 'class="quote" style="margin-top:10px"'))

# ============================ 7. RAQOBATCHILAR ============================
slide("Raqobatchilar narxi", "Competitors' prices",
 E("span", "2-blok · Bozor va mijoz", "Block 2 · Market and customer", 'class="kicker"') +
 E("h2", "Siz qaysi <span class=\"grad\">«narx tokchasida»</span> turasiz?", "Which <span class=\"grad\">“price shelf”</span> do you stand on?") +
 E("div", "Mijoz narxni bo'shliqda emas, <b>bozordagi o'xshash mahsulotlar</b> qatorida ko'radi. Raqobatchilarni kamida 5 ta nuqtadan (do'kon, bozor, Instagram, marketpleys) o'rganing va jadvalga yozing.",
   "A customer sees your price not in a vacuum but next to <b>similar products on the market</b>. Study competitors at no fewer than 5 points (shops, the bazaar, Instagram, marketplaces) and record them in a table.", 'class="def"') +
 table([("Segment", "Segment"), ("Narx (100 g)", "Price (100 g)"), ("Kim oladi", "Who buys"), ("Kuchli tomoni", "Strength"), ("Zaif tomoni", "Weakness")], [
  [TD("<b>Zavod sovuni</b> (bozor, do'kon)", "<b>Factory soap</b> (bazaar, shop)"), TD("6–8 ming", "6–8 thousand"), TD("Har kuni ishlatuvchi har kim", "Anyone for everyday use"), TD("Arzon, hamma joyda", "Cheap, everywhere", "g"), TD("Tarkibi oddiy, farqi yo'q", "Plain ingredients, no difference")],
  [TD("<b>Hunarmand sovuni</b> (Instagram)", "<b>Handmade soap</b> (Instagram)"), TD("20–28 ming", "20–28 thousand"), TD("Sovg'a izlovchi, tabiiyni xohlovchi", "Gift seekers, lovers of natural goods"), TD("Tabiiy, chiroyli qadoq", "Natural, pretty packaging", "g"), TD("Sifat har xil, ishonch past", "Uneven quality, low trust", "r")],
  [TD("<b>Import «organik» sovun</b> (do'kon)", "<b>Imported “organic” soap</b> (shop)"), TD("35–45 ming", "35–45 thousand"), TD("Daromadi yuqori xaridor", "High-income buyers"), TD("Brend, sertifikat", "Brand, certificates", "g"), TD("Qimmat, mahalliy emas", "Expensive, not local", "r")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("green", "🎯", "«Toza tong» qaror", "“Toza tong” decision", "Hunarmand segmentida turamiz: <b>24 000 so'm</b>. Farqimiz — tarkib yorliqda to'liq yozilgan, sinov uchun mini-sovun (30 g) bor, Termizda bir kunda yetkaziladi.",
      "We stand in the handmade segment: <b>24,000 so'm</b>. Our difference: full ingredients on the label, a 30 g trial mini-soap and same-day delivery in Termez.") +
 card("orange", "⚠️", "Raqobatchidan arzon bo'lish — strategiya emas", "Being cheaper is not a strategy", "Faqat narx bilan raqobat qilsangiz, kuchliroq (arzonroq ishlab chiqaradigan) raqib doim yutadi. <b>Farq yarating</b>, keyin narxni farqqa qarab qo'ying.",
      "If you compete on price alone, a stronger rival who produces more cheaply always wins. <b>Create a difference</b>, then price according to it.") + '</div>' +
 E("small", "Jadvaldagi narxlar o'quv uchun shartli. O'z mahsulotingiz uchun bozorni o'zingiz kuzating va sanasini yozib qo'ying — narxlar tez o'zgaradi.",
   "The prices in the table are made up for teaching. Survey the market for your own product yourself and note the date — prices change quickly.", 'class="note"'))

# ============================ 8. MIJOZ QIYMATI ============================
slide("Mijoz qiymati", "Customer value",
 E("span", "2.2 · Qiymatga asoslangan narx", "2.2 · Value-based pricing", 'class="kicker"') +
 E("h2", "Mijoz <span class=\"grad\">qancha to'lashga tayyor?</span>", "How much is the customer <span class=\"grad\">willing to pay?</span>") +
 E("div", "Mijoz sizning xarajatingizni bilmaydi va unga qiziqmaydi — u mahsulot <b>o'ziga nima berishini</b> baholaydi. Buni taxmin qilmang, <b>so'rang</b>.",
   "The customer neither knows nor cares about your costs — they judge what the product <b>gives them</b>. Do not guess this — <b>ask</b>.", 'class="def"') +
 '<div class="grid g2" style="margin-top:14px">' +
 '<div class="card" style="--c:var(--blue)">' + E("h3", "🗣 Narx bo'yicha 4 ta savol", "🗣 4 questions about price") +
 table([("Savol", "Question"), ("O'rtacha javob (30 kishi)", "Typical answer (30 people)")], [
  [TD("«Qaysi narxda shubhalanasiz — juda arzon, sifati yomondir?»", "“At what price would you doubt it — too cheap to be good?”"), TD("12 000", "12,000")],
  [TD("«Qaysi narxda «arzon, yaxshi xarid» deysiz?»", "“At what price would you say “cheap, a good buy”?”"), TD("18 000", "18,000", "g")],
  [TD("«Qaysi narxda «qimmat, lekin olaman» deysiz?»", "“At what price would you say “expensive, but I would buy”?”"), TD("28 000", "28,000", "g")],
  [TD("«Qaysi narxda umuman olmaysiz?»", "“At what price would you not buy at all?”"), TD("35 000", "35,000", "r")]]) +
 E("p", "Natija: mijozlar uchun qabul qilinadigan oraliq — <b>18 000–28 000</b>. 24 000 shu oraliqda.", "Result: the acceptable range for customers is <b>18,000–28,000</b>. 24,000 sits within it.", 'style="margin-top:8px"') + '</div>' +
 '<div>' + card_ul("green", "⬆️", "Qiymatni qanday oshirish mumkin?", "How can value be raised?", [
  ("<b>Natija:</b> «teri qurimaydi» — bu «tarkibida zaytun moyi bor»dan kuchliroq.", "<b>Result:</b> “your skin does not dry out” beats “contains olive oil”."),
  ("<b>Ishonch:</b> tarkib, sertifikat yoki sinov, mijoz sharhlari.", "<b>Trust:</b> ingredients, a certificate or test, customer reviews."),
  ("<b>Qulaylik:</b> uyga yetkazish, sovg'a qadog'i, tez javob.", "<b>Convenience:</b> home delivery, gift wrapping, quick replies."),
  ("<b>Hissiyot:</b> chiroyli qadoq, hikoya, mahalliy brend.", "<b>Emotion:</b> beautiful packaging, a story, a local brand.")], "tick") +
 E("div", "Bir xil sovun oddiy qog'ozda 20 000 ga, sovg'a qutisida va kartochka bilan <b>35 000</b> ga sotilishi mumkin — mijoz endi sovun emas, <b>sovg'a</b> sotib oladi.",
   "The same soap may sell for 20,000 in plain paper and for <b>35,000</b> in a gift box with a card — the customer is now buying <b>a gift</b>, not soap.", 'class="quote" style="margin-top:12px"') + '</div></div>')

# ============================ 9. STRATEGIYALAR ============================
slide("Narx strategiyalari", "Pricing strategies",
 E("span", "2.3 · Strategiya", "2.3 · Strategy", 'class="kicker"') +
 E("h2", "Narx strategiyasini <span class=\"grad\">maqsadga qarab tanlang</span>", "Choose a pricing strategy <span class=\"grad\">to fit the goal</span>") +
 table([("Strategiya", "Strategy"), ("Mazmuni", "What it means"), ("Qachon mos", "When it fits"), ("Xavfi", "Risk")], [
  [TD("<b>📉 Kirish (penetratsiya)</b>", "<b>📉 Penetration</b>"), TD("Bozorga past narx bilan kirib, tez mijoz yig'ish", "Entering with a low price to win customers fast"), TD("Mahsulot oddiy, hajm katta, xarajat past", "Simple product, large volume, low costs"), TD("Keyin narxni oshirish qiyin; zarar xavfi", "Hard to raise the price later; risk of loss", "r")],
  [TD("<b>📈 Qaymoq olish</b>", "<b>📈 Skimming</b>"), TD("Yangi mahsulotni avval yuqori narxda sotib, keyin asta pasaytirish", "Selling a new product high first, then lowering it step by step"), TD("Yangilik, noyob mahsulot, raqib hali yo'q", "Novelty, a unique product, no rival yet"), TD("Raqib tez paydo bo'lsa, mijoz ketadi", "If rivals appear fast, customers leave", "r")],
  [TD("<b>💎 Qiymatga asoslangan</b>", "<b>💎 Value-based</b>"), TD("Narx mijoz olayotgan foydaga qarab belgilanadi", "The price follows the benefit the customer gets"), TD("Farqi aniq, mijoz qiymatni his qiladi", "A clear difference the customer can feel"), TD("Qiymatni isbotlash kerak", "The value must be proved")],
  [TD("<b>⚖️ Raqobat asosida</b>", "<b>⚖️ Competition-based</b>"), TD("Narx raqobatchilar darajasida qo'yiladi", "The price is set at competitors' level"), TD("Mahsulotlar o'xshash, bozor shakllangan", "Similar products, an established market"), TD("Foyda past, farq sezilmaydi", "Low profit, no visible difference", "r")],
  [TD("<b>🧾 Xarajat + ustama</b>", "<b>🧾 Cost-plus</b>"), TD("Tannarxga belgilangan foiz qo'shiladi", "A fixed percentage is added to the cost"), TD("Buyurtma asosida ish, ulgurji savdo", "Made-to-order work, wholesale"), TD("Mijoz qiymati va raqobat e'tiborsiz qoladi", "Ignores customer value and competition", "r")],
  [TD("<b>👑 Premium</b>", "<b>👑 Premium</b>"), TD("Ataylab yuqori narx — sifat va maqom belgisi", "A deliberately high price — a sign of quality and status"), TD("Kuchli brend, a'lo sifat va xizmat", "A strong brand, top quality and service"), TD("Bitta xato obro'ga qattiq ta'sir qiladi", "One mistake hits the reputation hard", "r")]]) +
 E("div", "📌 <b>«Toza tong» tanlovi:</b> <b>qiymatga asoslangan</b> narx (24 000) + sinov uchun mini-sovun (8 000). Mini-sovun «kirish» vazifasini bajaradi: mijoz kam pul bilan sinab ko'radi, asosiy mahsulot narxi tushmaydi.",
   "📌 <b>“Toza tong” choice:</b> a <b>value-based</b> price (24,000) + a trial mini-soap (8,000). The mini-soap acts as the “entry”: customers try it cheaply and the main product's price stays intact.", 'class="quote" style="margin-top:12px"'))

# ============================ 10. PSIXOLOGIK NARX ============================
slide("Psixologik narx", "Psychological pricing",
 E("span", "2.4 · Narxni ko'rsatish", "2.4 · Presenting the price", 'class="kicker"') +
 E("h2", "Narxni <span class=\"grad\">qanday ko'rsatish</span> ham muhim", "<span class=\"grad\">How you show</span> the price matters too") +
 '<div class="grid g4">' +
 card("blue", "9️⃣", "Yumaloq bo'lmagan narx", "A non-round price", "24 900 ko'pincha 25 000 dan «ancha arzon» ko'rinadi — chunki ko'z birinchi raqamga qaraydi.", "24,900 often looks “much cheaper” than 25,000 because the eye reads the first digit.") +
 card("violet", "⚓", "Langar narx", "An anchor price", "Yonida qimmatroq variant (sovg'a qutisi 35 000) tursa, 24 000 «o'rtacha va oqilona» ko'rinadi.", "Next to a dearer option (a 35,000 gift box), 24,000 looks “reasonable and fair”.") +
 card("green", "📦", "To'plam narxi", "A bundle price", "«3 dona — 66 000» (har biri 22 000): o'rtacha chek oshadi, mijoz tejaganini his qiladi.", "“3 bars — 66,000” (22,000 each): the average order grows and the customer feels a saving.") +
 card("orange", "🧩", "Narxni bo'lish", "Splitting the price", "«Kuniga atigi 800 so'm» (bir oyga yetadigan sovun) — katta summani kichik qilib ko'rsatadi.", "“Only 800 so'm a day” (a bar lasting a month) — makes a big sum feel small.") + '</div>' +
 E("h3", "«Toza tong» narx varag'i (namuna)", "“Toza tong” price list (sample)", 'style="margin-top:14px"') +
 table([("Mahsulot", "Product"), ("Narx", "Price"), ("Kimga", "For whom")], [
  [TD("Mini-sovun, 30 g (sinov)", "Mini-soap, 30 g (trial)"), TD("8 000", "8,000"), TD("Birinchi marta oluvchi", "First-time buyers")],
  [TD("<b>Sovun, 100 g</b>", "<b>Soap, 100 g</b>"), TD("<b>24 000</b>", "<b>24,000</b>", "g"), TD("Asosiy mahsulot", "The main product")],
  [TD("3 ta sovun to'plami", "A set of 3 soaps"), TD("66 000", "66,000"), TD("Oila uchun, doimiy mijoz", "Families, regular customers")],
  [TD("Sovg'a qutisi (2 sovun + kartochka)", "Gift box (2 soaps + a card)"), TD("55 000", "55,000"), TD("Bayram va sovg'a uchun", "Holidays and gifts")]]) +
 E("small", "Psixologik usullar faqat <b>halol</b> bo'lsa ishlaydi: yashirin to'lov, «avval 48 000 edi» degan soxta eski narx, oxirida qo'shiladigan kutilmagan xarajat mijozni aldaydi va iste'molchilar huquqlarini buzadi.",
   "Psychological methods work only when they are <b>honest</b>: hidden fees, a fake “it used to be 48,000”, or surprise costs added at the end deceive the customer and breach consumer rights.", 'class="note"'))

# ============================ 11. NARX VA ZARARSIZ NUQTA ============================
slide("Narx va zararsiz nuqta", "Price and break-even",
 E("span", "3-blok · Raqamlar", "Block 3 · The numbers", 'class="kicker"') +
 E("h2", "Narx o'zgarsa, <span class=\"grad\">zararsiz nuqta ham siljiydi</span>", "When the price changes, <span class=\"grad\">break-even moves too</span>") +
 E("div", "<b>Hissa</b> = narx − o'zgaruvchan xarajat: har bir sotuv doimiy xarajatni qoplashga qancha qo'shishi. <b>Zararsiz miqdor = doimiy xarajat ÷ hissa.</b>",
   "<b>Contribution</b> = price − variable cost: how much each sale adds towards fixed costs. <b>Break-even quantity = fixed costs ÷ contribution.</b>", 'class="def"') +
 table([("Narx", "Price"), ("O'zgaruvchan", "Variable"), ("Hissa", "Contribution"), ("Zararsiz miqdor (oyiga)", "Break-even (per month)"), ("500 dona sotilsa foyda", "Profit at 500 units")], [
  [TD("20 000", "20,000"), TD("12 000", "12,000"), TD("8 000", "8,000"), TD("2 000 000 ÷ 8 000 = <b>250 dona</b>", "2,000,000 ÷ 8,000 = <b>250 units</b>", "r"), TD("2 000 000", "2,000,000")],
  [TD("<b>24 000</b>", "<b>24,000</b>"), TD("12 000", "12,000"), TD("12 000", "12,000"), TD("2 000 000 ÷ 12 000 ≈ <b>167 dona</b>", "2,000,000 ÷ 12,000 ≈ <b>167 units</b>"), TD("<b>4 000 000</b>", "<b>4,000,000</b>", "g")],
  [TD("28 000", "28,000"), TD("12 000", "12,000"), TD("16 000", "16,000"), TD("2 000 000 ÷ 16 000 = <b>125 dona</b>", "2,000,000 ÷ 16,000 = <b>125 units</b>", "g"), TD("6 000 000", "6,000,000")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("blue", "🧮", "Tekshiruv", "A check", "Narx 24 000 da 500 dona: 500 × 12 000 − 2 000 000 = <b>4 000 000</b>. Shu natija 500 × (24 000 − 16 000) bilan ham chiqadi — demak, to'liq tannarx to'g'ri hisoblangan.",
      "At 24,000 and 500 units: 500 × 12,000 − 2,000,000 = <b>4,000,000</b>. The same result comes from 500 × (24,000 − 16,000) — so the full cost was calculated correctly.") +
 card("orange", "⚠️", "Lekin...", "But...", "Jadval sotuv soni o'zgarmaydi deb hisoblaydi. Aslida narx oshsa, xaridorlar kamayishi mumkin. Shuning uchun narxni oshirishdan oldin <b>sotuv qanchaga tushishi mumkinligini</b> ham hisoblang (13-slayd).",
      "The table assumes sales stay the same. In reality a higher price may mean fewer buyers. So before raising the price also calculate <b>how far sales may fall</b> (slide 13).") + '</div>')

# ============================ 12. CHEGIRMA TUZOG'I ============================
slide("Chegirma tuzog'i", "The discount trap",
 E("span", "3.2 · Chegirma", "3.2 · Discounts", 'class="kicker"') +
 E("h2", "20% chegirma — <span class=\"grad\">20% kam foyda emas</span>", "A 20% discount is <span class=\"grad\">not 20% less profit</span>") +
 E("div", "Chegirma narxdan olinadi, lekin to'liq <b>foydangizdan</b> chiqib ketadi: xarajat o'zgarmaydi. Shuning uchun kichik chegirma ham hissani keskin kamaytiradi.",
   "A discount comes off the price but entirely out of <b>your profit</b>: costs do not change. That is why even a small discount cuts the contribution sharply.", 'class="def"') +
 '<div class="grid g3" style="margin-top:14px">' +
 '<div class="card" style="--c:var(--green)">' + E("h3", "Chegirmasiz", "Without a discount") +
 table(None, [[TD("Narx", "Price"), TD("24 000", "24,000")], [TD("Hissa", "Contribution"), TD("12 000", "12,000")], [TD("Oyiga sotuv", "Monthly sales"), TD("300 dona", "300 units")],
  [TD("<b>Jami hissa</b>", "<b>Total contribution</b>"), TD("<b>3 600 000</b>", "<b>3,600,000</b>", "g")]]) + '</div>' +
 '<div class="card" style="--c:var(--red)">' + E("h3", "20% chegirma bilan", "With a 20% discount") +
 table(None, [[TD("Narx", "Price"), TD("19 200", "19,200")], [TD("Hissa", "Contribution"), TD("7 200 (−40%)", "7,200 (−40%)", "r")], [TD("Shu foyda uchun kerak", "Needed for the same profit"), TD("3 600 000 ÷ 7 200 = 500", "3,600,000 ÷ 7,200 = 500")],
  [TD("<b>Sotuv o'sishi</b>", "<b>Sales growth</b>"), TD("<b>+67%</b>", "<b>+67%</b>", "r")]]) + '</div>' +
 '<div class="card" style="--c:var(--blue)">' + E("h3", "Tezkor formula", "A quick formula") +
 E("p", "<b>Kerakli sotuv o'sishi = chegirma ÷ (marja − chegirma)</b>", "<b>Required sales growth = discount ÷ (margin − discount)</b>") +
 E("p", "Bu yerda marja hissa bo'yicha: 12 000 ÷ 24 000 = 50%.<br>20 ÷ (50 − 20) ≈ <b>67%</b>", "Here the margin is on contribution: 12,000 ÷ 24,000 = 50%.<br>20 ÷ (50 − 20) ≈ <b>67%</b>", 'style="margin-top:8px"') + '</div></div>' +
 '<div class="grid g2" style="margin-top:14px">' +
 card_ul("green", "✅", "Chegirma o'rniga nima qilish mumkin?", "What can you do instead of a discount?", [
  ("Narxni saqlab, <b>sovg'a qo'shish</b> (mini-sovun — tannarxi 4 000 atrofida).", "Keep the price and <b>add a gift</b> (a mini-soap costing about 4,000)."),
  ("<b>To'plam</b> narxi: 3 tasi 66 000 — chek kattalashadi.", "<b>A bundle</b> price: 3 for 66,000 — the order gets bigger."),
  ("Chegirmani faqat <b>doimiy mijozga</b> yoki qisqa muddatga berish.", "Give discounts only to <b>regular customers</b> or for a short time.")], "tick") +
 card("red", "⚠️", "Doimiy chegirma xavfi", "The danger of constant discounts", "Har hafta chegirma bo'lsa, mijoz <b>to'liq narxda olmay qo'yadi</b> va aksiyani kutadi. Natijada chegirma narxi asosiy narxga aylanadi.",
      "With a discount every week, customers <b>stop buying at full price</b> and wait for the sale. The discount price becomes the real price.") + '</div>')

# ============================ 13. NARXNI OSHIRISH ============================
slide("Narxni oshirish", "Raising the price",
 E("span", "3.3 · Narxni o'zgartirish", "3.3 · Changing the price", 'class="kicker"') +
 E("h2", "Narxni oshirish — <span class=\"grad\">qo'rqinchli, lekin ko'pincha foydali</span>", "Raising the price is <span class=\"grad\">scary, but often profitable</span>") +
 E("div", "<b>Narx elastikligi</b> — narx o'zgarganda sotuv qanchalik o'zgarishi. Mijozlar narxga kam sezgir bo'lsa, narxni biroz oshirish foydani oshiradi, hatto sotuv biroz kamaysa ham.",
   "<b>Price elasticity</b> is how much sales change when the price changes. If customers are not very price-sensitive, a small price rise increases profit even if sales fall a little.", 'class="def"') +
 table([("", ""), ("Hozir", "Now"), ("Narx +10%", "Price +10%")], [
  [TD("<b>Narx</b>", "<b>Price</b>"), TD("24 000", "24,000"), TD("26 400", "26,400")],
  [TD("<b>Hissa (1 dona)</b>", "<b>Contribution (1 unit)</b>"), TD("12 000", "12,000"), TD("14 400", "14,400", "g")],
  [TD("<b>Oyiga sotuv</b>", "<b>Monthly sales</b>"), TD("300 dona", "300 units"), TD("270 dona (−10%)", "270 units (−10%)", "r")],
  [TD("<b>Jami hissa</b>", "<b>Total contribution</b>"), TD("3 600 000", "3,600,000"), TD("<b>3 888 000 (+288 000)</b>", "<b>3,888,000 (+288,000)</b>", "g")]]) +
 E("p", "Sotuv 10% kamaydi, lekin foyda oshdi. Foyda o'zgarmay qoladigan chegara: sotuv 250 donagacha (−17%) tushsa ham, 250 × 14 400 = 3 600 000.",
   "Sales fell 10% but profit rose. The point where profit stays equal: even if sales fall to 250 units (−17%), 250 × 14,400 = 3,600,000.", 'style="margin-top:10px"') +
 '<div class="grid g3" style="margin-top:12px">' +
 card("green", "📣", "Oldindan ogohlantiring", "Warn in advance", "«1-sanadan narx 26 400 bo'ladi; shu kungacha eski narxda buyurtma bering.» Mijoz hurmat qilinganini his qiladi.",
      "“From the 1st the price will be 26,400; order at the old price until then.” The customer feels respected.") +
 card("blue", "🎁", "Qiymat qo'shing", "Add value", "Yangi qadoq, yangi hid yoki tezroq yetkazish — narx oshishi asosli ko'rinadi.", "New packaging, a new scent or faster delivery — the rise looks justified.") +
 card("violet", "🪜", "Bosqichma-bosqich", "Step by step", "Bir martada 30% emas, bir necha oyda 5–10% dan. Avval yangi mijozlar uchun, keyin hammaga.", "Not 30% at once but 5–10% at a time over months. First for new customers, then for all.") + '</div>' +
 E("small", "Xomashyo narxi va inflyatsiya oshganda narxni ko'rib chiqmaslik ham xavfli: foyda sezdirmay yo'qoladi. Tannarxni kamida har chorakda qayta hisoblang.",
   "Not reviewing prices when raw-material costs and inflation rise is also risky: profit quietly disappears. Recalculate unit cost at least every quarter.", 'class="note"'))

# ============================ 14. KANAL BO'YICHA NARX ============================
slide("Kanal bo'yicha narx", "Pricing by channel",
 E("span", "4-blok · Amaliyot", "Block 4 · Practice", 'class="kicker"') +
 E("h2", "Bitta mahsulot — <span class=\"grad\">har xil kanalda har xil narx</span>", "One product — <span class=\"grad\">different prices in different channels</span>") +
 E("div", "Har bir kanal o'z xarajatini olib keladi: do'kon o'z ustamasini qo'yadi, marketpleys komissiya oladi, onlayn savdoda yetkazish bor. <b>Har kanal uchun hissani alohida hisoblang.</b>",
   "Every channel brings its own costs: a shop adds its markup, a marketplace takes a commission, online sales need delivery. <b>Calculate the contribution separately for each channel.</b>", 'class="def"') +
 table([("Kanal", "Channel"), ("Sizning narxingiz", "Your price"), ("Qo'shimcha xarajat", "Extra cost"), ("Sizga qoladi", "You keep"), ("Hissa", "Contribution")], [
  [TD("<b>🏠 O'z do'koni / ustaxona</b>", "<b>🏠 Own shop / workshop</b>"), TD("24 000", "24,000"), TD("—", "—"), TD("24 000", "24,000"), TD("<b>12 000</b>", "<b>12,000</b>", "g")],
  [TD("<b>📱 Instagram + yetkazish</b>", "<b>📱 Instagram + delivery</b>"), TD("24 000", "24,000"), TD("Yetkazish narxini mijoz alohida to'laydi", "The customer pays for delivery separately"), TD("24 000", "24,000"), TD("<b>12 000</b>", "<b>12,000</b>", "g")],
  [TD("<b>🛒 Marketpleys</b>", "<b>🛒 Marketplace</b>"), TD("26 000", "26,000"), TD("Komissiya 15% = 3 900", "15% commission = 3,900"), TD("22 100", "22,100"), TD("10 100", "10,100")],
  [TD("<b>🏪 Do'konga ulgurji</b>", "<b>🏪 Wholesale to a shop</b>"), TD("17 000", "17,000"), TD("Do'kon ~40% ustama qo'yib 23 800 ga sotadi", "The shop adds ~40% and sells at 23,800"), TD("17 000", "17,000"), TD("5 000", "5,000", "r")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("blue", "🏪", "Ulgurji narxni qanday topish?", "How to find the wholesale price", "Chakana narxni do'kon ustamasiga bo'ling: 24 000 ÷ 1,4 ≈ <b>17 000</b>. Hissa kam (5 000), lekin bir martada 100 dona va reklama xarajatisiz.",
      "Divide the retail price by the shop's markup: 24,000 ÷ 1.4 ≈ <b>17,000</b>. The contribution is small (5,000), but it is 100 units at once with no advertising cost.") +
 card("orange", "⚖️", "Kanallar o'rtasida adolat", "Fairness between channels", "Agar o'zingiz do'kondan arzonroq sotsangiz, do'kon siz bilan ishlashni to'xtatadi. Chakana narxni barcha kanallarda <b>bir xil darajada</b> ushlang.",
      "If you sell cheaper than the shop yourself, the shop stops working with you. Keep the retail price <b>at the same level</b> in all channels.") + '</div>' +
 E("small", "Marketpleys komissiyalari va shartlari platforma, toifa va vaqtga qarab farq qiladi. Amaldagi tarifni platformaning o'zidan tekshiring.",
   "Marketplace commissions and terms differ by platform, category and time. Check the current tariff with the platform itself.", 'class="note"'))

# ============================ 15. NARX ALGORITMI ============================
slide("Narx belgilash algoritmi", "A pricing algorithm",
 E("span", "4.2 · Qadamlar", "4.2 · Steps", 'class="kicker"') +
 E("h2", "Narxni <span class=\"grad\">7 qadamda</span> belgilang", "Set a price <span class=\"grad\">in 7 steps</span>") +
 '<div class="chain">' +
 '<div class="link l1">' + E("h3", "1. Tannarx", "1. Unit cost") + E("p", "O'zgaruvchan + doimiy ulush = to'liq tannarx.", "Variable + fixed share = full cost.") + '</div>' +
 '<div class="link l2">' + E("h3", "2. Pastki chegara", "2. The floor") + E("p", "Narx shundan past bo'lmaydi (aksiyadan tashqari).", "The price never goes below it (except promotions).") + '</div>' +
 '<div class="link l3">' + E("h3", "3. Raqobatchilar", "3. Competitors") + E("p", "5 ta nuqtadan narx jadvali, segmentni tanlash.", "A price table from 5 points, choose a segment.") + '</div>' +
 '<div class="link l4">' + E("h3", "4. Mijoz", "4. Customer") + E("p", "4 ta narx savoli, qabul qilinadigan oraliq.", "4 price questions, the acceptable range.") + '</div></div>' +
 '<div class="chain" style="margin-top:10px">' +
 '<div class="link l4">' + E("h3", "5. Strategiya", "5. Strategy") + E("p", "Maqsadga mos strategiya va narx varag'i.", "A strategy that fits the goal and a price list.") + '</div>' +
 '<div class="link l3">' + E("h3", "6. Hisob", "6. Calculation") + E("p", "Hissa, zararsiz nuqta, kanal bo'yicha foyda.", "Contribution, break-even, profit per channel.") + '</div>' +
 '<div class="link l2">' + E("h3", "7. Sinash va ko'rib chiqish", "7. Test and review") + E("p", "1–2 oy sinash, har chorakda qayta hisob.", "Test 1–2 months, recalculate every quarter.") + '</div></div>' +
 '<div class="grid g2" style="margin-top:14px">' +
 card_ul("green", "✅", "Halol narx qoidalari", "Rules of honest pricing", [
  ("Narx <b>oldindan va aniq</b> ko'rsatiladi: yetkazish va qo'shimcha to'lovlar ham.", "The price is shown <b>in advance and clearly</b>, including delivery and extra charges."),
  ("Chegirma <b>haqiqiy</b>: eski narx rostdan shunday bo'lgan, muddati aniq.", "A discount is <b>real</b>: the old price truly existed and the deadline is clear."),
  ("Bir xil sharoitda mijozlarga <b>bir xil narx</b>; farq bo'lsa, sababi ochiq (ulgurji, doimiy mijoz).", "<b>The same price</b> for customers in the same conditions; any difference has an open reason (wholesale, loyalty)."),
  ("Raqobatchilar bilan narxni <b>yashirincha kelishish</b> mumkin emas.", "<b>Secretly agreeing prices</b> with competitors is not allowed.")], "tick") +
 card("orange", "📜", "Qonun va soliq", "Law and tax", "Narx belgilash, narx yorliqlari, iste'molchilar huquqlari va raqobat qoidalari qonun bilan tartibga solinadi. Soliqlar (masalan, QQS to'lovchisi bo'lsangiz) narxga qanday kirishini oldindan aniqlang. Amaldagi tartibni lex.uz va soliq xizmatidan tekshiring.",
      "Pricing, price labels, consumer rights and competition rules are governed by law. Find out in advance how taxes (for example, if you pay VAT) enter the price. Check current rules on lex.uz and with the tax service.") + '</div>')

# ============================ 16. AMALIY TOPSHIRIQ ============================
slide("Amaliy topshiriq", "Practical task",
 E("span", "Amaliy mashg'ulot · 2 soat", "Practical class · 2 hours", 'class="kicker"') +
 E("h2", "«Narx <span class=\"grad\">kartochkasi»</span>", "The “price <span class=\"grad\">card”</span>") +
 E("p", "Har bir talaba (yoki 2 kishilik guruh) o'z mahsuloti uchun narxni hisoblab, asoslab beradigan A4 kartochka tayyorlaydi.", "Each student (or a pair) prepares an A4 card that calculates and justifies the price of their own product.", 'class="lead"') +
 '<div class="grid g2"><div class="card" style="--c:var(--blue)">' + E("h3", "⏱ 120 daqiqalik reja", "⏱ The 120-minute plan") +
 table([("Vaqt", "Time"), ("Nima qilinadi", "What to do")], [
  [TD("0–20", "0–20"), TD("Mahsulot, o'zgaruvchan va doimiy xarajatlar ro'yxati", "The product and a list of variable and fixed costs")],
  [TD("20–40", "20–40"), TD("To'liq tannarx, ustama va marja hisobi", "Full cost, markup and margin calculation")],
  [TD("40–60", "40–60"), TD("Raqobatchilar jadvali va juftlikda 4 ta narx savoli", "A competitor table and the 4 price questions in pairs")],
  [TD("60–80", "60–80"), TD("Strategiya, narx varag'i, zararsiz nuqta", "Strategy, price list, break-even point")],
  [TD("80–100", "80–100"), TD("Chegirma va narx oshirish hisobi, kanal narxlari", "Discount and price-rise calculations, channel prices")],
  [TD("100–120", "100–120"), TD("2 daqiqalik himoya va o'zaro baholash", "A 2-minute defence and peer assessment")]]) + '</div>' +
 '<div><div class="card" style="--c:var(--green)">' + E("h3", "📋 Kartochkada bo'lishi shart", "📋 The card must contain") +
 '<ul class="clean">' + E("li", "Xarajatlar jadvali va to'liq tannarx", "A cost table and the full cost") +
 E("li", "Tanlangan narx, ustama va marja", "The chosen price, markup and margin") +
 E("li", "3 ta raqobatchi narxi va sizning farqingiz", "3 competitor prices and your difference") +
 E("li", "Strategiya va uning asosi", "The strategy and its justification") +
 E("li", "Zararsiz miqdor va 10% chegirma hisobi", "Break-even quantity and a 10% discount calculation") +
 E("li", "Kamida 2 ta kanal uchun narx va hissa", "Price and contribution for at least 2 channels") + '</ul></div>' +
 '<div class="card" style="--c:var(--amber);margin-top:12px">' + E("h3", "🏅 Baholash", "🏅 Assessment") +
 E("p", "Tannarx va hisob aniqligi <b>35%</b> · bozor va mijoz tahlili <b>25%</b> · strategiya asosi <b>20%</b> · himoya <b>20%</b>.", "Accuracy of cost and calculations <b>35%</b> · market and customer analysis <b>25%</b> · strategy rationale <b>20%</b> · defence <b>20%</b>.") + '</div></div></div>')

# ============================ 17. XULOSA ============================
slide("Xulosa va resurslar", "Summary and resources",
 E("span", "Xulosa · Mustaqil ish · Havolalar", "Summary · Independent work · Links", 'class="kicker"') +
 E("h2", "Yakuniy <span class=\"grad\">xulosa</span> va <span class=\"grad\">foydali resurslar</span>", "The final <span class=\"grad\">summary</span> and <span class=\"grad\">useful resources</span>") +
 '<div class="grid g2"><div>' +
 card_ul("green", "📌", "Esda qoladigan 6 ta fikr", "6 things to remember", [
  ("Narx <b>3 chegara</b> orasida: tannarx (pastki), raqobatchilar (mo'ljal), mijoz qiymati (yuqori).", "A price sits between <b>3 limits</b>: cost (floor), competitors (reference), customer value (ceiling)."),
  ("To'liq tannarx = o'zgaruvchan + doimiy ulush; <b>reja kamaysa, tannarx oshadi</b>.", "Full cost = variable + fixed share; <b>lower volume means higher unit cost</b>."),
  ("<b>Ustama</b> tannarxdan, <b>marja</b> narxdan: 50% ustama ≈ 33% marja.", "<b>Markup</b> is on cost, <b>margin</b> on price: a 50% markup ≈ a 33% margin."),
  ("Strategiyani maqsadga qarab tanlang; faqat «arzonroq bo'lish» — strategiya emas.", "Choose the strategy to fit the goal; just “being cheaper” is not a strategy."),
  ("Chegirma foydadan chiqadi: kerakli o'sish = <b>chegirma ÷ (marja − chegirma)</b>.", "A discount comes out of profit: required growth = <b>discount ÷ (margin − discount)</b>."),
  ("Narxni ko'rib chiqib turing va <b>har kanal uchun hissani</b> alohida hisoblang.", "Review prices regularly and calculate <b>contribution per channel</b> separately.")]) +
 '<div class="card" style="--c:var(--amber);margin-top:12px">' + E("h3", "📓 Mustaqil ish: «Narx tadqiqoti»", "📓 Independent work: “A price study”") +
 '<ul class="clean">' + E("li", "O'z mahsulotingizga o'xshash 5 ta mahsulot narxini 5 ta joydan yozing.", "Record the prices of 5 similar products from 5 places.") +
 E("li", "10 ta odamga 4 ta narx savolini bering va oraliqni toping.", "Ask 10 people the 4 price questions and find the range.") +
 E("li", "Narxni tanlab, 10% chegirma va 10% oshirish hisobini qiling.", "Choose a price and calculate a 10% discount and a 10% rise.") +
 E("li", "Xulosa: narx qaysi strategiyaga mos va nega?", "Conclusion: which strategy does the price follow and why?") + '</ul>' +
 E("p", "Hajmi: 1–2 bet + jadval. Baholash: bozor ma'lumoti 35% · hisob 35% · asoslangan xulosa 30%.", "Size: 1–2 pages + a table. Marking: market data 35% · calculation 35% · reasoned conclusion 30%.", 'style="font-size:13.5px;color:var(--muted)"') + '</div></div>' +
 '<div><div class="card" style="--c:var(--blue)">' + E("h3", "🔗 Foydali resurslar", "🔗 Useful resources") +
 E("p", "<b>Qonun va rasmiy manbalar:</b>", "<b>Law and official sources:</b>") +
 '<ul class="clean">' +
 E("li", '<a class="lnk" href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> — iste\'molchilar huquqlari, raqobat va soliq qonunlari', '<a class="lnk" href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> — consumer rights, competition and tax laws') +
 E("li", '<a class="lnk" href="https://stat.uz" target="_blank" rel="noopener">stat.uz</a> — narxlar va inflyatsiya statistikasi', '<a class="lnk" href="https://stat.uz" target="_blank" rel="noopener">stat.uz</a> — price and inflation statistics') +
 E("li", '<a class="lnk" href="https://cbu.uz" target="_blank" rel="noopener">cbu.uz</a> — Markaziy bank: inflyatsiya va valyuta kursi', '<a class="lnk" href="https://cbu.uz" target="_blank" rel="noopener">cbu.uz</a> — the Central Bank: inflation and exchange rates') +
 E("li", '<a class="lnk" href="https://birdarcha.uz" target="_blank" rel="noopener">birdarcha.uz</a> — biznesni ro\'yxatdan o\'tkazish', '<a class="lnk" href="https://birdarcha.uz" target="_blank" rel="noopener">birdarcha.uz</a> — business registration') + '</ul>' +
 E("p", "<b>Bepul vositalar:</b>", "<b>Free tools:</b>", 'style="margin-top:8px"') +
 E("p", '<a class="lnk" href="https://docs.google.com" target="_blank" rel="noopener">docs.google.com</a> — tannarx va narx jadvali · <a class="lnk" href="https://www.canva.com" target="_blank" rel="noopener">canva.com</a> — narx varag\'i dizayni',
   '<a class="lnk" href="https://docs.google.com" target="_blank" rel="noopener">docs.google.com</a> — cost and price spreadsheets · <a class="lnk" href="https://www.canva.com" target="_blank" rel="noopener">canva.com</a> — price list design') +
 E("p", "<b>O'qish uchun:</b> Hermann Simon — «Confessions of the Pricing Man» · Rafi Mohammed — «The 1% Windfall» · Philip Kotler — «Marketing Management» (narx bo'limi).", "<b>Further reading:</b> Hermann Simon — “Confessions of the Pricing Man” · Rafi Mohammed — “The 1% Windfall” · Philip Kotler — “Marketing Management” (pricing chapters).", 'style="margin-top:8px"') +
 E("small", "⚠️ Narxlar, soliq stavkalari va platforma komissiyalari o'zgaradi. Har doim amaldagi rasmiy ma'lumotga tayaning.", "⚠️ Prices, tax rates and platform commissions change. Always rely on current official information.", 'class="note"') +
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
 E("p", "Keyingi mashg'ulotgacha o'z mahsulotingiz uchun <b>narx kartochkasini</b> tugallang — keyingi mavzu: biznesda pul oqimini rejalashtirish: kirim, chiqim va mablag' jalb qilish.",
   "Before the next class, finish the <b>price card</b> for your own product — the next topic: planning cash flow in a business: income, spending and raising funds.") +
 E("p", "Termiz davlat universiteti · Tadbirkorlik asoslari", "Termez State University · Fundamentals of Entrepreneurship", 'style="color:var(--muted);font-size:13.5px"') + '</div>')

# ============================ TEST SAVOLLARI ============================
Q = [
 # 1 — pastki chegara (to'g'ri: C)
 dict(q="Mahsulot narxining pastki chegarasini odatda nima belgilaydi?",
      a=["Raqobatchilar orasidagi eng arzon sotuvchining narxi",
         "Mijozlar so'rovnomada aytgan eng past maqbul narx",
         "Bitta dona uchun o'zgaruvchan va doimiy xarajatlar",
         "Bozordagi o'xshash mahsulotlarning o'rtacha narxi"], c=2,
      e="Pastki chegara — to'liq tannarx (o'zgaruvchan xarajat + doimiy xarajat ulushi). Narx undan past bo'lsa, har bir sotuv zarar keltiradi.",
      qe="What usually sets the lower limit of a product's price?",
      ae=["The price of the cheapest seller among competitors",
         "The lowest fair price customers named in a survey",
         "The variable and fixed costs of producing one unit",
         "The average price of similar products on the market"],
      ee="The lower limit is the full cost (variable cost + share of fixed costs). Below it, every sale makes a loss."),
 # 2 — doimiy xarajat (to'g'ri: A)
 dict(q="Sovun ishlab chiqaruvchi uchun quyidagilardan qaysi biri doimiy xarajat hisoblanadi?",
      a=["Ustaxonaning har oy to'lanadigan ijara haqi",
         "Har bir sovunga ketadigan yog' va moylar narxi",
         "Har bir sovun uchun olinadigan qadoq va yorliq",
         "Har bir buyurtmani mijozga yetkazish xarajati"], c=0,
      e="Ijara sotuv soniga bog'liq emas — bitta ham sovun sotilmasa ham to'lanadi. Yog', qadoq va yetkazish esa har bir dona bilan oshadi, ya'ni o'zgaruvchan.",
      qe="For a soap maker, which of the following is a fixed cost?",
      ae=["The workshop rent, which is paid every month",
         "The price of fats and oils used in each soap",
         "The packaging and label bought for each soap",
         "The cost of delivering each order to a buyer"],
      ee="Rent does not depend on the number of sales — it is paid even if no soap is sold. Fats, packaging and delivery grow with every unit, so they are variable."),
 # 3 — to'liq tannarx (to'g'ri: C)
 dict(q="O'zgaruvchan xarajat 1 donaga 9 000 so'm, doimiy xarajat oyiga 1 500 000 so'm, reja — 300 dona. To'liq tannarx qancha?",
      a=["9 000 so'm", "12 000 so'm", "14 000 so'm", "15 000 so'm"], c=2,
      e="Doimiy ulush = 1 500 000 ÷ 300 = 5 000. To'liq tannarx = 9 000 + 5 000 = 14 000 so'm.",
      qe="The variable cost is 9,000 so'm per unit, fixed costs are 1,500,000 so'm a month and the plan is 300 units. What is the full cost?",
      ae=["9,000 so'm", "12,000 so'm", "14,000 so'm", "15,000 so'm"],
      ee="Fixed share = 1,500,000 ÷ 300 = 5,000. Full cost = 9,000 + 5,000 = 14,000 so'm."),
 # 4 — xarajat + ustama (to'g'ri: B)
 dict(q="To'liq tannarx 20 000 so'm, ustama 40%. Xarajat asosidagi narx qancha bo'ladi?",
      a=["24 000 so'm", "28 000 so'm", "30 000 so'm", "33 000 so'm"], c=1,
      e="Narx = tannarx × (1 + ustama) = 20 000 × 1,4 = 28 000 so'm.",
      qe="The full cost is 20,000 so'm and the markup is 40%. What is the cost-plus price?",
      ae=["24,000 so'm", "28,000 so'm", "30,000 so'm", "33,000 so'm"],
      ee="Price = cost × (1 + markup) = 20,000 × 1.4 = 28,000 so'm."),
 # 5 — marja (to'g'ri: B)
 dict(q="Tannarx 30 000 so'm, narx 45 000 so'm. Marja (narxga nisbatan foyda ulushi) taxminan necha foiz?",
      a=["25%", "33%", "50%", "67%"], c=1,
      e="Foyda = 15 000. Marja = 15 000 ÷ 45 000 ≈ 33%. 50% — bu ustama (15 000 ÷ 30 000), marja emas.",
      qe="The cost is 30,000 so'm and the price is 45,000 so'm. What is the margin (profit as a share of the price), roughly?",
      ae=["25%", "33%", "50%", "67%"],
      ee="Profit = 15,000. Margin = 15,000 ÷ 45,000 ≈ 33%. 50% is the markup (15,000 ÷ 30,000), not the margin."),
 # 6 — kirish strategiyasi (to'g'ri: D)
 dict(q="«Kirish» (penetratsiya) narx strategiyasining mazmuni nimadan iborat?",
      a=["Yangi mahsulotni avval qimmat sotib, keyin narxni asta tushirish",
         "Narxni faqat raqobatchilar narxi darajasida ushlab turib sotish",
         "Ataylab yuqori narx qo'yib, uni sifat va maqom belgisi qilish",
         "Bozorga past narx bilan kirib, tez ko'p mijozni jalb qilib olish"], c=3,
      e="Kirish strategiyasi — past narx bilan bozorga kirib, tez mijoz yig'ish. Uning xavfi: keyin narxni oshirish qiyin va zarar ehtimoli bor.",
      qe="What is the essence of the “penetration” pricing strategy?",
      ae=["Selling a new product high first, then lowering the price gradually",
          "Selling only at the same price level as the competitors' prices",
          "Setting a deliberately high price as a sign of quality and status",
          "Entering the market with a low price to win many customers fast"],
      ee="Penetration means entering with a low price to gather customers quickly. Its risk: raising the price later is hard and losses are possible."),
 # 7 — qaymoq olish (to'g'ri: A)
 dict(q="Qaysi holatda «qaymoq olish» strategiyasi eng mos keladi?",
      a=["Mahsulot yangi va noyob, raqobatchilar esa hali bozorda yo'q",
         "Mahsulot oddiy, bozorda o'xshashi ko'p, xaridor narxga sezgir",
         "Mahsulot eskirgan va omborda ko'p qolgan, uni tezda sotish kerak",
         "Mahsulot ulgurji sotiladi va narxni do'konlar belgilab beradi"], c=0,
      e="Qaymoq olish — yangi, noyob mahsulotni avval yuqori narxda sotish. Raqobatchi yo'qligida yangilikka qiziquvchi xaridorlar ko'proq to'laydi.",
      qe="In which situation does the “skimming” strategy fit best?",
      ae=["The product is new and unique, and there are no competitors yet",
          "The product is simple, has many rivals and buyers are price-led",
          "The product is outdated, lots is in stock and must be sold fast",
          "The product is sold wholesale and shops decide the retail price"],
      ee="Skimming means selling a new, unique product at a high price first. With no competitors, early buyers keen on novelty pay more."),
 # 8 — qiymatga asoslangan (to'g'ri: C)
 dict(q="Qiymatga asoslangan narx belgilashda narx asosan nimaga qarab qo'yiladi?",
      a=["Ishlab chiqarish xarajatiga belgilangan foizni qo'shishga",
         "Bozordagi raqobatchilarning eng ko'p uchraydigan narxiga",
         "Mijozga beradigan foydasi va u to'lashga tayyor summaga",
         "Davlat tomonidan belgilangan eng yuqori narx chegarasiga"], c=2,
      e="Qiymatga asoslangan narxda asosiy mezon — mijoz oladigan foyda va u to'lashga tayyor summa. Tannarx esa faqat pastki chegara vazifasini bajaradi.",
      qe="In value-based pricing, what is the price mainly based on?",
      ae=["Adding a set percentage to the cost of making the product",
          "The most common price among competitors on the market",
          "The benefit the product gives and what customers will pay",
          "The highest price limit that has been set by the state"],
      ee="In value-based pricing the main criterion is the benefit the customer gets and the sum they are willing to pay. Cost serves only as the lower limit."),
 # 9 — langar narx (to'g'ri: D)
 dict(q="Asosiy mahsulot (24 000) yonida qimmatroq sovg'a qutisi (35 000) ko'rsatilishining maqsadi nima?",
      a=["Barcha mijozlarni faqat eng qimmat variantni olishga majburlash",
         "Mahsulotning tannarxini mijozga ochiq ko'rsatib qo'yish uchun",
         "Raqobatchilarni narxni tushirishga majbur qilib qo'yish uchun",
         "Asosiy narx oqilona ko'rinishi uchun yoniga langar narx qo'yish"], c=3,
      e="Bu — «langar narx»: yonida qimmatroq variant tursa, asosiy narx mijozga oqilona va o'rtacha ko'rinadi. Ba'zi mijozlar qimmatroq variantni ham tanlaydi.",
      qe="What is the purpose of showing a dearer gift box (35,000) next to the main product (24,000)?",
      ae=["To force all customers to choose only the most expensive option",
         "To openly show the customer the product's cost of production",
         "To push the competitors into cutting their own prices further",
         "To create an anchor so the main price looks fair by comparison"],
      ee="This is an “anchor price”: with a dearer option next to it, the main price looks fair and moderate. Some customers also pick the dearer option."),
 # 10 — zararsiz miqdor (to'g'ri: C)
 dict(q="Doimiy xarajat oyiga 3 000 000 so'm, narx 25 000, o'zgaruvchan xarajat 15 000 so'm. Zararsiz miqdor qancha?",
      a=["120 dona", "200 dona", "300 dona", "375 dona"], c=2,
      e="Hissa = 25 000 − 15 000 = 10 000. Zararsiz miqdor = 3 000 000 ÷ 10 000 = 300 dona.",
      qe="Fixed costs are 3,000,000 so'm a month, the price is 25,000 and the variable cost is 15,000 so'm. What is the break-even quantity?",
      ae=["120 units", "200 units", "300 units", "375 units"],
      ee="Contribution = 25,000 − 15,000 = 10,000. Break-even quantity = 3,000,000 ÷ 10,000 = 300 units."),
 # 11 — chegirma tuzog'i (to'g'ri: D)
 dict(q="Hissa bo'yicha marja 40%. 20% chegirma berilsa, avvalgi foydani saqlash uchun sotuv qanchaga oshishi kerak?",
      a=["+20%", "+25%", "+50%", "+100%"], c=3,
      e="Kerakli o'sish = chegirma ÷ (marja − chegirma) = 20 ÷ (40 − 20) = 100%. Ya'ni sotuvni ikki baravar oshirish kerak.",
      qe="The contribution margin is 40%. If a 20% discount is given, by how much must sales grow to keep the previous profit?",
      ae=["+20%", "+25%", "+50%", "+100%"],
      ee="Required growth = discount ÷ (margin − discount) = 20 ÷ (40 − 20) = 100%. That is, sales must double."),
 # 12 — narxni oshirish (to'g'ri: A)
 dict(q="Narx 20 000 dan 22 000 ga oshdi, o'zgaruvchan xarajat 12 000. Sotuv 300 dan 270 donaga tushdi. Jami hissa qanday o'zgardi?",
      a=["300 000 so'mga oshdi", "240 000 so'mga oshdi", "300 000 so'mga kamaydi", "240 000 so'mga kamaydi"], c=0,
      e="Avval: 300 × 8 000 = 2 400 000. Keyin: 270 × 10 000 = 2 700 000. Hissa 300 000 so'mga oshdi — sotuv kamaysa ham foyda o'sdi.",
      qe="The price rose from 20,000 to 22,000 and the variable cost is 12,000. Sales fell from 300 to 270 units. How did total contribution change?",
      ae=["It rose by 300,000 so'm", "It rose by 240,000 so'm", "It fell by 300,000 so'm", "It fell by 240,000 so'm"],
      ee="Before: 300 × 8,000 = 2,400,000. After: 270 × 10,000 = 2,700,000. Contribution rose by 300,000 so'm — profit grew even though sales fell."),
 # 13 — ulgurji narx (to'g'ri: B)
 dict(q="Do'kon mahsulotga 40% ustama qo'yib, uni 28 000 so'mga sotmoqchi. Ulgurji narxingiz qancha bo'lishi kerak?",
      a=["16 800 so'm", "20 000 so'm", "22 400 so'm", "24 000 so'm"], c=1,
      e="Ulgurji narx = chakana narx ÷ (1 + ustama) = 28 000 ÷ 1,4 = 20 000. 16 800 (28 000 × 0,6) — keng tarqalgan xato hisob.",
      qe="A shop wants to add a 40% markup and sell the product at 28,000 so'm. What should your wholesale price be?",
      ae=["16,800 so'm", "20,000 so'm", "22,400 so'm", "24,000 so'm"],
      ee="Wholesale price = retail price ÷ (1 + markup) = 28,000 ÷ 1.4 = 20,000. 16,800 (28,000 × 0.6) is a common wrong calculation."),
 # 14 — marketpleys komissiyasi (to'g'ri: D)
 dict(q="Marketpleysdagi narx 50 000 so'm, komissiya 15%, o'zgaruvchan xarajat 30 000 so'm. Bitta sotuvdan hissa qancha?",
      a=["5 000 so'm", "7 500 so'm", "15 000 so'm", "12 500 so'm"], c=3,
      e="Komissiya = 50 000 × 15% = 7 500. Sizga qoladi 42 500. Hissa = 42 500 − 30 000 = 12 500 so'm.",
      qe="The marketplace price is 50,000 so'm, the commission is 15% and the variable cost is 30,000 so'm. What is the contribution from one sale?",
      ae=["5,000 so'm", "7,500 so'm", "15,000 so'm", "12,500 so'm"],
      ee="Commission = 50,000 × 15% = 7,500. You keep 42,500. Contribution = 42,500 − 30,000 = 12,500 so'm."),
 # 15 — halol narx (to'g'ri: B)
 dict(q="Quyidagilardan qaysi biri halol narx amaliyotiga mos keladi?",
      a=["Aksiyadan oldin narxni ko'tarib, keyin «−50%» deb e'lon qilish",
         "Yetkazish va qo'shimcha to'lovlarni buyurtmadan oldin aniq aytish",
         "Narxni yashirib, faqat shaxsiy xabarda mijozga qarab aytib berish",
         "Raqobatchilar bilan bir xil narx qo'yishni yashirincha kelishish"], c=1,
      e="Halol narx oldindan va aniq ko'rsatiladi, barcha qo'shimcha to'lovlar bilan. Soxta chegirma, mijozga qarab yashirin narx va raqobatchilar bilan til biriktirish — aldov va qonunbuzarlik xavfi.",
      qe="Which of the following fits honest pricing practice?",
      ae=["Raising the price before a sale, then announcing it as “−50%”",
         "Stating delivery and extra charges clearly before the order",
         "Hiding the price and only telling it privately, by customer",
         "Secretly agreeing with competitors to all set the same price"],
      ee="An honest price is shown in advance and clearly, with all extra charges. Fake discounts, hidden prices that depend on the customer and collusion with competitors are deception and risk breaking the law."),
]
