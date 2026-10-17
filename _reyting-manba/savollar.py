# -*- coding: utf-8 -*-
"""Jonli test / Zakovat savollar fayli: fayllar/savollar.dat (javoblar ochiq ko'rinmasligi uchun kodlangan).

O'qituvchi paneli ochilganda fayldagi o'zgarishlar bazadagi bankka BIR MARTA qo'llanadi
(versiya — "ver"; bazada bank/_sv da saqlanadi). Har o'zgarishda ver bittaga oshadi.

  python3 _reyting-manba/savollar.py list                 — fayldagi savollar
  python3 _reyting-manba/savollar.py add  BO'LIM < matn   — matndan savollar qo'shish
  python3 _reyting-manba/savollar.py del  < matn          — savollarni o'chirish (har qatorda savol matni)

Matn formati (add): 1-qator savol, keyingi 4 qator javob, to'g'ri javob oxirida *,
savollar orasida bo'sh qator. BO'LIM: tad, iqt, m1..m15 yoki "" (umumiy).
"""
import sys, json, base64, re, os
F = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'fayllar', 'savollar.dat')

def enc(obj):
    b = json.dumps(obj, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    return base64.b64encode(bytes(x ^ ((k * 37 + 91) & 255) for k, x in enumerate(b))).decode()

def dec(txt):
    b = base64.b64decode(txt.strip())
    return json.loads(bytes(x ^ ((k * 37 + 91) & 255) for k, x in enumerate(b)).decode('utf-8'))

def load():
    return dec(open(F, encoding='utf-8').read()) if os.path.exists(F) else {'ver': 0, 'add': [], 'del': []}

def save(d):
    d['ver'] = int(d.get('ver', 0)) + 1
    open(F, 'w', encoding='utf-8').write(enc(d) + '\n')
    print('saqlandi: ver', d['ver'], '· savollar', len(d['add']), '· o\'chiriladiganlar', len(d['del']))

def parse(txt):
    out, bad = [], 0
    for blk in re.split(r'\n\s*\n', txt.replace('\r', '')):
        L = [x.strip() for x in blk.split('\n') if x.strip()]
        if not L: continue
        q = re.sub(r'^\d+[.)]\s*', '', L[0]); ans = L[1:5]; c = -1; clean = []
        for i, a in enumerate(ans):
            if re.match(r'^[+*✅]', a) or re.search(r'\*\s*$', a): c = i
            a = re.sub(r'^[A-Da-d][).]\s+', '', a); a = re.sub(r'^[-+*✅•]\s*', '', a); a = re.sub(r'\s*\*\s*$', '', a)
            clean.append(a.strip())
        if len(q) < 5 or len(clean) != 4 or c < 0 or not all(clean): bad += 1; print('⚠️ tushunilmadi:', L[0][:70]); continue
        out.append({'t': q, 'o': [clean[c]] + [a for i, a in enumerate(clean) if i != c], 'c': 0})
    return out, bad

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'list'
    d = load()
    if cmd == 'list':
        print('ver', d['ver'])
        for i, x in enumerate(d['add'], 1): print(f"{i}. [{x.get('tp','')}] {x['t']}\n   ✅ {x['o'][0]} · ✖ {' · '.join(x['o'][1:])}")
        for t in d['del']: print('🗑', t)
    elif cmd == 'add':
        tp = sys.argv[2] if len(sys.argv) > 2 else ''
        qs, bad = parse(sys.stdin.read()); have = {x['t'] for x in d['add']}; n = 0
        for x in qs:
            if x['t'] in have: continue
            x['tp'] = tp; d['add'].append(x); n += 1
            d['del'] = [t for t in d['del'] if t != x['t']]
        print('qo\'shildi:', n, '· tushunilmadi:', bad); save(d)
    elif cmd == 'del':
        ts = [x.strip() for x in sys.stdin.read().split('\n') if x.strip()]
        d['add'] = [x for x in d['add'] if x['t'] not in ts]
        d['del'] = sorted(set(d['del']) | set(ts)); save(d)
