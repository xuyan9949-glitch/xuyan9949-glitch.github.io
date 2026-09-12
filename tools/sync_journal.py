#!/usr/bin/env python3
"""Refresh the journal shell and archive indexes without altering article bodies."""
from pathlib import Path
from html import escape
import json
import hashlib
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DEPS = '<link rel="icon" href="/images/alpha.svg"><link rel="stylesheet" href="/css/style.css"><link rel="stylesheet" href="/css/journal.css"><script defer src="/js/articles.js"></script><script defer src="/js/calendar-data.js"></script><script defer src="/js/archive-data.js"></script><script defer src="/js/journal.js"></script>'

def sync_journal():
    header=(ROOT/'templates/journal-header.html').read_text().strip()
    footer=(ROOT/'templates/journal-footer.html').read_text().strip()
    data=json.loads((ROOT/'content/archives.json').read_text())
    (ROOT/'js/archive-data.js').write_text('window.archiveData = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n')
    ids=re.findall(r'"id":\s*"([^"]+)"',(ROOT/'js/articles.js').read_text())
    for rel in ['articles/'+i+'/index.html' for i in ids]+['about/index.html']:
        p=ROOT/rel;s=p.read_text()
        main=re.search(r'<main\b[^>]*>.*?</main>',s,re.S).group()
        main=re.sub(r'<main\b[^>]*>','<main id="main" class="container article-page">',main,count=1)
        # Match whole quoted attributes; the old favicon contains literal SVG > characters.
        head=re.search(r'<head>(.*?)</head>',s,re.S).group(1)
        head=re.sub(r'<link\b(?:[^>"\']|"[^"]*"|\'[^\']*\')*>',lambda m:'' if re.search(r'rel=["\'](?:stylesheet|icon)["\']',m.group()) else m.group(),head)
        head=re.sub(r'<script\b[^>]*src="/js/(?:articles|calendar-data|archive-data|journal|downloads|reader)\.js"[^>]*></script>','',head)
        head=re.sub(r'<meta name="article-source-hash"[^>]*>','',head)
        head='\n'.join(line.rstrip() for line in head.splitlines())
        key='article' if rel.startswith('articles/') else 'about'
        article_deps=('<meta name="article-source-hash" content="'+hashlib.sha256(re.search(r'<main\b[^>]*>(.*?)</main>',main,re.S).group(1).encode()).hexdigest()+'"><script defer src="/js/downloads.js"></script><script defer src="/js/reader.js"></script>') if key=='article' else ''
        share='<script src="/js/share.js"></script>' if key=='article' else ''
        p.write_text('<!doctype html><html lang="zh-CN"><head>'+head.strip()+'\n'+DEPS+article_deps+'</head><body data-page="'+key+'" class="legacy"><a class="skip-link" href="#main">跳转到正文</a>'+header+main+footer+share+'</body></html>')
    # Add new archive routes. Existing pages supply the standard shell for future additions.
    prototypes=[('events','events',data['events'],'event-detail','data-event','event-detail'),('research','research',data['companies'],'company-detail','data-company','company-detail'),('learning','learning',data['hypotheses'],'hypothesis-detail','data-hypothesis','hypothesis-detail')]
    shell=(ROOT/'index.html').read_text()
    for folder,nav,items,key,attribute,target in prototypes:
        for item in items:
            path=ROOT/folder/item['id'].lower()/'index.html'
            if path.exists():continue
            path.parent.mkdir(parents=True,exist_ok=True)
            new=re.sub(r'<main\b.*?</main>',f'<main id="main" class="page-shell detail-shell" {attribute}="{escape(item["id"],quote=True)}"><div id="{target}"></div></main>',shell,flags=re.S)
            new=new.replace('data-page="home"',f'data-page="{key}"')
            new=re.sub(r'<title>.*?</title>','<title>'+escape(item.get('title',item.get('name','研究档案')))+' | XXY Alpha</title>',new)
            path.write_text(new)
    # Canonicals are route-specific; the workbench must not be indexed.
    pages=[ROOT/'index.html']+[p for folder in ['events','research','learning','notes','calendar','workbench'] for p in (ROOT/folder).rglob('index.html')]
    for p in pages:
        s=p.read_text();rel=p.relative_to(ROOT).as_posix();route='/' if rel=='index.html' else '/'+rel[:-10]
        s=re.sub(r'<link rel="canonical"[^>]*>','',s)
        s=re.sub(r'<meta name="robots"[^>]*>','',s)
        extra='<meta name="robots" content="noindex,nofollow">' if route=='/workbench/' else '<link rel="canonical" href="https://www.xxyalpha.cn'+route+'">'
        p.write_text(s.replace('</head>',extra+'</head>'))
    p=ROOT/'sitemap.xml';s=p.read_text()
    for page in pages:
        rel=page.relative_to(ROOT).as_posix()
        if rel=='workbench/index.html':continue
        route='/' if rel=='index.html' else '/'+rel[:-10]
        url='https://www.xxyalpha.cn'+route
        if '<loc>'+url+'</loc>' not in s:s=s.replace('</urlset>','  <url><loc>'+url+'</loc></url>\n</urlset>')
    ET.fromstring(s)
    p.write_text(s)
    return len(ids)

if __name__=='__main__':
    print('Synced journal shell and archives for',sync_journal(),'articles.')
