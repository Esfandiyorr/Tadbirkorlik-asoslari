# -*- coding: utf-8 -*-
"""RS 24 davomiy darslari: mavjud dizayn, faqat tayyor resurslarga havola.

R1–R3 manbalari va ball dvigateli o'zgartirilmaydi. Taqdimotlardagi testlar
mustahkamlash uchun; yakuniy imtihon bayonnomasini baholovchi to'ldiradi.
"""
exec(open(MATN_DIR + "restoran_umumiy.py", encoding="utf-8").read())


def lesson_cover(n, title, lead, hours, slides, tests):
    slide("Muqova", "Muqova",
          '<div class="inner title-wrap"><div>' +
          U("span", "%d-mavzu · %s" % (n, hours), 'class="kicker"') +
          U("h1", title.upper(), 'class="grad"') + U("p", lead, 'class="lead"') +
          '<div class="meta">' + U("div", "🍽️ Kurs: <b>" + FAN + "</b>") +
          U("div", "🗂 <b>RS 24</b> · 24 akademik soat · 10 modul + 2 imtihon") +
          U("div", ("📖 <b>%d</b> slayd · <b>%d</b> ta mashq savoli · vaziyat va nazorat varag'i" % (slides, tests))
            if tests else "📖 <b>%d</b> slayd · 6 mezonli amaliy baholash · individual bayonnoma" % slides) +
          U("div", "⌨️ <b>→</b> bilan davom eting · <b>P</b> — chop etish") + '</div></div></div>')


def page(title, body, block="Bosqichma-bosqich"):
    slide(title, title, kicker(block) + h2(title) + body)


def goals(results, terms, timing="40 daqiqa nazariya · 40 daqiqa amaliyot"):
    page("Maqsad, reja va natija", defn("Oldingi darslarda o'rganilgan xavfsiz xizmat endi yangi vaziyatda qo'llanadi. "
         "Mashg'ulot oxirida har bir tinglovchi quyidagi harakatlarni <b>mustaqil</b> bajaradi.") +
         grid(2, *[card("blue" if i % 2 else "green", str(i + 1), a, b) for i, (a, b) in enumerate(results)]) +
         h3("Tayanch tushunchalar") + pills(terms) + quote("🕒 Mashg'ulot taqsimoti: " + timing +
         ". Amaliy ish yakunida kuzatuv varag'i va yozma natija trenerga topshiriladi."), "Maqsad va ish tartibi")


def checklist(rows, evidence):
    page("Amaliy ish: kuzatuv varag'i", table(["Mezon", "Kuzatiladigan harakat", "Natija"],
         [[a, b, "☐ Ha ☐ Qayta mashq"] for a, b in rows]) +
         quote("📄 <b>Natija dalili:</b> " + evidence) +
         U("p", "Tinglovchi: __________  Sana: __________  Kuzatuvchi: __________<br>"
           "Kuchli harakat: ____________________<br>Qayta mashq qilinadigan harakat va muddat: ____________________"), "Amaliyot · Tekshirish")


def recap(rules, next_text, homework):
    page("Xulosa va keyingi qadam", grid(2, *[card("green", "✓", a, b) for a, b in rules]) +
         h3("Keyingi mashg'ulot") + defn(next_text) + quote("📚 Mustahkamlash: " + homework), "Yakun")
    test_slide(15, "Bu test — <b>mustahkamlash mashqi</b>. Yakuniy imtihon bahosi baholovchi bayonnomasida alohida qayd etiladi.")


def choice(question, correct, wrong1, wrong2, wrong3, explanation):
    """Javob o'rinlari muvozanatli; brauzer tartibni yana aralashtiradi."""
    at = len(Q) % 4
    answers = [wrong1, wrong2, wrong3]
    answers.insert(at, correct)
    Q.append(SV(question, answers, at, explanation))


Q = []
