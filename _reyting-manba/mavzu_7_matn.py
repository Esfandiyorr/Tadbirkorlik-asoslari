# -*- coding: utf-8 -*-
"""M7: bilingual lesson content. Build with yangi_mavzu.yig, using mavzu-7.html
as the template, then run inject.py. From the repository root:
  python3 _reyting-manba/yangi_mavzu.py _reyting-manba/mavzu_7_matn.py mavzu-7.html "Mijoz kim va unga nima kerak" 7 "" mavzu-7.html
  python3 _reyting-manba/inject.py
Figures below are teaching assumptions,
not statistics about TerDU, Termiz or Uzbekistan.
"""
def p(uz, en, cls=''):
    return f'<p class="{cls}" {d(uz,en)}>{uz}</p>'
def box(uz,en): return f'<div class="quote" {d(uz,en)}>{uz}</div>'
def card(title, title_en, uz, en):
    return f'<div class="card"><h3 {d(title,title_en)}>{title}</h3>{p(uz,en)}</div>'
def grid(*cards): return '<div class="grid g2">'+''.join(cards)+'</div>'
def page(title,en,body):
    slide(title,en,f'<span class="kicker">M7 · TerDU</span><h2 {d(title,en)}>{title}</h2>'+body)
def table(headers, headers_en, rows):
    s='<div class="tw"><table><thead><tr>'
    for uz,en in zip(headers,headers_en): s+=f'<th {d(uz,en)}>{uz}</th>'
    s+='</tr></thead><tbody>'
    for row in rows:
        s+='<tr>'+''.join(f'<td {d(uz,en)}>{uz}</td>' for uz,en in row)+'</tr>'
    return s+'</tbody></table></div>'

def cover_text(tag, uz, en, cls=''):
    return f'<{tag} class="{cls}" {d(uz,en)}>{uz}</{tag}>'

slide('Muqova', 'Cover',
 '<div class="title-wrap"><div class="big-logo terdu-logo" role="img" aria-label="Termiz davlat universiteti logotipi"></div><div>'+
 cover_text('span', "M7-mavzu · Ma’ruza · 2 soat", 'Topic 7 · Lecture · 2 hours', 'kicker')+
 cover_text('h1', 'MIJOZ KIM VA UNGA NIMA KERAK?', 'WHO IS THE CUSTOMER AND WHAT DO THEY NEED?', 'grad')+
 p('Maqsadli mijozlarni <b>segmentlash</b> · mijoz portreti (<b>persona</b>) · xarid motivlari va <b>JTBD</b> · mijoz bilan suhbat · qiymat taklifi · <b>TAM, SAM, SOM</b> va birinchi mijozlar hisobi · amaliy sinov.',
 'Customer <b>segmentation</b> · customer <b>persona</b> · buying motives and <b>JTBD</b> · customer interviews · value proposition · <b>TAM, SAM, SOM</b> and initial customer estimates · practical experiments.', 'lead')+
 '<div class="meta">'+
 cover_text('div', '📚 Fan: <b>Tadbirkorlik asoslari</b>', '📚 Subject: <b>Fundamentals of Entrepreneurship</b>')+
 cover_text('div', '🎓 <b>Termiz davlat universiteti</b>', '🎓 <b>Termez State University</b>')+
 cover_text('div', '🗂 <b>18</b> slayd · <b>15</b> ta test', '🗂 <b>18</b> slides · <b>15</b> questions')+
 cover_text('div', '⌨️ <b>→</b> tugmasi bilan davom eting', '⌨️ Press <b>→</b> to continue')+
 '</div></div></div>')

page('Dars yakunida nima tayyor bo‘ladi?', 'What will you produce?',
 grid(card('1. Aniq mijoz','1. A specific customer','Tor segmentni tanlaysiz; foydalanuvchi, to‘lovchi va qaror egasini farqlaysiz.',
 'Choose a focused segment; distinguish user, payer and decision maker.'),
 card('2. Tekshirilgan ehtiyoj','2. Evidence of a need','Sotishga urinmasdan suhbat o‘tkazasiz; faktni taxmin va talqindan ajratasiz.',
 'Interview without pitching; separate observations from assumptions and interpretations.'),
 card('3. Hisoblangan imkoniyat','3. An estimated opportunity','TAM, SAM, SOM va voronkani bir xil davr hamda birliklarda hisoblaysiz.',
 'Estimate TAM, SAM, SOM and a funnel using consistent time periods and units.'),
 card('4. Sinov rejasi','4. A test plan','Gipoteza, muddat, mezon va keyingi qarori bor kichik tajriba tuzasiz.',
 'Design a small experiment with a hypothesis, deadline, decision threshold and next step.'))+
 p('Dars rejasi: 15 daqiqa tushunchalar, 20 daqiqa suhbat va persona, 15 daqiqa hisob, 15 daqiqa guruh ishi, 15 daqiqa video muhokamasi va test.',
 'Plan: 15 minutes of concepts, 20 of interviews and personas, 15 of calculation, 15 of group work, 15 of video discussion and quiz.'))

