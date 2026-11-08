# -*- coding: utf-8 -*-
"""M8 · Mahsulotni reklama qilish va mijozga yetkazish — slaydlar va test (yangi_mavzu.py uchun).
Markazda: reklama mijoz psixologiyasiga qanday ta'sir qiladi — dunyo tajribasi, ilmiy tajribalar va halollik chegarasi.
T, d, slide — yangi_mavzu.py beradi. Test: 20 savol, ulardan 6 tasi ochiq (bitta so'z yoki son bilan javob, o=[...]).
21-slayd — 📺 video (administrator «Sayt boshqaruvi → 📺 Mavzu videolari»da YouTube havolasini qo'yadi; /api/site/quiz
skripti window.SQ_VIDEO ni beradi), 22-slayd — 🎨 logotip topshirig'i (har talabaga alohida biznes, sun'iy intellekt baholaydi).
Ishlatish (shablon — mavzu-7.html: ochiq savollarni ham ko'taradigan test dvigateli shu yerda):
  python3 _reyting-manba/yangi_mavzu.py _reyting-manba/matn/mavzu_8_matn.py mavzu-8.html "Mahsulotni reklama qilish va mijozga yetkazish" 8 "<tavsif>" mavzu-7.html
  python3 _reyting-manba/inject.py
Termiz bo'yicha hisob-kitoblardagi raqamlar — o'quv misoli (taxminiy). Dunyo misollaridagi raqamlar — ochiq manbalarda
keng keltirilgan ma'lumotlar (tadqiqot mualliflari va yili ko'rsatilgan).
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

def quote(uz, en, top=14):
    return E("div", uz, en, 'class="quote" style="margin-top:%dpx"' % top)

def pills(items):
    """items: [(uz, en, yashilmi)]"""
    return "".join('<span class="pill' + (' g' if g else '') + '">' + u + '</span>' for u, e, g in items), \
           "".join('<span class="pill' + (' g' if g else '') + '">' + e + '</span>' for u, e, g in items)

# ============================ 1. MUQOVA ============================
slide("Muqova", "Cover",
 '<div class="inner title-wrap">'
 '<div class="big-logo terdu-logo" role="img" aria-label="Termiz davlat universiteti logotipi"></div><div>' +
 E("span", "M8-mavzu · Ma'ruza · 2 soat", "Topic 8 · Lecture · 2 hours", 'class="kicker"') +
 E("h1", "MAHSULOTNI REKLAMA QILISH VA MIJOZGA YETKAZISH", "ADVERTISING THE PRODUCT AND DELIVERING IT TO THE CUSTOMER", 'class="grad"') +
 E("p", "Reklama aslida nimani sotadi · mijoz miyasi qanday qaror qiladi · <b>AIDA</b> va <b>USP</b> · Chaldinining <b>7 ta ta'sir tamoyili</b> · narx va tanlov psixologiyasi · hissiyot va hikoya · <b>logotip</b> va brend belgilari · kanallar, raqamlar va <b>A/B test</b> · halol reklama chegarasi · va'dani mijozga yetkazish.",
   "What advertising really sells · how the customer's brain decides · <b>AIDA</b> and <b>USP</b> · Cialdini's <b>seven principles of influence</b> · the psychology of price and choice · emotion and story · the <b>logo</b> and brand assets · channels, numbers and <b>A/B tests</b> · where honest advertising ends · delivering the promise to the customer.", 'class="lead"') +
 '<div class="meta">' +
 E("div", "📚 Fan: <b>Tadbirkorlik asoslari</b>", "📚 Course: <b>Fundamentals of Entrepreneurship</b>") +
 E("div", "🎓 <b>Termiz davlat universiteti</b>", "🎓 <b>Termez State University</b>") +
 E("div", "🗂 <b>24</b> slayd · <b>20</b> ta test · 📺 video · 🎨 topshiriq", "🗂 <b>24</b> slides · <b>20</b> test questions · 📺 video · 🎨 assignment") +
 E("div", "⌨️ <b>→</b> tugmasi bilan davom eting", "⌨️ Press <b>→</b> to continue") +
 '</div></div></div>')

# ============================ 2. MAQSAD ============================
slide("Maqsad va natijalar", "Aims and outcomes",
 E("span", "Mavzuning maqsadi", "Aim of the topic", 'class="kicker"') +
 E("h2", "Mashg'ulot yakunida talaba <span class=\"grad\">nima qila oladi?</span>", "What will the student <span class=\"grad\">be able to do?</span>") +
 E("div", "Maqsad: talabani <b>«reklama — bu e'lon berish»</b> degan fikrdan <b>«reklama — mijozning qaror qabul qilish usulini tushunib, unga halol yordam berish»</b> degan fikrga o'tkazish. Yaxshi reklama mahsulotni maqtamaydi — u mijozga <b>o'zini, muammosini va yechimini</b> ko'rsatadi, keyin va'dani o'z vaqtida <b>yetkazadi</b>.",
   "Aim: to move the student from <b>\"advertising means putting out an announcement\"</b> to <b>\"advertising means understanding how the customer decides and honestly helping them decide\"</b>. Good advertising does not praise the product — it shows customers <b>themselves, their problem and the solution</b>, and then <b>delivers</b> the promise on time.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("green", "🧠", "Tushuntira oladi", "Can explain", "Mijoz miyasi qanday qaror qilishini: tezkor «1-tizim» va o'ylovchi «2-tizim».", "How the customer's brain decides: the fast \"System 1\" and the deliberate \"System 2\".") +
 card("blue", "✍️", "Yoza oladi", "Can write", "AIDA bo'yicha reklama matni va bitta jumlalik USP (noyob taklif) yozadi.", "Writes an ad using AIDA and a one-sentence USP (unique selling proposition).") +
 card("violet", "🎯", "Qo'llay oladi", "Can apply", "Ijtimoiy isbot, tanqislik, langar narx kabi tamoyillarni halol qo'llaydi.", "Applies principles such as social proof, scarcity and price anchors honestly.") +
 card("orange", "🧮", "Hisoblay oladi", "Can calculate", "CTR, CPC, konversiya, CAC va ROAS ni hisoblab, reklama foydali-foydasizligini aytadi.", "Calculates CTR, CPC, conversion, CAC and ROAS and says whether an ad pays off.") +
 card("pink", "🎨", "Yarata oladi", "Can create", "Biznesga mos, sodda va eslab qolinadigan logotip chizadi va g'oyasini tushuntiradi.", "Draws a simple, memorable logo that fits the business and explains the idea behind it.") +
 card("cyan", "🛡", "Ajrata oladi", "Can tell apart", "Ishontirish va aldash (yolg'on taymer, soxta sharh) o'rtasidagi chegarani biladi.", "Knows the line between persuasion and deception (fake timers, fake reviews).") +
 '</div>')

# ============================ 3. REJA ============================
_pu, _pe = pills([("reklama", "advertising", 1), ("1-tizim / 2-tizim", "System 1 / System 2", 1), ("AIDA", "AIDA", 1), ("USP", "USP", 1),
                  ("pozitsiyalash", "positioning", 0), ("o'zaro javob", "reciprocity", 0), ("ijtimoiy isbot", "social proof", 1),
                  ("obro‘", "authority", 0), ("tanqislik", "scarcity", 1), ("langar narx", "price anchor", 1), ("aldovchi variant", "decoy", 0),
                  ("freyming", "framing", 0), ("storitelling", "storytelling", 0), ("logotip", "logo", 1), ("brend belgilari", "brand assets", 0),
                  ("nishonlash", "targeting", 0), ("CTR", "CTR", 1), ("CPC", "CPC", 0), ("konversiya", "conversion", 1), ("CAC", "CAC", 0),
                  ("ROAS", "ROAS", 1), ("A/B test", "A/B test", 1), ("qorong'i patternlar", "dark patterns", 0), ("yetkazish", "delivery", 1)])
slide("Reja va tushunchalar", "Plan and concepts",
 E("span", "Ma'ruza rejasi", "Lecture plan", 'class="kicker"') +
 E("h2", "Bugungi <span class=\"grad\">5 ta blok</span>", "Today's <span class=\"grad\">five blocks</span>") +
 '<div class="grid g5">' +
 card("green", "1️⃣", "Reklama asoslari", "Advertising basics", "Reklama nimani sotadi, miya qanday qaror qiladi, AIDA va USP.", "What ads sell, how the brain decides, AIDA and USP.") +
 card("blue", "2️⃣", "Psixologiya", "Psychology", "7 ta ta'sir tamoyili, tajribalar, narx va tanlov.", "Seven principles, experiments, price and choice.") +
 card("violet", "3️⃣", "Brend va logotip", "Brand and logo", "Hissiyot, hikoya, logotip qoidalari.", "Emotion, story and the rules of a good logo.") +
 card("orange", "4️⃣", "Kanal va raqam", "Channels and numbers", "Kanallar, kam byudjetli g'oyalar, ROAS, A/B test.", "Channels, low-budget ideas, ROAS, A/B tests.") +
 card("pink", "5️⃣", "Halollik va yetkazish", "Honesty and delivery", "Qonun, odob va va'dani mijozga yetkazish.", "The law, ethics and delivering the promise.") +
 '</div>' +
 E("h3", "🔑 Tayanch tushunchalar", "🔑 Key concepts", 'style="margin-top:22px"') +
 E("div", _pu, _pe))

# ============================ 4. REKLAMA NIMA SOTADI ============================
slide("Reklama nima sotadi?", "What does advertising sell?",
 E("span", "1-blok · Asos", "Block 1 · The basis", 'class="kicker"') +
 E("h2", "Odamlar mahsulot emas, <span class=\"grad\">natija va his</span> sotib oladi", "People buy not a product but <span class=\"grad\">a result and a feeling</span>") +
 E("div", "<b>Reklama</b> — mahsulot, xizmat yoki brend haqidagi xabarni <b>to'langan yoki o'zimizga tegishli kanallar</b> orqali kerakli odamlarga yetkazib, ularning <b>bilimi, munosabati va xatti-harakatini</b> o'zgartirishga qaratilgan faoliyat. Maqsad — shunchaki ko'rsatish emas, <b>harakatga undash</b>: qo'ng'iroq, buyurtma, tashrif.",
   "<b>Advertising</b> is delivering a message about a product, service or brand to the right people through <b>paid or owned channels</b> in order to change their <b>knowledge, attitude and behaviour</b>. The goal is not just to be seen but to <b>prompt action</b>: a call, an order, a visit.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("orange", "🔩", "Parma emas — teshik", "Not a drill — a hole", "Garvard professori <b>Teodor Levitt</b> ko'p takrorlagan fikr: «Odamlar chorak dyuymli parma emas, <b>chorak dyuymli teshik</b> sotib olishni xohlaydi». Reklama natijani ko'rsatadi.", "A line Harvard professor <b>Theodore Levitt</b> liked to repeat: \"People don't want a quarter-inch drill, they want <b>a quarter-inch hole</b>.\" Ads show the result.") +
 card("pink", "💄", "Fabrikada — kosmetika, do'konda — umid", "Cosmetics in the factory, hope in the shop", "<b>Revlon</b> asoschisi Charlz Revson: «Fabrikada biz kosmetika ishlab chiqaramiz, do'konda esa <b>umid</b> sotamiz». Mijoz o'zining yaxshiroq holatini sotib oladi.", "<b>Revlon</b> founder Charles Revson: \"In the factory we make cosmetics; in the store we sell <b>hope</b>.\" Customers buy a better version of themselves.") +
 card("blue", "📍", "Termizdagi misol", "A Termez example", "Ingliz tili kursi «haftasiga 3 dars» deb emas, «<b>6 oyda IELTS 6.0 va xorijda o'qish imkoniyati</b>» deb reklama qilsa, talaba natijani ko'radi.", "An English school that advertises not \"three lessons a week\" but \"<b>IELTS 6.0 in six months and a chance to study abroad</b>\" lets students see the result.") +
 '</div>' +
 table([("Mahsulot xususiyati", "Product feature"), ("Mijoz uchun foydasi", "Benefit to the customer"), ("Mijoz his qiladigan narsa", "What the customer feels")], [
  [TD("Telefon kamerasi 50 MP", "A 50 MP phone camera"), TD("Kechasi ham tiniq surat", "Sharp photos even at night"), TD("Do'stlar orasida eng chiroyli suratlar meniki", "My photos are the best among my friends")],
  [TD("Non tandirda pishadi", "The bread is baked in a tandoor"), TD("Mazali, uzoq yumshoq turadi", "Tasty and stays soft longer"), TD("Bolalikdagi uy noni ta'mi", "The taste of home bread from childhood")],
  [TD("Kurs 24/7 onlayn", "The course is online 24/7"), TD("Ishdan keyin ham o'qish mumkin", "You can study after work"), TD("Men ham ulguraman, kech emas", "I can make it too, it is not too late")]]) +
 quote("📌 <b>Qoida:</b> reklamada <b>xususiyat → foyda → his</b> zanjirini quring. Xususiyat — ishonch uchun, foyda — mantiq uchun, his — qaror uchun.",
       "📌 <b>The rule:</b> build the chain <b>feature → benefit → feeling</b> in every ad. The feature earns trust, the benefit feeds logic, the feeling drives the decision."))

# ============================ 5. MIYA QANDAY QAROR QILADI ============================
slide("Miya qanday qaror qiladi?", "How does the brain decide?",
 E("span", "1.2 · Qaror psixologiyasi", "1.2 · The psychology of decisions", 'class="kicker"') +
 E("h2", "Tezkor <span class=\"grad\">1-tizim</span> va o'ylovchi <span class=\"grad\">2-tizim</span>", "The fast <span class=\"grad\">System 1</span> and the deliberate <span class=\"grad\">System 2</span>") +
 E("div", "Nobel mukofoti sohibi <b>Daniel Kaneman</b> «Tez va sekin fikrlash» (2011) kitobida miyada ikki xil fikrlash borligini ko'rsatdi. <b>1-tizim</b> — tez, avtomatik, hissiy: soniyalarda «yoqdi / yoqmadi» deydi. <b>2-tizim</b> — sekin, mantiqiy, kuch talab qiladi: narxlarni solishtiradi, hisoblaydi. Kundalik xaridlarning ko'pchiligini <b>1-tizim</b> hal qiladi, 2-tizim esa ko'pincha keyin <b>oqlov</b> qidiradi.",
   "In <i>Thinking, Fast and Slow</i> (2011) Nobel laureate <b>Daniel Kahneman</b> showed that the mind runs two kinds of thinking. <b>System 1</b> is fast, automatic and emotional: it says \"like / don't like\" in seconds. <b>System 2</b> is slow, logical and effortful: it compares prices and calculates. Most everyday purchases are settled by <b>System 1</b>; System 2 often looks for a <b>justification</b> afterwards.", 'class="def"') +
 '<div class="grid g2" style="margin-top:16px">' +
 card_ul("orange", "⚡", "1-tizimga gapiradigan reklama", "Ads that speak to System 1",
         [("Bitta kuchli rasm yoki yuz, bitta g'oya", "One strong picture or face, one idea"),
          ("Tanish rang va logotip — o'ylamasdan taniladi", "Familiar colours and logo — recognised without thinking"),
          ("Hissiyot: kulgi, g'urur, xavotir, iliqlik", "Emotion: humour, pride, worry, warmth"),
          ("Qisqa, oson o'qiladigan matn (3 soniyada tushuniladi)", "Short, easy text (understood in three seconds)")]) +
 card_ul("blue", "🧮", "2-tizimga gapiradigan reklama", "Ads that speak to System 2",
         [("Raqamlar: kafolat muddati, tejamkorlik, natijalar", "Numbers: warranty, savings, results"),
          ("Solishtirish jadvali, sertifikat, mutaxassis fikri", "Comparison tables, certificates, expert opinion"),
          ("Qimmat va kam sotib olinadigan narsalar: uy, mashina, kurs", "Expensive, rare purchases: a flat, a car, a course"),
          ("Batafsil sayt sahifasi, kalkulyator, savol-javob", "A detailed web page, a calculator, an FAQ")]) +
 '</div>' +
 quote("🛒 <b>Amaliy xulosa:</b> avval <b>1-tizimni</b> to'xtating (e'tibor, his), keyin <b>2-tizimga</b> oqlov bering (raqam, kafolat). Ko'cha banneri 2–3 soniya ko'riladi — unga jadval emas, <b>bitta rasm va 5–7 so'z</b> sig'adi.",
       "🛒 <b>The practical takeaway:</b> first stop <b>System 1</b> (attention, feeling), then give <b>System 2</b> a justification (numbers, a guarantee). A street billboard gets two or three seconds — it has room for <b>one picture and five to seven words</b>, not a table."))

# ============================ 6. AIDA ============================
slide("AIDA: mijoz yo'li", "AIDA: the customer's path",
 E("span", "1.3 · Klassik model", "1.3 · A classic model", 'class="kicker"') +
 E("h2", "<span class=\"grad\">E'tibor → Qiziqish → Istak → Harakat</span>", "<span class=\"grad\">Attention → Interest → Desire → Action</span>") +
 E("div", "<b>AIDA</b> modelini 1898-yilda amerikalik reklamachi <b>Elias Sent-Elmo Lyuis</b> taklif qilgan. 125 yildan oshdi, lekin har qanday post, banner yoki videoning tuzilishi hamon shu 4 qadamdan iborat: odamni <b>to'xtatish</b>, <b>qiziqtirish</b>, <b>xohlatish</b> va <b>aniq harakatga</b> chaqirish.",
   "The <b>AIDA</b> model was proposed in 1898 by the American advertising pioneer <b>Elias St. Elmo Lewis</b>. More than 125 years later every post, banner or video is still built from the same four steps: <b>stop</b> the person, <b>interest</b> them, make them <b>want</b> it and call them to a <b>clear action</b>.", 'class="def"') +
 table([("Bosqich", "Stage"), ("Vazifasi", "Its job"), ("Termizdagi qahvaxona posti", "A Termez coffee shop post")], [
  [TD("<b>A</b> — E'tibor", "<b>A</b> — Attention"), TD("Lentani varaqlayotgan odamni 1–2 soniyada to'xtatish", "Stop a scrolling person in one or two seconds"), TD("Surat: bug'i chiqib turgan qahva va «Imtihon kechasi?» yozuvi", "Photo: a steaming coffee and the words \"Exam night?\"")],
  [TD("<b>I</b> — Qiziqish", "<b>I</b> — Interest"), TD("Muammoni mijoz tilida aytish", "Name the problem in the customer's words"), TD("«Uxlab qolmaslik va diqqatni jamlash kerakmi?»", "\"Need to stay awake and focused?\"")],
  [TD("<b>D</b> — Istak", "<b>D</b> — Desire"), TD("Foyda, isbot va shoshilish sababi", "Benefit, proof and a reason to hurry"), TD("«Sokin zal, rozetka, Wi-Fi. 300+ talaba tanlagan. Imtihon haftasi — 2-qahva yarim narxda»", "\"A quiet hall, sockets, Wi-Fi. Chosen by 300+ students. Exam week: second coffee half price\"")],
  [TD("<b>A</b> — Harakat", "<b>A</b> — Action"), TD("Bitta aniq va oson qadam", "One clear, easy step"), TD("«Talaba guvohnomasini ko'rsating · har kuni 23:00 gacha · xarita ↓»", "\"Show your student card · open daily until 23:00 · map ↓\"")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("violet", "🧲", "Sarlavha — 80%", "The headline is 80%", "Reklama ustasi <b>Devid Ogilvi</b> yozishicha, sarlavhani o'qiganlar matnni o'qiganlardan taxminan <b>5 barobar</b> ko'p. Shuning uchun asosiy va'da sarlavhada bo'lsin.", "Advertising legend <b>David Ogilvy</b> wrote that about <b>five times</b> as many people read the headline as read the body copy. So put the main promise in the headline.") +
 card("green", "👉", "Bitta harakat", "One action", "«Qo'ng'iroq qiling, saytga kiring, botga yozing, do'konga keling» — to'rtta chaqiriq mijozni chalg'itadi. <b>Bitta</b> eng oson harakatni tanlang.", "\"Call, visit the site, message the bot, come to the shop\" — four calls to action confuse people. Choose <b>one</b>, the easiest.") +
 '</div>')

# ============================ 7. USP VA POZITSIYALASH ============================
slide("USP va pozitsiyalash", "USP and positioning",
 E("span", "1.4 · Asosiy g'oya", "1.4 · The core idea", 'class="kicker"') +
 E("h2", "Nega <span class=\"grad\">aynan siz?</span> — bitta jumlada", "Why <span class=\"grad\">you exactly?</span> — in one sentence") +
 E("div", "<b>USP</b> (<i>Unique Selling Proposition</i> — noyob savdo taklifi) tushunchasini 1961-yilda <b>Rosser Rivs</b> «Reklama haqiqati» kitobida ta'riflagan: reklama mijozga raqobatchilar bermaydigan <b>bitta aniq foyda</b>ni va'da qilishi kerak. <b>Pozitsiyalash</b> esa mijoz ongida brend egallaydigan <b>joy</b>: «tez», «arzon», «eng mazali», «ayollar uchun», «talabalar uchun».",
   "The <b>USP</b> (<i>Unique Selling Proposition</i>) was defined in 1961 by <b>Rosser Reeves</b> in <i>Reality in Advertising</i>: an ad must promise <b>one clear benefit</b> that competitors do not offer. <b>Positioning</b> is the <b>place</b> a brand holds in the customer's mind: \"fast\", \"cheap\", \"the tastiest\", \"for women\", \"for students\".", 'class="def"') +
 '<div class="grid g2" style="margin-top:16px">' +
 card("orange", "🍬", "M&M's (1954)", "M&M's (1954)", "Rivs yozgan shior: «<b>Og'izda eriydi, qo'lda emas</b>». Shokolad issiqda qo'lni bulg'aydi — M&M's qobig'i bunga yo'l qo'ymaydi. Bitta foyda, bitta jumla.", "Reeves's line: \"<b>Melts in your mouth, not in your hand</b>.\" Chocolate gets messy in the heat; the M&M's shell prevents it. One benefit, one sentence.") +
 card("blue", "🚗", "Avis: «Biz 2-raqammiz»", "Avis: \"We're No. 2\"", "1962-yilda ijarachi Avis Hertzdan keyin ikkinchi edi. DDB agentligi kamchilikni kuchga aylantirdi: «<b>Biz 2-raqammiz. Shuning uchun ko'proq harakat qilamiz</b>». Kampaniyadan keyin kompaniya tez orada zarardan chiqqani aytiladi.", "In 1962 Avis was second to Hertz. The DDB agency turned the weakness into a strength: \"<b>We're No. 2. We try harder.</b>\" The company is reported to have moved out of losses soon after.") +
 card("violet", "🍕", "Domino's: 30 daqiqa", "Domino's: 30 minutes", "«<b>30 daqiqada yetkazamiz yoki pitsa bepul</b>» va'dasi Domino'sni tezlik bilan bog'ladi. Diqqat: shoshilish xavfi sabab bu kafolat 1993-yilda bekor qilingan — va'da xavfsiz bo'lishi ham kerak.", "\"<b>Delivered in 30 minutes or it's free</b>\" tied Domino's to speed. Note: because of the risk of rushing, the guarantee was dropped in 1993 — a promise must also be safe.") +
 card("green", "🐢", "VW: «Kichikroq o'ylang»", "VW: \"Think Small\"", "1959-yili hamma katta mashinani maqtaganda, Volkswagen kichik «Qo'ng'iz»ni <b>kamtar va kulgili</b> ohangda reklama qildi. Advertising Age jurnali uni XX asrning eng yaxshi kampaniyasi deb atagan.", "In 1959, while everyone praised big cars, Volkswagen advertised the small Beetle in a <b>modest, witty</b> tone. Advertising Age later named it the best campaign of the 20th century.") +
 '</div>' +
 quote("✍️ <b>USP formulasi:</b> «<b>[Mijoz]</b> uchun <b>[muammo]</b>ni <b>[raqobatchilardan farqli usul]</b> bilan hal qilamiz». Masalan: «Ishlaydigan talabalar uchun ingliz tilini <b>kechki 20:00 dagi 45 daqiqalik onlayn darslarda</b> o'rgatamiz».",
       "✍️ <b>A USP formula:</b> \"For <b>[customer]</b> we solve <b>[problem]</b> <b>[in a way competitors don't]</b>.\" For example: \"For working students we teach English in <b>45-minute online lessons at 8 pm</b>.\""))

# ============================ 8. CHALDINI TAMOYILLARI ============================
slide("Ta'sir qilishning 7 tamoyili", "Seven principles of influence",
 E("span", "2-blok · Psixologiya", "Block 2 · Psychology", 'class="kicker"') +
 E("h2", "Robert Chaldini: odamlar <span class=\"grad\">nega «ha» deydi?</span>", "Robert Cialdini: why do people <span class=\"grad\">say \"yes\"?</span>") +
 E("div", "Ijtimoiy psixolog <b>Robert Chaldini</b> «Ta'sir: ishontirish psixologiyasi» (1984) kitobida yillar davomida sotuvchilar, reklamachilar va xayriya tashkilotlarini kuzatib, odamni «ha» deyishga undaydigan <b>6 ta tamoyil</b>ni ajratdi; 2016-yilda <b>7-tamoyil</b> — «birlik»ni qo'shdi. Ular miyaning <b>yorliq qoidalari</b>: vaqtni tejash uchun miya ularga avtomatik ishonadi.",
   "Social psychologist <b>Robert Cialdini</b> spent years studying salespeople, advertisers and charities and in <i>Influence: The Psychology of Persuasion</i> (1984) named <b>six principles</b> that move people to say \"yes\"; in 2016 he added a <b>seventh</b>, \"unity\". They are the brain's <b>shortcuts</b>: to save time it trusts them automatically.", 'class="def"') +
 table([("Tamoyil", "Principle"), ("Mohiyati", "What it means"), ("Dunyo misoli", "Global example"), ("Kichik biznesda", "In a small business")], [
  [TD("🎁 <b>O'zaro javob</b>", "🎁 <b>Reciprocity</b>"), TD("Bizga nimadir berilsa, qaytarishga intilamiz", "When given something, we want to give back"), TD("Supermarketdagi bepul ta'tib ko'rish", "Free tasting samples in supermarkets"), TD("Birinchi dars bepul, bepul qo'llanma", "A free first lesson, a free guide")],
  [TD("✅ <b>Izchillik</b>", "✅ <b>Consistency</b>"), TD("Kichik «ha»dan keyin katta «ha» oson", "After a small \"yes\" a big one is easier"), TD("Bepul sinov obunasi → pullik obuna", "A free trial → a paid subscription"), TD("Avval bepul konsultatsiya, keyin xizmat", "First a free consultation, then the service")],
  [TD("👥 <b>Ijtimoiy isbot</b>", "👥 <b>Social proof</b>"), TD("Ko'pchilik qilayotganini to'g'ri deb bilamiz", "We assume what many do is right"), TD("«Eng ko'p sotilgan», reyting yulduzchalari", "\"Bestseller\" labels, star ratings"), TD("Haqiqiy mijoz sharhlari va suratlari", "Real customer reviews and photos")],
  [TD("🎓 <b>Obro‘</b>", "🎓 <b>Authority</b>"), TD("Mutaxassisga ko'proq ishonamiz", "We trust experts more"), TD("«Stomatologlar tavsiya qiladi»", "\"Recommended by dentists\""), TD("Shifokor, ustoz, sertifikat — haqiqiy bo'lsa", "A doctor, a teacher, a certificate — if real")],
  [TD("😊 <b>Yoqimlilik</b>", "😊 <b>Liking</b>"), TD("Yoqtirgan va o'xshash odamimizga «ha» deymiz", "We say yes to people we like and resemble"), TD("Blogerlar va sevimli sportchilar", "Bloggers and favourite athletes"), TD("Egasining samimiy videosi, mahalla tili", "A sincere video by the owner, local language")],
  [TD("⏳ <b>Tanqislik</b>", "⏳ <b>Scarcity</b>"), TD("Kam yoki vaqtli narsa qadrliroq ko'rinadi", "Rare or limited things look more valuable"), TD("Booking.com: «Faqat 1 xona qoldi»", "Booking.com: \"Only 1 room left\""), TD("«Bugun pishgan 40 ta somsa» — agar rost bo'lsa", "\"Today's 40 samsas\" — if it is true")],
  [TD("🤝 <b>Birlik</b>", "🤝 <b>Unity</b>"), TD("«Biz»dan biriga ko'proq ishonamiz", "We trust one of \"us\" more"), TD("Mahalliy, «o'zimizniki» brendlar", "Local \"one of us\" brands"), TD("«Termizliklar uchun termizliklardan»", "\"By Termez people, for Termez people\"")]]) +
 E("small", "⚠️ Bu tamoyillar kuchli bo'lgani uchun <b>faqat rost</b> ma'lumot bilan ishlatiladi: soxta sharh, yolg'on «oxirgi dona» yoki uydirma mutaxassis — aldash va qonunbuzarlik (19-slayd).",
   "⚠️ Because these principles are powerful, they are used <b>only with true information</b>: fake reviews, a false \"last item\" or an invented expert are deception and break the law (slide 19).", 'class="note"'))

# ============================ 9. TAJRIBALAR ============================
slide("Tajriba: ijtimoiy isbot va tanqislik", "Experiments: social proof and scarcity",
 E("span", "2.2 · Ilm nima deydi?", "2.2 · What science says", 'class="kicker"') +
 E("h2", "Ikki mashhur tajriba — <span class=\"grad\">bitta jumla natijani o'zgartiradi</span>", "Two famous experiments — <span class=\"grad\">one sentence changes the result</span>") +
 '<div class="grid g2">' +
 card_ul("blue", "🏨", "Mehmonxona sochiqlari (2008)", "Hotel towels (2008)",
         [("<b>Goldstayn, Chaldini va Griskevichus</b> mehmonxona xonalariga ikki xil kartochka qo'yishdi.", "<b>Goldstein, Cialdini and Griskevicius</b> put two different cards in hotel rooms."),
          ("1-kartochka: «Tabiatni asrang — sochiqni qayta ishlating» → <b>35,1%</b> mehmon rozi bo'ldi.", "Card 1: \"Help save the environment — reuse your towel\" → <b>35.1%</b> of guests did."),
          ("2-kartochka: «Mehmonlarimizning <b>ko'pchiligi</b> sochiqni qayta ishlatadi» → <b>44,1%</b>.", "Card 2: \"<b>The majority</b> of our guests reuse their towels\" → <b>44.1%</b>."),
          ("Xulosa: «boshqalar ham shunday qiladi» degan rost dalil chaqiriqdan kuchliroq.", "Lesson: true evidence that \"others do it too\" beats an appeal.")]) +
 card_ul("orange", "🍪", "Pechene bankasi (1975)", "The cookie jar (1975)",
         [("<b>Vorchel, Li va Adevole</b> ishtirokchilarga bir xil pechenelarni ikki xil bankadan berishdi.", "<b>Worchel, Lee and Adewole</b> gave people identical cookies from two jars."),
          ("Bankada <b>10 ta</b> pechene bo'lganda baho o'rtacha bo'ldi.", "From a jar holding <b>ten</b> cookies they were rated average."),
          ("Bankada <b>2 ta</b> qolganda o'sha pechene <b>mazaliroq va qimmatroq</b> deb baholandi.", "From a jar holding <b>two</b> the same cookies were rated <b>tastier and more valuable</b>."),
          ("Xulosa: kamyoblik qadrni oshiradi — lekin faqat haqiqiy bo'lsa.", "Lesson: scarcity raises value — but only when it is real.")]) +
 '</div>' +
 '<div class="grid g3" style="margin-top:14px">' +
 card("green", "⭐", "Sharhlar", "Reviews", "Marketpleysda 4,7 yulduz va 300 ta sharhli mahsulot 5,0 va 2 ta sharhlidan ko'proq ishonch uyg'otadi: <b>son ham isbot</b>.", "On a marketplace a product with 4.7 stars and 300 reviews earns more trust than one with 5.0 and two reviews: <b>volume is proof too</b>.") +
 card("violet", "📸", "Mijoz surati", "Customer photos", "Professional suratdan ko'ra <b>mijozning oddiy telefon surati</b> ko'pincha ishonchliroq: u «xuddi men kabi odam» ekanini ko'rsatadi.", "A <b>customer's simple phone photo</b> often convinces more than a studio shot: it shows \"someone just like me\".") +
 card("pink", "📉", "Teskari effekt", "The backfire", "«Ko'p talaba darsga kech qoladi» degan e'lon <b>kech qolishni normal</b> qilib ko'rsatadi. Ijtimoiy isbotni faqat <b>istalgan xatti-harakat</b> uchun ishlating.", "A notice saying \"many students are late\" makes <b>being late look normal</b>. Use social proof only for the <b>behaviour you want</b>.") +
 '</div>')

# ============================ 10. NARX PSIXOLOGIYASI ============================
slide("Narx psixologiyasi", "The psychology of price",
 E("span", "2.3 · Raqamlar ham his uyg'otadi", "2.3 · Numbers stir feelings too", 'class="kicker"') +
 E("h2", "Langar, aldovchi variant va <span class=\"grad\">«bepul» sehri</span>", "Anchors, decoys and <span class=\"grad\">the magic of \"free\"</span>") +
 '<div class="grid g2">' +
 card("blue", "⚓", "Langar narx", "The price anchor", "Kaneman va Tverski (1974) tajribasida tasodifiy son (10 yoki 65) ko'rgan odamlarning keyingi taxminlari shu songa «bog'lanib» qoldi. Do'konda ham birinchi ko'rilgan narx — <b>langar</b>: «<s>450 000</s> → 320 000» arzon ko'rinadi.", "In Kahneman and Tversky's 1974 experiment, people who saw a random number (10 or 65) gave later estimates that \"stuck\" to it. In a shop the first price seen is the <b>anchor</b>: \"<s>450,000</s> → 320,000\" looks cheap.") +
 card("orange", "📰", "Aldovchi variant (The Economist)", "The decoy (The Economist)", "<b>Den Arieli</b> tajribasi: onlayn — $59, faqat bosma — $125, bosma+onlayn — $125. Talabalarning <b>84%</b>i bosma+onlaynni tanladi. «Faqat bosma» olib tashlanganda ular atigi <b>32%</b> bo'ldi. Hech kim olmaydigan variant boshqasini <b>arzon ko'rsatdi</b>.", "<b>Dan Ariely</b>'s test: web only $59, print only $125, print+web $125. <b>84%</b> of students picked print+web. When \"print only\" was removed, only <b>32%</b> did. The option nobody chose made the other look <b>like a bargain</b>.") +
 card("green", "🆓", "«Bepul» sehri", "The power of \"free\"", "Arieli tajribasida Lindt konfeti 15 sent, Hershey's 1 sent bo'lganda ko'pchilik Lindtni oldi. Ikkala narx 1 sentga tushirilib, Hershey's <b>bepul</b> bo'lganda esa ko'pchilik bepulini tanladi. «Nol» narx odatiy hisob-kitobni o'chiradi.", "In Ariely's test, with Lindt at 15¢ and Hershey's at 1¢ most people chose Lindt. When both dropped by 1¢, making Hershey's <b>free</b>, most switched to the free one. A zero price switches off normal calculation.") +
 card("violet", "9️⃣", "9 bilan tugaydigan narx", "Prices ending in 9", "MIT va Chikago universiteti olimlari (Anderson va Simester) katalog tajribasida bir xil ko'ylakni $34, $39 va $44 ga sotishdi: eng ko'p <b>$39</b> lisi sotildi — arzonrog'idan ham ko'p. «9» «chegirma» signalidek o'qiladi.", "Researchers from MIT and the University of Chicago (Anderson and Simester) sold the same dress in a catalogue at $34, $39 and $44: the <b>$39</b> version sold best — even better than the cheaper one. A \"9\" reads like a sale signal.") +
 '</div>' +
 quote("🧾 <b>Menyuda amaliyot:</b> eng qimmat «Oilaviy set» (langar) birinchi turadi, «Talaba seti» esa uning yonida arzon va foydali ko'rinadi. Narx 25 000 o'rniga <b>24 900</b>, «so'm» belgisi kichik. Lekin narx <b>rost</b> bo'lishi shart: oldin sun'iy oshirib, keyin «chegirma» qilish — aldash.",
       "🧾 <b>On a menu:</b> the most expensive \"Family set\" (the anchor) comes first, so the \"Student set\" next to it looks cheap and good value. The price is <b>24,900</b> instead of 25,000, with a small currency sign. But prices must be <b>honest</b>: inflating a price only to announce a \"discount\" is deception."))

# ============================ 11. TANLOV VA FREYMING ============================
slide("Tanlov va freyming", "Choice and framing",
 E("span", "2.4 · Kamroq — ko'proq", "2.4 · Less is more", 'class="kicker"') +
 E("h2", "Ko'p tanlov qarorni <span class=\"grad\">to'xtatadi</span>, so'z esa <span class=\"grad\">ma'noni o'zgartiradi</span>", "Too much choice <span class=\"grad\">stops</span> decisions, and wording <span class=\"grad\">changes meaning</span>") +
 '<div class="grid g2">' +
 card_ul("orange", "🍓", "Murabbo tajribasi (2000)", "The jam study (2000)",
         [("<b>Sheena Iyengar va Mark Lepper</b> do'konda ta'tib ko'rish stoli qo'yishdi.", "<b>Sheena Iyengar and Mark Lepper</b> set up a tasting table in a store."),
          ("<b>24 xil</b> murabbo: o'tganlarning 60%i to'xtadi, lekin atigi <b>3%</b>i sotib oldi.", "<b>24 kinds</b> of jam: 60% of passers-by stopped but only <b>3%</b> bought."),
          ("<b>6 xil</b> murabbo: 40%i to'xtadi, ulardan <b>30%</b>i sotib oldi.", "<b>6 kinds</b>: 40% stopped and <b>30%</b> of them bought."),
          ("Xulosa: tanlov ko'p bo'lsa, odam qaror qilolmay <b>keyinga qoldiradi</b>.", "Lesson: with too many options people <b>put the decision off</b>.")]) +
 card_ul("blue", "🥩", "Freyming: 75% yog'siz", "Framing: 75% lean",
         [("<b>Levin va Geyt</b> (1988) bir xil go'shtni ikki xil yorliq bilan ko'rsatishdi.", "<b>Levin and Gaeth</b> (1988) showed the same beef with two labels."),
          ("«<b>75% yog'siz</b>» yozilganini odamlar sifatliroq va sog'lomroq deb baholadi.", "\"<b>75% lean</b>\" was rated higher in quality and healthier."),
          ("«<b>25% yog'li</b>» — aynan o'sha go'sht — yomonroq baholandi.", "\"<b>25% fat</b>\" — exactly the same meat — was rated worse."),
          ("Xulosa: bir xil fakt, boshqa <b>ramka</b> — boshqa his.", "Lesson: the same fact in another <b>frame</b> feels different.")]) +
 '</div>' +
 table([("Ramka", "Frame"), ("Kuchsizroq", "Weaker"), ("Kuchliroq", "Stronger")], [
  [TD("Yo'qotishdan qo'rqish", "Loss aversion"), TD("«Quyosh paneli bilan tejaysiz»", "\"Save with solar panels\""), TD("«Panelsiz har oy 180 000 so'mni <b>yo'qotyapsiz</b>»", "\"Without panels you <b>lose</b> 180,000 so'm every month\"")],
  [TD("Kichik bo'lak", "Small slices"), TD("«Yillik obuna 1 200 000 so'm»", "\"Annual subscription 1,200,000 so'm\""), TD("«Kuniga 3 300 so'm — bir choy narxi»", "\"3,300 so'm a day — the price of a tea\"")],
  [TD("Uchta paket", "Three packages"), TD("12 ta tarif ro'yxati", "A list of 12 plans"), TD("«Boshlang'ich · <b>Ommabop</b> · Premium» — o'rtadagisi belgilangan", "\"Basic · <b>Popular</b> · Premium\" — the middle one highlighted")]]) +
 quote("🎯 <b>Qoida:</b> sahifada <b>3 tadan ko'p bo'lmagan</b> asosiy variant, bittasi «tavsiya etiladi» deb belgilangan. Mijozga «qaysi biri menga mos?» degan savolga javob bering — tanlovni osonlashtirish ham xizmat.",
       "🎯 <b>The rule:</b> <b>no more than three</b> main options on a page, one marked \"recommended\". Answer the customer's question \"which one suits me?\" — making the choice easy is part of the service."))

# ============================ 12. HISSIYOT VA HIKOYA ============================
slide("Hissiyot va hikoya", "Emotion and story",
 E("span", "3-blok · Brend", "Block 3 · The brand", 'class="kicker"') +
 E("h2", "Odamlar faktni unutadi, <span class=\"grad\">hikoyani eslab qoladi</span>", "People forget facts but <span class=\"grad\">remember stories</span>") +
 E("div", "<b>Storitelling</b> — mahsulotni qahramon, muammo va o'zgarish bor hikoya orqali ko'rsatish. Hikoyada mijoz o'zini <b>qahramon</b> o'rnida ko'radi, brend esa unga yo'l ko'rsatuvchi <b>yordamchi</b> bo'ladi. Hissiyotli reklama esda uzoqroq qoladi va brendga <b>munosabat</b> yaratadi.",
   "<b>Storytelling</b> shows a product through a story with a hero, a problem and a change. The customer sees themselves as the <b>hero</b>, and the brand becomes the <b>guide</b> who helps. Emotional ads stay in memory longer and build an <b>attitude</b> towards the brand.", 'class="def"') +
 '<div class="grid g2" style="margin-top:16px">' +
 card("orange", "👟", "Nike — «Just Do It» (1988)", "Nike — \"Just Do It\" (1988)", "Birinchi videoda 80 yoshli yuguruvchi Uolt Stek har kuni 17 milya yugurishini aytadi. Nike krossovka emas, <b>«sen ham qila olasan»</b> degan hisni sotdi. Keyingi 10 yilda sotuv taxminan $0,9 mlrd dan $9,2 mlrd ga o'sgani keltiriladi.", "The first film shows 80-year-old Walt Stack, who runs 17 miles every morning. Nike sold not trainers but the feeling <b>\"you can do it too\"</b>. Sales are commonly cited as growing from about $0.9 billion to $9.2 billion over the next decade.") +
 card("blue", "🍎", "Apple — «1984»", "Apple — \"1984\"", "1984-yil Super Bowl paytida rejissyor Ridli Skott suratga olgan rolik efirga chiqdi: kulrang olomon orasidan yugurib kelgan qiz «Katta og'a» ekranini sindiradi. Kompyuter <b>erkinlik ramzi</b> sifatida sotildi.", "During the 1984 Super Bowl a film by director Ridley Scott aired: a young woman runs through a grey crowd and smashes \"Big Brother's\" screen. A computer was sold as <b>a symbol of freedom</b>.") +
 card("pink", "🪞", "Dove — «Haqiqiy go'zallik eskizlari» (2013)", "Dove — \"Real Beauty Sketches\" (2013)", "Rassom ayollarni avval o'zlari aytgan ta'rif, keyin begona odam ta'rifi bo'yicha chizadi; ikkinchi rasm har doim chiroyliroq. Xulosa: «Siz o'ylaganingizdan go'zalroqsiz». Video bir oyda <b>100 mln</b> dan ortiq ko'rilgan.", "An artist draws women first from their own description, then from a stranger's; the second portrait is always lovelier. The message: \"You are more beautiful than you think.\" The video passed <b>100 million</b> views in its first month.") +
 card("green", "🏡", "Mahalliy hikoya", "A local story", "Termizlik asalarichi: «Bobom 1970-yillarda Boysunda boshlagan ish, bugun nevaralar davom ettirmoqda». <b>Haqiqiy</b> yuzlar, joylar va sanalar — eng arzon va eng ishonchli hikoya.", "A Termez beekeeper: \"My grandfather started this in Boysun in the 1970s; today his grandchildren carry it on.\" <b>Real</b> faces, places and dates make the cheapest and most credible story.") +
 '</div>' +
 quote("🧭 <b>Hikoya qolipi (3 qism):</b> ① Qahramon va uning muammosi → ② Yordamchi (brend) va reja → ③ O'zgarish: oldin / keyin. Mijoz qahramon, siz esa yo'l ko'rsatuvchi bo'ling.",
       "🧭 <b>A story template (three parts):</b> ① The hero and their problem → ② The guide (the brand) and a plan → ③ The change: before / after. Let the customer be the hero and the brand the guide."))

# ============================ 13. BREND BELGILARI ============================
slide("Brend xotirasi: logo, rang, ovoz", "Brand memory: logo, colour, sound",
 E("span", "3.2 · Taniladigan belgilar", "3.2 · Recognisable assets", 'class="kicker"') +
 E("h2", "Mijoz brendni <span class=\"grad\">o'qimasdan</span> taniydi", "Customers recognise a brand <span class=\"grad\">without reading</span>") +
 E("div", "<b>Brend belgilari</b> — logotip, rang, shrift, qahramon, ovoz, shior va qadoq shakli. Ular <b>1-tizim</b> uchun yorliq: mijoz tokchaga qarab bir soniyada «o'sha» mahsulotni topadi. Psixolog <b>Robert Zayons</b> (1968) ko'rsatgan <b>«oddiy tanishlik effekti»</b>ga ko'ra, odam ko'p ko'rgan belgini ko'proq yoqtiradi — shuning uchun belgilar <b>yillar davomida o'zgarmay</b> takrorlanadi.",
   "<b>Brand assets</b> are the logo, colour, typeface, character, sound, slogan and pack shape. They are shortcuts for <b>System 1</b>: a glance at the shelf is enough to find \"that\" product. Psychologist <b>Robert Zajonc</b> (1968) described the <b>mere exposure effect</b>: people like what they have seen often — which is why assets are repeated <b>unchanged for years</b>.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("orange", "✔️", "Nike «svush» — $35", "Nike's swoosh — $35", "1971-yilda dizayn talabasi <b>Kerolin Devidson</b> chizgan va $35 olgan. Belgi shunchalik kuchli bo'ldiki, bugun Nike ko'pincha logotipni <b>nomsiz</b> ishlatadi.", "Drawn in 1971 by design student <b>Carolyn Davidson</b>, who was paid $35. The mark became so strong that Nike often uses it <b>without the name</b>.") +
 card("red", "🥤", "Coca-Cola", "Coca-Cola", "Qizil rang, 1886-yildan beri deyarli o'zgarmagan qo'lyozma shrift va 1915-yilgi <b>bel shaklidagi shisha</b> — qorong'ida ham qo'l bilan tanilsin deb yaratilgan.", "The red, a script that has barely changed since 1886, and the 1915 <b>contour bottle</b> — designed to be recognised by touch even in the dark.") +
 card("blue", "🔊", "Ovoz va shior", "Sound and slogan", "Intelning 1994-yildan beri yangraydigan 5 notali ovozi, McDonald's'ning «I'm lovin' it» kuyi — ular ko'zni yumib ham taniladi.", "Intel's five-note chime, heard since 1994, and McDonald's \"I'm lovin' it\" jingle are recognised with your eyes closed.") +
 '</div>' +
 table([("Logotip turi", "Logo type"), ("Nima", "What it is"), ("Misollar", "Examples")], [
  [TD("<b>So'z-belgi</b>", "<b>Wordmark</b>"), TD("Faqat nom, maxsus shriftda", "The name alone, in a special typeface"), TD("Google, Coca-Cola, Visa", "Google, Coca-Cola, Visa")],
  [TD("<b>Harf-belgi</b>", "<b>Lettermark</b>"), TD("Bosh harflar (monogramma)", "Initials (a monogram)"), TD("IBM, HBO, LG", "IBM, HBO, LG")],
  [TD("<b>Ramz</b>", "<b>Symbol</b>"), TD("Tanish narsa rasmi yoki mavhum shakl", "A picture of a thing or an abstract shape"), TD("Apple olmasi, Nike svushi", "Apple's apple, Nike's swoosh")],
  [TD("<b>Maskot</b>", "<b>Mascot</b>"), TD("Brend qahramoni", "A brand character"), TD("KFC polkovnigi, Michelin odamchasi", "The KFC colonel, the Michelin Man")],
  [TD("<b>Emblema / aralash</b>", "<b>Emblem / combination</b>"), TD("Ramz va nom birga yoki muhr ichida", "Symbol and name together or inside a badge"), TD("Starbucks, Burger King", "Starbucks, Burger King")]]))

# ============================ 14. YAXSHI LOGOTIP ============================
slide("Yaxshi logotip qoidalari", "The rules of a good logo",
 E("span", "3.3 · Topshiriqqa tayyorgarlik", "3.3 · Getting ready for the assignment", 'class="kicker"') +
 E("h2", "Yaxshi logotipning <span class=\"grad\">5 ta belgisi</span>", "Five signs of <span class=\"grad\">a good logo</span>") +
 '<div class="grid g5">' +
 card("green", "1️⃣", "Sodda", "Simple", "Bir qarashda tushuniladi va 5 soniyada qo'lda qayta chizish mumkin.", "Understood at a glance; can be redrawn by hand in five seconds.") +
 card("blue", "2️⃣", "Esda qoladigan", "Memorable", "Bitta o'ziga xos g'oya: kutilmagan shakl, yashirin ma'no yoki o'yin.", "One distinctive idea: an unexpected shape, a hidden meaning or a play.") +
 card("violet", "3️⃣", "Moslashuvchan", "Versatile", "Oq-qora rangda, 16 piksellik belgida va katta peshlavhada ham o'qiladi.", "Works in black and white, as a 16-pixel icon and on a big shop sign.") +
 card("orange", "4️⃣", "Mos", "Appropriate", "Biznes, mijoz va brend xarakteriga mos: bolalar bog'chasi va advokat logotipi farq qiladi.", "Fits the business, the customer and the brand's character: a nursery and a law firm differ.") +
 card("pink", "5️⃣", "Vaqtga chidamli", "Timeless", "Moda effektlariga (soya, gradient, 10 xil rang) tayanmaydi — 10 yildan keyin ham eskirmaydi.", "Does not rely on trendy effects (shadows, gradients, ten colours) — still fresh ten years later.") +
 '</div>' +
 '<div class="grid g2" style="margin-top:16px">' +
 card_ul("blue", "💡", "Mashhur g'oyalar", "Famous ideas",
         [("<b>FedEx</b> (1994): E va x harflari orasidagi bo'sh joyda yashirin <b>o'q</b> — tezlik va aniqlik.", "<b>FedEx</b> (1994): a hidden <b>arrow</b> in the space between E and x — speed and precision."),
          ("<b>Amazon</b>: «a» dan «z» gacha cho'zilgan <b>tabassum</b> — hamma narsa bor va mijoz xursand.", "<b>Amazon</b>: a <b>smile</b> running from \"a\" to \"z\" — everything is there and the customer is happy."),
          ("<b>«I ❤ NY»</b> (1977, Milton Glaser): ikki harf va yurak — dunyodagi eng ko'p ko'chirilgan belgilardan biri.", "<b>\"I ❤ NY\"</b> (1977, Milton Glaser): two letters and a heart — one of the most copied marks in the world."),
          ("<b>Apple</b> (1977, Rob Yanov): tishlangan olma — uni gilos bilan adashtirmaslik uchun.", "<b>Apple</b> (1977, Rob Janoff): a bite out of the apple — so nobody mistakes it for a cherry.")]) +
 card_ul("orange", "🎨", "Rang va shrift", "Colour and type",
         [("Ranglar soni — <b>1–3 ta</b>. Rangning ma'nosi madaniyatga bog'liq; eng muhimi — brend xarakteriga mosligi.", "Use <b>one to three</b> colours. Colour meaning depends on culture; what matters most is fitting the brand's character."),
          ("Ko'k — ishonch (bank, IT), yashil — tabiat va salomatlik, qizil/to'q sariq — ishtaha va energiya, qora — hashamat.", "Blue — trust (banks, IT), green — nature and health, red/orange — appetite and energy, black — luxury."),
          ("Shrift xarakter beradi: ingichka — nafis, qalin — kuchli, yumaloq — do'stona.", "Type sets the character: thin — elegant, bold — strong, rounded — friendly."),
          ("Tekshiruv: logotipni <b>oq-qora</b> qilib, telefon belgisi o'lchamigacha kichraytiring — tanilsa, yaxshi.", "Test: make the logo <b>black and white</b> and shrink it to app-icon size — if it is still recognisable, it works.")]) +
 '</div>' +
 E("small", "❌ Boshqa brendning logotipini ko'chirish yoki ozgina o'zgartirish — mualliflik va tovar belgisi huquqini buzish. Internetdan olingan tayyor rasm ham sizning ishingiz emas.",
   "❌ Copying another brand's logo or changing it slightly breaks copyright and trademark law. A ready-made picture from the internet is not your work either.", 'class="note"'))

# ============================ 15. KANALLAR ============================
slide("Kanallar va nishonlash", "Channels and targeting",
 E("span", "4-blok · Qayerda gapiramiz?", "Block 4 · Where do we speak?", 'class="kicker"') +
 E("h2", "Mijoz qayerda bo'lsa, <span class=\"grad\">reklama o'sha yerda</span>", "Where the customer is, <span class=\"grad\">the ad must be</span>") +
 table([("Kanal", "Channel"), ("Kuchli tomoni", "Strength"), ("Kimga mos", "Best for"), ("E'tibor bering", "Watch out")], [
  [TD("📢 <b>Telegram kanallari</b>", "📢 <b>Telegram channels</b>"), TD("O'zbekistonda juda keng auditoriya; shahar va qiziqish bo'yicha kanallar", "A very wide audience in Uzbekistan; channels by city and interest"), TD("Mahalliy xizmatlar, kurslar, aksiyalar", "Local services, courses, promotions"), TD("Kanal obunachilari «tirik»mi — ko'rishlar soniga qarang", "Are subscribers real? Check the view counts")],
  [TD("📸 <b>Instagram / TikTok</b>", "📸 <b>Instagram / TikTok</b>"), TD("Vizual mahsulotlar, qisqa video, yosh auditoriya, aniq nishonlash", "Visual products, short video, young audience, precise targeting"), TD("Kiyim, ovqat, go'zallik, ta'lim", "Clothes, food, beauty, education"), TD("Birinchi 2 soniya hal qiladi", "The first two seconds decide everything")],
  [TD("🔎 <b>Google / Yandex qidiruv</b>", "🔎 <b>Google / Yandex search</b>"), TD("Odam allaqachon qidiryapti — <b>tayyor talab</b>", "The person is already searching — <b>ready demand</b>"), TD("Ta'mirlash, shifokor, ijaralar", "Repairs, doctors, rentals"), TD("Kalit so'zlarni to'g'ri tanlash", "Choosing keywords well")],
  [TD("▶️ <b>YouTube</b>", "▶️ <b>YouTube</b>"), TD("Uzun tushuntirish, ko'rsatma, ishonch", "Long explanations, tutorials, trust"), TD("Murakkab va qimmat mahsulotlar", "Complex and expensive products"), TD("Sifatli ovoz va birinchi 5 soniya", "Good sound and the first five seconds")],
  [TD("🪧 <b>Banner, radio, peshlavha</b>", "🪧 <b>Billboards, radio, shop signs</b>"), TD("Shahar bo'ylab keng qamrov", "Broad reach across the city"), TD("Do'kon, restoran, avtosalon", "Shops, restaurants, car dealers"), TD("Natijani o'lchash qiyin — maxsus promokod qo'ying", "Hard to measure — add a special promo code")],
  [TD("🗣 <b>Og'zaki tavsiya</b>", "🗣 <b>Word of mouth</b>"), TD("Eng ishonchli va eng arzon", "The most trusted and the cheapest"), TD("Har qanday biznes", "Any business"), TD("Faqat haqiqatan yaxshi xizmatda ishlaydi", "Works only when the service is truly good")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("violet", "🎯", "Nishonlash (targeting)", "Targeting", "Reklamani <b>hammaga emas</b>, kerakli odamga ko'rsatish: shahar, yosh, qiziqish, til. «Termiz, 17–24 yosh, IELTS ga qiziqadi» — «butun O'zbekiston»dan arzon va samaraliroq.", "Showing the ad <b>not to everyone</b> but to the right people: city, age, interests, language. \"Termez, 17–24, interested in IELTS\" is cheaper and more effective than \"all of Uzbekistan\".") +
 card("green", "🔁", "Retargeting", "Retargeting", "Saytingizga kirgan yoki savatchani tashlab ketgan odamga reklamani <b>qayta</b> ko'rsatish. U sizni allaqachon taniydi — konversiya bir necha barobar yuqori bo'ladi.", "Showing the ad <b>again</b> to people who visited your site or left their cart. They already know you, so conversion is several times higher.") +
 '</div>')

# ============================ 16. KAM BYUDJET ============================
slide("Kam byudjet, katta shov-shuv", "A small budget, a big buzz",
 E("span", "4.2 · Ijodkorlik puldan kuchli", "4.2 · Creativity beats money", 'class="kicker"') +
 E("h2", "Kichik pul bilan <span class=\"grad\">katta natija</span> olganlar", "Those who got <span class=\"grad\">big results</span> with little money") +
 '<div class="grid g2">' +
 card("blue", "🪒", "Dollar Shave Club (2012)", "Dollar Shave Club (2012)", "Asoschi Maykl Dubin o'zi suratga tushgan kulgili video taxminan <b>$4 500</b> ga tushgan. Birinchi <b>48 soatda 12 000</b> buyurtma keldi. 2016-yilda Unilever kompaniyani taxminan <b>$1 mlrd</b> ga sotib oldi. Siri: hazil + aniq va'da («oyiga bir necha dollar, uyga yetkazamiz»).", "A funny video starring founder Michael Dubin cost about <b>$4,500</b>. In the first <b>48 hours 12,000</b> orders came in. In 2016 Unilever bought the company for about <b>$1 billion</b>. The secret: humour plus a clear promise (\"a few dollars a month, delivered home\").") +
 card("orange", "🌀", "Blendtec — «Will It Blend?» (2006)", "Blendtec — \"Will It Blend?\" (2006)", "Kompaniya rahbari blenderda iPhone, sharlar va hatto tirnoqlarni maydalab ko'rsatdi. Mahsulot kuchi <b>ko'z oldida isbotlandi</b>; rahbar aytishicha, sotuv bir necha barobar oshgan. Reklama — namoyish.", "The company's boss blended iPhones, marbles and rakes on camera. The product's power was <b>proved before your eyes</b>; according to him, sales multiplied. The ad was a demonstration.") +
 card("red", "🪂", "Red Bull Stratos (2012)", "Red Bull Stratos (2012)", "Feliks Baumgartner 39 km balandlikdan sakradi; YouTube'dagi jonli efirni bir vaqtda <b>8 mln</b> ga yaqin odam ko'rdi. Red Bull ichimlikni emas, «<b>qanot beradi</b>» degan g'oyani ko'rsatdi.", "Felix Baumgartner jumped from 39 km up; nearly <b>8 million</b> people watched the YouTube live stream at once. Red Bull showed not a drink but the idea that it \"<b>gives you wings</b>\".") +
 card("green", "🧊", "Muzli chelak (2014)", "The Ice Bucket Challenge (2014)", "Odamlar boshidan muzli suv quyib, 3 do'stini chaqirdi. ALS assotsiatsiyasi taxminan 8 haftada <b>$115 mln</b> xayriya oldi. Ijtimoiy isbot + o'yin + do'stlarni chaqirish = virus kabi tarqalish.", "People poured iced water over their heads and nominated three friends. The ALS Association raised about <b>$115 million</b> in roughly eight weeks. Social proof + a game + nominating friends = viral spread.") +
 '</div>' +
 quote("💡 <b>Termizda nima qilish mumkin?</b> Nonvoyxona — «tandirdan to'g'ridan-to'g'ri» jonli efir; ta'mirlash ustasi — «oldin / keyin» videolari; kurs — bitiruvchining 30 soniyalik hikoyasi; kafe — talabalar uchun «imtihon menyusi». Asosiy resurs — <b>g'oya va halollik</b>, byudjet emas.",
       "💡 <b>What could work in Termez?</b> A bakery — a live stream \"straight from the tandoor\"; a repairman — \"before / after\" videos; a course — a 30-second story by a graduate; a café — an \"exam menu\" for students. The key resource is <b>an idea and honesty</b>, not the budget."))

# ============================ 17. RAQAMLAR ============================
slide("Reklama raqamlari", "Advertising numbers",
 E("span", "4.3 · O'lchanmagan narsa boshqarilmaydi", "4.3 · What isn't measured isn't managed", 'class="kicker"') +
 E("h2", "«Pulimning yarmi behuda ketadi, <span class=\"grad\">lekin qaysi yarmi?»</span>", "\"Half my money is wasted — <span class=\"grad\">but which half?\"</span>") +
 E("div", "Bu gap XIX asr oxiridagi amerikalik savdogar <b>Jon Uonamekerga</b> nisbat beriladi. Bugun raqamli reklama har bir so'm qayerga ketganini ko'rsatadi — faqat <b>to'g'ri ko'rsatkichlarni</b> hisoblash kerak.",
   "The line is attributed to the 19th-century American merchant <b>John Wanamaker</b>. Today digital advertising shows where every so'm went — as long as you track <b>the right numbers</b>.", 'class="def"') +
 table([("Ko'rsatkich", "Measure"), ("Formula", "Formula"), ("Termizdagi kafe (o'quv misoli)", "A Termez café (teaching example)")], [
  [TD("<b>Ko'rishlar</b>", "<b>Impressions</b>"), TD("Reklama necha marta ko'rsatildi", "How many times the ad was shown"), TD("40 000", "40,000")],
  [TD("<b>CTR</b> — bosish ulushi", "<b>CTR</b> — click-through rate"), TD("Bosishlar ÷ ko'rishlar × 100%", "Clicks ÷ impressions × 100%"), TD("800 ÷ 40 000 = <b>2%</b>", "800 ÷ 40,000 = <b>2%</b>")],
  [TD("<b>CPC</b> — bir bosish narxi", "<b>CPC</b> — cost per click"), TD("Byudjet ÷ bosishlar", "Budget ÷ clicks"), TD("600 000 ÷ 800 = <b>750 so'm</b>", "600,000 ÷ 800 = <b>750 so'm</b>")],
  [TD("<b>Konversiya</b>", "<b>Conversion</b>"), TD("Buyurtmalar ÷ bosishlar × 100%", "Orders ÷ clicks × 100%"), TD("40 ÷ 800 = <b>5%</b>", "40 ÷ 800 = <b>5%</b>")],
  [TD("<b>CAC</b> — mijoz jalb qilish narxi", "<b>CAC</b> — customer acquisition cost"), TD("Byudjet ÷ yangi mijozlar", "Budget ÷ new customers"), TD("600 000 ÷ 40 = <b>15 000 so'm</b>", "600,000 ÷ 40 = <b>15,000 so'm</b>")],
  [TD("<b>ROAS</b> — reklama qaytimi", "<b>ROAS</b> — return on ad spend"), TD("Reklamadan tushum ÷ byudjet", "Revenue from ads ÷ budget"), TD("40 × 60 000 = 2,4 mln ÷ 0,6 mln = <b>4</b>", "40 × 60,000 = 2.4m ÷ 0.6m = <b>4</b>")]]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("green", "✅", "Foyda bormi?", "Is there a profit?", "Ustama (marja) 40% bo'lsa: 2 400 000 × 0,4 = 960 000 so'm yalpi foyda − 600 000 reklama = <b>+360 000 so'm</b>. Reklama o'zini oqladi.", "With a 40% margin: 2,400,000 × 0.4 = 960,000 so'm gross profit − 600,000 for ads = <b>+360,000 so'm</b>. The ad paid off.") +
 card("orange", "⚖️", "Zararsiz ROAS", "Break-even ROAS", "Zararsiz ROAS = 1 ÷ marja = 1 ÷ 0,4 = <b>2,5</b>. ROAS 2,5 dan past bo'lsa, reklama ko'p sotsa ham <b>zarar</b> keltiradi. Har kampaniyadan oldin shu chegarani bilib oling.", "Break-even ROAS = 1 ÷ margin = 1 ÷ 0.4 = <b>2.5</b>. Below 2.5 an ad <b>loses money</b> even if it sells a lot. Know this line before every campaign.") +
 '</div>')

# ============================ 18. A/B TEST ============================
slide("A/B test: taxmin emas, tajriba", "A/B testing: experiments, not guesses",
 E("span", "4.4 · Qaysi biri yaxshiroq?", "4.4 · Which one is better?", 'class="kicker"') +
 E("h2", "Ikki variant, bitta farq — <span class=\"grad\">raqam hal qiladi</span>", "Two versions, one difference — <span class=\"grad\">the numbers decide</span>") +
 E("div", "<b>A/B test</b> — auditoriyani tasodifiy ikki guruhga bo'lib, biriga A variantni, ikkinchisiga B variantni ko'rsatish va natijani solishtirish. Bir vaqtda faqat <b>bitta</b> narsa o'zgartiriladi (sarlavha, rasm, tugma yoki narx), aks holda qaysi o'zgarish ta'sir qilganini bilib bo'lmaydi.",
   "An <b>A/B test</b> splits the audience at random into two groups, shows version A to one and version B to the other, and compares the results. Only <b>one</b> thing changes at a time (headline, picture, button or price); otherwise you cannot tell which change made the difference.", 'class="def"') +
 '<div class="grid g2" style="margin-top:16px">' +
 card_ul("blue", "🇺🇸", "Dunyo misoli: 2008-yilgi saylov sayti", "A global example: a 2008 campaign site",
         [("Barak Obama kampaniyasi sayt bosh sahifasida 4 ta tugma va 6 ta rasm/videoni sinadi.", "Barack Obama's campaign tested four buttons and six images or videos on its home page."),
          ("G'olib: oilaviy surat va «<b>Learn More</b>» («Batafsil») tugmasi.", "The winner: a family photo and a \"<b>Learn More</b>\" button."),
          ("Ro'yxatdan o'tish <b>40,6%</b> ga oshdi — jamoa ma'lumotiga ko'ra, bu millionlab qo'shimcha obunachi degani.", "Sign-ups rose by <b>40.6%</b> — millions of extra subscribers, according to the team."),
          ("Jamoa eng ko'p yoqtirgan video aslida <b>yomonroq</b> ishlagan — his emas, raqam hal qiladi.", "The video the team liked best actually did <b>worse</b> — numbers decide, not taste.")]) +
 card_ul("green", "📍", "Mahalliy misol: Telegram posti", "A local example: a Telegram post",
         [("A: «Yangi menyu! Keling!» — 1 000 ko'rishdan <b>12</b> buyurtma (1,2%).", "A: \"New menu! Come by!\" — <b>12</b> orders from 1,000 views (1.2%)."),
          ("B: «Birinchi qahva — bizdan: kassada «TERDU» deng» — 1 000 dan <b>31</b> buyurtma (3,1%).", "B: \"Your first coffee is on us: say 'TERDU' at the till\" — <b>31</b> orders from 1,000 (3.1%)."),
          ("B variant 2,5 barobar yaxshi — keyingi postlar shu uslubda yoziladi.", "B is 2.5 times better — the next posts follow its style."),
          ("Keyingi testda faqat <b>rasm</b> almashtiriladi, matn o'sha qoladi.", "The next test changes only the <b>picture</b>; the text stays the same.")]) +
 '</div>' +
 quote("📏 <b>Uchta qoida:</b> ① bitta o'zgarish; ② har variantga yetarli odam (kamida bir necha yuz ko'rish); ③ g'olibni oldindan belgilangan ko'rsatkich (masalan, buyurtma) bo'yicha tanlash — «layk» bo'yicha emas.",
       "📏 <b>Three rules:</b> ① one change; ② enough people per version (at least a few hundred views); ③ pick the winner by a measure set in advance (for example, orders) — not by likes."))

# ============================ 19. HALOL REKLAMA ============================
slide("Halol reklama", "Honest advertising",
 E("span", "5-blok · Chegara qayerda?", "Block 5 · Where is the line?", 'class="kicker"') +
 E("h2", "Ishontirish — <span class=\"grad\">ha</span>, aldash — <span class=\"grad\">yo'q</span>", "Persuasion — <span class=\"grad\">yes</span>, deception — <span class=\"grad\">no</span>") +
 E("div", "<b>Ishontirish</b> mijozga haqiqatni tushunarli va qiziqarli qilib ko'rsatadi. <b>Manipulyatsiya</b> esa uning psixologiyasidan foydalanib, <b>o'z manfaatiga qarshi</b> qaror qildiradi. Interfeysdagi bunday hiylalar <b>«qorong'i patternlar»</b> (<i>dark patterns</i>) deb ataladi.",
   "<b>Persuasion</b> shows the customer the truth in a clear and interesting way. <b>Manipulation</b> uses their psychology to make them decide <b>against their own interest</b>. Such tricks in an interface are called <b>dark patterns</b>.", 'class="def"') +
 '<div class="grid g2" style="margin-top:16px">' +
 card_ul("red", "🚫", "Qorong'i patternlar", "Dark patterns",
         [("Har kirganda qaytadan boshlanadigan <b>soxta taymer</b>", "A <b>fake timer</b> that restarts on every visit"),
          ("Uydirma sharhlar va sotib olingan «obunachilar»", "Invented reviews and bought \"followers\""),
          ("Oxirgi qadamda chiqadigan <b>yashirin to'lovlar</b>", "<b>Hidden fees</b> that appear at the last step"),
          ("Obunani bekor qilishni ataylab qiyinlashtirish", "Making it deliberately hard to cancel"),
          ("«Yo'q, menga chegirma kerak emas» kabi uyaltiruvchi tugmalar", "Shaming buttons like \"No, I don't like saving money\"")]) +
 card_ul("green", "✅", "Halol muqobili", "The honest alternative",
         [("Aksiya muddati aniq sana bilan: «30-noyabrgacha»", "A promotion with a real date: \"until 30 November\""),
          ("Haqiqiy sharhlar, salbiylariga ham javob berilgan", "Real reviews, with replies even to negative ones"),
          ("Yakuniy narx (yetkazish bilan) birinchi ekrandayoq", "The final price (with delivery) on the first screen"),
          ("Bekor qilish — obuna bo'lishdek oson", "Cancelling is as easy as subscribing"),
          ("Hurmatli rad etish: «Hozir emas»", "A respectful decline: \"Not now\"")]) +
 '</div>' +
 '<div class="grid g2" style="margin-top:14px">' +
 card("orange", "🐂", "Red Bull: «qanot» (2014)", "Red Bull: \"wings\" (2014)", "AQShda xaridorlar ichimlik «qanot bermagani» va energiya va'dalari isbotlanmagani uchun sudga berdi. Kompaniya aybni tan olmasdan <b>$13 mln</b> to'lab kelishdi: hatto hazil shior ham <b>isbotlanmagan va'da</b>ga aylanishi mumkin.", "In the US customers sued because the drink's energy claims were not proven. Without admitting fault, the company settled for <b>$13 million</b>: even a joking slogan can turn into an <b>unproven promise</b>.") +
 card("blue", "🚙", "Volkswagen: «toza dizel» (2015)", "Volkswagen: \"clean diesel\" (2015)", "Kompaniya dizel dvigatellarini «toza» deb reklama qilgan, sinovlarni esa maxsus dastur bilan aldagan. AQShda kelishuvlar <b>o'n milliardlab dollarga</b> tushdi, brend ishonchi yillar davomida tiklandi.", "The company advertised its diesels as \"clean\" while cheating emissions tests with special software. Settlements in the US cost <b>tens of billions of dollars</b>, and trust took years to rebuild.") +
 '</div>' +
 E("small", "📜 O'zbekistonda reklama «Reklama to'g'risida»gi qonun, iste'molchilar huquqlarini himoya qilish va shaxsga doir ma'lumotlar to'g'risidagi qonunlar bilan tartibga solinadi: noto'g'ri, yashirin va insofsiz reklama taqiqlanadi; dori, alkogol, tamaki va bolalarga mo'ljallangan reklama uchun qo'shimcha talablar bor. Amaldagi tahrirni <a class=\"lnk\" href=\"https://lex.uz\" target=\"_blank\" rel=\"noopener\">lex.uz</a> da tekshiring.",
   "📜 In Uzbekistan advertising is regulated by the Law \"On Advertising\" and the laws on consumer protection and personal data: false, hidden and unfair advertising is banned, and ads for medicines, alcohol, tobacco and children have extra rules. Check the current version on <a class=\"lnk\" href=\"https://lex.uz\" target=\"_blank\" rel=\"noopener\">lex.uz</a>.", 'class="note"'))

# ============================ 20. YETKAZISH ============================
slide("Va'dani yetkazish", "Delivering the promise",
 E("span", "5.2 · Reklama tugagan joyda", "5.2 · Where the ad ends", 'class="kicker"') +
 E("h2", "Eng yaxshi reklama — <span class=\"grad\">bajarilgan va'da</span>", "The best advertising is <span class=\"grad\">a promise kept</span>") +
 E("div", "Reklama va'da beradi, <b>yetkazish</b> uni tasdiqlaydi yoki buzadi. Kaneman ta'riflagan <b>«cho'qqi va yakun qoidasi»</b>ga ko'ra, odam tajribani uning eng kuchli lahzasi va <b>oxiri</b> bo'yicha eslaydi. Mijoz uchun «oxir» — buyurtma qo'liga tekkan lahza: qadoq, vaqt, kuryerning muomalasi.",
   "Advertising makes a promise; <b>delivery</b> confirms or breaks it. By the <b>peak-end rule</b> Kahneman described, people remember an experience by its strongest moment and its <b>end</b>. For the customer the \"end\" is the moment the order reaches them: the packaging, the timing, the courier's manners.", 'class="def"') +
 table([("Usul", "Method"), ("Qachon qulay", "When it suits"), ("Narx va shartlar", "Cost and terms")], [
  [TD("🚶 <b>Olib ketish</b> (do'kon, punkt)", "🚶 <b>Pick-up</b> (shop, point)"), TD("Mijoz yaqin yashaydi yoki o'zi kelishni afzal ko'radi", "The customer lives nearby or prefers to come"), TD("Eng arzon; ish vaqtini aniq yozing", "Cheapest; state opening hours clearly")],
  [TD("🛵 <b>O'z kuryeringiz</b>", "🛵 <b>Your own courier</b>"), TD("Shahar ichida, tez buzuladigan mahsulot (ovqat, gul)", "Within the city, perishable goods (food, flowers)"), TD("Masofa bo'yicha narx yoki ma'lum summadan bepul", "Price by distance or free above a set amount")],
  [TD("📦 <b>Pochta va kuryerlik xizmatlari</b>", "📦 <b>Post and courier companies</b>"), TD("Viloyatlararo, butun mamlakat bo'ylab", "Between regions, across the country"), TD("Tarif va muddat xizmatga bog'liq; trek-raqam bering", "Rates and times depend on the service; give a tracking number")],
  [TD("🛒 <b>Marketpleys</b>", "🛒 <b>A marketplace</b>"), TD("Katta auditoriya va tayyor topshirish punktlari", "A large audience and ready pick-up points"), TD("Komissiya to'lanadi; reyting va sharhlar muhim", "You pay a commission; ratings and reviews matter")]]) +
 '<div class="grid g3" style="margin-top:14px">' +
 card("blue", "📦", "Zappos", "Zappos", "Onlayn poyabzal do'koni bepul yetkazish va <b>365 kunlik</b> qaytarish va'dasi bilan mashhur bo'ldi: «sinab ko'rish xavfsiz» — reklamaning eng kuchli dalili.", "The online shoe shop became famous for free delivery and <b>365-day</b> returns: \"trying is safe\" was its strongest ad.") +
 card("orange", "⏱", "Kam va'da — ko'p bajar", "Under-promise, over-deliver", "«3 kunda» deb, 2 kunda yetkazsangiz — mijoz xursand. «1 kunda» deb, 3 kunda yetkazsangiz — mahsulot o'sha bo'lsa ham shikoyat keladi.", "Promise \"three days\" and deliver in two — a happy customer. Promise \"one day\" and deliver in three — a complaint, even with the same product.") +
 card("green", "💬", "Shikoyat — imkoniyat", "A complaint is a chance", "Muammo tez va saxiy hal qilinsa, mijoz ba'zan avvalgidan ham sodiqroq bo'ladi (<b>«xizmatni tiklash paradoksi»</b>). Javob — 1 soat ichida, uzr va aniq yechim bilan.", "When a problem is solved quickly and generously, a customer can become even more loyal than before (the <b>service recovery paradox</b>). Reply within an hour, with an apology and a clear fix.") +
 '</div>' +
 quote("🔁 <b>Doira yopiladi:</b> yaxshi yetkazish → mamnun mijoz → haqiqiy sharh va surat → <b>ijtimoiy isbot</b> → keyingi reklama arzonroq va kuchliroq. Yomon yetkazish esa eng qimmat reklamani ham bekor qiladi.",
       "🔁 <b>The circle closes:</b> good delivery → a happy customer → a real review and photo → <b>social proof</b> → the next ad is cheaper and stronger. Bad delivery wastes even the most expensive advertising."))

# ============================ 21. VIDEO ============================
# Video ro'yxati <head> dagi /api/site/quiz?t=m8 skriptidan keladi (window.SQ_VIDEO = [{id, t}]). Platformada (sqEmbed) iframe
# manbasiz qoladi — dvigatel yashirin oynada videoni yuklamaydi; sahifadagi nusxa (NativeSurface) data-yt dan
# youtube-nocookie manzilini o'zi qo'yadi. Video bo'lmasa — joy egasi matni turadi.
_video_js = ("<style>.sq-video .video-wrap{margin:14px auto;max-width:900px}.sq-video iframe{display:block;width:100%;aspect-ratio:16/9;border:0;border-radius:16px;background:#000}.sq-video figcaption{margin-top:6px;text-align:center;font-weight:700;color:var(--muted)}</style>"
             "<script>(function(){var box=document.getElementById('sqVideo');if(!box)return;"
             "var list=(window.SQ_VIDEO||[]).filter(function(v){return v&&/^[A-Za-z0-9_-]{11}$/.test(v.id);});if(!list.length)return;"
             "var embed=/[?&]sqEmbed=/.test(location.search),h='';"
             "function esc(s){return String(s||'').replace(/[&<>\"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});}"
             "list.forEach(function(v){var st=v.s>0?Math.floor(v.s):0;"
             "h+='<figure class=\"video-wrap\">'+(embed?'<iframe data-yt=\"'+v.id+'\"'+(st?' data-yt-start=\"'+st+'\"':''):"
             "'<iframe src=\"https://www.youtube-nocookie.com/embed/'+v.id+'?rel=0'+(st?'&start='+st:'')+'\"')+"
             "' title=\"'+esc(v.t||'YouTube video')+'\" allow=\"accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\" allowfullscreen referrerpolicy=\"strict-origin-when-cross-origin\"></iframe>'+"
             "(v.t?'<figcaption>▶️ '+esc(v.t)+'</figcaption>':'')+'</figure>';});"
             "box.innerHTML=h;box.className='sq-video has-video';})();</script>")
slide("📺 Video dars", "📺 Video lesson",
 E("span", "Ko'ring va tahlil qiling", "Watch and analyse", 'class="kicker"') +
 E("h2", "📺 Video: <span class=\"grad\">reklama psixologiyasi amalda</span>", "📺 Video: <span class=\"grad\">advertising psychology in action</span>") +
 '<div class="sq-video" id="sqVideo">' +
 '<div class="card" style="--c:var(--blue);text-align:center"><span class="icon">🎬</span>' +
 E("h3", "Video tez orada qo'shiladi", "The video is coming soon") +
 E("p", "O'qituvchi YouTube'dan video qo'shganda u aynan shu yerda — sayt ichidagi pleyerda ochiladi. Hozircha quyidagi savollar bilan istalgan mashhur reklama rolikini tahlil qilib ko'ring.",
   "When the teacher adds a YouTube video, it will open right here in the player on the site. Meanwhile, use the questions below to analyse any famous commercial.") + '</div></div>' +
 _video_js +
 '<div class="grid g3" style="margin-top:16px">' +
 card("orange", "🧠", "1. Qaysi tizim?", "1. Which system?", "Video avval his uyg'otadimi (1-tizim) yoki raqam va dalil beradimi (2-tizim)? Birinchi 3 soniyada nima bo'ladi?", "Does the video first stir a feeling (System 1) or give numbers and proof (System 2)? What happens in the first three seconds?") +
 card("violet", "🎯", "2. Qaysi tamoyil?", "2. Which principle?", "Chaldinining 7 tamoyilidan qaysilari ishlatilgan: ijtimoiy isbot, obro‘, tanqislik, yoqimlilik…?", "Which of Cialdini's seven principles are used: social proof, authority, scarcity, liking…?") +
 card("green", "✍️", "3. AIDA va USP", "3. AIDA and USP", "E'tibor, qiziqish, istak va harakat qayerda? Brendning bitta jumlalik va'dasi (USP) nima?", "Where are attention, interest, desire and action? What is the brand's one-sentence promise (USP)?") +
 '</div>')

# ============================ 22. LOGOTIP TOPSHIRIG'I ============================
slide("🎨 Topshiriq: logotip", "🎨 Assignment: a logo",
 E("span", "Amaliy topshiriq · sun'iy intellekt baholaydi", "Practical assignment · graded by AI", 'class="kicker"') +
 E("h2", "🎨 O'z <span class=\"grad\">biznesingiz uchun logotip</span> yarating", "🎨 Create <span class=\"grad\">a logo for your business</span>") +
 E("div", "Har bir talabaga platforma <b>alohida biznes</b> beradi: nomi, faoliyati, mijozlari, xarakteri va logotip qayerda ishlatilishi. Siz shu biznes uchun <b>logotip chizasiz</b> (qog'ozda yoki telefon/kompyuter ilovasida), rasmini yuklaysiz va <b>ta'rif</b> yozasiz: g'oya, ramz, rang va shrift nimani anglatadi. Ishni <b>sun'iy intellekt</b> darhol baholaydi va maslahat beradi, o'qituvchi esa yakuniy bahoni tasdiqlaydi.",
   "The platform gives each student <b>a different business</b>: its name, activity, customers, character and where the logo will be used. You <b>draw a logo</b> for it (on paper or in a phone/computer app), upload a picture and write a <b>description</b>: what the idea, symbol, colours and typeface mean. <b>Artificial intelligence</b> grades the work at once and gives advice, and the teacher confirms the final mark.", 'class="def"') +
 '<div class="grid g2" style="margin-top:16px">' +
 card_ul("blue", "📋", "Talablar", "Requirements",
         [("Logotip <b>o'zingiz chizgan</b> bo'lsin; boshqa brendni ko'chirish — 0 ball.", "The logo must be <b>your own drawing</b>; copying another brand scores 0."),
          ("Biznes nomi yoki bosh harfi o'qilishi kerak; 1–3 ta rang.", "The business name or initial must be readable; one to three colours."),
          ("Rasm: PNG, JPG yoki WEBP, aniq va tekis suratga olingan.", "Picture: PNG, JPG or WEBP, sharp and photographed straight on."),
          ("Ta'rif: kamida 4–5 jumla — ramz, rang, shrift va mijozga mosligi.", "Description: at least four or five sentences — symbol, colours, type and fit with the customers."),
          ("3 marta yuborish mumkin — eng yaxshi natija hisobga olinadi.", "You may submit three times — the best result counts.")]) +
 card_ul("violet", "🏅", "Baholash (10 ball)", "Grading (10 points)",
         [("<b>3</b> — biznesga, mijozlarga va brend xarakteriga mosligi", "<b>3</b> — fit with the business, customers and brand character"),
          ("<b>2</b> — soddalik va esda qolishi", "<b>2</b> — simplicity and memorability"),
          ("<b>2</b> — o'qilishi va kichik o'lchamda / oq-qorada ishlashi", "<b>2</b> — legibility and working small / in black and white"),
          ("<b>1</b> — rang va kompozitsiya", "<b>1</b> — colour and composition"),
          ("<b>2</b> — ta'rif sifati: g'oya aniq va asosli tushuntirilgan", "<b>2</b> — the description: a clear, well-argued idea")]) +
 '</div>' +
 '<p style="text-align:center;margin-top:18px">' +
 E("a", "🎨 Topshiriqni ochish — biznesingizni ko'ring", "🎨 Open the assignment — see your business", 'class="btn accent sq-cta" href="/#topshiriq/m8"') + '</p>' +
 E("small", "🤖 Sun'iy intellekt — yordamchi baholovchi: u xato qilishi mumkin, shuning uchun har bir bahoni o'qituvchi ko'rib chiqadi va o'zgartira oladi.",
   "🤖 The AI is an assistant grader and can make mistakes, so the teacher reviews every mark and can change it.", 'class="note"'))

# ============================ 23. XULOSA ============================
slide("Xulosa va resurslar", "Summary and resources",
 E("span", "Xulosa · Mustaqil ish · Havolalar", "Summary · Independent work · Links", 'class="kicker"') +
 E("h2", "Yakuniy <span class=\"grad\">xulosa</span> va <span class=\"grad\">foydali resurslar</span>", "Final <span class=\"grad\">summary</span> and <span class=\"grad\">useful resources</span>") +
 card_ul("green", "📌", "Esda qoladigan 8 ta fikr", "Eight ideas to remember",
         [("Reklama mahsulotni emas, <b>natija va hisni</b> sotadi: xususiyat → foyda → his.", "Advertising sells <b>a result and a feeling</b>, not a product: feature → benefit → feeling."),
          ("Ko'p qarorni tezkor <b>1-tizim</b> qiladi: bitta rasm, bitta g'oya, tanish belgi.", "Fast <b>System 1</b> makes most decisions: one picture, one idea, a familiar mark."),
          ("<b>AIDA</b>: e'tibor → qiziqish → istak → bitta aniq harakat; <b>USP</b> — bitta jumlalik va'da.", "<b>AIDA</b>: attention → interest → desire → one clear action; the <b>USP</b> is a one-sentence promise."),
          ("7 tamoyil (o'zaro javob, izchillik, ijtimoiy isbot, obro‘, yoqimlilik, tanqislik, birlik) — faqat <b>rost</b> bilan.", "The seven principles (reciprocity, consistency, social proof, authority, liking, scarcity, unity) — only with <b>the truth</b>."),
          ("Narx va tanlov his uyg'otadi: langar, aldovchi variant, «bepul», 3 tadan ko'p bo'lmagan tanlov.", "Price and choice stir feelings: anchors, decoys, \"free\", no more than three options."),
          ("Yaxshi logotip: <b>sodda, esda qoladigan, moslashuvchan, mos va vaqtga chidamli</b>.", "A good logo is <b>simple, memorable, versatile, appropriate and timeless</b>."),
          ("Raqamlar: CTR, CPC, konversiya, CAC, <b>ROAS ≥ 1 ÷ marja</b>; qaror — A/B test bilan.", "Numbers: CTR, CPC, conversion, CAC, <b>ROAS ≥ 1 ÷ margin</b>; decide with A/B tests."),
          ("Va'da yetkazishda tasdiqlanadi: kam va'da — ko'p bajar, shikoyatga 1 soatda javob.", "Delivery proves the promise: under-promise, over-deliver, answer complaints within an hour.")]) +
 '<div class="grid g2" style="margin-top:16px">' +
 '<div class="card" style="--c:var(--violet)"><span class="icon">📓</span>' + E("h3", "Mustaqil ish: «Bitta reklama tahlili»", "Independent work: \"Analysing one ad\"") +
 '<ul class="tick">' +
 E("li", "Telegram yoki Instagram'dan bitta mahalliy reklamani tanlang va skrinshot qiling.", "Pick one local ad from Telegram or Instagram and take a screenshot.") +
 E("li", "Unda <b>AIDA</b> ning 4 bosqichini va <b>USP</b> ni toping (yoki yo'qligini ayting).", "Find the four <b>AIDA</b> stages and the <b>USP</b> in it (or say they are missing).") +
 E("li", "Qaysi <b>psixologik tamoyillar</b> ishlatilgan va ular halolmi?", "Which <b>psychological principles</b> are used, and are they honest?") +
 E("li", "Reklamani o'zingiz <b>qayta yozing</b> va A/B test rejasini tuzing.", "<b>Rewrite</b> the ad yourself and plan an A/B test.") +
 '</ul>' + E("small", "Hajmi: 1–2 bet. Baholash: tahlil 50% · qayta yozilgan reklama 30% · test rejasi 20%.", "Length: one or two pages. Marking: analysis 50% · rewritten ad 30% · test plan 20%.", 'class="note"') +
 '</div>' +
 '<div class="card" style="--c:var(--blue)"><span class="icon">🔗</span>' + E("h3", "Foydali resurslar", "Useful resources") +
 '<ul class="clean">' +
 E("li", "Robert Chaldini — «Ta'sir: ishontirish psixologiyasi» (1984; yangilangan nashr 2021)", "Robert Cialdini — <i>Influence: The Psychology of Persuasion</i> (1984; new edition 2021)") +
 E("li", "Daniel Kaneman — «Tez va sekin fikrlash» (2011)", "Daniel Kahneman — <i>Thinking, Fast and Slow</i> (2011)") +
 E("li", "Den Arieli — «Oldindan aytib bo'ladigan mantiqsizlik» (2008)", "Dan Ariely — <i>Predictably Irrational</i> (2008)") +
 E("li", "<a class=\"lnk\" href=\"https://www.facebook.com/business/learn\" target=\"_blank\" rel=\"noopener\">facebook.com/business/learn</a> — Meta reklamasi bo'yicha bepul kurslar", "<a class=\"lnk\" href=\"https://www.facebook.com/business/learn\" target=\"_blank\" rel=\"noopener\">facebook.com/business/learn</a> — free courses on Meta advertising") +
 E("li", "<a class=\"lnk\" href=\"https://skillshop.withgoogle.com\" target=\"_blank\" rel=\"noopener\">skillshop.withgoogle.com</a> — Google reklamasi bo'yicha bepul kurslar", "<a class=\"lnk\" href=\"https://skillshop.withgoogle.com\" target=\"_blank\" rel=\"noopener\">skillshop.withgoogle.com</a> — free courses on Google advertising") +
 E("li", "<a class=\"lnk\" href=\"https://lex.uz\" target=\"_blank\" rel=\"noopener\">lex.uz</a> — «Reklama to'g'risida»gi qonun va iste'molchilar huquqlari", "<a class=\"lnk\" href=\"https://lex.uz\" target=\"_blank\" rel=\"noopener\">lex.uz</a> — the Law \"On Advertising\" and consumer rights") +
 '</ul>' +
 E("p", "<b>Vositalar:</b> <span class=\"pill g\">Canva</span><span class=\"pill g\">Figma</span><span class=\"pill g\">CapCut</span><span class=\"pill g\">Telegram Ads</span>", "<b>Tools:</b> <span class=\"pill g\">Canva</span><span class=\"pill g\">Figma</span><span class=\"pill g\">CapCut</span><span class=\"pill g\">Telegram Ads</span>") +
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
 E("p", "Keyingi mashg'ulotgacha <b>logotip topshirig'ini</b> yuboring va bitta mahalliy reklamani <b>AIDA</b> bo'yicha tahlil qilib keling — dars aynan shu misollardan boshlanadi.",
   "Before the next class, submit the <b>logo assignment</b> and bring one local ad analysed with <b>AIDA</b> — the lesson will start from those examples.") +
 E("p", "Termiz davlat universiteti · Tadbirkorlik asoslari", "Termez State University · Fundamentals of Entrepreneurship", 'style="color:var(--muted);font-size:13.5px"') + '</div>')

# ============================ TEST SAVOLLARI ============================
# a — 4 variant (uzunligi teng, mazmunan o'xshash), c — to'g'ri javob; o — ochiq savol: qabul qilinadigan javoblar (bitta so'z yoki son)
Q = [
 # 1 — Levitt: natija
 dict(q="Qurilish do'koni reklamasi uchun qaysi sarlavha «odamlar parma emas, teshik sotib oladi» qoidasiga eng mos keladi?",
      a=["«Devorga javonni 10 daqiqada o'zingiz osasiz — chang va shovqinsiz»",
         "«Parma quvvati 800 Vt, aylanish tezligi esa daqiqasiga 3000 marta»",
         "«Do'konimizda 40 dan ortiq turdagi parma va boshqa asboblar bor»",
         "«Yangi parmalar keldi: Germaniya, Xitoy va Turkiyada tayyorlangan»"], c=0,
      e="Mijoz natija (osilgan javon, tez va toza ish) sotib oladi. Quvvat, turlar soni va ishlab chiqaruvchi — xususiyatlar.",
      qe="Which headline for a hardware shop best follows the rule \"people don't buy a drill, they buy a hole\"?",
      ae=["\"Hang a shelf yourself in ten minutes — no dust, no noise\"",
          "\"An 800 W drill motor that spins 3,000 times per minute\"",
          "\"Our shop stocks more than 40 types of drills and tools\"",
          "\"New drills arrived, made in Germany, China and Turkey\""],
      ee="Customers buy the result (a hung shelf, a quick, clean job). Power, range and origin are features."),
 # 2 — ochiq: 1-tizim
 dict(q="Kanemanning modelida tez, avtomatik va hissiy qaror qabul qiladigan tizim nechanchi tizim deb ataladi? <i>(faqat son)</i>",
      o=["1", "1-tizim", "birinchi", "bir", "1 tizim"],
      e="1-tizim — tez va hissiy, 2-tizim — sekin va mantiqiy. Ko'p kundalik xaridni 1-tizim hal qiladi.",
      qe="In Kahneman's model, what number is given to the fast, automatic and emotional system? <i>(number only)</i>",
      oe=["1", "one", "first", "system 1"],
      ee="System 1 is fast and emotional, System 2 slow and logical. System 1 settles most everyday purchases."),
 # 3 — banner va 1-tizim
 dict(q="Shahar ko'chasidagi banner haydovchiga 2–3 soniya ko'rinadi. Qaysi yondashuv to'g'ri?",
      a=["Bitta kuchli rasm hamda 5–7 so'zli bitta aniq va'da beriladi",
         "Narxlar jadvali va mahsulotning barcha xususiyatlari yoziladi",
         "Sayt, telefon, Telegram va Instagram manzillari birga beriladi",
         "Kichik shriftda kompaniyaning to'liq tarixi hikoya qilinadi"], c=0,
      e="Qisqa vaqtda faqat 1-tizim ishlaydi: bitta rasm, bitta g'oya, kam so'z. Jadval va tarix 2-tizim uchun.",
      qe="A street billboard is seen by drivers for two or three seconds. Which approach is right?",
      ae=["One strong picture and one clear five-to-seven-word promise",
          "A price table listing every feature of the whole product line",
          "The website, phone, Telegram and Instagram addresses at once",
          "The company's full history told in a small, neat typeface"],
      ee="In a few seconds only System 1 works: one picture, one idea, few words. Tables and histories are for System 2."),
 # 4 — ochiq: AIDA birinchi bosqich
 dict(q="AIDA modelidagi birinchi bosqich — odamni to'xtatish — o'zbekcha qanday ataladi? <i>(bitta so'z)</i>",
      o=["e'tibor", "etibor", "diqqat", "attention", "e’tibor"],
      e="AIDA: Attention (e'tibor) → Interest (qiziqish) → Desire (istak) → Action (harakat).",
      qe="What is the first stage of the AIDA model — stopping the person — called? <i>(one word)</i>",
      oe=["attention", "attract attention"],
      ee="AIDA: Attention → Interest → Desire → Action."),
 # 5 — USP
 dict(q="Qaysi jumla USP (noyob savdo taklifi) ga eng yaxshi misol bo'ladi?",
      a=["«Ishlaydigan talabalar uchun kechki 20:00 da 45 daqiqalik onlayn darslar»",
         "«Bizda eng sifatli ta'lim, eng tajribali o'qituvchilar va eng qulay narx»",
         "«Ingliz tili kurslarimiz 2015-yildan beri Termiz shahrida faoliyat yuritadi»",
         "«Kursga yoziling va hayotingizni o'zgartiring — siz bunga albatta loyiqsiz»"], c=0,
      e="USP — aniq mijoz uchun raqobatchilar bermaydigan bitta aniq foyda. «Eng sifatli, eng arzon» — hamma aytadigan umumiy gap.",
      qe="Which sentence is the best example of a USP (unique selling proposition)?",
      ae=["\"45-minute online lessons at 8 pm for students who work in the day\"",
          "\"We offer the best teaching, the best teachers and the best prices\"",
          "\"Our English courses have operated in Termez since the year 2015\"",
          "\"Sign up for the course and change your life — you truly deserve it\""],
      ee="A USP is one specific benefit for a specific customer that competitors don't offer. \"Best and cheapest\" is what everyone says."),
 # 6 — Avis
 dict(q="Avis kompaniyasining «Biz 2-raqammiz. Shuning uchun ko'proq harakat qilamiz» kampaniyasi nimani ko'rsatadi?",
      a=["Zaif tomonni halol tan olib, uni mijoz uchun foydaga aylantirish mumkin",
         "Reklamada raqobatchining nomini tez-tez tilga olish savdoni pasaytiradi",
         "Bozorda faqat birinchi o'rindagi kompaniya foydali ishlay olishi mumkin",
         "Narxni raqobatchidan arzon qilish har doim eng kuchli pozitsiya bo'ladi"], c=0,
      e="Avis ikkinchi o'rinni yashirmadi, aksincha «shuning uchun ko'proq tirishamiz» deb mijozga foyda va'da qildi — pozitsiyalashning klassik namunasi.",
      qe="What does Avis's campaign \"We're No. 2. We try harder.\" show?",
      ae=["A weakness admitted honestly can be turned into a benefit for customers",
          "Mentioning a competitor's name in ads very often lowers your own sales",
          "Only the company in first place in a market can ever make a real profit",
          "Pricing below the competitor is always the strongest market position"],
      ee="Avis did not hide being second; it promised customers more effort because of it — a classic example of positioning."),
 # 7 — sochiq tajribasi
 dict(q="Mehmonxona sochiqlari tajribasida qaysi yozuv mehmonlarni sochiqni qayta ishlatishga ko'proq undadi?",
      a=["«Mehmonlarimizning ko'pchiligi sochiqni qayta ishlatadi»",
         "«Tabiatni asrang — sochiqni qayta ishlatishni unutmang»",
         "«Sochiqni qayta ishlatsangiz, suv va kukun tejaladi»",
         "«Toza sochiq kerak bo'lsa, uni polga tashlab qo'ying»"], c=0,
      e="Goldstayn, Chaldini va Griskevichus (2008): «ko'pchilik shunday qiladi» (ijtimoiy isbot) — 44,1%, tabiatga chaqiriq — 35,1%.",
      qe="In the hotel towel experiment, which message got more guests to reuse their towels?",
      ae=["\"The majority of our guests reuse their towels\"",
          "\"Help save the environment — reuse your towels\"",
          "\"Reusing your towel saves water and detergent\"",
          "\"If you need a clean towel, leave it on the floor\""],
      ee="Goldstein, Cialdini and Griskevicius (2008): \"most guests do it\" (social proof) — 44.1%; the environmental appeal — 35.1%."),
 # 8 — ochiq: tanqislik
 dict(q="«Faqat 3 dona qoldi» yoki «Aksiya bugun tugaydi» yozuvlari Chaldinining qaysi tamoyiliga tayanadi? <i>(bitta so'z)</i>",
      o=["tanqislik", "kamyoblik", "taqchillik", "scarcity", "defitsit", "tanqislik tamoyili"],
      e="Tanqislik: kam yoki vaqtli narsa qadrliroq ko'rinadi (pechene bankasi tajribasi). Faqat rost bo'lsa ishlatiladi.",
      qe="Which of Cialdini's principles do \"Only 3 left\" or \"The offer ends today\" rely on? <i>(one word)</i>",
      oe=["scarcity"],
      ee="Scarcity: rare or limited things look more valuable (the cookie jar study). Use it only when it is true."),
 # 9 — aldovchi variant
 dict(q="The Economist tajribasida hech kim tanlamagan «faqat bosma — $125» varianti qanday rol o'ynadi?",
      a=["U «bosma+onlayn — $125» variantini juda foydali qilib ko'rsatdi",
         "U jurnal tahririyatiga ko'proq bosma nusxa sotishga yordam berdi",
         "U «faqat onlayn — $59» variantini eng ishonchli qilib ko'rsatdi",
         "U obunachilarni narxlarni sinchiklab solishtirishdan qaytardi"], c=0,
      e="Aldovchi (decoy) variant: u bilan 84% bosma+onlaynni tanladi, usiz — atigi 32%. Variantning vazifasi — boshqasini arzon ko'rsatish.",
      qe="In The Economist experiment, what role did the \"print only — $125\" option that nobody chose play?",
      ae=["It made the \"print + web for $125\" option look like a great deal",
          "It helped the magazine sell many more of its printed paper copies",
          "It made the \"web only for $59\" option look the most trustworthy",
          "It stopped subscribers from carefully comparing all the prices"],
      ee="A decoy: with it 84% chose print + web, without it only 32%. Its job is to make another option look cheap."),
 # 10 — murabbo
 dict(q="Murabbo tajribasidan (24 xil va 6 xil) kichik biznes uchun qaysi xulosa to'g'ri?",
      a=["Kamroq, aniq tanlov xaridni oshiradi — 3 tagacha asosiy variant bering",
         "Tanlov qancha ko'p bo'lsa, mijoz shuncha tezroq va oson qaror qiladi",
         "Ta'tib ko'rish stoli xaridga hech qanday ta'sir qilmasligi isbotlangan",
         "Ko'p xil mahsulot qo'yilsa, ularning hammasi teng sotila boshlaydi"], c=0,
      e="24 xilda xaridorlar 3%, 6 xilda 30% bo'ldi. Ortiqcha tanlov qarorni keyinga qoldiradi.",
      qe="What lesson for a small business follows from the jam study (24 kinds versus 6)?",
      ae=["Fewer, clearer options sell more — offer at most three main choices",
          "The more choice there is, the faster a customer is able to decide",
          "Tasting tables were proven to have no effect at all on purchases",
          "When many products are displayed, they all start to sell equally"],
      ee="With 24 kinds 3% bought; with 6 kinds 30%. Too much choice makes people postpone the decision."),
 # 11 — ochiq: CTR
 dict(q="Reklama 40 000 marta ko'rsatildi va 800 marta bosildi. CTR necha foiz? <i>(faqat son)</i>",
      o=["2", "2%", "2 %", "2,0", "2.0", "2 foiz"],
      e="CTR = 800 ÷ 40 000 × 100% = 2%.",
      qe="An ad was shown 40,000 times and clicked 800 times. What is the CTR in percent? <i>(number only)</i>",
      oe=["2", "2%", "2.0", "2,0", "2 percent"],
      ee="CTR = 800 ÷ 40,000 × 100% = 2%."),
 # 12 — ochiq: ROAS
 dict(q="Kafe reklamaga 500 000 so'm sarfladi va reklamadan 2 000 000 so'm tushum oldi. ROAS nechaga teng? <i>(faqat son)</i>",
      o=["4", "4,0", "4.0", "4x", "4 barobar", "400%"],
      e="ROAS = tushum ÷ reklama xarajati = 2 000 000 ÷ 500 000 = 4.",
      qe="A café spent 500,000 so'm on ads and earned 2,000,000 so'm of revenue from them. What is the ROAS? <i>(number only)</i>",
      oe=["4", "4.0", "4,0", "4x", "400%"],
      ee="ROAS = revenue ÷ ad spend = 2,000,000 ÷ 500,000 = 4."),
 # 13 — zararsiz ROAS
 dict(q="Mahsulot marjasi 25%. Reklama ROAS i 3 ga teng bo'ldi. Bu haqda qaysi xulosa to'g'ri?",
      a=["Zararsiz ROAS 4 ga teng, demak reklama sotuvga qaramay zarar keltiryapti",
         "ROAS 1 dan katta bo'lgani uchun reklama har doim foyda keltirgan bo'ladi",
         "Zararsiz ROAS 0,25 ga teng, demak reklama juda katta foyda keltiryapti",
         "Marja ROAS ga hech qanday ta'sir qilmaydi, faqat tushumga qarash kerak"], c=0,
      e="Zararsiz ROAS = 1 ÷ 0,25 = 4. ROAS 3 < 4 — har 100 so'm reklamaga 300 so'm tushum, lekin atigi 75 so'm foyda.",
      qe="A product's margin is 25%. An ad achieved a ROAS of 3. Which conclusion is correct?",
      ae=["Break-even ROAS is 4, so despite the sales the ad is losing money",
          "Since ROAS is above 1, the advertising is always bringing a profit",
          "Break-even ROAS is 0.25, so the ad is bringing a very large profit",
          "Margin has no effect on ROAS at all; only revenue needs watching"],
      ee="Break-even ROAS = 1 ÷ 0.25 = 4. A ROAS of 3 is below it: 300 so'm of revenue per 100 so'm of ads, but only 75 so'm of profit."),
 # 14 — ochiq: CAC
 dict(q="Reklamaga 600 000 so'm sarflandi va 40 ta yangi mijoz keldi. CAC necha so'm? <i>(faqat son)</i>",
      o=["15000", "15 000", "15000 so'm", "15 ming", "15 000 so'm", "15ming"],
      e="CAC = 600 000 ÷ 40 = 15 000 so'm.",
      qe="600,000 so'm was spent on ads and 40 new customers came. What is the CAC in so'm? <i>(number only)</i>",
      oe=["15000", "15,000", "15 000", "15000 som", "15k"],
      ee="CAC = 600,000 ÷ 40 = 15,000 so'm."),
 # 15 — A/B test
 dict(q="Telegram postini A/B testdan o'tkazmoqchisiz. Qaysi reja to'g'ri?",
      a=["Faqat sarlavhani o'zgartirib, ikki guruhda buyurtmalar sonini solishtirish",
         "Sarlavha, rasm va narxni birdaniga o'zgartirib, layklar sonini solishtirish",
         "A variantni dushanba, B ni bayramda chiqarib, ko'rishlar sonini solishtirish",
         "Har variantni 20 kishiga ko'rsatib, jamoaning fikri bo'yicha g'olib tanlash"], c=0,
      e="A/B test: bitta o'zgarish, tasodifiy teng guruhlar, yetarli odam va oldindan tanlangan ko'rsatkich (buyurtma).",
      qe="You want to A/B test a Telegram post. Which plan is right?",
      ae=["Change only the headline and compare orders between the two groups",
          "Change headline, image and price at once and compare the likes",
          "Post A on a Monday and B on a holiday, then compare their views",
          "Show each one to 20 people and let the team's taste pick a winner"],
      ee="An A/B test: one change, equal random groups, enough people and a measure chosen in advance (orders)."),
 # 16 — logotip qoidasi
 dict(q="Logotip yaxshi ekanini tekshirishning qaysi usuli dars qoidalariga mos?",
      a=["Uni oq-qora qilib, ilova belgisi o'lchamigacha kichraytirib ko'rish",
         "Unga iloji boricha ko'p rang, soya va yaltiroq effektlar qo'shish",
         "Unga mashhur brendning belgisini olib, nomini o'zgartirib qo'yish",
         "Uni faqat katta ekranda, rangli va to'liq o'lchamda tekshirib ko'rish"], c=0,
      e="Yaxshi logotip moslashuvchan: oq-qorada va 16 piksel o'lchamda ham taniladi. Ko'p effekt eskiradi, ko'chirish esa qonunbuzarlik.",
      qe="Which way of checking whether a logo is good follows the lesson's rules?",
      ae=["Make it black and white and shrink it down to app-icon size",
          "Add as many colours, shadows and glossy effects as possible",
          "Take a famous brand's symbol and simply change the name on it",
          "Check it only on a big screen, in colour and at full size"],
      ee="A good logo is versatile: recognisable in black and white and at 16 pixels. Effects date quickly, and copying breaks the law."),
 # 17 — FedEx
 dict(q="FedEx logotipidagi E va x harflari orasidagi bo'sh joyda nima yashiringan?",
      a=["Tezlik va aniqlikni bildiruvchi o'q belgisi",
         "Kompaniya asoschisining ismining bosh harfi",
         "Yer sharini bildiruvchi kichkina aylana shakl",
         "Yuk tashiydigan samolyotning kichik qanoti"], c=0,
      e="1994-yilda Lindon Lider yaratgan logotipda bo'sh joy (negative space) o'qni hosil qiladi — oldinga harakat va tezlik ramzi.",
      qe="What is hidden in the space between the E and the x of the FedEx logo?",
      ae=["An arrow that stands for speed and precision",
          "The initial letter of the company founder's name",
          "A small circle that represents the whole planet",
          "A small wing of a plane that carries the cargo"],
      ee="In the 1994 logo by Lindon Leader the negative space forms an arrow — a symbol of forward motion and speed."),
 # 18 — qorong'i pattern
 dict(q="Onlayn do'konda har safar sahifa yangilanganda «Aksiya tugashiga 10:00 daqiqa qoldi» taymeri qaytadan boshlanadi. Bu nima?",
      a=["Qorong'i pattern — soxta tanqislik bilan mijozni aldash",
         "Ijtimoiy isbot — boshqa xaridorlar fikrini halol ko'rsatish",
         "Langar narx — birinchi ko'rilgan narx bilan solishtirish",
         "Freyming — bir xil faktni ijobiy so'zlar bilan aytib berish"], c=0,
      e="Taymer rost emas — bu yolg'on tanqislik, qorong'i pattern. Iste'molchini chalg'itadigan reklama qonun bilan taqiqlanadi.",
      qe="On an online shop a \"10:00 minutes left in the sale\" timer restarts every time the page is reloaded. What is this?",
      ae=["A dark pattern — deceiving customers with fake scarcity",
          "Social proof — showing other buyers' opinions honestly",
          "A price anchor — comparing with the first price you saw",
          "Framing — stating the same fact in more positive words"],
      ee="The timer is not real — it is false scarcity, a dark pattern. Advertising that misleads consumers is banned by law."),
 # 19 — yetkazish
 dict(q="Kuryerlik xizmati uchun qaysi yondashuv mijoz tajribasini eng yaxshi qiladi?",
      a=["«3 kunda» deb va'da berib, imkon bo'lsa 2 kunda yetkazib berish",
         "«1 kunda» deb va'da berib, odatdagidek 3 kunda yetkazib berish",
         "Yetkazish muddatini umuman aytmay, mijozni kutib turishga qo'yish",
         "Muddatni faqat to'lov qilingandan keyingina mijozga ma'lum qilish"], c=0,
      e="Kam va'da — ko'p bajar: kutilgandan yaxshi natija mamnunlik beradi, buzilgan va'da esa shikoyat keltiradi (cho'qqi va yakun qoidasi).",
      qe="Which approach gives a courier service the best customer experience?",
      ae=["Promise \"three days\" and then, when possible, deliver in two",
          "Promise \"one day\" and then, as usual, deliver in three days",
          "Say nothing about delivery time and leave customers waiting",
          "Tell customers the delivery time only after they have paid"],
      ee="Under-promise, over-deliver: beating expectations pleases, a broken promise brings complaints (the peak-end rule)."),
 # 20 — Dollar Shave Club
 dict(q="Dollar Shave Club'ning taxminan $4 500 ga tushgan videosi nega 48 soatda 12 000 buyurtma keltirdi?",
      a=["Hazil va aniq foyda birga berildi: arzon ustara uyga yetkaziladi",
         "Video televizorda eng qimmat vaqtda ko'p marta ko'rsatib turildi",
         "Unda dunyoga mashhur aktyorlar va sportchilar suratga tushgan edi",
         "Videoda mahsulot narxi va tarkibi umuman aytilmay yashirilgan edi"], c=0,
      e="Asoschining o'zi suratga tushgan kulgili video aniq USP berdi: oyiga bir necha dollarga sifatli ustara, uyga yetkazib. G'oya byudjetdan kuchli chiqdi.",
      qe="Why did Dollar Shave Club's video, which cost about $4,500, bring 12,000 orders in 48 hours?",
      ae=["It joined humour and a clear benefit: cheap razors sent home",
          "The video was shown many times on TV at the most expensive hours",
          "It starred world-famous actors and athletes in the leading roles",
          "It hid the product's price and contents from viewers completely"],
      ee="The funny video starring the founder gave a clear USP: good razors for a few dollars a month, delivered home. The idea beat the budget."),
]
