/* R4: dars rejasiga mos animatsiya. Narxlar o'quv misoli; allergen javobi faqat tekshiruvdan keyin. */
(function (root, S) {
  if (typeof module !== "undefined" && module.exports) module.exports = S;
  else root.SSENARIY = S;
})(this, {
  n: 4,
  title: "Xorijiy mehmon bilan muloqot",
  description:
    "Til tanlash, menyuni sodda ingliz tilida izohlash, maxsus so‘rovni yozish va buyurtmani qayta tasdiqlash. R4 darsidagi ikki dialogga tayyorgarlik. Narx va menyu o‘quv misoli.",
  scenes: [
    {
      type: "title",
      title: "Xorijiy mehmon bilan **muloqot**",
      sub: "So‘rang · tushuntiring · tekshiring · tasdiqlang",
      lines: [
        {
          t: "Maqsad — mukammal grammatika emas, mehmon buyurtmani to‘g‘ri tushunishidir.",
        },
        {
          t: "Ikki suhbatni mashq qilamiz: taom va narx, keyin allergen so‘rovi.",
        },
      ],
    },
    {
      type: "dialog",
      left: { who: "malika", pose: "hand" },
      right: { who: "dilnoza" },
      lines: [
        {
          s: "L",
          t: "Good evening! Welcome to our restaurant.",
          sub: "Xayrli kech! Restoranimizga xush kelibsiz.",
        },
        {
          s: "L",
          t: "Which language would you prefer?",
          sub: "Qaysi tilda gaplashishni afzal ko‘rasiz?",
        },
        { s: "R", t: "English, please.", sub: "Ingliz tilida, iltimos." },
        {
          t: "Mehmonning ko‘rinishi yoki ismiga qarab til va ehtiyojni taxmin qilmang.",
          quiet: true,
          note: "🌍 Avval so‘rang",
        },
      ],
    },
    {
      type: "list",
      head: "Sodda nutqning **4 qoidasi**",
      host: "aziz",
      items: [
        { i: "💬", t: "Bitta gap — bitta fikr" },
        { i: "🐢", t: "Sekin va aniq, balandroq emas" },
        { i: "📖", t: "Menyu va raqamni ko‘rsating" },
        { i: "✅", t: "Tushunganini tekshiring" },
      ],
      lines: [
        {
          t: "Uzun gapni qisqa ikki gapga ajrating; idioma va sleng ishlatmang.",
          on: [0],
        },
        {
          t: "Mehmon tushunmasa, o‘sha gapni balandroq takrorlash yordam bermaydi.",
          on: [1],
        },
        {
          t: "Taom surati, porsiya va narxni ikki tilli menyuda ko‘rsating.",
          on: [2],
        },
        { t: "Tanlovli savol bering va javob uchun vaqt qoldiring.", on: [3] },
      ],
    },
    {
      type: "dialog",
      prop: "table",
      left: { who: "malika", pose: "tray" },
      right: { who: "dilnoza" },
      lines: [
        { s: "R", t: "What is plov?", sub: "Osh qanday taom?" },
        {
          s: "L",
          t: "Rice with lamb, carrots and onions.",
          sub: "Guruch, qo‘y go‘shti, sabzi va piyoz. Bu mashqdagi retsept.",
        },
        {
          s: "L",
          t: "One portion is 350 grams. It costs 50,000 soums.",
          sub: "Bir porsiya 350 gramm, narxi 50 ming so‘m — o‘quv misoli.",
        },
        {
          s: "L",
          t: "Bread is extra. Would you like bread?",
          sub: "Non alohida to‘lanadi. Non olasizmi?",
        },
        {
          t: "Tarkib, porsiya, tayyorlash usuli va narx amaldagi menyuga mos bo‘lsin.",
          quiet: true,
          note: "📋 Taxminiy narx aytmang",
        },
      ],
    },
    {
      type: "dialog",
      left: { who: "malika" },
      right: { who: "dilnoza" },
      lines: [
        {
          s: "L",
          t: "Do you have any food allergies or dietary requirements?",
          sub: "Ovqatga allergiyangiz yoki maxsus ovqatlanish talablingiz bormi?",
        },
        {
          s: "R",
          t: "I have a walnut allergy.",
          sub: "Grek yong‘og‘iga allergiyam bor.",
        },
        {
          s: "L",
          t: "Thank you for telling me. Let me write it down.",
          sub: "Aytganingiz uchun rahmat. Stol va o‘rin bilan qayd qilaman.",
        },
        {
          s: "L",
          t: "Let me check the ingredients and preparation with our kitchen.",
          sub: "Tarkib va tayyorlash jarayonini oshxonadan tekshiraman.",
        },
      ],
    },
    {
      type: "compare",
      head: "Oshxona javobi **aniq bo‘lsin**",
      a: {
        title: "Tekshirilgan javob",
        items: [
          "Retsept, sous va bezak",
          "Alohida tayyorlash va toza anjom",
          "Mas’ulning aniq tasdig‘i",
        ],
      },
      b: {
        title: "Yetarli emas",
        items: [
          "«Menimcha, bo‘ladi»",
          "«Yong‘oqni olib tashlaymiz»",
          "Faqat toza idish bilan cheklanish",
        ],
      },
      lines: [
        {
          t: "Retsept bilan birga sous, bezak va allergenning boshqa taomga o‘tish xavfi tekshiriladi.",
          on: ["a0", "a1"],
        },
        {
          t: "Aniq tasdiq bo‘lmasa, bu taomni uzatmang; mas’ul bilan tekshirilgan muqobilni izlang.",
          on: ["a2"],
          note: "✋ Noaniq javob — uzatmaslik",
          tone: "warn",
        },
        {
          t: "Ko‘rinadigan yong‘oqni olish yoki bitta toza idish ishlatishning o‘zi yetmaydi.",
          on: ["b0", "b1", "b2"],
        },
      ],
    },
    {
      type: "dialog",
      prop: "table",
      left: { who: "malika", pose: "hand" },
      right: { who: "dilnoza" },
      lines: [
        {
          s: "L",
          t: "May I confirm: one plov, no bread?",
          sub: "Tasdiqlasam: bir porsiya osh, nonsiz?",
        },
        { s: "R", t: "Yes, correct.", sub: "Ha, to‘g‘ri." },
        {
          s: "L",
          t: "It takes about fifteen minutes.",
          sub: "Taxminan o‘n besh daqiqa bo‘ladi — oshxona tasdiqlagan vaqt.",
        },
        {
          t: "Maxsus so‘rov bo‘lsa, taom, o‘rin va allergen belgisini ham qayta ayting.",
          quiet: true,
          note: "✅ Buyurtma + keyingi qadam",
        },
      ],
    },
    {
      type: "steps",
      head: "Videodan keyin **ikki dialog**",
      items: [
        {
          i: "📖",
          t: "Taom, porsiya va narx",
          d: "Mehmon narxni noto‘g‘ri eshitadi",
        },
        {
          i: "🥜",
          t: "Allergen so‘rovi",
          d: "Oshxona avval noaniq javob beradi",
        },
        { i: "🔄", t: "Rollarni almashtiring", d: "Har kim ofitsiant bo‘lsin" },
        {
          i: "📝",
          t: "Dalilni yozing",
          d: "Mehmon tasdig‘i va bitta yaxshilash",
        },
      ],
      lines: [
        {
          t: "Birinchi vaziyatda narxni menyuda ko‘rsating va tushunilganini tekshiring.",
          on: [0],
        },
        {
          t: "Ikkinchisida «bo‘ladi» javobini aniqlashtiring; tasdiqsiz buyurtma bermang.",
          on: [1],
        },
        {
          t: "Ofitsiant, mehmon va kuzatuvchi rollari almashadi; suhbatni yodlab aytish yetarli emas.",
          on: [2],
        },
        {
          t: "Kuzatuvchi aniq harakat va keyingi mashq uchun bitta tavsiya yozadi.",
          on: [3],
        },
      ],
    },
    {
      type: "outro",
      head: "Esda qoladigan **6 harakat**",
      items: [
        { i: "🌍", t: "Tilni so‘rang" },
        { i: "💬", t: "Sodda tushuntiring" },
        { i: "📖", t: "Menyuda ko‘rsating" },
        { i: "📝", t: "So‘rovni yozing" },
        { i: "👨‍🍳", t: "Tekshiring" },
        { i: "✅", t: "Qayta tasdiqlang" },
      ],
      next: "R5 · Menyu va allergenlar",
      lines: [
        {
          t: "Mehmon to‘g‘ri tushungani va tekshirilgan buyurtma xizmat sifatini ko‘rsatadi.",
          on: [0, 1, 2],
        },
        {
          t: "So‘rovni yozing, oshxona bilan tekshiring, keyin qayta tasdiqlang.",
          on: [3, 4, 5],
        },
        {
          t: "Keyingi darsda allergen jadvali va tayyorlash jarayonini batafsil tekshiramiz.",
          on: ["next"],
        },
      ],
    },
  ],
});
