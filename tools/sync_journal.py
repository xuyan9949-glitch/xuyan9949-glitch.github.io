#!/usr/bin/env python3
"""Refresh the journal shell and archive indexes without altering article bodies."""
from pathlib import Path
from html import escape
import json
import hashlib
import re
import xml.etree.ElementTree as ET
from urllib.parse import urlparse, unquote
from html import unescape

ROOT = Path(__file__).resolve().parents[1]
DEPS = '<link rel="icon" href="/images/alpha.svg"><link rel="stylesheet" href="/css/style.css"><link rel="stylesheet" href="/css/journal.css"><script defer src="/js/articles.js"></script><script defer src="/js/calendar-data.js"></script><script defer src="/js/archive-data.js"></script><script defer src="/js/journal.js"></script>'
RESEARCH_DEPS = '<link rel="stylesheet" href="/css/research-v0.css"><script defer src="/js/research-data.js"></script><script defer src="/js/research-v0.js"></script>'
V0_DEPS = DEPS.replace('<script defer src="/js/journal.js">', RESEARCH_DEPS+'<script defer src="/js/journal.js">')

def document_sections(document):
    """Stable section URLs survive insertions before an existing chapter."""
    sections=[];seen={}
    def anchor(match):
        level,attrs,content=match.group(1),match.group(2),match.group(3)
        title=unescape(re.sub(r'<[^>]+>','',content)).strip()
        base='section-'+hashlib.sha256(title.encode()).hexdigest()[:12]
        seen[base]=seen.get(base,0)+1
        section_id=base if seen[base]==1 else base+'-'+str(seen[base])
        if title!=document['title']:sections.append({'id':section_id,'title':title})
        attrs=re.sub(r'\s+id="[^"]*"','',attrs)
        return '<h'+level+attrs+' id="'+section_id+'">'+content+'</h'+level+'>'
    body=re.sub(r'<h([23])([^>]*)>(.*?)</h\1>',anchor,document['html'],flags=re.S)
    return body,sections

def sync_research(data, header, footer):
    """Generate migrated layouts and original-document routes from tracked sources."""
    source=ROOT/'content/research-documents.json'
    documents=json.loads(source.read_text())['documents'] if source.exists() else []
    prepared={d['id']:document_sections(d) for d in documents}
    index=[dict({k:v for k,v in d.items() if k!='html'},sections=prepared[d['id']][1]) for d in documents]
    (ROOT/'js/research-data.js').write_text('window.researchDocuments = '+json.dumps(index,ensure_ascii=False,indent=2)+';\n')
    def page(title, description, body, key, extra='', attributes=''):
        return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#164334"><title>'+escape(title)+' | XXY Alpha</title><meta name="description" content="'+escape(description,quote=True)+'">'+V0_DEPS+extra+'</head><body data-page="'+key+'" class="journal research-v0" '+attributes+'><a class="skip-link" href="#main">跳转到正文</a>'+header+body+footer+'</body></html>'
    for rel,template,title,key in [('index.html','research-home.html','公司档案','research'),('research/index.html','research-directory.html','公司档案','research')]:
        path=ROOT/'templates'/template
        if path.exists(): (ROOT/rel).write_text(page(title,'以公司为入口，检索投研档案、公司故事、财报与历史研究记录。',path.read_text(),key))
    for company in data['companies']:
        if not company.get('profile'):continue
        path=ROOT/'research'/company['id'].lower()/'index.html';path.parent.mkdir(parents=True,exist_ok=True)
        body='<main id="main" class="page-shell detail-shell" data-company="'+escape(company['id'],quote=True)+'"><div id="company-detail"></div></main>'
        path.write_text(page(company['name']+' '+company['id'],company['profile']['summary'],body,'company-detail'))
    for d in documents:
        path=ROOT/d['file'].strip('/')/'index.html';path.parent.mkdir(parents=True,exist_ok=True)
        context='<div class="v0-document-meta">资料截至 '+escape(d['date'])+' · 原始文稿：'+escape(d['sourceFile'])+'<br><a href="'+escape(d['download'],quote=True)+'" download>下载原始 Word</a> · <a href="/research/'+d['ticker'].lower()+'/?tab='+d['kind']+'">返回公司档案</a></div>'
        content=prepared[d['id']][0]
        body='<main id="main" class="container article-page v0-full-document"><a class="back" href="/research/'+d['ticker'].lower()+'/?tab='+d['kind']+'">← '+escape(d['ticker'])+' 公司档案</a><h1>'+escape(d['title'])+'</h1>'+context+'<div class="article-content">'+content+'</div></main>'
        fingerprint=hashlib.sha256(content.encode()).hexdigest()
        path.write_text(page(d['title'],'资料截止 '+d['date']+'，从原始研究文稿导入的完整阅读版本。',body,'article','<meta name="article-source-hash" content="'+fingerprint+'"><script defer src="/js/reader.js"></script>', 'data-reading-id="'+escape(d['id'],quote=True)+'"'))

