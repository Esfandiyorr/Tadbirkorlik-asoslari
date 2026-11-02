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
 p('Mijoz kim? · Odamlarga nima kerak? · Mijozlarni guruhlarga ajratish · Mijoz portreti · To‘g‘ri savol berish · Bozor hajmini oddiy misolda tushunish.',
 'Who is the customer? · What do people need? · Grouping customers · A customer profile · Asking useful questions · Understanding market size through a simple example.', 'lead')+
 '<div class="meta">'+
 cover_text('div', '📚 Fan: <b>Tadbirkorlik asoslari</b>', '📚 Subject: <b>Fundamentals of Entrepreneurship</b>')+
 cover_text('div', '🎓 <b>Termiz davlat universiteti</b>', '🎓 <b>Termez State University</b>')+
 cover_text('div', '🗂 <b>18</b> slayd · <b>15</b> ta test', '🗂 <b>18</b> slides · <b>15</b> questions')+
 cover_text('div', '⌨️ <b>→</b> tugmasi bilan davom eting', '⌨️ Press <b>→</b> to continue')+
 '</div></div></div>')

page('Bugun nimalarni o‘rganamiz?', 'What will we learn today?',
 grid(card('Mijozni taniymiz','Understand the customer','Kim mahsulotdan foydalanadi, kim pul to‘laydi va nima uchun sotib oladi — shuni ajratamiz.',
 'Distinguish who uses a product, who pays and why they buy.'),
 card('Ehtiyojni tushunamiz','Understand the need','Ehtiyoj — odamga kerak bo‘lgan narsa yoki natija. Masalan: talaba tanaffusda ovqatlanib, darsga kechikmaslikni xohlaydi.',
 'A need is something a person requires or wants to achieve. For example, a student wants to eat during the break without being late for class.'),
 card('Savol berishni o‘rganamiz','Learn to ask questions','Mijozning fikrini taxmin qilish o‘rniga, uning oxirgi xaridi va duch kelgan qiyinchiligini so‘raymiz.',
 'Instead of guessing what customers think, ask about their last purchase and the difficulty they faced.'),
 card('Oddiy hisobni ko‘ramiz','Look at a simple calculation','Qancha odamga taklif bera olamiz va nechta buyurtmani bajara olamiz — oddiy sonlar bilan tushunamiz.',
 'Use simple numbers to understand how many people we can serve and how many orders we can fulfil.'))+
 box('Dars davomida bitta misol: <b>universitet yaqinida talabalar uchun tushlik sotish</b>. Barcha sonlar tushuntirish uchun olingan shartli misollardir.',
 'One example throughout: <b>selling lunch to students near a university</b>. All figures are hypothetical teaching examples.'))

page('Mijoz kim?', 'Who is a customer?',
 box('<b>Mijoz — mahsulot yoki xizmatni sotib oladigan odam yoki tashkilot.</b> Mahsulotdan foydalanadigan odam bilan pul to‘laydigan odam har doim bir kishi bo‘lavermaydi.',
 '<b>A customer is a person or organization that buys a product or service.</b> The user and the person paying are not always the same.')+
 table(['Oddiy savol','Rolning nomi','Misol'],['Simple question','Role','Example'],[
 [('Kim foydalanadi?','Who uses it?'),('Foydalanuvchi','User'),('Bola maktab sumkasini ishlatadi','A child uses the schoolbag')],
 [('Kim pul to‘laydi?','Who pays?'),('To‘lovchi','Payer'),('Sumka pulini ota-ona to‘laydi','A parent pays for the schoolbag')],
 [('Kim tanlaydi?','Who decides?'),('Qaror qabul qiluvchi','Decision maker'),('Ota-ona bola bilan birga sumkani tanlaydi','Parent and child choose the schoolbag together')]])+
 p('Talaba tushlikni o‘zi tanlab, o‘zi to‘lab, o‘zi yesa — uchala rolni ham o‘zi bajaradi. Sotuvchi foydalanuvchi uchun qulaylikni, to‘lovchi uchun narxni ham hisobga oladi.',
 'A student who chooses, pays for and eats lunch fills all three roles. A seller considers convenience for the user and price for the payer.'))

page('Hamma odamga bir xil mahsulot kerakmi?', 'Does everyone need the same product?',
 box('<b>Segment — ehtiyoji yoki xarid odati o‘xshash mijozlar guruhi.</b> Segmentlash — odamlarni shunday guruhlarga ajratish.',
 '<b>A segment is a group of customers with similar needs or buying habits.</b> Segmentation means dividing customers into such groups.')+
 table(['Nimaga qaraymiz?','Ilmiy nomi','Tushlik misoli'],['What do we consider?','Technical term','Lunch example'],[
 [('Qayerda yashaydi yoki o‘qiydi?','Where do they live or study?'),('Geografik belgi','Geographic'),('Universitetga yaqin talabalar','Students near the university')],
 [('Yoshi va daromadi qanday?','What is their age or income?'),('Demografik belgi','Demographic'),('Tushlikka ajratadigan puli cheklangan talaba','Student with a limited lunch budget')],
 [('Nimaga ahamiyat beradi?','What matters to them?'),('Psixografik belgi','Psychographic'),('Sog‘lom ovqatni afzal ko‘radi','Prefers healthy food')],
 [('Qanchalik tez-tez xarid qiladi?','How often do they buy?'),('Xulq-atvor belgisi','Behavioural'),('Haftada uch marta tayyor tushlik oladi','Buys prepared lunch three times a week')]])+
 p('Bir xil yoshdagi ikki talabaning ham ehtiyoji farq qilishi mumkin: biri arzon narxni, ikkinchisi tez xizmatni birinchi o‘ringa qo‘yadi.',
 'Even two students of the same age may have different needs: one prioritizes low price, the other quick service.'))

