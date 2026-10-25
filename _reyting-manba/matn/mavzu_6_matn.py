# -*- coding: utf-8 -*-
"""M6 · Biznes-model qanday ishlaydi — slaydlar va test (yangi_mavzu.py uchun).
T, d, slide — yangi_mavzu.py beradi. Test: 20 savol, ulardan 6 tasi ochiq (bitta so'z yoki son bilan javob, o=[...]).
Ishlatish (shablon — mavzu-6.html ning o'zi: ochiq savollarni ham ko'taradigan test dvigateli shu yerda):
  python3 _reyting-manba/yangi_mavzu.py _reyting-manba/matn/mavzu_6_matn.py mavzu-6.html "Biznes-model qanday ishlaydi" 6 "" mavzu-6.html
"""

def E(tag, uz, en, attr=""):
    """Tarjimaga tayyor element: <tag data-i=N attr>uz</tag>"""
    return "<" + tag + " " + d(uz, en) + ((" " + attr) if attr else "") + ">" + uz + "</" + tag + ">"

def card(color, icon, uz_t, en_t, uz_p, en_p, style=""):
    return ('<div class="card" style="--c:var(--' + color + ');' + style + '">' +
            (('<span class="icon">' + icon + '</span>') if icon else "") +
            E("h3", uz_t, en_t) + E("p", uz_p, en_p) + '</div>')

def card_ul(color, icon, uz_t, en_t, items, cls="tick", style="", tail=""):
    """items: [(uz, en), ...]"""
    return ('<div class="card" style="--c:var(--' + color + ');' + style + '">' +
            (('<span class="icon">' + icon + '</span>') if icon else "") + E("h3", uz_t, en_t) +
            '<ul class="' + cls + '">' + "".join(E("li", u, e) for u, e in items) + '</ul>' + tail + '</div>')

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
 E("span", "M6-mavzu · Ma'ruza · 2 soat", "Topic 6 · Lecture · 2 hours", 'class="kicker"') +
 E("h1", "BIZNES-MODEL QANDAY ISHLAYDI", "HOW A BUSINESS MODEL WORKS", 'class="grad"') +
 E("p", "Biznes-model nima va nega u mahsulotdan ham muhim · <b>Osterwalder Canvas</b>ning 9 bloki · qiymat taklifi kanvasi · birlik iqtisodiyoti: <b>LTV, CAC, churn</b> · obuna, franshiza, platforma, freemium · <b>Lean Canvas</b> · dunyo va O'zbekiston amaliyotidan misollar.",
   "What a business model is and why it matters more than the product · the nine blocks of the <b>Osterwalder Canvas</b> · the value proposition canvas · unit economics: <b>LTV, CAC, churn</b> · subscription, franchise, platform, freemium · the <b>Lean Canvas</b> · examples from global and Uzbek practice.", 'class="lead"') +
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
 E("div", "Maqsad: talabani <b>\"menda g'oya bor\"</b> bosqichidan <b>\"mening biznesim qanday ishlaydi, pul qayerdan keladi va qachon qaytadi\"</b> bosqichiga o'tkazish. Biznes-model — bu <b>tushuntirish emas, chizma va hisob-kitob</b>: u bir varaqqa sig'adi va raqamlar bilan tekshiriladi.",
   "Aim: to move the student from <b>\"I have an idea\"</b> to <b>\"this is how my business works, where the money comes from and when it comes back\"</b>. A business model is <b>a diagram and a calculation, not an explanation</b>: it fits on one sheet and is checked with numbers.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("green", "🧩", "Tushuntira oladi", "Can explain", "Biznes-model nima ekanini, g'oyadan va mahsulotdan nimasi bilan farq qilishini izohlaydi.", "Explains what a business model is and how it differs from an idea and from a product.") +
 card("blue", "🗺", "Chiza oladi", "Can draw", "Osterwalder Canvasning 9 blokini to'g'ri tartibda to'ldiradi, startap uchun Lean Canvasni qo'llaydi.", "Fills in the nine blocks of the Osterwalder Canvas in the right order and uses the Lean Canvas for a start-up.") +
 card("violet", "💎", "Shakllantira oladi", "Can formulate", "Mijoz vazifasi, og'rig'i va istagiga mos qiymat taklifini yozadi.", "Writes a value proposition that fits the customer's jobs, pains and gains.") +
 card("orange", "🧮", "Hisoblay oladi", "Can calculate", "Birlik foydasi, zararsizlik nuqtasi, LTV, CAC va churnni hisoblab, model sog'lomligini baholaydi.", "Calculates profit per unit, the break-even point, LTV, CAC and churn, and judges the health of the model.") +
 card("pink", "🔀", "Tanlay oladi", "Can choose", "Obuna, franshiza, platforma, freemium, «ustara-tig'», B2B va B2C andozalaridan mosini tanlaydi.", "Chooses between the subscription, franchise, platform, freemium, \"razor and blades\", B2B and B2C patterns.") +
 card("cyan", "🔍", "Tahlil qila oladi", "Can analyse", "Netflix, Kodak, Airbnb, McDonald's va mahalliy kompaniyalar modelini blokma-blok ajratadi.", "Breaks the models of Netflix, Kodak, Airbnb, McDonald's and local companies down block by block.") +
 '</div>')

# ============================ 3. REJA ============================
_pu, _pe = pills([("biznes-model", "business model", 1), ("Osterwalder Canvas", "Osterwalder Canvas", 0), ("mijozlar segmenti", "customer segments", 1),
                  ("qiymat taklifi", "value proposition", 1), ("mijoz vazifasi (job)", "customer job", 0), ("kanallar", "channels", 0),
                  ("daromad oqimi", "revenue streams", 1), ("asosiy resurslar", "key resources", 0), ("asosiy hamkorlar", "key partners", 0),
                  ("xarajatlar tuzilmasi", "cost structure", 1), ("birlik iqtisodiyoti", "unit economics", 1), ("zararsizlik nuqtasi", "break-even point", 0),
                  ("LTV", "LTV", 1), ("CAC", "CAC", 1), ("churn", "churn", 1), ("obuna", "subscription", 0), ("franshiza", "franchise", 0),
                  ("royalti", "royalty", 0), ("onlayn platforma", "online platform", 1), ("tarmoq effekti", "network effect", 0),
                  ("freemium", "freemium", 1), ("«ustara va tig'»", "\"razor and blades\"", 0), ("Lean Canvas", "Lean Canvas", 1), ("B2B / B2C", "B2B / B2C", 0)])
slide("Reja va tushunchalar", "Plan and concepts",
 E("span", "Ma'ruza rejasi", "Lecture plan", 'class="kicker"') +
 E("h2", "Bugungi <span class=\"grad\">5 ta blok</span>", "Today's <span class=\"grad\">five blocks</span>") +
 '<div class="grid g5">' +
 card("green", "1️⃣", "Model nima", "What a model is", "Ta'rif, tarix va g'oyadan farqi.", "Definition, history and how it differs from an idea.") +
 card("blue", "2️⃣", "Canvas 9 blok", "The nine blocks", "Mijozdan boshlab xarajatgacha.", "From the customer to the costs.") +
 card("violet", "3️⃣", "Raqamlar", "The numbers", "Birlik foydasi, LTV, CAC, churn.", "Profit per unit, LTV, CAC, churn.") +
 card("orange", "4️⃣", "Andozalar", "Patterns", "Obuna, franshiza, platforma, freemium.", "Subscription, franchise, platform, freemium.") +
 card("pink", "5️⃣", "Amaliyot", "Practice", "Dunyo saboqlari va mahalliy canvas.", "Global lessons and a local canvas.") +
 '</div>' +
 E("h3", "🔑 Tayanch tushunchalar", "🔑 Key concepts", 'style="margin-top:22px"') +
 E("div", _pu, _pe))

