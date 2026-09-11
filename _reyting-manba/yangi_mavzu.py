# -*- coding: utf-8 -*-
"""Yangi mavzu taqdimotini tayyorlaydi: SHABLON faylidagi barcha funksiyalar
(reyting, chat, musiqa, uz/eng, test dvigateli, tun/kun) o'z holicha qoladi —
faqat slaydlar matni, test savollari va EN lug'ati almashtiriladi.

Ishlatish:
  1) mavzu_<N>_matn.py faylida S (slaydlar) va Q (savollar) ni tayyorlang,
     T(uz,en) yordamchisi bilan har bir matnni ro'yxatga qo'shing.
  2) python3 _reyting-manba/yangi_mavzu.py mavzu_<N>_matn.py mavzu-<N>.html "Sarlavha" N
  3) config.json ga mavzuni qo'shing va python3 _reyting-manba/inject.py ni ishga tushiring.
"""
import json,re,sys,os
BASE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
SHABLON=BASE+'mavzu-3.html'          # test dvigateli bor namuna (15 savol)

def yig(matn_fayl,chiqish,sarlavha,raqam,tavsif=""):
    ns={'UZ':[],'EN':[],'S':[]}
    def T(uz,en): ns['UZ'].append(uz); ns['EN'].append(en); return len(ns['UZ'])-1
    def d(uz,en): return 'data-i="%d"'%T(uz,en)
    def slide(t,te,body): ns['S'].append('  <section class="slide" data-title="%s" data-title-en="%s">\n    <div class="inner">\n%s\n    </div>\n  </section>'%(t,te,body))
    ns.update(T=T,d=d,slide=slide)
    exec(open(matn_fayl,encoding='utf-8').read(),ns)
    S,UZ,EN,Q=ns['S'],ns['UZ'],ns['EN'],ns['Q']

    s=open(SHABLON,encoding='utf-8').read()
    for b,e in [('<!-- RT:BEGIN -->','<!-- RT:END -->'),('/* RT:BEGIN */','/* RT:END */')]:
        if b in s: i=s.index(b); j=s.index(e)+len(e); s=s[:i]+s[j:]
    s=re.sub(r'<title>.*?</title>','<title>%s — TerDU</title>'%sarlavha,s,count=1,flags=re.S)
    if tavsif: s=re.sub(r'(<meta name="description" content=")[^"]*(")',r'\1%s\2'%tavsif,s,count=1)
    s=re.sub(r'(<span data-ui="subj">)[^<]*(</span>)',r'\1Tadbirkorlik asoslari · M%d-mavzu\2'%raqam,s,count=1)
    s=re.sub(r' subj:\[[^\]]*\]',' subj:["Tadbirkorlik asoslari · M%d-mavzu", "Fundamentals of Entrepreneurship · Topic %d"]'%(raqam,raqam),s,count=1)
    a=s.index('  <section class="slide"'); b=s.index('  </main>')
    s=s[:a]+"\n\n".join(S)+"\n\n"+s[b:]
    q="var Q=[\n"+",\n".join(' {q:%s,\n  a:[%s],c:%d,\n  e:%s}'%(
        json.dumps(it['q'],ensure_ascii=False),
        ",\n     ".join(json.dumps(x,ensure_ascii=False) for x in it['a']),
        it['c'],json.dumps(it['e'],ensure_ascii=False)) for it in Q)+"\n];"
    i=s.index('var Q=['); j=s.index('var picked=new Array'); s=s[:i]+q+"\n"+s[j:]
    s=almash(s,'var EN',json.dumps({str(k):v for k,v in enumerate(EN)},ensure_ascii=False))
    s=almash(s,'var QEN',json.dumps([{"q":x['qe'],"a":x['ae'],"c":x['c'],"e":x['ee']} for x in Q],ensure_ascii=False))
    open(chiqish,'w',encoding='utf-8').write(s)
    return "%s: %d slayd · %d savol · %d matn"%(os.path.basename(chiqish),len(S),len(Q),len(UZ))

def almash(src,nom,yangi):
    """nom=<{...}> yoki nom=<[...]> qiymatini qavslarni sanab almashtiradi."""
    i=src.index(nom); k=src.index('=',i)+1
    op=src[k]; cl={'{':'}','[':']'}[op]; d=0; m=k; q=None
    while True:
        c=src[m]
        if q:
            if c=='\\': m+=2; continue
            if c==q: q=None
        elif c in '"\'': q=c
        elif c==op: d+=1
        elif c==cl:
            d-=1
            if d==0: break
        m+=1
    end=m+1
    while end<len(src) and src[end] in ' ;': end+=1
    return src[:i]+nom+"="+yangi+";\n"+src[end:]

def tekshir(Q,chek=4):
    """Test variantlari uzunligi bir xilligini tekshiradi."""
    xato=[]
    for i,x in enumerate(Q,1):
        for k,nom in (('a','uz'),('ae','en')):
            L=[len(v) for v in x[k]]
            if max(L)-min(L)>chek: xato.append((i,nom,L))
    return xato

if __name__=="__main__":
    print(yig(sys.argv[1],BASE+sys.argv[2],sys.argv[3],int(sys.argv[4]),
              sys.argv[5] if len(sys.argv)>5 else ""))
