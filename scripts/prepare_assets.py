"""Slice the supplied transparent sprite sheets; original artwork is untouched."""
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[1]
out = root / 'public' / 'assets'
out.mkdir(parents=True, exist_ok=True)
def cut(sheet, name, box, width=None):
    p = next((root / 'UI素材包').glob(sheet + '_*.png'))
    im = Image.open(p).crop(box)
    bounds = im.getbbox()
    if bounds: im = im.crop(bounds)
    if width and im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.Resampling.LANCZOS)
    im.save(out / (name + '.webp'), 'WEBP', quality=90, method=6)
cut('01','logo',(20,320,1440,860),800)
cut('02','city',(0,80,1560,410),1560)
cut('02','railing',(0,470,1425,680),1200)
cut('02','traveler',(1450,410,1665,675),240)
cut('03','cat',(700,350,1080,570),220)
cut('03','lamp',(1170,40,1400,580),130)
cut('03','signpost-complete',(80,15,675,700),260)
cut('04','shop',(0,450,815,1060),500)
cut('05','quest',(340,235,610,555),100)
cut('05','world',(605,245,890,555),100)
cut('05','settings',(900,630,1180,910),100)
cut('06','nightcat',(405,560,840,1040),250)
for name,box in {'courage':(65,35,490,395),'kindness':(515,45,925,385),'explore':(965,35,1400,390),'perception':(65,400,490,735),'bond':(500,395,950,735),'dignity':(965,395,1400,735),'imagination':(65,740,500,1070),'vitality':(510,740,950,1070),'luck':(965,740,1410,1070)}.items():
    cut('07',name,box,140)
cut('08','plant',(1030,440,1360,760),160)
print('Prepared',len(list(out.glob('*.webp'))),'sprites')