page('Mijoz rollari: kim foydalanadi, kim to‘laydi?', 'Customer roles: who uses and who pays?',
 table(['Rol','Tushlik xizmatidagi misol','Tekshiriladigan savol'],['Role','Lunch-service example','Question to investigate'],[
 [('Foydalanuvchi','User'),('Talaba tushlikni yeydi','Student eats the lunch'),('Unga tezlikmi, ta’mmi, to‘yimlilikmi muhim?','Does speed, taste or portion size matter?')],
 [('To‘lovchi','Payer'),('Talabaning o‘zi yoki ota-onasi','Student or parent'),('Kimning byudjeti va to‘lov usuli ishlatiladi?','Whose budget and payment method are used?')],
 [('Qaror egasi','Decision maker'),('Buyurtmani tanlaydigan shaxs','Person choosing the order'),('Oxirgi tanlovni kim tasdiqlaydi?','Who approves the final choice?')],
 [('Ta’sir qiluvchi','Influencer'),('Do‘st tavsiya qiladi','Friend recommends it'),('Kimning fikriga ishoniladi?','Whose opinion is trusted?')]])+
 box('Bir kishi bir necha rolni bajarishi mumkin. <b>Ta’sir qiluvchi qaror egasi bo‘lishi shart emas.</b> B2B misol: dasturdan hisobchi foydalanadi, rahbar tasdiqlaydi, moliya bo‘limi to‘laydi.',
 'One person may hold several roles. <b>An influencer does not necessarily decide.</b> B2B example: an accountant uses software, a manager approves it, finance pays.'))

page('Segmentlash: yoshning o‘zi yetmaydi', 'Segmentation: age alone is not enough',
 table(['Mezon','Misol','Nima uchun kerak?'],['Criterion','Example','Why use it?'],[
 [('Geografik','Geographic'),('Kampusga 1 km ichida','Within 1 km of campus'),('Yetkazish hududini cheklaydi','Defines the delivery area')],
 [('Demografik','Demographic'),('Talaba, tushlik byudjeti cheklangan','Student with a limited lunch budget'),('Narx chegarasini o‘rganish uchun','Investigate the budget constraint')],
 [('Psixografik','Psychographic'),('Sog‘lom ovqatlanishga ahamiyat beradi','Values healthy food'),('Qadriyat va tanlov sababini anglash uchun','Understand values and preferences')],
 [('Xulq-atvor','Behavioural'),('Haftada 3 marta navbat sabab tushlikni o‘tkazadi','Misses lunch 3 times a week due to queues'),('Muammo takrorlanishini ko‘rsatadi','Shows a recurring problem')]])+
 box('Ishchi segment: <b>kampusga yaqin, 30 daqiqalik tanaffusda navbatga ulgurmaydigan, haftada kamida 3 marta tayyor tushlik oladigan talabalar.</b> Bu ta’rifning har qismi tekshiriladigan taxmindir.',
 'Working segment: <b>students near campus who cannot finish queuing in a 30-minute break and buy prepared lunch at least 3 times a week.</b> Every part is an assumption to check.')+
 p('Segment o‘lchanadigan, yetib boriladigan, yetarli hajmli va alohida taklifga javob beradigan bo‘lsin. B2Bda korxona sohasi, hajmi va xarid jarayoni ham muhim.',
 'A useful segment is measurable, reachable, sufficiently large and responsive to a distinct offer. For B2B, include industry, company size and buying process.'))

page('Qaysi segmentdan boshlaymiz?', 'Which segment should we start with?',
 p('1 — past, 5 — yuqori. Ballar — suhbatdan oldingi ishchi taxmin; natija talab isboti emas.',
 '1 = low, 5 = high. Scores are working assumptions before interviews; a ranking is not proof of demand.')+
 table(['Segment','Muammo','Yetib borish','To‘lash','Jami'],['Segment','Pain','Reach','Ability to pay','Total'],[
 [('Talabalar','Students'),('5','5'),('5','5'),('2','2'),('12','12')],
 [('Ofis xodimlari','Office workers'),('4','4'),('3','3'),('4','4'),('11','11')],
 [('Sayyohlar','Tourists'),('3','3'),('2','2'),('4','4'),('9','9')]])+
 grid(card('Tanlov sababi','Reason for selection','Talabalarga yetib borish oson va muammo takrorlanishi mumkin. Lekin narxga sezgirlik sinovning asosiy xavfi.',
 'Students are easy to reach and may have a recurring problem. Price sensitivity is the main risk to test.'),
 card('Cheklov','Constraint','Muammosi kuchli segment ham zararli bo‘lishi mumkin. Buyurtma tannarxi, yetkazish quvvati va ruxsatlarni alohida tekshiring.',
 'Even a segment with strong pain may be unprofitable. Check order costs, delivery capacity and permissions separately.')))

