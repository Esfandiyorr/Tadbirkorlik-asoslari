"""Katalog mosligida akademik ma'lumot yoki mavjud dars yo'qolmasin."""
import unittest
import json
from pathlib import Path
import shutil
import tempfile
import warnings
from check_generated import CONFIG, ROOT, check, compatible_catalog, normalize_catalog


class CatalogCompatibility(unittest.TestCase):
    def setUp(self):
        self.main = {"id": "m1", "quiz": 15, "open": True}
        self.restaurant = {"id": "r1", "course": "restoran", "file": "restoran-1.html"}
        self.new = {"id": "r4", "course": "restoran", "file": "restoran-4.html"}
        self.current = [self.main, self.restaurant]
        self.expected = [*self.current, self.new]

    def test_allows_only_a_later_extra_course_addition(self):
        self.assertTrue(compatible_catalog(self.current, self.expected, "main", "r1"))
        self.assertFalse(compatible_catalog(self.current, self.expected, "main", "r4"))
        self.assertFalse(compatible_catalog([self.restaurant], self.expected, "main", "r1"))
        self.assertFalse(compatible_catalog([self.main, self.main], self.expected, "main", "m1"))
        old_extra = {"id": "r2", "course": "restoran", "file": "restoran-2.html"}
        self.assertFalse(compatible_catalog(self.current, [*self.expected, old_extra], "main", "m1"))

    def test_rejects_changed_academic_rules_and_existing_extra_metadata(self):
        self.assertFalse(compatible_catalog([{**self.main, "quiz": 30}, self.restaurant], self.expected, "main", "m1"))
        self.assertFalse(compatible_catalog([self.main, {**self.restaurant, "file": "other.html"}], self.expected, "main", "r1"))

    def test_never_normalizes_other_configuration_or_script_changes(self):
        def html(topics, points, script):
            return "var RT_CFG=" + json.dumps({"topic": "m1", "topics": topics, "pAll": points}) + ";if(RT_CFG" + script
        old = html(self.current, 100, ")old();")
        self.assertEqual(normalize_catalog(html(self.expected, 100, ")old();"), old, "main"), old)
        self.assertNotEqual(normalize_catalog(html(self.expected, 200, ")old();"), old, "main"), old)
        self.assertNotEqual(normalize_catalog(html(self.expected, 100, ")changed();"), old, "main"), old)

    def test_actual_build_rejects_compiled_code_and_academic_configuration_drift(self):
        with tempfile.TemporaryDirectory(prefix="generation-test-") as folder:
            root = Path(folder)
            shutil.copytree(ROOT / "_reyting-manba", root / "_reyting-manba",
                            ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
            for file in [*ROOT.glob("*.html"), ROOT / "platform-redirect.js", ROOT / "rt-engine.js",
                         ROOT / "rt-engine.css", ROOT / "learning-design.css"]:
                shutil.copy2(file, root / file.name)
            (root / "fayllar").mkdir()
            for name in ["havola-isfandiyor.jpg", "yozuv-matnlar.json"]:
                shutil.copy2(ROOT / "fayllar" / name, root / "fayllar" / name)
            def failures():
                # Eski generator open(...).read() uslubida; uning manbasini o'zgartirmaymiz.
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore", ResourceWarning)
                    return check(root)[1]
            engine = root / "rt-engine.js"
            original = engine.read_text(encoding="utf-8")
            engine.write_text(original + "\n// unexpected compiled code\n", encoding="utf-8")
            self.assertIn("rt-engine.js", failures())
            engine.write_text(original, encoding="utf-8")
            lesson = root / "mavzu-1.html"
            html = lesson.read_text(encoding="utf-8")
            config = CONFIG.search(html)
            value = json.loads(config[1])
            value["pAll"] += 1
            html = html[:config.start(1)] + json.dumps(value, ensure_ascii=False) + html[config.end(1):]
            lesson.write_text(html, encoding="utf-8")
            self.assertIn("mavzu-1.html", failures())


if __name__ == "__main__":
    unittest.main()
