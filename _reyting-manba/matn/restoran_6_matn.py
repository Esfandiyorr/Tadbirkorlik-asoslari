# -*- coding: utf-8 -*-
"""R6 · Xalqaro mezonlar va xizmat uslublari. Qiyosiy o'quv mashqi."""
exec(open(MATN_DIR + "restoran_davom.py", encoding="utf-8").read())

lesson_cover(6, "Xalqaro mezonlar va xizmat uslublari",
    "WorldSkills · Codex · ISO 22000 · tarelkada, umumiy lagandan, bufet va banket xizmati · "
    "<b>bir menyu — ikki servis rejasi</b> · xalqaro qoidalarni to'g'ri qiyoslash.",
    "1 soat nazariya · 1 soat amaliyot", 18, 15)
goals([
    ("Mezonni amalda ko'rsatadi", "Tashkiliy tayyorgarlik, aniq muloqot, gigiyena va uzatishni kuzatiladigan harakatga aylantiradi."),
    ("Manbalarni farqlaydi", "Kasbiy musobaqa mezoni, gigiyena qo'llanmasi, boshqaruv standarti va qonunni ajratadi."),
    ("Uslubni tanlaydi", "Menyu, mehmon soni, jihoz va xavfsizlikka mos xizmat turini asoslaydi."),
    ("Ikki reja tuzadi", "Individual xizmat va bufet uchun yo'nalish, anjom, allergen axboroti va navbatni belgilaydi.")],
    ["WorldSkills", "Codex", "ISO 22000", "SOP", "bufet", "banket", "yordamchi aravacha"])

page("To'rtta manba — to'rtta vazifa", table(["Manba", "Nimani beradi?", "Nimani anglatmaydi?"], [
    ["WorldSkills Restaurant Service", "Kasbiy mahorat: tashkilotchilik, mehmon bilan aloqa, menyu, xizmat harakati", "Har bir restoranga bir xil majburiy qonun emas"],
    ["Codex CXC 1-1969 va CXC 80-2020", "Gigiyena tamoyillari va allergen boshqaruvi bo'yicha xalqaro amaliy asos", "O'z-o'zidan mahalliy qonun yoki sertifikat emas"],
    ["ISO 22000", "Oziq-ovqat xavfsizligini boshqarish tizimi: xavfni nazorat, aloqa va takomillashtirish", "Ofitsiantning bitta harakati yoki har bir taom xavfsizligiga alohida kafolat emas"],
    ["Mahalliy talab va restoran SOPi", "Ish joyidagi amaldagi talab va yozma ish tartibi", "Qonunga zid ichki qoida qo'llashga ruxsat emas"]]))

page("Kasbiy mezon: kuzatiladigan harakat", table(["Mezon", "Amaliy dalil"], [
    ["Ishni tashkil qilish", "Mise en place, toza servis stansiyasi, vazifalar taqsimoti"],
    ["Mehmon bilan muloqot", "Tilni aniqlash, buyurtmani tasdiqlash, vaqtni tushuntirish"],
    ["Menyu bilimi", "Tarkib, porsiya, narx va tekshirilgan allergen axboroti"],
    ["Texnik xizmat", "Menyuga mos kuvert, muvozanatli patnis, xavfsiz uzatish"],
    ["Muammoni hal qilish", "Noaniqlikda to'xtash, mas'ulga yetkazish, qayd va yakuniy tekshiruv"]]) +
    quote("Bu kursdagi kuzatuv varag'i — o'quv vositasi. WorldSkills rasmiy musobaqa ballari yoki sertifikati deb taqdim etilmaydi."))

page("Codex tamoyili: oldini olish", grid(2,
    card("green", "🧼", "Gigiyena tayanchi", "R2: qo'l, forma, toza/ishlatilgan oqim va xavfsiz idish. Xodim kasallik haqida smenagacha xabar beradi."),
    card("blue", "🥜", "Allergen boshqaruvi", "R5: ishonchli tarkib, retsept o'zgarishi, anjomlarni ajratish va zal–oshxona aloqasi."),
    card("orange", "🌡", "Vaqt va harorat", "Bufetda mas'ulning tasdiqlangan saqlash chegarasi va nazorat jadvali qo'llanadi; xodim o'zicha raqam tanlamaydi."),
    card("violet", "📋", "Og'ish va tuzatish", "Mezondan chiqish bo'lsa taomni ajrating, uzatishni to'xtating, mas'ulga bildiring va qarorni qayd eting.")))