page('Persona: hikoya emas, dalillar xulosasi', 'Persona: a synthesis of evidence',
 grid(card('Ishchi persona: Dilnoza','Working persona: Dilnoza','2-kurs talabasi; tanaffusi 30 daqiqa. Faraz: haftada 3 kun tayyor tushlik oladi, 25 000 so‘mgacha sarflay oladi. Bu uydirma o‘quv profili; real mijoz haqidagi fakt emas.',
 'Second-year student with a 30-minute break. Assumption: buys lunch 3 days a week and can spend up to UZS 25,000. This is a fictional teaching profile, not evidence about real customers.'),
 card('Kartaga nimalar yoziladi?','What belongs on the card?','Vaziyat; maqsad; muammo; hozirgi yechim; sarflanayotgan vaqt/pul; xarid mezoni; e’tiroz; dalil manbasi va sana.',
 'Context; goal; problem; current workaround; time/money spent; buying criteria; objection; evidence source and date.'))+
 box('Dalil yorlig‘i: <b>Fakt</b> — suhbatdosh aytgan aniq voqea. <b>Talqin</b> — biz chiqargan xulosa. <b>Taxmin</b> — hali tekshirilmagan fikr. Iqtibosni o‘ylab topmang; ism o‘rniga anonim kod ishlating.',
 'Evidence labels: <b>Observation</b> = a specific event reported by a participant. <b>Interpretation</b> = our inference. <b>Assumption</b> = untested belief. Never invent a quote; use anonymous participant codes.')+
 p('Persona bir segmentdagi o‘xshash ehtiyojlarni jamlaydi. Yosh yoki chiroyli suratning o‘zi xaridni tushuntirmaydi. Yangi dalillar kelganda kartani yangilang.',
 'A persona summarizes similar needs in a segment. Age or a polished photo alone does not explain a purchase. Update it as evidence changes.'))

page('Xarid motivi: mijoz kutayotgan natija', 'Buying motivation: the desired outcome',
 box('<b>JTBD:</b> «[Vaziyat] bo‘lganda, [ishni] bajarmoqchiman, shunda [natijaga] erishaman». Bu tayyor mahsulot g‘oyasi emas, mijozning vazifasi.',
 '<b>JTBD:</b> “When [situation], I want to [make progress], so I can [achieve an outcome].” This describes the customer’s job, not a proposed product.')+
 p('Misol: «Darslar orasida 30 daqiqa bo‘lganda, navbatsiz tushlik qilmoqchiman, shunda keyingi darsga vaqtida va xotirjam kiraman».',
 'Example: “When I have 30 minutes between classes, I want lunch without queuing, so I can get to the next class on time and relaxed.”')+
 grid(card('Funksional va hissiy','Functional and emotional','Funksional: vaqtida ovqatlanish. Hissiy: kechikishdan xavotir olmaslik. Ijtimoiy: do‘stlar bilan birga ovqatlanish. Bir xaridda uchala motiv ham bo‘lishi mumkin.',
 'Functional: eat on time. Emotional: avoid worrying about being late. Social: eat with friends. One purchase may involve all three.'),
 card('Haqiqiy raqobatchilar','Real alternatives','Oshxona, uyda tayyorlangan ovqat, do‘kondagi gazak va tushlik qilmaslik ham muqobil. Mijoz yangi xizmatga o‘tishi uchun nimadan voz kechadi?',
 'Canteen, packed lunch, a shop snack and skipping lunch are all alternatives. What must the customer give up to switch?')))

page('Suhbat: reklama qilmay, o‘tmishni so‘rang', 'Interview: ask about the past, without pitching',
 table(['Yo‘naltiruvchi savol','Dalilga yaqin savol'],['Leading question','Evidence-oriented question'],[
 [('Bizning xizmat zo‘r, olasizmi?','Our service is great; would you buy it?'),('Oxirgi marta tushlikka ulgurmaganingizda nima bo‘ldi?','What happened the last time you could not get lunch?')],
 [('25 000 so‘m arzon-ku, to‘g‘rimi?','UZS 25,000 is cheap, right?'),('Oxirgi tushlikka qancha va qanday to‘ladingiz?','How much did your last lunch cost and how did you pay?')],
 [('Yetkazish kerakmi?','Do you need delivery?'),('O‘shanda muammoni qanday hal qildingiz?','How did you deal with the problem that time?')]])+
 p('<b>15 daqiqalik tartib:</b> rozilik oling → oxirgi aniq voqeani so‘rang → vaqt, xarajat va oqibatni aniqlang → hozirgi yechimni so‘rang → xulosani suhbatdoshga tekshirtiring.',
 '<b>15-minute structure:</b> obtain consent → ask about a recent specific event → explore time, cost and consequences → ask about the workaround → confirm your understanding.')+
 box('«Ha» javobi buyurtma emas. 5–10 suhbat dastlabki naqshlarni ochishi mumkin, ammo butun bozor ulushini isbotlamaydi. Faqat do‘stlar bilan cheklanmang; turli va xizmatni rad etgan odamlarni ham tinglang.',
 'A “yes” is not an order. Five to ten interviews can reveal early patterns, but cannot prove population shares. Go beyond friends; include varied participants and people who reject the offer.'))

page('Dalillar: qaysi xulosaga haqqimiz bor?', 'Evidence: what can we conclude?',
 table(['O‘quv kuzatuvi','Ehtiyotkor xulosa','Keyingi tekshiruv'],['Teaching observation','Careful inference','Next check'],[
 [('8 suhbatdan 5 tasida navbat tilga olindi','5 of 8 interviews mentioned queues'),('Shu suhbatlarda muammo takrorlandi','The issue recurred in these interviews'),('Boshqa vaqt va joylarda ham kuzatish','Observe other times and locations')],
 [('20 taklifdan 6 ta haqiqiy buyurtma','6 real orders from 20 offers'),('Shu sinovda konversiya 30%','Conversion was 30% in this test'),('Boshqa guruhda qayta sinash','Repeat with another group')],
 [('Mijoz «mazali» dedi, qaytmadi','Customer said “tasty” but did not return'),('Maqtov qayta xaridga teng emas','Praise is not repeat purchase'),('Sababini so‘rash va kuzatish','Ask why and observe')]])+
 box('<b>5/8 = butun bozorning 62,5%i degani emas.</b> Qulay tanlama, kichik son va savol usuli xulosani cheklaydi. Sana, joy, tanlash usuli va kuzatuv sonini yozing.',
 '<b>5/8 does not mean 62.5% of the entire market.</b> Convenience sampling, small numbers and question wording limit inference. Record date, place, recruitment method and sample size.')+
 p('Shaxsiy ma’lumotni zaruratdan ortiq yig‘mang. Telefon yoki audio yozuv uchun alohida rozilik oling; hisobotda odamlarni aniqlashga imkon beradigan ma’lumotni bermang.',
 'Collect only necessary personal data. Obtain separate consent for phone details or recordings; omit identifying information from reports.'))

