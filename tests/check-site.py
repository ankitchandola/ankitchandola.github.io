from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import re, json, html, struct
root=Path('dist')
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__();self.ids=[];self.refs=[];self.h1=0;self.scripts=0;self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag=='h1':self.h1+=1
  if tag=='script':self.scripts+=1
  if tag in ['a','link'] and 'href' in a:self.refs.append(a['href'])
  if tag in ['script','img'] and 'src' in a:self.refs.append(a['src'])
  if tag=='img' and a.get('src','').startswith('/assets/projects/') and a['src'].endswith('.png'):
   image=root/a['src'].lstrip('/')
   width,height=struct.unpack('>II',image.read_bytes()[16:24])
   assert (a.get('width'),a.get('height'))==(str(width),str(height)),f'{image}: missing or incorrect intrinsic dimensions'
  if tag=='a' and a.get('target')=='_blank':assert 'noopener' in a.get('rel',''),'Missing link safety'
files=list(root.rglob('index.html'))
for file in files:
 text=file.read_text();page=Page(text)
 assert page.h1==1,f'{file}: H1 count {page.h1}'
 assert len(page.ids)==len(set(page.ids)),f'{file}: duplicate ids'
 assert 'Ankit' in text and 'chandolaankit027@gmail.com' in text
 assert '<!--app-html-->' not in text and '<!--home-html-->' not in text
 for ref in page.refs:
  url=urlsplit(ref)
  if url.scheme:continue
  if ref.startswith('#'):assert ref[1:] in page.ids,f'{file}: missing {ref}'
  elif url.path.startswith('/'):
   target=root/url.path.lstrip('/')
   if not target.suffix:target=target/'index.html'
   assert target.is_file(),f'{file}: missing target {ref}'
   if url.fragment:assert url.fragment in Page(target.read_text()).ids,f'{file}: missing cross-route anchor {ref}'
 if 'lite/' in str(file):assert page.scripts==0,'Lite must not load client JS'
 assert 'type="text/javascript" src="http' not in text
home=html.unescape((root/'index.html').read_text())
for project in json.load(open('src/content/projects.json')):assert project['name'] in home,f"Homepage missing project {project['name']}"
for cssfile in (root/'assets').glob('*.css'):
 for asset in re.findall(r'url\([\'"]?([^\)\'\"]+)',cssfile.read_text()):
  if asset.startswith('data:'):continue
  target=root/asset.lstrip('/') if asset.startswith('/') else cssfile.parent/asset
  assert target.is_file(),f'Missing CSS asset {asset}'
def lum(c):
 v=[int(c[i:i+2],16)/255 for i in [1,3,5]];v=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v];return sum(a*b for a,b in zip(v,[.2126,.7152,.0722]))
def ratio(a,b):
 lo,hi=sorted([lum(a),lum(b)]);return (hi+.05)/(lo+.05)
pairs=[('body','#172f31','#f5f2e9'),('muted','#4b6260','#fffdf7'),('teal title','#245e58','#f5f2e9'),('primary button','#fffdf7','#245e58'),('status text','#3a4c30','#e5e9d9'),('late status','#7c361f','#f7e9d8'),('tags','#172f31','#ebece1'),('contact accent','#f4c7a4','#245e58'),('scope numbers','#245e58','#dce9dd'),('case link','#172f31','#f2d9c0'),('disabled text','#55584d','#e3e3d7'),('dark body','#f1f2e9','#101e20'),('dark secondary','#b7c8c2','#182a2d'),('dark accent','#9ad9c7','#101e20'),('dark CTA','#102b27','#9ad9c7'),('dark delayed','#efb98e','#493a2f'),('dark KPI','#9ad9c7','#43372d'),('dark KPI label','#b7c8c2','#43372d'),('dark disabled','#bec9c4','#33423e')]
for name,a,b in pairs:assert ratio(a,b)>=4.5,f'{name}: contrast {ratio(a,b):.2f}'
graphics=[('puzzle beam','#245e58','#fffdf7'),('puzzle wall','#4b6260','#fffdf7'),('puzzle mirror','#172f31','#fffdf7'),('puzzle target ring','#86532b','#fffdf7'),('puzzle loop dashes','#fffdf7','#245e58'),('dark puzzle beam','#9ad9c7','#182a2d'),('dark puzzle wall','#8aa39c','#182a2d'),('dark puzzle mirror','#f1f2e9','#182a2d'),('dark puzzle target','#efb98e','#182a2d'),('dark puzzle loop dashes','#182a2d','#9ad9c7'),('table grid','#4b6260','#fffdf7'),('dark table grid','#8aa39c','#182a2d')]
for name,a,b in graphics:assert ratio(a,b)>=3,f'{name}: contrast {ratio(a,b):.2f}'
print(f'PASS: {len(files)} prerendered pages, links/assets, one H1 per route, no duplicate ids, and script-free lite route.')
print(f'PASS: {len(graphics)} puzzle graphic pairs >=3:1; lowest {min(ratio(a,b) for _,a,b in graphics):.2f}:1.')
print(f'PASS: {len(pairs)} principal text colour pairs >=4.5:1; lowest {min(ratio(a,b) for _,a,b in pairs):.2f}:1.')