page("ISO 22000: tizimda o'z o'rnimiz", defn("Xavfsizlik — bitta xodim xotirasiga bog'liq bo'lmasligi kerak. "
    "Yozma tartib, javobgar shaxs, qayd va tekshiruv birgalikda ishlaydi.") +
    table(["Qadam", "Zal xodimining hissasi"], [
        ["Rejalash", "Smenada allergenlar, stop-list, oqim va mas'ullarni bilish"],
        ["Bajarish", "Tasdiqlangan tartib bilan buyurtma va uzatish"],
        ["Tekshirish", "Chipta, taom va mehmon so'rovi mosligini tekshirish"],
        ["Yaxshilash", "Xato sababini qayd etish; brifingda tartibni yangilash"]]) +
    quote("Sertifikat borligini faqat vakolatli mas'ul va amaldagi hujjat tasdiqlaydi. «ISO bor, demak allergen tekshiruvi kerak emas» — xato."))

page("Tarelkada va umumiy lagandan xizmat", grid(2,
    card_ul("green", "🍽️", "Individual tarelka", ["Taom oshxonada porsiyalanadi; stol va o'rin bilan chiqadi", "R3dagi ochiq qo'l va xavfsiz yo'nalish qo'llanadi", "Har bir maxsus buyurtma alohida aniqlanadi", "Barqaror porsiya va tez tekshiruv; bir vaqtda uzatish jamoa aloqasini talab qiladi"]),
    card_ul("blue", "🥘", "Umumiy lagan", ["Bir nechta mehmon uchun bitta idish; ulashish tartibi kelishiladi", "Har laganga alohida xizmat anjomi", "Ofitsiant porsiyalasa, ochiq va xavfsiz tomondan ishlaydi", "Allergen so'rovi bo'lgan mehmon uchun tekshirilgan alohida porsiya kerak bo'lishi mumkin"])) +
    quote("Tomon tanlovi joylashuv va korxona standartiga bog'liq. Hech qachon mehmon ustidan cho'zilmang yoki issiq idishni xavfli olib o'tmang."))

page("Bufet: mehmon oqimini boshqarish", grid(2,
    card_ul("green", "➡️", "Joylashuv", ["Kirish → toza tarelka → taomlar → ichimlik → chiqish", "Qaytgan iflos idish yo'li toza oqimga kirmaydi", "Aravacha va bolali mehmon uchun o'tish joyi ochiq", "Ichimlik stansiyasini tiqilinch hosil qilmaydigan joyga ajrating"]),
    card_ul("orange", "🔎", "Nazorat", ["Har taomga nom va ishonchli allergen axboroti", "Har idishda o'z qisqichi; tushgani darhol almashtiriladi", "Eski qoldiqqa yangi taomni aralashtirmang; restoran almashtirish tartibini bajaring", "Saqlash muddati/harorati va mas'ulning tekshiruvi qayd qilinadi"])))

page("Banket: bir vaqtdagi xizmat", defn("Banket — mehmonlar bir reja va jadval asosida xizmat oladigan tadbir. "
    "Mehmonlar soni, menyu va maxsus porsiyalar oldindan tasdiqlanadi.") +
    table(["Oldindan", "Xizmat paytida"], [
        ["Stol sxemasi, o'rin va bo'limlar", "Qaysi stolga kim chiqishini sardor tasdiqlaydi"],
        ["Allergen va maxsus porsiya ro'yxati", "Shaxsiy so'rov faqat kerakli xodimlarga yetkaziladi"],
        ["Servirovka va zaxira anjom", "Har taomdan oldin kerakli pribor borligi tekshiriladi"],
        ["Vaqt va signal", "Oshxona tayyorligini tasdiqlamasdan chiqish boshlanmaydi"]]) +
    quote("Bron ro'yxati eski bo'lsa, smena boshida yangilang. Maxsus porsiyani tasodifiy bo'sh o'ringa qo'ymang."))

page("Yordamchi aravachada stol yonida xizmat", grid(2,
    card_ul("blue", "🛒", "Tayyorgarlik", ["Barqaror aravacha, toza jihoz, to'silmagan yo'l", "Mehmonning roziligi va yetarli masofa", "Taom va maxsus so'rovni oldindan tasdiqlash", "Faqat o'qitilgan xodim, restoran yo'riqnomasi va vakolati doirasida"]),
    card_ul("red", "✋", "Chegara", ["Issiq jihoz mehmon va bolalardan uzoqda", "Pichoq bilan ishda tayanch sirt barqaror", "Bu kursdagi mashq olovsiz va sovuq maket bilan", "Tayyorgarlik yoki jihoz yetarli bo'lmasa individual xizmat tanlanadi"])))

