"""Self-contained full archive review using actual company and reader code."""
from pathlib import Path
import argparse
import ast
import base64
import gzip
import io
import json
import re
from PIL import Image
from reading_layout import reader_shell

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--group',type=int,choices=[1,2,3],default=1);args=parser.parse_args()
archives=json.loads((ROOT/'content/archives.json').read_text())
layouts=json.loads((ROOT/'content/reading-layouts.json').read_text())['documents']
documents=json.loads((ROOT/'js/research-data.js').read_text().removeprefix('window.researchDocuments = ').strip().removesuffix(';'))
if args.group:
    selected=[c['id'] for c in archives['companies'] if c.get('profile')][(args.group-1)*4:args.group*4]
    archives['companies']=[c for c in archives['companies'] if c['id'] in selected]
    layouts=[d for d in layouts if d['ticker'] in selected or (d['kind']=='concept' and any(t in selected for t in d.get('relatedTickers',[])))]
    ids={d['id'] for d in layouts}
    documents=[d for d in documents if d['id'] in ids]
for d in documents:d['text']=''
needed={'/images/research/technology-hero.webp'}
for c in archives['companies']:
    if c.get('profile'):
        needed.update('/images/research/'+c['profile'][key] for key in ['hero','logo'])
for d in layouts:
    for p in d['parts']:needed.update(re.findall(r'<img[^>]+src="([^"]+)"',p['html']))
assets={}
for url in sorted(needed):
    file=ROOT/url.lstrip('/')
    if file.suffix=='.svg':value='data:image/svg+xml;base64,'+base64.b64encode(file.read_bytes()).decode()
    else:
        image=Image.open(file);image.thumbnail((350,250));out=io.BytesIO();image.save(out,format='WEBP',quality=42);value='data:image/webp;base64,'+base64.b64encode(out.getvalue()).decode()
    assets[url]=value
def body(path):
    s=(ROOT/path).read_text();s=re.search(r'<body[^>]*>(.*?)</body>',s,re.S)[1]
    s=re.sub(r'<script\b[^>]*>.*?</script>','',s,flags=re.S)
    return re.sub(r'<svg\b.*?</svg>','<i data-lucide="search" aria-hidden="true"></i>',s,flags=re.S)
company=body('research/mu/index.html').replace('data-company="MU"','data-company="__COMPANY__"')
shell=reader_shell(dict(layouts[0],parts=[]),'')
data={'archives':archives,'layouts':layouts,'documents':documents,'assets':assets,
      'directory':body('index.html'),'companyShell':company,'readerShell':shell}
def scoped_selectors(prelude):
    selectors = []
    for sel in prelude.split(','):
        sel = sel.strip()
        if not sel:
            continue
        if sel.startswith(':root'):
            sel = sel.replace(':root', '#xyan-branch-preview', 1)
        elif re.match('^(body|html)\\b', sel):
            sel = re.sub('^(body|html)\\b', '#xyan-branch-preview', sel)
        elif sel.startswith('.research-v0'):
            sel = '#xyan-branch-preview' + sel
        elif sel.startswith('.reader-focused'):
            sel = '#xyan-branch-preview' + sel
        else:
            sel = '#xyan-branch-preview ' + sel
        selectors.append(sel)
    return ','.join(selectors)

def scope(css):
    css = re.sub('/\\*.*?\\*/', '', css, flags=re.S)
    out = ''
    pos = 0
    while pos < len(css):
        start = css.find('{', pos)
        if start < 0:
            break
        pre = css[pos:start].strip()
        level = 1
        i = start + 1
        quote = None
        while i < len(css) and level:
            c = css[i]
            if quote:
                if c == quote and css[i - 1] != '\\':
                    quote = None
            elif c in ['"', "'"]:
                quote = c
            elif c == '{':
                level += 1
            elif c == '}':
                level -= 1
            i += 1
        body = css[start + 1:i - 1]
        if pre.startswith(('@media', '@supports')):
            out += pre + '{' + scope(body) + '}'
        elif pre.startswith('@'):
            out += pre + '{' + body + '}'
        else:
            out += scoped_selectors(pre) + '{' + body + '}'
        pos = i
    return out
css=scope("\n".join((ROOT/p).read_text() for p in ["css/style.css","css/journal.css","css/research-v0.css","css/magazine.css"])).replace("#xyan-branch-preview","#folio-unified-preview")
for url,value in assets.items():css=css.replace(url,value)
payload=json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
fragment=(ROOT/'demos/full-review/preview.fragment.html').read_text().replace('__REVIEW_CSS__',css).replace('__REVIEW_PAYLOAD__',payload).replace('__RESEARCH_JS__',(ROOT/'js/research-v0.js').read_text()).replace('__MAGAZINE_JS__',(ROOT/'js/magazine.js').read_text())
fragment=fragment.replace('application/octet-stream','application/json')
start=fragment.index('const bytes=Uint8Array.from(');end=fragment.index('let current=',start)
fragment=fragment[:start]+"const data=JSON.parse(document.getElementById('folio-review-compressed').textContent);\n"+fragment[end:]
target=Path('/workspace/folio-review-group-'+str(args.group or 'all')+'.html');target.write_text(fragment)
assert target.stat().st_size<1024*1024
print('Unified review:',target.stat().st_size,'bytes;',len([c for c in archives['companies'] if c.get('profile')]),'companies;',len(layouts),'complete manuscripts.')