# ============================ 4. MODEL NIMA ============================
slide("Biznes-model nima?", "What is a business model?",
 E("span", "1-blok", "Block 1", 'class="kicker"') +
 E("h2", "Biznes-model — <span class=\"grad\">pul qanday aylanishining chizmasi</span>", "A business model — <span class=\"grad\">the diagram of how money circulates</span>") +
 E("div", "<b>Biznes-model</b> — tashkilot <b>kim uchun</b>, <b>qanday qiymat</b> yaratishi, uni <b>qanday yetkazishi</b> va bundan <b>qanday daromad olishi</b>ni tushuntiruvchi tizim. Qisqasi: <b>qiymat yaratish → yetkazish → pulga aylantirish</b>.",
   "A <b>business model</b> is the system that explains <b>for whom</b> an organisation creates <b>what value</b>, <b>how it delivers</b> that value and <b>how it earns</b> from it. In short: <b>create value → deliver it → turn it into money</b>.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("green", "🎯", "Kim uchun?", "For whom?", "Mijoz kim, uning qanday muammosi bor va u bu muammoni hal qilishga pul to'lashga tayyormi.", "Who the customer is, what problem they have and whether they will pay to solve it.") +
 card("blue", "🎁", "Nima beramiz?", "What do we give?", "Qanday qiymat yaratamiz va u raqobatchinikidan nimasi bilan farq qiladi.", "What value we create and how it differs from what competitors offer.") +
 card("violet", "💰", "Qanday daromad?", "What revenue?", "Kim, nima uchun, qancha va qanday tartibda pul to'laydi; xarajat qancha.", "Who pays, what for, how much and on what schedule — and what it costs.") +
 '</div>' +
 E("div", "📌 <b>Asosiy qoida:</b> biznes-model savolga javob beradi — <b>\"Bir so'm qayerdan kiradi va qayerga chiqadi?\"</b> Agar bu savolga aniq javob bo'lmasa, oldingizda biznes emas, hali <b>faqat g'oya</b> turibdi.",
   "📌 <b>The key rule:</b> a business model answers the question <b>\"where does each so'm come in and where does it go out?\"</b> Without a clear answer you are not looking at a business yet — only at <b>an idea</b>.", 'class="quote" style="margin-top:16px"') +
 E("h3", "📜 Tarixdan: tushuncha qanday shakllandi", "📜 History: how the concept took shape", 'style="margin-top:20px"') +
 '<div class="grid g3">' +
 fact("Piter Druker savollari", "Peter Drucker's questions",
      "«Mijoz kim? U nimani qadrlaydi?» — menejment otasi Druker qo'ygan bu savollar har qanday modelning poydevori.",
      "\"Who is the customer? What does the customer value?\" — these questions from Drucker, the father of management, underlie every model.") +
 fact("2002 · Harvard Business Review", "2002 · Harvard Business Review",
      "Joan Magretta «Why Business Models Matter» maqolasida: yaxshi model Druker savollariga va «biz qanday pul topamiz?» savoliga javob beradi.",
      "Joan Magretta, \"Why Business Models Matter\": a good model answers Drucker's questions and \"how do we make money?\".") +
 fact("2010 · Business Model Generation", "2010 · Business Model Generation",
      "Aleksandr Osterwalder va Iv Pinye kitobi 45 mamlakatdan 470 amaliyotchi bilan birga yozilgan; canvas bugun dunyoda standart vosita.",
      "The book by Alexander Osterwalder and Yves Pigneur was co-created with 470 practitioners from 45 countries; the canvas is now a global standard.") +
 '</div>')

# ============================ 5. G'OYA VA MODEL ============================
slide("G'oya va model farqi", "Idea vs model",
 E("span", "1.2 · Eng ko'p adashtiradigan joy", "1.2 · The most common confusion", 'class="kicker"') +
 E("h2", "Har qanday g'oya <span class=\"grad\">biznes-model emas!</span>", "Not every idea is <span class=\"grad\">a business model!</span>") +
 '<div class="grid g2">' +
 card_ul("red", "💡", "G'oya", "An idea",
         [("Kim to'laydi — noma'lum", "Who pays is unknown"),
          ("Bir buyurtmadan qancha foyda qolishi hisoblanmagan", "The profit left from a single order has not been worked out"),
          ("Mijozgacha qanday yetib borish aytilmagan", "How you reach the customer is not stated")], cls="tick cross",
         tail="") .replace('<ul class="tick cross">', E("p", "\"Talabalar uchun arzon tushlik yetkazib beruvchi xizmat ochsam.\" — Bu <b>bir gap</b>. Unda na narx, na yetkazish usuli, na foyda hisobi bor.",
                                                        "\"What if I started a cheap lunch delivery service for students?\" — That is <b>one sentence</b>. It has no price, no delivery method and no profit calculation.") + '<ul class="tick cross">', 1) +
 card_ul("green", "🧩", "Biznes-model", "A business model",
         [("Mijoz aniq: yotoqxonada yashovchi 1-kurs talabalari", "The customer is defined: first-year students living in the dormitory"),
          ("Kanal aniq: Telegram-bot va yotoqxona", "The channel is defined: a Telegram bot and the dormitory"),
          ("Daromad aniq: har bir tushlikdan ustama, oylik obuna", "The revenue is defined: a mark-up on every lunch and a monthly plan")]).replace('<ul class="tick">', E("p", "\"TerDU talabalariga 20 000 so'mlik tushlikni Telegram-bot orqali oldindan buyurtma qilib, 12:00 da yotoqxonaga yetkazamiz.\" — Bu <b>tizim</b>.",
                                                        "\"We deliver a 20,000 so'm lunch to TerSU students at 12:00 in the dormitory, ordered in advance through a Telegram bot.\" — That is <b>a system</b>.") + '<ul class="tick">', 1) +
 '</div>' +
 E("h3", "❓ Modelingizni tekshiradigan 3 ta savol", "❓ Three questions that test your model", 'style="margin-top:20px"') +
 '<div class="grid g3">' +
 card("blue", "1️⃣", "Kim to'laydi?", "Who pays?", "Ba'zan iste'molchi va to'lovchi — <b>har xil odam</b>: bola o'ynaydi, ota to'laydi; foydalanuvchi bepul, reklama beruvchi to'laydi.", "Sometimes the user and the payer are <b>different people</b>: the child plays and the parent pays; the user is free and the advertiser pays.") +
 card("violet", "2️⃣", "Nima uchun aynan sizga?", "Why you in particular?", "Mijoz raqobatchini qo'yib, sizni tanlashi uchun <b>bitta aniq sabab</b> bo'lishi kerak.", "There must be <b>one clear reason</b> for the customer to choose you over a competitor.") +
 card("orange", "3️⃣", "Ko'paytirish mumkinmi?", "Can it be scaled?", "Mijoz 10 barobar ko'paysa, model ishlaydimi yoki <b>sinadimi</b>? Xarajat ham 10 barobar o'smaydimi?", "If customers grow tenfold, does the model still work — or <b>break</b>? Do costs grow tenfold too?") +
 '</div>')

# ============================ 6. MODEL YUTADI ============================
slide("Mahsulot emas — model yutadi", "The model wins, not the product",
 E("span", "1.3 · Dunyo amaliyoti", "1.3 · Global practice", 'class="kicker"') +
 E("h2", "Bir xil mahsulot — <span class=\"grad\">ikki xil taqdir</span>", "The same product — <span class=\"grad\">two different fates</span>") +
 E("div", "Netflix ham, Blockbuster ham bir xil narsani — <b>kino ko'rishni</b> sotgan. Farq mahsulotda emas, <b>pul olish tartibida</b> edi.",
   "Netflix and Blockbuster sold the same thing — <b>watching films</b>. The difference was not in the product but in <b>the way they took the money</b>.", 'class="def"') +
 table([("Yil", "Year"), ("Netflix", "Netflix"), ("Blockbuster", "Blockbuster")], [
  [TD("<b>1999</b>", "<b>1999</b>"), TD("Oylik <b>obuna</b>: cheksiz ijara, kechikish jarimasi yo'q", "A monthly <b>subscription</b>: unlimited rentals, no late fees"), TD("Har bir ijara uchun to'lov va <b>kechikish jarimasi</b>", "A fee for every rental plus <b>late fees</b>")],
  [TD("<b>2000</b>", "<b>2000</b>"), TD("O'zini <b>50 mln $</b> ga sotishni taklif qildi", "Offered to sell itself for <b>$50 million</b>"), TD("Taklifni <b>rad etdi</b>", "<b>Turned the offer down</b>")],
  [TD("<b>2004</b>", "<b>2004</b>"), TD("2,6 mln obunachi", "2.6 million subscribers"), TD("Cho'qqi: <b>9 000</b> dan ortiq do'kon", "Its peak: <b>over 9,000</b> stores")],
  [TD("<b>2007</b>", "<b>2007</b>"), TD("Internet orqali <b>striming</b> boshlandi", "<b>Streaming</b> over the internet begins"), TD("Do'konlar yopila boshladi", "Stores begin to close")],
  [TD("<b>2010</b>", "<b>2010</b>"), TD("Xalqaro kengayish boshlandi", "International expansion begins"), TD("<b>Bankrotlik</b> e'lon qildi", "<b>Files for bankruptcy</b>")],
  [TD("<b>2024</b>", "<b>2024</b>"), TD("<b>300 mln</b> dan ortiq pullik obuna", "<b>Over 300 million</b> paid memberships"), TD("Oregon shtatida <b>bitta</b> do'kon qolgan", "<b>One</b> store left, in Oregon")],
 ]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("orange", "📷", "Kodak: ixtiro bor edi, model yo'q edi", "Kodak: it had the invention, not the model",
      "1975-yilda Kodak muhandisi Stiv Sasson <b>birinchi raqamli kamerani</b> yaratdi. Lekin kompaniya foydasi <b>plyonka va fotoqog'ozdan</b> kelardi — rahbariyat bu modelni buzishni xohlamadi. Raqamli fotografiya bozorni egallagach, 2012-yilda Kodak <b>bankrot</b> bo'ldi.",
      "In 1975 Kodak engineer Steve Sasson built <b>the first digital camera</b>. But the company's profit came from <b>film and photo paper</b>, and management did not want to break that model. Once digital photography took the market, Kodak <b>went bankrupt</b> in 2012.") +
 card("green", "🧠", "Saboq", "The lesson",
      "Blockbuster va Kodakda mahsulot yomon emas edi. Ular yutqazdi, chunki raqib <b>pul aylanish tartibini</b> o'zgartirdi: <b>kim, qachon va nima uchun</b> to'laydi. Eski modelga yopishib olish — eng qimmat xato.",
      "Neither Blockbuster nor Kodak had a bad product. They lost because a rival changed <b>the way money circulates</b>: <b>who pays, when and for what</b>. Clinging to an old model is the most expensive mistake.") +
 '</div>')

# ============================ 7. CANVAS ============================
slide("Osterwalder Canvas", "The Osterwalder Canvas",
 E("span", "2-blok", "Block 2", 'class="kicker"') +
 E("h2", "Biznes-model sxemasi — <span class=\"grad\">9 ta blok</span>", "The business model canvas — <span class=\"grad\">nine blocks</span>") +
 E("div", "<b>Business Model Canvas</b> — shveytsariyalik olim <b>Aleksandr Osterwalder</b> taklif qilgan chizma. Butun biznesni <b>bitta varaqdagi 9 ta katak</b>ka joylaydi: o'ng tomoni — <b>qiymat va daromad</b>, chap tomoni — <b>samaradorlik va xarajat</b>. Uni o'zgartirish oson, shuning uchun startaplar avval canvasni, keyin mahsulotni yasaydi.",
   "The <b>Business Model Canvas</b> was proposed by the Swiss scholar <b>Alexander Osterwalder</b>. It puts a whole business into <b>nine boxes on one sheet</b>: the right side is <b>value and revenue</b>, the left side is <b>efficiency and cost</b>. It is easy to change, which is why start-ups build the canvas first and the product second.", 'class="def"') +
 '<div class="grid g4" style="margin-top:16px">' +
 card("green", "👥", "① Mijozlar segmenti", "① Customer segments", "Biz kim uchun ishlaymiz? Eng muhim mijoz kim?", "Who are we working for? Who is the most important customer?") +
 card("green", "💎", "② Qiymat taklifi", "② Value proposition", "Mijozning qaysi muammosini hal qilamiz?", "Which of the customer's problems do we solve?") +
 card("blue", "🚚", "③ Kanallar", "③ Channels", "Mijozga qanday yetib boramiz va yetkazamiz?", "How do we reach the customer and deliver to them?") +
 card("blue", "💬", "④ Munosabat", "④ Relationships", "Mijozni qanday jalb qilamiz va ushlab qolamiz?", "How do we attract customers and keep them?") +
 card("violet", "💰", "⑤ Daromad oqimlari", "⑤ Revenue streams", "Mijoz nima uchun va qanday to'laydi?", "What does the customer pay for, and how?") +
 card("orange", "🏭", "⑥ Asosiy resurslar", "⑥ Key resources", "Model ishlashi uchun nima zarur?", "What is required for the model to work?") +
 card("orange", "⚙️", "⑦ Asosiy faoliyat", "⑦ Key activities", "Har kuni qanday ishni bajaramiz?", "What work do we do every day?") +
 card("cyan", "🤝", "⑧ Asosiy hamkorlar", "⑧ Key partners", "Kim bizga yordam beradi va nimani tashqaridan olamiz?", "Who helps us and what do we take from outside?") +
 '</div>' +
 card("red", "🧾", "⑨ Xarajatlar tuzilmasi", "⑨ Cost structure", "Modelning eng qimmat qismi nima? Qaysi resurs va faoliyat eng ko'p pul talab qiladi? <b>Daromad xarajatdan katta bo'lsagina</b> model yashaydi.", "What is the most expensive part of the model? Which resource or activity costs the most? The model survives <b>only if revenue exceeds cost</b>.", style="margin-top:14px") +
 E("small", "To'ldirish tartibi: <b>① mijoz → ② qiymat → ③ kanal → ④ munosabat → ⑤ daromad → ⑥ resurs → ⑦ faoliyat → ⑧ hamkor → ⑨ xarajat</b>. Ya'ni har doim <b>mijozdan</b> boshlanadi, <b>puldan</b> emas.",
   "The filling order: <b>① customer → ② value → ③ channel → ④ relationship → ⑤ revenue → ⑥ resources → ⑦ activities → ⑧ partners → ⑨ costs</b>. It always starts from <b>the customer</b>, never from the money.", 'class="note"'))

# ============================ 8. SEGMENT ============================
slide("① Mijozlar segmenti", "① Customer segments",
 E("span", "2.1 · Birinchi blok", "2.1 · The first block", 'class="kicker"') +
 E("h2", "① Mijozlar segmenti — <span class=\"grad\">\"hamma uchun\" degani \"hech kim uchun\"</span>", "① Customer segments — <span class=\"grad\">\"for everyone\" means \"for no one\"</span>") +
 E("div", "<b>Segment</b> — ehtiyoji, xatti-harakati va to'lov imkoniyati o'xshash <b>mijozlar guruhi</b>. Har bir segment uchun alohida qiymat taklifi, alohida kanal va ko'pincha alohida narx bo'ladi.",
   "A <b>segment</b> is a <b>group of customers</b> with similar needs, behaviour and ability to pay. Each segment gets its own value proposition, its own channel and often its own price.", 'class="def"') +
 '<div class="grid g3" style="margin-top:16px">' +
 card("green", "🎯", "Ommaviy bozor", "Mass market", "Katta va bir xil guruh: ichimlik suvi, non, uyali aloqa.", "A large, uniform group: drinking water, bread, mobile service.") +
 card("blue", "🔬", "Tor bozor (nisha)", "Niche market", "Juda aniq guruh: diabet bemorlari uchun shirinlik, chap qo'llar uchun asboblar.", "A very specific group: sweets for people with diabetes, tools for left-handed users.") +
 card("violet", "🧱", "Segmentlangan", "Segmented", "Bir mahsulotning turli darajalari: oddiy va biznes-klass xizmatlar.", "Tiers of the same product: standard and business-class service.") +
 card("orange", "🔀", "Diversifikatsiyalangan", "Diversified", "Butunlay boshqa ikki guruh: Amazon ham xaridorga tovar, ham kompaniyalarga bulutli server (AWS) sotadi.", "Two entirely different groups: Amazon sells goods to shoppers and cloud servers (AWS) to companies.") +
 card("pink", "⚖️", "Ko'p tomonlama", "Multi-sided", "Ikki guruh bir vaqtda kerak: haydovchi va yo'lovchi, sotuvchi va xaridor, o'quvchi va reklama beruvchi.", "Two groups are needed at once: drivers and riders, sellers and buyers, readers and advertisers.") +
 card("cyan", "🏢", "Korporativ", "Corporate", "Mijoz — jismoniy shaxs emas, tashkilot: kafe, maktab, zavod.", "The customer is not a private person but an organisation: a cafe, a school, a factory.") +
 '</div>' +
 E("div", "🧑‍🎓 <b>Talaba uchun mashq:</b> \"Mening mijozim — yoshlar\" deb yozmang. <b>\"Termiz shahridagi, yotoqxonada yashaydigan, oyiga 1,5 mln so'mgacha sarflaydigan 1–2-kurs talabalari\"</b> deb yozing. Segment qanchalik aniq bo'lsa, reklama shuncha arzon tushadi.",
   "🧑‍🎓 <b>Exercise:</b> do not write \"my customer is young people\". Write <b>\"first- and second-year students living in a dormitory in Termez who spend up to 1.5 million so'm a month\"</b>. The sharper the segment, the cheaper the advertising.", 'class="quote" style="margin-top:16px"'))

# ============================ 9. QIYMAT TAKLIFI ============================
slide("② Qiymat taklifi", "② Value proposition",
 E("span", "2.2 · Canvasning yuragi", "2.2 · The heart of the canvas", 'class="kicker"') +
 E("h2", "② Qiymat taklifi — <span class=\"grad\">mijoz nima uchun aynan sizga to'laydi</span>", "② Value proposition — <span class=\"grad\">why the customer pays you and not someone else</span>") +
 E("div", "<b>Qiymat taklifi</b> — mijoz sizni tanlashining sababi. U mahsulot ta'rifi emas, <b>mijozning foydasi</b>: tejalgan vaqt, kamaygan xarajat, yo'qolgan bosh og'rig'i.",
   "The <b>value proposition</b> is the reason a customer chooses you. It is not a description of the product but <b>the customer's gain</b>: time saved, cost reduced, a headache removed.", 'class="def"') +
 '<div class="grid g2" style="margin-top:14px">' +
 card_ul("green", "🧮", "Qiymat qanday yaratiladi?", "How is value created?",
         [("<b>Yangilik</b> — ilgari bo'lmagan ehtiyojni qondirish", "<b>Newness</b> — meeting a need that did not exist before"),
          ("<b>Unumdorlik</b> — tez, kuchli, sifatliroq bajarish", "<b>Performance</b> — doing it faster, stronger, better"),
          ("<b>Narx</b> — xuddi shu natijani arzonroqqa berish", "<b>Price</b> — the same result for less money"),
          ("<b>Qulaylik</b> — mijozning vaqti va kuchini tejash", "<b>Convenience</b> — saving the customer time and effort"),
          ("<b>Xavfni kamaytirish</b> — kafolat, qaytarish, sinov muddati", "<b>Risk reduction</b> — a guarantee, returns, a trial period"),
          ("<b>Brend va maqom</b> — mijoz o'zini qanday his qilishi", "<b>Brand and status</b> — how the customer feels about themselves")]) +
 '<div class="card" style="--c:var(--blue)"><span class="icon">📝</span>' + E("h3", "Formula bo'yicha yozing", "Write it to a formula") +
 E("p", "Bitta gapga sig'diring:", "Fit it into a single sentence:") +
 E("div", "<b>[Mijoz]</b> uchun <b>[muammo]</b>ni <b>[yechim]</b> orqali hal qilamiz, natijada u <b>[aniq foyda]</b>ga erishadi.", "For <b>[customer]</b> we solve <b>[problem]</b> through <b>[solution]</b>, so that they gain <b>[a specific benefit]</b>.", 'class="quote"') +
 E("p", "<b>Misol:</b> \"Yotoqxonadagi talaba uchun issiq ovqat muammosini oldindan buyurtma va 12:00 da yetkazib berish orqali hal qilamiz — u <b>navbatda 40 daqiqa turmaydi</b>.\"", "<b>Example:</b> \"For a student in a dormitory we solve the hot-food problem with pre-ordering and delivery at 12:00 — they <b>do not spend 40 minutes in a queue</b>.\"") +
 E("p", "✕ <b>Yomon misol:</b> \"Biz sifatli va arzon ovqat taklif qilamiz.\" — Buni <b>har kim</b> ayta oladi, demak bu qiymat taklifi emas.", "✕ <b>A bad example:</b> \"We offer good, cheap food.\" — <b>Anyone</b> can say that, so it is not a value proposition.") +
 '</div></div>' +
 E("small", "Tekshiruv: qiymat taklifingizni raqobatchining nomiga almashtirsangiz ham to'g'ri chiqsa — u <b>hali yetarlicha aniq emas</b>.", "A test: if your value proposition still reads correctly with a competitor's name in it, it is <b>not specific enough yet</b>.", 'class="note"'))

# ============================ 10. QIYMAT TAKLIFI KANVASI ============================
slide("Qiymat taklifi kanvasi", "Value proposition canvas",
 E("span", "2.3 · Qiymatni chuqurroq", "2.3 · Value in depth", 'class="kicker"') +
 E("h2", "Qiymat taklifi kanvasi — <span class=\"grad\">mijoz profili va qiymat xaritasi</span>", "The value proposition canvas — <span class=\"grad\">customer profile and value map</span>") +
 E("div", "2014-yilda Osterwalder jamoasi (<i>Value Proposition Design</i> kitobi) canvasning ikki blokini — <b>segment</b> va <b>qiymat taklifi</b>ni kattalashtirib ko'rsatdi. Maqsad — <b>moslik (fit)</b>: taklif mijozning eng muhim <b>vazifasi, og'rig'i va istagiga</b> aniq javob bersin.",
   "In 2014 Osterwalder's team (the book <i>Value Proposition Design</i>) zoomed in on two blocks of the canvas — the <b>segment</b> and the <b>value proposition</b>. The goal is <b>fit</b>: the offer must answer the customer's most important <b>jobs, pains and gains</b>.", 'class="def"') +
 '<div class="grid g2" style="margin-top:14px">' +
 card_ul("blue", "👤", "Mijoz profili (o'ng tomon)", "Customer profile (right side)",
         [("<b>Vazifalar (jobs)</b> — mijoz bajarmoqchi bo'lgan ish: funksional (ovqatlanish), ijtimoiy (obro'), hissiy (xotirjamlik)", "<b>Jobs</b> — what the customer is trying to get done: functional (eat), social (status), emotional (peace of mind)"),
          ("<b>Og'riqlar (pains)</b> — noqulaylik, xavf va to'siqlar: «navbat uzun», «ovqat sovuq keladi»", "<b>Pains</b> — annoyances, risks and obstacles: \"the queue is long\", \"the food arrives cold\""),
          ("<b>Istaklar (gains)</b> — kutilgan va kutilmagan foyda: «tez», «issiq», «arzonroq», «sog'lom»", "<b>Gains</b> — expected and unexpected benefits: \"fast\", \"hot\", \"cheaper\", \"healthy\"")]) +
 card_ul("green", "🎁", "Qiymat xaritasi (chap tomon)", "Value map (left side)",
         [("<b>Mahsulot va xizmatlar</b> — nimani taklif qilamiz", "<b>Products and services</b> — what we offer"),
          ("<b>Og'riq qoldiruvchilar</b> — qaysi og'riqni qanday kamaytiramiz (termo-sumka → ovqat issiq)", "<b>Pain relievers</b> — which pain we ease and how (a thermal bag → hot food)"),
          ("<b>Foyda yaratuvchilar</b> — qaysi istakni qanday ro'yobga chiqaramiz (12:00 da aniq yetkazish)", "<b>Gain creators</b> — which gain we deliver and how (delivery at exactly 12:00)")]) +
 '</div>' +
 E("div", "🥤 <b>Dunyo misoli — «sutli kokteyl vazifasi».</b> Klayton Kristensen (Garvard) jamoasi fast-fud restoranida sutli kokteyllarning katta qismi <b>ertalab, yo'lga chiqqan haydovchilarga</b> sotilishini aniqladi. Ular kokteylni ta'mi uchun emas, <b>uzoq yo'lda zerikmaslik va tushlikkacha to'q yurish</b> uchun «yollashgan». Raqib — boshqa kokteyl emas, <b>banan, donut va radio</b> edi. Xulosa: mahsulotni emas, <b>mijoz vazifasini</b> o'rganing.",
   "🥤 <b>A global example — \"the milkshake job\".</b> Clayton Christensen's team (Harvard) found that a large share of a fast-food chain's milkshakes were sold <b>in the morning to commuters</b>. They \"hired\" the milkshake not for its taste but <b>to beat boredom on a long drive and stay full until lunch</b>. The competition was not other milkshakes but <b>bananas, doughnuts and the radio</b>. The lesson: study <b>the customer's job</b>, not the product.", 'class="quote" style="margin-top:14px"') +
 E("small", "Talabaga: o'z g'oyangiz uchun <b>3 ta vazifa, 3 ta og'riq va 3 ta istak</b> yozing — har biriga taklifingizda javob bormi?", "For students: write <b>three jobs, three pains and three gains</b> for your own idea — does your offer answer each of them?", 'class="note"'))

# ============================ 11. KANALLAR ============================
slide("③ Kanallar", "③ Channels",
 E("span", "2.4 · Mijozgacha bo'lgan yo'l", "2.4 · The route to the customer", 'class="kicker"') +
 E("h2", "③ Kanallar — <span class=\"grad\">qiymat mijozga qanday yetib boradi</span>", "③ Channels — <span class=\"grad\">how value reaches the customer</span>") +
 E("div", "<b>Kanal</b> — mijoz mahsulot haqida <b>biladigan</b>, uni <b>baholaydigan</b>, <b>sotib oladigan</b>, <b>qo'lga oladigan</b> va <b>yordam oladigan</b> yo'l. Bitta kanal emas, <b>5 ta bosqich</b> borligini unutmang.",
   "A <b>channel</b> is the path along which a customer <b>learns about</b> the product, <b>evaluates</b> it, <b>buys</b> it, <b>receives</b> it and <b>gets support</b>. Remember it is not one channel but <b>five stages</b>.", 'class="def"') +
 table([("Bosqich", "Stage"), ("Savol", "Question"), ("Misol", "Example")], [
  [TD("<b>1. Xabardorlik</b>", "<b>1. Awareness</b>"), TD("Mijoz bizni qanday biladi?", "How does the customer hear about us?"), TD("Instagram, Telegram kanal, og'zaki reklama", "Instagram, a Telegram channel, word of mouth")],
  [TD("<b>2. Baholash</b>", "<b>2. Evaluation</b>"), TD("Taklifni qanday solishtiradi?", "How do they compare the offer?"), TD("Sayt, sharhlar, tanishlarning tavsiyasi", "A website, reviews, a friend's recommendation")],
  [TD("<b>3. Sotib olish</b>", "<b>3. Purchase</b>"), TD("Qayerda va qanday to'laydi?", "Where and how do they pay?"), TD("Do'kon, bot, Payme/Click, naqd", "A shop, a bot, Payme/Click, cash")],
  [TD("<b>4. Yetkazish</b>", "<b>4. Delivery</b>"), TD("Mahsulotni qanday oladi?", "How do they receive the product?"), TD("Kuryer, o'zi olib ketish, yuklab olish", "A courier, self-pickup, a download")],
  [TD("<b>5. Xizmat</b>", "<b>5. After-sales</b>"), TD("Muammo chiqsa nima bo'ladi?", "What happens if something goes wrong?"), TD("Qo'llab-quvvatlash, kafolat, qaytarish", "Support, a guarantee, returns")],
 ]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("green", "🏠", "O'z kanali", "Own channel", "O'z do'koni, sayti, boti, sotuvchisi. <b>Nazorat yuqori, foyda katta</b>, lekin qurish qimmat va sekin.", "Your own shop, site, bot or sales staff. <b>High control, bigger margin</b>, but expensive and slow to build.") +
 card("orange", "🤝", "Sherik kanali", "Partner channel", "Marketpleys, ulgurji sotuvchi, do'konlar tarmog'i. <b>Tez va keng</b>, lekin komissiya va nazoratning bir qismi yo'qoladi.", "A marketplace, a wholesaler, a retail chain. <b>Fast and wide</b>, but you lose a commission and some control.") +
 '</div>' +
 E("small", "Boshlovchi tadbirkor uchun oqilona yo'l: <b>sherik kanali bilan tez boshlash</b>, pul kelgach <b>o'z kanalini qurish</b>. Dunyo misoli: ko'plab brendlar avval Amazon yoki Uzum orqali sotib, keyin o'z sayti va do'konini ochgan.",
   "A sensible path for a beginner: <b>start quickly through a partner channel</b>, then <b>build your own</b> once the money comes in. Many brands first sold through Amazon or Uzum and only later opened their own site and shops.", 'class="note"'))

# ============================ 12. MUNOSABAT VA DAROMAD ============================
slide("④ Munosabat · ⑤ Daromad", "④ Relationships · ⑤ Revenue",
 E("span", "2.5 · Ushlab qolish va pul", "2.5 · Retention and money", 'class="kicker"') +
 E("h2", "④ Mijoz bilan munosabat va ⑤ <span class=\"grad\">daromad oqimlari</span>", "④ Customer relationships and ⑤ <span class=\"grad\">revenue streams</span>") +
 '<div class="grid g2">' +
 card_ul("blue", "💬", "④ Munosabat turlari", "④ Types of relationship",
         [("<b>Shaxsiy xizmat</b> — jonli sotuvchi, menejer", "<b>Personal assistance</b> — a live salesperson or manager"),
          ("<b>Maxsus menejer</b> — yirik mijozga biriktirilgan xodim", "<b>Dedicated assistance</b> — a manager assigned to a large client"),
          ("<b>O'z-o'ziga xizmat</b> — mijoz hamma ishni o'zi qiladi", "<b>Self-service</b> — the customer does everything themselves"),
          ("<b>Avtomatlashtirilgan</b> — bot, tavsiya tizimi", "<b>Automated services</b> — a bot, a recommendation engine"),
          ("<b>Hamjamiyat</b> — foydalanuvchilar guruhi, forum", "<b>Communities</b> — a user group, a forum"),
          ("<b>Hammualliflik</b> — mijoz mahsulotni o'zi to'ldiradi (sharh, video)", "<b>Co-creation</b> — the customer adds to the product (reviews, videos)")],
         tail=E("p", "📌 Harvard Business Review ma'lumotiga ko'ra, yangi mijoz jalb qilish eskisini saqlab qolishdan <b>5–25 barobar qimmat</b>; Bain & Company hisobicha, mijozni saqlab qolishni atigi <b>5% ga oshirish foydani 25–95% ga</b> ko'tarishi mumkin.",
                "📌 According to Harvard Business Review, winning a new customer costs <b>5–25 times more</b> than keeping one; Bain & Company estimates that raising retention by just <b>5% can lift profit by 25–95%</b>.")) +
 card_ul("violet", "💰", "⑤ Daromad oqimlari", "⑤ Revenue streams",
         [("<b>Sotuv</b> — mahsulot mulki mijozga o'tadi", "<b>Asset sale</b> — ownership passes to the customer"),
          ("<b>Foydalanish haqi</b> — xizmatdan foydalangani uchun", "<b>Usage fee</b> — payment for using the service"),
          ("<b>Obuna</b> — oylik yoki yillik doimiy to'lov", "<b>Subscription</b> — a recurring monthly or yearly fee"),
          ("<b>Ijara</b> — vaqtincha foydalanish huquqi", "<b>Renting</b> — the right to use for a period"),
          ("<b>Litsenziya</b> — intellektual mulkdan foydalanish", "<b>Licensing</b> — the use of intellectual property"),
          ("<b>Vositachilik haqi</b> — har bitimdan komissiya", "<b>Brokerage fee</b> — a commission on each transaction"),
          ("<b>Reklama</b> — auditoriyaga e'lon joylashtirish", "<b>Advertising</b> — placing ads in front of an audience")],
         tail=E("p", "🧠 Kuchli model — <b>bir nechta oqim</b>: masalan, mahsulot sotuvi + xizmat ko'rsatish + o'quv kursi.", "🧠 A strong model has <b>several streams</b>: for example product sales + services + a training course.")) +
 '</div>' +
 E("div", "💡 <b>Narx qanday belgilanadi?</b> <b>Qat'iy narx</b> — hamma uchun bir xil (menyu, narxnoma). <b>Dinamik narx</b> — vaziyatga qarab o'zgaradi: savdolashuv, auksion, talabga qarab narx (aviachipta, taksi). Yangi biznes uchun avval <b>qat'iy narx</b> tavsiya etiladi — hisob-kitob osonroq.",
   "💡 <b>How is the price set?</b> A <b>fixed price</b> is the same for everyone (a menu, a price list). A <b>dynamic price</b> changes with the situation: negotiation, auction, demand-based pricing (air tickets, taxis). For a new business a <b>fixed price</b> is recommended first — the maths is simpler.", 'class="quote" style="margin-top:14px"'))

# ============================ 13. RESURSLAR ============================
slide("⑥ Asosiy resurslar", "⑥ Key resources",
 E("span", "2.6 · Modelning tayanchi", "2.6 · The backbone of the model", 'class="kicker"') +
 E("h2", "⑥ Asosiy resurslar — <span class=\"grad\">busiz model ishlamaydi</span>", "⑥ Key resources — <span class=\"grad\">without them the model stops</span>") +
 E("div", "<b>Asosiy resurs</b> — qiymat taklifini yaratish, kanalni ishlatish va daromad olish uchun <b>majburiy</b> bo'lgan aktiv. Savol oddiy: <b>\"Bu narsa bo'lmasa, biznes to'xtaydimi?\"</b> Agar javob \"ha\" bo'lsa — bu asosiy resurs.",
   "A <b>key resource</b> is an asset that is <b>indispensable</b> for creating the value proposition, running the channel and earning revenue. The test is simple: <b>\"if this disappeared, would the business stop?\"</b> If yes, it is a key resource.", 'class="def"') +
 '<div class="grid g4" style="margin-top:16px">' +
 card("orange", "🏭", "Moddiy", "Physical", "Bino, uskuna, transport, do'kon, tovar zaxirasi, jihozlar.", "Buildings, equipment, vehicles, shops, stock, fittings.") +
 card("violet", "🧠", "Intellektual", "Intellectual", "Brend, retsept, dasturiy ta'minot, patent, mijozlar bazasi. Coca-Cola retsepti — klassik misol.", "A brand, a recipe, software, a patent, a customer base. The Coca-Cola recipe is the classic example.") +
 card("green", "👨‍🍳", "Inson resursi", "Human", "Oshpaz, dasturchi, sotuvchi, o'qituvchi — malakali jamoa.", "A cook, a developer, a salesperson, a teacher — a skilled team.") +
 card("blue", "💵", "Moliyaviy", "Financial", "O'z mablag'i, kredit liniyasi, investor puli, kafolat fondi.", "Own funds, a credit line, investor money, a guarantee fund.") +
 '</div>' +
 '<div class="grid g2" style="margin-top:16px">' +
 card_ul("cyan", "⚖️", "Sotib olish yoki ijaraga olish?", "Buy or rent?",
         [("Boshida <b>ijara</b> — xavf kam, pul band bo'lmaydi", "At the start, <b>rent</b> — less risk, no money tied up"),
          ("Talab tasdiqlangach <b>sotib olish</b> — tannarx pasayadi", "Once demand is proven, <b>buy</b> — the unit cost falls"),
          ("Asosiy bo'lmagan ishni <b>tashqaridan</b> oling (autsorsing)", "Take non-core work <b>from outside</b> (outsourcing)")]) +
 '<div class="card" style="--c:var(--red)"><span class="icon">⚠️</span>' + E("h3", "Tipik xato", "A typical mistake") +
 E("p", "Mijoz topilmasdan turib <b>qimmat uskuna sotib olish</b>. Uskuna — resurs, lekin mijoz yo'q bo'lsa, u <b>omborda turgan pul</b>ga aylanadi.", "<b>Buying expensive equipment</b> before finding a customer. Equipment is a resource, but with no customers it is just <b>money sitting in a warehouse</b>.") +
 E("p", "🧠 To'g'ri tartib: <b>mijozni tasdiqla → kichik hajmda ishla → keyin resursga investitsiya qil</b>.", "🧠 The right order: <b>confirm the customer → run small → then invest in resources</b>.") +
 '</div></div>')

# ============================ 14. FAOLIYAT VA HAMKORLAR ============================
slide("⑦ Faoliyat · ⑧ Hamkorlar", "⑦ Activities · ⑧ Partners",
 E("span", "2.7 · Ish va yordamchilar", "2.7 · The work and the helpers", 'class="kicker"') +
 E("h2", "⑦ Asosiy faoliyat va ⑧ <span class=\"grad\">asosiy hamkorlar</span>", "⑦ Key activities and ⑧ <span class=\"grad\">key partners</span>") +
 '<div class="grid g2">' +
 '<div class="card" style="--c:var(--orange)"><span class="icon">⚙️</span>' + E("h3", "⑦ Asosiy faoliyat", "⑦ Key activities") +
 E("p", "Kompaniya <b>har kuni bajarishi shart</b> bo'lgan eng muhim ishlar. Uch xil bo'ladi:", "The most important things a company <b>must do every day</b>. There are three kinds:") +
 '<ul class="tick">' +
 E("li", "<b>Ishlab chiqarish</b> — mahsulot yaratish, tayyorlash, yig'ish", "<b>Production</b> — creating, preparing and assembling the product") +
 E("li", "<b>Muammo yechish</b> — har bir mijozga alohida yechim (konsalting, ta'mirlash, tibbiyot)", "<b>Problem solving</b> — an individual solution for each client (consulting, repairs, medicine)") +
 E("li", "<b>Platforma boshqarish</b> — tizimni ishlatish va rivojlantirish (sayt, ilova, tarmoq)", "<b>Platform management</b> — running and developing the system (a site, an app, a network)") +
 '</ul>' +
 E("p", "📌 Bu blokni to'ldirishning oson yo'li: <b>qiymat taklifiga qarang</b> — uni yaratish uchun qanday ish qilinishi kerak?", "📌 An easy way to fill this block: <b>look at the value proposition</b> — what work is needed to create it?") +
 '</div>' +
 '<div class="card" style="--c:var(--cyan)"><span class="icon">🤝</span>' + E("h3", "⑧ Asosiy hamkorlar", "⑧ Key partners") +
 E("p", "Hamma ishni o'zingiz qilolmaysiz. Hamkor — <b>sizning zaif joyingizni to'ldiradigan</b> tashqi tomon.", "You cannot do everything yourself. A partner is an outside party that <b>covers your weak spot</b>.") +
 '<ul class="tick">' +
 E("li", "<b>Yetkazib beruvchilar</b> — xomashyo, tovar, uskuna", "<b>Suppliers</b> — raw materials, goods, equipment") +
 E("li", "<b>Strategik ittifoq</b> — raqobatchi bo'lmagan kompaniya bilan hamkorlik", "<b>Strategic alliance</b> — cooperation with a non-competing company") +
 E("li", "<b>Raqobatchi bilan hamkorlik</b> — umumiy xarajatni birga ko'tarish", "<b>Coopetition</b> — sharing a common cost with a competitor") +
 E("li", "<b>Qo'shma korxona</b> — yangi yo'nalishni birga ochish", "<b>Joint venture</b> — opening a new line of business together") +
 E("li", "<b>Xizmat ko'rsatuvchilar</b> — logistika, buxgalteriya, IT, marketing", "<b>Service providers</b> — logistics, accounting, IT, marketing") +
 '</ul>' +
 E("p", "🎯 Hamkorlik 3 sababdan kerak: <b>xarajatni kamaytirish</b>, <b>xavfni bo'lishish</b>, <b>o'zingizda yo'q resursni olish</b>. Dunyo misoli: Apple iPhone'ni o'zi yig'maydi — yig'ishni Foxconn kabi hamkorlarga beradi.",
   "🎯 Partnerships exist for three reasons: <b>to cut costs</b>, <b>to share risk</b>, <b>to get a resource you lack</b>. A global example: Apple does not assemble the iPhone itself — partners such as Foxconn do.") +
 '</div></div>' +
 E("div", "🧪 <b>Tekshiruv savoli:</b> \"Agar shu hamkor ertaga ishlashdan bosh tortsa, biznesim necha kun ishlay oladi?\" Javob <b>\"bir necha kun\"</b> bo'lsa — sizda <b>jiddiy qaramlik</b> bor. Yechim: <b>zaxira hamkor</b> topib qo'yish.",
   "🧪 <b>A test question:</b> \"if this partner walked away tomorrow, how many days would my business keep running?\" If the answer is <b>a few days</b>, you have <b>a serious dependency</b>. The fix: line up <b>a back-up partner</b>.", 'class="quote" style="margin-top:14px"'))

# ============================ 15. XARAJATLAR ============================
slide("⑨ Xarajatlar tuzilmasi", "⑨ Cost structure",
 E("span", "2.8 · Haqiqat oni", "2.8 · The moment of truth", 'class="kicker"') +
 E("h2", "⑨ Xarajatlar tuzilmasi va <span class=\"grad\">birlik iqtisodiyoti</span>", "⑨ Cost structure and <span class=\"grad\">unit economics</span>") +
 '<div class="grid g2">' +
 '<div class="card" style="--c:var(--red)"><span class="icon">🧾</span>' + E("h3", "Ikki xil xarajat", "Two kinds of cost") +
 E("p", "<b>Doimiy xarajat</b> — sotuv bo'lsa ham, bo'lmasa ham to'lanadi: ijara, oylik maosh, internet, litsenziya.", "<b>Fixed costs</b> are paid whether you sell or not: rent, salaries, internet, licences.") +
 E("p", "<b>O'zgaruvchan xarajat</b> — har bir sotilgan birlikka bog'liq: xomashyo, qadoq, yetkazish, tranzaksiya komissiyasi.", "<b>Variable costs</b> depend on each unit sold: raw materials, packaging, delivery, transaction fees.") +
 E("p", "📌 Doimiy xarajat qancha katta bo'lsa, biznes <b>shuncha xavfli</b>: savdo tushsa ham u to'xtamaydi.", "📌 The larger the fixed costs, the <b>riskier</b> the business: they keep running even when sales fall.") +
 '</div>' +
 '<div class="card" style="--c:var(--green)"><span class="icon">🧮</span>' + E("h3", "Birlik iqtisodiyoti", "Unit economics") +
 E("p", "Modelning sog'lomligi <b>bitta mijozdan</b> ko'rinadi. Eng oddiy hisob:", "The health of a model shows up in <b>a single customer</b>. The simplest calculation:") +
 E("div", "<b>Bir birlik foydasi = narx − o'zgaruvchan xarajat − mijoz jalb qilish xarajati</b>", "<b>Profit per unit = price − variable cost − customer acquisition cost</b>", 'class="quote"') +
 E("p", "<b>Misol:</b> tushlik narxi 20 000, tayyorlash 12 000, yetkazish 2 000, reklama bir mijozga 1 000 → foyda <b>5 000 so'm</b>.", "<b>Example:</b> a lunch sells for 20,000, costs 12,000 to make, 2,000 to deliver and 1,000 in advertising per customer → profit <b>5,000 so'm</b>.") +
 E("p", "Doimiy xarajat oyiga 3 000 000 so'm bo'lsa: <b>3 000 000 ÷ 5 000 = 600 ta buyurtma</b> — bu <b>zararsizlik nuqtasi</b>.", "If fixed costs are 3,000,000 so'm a month: <b>3,000,000 ÷ 5,000 = 600 orders</b> — that is the <b>break-even point</b>.") +
 '</div></div>' +
 table([("Yondashuv", "Approach"), ("Mohiyati", "What it means"), ("Dunyo misoli", "Global example")], [
  [TD("<b>Xarajatga yo'naltirilgan</b>", "<b>Cost-driven</b>"), TD("Maksimal arzonlashtirish, avtomatlashtirish, minimal xizmat", "Maximum cost cutting, automation, minimal service"), TD("Ryanair, IKEA — arzon narx, «ortiqcha» xizmat pullik", "Ryanair, IKEA — low prices, \"extras\" cost more")],
  [TD("<b>Qiymatga yo'naltirilgan</b>", "<b>Value-driven</b>"), TD("Yuqori sifat, shaxsiy xizmat, premium taassurot", "High quality, personal service, a premium experience"), TD("Ritz-Carlton, Rolex — narx emas, taassurot sotiladi", "Ritz-Carlton, Rolex — they sell an experience, not a price")],
 ]) +
 E("small", "⚠️ Eng ko'p uchraydigan xato: bir birlikdan <b>foyda qolmaydigan</b> modelni reklama bilan kengaytirish. Har bir yangi mijoz bunda <b>zararni ko'paytiradi</b> — avval birlik iqtisodiyotini musbat qiling, keyin o'sing.",
   "⚠️ The most common mistake: scaling up with advertising a model that makes <b>no profit per unit</b>. Every new customer then <b>increases the loss</b> — make the unit economics positive first, then grow.", 'class="note"'))

# ============================ 16. LTV, CAC, CHURN ============================
slide("LTV, CAC va churn", "LTV, CAC and churn",
 E("span", "2.9 · Model sog'lomligining 3 ko'rsatkichi", "2.9 · Three health indicators of a model", 'class="kicker"') +
 E("h2", "LTV, CAC va churn — <span class=\"grad\">bitta mijoz qancha pul keltiradi?</span>", "LTV, CAC and churn — <span class=\"grad\">how much money does one customer bring?</span>") +
 '<div class="grid g3">' +
 card("violet", "💎", "LTV — mijozning umrbod qiymati", "LTV — customer lifetime value", "Bitta mijoz kompaniya bilan <b>butun munosabati davomida</b> keltiradigan yalpi foyda. Obunada: <b>LTV = oylik to'lov × marja ÷ oylik churn</b>.", "The gross profit one customer brings over <b>the whole relationship</b> with the company. For a subscription: <b>LTV = monthly fee × margin ÷ monthly churn</b>.") +
 card("blue", "🎯", "CAC — jalb qilish xarajati", "CAC — customer acquisition cost", "Bitta yangi mijozni topishga ketgan pul: <b>CAC = reklama va sotuv xarajati ÷ yangi mijozlar soni</b>.", "The money spent to win one new customer: <b>CAC = marketing and sales spend ÷ number of new customers</b>.") +
 card("orange", "🚪", "Churn — ketish ulushi", "Churn — the leaving rate", "Ma'lum davrda xizmatdan voz kechgan mijozlar ulushi. Mijozning o'rtacha «umri» ≈ <b>1 ÷ churn</b>: oylik 5% → 20 oy.", "The share of customers who leave in a period. The average customer \"lifetime\" ≈ <b>1 ÷ churn</b>: 5% a month → 20 months.") +
 '</div>' +
 '<div class="grid g2" style="margin-top:14px">' +
 '<div class="card" style="--c:var(--green)"><span class="icon">🧮</span>' + E("h3", "Misol: oylik ovqat obunasi", "Example: a monthly meal plan") +
 E("p", "Obuna 60 000 so'm, yalpi marja 50% → har oy <b>30 000 so'm</b> foyda. Churn oyiga 5% → mijoz o'rtacha <b>20 oy</b> qoladi.", "The plan costs 60,000 so'm with a 50% gross margin → <b>30,000 so'm</b> profit a month. Churn is 5% a month → a customer stays <b>20 months</b> on average.") +
 E("div", "<b>LTV = 30 000 × 20 = 600 000 so'm.</b> CAC 150 000 so'm bo'lsa, <b>LTV/CAC = 4</b> — model sog'lom.", "<b>LTV = 30,000 × 20 = 600,000 so'm.</b> If CAC is 150,000 so'm, <b>LTV/CAC = 4</b> — a healthy model.", 'class="quote"') +
 E("p", "Agar CAC 400 000 so'm bo'lsa, LTV/CAC = 1,5 — har mijozdan foyda bor, lekin reklamani kengaytirish <b>xavfli</b>.", "If CAC were 400,000 so'm, LTV/CAC = 1.5 — each customer still pays off, but scaling the advertising is <b>risky</b>.") +
 '</div>' +
 table([("Qoida (dunyo amaliyoti)", "Rule of thumb"), ("Ma'nosi", "What it means")], [
  [TD("<b>LTV/CAC ≥ 3</b>", "<b>LTV/CAC ≥ 3</b>"), TD("Reklamaga ketgan har 1 so'm kamida 3 so'm yalpi foyda qaytaradi", "Every so'm spent on acquisition returns at least 3 so'm of gross profit")],
  [TD("<b>CAC qoplanishi &lt; 12 oy</b>", "<b>CAC payback &lt; 12 months</b>"), TD("Mijozga sarflangan pul bir yil ichida qaytadi", "The money spent on a customer comes back within a year")],
  [TD("<b>Churn pasaysa</b>", "<b>Lower churn</b>"), TD("LTV o'sadi — ushlab qolish eng arzon o'sish yo'li", "LTV grows — retention is the cheapest way to grow")],
  [TD("<b>Oylik churn 5%</b>", "<b>5% monthly churn</b>"), TD("Bir yilda mijozlarning ≈46% i ketadi (0,95¹² ≈ 0,54)", "About 46% of customers leave in a year (0.95¹² ≈ 0.54)")],
 ]) +
 '</div>' +
 E("div", "⚠️ <b>Dunyo saboqlari.</b> <b>MoviePass</b> (AQSh) 2017-yilda oyiga 9,95 $ ga har kuni bitta kino ko'rishni taklif qildi, kinoteatrga esa har bir chipta uchun <b>to'liq narx</b> to'ladi — har bir faol mijoz zarar keltirdi, o'sish zararni ko'paytirdi va 2019-yilda xizmat to'xtadi. <b>WeWork</b> binolarni uzoq muddatga ijaraga olib, joyni oylab qayta sotdi — talab tushganda doimiy xarajat qoldi va 2023-yilda kompaniya bankrotlik e'lon qildi.",
   "⚠️ <b>Global lessons.</b> In 2017 <b>MoviePass</b> (USA) offered a film a day for $9.95 a month while paying cinemas <b>the full ticket price</b> — every active customer lost money, growth multiplied the loss, and the service shut down in 2019. <b>WeWork</b> leased buildings for many years and re-let the space month by month — when demand fell the fixed costs stayed, and in 2023 the company filed for bankruptcy.", 'class="quote" style="margin-top:14px"'))

# ============================ 17. OBUNA VA FRANSHIZA ============================
slide("Obuna va franshiza", "Subscription and franchise",
 E("span", "3-blok", "Block 3", 'class="kicker"') +
 E("h2", "Zamonaviy andozalar I — <span class=\"grad\">obuna va franshiza</span>", "Modern patterns I — <span class=\"grad\">subscription and franchise</span>") +
 '<div class="grid g2">' +
 '<div class="card" style="--c:var(--violet)"><span class="icon">🔁</span>' + E("h3", "Obuna tizimi (subscription)", "The subscription model") +
 E("p", "Mijoz bir martalik emas, <b>muntazam</b> to'laydi: oyiga yoki yiliga. Buning evaziga xizmat to'xtovsiz ishlaydi.", "The customer pays <b>regularly</b> rather than once: monthly or yearly. In return the service runs without interruption.") +
 E("p", "<b>Misollar:</b> Netflix va Spotify (kontent), Microsoft 365 va Adobe Creative Cloud (dastur), sport zali abonementi, oylik ovqat paketi.", "<b>Examples:</b> Netflix and Spotify (content), Microsoft 365 and Adobe Creative Cloud (software), a gym membership, a monthly meal plan.") +
 '<ul class="tick">' + E("li", "<b>Daromad bashorat qilinadi</b> — kelgusi oyni rejalashtirish oson", "<b>Revenue is predictable</b> — next month is easy to plan") +
 E("li", "<b>Bir mijoz uzoq vaqt daromad beradi</b> — LTV o'sadi", "<b>One customer earns for a long time</b> — LTV grows") + '</ul>' +
 '<ul class="tick cross">' + E("li", "Mijoz istalgan vaqtda <b>bekor qilishi</b> mumkin — churn ustida doim ishlash kerak", "The customer can <b>cancel</b> at any moment — churn needs constant work") +
 E("li", "Qiymat har oy <b>qayta isbotlanishi</b> shart", "The value must be <b>proved again every month</b>") + '</ul>' +
 E("p", "🧠 <b>Adobe</b> 2013-yilda qutidagi dasturdan Creative Cloud obunasiga o'tdi: yillik tushum ~4 mlrd $ dan 2024-yilda <b>~21,5 mlrd $</b> ga yetdi. <b>Dollar Shave Club</b> ustaralarni oylik obuna bilan uyga yetkazdi — 2016-yilda Unilever uni <b>~1 mlrd $</b> ga sotib oldi.",
   "🧠 In 2013 <b>Adobe</b> moved from boxed software to the Creative Cloud subscription: annual revenue grew from about $4 billion to <b>about $21.5 billion</b> in 2024. <b>Dollar Shave Club</b> delivered razors by monthly subscription — in 2016 Unilever bought it for <b>about $1 billion</b>.") +
 '</div>' +
 '<div class="card" style="--c:var(--orange)"><span class="icon">🏪</span>' + E("h3", "Franshiza", "Franchise") +
 E("p", "Brend egasi (<b>franchayzer</b>) o'z nomi, texnologiyasi va standartlarini boshqa tadbirkorga (<b>franchayzi</b>) shartnoma asosida foydalanishga beradi.", "The brand owner (the <b>franchisor</b>) lets another entrepreneur (the <b>franchisee</b>) use its name, technology and standards under a contract.") +
 E("p", "<b>To'lovlar:</b> boshlang'ich <b>franshiza haqi</b> (kirish to'lovi) va muntazam <b>royalti</b> — odatda tushumdan foiz.", "<b>Payments:</b> an initial <b>franchise fee</b> to join and a recurring <b>royalty</b> — usually a percentage of turnover.") +
 '<ul class="tick">' + E("li", "Franchayzi <b>tayyor brend va tizim</b> oladi — xavf kamayadi", "The franchisee gets <b>a ready brand and system</b> — less risk") +
 E("li", "Franchayzer <b>o'z puliga qurmasdan</b> tarmoqni kengaytiradi, xavf ham bo'linadi", "The franchisor expands <b>without spending its own capital</b>, and the risk is shared") + '</ul>' +
 '<ul class="tick cross">' + E("li", "Franchayzi <b>standartga qattiq bog'langan</b> — ijodkorlik chegaralangan", "The franchisee is <b>tied to the standards</b> — creativity is limited") +
 E("li", "Bitta nuqtadagi xato <b>butun brendga</b> zarar yetkazadi", "A mistake at one outlet damages <b>the whole brand</b>") + '</ul>' +
 E("p", "🍔 <b>McDonald's</b>: 100 dan ortiq mamlakatda 40 mingdan ortiq restoran, ularning <b>taxminan 95% i</b> mustaqil franchayzilarniki. O'zbekistonga kirgan xalqaro tarmoqlar ham ko'pincha shu yo'l bilan keladi.",
   "🍔 <b>McDonald's</b>: over 40,000 restaurants in more than 100 countries, <b>about 95%</b> of them owned by independent franchisees. International chains entering Uzbekistan often come the same way.") +
 '</div></div>')

# ============================ 18. PLATFORMA, B2B, B2C ============================
slide("Platforma · B2B · B2C", "Platform · B2B · B2C",
 E("span", "3.2 · Yana uch model", "3.2 · Three more models", 'class="kicker"') +
 E("h2", "Zamonaviy andozalar II — <span class=\"grad\">platforma, B2B va B2C</span>", "Modern patterns II — <span class=\"grad\">platform, B2B and B2C</span>") +
 '<div class="grid g3">' +
 '<div class="card" style="--c:var(--blue)"><span class="icon">🌐</span>' + E("h3", "Onlayn platforma", "Online platform") +
 E("p", "Kompaniya mahsulot ishlab chiqarmaydi — <b>ikki tomonni bog'laydi</b> va har bitimdan komissiya oladi.", "The company makes no product — it <b>connects two sides</b> and takes a commission on each transaction.") +
 E("p", "<b>Misollar:</b> Amazon va Uzum Market (sotuvchi ↔ xaridor), Uber va Yandex Go (haydovchi ↔ yo'lovchi), Airbnb (uy egasi ↔ mehmon), Booking (mehmonxona ↔ sayyoh).", "<b>Examples:</b> Amazon and Uzum Market (seller ↔ buyer), Uber and Yandex Go (driver ↔ rider), Airbnb (host ↔ guest), Booking (hotel ↔ traveller).") +
 E("p", "⚡ <b>Tarmoq effekti:</b> sotuvchi ko'paysa xaridor ko'payadi, xaridor ko'paysa sotuvchi ko'payadi. Shuning uchun platforma <b>tez o'sadi</b>, lekin boshida <b>«tovuqmi-tuxummi»</b> muammosi bor.", "⚡ <b>The network effect:</b> more sellers bring more buyers, and more buyers bring more sellers. That is why a platform <b>grows fast</b> — but at the start it faces the <b>chicken-and-egg</b> problem.") +
 '</div>' +
 card_ul("green", "🏢", "B2B (biznesdan biznesga)", "B2B (business to business)",
         [("Bitim <b>katta</b>, mijoz soni <b>kam</b>", "Deals are <b>large</b>, customers are <b>few</b>"),
          ("Qaror <b>uzoq</b> qabul qilinadi, bir necha kishi qatnashadi", "Decisions take <b>a long time</b> and involve several people"),
          ("Shartnoma, hisob-faktura va <b>keyinchalik to'lov</b> odatiy holat", "Contracts, invoices and <b>deferred payment</b> are the norm"),
          ("Aloqa uzoq muddatli: bitta mijoz <b>yillar davomida</b> ishlaydi", "The relationship is long: one client can stay <b>for years</b>")]).replace('<ul class="tick">', E("p", "Mijoz — <b>tashkilot</b>. Non zavodi kafelarga non sotadi, IT kompaniya bankka dastur yozadi.", "The customer is <b>an organisation</b>. A bakery sells bread to cafes; an IT company writes software for a bank.") + '<ul class="tick">', 1) +
 card_ul("pink", "🛍", "B2C (biznesdan iste'molchiga)", "B2C (business to consumer)",
         [("Bitim <b>kichik</b>, mijoz soni <b>juda ko'p</b>", "Deals are <b>small</b>, customers are <b>very many</b>"),
          ("Qaror <b>tez</b>, ko'pincha his-tuyg'u asosida", "Decisions are <b>fast</b> and often emotional"),
          ("To'lov <b>darhol</b>, odatda naqd yoki karta bilan", "Payment is <b>immediate</b>, usually cash or card"),
          ("Reklama, brend va qadoq <b>hal qiluvchi</b> ahamiyatga ega", "Advertising, branding and packaging are <b>decisive</b>")]).replace('<ul class="tick">', E("p", "Mijoz — <b>oddiy xaridor</b>. Do'kon, kafe, sartaroshxona, onlayn kiyim savdosi.", "The customer is <b>an ordinary buyer</b>. A shop, a cafe, a barber, online clothes sales.") + '<ul class="tick">', 1) +
 '</div>' +
 '<div class="grid g2" style="margin-top:14px">' +
 card("cyan", "🐣", "«Tovuq-tuxum»ni qanday yechishgan?", "How was chicken-and-egg solved?",
      "<b>Airbnb</b> 2009-yilda Nyu-Yorkdagi uy egalariga e'lonlari uchun <b>bepul professional fotosuratchi</b> yubordi — e'lonlar jozibali bo'lib, bron ko'paydi. <b>Uber</b> yangi shaharlarda dastlab haydovchilarga <b>soatbay kafolatlangan daromad</b> to'lab, yo'lovchi kam paytda ham taklif tomonini ushlab turdi.",
      "In 2009 <b>Airbnb</b> sent New York hosts <b>a free professional photographer</b> for their listings — the listings looked better and bookings rose. In new cities <b>Uber</b> at first paid drivers <b>guaranteed hourly earnings</b>, keeping the supply side alive while riders were still few.") +
 card("violet", "🔀", "Model — konstruktor", "A model is a construction kit",
      "Bir kompaniya <b>bir nechta modelni</b> birlashtira oladi: qahvaxona iste'molchiga qahva sotadi (B2C), ofislarga donada qahva yetkazadi (B2B), oylik \"qahva abonementi\" chiqaradi (obuna) va boshqa shaharda franshiza beradi.",
      "One company can combine <b>several models</b>: a coffee shop sells coffee to consumers (B2C), delivers beans to offices (B2B), launches a monthly \"coffee subscription\" and franchises in another city.") +
 '</div>')

# ============================ 19. FREEMIUM VA BOSHQA ANDOZALAR ============================
slide("Freemium va boshqa andozalar", "Freemium and other patterns",
 E("span", "3.3 · Pulni boshqacha olish", "3.3 · Taking money differently", 'class="kicker"') +
 E("h2", "Freemium, «ustara va tig'» va <span class=\"grad\">boshqa andozalar</span>", "Freemium, \"razor and blades\" and <span class=\"grad\">other patterns</span>") +
 '<div class="grid g2">' +
 card("green", "🆓", "Freemium", "Freemium",
      "Asosiy xizmat bepul, kengaytirilgan imkoniyat pullik. Bepul foydalanuvchi — <b>reklama va kelajakdagi mijoz</b>. <b>Spotify</b>: 2024-yil oxirida ~675 mln foydalanuvchi, shundan ~263 mln pullik obunachi (~39%). Ko'p dasturlarda pullikka o'tish odatda atigi <b>2–5%</b> — shuning uchun bepul foydalanuvchiga xizmat ko'rsatish <b>juda arzon</b> bo'lishi shart.",
      "The basic service is free and the advanced features are paid. A free user is <b>advertising and a future customer</b>. <b>Spotify</b>: about 675 million users at the end of 2024, about 263 million of them paying (~39%). In most software only <b>2–5%</b> upgrade, so serving a free user must be <b>very cheap</b>.") +
 card("blue", "🪒", "«Ustara va tig'»", "\"Razor and blades\"",
      "Asosiy qurilma arzon (hatto zarariga), doimiy daromad <b>almashtiriladigan qismdan</b>: Gillette tig'lari, Nespresso kapsulalari, printer kartrijlari. Mijoz bir marta «bog'lanadi» — keyin yillar davomida to'laydi.",
      "The main device is cheap (even sold at a loss) and the steady income comes from <b>the replaceable part</b>: Gillette blades, Nespresso capsules, printer cartridges. The customer is \"locked in\" once and then pays for years.") +
 card("violet", "📱", "Teskari «ustara-tig'»", "Reverse \"razor and blades\"",
      "Aksincha: foyda <b>qimmat qurilmadan</b>, qo'shimchalar arzon yoki bepul. Apple iPhone'ni yuqori marja bilan sotadi, ko'p ilovalar esa bepul — ilovalar qurilmani yanada qimmatli qiladi.",
      "The reverse: the profit comes from <b>an expensive device</b> while the add-ons are cheap or free. Apple sells the iPhone at a high margin, while many apps are free — and the apps make the device more valuable.") +
 card("orange", "⏱", "Foydalanganga to'la (pay-per-use)", "Pay-per-use",
      "Mijoz faqat ishlatgani uchun to'laydi: avtomobil ijarasi daqiqasiga, bulutli serverlar soatiga, elektr kVt·soatiga. Mijoz uchun kirish to'sig'i past, kompaniya uchun daromad iste'molga bog'liq.",
      "The customer pays only for what they use: car sharing by the minute, cloud servers by the hour, electricity by the kWh. The entry barrier is low for the customer; revenue follows consumption.") +
 '</div>' +
 E("div", "🧬 <b>St. Gallen universiteti (Shveytsariya)</b> olimlari yuzlab kompaniyalarni o'rganib, <b>55 ta takrorlanuvchi biznes-model andozasini</b> topdi va yangi modellarning taxminan <b>90% i mavjud andozalarni yangi sohaga ko'chirish yoki birlashtirish</b> ekanini ko'rsatdi. Ya'ni yangi model ixtiro qilish shart emas — <b>to'g'ri kombinatsiyani</b> topish kerak.",
   "🧬 Researchers at the <b>University of St. Gallen (Switzerland)</b> studied hundreds of companies, found <b>55 recurring business-model patterns</b> and showed that about <b>90% of new models transfer or recombine existing patterns</b>. So you do not have to invent a new model — you have to find <b>the right combination</b>.", 'class="quote" style="margin-top:14px"'))

# ============================ 20. LEAN CANVAS ============================
slide("Lean Canvas — startap uchun", "Lean Canvas for start-ups",
 E("span", "3.4 · G'oya bosqichi uchun vosita", "3.4 · A tool for the idea stage", 'class="kicker"') +
 E("h2", "Lean Canvas — <span class=\"grad\">startap uchun moslashtirilgan canvas</span>", "The Lean Canvas — <span class=\"grad\">a canvas adapted for start-ups</span>") +
 E("div", "<b>Lean Canvas</b> — Esh Mauriya (Ash Maurya, 2010) Osterwalder canvasini <b>startaplar uchun</b> moslashtirgan varianti. Startapda hamkor va resurslar hali yo'q, eng katta xavf esa — <b>\"muammo haqiqatan bormi va mijoz to'laydimi?\"</b> degan savol. Shuning uchun 4 ta blok almashtirilgan:",
   "The <b>Lean Canvas</b> is Ash Maurya's (2010) adaptation of the Osterwalder canvas <b>for start-ups</b>. A start-up has no partners or resources yet, and its biggest risk is the question <b>\"is the problem real and will customers pay?\"</b>. So four blocks were replaced:", 'class="def"') +
 table([("Business Model Canvas", "Business Model Canvas"), ("Lean Canvas", "Lean Canvas"), ("Nega almashtirildi", "Why it was replaced")], [
  [TD("⑧ Asosiy hamkorlar", "⑧ Key partners"), TD("<b>Muammo</b>", "<b>Problem</b>"), TD("Avval mijozning eng og'riqli 1–3 muammosini isbotlash kerak", "First prove the customer's one to three most painful problems")],
  [TD("⑦ Asosiy faoliyat", "⑦ Key activities"), TD("<b>Yechim</b>", "<b>Solution</b>"), TD("Muammoga javob beradigan eng oddiy yechim (MVP)", "The simplest solution that answers the problem (an MVP)")],
  [TD("⑥ Asosiy resurslar", "⑥ Key resources"), TD("<b>Asosiy ko'rsatkichlar</b>", "<b>Key metrics</b>"), TD("Nimani o'lchaymiz: ro'yxatdan o'tish, takroriy xarid, churn", "What we measure: sign-ups, repeat purchases, churn")],
  [TD("④ Mijoz bilan munosabat", "④ Customer relationships"), TD("<b>Adolatsiz ustunlik</b>", "<b>Unfair advantage</b>"), TD("Raqib oson ko'chirib ololmaydigan narsa: jamoa, ma'lumot, hamjamiyat", "Something rivals cannot easily copy: the team, data, a community")],
 ]) +
 '<div class="grid g2" style="margin-top:14px">' +
 card("blue", "🏢", "Qachon Osterwalder canvasi?", "When to use the Osterwalder canvas?", "Ishlab turgan biznesni tahlil qilish, yangi yo'nalish ochish, hamkor yoki investor bilan muzokara.", "Analysing a running business, opening a new line, negotiating with a partner or an investor.") +
 card("green", "🚀", "Qachon Lean Canvas?", "When to use the Lean Canvas?", "G'oya bosqichi: mijoz va muammo hali isbotlanmagan. 20 daqiqada tuziladi va <b>har hafta</b> yangi ma'lumot bilan yangilanadi.", "The idea stage: the customer and the problem are not proven yet. It takes 20 minutes and is <b>updated every week</b> with new evidence.") +
 '</div>')

# ============================ 21. MUVAFFAQIYATLI MODELLAR ============================
slide("Muvaffaqiyatli modellar", "Successful models",
 E("span", "3.5 · Amaliyotdan", "3.5 · From practice", 'class="kicker"') +
 E("h2", "Muvaffaqiyatli <span class=\"grad\">biznes modellar</span> va ularning siri", "Successful <span class=\"grad\">business models</span> and their secret") +
 table([("Kompaniya", "Company"), ("Model", "Model"), ("Asosiy g'oyasi (siri)", "The core idea")], [
  [TD("<b>Netflix</b>", "<b>Netflix</b>"), TD("Obuna", "Subscription"), TD("Bitta kinoga emas, <b>cheksiz ko'rishga</b> to'lash: 300 mln+ obuna, barqaror oylik tushum", "You pay for <b>unlimited viewing</b>, not one film: 300M+ memberships, steady monthly revenue")],
  [TD("<b>Spotify</b>", "<b>Spotify</b>"), TD("Freemium + obuna", "Freemium + subscription"), TD("Bepul reklamali versiya <b>mijozni jalb qiladi</b>, pullik versiya daromad beradi", "The free ad-supported tier <b>attracts users</b>, the paid tier earns the money")],
  [TD("<b>McDonald's</b>", "<b>McDonald's</b>"), TD("Franshiza", "Franchise"), TD("Standart va brendni sotish — tarmoq <b>hamkorlar puliga</b> kengayadi (~95% franshiza)", "Selling standards and a brand — the network grows <b>on partners' money</b> (~95% franchised)")],
  [TD("<b>Amazon</b>", "<b>Amazon</b>"), TD("Platforma + savdo", "Platform + retail"), TD("Sotilgan tovarlarning <b>60% dan ortig'i</b> — mustaqil sotuvchilarniki: komissiya + o'z savdosi", "<b>Over 60%</b> of units sold come from independent sellers: commission plus own sales")],
  [TD("<b>Uber / Yandex Go</b>", "<b>Uber / Yandex Go</b>"), TD("Platforma", "Platform"), TD("O'z avtoparki deyarli yo'q — <b>faqat bog'laydi</b> va komissiya oladi", "It owns almost no cars — it only <b>connects</b> and takes a commission")],
  [TD("<b>Airbnb</b>", "<b>Airbnb</b>"), TD("Platforma", "Platform"), TD("8 mln dan ortiq e'lon, lekin <b>birorta ham mehmonxonasi yo'q</b>", "Over 8 million listings yet <b>not a single hotel of its own</b>")],
  [TD("<b>Gillette</b>", "<b>Gillette</b>"), TD("«Ustara va tig'»", "\"Razor and blades\""), TD("Dastani arzon beradi, <b>almashtiriladigan tig'dan</b> doimiy daromad oladi", "The handle is cheap; the steady income comes from <b>replacement blades</b>")],
  [TD("<b>IKEA</b>", "<b>IKEA</b>"), TD("Xarajatga yo'naltirilgan", "Cost-driven"), TD("Yig'ishni <b>mijozga topshiradi</b> — yassi qutilar narx va logistikani keskin arzonlashtiradi", "Assembly is <b>handed to the customer</b> — flat packs cut price and logistics sharply")],
  [TD("<b>Zara</b>", "<b>Zara</b>"), TD("Tez moda, vertikal zanjir", "Fast fashion, vertical chain"), TD("Dizayndan peshtaxtagacha <b>bir necha hafta</b>: kichik partiyalar, kam qoldiq", "From design to shop floor in <b>a few weeks</b>: small batches, little unsold stock")],
  [TD("<b>Adobe</b>", "<b>Adobe</b>"), TD("Litsenziyadan obunaga", "From licence to subscription"), TD("Bir martalik sotuv o'rniga <b>doimiy to'lov</b>: tushum 10 yilda 5 barobar o'sdi", "A <b>recurring fee</b> instead of a one-off sale: revenue grew fivefold in ten years")],
  [TD("<b>Uzum</b>", "<b>Uzum</b>"), TD("Platforma + ekotizim", "Platform + ecosystem"), TD("Marketpleys, bank va <b>muddatli to'lov</b> bitta ilovada: xaridor uchun qulay, sotuvchi uchun bozor", "A marketplace, a bank and <b>instalment payments</b> in one app: convenient for buyers, a market for sellers")],
 ]) +
 E("div", "🧠 <b>Umumiy qonuniyat:</b> bu kompaniyalarning hech biri shunchaki \"yaxshi mahsulot\" qilgani uchun yutmagan. Ularning har biri <b>pul aylanish tartibini</b> o'zgartirgan: kim to'laydi, qachon to'laydi va nima uchun to'laydi — ana shu savollarga <b>yangicha javob</b> topgan.",
   "🧠 <b>The common pattern:</b> none of these companies won simply by making \"a good product\". Each of them changed <b>the way money circulates</b>: who pays, when they pay and what they pay for — they found <b>a new answer</b> to those questions.", 'class="quote" style="margin-top:14px"'))

# ============================ 22. MAHALLIY MISOL ============================
slide("Amaliy misol: canvas", "Worked example: a canvas",
 E("span", "3.6 · Mahalliy misol", "3.6 · A local example", 'class="kicker"') +
 E("h2", "Termizdagi tandir nonvoyxonasi — <span class=\"grad\">9 blok to'ldirilgan</span>", "A tandoor bakery in Termez — <span class=\"grad\">all nine blocks filled in</span>") +
 '<div class="grid g3">' +
 card("green", "👥", "① Segment", "① Segment", "<b>B2C:</b> yaqin 3 ta mahalladagi oilalar (≈1 200 xonadon). <b>B2B:</b> shahar markazidagi 15 ta kafe va oshxona.", "<b>B2C:</b> families in three nearby neighbourhoods (≈1,200 homes). <b>B2B:</b> 15 cafes and canteens in the city centre.") +
 card("green", "💎", "② Qiymat taklifi", "② Value proposition", "Oilaga: <b>soat 7:00 gacha eshikkacha issiq non</b>. Kafega: har kuni bir xil sifat va aniq vaqtda yetkazish — oshpaz bozorga chiqmaydi.", "For families: <b>hot bread at the door by 7:00</b>. For cafes: the same quality every day, delivered on time — the cook never goes to the market.") +
 card("blue", "🚚", "③ Kanallar", "③ Channels", "Telegram-bot va kanal, do'kon peshtaxtasi, velosipedli kuryer; kafelar bilan to'g'ridan-to'g'ri shartnoma.", "A Telegram bot and channel, the shop counter, a courier on a bicycle; direct contracts with cafes.") +
 card("blue", "💬", "④ Munosabat", "④ Relationships", "Haftalik obuna («har kuni 2 ta non»), har 10-non sovg'a; kafega biriktirilgan menejer.", "A weekly plan (\"two loaves a day\"), every tenth loaf free; a manager assigned to each cafe.") +
 card("violet", "💰", "⑤ Daromad", "⑤ Revenue", "Chakana sotuv (B2C), kafelar bilan oylik shartnoma (B2B), oldindan to'lanadigan haftalik obuna.", "Retail sales (B2C), monthly contracts with cafes (B2B), a prepaid weekly subscription.") +
 card("orange", "🏭", "⑥ Resurslar", "⑥ Resources", "2 ta tandir, xamir xonasi, 3 nafar nonvoy, kuryer, oilaviy retsept va mijozlar bazasi.", "Two tandoor ovens, a dough room, three bakers, a courier, a family recipe and the customer base.") +
 card("orange", "⚙️", "⑦ Faoliyat", "⑦ Activities", "Xamir qorish va yopish (03:00–07:00), yetkazib berish, bot orqali buyurtma qabul qilish.", "Kneading and baking (03:00–07:00), delivery, taking orders through the bot.") +
 card("cyan", "🤝", "⑧ Hamkorlar", "⑧ Partners", "Un zavodi va zaxira yetkazib beruvchi, gaz ta'minoti, kafelar, Click/Payme.", "A flour mill plus a back-up supplier, the gas supply, the cafes, Click/Payme.") +
 card("red", "🧾", "⑨ Xarajatlar", "⑨ Costs", "<b>O'zgaruvchan:</b> un, xamirturush, tuz, energiya ulushi, qadoq. <b>Doimiy:</b> ijara, maosh, kommunal to'lovlar.", "<b>Variable:</b> flour, yeast, salt, a share of energy, packaging. <b>Fixed:</b> rent, wages, utilities.") +
 '</div>' +
 E("div", "🧮 <b>Hisob (taxminiy o'quv misoli):</b> non narxi 4 000 so'm; ingredient va energiya 2 200; qadoq va yetkazish 300 → <b>bir non foydasi 1 500 so'm</b>. Doimiy xarajat oyiga 9 000 000 so'm → zararsizlik nuqtasi <b>9 000 000 ÷ 1 500 = 6 000 non/oy</b> (kuniga ≈200 non). 15 ta kafe har biri kuniga 20 tadan olsa — kuniga 300 non: <b>B2B shartnomalar zararsizlikni o'zi yopadi</b>, B2C savdo esa sof foyda beradi.",
   "🧮 <b>Calculation (an illustrative example):</b> a loaf sells for 4,000 so'm; ingredients and energy 2,200; packaging and delivery 300 → <b>profit of 1,500 so'm per loaf</b>. Fixed costs are 9,000,000 so'm a month → break-even is <b>9,000,000 ÷ 1,500 = 6,000 loaves a month</b> (≈200 a day). If 15 cafes take 20 loaves each a day — 300 loaves a day: <b>the B2B contracts alone cover break-even</b>, and B2C sales are pure profit.", 'class="quote" style="margin-top:14px"'))

# ============================ 23. XULOSA ============================
slide("Xulosa va mustaqil ish", "Summary and assignment",
 E("span", "Xulosa · Topshiriq · Havolalar", "Summary · Assignment · Links", 'class="kicker"') +
 E("h2", "Yakuniy <span class=\"grad\">xulosa</span> va <span class=\"grad\">foydali resurslar</span>", "Final <span class=\"grad\">summary</span> and <span class=\"grad\">useful resources</span>") +
 card_ul("green", "📌", "Esda qoladigan 8 ta fikr", "Eight ideas to remember",
         [("Biznes-model — g'oya emas, <b>pul qanday aylanishining chizmasi</b>.", "A business model is not an idea but <b>the diagram of how money circulates</b>."),
          ("Yaxshi mahsulot ham <b>eski model</b> bilan yutqazadi (Blockbuster, Kodak).", "Even a good product loses with <b>an outdated model</b> (Blockbuster, Kodak)."),
          ("Canvas har doim <b>mijozdan</b> boshlanadi; taklif uning vazifasi, og'rig'i va istagiga javob beradi.", "The canvas always starts from <b>the customer</b>; the offer answers their jobs, pains and gains."),
          ("Qiymat taklifi <b>raqobatchiga to'g'ri kelmasligi</b> kerak — aks holda u aniq emas.", "A value proposition <b>must not fit a competitor</b> — otherwise it is not specific."),
          ("Birlik iqtisodiyoti manfiy bo'lsa, <b>o'sish zararni ko'paytiradi</b> (MoviePass).", "If the unit economics are negative, <b>growth multiplies the loss</b> (MoviePass)."),
          ("<b>LTV/CAC ≥ 3</b> va past churn — sog'lom modelning belgisi.", "<b>LTV/CAC ≥ 3</b> and low churn are the signs of a healthy model."),
          ("Model ixtiro qilish shart emas: 55 ta andozadan <b>to'g'ri kombinatsiya</b> toping.", "You do not have to invent a model: find <b>the right combination</b> of the 55 patterns."),
          ("G'oya bosqichida <b>Lean Canvas</b>, ishlab turgan biznesda <b>Osterwalder canvasi</b> qulay.", "Use the <b>Lean Canvas</b> at the idea stage and the <b>Osterwalder canvas</b> for a running business.")]) +
 '<div class="grid g2" style="margin-top:16px">' +
 '<div class="card" style="--c:var(--violet)"><span class="icon">📓</span>' + E("h3", "Mustaqil ish: \"Mening biznes-modelim\"", "Independent work: \"My business model\"") +
 '<ul class="tick">' +
 E("li", "O'z g'oyangiz uchun <b>9 blokli canvas</b> va <b>Lean Canvas</b>ni to'ldiring.", "Fill in the <b>nine-block canvas</b> and a <b>Lean Canvas</b> for your own idea.") +
 E("li", "Mijoz uchun <b>3 ta vazifa, 3 ta og'riq, 3 ta istak</b> yozing.", "Write <b>three jobs, three pains and three gains</b> for your customer.") +
 E("li", "Qiymat taklifini <b>formula bo'yicha bitta gapga</b> sig'diring.", "Fit the value proposition into <b>one sentence using the formula</b>.") +
 E("li", "Bir birlik foydasi, <b>zararsizlik nuqtasi</b>, taxminiy <b>LTV va CAC</b>ni hisoblang.", "Calculate profit per unit, the <b>break-even point</b> and an estimated <b>LTV and CAC</b>.") +
 E("li", "Modelingiz qaysi andozaga yaqinligini <b>dunyo misoli bilan</b> asoslang.", "<b>Justify with a global example</b> which pattern your model is closest to.") +
 '</ul>' + E("small", "Hajmi: 2 bet + 2 ta canvas. Baholash: canvaslar 40% · hisob-kitob 30% · asoslangan xulosa 30%.", "Length: 2 pages + two canvases. Marking: canvases 40% · calculations 30% · reasoned conclusion 30%.", 'class="note"') +
 '</div>' +
 '<div class="card" style="--c:var(--blue)"><span class="icon">🔗</span>' + E("h3", "Foydali resurslar", "Useful resources") +
 '<ul class="clean">' +
 E("li", "<a class=\"lnk\" href=\"https://www.strategyzer.com/library/the-business-model-canvas\" target=\"_blank\" rel=\"noopener\">strategyzer.com</a> — Canvasning rasmiy shabloni va qo'llanmasi", "<a class=\"lnk\" href=\"https://www.strategyzer.com/library/the-business-model-canvas\" target=\"_blank\" rel=\"noopener\">strategyzer.com</a> — the official canvas template and guide") +
 E("li", "<a class=\"lnk\" href=\"https://leanstack.com/lean-canvas\" target=\"_blank\" rel=\"noopener\">leanstack.com</a> — Lean Canvas shabloni (Ash Maurya)", "<a class=\"lnk\" href=\"https://leanstack.com/lean-canvas\" target=\"_blank\" rel=\"noopener\">leanstack.com</a> — the Lean Canvas template (Ash Maurya)") +
 E("li", "<a class=\"lnk\" href=\"https://birdarcha.uz\" target=\"_blank\" rel=\"noopener\">birdarcha.uz</a> — biznesni ro'yxatdan o'tkazish va davlat xizmatlari", "<a class=\"lnk\" href=\"https://birdarcha.uz\" target=\"_blank\" rel=\"noopener\">birdarcha.uz</a> — business registration and public services") +
 E("li", "<a class=\"lnk\" href=\"https://stat.uz\" target=\"_blank\" rel=\"noopener\">stat.uz</a> — bozor hajmini baholash uchun rasmiy statistika", "<a class=\"lnk\" href=\"https://stat.uz\" target=\"_blank\" rel=\"noopener\">stat.uz</a> — official statistics for estimating market size") +
 E("li", "<a class=\"lnk\" href=\"https://lex.uz\" target=\"_blank\" rel=\"noopener\">lex.uz</a> — franshiza va shartnomalarga oid qonunchilik", "<a class=\"lnk\" href=\"https://lex.uz\" target=\"_blank\" rel=\"noopener\">lex.uz</a> — legislation on franchising and contracts") +
 E("li", "<a class=\"lnk\" href=\"https://soliq.uz\" target=\"_blank\" rel=\"noopener\">soliq.uz</a> — soliq rejimi modelga qanday ta'sir qilishi", "<a class=\"lnk\" href=\"https://soliq.uz\" target=\"_blank\" rel=\"noopener\">soliq.uz</a> — how the tax regime affects the model") +
 '</ul>' +
 E("p", "<b>Vositalar:</b> <span class=\"pill g\">Canva / Figma (canvas chizish)</span><span class=\"pill g\">Excel yoki Google Sheets</span><span class=\"pill g\">Telegram-bot va marketpleyslar</span>", "<b>Tools:</b> <span class=\"pill g\">Canva / Figma for drawing the canvas</span><span class=\"pill g\">Excel or Google Sheets</span><span class=\"pill g\">Telegram bots and marketplaces</span>") +
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
 E("p", "Keyingi mashg'ulotgacha o'z g'oyangiz uchun <b>9 blokli canvas</b> va <b>Lean Canvas</b>ni to'ldirib, LTV va CAC ni taxminan hisoblab keling — dars aynan shu chizmalardan boshlanadi.",
   "For the next class, fill in the <b>nine-block canvas</b> and a <b>Lean Canvas</b> for your own idea and estimate its LTV and CAC — the lesson will start from those diagrams.") +
 E("p", "Termiz davlat universiteti · Tadbirkorlik asoslari", "Termez State University · Fundamentals of Entrepreneurship", 'style="color:var(--muted);font-size:13.5px"') + '</div>')

# ============================ TEST SAVOLLARI ============================
# a — 4 variant (uzunligi teng, mazmunan o'xshash), c — to'g'ri javob; o — ochiq savol: qabul qilinadigan javoblar (bitta so'z yoki son)
Q = [
 # 1 — hamkorlar bloki (stsenariy)
 dict(q="Kafe egasi o'ziga savol berdi: «Shu yetkazib beruvchi ertaga ishlamay qo'ysa, biznesim necha kun yashaydi?» U Canvasning qaysi blokini tekshiryapti?",
      a=["Asosiy hamkorlar blokini: tashqi tomonga qaramlik darajasini",
         "Asosiy resurslar blokini: o'zidagi bino va uskuna zaxirasini",
         "Kanallar blokini: mahsulot mijozga qaysi yo'l bilan borishini",
         "Xarajatlar blokini: oylik doimiy to'lovlar qancha bo'lishini"], c=0,
      e="Bu savol hamkorga qaramlikni o'lchaydi. Javob «bir necha kun» bo'lsa, zaxira hamkor topish kerak.",
      qe="A cafe owner asks: \"If this supplier stopped working tomorrow, how many days would my business last?\" Which canvas block is being checked?",
      ae=["Key partners: how dependent the business is on an outsider",
          "Key resources: how much building and equipment it holds",
          "Channels: which route the product takes to the customer",
          "Cost structure: how large the monthly fixed payments are"],
      ee="The question measures dependence on a partner. If the answer is \"a few days\", find a back-up partner."),
 # 2 — Netflix vs Blockbuster
 dict(q="Blockbuster 2000-yilda Netflixni 50 mln dollarga sotib olishdan bosh tortdi, 2010-yilda esa bankrot bo'ldi. Bu holatdan chiqadigan asosiy saboq qaysi?",
      a=["Raqib pul olish tartibini o'zgartirsa, do'konlar ko'pligi qutqarmaydi",
         "Kino ijarasida do'konlar soni ko'p bo'lsa, raqobatda albatta yutiladi",
         "Yirik kompaniya kichik raqibni e'tiborsiz qoldirsa, bozor saqlanadi",
         "Kechikish jarimasi qancha baland bo'lsa, mijozlar shuncha sodiq bo'ladi"], c=0,
      e="Mahsulot bir xil edi (kino ko'rish); Netflix obuna va jarimasiz modeli bilan yutdi — yutgan narsa model edi.",
      qe="In 2000 Blockbuster declined to buy Netflix for $50 million, and in 2010 it went bankrupt. What is the main lesson?",
      ae=["If a rival changes how money is taken, many stores will not save you",
          "In film rental, having more stores than rivals always wins the market",
          "A large firm that ignores a small rival will always keep its market",
          "The higher the late fees, the more loyal the customers always become"],
      ee="The product was the same (watching films); Netflix won with a subscription and no late fees — the model won."),
 # 3 — Kodak
 dict(q="Kodak 1975-yilda birinchi raqamli kamerani yaratgan, ammo 2012-yilda bankrot bo'lgan. Buning asosiy sababi qaysi javobda ko'rsatilgan?",
      a=["Foyda plyonka va qog'ozdan kelardi, kompaniya modelini o'zgartirmadi",
         "Raqamli kamera patentlanmagan edi, uni raqiblar bepul ko'chirib oldi",
         "Fotoapparat narxi tushib ketdi, Kodak esa o'z narxini tushirmay qoldi",
         "Kompaniya reklama byudjetini qisqartirdi, mijozlar brendni unutdilar"], c=0,
      e="Ixtiro Kodakda bor edi, lekin daromad plyonkadan kelgani uchun model eskicha qoldi.",
      qe="Kodak built the first digital camera in 1975 yet went bankrupt in 2012. Which answer gives the main reason?",
      ae=["Its profit came from film and paper, and it did not change its model",
          "The digital camera was not patented, so rivals copied it for nothing",
          "Camera prices collapsed while Kodak refused to cut its own prices",
          "The company cut its advertising budget, so customers forgot the brand"],
      ee="Kodak had the invention, but because its money came from film the model stayed old."),
 # 4 — ochiq: royalti
 dict(q="Franchayzi o'z tushumidan franchayzerga har oy foiz shaklida to'laydigan muntazam haq qanday ataladi? <i>(bitta so'z)</i>",
      o=["royalti", "royalty", "royalti to'lovi", "roialti"],
      e="Royalti — brend va tizimdan foydalanish uchun tushumdan to'lanadigan muntazam haq; kirish to'lovi esa franshiza haqi deyiladi.",
      qe="What is the recurring fee called that a franchisee pays the franchisor every month as a percentage of turnover? <i>(one word)</i>",
      oe=["royalty", "royalties", "royalti"],
      ee="A royalty is a recurring fee from turnover for using the brand and system; the joining payment is the franchise fee."),
 # 5 — VPC: og'riq qoldiruvchi
 dict(q="Qiymat taklifi kanvasidagi «og'riq qoldiruvchi» (pain reliever) qaysi javobda to'g'ri tavsiflangan?",
      a=["Mijozning aniq noqulayligini kamaytiradigan taklifimiz xususiyati",
         "Mijoz bajarmoqchi bo'lgan ish yoki hal qilmoqchi bo'lgan vazifasi",
         "Mijoz kutmagan, lekin olganda quvonadigan qo'shimcha foyda turi",
         "Raqobatchi mahsulotidagi kamchiliklar ro'yxati va ularning soni"], c=0,
      e="Og'riq qoldiruvchi qiymat xaritasida turadi va mijoz profilidagi aniq og'riqqa javob beradi (masalan, termo-sumka → ovqat sovimaydi).",
      qe="Which answer correctly describes a \"pain reliever\" in the value proposition canvas?",
      ae=["A feature of our offer that eases a specific customer annoyance",
          "The job or task the customer is trying to get done or to solve",
          "An extra benefit the customer did not expect but is glad to get",
          "A list of the faults in a competitor's product and their number"],
      ee="A pain reliever sits on the value map and answers a specific pain in the customer profile (e.g. a thermal bag → food stays hot)."),
 # 6 — milkshake job
 dict(q="Kristensen tadqiqotida ertalab sutli kokteyl oluvchilar uni «uzoq yo'lda zerikmaslik va tushlikkacha to'q yurish» uchun sotib olishgan. Bu mijoz profilining qaysi elementi?",
      a=["Mijoz vazifasi: u kokteylni muayyan ishni bajarish uchun «yollaydi»",
         "Mijoz og'rig'i: u kokteyl narxining balandligidan norozi bo'lib yuradi",
         "Foyda yaratuvchi: kafe kokteyl bilan birga sovg'a ham qo'shib beradi",
         "Mahsulot xususiyati: kokteyl qalin bo'lgani uchun uzoq ichiladigan"], c=0,
      e="Bu «jobs to be done» g'oyasi: mijoz mahsulotni ma'lum ishni bajarish uchun «yollaydi». Raqiblar — banan, donut va radio edi.",
      qe="In Christensen's study, morning commuters bought milkshakes \"to beat boredom on a long drive and stay full until lunch\". Which element of the customer profile is this?",
      ae=["A customer job: they \"hire\" the milkshake to get a task done",
          "A customer pain: they are unhappy about the high milkshake price",
          "A gain creator: the cafe adds a small gift to every milkshake",
          "A product feature: the shake is thick, so it takes long to drink"],
      ee="This is the \"jobs to be done\" idea: the customer hires a product to do a job. The rivals were bananas, doughnuts and the radio."),
 # 7 — LTV/CAC hisob
 dict(q="Obuna 60 000 so'm/oy, yalpi marja 50%, oylik churn 5%, bitta mijozni jalb qilish (CAC) 200 000 so'm. Qaysi xulosa to'g'ri?",
      a=["LTV 600 000 so'm, LTV/CAC = 3 — chegarada, lekin sog'lom model",
         "LTV 1 200 000 so'm, LTV/CAC = 6 — reklamani tez oshirish mumkin",
         "LTV 300 000 so'm, LTV/CAC = 1,5 — har mijozdan zarar ko'riladi",
         "LTV 60 000 so'm, LTV/CAC = 0,3 — model umuman pul keltirmaydi"], c=0,
      e="LTV = 60 000 × 0,5 ÷ 0,05 = 600 000 so'm; 600 000 ÷ 200 000 = 3 — amaliyotdagi «≥ 3» chegarasida.",
      qe="A plan costs 60,000 so'm a month with a 50% gross margin, 5% monthly churn and a CAC of 200,000 so'm. Which conclusion is correct?",
      ae=["LTV 600,000 so'm, LTV/CAC = 3 — on the line, but a healthy model",
          "LTV 1,200,000 so'm, LTV/CAC = 6 — ad spend can be raised now",
          "LTV 300,000 so'm, LTV/CAC = 1.5 — every customer brings a loss",
          "LTV 60,000 so'm, LTV/CAC = 0.3 — the model brings in no money"],
      ee="LTV = 60,000 × 0.5 ÷ 0.05 = 600,000 so'm; 600,000 ÷ 200,000 = 3 — right on the \"≥ 3\" rule of thumb."),
 # 8 — ochiq: LTV
 dict(q="Bitta mijoz kompaniya bilan butun munosabati davomida keltiradigan jami yalpi foyda qaysi 3 harfli inglizcha qisqartma bilan belgilanadi?",
      o=["LTV", "CLV", "CLTV"],
      e="LTV (lifetime value) — mijozning umrbod qiymati; CAC bilan solishtiriladi (LTV/CAC ≥ 3).",
      qe="Which three-letter abbreviation stands for the total gross profit one customer brings over the whole relationship with a company?",
      oe=["LTV", "CLV", "CLTV"],
      ee="LTV (lifetime value) is compared with CAC (LTV/CAC ≥ 3)."),
 # 9 — churn
 dict(q="Oylik churn 10% bo'lsa, mijoz kompaniyada o'rtacha necha oy qoladi va bu nimani anglatadi?",
      a=["O'rtacha 10 oy: ushlab qolishni yaxshilash LTV ni bevosita oshiradi",
         "O'rtacha 100 oy: mijozlar deyarli ketmaydi, ushlab qolish shart emas",
         "O'rtacha 1 oy: obuna modeli bunday biznesda umuman ishlay olmaydi",
         "O'rtacha 12 oy: churn faqat yillik obunada hisobga olinadigan son"], c=0,
      e="Mijozning o'rtacha «umri» ≈ 1 ÷ churn = 1 ÷ 0,10 = 10 oy. Churn kamaysa, LTV o'sadi.",
      qe="If monthly churn is 10%, how many months does a customer stay on average, and what does it mean?",
      ae=["10 months on average: better retention raises the LTV directly",
          "100 months on average: customers hardly leave, so no retention",
          "1 month on average: a subscription can never work for this firm",
          "12 months on average: churn is counted only for annual plans"],
      ee="Average customer lifetime ≈ 1 ÷ churn = 1 ÷ 0.10 = 10 months. Lower churn means higher LTV."),
 # 10 — ochiq: churn
 dict(q="Ma'lum davrda xizmatdan voz kechgan mijozlar ulushi inglizcha bitta so'z bilan qanday ataladi?",
      o=["churn", "churn rate", "chern"],
      e="Churn — ketish ulushi. Oylik 5% churn yiliga mijozlarning ≈46% i ketishini anglatadi.",
      qe="What single English word names the share of customers who stop using a service in a given period?",
      oe=["churn", "churn rate"],
      ee="Churn is the leaving rate. A 5% monthly churn means about 46% of customers leave in a year."),
 # 11 — MoviePass
 dict(q="MoviePass oyiga 9,95 $ ga har kuni kino ko'rishni taklif qildi va har bir chipta uchun kinoteatrga to'liq narx to'ladi. Model nega yiqildi?",
      a=["Har faol mijoz zarar keltirdi: o'sish zararni ko'paytirib bordi",
         "Obunachilar kam bo'ldi: reklama byudjeti yetarli bo'lmagan edi",
         "Kinoteatrlar hamkorlikdan chiqdi: shartnoma muddati tugab qoldi",
         "Narx juda baland edi: mijozlar arzonroq raqibga o'tib ketishdi"], c=0,
      e="Birlik iqtisodiyoti manfiy edi: bir chipta narxi oylik to'lovdan qimmat. Bunday modelni reklama bilan kengaytirish zararni oshiradi.",
      qe="MoviePass offered a film a day for $9.95 a month and paid cinemas the full price of every ticket. Why did the model fail?",
      ae=["Every active customer lost money: growth multiplied the loss",
          "There were too few subscribers: the ad budget was too small",
          "Cinemas left the partnership: the contracts simply expired",
          "The price was too high: customers moved to a cheaper rival"],
      ee="The unit economics were negative: one ticket cost more than the monthly fee. Scaling such a model only grows the loss."),
 # 12 — ochiq: zararsizlik nuqtasi (son)
 dict(q="Mahsulot narxi 15 000 so'm, o'zgaruvchan xarajat 8 000, bir mijozga reklama 1 000 so'm; doimiy xarajat oyiga 4 800 000 so'm. Zararsizlik nuqtasi oyiga necha birlik? <i>(faqat son)</i>",
      o=["800"],
      e="Bir birlik foydasi = 15 000 − 8 000 − 1 000 = 6 000; 4 800 000 ÷ 6 000 = 800 birlik.",
      qe="A product sells for 15,000 so'm; variable cost is 8,000 and advertising per customer 1,000; fixed costs are 4,800,000 so'm a month. How many units a month is break-even? <i>(number only)</i>",
      oe=["800"],
      ee="Profit per unit = 15,000 − 8,000 − 1,000 = 6,000; 4,800,000 ÷ 6,000 = 800 units."),
 # 13 — franshiza afzalligi
 dict(q="McDonald's restoranlarining taxminan 95% i franshiza asosida ishlaydi. Bu model franchayzerga qaysi asosiy afzallikni beradi?",
      a=["Tarmoq hamkorlar kapitali hisobiga kengayadi, xavf ham bo'linadi",
         "Har bir restoranning butun foydasi faqat franchayzerga tushadi",
         "Standartlarga rioya qilish talabi butun tarmoqda bekor bo'ladi",
         "Restoranlarga xodim yollash va o'qitish zarurati yo'q bo'ladi"], c=0,
      e="Franchayzi o'z puli bilan restoran ochadi, franchayzer esa kirish to'lovi va royalti oladi — tarmoq tez va kam xavf bilan o'sadi.",
      qe="About 95% of McDonald's restaurants are franchised. What main advantage does this give the franchisor?",
      ae=["The network grows on partners' capital, and the risk is shared",
          "The franchisor alone receives the entire profit of each outlet",
          "The need to follow the standards disappears across the network",
          "The need to hire and train restaurant staff disappears entirely"],
      ee="The franchisee opens the outlet with their own money while the franchisor earns the fee and royalties — fast growth with less risk."),
 # 14 — ochiq: tarmoq effekti
 dict(q="Platformada sotuvchi ko'paysa xaridor, xaridor ko'paysa sotuvchi ko'payadi. Bu hodisa «... effekti» deyiladi. Nuqtalar o'rniga bitta so'z yozing.",
      o=["tarmoq", "tarmoq effekti", "network", "network effect"],
      e="Tarmoq effekti platformani tez o'stiradi, lekin boshida «tovuq-tuxum» muammosini yechish kerak.",
      qe="On a platform more sellers bring more buyers and more buyers bring more sellers. This is called the \"... effect\". Write one word for the dots.",
      oe=["network", "network effect", "tarmoq"],
      ee="The network effect makes a platform grow fast, but first the chicken-and-egg problem must be solved."),
 # 15 — Airbnb tovuq-tuxum
 dict(q="Airbnb 2009-yilda Nyu-Yorkdagi uy egalariga e'lonlari uchun bepul professional fotosuratchi yubordi. Bu qaysi muammoni hal qilishga qaratilgan edi?",
      a=["«Tovuq-tuxum»: taklif tomonini jozibali qilib, talabni jalb qilish",
         "Xarajat: suratlar uchun kompaniya sotuvchilardan haq olib qolardi",
         "Huquqiy: shahar qonuni har bir e'londa rasmiy surat talab qilardi",
         "Logistika: mehmonlarni uygacha yetkazish yo'li noma'lum bo'lgan"], c=0,
      e="Platforma boshida ikkala tomonni ham jalb qilishi kerak; sifatli e'lonlar mehmonlarni, mehmonlar esa yangi uy egalarini olib keldi.",
      qe="In 2009 Airbnb sent New York hosts a free professional photographer for their listings. Which problem was this meant to solve?",
      ae=["Chicken-and-egg: making supply attractive in order to pull demand",
          "Cost: the company charged the hosts a fee for every photo it took",
          "Legal: the city law required an official photo in every listing",
          "Logistics: there was no known way to bring the guests to the homes"],
      ee="A platform must attract both sides at the start; good listings brought guests, and guests brought new hosts."),
 # 16 — B2B stsenariy
 dict(q="IT kompaniya bankka hisob-kitob dasturini sotmoqda: kelishuv 6 oy davom etdi, 5 nafar mutaxassis qaror qildi, to'lov 30 kundan keyin. Bu qaysi modelga xos?",
      a=["B2B: bitim yirik, qaror jamoaviy va kechiktirilgan to'lov odatiy",
         "B2C: mijoz oddiy xaridor, qaror tez va his-tuyg'uga asoslangan",
         "Franshiza: bank dasturiy brendni olib, royalti to'lab boradi",
         "Platforma: kompaniya bank va mijozlarni bog'lab, komissiya oladi"], c=0,
      e="B2B belgilari: mijoz — tashkilot, bitim katta, qaror uzoq va jamoaviy, shartnoma va keyinroq to'lov.",
      qe="An IT company is selling accounting software to a bank: the deal took six months, five specialists decided, and payment is due in 30 days. Which model is this?",
      ae=["B2B: a large deal, a group decision and deferred payment as normal",
          "B2C: an ordinary buyer, a fast decision based mainly on emotion",
          "Franchise: the bank buys a software brand and keeps paying royalty",
          "Platform: the company links the bank and its clients for a fee"],
      ee="B2B signs: the customer is an organisation, the deal is large, the decision long and collective, payment comes later."),
 # 17 — teskari ustara
 dict(q="Apple iPhone'ni yuqori marja bilan sotadi, App Store'dagi ko'p ilovalar esa bepul yoki arzon. Bu qaysi andozaga yaqin?",
      a=["Teskari «ustara-tig'»: foyda qurilmadan, qo'shimchalar arzon",
         "Klassik «ustara-tig'»: qurilma arzon, foyda almashma qismdan",
         "Franshiza: brend boshqa ishlab chiqaruvchilarga ijaraga beriladi",
         "Freemium: qurilma bepul, pullik obuna esa asosiy daromad beradi"], c=0,
      e="Klassikda foyda tig'dan (Gillette), teskarisida qimmat qurilmadan keladi, qo'shimchalar esa uning qiymatini oshiradi.",
      qe="Apple sells the iPhone at a high margin, while many App Store apps are free or cheap. Which pattern is this closest to?",
      ae=["Reverse razor-and-blades: profit from the device, add-ons cheap",
          "Classic razor-and-blades: device cheap, profit from refill parts",
          "Franchise: the brand is licensed out to other phone companies",
          "Freemium: the device is free and a paid plan earns the money"],
      ee="In the classic version profit comes from the blades (Gillette); in the reverse one it comes from the expensive device."),
 # 18 — ochiq: freemium
 dict(q="Asosiy versiyasi bepul, kengaytirilgan imkoniyatlari pullik bo'lgan model (masalan, Spotify) bitta so'z bilan qanday ataladi?",
      o=["freemium", "frimium", "fremium"],
      e="Freemium: bepul foydalanuvchi — reklama va kelajakdagi mijoz. Ko'p dasturlarda pullikka o'tish atigi 2–5%.",
      qe="What single word names a model whose basic version is free and whose advanced features are paid (for example Spotify)?",
      oe=["freemium"],
      ee="Freemium: a free user is advertising and a future customer. In most software only 2–5% upgrade."),
 # 19 — Lean Canvas
 dict(q="Lean Canvasda Osterwalder canvasidagi «Asosiy hamkorlar» bloki o'rniga qaysi blok qo'yilgan va nega?",
      a=["«Muammo»: startap avval hal qilinadigan muammoni isbotlashi kerak",
         "«Yechim»: startap avval mahsulot texnologiyasini yozishi kerak",
         "«Kanallar»: startap avval mijozga yetish yo'lini topishi kerak",
         "«Xarajat»: startap avval qancha pul kerakligini bilishi kerak"], c=0,
      e="Lean Canvasda: hamkorlar → muammo, faoliyat → yechim, resurslar → asosiy ko'rsatkichlar, munosabat → adolatsiz ustunlik.",
      qe="Which block replaces \"Key partners\" in the Lean Canvas, and why?",
      ae=["\"Problem\": a start-up must first prove the problem it solves",
          "\"Solution\": a start-up must first describe its technology",
          "\"Channels\": a start-up must first find a way to its buyers",
          "\"Costs\": a start-up must first know how much money it needs"],
      ee="In the Lean Canvas: partners → problem, activities → solution, resources → key metrics, relationships → unfair advantage."),
 # 20 — St. Gallen 55 andoza
 dict(q="St. Gallen universiteti tadqiqotiga ko'ra, yangi biznes-modellarning taxminan 90% i nimadan iborat bo'lib chiqqan?",
      a=["Mavjud 55 ta andozani yangi sohaga ko'chirish yoki birlashtirishdan",
         "Butunlay yangi, ilgari hech qayerda uchramagan g'oyalardan iborat",
         "Yirik korporatsiyalar laboratoriyasida yaratilgan texnologiyalardan",
         "Davlat dasturlari va grantlar asosida ishlab chiqilgan loyihalardan"], c=0,
      e="Model ixtiro qilish shart emas — mavjud andozalarning to'g'ri kombinatsiyasini topish kerak.",
      qe="According to research at the University of St. Gallen, what do about 90% of new business models turn out to be?",
      ae=["Transfers or recombinations of the existing 55 business patterns",
          "Entirely new ideas that had never appeared anywhere before them",
          "Technologies created inside the laboratories of big corporations",
          "Projects developed on the basis of state programmes and grants"],
      ee="You do not have to invent a model — find the right combination of existing patterns."),
]
