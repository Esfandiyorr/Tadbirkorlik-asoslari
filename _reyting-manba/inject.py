# -*- coding: utf-8 -*-
"""Taqdimotlarga reyting tizimini o'rnatadi (qayta-qayta ishlata olinadi)."""
import re,sys,json,os,hashlib
BASE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'   # repo ildizi (qayerda turmasin)
SC=BASE+'_reyting-manba/'
CSS=open(SC+'engine_css.txt',encoding='utf-8').read()
JS=open(SC+'engine_js.txt',encoding='utf-8').read()
MCSS=open(SC+'music_css.txt',encoding='utf-8').read()
MJS=open(SC+'music_js.txt',encoding='utf-8').read()
CCSS=open(SC+'chat_css.txt',encoding='utf-8').read()
CJS=open(SC+'chat_js.txt',encoding='utf-8').read()
CONF=json.load(open(SC+'config.json',encoding='utf-8'))
AVX=open(SC+'avatar_pic.js',encoding='utf-8').read()   # umumiy avatar moduli (tayyor rasmlar)
YZB=open(SC+'yozuv_ball.js',encoding='utf-8').read()   # Yozuv Marafoni natija hisobi (arena bilan bir xil)
JS=JS.replace('/*@YZBALL@*/',YZB.strip())

DECKS={
 'index.html':   dict(id='',home='portal',slides=0,quiz=0),  # 🌐 portal: sayt haqida va fanlar ro'yxati
 'tadbirkorlik-asoslari.html': dict(id='',home='course',slides=0,quiz=0),   # 🏠 fan sahifasi (mavzular ro'yxati)
 'mavzu-1.html': dict(id='m1',slides=18,quiz=15),
 'mavzu-2.html': dict(id='m2',slides=24,quiz=15),
 'mavzu-3.html': dict(id='m3',slides=15,quiz=15),
 'mavzu-4.html': dict(id='m4',slides=18,quiz=18),
 'mavzu-5.html': dict(id='m5',slides=18,quiz=3),
 'mavzu-6.html': dict(id='m6',slides=18,quiz=15),
 'mavzu-7.html': dict(id='m7',slides=18,quiz=15),
 'mavzu-8.html': dict(id='m8',slides=18,quiz=15),
 'mavzu-9.html': dict(id='m9',slides=18,quiz=15),
 'mavzu-10.html': dict(id='m10',slides=18,quiz=15),
 'mavzu-11.html': dict(id='m11',slides=18,quiz=15),
 'mavzu-12.html': dict(id='m12',slides=18,quiz=15),
 'mavzu-13.html': dict(id='m13',slides=18,quiz=15),
 'mavzu-14.html': dict(id='m14',slides=18,quiz=15),
 'mavzu-15.html': dict(id='m15',slides=18,quiz=15),
}
B,E='/* RT:BEGIN */','/* RT:END */'
PB,PE='<!-- PWA:BEGIN -->','<!-- PWA:END -->'
PWA=(PB+'\n<link rel="manifest" href="manifest.webmanifest">\n'
     '<meta name="theme-color" content="#0a3605">\n'
     '<link rel="apple-touch-icon" href="fayllar/ilova/icon-180.png">\n'
     '<meta name="mobile-web-app-capable" content="yes">\n'
     '<meta name="apple-mobile-web-app-capable" content="yes">\n'
     '<meta name="apple-mobile-web-app-title" content="TerDU Biznes">\n'
     '<meta name="apple-mobile-web-app-status-bar-style" content="default">\n'
     '<script src="pwa.js" defer></script>\n'+PE+'\n')