page('Qiymat taklifi: ehtiyojdan aniq va’daga', 'Value proposition: from need to a specific promise',
 box('«[Segment] uchun, [vaziyat/muammo] paytida, [natija] beramiz; [muqobil]ga nisbatan [tekshiriladigan farq] bilan».',
 '“For [segment], facing [situation/problem], we deliver [outcome], with [testable difference] compared with [alternative].”')+
 p('<b>Taklif gipotezasi:</b> kampus yaqinidagi talabalar uchun tanaffus boshida belgilangan topshirish nuqtasiga 25 000 so‘mlik tushlik. Menyu, tarkib va umumiy narx oldindan ko‘rsatiladi.',
 '<b>Offer hypothesis:</b> lunch for students near campus, delivered to an agreed pickup point at the start of the break for UZS 25,000. Show menu, ingredients and total price in advance.')+
 grid(card('Moslik','Fit','Muammo — navbat. Yechim — oldindan buyurtma va aniq vaqt. Dalil — vaqtida topshirilgan buyurtmalar ulushi hamda qayta xarid.',
 'Pain: queues. Response: pre-ordering and a clear time slot. Evidence: on-time handover rate and repeat purchases.'),
 card('Va’dani o‘lchang','Measure the promise','«Eng zo‘r» o‘rniga aniq vaqt oralig‘ini ayting. Kechikish, bekor qilish va pulni qaytarish shartlarini tushuntiring; bajara olmaydigan kafolat bermang.',
 'Replace “the best” with a specific time window. Explain delays, cancellation and refunds; avoid promises you cannot fulfil.')))

page('TAM, SAM, SOM: uch xil savol', 'TAM, SAM, SOM: three different questions',
 grid(card('TAM — umumiy imkoniyat','TAM — total addressable market','Aniq mahsulot toifasi, geografiya va davr ichidagi barcha mos talab. «Dunyodagi hamma odam» emas. Chegarani avval belgilang.',
 'All relevant demand within a defined category, geography and period. Not “everyone in the world.” Define the boundary first.'),
 card('SAM — xizmat ko‘rsatish mumkin bo‘lgan qism','SAM — serviceable available market','TAM ichidan hudud, taklif, narx va kanalingiz mos keladigan qism. Xizmat modeliga mos kelmaydigan talabni chiqarib tashlang.',
 'The part of TAM compatible with your area, offer, price and channels. Exclude demand your service model cannot serve.'),
 card('SOM — erishish mumkin bo‘lgan qism','SOM — serviceable obtainable market','Belgilangan davrda raqobat, konversiya, byudjet va quvvat bilan olinishi mumkin bo‘lgan qism. Ixtiyoriy 1–2% emas.',
 'The realistically obtainable part in a stated period, considering competition, conversion, budget and capacity. Not an arbitrary 1–2%.'),
 card('Birlik va manba','Units and sources','Mijoz, buyurtma va tushumni aralashtirmang. SOM ≤ SAM ≤ TAM. Rasmiy statistikaning sanasi va aynan qaysi guruhni sanaganini tekshiring.',
 'Do not mix customers, orders and revenue. SOM ≤ SAM ≤ TAM. Check the date and population definition of official data.')))

page('Bozor hisobi: bir xil davr, aniq faraz', 'Market sizing: a consistent period and explicit assumptions',
 p('<b>Barcha sonlar shartli.</b> Davr — yil; narx — 25 000 so‘m/buyurtma; mos mijoz yiliga 40 buyurtma beradi deb faraz qilamiz.',
 '<b>All figures are hypothetical.</b> Period: one year; price: UZS 25,000 per order; assume 40 annual orders per relevant customer.')+
 table(['Qatlam','Hisob','Yillik tushum imkoniyati'],['Layer','Calculation','Annual revenue opportunity'],[
 [('TAM: shartli hududda 10 000 mos mijoz','TAM: 10,000 relevant customers in a defined area'),('10 000 × 40 × 25 000','10,000 × 40 × 25,000'),('10 mlrd so‘m','UZS 10 billion')],
 [('SAM: yetkazish hududida 1 000 mijoz','SAM: 1,000 customers in the delivery area'),('1 000 × 40 × 25 000','1,000 × 40 × 25,000'),('1 mlrd so‘m','UZS 1 billion')],
 [('SOM: faraziy 100 faol mijoz','SOM: hypothetical 100 active customers'),('100 × 40 × 25 000','100 × 40 × 25,000'),('100 mln so‘m','UZS 100 million')]])+
 box('<b>Quvvat chegarasi:</b> 20 buyurtma/kun × 200 ish kuni = 4 000 buyurtma/yil. 100 mijoz × 40 = 4 000: bu to‘liq quvvat, kafolatlangan sotuv emas. Yetkazish va oshxona quvvatidan kichigini oling; zaxira vaqt ham kerak.',
 '<b>Capacity ceiling:</b> 20 orders/day × 200 operating days = 4,000 orders/year. 100 customers × 40 = 4,000: full capacity, not guaranteed sales. Use the smaller of kitchen and delivery capacity; allow a buffer.')+
 p('Sezgirlik: yiliga 20 buyurtma bo‘lsa, bir xil 100 mijozdan tushum 50 mln so‘mga tushadi. Narx × son — foyda emas: xarajatlar hali ayrilmagan.',
 'Sensitivity: at 20 annual orders, the same 100 customers yield UZS 50 million. Price × quantity is revenue, not profit; costs have not been deducted.'))