page("Yevropa Ittifoqi va Fransiya: qiyoslash", defn("YI 1169/2011 reglamenti Annex II ro'yxatida <b>14 guruh</b> allergen bor. "
    "Fransiya YI a'zosi; qadoqlanmagan ovqat bo'yicha axborot berish tartibida milliy qoidalar ham tekshiriladi.") +
    grid(2,
        card("green", "📖", "O'rganiladigan amaliyot", "Tarkib haqida ishonchli axborot; allergen ma'lumotiga mehmon oson yetadi. O'qituvchi bir menyuni Annex II bilan qiyoslatadi."),
        card("blue", "🧭", "Mahalliy qo'llash", "Fransiya yoki YI qoidasi O'zbekistondagi barcha restoranga avtomatik majburiyat bo'lib qolmaydi. Ish joyidagi qonun va yozma tartib tekshiriladi.")) +
    quote('Manba: <a href="https://eur-lex.europa.eu/eli/reg/2011/1169/oj/eng" target="_blank" rel="noopener">Regulation (EU) No 1169/2011, Articles 9/44, Annex II</a>.'))

page("Buyuk Britaniya va AQSh: kontekst muhim", table(["Hudud", "Qiyoslash uchun asos", "Ehtiyotkor talqin"], [
    ["Buyuk Britaniya", "FSA: 14 allergen, ishonchli axborot va xodim tayyorgarligi", "Qadoqlanmagan taom va bevosita sotish uchun qadoqlangan (PPDS) mahsulot talablari bir xil emas"],
    ["AQSh", "FDA: qadoqlangan oziq-ovqat uchun 9 asosiy allergen, jumladan kunjut", "Bu federal ro'yxat barcha restoran qoidalarining to'liq ro'yxati emas"],
    ["AQSh Food Code", "Shtat/mahalliy hududlar qabul qilishi mumkin bo'lgan model kodeks", "Mahalliy qabul qilingan tahrir va restoran turini tekshirish kerak"]]) +
    U("p", '''<a href="https://www.food.gov.uk/business-guidance/allergen-guidance-for-food-businesses" target="_blank" rel="noopener">FSA allergen qo'llanmasi</a> · '''
      '<a href="https://www.fda.gov/food/food-labeling-nutrition/food-allergies-what-you-need-know" target="_blank" rel="noopener">FDA asosiy allergenlar</a> · '
      '<a href="https://www.fda.gov/food/retail-food-protection/fda-food-code" target="_blank" rel="noopener">FDA Food Code</a>'))

page("Bitta menyu — ikkita yechim", defn("O'quv menyusi: sabzavotli salat, grilda tovuq, guruch, yogurtli sous, choy. "
    "20 mehmon; ikki mehmonda sutga allergiya haqida so'rov. Retsept va alohida tayyorlash tasdig'i mashq kartasida beriladi.") +
    table(["Mezon", "Individual xizmat", "Bufet"], [
        ["Allergen", "Maxsus tarelka stol/o'rin bilan; sous va jarayon tekshiriladi", "Taom belgisi va alohida anjom; zarur bo'lsa maxsus porsiya oshxonadan beriladi"],
        ["Oqim", "Oshxona → toza patnis → stol; iflos idish alohida", "Tarelka → taom → ichimlik; iflos qaytish yo'li alohida"],
        ["Vaqt", "Bir vaqtda uzatish uchun jamoa signali", "Navbat va porsiya to'ldirish mas'uli"],
        ["Tanlov sababi", "Aniq o'rin va tekshiruvni boshqarish osonroq", "Ko'proq tanlov; lekin o'zaro kontakt nazorati murakkabroq"]]))

page("Amaliy mashq: servis loyihasi", defn("40 daqiqa: 5 daqiqa brifing, 10 daqiqa individual reja, 10 daqiqa bufet sxemasi, "
    "10 daqiqa juftliklararo tekshiruv, 5 daqiqa tanlov himoyasi.") +
    grid(2,
        card_ul("green", "A", "Individual reja", ["20 ta o'rin sxemasi va xodim bo'limlari", "Menyuga mos anjom va patnislar", "Allergen so'rovli o'rinlarni maxfiy qayd qilish", "Oshxona signali, maxsus porsiya va iflos oqim"]),
        card_ul("blue", "B", "Bufet rejasi", ["Kirish/chiqish, tarelka, taom va ichimlik stansiyasi", "Taom belgisi va alohida qisqichlar", "Tiqilinch va qulay o'tish yo'li", "Taom almashuvi, harorat/muddat qaydi va javobgar"])) +
    table(["Trenerning kutilmagan kartasi", "Rejada ko'rsatiladigan tuzatish"], [
        ["Ichimlik navbati aravachadagi mehmon yo'lini to'sdi", "Xavfsiz o'tish yo'lini ochish, stansiya yoki navbat yo'nalishini qayta joylashtirish"],
        ["Sutli sous qisqichi sut bo'lmagan taomga ishlatildi", "Bu taomni hozircha uzatmaslik; mas'ulga xabar, anjom va taom bo'yicha restoran tuzatish tartibi"]]) +
    quote("<b>Himoya namunasi:</b> «Individual xizmatni tanladik, chunki maxsus o'rinni aniq kuzatamiz. Xavf — noto'g'ri porsiya chiqishi. "
          "Chora — stol/o'rin belgisi va oshxona bilan ikki tomonlama tasdiq.» Boshqa asoslangan yechim ham qabul qilinadi."))