page('Avval kimga sotamiz?', 'Who should we sell to first?',
 p('Tushlikni talabaga ham, ofis xodimiga ham, sayyohga ham sotish mumkin. Lekin yangi ish boshlaganda bitta aniq guruhni tushunish osonroq.',
 'Lunch can be sold to students, office workers or tourists. When starting out, it is easier to understand one specific group.')+
 grid(card('1. Muammo bormi?','1. Is there a problem?','Talabaning tanaffusi qisqa, oshxonada navbat uzun. Tez ovqatlanishga ehtiyoj bo‘lishi mumkin.',
 'A student has a short break and faces long queues. They may need a faster way to get lunch.'),
 card('2. Ularga yeta olamizmi?','2. Can we reach them?','Universitetga yaqin ishlasak, tushlikni kelishilgan joyda topshirishimiz osonroq.',
 'Working near the university makes it easier to hand over lunch at an agreed place.'),
 card('3. Narx mos keladimi?','3. Does the price fit?','Mijozga qancha pul sarflash qulayligini so‘raymiz. Arzon narxda sotishning o‘zi yetmaydi — xarajat ham qoplanishi kerak.',
 'Ask what the customer can comfortably spend. A low price alone is not enough; costs must also be covered.'),
 card('4. Xizmatni bajara olamizmi?','4. Can we deliver?','Bir kunda nechta tushlikni sifatli tayyorlab, vaqtida topshira olishimizni bilamiz.',
 'Know how many lunches we can prepare well and hand over on time each day.')))

page('Mijoz portreti — persona', 'Customer profile — persona',
 box('<b>Persona — odatiy mijozning sodda tavsifi.</b> U kim, nimaga muhtoj va xaridda nimaga qaraydi? Haqiqiy portretni mijozlar bilan suhbat asosida tuzamiz.',
 '<b>A persona is a simple description of a typical customer.</b> Who are they, what do they need and what matters when buying? Build a real profile from customer conversations.')+
 grid(card('Misol: Dilnoza','Example: Dilnoza','O‘quv misolidagi Dilnoza — 2-kurs talabasi. Tanaffusi 30 daqiqa. U uzoq navbatda turmasdan, 25 000 so‘mgacha tushlik olishni xohlaydi.',
 'In this fictional example, Dilnoza is a second-year student with a 30-minute break. She wants lunch costing up to UZS 25,000 without a long queue.'),
 card('Sotuvchiga nima ma’lum bo‘ldi?','What did the seller learn?','Muhim narsalar: narx, vaqt va to‘yimli ovqat. Demak, taklif shu uch ehtiyojga mos bo‘lishi kerak.',
 'Important factors: price, time and a filling meal. The offer should address these three needs.'))+
 p('Bu misolni barcha talabalar haqida fakt deb qabul qilmaymiz. Boshqa talabalardan ham so‘rab, o‘xshash va farqli ehtiyojlarni bilib olamiz.',
 'Do not treat this example as a fact about every student. Ask other students to learn which needs are shared and which differ.'))

page('Odam mahsulotni nima uchun sotib oladi?', 'Why do people buy a product?',
 box('<b>Odam mahsulot orqali biror ehtiyojini qondirmoqchi bo‘ladi.</b> Tushlik — ochlikni qondiradi; tez xizmat — vaqtni tejaydi.',
 '<b>People buy products to meet a need.</b> Lunch satisfies hunger; fast service saves time.')+
 grid(card('Amaliy sabab','Practical reason','Talaba ovqatlanib, keyingi darsga vaqtida kirishni xohlaydi.',
 'A student wants to eat and reach the next class on time.'),
 card('His-tuyg‘u va atrofdagilar','Feelings and other people','U kechikishdan xavotir olmaslikni yoki do‘stlari bilan birga ovqatlanishni ham xohlashi mumkin.',
 'They may also want to avoid worrying about being late or enjoy eating with friends.'))+
 p('Bu yondashuv <b>JTBD — Jobs to Be Done</b>, ya’ni «mijoz mahsulot yordamida bajarmoqchi bo‘lgan ish» deb ataladi. Atamani yodlashdan ko‘ra, <b>«Mijoz qanday natija kutmoqda?»</b> degan savolni tushunish muhim.',
 'This approach is called <b>JTBD — Jobs to Be Done</b>: the job the customer wants a product to help with. Focus on understanding <b>“What outcome does the customer want?”</b> rather than memorizing the acronym.'))

page('Mijozdan qanday so‘raymiz?', 'How should we ask customers?',
 table(['Bunday so‘rash o‘rniga…','Bunday so‘rash foydaliroq'],['Instead of asking…','It is more useful to ask…'],[
 [('Bizning tushlikni olasizmi?','Would you buy our lunch?'),('Kecha qayerda tushlik qildingiz?','Where did you have lunch yesterday?')],
 [('Narximiz arzon, to‘g‘rimi?','Our price is low, right?'),('Oxirgi tushlikka qancha pul sarfladingiz?','How much did you spend on your last lunch?')],
 [('Sizga tez yetkazish kerakmi?','Do you need fast delivery?'),('Tushlik olayotganda nimasi qiyin bo‘ldi?','What was difficult about getting lunch?')]])+
 box('<b>Avval tinglang, keyin taklif qiling.</b> Odamning o‘tgan tajribasi haqidagi savol aniqroq javob beradi. Suhbatni boshlashdan oldin vaqt ajrata olishini so‘rang.',
 '<b>Listen first, then offer.</b> Asking about a past experience produces more specific answers. Ask whether the person has time before starting the conversation.')+
 p('«Yaxshi fikr ekan» degan javob hali buyurtma emas. Mijozning aytgani bilan amalda qilganini solishtiring.',
 '“That sounds like a good idea” is not an order. Compare what customers say with what they actually do.'))

