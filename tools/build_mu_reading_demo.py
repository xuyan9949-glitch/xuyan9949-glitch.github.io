"""Build a self-contained MU detail prototype without changing production pages."""
from pathlib import Path
import base64
import io
import json
import re
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
profile=next(c['profile'] for c in json.loads((ROOT/'content/archives.json').read_text())['companies'] if c['id']=='MU')
documents=[d for d in json.loads((ROOT/'content/research-documents.json').read_text())['documents'] if d['ticker']=='MU']
assets={}
for d in documents:
    for url in re.findall(r'<img[^>]+src="([^"]+)"',d['html']):
        image=Image.open(ROOT/url.lstrip('/'));image.thumbnail((900,650));out=io.BytesIO();image.save(out,format='WEBP',quality=70)
        assets[url]='data:image/webp;base64,'+base64.b64encode(out.getvalue()).decode()
data={'profile':profile,'documents':[{k:d[k] for k in ['kind','date','download','html']} for d in documents],
      'logo':'data:image/png;base64,'+base64.b64encode((ROOT/'images/research'/profile['logo']).read_bytes()).decode(),'assets':assets}
template=(ROOT/'demos/mu-reading/demo.fragment.html').read_text()
fragment=template.replace('__MU_DATA__',json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c'))
target=Path('/workspace/mu-reading-navigation-demo.html');target.write_text(fragment)
assert target.stat().st_size<1024*1024
assert '<!doctype' not in fragment and '<body' not in fragment
print('MU demo:',target.stat().st_size,'bytes; two complete manuscripts included.')
