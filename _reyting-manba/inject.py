# -*- coding: utf-8 -*-
"""Taqdimotlarga reyting tizimini o'rnatadi (qayta-qayta ishlata olinadi)."""
import re,sys,json,os
BASE='/home/user/Tadbirkorlik-asoslari/'
SC=BASE+'_reyting-manba/'
CSS=open(SC+'engine_css.txt',encoding='utf-8').read()
JS=open(SC+'engine_js.txt',encoding='utf-8').read()
MCSS=open(SC+'music_css.txt',encoding='utf-8').read()
MJS=open(SC+'music_js.txt',encoding='utf-8').read()
CCSS=open(SC+'chat_css.txt',encoding='utf-8').read()
CJS=open(SC+'chat_js.txt',encoding='utf-8').read()
CONF=json.load(open(SC+'config.json',encoding='utf-8'))

DECKS={
 'index.html':   dict(id='m1',slides=18,quiz=15),
 'mavzu-2.html': dict(id='m2',slides=18,quiz=15),
 'mavzu-3.html': dict(id='m3',slides=15,quiz=15),
 'mavzu-4.html': dict(id='m4',slides=18,quiz=15),
 'mavzu-5.html': dict(id='m5',slides=18,quiz=15),
 'mavzu-6.html': dict(id='m6',slides=18,quiz=15),
 'mavzu-7.html': dict(id='m7',slides=18,quiz=15),
}
B,E='/* RT:BEGIN */','/* RT:END */'
HB,HE='<!-- RT:BEGIN -->','<!-- RT:END -->'

def strip(s,b,e):
    while b in s and e in s:
        i=s.index(b); j=s.index(e)+len(e)
        s=s[:i]+s[j:]
    return s

def inject(fn,meta):
    p=BASE+fn
    if not os.path.exists(p): return fn+": yo'q"
    s=open(p,encoding='utf-8').read()
    s=strip(s,B,E); s=strip(s,HB,HE)

    # --- CSS ---
    s=s.replace('@media print{', B+"\n"+CSS.strip()+"\n"+MCSS.strip()+"\n"+CCSS.strip()+"\n"+E+"\n@media print{",1)

    # --- topbar havolalarini olib tashlash (yopiq mavzular 404 bermasin) ---
    s=re.sub(r'      <a class="btn ghost" href="[^"]+" title="[^"]+">📑 M\d</a>\n','',s)

    # --- konfiguratsiya + dvigatel ---
    cfg=dict(topic=meta['id'],slides=meta['slides'],quiz=meta.get('quiz',15),pSlide=CONF['pSlide'],pAll=CONF['pAll'],
             teacher=CONF['teacher'],firebase=CONF.get('firebase'),topics=CONF['topics'],
             teacherTg=CONF.get('teacherTg',''),courses=CONF.get('courses',[]),groups=CONF.get('groups',[]),
             tracks=CONF.get('tracks',[]))
    block=(HB+'\n<script>var RT_CFG='+json.dumps(cfg,ensure_ascii=False)+';</script>\n'
           '<script>\n'+JS.strip()+'\n</script>\n'
           '<script>\n'+MJS.strip()+'\n</script>\n'
           '<script>\n'+CJS.strip()+'\n</script>\n'+HE+'\n')
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
    return "%s: OK (%s, %d slayd)"%(fn,meta['id'],meta['slides'])

if __name__=="__main__":
    for fn,meta in DECKS.items(): print(inject(fn,meta))