page('Taxmin va dalilning farqi', 'The difference between a guess and evidence',
 grid(card('Taxmin — hali bilmaymiz','A guess — we do not know yet','«Menimcha, talabalar 25 000 so‘mlik tushlik oladi». Bu bizning fikrimiz; hali tekshirilmagan.',
 '“I think students will buy lunch for UZS 25,000.” This is our belief; it has not been checked.'),
 card('Dalil — ko‘rdik yoki tekshirdik','Evidence — we observed or checked','«Bugun 6 kishi shu narxda tushlik sotib oldi». Bu aynan bugungi sotuv haqida ma’lumot.',
 '“Today, 6 people bought lunch at that price.” This is information about today’s sales.'))+
 box('6 kishi sotib olgani <b>hamma talaba sotib oladi</b> degani emas. Boshqa kunlarda ham kuzatamiz va kimlar nima sababdan olmaganini so‘raymiz.',
 'Six purchases do <b>not mean every student will buy</b>. Observe on other days and ask why some people did not buy.')+
 p('Qaydga sana va ko‘rgan natijangizni yozing. Suhbatdoshning ruxsatisiz uning telefon raqamini yoki audio yozuvini tarqatmang.',
 'Record the date and what you observed. Do not share a participant’s phone number or recording without permission.'))

page('Mijozga qanday taklif beramiz?', 'What should we offer the customer?',
 box('<b>Qiymat taklifi — «Nega mijoz aynan bizdan olishi kerak?» degan savolga javob.</b> Mijozga qanday foyda berishingizni oddiy va aniq ayting.',
 '<b>A value proposition answers “Why should the customer buy from us?”</b> Explain the benefit simply and clearly.')+
 table(['Noaniq taklif','Aniqroq taklif'],['Vague offer','More specific offer'],[
 [('Bizning tushlik eng zo‘ri!','Our lunch is the best!'),('25 000 so‘mlik tushlik; tanaffus boshida universitet yonidagi kelishilgan joyda topshiramiz.','Lunch for UZS 25,000, handed over at an agreed place near the university at the start of the break.')]])+
 p('Bu taklifda uch narsa tushunarli: <b>nima beriladi, narxi qancha va qachon olinadi</b>. Mijoz tarkibi va porsiya hajmini ham bilishi kerak.',
 'Three things are clear: <b>what is offered, what it costs and when it is available</b>. Customers should also know the ingredients and portion size.')+
 p('Faqat bajara oladigan va’dani bering. Vaqtida topshirish imkoni bo‘lmasa, avval xizmatni to‘g‘rilang.',
 'Promise only what you can deliver. If you cannot hand it over on time, improve the service first.'))

page('TAM, SAM, SOM: uch xil savol', 'TAM, SAM, SOM: three different questions',
 grid(card('TAM — umumiy bozor','TAM — total market','<b>Total Addressable Market</b> — umumiy qamrab olinishi mumkin bo‘lgan bozor.<br>Oddiy savol: <b>«Belgilangan hududda bu mahsulot kimlarga kerak bo‘lishi mumkin?»</b>',
 '<b>Total Addressable Market</b> — the total relevant market.<br>Simple question: <b>“Who might need this product in the area we have defined?”</b>'),
 card('SAM — xizmatimiz yeta oladigan qism','SAM — the part our service can reach','<b>Serviceable Available Market</b> — xizmat ko‘rsatish mumkin bo‘lgan mavjud bozor.<br>Oddiy savol: <b>«Shulardan qaysilariga bizning joyimiz va xizmatimiz mos?»</b>',
 '<b>Serviceable Available Market</b> — the part we can serve.<br>Simple question: <b>“Which of those customers fit our location and service?”</b>'),
 card('SOM — amalda oladigan qismimiz','SOM — the part we can realistically win','<b>Serviceable Obtainable Market</b> — amalda egallash mumkin bo‘lgan bozor ulushi.<br>Oddiy savol: <b>«Hozir nechta mijozni jalb qilib, ularga xizmat bera olamiz?»</b>',
 '<b>Serviceable Obtainable Market</b> — the share we can realistically win.<br>Simple question: <b>“How many customers can we attract and serve now?”</b>'),
 card('Esda saqlash oson','An easy way to remember','<b>Hammasi → bizga mos qismi → biz oladigan qism.</b> Uchalasida ham bir xil hudud va davrni nazarda tuting.',
 '<b>The whole → the suitable part → the part we win.</b> Use the same area and time period for all three.')))

page('Bozor hajmi: 100 → 40 → 10', 'Market size: 100 → 40 → 10',
 p('<b>Shartli misol:</b> bir kunlik tushlik bozori. Har bir odam shu kuni bittadan tushlik olishi mumkin deb olaylik.',
 '<b>Hypothetical example:</b> lunch demand for one day. Assume each person may buy one lunch that day.')+
 table(['Atama','Oddiy misol','Mijoz soni'],['Term','Simple example','Customer count'],[
 [('TAM','TAM'),('Belgilangan kichik hududda tushlik olishi mumkin bo‘lganlar','People who might buy lunch in our defined small area'),('100 kishi','100 people')],
 [('SAM','SAM'),('Ulardan universitet yonidagi joyimiz va taklifimiz mos keladiganlar','Those for whom our university-side location and offer are suitable'),('40 kishi','40 people')],
 [('SOM','SOM'),('Birinchi kuni jalb etishni rejalagan va xizmat bera oladiganlar','Customers we plan to attract and serve on the first day'),('10 kishi','10 people')]])+
 box('<b>10 ta tushlik × 25 000 so‘m = 250 000 so‘m tushum.</b> Tushum — sotuvdan kelgan jami pul. Bu foyda emas: ovqat, qadoq va boshqa xarajatlar hali ayrilmagan.',
 '<b>10 lunches × UZS 25,000 = UZS 250,000 revenue.</b> Revenue is the total money from sales. It is not profit: food, packaging and other costs have not been deducted.')+
 p('10 mijoz — reja, kafolat emas. Uni suhbat, kichik sotuv va ish imkoniyatimizga qarab tekshiramiz. Bir kunda 10 porsiya tayyorlasak, 40 kishiga birdan va’da bermaymiz.',
 'Ten customers is a plan, not a guarantee. Check it through conversations, small sales and our ability to deliver. If we can prepare 10 portions a day, do not promise 40.'))