# 🔗 havola (Telegram, WhatsApp, Facebook …) ga yuborilganda chiqadigan nom va rasm: nom — «IsfandiyorSayfiddinov»,
# rasm — TerDU gerbi + Isfandiyor Sayfiddinov (fayllar/havola-isfandiyor.jpg, _reyting-manba/logo/ da yaratiladi)
OB,OE='<!-- OG:BEGIN -->','<!-- OG:END -->'
SITE=CONF.get('siteUrl','https://esfandiyorr.github.io/Tadbirkorlik-asoslari/').rstrip('/')+'/'
LINK=CONF.get('linkName','IsfandiyorSayfiddinov')
def _esc(t): return t.replace('&','&amp;').replace('"','&quot;').replace('<','&lt;')
def og(s,file,desc):
    """sahifa <head> iga og:/twitter: teglar (qayta ishlatilsa almashtiriladi); rasm manzili — fayl izi bilan (yangilansa kesh yangilanadi)"""
    while OB in s and OE in s:
        i=s.index(OB); j=s.index(OE)+len(OE)
        if s[j:j+1]=='\n': j+=1
        s=s[:i]+s[j:]
    img=BASE+'fayllar/havola-isfandiyor.jpg'
    v=hashlib.md5(open(img,'rb').read()).hexdigest()[:8] if os.path.exists(img) else '1'
    iu=SITE+'fayllar/havola-isfandiyor.jpg?v='+v
    url=SITE if file=='index.html' else SITE+file
    d=_esc(desc); n=_esc(LINK)
    blk=(OB+'\n<meta name="author" content="Isfandiyor Sayfiddinov">\n'
      '<meta property="og:type" content="website">\n<meta property="og:site_name" content="'+n+'">\n<meta property="og:title" content="'+n+'">\n'
      '<meta property="og:description" content="'+d+'">\n<meta property="og:url" content="'+url+'">\n<meta property="og:locale" content="uz_UZ">\n'
      '<meta property="og:image" content="'+iu+'">\n<meta property="og:image:type" content="image/jpeg">\n<meta property="og:image:width" content="1200">\n'
      '<meta property="og:image:height" content="630">\n<meta property="og:image:alt" content="TerDU logotipi va Isfandiyor Sayfiddinov">\n'
      '<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="'+n+'">\n'
      '<meta name="twitter:description" content="'+d+'">\n<meta name="twitter:image" content="'+iu+'">\n'+OE+'\n')
    i=s.index('</head>')
    return s[:i]+blk+s[i:]
def topic_desc(meta):
    if meta.get('home')=='portal': return "Termiz davlat universiteti interaktiv o'quv platformasi: fanlar bo'yicha taqdimotlar, testlar va reyting — qiziqqan har kim o'qiy oladi · Fan: Tadbirkorlik asoslari"
    if meta.get('home'): return "Tadbirkorlik asoslari fani: 15 ta interaktiv mavzu, testlar, reyting va o'yin arenasi · Termiz davlat universiteti"
    for i,t in enumerate(CONF['topics']):
        if t['id']==meta['id']:
            return "%d-mavzu: %s · Tadbirkorlik asoslari · TerDU"%(i+1,re.sub(r'^M\d+\s*·\s*','',t.get('title','')))
    return "Tadbirkorlik asoslari · TerDU"

def pwa(s):
    """telefon ilovasi (PWA): manifest, belgilar va pwa.js — </head> dan oldin, qayta ishlatilsa almashtiriladi"""
    while PB in s and PE in s:
        i=s.index(PB); j=s.index(PE)+len(PE)
        if s[j:j+1]=='\n': j+=1
        s=s[:i]+s[j:]
    i=s.index('</head>')
    return s[:i]+PWA+s[i:]
HB,HE='<!-- RT:BEGIN -->','<!-- RT:END -->'

# ⚡ umumiy kod barcha taqdimotlarda bir xil — har biriga ichiga yozilmaydi, bitta faylda turadi va brauzer/ilova
# uni bir marta yuklab, keyingi mavzularda xotiradan oladi. ?v=<iz> — fayl o'zgarsa manzil ham o'zgaradi (eski nusxa qolmaydi)
SHARED_HEAD='/* AVTOMATIK YARATILGAN FAYL — tahrirlamang. Manba: _reyting-manba/ (inject.py) */\n'
def shared():
    mods=[AVX,JS,MJS,CJS]          # har bir modul alohida himoyalangan: birida xato bo'lsa, qolganlari ishlayveradi
    js=SHARED_HEAD+"\n".join('try{\n'+m.strip()+'\n}catch(e){ if(window.console) console.error("rt-engine:",e); }' for m in mods)+"\n"
    css=SHARED_HEAD+CSS.strip()+"\n"+MCSS.strip()+"\n"+CCSS.strip()+"\n"
    out={}
    for fn,txt in (('rt-engine.js',js),('rt-engine.css',css)):
        open(BASE+fn,'w',encoding='utf-8').write(txt)
        out[fn]=hashlib.md5(txt.encode('utf-8')).hexdigest()[:10]
    return out