page('Birinchi oy: voronka va qayta xarid', 'First month: funnel and repeat purchase',
 table(['Bosqich','Hisob','Natija'],['Stage','Calculation','Result'],[
 [('Noyob auditoriya','Unique audience'),('400 kishi taklifni ko‘rdi','400 people saw the offer'),('400','400')],
 [('Qiziqish','Interest'),('400 × 25%','400 × 25%'),('100 kishi','100 people')],
 [('Birinchi xarid','First purchase'),('100 × 20%','100 × 20%'),('20 noyob xaridor','20 unique buyers')],
 [('Qayta xarid','Repeat purchase'),('20 × 30%','20 × 30%'),('6 qaytgan xaridor','6 returning buyers')]])+
 box('Umumiy birinchi xarid konversiyasi = <b>20 / 400 = 5%</b>. Qaytgan 6 kishi yangi mijoz emas. Har biri yana bir marta olsa: 20 + 6 = <b>26 buyurtma</b>; tushum = 26 × 25 000 = <b>650 000 so‘m</b>.',
 'Overall first-purchase conversion = <b>20 / 400 = 5%</b>. The 6 returning buyers are not new customers. If each orders once more: 20 + 6 = <b>26 orders</b>; revenue = 26 × 25,000 = <b>UZS 650,000</b>.')+
 p('Bu foizlar universal me’yor emas. Kanal, davr va hisoblash asosini yozing. Shu sur’atning o‘zi 100 faol mijozga yetish rejasini tasdiqlamaydi: jalb qilish va qayta xaridni alohida tekshiring.',
 'These rates are not universal benchmarks. State channel, period and denominator. This pace alone does not validate a plan for 100 active customers: test acquisition and repeat behaviour separately.'))

page('Kichik sinov: oldindan mezon belgilang', 'Small experiment: set a decision rule in advance',
 grid(card('Gipoteza va tajriba','Hypothesis and experiment','Tanlangan segmentdagi 20 kishiga aniq menyu, 25 000 so‘mlik yakuniy narx va vaqt oralig‘ini taklif qilamiz. Sinov — 5 ish kuni; faqat bajarish mumkin bo‘lgan buyurtma olinadi.',
 'Offer 20 people in the chosen segment a defined menu, total price of UZS 25,000 and a delivery window. Run for 5 working days; accept only orders you can fulfil.'),
 card('O‘quv qaror mezoni','Teaching decision rule','Kamida 6 ta haqiqiy buyurtma va ularning kamida 5 tasi vaqtida topshirilsa — takroriy sinov. Aks holda rad etish sababi va jarayonni o‘rganib, taklifni qayta ko‘ramiz. Bu universal standart emas.',
 'If at least 6 real orders are received and at least 5 arrive on time, repeat the experiment. Otherwise study rejection reasons and operations, then revise the offer. This is not a universal standard.'))+
 p('<b>Bir buyurtma hisobi:</b> 25 000 − 17 000 ovqat/qadoq − 4 000 yetkazish = 4 000 so‘m hissa. 26 buyurtma = 104 000 so‘m; ijara, reklama va boshqa doimiy xarajatlar hali ayrilmagan.',
 '<b>Per-order economics:</b> 25,000 − 17,000 food/packaging − 4,000 delivery = UZS 4,000 contribution. 26 orders = UZS 104,000 before rent, advertising and other fixed costs.')+
 box('Buyurtma soni bilan birga kechikish, bekor qilish, shikoyat va qayta xaridni yozing. Oziq-ovqat xavfsizligi, allergenlar va sotishga tegishli mahalliy talablarni haqiqiy sinovdan oldin tekshiring.',
 'Track delays, cancellations, complaints and repeat purchases alongside orders. Check food safety, allergens and applicable local selling requirements before a real pilot.'))

page('Guruh mashqi: tadqiqotchi va tadbirkor', 'Group exercise: researcher and entrepreneur',
 grid(card('15 daqiqa · uch kishilik guruh','15 minutes · groups of three','3 daqiqa: xizmat va segmentni tanlang. 5 daqiqa: suhbatdosh, tadqiqotchi va kuzatuvchi bo‘lib suhbat qiling. 4 daqiqa: fakt/talqin/taxmin kartasini tuzing. 3 daqiqa: xulosa va sinov rejasini ayting.',
 '3 minutes: choose a service and segment. 5 minutes: interview in participant, researcher and observer roles. 4 minutes: build an observation/interpretation/assumption card. 3 minutes: present findings and a test plan.'),
 card('Topshiriladigan bitta sahifa','One-page deliverable','Segment + rollar; bitta aniq voqea; JTBD; muqobil yechim; qiymat taklifi; TAM/SAM/SOM farazlari; sinov mezoni. Auditoriyadagi rolli o‘yin real bozor tadqiqoti o‘rnini bosmaydi.',
 'Segment and roles; one specific event; JTBD; alternative; value proposition; TAM/SAM/SOM assumptions; experiment threshold. Classroom role-play does not replace real market research.'))+
 box('<b>10 ballik baholash:</b> segment va rollar — 2; dalil va taxmin farqi — 2; JTBD va taklif mosligi — 2; birliklari to‘g‘ri hisob — 2; aniq sinov va qaror — 2.',
 '<b>10-point rubric:</b> segment and roles — 2; evidence versus assumptions — 2; JTBD/offer fit — 2; consistent calculations — 2; explicit experiment and decision — 2.'))

