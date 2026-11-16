# -*- coding: utf-8 -*-
"""Manbalarni vaqtinchalik papkada qayta yig'ib tekshiradi; eski darslar yozilmaydi.

Eski taqdimot katalogi yangi R4–R12 darslarini sanamasligi mumkin. Qolgan
yozuvlar va asosiy fan to'liq mos qolishi shart.
"""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import re
import shutil
import sys
import tempfile

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parent.parent
CONFIG = re.compile(r"var RT_CFG=(\{[^\n]*\});if\(RT_CFG")
NEW_RESTAURANT_TOPICS = {"r%d" % n for n in range(4, 13)}


def load(name, file):
    spec = importlib.util.spec_from_file_location(name, file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def compatible_catalog(current, expected, course, own_topic):
    """Faqat keyingi qo'shimcha mavzular yo'qligiga ruxsat; boshqa drift yo'q."""
    ids = [t["id"] for t in current]
    expected_ids = [t["id"] for t in expected]
    main = lambda t: not t.get("course") or t["course"] == course
    return (
        len(ids) == len(set(ids))
        and [t for t in current if main(t)] == [t for t in expected if main(t)]
        and all(t in expected for t in current)
        and all(t.get("course") == "restoran" and t["id"] in NEW_RESTAURANT_TOPICS
                for t in expected if t["id"] not in ids)
        and ids == [t for t in expected_ids if t in ids]
        and (not own_topic or own_topic in ids)
    )


def normalize_catalog(generated, current, course):
    before, after = CONFIG.search(current), CONFIG.search(generated)
    if not before or not after:
        return generated
    old, new = json.loads(before[1]), json.loads(after[1])
    if compatible_catalog(old["topics"], new["topics"], course, new["topic"]):
        new["topics"] = old["topics"]
        generated = generated[:after.start(1)] + json.dumps(new, ensure_ascii=False) + generated[after.end(1):]
    return generated


def check(root=ROOT):
    with tempfile.TemporaryDirectory(prefix="generated-check-") as folder:
        stage = Path(folder)
        shutil.copytree(root / "_reyting-manba", stage / "_reyting-manba",
                        ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
        for file in [*root.glob("*.html"), root / "platform-redirect.js"]:
            shutil.copy2(file, stage / file.name)
        (stage / "fayllar").mkdir()
        shutil.copy2(root / "fayllar/havola-isfandiyor.jpg", stage / "fayllar/havola-isfandiyor.jpg")
        injector = load("generated_injector", stage / "_reyting-manba/inject.py")
        injector.VER = injector.shared()
        for filename, meta in injector.DECKS.items():
            injector.inject(filename, meta)
        injector.inject_arena()
        # Yangi darslarning matni va mashq dvigateli ham aynan qayta hosil bo'lsin.
        builder = load("generated_restoran", stage / "_reyting-manba/restoran_yigish.py")
        with contextlib.redirect_stdout(io.StringIO()):
            builder.main()
        files = [*injector.VER, *injector.DECKS, "arena.html",
                 "fayllar/yozuv-matnlar.json", "_reyting-manba/config.json"]
        failures = []
        for filename in files:
            current = (root / filename).read_text(encoding="utf-8")
            generated = (stage / filename).read_text(encoding="utf-8")
            # R4–R12 yangi nusxalari to'liq katalog bilan aynan mos bo'lishi kerak.
            if filename in injector.DECKS and not re.fullmatch(r"restoran-(?:[4-9]|1[0-2])\.html", filename):
                generated = normalize_catalog(generated, current, injector.CONF["courses"][0]["id"])
            if generated != current:
                failures.append(filename)
        return files, failures


if __name__ == "__main__":
    files, failures = check()
    if failures:
        print("Manbaga mos emas: " + ", ".join(failures), file=sys.stderr)
        sys.exit(1)
    print("%d ta fayl manbaga mos. Tekshiruv asl dars va fayllarni o'zgartirmadi." % len(files))
