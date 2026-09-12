#!/usr/bin/env python3
"""Fail before release if public downloads are missing or stale."""
from pathlib import Path
import hashlib,json,re
ROOT=Path(__file__).resolve().parents[1]
articles=json.loads(re.search(r'const articles = (\[[\s\S]*?\]);',(ROOT/'js/articles.js').read_text()).group(1))
manifest=json.loads((ROOT/'content/downloads.json').read_text())
assert set(manifest)=={a['id'] for a in articles},'Downloads must match public article inventory'
for a in articles:
 source=(ROOT/a['file'].strip('/')/'index.html').read_text();digest=hashlib.sha256(re.search(r'<main\b[^>]*>(.*?)</main>',source,re.S).group(1).encode()).hexdigest();item=manifest[a['id']]
 assert item['sourceHash']==digest,'Stale downloads: '+a['id']
 for kind in ['pdf','docx']:
  path=ROOT/item[kind].lstrip('/');raw=path.read_bytes()
  assert raw.startswith(b'%PDF' if kind=='pdf' else b'PK'),str(path)+' is not a genuine '+kind
print('Validated',len(articles),'article source hashes and',len(articles)*2,'download files.')