video='https://www.youtube.com/watch?v=z4hmIU-PiR0'
page('Video va tekshiriladigan manbalar', 'Video and reference sources',
 '<style>.lesson-video{width:100%;max-width:820px;margin:16px auto;aspect-ratio:16/9}.lesson-video iframe{display:block;width:100%;height:100%;border:0;border-radius:14px}@media print{.lesson-video{display:none!important}}</style>'+
 '<div class="lesson-video"><iframe src="https://www.youtube-nocookie.com/embed/z4hmIU-PiR0?rel=0" title="7-dars: video / Lesson 7: video" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>'+
 '<a class="card" style="display:block;color:inherit;text-decoration:none" href="'+video+'" target="_blank" rel="noopener noreferrer">'+
 f'<h3 {d("▶ Mavzuga oid video dars / Video lesson","▶ Mavzuga oid video dars / Video lesson")}>▶ Mavzuga oid video dars / Video lesson</h3>'+
 p('Videoni yuqoridagi pleyerda tomosha qiling. Pleyer ochilmasa, shu havola orqali YouTube’da ko‘ring. Ko‘rgach, quyidagi savollarni muhokama qiling.',
 'Watch in the player above. If the player is unavailable, use this link to watch on YouTube. Afterwards, discuss the questions below.')+'</a>'+
 p('<b>Ko‘rish vazifasi:</b> 1) mijozni aniqlashga yordam beradigan ikkita fikrni yozing; 2) ularni o‘z g‘oyangizga qo‘llang; 3) tekshirish uchun uchta yo‘naltirmaydigan suhbat savolini tuzing.',
 '<b>Viewing task:</b> 1) note two ideas that help identify customers; 2) apply them to your idea; 3) write three non-leading interview questions to test your assumptions.')+
 '<ul><li><a href="https://www.strategyzer.com/library/the-value-proposition-canvas" target="_blank" rel="noopener noreferrer">Strategyzer — Value Proposition Canvas</a></li><li><a href="https://www.strategyzer.com/books/testing-business-ideas" target="_blank" rel="noopener noreferrer">Bland &amp; Osterwalder — Testing Business Ideas (2019)</a></li><li><a href="https://www.momtestbook.com/" target="_blank" rel="noopener noreferrer">Rob Fitzpatrick — The Mom Test (2013)</a></li><li><a href="https://stat.uz/" target="_blank" rel="noopener noreferrer">O‘zbekiston rasmiy statistikasi / Official statistics of Uzbekistan</a></li></ul>'+
 p('Manbalar tushuncha va tadqiqot usullarini chuqurlashtirish uchun. Darsdagi sonlar ulardan olingan statistik ma’lumot emas. Video ochilmasa, 8-slayddagi savollar bilan mashqni davom ettiring.',
 'Sources extend the concepts and research methods. The figures in this lesson are not statistics taken from these sources. If the video is unavailable, use the interview questions on slide 8.'))

page('Xulosa va mustaqil ish', 'Summary and assignment',
 box('<b>Esda tuting:</b> segment — kim; JTBD — vaziyatdagi natija; persona — dalillar xulosasi; qiymat taklifi — tekshiriladigan va’da; bozor hisobi — manbali faraz; sinov — keyingi qaror uchun dalil.',
 '<b>Remember:</b> segment = who; JTBD = progress in context; persona = evidence synthesis; value proposition = testable promise; market estimate = sourced assumptions; experiment = evidence for a decision.')+
 grid(card('Mustaqil ish','Assignment','Bir g‘oya uchun 3 segmentni solishtiring. Tanlangan segmentdan kamida 3 kishi bilan rozilik asosida suhbat qiling. Anonim qaydlar, bitta persona va JTBD tuzing; kamida 2 muqobilni solishtiring.',
 'Compare 3 segments for one idea. Interview at least 3 consenting people from your chosen segment. Produce anonymous notes, one persona and JTBD; compare at least 2 alternatives.'),
 card('Hisob va topshirish','Calculation and submission','Bir xil davrda TAM/SAM/SOM hisoblang; har farazga manba yoki «tekshirilmagan» yorlig‘ini bering. 2 sahifalik hisobotga voronka, birlik xarajatlari va 5 kunlik sinov rejasini qo‘shing.',
 'Calculate TAM/SAM/SOM for the same period; attach a source or “untested” label to each assumption. Submit a 2-page report with a funnel, unit costs and a 5-day experiment plan.'))+
 p('Kamida 3 suhbat — mashqning minimumi; bozor bo‘yicha umumlashtirish uchun yetarli tanlama emas. Keyingi darsda qaysi taxminingiz o‘zgarganini aytasiz.',
 'Three interviews are the assignment minimum, not a sufficient sample for population claims. Next lesson, explain which assumption changed.'))