page('Taklifni ko‘rganlarning hammasi xarid qiladimi?', 'Does everyone who sees an offer buy?',
 box('<b>Misol:</b> 100 kishi e’lonni ko‘rdi → 20 kishi narxini so‘radi → 5 kishi tushlik oldi. Taklifni ko‘rgan odam bilan haqiqiy xaridor bir xil narsa emas.',
 '<b>Example:</b> 100 people saw an advert → 20 asked the price → 5 bought lunch. Someone who sees an offer is not necessarily a buyer.')+
 p('Buni <b>sotuv voronkasi</b> deyishadi: har bosqichda odamlar soni kamayishi mumkin. <b>Konversiya</b> — ko‘rganlarning qancha qismi xarid qilganini ko‘rsatadi: 5 ÷ 100 × 100 = <b>5%</b>.',
 'This is called a <b>sales funnel</b>: the number of people may decrease at each step. <b>Conversion</b> tells us what share of viewers bought: 5 ÷ 100 × 100 = <b>5%</b>.')+
 grid(card('Nega xarid qilmasligi mumkin?','Why might someone not buy?','Narx mos emas, vaqti to‘g‘ri kelmadi, ovqat yoqmadi yoki mijoz hali ishonmadi. Sababni so‘rab bilamiz.',
 'The price may not fit, timing may be wrong, the food may not appeal or the person may not yet trust us. Ask to find out.'),
 card('Qayta xarid nima?','What is a repeat purchase?','5 xaridordan 2 tasi ertasi kuni yana oldi. Bu — qayta xarid. Ular yangi odamlar emas, oldingi mijozlarimiz.',
 'Two of the 5 buyers buy again the next day. These are repeat purchases. They are existing customers, not new people.')))

page('Avval oz miqdorda sinab ko‘ramiz', 'Try a small amount first',
 grid(card('1. Aniq taklif','1. A clear offer','Menyu, porsiya, narx va olish vaqtini aytamiz. Mijoz nimaga pul to‘lashini bilsin.',
 'State the menu, portion, price and pickup time so customers know what they are paying for.'),
 card('2. Kichik miqdor','2. A small quantity','Darrov 100 porsiya emas, masalan, buyurtmaga qarab 10 porsiyagacha tayyorlaymiz. Sotishdan oldin oziq-ovqat xavfsizligi va tegishli talablarni tekshiramiz.',
 'Instead of immediately making 100 portions, prepare up to 10 based on orders. Check food safety and applicable requirements before selling.'),
 card('3. Natijani yozish','3. Record the result','Nechta sotildi? Vaqtida berildimi? Nima yoqdi, nima yoqmadi? Qancha xarajat bo‘ldi?',
 'How many sold? Were they handed over on time? What did customers like or dislike? What did it cost?'),
 card('4. Yaxshilash','4. Improve','Mijoz fikri va xarajatni ko‘rib, porsiya, narx yoki vaqtni o‘zgartiramiz. Natija yaxshi bo‘lsa, asta ko‘paytiramiz.',
 'Use customer feedback and costs to adjust portions, price or timing. Expand gradually if results are good.'))+
 p('Maqsad — katta pul sarflashdan oldin odamlarga taklifimiz kerakligini tushunish.',
 'The aim is to understand whether people need the offer before spending a lot of money.'))

page('Ko‘p uchraydigan xatolar', 'Common mistakes',
 table(['Xato fikr','To‘g‘riroq yondashuv'],['Mistaken belief','Better approach'],[
 [('Hamma mening mijozim','Everyone is my customer'),('Avval bitta aniq mijozlar guruhini tanlayman','Start with one specific customer group')],
 [('Menga yoqdi, hammaga yoqadi','I like it, so everyone will'),('Mijozdan so‘rayman va kichik miqdorda sinayman','Ask customers and try a small amount')],
 [('E’lonni ko‘rdi — demak xaridor','They saw the advert, so they are a buyer'),('Qiziqish va haqiqiy xaridni alohida sanayman','Count interest and actual purchases separately')],
 [('Tushgan pulning hammasi foyda','All money received is profit'),('Tushumdan xarajatlarni ayirish kerak','Costs must be deducted from revenue')],
 [('Ko‘proq va’da bersam, yaxshi sotiladi','More promises mean more sales'),('Faqat bajara oladigan va’dani beraman','Promise only what can be delivered')]])+
 box('<b>Oddiy qoida:</b> mijozni tinglang → unga mos taklif bering → oz miqdorda sinang → natijaga qarab yaxshilang.',
 '<b>Simple rule:</b> listen to the customer → make a suitable offer → try a small amount → improve based on results.'))

