"""Group intact MU manuscripts into a focused magazine-reader prototype."""
from pathlib import Path
from html import unescape
import base64
import io
import json
import re
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
profile=next(c['profile'] for c in json.loads((ROOT/'content/archives.json').read_text())['companies'] if c['id']=='MU')
originals=[d for d in json.loads((ROOT/'content/research-documents.json').read_text())['documents'] if d['ticker']=='MU']
assets={}
specs={
 'dossier':[
  (None,'理解这门生意','商业模式 · 产品 · 竞争','先看美光卖什么、怎样赚钱，再讨论 AI 带来的变化。'),
  (r'^7\.', '增长与盈利兑现','增长逻辑 · 财务 · 现金流','把增长的来源与利润、现金放在一起，检查兑现质量。'),
  (r'^10\.', '买入价格与周期风险','估值 · 情景 · 风险','盈利很强，与当前价格是否划算，是两道不同的题。'),
  (r'^15\.', '市场如何给它定价','股性 · 宏观 · 交易结构','分清公司基本面与短期风险偏好的变化。'),
  (r'^20\.', '接下来怎样验证','跟踪清单 · 证伪 · 动态','把判断变成后续可以逐项核对的问题。')],
 'story':[
  (None,'从地下室走向工厂','创立 · 团队 · 第一次跨越','一份设计合同之后，制造、资本与客户的考验才真正开始。'),
  (r'^五、','在残酷的行业里活下来','行业寒冬 · 成本 · 掌门','技术之外，组织和成本学习决定了公司能否留在牌桌上。'),
  (r'^九、','靠选择，长成新的公司','产品转型 · 并购 · 技术取舍','几次重要抉择扩大了公司的能力，也留下了不同的代价。'),
  (r'^十五、','AI 将内存推向台前','新周期 · 产品 · 扩产','走入 AI 时代，新的机会仍然需要承担制造与资本风险。'),
  (r'^二十、','故事还没有结束','几代人的选择 · 时间线 · 未解之题','回看那些选择，再想一想今天的美光究竟改变了什么。')]}
documents={}
plain=lambda s:unescape(re.sub(r'<[^>]+>','',s)).strip()
norm=lambda s:re.sub(r'\s+','',plain(s))
for d in originals:
    source=d['html'];heads=list(re.finditer(r'<h[23][^>]*>(.*?)</h[23]>',source,re.S));positions=[0]
    for pattern,*_ in specs[d['kind']][1:]:
        match=next(h for h in heads if re.search(pattern,plain(h.group(1))))
        positions.append(match.start())
    positions.append(len(source));parts=[]
    for i,(_,title,description,lead) in enumerate(specs[d['kind']]):
        html=source[positions[i]:positions[i+1]]
        parts.append({'title':title,'description':description,'lead':lead,'html':html})
    assert ''.join(x['html'] for x in parts)==source,'Original order and all content must be intact'
    # Move the original title and document preface into an optional source note.
    first=parts[0]['html'];h0=re.search(r'<h[23][^>]*>.*?</h[23]>',first,re.S)
    if d['kind']=='dossier':
        intro_end=first.find('<h2>',h0.end())
    else:
        intro_end=h0.end()
    parts[0]['html']='<details class="mm-original-note"><summary>原稿标题与资料说明</summary>'+first[:intro_end]+'</details>'+first[intro_end:]
    assert norm(''.join(x['html'] for x in parts)).replace(norm('原稿标题与资料说明'),' ',1).replace(' ','')==norm(source)
    if d['kind']=='dossier':
        heading=next(h.group(0) for h in heads if plain(h.group(1)).startswith('3.'))
        visual='<figure class="mm-visual"><div class="mm-eyebrow">三种存储，三种角色</div><div class="mm-memory-map"><div><strong>DRAM</strong><span>CPU 与系统的工作内存</span></div><div><strong>HBM</strong><span>AI 芯片旁的高带宽内存</span></div><div><strong>NAND</strong><span>长期保存数据的存储空间</span></div></div><figcaption>依据原稿业务解释的概念示意。三者对应不同用途。</figcaption></figure>'
        parts[0]['html']=parts[0]['html'].replace(heading,visual+heading,1)
    if d['kind']=='story':
        heading=next(h.group(0) for h in heads if plain(h.group(1)).startswith('四、'))
        quote='美光用更大的财务风险，换取了对制造能力和成本学习的控制。'
        assert quote in plain(source)
        parts[0]['html']=parts[0]['html'].replace(heading,'<blockquote class="mm-pull">'+quote+'<small>摘自本篇公司故事</small></blockquote>'+heading,1)
    documents[d['kind']]={'date':d['date'],'download':d['download'],'parts':parts}
    for url in re.findall(r'<img[^>]+src="([^"]+)"',source):
        im=Image.open(ROOT/url.lstrip('/'));im.thumbnail((900,650));out=io.BytesIO();im.save(out,format='WEBP',quality=70)
        assets[url]='data:image/webp;base64,'+base64.b64encode(out.getvalue()).decode()
im=Image.open(ROOT/'images/research'/profile['hero']);im.thumbnail((1000,650));out=io.BytesIO();im.save(out,format='WEBP',quality=80)
data={'profile':profile,'documents':documents,'assets':assets,
      'hero':'data:image/webp;base64,'+base64.b64encode(out.getvalue()).decode(),
      'logo':'data:image/png;base64,'+base64.b64encode((ROOT/'images/research'/profile['logo']).read_bytes()).decode()}
template=(ROOT/'demos/mu-magazine/demo.fragment.html').read_text()
fragment=template.replace('__MU_MAGAZINE_DATA__',json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c'))
target=Path('/workspace/mu-magazine-reader-demo.html');target.write_text(fragment)
assert target.stat().st_size<1024*1024
assert '<body' not in fragment and '<!doctype' not in fragment
print('Magazine demo:',target.stat().st_size,'bytes; both complete originals retained in order.')