# Keep the existing multiple-choice engine and its DOM contract.
page('Bilimni tekshirish · 15 savol', 'Check your understanding · 15 questions',
 '<div class="scorebar"><span><span data-ui="score">Natija:</span> <b><span id="scoreNow">0</span> / <span id="scoreMax">15</span></b></span><span><span data-ui="answered">Javob berildi:</span> <b id="answered">0</b></span><div class="spacer"></div>'+f'<button class="btn warn" id="btnReset" {d("↻ Testni qayta boshlash","↻ Restart quiz")}>↻ Testni qayta boshlash</button></div><div id="testWrap"></div><div class="result" id="result"><div class="pct" id="pct">0%</div><h3 id="resTitle" {d("Natija","Result")}>Natija</h3><p id="resTxt"></p></div>'+
 p('Har javobdan so‘ng izohni o‘qing. Xato bo‘lgan savolning slaydiga qaytib, hisob yoki dalilni tushuntiring.',
 'Read the explanation after each answer. Return to the relevant slide and explain the calculation or evidence behind any mistake.'))

Q=[]
def quiz(q,qe,a,ae,c,e,ee): Q.append(dict(q=q,qe=qe,a=a,ae=ae,c=c,e=e,ee=ee))
quiz('Dasturdan hisobchi foydalanadi, rahbar xaridni tasdiqlaydi. Rahbarning roli nima?', 'An accountant uses software; a manager approves its purchase. What is the manager’s role?',
 ['Foydalanuvchi','Qaror egasi','Oddiy kuzatuvchi','Tashqi yetkazuvchi'],['User','Decision maker','Casual observer','External supplier'],1,'Qarorni tasdiqlash — qaror egasining roli. To‘lovchi alohida bo‘lishi mumkin.','Approving the purchase is the decision-maker role. The payer may be someone else.')
quiz('Qaysi belgi xulq-atvor segmentlashiga kiradi?', 'Which is a behavioural segmentation criterion?',
 ['Yashash tumani','Talabaning yoshi','Haftalik xarid chastotasi','Sog‘lom hayot qadriyati'],['District of residence','Student age','Weekly purchase frequency','Valuing a healthy lifestyle'],2,'Xarid chastotasi — kuzatiladigan xarid odati.','Purchase frequency describes buying behaviour.')
quiz('Jadvalda eng ko‘p ball olgan segment haqida nima deya olamiz?', 'What can we conclude about the highest-scoring segment?',
 ['Talab to‘liq isbotlangan','Sinov uchun ustuvor taxmin','Raqobatchilar yo‘q','Foyda kafolatlangan'],['Demand is fully proven','It is a priority hypothesis to test','There are no competitors','Profit is guaranteed'],1,'Reyting tanlovga yordam beradi, ammo mijoz dalili va iqtisodiy hisobni almashtirmaydi.','A ranking helps prioritize; it does not replace customer evidence or economic checks.')
quiz('Personadagi «25 000 so‘m to‘laydi» fikri hali tekshirilmagan. Uni qanday belgilaymiz?', 'A persona says “will pay UZS 25,000”, without evidence. How should we label it?',
 ['Tasdiqlangan fakt','Rasmiy statistika','Haqiqiy buyurtma','Tekshirilmagan taxmin'],['Confirmed observation','Official statistic','Real order','Untested assumption'],3,'Dalil bo‘lmasa, bu taxmin. Uni haqiqiy xarid yoki boshqa mos sinov bilan tekshiramiz.','Without evidence it is an assumption; test it through real purchase behaviour or another suitable experiment.')
quiz('Qaysi jumla JTBDga mos?', 'Which statement describes a JTBD?',
 ['Tanaffusda navbatsiz ovqatlanib, darsga vaqtida kirmoqchiman','Biz qizil qadoqli yangi mahsulot ishlab chiqaramiz','Mijozlarimiz 18–24 yoshdagi barcha odamlar','Mahsulotimiz bozordagi eng mashhur brend bo‘ladi'],['During my break I want lunch without queuing so I reach class on time','We will produce a new item in red packaging','Our customers are all people aged 18–24','Our product will become the most famous brand'],0,'JTBD vaziyat, bajariladigan ish va kutilgan natijani bog‘laydi.','JTBD connects context, desired progress and outcome.')
quiz('Suhbatni qaysi savol bilan boshlash foydaliroq?', 'Which is the more useful interview question?',
 ['Yangi xizmatimizni albatta olasizmi?','25 000 so‘m sizga arzon, shundaymi?','Oxirgi marta tushlikka ulgurmaganingizda nima qildingiz?','Bizning menyu hammadan yaxshi emasmi?'],['Will you definitely buy our new service?','UZS 25,000 is cheap for you, right?','What did you do the last time you could not get lunch?','Is our menu not better than everyone else’s?'],2,'Aniq o‘tgan voqea haqidagi savol odat va muqobil yechimni ochadi.','A specific past event reveals behaviour and alternatives.')
