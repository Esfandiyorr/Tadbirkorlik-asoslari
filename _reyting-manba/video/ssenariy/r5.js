/* R5: allergen boshqaruvi. Tashxis, davolash yoki yuz foiz xavfsizlik va'dasi berilmaydi. */
(function (root, S) {
  if (typeof module !== "undefined" && module.exports) module.exports = S;
  else root.SSENARIY = S;
})(this, {
  n: 5,
  title: "Menyu va allergenlar bilan ishlash",
  description:
    "So‘rovni aniqlash, retsept va yorliqni o‘qish, o‘zaro kontaktni tekshirish, mas’ul javobini qayd qilish. R5 mashg‘ulotidagi yong‘oq allergiyasi vaziyatiga tayyorgarlik.",
  scenes: [
    {
      type: "title",
      title: "Menyu va **allergenlar**",
      sub: "Taxmin emas — tekshirilgan javob",
      lines: [
        {
          t: "Bir xil nomdagi taom turli restoranlarda boshqa retseptda tayyorlanishi mumkin.",
        },
        {
          t: "Allergen so‘rovini aniqlashdan tayyor taomni tekshirishgacha bo‘lgan zanjirni ko‘ramiz.",
        },
      ],
    },
    {
      type: "list",
      head: "Taom haqida **to‘rtta ma’lumot**",
      host: "aziz",
      items: [
        { i: "🥗", t: "Tarkib", d: "Sous, marinad va bezak ham" },
        { i: "⚖️", t: "Porsiya", d: "Menyudagi aniq hajm" },
        { i: "🍳", t: "Tayyorlash usuli", d: "Amaldagi retsept" },
        { i: "🧾", t: "Narx va shart", d: "Qo‘shimcha to‘lov oldindan" },
      ],
      lines: [
        {
          t: "Faqat asosiy mahsulotni sanash kam: sous va bezak ham retseptga kiradi.",
          on: [0],
        },
        {
          t: "Porsiya hajmi va tayyorlash usulini menyu bilan solishtiring.",
          on: [1, 2],
        },
        {
          t: "Qo‘shimcha mahsulot yoki xizmat haqi bo‘lsa, buyurtmadan oldin tushuntiring.",
          on: [3],
        },
      ],
    },
    {
      type: "dialog",
      left: { who: "dilnoza" },
      right: { who: "malika", pose: "hand" },
      lines: [
        {
          s: "L",
          t: "Yong‘oqqa allergiyam bor. Shu salatdan olsam bo‘ladimi?",
        },
        {
          s: "R",
          t: "Qaysi turiga ekanini aniqlashtirsam: yer yong‘oqmi yoki daraxt yong‘og‘imi?",
        },
        { s: "L", t: "Bodom va grek yong‘og‘iga." },
        {
          s: "R",
          t: "Qayd qildim. Tarkib va tayyorlash sharoitini tekshirib qaytaman.",
        },
        {
          t: "Mehmon turini bilmasa, noaniqlik ham yoziladi; tekshirish tartibi qisqartirilmaydi.",
          quiet: true,
        },
      ],
    },
    {
      type: "steps",
      head: "Tekshirishning **4 manbasi**",
      items: [
        { i: "📖", t: "Retsept", d: "Taom + sous + garnir + bezak" },
        { i: "🏷️", t: "Yorliq va jadval", d: "Hozirgi mahsulot va sana" },
        { i: "🔄", t: "Jarayon", d: "Yog‘, gril, taxta va qisqich" },
        { i: "👨‍🍳", t: "Mas’ul javobi", d: "Taom, o‘rin va aniq chora" },
      ],
      lines: [
        {
          t: "Bugungi retseptni tekshiring. Kechagi sous yoki mahsulot bugun almashgan bo‘lishi mumkin.",
          on: [0],
        },
        {
          t: "Jadvaldagi bo‘sh katak va savol belgisi xavfsizlik tasdig‘i emas.",
          on: [1],
        },
        {
          t: "Bir yog‘, pichoq yoki qisqichdan allergen boshqa taomga o‘tishi mumkin.",
          on: [2],
        },
        {
          t: "«Bo‘ladi» o‘rniga mas’uldan qanday tayyorlanishi haqida aniq tasdiq oling.",
          on: [3],
        },
      ],
    },
    {
      type: "compare",
      head: "**Yong‘oqni olish** yetmaydi",
      a: {
        title: "Tekshiriladigan chora",
        items: [
          "Mos yangi porsiya",
          "Tozalash tartibi va toza anjom",
          "Alohida jarayonni mas’ul tasdiqlaydi",
        ],
      },
      b: {
        title: "Xato qaror",
        items: [
          "Tayyor salatdan yong‘oqni terish",
          "«Pishirsak, yo‘qoladi» deyish",
          "Umumiy qisqichni tekshirmaslik",
        ],
      },
      lines: [
        {
          t: "Ko‘rinadigan yong‘oqni olib tashlash oldingi kontaktni bekor qilmaydi.",
          on: ["b0"],
        },
        {
          t: "Pishirish allergenni ishonchli yo‘qotmaydi; bu mikroblarni kamaytirish bilan bir xil masala emas.",
          on: ["b1", "b2"],
        },
        {
          t: "Muqobil porsiya uchun ham retsept va butun tayyorlash jarayoni tekshiriladi.",
          on: ["a0", "a1", "a2"],
        },
      ],
    },
    {
      type: "rule",
      big: "4",
      unit: "qayd maydoni",
      head: "Qaydni **oshxona bilan yopish**",
      items: [
        { i: "🪑", t: "Stol va o‘rin", d: "Masalan, 6-stol, 2-o‘rin" },
        { i: "🥜", t: "Mehmon aytgan allergen", d: "Bodom va grek yong‘og‘i" },
        { i: "👨‍🍳", t: "Mas’ul va tekshiruv", d: "Javob, vaqt, aniq chora" },
        {
          i: "✅",
          t: "Mehmon qarori va taom",
          d: "Uzatishdan oldin qayta tekshirish",
        },
      ],
      lines: [
        {
          t: "So‘rovni shunchaki «maxsus» deb yozmang; stol, o‘rin va allergen nomini aniq yozing.",
          on: [0, 1],
        },
        {
          t: "Kim javob bergani va nima tekshirilganini qayd qiling.",
          on: [2],
        },
        {
          t: "Taom chiqayotganda belgi va o‘rin yana tasdiqlanadi. Shaxsiy ma’lumot faqat zarur xodimga beriladi.",
          on: [3],
        },
      ],
    },
    {
      type: "dialog",
      left: { who: "malika" },
      right: { who: "aziz", pose: "hand" },
      lines: [
        {
          s: "L",
          t: "6-stol, 2-o‘rin: bodom va grek yong‘og‘i allergiyasi. Sous bugun almashtirilganmi?",
        },
        { s: "R", t: "Yangi sousning yorlig‘i hozir qo‘limda yo‘q." },
        {
          s: "L",
          t: "Unda bu taomni hozircha tasdiqlamaymiz. Yorliq va jarayon tekshirilguncha uzatmayman.",
        },
        {
          t: "Muqobil ham tekshiriladi. Xizmatni to‘xtatish — noaniqlikdagi to‘g‘ri qaror.",
          quiet: true,
          note: "✋ Tasdiq yo‘q — taom yo‘q",
          tone: "warn",
        },
      ],
    },
    {
      type: "steps",
      head: "Amaliyot: **rollar almashadi**",
      items: [
        {
          i: "📋",
          t: "Menyu va kartalarni oling",
          d: "A: yangi yorliq · B: umumiy qisqich",
        },
        {
          i: "💬",
          t: "So‘rang va qayd qiling",
          d: "Mehmon → ofitsiant → oshxona",
        },
        { i: "✋", t: "Qaror qiling", d: "Tekshirilgan javob yoki uzatmaslik" },
        {
          i: "🔄",
          t: "Rollarni almashtiring",
          d: "Har tinglovchi zanjirni bajarsin",
        },
      ],
      lines: [
        {
          t: "Birinchi kartada sous yorlig‘i yetishmaydi. «Bor deb o‘ylayman» javobini qabul qilmang.",
          on: [0],
        },
        {
          t: "Ikkinchisida taom tarkibi mos, ammo umumiy qisqich ishlatilgan. Jarayonni ham tekshiring.",
          on: [1, 2],
        },
        {
          t: "Kuzatuvchi so‘rov, manba, mas’ul, qaror va taomni tekshirish harakatini yozadi.",
          on: [3],
        },
      ],
    },
    {
      type: "outro",
      head: "Esda qoladigan **zanjir**",
      items: [
        { i: "💬", t: "Aniqlashtiring" },
        { i: "📝", t: "Qayd qiling" },
        { i: "🔎", t: "To‘rt manbani tekshiring" },
        { i: "👨‍🍳", t: "Mas’ulni tasdiqlating" },
        { i: "✋", t: "Noaniqlikda uzatmang" },
        { i: "🍽️", t: "Tayyor taomni tekshiring" },
      ],
      next: "R6 · Xalqaro mezonlar va xizmat shakllari",
      lines: [
        {
          t: "Xavfsizlik gap bilan emas, butun tekshirish zanjiri bilan ta’minlanadi.",
          on: [0, 1, 2],
        },
        {
          t: "Aniq javob yo‘q bo‘lsa taom uzatilmaydi. Keyingi darsda shu qoidalarni xizmat shakllariga qo‘llaymiz.",
          on: [3, 4, 5, "next"],
        },
      ],
    },
  ],
});
