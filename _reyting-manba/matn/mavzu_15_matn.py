# -*- coding: utf-8 -*-
"""M15 · Jamoani shakllantirish, xodimlarni boshqarish va xavflarni aniqlash — slaydlar va test (yangi_mavzu.py uchun).
T, d, slide — yangi_mavzu.py beradi.  Ishlatish:
  python3 _reyting-manba/yangi_mavzu.py _reyting-manba/matn/mavzu_15_matn.py mavzu-15.html "Jamoani shakllantirish, xodimlarni boshqarish va xavflarni aniqlash" 15
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
 E("span", "M15-mavzu · Amaliy mashg'ulot · 2 soat", "Topic 15 · Practical class · 2 hours", 'class="kicker"') +
 E("h1", "JAMOANI SHAKLLANTIRISH, XODIMLARNI BOSHQARISH VA XAVFLARNI ANIQLASH", "BUILDING A TEAM, MANAGING STAFF AND IDENTIFYING RISKS", 'class="grad"') +
 E("p", "Qachon xodim olish kerak · <b>rollar, tanlov va moslashuv</b> · motivatsiya, delegatsiya va samaradorlik · nizolar · <b>xavflar matritsasi</b> va ularni boshqarish · biznes uzluksizligi.",
   "When to hire · <b>roles, selection and onboarding</b> · motivation, delegation and performance · conflicts · <b>the risk matrix</b> and managing risks · business continuity.", 'class="lead"') +
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
 E("div", "Maqsad: talaba kichik biznes uchun <b>jamoa tuzishni</b>, xodimlarni <b>adolatli va natijaga yo'naltirib boshqarishni</b> hamda biznes xavflarini oldindan aniqlab, ularga qarshi <b>reja tuzishni</b> o'rganadi.",
   "Aim: the student learns to <b>build a team</b> for a small business, to <b>manage staff fairly and with a focus on results</b>, and to identify business risks in advance and <b>plan responses</b>.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("green", "🧮", "Xodim olishni hisoblaydi", "Calculates hiring", "Yangi xodim xarajatini u keltiradigan qo'shimcha hissa bilan solishtiradi.", "Compares a new employee's cost with the extra contribution they bring.") +
 card("blue", "🧭", "Rollarni belgilaydi", "Defines roles", "Lavozimlar, vazifalar va javobgarlikni aniq taqsimlaydi.", "Splits positions, duties and responsibility clearly.") +
 card("violet", "🔍", "Xodim tanlaydi", "Selects staff", "Lavozim tavsifi, suhbat savollari va sinov topshirig'i bilan to'g'ri odamni topadi.", "Finds the right person with a job description, interview questions and a trial task.") +
 card("orange", "🚀", "Boshqaradi va rag'batlantiradi", "Manages and motivates", "Maqsad qo'yadi, vazifani topshiradi, fikr bildiradi va adolatli bonus tuzadi.", "Sets goals, delegates, gives feedback and designs a fair bonus.") +
 card("pink", "⚠️", "Xavflarni baholaydi", "Assesses risks", "Xavflarni ehtimol va ta'sir bo'yicha baholab, matritsa va reestr tuzadi.", "Scores risks by likelihood and impact and builds a matrix and a register.") +
 card("cyan", "🛡", "Himoya rejasini tuzadi", "Plans protection", "Har bir yuqori xavf uchun aniq chora, mas'ul va muddat belgilaydi.", "Sets a clear action, owner and deadline for every high risk.") +
 '</div>')

# ============================ 3. REJA ============================
slide("Reja va tushunchalar", "Plan and concepts",
 E("span", "Mashg'ulot rejasi", "Class plan", 'class="kicker"') +
 E("h2", "Bugungi <span class=\"grad\">4 ta blok</span>", "Today's <span class=\"grad\">4 blocks</span>") +
 '<div class="grid g4">' +
 card("green", "1️⃣", "Jamoa tuzish", "Building the team", "Qachon xodim olish, rollar, tanlov, ishga qabul.", "When to hire, roles, selection, onboarding.") +
 card("blue", "2️⃣", "Boshqaruv", "Management", "Motivatsiya, delegatsiya, maqsad, fikr bildirish.", "Motivation, delegation, goals, feedback.") +
 card("violet", "3️⃣", "Natija va munosabat", "Results and relations", "Samaradorlik ko'rsatkichlari, nizolarni hal qilish.", "Performance indicators, resolving conflicts.") +
 card("orange", "4️⃣", "Xavflar", "Risks", "Xavf turlari, matritsa, boshqarish usullari, uzluksizlik.", "Risk types, the matrix, ways to manage, continuity.") +
 '</div>' + E("h3", "🔑 Tayanch tushunchalar", "🔑 Key concepts", 'style="margin-top:22px"') +
 E("div",
   '<span class="pill g">jamoa</span><span class="pill">lavozim tavsifi</span><span class="pill">tashkiliy tuzilma</span><span class="pill g">xodim tanlash</span>'
   '<span class="pill">STAR suhbat</span><span class="pill">mehnat shartnomasi</span><span class="pill">moslashuv (onboarding)</span><span class="pill g">motivatsiya</span>'
   '<span class="pill">bonus</span><span class="pill g">delegatsiya</span><span class="pill">SMART maqsad</span><span class="pill">fikr bildirish (SBI)</span>'
   '<span class="pill g">KPI</span><span class="pill">nizo</span><span class="pill g">xavf</span><span class="pill">ehtimol va ta\'sir</span>'
   '<span class="pill g">xavflar reestri</span><span class="pill">sug\'urta</span><span class="pill">biznes uzluksizligi</span>',
   '<span class="pill g">team</span><span class="pill">job description</span><span class="pill">organisational structure</span><span class="pill g">recruitment</span>'
   '<span class="pill">STAR interview</span><span class="pill">employment contract</span><span class="pill">onboarding</span><span class="pill g">motivation</span>'
   '<span class="pill">bonus</span><span class="pill g">delegation</span><span class="pill">SMART goal</span><span class="pill">feedback (SBI)</span>'
   '<span class="pill g">KPI</span><span class="pill">conflict</span><span class="pill g">risk</span><span class="pill">likelihood and impact</span>'
   '<span class="pill g">risk register</span><span class="pill">insurance</span><span class="pill">business continuity</span>'))

# ============================ 4. QACHON XODIM OLISH ============================
slide("Qachon xodim olish kerak?", "When should you hire?",
 E("span", "1-blok · Jamoa tuzish", "Block 1 · Building the team", 'class="kicker"') +
 E("h2", "Yangi xodim — <span class=\"grad\">xarajat emas, sarmoya</span> bo'lishi kerak", "A new employee should be <span class=\"grad\">an investment, not just a cost</span>") +
 '<div class="grid g2">' +
 card_ul("orange", "🔔", "Xodim kerakligining belgilari", "Signs you need staff", [
  ("Buyurtmalarni <b>rad etyapsiz</b> yoki muddat buzilyapti.", "You are <b>turning down orders</b> or missing deadlines."),
  ("Egasi kuniga 12+ soat ishlaydi va <b>rivojlanishga vaqt</b> qolmaydi.", "The owner works 12+ hours a day with <b>no time to develop</b> the business."),
  ("Sifat tushmoqda — shoshilish va charchoq sababli.", "Quality is falling — because of rushing and fatigue."),
  ("Bir xil ish takrorlanadi va uni o'rgatish mumkin.", "The same work repeats and can be taught.")], "tick") +
 '<div class="card" style="--c:var(--blue)">' + E("h3", "🧮 Hisob: «Nafis»ga yana bitta tikuvchi", "🧮 The numbers: one more seamstress at “Nafis”") +
 table(None, [
  [TD("Ish haqi", "Wages"), TD("3 500 000", "3,500,000")],
  [TD("Majburiy to'lovlar va boshqa xarajat (shartli)", "Mandatory charges and other costs (sample)"), TD("500 000", "500,000")],
  [TD("<b>Xodimning oylik narxi</b>", "<b>Monthly cost of the employee</b>"), TD("<b>4 000 000</b>", "<b>4,000,000</b>", "r")],
  [TD("U tikadigan formalar × hissa: 120 × 50 000", "Uniforms sewn × contribution: 120 × 50,000"), TD("6 000 000", "6,000,000")],
  [TD("<b>Qo'shimcha foyda</b>", "<b>Extra profit</b>"), TD("<b>+2 000 000</b>", "<b>+2,000,000</b>", "g")]]) +
 E("p", "Shart: shuncha <b>buyurtma bo'lishi</b> kerak. Buyurtma yo'q bo'lsa, xodim xarajat bo'lib qoladi.", "Condition: there must be <b>enough orders</b>. Without orders the employee is just a cost.", 'style="margin-top:8px"') + '</div></div>' +
 '<div class="grid g3" style="margin-top:14px">' +
 card("green", "👤", "Doimiy xodim", "Permanent staff", "Ish doimiy va asosiy bo'lsa: tikuv, bichish, sotuv.", "For steady, core work: sewing, cutting, sales.") +
 card("violet", "⏳", "Mavsumiy yoki vaqtinchalik", "Seasonal or temporary", "Faqat yozgi mavsum uchun qo'shimcha tikuvchi.", "An extra seamstress only for the summer season.") +
 card("cyan", "🧾", "Autsorsing", "Outsourcing", "Doimiy shtat shart emas: buxgalteriya, dizayn, IT.", "No permanent staff needed: accounting, design, IT.") + '</div>' +
 E("small", "«Nafis» — 12-mavzudagi shartli tikuv ustaxonasi. Ish haqi bo'yicha majburiy to'lovlar va soliqlar amaldagi qonunchilikka bog'liq — buxgalter yoki soliq xizmatidan aniqlang.",
   "“Nafis” is the sample sewing workshop from topic 12. Mandatory payroll charges and taxes depend on current law — confirm them with an accountant or the tax service.", 'class="note"'))

# ============================ 5. ROLLAR ============================
slide("Rollar va tuzilma", "Roles and structure",
 E("span", "1.2 · Tuzilma", "1.2 · Structure", 'class="kicker"') +
 E("h2", "Kim nima qiladi va <span class=\"grad\">kimga hisobot beradi?</span>", "Who does what and <span class=\"grad\">who reports to whom?</span>") +
 E("div", "Kichik jamoada ham har bir ishning <b>bitta egasi</b> bo'lishi kerak. «Hamma birgalikda qiladi» — ko'pincha «hech kim javob bermaydi» degani.",
   "Even in a small team every task needs <b>one owner</b>. “Everyone does it together” often means “nobody is responsible”.", 'class="def"') +
 table([("Lavozim", "Position"), ("Asosiy vazifa", "Main duty"), ("Kimga hisobot", "Reports to"), ("Asosiy natija", "Key result")], [
  [TD("<b>👑 Rahbar (egasi)</b>", "<b>👑 Manager (owner)</b>"), TD("Strategiya, yirik mijozlar, moliya, xodim tanlash", "Strategy, key clients, finance, hiring"), TD("—", "—"), TD("Foyda, pul oqimi, o'sish", "Profit, cash flow, growth")],
  [TD("<b>✂️ Bichuvchi (1)</b>", "<b>✂️ Cutter (1)</b>"), TD("Andoza, bichish, mato sarfini nazorat qilish", "Patterns, cutting, controlling fabric use"), TD("Rahbar", "Manager"), TD("Mato isrofi, o'z vaqtida bichish", "Fabric waste, cutting on time")],
  [TD("<b>🧵 Tikuvchilar (4)</b>", "<b>🧵 Seamstresses (4)</b>"), TD("Tikish, sifat, texnologik kartaga amal qilish", "Sewing, quality, following the process card"), TD("Katta tikuvchi → rahbar", "Senior seamstress → manager"), TD("Dona/kun, brak ulushi", "Units/day, defect rate")],
  [TD("<b>📦 Dazmol va qadoq (1)</b>", "<b>📦 Ironing and packing (1)</b>"), TD("Dazmollash, yorliq, qadoqlash, ombor", "Ironing, labels, packing, stock"), TD("Rahbar", "Manager"), TD("Tayyor buyurtmalar, ombor tartibi", "Finished orders, stock order")],
  [TD("<b>📞 Sotuv menejeri (1)</b>", "<b>📞 Sales manager (1)</b>"), TD("Maktab va do'konlar bilan ishlash, buyurtma, to'lov nazorati", "Working with schools and shops, orders, payment follow-up"), TD("Rahbar", "Manager"), TD("Buyurtmalar soni, debitor qarz", "Number of orders, receivables")],
  [TD("<b>🧾 Buxgalter (autsorsing)</b>", "<b>🧾 Accountant (outsourced)</b>"), TD("Hisob, soliq hisobotlari, ish haqi hisobi", "Bookkeeping, tax reports, payroll"), TD("Rahbar", "Manager"), TD("O'z vaqtida va xatosiz hisobot", "Timely, error-free reports")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("blue", "📄", "Lavozim tavsifi", "A job description", "Har lavozim uchun 1 bet: vazifalar, kutilgan natija, talab (malaka, tajriba), ish vaqti, kimga bo'ysunadi. U tanlov, baholash va nizolarda asos bo'ladi.",
      "One page per position: duties, expected results, requirements (skills, experience), working hours, reporting line. It is the basis for selection, appraisal and disputes.") +
 card("orange", "⚠️", "Egasining tuzog'i", "The owner's trap", "Egasi hamma ishni o'zi qilsa, biznes undan katta bo'lolmaydi. Rahbarning vazifasi — <b>tizim qurish</b>, har bir tikuvni o'zi tikish emas.",
      "If the owner does everything, the business cannot grow beyond them. The manager's job is <b>to build the system</b>, not to sew every seam.") + '</div>')

# ============================ 6. XODIM TANLASH ============================
slide("Xodim tanlash", "Selecting staff",
 E("span", "1.3 · Tanlov", "1.3 · Selection", 'class="kicker"') +
 E("h2", "To'g'ri odamni <span class=\"grad\">6 qadamda</span> toping", "Find the right person <span class=\"grad\">in 6 steps</span>") +
 '<div class="chain">' +
 '<div class="link l1">' + E("h3", "1. Tavsif", "1. Description") + E("p", "Lavozim tavsifi va ish haqi oralig'i.", "Job description and pay range.") + '</div>' +
 '<div class="link l2">' + E("h3", "2. E'lon", "2. Advert") + E("p", "Telegram, tanishlar tavsiyasi, kollej va OTM.", "Telegram, referrals, colleges and universities.") + '</div>' +
 '<div class="link l3">' + E("h3", "3. Saralash", "3. Screening") + E("p", "Qisqa telefon suhbati — 3–5 nomzod.", "A short phone call — 3–5 candidates.") + '</div></div>' +
 '<div class="chain" style="margin-top:10px">' +
 '<div class="link l4">' + E("h3", "4. Suhbat", "4. Interview") + E("p", "Bir xil savollar hammaga — solishtirish oson.", "The same questions for everyone — easy to compare.") + '</div>' +
 '<div class="link l3">' + E("h3", "5. Sinov topshirig'i", "5. Trial task") + E("p", "Bitta forma tikish, 1–2 soat — haqi to'lanadi.", "Sew one uniform in 1–2 hours — paid.") + '</div>' +
 '<div class="link l2">' + E("h3", "6. Taklif", "6. Offer") + E("p", "Shartlar yozma: ish haqi, vaqt, sinov muddati.", "Terms in writing: pay, hours, probation.") + '</div></div>' +
 '<div class="grid g2" style="margin-top:14px">' +
 '<div class="card" style="--c:var(--green)">' + E("h3", "⭐ STAR savollari: o'tmishdagi xatti-harakat", "⭐ STAR questions: past behaviour") +
 '<ul class="tick">' + E("li", "«Oxirgi ishingizda shoshilinch buyurtma bo'lganda qanday vaziyat edi va <b>siz nima qildingiz</b>?»", "“In your last job, describe a rush order and <b>what you did</b>.”") +
 E("li", "«Brak chiqqanini o'zingiz sezgan holatni ayting: <b>natija</b> nima bo'ldi?»", "“Tell me about a time you spotted a defect yourself: what was the <b>result</b>?”") +
 E("li", "«Hamkasbingiz bilan kelishmovchilik bo'lganda <b>qanday hal qildingiz</b>?»", "“When you disagreed with a colleague, <b>how did you resolve it</b>?”") + '</ul>' +
 E("p", "STAR — Vaziyat, Vazifa, Harakat, Natija. «Nima qilardingiz?» emas, <b>«nima qildingiz?»</b> deb so'rang.", "STAR — Situation, Task, Action, Result. Ask <b>“what did you do?”</b>, not “what would you do?”.", 'style="margin-top:8px"') + '</div>' +
 card_ul("red", "🚫", "So'ralmaydigan savollar (kamsitish)", "Questions not to ask (discrimination)", [
  ("«Turmush qurish yoki farzand ko'rish rejangiz bormi?»", "“Do you plan to marry or have children?”"),
  ("Millat, din, siyosiy qarash haqida savollar.", "Questions about ethnicity, religion or political views."),
  ("Ishga aloqasi yo'q sog'liq va shaxsiy hayot savollari.", "Health and private-life questions unrelated to the job."),
  ("Tanlov faqat <b>malaka va ishga yaroqlilik</b> bo'yicha bo'lishi kerak.", "Selection must be based only on <b>skills and fitness for the job</b>.")], "tick cross") + '</div>')

# ============================ 7. ISHGA QABUL ============================
slide("Ishga qabul va moslashuv", "Hiring and onboarding",
 E("span", "1.4 · Birinchi kunlar", "1.4 · The first days", 'class="kicker"') +
 E("h2", "Birinchi oy — <span class=\"grad\">xodim qolish-qolmasligini</span> hal qiladi", "The first month decides <span class=\"grad\">whether an employee stays</span>") +
 '<div class="grid g2">' +
 card_ul("blue", "📜", "Rasmiylashtirish", "Formalities", [
  ("<b>Mehnat shartnomasi</b> yozma tuziladi: lavozim, ish haqi, ish vaqti, ta'til.", "A written <b>employment contract</b>: position, pay, working hours, leave."),
  ("<b>Sinov muddati</b> — ikki tomon ham moslikni tekshiradi; muddat va shartlari qonun bilan cheklangan.", "<b>Probation</b> — both sides check the fit; its length and terms are limited by law."),
  ("Mehnat xavfsizligi bo'yicha yo'riqnoma va imzo.", "Health and safety instructions, with a signature."),
  ("Ish haqi va majburiy to'lovlar rasmiy hisoblanadi.", "Pay and mandatory charges are calculated officially.")], "clean") +
 '<div class="card" style="--c:var(--green)">' + E("h3", "🗓 Moslashuv rejasi (namuna)", "🗓 An onboarding plan (sample)") +
 table([("Qachon", "When"), ("Nima qilinadi", "What happens")], [
  [TD("<b>1-kun</b>", "<b>Day 1</b>"), TD("Jamoa bilan tanishuv, ish joyi, xavfsizlik qoidalari, texnologik karta", "Meeting the team, workplace, safety rules, process card")],
  [TD("<b>2–5-kun</b>", "<b>Days 2–5</b>"), TD("Tajribali tikuvchi yonida ishlash (ustoz), kunlik qisqa fikr", "Working next to an experienced seamstress (a mentor), short daily feedback")],
  [TD("<b>2–4-hafta</b>", "<b>Weeks 2–4</b>"), TD("Mustaqil ish, me'yorning 70% → 100% ga chiqish", "Independent work, from 70% to 100% of the norm")],
  [TD("<b>1 oy oxiri</b>", "<b>End of month 1</b>"), TD("Natija suhbati: yutuq, muammo, keyingi maqsad", "A results talk: wins, problems, the next goal")]]) + '</div></div>' +
 E("div", "💡 Yangi xodimni «o'zi o'rganib oladi» deb tashlab qo'ymang: birinchi oyda yo'l-yo'riq bergan ustoz — xodim ketib qolishining eng arzon oldini olish usuli.",
   "💡 Do not leave a new employee to “figure it out”: a mentor in the first month is the cheapest way to prevent them from leaving.", 'class="quote" style="margin-top:12px"') +
 E("small", "Mehnat shartnomasi, sinov muddati, ish vaqti, ta'til va ishdan bo'shatish tartibi Mehnat kodeksi bilan tartibga solinadi. Amaldagi talablarni lex.uz dan yoki mutaxassisdan aniqlang.",
   "Employment contracts, probation, working hours, leave and dismissal are governed by the Labour Code. Confirm current requirements on lex.uz or with a specialist.", 'class="note"'))

# ============================ 8. MOTIVATSIYA ============================
slide("Motivatsiya va bonus", "Motivation and bonuses",
 E("span", "2-blok · Boshqaruv", "Block 2 · Management", 'class="kicker"') +
 E("h2", "Odamlar faqat <span class=\"grad\">pul uchun</span> ishlamaydi", "People do not work <span class=\"grad\">only for money</span>") +
 '<div class="grid g2">' +
 card_ul("green", "💵", "Moddiy rag'bat", "Financial rewards", [
  ("<b>Barqaror ish haqi</b> — o'z vaqtida va bozor darajasida.", "<b>A steady wage</b> — paid on time and at market level."),
  ("<b>Natija bonusi</b> — aniq formula bilan, oldindan e'lon qilingan.", "<b>A results bonus</b> — with a clear formula announced in advance."),
  ("Mavsum oxiri mukofoti, foydadan ulush.", "An end-of-season reward, a share of profit.")], "tick") +
 card_ul("violet", "🌱", "Nomoddiy rag'bat", "Non-financial rewards", [
  ("<b>E'tirof:</b> yaxshi ishni hamma oldida aytish.", "<b>Recognition:</b> praising good work in front of others."),
  ("<b>O'sish:</b> katta tikuvchi, ustoz, yangi ko'nikma.", "<b>Growth:</b> senior seamstress, mentor, new skills."),
  ("<b>Mustaqillik:</b> o'z ishini qanday qilishni tanlash erkinligi.", "<b>Autonomy:</b> freedom to choose how to do the job."),
  ("<b>Hurmat va adolat:</b> va'da bajariladi, qoidalar hammaga bir xil.", "<b>Respect and fairness:</b> promises are kept, rules apply to all.")], "tick") + '</div>' +
 E("h3", "«Nafis» bonus formulasi (shartli)", "“Nafis” bonus formula (sample)", 'style="margin-top:14px"') +
 table([("Shart", "Condition"), ("Qiymat", "Value")], [
  [TD("Jamoaning oylik rejasi", "The team's monthly plan"), TD("1 000 dona forma", "1,000 uniforms")],
  [TD("Rejadan ortiq har bir dona uchun bonus fondiga", "To the bonus pool for each unit over the plan"), TD("5 000 so'm", "5,000 so'm")],
  [TD("Sifat sharti", "Quality condition"), TD("Brak ulushi ≤ 2% (aks holda bonus yo'q)", "Defect rate ≤ 2% (otherwise no bonus)")],
  [TD("<b>Oktyabr: 1 120 dona, brak 1,5%</b>", "<b>October: 1,120 units, defects 1.5%</b>"), TD("<b>120 × 5 000 = 600 000 so'm</b> — jamoaga ishlagan soatiga qarab bo'linadi", "<b>120 × 5,000 = 600,000 so'm</b> — shared by hours worked", "g")]]) +
 E("small", "Bonus faqat hajmga bog'lansa, sifat tushadi. Shuning uchun <b>hajm + sifat</b> birga o'lchanadi. Formulani o'zgartirsangiz, oldindan e'lon qiling.",
   "A bonus tied only to volume lowers quality, so <b>volume + quality</b> are measured together. If you change the formula, announce it in advance.", 'class="note"'))

# ============================ 9. DELEGATSIYA ============================
slide("Delegatsiya, maqsad va fikr bildirish", "Delegation, goals and feedback",
 E("span", "2.2 · Boshqaruv vositalari", "2.2 · Management tools", 'class="kicker"') +
 E("h2", "Vazifani <span class=\"grad\">to'g'ri topshirish</span> — rahbarning asosiy ko'nikmasi", "<span class=\"grad\">Delegating well</span> is a manager's key skill") +
 '<div class="grid g3">' +
 '<div class="card" style="--c:var(--blue)">' + E("h3", "📌 Delegatsiyaning 5 elementi", "📌 5 elements of delegation") +
 '<ul class="clean">' + E("li", "<b>Natija:</b> nima bo'lishi kerak?", "<b>Result:</b> what must be achieved?") +
 E("li", "<b>Muddat:</b> qachongacha?", "<b>Deadline:</b> by when?") +
 E("li", "<b>Vakolat:</b> nimani o'zi hal qila oladi?", "<b>Authority:</b> what can they decide alone?") +
 E("li", "<b>Resurs:</b> pul, odam, vaqt.", "<b>Resources:</b> money, people, time.") +
 E("li", "<b>Nazorat nuqtasi:</b> qachon tekshiramiz?", "<b>Checkpoint:</b> when do we review?") + '</ul></div>' +
 '<div class="card" style="--c:var(--green)">' + E("h3", "🎯 SMART maqsad", "🎯 A SMART goal") +
 E("p", "Aniq · O'lchanadigan · Erishiladigan · Muhim · Muddatli.", "Specific · Measurable · Achievable · Relevant · Time-bound.") +
 E("p", "❌ «Sifatni yaxshilang.»", "❌ “Improve quality.”", 'style="margin-top:8px"') +
 E("p", "✅ «31-oktyabrgacha brak ulushini 4% dan 2% ga tushiring.»", "✅ “Cut the defect rate from 4% to 2% by 31 October.”") + '</div>' +
 '<div class="card" style="--c:var(--violet)">' + E("h3", "💬 SBI fikr bildirish", "💬 SBI feedback") +
 E("p", "<b>V</b>aziyat → <b>X</b>atti-harakat → <b>T</b>a'sir.", "<b>S</b>ituation → <b>B</b>ehaviour → <b>I</b>mpact.") +
 E("p", "«Kecha 10 ta formani topshirganda (V), cho'ntak choklari qiyshiq edi (X) — maktab 3 tasini qaytardi (T). Keling, sababini birga ko'raylik.»",
   "“Yesterday when you handed in 10 uniforms (S), the pocket seams were crooked (B) — the school sent 3 back (I). Let us look at the cause together.”", 'style="margin-top:8px;font-style:italic"') + '</div></div>' +
 '<div class="grid g2" style="margin-top:14px">' +
 card("orange", "⏱", "Haftalik 30 daqiqalik yig'ilish", "A 30-minute weekly meeting", "Dushanba: o'tgan hafta natijasi (raqamlar), shu hafta rejasi, muammolar va kimga yordam kerak. Har yig'ilish oxirida — <b>kim, nima, qachongacha</b>.",
      "Monday: last week's results (numbers), this week's plan, problems and who needs help. Every meeting ends with <b>who, what, by when</b>.") +
 card("red", "⚠️", "Tez-tez uchraydigan xatolar", "Common mistakes", "Vazifani «hammaga» berish · natijani aytmay, faqat jarayonni buyurish · topshirib, keyin har daqiqa aralashish · xatoni hamma oldida tanqid qilish.",
      "Giving a task to “everyone” · prescribing the process without stating the result · delegating, then interfering every minute · criticising mistakes in public.") + '</div>')

# ============================ 10. KPI ============================
slide("Samaradorlikni o'lchash", "Measuring performance",
 E("span", "3-blok · Natija", "Block 3 · Results", 'class="kicker"') +
 E("h2", "Har lavozimga <span class=\"grad\">2–3 ta aniq ko'rsatkich</span>", "<span class=\"grad\">2–3 clear indicators</span> per role") +
 E("div", "<b>KPI</b> (asosiy samaradorlik ko'rsatkichi) — xodim ishining natijasini o'lchaydigan raqam. U <b>xodim ta'sir qila oladigan</b> narsani o'lchashi kerak, «ish joyida necha soat o'tirgani»ni emas.",
   "A <b>KPI</b> (key performance indicator) is a number that measures the result of an employee's work. It should measure what <b>the employee can influence</b>, not “how many hours they sat at work”.", 'class="def"') +
 table([("Lavozim", "Position"), ("KPI", "KPI"), ("Maqsad", "Target"), ("Oktyabr", "October")], [
  [TD("<b>Tikuvchi</b>", "<b>Seamstress</b>"), TD("Kunlik ishlab chiqarish · brak ulushi", "Daily output · defect rate"), TD("≥ 6 dona · ≤ 2%", "≥ 6 units · ≤ 2%"), TD("6,4 · 1,5% ✅", "6.4 · 1.5% ✅", "g")],
  [TD("<b>Bichuvchi</b>", "<b>Cutter</b>"), TD("Mato isrofi · bichishda kechikish", "Fabric waste · cutting delays"), TD("≤ 8% · 0 kun", "≤ 8% · 0 days"), TD("11% · 2 kun ❌", "11% · 2 days ❌", "r")],
  [TD("<b>Sotuv menejeri</b>", "<b>Sales manager</b>"), TD("Yangi buyurtmalar · 30 kundan oshgan debitor qarz", "New orders · receivables over 30 days"), TD("≥ 5 ta · 0 so'm", "≥ 5 · 0 so'm"), TD("6 ta · 1,2 mln ⚠️", "6 · 1.2 million ⚠️")],
  [TD("<b>Dazmol va qadoq</b>", "<b>Ironing and packing</b>"), TD("Kechikkan jo'natma · qaytarilgan qadoq", "Late shipments · returned packs"), TD("0 · ≤ 1%", "0 · ≤ 1%"), TD("0 · 0,5% ✅", "0 · 0.5% ✅", "g")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("blue", "🔎", "KPI ❌ bo'lsa", "When a KPI is ❌", "Avval <b>sababini</b> so'rang: bichuvchida isrof 11% — andoza eskirgan bo'lishi mumkin, xodim emas. Tizim muammosini odamga ag'darmang.",
      "First ask <b>why</b>: the cutter's 11% waste may come from outdated patterns, not the person. Do not blame people for system problems.") +
 card("green", "📊", "Qanday yuritiladi?", "How to keep it", "Oddiy jadval: har kuni tikuvchilar dona va brakni yozadi, har hafta rahbar yig'adi. Raqamlar jamoaga ochiq — bu adolat va raqobat ruhini beradi.",
      "A simple table: seamstresses record units and defects daily, the manager collects them weekly. Numbers are open to the team — this brings fairness and healthy competition.") + '</div>')

# ============================ 11. NIZOLAR ============================
slide("Nizolar va qiyin vaziyatlar", "Conflicts and difficult situations",
 E("span", "3.2 · Munosabatlar", "3.2 · Relations", 'class="kicker"') +
 E("h2", "Nizo — <span class=\"grad\">yashirish emas, hal qilish</span> kerak bo'lgan muammo", "A conflict is a problem <span class=\"grad\">to solve, not to hide</span>") +
 '<div class="chain">' +
 '<div class="link l1">' + E("h3", "1. Alohida tinglash", "1. Listen separately") + E("p", "Har ikki tomonni alohida, gapini bo'lmay tinglang.", "Hear both sides separately, without interrupting.") + '</div>' +
 '<div class="link l2">' + E("h3", "2. Faktlarni ajratish", "2. Separate facts") + E("p", "Nima bo'ldi (fakt) va kim nima his qildi (fikr).", "What happened (facts) and how people felt (opinions).") + '</div>' +
 '<div class="link l3">' + E("h3", "3. Birgalikdagi uchrashuv", "3. Joint meeting") + E("p", "Ayblash emas, umumiy maqsad: buyurtma va sifat.", "No blame — a shared goal: the order and quality.") + '</div>' +
 '<div class="link l4">' + E("h3", "4. Kelishuv va nazorat", "4. Agreement and follow-up") + E("p", "Kim nima qiladi; 1–2 haftadan keyin tekshirish.", "Who does what; check again in 1–2 weeks.") + '</div></div>' +
 table([("Vaziyat", "Situation"), ("Noto'g'ri", "Wrong"), ("To'g'ri", "Right")], [
  [TD("Ikki tikuvchi ish taqsimoti bo'yicha tortishdi", "Two seamstresses argued over the workload"), TD("«Tinchlaning, ishlang!» — sababini so'ramaslik", "“Calm down and work!” — without asking why", "r"), TD("Alohida tinglash, navbat jadvalini birga tuzish", "Listen separately, draw up a rota together", "g")],
  [TD("Xodim bir necha marta kechikdi", "An employee was late several times"), TD("Hamma oldida tanqid qilish", "Criticising them in front of everyone", "r"), TD("Yakkama-yakka SBI suhbat, sababini bilish, kelishuv", "A one-to-one SBI talk, find the cause, agree", "g")],
  [TD("Mijoz xodimga qo'pollik qildi", "A customer was rude to an employee"), TD("Xodimni yolg'iz qoldirish", "Leaving the employee alone with it", "r"), TD("Rahbar suhbatni o'z zimmasiga oladi, xodimni himoya qiladi", "The manager takes over the conversation and backs the employee", "g")],
  [TD("Qoidabuzarlik takrorlanmoqda", "A rule breach keeps repeating"), TD("Og'zaki, yozuvsiz «oxirgi ogohlantirish»lar", "Verbal, unrecorded “final warnings”", "r"), TD("Yozma qayd, qonuniy tartibda intizomiy chora", "A written record, disciplinary action by the legal procedure", "g")]]) +
 E("small", "Intizomiy jazo va ishdan bo'shatish faqat Mehnat kodeksida belgilangan asos va tartibda qo'llaniladi. Shubha bo'lsa, huquqshunos bilan maslahatlashing.",
   "Disciplinary measures and dismissal may be applied only on the grounds and by the procedure set in the Labour Code. When in doubt, consult a lawyer.", 'class="note"'))

# ============================ 12. XAVF TURLARI ============================
slide("Biznes xavflarining turlari", "Types of business risk",
 E("span", "4-blok · Xavflar", "Block 4 · Risks", 'class="kicker"') +
 E("h2", "Nima noto'g'ri ketishi mumkin? <span class=\"grad\">6 guruh xavf</span>", "What could go wrong? <span class=\"grad\">6 groups of risk</span>") +
 E("div", "<b>Xavf</b> — sodir bo'lishi mumkin bo'lgan va biznes maqsadiga zarar yetkazadigan hodisa. Xavfni bilish — undan qo'rqish emas, unga <b>oldindan tayyorlanish</b>.",
   "A <b>risk</b> is an event that may happen and would harm the business's goals. Knowing a risk does not mean fearing it — it means <b>preparing in advance</b>.", 'class="def"') +
 '<div class="grid g3" style="margin-top:14px">' +
 card("blue", "📉", "Bozor xavfi", "Market risk", "Talab kamayadi, raqobatchi arzonroq taklif qiladi. <b>Nafis:</b> maktablar boshqa ustaxonani tanlashi.", "Demand falls, a rival offers a lower price. <b>Nafis:</b> schools choosing another workshop.") +
 card("green", "💰", "Moliyaviy xavf", "Financial risk", "Kassa uzilishi, mijoz to'lamasligi, valyuta va narx o'zgarishi. <b>Nafis:</b> maktab to'lovni 2 oy kechiktirishi.", "A cash gap, non-paying customers, currency and price changes. <b>Nafis:</b> a school paying 2 months late.") +
 card("orange", "⚙️", "Operatsion xavf", "Operational risk", "Uskuna buzilishi, xomashyo kechikishi, sifat muammosi. <b>Nafis:</b> mato yetkazib beruvchi kechikishi.", "Equipment failure, late raw materials, quality problems. <b>Nafis:</b> the fabric supplier being late.") +
 card("violet", "👥", "Kadrlar xavfi", "People risk", "Asosiy xodim ketishi, malaka yetishmasligi, kasallik. <b>Nafis:</b> yagona bichuvchi ishdan ketishi.", "A key person leaving, lack of skills, illness. <b>Nafis:</b> the only cutter quitting.") +
 card("red", "⚖️", "Huquqiy xavf", "Legal risk", "Shartnoma nizolari, jarima, ruxsatnoma muddati. <b>Nafis:</b> shartnomasiz ishlab, to'lovni undira olmaslik.", "Contract disputes, fines, expired permits. <b>Nafis:</b> working without a contract and failing to collect payment.") +
 card("cyan", "🔥", "Tashqi va favqulodda", "External and emergency", "Yong'in, suv bosishi, elektr uzilishi, pandemiya. <b>Nafis:</b> ustaxonada yong'in.", "Fire, flooding, power cuts, a pandemic. <b>Nafis:</b> a fire in the workshop.") + '</div>' +
 E("div", "📌 Xavflarni topishning oddiy usuli: jamoa bilan 20 daqiqa «<b>bizni nima to'xtatib qo'yishi mumkin?</b>» degan savolga javob yozing. Har bir javob — xavflar ro'yxatiga.",
   "📌 A simple way to find risks: spend 20 minutes with the team writing answers to “<b>what could stop us?</b>”. Every answer goes on the risk list.", 'class="quote" style="margin-top:12px"'))

# ============================ 13. XAVF MATRITSASI ============================
slide("Xavf matritsasi va reestr", "The risk matrix and register",
 E("span", "4.2 · Baholash", "4.2 · Assessment", 'class="kicker"') +
 E("h2", "Xavf darajasi = <span class=\"grad\">ehtimol × ta'sir</span>", "Risk level = <span class=\"grad\">likelihood × impact</span>") +
 E("div", "Har xavfga <b>ehtimol</b> (1 — juda kam, 5 — deyarli aniq) va <b>ta'sir</b> (1 — sezilmaydi, 5 — biznesni to'xtatadi) bo'yicha ball qo'yiladi. Ko'paytma — xavf bali: <b>15–25 yuqori</b>, <b>8–14 o'rta</b>, <b>1–7 past</b>.",
   "Each risk is scored for <b>likelihood</b> (1 — very rare, 5 — almost certain) and <b>impact</b> (1 — negligible, 5 — stops the business). The product is the risk score: <b>15–25 high</b>, <b>8–14 medium</b>, <b>1–7 low</b>.", 'class="def"') +
 table([("№", "No."), ("Xavf («Nafis»)", "Risk (“Nafis”)"), ("Ehtimol", "Likelihood"), ("Ta'sir", "Impact"), ("Ball", "Score"), ("Daraja", "Level")], [
  [TD("1", "1"), TD("Mato yetkazib beruvchi mavsum oldidan kechikadi", "The fabric supplier is late before the season"), TD("4", "4"), TD("4", "4"), TD("<b>16</b>", "<b>16</b>"), TD("🔴 Yuqori", "🔴 High", "r")],
  [TD("2", "2"), TD("Yagona bichuvchi ishdan ketadi", "The only cutter quits"), TD("3", "3"), TD("4", "4"), TD("<b>12</b>", "<b>12</b>"), TD("🟡 O'rta", "🟡 Medium")],
  [TD("3", "3"), TD("Mavsumda maktablar buyurtmasi kamayadi", "School orders fall in the season"), TD("2", "2"), TD("5", "5"), TD("<b>10</b>", "<b>10</b>"), TD("🟡 O'rta", "🟡 Medium")],
  [TD("4", "4"), TD("Tikuv mashinasi buziladi", "A sewing machine breaks down"), TD("3", "3"), TD("3", "3"), TD("<b>9</b>", "<b>9</b>"), TD("🟡 O'rta", "🟡 Medium")],
  [TD("5", "5"), TD("Mijoz to'lovni kechiktiradi", "A customer pays late"), TD("3", "3"), TD("3", "3"), TD("<b>9</b>", "<b>9</b>"), TD("🟡 O'rta", "🟡 Medium")],
  [TD("6", "6"), TD("Ustaxonada yong'in", "A fire in the workshop"), TD("1", "1"), TD("5", "5"), TD("<b>5</b>", "<b>5</b>"), TD("🟢 Past (lekin ta'siri katta!)", "🟢 Low (but huge impact!)", "g")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("blue", "📋", "Xavflar reestri", "The risk register", "Jadvalga yana 3 ustun qo'shing: <b>chora</b>, <b>mas'ul</b>, <b>muddat</b>. Reestrni har chorakda va har katta o'zgarishda (yangi mijoz, kredit, eksport) yangilang.",
      "Add 3 more columns: <b>action</b>, <b>owner</b>, <b>deadline</b>. Update the register every quarter and with every big change (a new client, a loan, exports).") +
 card("orange", "⚠️", "Past ball — e'tiborsiz degani emas", "Low score does not mean ignore", "Yong'in kam ehtimolli, lekin biznesni butunlay yo'q qilishi mumkin. Ta'siri 5 bo'lgan har bir xavf uchun, balidan qat'i nazar, oddiy himoya bo'lsin (sug'urta, o't o'chirgich).",
      "A fire is unlikely but could wipe out the business. Every risk with impact 5 needs basic protection whatever its score (insurance, extinguishers).") + '</div>')

# ============================ 14. XAVFNI BOSHQARISH ============================
slide("Xavfni boshqarishning 4 usuli", "4 ways to manage risk",
 E("span", "4.3 · Choralar", "4.3 · Responses", 'class="kicker"') +
 E("h2", "Xavfga qarshi <span class=\"grad\">4 ta javob</span>", "<span class=\"grad\">4 responses</span> to a risk") +
 '<div class="grid g4">' +
 card("red", "🚫", "Oldini olish", "Avoid", "Xavfli faoliyatdan voz kechish: shartnomasiz yirik buyurtma olmaslik.", "Give up the risky activity: no large orders without a contract.") +
 card("orange", "📉", "Kamaytirish", "Reduce", "Ehtimol yoki ta'sirni pasaytirish: ikkinchi yetkazib beruvchi, profilaktika.", "Lower likelihood or impact: a second supplier, maintenance.") +
 card("blue", "🔁", "O'tkazish", "Transfer", "Oqibatni boshqaga yuklash: sug'urta, shartnomada jarima, avans.", "Shift the consequence: insurance, contract penalties, advances.") +
 card("green", "✅", "Qabul qilish", "Accept", "Kichik xavf — zaxira pul bilan qoplash va kuzatish.", "A small risk — cover it with a reserve and monitor it.") + '</div>' +
 E("h3", "«Nafis»: eng muhim 4 xavf uchun harakat rejasi", "“Nafis”: action plan for the top 4 risks", 'style="margin-top:14px"') +
 table([("Xavf", "Risk"), ("Usul", "Response"), ("Chora", "Action"), ("Mas'ul", "Owner"), ("Muddat", "Deadline")], [
  [TD("<b>1. Mato kechikishi (16)</b>", "<b>1. Late fabric (16)</b>"), TD("Kamaytirish", "Reduce"), TD("Ikkinchi yetkazib beruvchi; may oyida 1 oylik mato zaxirasi", "A second supplier; one month's fabric stock by May"), TD("Rahbar", "Manager"), TD("30-aprel", "30 April")],
  [TD("<b>2. Bichuvchi ketishi (12)</b>", "<b>2. Cutter quits (12)</b>"), TD("Kamaytirish", "Reduce"), TD("Katta tikuvchini bichishga o'rgatish; andozalarni hujjatlashtirish", "Train the senior seamstress to cut; document the patterns"), TD("Bichuvchi", "Cutter"), TD("2 oy", "2 months")],
  [TD("<b>3. Buyurtma kamayishi (10)</b>", "<b>3. Fewer orders (10)</b>"), TD("Kamaytirish", "Reduce"), TD("Maktablar bilan aprelda oldindan shartnoma; ish kiyimi — 2-mahsulot", "Contracts with schools in April; workwear as a 2nd product"), TD("Sotuv menejeri", "Sales manager"), TD("1-may", "1 May")],
  [TD("<b>5. To'lov kechikishi (9)</b>", "<b>5. Late payment (9)</b>"), TD("O'tkazish", "Transfer"), TD("30% avans; shartnomada kechikish uchun penya", "A 30% advance; late-payment penalty in the contract"), TD("Sotuv menejeri", "Sales manager"), TD("Har shartnomada", "Every contract")]]) +
 E("small", "Sug'urta turlari va shartlari kompaniyaga qarab farq qiladi — polisda nima qoplanishi va nima qoplanmasligini o'qib chiqing.",
   "Insurance types and terms differ by company — read what the policy does and does not cover.", 'class="note"'))

# ============================ 15. UZLUKSIZLIK ============================
slide("Biznes uzluksizligi", "Business continuity",
 E("span", "4.4 · Uzluksizlik", "4.4 · Continuity", 'class="kicker"') +
 E("h2", "Biznes <span class=\"grad\">bitta odam yoki bitta yetkazib beruvchiga</span> bog'liq bo'lmasin", "The business must not depend <span class=\"grad\">on one person or one supplier</span>") +
 E("div", "<b>Biznes uzluksizligi</b> — kutilmagan hodisadan keyin ham asosiy ishni davom ettirish qobiliyati. Eng katta xavf ko'pincha «faqat u biladi» yoki «faqat undan olamiz» degan joyda yashiringan.",
   "<b>Business continuity</b> is the ability to keep core work going after an unexpected event. The biggest risk often hides where “only they know” or “we only buy from them”.", 'class="def"') +
 '<div class="grid g2" style="margin-top:14px">' +
 card_ul("green", "✅", "Uzluksizlik nazorat ro'yxati", "A continuity checklist", [
  ("Har muhim ishni <b>kamida 2 kishi</b> biladi (o'zaro o'rgatish).", "<b>At least 2 people</b> know every key task (cross-training)."),
  ("Andoza, texnologik karta, mijozlar ro'yxati — <b>yozma va zaxira nusxada</b>.", "Patterns, process cards and the client list are <b>written down and backed up</b>."),
  ("Asosiy xomashyo uchun <b>2 ta yetkazib beruvchi</b>.", "<b>2 suppliers</b> for key raw materials."),
  ("Zaxira jamg'arma — kamida 3 oylik doimiy xarajat (12-mavzu).", "A reserve fund of at least 3 months' fixed costs (topic 12)."),
  ("Mol-mulk sug'urtasi, o't o'chirgich, elektr xavfsizligi.", "Property insurance, extinguishers, electrical safety."),
  ("Favqulodda holatda <b>kim nima qiladi</b> — 1 betlik reja.", "<b>Who does what</b> in an emergency — a one-page plan.")], "tick") +
 '<div>' + '<div class="card" style="--c:var(--blue)">' + E("h3", "🧪 «Agar ertaga...» mashqi", "🧪 The “what if tomorrow...” drill") +
 table([("Agar ertaga...", "What if tomorrow..."), ("Biz nima qilamiz?", "What do we do?")], [
  [TD("bichuvchi kasal bo'lib qolsa", "the cutter falls ill"), TD("Katta tikuvchi tayyor andozalar bilan bichadi", "The senior seamstress cuts using the stored patterns")],
  [TD("asosiy yetkazib beruvchi to'xtasa", "the main supplier stops"), TD("Ikkinchi yetkazib beruvchidan, zaxiradan 1 oy", "The second supplier; one month from stock")],
  [TD("elektr 3 kun bo'lmasa", "there is no power for 3 days"), TD("Ijaraga generator, buyurtmachilarni oldindan ogohlantirish", "A rented generator; warn customers in advance")],
  [TD("yirik mijoz to'lamasa", "a big client does not pay"), TD("Zaxira jamg'arma, shartnoma bo'yicha talab", "The reserve fund; a claim under the contract")]]) + '</div>' +
 E("div", "Mashqni yiliga 1–2 marta jamoa bilan o'tkazing: javobi yo'q har bir «agar» — xavflar reestriga yangi qator.",
   "Run the drill with the team once or twice a year: every “what if” with no answer is a new line in the risk register.", 'class="quote" style="margin-top:12px"') + '</div></div>')

# ============================ 16. AMALIY TOPSHIRIQ ============================
slide("Amaliy topshiriq", "Practical task",
 E("span", "Amaliy mashg'ulot · 2 soat", "Practical class · 2 hours", 'class="kicker"') +
 E("h2", "«Jamoa va xavflar <span class=\"grad\">xaritasi»</span>", "The “team and risk <span class=\"grad\">map”</span>") +
 E("p", "Har bir talaba (yoki 2 kishilik guruh) o'z biznesi uchun jamoa tuzilmasi, bitta lavozim tavsifi, bonus formulasi va xavflar reestrini tayyorlaydi.", "Each student (or a pair) prepares a team structure, one job description, a bonus formula and a risk register for their own business.", 'class="lead"') +
 '<div class="grid g2"><div class="card" style="--c:var(--blue)">' + E("h3", "⏱ 120 daqiqalik reja", "⏱ The 120-minute plan") +
 table([("Vaqt", "Time"), ("Nima qilinadi", "What to do")], [
  [TD("0–20", "0–20"), TD("Jamoa tuzilmasi: lavozimlar, vazifalar, kimga hisobot", "Team structure: positions, duties, reporting lines")],
  [TD("20–35", "20–35"), TD("Yangi xodim olish hisobi", "The hiring calculation")],
  [TD("35–55", "35–55"), TD("Bitta lavozim tavsifi va 3 ta STAR savol", "One job description and 3 STAR questions")],
  [TD("55–70", "55–70"), TD("2 ta KPI va bonus formulasi", "2 KPIs and a bonus formula")],
  [TD("70–100", "70–100"), TD("Xavflar reestri: 8 ta xavf, ball, chora, mas'ul, muddat", "Risk register: 8 risks, score, action, owner, deadline")],
  [TD("100–120", "100–120"), TD("«Agar ertaga...» mashqi va himoya", "The “what if tomorrow...” drill and defence")]]) + '</div>' +
 '<div><div class="card" style="--c:var(--green)">' + E("h3", "📋 Ishda bo'lishi shart", "📋 The work must contain") +
 '<ul class="clean">' + E("li", "Tuzilma jadvali (kamida 4 lavozim)", "A structure table (at least 4 positions)") +
 E("li", "Xodim olish hisobi va sharti", "A hiring calculation and its condition") +
 E("li", "Lavozim tavsifi + STAR savollari", "A job description + STAR questions") +
 E("li", "KPI va bonus formulasi (hajm + sifat)", "KPIs and a bonus formula (volume + quality)") +
 E("li", "8 ta xavf: ehtimol, ta'sir, ball, daraja", "8 risks: likelihood, impact, score, level") +
 E("li", "Eng yuqori 3 xavf uchun harakat rejasi", "An action plan for the top 3 risks") + '</ul></div>' +
 '<div class="card" style="--c:var(--amber);margin-top:12px">' + E("h3", "🏅 Baholash", "🏅 Assessment") +
 E("p", "Jamoa va rollar <b>25%</b> · motivatsiya va KPI <b>20%</b> · xavflar tahlili <b>35%</b> · himoya <b>20%</b>.", "Team and roles <b>25%</b> · motivation and KPIs <b>20%</b> · risk analysis <b>35%</b> · defence <b>20%</b>.") + '</div></div></div>')

# ============================ 17. XULOSA ============================
slide("Xulosa, kurs yakuni va resurslar", "Summary, course wrap-up and resources",
 E("span", "Xulosa · Kurs yakuni · Havolalar", "Summary · Course wrap-up · Links", 'class="kicker"') +
 E("h2", "Yakuniy <span class=\"grad\">xulosa</span> va <span class=\"grad\">kurs yo'li</span>", "The final <span class=\"grad\">summary</span> and <span class=\"grad\">the course path</span>") +
 '<div class="grid g2"><div>' +
 card_ul("green", "📌", "Esda qoladigan 6 ta fikr", "6 things to remember", [
  ("Xodim olishdan oldin hisoblang: <b>qo'shimcha hissa > xodim narxi</b> va buyurtma bormi?", "Calculate before hiring: <b>extra contribution > cost of the employee</b> — and are there orders?"),
  ("Har ishning <b>bitta egasi</b>; har lavozimga 1 betlik tavsif.", "Every task has <b>one owner</b>; every position a one-page description."),
  ("Tanlovda <b>STAR</b> savollar va sinov topshirig'i; kamsitishsiz.", "Use <b>STAR</b> questions and a trial task in selection; no discrimination."),
  ("Delegatsiya: natija, muddat, vakolat, resurs, nazorat; fikr — <b>SBI</b>.", "Delegation: result, deadline, authority, resources, checkpoint; feedback — <b>SBI</b>."),
  ("Xavf = <b>ehtimol × ta'sir</b>; reestrda chora, mas'ul va muddat bo'lsin.", "Risk = <b>likelihood × impact</b>; the register needs action, owner and deadline."),
  ("Biznes bitta odam yoki yetkazib beruvchiga <b>bog'liq bo'lmasin</b>.", "The business must <b>not depend</b> on one person or one supplier.")]) +
 '<div class="card" style="--c:var(--amber);margin-top:12px">' + E("h3", "🎓 Kurs yo'li: 15 mavzu — bitta biznes", "🎓 The course path: 15 topics — one business") +
 E("p", "Tafakkur va imkoniyat → g'oya va mijoz → mahsulot va reklama → taqdimot → savdo → narx → pul oqimi → foyda tahlili → biznes-reja va eksport → <b>jamoa va xavflar</b>. Endi o'z g'oyangiz uchun bularning barchasini bitta biznes-rejaga jamlay olasiz.",
   "Mindset and opportunity → idea and customer → product and advertising → pitch → sales → pricing → cash flow → profit analysis → business plan and export → <b>team and risks</b>. Now you can bring all of this together in one business plan for your own idea.") + '</div></div>' +
 '<div><div class="card" style="--c:var(--blue)">' + E("h3", "🔗 Foydali resurslar", "🔗 Useful resources") +
 E("p", "<b>Qonun va rasmiy manbalar:</b>", "<b>Law and official sources:</b>") +
 '<ul class="clean">' +
 E("li", '<a class="lnk" href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> — Mehnat kodeksi, mehnatni muhofaza qilish va sug\'urta qonunlari', '<a class="lnk" href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> — the Labour Code, occupational safety and insurance laws') +
 E("li", '<a class="lnk" href="https://www.ilo.org" target="_blank" rel="noopener">ilo.org</a> — Xalqaro mehnat tashkiloti: mehnat standartlari', '<a class="lnk" href="https://www.ilo.org" target="_blank" rel="noopener">ilo.org</a> — the International Labour Organization: labour standards') +
 E("li", '<a class="lnk" href="https://soliq.uz" target="_blank" rel="noopener">soliq.uz</a> — ish haqi bo\'yicha soliq va to\'lovlar', '<a class="lnk" href="https://soliq.uz" target="_blank" rel="noopener">soliq.uz</a> — payroll taxes and charges') +
 E("li", '<a class="lnk" href="https://www.iso.org/iso-31000-risk-management.html" target="_blank" rel="noopener">iso.org</a> — ISO 31000: xavflarni boshqarish tamoyillari', '<a class="lnk" href="https://www.iso.org/iso-31000-risk-management.html" target="_blank" rel="noopener">iso.org</a> — ISO 31000: risk management principles') + '</ul>' +
 E("p", "<b>Bepul vositalar:</b>", "<b>Free tools:</b>", 'style="margin-top:8px"') +
 E("p", '<a class="lnk" href="https://docs.google.com" target="_blank" rel="noopener">docs.google.com</a> — xavflar reestri va KPI jadvali · <a class="lnk" href="https://trello.com" target="_blank" rel="noopener">trello.com</a> — jamoa vazifalari doskasi',
   '<a class="lnk" href="https://docs.google.com" target="_blank" rel="noopener">docs.google.com</a> — a risk register and KPI sheet · <a class="lnk" href="https://trello.com" target="_blank" rel="noopener">trello.com</a> — a team task board') +
 E("p", "<b>O'qish uchun:</b> Patrick Lencioni — «The Five Dysfunctions of a Team» · Kim Scott — «Radical Candor» · Michael Gerber — «The E-Myth Revisited».", "<b>Further reading:</b> Patrick Lencioni — “The Five Dysfunctions of a Team” · Kim Scott — “Radical Candor” · Michael Gerber — “The E-Myth Revisited”.", 'style="margin-top:8px"') +
 E("small", "⚠️ Mehnat qonunchiligi va soliq talablari o'zgaradi. Har doim amaldagi rasmiy ma'lumotga tayaning.", "⚠️ Labour law and tax requirements change. Always rely on current official information.", 'class="note"') +
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
 E("h3", "🎓 Tabriklaymiz! Kursning barcha 15 mavzusi yakunlandi", "🎓 Congratulations! All 15 topics of the course are complete") +
 E("p", "Endi o'z g'oyangiz uchun <b>to'liq biznes-reja</b> tuzing: barcha mavzulardagi kartochkalaringizni bitta hujjatga jamlang. Omad tilaymiz!",
   "Now write a <b>full business plan</b> for your own idea: bring the cards from all the topics together into one document. Good luck!") +
 E("p", "Termiz davlat universiteti · Tadbirkorlik asoslari", "Termez State University · Fundamentals of Entrepreneurship", 'style="color:var(--muted);font-size:13.5px"') + '</div>')

# ============================ TEST SAVOLLARI ============================
Q = [
 # 1 — xodim olish hisobi (to'g'ri: B)
 dict(q="Yangi xodimning oylik narxi 4 000 000 so'm, u keltiradigan qo'shimcha hissa 6 000 000 so'm (buyurtma yetarli). Natija qanday?",
      a=["−2 000 000 so'm zarar", "+2 000 000 so'm foyda", "+6 000 000 so'm foyda", "+10 000 000 so'm foyda"], c=1,
      e="Qo'shimcha foyda = qo'shimcha hissa − xodim narxi = 6 000 000 − 4 000 000 = +2 000 000 so'm. Shart — buyurtmalar yetarli bo'lishi.",
      qe="A new employee costs 4,000,000 so'm a month and brings 6,000,000 so'm of extra contribution (with enough orders). What is the result?",
      ae=["−2,000,000 so'm loss", "+2,000,000 so'm profit", "+6,000,000 so'm profit", "+10,000,000 so'm profit"],
      ee="Extra profit = extra contribution − cost of the employee = 6,000,000 − 4,000,000 = +2,000,000 so'm. The condition is having enough orders."),
 # 2 — lavozim tavsifi (to'g'ri: D)
 dict(q="Lavozim tavsifining asosiy vazifasi nima?",
      a=["Xodimning ish haqini boshqa xodimlardan yashirin saqlash",
         "Xodimni ishdan bo'shatish uchun oldindan sabab tayyorlash",
         "Soliq idorasiga har oy topshiriladigan hisobot shakli",
         "Vazifa, kutilgan natija, talab va javobgarlikni belgilash"], c=3,
      e="Lavozim tavsifi xodimning vazifalari, kutilgan natijasi, malaka talablari va kimga bo'ysunishini aniq yozadi. U tanlov, baholash va nizolarda asos bo'ladi.",
      qe="What is the main purpose of a job description?",
      ae=["To keep the employee's pay secret from the other staff",
         "To prepare grounds in advance for dismissing the employee",
         "A reporting form submitted to the tax office every month",
         "To set out duties, expected results, skills and reporting"],
      ee="A job description sets out the employee's duties, expected results, skill requirements and reporting line. It is the basis for selection, appraisal and disputes."),
 # 3 — STAR (to'g'ri: A)
 dict(q="Quyidagilardan qaysi biri STAR uslubidagi suhbat savoliga misol bo'ladi?",
      a=["Shoshilinch buyurtma bo'lgan holatni aytib bering: siz nima qildingiz?",
         "Agar sizni ishga olsak, kelajakda qanday xodim bo'lishni rejalaysiz?",
         "O'zingizni bir so'z bilan ta'riflang: siz qanday odamsiz, ayting-chi?",
         "Bizning ustaxonamiz sizga yoqdimi va bu yerda ishlashni xohlaysizmi?"], c=0,
      e="STAR savoli o'tmishdagi aniq vaziyat va nomzodning haqiqiy harakatini so'raydi (vaziyat, vazifa, harakat, natija). «Nima qilardingiz?» emas, «nima qildingiz?».",
      qe="Which of the following is an example of a STAR-style interview question?",
      ae=["Describe a rush order you handled: what exactly did you do?",
         "If we hire you, what kind of employee do you plan to become?",
         "Describe yourself in one word: what kind of person are you?",
         "Do you like our workshop, and would you like to work here?"],
      ee="A STAR question asks about a real past situation and what the candidate actually did (situation, task, action, result). Not “what would you do?” but “what did you do?”."),
 # 4 — noo'rin savol (to'g'ri: C)
 dict(q="Ishga qabul suhbatida qaysi savol noo'rin va kamsituvchi hisoblanadi?",
      a=["Oldingi ishingizda qanday tikuv mashinalarida ishlagansiz?",
         "Kuniga o'rtacha nechta formani sifatli tika olasiz, ayting?",
         "Turmush qurish yoki farzand ko'rish rejangiz bormi, ayting?",
         "Smenali ish va mavsumiy qo'shimcha ishlarga tayyormisiz?"], c=2,
      e="Oilaviy reja, din, millat va ishga aloqasi yo'q shaxsiy hayot haqidagi savollar kamsituvchi. Tanlov faqat malaka va ishga yaroqlilik bo'yicha bo'lishi kerak.",
      qe="Which interview question is inappropriate and discriminatory?",
      ae=["What sewing machines did you work on in your previous job?",
         "How many uniforms can you sew well, on average, per day?",
         "Do you plan to marry or have children in the next years?",
         "Are you ready for shift work and extra work in the season?"],
      ee="Questions about family plans, religion, ethnicity and private life unrelated to the job are discriminatory. Selection must be based only on skills and fitness for the job."),
 # 5 — sinov muddati (to'g'ri: B)
 dict(q="Sinov muddatining asosiy maqsadi nima?",
      a=["Xodimga birinchi oylarda ish haqi umuman to'lamaslik",
         "Ikki tomon ham bir-biriga mosligini amalda tekshirish",
         "Xodimni hech qanday shartnomasiz ishlatib turish uchun",
         "Xodimni har kuni boshqa lavozimga o'tkazib sinab ko'rish"], c=1,
      e="Sinov muddatida ish beruvchi ham, xodim ham bir-biriga mosligini amalda tekshiradi. Uning muddati va shartlari qonun bilan belgilanadi, ish haqi to'lanadi va shartnoma tuziladi.",
      qe="What is the main purpose of a probation period?",
      ae=["Not paying the employee any wages in the first months",
          "For both sides to check in practice whether they fit",
          "To let the employee work with no contract of any kind",
          "To test the employee in a different role every day"],
      ee="During probation both the employer and the employee check in practice whether they fit. Its length and terms are set by law; wages are paid and a contract is signed."),
 # 6 — delegatsiya (to'g'ri: D)
 dict(q="Vazifani to'g'ri delegatsiya qilish uchun rahbar nimani aniq aytishi kerak?",
      a=["Faqat ishning qaysi tartibda bajarilishini, natijasiz",
         "Vazifani butun jamoaga beradi, kim bajarishini aytmaydi",
         "Hech narsani aytmaydi — xodim o'zi tushunib olishi kerak",
         "Natija, muddat, vakolat, resurs va nazorat nuqtasini"], c=3,
      e="To'g'ri delegatsiyada 5 element bor: kutilgan natija, muddat, xodimning vakolati, resurslar va qachon tekshirilishi (nazorat nuqtasi).",
      qe="To delegate a task properly, what must the manager state clearly?",
      ae=["Only the order in which the work is done, not the result",
         "Gives the task to the whole team without naming anyone",
         "Nothing at all — the employee should work it out alone",
         "The result, deadline, authority, resources and checkpoint"],
      ee="Proper delegation has 5 elements: the expected result, the deadline, the employee's authority, resources and when it will be reviewed (a checkpoint)."),
 # 7 — bonus (to'g'ri: C)
 dict(q="Jamoa rejasi 1 000 dona, fakt 1 120 dona, brak 1,5% (shart ≤ 2%). Rejadan ortiq har dona uchun 5 000 so'm. Bonus fondi qancha?",
      a=["60 000 so'm",
         "100 000 so'm",
         "600 000 so'm",
         "5 600 000 so'm"], c=2,
      e="Sifat sharti bajarilgan (1,5% ≤ 2%). Ortiqcha: 1 120 − 1 000 = 120 dona. Bonus fondi = 120 × 5 000 = 600 000 so'm.",
      qe="The team plan is 1,000 units, actual output 1,120, defects 1.5% (condition ≤ 2%). Each unit over the plan earns 5,000 so'm. How big is the bonus pool?",
      ae=["60,000 so'm",
         "100,000 so'm",
         "600,000 so'm",
         "5,600,000 so'm"],
      ee="The quality condition is met (1.5% ≤ 2%). Extra units: 1,120 − 1,000 = 120. Bonus pool = 120 × 5,000 = 600,000 so'm."),
 # 8 — SMART (to'g'ri: A)
 dict(q="Quyidagi maqsadlardan qaysi biri SMART talablariga javob beradi?",
      a=["31-oktyabrgacha brak ulushini 4% dan 2% ga tushirish",
         "Bundan buyon ishni ancha sifatliroq va tezroq qilish",
         "Mijozlar bizni yanada ko'proq yaxshi ko'radigan qilish",
         "Imkon qadar ko'p forma tikish va xatolarni kamaytirish"], c=0,
      e="SMART maqsad aniq, o'lchanadigan, erishiladigan, muhim va muddatli: «brak 4% dan 2% ga, 31-oktyabrgacha». Qolganlarida raqam ham, muddat ham yo'q.",
      qe="Which of the following goals meets the SMART criteria?",
      ae=["Cut the defect rate from 4% to 2% by 31 October",
          "From now on do the work much better and faster",
          "Make customers like us even more than they do now",
          "Sew as many uniforms as possible with fewer errors"],
      ee="A SMART goal is specific, measurable, achievable, relevant and time-bound: “defects from 4% to 2% by 31 October”. The others have neither a number nor a deadline."),
 # 9 — SBI (to'g'ri: B)
 dict(q="SBI usulida fikr bildirish qaysi tartibda quriladi?",
      a=["Maqtov → tanqid → yana maqtov (sendvich)",
         "Vaziyat → xatti-harakat → ta'siri (oqibati)",
         "Ogohlantirish → jarima → ishdan bo'shatish",
         "Xodimning shaxsiyati → xarakteri → odatlari"], c=1,
      e="SBI: Situation (vaziyat) — Behaviour (aniq xatti-harakat) — Impact (uning ta'siri). U shaxsni emas, aniq harakat va oqibatni muhokama qiladi.",
      qe="In what order is SBI feedback built?",
      ae=["Praise → criticism → praise again (sandwich)",
         "Situation → behaviour → its impact (effect)",
         "A warning → a fine → dismissal from the job",
         "The person's personality → character → habits"],
      ee="SBI: Situation — Behaviour (the specific action) — Impact (its effect). It discusses a concrete action and its consequence, not the person."),
 # 10 — xavf bali (to'g'ri: C)
 dict(q="Xavfning ehtimoli 4, ta'siri 3 ball. Shkala: 15–25 yuqori, 8–14 o'rta, 1–7 past. Xavf bali va darajasi qanday?",
      a=["7 — past", "7 — o'rta", "12 — o'rta", "12 — yuqori"], c=2,
      e="Xavf bali = ehtimol × ta'sir = 4 × 3 = 12. Bu 8–14 oralig'ida — o'rta daraja.",
      qe="A risk has likelihood 4 and impact 3. Scale: 15–25 high, 8–14 medium, 1–7 low. What are the score and level?",
      ae=["7 — low", "7 — medium", "12 — medium", "12 — high"],
      ee="Risk score = likelihood × impact = 4 × 3 = 12. This is in the 8–14 band — medium."),
 # 11 — ustuvor xavf (to'g'ri: D)
 dict(q="A: ehtimol 2, ta'sir 5; B: ehtimol 5, ta'sir 2; C: ehtimol 3, ta'sir 3; D: ehtimol 4, ta'sir 4. Qaysi xavf birinchi navbatda boshqarilishi kerak?",
      a=["A xavf", "B xavf", "C xavf", "D xavf"], c=3,
      e="Ballar: A = 10, B = 10, C = 9, D = 16. D eng yuqori balga ega (yuqori daraja) — u birinchi navbatda boshqariladi.",
      qe="A: likelihood 2, impact 5; B: likelihood 5, impact 2; C: likelihood 3, impact 3; D: likelihood 4, impact 4. Which risk should be managed first?",
      ae=["Risk A", "Risk B", "Risk C", "Risk D"],
      ee="Scores: A = 10, B = 10, C = 9, D = 16. D has the highest score (high level) — it is managed first."),
 # 12 — sug'urta (to'g'ri: A)
 dict(q="Ustaxona mol-mulkini yong'indan sug'urta qilish xavfni boshqarishning qaysi usuliga kiradi?",
      a=["Xavfni o'tkazish",
         "Xavfdan qochish",
         "Xavfni qabul qilish",
         "Xavfni kuzatish"], c=0,
      e="Sug'urta xavf oqibatining moliyaviy qismini sug'urta kompaniyasiga o'tkazadi — bu «o'tkazish» usuli. Shu bilan birga ehtimolni kamaytirish uchun o't o'chirgich ham kerak.",
      qe="Insuring workshop property against fire is which way of managing risk?",
      ae=["Transferring risk",
         "Avoiding the risk",
         "Accepting the risk",
         "Monitoring the risk"],
      ee="Insurance transfers the financial consequences of a risk to an insurance company — the “transfer” method. Extinguishers are still needed to reduce the likelihood."),
 # 13 — bir odamga bog'liqlik (to'g'ri: B)
 dict(q="Ustaxonada andozalarni faqat bitta bichuvchi biladi. Bu xavfni kamaytirishning eng to'g'ri yo'li qaysi?",
      a=["Bichuvchining maoshini kamaytirib, qattiqroq nazorat qilish",
         "Yana bir xodimni o'rgatib, andozalarni yozma hujjatlashtirish",
         "Bichuvchiga ta'til bermay, uni doimo ish joyida ushlab turish",
         "Xavfni e'tiborsiz qoldirish, chunki u hali ketishni aytmagan"], c=1,
      e="«Bir odamga bog'liqlik» xavfi o'zaro o'rgatish (cross-training) va bilimni hujjatlashtirish bilan kamaytiriladi. Bosim va ta'tilsiz ishlatish xodimning ketishini tezlashtiradi.",
      qe="Only one cutter in the workshop knows the patterns. What is the best way to reduce this risk?",
      ae=["Cut the cutter's pay and supervise them much more strictly",
         "Train another employee and document the patterns in writing",
         "Give the cutter no leave and keep them at work at all times",
         "Ignore the risk: the cutter has not said they will quit yet"],
      ee="The “single-person dependency” risk is reduced by cross-training and documenting knowledge. Pressure and no leave only make the employee leave sooner."),
 # 14 — tikuvchi KPI (to'g'ri: C)
 dict(q="Tikuvchi uchun qaysi KPI juftligi eng to'g'ri tanlangan?",
      a=["Ish joyiga kelish vaqti va tushlikda o'tgan daqiqalari",
         "Ijtimoiy tarmoqdagi obunachilari va yoqtirishlar soni",
         "Kunlik tikilgan dona soni va brak (nuqsonli) ulushi",
         "Rahbar bilan suhbat soni va yig'ilishlarga qatnashishi"], c=2,
      e="KPI xodim ta'sir qila oladigan va natijani ko'rsatadigan narsani o'lchashi kerak: tikuvchi uchun bu — ishlab chiqarish hajmi va sifat (brak ulushi).",
      qe="Which pair of KPIs is best chosen for a seamstress?",
      ae=["Time of arrival at work and minutes spent at lunch",
          "Followers and likes on their social media accounts",
          "Units sewn per day and the share of defective items",
          "Number of talks with the manager and meetings attended"],
      ee="A KPI should measure something the employee can influence that shows the result: for a seamstress this is output volume and quality (defect rate)."),
 # 15 — nizo (to'g'ri: A)
 dict(q="Ikki xodim o'rtasida nizo chiqdi. Rahbarning birinchi qadami qanday bo'lishi kerak?",
      a=["Har ikki tomonni alohida, gapini bo'lmay tinglash",
         "Ikkalasini ham hamma oldida qattiq tanqid qilish",
         "Nizoni e'tiborsiz qoldirib, o'zi tinchishini kutish",
         "Ko'proq ishlagan xodimni darhol haqli deb topish"], c=0,
      e="Avval har ikki tomonni alohida tinglab, fakt va fikrni ajratish kerak. Keyin birgalikdagi uchrashuvda umumiy maqsad asosida kelishuv tuziladi va natija tekshiriladi.",
      qe="A conflict arose between two employees. What should the manager's first step be?",
      ae=["Hear both sides separately without interrupting",
         "Harshly criticise both of them in front of everyone",
         "Ignore the conflict and wait for it to calm down",
         "Immediately side with the one who has worked longer"],
      ee="First hear both sides separately and separate facts from opinions. Then, at a joint meeting, an agreement is reached around a shared goal and the result is checked."),
]