quiz('8 suhbatdan 5 tasida navbat muammosi aytildi. To‘g‘ri xulosa qaysi?', 'Five of eight interviews mentioned queues. Which conclusion is justified?',
 ['Butun bozorning 62,5%i mijoz bo‘ladi','Shu suhbatlarda muammo takrorlandi','Mahsulotning foydasi isbotlandi','Boshqa tadqiqot endi kerak emas'],['62.5% of the whole market will become customers','The issue recurred in these interviews','Product profitability is proven','No further research is needed'],1,'Kichik, qulay tanlama butun bozorni ifodalamasligi mumkin.','A small convenience sample may not represent the population.')
quiz('Tushlik xizmatining muqobili qaysi?', 'Which can be an alternative to a lunch service?',
 ['Faqat aynan shunday yetkazish ilovasi','Faqat eng qimmat restoran','Faqat yirik xalqaro brend','Uy ovqati, gazak yoki tushlikni o‘tkazish'],['Only an identical delivery app','Only the most expensive restaurant','Only a major international brand','Packed lunch, a snack or skipping lunch'],3,'Muqobil — mijoz bugun ishlatayotgan boshqa yechim, shu jumladan hech narsa qilmaslik.','An alternative is another way customers handle the situation, including doing nothing.')
quiz('SAM qaysi ta’rifga mos?', 'Which definition fits SAM?',
 ['TAMning xizmat modelimiz mos keladigan qismi','Birinchi oyning sof foydasi','Dunyodagi barcha odamlar soni','Raqobatchilarning umumiy xarajati'],['The part of TAM compatible with our service model','Net profit in the first month','Everyone in the world','Competitors’ total costs'],0,'SAM hudud, taklif, narx va kanal cheklovlariga mos bozor qismidir.','SAM reflects constraints of geography, offer, price and channels.')
quiz('100 mijoz yiliga 40 buyurtma beradi, narx 25 000 so‘m. Yillik tushum qancha?', '100 customers place 40 annual orders each at UZS 25,000. What is annual revenue?',
 ['10 mln so‘m','40 mln so‘m','100 mln so‘m','1 mlrd so‘m'],['UZS 10 million','UZS 40 million','UZS 100 million','UZS 1 billion'],2,'100 × 40 × 25 000 = 100 000 000 so‘m. Bu tushum, sof foyda emas.','100 × 40 × 25,000 = UZS 100,000,000. This is revenue, not net profit.')
quiz('Kuniga 20 buyurtma va yiliga 200 ish kunida quvvat qancha?', 'What is capacity at 20 daily orders over 200 operating days?',
 ['4 000 buyurtma/yil','4 000 noyob mijoz/kun','400 buyurtma/yil','20 000 mijoz/yil'],['4,000 orders/year','4,000 unique customers/day','400 orders/year','20,000 customers/year'],0,'20 × 200 = 4 000 buyurtma. Quvvat mijoz soni va sotuv kafolati emas.','20 × 200 = 4,000 orders. Capacity is not a customer count or a sales guarantee.')
quiz('400 kishidan 100 tasi qiziqdi, ulardan 20 tasi xarid qildi. Umumiy konversiya qancha?', 'Of 400 people, 100 showed interest and 20 purchased. What is overall conversion?',
 ['25%','20%','30%','5%'],['25%','20%','30%','5%'],3,'20 / 400 × 100 = 5%. 20 / 100 = 20% esa faqat ikkinchi bosqich konversiyasi.','20 / 400 × 100 = 5%. 20 / 100 = 20% is only the second-stage conversion.')
quiz('20 xaridordan 6 tasi yana bir marta oldi. Noyob mijoz va buyurtmalar soni qancha?', '20 buyers each order once; 6 order once more. How many unique customers and orders?',
 ['26 mijoz, 26 buyurtma','20 mijoz, 26 buyurtma','20 mijoz, 6 buyurtma','6 mijoz, 20 buyurtma'],['26 customers, 26 orders','20 customers, 26 orders','20 customers, 6 orders','6 customers, 20 orders'],1,'Qaytgan mijozni yangi mijoz deb qayta sanamaymiz; buyurtma soni esa oshadi.','Returning buyers are not counted again as new customers; order count increases.')
quiz('Narx 25 000, ovqat/qadoq 17 000, yetkazish 4 000 so‘m. Bir buyurtma hissasi qancha?', 'Price is 25,000, food/packaging 17,000, delivery 4,000. What is contribution per order?',
 ['25 000 so‘m sof foyda','8 000 so‘m sof foyda','4 000 so‘m hissa','21 000 so‘m hissa'],['UZS 25,000 net profit','UZS 8,000 net profit','UZS 4,000 contribution','UZS 21,000 contribution'],2,'25 000 − 17 000 − 4 000 = 4 000. Doimiy xarajatlar ayrilmagani uchun bu sof foyda emas.','25,000 − 17,000 − 4,000 = 4,000. Fixed costs have not been deducted, so this is not net profit.')
quiz('Kichik sinovdan oldin nimani belgilash kerak?', 'What should be defined before a small experiment?',
 ['Gipoteza, muddat, o‘lchov va qaror mezoni','Faqat logotipning yangi rangini','Faqat xodimlar uchun lavozim nomini','Natijadan keyin qulay kelgan mezonni'],['Hypothesis, deadline, measure and decision rule','Only a new logo colour','Only new staff job titles','A convenient threshold chosen after results'],0,'Oldindan mezon qo‘yish natijani o‘z xohishimizga mos talqin qilish xavfini kamaytiradi.','A pre-defined decision rule reduces the risk of interpreting results to suit our preferences.')
