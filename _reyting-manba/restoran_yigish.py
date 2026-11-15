# -*- coding: utf-8 -*-
"""Faqat R4–R12ni yig'adi; R1–R3, asosiy darslar va baza o'zgarmaydi.

  python3 _reyting-manba/restoran_yigish.py

Mavjud generator va dizayndan foydalanadi. Yangi testlar — faqat brauzerdagi
alohida mashq xotirasi; akademik ball/urinish yozish ilgaklari ulanmaydi.
"""
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import tempfile

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "_reyting-manba"


def load(name, file):
    spec = importlib.util.spec_from_file_location(name, file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    config_path = SOURCE / "config.json"
    original_config = json.loads(config_path.read_text())
    config = json.loads(config_path.read_text())
    preserved = {p: p.read_bytes() for p in [
        *(ROOT / ("restoran-%d.html" % n) for n in range(1, 4)),
        ROOT / "rt-engine.js", ROOT / "rt-engine.css",
    ]}
    generator = load("restoran_generator", SOURCE / "yangi_mavzu.py")
    template = (ROOT / "restoran-3.html").read_text()
    # Tekshirishdagi normalizatsiya aynan amaldagi testlar bilan bir xil.
    checker = template[template.index("function qIsOpen("):template.index('$("#scoreMax").textContent')]
    practice = (SOURCE / "restoran_practice.js").read_text()
    artifacts = {}
    for n in range(4, 13):
        topic = next(t for t in config["topics"] if t["id"] == "r%d" % n)
        title = re.sub(r"^R\d+\s*·\s*", "", topic["title"])
        filename = "restoran-%d.html" % n
        with tempfile.TemporaryDirectory(prefix="rs24-") as folder:
            out = Path(folder) / filename
            print(generator.yig(str(SOURCE / "matn" / ("restoran_%d_matn.py" % n)), str(out), title, n,
                  "RS 24 · %s · %s" % (title, topic["plan"]["hours"]), str(ROOT / "restoran-3.html"),
                  "Restoran xizmati|Restaurant service"))
            html = out.read_text()
        start = html.index("var KEYS=")
        end = html.index("/* ================= UZ / ENG mexanizmi", start)
        # R12da Q bo'sh: hech qanday sun'iy test, ball yoki urinish yo'q.
        html = html[:start] + checker + practice.replace("__RS_MIN__", "35" if n == 11 else "15") + "\n" + html[end:]
        html = html.replace("terdu_m3_slide", "terdu_r%d_slide" % n)
        slides = html.count('<section class="slide"')
        # Manbadagi muqova bilan haqiqiy slaydlar soni mos bo'lsin.
        if "<b>%d</b> slayd" % slides not in html:
            raise ValueError("%s: muqovadagi slaydlar sonini %d ga tuzating" % (filename, slides))
        quiz = 30 if n == 11 else 0 if n == 12 else 15
        topic.update(file=filename, slides=slides, quiz=quiz, lim=True)
        topic.pop("draft", None)
        artifacts[filename] = html

    # Asosiy fan, tayyor uch dars, reja, kurs narxi/ruxsatlari va baza sozlamalari saqlanadi.
    assert config["courses"] == original_config["courses"]
    for before, after in zip(original_config["topics"], config["topics"]):
        if after["id"] not in {"r%d" % n for n in range(4, 13)}:
            assert before == after
        else:
            assert before["plan"] == after["plan"] and before["open"] == after["open"]
    config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")

    injector = load("restoran_injector", SOURCE / "inject.py")
    # shared() yozuvlarini ishlatmasdan amaldagi umumiy fayllar versiyasini olamiz.
    injector.VER = {name: hashlib.md5((ROOT / name).read_bytes()).hexdigest()[:10]
                    for name in ["rt-engine.js", "rt-engine.css", "learning-design.css"]}
    for filename, html in artifacts.items():
        (ROOT / filename).write_text(html)
        print(injector.inject(filename, injector.DECKS[filename]))
    for file, content in preserved.items():
        assert file.read_bytes() == content, "Saqlanishi kerak: " + str(file)
    print("R4–R12 tayyor. R1–R3 va reyting dvigateli baytma-bayt saqlandi. Bazaga ulanish yo'q.")


if __name__ == "__main__":
    main()
