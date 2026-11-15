# -*- coding: utf-8 -*-
"""«Restoran xodimlari malakasini oshirish» fani (RS 24) mavzulari uchun umumiy yordamchilar.
Har bir restoran_<N>_matn.py boshida shu fayl ishga tushiriladi:  exec(open(MATN_DIR + "restoran_umumiy.py", encoding="utf-8").read())
(T, d, slide, MATN_DIR — yangi_mavzu.py beradi.)

Matn faqat o'zbekcha: EN lug'atiga ham shu matn yoziladi (til almashtirilsa ham o'zbekcha qoladi). Xizmat ingliz tili
iboralari mazmunning o'zida beriladi. Har mavzuda: slaydlar → 🎬 animatsion video slaydi → xulosa → TEST.
Video fayllari: fayllar/video/R<N>.mp4 (+ .vtt subtitr, .jpg muqova) — _reyting-manba/video/ da yaratiladi.
"""
FAN = "Restoran xodimlari malakasini oshirish"
FAN_QISQA = "Restoran xizmati"


def U(tag, uz, attr=""):
    """Bitta tilli element: <tag data-i=N attr>uz</tag>"""
    return "<" + tag + " " + d(uz, uz) + ((" " + attr) if attr else "") + ">" + uz + "</" + tag + ">"


def G(x):
    """sarlavhadagi rangli (gradient) qism"""
    return '<span class="grad">' + x + '</span>'


def kicker(uz):
    return U("span", uz, 'class="kicker"')


def h2(uz):
    return U("h2", uz)


def h3(uz, top=22):
    return U("h3", uz, 'style="margin-top:%dpx"' % top)


def defn(uz):
    return U("div", uz, 'class="def"')


def card(color, icon, title, text, style=""):
    return ('<div class="card" style="--c:var(--' + color + ');' + style + '">' +
            (('<span class="icon">' + icon + '</span>') if icon else "") + U("h3", title) + U("p", text) + '</div>')


def card_ul(color, icon, title, items, cls="tick", head=None, style=""):
    """items: [matn, ...]; head — ro'yxat oldidagi qisqa izoh"""
    return ('<div class="card" style="--c:var(--' + color + ');' + style + '">' +
            (('<span class="icon">' + icon + '</span>') if icon else "") + U("h3", title) +
            (U("p", head) if head else "") +
            '<ul class="' + cls + '">' + "".join(U("li", x) for x in items) + '</ul></div>')


def grid(n, *cards, top=16):
    return '<div class="grid g%d" style="margin-top:%dpx">' % (n, top) + "".join(cards) + '</div>'


def table(heads, rows):
    """heads: [matn, ...]; rows: [[matn, ...], ...]"""
    head = ('<thead><tr>' + "".join(U("th", x) for x in heads) + '</tr></thead>') if heads else ''
    return ('<div class="tw"><table>' + head + '<tbody>' +
            "".join("<tr>" + "".join(U("td", c) for c in r) + "</tr>" for r in rows) + '</tbody></table></div>')


def quote(uz, top=14):
    return U("div", uz, 'class="quote" style="margin-top:%dpx"' % top)


def pills(items):
    """items: [(matn, yashilmi)] yoki [matn]"""
    html = "".join('<span class="pill' + (' g' if (not isinstance(x, str) and x[1]) else '') + '">' +
                   (x if isinstance(x, str) else x[0]) + '</span>' for x in items)
    return U("div", html)


def dialog(color, icon, title, lines, note=None):
    """Namunaviy suhbat: lines — [(kim, gap)], kim: "O" ofitsiant, "M" mehmon, "A" administrator, "Osh" oshxona yoki istalgan nom"""
    who = {"O": "🤵 Ofitsiant", "M": "🙂 Mehmon", "A": "👔 Administrator", "Osh": "👨‍🍳 Oshxona", "X": "🧳 Xorijiy mehmon"}
    return ('<div class="card" style="--c:var(--' + color + ')">' +
            (('<span class="icon">' + icon + '</span>') if icon else "") + U("h3", title) +
            "".join(U("p", "<b>" + who.get(k, k) + ":</b> " + t) for k, t in lines) +
            (U("p", "<i>" + note + "</i>") if note else "") + '</div>')