def sync_journal():
    header=(ROOT/'templates/journal-header.html').read_text().strip()
    footer=(ROOT/'templates/journal-footer.html').read_text().strip()
    data=json.loads((ROOT/'content/archives.json').read_text())
    sync_research(data,header,footer)
    (ROOT/'js/archive-data.js').write_text('window.archiveData = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n')
    ids=re.findall(r'"id":\s*"([^"]+)"',(ROOT/'js/articles.js').read_text())
    for rel in ['articles/'+i+'/index.html' for i in ids]+['about/index.html']:
        p=ROOT/rel;s=p.read_text()
        main=re.search(r'<main\b[^>]*>.*?</main>',s,re.S).group()
        main=re.sub(r'<main\b[^>]*>','<main id="main" class="container article-page">',main,count=1)
        # Match whole quoted attributes; the old favicon contains literal SVG > characters.
        head=re.search(r'<head>(.*?)</head>',s,re.S).group(1)
        head=re.sub(r'<link\b(?:[^>"\']|"[^"]*"|\'[^\']*\')*>',lambda m:'' if re.search(r'rel=["\'](?:stylesheet|icon)["\']',m.group()) else m.group(),head)
        head=re.sub(r'<script\b[^>]*src="/js/(?:articles|calendar-data|archive-data|journal|downloads|reader|research-data|research-v0)\.js"[^>]*></script>','',head)
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
            new=re.sub(r'data-page="[^"]+"',f'data-page="{key}"',new,count=1)
            new=re.sub(r'<title>.*?</title>','<title>'+escape(item.get('title',item.get('name','研究档案')))+' | XXY Alpha</title>',new)
            path.write_text(new)
    # Canonicals are route-specific; the workbench must not be indexed.
    pages=[ROOT/'index.html']+[p for folder in ['events','research','learning','notes','calendar','workbench'] for p in (ROOT/folder).rglob('index.html')]
    for p in pages:
        s=p.read_text();rel=p.relative_to(ROOT).as_posix();route='/' if rel=='index.html' else '/'+rel[:-10]
        s=re.sub(r'<header class="site-header"[^>]*>.*?</header>',lambda _:header,s,flags=re.S)
        s=re.sub(r'<footer class="site-footer[^\"]*"[^>]*>.*?</footer>',lambda _:footer,s,flags=re.S)
        # Retained directory pages need the same research index and components.
        if rel=='notes/index.html' and '/js/research-v0.js' not in s:
            s=s.replace('<script defer src="/js/journal.js">',RESEARCH_DEPS+'<script defer src="/js/journal.js">')
        expected='<meta name="robots" content="noindex,nofollow">' if route=='/workbench/' else '<link rel="canonical" href="https://www.xxyalpha.cn'+route+'">'
        if expected in s:
            p.write_text(s)
            continue
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
    tree=ET.fromstring(s)
    # Removed public content must also leave discovery indexes. Keep existing tool routes.
    for entry in list(tree):
        loc=next((node for node in entry if node.tag.split('}')[-1]=='loc'),None)
        if loc is None:continue
        url=urlparse(loc.text or '')
        if url.netloc!='www.xxyalpha.cn':continue
        route=unquote(url.path)
        if route.startswith(('/articles/','/events/','/learning/')) and not (ROOT/route.strip('/')/'index.html').exists():tree.remove(entry)
    ET.register_namespace('', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    p.write_text(ET.tostring(tree,encoding='unicode')+'\n')
    return len(ids)

if __name__=='__main__':
    print('Synced journal shell and archives for',sync_journal(),'articles.')