video='https://www.youtube.com/watch?v=z4hmIU-PiR0'
page('Video va tekshiriladigan manbalar', 'Video and reference sources',
 '<style>.lesson-video{width:100%;max-width:820px;margin:16px auto;aspect-ratio:16/9}.lesson-video iframe{display:block;width:100%;height:100%;border:0;border-radius:14px}@media print{.lesson-video{display:none!important}}</style>'+
 '<div class="lesson-video"><iframe src="https://www.youtube-nocookie.com/embed/z4hmIU-PiR0?rel=0" title="7-dars: video / Lesson 7: video" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>'+
 '<a class="card" style="display:block;color:inherit;text-decoration:none" href="'+video+'" target="_blank" rel="noopener noreferrer">'+
 f'<h3 {d("▶ Mavzuga oid video dars / Video lesson","▶ Mavzuga oid video dars / Video lesson")}>▶ Mavzuga oid video dars / Video lesson</h3>'+
 p('Videoni yuqoridagi pleyerda tomosha qiling. Pleyer ochilmasa, shu havola orqali YouTube’da ko‘ring. Ko‘rgach, quyidagi savollarni muhokama qiling.',
 'Watch in the player above. If the player is unavailable, use this link to watch on YouTube. Afterwards, discuss the questions below.')+'</a>'+
 p('<b>Ko‘rish vazifasi:</b> Mijoz haqida esda qolgan ikkita fikrni yozib oling. Ularni tushlik xizmati misoli bilan bog‘lab ko‘ring.',
 '<b>Viewing task:</b> Note two ideas about customers that you remember. Relate them to the lunch-service example.')+
 '<ul><li><a href="https://www.strategyzer.com/library/the-value-proposition-canvas" target="_blank" rel="noopener noreferrer">Strategyzer — Value Proposition Canvas</a></li><li><a href="https://www.strategyzer.com/books/testing-business-ideas" target="_blank" rel="noopener noreferrer">Bland &amp; Osterwalder — Testing Business Ideas (2019)</a></li><li><a href="https://www.momtestbook.com/" target="_blank" rel="noopener noreferrer">Rob Fitzpatrick — The Mom Test (2013)</a></li><li><a href="https://stat.uz/" target="_blank" rel="noopener noreferrer">O‘zbekiston rasmiy statistikasi / Official statistics of Uzbekistan</a></li></ul>'+
 p('Manbalar tushuncha va tadqiqot usullarini chuqurlashtirish uchun. Darsdagi sonlar ulardan olingan statistik ma’lumot emas. Video ochilmasa, 8-slayddagi savollar bilan mashqni davom ettiring.',
 'Sources extend the concepts and research methods. The figures in this lesson are not statistics taken from these sources. If the video is unavailable, use the interview questions on slide 8.'))

page('Xulosa: esda qoladigan 5 fikr', 'Summary: five things to remember',
 grid(card('1. Mijozni aniq biling','1. Know your customer','Kimga sotishingizni ayta oling. «Hamma uchun» degan javob o‘rniga aniq guruhni tanlang.',
 'Be able to say who you sell to. Choose a specific group instead of saying “everyone”.'),
 card('2. Ehtiyojni tushuning','2. Understand the need','Mijoz nimani xohlayapti: arzon narxmi, tezlikmi, qulaylikmi? Javobni uning o‘zidan bilib oling.',
 'What does the customer want: a low price, speed or convenience? Find out from the customer.'),
 card('3. Sodda va aniq taklif bering','3. Make a clear, simple offer','Mahsulot nima, qancha turadi va qachon olinadi — tushunarli bo‘lsin.',
 'Make clear what the product is, what it costs and when it is available.'),
 card('4. Hisobni farqlang','4. Distinguish the numbers','Bozorning hammasi sizning mijozingiz emas. Sotuvdan kelgan jami pul ham foyda emas.',
 'The entire market is not your customer base. Total sales revenue is not profit.'))+
 box('<b>5. Avval kichik sinov.</b> Natijani ko‘rib keyin kengaying. <b>O‘zingizni tekshiring:</b> yaqin do‘kon yoki oshxonaning mijozlari kim va ular nega aynan shu yerdan xarid qiladi?',
 '<b>5. Start small.</b> Look at results before expanding. <b>Check your understanding:</b> who buys from a nearby shop or canteen, and why do they choose it?'))

# Keep the existing multiple-choice engine and its DOM contract.
page('Bilimni tekshirish · 15 savol', 'Check your understanding · 15 questions',
 '<div class="scorebar"><span><span data-ui="score">Natija:</span> <b><span id="scoreNow">0</span> / <span id="scoreMax">15</span></b></span><span><span data-ui="answered">Javob berildi:</span> <b id="answered">0</b></span><div class="spacer"></div>'+f'<button class="btn warn" id="btnReset" {d("↻ Testni qayta boshlash","↻ Restart quiz")}>↻ Testni qayta boshlash</button></div><div id="testWrap"></div><div class="result" id="result"><div class="pct" id="pct">0%</div><h3 id="resTitle" {d("Natija","Result")}>Natija</h3><p id="resTxt"></p></div>'+
 p('Har javobdan so‘ng izohni o‘qing. Xato bo‘lgan savolning slaydiga qaytib, hisob yoki dalilni tushuntiring.',
 'Read the explanation after each answer. Return to the relevant slide and explain the calculation or evidence behind any mistake.'))

Q=[]
def quiz(q,qe,a,ae,c,e,ee): Q.append(dict(q=q,qe=qe,a=a,ae=ae,c=c,e=e,ee=ee))
quiz('Ona bola bilan sumka tanladi va pulini to‘ladi. Sumkani bola ishlatadi. Rollar qaysi javobda to‘g‘ri ajratilgan?',
 'A mother chooses a schoolbag with her child and pays for it. The child uses it. Which allocation of roles is correct?',
 ['Ona — foydalanuvchi; bola — to‘lovchi; ikkalasi — qaror egasi',
 'Bola — foydalanuvchi; ona — to‘lovchi; ikkalasi — qaror egasi',
 'Bola — foydalanuvchi; ikkalasi — to‘lovchi; ona — qaror egasi',
 'Ikkalasi — foydalanuvchi; bola — to‘lovchi; ona — qaror egasi'],
 ['Mother: user; child: payer; both: decision makers',
 'Child: user; mother: payer; both: decision makers',
 'Child: user; both: payers; mother: decision maker',
 'Both: users; child: payer; mother: decision maker'],1,
 '3-slayd: foydalanuvchi sumkani ishlatadi, to‘lovchi pul beradi, qaror egasi tanlaydi. Bu holatda tanlov birgalikda qilingan.',
 'Slide 3: the user uses the bag, the payer pays, and the decision maker chooses. Here the choice was made together.')