def cover(n, title, lead, hours, slides, tests):
    """Muqova slaydi"""
    slide("Muqova", "Muqova",
          '<div class="inner title-wrap"><div>' +
          U("span", "%d-mavzu · %s" % (n, hours), 'class="kicker"') +
          U("h1", title, 'class="grad"') +
          U("p", lead, 'class="lead"') +
          '<div class="meta">' +
          U("div", "🍽️ Kurs: <b>" + FAN + "</b>") +
          U("div", "🗂 Dastur kodi: <b>RS 24</b> · 24 akademik soat") +
          U("div", "🗂 <b>%d</b> slayd · <b>%d</b> ta test · 🎬 animatsion video" % (slides, tests)) +
          U("div", "⌨️ <b>→</b> tugmasi bilan davom eting") +
          '</div></div></div>')


def video_slide(n, title, daqiqa, savollar):
    """🎬 Animatsion video slaydi: savollar — [(rang, belgi, sarlavha, matn)] (ko'rib bo'lgach muhokama)"""
    v = "fayllar/video/R%d" % n
    slide("🎬 Video dars", "🎬 Video dars",
          kicker("Ko'ring va muhokama qiling") +
          h2("🎬 Animatsion video: " + G(title)) +
          '<figure class="video-wrap sq-film"><video controls playsinline preload="none" poster="' + v + '.jpg" src="' + v + '.mp4">'
          '<track kind="subtitles" srclang="uz" label="O‘zbekcha" src="' + v + '.vtt" default></video>' +
          U("figcaption", "⏱ Davomiyligi — taxminan %s daqiqa · ovozsiz, subtitr bilan (pleyerdagi «CC» tugmasi)" % daqiqa) + '</figure>' +
          grid(3, *[card(c, i, t, p) for c, i, t, p in savollar]))


def test_slide(soni, uy_vazifa):
    slide("TEST · Bilimni tekshirish", "TEST · Bilimni tekshirish",
          kicker("Yakuniy nazorat") +
          h2("🧪 Test topshiriqlari — " + G("%d ta savol" % soni)) +
          '<div class="scorebar"><span><span data-ui="score">Natija:</span> <b><span id="scoreNow">0</span> / <span id="scoreMax">%d</span></b></span>' % soni +
          '<span><span data-ui="answered">Javob berildi:</span> <b id="answered">0</b></span><div class="spacer"></div>' +
          U("button", "↻ Testni qayta boshlash", 'class="btn warn" id="btnReset"') + '</div>'
          '<div id="testWrap"></div><div class="result" id="result"><div class="pct" id="pct">0%</div>' +
          U("h3", "Natija", 'id="resTitle" style="color:#fff;margin:10px 0 4px"') + '<p id="resTxt" style="color:#fff;opacity:.95;margin:0"></p></div>'
          '<div class="card" style="--c:var(--green);margin-top:18px;text-align:center">' +
          U("h3", "🎓 Rahmat! E'tiboringiz uchun tashakkur") +
          U("p", uy_vazifa) +
          U("p", FAN + " · RS 24", 'style="color:var(--muted);font-size:13.5px"') + '</div>')


def SV(q, a, c, e):
    """Variantli savol (4 variant, c — to'g'ri javob raqami 0 dan)"""
    return dict(q=q, a=a, c=c, e=e, qe=q, ae=a, ee=e)


def SO(q, o, e):
    """Ochiq savol: javob yoziladi (bitta so'z yoki son), o — qabul qilinadigan javoblar"""
    return dict(q=q, o=o, e=e, qe=q, oe=o, ee=e)
