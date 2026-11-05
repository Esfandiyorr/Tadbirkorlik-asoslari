# -*- coding: utf-8 -*-
"""M7 · CRM nima? — slaydlar va test (yangi_mavzu.py uchun).
T, d, slide — yangi_mavzu.py beradi. Test: 20 savol, ulardan 6 tasi ochiq (bitta so'z yoki son bilan javob, o=[...]).
Ishlatish (shablon — mavzu-6.html: ochiq savollarni ham ko'taradigan test dvigateli shu yerda):
  python3 _reyting-manba/yangi_mavzu.py _reyting-manba/matn/mavzu_7_matn.py mavzu-7.html "CRM nima?" 7 "<tavsif>" mavzu-6.html
  python3 _reyting-manba/inject.py
Hisob-kitoblardagi raqamlar — o'quv misoli (taxminiy), TerDU yoki Termiz bo'yicha statistika emas.
"""

def E(tag, uz, en, attr=""):
    """Tarjimaga tayyor element: <tag data-i=N attr>uz</tag>"""
    return "<" + tag + " " + d(uz, en) + ((" " + attr) if attr else "") + ">" + uz + "</" + tag + ">"

def card(color, icon, uz_t, en_t, uz_p, en_p, style=""):
    return ('<div class="card" style="--c:var(--' + color + ');' + style + '">' +
            (('<span class="icon">' + icon + '</span>') if icon else "") +
            E("h3", uz_t, en_t) + E("p", uz_p, en_p) + '</div>')

def card_ul(color, icon, uz_t, en_t, items, cls="tick", style="", head=None):
    """items: [(uz, en), ...]; head: (uz, en) — ro'yxat oldidagi qisqa izoh"""
    return ('<div class="card" style="--c:var(--' + color + ');' + style + '">' +
            (('<span class="icon">' + icon + '</span>') if icon else "") + E("h3", uz_t, en_t) +
            (E("p", head[0], head[1]) if head else "") +
            '<ul class="' + cls + '">' + "".join(E("li", u, e) for u, e in items) + '</ul></div>')

def TD(uz, en, cls=""):
    return E("td", uz, en, ('class="' + cls + '"') if cls else "")

def table(heads, rows):
    """heads: [(uz, en)], rows: [[TD(...), ...]]"""
    head = ('<thead><tr>' + "".join(E("th", u, e) for u, e in heads) + '</tr></thead>') if heads else ''
    return ('<div class="tw"><table>' + head + '<tbody>' +
            "".join("<tr>" + "".join(r) + "</tr>" for r in rows) + '</tbody></table></div>')

def fact(uz_b, en_b, uz_p, en_p):
    return '<div class="fact">' + E("b", uz_b, en_b) + E("p", uz_p, en_p) + '</div>'

def pills(items):
    """items: [(uz, en, yashilmi)]"""
    return "".join('<span class="pill' + (' g' if g else '') + '">' + u + '</span>' for u, e, g in items), \
           "".join('<span class="pill' + (' g' if g else '') + '">' + e + '</span>' for u, e, g in items)

# ============================ 1. MUQOVA ============================
slide("Muqova", "Cover",
 '<div class="inner title-wrap">'
 '<div class="big-logo terdu-logo" role="img" aria-label="Termiz davlat universiteti logotipi"></div><div>' +
 E("span", "M7-mavzu · Ma'ruza · 2 soat", "Topic 7 · Lecture · 2 hours", 'class="kicker"') +
 E("h1", "CRM NIMA?", "WHAT IS CRM?", 'class="grad"') +
 E("p", "Mijozlar bilan munosabatlarni boshqarish: tushuncha va tarix · CRM turlari · mijoz hayot sikli va <b>sotuv voronkasi</b> · mijoz kartochkasi va <b>RFM</b> segmentatsiya · <b>LTV, CAC, churn, NPS</b> · Salesforce, HubSpot, Bitrix24 va amoCRM · Telegram va Google Sheets'da <b>mini-CRM</b> · shaxsiy ma'lumotlar himoyasi.",
   "Customer relationship management: the concept and its history · types of CRM · the customer life cycle and the <b>sales funnel</b> · the customer record and <b>RFM</b> segmentation · <b>LTV, CAC, churn, NPS</b> · Salesforce, HubSpot, Bitrix24 and amoCRM · a <b>mini-CRM</b> in Telegram and Google Sheets · protecting personal data.", 'class="lead"') +
 '<div class="meta">' +
 E("div", "📚 Fan: <b>Tadbirkorlik asoslari</b>", "📚 Course: <b>Fundamentals of Entrepreneurship</b>") +
 E("div", "🎓 <b>Termiz davlat universiteti</b>", "🎓 <b>Termez State University</b>") +
 E("div", "🗂 <b>24</b> slayd · <b>20</b> ta test", "🗂 <b>24</b> slides · <b>20</b> test questions") +
 E("div", "⌨️ <b>→</b> tugmasi bilan davom eting", "⌨️ Press <b>→</b> to continue") +
 '</div></div></div>')