checklist([
    ("Uslub", "Ikki servis shakli menyu va mehmon soniga moslandi"),
    ("Oqim", "Toza, iflos va mehmon yo'llari belgilandi"),
    ("Anjom", "Har taomga mos anjom va zaxira ko'rsatildi"),
    ("Allergen", "Axborot, anjom ajratish va maxsus porsiya tartibi belgilandi"),
    ("Navbat", "Bufet kirishi/chiqishi, qulay yo'l va mas'ul bor"),
    ("Asos", "Tanlov tezlik, jihoz va xavfsizlik bilan izohlandi")],
    "Ikki tayyorgarlik ro'yxati, ikkita oqim sxemasi va «Qaysi uslubni nega tanladik?» degan uch jumla.")
page("Rasmiy manba bilan ishlash", U("ul", "".join(U("li", x) for x in [
    '<a href="https://worldskills.org/what/projects/wsos/" target="_blank" rel="noopener">WorldSkills Occupational Standards</a> — Restaurant Service kasbiy tavsifi va tegishli tadbir tahriri.',
    '<a href="https://www.fao.org/fao-who-codexalimentarius/codex-texts/codes-of-practice/en/" target="_blank" rel="noopener">Codex codes of practice</a> — CXC 1-1969 (gigiyena), CXC 80-2020 (allergen boshqaruvi).',
    '<a href="https://www.iso.org/iso-22000-food-safety-management.html" target="_blank" rel="noopener">ISO 22000</a> — oziq-ovqat xavfsizligini boshqarish tizimi.',
    "Mashq varag'iga hujjat nomi, hudud, tahrir/sana, qo'llanish sohasi va bitta amaliy harakatni yozing."
    ]), 'class="tick"') + quote("Xalqaro misolni ish joyiga ko'chirishdan oldin amaldagi mahalliy talab va mas'ul tasdig'ini tekshiring."))
recap([
    ("Mezon → harakat", "Sifat kuzatiladigan tayyorgarlik, muloqot va xavfsiz uzatishda ko'rinadi."),
    ("Manbani ajrating", "WorldSkills, Codex, ISO va qonun turli vazifani bajaradi."),
    ("Uslubni asoslang", "Menyu, joy, jihoz, oqim va mehmon ehtiyoji birga baholanadi."),
    ("Bufetni nazorat qiling", "Har taomning belgisi, anjomi, saqlash tartibi va javobgari bor.")],
    "R7 · Buyurtma va zal bilan oshxona hamkorligi: stol/o'rin, demo POS, stop-list va tuzatish.",
    "Ish joyingizdagi bitta xizmat turining toza/iflos oqimini chizing va bir xavfni tuzatish taklifini yozing.")

