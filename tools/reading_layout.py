"""Editorial presentation of intact manuscripts; never modifies source records."""
from html import escape, unescape
import json
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
def plain(s):
    return unescape(re.sub(r'<[^>]+>','',s)).strip()

def promote_story_headings(document):
    if document['kind']!='story':return document['html']
    def heading(m):
        text=plain(m.group(1))
        return '<h2>'+m.group(1)+'</h2>' if len(text)<=80 and re.match(r'^\d{1,2}\.\s+\D',text) else m.group(0)
    return re.sub(r'<p>(.*?)</p>',heading,document['html'],flags=re.S)

def build_layout(document,body,sections,company):
    config=json.loads((ROOT/'content/reading-design.json').read_text())['companies'][document['ticker']]
    kind=document['kind'];p=company['profile'];heads=list(re.finditer(r'<h[23][^>]*>(.*?)</h[23]>',body,re.S))
    if kind=='dossier':
        specs=[(None,'理解这门生意','商业模式 · 产品 · 竞争','从产品、客户与收入来源，认识 '+p['name']+'。'),
               ('7.','增长与盈利兑现','增长逻辑 · 财务 · 现金流','将增长的来源与利润、现金放在一起检查。'),
               ('10.','买入价格与周期风险','估值 · 情景 · 风险','增长预期与买入价格，需要分别验证。'),
               ('15.','市场如何给它定价','股性 · 宏观 · 交易结构','分清公司自身变化与市场风险偏好的影响。'),
               ('20.','接下来怎样验证','跟踪清单 · 证伪 · 动态','把研究判断转成可以继续核对的问题。')]
    elif kind=='story':
        specs=[(s['start'],s['title'],'人物 · 抉择 · 公司演变',s['title']+'。') for s in config['storyParts']]
    else:
        specs=[(None,'认识两类云','定义 · 架构 · 工作负载','先区分业务起点，再比较它们的优势。'),
               ('3.','生态与技术路线','客户 · 芯片 · 迁移成本','从客户关系与技术选择理解差异。'),
               ('5.','资本模型与扩张','资本开支 · 融资 · 杠杆','关注谁投入资本，谁承担风险。'),
               ('8.','投资观察与术语','趋势 · 跟踪 · 术语','把概念转成后续研究的观察框架。')]
    if not specs:raise ValueError('Missing editorial design: '+document['id'])
    offsets=[0]
    for prefix,*_ in specs[1:]:
        matches=[h for h in heads if plain(h.group(1)).startswith(prefix)]
        # Numbered dossier TOCs may precede the real text; choose the final occurrence.
        if not matches:raise ValueError('Unresolved chapter '+document['id']+' '+prefix)
        offsets.append((matches[-1] if kind=='dossier' else matches[0]).start())
    if offsets!=sorted(set(offsets)):raise ValueError('Invalid chapter order: '+document['id'])
    offsets.append(len(body));parts=[]
    for i,(_,title,description,lead) in enumerate(specs):
        fragment=body[offsets[i]:offsets[i+1]]
        parts.append({'title':title,'description':description,'lead':lead,'html':fragment})
    if ''.join(x['html'] for x in parts)!=body:raise ValueError('Incomplete text: '+document['id'])
    intro=''
    if kind=='dossier':
        first=[h for h in heads if re.match(r'^1\.\s',plain(h.group(1)))]
        if first:
            end=first[-1].start()
            if end and end<offsets[1]:
                intro=parts[0]['html'][:end];parts[0]['html']='<details class="mm-original-note"><summary>原稿导言与资料口径</summary>'+intro+'</details>'+parts[0]['html'][end:]
    elif heads and heads[0].start()==0 and (plain(heads[0].group(1))==document['title'] or '｜' in plain(heads[0].group(1))):
        end=heads[0].end();intro=parts[0]['html'][:end];parts[0]['html']='<details class="mm-original-note"><summary>原稿标题</summary>'+intro+'</details>'+parts[0]['html'][end:]
    for part in parts:
        part['chapters']=[s for s in sections if 'id="'+s['id']+'"' in part['html'] and 'id="'+s['id']+'"' not in intro]
    if kind=='dossier':
        visual='<figure class="mm-visual"><div class="mm-eyebrow">业务角色示意</div><div class="mm-memory-map">'+''.join('<div><strong>'+escape(title)+'</strong><span>'+escape(text)+'</span></div>' for title,text in config['businessVisual'])+'</div><figcaption>依据既有研究整理的业务示意。</figcaption></figure>'
        matches=[h for h in heads if re.match(r'^3\.\s',plain(h.group(1)))]
        if matches:
            h=matches[-1].group(0);parts[0]['html']=parts[0]['html'].replace(h,visual+h,1)
    if kind=='story':
        candidates=[plain(x) for x in re.findall(r'<p>(.*?)</p>',parts[0]['html'],re.S)]
        candidates=[s for s in candidates if 25<=len(s)<=90 and not re.search(r'https|资料|来源|截至|作者|本文|口径',s)]
        if candidates:
            quote=candidates[min(2,len(candidates)-1)]
            if quote not in plain(body):raise ValueError('Ungrounded quote')
            parts[0]['html']+='<blockquote class="mm-pull">'+escape(quote)+'<small>摘自本篇公司故事</small></blockquote>'
    return {'id':document['id'],'ticker':document['ticker'],'kind':kind,'title':document['title'],
            'date':document['date'],'download':document['download'],'file':document['file'],
            'sourceSHA':document['sha256'],'companyName':p['name'],'hero':'/images/research/'+p['hero'],
            'readingTitle':document['title'] if kind!='dossier' else p['headline']+'，'+p['headline2']+'。',
            'deck':p['thesis'] if kind=='dossier' else p['summary'],
            'parts':parts,'relatedTickers':document.get('relatedTickers',[document['ticker']])}

def reader_shell(layout,original_body):
    payload=json.dumps(layout,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
    return ('<main id="main" class="magazine" data-magazine-reader="'+escape(layout['id'])+'">'
      '<header class="mm-reader-bar"><a class="mm-return-company" href="/research/'+layout['ticker'].lower()+'/"><span>← '+layout['ticker']+'</span></a>'
      '<span class="mm-reader-name">'+escape(layout['companyName'])+'</span><div class="mm-reader-actions">'
      '<button type="button" data-menu="contents" aria-expanded="false">目录</button>'
      '<button type="button" data-menu="settings" aria-expanded="false">设置</button>'
      '<a href="'+escape(layout['download'],quote=True)+'" download>Word ↓</a></div></header>'
      '<section class="mm-menu mm-contents-menu" aria-label="文章目录" hidden></section>'
      '<section class="mm-menu mm-settings-menu mm-settings" aria-label="阅读设置" hidden>'
      '<span>字号</span><div><button type="button" data-size="17">标准</button><button type="button" data-size="19" aria-pressed="true">舒适</button><button type="button" data-size="21">大字</button></div>'
      '<span>方式</span><div><button type="button" data-flow="chapters" aria-pressed="true">分篇阅读</button><button type="button" data-flow="continuous">连续全文</button></div></section>'
      '<article class="article-content mm-reader-article"><div class="mm-article-wrap mm-body">'+original_body+'</div></article>'
      '<div class="mm-reader-bottom"></div><script class="magazine-data" type="application/json">'+payload+'</script></main>')
