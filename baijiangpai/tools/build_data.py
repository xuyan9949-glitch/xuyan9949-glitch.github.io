"""Rebuild the public catalogue from reviewed, structured editorial inputs.

No workbook balances, personal research narrative or screenshots are published.
Run with --inputs /absolute/path/to/research-20261017 --legacy /path/to/old/md.
The checked-in data.json is the portable publication source of truth.
"""
from pathlib import Path
import argparse, json, re, sys, hashlib, html

DEST = Path(__file__).resolve().parents[1]
def clean(s): return re.sub(r'\s+', ' ', s or '').strip()
def skills_from_md(md):
    section=re.split(r'\n## ',md)[1] if '\n## ' in md else ''
    result=[]
    for m in re.finditer(r'\*\*([^*]+)\*\*\s*\n\s*\n?((?:>[^\n]*\n?)+)',section):
        p=m[1].split('｜')
        result.append({'name':p[0], 'count':next((x for x in p[1:] if '次' in x),'次数见来源'), 'timing':p[1] if len(p)>2 else '见技能条件', 'effect':clean(re.sub(r'(^|\n)>\s*',' ',m[2])),'basis':'用户历史技能面板（2026-09归档）'})
    return result

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--inputs',type=Path,required=True);parser.add_argument('--legacy',type=Path,required=True);a=parser.parse_args()
    research=json.loads((a.inputs/'workbook-heroes.json').read_text()); editorial=json.loads((a.inputs/'editorial.json').read_text())
    metadata={}
    for l in (a.legacy/'数据库说明.md').read_text().splitlines():
        m=re.match(r'\| \[([^]]+)\]\([^)]+\) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|',l)
        if m: metadata[m[1]]={'faction':m[2].strip(),'skillNames':m[3].strip(),'position':m[4].strip(),'status':m[5].strip()}
    sys.path.insert(0,str(a.legacy.parents[1]/'work'))
    from build_hero_library import render_markdown
    heroes={};aliases={'麋夫人':'糜夫人'}
    for f in a.legacy.glob('*.md'):
        if f.name=='数据库说明.md': continue
        md=f.read_text(); n=aliases.get(f.stem,f.stem); meta=metadata.get(f.stem,{})
        no_images=re.sub(r'!\[[^]]*\]\([^)]+\)','',md)
        archive=render_markdown(no_images)
        archive=re.sub(r'<a href="(?!https?://)[^"]+">([^<]+)</a>',r'\1',archive)
        h={'name':n,'aliases':[f.stem] if n!=f.stem else [],'faction':meta.get('faction','待核'),'skillNames':meta.get('skillNames','待补'),'summary':meta.get('position','历史研究线索'),'skills':skills_from_md(md),'evidence':'用户实测' if '实测' in meta.get('status','') else '历史面板','evidenceDetail':meta.get('status','历史面板')+'；未视为10月客户端复测。','sourceDate':'2026-09-09','checkedDate':'2026-10-17','new':False,'notes':[],'unknown':[],'sources':[{'title':'用户提供的游戏面板与旧库档案','kind':'用户资料','date':'2026-09归档'}],'history':archive,'strategy':{}}
        if n in editorial['legacy']:
            x=editorial['legacy'][n];h.update(summary=x[0],strategy={'landlord':x[1],'upper':x[2],'lower':x[3],'counter':x[4]});h['unknown']=['未检索到可独立核验的近版完整技能；当前沿用历史面板，边界不作扩写。']
        heroes[n]=h
    for r in research:
        n=r['姓名'];new=n not in heroes
        h=heroes.get(n,{'name':n,'aliases':[],'faction':'待核','history':'','notes':[],'skills':[],'sources':[]})
        h.update(summary=r['机制摘要'],new=new,sourceDate=r['来源日期'],checkedDate='2026-10-17',evidence='近期官方' if r['证据等级'].startswith('A ') else ('旧版官方' if r['证据等级'].startswith('B1 ') else '局部补丁'),evidenceDetail=r['证据局限'],strategy={'landlord':r['地主思路'],'upper':r['农民上家'],'lower':r['农民下家'],'counter':r['反制方法']},setup=r['适配手牌（叫主/走牌）'],window=r['关键时机'],unknown=[r['证据局限'].split('\n')[0]])
        h['sources'].append({'title':n+' · 官方介绍／维护公告','kind':'官方TapTap','date':r['来源日期'],'url':r['来源 URL']})
        if not h['skills']: h['skills']=[{'name':'已核验机制摘要','count':'以具体来源为准','timing':'见技能条件','effect':r['机制摘要'],'basis':'报告引述的官方正文（未等同完整面板）'}]
        if not h.get('skillNames'):h['skillNames']='机制资料'
        heroes[n]=h
    for filename in ('new-heroes-audit.json','missing-research.json'):
        f=a.inputs/filename
        if not f.exists(): continue
        payload=json.loads(f.read_text()); payload=payload.get('heroes',payload) if isinstance(payload,dict) else payload
        for r in payload:
            n=r['name']; new=n not in heroes
            if not r.get('skills'): continue
            h=heroes.get(n,{'name':n,'aliases':[],'new':True,'history':'','notes':[],'sources':[],'strategy':{},'unknown':[]})
            h['faction']=r.get('faction') or h.get('faction') or '待核';h['skills']=r['skills'];h['skillNames']='、'.join(s['name'] for s in h['skills']);h['sourceDate']=r.get('sourceDate',h.get('sourceDate','待核'));h['checkedDate']='2026-10-17'
            if r.get('summary'): h['summary']=r['summary']
            for k,v in r.get('strategy',{}).items():
                if v:h['strategy'][k]=v
            h['unknown'] = r.get('unknown') or h.get('unknown',[])
            if isinstance(h['unknown'],str): h['unknown']=[h['unknown']]
            for src in r.get('sources',[]):
                if isinstance(src,str):src={'title':n+' · 资料来源','url':src,'kind':'公开资料'}
                src.setdefault('date',h['sourceDate']);h['sources'].append(src)
            label=r.get('evidence','旧版官方')
            h['evidence']=label if label in ['近期官方','旧版官方','局部补丁','用户实测','历史面板'] else ('局部补丁' if 'partial' in r.get('evidenceLevel','') else '旧版官方')
            h['evidenceDetail']=r.get('evidenceDetail',('' if label==h['evidence'] else label+' ')+r.get('versionNote','已核到所列公开资料；介绍日期不等于当前客户端复测日期。'))
            heroes[n]=h
    # Later dated user panels take precedence over earlier official previews.
    for n, note in editorial['conflicts'].items():
        if n in heroes:heroes[n]['conflict']=note
    overrides={
      '赵云':'自己的单牌或对子被压后收回并随机升点，上限2，累计回收7张后失效。采用9/6用户更新面板；旧公告的≤A限制作为版本冲突保留。',
      '皇甫嵩':'任意玩家整手出牌均≤5时，自己获得等张数的≥6牌，限3次。采用9/6用户面板；旧官方≥9文案单列冲突。',
      '关银屏':'任意玩家打出≥4张牌型时，强制从J/Q/K随机得1张，限5次。沿用较新用户面板与实测，不采用2025年旧4次口径。',
      '糜夫人':'首次降至≤8张时有一次万能牌转化并交给任意角色（可选自己）的窗口。可转换的点数范围存在版本冲突，当前不写死。',
      '夏侯渊':'自己出牌后随机升大1张牌，包含在炸弹内的牌不变。9/16已确认炸弹保护；旧面板升点上限为2。',
      '典韦':'出牌叠不屈，实际不出时清零；2/3/4层分别获得成对、2和万能牌收益。8/26后≤3张仍可加层，得到两张万能后失效。',
      '程昱':'开局或失去伏兵后随机再标1张手牌为伏兵，其点数对他人隐藏。现兵的被压弃1、无人压令他人随机弃2沿用历史面板。',
      '吕蒙':'轮到压牌可从上一手选至多2张复制并跳过，不能拿王炸。勤学1次，顿悟1次有效刷新；不按无限循环评估。',
      '荀攸':'弃数字和12的牌换1张≥Q牌；奇策限1次。打出该奖励牌后，谋佐限1次重置，所以通常至多两次奇策。',
    }
    for n,s in overrides.items():heroes[n]['summary']=s
    # Replace obsolete skill text rather than letting a current summary contradict it.
    skill_overrides={
      '夏侯渊':[('神速','不限次数','被动，出牌后','随机1张手牌点数随机变大，已包含在炸弹内的牌不变。')],
      '典韦':[('不屈','不限次数','被动，出牌后','增加1层不屈，最多4层；实际不出时清零。8/26起手牌≤3也增加层数。'),('血战','获得2张万能后失效','被动，加层结算','2层补最大非王单牌为对子；3层得2；4层得万能牌。保留旧面板的奖励描述，后续边界未复测。')],
      '张辽':[('袭破','限2次','主动，压牌时','可用带8的牌型压制任意点数的同牌型牌。长度与炸弹星级边界未在公告中展开。'),('聚势','限2次','开局；他人首次出含10牌型后','开局可获得1张8；其他玩家首次出含10牌型后，可再发动一次。')],
      '程昱':[('设伏','不限次数','被动，开局或失去伏兵后','随机1张手牌标记为伏兵，伏兵点数不向其他玩家展示。'),('现兵','不限次数（旧面板）','被动，伏兵结算','伏兵被压后自己弃1张；无人压制时选择其他玩家随机弃2张。此技能本轮未取得独立近版完整描述。')],
      '皇甫嵩':[('平乱','限3次','被动，任意玩家出牌后','该整手牌若全部≤5，则获得等张数的≥6牌。采用9/6用户面板。')],
      '糜夫人':[('存嗣','限1次（历史面板）','手牌首次降至≤8','可将合格手牌转为万能牌，交给任意角色，包括自己。合格牌范围存在冲突，见下方证据边界。')],
    }
    for n,arr in skill_overrides.items():
        heroes[n]['skills']=[dict(zip(['name','count','timing','effect'],x),basis='版本修正，见来源与冲突说明') for x in arr]
    for n,arr in editorial['notes'].items():
        if n in heroes:heroes[n]['notes']=arr
    # Meng Huo faction read directly from the 2026-08-24 official skill image.
    heroes['孟获']['faction']='蜀'
    heroes['孟获']['sources'].append({'title':'孟获 · 官方技能图（阵营为蜀）','url':'https://img2-tc.tapimg.com/moment/etag/Fl2kqsEBWDrz6EQD_Tjfr3FJ3Wok_20260824202908.jpg/_tap_ugc.jpg','kind':'官方面板，已目视核验','date':'2026-08-24'})
    faction_names={'吴':['步练师','鲁肃','孙尚香'],'魏':['张春华','荀彧','曹冲'],'蜀':['甘夫人','魏延','徐庶','孟获'],'群':['貂蝉','南华老仙','董承','左慈','华雄','袁绍']}
    for h in heroes.values():
        if h.get('faction')=='待核':
            for faction,names in faction_names.items():
                if h['name'] in names:h['faction']=faction
        h.setdefault('summary','技能资料尚待补齐。');h.setdefault('evidence','待补');h.setdefault('evidenceDetail','仅姓名线索，不作为完整技能档案。');h.setdefault('setup','先按已见手牌与完整技能条件判断，不预设随机补牌。');h.setdefault('window','技能收益能否活到下一次出手，是先于牌数增长的判断。')
        h['strategy'].setdefault('counter','围绕已列发动条件减少无收益触发，首先阻止对方直接结束。')
        h['skillNames']='、'.join(x['name'] for x in h['skills'])
        text=h['summary']+' '+h['skillNames']+' '+h['window']
        h['tags']=[tag for tag,words in {'变牌':['变','升点','降点'],'拿牌':['获得','复制','补牌','拿','取得','收回'],'弃牌':['弃'],'牌权':['压牌','压制','牌权'],'组合':['顺子','三带','对子','炸','万能'],'开局':['开局','起手','底牌']}.items() if any(w in text for w in words)][:4]
        seen=set();h['sources']=[s for s in h['sources'] if not (s.get('url',s['title']) in seen or seen.add(s.get('url',s['title'])))]
        h['id']=h['name']
        h['researchBasis']='用户提供的2026-10-17研究报告／表格与所列公开资料；策略未以个人连续战绩验证。'
        assert '<img' not in h.get('history','')
    result={'version':'2026.10.17.1','updated':'2026-10-17','baseline':'2026-10-14','legacyCount':42,'battleSamples':0,'heroes':sorted(heroes.values(),key=lambda x:(not x['new'], x['name'])),'conflicts':editorial['conflicts'],'unresolvedNames':['吴苋','黄月英','董卓','凌统','袁术','刘虞','张宝','张角','张梁','朱儁','卢植','刘协','曹丕','刘备','孙权','黄忠','小乔']}
    result['unresolvedNames']=[n for n in result['unresolvedNames'] if n not in heroes]
    encoded=json.dumps(result,ensure_ascii=False,indent=2)
    (DEST/'data.json').write_text(encoded)
    (DEST/'data.js').write_text('window.BJP_DATA = '+encoded.replace('</','<\\/')+';\n')
    print(json.dumps({'heroes':len(heroes),'new':sum(h['new'] for h in heroes.values()),'unresolved':result['unresolvedNames'],'bytes':len(encoded.encode())},ensure_ascii=False))
if __name__=='__main__':main()