# ============================ 2. MAQSAD ============================
slide("Maqsad va natijalar", "Aims and outcomes",
 E("span", "Mavzuning maqsadi", "Aim of the topic", 'class="kicker"') +
 E("h2", "Mashg'ulot yakunida talaba <span class=\"grad\">nima qila oladi?</span>", "What will the student <span class=\"grad\">be able to do?</span>") +
 E("div", "Maqsad: talabani <b>\"mijoz keldi — ketdi\"</b> fikrlashidan <b>\"har bir mijoz — uzoq muddatli munosabat va hisoblanadigan qiymat\"</b> fikrlashiga o'tkazish. CRM — bu <b>dastur emas</b>, avvalo mijozga munosabat <b>tizimi</b>: kim, qachon, nima sotib oldi va unga keyin nima taklif qilamiz.",
   "Aim: to move the student from <b>\"a customer came and went\"</b> to <b>\"every customer is a long-term relationship with a value we can calculate\"</b>. CRM is <b>not a piece of software</b> but first of all a <b>system</b> for treating customers: who bought what and when, and what we offer them next.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("green", "📘", "Tushuntira oladi", "Can explain", "CRM nima ekanini, u strategiya, jarayon va texnologiyadan iboratligini izohlaydi.", "Explains what CRM is and that it combines strategy, process and technology.") +
 card("blue", "🔁", "Chiza oladi", "Can draw", "Mijoz hayot siklini va o'z biznesi uchun sotuv voronkasi bosqichlarini chizadi.", "Draws the customer life cycle and the stages of a sales funnel for a business.") +
 card("violet", "🗂", "Tuza oladi", "Can build", "Mijoz kartochkasini tuzadi, mijozlarni RFM usulida guruhlarga ajratadi.", "Designs a customer record and groups customers with the RFM method.") +
 card("orange", "🧮", "Hisoblay oladi", "Can calculate", "Konversiya, LTV, CAC, churn va NPS ni hisoblab, natijani izohlaydi.", "Calculates conversion, LTV, CAC, churn and NPS and interprets the result.") +
 card("pink", "🧰", "Tanlay oladi", "Can choose", "Kichik biznes uchun mos CRM vositasini tanlaydi yoki mini-CRM yasaydi.", "Chooses a suitable CRM tool for a small business or builds a mini-CRM.") +
 card("cyan", "🛡", "Himoya qila oladi", "Can protect", "Mijoz ma'lumotlarini qonun va odob doirasida yig'ish va saqlash qoidalarini biladi.", "Knows the rules for collecting and storing customer data lawfully and ethically.") +
 '</div>')

# ============================ 3. REJA ============================
_pu, _pe = pills([("CRM", "CRM", 1), ("mijoz", "customer", 0), ("lid", "lead", 1), ("kontakt", "contact", 0),
                  ("bitim", "deal", 0), ("sotuv voronkasi", "sales funnel", 1), ("konversiya", "conversion", 1),
                  ("mijoz hayot sikli", "customer life cycle", 0), ("mijoz kartochkasi", "customer record", 1),
                  ("segmentatsiya", "segmentation", 0), ("RFM tahlili", "RFM analysis", 1), ("sodiqlik", "loyalty", 0),
                  ("LTV", "LTV", 1), ("CAC", "CAC", 1), ("churn", "churn", 1), ("retention", "retention", 0), ("NPS", "NPS", 1),
                  ("omnikanal", "omnichannel", 0), ("avtomatlashtirish", "automation", 0), ("trigger", "trigger", 0),
                  ("operatsion CRM", "operational CRM", 0), ("analitik CRM", "analytical CRM", 0), ("shaxsiy ma'lumotlar", "personal data", 1)])
slide("Reja va tushunchalar", "Plan and concepts",
 E("span", "Ma'ruza rejasi", "Lecture plan", 'class="kicker"') +
 E("h2", "Bugungi <span class=\"grad\">5 ta blok</span>", "Today's <span class=\"grad\">five blocks</span>") +
 '<div class="grid g5">' +
 card("green", "1️⃣", "CRM nima", "What CRM is", "Ta'rif, tarix va nega kerakligi.", "Definition, history and why it matters.") +
 card("blue", "2️⃣", "Mijoz yo'li", "The customer's path", "Hayot sikli, voronka, lid va bitim.", "Life cycle, funnel, leads and deals.") +
 card("violet", "3️⃣", "Ma'lumot", "Data", "Kartochka, segmentatsiya, RFM.", "Records, segmentation, RFM.") +
 card("orange", "4️⃣", "Raqamlar", "Numbers", "Konversiya, LTV, CAC, churn, NPS.", "Conversion, LTV, CAC, churn, NPS.") +
 card("pink", "5️⃣", "Amaliyot", "Practice", "Tizimlar, mini-CRM, xatolar, qonun.", "Systems, a mini-CRM, mistakes, the law.") +
 '</div>' +
 E("h3", "🔑 Tayanch tushunchalar", "🔑 Key concepts", 'style="margin-top:22px"') +
 E("div", _pu, _pe))

# ============================ 4. CRM NIMA ============================
slide("CRM nima?", "What is CRM?",
 E("span", "1-blok", "Block 1", 'class="kicker"') +
 E("h2", "CRM — <span class=\"grad\">mijoz bilan munosabatni boshqarish</span>", "CRM — <span class=\"grad\">managing the relationship with the customer</span>") +
 E("div", "<b>CRM</b> (inglizcha <i>Customer Relationship Management</i>) — kompaniyaning <b>mijozlarni jalb qilish, ularga xizmat ko'rsatish va ularni ushlab qolish</b> bo'yicha strategiyasi, ish jarayonlari va bu ishni qo'llab-quvvatlaydigan <b>axborot tizimi</b>. Asosiy g'oya: mijoz haqidagi barcha ma'lumot <b>bitta joyda</b> turadi va har bir xodim uni ko'ra oladi.",
   "<b>CRM</b> (<i>Customer Relationship Management</i>) is a company's strategy and set of work processes for <b>attracting, serving and keeping customers</b>, together with the <b>information system</b> that supports that work. The core idea: everything known about a customer sits <b>in one place</b> and every employee can see it.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("green", "🧭", "Strategiya", "Strategy", "Qaysi mijozlar biz uchun eng qimmatli, ularga qanday munosabatda bo'lamiz va qanday qilib qaytaramiz.", "Which customers are worth most to us, how we treat them and how we bring them back.") +
 card("blue", "🔁", "Jarayon", "Process", "Qo'ng'iroq, xat, uchrashuv, taklif, xarid va xizmat — har bir qadam aniq tartibda va javobgar xodim bilan.", "Calls, messages, meetings, offers, purchases and service — every step in a clear order with a named owner.") +
 card("violet", "💻", "Texnologiya", "Technology", "Mijozlar bazasi, voronka, vazifalar, eslatmalar va hisobotlarni yurituvchi dastur yoki xizmat.", "The software or service that keeps the customer base, the funnel, tasks, reminders and reports.") +
 '</div>' +
 E("div", "📌 <b>Asosiy qoida:</b> CRM dasturini sotib olish <b>CRM ni joriy qilish degani emas</b>. Agar xodimlar mijoz bilan har bir aloqani yozib bormasa, eng qimmat dastur ham bo'sh jadvalga aylanadi.",
   "📌 <b>The key rule:</b> buying CRM software <b>is not the same as adopting CRM</b>. If staff do not record every contact with a customer, even the most expensive system becomes an empty table.", 'class="quote" style="margin-top:16px"') +
 E("h3", "📜 Tarixdan", "📜 A short history", 'style="margin-top:20px"') +
 '<div class="grid g3">' +
 fact("1980-yillar · Ma'lumotlar bazasi marketingi", "1980s · Database marketing",
      "Kompaniyalar mijozlar ro'yxatini kompyuterda yurita boshladi va ularga maqsadli xat yubordi.",
      "Companies began to keep customer lists on computers and send them targeted mail.") +
 fact("1987 · ACT!", "1987 · ACT!",
      "Pat Sallivan va Mayk Muhni yaratgan «kontakt menejeri»: ism, telefon va uchrashuvlar bitta dasturda.",
      "The \"contact manager\" created by Pat Sullivan and Mike Muhney: names, phones and meetings in one program.") +
 fact("1999 · Salesforce", "1999 · Salesforce",
      "Mark Benioff CRM ni birinchilardan bo'lib internet orqali obuna xizmati (SaaS) sifatida taklif qildi — o'rnatish shart emas.",
      "Marc Benioff was among the first to offer CRM as an online subscription service (SaaS) — nothing to install.") +
 '</div>')

# ============================ 5. NEGA KERAK ============================
slide("Nega CRM kerak?", "Why CRM matters",
 E("span", "1.2 · Raqamlar tili", "1.2 · The language of numbers", 'class="kicker"') +
 E("h2", "Eski mijozni saqlash — <span class=\"grad\">yangisini topishdan arzon</span>", "Keeping a customer — <span class=\"grad\">is cheaper than finding a new one</span>") +
 '<div class="grid g3">' +
 card("green", "💸", "5–25 barobar", "5 to 25 times", "Harvard Business Review (2014) ma'lumotiga ko'ra, yangi mijozni jalb qilish mavjudini ushlab qolishdan <b>5–25 barobar qimmat</b> turadi.", "According to Harvard Business Review (2014), winning a new customer costs <b>5 to 25 times more</b> than keeping an existing one.") +
 card("blue", "📈", "+5% → +25–95%", "+5% → +25–95%", "Bain & Company tadqiqotlari (Frederik Reyxxeld): mijozlarni ushlab qolish darajasini <b>5% ga</b> oshirish foydani <b>25–95% ga</b> ko'paytirishi mumkin.", "Research by Bain & Company (Frederick Reichheld): raising customer retention by <b>5%</b> can lift profit by <b>25–95%</b>.") +
 card("violet", "⚖️", "Pareto qoidasi", "The Pareto rule", "Ko'p bizneslarda daromadning katta qismini (taxminan <b>80%</b>) mijozlarning kichik qismi (taxminan <b>20%</b>) beradi. CRM ana shu mijozlarni topadi.", "In many businesses most of the revenue (about <b>80%</b>) comes from a small share of customers (about <b>20%</b>). CRM finds those customers.") +
 '</div>' +
 '<div class="grid g2" style="margin-top:16px">' +
 card_ul("red", "📓", "CRM bo'lmasa", "Without CRM",
         [("Mijozlar sotuvchining <b>telefoni va daftarida</b> — u ishdan ketsa, mijozlar ham ketadi", "Customers live in a salesperson's <b>phone and notebook</b> — when they leave, the customers leave too"),
          ("Qo'ng'iroq qilish va'da qilingan, lekin <b>unutilgan</b>", "A promised call-back is <b>forgotten</b>"),
          ("Ikki xodim bitta mijozga <b>bir xil taklif</b>ni ikki marta yuboradi", "Two employees send the same customer <b>the same offer</b> twice"),
          ("Rahbar «nechta bitim yaqinda yopiladi?» savoliga <b>javob topa olmaydi</b>", "The manager <b>cannot answer</b> \"how many deals will close soon?\"")], cls="tick cross") +
 card_ul("green", "🗂", "CRM bo'lsa", "With CRM",
         [("Har bir mijozning <b>xaridlar va aloqalar tarixi</b> bitta kartochkada", "Each customer's <b>purchase and contact history</b> sits in one record"),
          ("Tizim o'zi <b>eslatadi</b>: «Bugun Dilshodga qo'ng'iroq qiling»", "The system <b>reminds</b> you: \"Call Dilshod today\""),
          ("Kim qaysi mijoz bilan ishlayotgani <b>hammaga ko'rinadi</b>", "Who is handling which customer is <b>visible to all</b>"),
          ("Voronka va hisobotlar sotuv rejasini <b>raqamda</b> ko'rsatadi", "The funnel and reports show the sales plan <b>in numbers</b>")]) +
 '</div>')

# ============================ 6. CRM TURLARI ============================
slide("CRM turlari", "Types of CRM",
 E("span", "1.3 · Tasnif", "1.3 · Classification", 'class="kicker"') +
 E("h2", "Uch asosiy tur: <span class=\"grad\">operatsion, analitik, hamkorlik</span>", "Three main types: <span class=\"grad\">operational, analytical, collaborative</span>") +
 table([("Tur", "Type"), ("Nima qiladi", "What it does"), ("Misol", "Example")], [
  [TD("<b>⚙️ Operatsion CRM</b>", "<b>⚙️ Operational CRM</b>"), TD("Kundalik ishni <b>avtomatlashtiradi</b>: sotuv (lid, bitim, taklif), marketing (xat, SMS, aksiya) va xizmat (murojaat, kafolat)", "<b>Automates</b> daily work: sales (leads, deals, quotes), marketing (email, SMS, campaigns) and service (requests, warranty)"), TD("Yangi lid kelsa, tizim uni menejerga biriktiradi va 15 daqiqada qo'ng'iroq qilish vazifasini qo'yadi", "When a new lead arrives the system assigns it to a manager and sets a task to call within 15 minutes")],
  [TD("<b>📊 Analitik CRM</b>", "<b>📊 Analytical CRM</b>"), TD("Yig'ilgan ma'lumotni <b>tahlil qiladi</b>: segmentlar, xarid odatlari, ketish xavfi, eng foydali mijozlar", "<b>Analyses</b> the collected data: segments, buying habits, churn risk, the most profitable customers"), TD("«Oxirgi 60 kunda xarid qilmagan, avval oyiga 3 marta kelgan mijozlar» ro'yxati", "A list of \"customers who used to come three times a month but have not bought in 60 days\"")],
  [TD("<b>🤝 Hamkorlik CRM</b>", "<b>🤝 Collaborative CRM</b>"), TD("Bo'limlar va kanallar o'rtasida ma'lumotni <b>bo'lishadi</b>: sotuv, xizmat, omborxona va hamkorlar bir mijozni bir xil ko'radi", "<b>Shares</b> data across departments and channels: sales, service, the warehouse and partners all see the same customer"), TD("Mijoz Telegram'da yozgan shikoyatni xizmat bo'limi ko'radi, sotuvchi esa yangi taklifni to'xtatib turadi", "The service team sees a complaint the customer wrote on Telegram, and sales pauses a new offer")],
 ]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("blue", "☁️", "Bulutli (SaaS) yoki o'z serverida", "Cloud (SaaS) or on-premise", "<b>Bulutli</b> CRM oylik obuna bilan ishlaydi, internet bo'lsa bas. <b>O'z serverida</b> o'rnatilgan CRM qimmatroq, lekin ma'lumot to'liq kompaniya nazoratida.", "<b>Cloud</b> CRM runs on a monthly subscription — the internet is all you need. <b>On-premise</b> CRM costs more but the data stays fully under the company's control.") +
 card("orange", "🎯", "Qaysi biri kerak?", "Which one do you need?", "Kichik biznes odatda <b>operatsion</b> CRM dan boshlaydi. Mijozlar soni yuzlab bo'lganda <b>analitika</b>, bo'limlar ko'payganda <b>hamkorlik</b> imkoniyatlari muhim bo'ladi.", "A small business usually starts with <b>operational</b> CRM. <b>Analytics</b> matters once customers number in the hundreds, and <b>collaboration</b> once there are several departments.") +
 '</div>')

# ============================ 7. HAYOT SIKLI ============================
slide("Mijoz hayot sikli", "The customer life cycle",
 E("span", "2-blok", "Block 2", 'class="kicker"') +
 E("h2", "Mijoz yo'li: <span class=\"grad\">tanishuvdan tavsiyagacha</span>", "The customer's path: <span class=\"grad\">from first contact to recommendation</span>") +
 E("div", "<b>Mijoz hayot sikli</b> — inson brendni ilk bor eshitganidan boshlab, uning doimiy xaridori va targ'ibotchisi bo'lgunicha bosib o'tadigan bosqichlar. Har bir bosqichda CRM <b>boshqa vazifani</b> bajaradi.",
   "The <b>customer life cycle</b> is the set of stages a person goes through from first hearing about a brand to becoming its regular buyer and promoter. At each stage CRM does <b>a different job</b>.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("cyan", "👀", "① Xabardorlik", "① Awareness", "Inson brendni ko'radi: Instagram reklamasi, do'stining gapi, ko'chadagi banner. <b>CRM:</b> qaysi kanaldan kelganini yozib qo'yadi.", "The person sees the brand: an Instagram ad, a friend's word, a street banner. <b>CRM:</b> records which channel they came from.") +
 card("blue", "🤔", "② Qiziqish", "② Interest", "Narxni so'raydi, saytga kiradi, botga yozadi — u endi <b>lid</b>. <b>CRM:</b> lidni menejerga biriktiradi.", "They ask the price, visit the site, message the bot — they are now a <b>lead</b>. <b>CRM:</b> assigns the lead to a manager.") +
 card("violet", "🛒", "③ Xarid", "③ Purchase", "Birinchi bitim. <b>CRM:</b> nima, qachon va qanchaga sotib olinganini saqlaydi.", "The first deal. <b>CRM:</b> stores what was bought, when and for how much.") +
 card("green", "😊", "④ Foydalanish", "④ Use", "Mijoz mahsulotdan foydalanadi, savol beradi. <b>CRM:</b> murojaatlarni va ularning yechimini yozadi.", "The customer uses the product and asks questions. <b>CRM:</b> logs requests and how they were solved.") +
 card("orange", "🔁", "⑤ Takroriy xarid", "⑤ Repeat purchase", "Mijoz qaytadi — <b>sodiqlik</b> shakllanadi. <b>CRM:</b> vaqtida eslatma va shaxsiy taklif yuboradi.", "The customer comes back — <b>loyalty</b> forms. <b>CRM:</b> sends a timely reminder and a personal offer.") +
 card("pink", "📣", "⑥ Tavsiya", "⑥ Advocacy", "Mijoz do'stlariga tavsiya qiladi. <b>CRM:</b> «do'stingizni olib keling» bonusini hisoblaydi.", "The customer recommends you to friends. <b>CRM:</b> tracks the \"bring a friend\" bonus.") +
 '</div>' +
 E("div", "⚠️ Siklning eng xavfli joyi — <b>④ va ⑤ orasi</b>: mijoz bir marta sotib oldi-yu, keyin unutildi. Aynan shu yerda raqobatchi uni olib ketadi.",
   "⚠️ The most dangerous point of the cycle is <b>between ④ and ⑤</b>: the customer bought once and was then forgotten. That is exactly where a competitor takes them away.", 'class="quote" style="margin-top:14px"'))

# ============================ 8. SOTUV VORONKASI ============================
slide("Sotuv voronkasi", "The sales funnel",
 E("span", "2.2 · Asosiy vosita", "2.2 · The main tool", 'class="kicker"') +
 E("h2", "Sotuv voronkasi — <span class=\"grad\">har qadamda qancha mijoz qoladi?</span>", "The sales funnel — <span class=\"grad\">how many customers remain at each step?</span>") +
 E("div", "<b>Sotuv voronkasi</b> — potensial mijozning birinchi aloqadan bitim yopilgunicha o'tadigan bosqichlari. U <b>voronka</b> deyiladi, chunki har bosqichda odamlar soni kamayadi. <b>Konversiya</b> — keyingi bosqichga o'tganlar ulushi.",
   "The <b>sales funnel</b> is the sequence of stages a prospect passes through from first contact to a closed deal. It is called a <b>funnel</b> because the number of people shrinks at every stage. <b>Conversion</b> is the share that moves on to the next stage.", 'class="def"') +
 table([("Bosqich", "Stage"), ("Odamlar soni", "People"), ("Konversiya", "Conversion"), ("CRMdagi harakat", "Action in CRM")], [
  [TD("<b>1. Ko'rganlar</b> (reklama, post)", "<b>1. Reached</b> (ad, post)"), TD("5 000", "5,000"), TD("—", "—"), TD("Manba yoziladi: Instagram, Telegram, banner", "The source is recorded: Instagram, Telegram, banner")],
  [TD("<b>2. Lidlar</b> (yozdi yoki qo'ng'iroq qildi)", "<b>2. Leads</b> (wrote or called)"), TD("250", "250"), TD("5%", "5%"), TD("Lid kartochkasi ochiladi, menejer biriktiriladi", "A lead record is opened and a manager assigned")],
  [TD("<b>3. Saralangan lidlar</b>", "<b>3. Qualified leads</b>"), TD("100", "100"), TD("40%", "40%"), TD("Ehtiyoj, byudjet va muddat aniqlanadi", "Need, budget and timing are confirmed")],
  [TD("<b>4. Taklif yuborildi</b>", "<b>4. Proposal sent</b>"), TD("50", "50"), TD("50%", "50%"), TD("Narx va shartlar yuboriladi, eslatma qo'yiladi", "Price and terms are sent, a reminder is set")],
  [TD("<b>5. Bitim yopildi</b>", "<b>5. Deal won</b>"), TD("<b>15</b>", "<b>15</b>"), TD("30%", "30%"), TD("To'lov, yetkazish va keyingi aloqa sanasi", "Payment, delivery and the next contact date")],
 ]) +
 E("div", "🧮 <b>Umumiy konversiya:</b> 15 ÷ 5 000 = <b>0,3%</b>, lidlardan bitimga: 15 ÷ 250 = <b>6%</b>. Voronkaning qaysi qavati eng ko'p odamni yo'qotayotganini ko'rgan rahbar <b>aynan shu joyni</b> tuzatadi: masalan, taklif yuborilgach 3 kunda qo'ng'iroq qilish qoidasi joriy etiladi.",
   "🧮 <b>Overall conversion:</b> 15 ÷ 5,000 = <b>0.3%</b>; from leads to deals: 15 ÷ 250 = <b>6%</b>. A manager who sees which layer of the funnel loses the most people fixes <b>exactly that spot</b> — for example, a rule to call back within three days of sending a proposal.", 'class="quote" style="margin-top:14px"'))

# ============================ 9. CRM OBYEKTLARI ============================
slide("Lid, kontakt, bitim", "Lead, contact, deal",
 E("span", "2.3 · CRM lug'ati", "2.3 · CRM vocabulary", 'class="kicker"') +
 E("h2", "CRM ichida nimalar saqlanadi? <span class=\"grad\">6 ta asosiy obyekt</span>", "What lives inside a CRM? <span class=\"grad\">Six core objects</span>") +
 '<div class="grid g3">' +
 card("cyan", "🧲", "Lid", "Lead", "Qiziqish bildirgan, lekin hali <b>tekshirilmagan</b> potensial mijoz: botga «narxi qancha?» deb yozgan odam.", "A potential customer who showed interest but has <b>not been qualified</b> yet: someone who asked the bot \"how much is it?\".") +
 card("blue", "👤", "Kontakt", "Contact", "Aniq inson: ismi, telefoni, Telegram'i, tug'ilgan kuni, rozilik holati. Bir kontakt bir necha bitimda qatnashishi mumkin.", "A specific person: name, phone, Telegram, birthday, consent status. One contact can take part in several deals.") +
 card("violet", "🏢", "Kompaniya", "Account", "B2B savdoda mijoz — tashkilot. Unga bir nechta kontakt (direktor, buxgalter, omborchi) bog'lanadi.", "In B2B sales the customer is an organisation. Several contacts (director, accountant, storekeeper) belong to it.") +
 card("green", "🤝", "Bitim", "Deal", "Aniq savdo imkoniyati: summa, bosqich, ehtimollik va yopilish sanasi. Voronkadagi har bir «kartochka» — bitim.", "A specific sales opportunity: amount, stage, probability and close date. Every card in the funnel is a deal.") +
 card("orange", "✅", "Vazifa", "Task", "Kim, nima va qachongacha qiladi: «Ertaga 10:00 da Malikaga taklifni yuborish». Muddati o'tsa — tizim ogohlantiradi.", "Who does what by when: \"Send Malika the proposal at 10:00 tomorrow\". If it is overdue the system warns you.") +
 card("pink", "🕓", "Faoliyat tarixi", "Activity history", "Barcha qo'ng'iroqlar, xatlar, uchrashuvlar va izohlar — xronologik tartibda. Yangi xodim ham mijoz bilan nima bo'lganini 1 daqiqada tushunadi.", "Every call, message, meeting and note in time order. Even a new employee understands the history with a customer in a minute.") +
 '</div>' +
 E("small", "Lid → (tekshiruv) → kontakt + bitim → (yutildi) → mijoz. Yutqazilgan bitim ham o'chirilmaydi: <b>sababi</b> yoziladi (qimmat, muddat, raqobatchi) — bu keyingi tahlil uchun oltin ma'lumot.",
   "Lead → (qualification) → contact + deal → (won) → customer. A lost deal is never deleted: its <b>reason</b> is recorded (too expensive, timing, competitor) — gold for later analysis.", 'class="note"'))

# ============================ 10. MIJOZ KARTOCHKASI ============================
slide("Mijoz kartochkasi", "The customer record",
 E("span", "3-blok", "Block 3", 'class="kicker"') +
 E("h2", "Mijoz kartochkasi — <span class=\"grad\">bir qarashda butun tarix</span>", "The customer record — <span class=\"grad\">the whole history at a glance</span>") +
 '<div class="grid g2">' +
 '<div>' +
 table([("Maydon", "Field"), ("Namuna", "Sample")], [
  [TD("<b>Ism, familiya</b>", "<b>Name</b>"), TD("Dilnoza Rahimova", "Dilnoza Rahimova")],
  [TD("<b>Telefon / Telegram</b>", "<b>Phone / Telegram</b>"), TD("+998 9X XXX XX XX · @dilnoza_r", "+998 9X XXX XX XX · @dilnoza_r")],
  [TD("<b>Manba</b>", "<b>Source</b>"), TD("Instagram reklama, 2026-yil sentabr", "Instagram ad, September 2026")],
  [TD("<b>Xaridlar</b>", "<b>Purchases</b>"), TD("7 ta · jami 840 000 so'm · o'rtacha chek 120 000", "7 · 840,000 so'm in total · average 120,000")],
  [TD("<b>Oxirgi xarid</b>", "<b>Last purchase</b>"), TD("12 kun oldin", "12 days ago")],
  [TD("<b>Qiziqishlar</b>", "<b>Interests</b>"), TD("Shokoladli tort, tug'ilgan kun buyurtmalari", "Chocolate cake, birthday orders")],
  [TD("<b>Muhim sana</b>", "<b>Key date</b>"), TD("Qizining tug'ilgan kuni — 3-mart", "Her daughter's birthday — 3 March")],
  [TD("<b>Rozilik</b>", "<b>Consent</b>"), TD("✅ Aksiya xabarlariga rozi (Telegram)", "✅ Agreed to promotions (Telegram)")],
  [TD("<b>Mas'ul</b>", "<b>Owner</b>"), TD("Menejer: Sardor", "Manager: Sardor")],
 ]) + '</div>' +
 '<div>' +
 card_ul("green", "✅", "Yaxshi kartochka qoidalari", "Rules for a good record",
         [("Faqat <b>ishlatiladigan</b> maydonlar — 40 ta maydonni hech kim to'ldirmaydi", "Only fields <b>you actually use</b> — nobody fills in 40 fields"),
          ("Telefon <b>bitta formatda</b>: +998 XX XXX XX XX — dublikatlar topiladi", "Phone numbers in <b>one format</b>: +998 XX XXX XX XX — duplicates get caught"),
          ("Har aloqadan keyin <b>bir qatorli izoh</b>: «tort narxini so'radi, 2-martda qayta yozamiz»", "<b>A one-line note</b> after every contact: \"asked the cake price, follow up on 2 March\""),
          ("<b>Keyingi qadam</b> doim belgilanadi: sana va javobgar", "<b>The next step</b> is always set: a date and an owner")]) +
 card("orange", "🎂", "Shaxsiy yondashuv", "A personal touch", "Kartochkadagi «3-mart» degan yozuv tufayli qandolatchi 25-fevralda Dilnozaga yozadi: «Qizingizning tug'ilgan kuniga tort tayyorlaymizmi?» — bu <b>reklama emas, xizmat</b>.", "Thanks to the note \"3 March\", the baker writes to Dilnoza on 25 February: \"Shall we make a cake for your daughter's birthday?\" — that is <b>service, not advertising</b>.", style="margin-top:14px") +
 '</div></div>')

# ============================ 11. RFM ============================
slide("Segmentatsiya va RFM", "Segmentation and RFM",
 E("span", "3.2 · Mijozlarni guruhlash", "3.2 · Grouping customers", 'class="kicker"') +
 E("h2", "RFM tahlili — <span class=\"grad\">3 ta savol, 1 ta xulosa</span>", "RFM analysis — <span class=\"grad\">three questions, one conclusion</span>") +
 E("div", "<b>RFM</b> — mijozlarni xarid xulqiga qarab guruhlash usuli: <b>R</b>ecency — oxirgi xariddan beri qancha vaqt o'tdi; <b>F</b>requency — qanchalik tez-tez xarid qiladi; <b>M</b>onetary — qancha pul sarflaydi. Har bir ko'rsatkichga 1 dan 5 gacha ball beriladi.",
   "<b>RFM</b> groups customers by buying behaviour: <b>R</b>ecency — how long since the last purchase; <b>F</b>requency — how often they buy; <b>M</b>onetary — how much they spend. Each measure gets a score from 1 to 5.", 'class="def"') +
 table([("Segment", "Segment"), ("R · F · M", "R · F · M"), ("Kim bular?", "Who are they?"), ("Nima qilamiz?", "What do we do?")], [
  [TD("<b>🏆 Chempionlar</b>", "<b>🏆 Champions</b>"), TD("5 · 5 · 5", "5 · 5 · 5"), TD("Yaqinda, tez-tez va ko'p xarid qiladi", "Bought recently, buy often and spend a lot"), TD("Yangi mahsulotni birinchi bo'lib taklif qilish, VIP xizmat", "Offer new products first, VIP service")],
  [TD("<b>💚 Sodiqlar</b>", "<b>💚 Loyal</b>"), TD("4 · 4 · 3", "4 · 4 · 3"), TD("Muntazam keladi, o'rtacha sarflaydi", "Come regularly, spend an average amount"), TD("Sodiqlik dasturi, ballar, kattaroq xaridga taklif", "Loyalty programme, points, an upsell")],
  [TD("<b>🌱 Yangilar</b>", "<b>🌱 New</b>"), TD("5 · 1 · 1", "5 · 1 · 1"), TD("Yaqinda birinchi marta sotib oldi", "Bought for the first time recently"), TD("Xush kelibsiz xati, 2-xarid uchun kichik bonus", "A welcome message and a small bonus for the second purchase")],
  [TD("<b>⚠️ Xavf ostida</b>", "<b>⚠️ At risk</b>"), TD("2 · 4 · 4", "2 · 4 · 4"), TD("Ilgari ko'p kelgan, endi to'xtagan", "Used to come often, now stopped"), TD("Shaxsiy qo'ng'iroq: «Nima yoqmadi?», qaytish taklifi", "A personal call: \"what went wrong?\", a win-back offer")],
  [TD("<b>💤 Uxlab qolganlar</b>", "<b>💤 Hibernating</b>"), TD("1 · 1 · 1", "1 · 1 · 1"), TD("Ancha oldin bir marta kelgan", "Came once a long time ago"), TD("Kamdan-kam, arzon xabar; ko'p mablag' sarflamaslik", "Rare, low-cost messages; do not spend much")],
 ]) +
 E("div", "🎯 RFM ning kuchi — <b>har bir guruhga boshqa xabar</b>. «Chempion»ga chegirma berish shart emas, u baribir keladi; «xavf ostida»gi mijozga esa bitta shaxsiy qo'ng'iroq yuzta reklama postidan samaraliroq.",
   "🎯 The power of RFM is <b>a different message for each group</b>. A \"champion\" does not need a discount — they will come anyway; for an \"at risk\" customer one personal call works better than a hundred ad posts.", 'class="quote" style="margin-top:14px"'))

# ============================ 12. METRIKALAR ============================
slide("CRM metrikalari", "CRM metrics",
 E("span", "4-blok", "Block 4", 'class="kicker"') +
 E("h2", "O'lchanmagan narsa <span class=\"grad\">boshqarilmaydi</span>", "What is not measured <span class=\"grad\">cannot be managed</span>") +
 '<div class="grid g3">' +
 card("green", "🔄", "Konversiya", "Conversion", "Keyingi bosqichga o'tganlar ulushi. <b>Konversiya = bitimlar ÷ lidlar × 100%</b>.", "The share who move to the next stage. <b>Conversion = deals ÷ leads × 100%</b>.") +
 card("blue", "🧾", "O'rtacha chek", "Average order value", "Bir xariddagi o'rtacha summa. <b>O'rtacha chek = tushum ÷ xaridlar soni</b>.", "The average amount per purchase. <b>AOV = revenue ÷ number of purchases</b>.") +
 card("violet", "💎", "LTV", "LTV", "Mijozning butun munosabat davomida keltiradigan foydasi. <b>LTV = o'rtacha chek × oyiga xaridlar × oylar soni × marja</b>.", "The profit a customer brings over the whole relationship. <b>LTV = AOV × purchases per month × months × margin</b>.") +
 card("orange", "🎣", "CAC", "CAC", "Bitta yangi mijozni jalb qilish narxi. <b>CAC = marketing va sotuv xarajati ÷ yangi mijozlar</b>. Sog'lom biznesda odatda <b>LTV ÷ CAC ≥ 3</b>.", "The cost of winning one new customer. <b>CAC = marketing and sales spend ÷ new customers</b>. A healthy business usually has <b>LTV ÷ CAC ≥ 3</b>.") +
 card("red", "🚪", "Churn va retention", "Churn and retention", "<b>Churn</b> — davr boshidagi mijozlardan ketganlar ulushi. <b>Retention = 100% − churn</b>. 1 000 tadan 50 tasi ketsa, churn = <b>5%</b>.", "<b>Churn</b> is the share of customers at the start of a period who left. <b>Retention = 100% − churn</b>. If 50 of 1,000 leave, churn = <b>5%</b>.") +
 card("pink", "📣", "NPS", "NPS", "«Bizni do'stingizga tavsiya qilasizmi? (0–10)». 9–10 — targ'ibotchi, 7–8 — betaraf, 0–6 — tanqidchi. <b>NPS = targ'ibotchilar % − tanqidchilar %</b> (−100 dan +100 gacha).", "\"Would you recommend us to a friend? (0–10)\". 9–10 promoters, 7–8 passives, 0–6 detractors. <b>NPS = % promoters − % detractors</b> (from −100 to +100).") +
 '</div>' +
 E("small", "NPS ni 2003-yilda Bain & Company dan Frederik Reyxxeld Harvard Business Review jurnalidagi «The One Number You Need to Grow» maqolasida taklif qilgan.",
   "NPS was introduced in 2003 by Frederick Reichheld of Bain & Company in the Harvard Business Review article \"The One Number You Need to Grow\".", 'class="note"'))

# ============================ 13. HISOB-KITOB ============================
slide("Hisob-kitob: qahvaxona", "Worked numbers: a coffee shop",
 E("span", "4.2 · Raqamlar bilan ishlash", "4.2 · Working with numbers", 'class="kicker"') +
 E("h2", "Termizdagi qahvaxona: <span class=\"grad\">mijoz qancha turadi?</span>", "A coffee shop in Termez: <span class=\"grad\">what is a customer worth?</span>") +
 E("div", "O'quv misoli (taxminiy raqamlar): talabalar shaharchasi yonidagi qahvaxona sodiqlik dasturini ochmoqchi. Avval bitta mijozning qiymatini hisoblaymiz.",
   "A teaching example (illustrative numbers): a coffee shop next to a student campus wants to launch a loyalty programme. First we work out what one customer is worth.", 'class="def"') +
 table([("Ko'rsatkich", "Measure"), ("Qiymat", "Value"), ("Izoh", "Note")], [
  [TD("O'rtacha chek", "Average order value"), TD("<b>25 000 so'm</b>", "<b>25,000 so'm</b>"), TD("Qahva + pishiriq", "Coffee + pastry")],
  [TD("Oyiga xaridlar", "Purchases per month"), TD("<b>6 marta</b>", "<b>6</b>"), TD("Haftasiga 1–2 marta", "Once or twice a week")],
  [TD("O'rtacha mijoz bo'lib qolish muddati", "Average customer lifetime"), TD("<b>18 oy</b>", "<b>18 months</b>"), TD("O'qish davrining bir qismi", "Part of the study years")],
  [TD("Marja (foyda ulushi)", "Margin"), TD("<b>40%</b>", "<b>40%</b>"), TD("Xomashyo va ish haqidan keyin", "After ingredients and wages")],
  [TD("<b>LTV</b>", "<b>LTV</b>"), TD("<b>1 080 000 so'm</b>", "<b>1,080,000 so'm</b>"), TD("25 000 × 6 × 18 × 0,4", "25,000 × 6 × 18 × 0.4")],
  [TD("<b>CAC</b>", "<b>CAC</b>"), TD("<b>120 000 so'm</b>", "<b>120,000 so'm</b>"), TD("Oyiga 3,6 mln reklama ÷ 30 yangi mijoz", "3.6 million a month on ads ÷ 30 new customers")],
  [TD("<b>LTV ÷ CAC</b>", "<b>LTV ÷ CAC</b>"), TD("<b>9</b>", "<b>9</b>"), TD("≥ 3 — sog'lom", "≥ 3 — healthy")],
 ]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("violet", "📣", "NPS so'rovi", "An NPS survey", "100 mijoz javob berdi: 55 tasi 9–10 ball, 30 tasi 7–8 ball, 15 tasi 0–6 ball. <b>NPS = 55% − 15% = +40</b>. Betaraflar (30%) hisobga kirmaydi.", "100 customers answered: 55 gave 9–10, 30 gave 7–8 and 15 gave 0–6. <b>NPS = 55% − 15% = +40</b>. Passives (30%) do not count.") +
 card("green", "💡", "Xulosa", "Conclusion", "Bitta mijoz 1 mln so'mdan ortiq foyda keltirar ekan, uni <b>ushlab qolish uchun</b> har 10-qahvani bepul berish (oyiga ≈15 000 so'm) — juda arzon investitsiya.", "If one customer brings over 1 million so'm in profit, giving <b>every tenth coffee free</b> to keep them (≈15,000 so'm a month) is a very cheap investment.") +
 '</div>')

# ============================ 14. AVTOMATLASHTIRISH ============================
slide("Avtomatlashtirish va omnikanal", "Automation and omnichannel",
 E("span", "4.3 · Tizim o'zi ishlaydi", "4.3 · The system works for you", 'class="kicker"') +
 E("h2", "Trigger — <span class=\"grad\">«agar … bo'lsa, unda …»</span>", "A trigger — <span class=\"grad\">\"if … then …\"</span>") +
 E("div", "<b>Trigger</b> — oldindan belgilangan hodisa yuz berganda CRM o'zi bajaradigan amal. Masalan: <b>agar</b> mijoz 30 kun xarid qilmasa, <b>unda</b> unga shaxsiy taklif yuboriladi. Avtomatlashtirish xodimni kun bo'yi takrorlanadigan ishdan ozod qiladi.",
   "A <b>trigger</b> is an action CRM performs by itself when a predefined event happens. For example: <b>if</b> a customer has not bought for 30 days, <b>then</b> they get a personal offer. Automation frees staff from repetitive work all day long.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("blue", "⏱", "Tezkor javob", "Fast response", "Yangi lid → menejerga vazifa: «15 daqiqada qo'ng'iroq qiling». Tez javob bergan kompaniya ko'pincha mijozni birinchi bo'lib oladi.", "A new lead → a task for the manager: \"call within 15 minutes\". The company that answers first often wins the customer.") +
 card("green", "🎂", "Muhim sana", "Key dates", "Tug'ilgan kundan 3 kun oldin tabrik va kichik sovg'a taklifi avtomatik yuboriladi.", "Three days before a birthday, a greeting and a small gift offer go out automatically.") +
 card("orange", "🛒", "Tashlab ketilgan savatcha", "Abandoned cart", "Mijoz savatchaga mahsulot qo'yib chiqib ketsa, 1 soatdan keyin eslatma: «Buyurtmangiz kutmoqda».", "If a customer leaves items in the cart, a reminder follows an hour later: \"Your order is waiting\".") +
 card("red", "🔕", "Qaytarish", "Win-back", "60 kun xarid qilmagan «sodiq» mijozga menejer shaxsan qo'ng'iroq qiladi.", "A \"loyal\" customer silent for 60 days gets a personal call from a manager.") +
 card("violet", "⭐", "Fikr so'rash", "Feedback", "Xariddan 2 kun keyin NPS savoli; 0–6 ball bergan mijoz darhol rahbarga yo'naltiriladi.", "Two days after a purchase an NPS question is sent; anyone scoring 0–6 is passed straight to a manager.") +
 card("cyan", "🤖", "Chat-bot", "Chatbot", "Telegram-bot 24/7 narx, manzil va ish vaqtini aytadi, buyurtmani qabul qilib CRM ga yozadi.", "A Telegram bot gives prices, the address and opening hours 24/7, takes orders and writes them into CRM.") +
 '</div>' +
 E("div", "🔗 <b>Omnikanal</b> — mijoz qaysi kanaldan yozmasin (Telegram, Instagram, qo'ng'iroq, sayt, do'kon), u <b>bitta kartochkada</b> va <b>bitta suhbat tarixida</b> ko'rinadi. Mijoz o'z muammosini har safar qaytadan tushuntirishga majbur bo'lmaydi.",
   "🔗 <b>Omnichannel</b> means that whatever channel the customer uses (Telegram, Instagram, a phone call, the website, the shop), they appear in <b>one record</b> and <b>one conversation history</b>. The customer never has to explain the problem from scratch.", 'class="quote" style="margin-top:14px"'))

# ============================ 15. CRM TIZIMLARI ============================
slide("Mashhur CRM tizimlari", "Popular CRM systems",
 E("span", "5-blok", "Block 5", 'class="kicker"') +
 E("h2", "Dunyo va mintaqada <span class=\"grad\">qaysi CRM lar ishlatiladi?</span>", "Which CRMs are used <span class=\"grad\">worldwide and in the region?</span>") +
 table([("Tizim", "System"), ("Kelib chiqishi", "Origin"), ("Kuchli tomoni", "Strength"), ("Kimga mos", "Best for")], [
  [TD("<b>Salesforce</b>", "<b>Salesforce</b>"), TD("AQSh, 1999", "USA, 1999"), TD("Bulutli CRM kashshofi; juda keng imkoniyat va ilovalar do'koni", "The pioneer of cloud CRM; very broad features and an app marketplace"), TD("O'rta va yirik kompaniyalar", "Medium and large companies")],
  [TD("<b>HubSpot CRM</b>", "<b>HubSpot CRM</b>"), TD("AQSh, 2006", "USA, 2006"), TD("Bepul boshlang'ich tarif, marketing bilan kuchli bog'liqlik", "A free starter plan, strong links with marketing"), TD("Startaplar, kichik biznes", "Start-ups, small business")],
  [TD("<b>Pipedrive</b>", "<b>Pipedrive</b>"), TD("Estoniya, 2010", "Estonia, 2010"), TD("Sodda va ko'rgazmali sotuv voronkasi", "A simple, visual sales funnel"), TD("Sotuv bo'limlari", "Sales teams")],
  [TD("<b>Zoho CRM</b>", "<b>Zoho CRM</b>"), TD("Hindiston", "India"), TD("Arzon, ko'plab biznes ilovalari bilan bitta tizim", "Affordable, one suite with many business apps"), TD("Kichik va o'rta biznes", "Small and medium business")],
  [TD("<b>Bitrix24</b>", "<b>Bitrix24</b>"), TD("2012", "2012"), TD("CRM + vazifalar + ichki chat + sayt bitta joyda; o'zbek bozorida keng tarqalgan", "CRM + tasks + internal chat + website in one place; widespread in the Uzbek market"), TD("Jamoasi bor kichik va o'rta biznes", "Small and medium firms with a team")],
  [TD("<b>amoCRM (Kommo)</b>", "<b>amoCRM (Kommo)</b>"), TD("—", "—"), TD("Messenjerlar (Telegram, WhatsApp, Instagram) orqali sotuvga moslashgan", "Built for selling through messengers (Telegram, WhatsApp, Instagram)"), TD("Ijtimoiy tarmoqda sotuvchilar", "Businesses selling on social media")],
 ]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("blue", "🧭", "Tanlash mezonlari", "How to choose", "1) Mijozlaringiz qaysi <b>kanalda</b> yozadi? 2) Nechta <b>xodim</b> ishlaydi? 3) Oylik <b>byudjet</b>? 4) Interfeys <b>o'zbek/rus tilida</b> bormi? 5) <b>To'lov tizimlari</b> va telefoniya bilan bog'lanadimi?", "1) Which <b>channel</b> do your customers use? 2) How many <b>staff</b>? 3) What is the monthly <b>budget</b>? 4) Is there an <b>Uzbek/Russian</b> interface? 5) Does it connect to <b>payment systems</b> and telephony?") +
 card("green", "🧪", "Sinab ko'ring", "Try before you buy", "Deyarli barcha tizimlarda <b>bepul sinov muddati</b> yoki bepul tarif bor. 2 hafta real mijozlar bilan ishlab ko'ring — keyin tanlang.", "Almost every system has a <b>free trial</b> or a free plan. Work with real customers for two weeks — then choose.") +
 '</div>')

# ============================ 16. MINI-CRM ============================
slide("Mini-CRM: o'zingiz yasang", "A mini-CRM you can build",
 E("span", "5.2 · Amaliyot", "5.2 · Practice", 'class="kicker"') +
 E("h2", "Pulsiz CRM: <span class=\"grad\">Google Sheets + Telegram</span>", "A CRM for free: <span class=\"grad\">Google Sheets + Telegram</span>") +
 E("div", "Kichik biznes (uydagi qandolatchi, repetitor, onlayn do'kon) uchun qimmat tizim shart emas. Birinchi 100–200 mijozni <b>to'g'ri tuzilgan jadval</b> va Telegram yordamida boshqarsa bo'ladi.",
   "A small business (a home baker, a tutor, an online shop) does not need an expensive system. The first 100–200 customers can be managed with <b>a well-structured spreadsheet</b> and Telegram.", 'class="def"') +
 table([("Ustun", "Column"), ("Nima yoziladi", "What goes in")], [
  [TD("A · ID", "A · ID"), TD("Mijoz raqami: M001, M002…", "Customer number: M001, M002…")],
  [TD("B–C · Ism, telefon", "B–C · Name, phone"), TD("Bitta formatda: +998 XX XXX XX XX", "In one format: +998 XX XXX XX XX")],
  [TD("D · Manba", "D · Source"), TD("Ochiladigan ro'yxat: Instagram / Telegram / tanish / ko'cha", "A drop-down: Instagram / Telegram / referral / street")],
  [TD("E · Bosqich", "E · Stage"), TD("Lid → Taklif → Xaridor → Doimiy", "Lead → Proposal → Buyer → Regular")],
  [TD("F–G · Oxirgi xarid, summa", "F–G · Last purchase, amount"), TD("Sana va so'm", "Date and so'm")],
  [TD("H · Keyingi qadam", "H · Next step"), TD("Sana + nima qilish: «05.12 — yangi menyu yuborish»", "Date + action: \"05.12 — send the new menu\"")],
  [TD("I · Izoh", "I · Note"), TD("Qisqa: «laktozasiz tort so'raydi»", "Short: \"asks for lactose-free cake\"")],
 ]) +
 '<div class="grid g3" style="margin-top:14px">' +
 card("green", "1️⃣", "Filtr", "Filter", "«Keyingi qadam» ustunini bugungi sana bo'yicha saralang — bu sizning <b>bugungi ish rejangiz</b>.", "Sort the \"next step\" column by today's date — that is <b>today's to-do list</b>.") +
 card("blue", "2️⃣", "Formula", "Formula", "<code>=TODAY()-F2</code> — oxirgi xariddan beri necha kun. 60 dan katta bo'lsa — qizil rang (shartli formatlash).", "<code>=TODAY()-F2</code> — days since the last purchase. Over 60 turns red (conditional formatting).") +
 card("violet", "3️⃣", "Telegram", "Telegram", "Biznes-akkaunt, saqlangan tayyor javoblar va kanal; buyurtma kelishi bilan jadvalga yangi qator qo'shing.", "A business account, saved quick replies and a channel; add a new row to the sheet as soon as an order comes in.") +
 '</div>')

# ============================ 17. JORIY QILISH ============================
slide("CRM ni joriy qilish", "Rolling out CRM",
 E("span", "5.3 · Bosqichma-bosqich", "5.3 · Step by step", 'class="kicker"') +
 E("h2", "CRM ni joriy qilishning <span class=\"grad\">6 qadami</span>", "<span class=\"grad\">Six steps</span> to roll out CRM") +
 '<div class="grid g3">' +
 card("green", "🎯", "1. Maqsad", "1. Goal", "Nimani yaxshilaymiz? Masalan: «takroriy xaridlarni 3 oyda 20% ga oshirish».", "What are we improving? For example: \"raise repeat purchases by 20% in three months\".") +
 card("blue", "🗺", "2. Jarayonni chizish", "2. Map the process", "Mijoz qaysi bosqichlardan o'tadi va har bosqichda kim javobgar — avval qog'ozda.", "Which stages the customer passes through and who owns each one — on paper first.") +
 card("violet", "🧰", "3. Tizim tanlash", "3. Choose the system", "Jarayonga mos vosita: jadval, Bitrix24, amoCRM yoki boshqasi. Avval sinov muddati.", "A tool that fits the process: a spreadsheet, Bitrix24, amoCRM or another. A trial first.") +
 card("orange", "📥", "4. Ma'lumotni ko'chirish", "4. Move the data", "Eski daftar va jadvallarni tozalab, dublikatlarni olib tashlab, bitta bazaga yig'ish.", "Clean up old notebooks and sheets, remove duplicates and gather everything in one base.") +
 card("pink", "👩‍🏫", "5. Xodimlarni o'qitish", "5. Train the staff", "Har kim nimani, qachon va qanday yozishini biladi. Qoida: «CRM da yo'q bo'lsa — bo'lmagan».", "Everyone knows what to record, when and how. The rule: \"if it is not in CRM, it did not happen\".") +
 card("cyan", "📊", "6. O'lchash", "6. Measure", "Har oy konversiya, churn va NPS ni ko'rib chiqib, jarayonni tuzatish.", "Review conversion, churn and NPS every month and adjust the process.") +
 '</div>' +
 E("div", "👔 <b>Rahbarning roli hal qiluvchi:</b> agar rahbar haftalik yig'ilishda hisobotni CRM dan emas, «og'zaki» so'rasa, xodimlar ham tizimga ma'lumot kiritishni to'xtatadi.",
   "👔 <b>The manager's role is decisive:</b> if the boss asks for the weekly report \"verbally\" rather than from CRM, the staff stop entering data too.", 'class="quote" style="margin-top:14px"'))

# ============================ 18. XATOLAR ============================
slide("Keng tarqalgan xatolar", "Common mistakes",
 E("span", "5.4 · Nima uchun CRM ishlamay qoladi?", "5.4 · Why CRM fails", 'class="kicker"') +
 E("h2", "Muammo ko'pincha <span class=\"grad\">dasturda emas, odamlarda</span>", "The problem is usually <span class=\"grad\">people, not software</span>") +
 '<div class="grid g2">' +
 card_ul("red", "❌", "Xatolar", "Mistakes",
         [("«Dastur oldik — sotuv o'zi oshadi» deb o'ylash", "Thinking \"we bought software — sales will grow by themselves\""),
          ("Kartochkada <b>40 ta majburiy maydon</b> — xodimlar to'ldirmaydi", "<b>Forty required fields</b> on a record — staff skip them"),
          ("Ma'lumot <b>vaqtida kiritilmaydi</b>, baza eskiradi", "Data is <b>not entered on time</b>, the base goes stale"),
          ("Hamma mijozga <b>bir xil xabar</b> — spam deb qabul qilinadi", "<b>The same message</b> to every customer — it reads as spam"),
          ("Mijoz roziligisiz <b>ommaviy SMS</b> va qo'ng'iroqlar", "<b>Mass SMS</b> and calls without the customer's consent"),
          ("Hisobotlar yig'iladi, lekin <b>qaror qabul qilinmaydi</b>", "Reports pile up but <b>no decisions are made</b>")], cls="tick cross") +
 card_ul("green", "✅", "To'g'ri yo'l", "The right way",
         [("Kichikdan boshlash: 5–7 ta maydon, 1 ta voronka", "Start small: 5–7 fields, one funnel"),
          ("Har kuni 10 daqiqa — CRM ni yangilash odati", "Ten minutes a day — a habit of updating CRM"),
          ("Segment bo'yicha <b>shaxsiy</b> xabarlar (RFM)", "<b>Personal</b> messages by segment (RFM)"),
          ("Rozilik so'rash va «obunani bekor qilish» imkoniyati", "Ask for consent and offer an \"unsubscribe\" option"),
          ("Har oy bitta raqamni yaxshilash: masalan, churn", "Improve one number a month: churn, for example"),
          ("Xodimni CRM dagi natijasi bo'yicha rag'batlantirish", "Reward staff for their results in CRM")]) +
 '</div>')

# ============================ 19. DUNYO MISOLLARI ============================
slide("Dunyo misollari", "Global examples",
 E("span", "5.5 · Ilhom uchun", "5.5 · For inspiration", 'class="kicker"') +
 E("h2", "Mijozni eslab qolgan kompaniyalar <span class=\"grad\">qanday yutadi?</span>", "How companies that <span class=\"grad\">remember the customer</span> win") +
 '<div class="grid g2">' +
 card("orange", "📦", "Amazon: tavsiyalar", "Amazon: recommendations", "Xaridlar va ko'rishlar tarixiga qarab «Bu mahsulotni olganlar shuni ham olishdi» bloki chiqadi. Mijoz haqidagi ma'lumot — <b>keyingi xarid sababi</b>.", "Based on purchase and browsing history, a \"customers who bought this also bought\" block appears. Data about the customer becomes <b>the reason for the next purchase</b>.") +
 card("green", "☕", "Starbucks Rewards", "Starbucks Rewards", "Mobil ilova orqali sodiqlik dasturi: har xarid uchun «yulduz» yig'iladi, mijoz sevgan ichimligi va odatlariga mos shaxsiy taklif keladi.", "A loyalty programme in the mobile app: every purchase earns \"stars\", and customers get personal offers matched to their favourite drinks and habits.") +
 card("blue", "🎬", "Netflix: shaxsiy ekran", "Netflix: a personal screen", "Har bir obunachining bosh sahifasi ko'rgan filmlariga qarab o'zgaradi. Maqsad — mijozni <b>obunani bekor qilmasdan</b> ushlab qolish (churn ni kamaytirish).", "Each subscriber's home page changes with what they watch. The goal is to keep the customer <b>from cancelling</b> (reducing churn).") +
 card("violet", "🏨", "Mehmonxona xizmati", "Hotel service", "Yuqori darajali mehmonxonalar mehmonning afzalliklarini (yostiq turi, sevimli ichimlik) kartochkaga yozib, keyingi safar <b>so'ramasdan</b> tayyorlab qo'yadi.", "Top hotels note a guest's preferences (pillow type, favourite drink) in the record and have them ready <b>without being asked</b> next time.") +
 '</div>' +
 E("div", "🧠 <b>Umumiy qonuniyat:</b> bu kompaniyalar mijozga ko'proq reklama yuborgani uchun emas, uni <b>yaxshiroq eslab qolgani</b> uchun yutadi. CRM — kompaniyaning <b>xotirasi</b>.",
   "🧠 <b>The common pattern:</b> these companies win not by sending more ads but by <b>remembering the customer better</b>. CRM is the company's <b>memory</b>.", 'class="quote" style="margin-top:14px"'))

# ============================ 20. MAHALLIY MISOL ============================
slide("Amaliy misol: go'zallik saloni", "Worked example: a beauty salon",
 E("span", "5.6 · Mahalliy misol", "5.6 · A local example", 'class="kicker"') +
 E("h2", "Termizdagi go'zallik saloni — <span class=\"grad\">CRM bilan 3 oy</span>", "A beauty salon in Termez — <span class=\"grad\">three months with CRM</span>") +
 E("div", "O'quv misoli (taxminiy raqamlar): salonda 600 ta mijoz yozuvi bor, lekin ular uch xil daftar va ikki telefonda tarqalgan. Egasi Bitrix24 ning bepul tarifini sinab ko'rishga qaror qildi.",
   "A teaching example (illustrative numbers): the salon has 600 customer entries spread across three notebooks and two phones. The owner decides to try the free plan of Bitrix24.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("blue", "🗂", "1-oy: tartib", "Month 1: order", "600 ta yozuv bitta bazaga yig'ildi, 70 ta dublikat o'chirildi → <b>530 ta mijoz</b>. Har biriga manba va oxirgi tashrif sanasi yozildi.", "600 entries merged into one base, 70 duplicates removed → <b>530 customers</b>. Each got a source and a last-visit date.") +
 card("violet", "📊", "2-oy: RFM", "Month 2: RFM", "Tahlil: <b>80 ta</b> «chempion», <b>150 ta</b> «sodiq», <b>120 ta</b> «xavf ostida» (60+ kun kelmagan), qolganlari yangi yoki uxlab qolgan.", "The analysis: <b>80</b> \"champions\", <b>150</b> \"loyal\", <b>120</b> \"at risk\" (not seen for 60+ days), the rest new or hibernating.") +
 card("green", "📞", "3-oy: qaytarish", "Month 3: win-back", "«Xavf ostida»gi 120 mijozga shaxsiy xabar va 15% chegirma; <b>36 tasi</b> qaytdi (konversiya 30%). O'rtacha chek 150 000 so'm → <b>5,4 mln so'm</b> qo'shimcha tushum.", "A personal message and a 15% discount to the 120 \"at risk\" customers; <b>36</b> came back (30% conversion). At an average bill of 150,000 so'm → <b>5.4 million so'm</b> of extra revenue.") +
 '</div>' +
 E("div", "🧮 <b>Hisob:</b> 36 × 150 000 = 5 400 000 so'm tushum; chegirma xarajati 36 × 22 500 = 810 000 so'm; xabarlar uchun xarajat deyarli nol. <b>Sof foyda o'sishi</b> — reklamaga bir so'm ham sarflamasdan. Eski mijozni qaytarish yangisini topishdan arzon ekanini raqamlar tasdiqladi.",
   "🧮 <b>The numbers:</b> 36 × 150,000 = 5,400,000 so'm in revenue; the discount cost 36 × 22,500 = 810,000 so'm; messaging cost almost nothing. <b>Net profit grew</b> without spending a single so'm on ads. The numbers confirm that winning back an old customer is cheaper than finding a new one.", 'class="quote" style="margin-top:14px"'))

# ============================ 21. SHAXSIY MA'LUMOTLAR ============================
slide("Shaxsiy ma'lumotlar va odob", "Personal data and ethics",
 E("span", "5.7 · Qonun va ishonch", "5.7 · Law and trust", 'class="kicker"') +
 E("h2", "Mijoz ma'lumoti — <span class=\"grad\">omonat</span>", "Customer data — <span class=\"grad\">a trust placed in you</span>") +
 E("div", "O'zbekistonda bu soha <b>«Shaxsga doir ma'lumotlar to'g'risida»gi Qonun</b> (2019-yil 2-iyul, O'RQ-547) bilan tartibga solinadi. Unga ko'ra ma'lumot <b>sub'ektning roziligi</b> bilan, aniq maqsadda yig'iladi va himoya qilinadi; 2021-yildan O'zbekiston fuqarolarining shaxsiy ma'lumotlari <b>respublika hududidagi</b> serverlarda ham saqlanishi talab etiladi.",
   "In Uzbekistan this area is governed by the <b>Law \"On Personal Data\"</b> (2 July 2019, No. ZRU-547). Data must be collected <b>with the person's consent</b> and for a clear purpose, and must be protected; since 2021 the personal data of Uzbek citizens must also be stored on servers <b>within the country</b>.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("green", "✍️", "Rozilik", "Consent", "Telefon raqamini olishda maqsadni ayting: «Buyurtma holati va aksiyalar haqida xabar beramiz. Rozimisiz?»", "When taking a phone number, state the purpose: \"We will message you about your order and offers. Do you agree?\"") +
 card("blue", "🔒", "Himoya", "Protection", "CRM ga kirish faqat parol bilan, xodim faqat o'ziga kerakli ma'lumotni ko'radi; jadvalni ommaga ochiq havolada saqlamang.", "CRM access only with a password; each employee sees only what they need; never keep the sheet behind a public link.") +
 card("orange", "🚫", "Spamsiz", "No spam", "Har xabarda «obunani bekor qilish» imkoniyati. Kechasi va haddan ko'p xabar — mijozni yo'qotishning eng tez yo'li.", "Every message has an \"unsubscribe\" option. Night-time or excessive messages are the fastest way to lose a customer.") +
 '</div>' +
 E("div", "🤝 <b>Odob qoidasi:</b> mijoz haqida bilganingizni <b>unga foyda keltirish</b> uchun ishlating — bosim o'tkazish uchun emas. Ishonch yo'qolsa, eng yaxshi CRM ham mijozni qaytara olmaydi.",
   "🤝 <b>The ethical rule:</b> use what you know about the customer <b>to benefit them</b>, never to pressure them. Once trust is lost, even the best CRM cannot bring the customer back.", 'class="quote" style="margin-top:14px"'))

# ============================ 22. CRM VA BIZNES-MODEL ============================
slide("CRM va biznes-model", "CRM and the business model",
 E("span", "5.8 · Oldingi mavzu bilan bog'liqlik", "5.8 · Link to the previous topic", 'class="kicker"') +
 E("h2", "CRM — Canvasning <span class=\"grad\">«munosabat» bloki</span>ni jonlantiradi", "CRM brings the canvas's <span class=\"grad\">\"relationships\" block</span> to life") +
 '<div class="grid g3">' +
 card("green", "👥", "① Mijozlar segmenti", "① Customer segments", "CRM dagi RFM va xarid tarixi segmentlarni <b>taxmindan faktga</b> aylantiradi.", "RFM and purchase history in CRM turn segments <b>from guesses into facts</b>.") +
 card("blue", "🚚", "③ Kanallar", "③ Channels", "«Manba» maydoni qaysi kanal eng arzon va eng sifatli mijoz keltirishini ko'rsatadi.", "The \"source\" field shows which channel brings the cheapest and best customers.") +
 card("violet", "💬", "④ Munosabat", "④ Relationships", "Shaxsiy xizmat, avtomatlashtirish, jamoa va sodiqlik dasturi — hammasi CRM da boshqariladi.", "Personal service, automation, community and loyalty programmes — all run through CRM.") +
 card("orange", "💰", "⑤ Daromad oqimlari", "⑤ Revenue streams", "Takroriy xaridlar va obunalar — LTV ning asosi. CRM ularni rejalashtiradi.", "Repeat purchases and subscriptions are the basis of LTV. CRM plans them.") +
 card("red", "🧾", "⑨ Xarajatlar", "⑨ Costs", "CAC ni pasaytirish: eski mijozni qaytarish reklamadan arzon.", "Lowering CAC: winning back an old customer is cheaper than advertising.") +
 card("pink", "📏", "Birlik iqtisodiyoti", "Unit economics", "6-mavzudagi LTV ÷ CAC ≥ 3 qoidasi CRM ma'lumotisiz hisoblab bo'lmaydi.", "The LTV ÷ CAC ≥ 3 rule from topic 6 cannot be calculated without CRM data.") +
 '</div>' +
 E("div", "🔁 <b>Xulosa:</b> biznes-model — <b>reja</b>, CRM esa shu rejaning har kuni <b>qanday bajarilayotganini</b> ko'rsatadigan asbob.",
   "🔁 <b>In short:</b> the business model is <b>the plan</b>; CRM is the tool that shows <b>how the plan is carried out</b> every day.", 'class="quote" style="margin-top:14px"'))

# ============================ 23. XULOSA ============================
slide("Xulosa va mustaqil ish", "Summary and assignment",
 E("span", "Xulosa · Topshiriq · Havolalar", "Summary · Assignment · Links", 'class="kicker"') +
 E("h2", "Yakuniy <span class=\"grad\">xulosa</span> va <span class=\"grad\">foydali resurslar</span>", "Final <span class=\"grad\">summary</span> and <span class=\"grad\">useful resources</span>") +
 card_ul("green", "📌", "Esda qoladigan 8 ta fikr", "Eight ideas to remember",
         [("CRM — <b>strategiya + jarayon + texnologiya</b>; dastur — faqat vosita.", "CRM is <b>strategy + process + technology</b>; software is only the tool."),
          ("Eski mijozni saqlash yangisini topishdan <b>bir necha barobar arzon</b>.", "Keeping a customer is <b>several times cheaper</b> than finding a new one."),
          ("Mijoz yo'li: xabardorlik → qiziqish → xarid → foydalanish → takroriy xarid → tavsiya.", "The customer's path: awareness → interest → purchase → use → repeat → advocacy."),
          ("Voronka har bosqichda qancha odam yo'qolayotganini — <b>konversiya</b>ni ko'rsatadi.", "The funnel shows how many people are lost at each stage — the <b>conversion</b>."),
          ("<b>RFM</b>: qachon, qanchalik tez-tez va qancha — har guruhga boshqa xabar.", "<b>RFM</b>: when, how often and how much — a different message for each group."),
          ("<b>LTV ÷ CAC ≥ 3</b>, past churn va ijobiy NPS — sog'lom munosabat belgisi.", "<b>LTV ÷ CAC ≥ 3</b>, low churn and a positive NPS are signs of a healthy relationship."),
          ("Birinchi 100–200 mijoz uchun <b>Google Sheets + Telegram</b> yetarli.", "<b>Google Sheets + Telegram</b> are enough for the first 100–200 customers."),
          ("Mijoz ma'lumoti — <b>rozilik</b> bilan yig'iladi va himoya qilinadi.", "Customer data is collected <b>with consent</b> and kept safe.")]) +
 '<div class="grid g2" style="margin-top:16px">' +
 '<div class="card" style="--c:var(--violet)"><span class="icon">📓</span>' + E("h3", "Mustaqil ish: \"Mening mini-CRM im\"", "Independent work: \"My mini-CRM\"") +
 '<ul class="tick">' +
 E("li", "O'z biznes g'oyangiz uchun <b>sotuv voronkasi</b>ni 4–5 bosqichda chizing.", "Draw a 4–5 stage <b>sales funnel</b> for your own business idea.") +
 E("li", "Google Sheets'da <b>mijoz kartochkasi</b> ustunlarini tuzing (kamida 8 ta).", "Build <b>customer record</b> columns in Google Sheets (at least eight).") +
 E("li", "10 ta o'ylab topilgan mijoz uchun <b>RFM ballari</b>ni qo'yib, segmentlarga ajrating.", "Give <b>RFM scores</b> to ten imaginary customers and split them into segments.") +
 E("li", "Taxminiy <b>LTV, CAC</b> va ularning nisbatini hisoblang.", "Estimate <b>LTV and CAC</b> and their ratio.") +
 E("li", "3 ta <b>avtomatik trigger</b> yozing: «agar … bo'lsa, unda …».", "Write three <b>automatic triggers</b>: \"if … then …\".") +
 '</ul>' + E("small", "Hajmi: 2 bet + jadval havolasi. Baholash: voronka va kartochka 40% · hisob-kitob 30% · triggerlar va xulosa 30%.", "Length: 2 pages + a link to the sheet. Marking: funnel and record 40% · calculations 30% · triggers and conclusion 30%.", 'class="note"') +
 '</div>' +
 '<div class="card" style="--c:var(--blue)"><span class="icon">🔗</span>' + E("h3", "Foydali resurslar", "Useful resources") +
 '<ul class="clean">' +
 E("li", "<a class=\"lnk\" href=\"https://www.hubspot.com/products/crm\" target=\"_blank\" rel=\"noopener\">hubspot.com</a> — bepul CRM va o'quv materiallari", "<a class=\"lnk\" href=\"https://www.hubspot.com/products/crm\" target=\"_blank\" rel=\"noopener\">hubspot.com</a> — a free CRM and learning materials") +
 E("li", "<a class=\"lnk\" href=\"https://trailhead.salesforce.com\" target=\"_blank\" rel=\"noopener\">trailhead.salesforce.com</a> — Salesforce'ning bepul onlayn kurslari", "<a class=\"lnk\" href=\"https://trailhead.salesforce.com\" target=\"_blank\" rel=\"noopener\">trailhead.salesforce.com</a> — Salesforce's free online courses") +
 E("li", "<a class=\"lnk\" href=\"https://www.bitrix24.com\" target=\"_blank\" rel=\"noopener\">bitrix24.com</a> — bepul tarifli CRM va vazifalar tizimi", "<a class=\"lnk\" href=\"https://www.bitrix24.com\" target=\"_blank\" rel=\"noopener\">bitrix24.com</a> — CRM and task system with a free plan") +
 E("li", "<a class=\"lnk\" href=\"https://lex.uz\" target=\"_blank\" rel=\"noopener\">lex.uz</a> — «Shaxsga doir ma'lumotlar to'g'risida»gi Qonun matni", "<a class=\"lnk\" href=\"https://lex.uz\" target=\"_blank\" rel=\"noopener\">lex.uz</a> — the text of the Law \"On Personal Data\"") +
 E("li", "<a class=\"lnk\" href=\"https://www.netpromoter.com\" target=\"_blank\" rel=\"noopener\">netpromoter.com</a> — NPS metodikasi", "<a class=\"lnk\" href=\"https://www.netpromoter.com\" target=\"_blank\" rel=\"noopener\">netpromoter.com</a> — the NPS method") +
 '</ul>' +
 E("p", "<b>Vositalar:</b> <span class=\"pill g\">Google Sheets</span><span class=\"pill g\">Telegram Business</span><span class=\"pill g\">Bitrix24 / amoCRM</span>", "<b>Tools:</b> <span class=\"pill g\">Google Sheets</span><span class=\"pill g\">Telegram Business</span><span class=\"pill g\">Bitrix24 / amoCRM</span>") +
 '</div></div>')

# ============================ 24. TEST ============================
slide("TEST · Bilimni tekshirish", "TEST · Check your knowledge",
 E("span", "Yakuniy nazorat", "Final check", 'class="kicker"') +
 E("h2", "🧪 Test topshiriqlari — <span class=\"grad\">20 ta savol</span>", "🧪 Test — <span class=\"grad\">20 questions</span>") +
 '<div class="scorebar"><span><span data-ui="score">Natija:</span> <b><span id="scoreNow">0</span> / <span id="scoreMax">20</span></b></span>'
 '<span><span data-ui="answered">Javob berildi:</span> <b id="answered">0</b></span><div class="spacer"></div>' +
 E("button", "↻ Testni qayta boshlash", "↻ Restart the test", 'class="btn warn" id="btnReset"') + '</div>'
 '<div id="testWrap"></div><div class="result" id="result"><div class="pct" id="pct">0%</div>' +
 E("h3", "Natija", "Result", 'id="resTitle" style="color:#fff;margin:10px 0 4px"') + '<p id="resTxt" style="color:#fff;opacity:.95;margin:0"></p></div>'
 '<div class="card" style="--c:var(--green);margin-top:18px;text-align:center">' +
 E("h3", "🎓 Rahmat! E'tiboringiz uchun tashakkur", "🎓 Thank you for your attention!") +
 E("p", "Keyingi mashg'ulotgacha o'z g'oyangiz uchun <b>sotuv voronkasi</b> va <b>Google Sheets'dagi mini-CRM</b>ni tayyorlab keling — dars aynan shu jadvallardan boshlanadi.",
   "For the next class, prepare a <b>sales funnel</b> and a <b>mini-CRM in Google Sheets</b> for your own idea — the lesson will start from those sheets.") +
 E("p", "Termiz davlat universiteti · Tadbirkorlik asoslari", "Termez State University · Fundamentals of Entrepreneurship", 'style="color:var(--muted);font-size:13.5px"') + '</div>')

# ============================ TEST SAVOLLARI ============================
# a — 4 variant (uzunligi teng, mazmunan o'xshash), c — to'g'ri javob; o — ochiq savol: qabul qilinadigan javoblar (bitta so'z yoki son)
Q = [
 # 1 — CRM tarkibi (stsenariy)
 dict(q="Kompaniya qimmat CRM dasturini sotib oldi, lekin 3 oydan keyin bazada mijozlar haqida deyarli hech narsa yo'q. Bu holat CRM ning qaysi qismi e'tiborsiz qolganini ko'rsatadi?",
      a=["Jarayon va odamlar: xodimlar har bir aloqani yozib borishga o'rgatilmagan",
         "Texnologiya: dastur juda arzon tanlangani uchun ma'lumot saqlanmay qolgan",
         "Strategiya: kompaniya juda ko'p mijoz segmentini birdaniga nishonga olgan",
         "Infratuzilma: serverda joy tugagani sababli yangi yozuvlar qabul qilinmagan"], c=0,
      e="CRM = strategiya + jarayon + texnologiya. Dastur bor, lekin yozib borish tartibi va odati bo'lmasa, baza bo'sh qoladi.",
      qe="A company bought expensive CRM software, yet three months later the base holds almost nothing about customers. Which part of CRM was neglected?",
      ae=["Process and people: staff were never trained to record every contact",
          "Technology: the software was so cheap that it failed to store the data",
          "Strategy: the company targeted far too many customer segments at once",
          "Infrastructure: the server ran out of space and refused new entries"],
      ee="CRM = strategy + process + technology. With software but no habit or rule of recording contacts, the base stays empty."),
 # 2 — analitik CRM
 dict(q="Tizim «avval oyiga 3 marta kelgan, lekin oxirgi 60 kunda xarid qilmagan mijozlar» ro'yxatini tuzib berdi. Bu qaysi turdagi CRM ning vazifasi?",
      a=["Analitik CRM — yig'ilgan ma'lumotni tahlil qilib, guruhlarni ajratadi",
         "Operatsion CRM — kundalik sotuv va xizmat ishlarini avtomatlashtiradi",
         "Hamkorlik CRM — bo'limlar o'rtasida mijoz ma'lumotini bo'lishib beradi",
         "Bulutli CRM — ma'lumotni kompaniya serverida emas, internetda saqlaydi"], c=0,
      e="Ro'yxat ma'lumotni tahlil qilish natijasi — bu analitik CRM. Operatsion CRM keyin shu ro'yxatga xabar yuborishi mumkin.",
      qe="The system produced a list of \"customers who used to come three times a month but have not bought in 60 days\". Which type of CRM does this?",
      ae=["Analytical CRM — it analyses collected data and picks out groups",
          "Operational CRM — it automates the daily work of sales and service",
          "Collaborative CRM — it shares customer data between departments",
          "Cloud CRM — it keeps the data on the internet, not on own servers"],
      ee="The list is the result of analysing data — that is analytical CRM. Operational CRM may then message that list."),
 # 3 — hamkorlik CRM
 dict(q="Mijoz Telegram'da shikoyat yozdi. Xizmat bo'limi uni hal qilguncha sotuv bo'limi bu mijozga yangi taklif yuborishni avtomatik to'xtatdi. Bu qaysi CRM imkoniyatiga misol?",
      a=["Hamkorlik CRM: bo'limlar bir mijozni bir xil ma'lumot bilan ko'radi",
         "Analitik CRM: shikoyatlar soni bo'yicha mijozlar reytingi tuziladi",
         "Operatsion CRM: shikoyat yozgan mijozga chegirma avtomatik beriladi",
         "Ommaviy CRM: barcha mijozlarga bir vaqtda bir xil xabar yuboriladi"], c=0,
      e="Ma'lumotni bo'limlar va kanallar o'rtasida bo'lishish — hamkorlik (kollaborativ) CRM ning vazifasi.",
      qe="A customer complained on Telegram. Until the service team solved it, the sales team's new offers to that customer were paused automatically. Which CRM capability is this?",
      ae=["Collaborative CRM: departments see the same customer with one set of data",
          "Analytical CRM: it ranks customers by the number of complaints received",
          "Operational CRM: it gives an automatic discount to anyone who complains",
          "Mass CRM: it sends the very same message to all customers at one time"],
      ee="Sharing data across departments and channels is the job of collaborative CRM."),
 # 4 — ochiq: lid
 dict(q="Telegram-botga «narxi qancha?» deb yozgan, lekin hali ehtiyoji va byudjeti tekshirilmagan potensial mijoz CRM da qanday ataladi? <i>(bitta so'z)</i>",
      o=["lid", "lead", "lidlar", "leads", "potensial lid"],
      e="Lid — qiziqish bildirgan, lekin hali saralanmagan (tekshirilmagan) potensial mijoz. Tekshiruvdan keyin u kontakt va bitimga aylanadi.",
      qe="A prospect asked the Telegram bot \"how much is it?\" but their need and budget have not been checked yet. What is such a prospect called in CRM? <i>(one word)</i>",
      oe=["lead", "leads", "lid"],
      ee="A lead is a prospect who showed interest but has not been qualified yet. After qualification they become a contact and a deal."),
 # 5 — ochiq: konversiya
 dict(q="Oy davomida 250 ta lid keldi va ulardan 15 ta bitim yopildi. Liddan bitimga konversiya necha foiz? <i>(faqat son)</i>",
      o=["6", "6%", "6 %", "6,0", "6.0", "6 foiz"],
      e="Konversiya = 15 ÷ 250 × 100% = 6%.",
      qe="During the month 250 leads came in and 15 deals were closed. What is the lead-to-deal conversion rate in percent? <i>(number only)</i>",
      oe=["6", "6%", "6 %", "6.0", "6,0", "6 percent"],
      ee="Conversion = 15 ÷ 250 × 100% = 6%."),
 # 6 — voronka tahlili
 dict(q="Voronka: 200 lid → 120 saralangan → 100 ga taklif yuborildi → 8 ta bitim. Rahbar birinchi navbatda qaysi bosqichni tuzatishi kerak?",
      a=["Taklifdan bitimga o'tishni: 100 ta taklifdan atigi 8 tasi bitim bo'ldi",
         "Liddan saralashga o'tishni: 200 ta liddan 120 tasi saralangan bo'ldi",
         "Saralashdan taklifga o'tishni: 120 tadan 100 tasiga taklif yuborildi",
         "Reklama qamrovini: lidlar soni 200 tadan ancha ko'p bo'lishi kerak edi"], c=0,
      e="Konversiyalar: 60% → 83% → 8%. Eng katta yo'qotish — taklifdan bitimgacha. Masalan, taklifdan keyin qo'ng'iroq qilish qoidasi kerak.",
      qe="The funnel: 200 leads → 120 qualified → 100 proposals sent → 8 deals. Which stage should the manager fix first?",
      ae=["From proposal to deal: only 8 of the 100 proposals became deals",
          "From lead to qualified: 120 of the 200 leads passed qualification",
          "From qualified to proposal: 100 of the 120 received a proposal",
          "Advertising reach: there should have been more than 200 leads"],
      ee="Conversions: 60% → 83% → 8%. The biggest loss is from proposal to deal — e.g. introduce a follow-up call rule."),
 # 7 — RFM segment
 dict(q="Mijoz ilgari oyiga 4 marta kelib, katta summada xarid qilardi, lekin 70 kundan beri kelmagan. RFM bo'yicha u qaysi guruhda va unga nima qilish kerak?",
      a=["«Xavf ostida»: shaxsiy qo'ng'iroq qilib, qaytish taklifini berish kerak",
         "«Chempion»: unga yangi mahsulotni birinchi bo'lib taklif qilish kerak",
         "«Yangi»: unga xush kelibsiz xati va 2-xarid bonusini yuborish kerak",
         "«Uxlab qolgan»: unga hech qanday mablag' sarflamaslik maqsadga muvofiq"], c=0,
      e="F va M yuqori, R past — bu «xavf ostida»gi qimmatli mijoz. Unga bitta shaxsiy qo'ng'iroq ommaviy reklamadan samaraliroq.",
      qe="A customer used to come four times a month and spend a lot, but has not come for 70 days. Which RFM group are they in, and what should be done?",
      ae=["\"At risk\": make a personal call and give them a win-back offer",
          "\"Champion\": offer them new products first, before anyone else",
          "\"New\": send them a welcome message and a second-purchase bonus",
          "\"Hibernating\": it makes sense not to spend any money on them"],
      ee="High F and M but low R — a valuable customer \"at risk\". One personal call works better than mass advertising."),
 # 8 — ochiq: RFM ning F harfi
 dict(q="RFM qisqartmasidagi «F» harfi mijozning qaysi xususiyatini o'lchaydi? <i>(bitta so'z, o'zbekcha yoki inglizcha)</i>",
      o=["frequency", "chastota", "takroriylik", "tezlik", "xarid chastotasi", "chastotasi"],
      e="R — recency (oxirgi xarid qachon), F — frequency (qanchalik tez-tez), M — monetary (qancha pul sarflaydi).",
      qe="What does the letter \"F\" in RFM measure about a customer? <i>(one word)</i>",
      oe=["frequency", "purchase frequency"],
      ee="R — recency (when they last bought), F — frequency (how often), M — monetary (how much they spend)."),
 # 9 — ochiq: LTV
 dict(q="O'rtacha chek 20 000 so'm, mijoz oyiga 5 marta keladi, o'rtacha 12 oy mijoz bo'lib qoladi, marja 50%. LTV necha so'm? <i>(faqat son)</i>",
      o=["600000", "600 000", "600.000", "600,000", "600 000 so'm", "600000 so'm", "600 ming"],
      e="LTV = 20 000 × 5 × 12 × 0,5 = 600 000 so'm.",
      qe="The average order is 20,000 so'm, the customer comes five times a month, stays for 12 months on average, and the margin is 50%. What is the LTV in so'm? <i>(number only)</i>",
      oe=["600000", "600,000", "600 000", "600.000"],
      ee="LTV = 20,000 × 5 × 12 × 0.5 = 600,000 so'm."),
 # 10 — LTV/CAC
 dict(q="Biznesda LTV = 900 000 so'm, CAC = 450 000 so'm. Ushbu nisbat haqida qaysi xulosa to'g'ri?",
      a=["Nisbat 2 ga teng — jalb qilish qimmat, model hali to'liq sog'lom emas",
         "Nisbat 3 dan katta — reklamani bemalol ikki barobar oshirsa bo'ladi",
         "Nisbat 1 dan kichik — har bir yangi mijoz faqat zarar keltirib turadi",
         "Nisbat ahamiyatsiz — sog'lom biznesda faqat LTV ning o'zi o'lchanadi"], c=0,
      e="900 000 ÷ 450 000 = 2. Odatiy mezon LTV ÷ CAC ≥ 3; 2 bo'lsa, CAC ni pasaytirish yoki LTV ni oshirish kerak.",
      qe="A business has LTV = 900,000 so'm and CAC = 450,000 so'm. Which conclusion about this ratio is correct?",
      ae=["The ratio is 2 — acquisition is costly, the model is not healthy yet",
          "The ratio is above 3 — the advertising budget can safely be doubled",
          "The ratio is below 1 — every new customer brings nothing but a loss",
          "The ratio does not matter — a healthy business only measures LTV"],
      ee="900,000 ÷ 450,000 = 2. The usual benchmark is LTV ÷ CAC ≥ 3; at 2 you should lower CAC or raise LTV."),
 # 11 — ochiq: churn
 dict(q="Oy boshida 800 ta obunachi bor edi, oy davomida 40 tasi obunani bekor qildi. Shu oydagi churn necha foiz? <i>(faqat son)</i>",
      o=["5", "5%", "5 %", "5,0", "5.0", "5 foiz"],
      e="Churn = 40 ÷ 800 × 100% = 5%; retention = 95%.",
      qe="There were 800 subscribers at the start of the month and 40 cancelled during it. What was the churn that month in percent? <i>(number only)</i>",
      oe=["5", "5%", "5 %", "5.0", "5,0", "5 percent"],
      ee="Churn = 40 ÷ 800 × 100% = 5%; retention = 95%."),
 # 12 — ochiq: NPS
 dict(q="So'rovda 200 kishi qatnashdi: 110 tasi 9–10, 50 tasi 7–8, 40 tasi 0–6 ball berdi. NPS nechaga teng? <i>(faqat son)</i>",
      o=["35", "+35", "35%", "+35%", "35 ball"],
      e="Targ'ibotchilar 110 ÷ 200 = 55%, tanqidchilar 40 ÷ 200 = 20%. NPS = 55 − 20 = +35.",
      qe="200 people answered a survey: 110 gave 9–10, 50 gave 7–8 and 40 gave 0–6. What is the NPS? <i>(number only)</i>",
      oe=["35", "+35", "35%", "+35%"],
      ee="Promoters 110 ÷ 200 = 55%, detractors 40 ÷ 200 = 20%. NPS = 55 − 20 = +35."),
 # 13 — NPS betaraflar
 dict(q="NPS hisoblanganda 7–8 ball bergan mijozlar bilan nima qilinadi?",
      a=["Betaraf hisoblanadi: formulaga kirmaydi, lekin umumiy sonda qoladi",
         "Targ'ibotchilar qatoriga qo'shiladi, chunki ular yaxshi baho bergan",
         "Tanqidchilar qatoriga qo'shiladi, chunki ular 10 ball qo'ymagan",
         "Yarim vazn bilan hisoblanadi: har biri 0,5 ta targ'ibotchiga teng"], c=0,
      e="NPS = targ'ibotchilar % − tanqidchilar %. Betaraflar ayirilmaydi ham, qo'shilmaydi ham, lekin foizlar umumiy songa nisbatan olinadi.",
      qe="When NPS is calculated, what happens to customers who gave a score of 7–8?",
      ae=["They are passives: left out of the formula but kept in the total",
          "They are added to the promoters, because they gave a good score",
          "They are added to the detractors, because they did not give 10",
          "They are weighted by half: each one counts as 0.5 of a promoter"],
      ee="NPS = % promoters − % detractors. Passives are neither added nor subtracted, but the percentages use the full total."),
 # 14 — ushlab qolish iqtisodiyoti
 dict(q="Harvard Business Review va Bain & Company tadqiqotlariga tayangan holda qaysi fikr to'g'ri?",
      a=["Ushlab qolishni 5% oshirish foydani 25–95% ko'paytirishi mumkin",
         "Yangi mijoz topish eskisini saqlashdan 5–25 barobar arzon turadi",
         "Ushlab qolishni 5% oshirish foydaga sezilarli ta'sir ko'rsatmaydi",
         "Yangi va eski mijozni jalb qilish xarajati deyarli bir xil bo'ladi"], c=0,
      e="Bain (F. Reyxxeld): retention +5% → foyda +25–95%. HBR: yangi mijoz eskisini saqlashdan 5–25 barobar qimmat.",
      qe="Based on research by Harvard Business Review and Bain & Company, which statement is correct?",
      ae=["Raising retention by 5% can increase profit by 25–95 percent",
          "Finding a new customer is 5–25 times cheaper than keeping one",
          "Raising retention by 5% has no noticeable effect on the profit",
          "Winning new and keeping old customers costs about the same"],
      ee="Bain (F. Reichheld): retention +5% → profit +25–95%. HBR: a new customer costs 5–25 times more than keeping one."),
 # 15 — trigger
 dict(q="Quyidagilardan qaysi biri CRM dagi <b>trigger</b> (avtomatik qoida) ga misol bo'ladi?",
      a=["Mijoz 30 kun xarid qilmasa, unga avtomatik shaxsiy taklif yuboriladi",
         "Har dushanba barcha mijozlarga bir xil reklama xabari qo'lda yuboriladi",
         "Menejer esiga tushganda mijozga qo'ng'iroq qilib, holini so'rab turadi",
         "Yangi mahsulot rasmlari har hafta Instagram sahifasiga joylab boriladi"], c=0,
      e="Trigger — «agar hodisa yuz bersa, unda amal bajariladi» qoidasi. Qolganlari qo'lda yoki hodisaga bog'liq bo'lmagan ishlar.",
      qe="Which of the following is an example of a CRM <b>trigger</b> (an automatic rule)?",
      ae=["If a customer has not bought for 30 days, a personal offer goes out",
          "Every Monday the same advert is sent by hand to every single customer",
          "The manager calls a customer whenever they just happen to remember",
          "New product photos are posted on the Instagram page once every week"],
      ee="A trigger is an \"if an event happens, then an action runs\" rule. The others are manual or not tied to an event."),
 # 16 — omnikanal
 dict(q="Mijoz ertalab Instagram'da, kechqurun telefon orqali murojaat qildi va operator uning ertalabki savolini so'ramasdan bildi. Bu qaysi tamoyil?",
      a=["Omnikanal: barcha kanallar bitta kartochka va bitta tarixga yig'iladi",
         "Ko'p kanallilik: har bir kanal alohida xodim va alohida bazada ishlaydi",
         "Segmentatsiya: mijozlar kanallar bo'yicha alohida guruhlarga bo'linadi",
         "Avtomatlashtirish: bot qo'ng'iroqlarga operator o'rniga javob beradi"], c=0,
      e="Omnikanal yondashuvda mijoz qaysi kanaldan yozmasin, uning tarixi bitta joyda — muammoni qaytadan tushuntirish shart emas.",
      qe="A customer wrote on Instagram in the morning and phoned in the evening, and the operator already knew about the morning question. Which principle is this?",
      ae=["Omnichannel: all channels feed one customer record and one history",
          "Multichannel: each channel runs with its own staff and its own base",
          "Segmentation: customers are split into separate groups by channel",
          "Automation: a bot answers every phone call instead of an operator"],
      ee="With an omnichannel approach the history sits in one place whatever channel the customer uses — no need to explain again."),
 # 17 — shaxsiy ma'lumotlar
 dict(q="O'zbekistonda mijozlarning shaxsiy ma'lumotlarini yig'ish, rozilik olish va saqlash asosan qaysi hujjat bilan tartibga solinadi?",
      a=["«Shaxsga doir ma'lumotlar to'g'risida»gi Qonun (2019-yil)",
         "«Elektron tijorat to'g'risida»gi Qonun (2015-yil tahriri)",
         "«Reklama to'g'risida»gi Qonun (1998-yildagi asosiy matn)",
         "Fuqarolik kodeksining mulk huquqiga oid umumiy qoidalari"], c=0,
      e="2019-yil 2-iyuldagi O'RQ-547-son «Shaxsga doir ma'lumotlar to'g'risida»gi Qonun rozilik, maqsad, himoya va saqlash talablarini belgilaydi.",
      qe="In Uzbekistan, which document mainly governs collecting customers' personal data, obtaining consent and storing it?",
      ae=["The Law \"On Personal Data\" (adopted in 2019)",
          "The Law \"On Electronic Commerce\" (2015 text)",
          "The Law \"On Advertising\" (its basic 1998 text)",
          "The general property rules of the Civil Code"],
      ee="Law No. ZRU-547 of 2 July 2019 \"On Personal Data\" sets the rules on consent, purpose, protection and storage."),
 # 18 — mini-CRM formulasi
 dict(q="Mini-CRM jadvalida F ustunida oxirgi xarid sanasi turibdi. <code>=TODAY()-F2</code> formulasi nimani hisoblaydi?",
      a=["Mijoz oxirgi marta xarid qilganidan beri necha kun o'tganini",
         "Mijoz bazaga qo'shilganidan beri necha kun o'tganini ko'rsatadi",
         "Keyingi rejalashtirilgan qo'ng'iroqqacha necha kun qolganini",
         "Mijozning jami xaridlari summasini kunlarga bo'lib hisoblaydi"], c=0,
      e="Bugungi sanadan oxirgi xarid sanasi ayiriladi — natija kunlarda. 60 dan katta bo'lsa, mijoz «xavf ostida» bo'lishi mumkin.",
      qe="In a mini-CRM sheet, column F holds the date of the last purchase. What does the formula <code>=TODAY()-F2</code> calculate?",
      ae=["How many days have passed since the customer last bought",
          "How many days have passed since the customer joined the base",
          "How many days are left until the next planned phone call",
          "The customer's total purchases divided by the number of days"],
      ee="It subtracts the last purchase date from today — the result is in days. Over 60 may mean the customer is \"at risk\"."),
 # 19 — Salesforce
 dict(q="1999-yilda tashkil topgan Salesforce CRM bozorini nimasi bilan o'zgartirdi?",
      a=["CRM ni o'rnatishsiz, internet orqali obuna xizmati (SaaS) qilib berdi",
         "Dunyodagi birinchi kontakt menejeri — ACT! dasturini yaratib chiqardi",
         "CRM ni butunlay bepul va ochiq kodli dastur sifatida tarqata boshladi",
         "Faqat yirik banklar uchun mo'ljallangan server dasturini ishlab chiqdi"], c=0,
      e="Salesforce (Mark Benioff) CRM ni bulutli obuna xizmati sifatida taklif qilgan kashshoflardan. ACT! esa 1987-yilda boshqa mualliflar tomonidan yaratilgan.",
      qe="How did Salesforce, founded in 1999, change the CRM market?",
      ae=["It offered CRM as an online subscription (SaaS), with nothing to install",
          "It built the world's first contact manager, the program known as ACT!",
          "It began to give CRM away as completely free and open-source software",
          "It developed server software meant only for very large banking groups"],
      ee="Salesforce (Marc Benioff) pioneered CRM as a cloud subscription. ACT! was created in 1987 by other authors."),
 # 20 — saloni misoli
 dict(q="Go'zallik saloni «xavf ostidagi» 120 mijozga shaxsiy xabar yubordi va ulardan 36 tasi qaytdi. Bu natija haqida qaysi xulosa to'g'ri?",
      a=["Qaytarish konversiyasi 30% — reklamasiz qo'shimcha tushum olindi",
         "Qaytarish konversiyasi 36% — chegirma haddan ziyod katta bo'lgan",
         "Qaytarish konversiyasi 3% — kampaniyani to'xtatish kerak bo'ladi",
         "Qaytgan mijozlar soni CAC ga teng — foyda umuman o'zgarmay qolgan"], c=0,
      e="36 ÷ 120 = 30%. Eski mijozlar reklamaga sarf qilmasdan qaytdi — ushlab qolish yangisini topishdan arzon.",
      qe="A beauty salon sent personal messages to 120 \"at risk\" customers and 36 of them came back. Which conclusion is correct?",
      ae=["Win-back conversion is 30% — extra revenue came without any ads",
          "Win-back conversion is 36% — the discount was far too generous",
          "Win-back conversion is 3% — the campaign ought to be stopped now",
          "The returning customers equal CAC — the profit did not change"],
      ee="36 ÷ 120 = 30%. Old customers came back without ad spending — keeping customers is cheaper than finding new ones."),
]