quiz('Sotuvchi mijozlarni to‘rt guruhga ajratdi. Qaysi guruh xarid odatiga, ya’ni xulq-atvor belgisiga asoslangan?',
 'A seller divides customers into four groups. Which group is based on buying behaviour?',
 ['Universitetdan bir kilometr masofada yashaydiganlar',
 'Bir xil yosh va o‘xshash daromadga ega bo‘lganlar',
 'Haftada uch marta tayyor tushlik sotib oladiganlar',
 'Ovqat tanlashda sog‘lom hayotni muhim deb biladiganlar'],
 ['People living within one kilometre of the university',
 'People of the same age with similar incomes',
 'People buying prepared lunch three times a week',
 'People who value healthy living when choosing food'],2,
 '4-slayd: xaridning qanchalik tez-tez takrorlanishi xulq-atvor belgisidir. Masofa — geografik, yosh va daromad — demografik, qadriyat — psixografik belgi.',
 'Slide 4: purchase frequency is behavioural. Distance is geographic, age and income are demographic, and values are psychographic.')
quiz('Talabalar tez tushlik istaydi va ularga yetib borish oson. Lekin ular ma’qul ko‘rgan narx sotuvchining xarajatini qoplamaydi. Eng asosli keyingi qadam qaysi?',
 'Students want fast lunch and are easy to reach. However, their preferred price does not cover the seller’s costs. What is the best next step?',
 ['Ehtiyoj kuchli bo‘lgani uchun shu narxda sotuvni ko‘paytirish',
 'Yetib borish osonligi uchun xarajatni keyinroq hisoblash',
 'Narxni saqlab, yangi mijoz kelishini kutib ishlash',
 'Taklif va xarajatni qayta ko‘rib, keyin kichik sinash'],
 ['Increase sales at that price because the need is strong',
 'Calculate costs later because customers are easy to reach',
 'Keep the price and operate while waiting for new customers',
 'Review the offer and costs, then test on a small scale'],3,
 '5-slayd: ehtiyoj va yetib borishning o‘zi yetarli emas; narx xarajatni ham qoplashi kerak. Taklifni shu shartga moslash lozim.',
 'Slide 5: need and reach alone are insufficient; the price must also cover costs. Adapt the offer accordingly.')
quiz('Sotuvchi Dilnoza haqidagi o‘quv misolini o‘qib, «Barcha talabalar 25 000 so‘mlik tushlik xohlaydi», dedi. Persona haqidagi tushunchaga mos javob qaysi?',
 'After reading the fictional Dilnoza example, a seller says, “All students want lunch for UZS 25,000.” Which response fits the lesson on personas?',
 ['Bu portretni taxmin sifatida olib, boshqa talabalar bilan ham suhbatlashish kerak',
 'Bitta portret barcha talabalarni ifodalaydi, shu narxni umumiy qo‘llash kerak',
 'Talabalar bir joyda o‘qigani uchun ularning ehtiyojini bir xil olish kerak',
 'Portretda aniq narx borligi uchun uni haqiqiy sotuv dalili deb olish kerak'],
 ['Treat the profile as an assumption and also interview other students',
 'One profile represents all students, so use that price for everyone',
 'Students study in one place, so treat their needs as identical',
 'The profile states a price, so treat it as evidence of actual sales'],0,
 '6-slayd: Dilnoza — shartli misol. Haqiqiy persona suhbatlarga tayanadi; bir odamning ehtiyojini hammaga ko‘chirish mumkin emas.',
 'Slide 6: Dilnoza is a fictional example. A real persona relies on conversations; one person’s needs cannot be applied to everyone.')
quiz('Talaba «Menga shunchaki tushlik emas, navbatsiz ovqatlanib darsga vaqtida kirish muhim», dedi. JTBD yondashuvida asosiy e’tibor nimaga qaratiladi?',
 'A student says, “I need more than lunch: I want to eat without queuing and reach class on time.” What does the JTBD approach focus on?',
 ['Sotuvchi tayyorlaydigan porsiyalar soniga',
 'Mijoz mahsulot orqali kutayotgan natijaga',
 'Taklifni ko‘rgan barcha odamlar soniga',
 'Tushlik sotiladigan joyning bezagiga'],
 ['The number of portions the seller prepares',
 'The outcome the customer wants from the product',
 'The number of people who see the offer',
 'The decoration of the place selling lunch'],1,
 '7-slayd: JTBD — Jobs to Be Done. Bu misolda mijozning vazifasi ovqatlanish bilan birga vaqtni tejash va darsga kechikmaslikdir.',
 'Slide 7: JTBD means Jobs to Be Done. Here the customer wants to eat, save time and avoid being late for class.')