VER=None

def strip(s,b,e):
    while b in s and e in s:
        i=s.index(b); j=s.index(e)+len(e)
        if s[j:j+1]=='\n': j+=1          # blok bilan qo'shilgan qator oxiri ham olinadi — qayta ishlatganda bo'sh qatorlar ko'paymaydi
        s=s[:i]+s[j:]
    return s

def inject(fn,meta):
    p=BASE+fn
    if not os.path.exists(p): return fn+": yo'q"
    s=open(p,encoding='utf-8').read()
    s=strip(s,B,E); s=strip(s,HB,HE)
    s=pwa(s)
    s=og(s,fn,topic_desc(meta))

    # --- CSS: umumiy fayl, taqdimotning o'z uslublaridan keyin (avvalgi tartib saqlanadi) ---
    s=s.replace('@media print{', B+'\n</style>\n<link rel="stylesheet" href="rt-engine.css?v='+VER['rt-engine.css']+'">\n<style>\n'+E+"\n@media print{",1)
    # --- logo: har sahifaga 71 KB matn bo'lib yozilmasin — umumiy rasm fayli (bir marta yuklanadi) ---
    s=re.sub(r'(\.terdu-logo\{background-image:url\()"data:image/png;base64,[A-Za-z0-9+/=]+"\)',r'\1"logo_tersu.png")',s,count=1)

    # --- topbar havolalarini olib tashlash (yopiq mavzular 404 bermasin) ---
    s=re.sub(r'      <a class="btn ghost" href="[^"]+" title="[^"]+">📑 M\d</a>\n','',s)

    # --- konfiguratsiya + dvigatel ---
    fbWeb=CONF.get('fbWeb') or {}
    teacherH=CONF.get('teacherH','')
    google=bool(fbWeb.get('apiKey') and fbWeb.get('authDomain') and teacherH)
    cfg=dict(topic=meta['id'],home=meta.get('home') or '',slides=meta['slides'],quiz=meta.get('quiz',15),pSlide=CONF['pSlide'],pAll=CONF['pAll'],
             # Google orqali kirish yoqilgan bo'lsa, parol sahifaga umuman yozilmaydi
             teacher='' if google else CONF.get('teacher',''),
             firebase=CONF.get('firebase'),topics=CONF['topics'],
             teacherTg=CONF.get('teacherTg',''),teacherName=CONF.get('teacherName',''),reopen=CONF.get('reopen',{}),pwaMsg=CONF.get('pwaMsg',''),courses=CONF.get('courses',[]),groups=CONF.get('groups',[]),groupRenames=CONF.get('groupRenames',{}),hideRating=CONF.get('hideRating',[]),
             tracks=CONF.get('tracks',[]),fbWeb=fbWeb if google else None,teacherH=teacherH if google else '')
    block=(HB+'\n<script>var RT_CFG='+json.dumps(cfg,ensure_ascii=False)+';</script>\n'
           '<script src="rt-engine.js?v='+VER['rt-engine.js']+'"></script>\n'+HE+'\n')
    i=s.rindex('<script>')          # taqdimotning asosiy skripti
    s=s[:i]+block+s[i:]

    # --- chuqur havola: #5 -> 5-slayd ---
    if 'RT_HASH' not in s:
        s=re.sub(r'(  try\{localStorage\.setItem\("terdu_[a-z0-9_]*slide",n\)\}catch\(e\)\{\})',
                 r'\1\n  try{history.replaceState(null,"","#"+(n+1));}catch(e){} /* RT_HASH */', s, count=1)
        s=re.sub(r'  var sv=parseInt\(localStorage\.getItem\("(terdu_[a-z0-9_]*slide)"\),10\);\n  go\(isNaN\(sv\)\?0:sv\);',
                 lambda m: ('  var hv=parseInt((location.hash||"").replace(/[^0-9]/g,""),10);\n'
                            '  var sv=isNaN(hv)?parseInt(localStorage.getItem("%s"),10):(hv-1);\n'
                            '  go(isNaN(sv)?0:sv);\n'
                            '  window.addEventListener("hashchange",function(){\n'
                            '    var h=parseInt((location.hash||"").replace(/[^0-9]/g,""),10);\n'
                            '    if(!isNaN(h)&&h-1!==idx) go(h-1);\n'
                            '  });')%m.group(1), s, count=1)

    # --- ballar uchun ilgaklar ---
    if 'if(window.RT) RT.slideSeen(n);' not in s:
        s=s.replace('  try{localStorage.setItem("terdu_','  if(window.RT) RT.slideSeen(n);\n  try{localStorage.setItem("terdu_',1)
    # test (m1,m2,m3)
    if 'var ok=(ai===QQ[qi].c);' in s and 'RT.award("test"' not in s:
        s=s.replace('  var ok=(ai===QQ[qi].c);','  var ok=(ai===QQ[qi].c);\n  if(ok&&window.RT) RT.award("test"+qi,5,"test");',1)
    # krossvord (m4)
    if 'function xwStatus(){' in s and 'RT.award("xw"' not in s:
        s=s.replace('    var s=xwSolved(w); if(s) done++;',
                    '    var s=xwSolved(w); if(s){ done++; if(window.RT) RT.award("xw"+i,4,"krossvord"); }',1)
        s=s.replace('  document.getElementById("xwDone").textContent=done;',
                    '  document.getElementById("xwDone").textContent=done;\n'
                    '  if(window.RT && done===XWords().length) RT.award("xwAll",15,"krossvord to\'liq");',1)
    # masalalar (m5)
    if 'd.dataset.state=ok?"ok":"no";' in s and 'RT.award("task"' not in s:
        s=s.replace('      d.dataset.state=ok?"ok":"no";',
                    '      d.dataset.state=ok?"ok":"no";\n      if(ok&&window.RT) RT.award("task"+k,15,"masala");',1)
    open(p,'w',encoding='utf-8').write(s)
    return "%s: OK (%s)"%(fn,"portal" if meta.get('home')=='portal' else "fan sahifasi") if meta.get('home') else "%s: OK (%s, %d slayd)"%(fn,meta['id'],meta['slides'])

