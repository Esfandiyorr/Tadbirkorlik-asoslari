# -*- coding: utf-8 -*-
"""M9 · Biznes g'oyani taqdim etish va tadbirkorlik yo'lini boshlash — slaydlar va test (yangi_mavzu.py uchun).
T, d, slide — yangi_mavzu.py beradi.  Ishlatish:
  python3 _reyting-manba/yangi_mavzu.py _reyting-manba/matn/mavzu_9_matn.py mavzu-9.html "Biznes g'oyani taqdim etish va tadbirkorlik yo'lini boshlash" 9
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
 E("span", "M9-mavzu · Amaliy mashg'ulot · 2 soat", "Topic 9 · Practical class · 2 hours", 'class="kicker"') +
 E("h1", "BIZNES G'OYANI TAQDIM ETISH VA TADBIRKORLIK YO'LINI BOSHLASH", "PRESENTING A BUSINESS IDEA AND STARTING THE ENTREPRENEURIAL PATH", 'class="grad"') +
 E("p", "G'oya yetarli emas · <b>muammo va mijozni tekshirish</b> · 60 soniyalik va 3 daqiqalik taqdimot · bozor va foyda hisobi · birinchi qadamlar: rasmiylashtirish va moliyalashtirish.",
   "An idea is not enough · <b>checking the problem and the customer</b> · a 60-second and a 3-minute pitch · market and profit calculation · the first steps: registration and funding.", 'class="lead"') +
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
 E("div", "Maqsad: talaba o'z biznes g'oyasini <b>tekshirishni, aniq va qisqa taqdim etishni</b> hamda uni hayotga tatbiq qilish uchun <b>birinchi qadamlarni</b> (rasmiylashtirish, hisob-kitob, moliyalashtirish) rejalashtirishni o'rganadi.",
   "Aim: the student learns <b>to test, to present clearly and briefly</b> their own business idea and to plan <b>the first steps</b> (registration, calculations, funding) for putting it into practice.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("green", "🔎", "G'oyani tekshiradi", "Tests the idea", "Muammo haqiqiymi, mijoz pul to'lashga tayyormi — suhbat va sinov bilan aniqlaydi.", "Finds out whether the problem is real and the customer is ready to pay — through interviews and tests.") +
 card("blue", "🎤", "Taqdim etadi", "Presents", "60 soniyalik va 3 daqiqalik taqdimotni aniq tuzilma bilan o'tkazadi.", "Delivers a 60-second and a 3-minute pitch with a clear structure.") +
 card("violet", "🌍", "Bozorni baholaydi", "Sizes the market", "«Hamma» emas, o'zi qamrab oladigan mijozlar soni asosida real hisob qiladi.", "Calculates realistically from the customers they can actually reach, not from “everyone”.") +
 card("orange", "🧮", "Foydani hisoblaydi", "Calculates profit", "Birlik foydasi, zararsiz nuqta va qoplanish muddatini hisoblab chiqadi.", "Works out profit per unit, the break-even point and the payback time.") +
 card("pink", "🏛", "Yo'lni tanlaydi", "Chooses the route", "Huquqiy shaklni va moliyalashtirish manbasini asoslab tanlaydi.", "Chooses a legal form and a source of funding and explains the choice.") +
 card("cyan", "🛠", "Boshlaydi", "Gets started", "Katta mablag'siz, kichik sinov (MVP) bilan birinchi sotuvni rejalashtiradi.", "Plans a first sale with a small test (MVP), without big money.") +
 '</div>')

# ============================ 3. REJA ============================
slide("Reja va tushunchalar", "Plan and concepts",
 E("span", "Mashg'ulot rejasi", "Class plan", 'class="kicker"') +
 E("h2", "Bugungi <span class=\"grad\">4 ta blok</span>", "Today's <span class=\"grad\">4 blocks</span>") +
 '<div class="grid g4">' +
 card("green", "1️⃣", "G'oyani tekshirish", "Testing the idea", "Muammo, mijoz va yechim: g'oya haqiqatan kerakmi?", "Problem, customer and solution: is the idea really needed?") +
 card("blue", "2️⃣", "Taqdimot", "The pitch", "Tuzilma, 60 soniyalik pitch, savol-javobga tayyorgarlik.", "Structure, the 60-second pitch, preparing for questions.") +
 card("violet", "3️⃣", "Raqamlar", "The numbers", "Bozor hajmi, birlik foydasi, zararsiz nuqta, raqobat.", "Market size, profit per unit, break-even point, competition.") +
 card("orange", "4️⃣", "Boshlash yo'li", "The way to start", "MVP, yo'l xaritasi, huquqiy shakl va moliyalashtirish.", "MVP, a roadmap, legal form and funding.") +
 '</div>' + E("h3", "🔑 Tayanch tushunchalar", "🔑 Key concepts", 'style="margin-top:22px"') +
 E("div",
   '<span class="pill g">pitch</span><span class="pill g">lift pitch (60 soniya)</span><span class="pill">muammo va yechim</span><span class="pill">maqsadli mijoz</span>'
   '<span class="pill g">UVP / USP</span><span class="pill g">MVP</span><span class="pill">gipoteza</span><span class="pill">mijoz suhbati</span>'
   '<span class="pill g">bozor hajmi</span><span class="pill g">birlik iqtisodiyoti</span><span class="pill g">zararsiz nuqta</span><span class="pill">qoplanish muddati</span>'
   '<span class="pill">biznes model</span><span class="pill">raqobat ustunligi</span><span class="pill">traction (isbot)</span><span class="pill">pivot</span>'
   '<span class="pill">YaTT va MChJ</span><span class="pill g">moliyalashtirish</span>',
   '<span class="pill g">pitch</span><span class="pill g">elevator pitch (60 seconds)</span><span class="pill">problem and solution</span><span class="pill">target customer</span>'
   '<span class="pill g">UVP / USP</span><span class="pill g">MVP</span><span class="pill">hypothesis</span><span class="pill">customer interview</span>'
   '<span class="pill g">market size</span><span class="pill g">unit economics</span><span class="pill g">break-even point</span><span class="pill">payback time</span>'
   '<span class="pill">business model</span><span class="pill">competitive edge</span><span class="pill">traction (proof)</span><span class="pill">pivot</span>'
   '<span class="pill">sole proprietor and LLC</span><span class="pill g">funding</span>'))

# ============================ 4. AUDITORIYA ============================
slide("Kimga taqdim etamiz?", "Who are we presenting to?",
 E("span", "1-blok · G'oya va tinglovchi", "Block 1 · The idea and the listener", 'class="kicker"') +
 E("h2", "Tinglovchi <span class=\"grad\">nimani bilmoqchi?</span>", "What does the listener <span class=\"grad\">want to know?</span>") +
 E("div", "Bitta g'oya hamma uchun bir xil aytilmaydi. Avval <b>kimga</b> gapirayotganingizni aniqlang — keyin ular uchun muhim savolga javob bering.",
   "One idea is never told the same way to everyone. First decide <b>who</b> you are talking to — then answer the question that matters to them.", 'class="def"') +
 table([("Tinglovchi", "Listener"), ("Eng muhim savoli", "Their key question"), ("Nimani ko'rsating", "What to show")], [
  [TD("<b>🧑‍🤝‍🧑 Mijoz</b>", "<b>🧑‍🤝‍🧑 The customer</b>"), TD("Bu menga nima beradi va qancha turadi?", "What does this give me and how much does it cost?"), TD("Foyda, narx, namuna, sharhlar", "Benefit, price, a sample, reviews", "g")],
  [TD("<b>🏦 Bank</b>", "<b>🏦 A bank</b>"), TD("Kreditni qaytara olasizmi?", "Can you repay the loan?"), TD("Oylik pul tushumi, to'lov manbai, kafolat", "Monthly cash inflow, source of repayment, collateral", "g")],
  [TD("<b>💼 Investor</b>", "<b>💼 An investor</b>"), TD("Sarmoya necha marta qaytadi va qachon?", "How many times will my money come back and when?"), TD("Bozor, o'sish, jamoa, birinchi natijalar", "Market, growth, team, first results", "g")],
  [TD("<b>🎁 Grant komissiyasi</b>", "<b>🎁 A grant committee</b>"), TD("Bu loyiha jamiyatga nima beradi?", "What does this project give to society?"), TD("Ijtimoiy foyda, ish o'rinlari, aniq byudjet", "Social benefit, jobs, a clear budget", "g")],
  [TD("<b>🤝 Hamkor yoki xodim</b>", "<b>🤝 A partner or an employee</b>"), TD("Men bu yerda nima qilaman va nima olaman?", "What will I do here and what do I get?"), TD("Rol, ulush yoki maosh, rivojlanish yo'li", "Role, share or salary, a development path", "g")]]) +
 E("div", "📌 <b>Qoida:</b> taqdimot — bu o'zingiz haqingizda gapirish emas, <b>tinglovchining savoliga javob berish</b>. Savolni oldindan bilsangiz, javob 2 baravar kuchli bo'ladi.",
   "📌 <b>Rule:</b> a pitch is not about talking about yourself, it is <b>answering the listener's question</b>. If you know the question in advance, your answer becomes twice as strong.", 'class="quote" style="margin-top:12px"'))

# ============================ 5. G'OYANI TEKSHIRISH ============================
slide("G'oyani tekshirish", "Testing the idea",
 E("span", "1.2 · Tekshiruv", "1.2 · Validation", 'class="kicker"') +
 E("h2", "Yaxshi g'oya emas, <span class=\"grad\">isbotlangan muammo</span>", "Not a good idea, but <span class=\"grad\">a proven problem</span>") +
 E("div", "Ko'p g'oya «menga yoqadi» deb boshlanadi va «hech kim kerak demadi» deb tugaydi. G'oyani <b>sarmoya kiritishdan oldin</b> kichik tekshiruvdan o'tkazing.",
   "Many ideas start with “I like it” and end with “nobody wanted it”. Run the idea through a small test <b>before you invest</b>.", 'class="def"') +
 '<div class="grid g2" style="margin-top:14px">' +
 card_ul("green", "✅", "G'oyaning 5 savoli", "The 5 questions for an idea", [
  ("<b>Muammo:</b> kimda, qanchalik tez-tez uchraydi?", "<b>Problem:</b> who has it and how often?"),
  ("<b>Mijoz:</b> aniq kim? (yoshi, joyi, daromadi)", "<b>Customer:</b> exactly who? (age, place, income)"),
  ("<b>Yechim:</b> mahsulotim muammoni qanday hal qiladi?", "<b>Solution:</b> how does my product solve the problem?"),
  ("<b>Pul:</b> mijoz qancha to'laydi va men qancha topaman?", "<b>Money:</b> how much will the customer pay and how much will I earn?"),
  ("<b>Men:</b> nega aynan men buni qila olaman?", "<b>Me:</b> why am I the one who can do this?")], "tick") +
 '<div class="card" style="--c:var(--blue)"><span class="icon">🗣</span>' + E("h3", "Mijoz suhbati: nimani so'rash kerak?", "A customer interview: what to ask?") +
 table([("❌ Yomon savol", "❌ A weak question"), ("✅ Yaxshi savol", "✅ A strong question")], [
  [TD("«Bunday mahsulot sizga yoqarmidi?»", "“Would you like a product like this?”", "r"), TD("«Oxirgi marta bu muammoga qachon duch keldingiz?»", "“When did you last run into this problem?”", "g")],
  [TD("«Sotib olarmidingiz?»", "“Would you buy it?”", "r"), TD("«Hozir nima qilib hal qilyapsiz va qancha to'laysiz?»", "“What do you do about it now and how much do you pay?”", "g")],
  [TD("«G'oyam zo'rmi?»", "“Is my idea great?”", "r"), TD("«Eng qiyin joyi nima edi?»", "“What was the hardest part?”", "g")]]) +
 E("p", "Maqtov — dalil emas. <b>Ilgari nima qilgani</b> haqidagi javob haqiqatni ko'rsatadi.", "Praise is not evidence. What people <b>actually did before</b> shows the truth.", 'style="margin-top:8px"') + '</div></div>' +
 E("div", "🎯 <b>Vazifa:</b> kamida <b>10 ta</b> maqsadli odam bilan 10 daqiqadan suhbatlashing. Agar 10 tadan 3–4 tasi «hozir ham shu muammo bilan kurashyapman va yechim izlayman» desa — g'oya jiddiy o'rganishga loyiq.",
   "🎯 <b>Task:</b> talk to at least <b>10</b> target people for 10 minutes each. If 3–4 of 10 say “I struggle with this right now and I am looking for a solution” — the idea deserves serious work.", 'class="quote" style="margin-top:12px"'))

# ============================ 6. TAQDIMOT TUZILMASI ============================
slide("Taqdimot tuzilmasi", "Pitch structure",
 E("span", "2-blok · Taqdimot", "Block 2 · The pitch", 'class="kicker"') +
 E("h2", "Taqdimotning <span class=\"grad\">10 ta slaydi</span>", "The <span class=\"grad\">10 slides</span> of a pitch") +
 E("div", "Tuzilma sodda: <b>avval muammo, keyin yechim, so'ng raqamlar</b>. Har slaydda bitta fikr, 3 daqiqada — 10 slaydgacha.",
   "The structure is simple: <b>first the problem, then the solution, then the numbers</b>. One idea per slide, up to 10 slides in 3 minutes.", 'class="def"') +
 table([("№", "No."), ("Slayd", "Slide"), ("Nimani aytasiz", "What you say")], [
  [TD("1", "1"), TD("<b>Muammo</b>", "<b>Problem</b>"), TD("Kim qanday qiyinchilikka duch kelayapti — bitta real misol bilan", "Who faces which difficulty — with one real example")],
  [TD("2", "2"), TD("<b>Yechim</b>", "<b>Solution</b>"), TD("Mahsulot muammoni qanday hal qiladi va nima bilan farq qiladi", "How the product solves it and what makes it different")],
  [TD("3", "3"), TD("<b>Mijoz va bozor</b>", "<b>Customer and market</b>"), TD("Aniq mijoz kim va ulardan nechtasiga yeta olasiz", "Who exactly the customer is and how many of them you can reach")],
  [TD("4", "4"), TD("<b>Biznes model</b>", "<b>Business model</b>"), TD("Kim, nima uchun, qancha to'laydi", "Who pays, for what and how much")],
  [TD("5", "5"), TD("<b>Raqobat</b>", "<b>Competition</b>"), TD("Hozir mijoz kimdan oladi va sizning ustunligingiz nima", "Who the customer buys from now and what your edge is")],
  [TD("6", "6"), TD("<b>Birinchi natijalar</b>", "<b>First results</b>"), TD("Sinov, suhbat, oldindan buyurtma, birinchi sotuv", "A test, interviews, pre-orders, a first sale", "g")],
  [TD("7", "7"), TD("<b>Marketing</b>", "<b>Marketing</b>"), TD("Mijozga qanday yetib borasiz (2 kanal, byudjet)", "How you reach the customer (2 channels, budget)")],
  [TD("8", "8"), TD("<b>Jamoa</b>", "<b>Team</b>"), TD("Kim nima qiladi va nega siz uddalay olasiz", "Who does what and why you can pull it off")],
  [TD("9", "9"), TD("<b>Moliya</b>", "<b>Finance</b>"), TD("Birlik foydasi, zararsiz nuqta, qoplanish muddati", "Profit per unit, break-even point, payback time")],
  [TD("10", "10"), TD("<b>So'rov</b>", "<b>The ask</b>"), TD("Sizga nima kerak: pul, hamkor, maslahat — va u nimaga sarflanadi", "What you need: money, a partner, advice — and what it will be spent on", "g")]]) +
 E("small", "Slaydda matn kam bo'lsin: sarlavha, 1–2 raqam yoki rasm. Hamma narsani slaydga emas, <b>ovozingiz bilan</b> ayting.",
   "Keep slide text short: a headline, 1–2 numbers or a picture. Say everything else <b>with your voice</b>, not on the slide.", 'class="note"'))

# ============================ 7. 60 SONIYALIK PITCH ============================
slide("60 soniyalik pitch", "The 60-second pitch",
 E("span", "2.2 · Lift pitch", "2.2 · Elevator pitch", 'class="kicker"') +
 E("h2", "60 soniyada <span class=\"grad\">g'oyani aytib bering</span>", "Explain the idea <span class=\"grad\">in 60 seconds</span>") +
 E("div", "Maqsad — hammasini sotish emas, tinglovchida <b>«yana ayting-chi!»</b> degan qiziqish uyg'otish. Bunga 5 ta jumla yetadi.",
   "The aim is not to sell everything but to make the listener say <b>“tell me more!”</b>. Five sentences are enough.", 'class="def"') +
 '<div class="grid g5" style="margin-top:14px">' +
 card("red", "1", "Kim va muammo", "Who and the problem", "«[Mijoz] uchun [muammo] — katta qiyinchilik.»", "“For [customer], [problem] is a big difficulty.”") +
 card("orange", "2", "Yechim", "The solution", "«Biz [mahsulot] taklif qilamiz.»", "“We offer [product].”") +
 card("green", "3", "Farq", "The difference", "«Boshqalardan farqimiz: [bitta ustunlik].»", "“Unlike others, we [one edge].”") +
 card("blue", "4", "Isbot", "Proof", "«Hozirgacha [aniq natija] erishdik.»", "“So far we have achieved [a concrete result].”") +
 card("violet", "5", "So'rov", "The ask", "«Sizdan [aniq narsa] kerak.»", "“We need [one specific thing] from you.”") +
 '</div><div class="grid g2" style="margin-top:14px">' +
 '<div class="card" style="--c:var(--red)">' + E("h3", "❌ Zaif variant", "❌ A weak version") +
 E("p", "«Men tabiiy mahsulot sotmoqchiman. Bozor katta, raqobatchi yo'q, hamma sotib oladi. Sifatli va arzon bo'ladi.»", "“I want to sell natural products. The market is big, there are no competitors, everyone will buy. It will be high quality and cheap.”", 'style="font-style:italic"') +
 '<ul class="tick cross">' + E("li", "Muammo va mijoz aytilmagan", "The problem and the customer are not named") +
 E("li", "«Raqobatchi yo'q» — ishonchsizlik belgisi", "“No competitors” is a sign of weak research") +
 E("li", "Isbot va so'rov yo'q", "No proof and no ask") + '</ul></div>' +
 '<div class="card" style="--c:var(--green)">' + E("h3", "✅ Kuchli variant (shartli «TerMeva»)", "✅ A strong version (sample “TerMeva”)") +
 E("p", "«Termizlik oilalar mevani mavsumda arzon olib, qishda isrof qiladi yoki qimmat narxda sotib oladi. <b>TerMeva</b> mahalliy mevani quritib, 250 gramm qadoqda uyga yetkazadi. Boshqalardan farqimiz: faqat mahalliy meva, qand qo'shilmaydi. Sinov sifatida 40 ta oilaga sotdik, 22 tasi qayta buyurtma berdi. Bizga 20 mln so'm kerak — quritish uskunasi va birinchi xomashyo uchun.»",
   "“Families in Termez buy fruit cheaply in season, then waste it or pay a lot for it in winter. <b>TerMeva</b> dries local fruit and delivers it in 250-gram packs. Our difference: only local fruit and no added sugar. As a test we sold to 40 families and 22 ordered again. We need 20 million so'm — for a drying machine and the first raw material.”", 'style="font-style:italic"') +
 '<ul class="tick">' + E("li", "Muammo va mijoz birinchi jumlada", "The problem and customer in the first sentence") +
 E("li", "Raqam: 40 ta oiladan 22 tasi qaytdi", "A number: 22 of 40 families came back") +
 E("li", "So'rov aniq: 20 mln — nimaga ekani ayon", "The ask is clear: 20 million — and what for") + '</ul></div></div>' +
 E("small", "«TerMeva» — o'quv uchun to'qib chiqarilgan shartli misol; undagi raqamlar haqiqiy emas.", "“TerMeva” is a made-up teaching example; its numbers are not real.", 'class="note"'))

# ============================ 8. BOZOR HAJMI ============================
slide("Bozor hajmi", "Market size",
 E("span", "3-blok · Raqamlar", "Block 3 · The numbers", 'class="kicker"') +
 E("h2", "Bozor: <span class=\"grad\">«hamma» emas, o'zim yetadigan mijozlar</span>", "The market: <span class=\"grad\">not “everyone” but customers I can reach</span>") +
 E("div", "Eng katta xato — «aholi 36 million, 1% sotib olsa ham...» deb hisoblash. Haqiqiy hisob <b>pastdan yuqoriga</b>: men o'zim nechta kishiga yeta olaman va ulardan nechtasi sotib oladi?",
   "The biggest mistake is calculating “the population is 36 million, so even 1% would...”. A real estimate goes <b>from the bottom up</b>: how many people can I reach myself and how many of them will buy?", 'class="def"') +
 '<div class="grid g4" style="margin-top:14px">' +
 stat("2 000", "kishiga yeta olaman (kanal + tanishlar)", "people I can reach (channels + contacts)") +
 stat("5%", "xarid qiladi (suhbat va sinovdan)", "will buy (from interviews and tests)", "o") +
 stat("100", "mijoz oyiga", "customers a month", "v") +
 stat("4 000 000", "so'm oylik tushum (100 × 40 000)", "so'm monthly revenue (100 × 40,000)") +
 '</div><div class="grid g2" style="margin-top:14px">' +
 card("orange", "🧠", "Hisob nimani ko'rsatdi?", "What the calculation showed", "Oyiga 100 qadoq sotsak, tushum 4 000 000 so'm. Keyingi slaydda ko'ramiz: zararsiz bo'lish uchun <b>250 qadoq</b> kerak. Demak, faqat onlayn savdo yetmaydi.",
      "Selling 100 packs a month brings 4,000,000 so'm. The next slides show that <b>250 packs</b> are needed to break even. So online sales alone are not enough.") +
 card_ul("green", "🛣", "Qanday chiqish mumkin?", "What are the ways out?", [
  ("Do'konlar va kafelarga ulgurji sotish", "Selling wholesale to shops and cafés"),
  ("Mijozlar doirasini kengaytirish (yangi kanal)", "Widening the customer circle (a new channel)"),
  ("Doimiy xarajatni kamaytirish (ijara, ish haqi)", "Cutting fixed costs (rent, wages)"),
  ("Narx va mahsulot to'plamini qayta ko'rish", "Reviewing the price and the product bundle")], "tick") +
 '</div>' +
 E("small", "Mijozlar soni va xarid ulushini «o'ylab» emas, o'z suhbat va sinov natijangizdan oling. Umumiy bozor ma'lumotini stat.uz va ochiq hisobotlardan qidiring.",
   "Take the number of customers and the share who buy from your own interviews and tests, not from a guess. Look for general market data on stat.uz and open reports.", 'class="note"'))

# ============================ 9. BIRLIK IQTISODIYOTI ============================
slide("Birlik foydasi va zararsiz nuqta", "Unit profit and break-even",
 E("span", "3.2 · Moliyaviy hisob", "3.2 · Financial calculation", 'class="kicker"') +
 E("h2", "Birlik foydasi va <span class=\"grad\">zararsiz nuqta</span>", "Profit per unit and <span class=\"grad\">the break-even point</span>") +
 E("p", "Shartli misol — «TerMeva»: 250 gramm quritilgan meva qadog'i.", "A sample — “TerMeva”: a 250-gram pack of dried fruit.", 'class="lead"') +
 '<div class="grid g3">' +
 '<div class="card" style="--c:var(--blue)">' + E("h3", "1. Bitta qadoq hisobi", "1. One pack") +
 table(None, [
  [TD("Sotish narxi", "Selling price"), TD("40 000", "40,000")],
  [TD("Meva (xomashyo)", "Fruit (raw material)"), TD("− 16 000", "− 16,000")],
  [TD("Qadoq va yorliq", "Pack and label"), TD("− 3 000", "− 3,000")],
  [TD("Yetkazish", "Delivery"), TD("− 5 000", "− 5,000")],
  [TD("<b>Birlik foydasi</b>", "<b>Profit per unit</b>"), TD("<b>16 000 so'm</b>", "<b>16,000 so'm</b>", "g")]]) + '</div>' +
 '<div class="card" style="--c:var(--violet)">' + E("h3", "2. Oylik doimiy xarajat", "2. Monthly fixed costs") +
 table(None, [
  [TD("Ijara", "Rent"), TD("1 500 000", "1,500,000")],
  [TD("Yordamchining ish haqi", "An assistant's wages"), TD("2 000 000", "2,000,000")],
  [TD("Reklama va aloqa", "Advertising and phone"), TD("500 000", "500,000")],
  [TD("<b>Jami</b>", "<b>Total</b>"), TD("<b>4 000 000 so'm</b>", "<b>4,000,000 so'm</b>", "r")]]) +
 E("p", "Sotuv bo'lmasa ham bu pul ketadi.", "This money is spent even if nothing sells.", 'style="margin-top:8px"') + '</div>' +
 '<div class="card" style="--c:var(--green)">' + E("h3", "3. Zararsiz nuqta", "3. The break-even point") +
 E("p", "<b>Zararsiz miqdor = doimiy xarajat ÷ birlik foydasi</b>", "<b>Break-even quantity = fixed costs ÷ profit per unit</b>") +
 E("p", "4 000 000 ÷ 16 000 = <b>250 qadoq</b> oyiga", "4,000,000 ÷ 16,000 = <b>250 packs</b> a month", 'style="font-size:17px"') +
 E("p", "Shundan keyingi har bir qadoq sof foyda bo'ladi.", "Every pack after that is net profit.", 'style="margin-top:8px"') + '</div></div>' +
 E("h3", "Oylik natija: qancha sotsak, nima bo'ladi?", "Monthly result: what happens at each level of sales?", 'style="margin-top:14px"') +
 table([("Oylik sotuv", "Monthly sales"), ("Foyda (miqdor × 16 000)", "Profit (quantity × 16,000)"), ("Doimiy xarajat", "Fixed costs"), ("Sof natija", "Net result")], [
  [TD("100 qadoq", "100 packs"), TD("1 600 000", "1,600,000"), TD("4 000 000", "4,000,000"), TD("<b>−2 400 000 so'm</b>", "<b>−2,400,000 so'm</b>", "r")],
  [TD("250 qadoq", "250 packs"), TD("4 000 000", "4,000,000"), TD("4 000 000", "4,000,000"), TD("<b>0 — zararsiz nuqta</b>", "<b>0 — break-even</b>")],
  [TD("400 qadoq", "400 packs"), TD("6 400 000", "6,400,000"), TD("4 000 000", "4,000,000"), TD("<b>+2 400 000 so'm</b>", "<b>+2,400,000 so'm</b>", "g")]]) +
 E("div", "⏳ <b>Qoplanish muddati:</b> boshlang'ich sarmoya 20 000 000 so'm (uskuna 12 mln, xomashyo 4 mln, qadoq va reklama 2 mln, zaxira 2 mln). Oyiga 400 qadoq sotilsa, sof foyda 2 400 000: <b>20 000 000 ÷ 2 400 000 ≈ 8 oy</b>.",
   "⏳ <b>Payback time:</b> the starting investment is 20,000,000 so'm (machine 12 million, raw material 4 million, packaging and ads 2 million, reserve 2 million). At 400 packs a month the net profit is 2,400,000: <b>20,000,000 ÷ 2,400,000 ≈ 8 months</b>.", 'class="quote" style="margin-top:10px"'))

# ============================ 10. RAQOBAT VA USTUNLIK ============================
slide("Raqobat va ustunlik", "Competition and edge",
 E("span", "3.3 · Raqobat", "3.3 · Competition", 'class="kicker"') +
 E("h2", "Raqobatchi bor — <span class=\"grad\">bu yaxshi belgi</span>", "Competitors exist — <span class=\"grad\">and that is a good sign</span>") +
 E("div", "«Raqobatchim yo'q» degan gap investorga <b>«bozor yo'q yoki o'rganilmagan»</b> deb eshitiladi. Mijoz muammoni hozir kim bilan hal qilayotganini ko'rsating.",
   "“I have no competitors” sounds to an investor like <b>“there is no market, or it has not been studied”</b>. Show who the customer solves the problem with today.", 'class="def"') +
 table([("", ""), ("Bozordagi quritilgan meva (tayyor)", "Ready dried fruit in shops"), ("Uyda quritish", "Drying at home"), ("TerMeva", "TerMeva")], [
  [TD("<b>Narx</b>", "<b>Price</b>"), TD("O'rtacha, har xil", "Medium, varies"), TD("Arzon", "Cheap"), TD("Biroz qimmatroq", "A little higher", "r")],
  [TD("<b>Ishonchlilik</b>", "<b>Trust</b>"), TD("Ishlab chiqaruvchi noma'lum", "The producer is unknown"), TD("Yuqori", "High"), TD("Mahalliy, ochiq ishlab chiqarish", "Local, open production", "g")],
  [TD("<b>Qulaylik</b>", "<b>Convenience</b>"), TD("Do'konga borish kerak", "You must go to the shop"), TD("Vaqt va mehnat ketadi", "Takes time and effort"), TD("Uyga yetkazib beriladi", "Delivered to the door", "g")],
  [TD("<b>Qandsiz</b>", "<b>No added sugar</b>"), TD("Ko'pincha qand bor", "Often with sugar"), TD("Qandsiz", "Sugar-free"), TD("Qandsiz, yorliqda yozilgan", "Sugar-free, stated on the label", "g")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("green", "⭐", "UVP — noyob taklif", "UVP — the unique value proposition", "Bitta jumlada: <b>nima uchun mijoz aynan sizni tanlaydi?</b> Misol: «Termiz mevasidan, qandsiz, uyga yetkaziladi».",
      "In one sentence: <b>why will the customer choose you?</b> Example: “From Termez fruit, sugar-free, delivered to your door”.") +
 card("orange", "🏰", "Ustunlik uzoq turadimi?", "Does the edge last?", "Nusxalash oson bo'lgan ustunlik (masalan, past narx) tez yo'qoladi. Ishonch, mijoz bazasi, sifat va servis esa uzoq turadi.",
      "An edge that is easy to copy (such as a low price) disappears fast. Trust, a customer base, quality and service last longer.") +
 '</div>')

# ============================ 11. MVP ============================
slide("MVP: kichik sinov", "MVP: a small test",
 E("span", "4-blok · Boshlash", "Block 4 · Getting started", 'class="kicker"') +
 E("h2", "Katta pulsiz boshlash: <span class=\"grad\">MVP</span>", "Starting without big money: <span class=\"grad\">the MVP</span>") +
 E("div", "<b>MVP</b> (minimal hayotga layoqatli mahsulot) — g'oyani tekshirish uchun yasaladigan <b>eng oddiy variant</b>. Uskuna sotib olishdan oldin 40 ta oilaga kichik partiya sotib ko'rish MVP bo'ladi.",
   "An <b>MVP</b> (minimum viable product) is <b>the simplest version</b> built to test an idea. Selling a small batch to 40 families before buying a machine is an MVP.", 'class="def"') +
 '<div class="chain" style="margin-top:14px">' +
 '<div class="link l1">' + E("h3", "1. Gipoteza", "1. Hypothesis") + E("p", "«Oilalar quritilgan mevani uyga yetkazib berilsa sotib oladi.»", "“Families will buy dried fruit if it is delivered to their door.”") + '</div>' +
 '<div class="link l2">' + E("h3", "2. Eng oddiy sinov", "2. The simplest test") + E("p", "Uyda tayyorlangan 40 qadoq, Telegramda e'lon.", "40 packs made at home, announced on Telegram.") + '</div>' +
 '<div class="link l3">' + E("h3", "3. O'lchash", "3. Measure") + E("p", "Nechta buyurtma, nechtasi qayta oldi, qanday fikr bildirdi?", "How many orders, how many bought again, what feedback?") + '</div>' +
 '<div class="link l4">' + E("h3", "4. Qaror", "4. Decide") + E("p", "Davom etamiz, o'zgartiramiz (pivot) yoki to'xtatamiz.", "Continue, change (pivot) or stop.") + '</div></div>' +
 '<div class="grid g2" style="margin-top:14px">' +
 card_ul("blue", "📏", "Sinov oldidan muvaffaqiyat mezonini yozing", "Write the success criterion before the test", [
  ("«40 tadan kamida 10 tasi sotib oladi» — shunda g'oya ishlaydi.", "“At least 10 of 40 buy” — then the idea works."),
  ("«Sotib olganlarning yarmi qayta buyurtma beradi.»", "“Half of the buyers order again.”"),
  ("Natijadan keyin mezonni o'zgartirmang — o'zingizni aldamaysiz.", "Do not change the criterion after the result — that is cheating yourself.")], "clean") +
 card("orange", "🔄", "Pivot — yo'nalishni o'zgartirish", "Pivot — changing direction", "Natija kutilganidan past bo'lsa, ko'r-ko'rona davom etmang: <b>nima ishlamadi?</b> narxmi, mijozmi, kanalmi? Bitta narsani o'zgartirib, yana sinang.",
      "If results are below expectation, do not carry on blindly: <b>what did not work?</b> The price, the customer, the channel? Change one thing and test again.") + '</div>' +
 E("div", "💡 <b>Muhim:</b> eng kuchli isbot — «yoqdi» degan maqtov emas, <b>pul to'lagan birinchi mijoz</b>. 100 ta layk 1 ta pulli buyurtmaga teng emas.",
   "💡 <b>Important:</b> the strongest proof is not praise like “I liked it” but <b>the first paying customer</b>. 100 likes do not equal 1 paid order.", 'class="quote" style="margin-top:10px"'))

# ============================ 12. YO'L XARITASI ============================
slide("Tadbirkorlik yo'li xaritasi", "The entrepreneurial roadmap",
 E("span", "4.2 · Yo'l xaritasi", "4.2 · The roadmap", 'class="kicker"') +
 E("h2", "G'oyadan <span class=\"grad\">birinchi daromadgacha</span>: 7 qadam", "From an idea <span class=\"grad\">to the first income</span>: 7 steps") +
 '<div class="chain">' +
 '<div class="link l1">' + E("h3", "1. Tekshir", "1. Test") + E("p", "10 ta suhbat, muammoni tasdiqlash.", "10 interviews, confirm the problem.") + E("p", "1–2 hafta", "1–2 weeks", 'style="font-size:12.5px"') + '</div>' +
 '<div class="link l2">' + E("h3", "2. MVP", "2. MVP") + E("p", "Kichik partiya, birinchi sinov.", "A small batch, the first test.") + E("p", "2–4 hafta", "2–4 weeks", 'style="font-size:12.5px"') + '</div>' +
 '<div class="link l3">' + E("h3", "3. Birinchi sotuv", "3. First sale") + E("p", "Pul to'lagan mijozlar va fikr.", "Paying customers and feedback.") + E("p", "1–2 oy", "1–2 months", 'style="font-size:12.5px"') + '</div>' +
 '<div class="link l4">' + E("h3", "4. Hisob", "4. Numbers") + E("p", "Birlik foydasi va zararsiz nuqta.", "Profit per unit and break-even point.") + E("p", "Birinchi sotuvlar bilan", "Alongside the first sales", 'style="font-size:12.5px"') + '</div></div>' +
 '<div class="chain" style="margin-top:10px">' +
 '<div class="link l4">' + E("h3", "5. Rasmiylashtir", "5. Register") + E("p", "Huquqiy shakl, soliq va hisob.", "Legal form, tax and bookkeeping.") + '</div>' +
 '<div class="link l3">' + E("h3", "6. Moliyalashtir", "6. Fund it") + E("p", "O'z mablag'i, kredit, grant yoki investor.", "Own money, a loan, a grant or an investor.") + '</div>' +
 '<div class="link l2">' + E("h3", "7. O'sish", "7. Grow") + E("p", "Ishlayotgan kanalni kengaytirish, jamoa.", "Scale the channel that works, build a team.") + '</div></div>' +
 '<div class="grid g2" style="margin-top:14px">' +
 card("red", "⚠️", "Eng ko'p uchraydigan xato", "The most common mistake", "<b>Avval katta xarajat (ijara, uskuna, kredit), keyin mijoz izlash.</b> To'g'ri tartib teskarisi: avval mijoz va sinov, keyin sarmoya.",
      "<b>Big spending first (rent, machines, a loan), customer search afterwards.</b> The right order is the opposite: customer and test first, investment after.") +
 card("green", "✅", "Birinchi 30 kun uchun nazorat ro'yxati", "A checklist for the first 30 days", "10 ta suhbat · MVP rejasi · birinchi 10 ta pulli mijoz · kunlik hisob daftari · 2 ta kanal. Ushbu ro'yxat bajarilmagan bo'lsa, kredit olishga shoshilmang.",
      "10 interviews · an MVP plan · the first 10 paying customers · a daily records book · 2 channels. If this list is not done, do not rush into a loan.") + '</div>')

# ============================ 13. HUQUQIY SHAKL ============================
slide("Huquqiy shakl", "Legal form",
 E("span", "4.3 · Rasmiylashtirish", "4.3 · Registration", 'class="kicker"') +
 E("h2", "Biznesni <span class=\"grad\">qanday rasmiylashtirish kerak?</span>", "How to <span class=\"grad\">register the business?</span>") +
 E("div", "Daromad olishni boshlagach, faoliyat <b>qonuniy shaklda</b> bo'lishi kerak: u sizni jarima va nizolardan himoya qiladi, bank va hamkor bilan ishlash imkonini beradi.",
   "Once you start earning, the activity should have a <b>legal form</b>: it protects you from fines and disputes and lets you work with banks and partners.", 'class="def"') +
 table([("Shakl", "Form"), ("Kim uchun", "Who it is for"), ("Asosiy xususiyati", "Main feature"), ("E'tibor bering", "Watch out for")], [
  [TD("<b>Yakka tartibdagi tadbirkor (YaTT)</b>", "<b>Sole proprietor (YaTT)</b>"), TD("Yakka boshlayotgan, kichik hajmdagi biznes", "A solo start, small-scale business"), TD("Ro'yxatdan o'tish nisbatan sodda; o'zi yuritadi", "Registration is relatively simple; you run it yourself", "g"), TD("Majburiyat uchun shaxsiy mol-mulk bilan javob berilishi mumkin", "You may be liable for debts with personal property", "r")],
  [TD("<b>Mas'uliyati cheklangan jamiyat (MChJ)</b>", "<b>Limited liability company (LLC)</b>"), TD("Hamkor bilan yoki kengayishni rejalagan biznes", "A business with partners or planned growth"), TD("Alohida yuridik shaxs; ishtirokchi kiritgan ulushi doirasida javob beradi", "A separate legal entity; a participant is liable up to their contribution", "g"), TD("Hujjat va hisobot ko'proq", "More paperwork and reporting")],
  [TD("<b>O'zini o'zi band qilgan shaxs</b>", "<b>A self-employed person</b>"), TD("Kichik xizmat va hunar: dars berish, tikuv, dizayn", "Small services and crafts: tutoring, sewing, design"), TD("Yengil tartib, past hajmdagi faoliyatga mos", "A light regime, suited to a small volume of work", "g"), TD("Daromad va faoliyat turi chegaralari bor", "There are limits on income and type of activity", "r")]]) +
 '<div class="grid g3" style="margin-top:14px">' +
 card("blue", "📝", "Qayerdan boshlash?", "Where to start?", "Ro'yxatdan o'tish bo'yicha amaldagi qoida va shakllarni <b>birdarcha.uz</b> va davlat xizmatlari markazlarida ko'rish mumkin.", "The current rules and forms for registration are available on <b>birdarcha.uz</b> and at public service centres.") +
 card("green", "📒", "Hisobni yuriting", "Keep your records", "Kirim va chiqimni birinchi kundan yozing: daftar yoki jadval yetadi. Soliq va bank bilan ishlashda shu asos bo'ladi.", "Write down income and spending from day one: a notebook or a table is enough. It is the basis for working with tax and the bank.") +
 card("orange", "📜", "Faoliyat turi", "Type of activity", "Oziq-ovqat, dori, ta'lim kabi ba'zi yo'nalishlar uchun <b>qo'shimcha ruxsat yoki sertifikat</b> kerak bo'lishi mumkin. Oldindan aniqlang.", "Some fields, such as food, medicine or education, may need <b>extra permits or certificates</b>. Find out in advance.") + '</div>' +
 E("small", "Soliq stavkalari, imtiyozlar va ro'yxatdan o'tish tartibi tez-tez o'zgaradi. Qaror qilishdan oldin lex.uz va soliq xizmatining amaldagi ma'lumotini tekshiring yoki mutaxassis bilan maslahatlashing.",
   "Tax rates, benefits and registration procedures change often. Before deciding, check lex.uz and the tax service's current information or consult a specialist.", 'class="note"'))

# ============================ 14. MOLIYALASHTIRISH ============================
slide("Moliyalashtirish manbalari", "Sources of funding",
 E("span", "4.4 · Pul manbalari", "4.4 · Sources of money", 'class="kicker"') +
 E("h2", "Boshlash uchun <span class=\"grad\">pul qayerdan olinadi?</span>", "Where does the <span class=\"grad\">starting money come from?</span>") +
 table([("Manba", "Source"), ("Qachon mos", "When it fits"), ("Ijobiy tomoni", "Advantage"), ("Xavfi", "Risk")], [
  [TD("<b>💰 O'z jamg'armasi</b>", "<b>💰 Own savings</b>"), TD("Kichik MVP va birinchi sotuv", "A small MVP and the first sale"), TD("Qarz va ulush so'ralmaydi", "No debt and no share to give away", "g"), TD("O'z pulingiz xavf ostida", "Your own money is at risk", "r")],
  [TD("<b>👨‍👩‍👧 Oila va do'stlar</b>", "<b>👨‍👩‍👧 Family and friends</b>"), TD("Erta bosqich, kichik summa", "An early stage, a small sum"), TD("Tez va shartlari yumshoq", "Fast, with soft terms", "g"), TD("Munosabat buzilishi; shartni yozmaslik", "Damaged relationships; no written terms", "r")],
  [TD("<b>🏦 Bank krediti</b>", "<b>🏦 A bank loan</b>"), TD("Daromad bor, to'lov manbai aniq", "There is income and a clear source of repayment"), TD("Biznes ulushi saqlanadi", "You keep the whole business", "g"), TD("Foiz; daromad bo'lmasa ham to'lanadi", "Interest; repaid even if income falls", "r")],
  [TD("<b>🤲 Mikromoliya tashkiloti</b>", "<b>🤲 A microfinance organisation</b>"), TD("Kichik summa, tez kerak", "A small sum needed quickly"), TD("Hujjat kamroq", "Less paperwork", "g"), TD("Foizi ko'pincha yuqoriroq", "The interest is often higher", "r")],
  [TD("<b>🎁 Grant va davlat dasturlari</b>", "<b>🎁 Grants and state programmes</b>"), TD("Ijtimoiy yoki yosh tadbirkor loyihalari", "Social or young-entrepreneur projects"), TD("Qaytarilmaydi yoki imtiyozli", "Non-repayable or on easy terms", "g"), TD("Talab ko'p, raqobat kuchli", "Many requirements, strong competition")],
  [TD("<b>💼 Investor</b>", "<b>💼 An investor</b>"), TD("O'sish potensiali katta, isbot bor", "Large growth potential, proof exists"), TD("Pul va tajriba keladi", "Money and experience arrive", "g"), TD("Biznes ulushi beriladi", "You give up part of the business", "r")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("red", "⚠️", "Kredit olishdan oldingi sinov", "A test before taking a loan", "Savol: <b>«Sotuv hozircha past bo'lsa ham, oylik to'lovni qayerdan to'layman?»</b> Agar javob «sotuvdan ko'raman» bo'lsa — hali erta.",
      "The question: <b>“If sales stay low for now, where will I pay the monthly instalment from?”</b> If the answer is “from sales, I hope” — it is too early.") +
 card("green", "📌", "Ariza va taqdimotga tayyorgarlik", "Preparing the application and the pitch", "Manbaga qarab ariza o'zgaradi: bankka — to'lov manbai va kafolat, grantga — ijtimoiy foyda, investorga — o'sish va isbot. Shartlarni manbaning o'zidan tekshiring.",
      "The application changes with the source: for a bank — repayment source and collateral, for a grant — social benefit, for an investor — growth and proof. Check the terms with the source itself.") + '</div>' +
 E("small", "Kredit va grant shartlari, foiz stavkalari va dasturlar o'zgarib turadi. Ma'lumotni bank, tegishli davlat tashkiloti yoki rasmiy sayt orqali tasdiqlang.",
   "Loan and grant terms, interest rates and programmes change over time. Confirm the information through the bank, the relevant public body or an official site.", 'class="note"'))

# ============================ 15. SAVOL-JAVOB ============================
slide("Taqdimot va savol-javob", "Delivery and Q&A",
 E("span", "2.3 · Chiqish san'ati", "2.3 · Delivery", 'class="kicker"') +
 E("h2", "Qanday gapirish va <span class=\"grad\">qiyin savolga qanday javob berish</span>", "How to speak and <span class=\"grad\">how to answer a hard question</span>") +
 '<div class="grid g2"><div>' +
 card_ul("blue", "🎤", "Chiqish qoidalari", "Rules of delivery", [
  ("<b>Vaqtga sig'ing.</b> 3 daqiqa — 3 daqiqa; oldindan 3 marta mashq qiling.", "<b>Fit the time.</b> 3 minutes means 3 minutes; rehearse 3 times beforehand."),
  ("<b>Raqam bilan gapiring.</b> «Ko'p» emas — «40 ta oiladan 22 tasi».", "<b>Speak with numbers.</b> Not “many” — “22 of 40 families”."),
  ("<b>Hikoya bilan boshlang.</b> Bitta real mijoz va uning muammosi.", "<b>Start with a story.</b> One real customer and their problem."),
  ("<b>Ko'zga qarang.</b> Slaydga emas, tinglovchiga gapiring.", "<b>Look at people.</b> Talk to the audience, not the slide."),
  ("<b>Sekin va aniq.</b> Tez gapirish — asabiylik belgisi.", "<b>Slowly and clearly.</b> Speaking fast signals nerves."),
  ("<b>Oxirida so'rang.</b> Bitta aniq so'rov bilan tugating.", "<b>Ask at the end.</b> Finish with one clear request.")]) +
 '</div><div>' +
 '<div class="card" style="--c:var(--violet)">' + E("h3", "❓ Qiyin savollar va yaxshi javoblar", "❓ Hard questions and good answers") +
 table([("Savol", "Question"), ("Yaxshi javob", "A good answer")], [
  [TD("<b>«Raqobatchilaringiz kim?»</b>", "<b>“Who are your competitors?”</b>"), TD("Ularni nomlang va farqingizni 1 jumlada ayting. «Yo'q» demang.", "Name them and state your difference in one sentence. Never say “none”.", "g")],
  [TD("<b>«Nega sizni tanlashadi?»</b>", "<b>“Why would they choose you?”</b>"), TD("UVP va birinchi isbotni ayting.", "Give your UVP and the first proof.", "g")],
  [TD("<b>«Pulni nimaga sarflaysiz?»</b>", "<b>“What will you spend the money on?”</b>"), TD("Moddalar bo'yicha aniq: uskuna 12 mln, xomashyo 4 mln...", "Item by item: machine 12 million, raw material 4 million...", "g")],
  [TD("<b>«Mijoz kelmasa-chi?»</b>", "<b>“What if customers do not come?”</b>"), TD("Zaxira rejangizni ayting: kanal almashtirish, narx yoki xarajatni kamaytirish.", "Share your fallback: a new channel, a price change or lower costs.", "g")],
  [TD("<b>Bilmagan savol</b>", "<b>A question you cannot answer</b>"), TD("«Aniq bilmayman, tekshirib, ertaga yozaman.» Soxta javob berish yomonroq.", "“I do not know exactly, I will check and write tomorrow.” A made-up answer is worse.", "g")]]) + '</div></div></div>' +
 E("div", "🧠 Tinglovchi sizning g'oyangizga emas, avvalo <b>sizning tayyorligingizga</b> ishonadi: raqamlarni biladigan, javobdan qochmaydigan odamga pul ham, hamkorlik ham beriladi.",
   "🧠 The listener first trusts <b>your preparation</b>, and only then your idea: money and partnership go to someone who knows the numbers and does not dodge answers.", 'class="quote" style="margin-top:12px"'))

# ============================ 16. AMALIY TOPSHIRIQ ============================
slide("Amaliy topshiriq", "Practical task",
 E("span", "Amaliy mashg'ulot · 2 soat", "Practical class · 2 hours", 'class="kicker"') +
 E("h2", "«3 daqiqalik <span class=\"grad\">taqdimot»</span>", "The “3-minute <span class=\"grad\">pitch”</span>") +
 E("p", "Har bir talaba (yoki 2 kishilik guruh) o'z biznes g'oyasi uchun qisqa taqdimot va bitta A4 «g'oya kartochkasi» tayyorlaydi.", "Each student (or a pair) prepares a short pitch and one A4 “idea card” for their own business idea.", 'class="lead"') +
 '<div class="grid g2"><div class="card" style="--c:var(--blue)">' + E("h3", "⏱ 120 daqiqalik reja", "⏱ The 120-minute plan") +
 table([("Vaqt", "Time"), ("Nima qilinadi", "What to do")], [
  [TD("0–15", "0–15"), TD("G'oya, mijoz va muammoni bir jumlada yozish", "Write the idea, customer and problem in one sentence")],
  [TD("15–35", "15–35"), TD("Juftlikda 3 ta mijoz suhbati: «ilgari nima qilgan?»", "Three customer interviews in pairs: “what did they do before?”")],
  [TD("35–60", "35–60"), TD("Bozor, birlik foydasi va zararsiz nuqta hisobi", "Market, profit per unit and break-even calculation")],
  [TD("60–80", "60–80"), TD("Taqdimot: 10 slayd tuzilmasi va 60 soniyalik pitch", "The pitch: the 10-slide structure and a 60-second pitch")],
  [TD("80–110", "80–110"), TD("Taqdimotlar: 3 daqiqa + 2 daqiqa savol-javob", "Pitches: 3 minutes + 2 minutes of questions")],
  [TD("110–120", "110–120"), TD("O'zaro baholash va xulosa", "Peer assessment and wrap-up")]]) + '</div>' +
 '<div><div class="card" style="--c:var(--green)">' + E("h3", "📋 G'oya kartochkasida bo'lishi shart", "📋 The idea card must contain") +
 '<ul class="clean">' + E("li", "Muammo, mijoz portreti va yechim (3 jumla)", "Problem, customer portrait and solution (3 sentences)") +
 E("li", "Suhbat natijasi: nechta odam, nechtasi muammoni tasdiqladi", "Interview result: how many people, how many confirmed the problem") +
 E("li", "Birlik foydasi va zararsiz nuqta", "Profit per unit and the break-even point") +
 E("li", "Raqobat va sizning farqingiz (UVP)", "Competition and your difference (UVP)") +
 E("li", "30 kunlik MVP rejasi va muvaffaqiyat mezoni", "A 30-day MVP plan and the success criterion") +
 E("li", "Huquqiy shakl va moliyalashtirish manbasi (asoslab)", "Legal form and funding source (with reasons)") + '</ul></div>' +
 '<div class="card" style="--c:var(--amber);margin-top:12px">' + E("h3", "🏅 Baholash", "🏅 Assessment") +
 E("p", "Muammo va mijozni isbotlash <b>25%</b> · hisob-kitob <b>30%</b> · taqdimot tuzilmasi <b>25%</b> · savollarga javob <b>20%</b>.", "Proving the problem and customer <b>25%</b> · calculation <b>30%</b> · pitch structure <b>25%</b> · answering questions <b>20%</b>.") + '</div></div></div>')

# ============================ 17. XULOSA ============================
slide("Xulosa va resurslar", "Summary and resources",
 E("span", "Xulosa · Mustaqil ish · Havolalar", "Summary · Independent work · Links", 'class="kicker"') +
 E("h2", "Yakuniy <span class=\"grad\">xulosa</span> va <span class=\"grad\">foydali resurslar</span>", "The final <span class=\"grad\">summary</span> and <span class=\"grad\">useful resources</span>") +
 '<div class="grid g2"><div>' +
 card_ul("green", "📌", "Esda qoladigan 6 ta fikr", "6 things to remember", [
  ("Avval <b>muammo va mijoz</b>, keyin yechim. Maqtov emas, <b>ilgari nima qilgani</b> haqiqatni ko'rsatadi.", "First <b>the problem and the customer</b>, then the solution. Not praise but <b>what people did before</b> shows the truth."),
  ("Taqdimot — tinglovchining <b>savoliga javob</b>: muammo → yechim → raqam → so'rov.", "A pitch is an <b>answer to the listener's question</b>: problem → solution → numbers → ask."),
  ("Bozorni <b>pastdan yuqoriga</b> hisoblang: o'zim yetadigan mijozlar × xarid ulushi.", "Estimate the market <b>from the bottom up</b>: customers I can reach × share who buy."),
  ("Zararsiz miqdor = <b>doimiy xarajat ÷ birlik foydasi</b>; qoplanish = sarmoya ÷ oylik foyda.", "Break-even quantity = <b>fixed costs ÷ profit per unit</b>; payback = investment ÷ monthly profit."),
  ("<b>MVP</b> bilan boshlang: kichik sinov, aniq mezon, kerak bo'lsa pivot.", "Start with an <b>MVP</b>: a small test, a clear criterion, a pivot if needed."),
  ("Kredit — oxirgi qadam: avval isbot va hisob, keyin rasmiylashtirish va moliyalashtirish.", "A loan is the last step: proof and numbers first, then registration and funding.")]) +
 '<div class="card" style="--c:var(--amber);margin-top:12px">' + E("h3", "📓 Mustaqil ish: «G'oya 30 kun ichida»", "📓 Independent work: “The idea in 30 days”") +
 '<ul class="clean">' + E("li", "10 ta maqsadli mijoz bilan suhbat o'tkazib, natijani jadvalga yozing.", "Interview 10 target customers and write the results in a table.") +
 E("li", "MVP tayyorlab, kamida 10 ta odamga taklif qiling.", "Prepare an MVP and offer it to at least 10 people.") +
 E("li", "Birlik foydasi va zararsiz nuqtani hisoblab chiqing.", "Calculate profit per unit and the break-even point.") +
 E("li", "Xulosa: davom etamizmi, o'zgartiramizmi (pivot) yoki to'xtatamizmi?", "Conclusion: continue, change (pivot) or stop?") + '</ul>' +
 E("p", "Hajmi: 1–2 bet + jadval. Baholash: suhbat va sinov dalillari 40% · hisob 30% · asoslangan xulosa 30%.", "Size: 1–2 pages + a table. Marking: evidence from interviews and the test 40% · calculation 30% · reasoned conclusion 30%.", 'style="font-size:13.5px;color:var(--muted)"') + '</div></div>' +
 '<div><div class="card" style="--c:var(--blue)">' + E("h3", "🔗 Foydali resurslar", "🔗 Useful resources") +
 E("p", "<b>Qonun va rasmiy manbalar:</b>", "<b>Law and official sources:</b>") +
 '<ul class="clean">' +
 E("li", '<a class="lnk" href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> — tadbirkorlik va soliq qonunlari', '<a class="lnk" href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> — business and tax laws') +
 E("li", '<a class="lnk" href="https://birdarcha.uz" target="_blank" rel="noopener">birdarcha.uz</a> — biznesni ro\'yxatdan o\'tkazish', '<a class="lnk" href="https://birdarcha.uz" target="_blank" rel="noopener">birdarcha.uz</a> — business registration') +
 E("li", '<a class="lnk" href="https://stat.uz" target="_blank" rel="noopener">stat.uz</a> — rasmiy statistika va bozor ma\'lumotlari', '<a class="lnk" href="https://stat.uz" target="_blank" rel="noopener">stat.uz</a> — official statistics and market data') +
 E("li", '<a class="lnk" href="https://ombudsman.uz" target="_blank" rel="noopener">ombudsman.uz</a> — Biznes ombudsmani', '<a class="lnk" href="https://ombudsman.uz" target="_blank" rel="noopener">ombudsman.uz</a> — the Business Ombudsman') + '</ul>' +
 E("p", "<b>Bepul vositalar:</b>", "<b>Free tools:</b>", 'style="margin-top:8px"') +
 E("p", '<a class="lnk" href="https://www.canva.com" target="_blank" rel="noopener">canva.com</a> — taqdimot slaydlari dizayni · <a class="lnk" href="https://docs.google.com" target="_blank" rel="noopener">docs.google.com</a> — hisob jadvali va hujjatlar',
   '<a class="lnk" href="https://www.canva.com" target="_blank" rel="noopener">canva.com</a> — presentation slide design · <a class="lnk" href="https://docs.google.com" target="_blank" rel="noopener">docs.google.com</a> — spreadsheets and documents') +
 E("p", "<b>O'qish uchun:</b> Eric Ries — «The Lean Startup» · Rob Fitzpatrick — «The Mom Test» · Alexander Osterwalder — «Business Model Generation».", "<b>Further reading:</b> Eric Ries — “The Lean Startup” · Rob Fitzpatrick — “The Mom Test” · Alexander Osterwalder — “Business Model Generation”.", 'style="margin-top:8px"') +
 E("small", "⚠️ Qonun, soliq va moliyalashtirish shartlari o'zgaradi. Har doim amaldagi rasmiy ma'lumotga tayaning.", "⚠️ Laws, taxes and funding terms change. Always rely on current official information.", 'class="note"') +
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
 E("p", "Keyingi mashg'ulotgacha o'z g'oyangiz uchun <b>g'oya kartochkasini</b> va 3 daqiqalik taqdimotni tayyorlang — keyingi mavzu: savdo jarayonini tashkil etish va mijozlar bilan ishlash.",
   "Before the next class, prepare an <b>idea card</b> and a 3-minute pitch for your own idea — the next topic: organising the sales process and working with customers.") +
 E("p", "Termiz davlat universiteti · Tadbirkorlik asoslari", "Termez State University · Fundamentals of Entrepreneurship", 'style="color:var(--muted);font-size:13.5px"') + '</div>')

# ============================ TEST SAVOLLARI ============================
Q = [
 # 1 — lift pitch maqsadi (to'g'ri: B)
 dict(q="«Lift pitch» (60 soniyalik taqdimot)ning asosiy maqsadi nima?",
      a=["Loyihaning barcha jihatlarini qisqa vaqtda to'liq tushuntirib berish",
         "Tinglovchida qiziqish uyg'otib, keyingi suhbatga yo'l ochib berish",
         "Tinglovchini shu zahotiyoq kelishuv hujjatini imzolashga ko'ndirish",
         "Loyiha narxini oldindan aytib, muzokarani tezroq yakunlab qo'yish"], c=1,
      e="60 soniyada hamma narsani aytib bo'lmaydi. Maqsad — tinglovchida «yana ayting-chi» degan qiziqish uyg'otish va keyingi uchrashuvga yo'l ochish.",
      qe="What is the main aim of an elevator pitch (a 60-second presentation)?",
      ae=["To explain every aspect of the project fully in a short time",
         "To spark the listener's interest and open the way to more talk",
         "To persuade the listener to sign an agreement on the very spot",
         "To state the project's price upfront and end the talks sooner"],
      ee="You cannot say everything in 60 seconds. The aim is to make the listener say “tell me more” and to open the way to the next meeting."),
 # 2 — birinchi slayd (to'g'ri: A)
 dict(q="Taqdimotni odatda qaysi mazmundan boshlash tavsiya etiladi?",
      a=["Mijoz duch kelayotgan muammo va uni ko'rsatuvchi bitta real misol",
         "Jamoa a'zolarining ma'lumoti, tajribasi va oldingi yutuqlari haqida",
         "Moliyaviy prognoz, kutilayotgan foyda va qoplanish muddati haqida",
         "Mahsulotning texnik tuzilishi va ishlab chiqarish jarayoni haqida"], c=0,
      e="Tinglovchi avval «bu nega kerak?» degan savolga javob kutadi. Shuning uchun taqdimot muammo bilan boshlanadi, yechim va raqamlar keyin keladi.",
      qe="Which content is usually recommended to start a pitch with?",
      ae=["The problem the customer faces and one real example showing it",
         "The team members' education, experience and previous results",
         "The financial forecast, expected profit and the payback period",
         "The technical structure of the product and how it is produced"],
      ee="The listener first wants an answer to “why is this needed?”. That is why a pitch starts with the problem; the solution and the numbers come after."),
 # 3 — mijoz suhbati savoli (to'g'ri: C)
 dict(q="Mijoz bilan suhbatda haqiqatni eng yaxshi ko'rsatadigan savol qaysi?",
      a=["Bunday mahsulot chiqsa, sizga yoqishiga umid qilsam bo'ladimi?",
         "Mening g'oyam sizningcha qanchalik zo'r ekanligini ayting-chi?",
         "Bu muammoga oxirgi marta qachon duch keldingiz, nima qildingiz?",
         "Agar mahsulotim chiqsa, uni albatta sotib olish niyatingiz bormi?"], c=2,
      e="Odamlar kelajak haqida xushmuomalalik bilan «ha» deydi. Ilgari nima qilgani haqidagi savol esa haqiqiy xatti-harakatni ko'rsatadi.",
      qe="Which question in a customer interview best reveals the truth?",
      ae=["Can I hope that you would like such a product when it comes out?",
         "Tell me how great you honestly think my idea is, in your opinion?",
         "When did you last run into this problem, and what did you do?",
         "If my product comes out, do you intend to buy it for certain?"],
      ee="People politely say “yes” about the future. A question about what they did before reveals actual behaviour."),
 # 4 — muammo bayoni (to'g'ri: D)
 dict(q="Quyidagi muammo bayonlaridan qaysi biri eng aniq va tekshirib ko'rishga yaroqli?",
      a=["Odamlar hozirgi paytda sifatli mahsulotni topishda qiynalib yuribdi",
         "Bozorda yaxshi xizmat yetishmaydi, shuning uchun yangi biznes kerak",
         "Yoshlarning ko'pchiligi vaqtini bekorga o'tkazadi va tejashni istaydi",
         "Termizlik oilalar qishda mevani qimmat oladi yoki isrof qilishadi"], c=3,
      e="Aniq bayonda kim (termizlik oilalar), qachon (qishda) va qanday qiyinchilik bor. Shu bois uni suhbat va so'rovnoma bilan tekshirish mumkin. Qolganlari juda umumiy.",
      qe="Which of the following problem statements is the most specific and testable?",
      ae=["People today find it hard to get hold of a quality product at all",
         "The market lacks good service, so a new business is needed here",
         "Most young people waste their time and would like to save some",
         "Families in Termez pay a lot for fruit in winter or waste it all"],
      ee="A specific statement names who (families in Termez), when (in winter) and what difficulty. That is why it can be tested with interviews and surveys. The others are too general."),
 # 5 — zararsiz nuqta (to'g'ri: B)
 dict(q="Mahsulot narxi 50 000 so'm, birlik uchun o'zgaruvchan xarajat 35 000, oylik doimiy xarajat 3 000 000 so'm. Zararsiz miqdor qancha?",
      a=["150 dona", "200 dona", "250 dona", "300 dona"], c=1,
      e="Birlik foydasi = 50 000 − 35 000 = 15 000. Zararsiz miqdor = 3 000 000 ÷ 15 000 = 200 dona.",
      qe="The product price is 50,000 so'm, the variable cost per unit is 35,000 and the monthly fixed costs are 3,000,000 so'm. What is the break-even quantity?",
      ae=["150 units", "200 units", "250 units", "300 units"],
      ee="Profit per unit = 50,000 − 35,000 = 15,000. Break-even quantity = 3,000,000 ÷ 15,000 = 200 units."),
 # 6 — sof natija (to'g'ri: A)
 dict(q="Birlik foydasi 16 000 so'm, doimiy xarajat oyiga 4 000 000 so'm. Oyiga 300 dona sotilsa, sof natija qanday bo'ladi?",
      a=["800 000 so'm foyda", "1 600 000 so'm foyda", "800 000 so'm zarar", "1 200 000 so'm zarar"], c=0,
      e="Foyda = 300 × 16 000 = 4 800 000. Doimiy xarajat 4 000 000 ayrilsa, sof natija +800 000 so'm.",
      qe="Profit per unit is 16,000 so'm and fixed costs are 4,000,000 so'm a month. If 300 units are sold a month, what is the net result?",
      ae=["800,000 so'm profit", "1,600,000 so'm profit", "800,000 so'm loss", "1,200,000 so'm loss"],
      ee="Profit = 300 × 16,000 = 4,800,000. Subtracting fixed costs of 4,000,000 gives a net result of +800,000 so'm."),
 # 7 — bozor hajmi (to'g'ri: D)
 dict(q="Qaysi hisob «pastdan yuqoriga» bozor baholashiga misol bo'ladi?",
      a=["Aholi 36 million, 1 foizi sotib olsa ham katta bozor bo'ladi, deb hisoblash",
         "Boshqa mamlakatdagi shunga o'xshash bozor hajmini bizga ko'chirib qo'yish",
         "Soha bo'yicha umumiy hisobotdagi raqamning yarmini o'z bozorimiz deb olish",
         "2 000 kishiga yetaman, 5 foizi sotib oladi, har biri 40 000 so'm to'laydi"], c=3,
      e="Pastdan yuqoriga hisob — o'zim yeta oladigan mijozlardan boshlanadi: 2 000 × 5% × 40 000 = 4 000 000 so'm. Aholi sonidan foiz olish esa asossiz va xavfli.",
      qe="Which calculation is an example of a “bottom-up” market estimate?",
      ae=["Taking 36 million people and assuming even 1% buying is a big market",
         "Copying the size of a similar market in another country as our own",
         "Taking half of a general industry report's figure as our own market",
         "Reaching 2,000 people myself, 5% of them buy, each pays 40,000 so'm"],
      ee="A bottom-up estimate starts from customers I can reach myself: 2,000 × 5% × 40,000 = 4,000,000 so'm. Taking a percentage of the population is baseless and risky."),
 # 8 — UVP (to'g'ri: C)
 dict(q="UVP (noyob taklif) nimani bildiradi?",
      a=["Mahsulotni ishlab chiqarish narxini hisoblab chiqish usulini",
         "Mijozlarning tez-tez beradigan savollari ro'yxatini tuzishni",
         "Mijoz nega aynan sizni tanlashini bildiruvchi bitta sababni",
         "Sotuvdan so'ng mijozga beriladigan kafolat shartlari to'plamini"], c=2,
      e="UVP — mijoz raqobatchilarni emas, aynan sizni nega tanlashi haqidagi bitta aniq jumla. Masalan: «Termiz mevasidan, qandsiz, uyga yetkaziladi».",
      qe="What does UVP (unique value proposition) mean?",
      ae=["The method of calculating the production cost of a product",
         "Compiling the list of questions customers often ask sellers",
         "One clear reason telling why a customer chooses you alone",
         "The set of warranty terms given to buyers after the sale"],
      ee="A UVP is one clear sentence about why the customer chooses you rather than the competitors. For example: “From Termez fruit, sugar-free, delivered to your door”."),
 # 9 — MVP (to'g'ri: B)
 dict(q="MVP (minimal hayotga layoqatli mahsulot) nima uchun yasaladi?",
      a=["Ko'p xarajat qilib, bozorga mukammal to'liq mahsulotni chiqarish uchun",
         "G'oyani katta pul sarflamay, eng oddiy variantda mijozda sinash uchun",
         "Raqobatchilarni ogohlantirib, bozordan chiqib ketishga undash uchun",
         "Soliq va rasmiylashtirish talablaridan vaqtincha chetda qolish uchun"], c=1,
      e="MVP — g'oya ishlayotganini kichik xarajat bilan tekshirish uchun eng oddiy variant. Kam pul yo'qotib, tez o'rganish imkonini beradi.",
      qe="What is an MVP (minimum viable product) built for?",
      ae=["To launch a perfect, complete product after big spending on it",
         "To test an idea on real customers in its simplest form, cheaply",
         "To warn competitors and push them into leaving the market for good",
         "To avoid tax and registration requirements for some time, for now"],
      ee="An MVP is the simplest version that tests whether an idea works at a small cost. It lets you learn fast while losing little money."),
 # 10 — bank nimani biladi (to'g'ri: A)
 dict(q="Bank tadbirkorning biznes taqdimotida eng avvalo qaysi savolga javob izlaydi?",
      a=["Kreditni qaytarish uchun oylik pul tushumi va to'lov manbai bormi?",
         "Loyiha jamiyatda eng ko'p e'tibor qozonadigan g'oya hisoblanadimi?",
         "Tadbirkor kelajakda necha xodim yollashni rejalashtirib turibdi?",
         "Mahsulotning logotipi va qadog'i qanchalik chiroyli tayyorlangan?"], c=0,
      e="Bank o'z pulini qaytarib olishni istaydi. Shuning uchun u oylik tushum, to'lov manbai va kafolatga qaraydi, g'oyaning jozibasiga emas.",
      qe="Which question does a bank look for an answer to first in an entrepreneur's business pitch?",
      ae=["Is there a monthly cash inflow and a source to repay the loan?",
         "Is the project the idea that gets the most attention in society?",
         "How many employees does the entrepreneur plan to hire in future?",
         "How beautifully have the product's logo and packaging been made?"],
      ee="A bank wants its money back. That is why it looks at monthly inflow, the source of repayment and collateral, not at how attractive the idea is."),
 # 11 — MChJ javobgarligi (to'g'ri: D)
 dict(q="Mas'uliyati cheklangan jamiyat (MChJ) ishtirokchisi jamiyat qarzlari uchun odatda nima bilan javob beradi?",
      a=["Butun shaxsiy mol-mulki va oilasining mol-mulki bilan birga",
         "Faqat rais bo'lgan ishtirokchining shaxsiy mol-mulki bilan",
         "Hech narsa bilan: jamiyat yopilsa, qarz bekor bo'lib ketadi",
         "Jamiyatga kiritgan o'z ulushi doirasidagi pul mablag'i bilan"], c=3,
      e="MChJ alohida yuridik shaxs. Uning ishtirokchisi odatda kiritgan ulushi doirasida javob beradi. YaTT egasi esa o'z mol-mulki bilan javob berishi mumkin. Aniq shartlarni lex.uz dan tekshiring.",
      qe="For the debts of a limited liability company (LLC), what does a participant usually answer with?",
      ae=["With all of their personal property and their family's property",
         "Only with the personal property of the participant chairing it",
         "With nothing: the debt cancels itself once the company closes",
         "Only with money up to the size of the share they contributed"],
      ee="An LLC is a separate legal entity. Its participant is usually liable up to the contributed share, while a sole proprietor may be liable with personal property. Check exact terms on lex.uz."),
 # 12 — kredit sinovi (to'g'ri: C)
 dict(q="Kredit olishdan oldin tadbirkor o'ziga qaysi savolni berishi eng to'g'ri?",
      a=["Boshqa tadbirkorlar ham kredit olgan, menga ham shu foiz mosmi?",
         "Kredit pulini qaysi do'kondan olsam, uskuna tezroq yetib keladi?",
         "Sotuv past bo'lib qolsa ham, oylik to'lovni qayerdan to'layman?",
         "Kredit berishga bank rozi bo'lishi uchun nechta hujjat kerak?"], c=2,
      e="Kredit daromad kamayganda ham to'lanadi. Shu sababli avval eng yomon holatda to'lov manbaini aniqlash kerak, hujjat yoki foiz masalasi keyin keladi.",
      qe="Before taking a loan, which question is the most sensible for an entrepreneur to ask themselves?",
      ae=["Others have taken loans too, does this interest rate suit me?",
         "Which equipment shop should I buy from to be ready sooner?",
         "If sales stay low, where will I pay the monthly instalment?",
         "How many documents does the bank need to agree to the loan?"],
      ee="A loan has to be repaid even when income falls. So first identify the source of repayment in the worst case; the questions about documents or interest come later."),
 # 13 — raqobatchi savoli (to'g'ri: B)
 dict(q="Investor «Raqobatchilaringiz kim?» deb so'radi. Qaysi javob eng kuchli?",
      a=["Bizda raqobatchi yo'q, bunday mahsulotni hali hech kim qilmagan",
         "Mijoz hozir ikki joydan oladi; farqimiz — mahalliy va qandsiz",
         "Raqobatchilar ko'p, lekin ancha zaif, shuning uchun qo'rqmaymiz",
         "Bu savolga hozir aniq javob bermayman, keyinroq ko'rib chiqamiz"], c=1,
      e="Kuchli javob raqobatchilarni nomlaydi va farqni qisqa aytadi. «Raqobatchi yo'q» bozor o'rganilmaganini bildiradi, «ular zaif» esa asossiz ishonch.",
      qe="An investor asked “Who are your competitors?”. Which answer is the strongest?",
      ae=["We have no competitors, because nobody has made this product yet",
         "Customers buy from two places now; ours is local and sugar-free",
         "There are many rivals but they are far weaker, so we do not worry",
         "I will not answer definitely now; we will review it separately"],
      ee="A strong answer names the competitors and states the difference briefly. “No competitors” suggests the market was not studied, and “they are weak” is baseless confidence."),
 # 14 — pivot (to'g'ri: A)
 dict(q="MVP sinovida 40 ta oiladan faqat 2 tasi sotib oldi, lekin ko'plari «to'plam sifatida kerak» dedi. Eng to'g'ri qaror qaysi?",
      a=["Mijozlar so'ziga tayanib, mahsulot shaklini o'zgartirib, yana sinash",
         "Natijaga qaramay, rejalashtirilgan uskunani zudlik bilan sotib olish",
         "Sinov noto'g'ri o'tgan deb hisoblab, mezonni pastroq qilib belgilash",
         "Darhol g'oyadan voz kechib, butunlay boshqa sohada yangi biznes ochish"], c=0,
      e="Past natija va mijozlar fikri — o'zgartirish (pivot) uchun ma'lumot. Bitta narsani (mahsulot shaklini) o'zgartirib qayta sinash kerak. Mezonni natijadan keyin o'zgartirish o'zini aldashdir.",
      qe="In an MVP test only 2 of 40 families bought, but many said “we need it as a set”. Which decision is the most sensible?",
      ae=["Take customer feedback on board, change the form and test again",
         "Ignore the result and buy the planned equipment without delay",
         "Decide the test was flawed and set a lower criterion afterwards",
         "Give up on the idea at once and open a business in another field"],
      ee="A low result and customer feedback are data for changing direction (a pivot). Change one thing (the product form) and test again. Changing the criterion after the result is cheating yourself."),
 # 15 — traction (to'g'ri: C)
 dict(q="Quyidagilardan qaysi biri investor uchun eng kuchli isbot hisoblanadi?",
      a=["Ijtimoiy tarmoqdagi postga kelgan yuzlab layk va yaxshi izohlar",
         "Do'stlar va qarindoshlarning «g'oyang juda yaxshi» degan fikri",
         "Mahsulotga birinchi bo'lib pul to'lagan va qaytgan mijozlar",
         "Bozor hajmi bo'yicha katta, lekin manbasiz hisobotdagi raqam"], c=2,
      e="Pul to'lagan va qaytgan mijoz — haqiqiy talab belgisi. Layk, maqtov va manbasiz raqam xatti-harakatni emas, xushmuomalalikni ko'rsatadi.",
      qe="Which of the following is the strongest proof for an investor?",
      ae=["Hundreds of likes and kind comments under a social media post",
         "Friends' and relatives' opinion that “your idea is very good”",
         "Customers who paid for the product first and then reordered",
         "A large market-size figure from a report with unknown source"],
      ee="A customer who paid and came back is a sign of real demand. Likes, praise and an unsourced figure show politeness, not behaviour."),
]