quiz('Tushlik narxi mijozga mosligini bilmoqchisiz. Qaysi savol uni ma’lum javobga undamasdan, avvalgi xaridi haqida dalil olishga yordam beradi?',
 'You want to learn whether a lunch price fits a customer. Which question seeks evidence from a past purchase without leading the answer?',
 ['Bizning 25 000 so‘mlik tushligimiz sizga arzon, shundaymi?',
 'Agar narxni tushirsak, keyingi safar albatta olasizmi?',
 'Do‘stlaringiz ham bizning narximizni ma’qullaydimi?',
 'Oxirgi tushlikka qancha sarfladingiz va uni nega tanladingiz?'],
 ['Our lunch at UZS 25,000 is cheap for you, right?',
 'If we lower the price, will you definitely buy next time?',
 'Would your friends also approve of our price?',
 'How much did your last lunch cost, and why did you choose it?'],3,
 '8-slayd: aniq o‘tgan xaridni so‘rash mijozning amaldagi tanlovini ochadi. Qolgan savollar yo javobni yo‘naltiradi, yo kelajak haqidagi taxminni so‘raydi.',
 'Slide 8: a specific past purchase reveals actual choices. The other questions either lead the answer or ask for speculation about the future.')
quiz('Sotuvchi «Talabalar bizdan oladi», deb o‘yladi. Bugun 6 kishi uning tushligini sotib oldi. Qaysi xulosa to‘g‘ri?',
 'A seller expected students to buy. Today, six people bought the lunch. Which conclusion is justified?',
 ['Bugungi 6 xarid — dalil; barcha talabalar olishi esa hali tasdiqlanmagan',
 'Bugungi 6 xarid — dalil; endi qolgan talabalar ham olishi tasdiqlangan',
 'Bugungi 6 xarid — taxmin; faqat mijozning maqtovi dalil hisoblanadi',
 'Bugungi 6 xarid — kafolat; keyingi kun ham shuncha sotilishi aniq'],
 ['Today’s six purchases are evidence; purchases by all students remain unproven',
 'Today’s six purchases prove that the remaining students will also buy',
 'Today’s six purchases are a guess; only customer praise counts as evidence',
 'Today’s six purchases guarantee the same sales on the next day'],0,
 '9-slayd: dalil aynan kuzatilgan natijaga tegishli. Kichik sotuv natijasini butun bozorga yoki keyingi kunga kafolat qilib bo‘lmaydi.',
 'Slide 9: evidence concerns what was observed. A small sales result does not guarantee the entire market or the next day’s sales.')
quiz('Mijoz uchun mahsulot, narx va olish vaqti aniq bo‘lishi kerak. Qaysi taklif uchalasini ham tushuntiradi?',
 'A customer needs to know the product, price and pickup time. Which offer explains all three?',
 ['Talabalar uchun issiq tushlik — arzon narxda, qulay joyda',
 '25 000 so‘mlik tushlik — universitet yonida, yaxshi xizmat bilan',
 '25 000 so‘mlik tushlik — tanaffus boshida, kelishilgan joyda',
 'Tanaffus boshida tayyor tushlik — yaxshi narx va sifat bilan'],
 ['Hot lunch for students, at a low price in a convenient place',
 'Lunch for UZS 25,000 near the university, with good service',
 'Lunch for UZS 25,000 at the start of the break, at an agreed place',
 'Prepared lunch at the start of the break, with good price and quality'],2,
 '10-slayd: aniq taklif nima berilishi, qancha turishi va qachon olinishini aytadi. «Arzon» yoki «yaxshi» so‘zlari aniq narx va vaqtni almashtirmaydi.',
 'Slide 10: a clear offer states what is provided, its price and when it is available. “Cheap” or “good” does not replace a specific price or time.')
quiz('Bir kunlik misolda hududda 100 ehtimoliy xaridor bor, 40 kishiga xizmatimiz mos. Birinchi kuni 10 mijozni jalb etib xizmat berishni rejaladik. TAM, SAM, SOM qaysi tartibda?',
 'In the one-day example, the area has 100 potential buyers; the service suits 40. We plan to attract and serve 10 on day one. Which order correctly gives TAM, SAM and SOM?',
 ['TAM — 40; SAM — 100; SOM — 10',
 'TAM — 100; SAM — 40; SOM — 10',
 'TAM — 100; SAM — 10; SOM — 40',
 'TAM — 10; SAM — 40; SOM — 100'],
 ['TAM: 40; SAM: 100; SOM: 10',
 'TAM: 100; SAM: 40; SOM: 10',
 'TAM: 100; SAM: 10; SOM: 40',
 'TAM: 10; SAM: 40; SOM: 100'],1,
 '11–12-slaydlar: TAM — umumiy bozor, SAM — xizmatimiz mos qism, SOM — amalda jalb etib xizmat bera oladigan qism. Davr bir xil — bir kun.',
 'Slides 11–12: TAM is the total market, SAM is the suitable part, and SOM is the part we can realistically attract and serve. The period is one day throughout.')
quiz('Serviceable Available Market — SAM 40 kishi. Sotuvchi bir kunda 10 porsiya tayyorlay oladi. Faqat shu ma’lumotdan qaysi qaror asosli?',
 'SAM — Serviceable Available Market — contains 40 people. The seller can prepare 10 portions a day. Which decision follows from this information alone?',
 ['SAM 40 bo‘lgani uchun 40 ta buyurtmani kafolatlash',
 'Quvvat 10 bo‘lgani uchun SAMni avtomatik 10 ga tenglash',
 'Quvvat 10 bo‘lgani uchun 10 ta sotuvni aniq deb olish',
 '10 porsiyadan ortiq va’da bermay, haqiqiy talabni tekshirish'],
 ['Guarantee 40 orders because SAM is 40',
 'Automatically set SAM to 10 because capacity is 10',
 'Assume exactly 10 sales because capacity is 10',
 'Promise no more than 10 portions and check actual demand'],3,
 '12-slayd: xizmat mos keladigan mijozlar soni, tayyorlash imkoniyati va haqiqiy sotuv bir xil emas. 10 porsiyalik quvvat 10 xaridni kafolatlamaydi.',
 'Slide 12: suitable customer count, production capacity and actual sales are different. Capacity for ten portions does not guarantee ten purchases.')
