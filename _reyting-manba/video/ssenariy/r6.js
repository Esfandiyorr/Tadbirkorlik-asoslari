/* R6: mezonlarni amaliy harakatga aylantirish; xalqaro hujjat mahalliy qonun o'rnini bosmaydi. */
(function (root, S) {
  if (typeof module !== "undefined" && module.exports) module.exports = S;
  else root.SSENARIY = S;
})(this, {
  n: 6,
  title: "Xalqaro mezonlar va xizmat shakllari",
  description:
    "WorldSkills, Codex va ISO 22000 vazifalari; individual xizmat, bufet, banket va yordamchi aravacha. R6 amaliyoti: bitta menyu uchun ikki servis rejasi.",
  scenes: [
    {
      type: "title",
      title: "Xalqaro mezonlar va **xizmat shakllari**",
      sub: "Mezon → kuzatiladigan harakat → asoslangan reja",
      lines: [
        {
          t: "Xizmat uslubini nomlash yetarli emas. Tanlovni menyu, joy va mehmon ehtiyoji bilan asoslaymiz.",
        },
        { t: "Bitta menyu uchun individual xizmat va bufet rejasini tuzamiz." },
      ],
    },
    {
      type: "list",
      head: "Hujjatlarning vazifasi **turlicha**",
      host: "aziz",
      items: [
        {
          i: "🏅",
          t: "WorldSkills",
          d: "Kasbiy ko‘nikma va baholash mezonlari",
        },
        { i: "🧼", t: "Codex", d: "Gigiyena va allergen boshqaruvi" },
        { i: "📋", t: "ISO 22000", d: "Xavfsizlikni boshqarish tizimi" },
        {
          i: "📍",
          t: "Mahalliy talab",
          d: "Ish joyidagi qonun va yozma tartib",
        },
      ],
      lines: [
        {
          t: "WorldSkills kasbiy mezonni kuzatiladigan ishga aylantirishga yordam beradi; tegishli tadbir tahriri tekshiriladi.",
          on: [0],
        },
        {
          t: "Codex gigiyena va allergen boshqaruvi uchun yo‘riq beradi.",
          on: [1],
        },
        {
          t: "ISO 22000 tashkilotning boshqaruv tizimi haqida; u qoshiqni qayerga qo‘yish qoidasi emas.",
          on: [2],
        },
        {
          t: "Xalqaro misol mahalliy qonunni avtomatik almashtirmaydi.",
          on: [3],
        },
      ],
    },
    {
      type: "compare",
      head: "Bir menyu — **ikki yechim**",
      a: {
        title: "Individual tarelka",
        items: [
          "Porsiya oshxonada tayyorlanadi",
          "Stol va o‘rin aniq",
          "Maxsus taom alohida tekshiriladi",
        ],
      },
      b: {
        title: "Bufet",
        tone: "warn",
        items: [
          "Mehmon o‘zi tanlaydi",
          "Oqim va navbat rejalashtiriladi",
          "Har taomning alohida anjomi bor",
        ],
      },
      lines: [
        {
          t: "Individual xizmatda taom oshxonada porsiyalanadi; maxsus buyurtma o‘rin bilan tekshiriladi.",
          on: ["a0", "a1", "a2"],
        },
        {
          t: "Bufet tanlov beradi, ammo umumiy anjom va mehmon oqimini nazorat qilish murakkabroq.",
          on: ["b0", "b1", "b2"],
        },
        {
          t: "Bir uslub har doim eng yaxshi bo‘lmaydi; joy, jihoz va ehtiyoj bilan asoslang.",
        },
      ],
    },
    {
      type: "steps",
      head: "Bufetda **toza oqim**",
      items: [
        {
          i: "➡️",
          t: "Kirish va toza tarelka",
          d: "Yo‘l ochiq, qaytish yo‘li alohida",
        },
        {
          i: "🥘",
          t: "Taom va belgi",
          d: "Nom, allergen axboroti, alohida anjom",
        },
        { i: "☕", t: "Ichimlik stansiyasi", d: "Tiqilinch hosil qilmaydi" },
        { i: "⬅️", t: "Chiqish va iflos idish", d: "Toza yo‘lga kesishmaydi" },
      ],
      lines: [
        {
          t: "Avval kirish va toza tarelka joyi. Qulay o‘tish yo‘li barcha mehmon uchun ochiq.",
          on: [0],
        },
        {
          t: "Har taomga ishonchli axborot va o‘z qisqichi kerak; tushgan qisqich almashtiriladi.",
          on: [1],
        },
        { t: "Ichimlik olish navbati asosiy taom yo‘lini to‘smasin.", on: [2] },
        {
          t: "Iflos idish qaytishi toza tarelka yoki tayyor taom yo‘liga qo‘shilmasin.",
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
          t: "Yigirma mehmon, ikki kishida sutga allergiya bor. Bufetning o‘zi yetadimi?",
        },
        {
          s: "R",
          t: "Yogurtli sous va umumiy anjomni tekshiramiz. Maxsus porsiya oshxonadan alohida chiqishi mumkin.",
        },
        {
          s: "L",
          t: "Demak, retsept va jarayon tasdig‘ini, mas’ulni va qaysi o‘ringa uzatilishini rejalaymiz.",
        },
        {
          t: "Mehmonning shaxsiy so‘rovi faqat kerakli xodimlarga beriladi.",
          quiet: true,
          note: "🥛 R5 qoidasi har uslubda",
        },
      ],
    },
    {
      type: "list",
      head: "Banket va aravacha: **vakolat chegarasi**",
      host: "malika",
      items: [
        { i: "🪑", t: "Banket: stol sxemasi va maxsus o‘rin" },
        { i: "🤝", t: "Bir vaqtdagi xizmat: oshxona signali" },
        { i: "🛒", t: "Aravacha: barqaror jihoz va bo‘sh yo‘l" },
        { i: "✋", t: "Mashq: sovuq maket, olovsiz" },
      ],
      lines: [
        {
          t: "Banketda maxsus porsiya va xodim bo‘limlari oldindan kelishiladi.",
          on: [0],
        },
        {
          t: "Oshxona tayyorligini tasdiqlamasdan bir vaqtdagi uzatish boshlanmaydi.",
          on: [1],
        },
        {
          t: "Aravachada faqat o‘qitilgan xodim vakolati doirasida ishlaydi; mehmon roziligi va masofa zarur.",
          on: [2],
        },
        {
          t: "Bu kursdagi mashq sovuq maket va olovsiz. Jihoz yetarli bo‘lmasa, boshqa uslub tanlang.",
          on: [3],
        },
      ],
    },
    {
      type: "compare",
      head: "Xalqaro misolni **tekshirib qo‘llang**",
      a: {
        title: "To‘g‘ri savollar",
        items: [
          "Qaysi hujjat va qaysi tahrir?",
          "Qaysi mamlakat va mahsulot turi?",
          "Ish joyiga qanday aloqasi bor?",
        ],
      },
      b: {
        title: "Xato xulosa",
        items: [
          "Hamma davlatda bitta ro‘yxat",
          "ISO barcha servis tomonini belgilaydi",
          "Xalqaro misol — mahalliy qonun",
        ],
      },
      lines: [
        {
          t: "Yevropa va AQSh allergen misollarining qo‘llanish sohasi turlicha. R6dagi manbani sana va mahsulot turi bilan o‘qing.",
          on: ["a0", "a1"],
        },
        {
          t: "O‘rganganingizni ish joyidagi amaldagi talab va mas’ul tasdig‘i bilan bog‘lang.",
          on: ["a2"],
        },
        {
          t: "Turli hujjat vazifalarini bitta qoida deb aralashtirmang.",
          on: ["b0", "b1", "b2"],
        },
      ],
    },
    {
      type: "steps",
      head: "Amaliyot: **ikkita servis rejasi**",
      items: [
        {
          i: "🍽️",
          t: "A: individual xizmat",
          d: "O‘rin, anjom, signal va maxsus porsiya",
        },
        { i: "🥘", t: "B: bufet sxemasi", d: "Oqim, belgi, qisqich va mas’ul" },
        {
          i: "🔄",
          t: "Vaziyat o‘zgaradi",
          d: "Navbat yoki qisqich xatosi beriladi",
        },
        {
          i: "📝",
          t: "Tanlovni himoya qiling",
          d: "Uch jumla: sabab, xavf, chora",
        },
      ],
      lines: [
        {
          t: "Bir xil menyu va yigirma mehmon uchun ikki alohida reja chizing.",
          on: [0, 1],
        },
        {
          t: "Trener umumiy qisqich yoki to‘silgan yo‘l kartasini beradi. Rejani o‘sha paytda tuzating.",
          on: [2],
        },
        {
          t: "Menyu, xavfsizlik va mehmon oqimi bo‘yicha tanlovni uch jumlada asoslang.",
          on: [3],
        },
      ],
    },
    {
      type: "outro",
      head: "Yaxshi servis — **asoslangan reja**",
      items: [
        { i: "📋", t: "Mezonni harakatga aylantiring" },
        { i: "📖", t: "Hujjat vazifasini ajrating" },
        { i: "🍽️", t: "Uslubni asoslang" },
        { i: "➡️", t: "Oqimni chizing" },
        { i: "🥛", t: "Allergenni tekshiring" },
        { i: "👥", t: "Mas’ulni belgilang" },
      ],
      next: "R7 · Buyurtma va oshxona hamkorligi",
      lines: [
        {
          t: "Tinglovchi ikki reja, ikkita tayyorgarlik ro‘yxati va tanlov sababini topshiradi.",
          on: [0, 1, 2],
        },
        {
          t: "Oqim, allergen va mas’ul bir rejaning qismlari. Keyingi darsda buyurtmani oshxona bilan yopamiz.",
          on: [3, 4, 5, "next"],
        },
      ],
    },
  ],
});
