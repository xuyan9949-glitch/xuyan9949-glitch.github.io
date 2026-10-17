"""Validate portable public JSON, refresh JS, optionally produce an offline HTML.

Usage: python3 tools/package_local.py [--offline /absolute/path/library.html]
"""
from pathlib import Path
import argparse, json, re

root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--offline',type=Path);args=parser.parse_args()
data=json.loads((root/'data.json').read_text())
names=[h['name'] for h in data['heroes']]
assert len(names)==len(set(names)) and data['battleSamples']==0
for h in data['heroes']:
    assert h['skills'] and h['sources'] and h['summary']
    assert not re.search(r'<img|/Users/|data:image',json.dumps(h,ensure_ascii=False))
js='window.BJP_DATA = '+json.dumps(data,ensure_ascii=False,indent=2).replace('</','<\\/')+';\n'
(root/'data.js').write_text(js)
if args.offline:
    source=(root/'index.html').read_text()
    css=(root/'style.css').read_text()
    source=re.sub(r'<link rel="stylesheet"[^>]+>',lambda _:f'<style>{css}</style>',source)
    source=re.sub(r'<link rel="icon"[^>]+>','',source)
    for filename in ('data.js','logic.js','app.js'):
        code=(root/filename).read_text().replace('</script','<\\/script')
        source=re.sub(r'<script src="'+re.escape(filename)+r'[^\"]*"(?: defer)?></script>',lambda _:f'<script>{code}</script>',source)
    args.offline.parent.mkdir(parents=True,exist_ok=True)
    args.offline.write_text(source)
    print(args.offline)
print(f'Portable catalogue validated: {len(names)} heroes, {data["version"]}')