choice("WorldSkills mezonidan darsda qanday foydalanamiz?", "Kasbiy harakatni kuzatish va mashqni baholash uchun", "Barcha restoran uchun qonun sifatida", "Taom retsepti o'rniga", "Sanitariya tekshiruvini bekor qilish uchun", "Kasbiy standart va mahalliy qonun bir xil hujjat emas.")
choice("Codexning allergen boshqaruvi nimaga yordam beradi?", "Allergen o'tishini oldini olish va axborot zanjirini tashkil qilishga", "Faqat interyer tanlashga", "Mehmon byudjetini bilishga", "Hisobni avtomatik to'lashga", "Gigiyena va allergen nazorati tizimli jarayondir.")
choice("ISO 22000 sertifikati haqidagi qaysi fikr to'g'ri?", "U boshqaruv tizimiga tegishli; kundalik tekshiruv baribir kerak", "Har bir taom mutlaqo allergensiz", "Ofitsiant tarkibni so'ramasa ham bo'ladi", "Barcha mamlakatda bir xil menyu shart", "Tizim sertifikati har tarelka uchun alohida kafolat emas.")
choice("Bufetdagi ikki taom uchun bitta qisqich yetarlimi?", "Yo'q; har taomga alohida xizmat anjomi kerak", "Ha; ranglari bir xil bo'lsa", "Ha; mehmonlar shoshsa", "Faqat qimmat taomga alohida kerak", "Aralash qisqich allergen va ifloslanish xavfini oshiradi.")
choice("Individual xizmatning muhim belgisi qaysi?", "Tayyor porsiya stol va o'rin bilan mos uzatiladi", "Mehmon qozondan o'zi oladi", "Barcha taom bitta laganda aralashadi", "Menyuga qaralmaydi", "Porsiya, maxsus so'rov va o'rin birga tekshiriladi.")
choice("YI va AQSh allergen ro'yxati nega shunchaki tenglashtirilmaydi?", "Hudud va qo'llanish sohasi farq qiladi", "Allergiya bir mamlakatda yo'q", "Taom nomi kifoya", "Xodim istagan ro'yxatni tanlaydi", "YIdagi 14 guruh va AQSh federal qadoqlangan mahsulotlar uchun 9 allergen kontekst bilan o'rganiladi.")
choice("Fransiyadagi restoran qoidalarini qiyoslashda nima tekshiriladi?", "YI asoslari bilan birga milliy qo'llash tartibi", "Faqat ofitsiant formasi", "Faqat mehmon tili", "Faqat taomning rangi", "YI reglamenti va milliy axborot tartibi birga ko'riladi.")
choice("AQSh FDA Food Code qanday hujjat?", "Mahalliy hududlar qabul qilishi mumkin bo'lgan model kodeks", "Butun dunyo uchun restoran qonuni", "Faqat desertlar ro'yxati", "ISO sertifikati", "Qabul qilingan hududiy tahrir tekshiriladi.")
choice("Banketda taom chiqarishni kim bilan kelishasiz?", "Oshxona va xizmat sardori bilan", "Faqat bir mehmon bilan", "Hech kim bilan", "Faqat kassir bilan", "Bir vaqtdagi xizmat jamoa signali va tayyorlikka bog'liq.")
choice("Aravachada xizmat uchun joy xavfsiz emas. Nima tanlaysiz?", "Mas'ul bilan kelishib xavfsiz individual xizmat", "Mehmon ustidan cho'zilib ishlash", "Yo'lni to'sib xizmat", "Issiq aravachani bolaga yaqin qo'yish", "Uslub xavfsizlik va jihoz imkoniga mos bo'lishi kerak.")
choice("Bufet oqimi qanday quriladi?", "Tarelka → taom → ichimlik → chiqish, iflos yo'l alohida", "Iflos idish → toza tarelka → oshxona", "Har stansiyada yo'l kesishadi", "Ichimlik oldida yagona tor yo'lak", "Tartibli yo'l navbatni va oqimlar aralashishini kamaytiradi.")
choice("Eski bufet taomiga yangi porsiyani qo'shishdan oldin nima muhim?", "Korxonaning xavfsiz almashtirish va saqlash tartibini bajarish", "Faqat idishni to'ldirish", "Faqat yangi taomni aralashtirish", "Eski qaydni o'chirish", "Taom nazoratsiz aralashtirilmaydi, muddat va mas'ul qaydi saqlanadi.")
choice("Xalqaro misol O'zbekistonda avtomatik qonun bo'ladimi?", "Yo'q; mahalliy talab va ish joyi tartibi tekshiriladi", "Ha; manba inglizcha bo'lsa", "Faqat Fransiyadan bo'lsa", "Faqat ISO nomi bo'lsa", "Manbaning huquqiy maqomi va qo'llanish sohasi ajratiladi.")
choice("Bufetda sut allergiyasi so'rovi bo'lsa, eng to'g'ri reja?", "Tarkib va jarayon tekshiruvi, anjom ajratish, zarur alohida porsiya", "Yogurtni yashirin qo'yish", "Mehmonga barcha taom xavfsiz deyish", "Faqat taom nomini almashtirish", "Belgi qo'yishning o'zi o'zaro kontaktni yo'qotmaydi.")
choice("Ikki servis rejasining natija dalili nima?", "Tayyorgarlik ro'yxatlari, oqim sxemalari va tanlov sababi", "Faqat bezak fotosurati", "Faqat taom narxi", "Faqat mehmonlar soni", "Reja anjom, allergen, yo'nalish va navbatni amalda ko'rsatadi.")