quiz('Taqdimotdagi 10 ta tushlikning har biri 25 000 so‘mdan sotildi. Qaysi hisob va izoh birgalikda to‘g‘ri?',
 'The lesson’s ten lunches sell for UZS 25,000 each. Which calculation and explanation are both correct?',
 ['250 000 so‘m tushum; foydani bilish uchun xarajatlarni ayirish kerak',
 '250 000 so‘m sof foyda; sotilgan ovqat xarajati endi hisoblanmaydi',
 '25 000 so‘m tushum; xaridorlar soni hisobga qo‘shilmaydi',
 '250 000 so‘m xarajat; sotuvdan kelgan pul keyin hisoblanadi'],
 ['UZS 250,000 revenue; deduct costs to determine profit',
 'UZS 250,000 net profit; sold food costs no longer count',
 'UZS 25,000 revenue; buyer count is not included',
 'UZS 250,000 costs; money from sales is counted later'],0,
 '12-slayd: 10 × 25 000 = 250 000 so‘m — tushum. Ovqat, qadoq va boshqa xarajatlar ayirilmaguncha uni foyda deyish noto‘g‘ri.',
 'Slide 12: 10 × 25,000 = UZS 250,000 revenue. Calling it profit before deducting food, packaging and other costs is incorrect.')
quiz('Sotuvchi «Bugun 250 000 so‘m tushdi, demak shuncha foyda qildim», dedi. Uning xulosasini tekshirish uchun eng zarur ma’lumot qaysi?',
 'A seller says, “I received UZS 250,000 today, so that is my profit.” Which information is most necessary to check the claim?',
 ['E’lonni jami necha kishi ko‘rgani',
 'Mijozlarning qaysi kursda o‘qishi',
 'Shu sotuvga tegishli jami xarajatlar',
 'Boshqa sotuvchining mahsulot nomi'],
 ['How many people saw the advert',
 'Which year the customers study in',
 'Total costs attributable to those sales',
 'Another seller’s product name'],2,
 '12 va 15-slaydlar: tushumdan xarajatlar ayriladi. Tushumning o‘zi qancha foyda qolganini ko‘rsatmaydi.',
 'Slides 12 and 15: costs must be deducted from revenue. Revenue alone does not show how much profit remains.')
quiz('E’lonni 100 kishi ko‘rdi, 20 kishi narx so‘radi, 5 kishi xarid qildi. E’lonni ko‘rganlarning xaridga aylanish ulushi qancha?',
 '100 people saw the advert, 20 asked the price and 5 purchased. What share of advert viewers became buyers?',
 ['20% — narx so‘ragan 20 kishini 100 ga bo‘lamiz',
 '5% — xarid qilgan 5 kishini 100 ga bo‘lamiz',
 '25% — xarid qilgan 5 kishini 20 ga bo‘lamiz',
 '100% — e’lonni ko‘rganlar ham xaridor hisoblanadi'],
 ['20%: divide the 20 price enquiries by 100',
 '5%: divide the 5 purchasers by 100',
 '25%: divide the 5 purchasers by 20',
 '100%: everyone viewing the advert counts as a buyer'],1,
 '13-slayd: savolda asos — e’lonni ko‘rgan 100 kishi. 5 ÷ 100 × 100 = 5%. 5 ÷ 20 esa boshqa bosqichning ulushini beradi.',
 'Slide 13: the denominator requested is the 100 advert viewers. 5 ÷ 100 × 100 = 5%. Dividing 5 by 20 measures a different stage.')
quiz('Dushanba kuni 5 xil odam bittadan tushlik oldi. Seshanba kuni ulardan 2 tasi yana bittadan oldi; yangi xaridor kelmadi. Ikki kunda natija qanday?',
 'On Monday, five different people each buy one lunch. On Tuesday, two of them each buy one more; no new buyers arrive. What are the two-day totals?',
 ['7 xil mijoz va 7 ta buyurtma',
 '5 xil mijoz va 5 ta buyurtma',
 '2 xil mijoz va 7 ta buyurtma',
 '5 xil mijoz va 7 ta buyurtma'],
 ['7 different customers and 7 orders',
 '5 different customers and 5 orders',
 '2 different customers and 7 orders',
 '5 different customers and 7 orders'],3,
 '13-slayd: qayta xarid qilgan odam yangi mijoz bo‘lib qolmaydi. Mijozlar soni 5, buyurtmalar esa 5 + 2 = 7 ta.',
 'Slide 13: a repeat buyer is not a new customer. There are still five customers, but 5 + 2 = 7 orders.')
quiz('Kichik sinovda taklifni ko‘rganlar ko‘p, lekin xarid kam bo‘ldi. Taqdimotdagi yondashuv bo‘yicha eng asosli keyingi qadam qaysi?',
 'In a small trial, many people saw the offer but few bought. According to the lesson, what is the best next step?',
 ['Xarid qilmaganlar sababini so‘rab, taklif va xarajatni ko‘rib, qayta sinash',
 'Ko‘rganlar soniga tayanib, darhol ko‘proq porsiya ishlab chiqarish',
 'Xarajatni tekshirmasdan narxni keskin tushirib, katta sotuv boshlash',
 'Kam sotuvga tayanib, boshqa tekshiruvsiz hamma talab yo‘q deb hisoblash'],
 ['Ask non-buyers why, review the offer and costs, then test again',
 'Use viewer count to immediately produce many more portions',
 'Cut the price sharply and expand without checking costs',
 'Conclude there is no demand anywhere without further checks'],0,
 '13–15-slaydlar: ko‘rish xarid emas. Narx, vaqt, mahsulot yoki ishonch sabab bo‘lishi mumkin. Sababni bilib, kichik sinov orqali yaxshilash kerak.',
 'Slides 13–15: viewing is not buying. Price, timing, product or trust may matter. Find the reason and improve through another small trial.')