BLOCKS=[('/* AVX:BEGIN */','/* AVX:END */','avatar_pic.js'),('/* KV:BEGIN */','/* KV:END */','krossvord.js'),
        ('/* YZT:BEGIN */','/* YZT:END */','yozuv_matnlar.json'),('/* YZB:BEGIN */','/* YZB:END */','yozuv_ball.js'),
        ('/* YZ:BEGIN */','/* YZ:END */','yozuv.js')]
def yz_texts():
    """Yozuv Marafoni matnlari: arena uchun JS o'zgaruvchi, o'qituvchi paneli uchun fayllar/yozuv-matnlar.json"""
    j=json.load(open(SC+'yozuv_matnlar.json',encoding='utf-8'))
    os.makedirs(BASE+'fayllar',exist_ok=True)
    open(BASE+'fayllar/yozuv-matnlar.json','w',encoding='utf-8').write(json.dumps(j,ensure_ascii=False,separators=(',',':')))
    return "var YZ_TEXTS="+json.dumps(j,ensure_ascii=False,separators=(',',':'))+";"
def inject_arena():
    """arena.html ga umumiy modullar: avatar (AVP), krossvord (KV), Yozuv Marafoni (YZT, YZB, YZ) - alohida <script> bloklari"""
    p=BASE+'arena.html'
    if not os.path.exists(p): return "arena.html: yo'q"
    s=pwa(open(p,encoding='utf-8').read())
    s=og(s,'arena.html',"O'yin arenasi: krossvord, jonli test va Yozuv Marafoni — guruhdoshlar bilan musobaqa · TerDU")
    for b,e,fn in BLOCKS:
        src=yz_texts() if fn.endswith('.json') else open(SC+fn,encoding='utf-8').read().strip()
        blk=b+"\n"+src+"\n"+e
        if b in s and e in s:
            i=s.index(b); j=s.index(e)+len(e); s=s[:i]+blk+s[j:]
        else:
            i=s.index('<script>'); s=s[:i]+'<script>'+blk+'</script>'+"\n"+s[i:]
    open(p,'w',encoding='utf-8').write(s)
    return "arena.html: OK (avatar + krossvord + yozuv marafoni)"

if __name__=="__main__":
    VER=shared(); print("rt-engine.js / rt-engine.css:",VER)
    for fn,meta in DECKS.items(): print(inject(fn,meta))
    print(inject_arena())
