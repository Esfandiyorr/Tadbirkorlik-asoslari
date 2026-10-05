/* Avatar generatori testlari:  node _reyting-manba/avatar_test.js */
var AVX=require("./avatar_lib.js"), fails=0, n=0;
function ck(name,c,x){ n++; if(!c){ fails++; console.log("FAIL "+name+(x!==undefined?"  "+x:"")); } else console.log("OK   "+name+(x!==undefined?"  "+x:"")); }
var L=AVX.layers;
/* 1. bir xil seed -> bir xil natija */
var same=true; for(var i=0;i<500;i++){ var s="id-"+i; if(AVX.enc(AVX.gen(s))!==AVX.enc(AVX.gen(s))) same=false; }
ck("bir xil seed doim bir xil avatar beradi (500 seed)",same);
ck("bir xil seed bir xil SVG beradi",AVX.svg(AVX.gen("abc"),{uid:"t"})===AVX.svg(AVX.gen("abc"),{uid:"t"}));
/* 2. turli seed -> turli avatar */
var set={}; for(i=0;i<2000;i++) set[AVX.enc(AVX.gen("talaba"+i))]=1;
var uniq=Object.keys(set).length; ck("2000 ta turli ID -> takrorlanmas avatarlar",uniq>=1995,uniq+" / 2000");
/* 3. qatlamlar va kombinatsiyalar */
var minN=99,total=1; L.forEach(function(l){ minN=Math.min(minN,l.n); total*=l.n; });
ck("har bir qatlamda kamida 8 variant",minN>=8,"min="+minN);
ck("umumiy kombinatsiyalar milliondan ko'p",total>1e6,total.toExponential(2));
/* 4. mos kelmaydigan kombinatsiyalar chiqmaydi */
var bad=0, TALL={7:1,12:1,5:1}, TOP={1:1,3:1,4:1,5:1,6:1,7:1,9:1};
function rules(c){
  if(c.hw===2&&(c.h!==0||c.er!==0||c.fh!==0)) return "ro'mol bilan soch/sirg'a/soqol";
  if(TOP[c.hw]&&TALL[c.h]) return "bosh kiyim + baland soch";
  if(c.hw===8&&c.er) return "quloqchin + sirg'a";
  return "";
}
var r=Math.random, why={};
for(i=0;i<20000;i++){ var raw={}; L.forEach(function(l){ raw[l.k]=Math.floor(r()*l.n); }); var f=AVX.fix(raw), w=rules(f); if(w){ bad++; why[w]=1; } }
ck("20000 ta tasodifiy konfiguratsiya: qoidaga zid juftlik yo'q",bad===0,Object.keys(why).join(","));
var gbad=0; for(i=0;i<3000;i++){ var g=AVX.gen("u"+i); if(rules(g)||!AVX.ok(g)) gbad++; }
ck("generator natijalari qoidalarga mos (3000)",gbad===0,gbad);
ck("fix ikki marta qo'llansa o'zgarmaydi",(function(){ for(var i=0;i<2000;i++){ var raw={}; L.forEach(function(l){ raw[l.k]=Math.floor(r()*l.n); }); var a=AVX.fix(raw); if(AVX.enc(AVX.fix(a))!==AVX.enc(a)) return false; } return true; })());
/* 5. ranglar: fon teri bilan, kiyim fon bilan qo'shilib ketmasin */
var P=AVX.palettes;
function lum(hex){ var n=parseInt(hex.slice(1),16); function c(v){ v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4); } return .2126*c(n>>16)+.7152*c((n>>8)&255)+.0722*c(n&255); }
var clash=0; for(i=0;i<3000;i++){ var c=AVX.gen("c"+i); if(P.cloth[c.cc]===P.bg[c.bg][0]||P.cloth[c.cc]===P.bg[c.bg][1]) clash++; }
ck("kiyim rangi fon rangi bilan bir xil emas",clash===0,clash);
/* 6. kodlash */
var rt=true; for(i=0;i<1000;i++){ var c2=AVX.gen("e"+i), e=AVX.enc(c2), d=AVX.dec(e); if(!d||AVX.enc(d)!==e) rt=false; }
ck("kodlash/ochish to'g'ri (1000)",rt);
ck("kod ixcham: 18 belgi",AVX.enc(AVX.gen("x")).length===18,AVX.enc(AVX.gen("x")));
ck("buzuq kod rad etiladi",AVX.dec("2zzzzzzzzzzzzzzzzz")===null&&AVX.dec("hello")===null&&AVX.dec("")===null&&AVX.dec("1abc")===null);
ck("eski (1-versiya) avatar o'qiladi",!!AVX.dec({sk:3,h:5,hc:2,hw:1,c:5,cc:3}));
ck("bo'sh qiymatda seed bo'yicha avatar",AVX.enc(AVX.resolve(null,"id7"))===AVX.enc(AVX.gen("id7")));
/* 7. SVG to'g'riligi: har bir qatlamning har bir varianti */
var broken=0;
L.forEach(function(l){ for(var v=0;v<l.n;v++){ var b=AVX.gen("base"+v); b[l.k]=v; [0,1,2].forEach(function(lod){
  var s=AVX.svg(b,{lod:lod,uid:"q"}); if(/undefined|NaN|null/.test(s)||!/^<svg[\s\S]*<\/svg>$/.test(s)) broken++; }); } });
ck("barcha variantlar barcha detallik darajasida xatosiz chiziladi",broken===0,broken);
var big=AVX.svg(AVX.gen("z"),{lod:2}).length, small=AVX.svg(AVX.gen("z"),{lod:0}).length;
ck("kichik o'lchamda detallar soddalashadi",small<big,small+" < "+big);
ck("HTML komponent: alt matn va zaxira",/role="img"/.test(AVX.html("2zz",{name:"Ali Valiyev",seed:"q"}))&&/aria-label="Ali Valiyev/.test(AVX.html(null,{name:"Ali Valiyev",seed:"q"})));
/* 8. familiyadan jins taxmini — avtomatik avatar mos chiqadi */
ck("familiya bo'yicha taxmin",AVX.hint("Ali Valiyev")==="m"&&AVX.hint("Malika Karimova")==="f"&&AVX.hint("Toʻrayeva Marjona")==="f"&&AVX.hint("Dildora Normo'minova")==="f"&&AVX.hint("Test")==="");
var mh=0,fb=0; for(i=0;i<2000;i++){ var gm=AVX.gen("m"+i,"m"), gf=AVX.gen("f"+i,"f"); if(gm.hw===2||gm.er>0&&false) mh++; if(gf.fh>0) fb++; }
ck("yigitlarga ro'mol, qizlarga soqol tushmaydi",mh===0&&fb===0,mh+"/"+fb);
console.log("FAILS: "+fails+" / "+n);
process.exit(fails?1:0);
