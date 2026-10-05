import pymupdf as f, sys, glob
src,out,title=sys.argv[1],sys.argv[2],sys.argv[3]
d=f.open()
for p in sorted(glob.glob(src+"/*.jpg")):
    im=f.open(p); r=im[0].rect; w=1280; h=r.height*1280/r.width
    pg=d.new_page(width=w,height=h); pg.insert_image(pg.rect,filename=p)
d.set_metadata({"title":title,"author":"Sayfiddinov Isfandiyor \u00b7 Termiz davlat universiteti","subject":"Tadbirkorlik asoslari"})
d.save(out,garbage=4,deflate=True); print(out,d.page_count,"bet")
