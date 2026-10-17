/* Static, dependency-free. Public research and browser-local personal records are kept separate. */
(() => {
  'use strict';
  const D = window.BJP_DATA, L = window.BJPLogic, main = document.getElementById('main');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const heroUrl = name => '#hero/' + encodeURIComponent(name);
  const byName = name => D.heroes.find(h => h.name === name || h.aliases.includes(name));
  const currency = n => n === null ? '—' : new Intl.NumberFormat('zh-CN',{maximumFractionDigits:1}).format(n);
  const percent = n => n === null ? '—' : (n*100).toFixed(1)+'%';
  function readLocal(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
  function saveLocal(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { toast('浏览器存储不可用，请立即导出备份。'); return false; } }
  let favorites = readLocal('bjp-favorites-v2',[]); if (!Array.isArray(favorites)) favorites=[];
  let rows, journalRaw='', journalBroken=false;
  try { journalRaw=localStorage.getItem('bjp-journal-v2')||''; rows=L.validateRows(journalRaw?JSON.parse(journalRaw):[]);rows.sort((a,b)=>a.date.localeCompare(b.date)); } catch { rows=[];journalBroken=!!journalRaw; }
  let compare=[], editId=null;
  const state = { q:'', faction:'全部', role:'overview', tag:'全部机制', evidence:'全部证据', sort:'default', newOnly:false, favoritesOnly:false, favorites };
  let journalFilter='全部身份', scrollBeforeDetail=0;
  let toastTimer;
  function toast(message) { const box=document.getElementById('toast');box.textContent=message;box.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.classList.remove('visible'),3200); }
  const external = (url, title) => /^https:\/\//.test(url || '') ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)} ↗</a>` : esc(title);
  const options = (values, current) => values.map(x=>`<option${x===current?' selected':''}>${esc(x)}</option>`).join('');
  function evidence(h) { return `<span class="confidence ${/旧|历史|局部/.test(h.evidence)?'old':''}">${esc(h.evidence)}</span>`; }
  function section(title, content, number, id) { return `<section id="${id}"><div class="section-label"><span>${number}</span><h2>${title}</h2></div>${content}</section>`; }
  function list(items) { return `<ul class="clean-list">${items.filter(Boolean).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`; }
  function sourceList(sources) { return `<ul class="sources-list">${sources.map(s=>`<li>${external(s.url,s.title)}<small>${esc(s.kind || '公开资料')} · ${esc(s.date || '日期见来源')}</small></li>`).join('')}</ul>`; }
  function intro(eyebrow,title,description,stats='') { return `<div class="intro"><div class="intro-copy"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${description}</p></div>${stats}</div>`; }
  function renderLibrary() {
    document.title='百将牌研究库 · 三人场武将与实战';
    main.innerHTML=intro('STRATEGY ARCHIVE / 2026.10.17','三人场武将研究','查机制、看座次、找反制。把官方公告和历史实测放回各自的版本，用完整走牌路线判断技能收益。',`<div class="stats"><div class="stat"><strong>${D.heroes.length}</strong><span>已建档武将</span></div><div class="stat"><strong>+${D.heroes.filter(h=>h.new).length}</strong><span>本轮新增</span></div><div class="stat"><strong>10.14</strong><span>最近维护基线</span></div></div>`)+
      `<div class="version-strip"><span class="version-mark">版本提醒</span><p>张辽改为含8同型压牌、袭破限2次；程昱失去伏兵可再设伏。夏侯渊已加入炸弹保护。</p><a href="#updates">查看改动与冲突 →</a></div>
      <section aria-label="武将目录"><div class="catalog-tools"><div class="search-row"><div class="searchbox"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="search" type="search" value="${esc(state.q)}" placeholder="搜索武将、技能或机制，例如：万能牌、神机、弃牌" aria-label="搜索武将与机制" autocomplete="off"><kbd>/</kbd></div>
      <select id="role" aria-label="按身份查看"><option value="overview">机制概览</option><option value="landlord">地主打法</option><option value="upper">农民上家打法</option><option value="lower">农民下家打法</option></select>
      <select id="sort" aria-label="排序"><option value="default">新增优先</option><option value="date">资料日期</option><option value="name">武将名称</option></select></div>
      <div class="filters"><div class="filter-group" aria-label="阵营">${['全部','魏','蜀','吴','群'].map(f=>`<button class="chip ${state.faction===f?'active':''}" data-faction="${f}" aria-pressed="${state.faction===f}">${f}</button>`).join('')}</div>
      <select id="tag" aria-label="机制分类">${options(['全部机制','变牌','拿牌','弃牌','牌权','组合','开局'],state.tag)}</select>
      <select id="evidence" aria-label="证据类型">${options(['全部证据','近期官方','含用户资料','旧版官方','局部补丁','历史面板'],state.evidence)}</select>
      <label class="toggle"><input type="checkbox" id="new-only"${state.newOnly?' checked':''}>只看新增</label><label class="toggle"><input type="checkbox" id="fav-only"${state.favoritesOnly?' checked':''}>我的常用</label></div></div>
      <div class="resultline"><span id="result-count" role="status" aria-live="polite"></span><span class="legend">可选最多3将对照 · 策略不等于胜率</span><button id="reset" class="quiet">清除筛选</button></div><div id="hero-grid" class="hero-grid"></div></section>
      <p class="footnote">资料核查截至 ${D.updated}。${D.unresolvedNames.length?`另有 ${D.unresolvedNames.length} 个姓名线索尚未形成可靠完整档案，见版本记录。`:''}“近期官方／旧版官方／局部补丁”表示证据范围，不是强度。旧42将原档保留在详情的历史区。</p>`;
    document.getElementById('role').value=state.role;document.getElementById('sort').value=state.sort;
    document.getElementById('search').addEventListener('input',e=>{state.q=e.target.value;renderCards();});
    for (const key of ['role','sort','tag','evidence']) document.getElementById(key).addEventListener('change',e=>{state[key]=e.target.value;renderCards();});
    for (const [id,key] of [['new-only','newOnly'],['fav-only','favoritesOnly']]) document.getElementById(id).addEventListener('change',e=>{state[key]=e.target.checked;renderCards();});
    document.querySelectorAll('[data-faction]').forEach(b=>b.addEventListener('click',()=>{state.faction=b.dataset.faction;document.querySelectorAll('[data-faction]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});renderCards();}));
    document.getElementById('reset').onclick=resetFilters;renderCards();
  }
  function resetFilters(){Object.assign(state,{q:'',faction:'全部',role:'overview',tag:'全部机制',evidence:'全部证据',sort:'default',newOnly:false,favoritesOnly:false});renderLibrary();}
  function renderCards() {
    const filtered=L.filterHeroes(D.heroes,state);
    document.getElementById('result-count').innerHTML=`找到 <strong>${filtered.length}</strong> / ${D.heroes.length} 位武将`;
    document.getElementById('hero-grid').innerHTML=filtered.length?filtered.map(h=>{
      const description=state.role==='overview'?h.summary:h.strategy[state.role]||'该座次尚缺独立研究，先按技能条件与队伍走法判断。';
      return `<article class="hero-card"><div class="card-head"><a class="hero-name" href="${heroUrl(h.name)}">${esc(h.name)}</a><span class="faction ${esc(h.faction)}">${esc(h.faction)}</span>${h.new?'<span class="new">本轮新增</span>':''}</div><div class="card-skills">${esc(h.skillNames)}</div><p class="card-summary">${esc(description)}</p><div class="tags">${h.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}${h.conflict?'<span class="tag">版本差异</span>':''}</div><div class="card-bottom"><span><i class="evidence-dot ${/旧|历史|局部/.test(h.evidence)?'old':''}"></i>${esc(h.evidence)} · ${esc(h.sourceDate)}</span><label class="compare-check"><input type="checkbox" data-compare="${esc(h.name)}" aria-label="对照${esc(h.name)}"${compare.includes(h.name)?' checked':''}>对照</label></div></article>`;
    }).join(''):'<div class="empty"><h3>没有匹配的武将</h3><p>可尝试技能关键词、另一阵营，或取消“只看新增”。</p><button id="empty-reset">清除全部筛选</button></div>';
    document.querySelectorAll('[data-compare]').forEach(input=>input.onchange=()=>{
      const name=input.dataset.compare;
      if(input.checked&&!compare.includes(name)){if(compare.length===3){input.checked=false;toast('最多对照3名武将。');return;}compare.push(name);}else compare=compare.filter(x=>x!==name);
      renderTray();
    });
    document.querySelectorAll('.hero-name').forEach(a=>a.onclick=()=>{scrollBeforeDetail=scrollY;});
    if(document.getElementById('empty-reset'))document.getElementById('empty-reset').onclick=resetFilters;
  }
  function renderTray() {
    const tray=document.getElementById('compare-tray');tray.hidden=!compare.length||location.hash.startsWith('#compare');
    tray.innerHTML=`<span>${compare.map(esc).join(' · ')}</span><button class="light" id="open-compare"${compare.length<2?' disabled':''}>对照 ${compare.length}/3</button><button id="clear-compare" aria-label="清空对照">清空</button>`;
    document.getElementById('open-compare').onclick=()=>{location.hash='compare/'+compare.map(encodeURIComponent).join(',');};
    document.getElementById('clear-compare').onclick=()=>{compare=[];renderTray();if(document.getElementById('hero-grid'))renderCards();};
  }
  function renderHero(h) {
    if(!h)return renderNotFound();document.title=`${h.name} · 技能、三座次打法与反制 | 百将牌研究库`;
    main.innerHTML=`<a href="#library" class="backlink" id="back-library">← 返回武将库</a><div class="hero-intro"><div><div class="badge-line"><span class="faction ${esc(h.faction)}">${esc(h.faction)}国${h.faction==='群'?'雄':''}</span>${evidence(h)}${h.new?'<span class="confidence old">本轮新增</span>':''}</div><h1>${esc(h.name)}</h1><p class="summary">${esc(h.summary)}</p><div class="hero-tools"><button id="favorite" class="quiet">${favorites.includes(h.name)?'已设为常用':'设为常用'}</button><button id="copy-link" class="quiet">复制链接</button><button id="print" class="quiet">打印研究卡</button></div></div><aside class="hero-meta"><dl><dt>资料日期</dt><dd>${esc(h.sourceDate)}</dd><dt>本轮核查</dt><dd>${esc(h.checkedDate)}</dd><dt>使用范围</dt><dd>三人场</dd><dt>个人战绩</dt><dd>无连续样本，不提供胜率</dd><dt>研究依据</dt><dd>技能面板／官方正文与所列来源</dd></dl></aside></div>
      <div class="article-layout"><nav class="article-nav" aria-label="本将目录"><a href="#rules" data-anchor="rules">技能与机制</a><a href="#tactics" data-anchor="tactics">三个座次打法</a><a href="#counter" data-anchor="counter">反制与时机</a><a href="#sources" data-anchor="sources">证据与历史</a></nav><article class="article-body">
      ${h.conflict?`<div class="notice"><strong>版本差异</strong><br>${esc(h.conflict)}</div>`:''}
      ${section('技能与机制',h.skills.map(s=>`<div class="rule-card"><h3>${esc(s.name)}<span class="skill-count">${esc(s.count || '次数未核齐')}</span></h3><p class="muted" style="font-size:12px;margin-bottom:8px">${esc(s.timing || '时点见技能条件')}</p><p>${esc(s.effect)}</p><p class="rule-source">${esc(s.basis || '据所列公开来源整理，非当前客户端逐字复刻')}</p></div>`).join('')+(h.notes.length?`<h3 style="margin-top:24px">已知边界与纠错</h3>${list(h.notes)}`:''),'01','rules')}
      ${section('三个座次打法',`<div class="notice green"><strong>启动条件</strong><br>${esc(h.setup)}</div><small>以下为研究推断。出牌顺序：地主 → 地主下家 → 地主上家 → 地主。</small><div class="role-grid">${[['landlord','地主'],['upper','农民上家'],['lower','农民下家']].map(([key,label])=>`<div class="role-block"><h3>${label}</h3><p>${esc(h.strategy[key]||'尚缺足够独立资料，不作确定性座次推荐。')}</p></div>`).join('')}</div>`,'02','tactics')}
      ${section('反制与时机',`<h3>关键窗口</h3><p>${esc(h.window)}</p><h3>对手如何应对</h3><p>${esc(h.strategy.counter)}</p>${h.unknown.length?`<h3>仍有边界</h3>${list(h.unknown)}`:''}`,'03','counter')}
      ${section('证据与历史',`<p class="muted" style="font-size:13px">${esc(h.evidenceDetail)} 资料日期记录原文或补丁日期，核查日期不表示已经在客户端重测。</p>${sourceList(h.sources)}${h.history?`<details class="archive"><summary>展开 2026-09 历史档案与旧评分（不作当前规则）</summary><div class="notice" style="margin-top:20px">以下保留旧原稿供追溯。旧分数不是胜率，其中旧机制、随机概率假设和未决问题可能已被上文修正。</div><div class="historical">${h.history}</div></details>`:''}`,'04','sources')}
      </article></div>`;
    document.querySelectorAll('[data-anchor]').forEach(a=>a.onclick=e=>{e.preventDefault();document.getElementById(a.dataset.anchor).scrollIntoView({behavior:'smooth'});});
    document.getElementById('favorite').onclick=e=>{favorites=favorites.includes(h.name)?favorites.filter(n=>n!==h.name):[...favorites,h.name];state.favorites=favorites;saveLocal('bjp-favorites-v2',favorites);e.target.textContent=favorites.includes(h.name)?'已设为常用':'设为常用';};
    document.getElementById('copy-link').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);toast('武将链接已复制。');}catch{toast('复制受浏览器限制，可直接复制地址栏链接。');}};
    document.getElementById('print').onclick=()=>window.print();
  }
  function renderCompare(names) {
    const selected=names.map(byName).filter(Boolean).slice(0,3);if(selected.length<2)return renderNotFound();compare=selected.map(h=>h.name);
    main.innerHTML=`<a href="#library" class="backlink">← 返回武将库</a>${intro('SIDE BY SIDE','武将对照','以技能的启动、时点和三种座次路线作比较，不用主观总分替代判断。')}<div class="table-wrap"><table class="compare-table"><thead><tr>${selected.map(h=>`<th><a href="${heroUrl(h.name)}">${esc(h.name)}</a><small>${esc(h.faction)} · ${esc(h.sourceDate)} · ${esc(h.evidence)}</small></th>`).join('')}</tr></thead><tbody>${[['机制','summary'],['启动条件','setup'],['地主','landlord'],['农民上家','upper'],['农民下家','lower'],['反制','counter'],['版本差异','conflict']].map(([label,key])=>`<tr>${selected.map(h=>`<td><small>${label}</small>${esc(h[key]||h.strategy[key]||'本轮无新增差异记录，不代表当前已复测。')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  const refs={patch:'https://www.taptap.cn/moment/858830214174607604',s2:'https://www.taptap.cn/moment/848658019431483028',meng:'https://www.taptap.cn/moment/841049376099929029',lv:'https://www.taptap.cn/moment/771797788248771574',zhuge:'https://www.taptap.cn/moment/789229311130340087',chun:'https://www.taptap.cn/moment/846838898876222533',gan:'https://www.taptap.cn/moment/854434469237492184',bu:'https://www.taptap.cn/moment/848936392682637206',hong:'https://www.taptap.cn/moment/843861116147731757'};
  const guides=[
    {id:'tempo',label:'技能与牌权',title:'拿到好牌以后，是否还有下一手？',description:'吕蒙、诸葛亮和曹洪：补牌收益与回合成本如何一起算。',html:`<p>评价一次技能，先数它改变了几手牌，再数兑现收益前需要多少轮。多一张高牌、凑成一个炸弹，都不意味着这一轮更安全。</p><h2>吕蒙：让过的不是一个按钮</h2><p>勤学复制至多两张牌，但要跳过本次压牌。假设上一手是QQ，自己有AA，拿QQ能补出炸弹，而下一位敌人只剩能跟出的KK；在没有其他技能介入的教学局面里，勤学会让其直接走完，AA阻挡则保留比赛机会。</p><p>实战看不到KK时，不能把假设当暗牌事实。应列出“对手两张是更大对子”的危险分支，再判断为了补炸是否值得承担。${external(refs.lv,'官方吕蒙攻略')}明确提醒了跳过压牌的时间成本。</p><h2>诸葛亮：三次神机不是三枚现成炸弹</h2><p>3–Q的三张是落点，K以上是材料，但发动还需要客观无牌可压。第一枚炸弹生成后，对普通牌已存在合法压制，后续神机往往要等这枚炸弹先用掉。三组低三张和足量高牌仅提供结构上限，不证明能连续触发三次。</p><p>要保留必要的拦截高牌，避免把所有控制都降点。农民上家神机后直接轮到地主，下家则还有队友可评估是否接管，二者的时间风险不同。机制见${external(refs.zhuge,'官方旧版说明')}，次数和众数边界结合用户实测。</p><h2>曹洪：何时应该停止喂对子</h2><p>敛财是强制补入整对。前期帮队友凑炸，残局却可能把一手走完改成两手。${external(refs.hong,'9/1官方攻略')}也建议提前消耗次数，防止收尾被强塞无用牌。</p><h2>每次发动前检查</h2><ol><li>若我现在让过，下一个人有没有直接结束的可能？</li><li>补来的牌会减少剩余手数，还是仅提高点数？</li><li>我用什么再次取得牌权？谁负责这段空窗？</li><li>队友已能走完时，这次成长是否反而延长比赛？</li></ol>`},
    {id:'bid',label:'选将与叫主',title:'起手条件，比统一高分更有用',description:'把候选选将、发牌后的叫分和拿底后的重排分开。',html:`<p>选将和叫地主是两个阶段。候选阶段优先熟练度、普通起手适应范围与环境反制；拿到牌以后再评估启动条件、先手路线和被打断后的回手。不要倒用尚未见到的底牌证明前面的选将正确。</p><h2>一手牌分三部分</h2><ul><li><strong>能直接走的结构：</strong>顺子、连对、飞机、三带，以及它们会留下的尾张。</li><li><strong>能把牌权拿回的资源：</strong>必须能承接对方牌型，不只看王和2的数量。</li><li><strong>技能的材料和落点：</strong>例如诸葛亮的高牌耗材与低三张，关羽的顺子与万能牌接口。</li></ul><h2>四个典型启动条件</h2><div class="table-wrap"><table><thead><tr><th>武将</th><th>可以积极判断的条件</th><th>不要忽略</th></tr></thead><tbody><tr><td>诸葛亮</td><td>妙算可见底牌补结构；3–Q有三张，高牌有余量</td><td>神机让权；成炸后未必有下一次窗口</td></tr><tr><td>孙坚</td><td>有1–2K且整手无三张与炸弹</td><td>拿底可能新增三张，封锁得玺</td></tr><tr><td>关羽</td><td>能出顺子，万能牌可直接修复后续结构</td><td>顺子之后仍需要回手，不只数可凑炸</td></tr><tr><td>张辽</td><td>含8的成型牌能覆盖主要缺口</td><td>10/14仅2次袭破，同型具体边界不能无限扩展</td></tr></tbody></table></div><p>上表是条件分析，不是胜率排序。张辽改动以${external(refs.patch,'10/14维护公告')}为准；其余请在武将卡中结合历史面板与来源日期查看。</p><h2>巡察调整的是候选池</h2><p>${external(refs.s2,'S2官方公告')}确认，巡察中的武将不会在三人随机推将中出现。优先排除既不会用又不准备练的角色，保留多种启动方式。没有官方等概率算法，不将简单组合数学写成实际推荐概率。</p><p>叫主后把实际底牌、技能和随机坐骑重新纳入拆牌。不要为了“这名将应该强”在明显缺控制、尾牌破碎时硬叫。</p>`},
    {id:'seats',label:'双人协同',title:'上家封口，下家接手：先看实际走法',description:'用出牌顺序定义座次，动态决定农民主攻者。',html:`<div class="notice green">本文出牌顺序：地主 → 地主下家农民 → 地主上家农民 → 地主。上下家不是屏幕左右位置。</div><h2>地主上家：放行后直接轮到地主</h2><p>上家的压牌是地主下次行动前的最后一道拦截。地主短牌时，先排除其直接结束，再追求神机、屯粮或其他让权成长。队友刚获得强牌权时，也不要为刷次数无意义盖掉。</p><h2>地主下家：反应之后还有队友</h2><p>下家能先响应地主，再把接管任务交给上家，但不能假设上家一定能压。若自己是更接近走完的一方，主动争回牌权；若队友已有完整走法，则用适合其承接的类型递送。</p><h2>主攻随公开信息变化</h2><p>两张剩牌未必是对子；一句语音也不能当确定牌型。公开新增、弃牌、变点可能让此前信息失效。比较两人最少剩余手数、可回手次数和技能余量，再决定谁应该控、谁应该走。</p><h2>三种配合要分清</h2><ul><li><strong>复制已出牌：</strong>羊祜等取得上一手牌时通常是复制，不改动上一手出牌结果。</li><li><strong>手牌转移：</strong>例如把牌交给队友，会改变双方手牌结构，要重算走法。</li><li><strong>直接弃牌终结：</strong>刘禅放权是弃最大牌。只剩1–2张可直接弃完获胜，并非交给拿牌权的人。</li></ul><p>旧库用户实测已确认刘禅和羊祜的上述差别。涉及他人未出的手牌时，不能把“所有拿牌”笼统解释为复制；以该技能的具体来源为准。</p>`},
    {id:'new-meta',label:'新版反制',title:'四个需要重新记住的对手',description:'张春华、步练师、甘夫人与改版张辽，如何改变控场判断。',html:`<h2>张春华：王炸并非永远安全</h2><p>${external(refs.chun,'9/10官方介绍')}明确，绝情能将压她的王炸和五星炸改成3333。条件是她先出牌被压，并付出最大独立对子；有次数却没有成本，不等于随时能改任意炸弹。</p><p>对抗时先看触发链和对子成本，必要时留二次回手；使用时别把唯一合格对子当普通尾牌提前丢掉。</p><h2>步练师：对方行动就是她的变牌事件</h2><p>同心对象出牌或被压，会推动她的两端点数向中间收敛。${external(refs.bu,'官方步练师介绍')}给出王不参与变化但参与区间界定的边界。对抗时需要计算由谁压牌会触发什么，而不只比较点数。</p><p>收窄区间有助成组，但不足4张时不应还等“慢慢变炸”。即将终结就执行现成路线，不以压制成长为由放弃胜利。</p><h2>甘夫人：25/35张是全场时钟</h2><p>${external(refs.gan,'10/6官方介绍')}按全场累计出牌数提供追加次数，而非只数她自己出的牌。她可把右半边一张随机变成左半边的点数；可以涉及王，但相同王不能组成对子或炸弹。</p><p>先整理左半候选范围，别把“可能变王”当作必出王；对抗时在累计出牌接近门槛后，重新评估其潜在牌型。</p><h2>张辽：更宽的牌型，更少的次数</h2><p>${external(refs.patch,'10/14公告')}把袭破拓展到含8的同型牌，但次数由3降至2。优先覆盖真正缺少自然回手的牌型；一轮越级成功不等于此后永远拿牌权。公告未展开的长度、星级和附牌合法性，不自行补成“什么都能压”。</p>`},
    {id:'net-return',label:'兵力与风险',title:'赢得多，也可能掉兵力',description:'按净变化、盈亏平衡胜率与最大回撤复盘。',html:`<p>用户提供的对局表目前没有真实记录，本库不展示虚构收益、胜率或武将榜。你可在“兵力复盘”按真实顺序录入，记录仅存在当前浏览器。</p><h2>单局净对局收益</h2><div class="notice green">结束兵力 − 开局兵力 − 外部净流入。开局取入场扣费前；补助、任务、充值单列。费用已反映在余额里时，不再扣第二次。</div><p>外部净流入可以为负，例如这段余额区间有非对局扣除。缺少任一余额的记录保留，但不进入收益、回撤与“余额齐全且已填胜负”的胜率分母。</p><h2>盈亏平衡不必是50%</h2><p>若赢局平均净赚W，输局平均净亏L（正值），胜率p，则每局期望为 pW − (1−p)L，平衡胜率为 L / (W+L)。只有两者都已包含费用，才不能再单独减费。</p><p>教学例：赢均4万、输均7万，即使60%胜率，每局平均仍是 −4000，平衡胜率约63.6%。这不是你的战绩或实际游戏分布。</p><h2>10/14房间变化</h2><p>初级底分800、官方单局封顶1.5万；中级底分5000、兵力范围4万–150万、封顶8万；大师入场费10万、封顶250万。初中级炸弹倍率采用加法叠加。${external(refs.patch,'官方公告')}</p><p>公告未说明封顶是个人总额还是单个对手口径，也未给出完整倍率与费用组合。不能断言地主总亏损必然封顶8万或16万。高级场9/16改为30万以上准入，其他现行参数仍需客户端核准。</p><h2>回撤与场次风险</h2><p>以累计净收益的历史最高点为峰值，当前回撤=峰值−当前累计净收益，最大回撤取各时点最大值，起点为0。外部补给不抬高这个峰值。缺漏对局会使回撤失真。</p><p>把已核实的个人最大单局损失U除以当前余额B，再评估能否承受。5%或10%仅是研究用风险刻度，不是官方安全线；它不能把负期望策略变成正期望。</p>`},
    {id:'evidence',label:'研究方法',title:'怎样让下一次判断可验证',description:'证据层级、版本冲突、录像复盘与样本边界。',html:`<h2>四层证据分开</h2><ul><li><strong>近期官方：</strong>优先维护公告与公测后的独立介绍，可证明明确改动，未必完整覆盖全部技能。</li><li><strong>用户面板／实测：</strong>保留来源时间；较新游戏截图不被更旧预告覆盖。</li><li><strong>旧版官方与局部补丁：</strong>作为历史依据，不能因为核查发生在今天就说技能是今天的。</li><li><strong>策略推断：</strong>围绕条件、机会成本、剩余手数与座次展开；没有对局样本不发布精确胜率。</li></ul><h2>保留冲突，不强行拼一个版本</h2><p>例如皇甫嵩旧文≥9与用户较新面板≥6，赵云7/15公告≤A与用户9/6新面板的差别。详情页明确采用哪一条、另一条为何保留，以及仍缺什么。未核全的武将不补造技能次数。</p><h2>一局只记四句话</h2><ol><li>当时知道什么，哪些只是猜测。</li><li>至少两个合法选择是什么。</li><li>所选动作想换来什么，怕哪条分支。</li><li>事后是机制错、选择错、配合错，还是合理选择遇到坏结果。</li></ol><p>先复盘最大亏损和“有赢法没走掉”的局，只找最早的可避免错误。不用结果反推每一手必错，也不用一局侥幸赢证明策略正确。</p><h2>B站的使用边界</h2><p>完整同版本实战可以帮助检查时序；精选连胜和榜单只提供线索。此次部分B站页面返回412，未获得视频连续正文，不声称已完整观摩或以其验证胜率。下面保留报告中的学习入口，均需先对版本：</p>${sourceList([{title:'三国百将牌官方 · 法正（2026-04-17）',kind:'B站视频入口，正文受访问限制',date:'2026-04-17',url:'https://www.bilibili.com/video/BV18xdzBPEGP/'},{title:'权水 · 诸葛亮教学（旧版）',kind:'玩家教学入口，不作当前规则证据',date:'2026-04',url:'https://www.bilibili.com/video/BV1GNoZBsENa/'}])}<h2>没有真实记录时</h2><p>20–30局可暴露操作问题，不能证明一个将的强弱；100局分散到多个将和座次后，子样本仍可能很小。个人表当前为空，因此不把任何“长期正收益”“最强将”结论写成你的事实。</p>`}
  ];
  function renderGuides(id) {
    if(id){const g=guides.find(g=>g.id===id);if(!g)return renderNotFound();document.title=g.title+' | 百将牌研究库';main.innerHTML=`<div class="reading"><a class="backlink" href="#guide">← 返回实战研究</a><p class="eyebrow">${g.label} / 2026.10.17</p><h1>${g.title}</h1><p class="page-lead">${g.description}</p><article class="article-body">${g.html}</article></div>`;return;}
    document.title='实战研究 | 百将牌研究库';
    main.innerHTML=`<div class="text-page">${intro('PLAYBOOK','从技能条件到完整赢法','基于10月研究报告重新整理。侧重三人场的牌权成本、双农民分工与净收益，不用未经统计的梯度榜代替实战。')}<div class="guide-grid">${guides.map((g,i)=>`<article class="guide-card"><span class="num">0${i+1} / ${g.label}</span><h2>${g.title}</h2><p>${g.description}</p><a href="#guide/${g.id}">阅读全文 →</a></article>`).join('')}</div><p class="footnote">选将建议为研究推断，适配手牌用于发牌后的叫主和走牌。未对用户个人牌技、回撤原因作无样本归因。</p></div>`;
  }
  const changes=[
    ['2026-10-14','三将调整与兵力场重新校准','张辽袭破3→2次，扩为含8的同牌型；聚势增加开局得8。程昱失去伏兵即可再设伏，伏兵点数不向其他玩家展示。袁绍号令取得被弃对子由强制改为可选。初中级炸弹倍率加法叠加，房间底分与封顶调整。',refs.patch],
    ['2026-10-08','甘夫人上线','淑慎按手牌左右半区变化点数，按全场25/35张门槛增加次数。可变王不代表能组成同王对子或炸弹。',refs.gan],
    ['2026-09-16','S2与夏侯渊炸弹保护','荀彧、步练师、华雄进入限时招募，张春华上线；巡察影响随机推将。神速新增炸弹内牌不变。高级场准入改为30万以上。',refs.s2],
    ['2026-08-26','典韦残局加层限制取消','不屈删除“手牌≤3张时不增加层数”。残局仍需正常计算加层，旧库的停止线作废。',refs.meng],
    ['2026-08-05','徐庶破阵门槛放宽','恰高1点的同型压牌，至少张数门槛由4降为2。不是任意对子都能触发，也不能省略恰高1点的条件。','https://www.taptap.cn/moment/833664577869709666'],
    ['2026-07-15','赵云冲阵改版的官方历史基线','公告写≤A单牌/对子被压回收升点，累计7张；用户9/6较新面板没有≤A条件。本库保留两个版本，不把旧公告倒盖新面板。','https://www.taptap.cn/moment/826202440427637516']
  ];
  function renderUpdates() {
    document.title='版本记录与来源 | 百将牌研究库';
    main.innerHTML=`<div class="text-page">${intro('VERSION NOTES','版本先行，结论留痕','资料截止2026-10-17，最近完整维护公告基线为10-14。官方、历史面板、实测与推断各有边界，不承诺已覆盖客户端全武将。')}
      <div class="notice green">本轮旧库42将扩至${D.heroes.length}将，新增${D.heroes.filter(h=>h.new).length}将；保留旧档可追溯。原表中真实对局为0，主目录不再用旧10分制排名，旧分数只在历史区保留。</div>
      <div class="timeline">${changes.map(([date,title,body,url])=>`<article class="timeline-item"><time>${date}</time><div><h2>${title}</h2><p>${body}</p>${external(url,'查看原始公告／官方介绍')}</div></article>`).join('')}</div>
      <section style="margin-top:40px"><h2>未强行消除的版本差异</h2><div class="conflict-list">${Object.entries(D.conflicts).map(([name,note])=>`<a href="${heroUrl(name)}"><h3>${name} →</h3><p>${esc(note)}</p></a>`).join('')}</div></section>
      ${D.unresolvedNames.length?`<section style="margin-top:40px"><h2>仅有姓名线索，未伪造完整卡面</h2><p class="page-lead">${D.unresolvedNames.map(esc).join('、')}。已执行公开检索，但本轮未取得足以组成可靠完整档案的独立资料。这个名单不是当前客户端全名录。</p></section>`:''}
      <section style="margin-top:40px"><h2>资料口径与公开入口</h2><p class="page-lead">用户提供的41页研究报告与45将表格用于组织线索，再回查官方公开正文。个人经历、余额和原始截图不随本站发布；只发布整理后的游戏研究。</p>${sourceList([{title:'三国：百将牌官方网站',url:'https://game.bilibili.com/ncard/gw/',kind:'官方入口；部分内容为动态页面',date:'2026-10-17核查'},{title:'TapTap官方公告',url:'https://www.taptap.cn/app/774226/topic?type=official',kind:'版本与独立武将正文',date:'2026-10-17核查'}])}<p class="footnote">B站视频访问存在412限制，未将未观看的视频当实测证据。每个武将的直接来源列在详情页；本轮只核部分技能的角色会明确标为局部补丁。<a href="data.json" download="baijiangpai-public-research.json">下载公开研究数据 JSON</a>（不含本机个人复盘）。</p></section></div>`;
  }
  function journalRows(){return rows.filter(r=>journalFilter==='全部身份'||r.role===journalFilter);}
  function metric(label,value,caption){return `<div class="journal-stat"><span>${label}</span><strong>${value}</strong><small>${caption}</small></div>`;}
  function localNow(){const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
  function renderJournal() {
    document.title='本地兵力复盘 | 百将牌研究库';
    const r=rows.find(x=>x.id===editId)||{}, selected=journalRows(),stats=L.summarize(selected);
    main.innerHTML=`<div class="text-page">${intro('LOCAL REVIEW','把胜负和兵力分开看','按真实顺序记录每局余额、外部补给和当时的判断。未录入真实数据时，统计保持为空，不用演示战绩填充。')}
      <div class="notice green"><strong>只保存在当前浏览器</strong>，不上传对局数据、不跨设备自动同步。清理网站数据或换浏览器会丢失记录，请定期导出JSON备份。初始表为空，不含任何预置个人战绩。</div>
      ${journalBroken?'<div class="notice"><strong>本地旧记录格式损坏，已停止写入以免覆盖。</strong>请先下载原始内容，再从有效JSON恢复。<br><button id="export-damaged">下载损坏记录原文</button></div>':''}
      <label style="font-size:13px">统计身份 <select id="journal-filter" aria-label="筛选复盘身份">${options(['全部身份',...L.roles],journalFilter)}</select></label>
      <div class="journal-stats">${metric('净对局收益',currency(stats.total),'结束 − 开局 − 外部净流入')}${metric('余额齐全的对局',stats.complete,'缺少余额的记录不参与统计')}${metric('已填胜负的胜率',percent(stats.winRate),`${stats.wins}胜 / ${stats.outcomes}局（余额齐全）`)}${metric('最大回撤',currency(stats.drawdown),'按连续记录顺序，起点为0')}</div>
      <div class="section-top"><h2>${editId?'编辑对局':'记录一局'}</h2><small>数据存本机</small></div>
      <form id="journal-form" class="journal-form">
      <label>日期时间<input name="date" type="datetime-local" value="${esc(r.date||localNow())}" required></label>
      <label>场次<select name="room">${options(L.rooms,r.room||'中级场')}</select></label>
      <label>身份<select name="role">${options(L.roles,r.role||'地主')}</select></label>
      <label>武将<input name="hero" list="hero-names" maxlength="30" value="${esc(r.hero||'')}" placeholder="可留空"></label>
      <datalist id="hero-names">${D.heroes.map(h=>`<option>${esc(h.name)}</option>`).join('')}</datalist>
      <label>胜负<select name="result"><option value="">暂不填</option>${options(['胜','负'],r.result)}</select></label>
      <label>开局兵力（扣费前）<input name="start" type="number" min="0" max="1000000000000" step="1" value="${r.start??''}" placeholder="缺失可留空"></label>
      <label>结束兵力<input name="end" type="number" min="0" max="1000000000000" step="1" value="${r.end??''}" placeholder="缺失可留空"></label>
      <label>外部净流入<input name="flow" type="number" min="-1000000000000" max="1000000000000" step="1" value="${r.flow??0}" placeholder="补助等；流出可填负数"></label>
      <label class="full">关键判断／录像备注<textarea name="note" rows="3" maxlength="2000" placeholder="当时知道什么；两个合法选择；选择依据与风险；事后归因。">${esc(r.note||'')}</textarea></label>
      <div class="form-actions"><button class="primary" type="submit">${editId?'保存修改':'保存本局'}</button>${editId?'<button id="cancel-edit" type="button">取消编辑</button>':''}<span>费用若已计入余额，不再另扣；记录按日期排序。</span></div></form>
      <div class="journal-toolbar"><h2>对局明细</h2><div><button id="export-json">备份 JSON</button><button id="import-json">恢复 JSON</button><button id="export-csv">导出 CSV</button><input class="file-input" id="import-file" type="file" accept=".json,application/json"></div></div>
      ${selected.length?`<div class="journal-table"><table class="data-table"><thead><tr><th>日期</th><th>场次／身份</th><th>武将</th><th>胜负</th><th>净变化</th><th>判断备注</th><th>操作</th></tr></thead><tbody>${[...selected].reverse().map(row=>{const n=L.net(row);return `<tr><td>${esc(row.date.replace('T',' '))}</td><td>${esc(row.room)}<br><small>${esc(row.role)}</small></td><td>${esc(row.hero||'—')}</td><td>${esc(row.result||'未填')}</td><td class="${n>0?'positive':n<0?'negative':''}">${currency(n)}</td><td style="max-width:240px;white-space:pre-wrap;overflow-wrap:anywhere">${esc(row.note||'—')}</td><td><button data-edit="${esc(row.id)}">编辑</button> <button data-delete="${esc(row.id)}">删除</button></td></tr>`;}).join('')}</tbody></table></div>`:'<div class="empty"><h3>尚无真实记录</h3><p>先记录一局，或恢复此前从本页导出的JSON备份。</p></div>'}
      <p class="footnote">共${rows.length}条本地记录；当前筛选${selected.length}条。单局均值：${currency(stats.average)}。漏记大亏或外部流入会使结论失真；筛选身份后的最大回撤仅表示该组对局的累计曲线，不是完整账户余额回撤。</p>
      <h2 style="margin-top:42px">条件计算</h2><p class="page-lead">以下完全由你输入；不是游戏官方收益预测。</p>
      <div class="calc-grid"><section class="calculator"><h3>盈亏平衡胜率</h3><label>赢局平均净赚<input id="avg-win" type="number" min="0" step="any" placeholder="W，含费用"></label><label>输局平均净亏<input id="avg-loss" type="number" min="0" step="any" placeholder="L，用正数"></label><output id="break-even">—</output><p>L ÷ (W + L)。分母为0或数据缺失时不计算；这不是你的实测胜率。</p></section><section class="calculator"><h3>单局风险占比</h3><label>当前余额<input id="balance" type="number" min="0" step="any" placeholder="B"></label><label>已确认的最大单局损失<input id="max-loss" type="number" min="0" step="any" placeholder="U，含费用"></label><output id="risk">—</output><p>U ÷ B。须填你当前身份的真实最大损失，不把公告中口径未明的8万直接当地主全部赔付。</p></section></div>
      <p class="footnote"><a href="#guide/net-return">阅读净收益与回撤的口径说明 →</a></p></div>`;
    document.getElementById('journal-filter').onchange=e=>{journalFilter=e.target.value;renderJournal();};
    document.getElementById('journal-form').onsubmit=e=>{
      e.preventDefault();if(journalBroken){toast('原记录格式损坏，先备份后从有效JSON恢复。');return;}const fd=Object.fromEntries(new FormData(e.target));
      try{const record=L.validateRows([{...fd,id:editId||crypto.randomUUID()}])[0];const next=editId?rows.map(x=>x.id===editId?record:x):[...rows,record];next.sort((a,b)=>a.date.localeCompare(b.date));if(!saveLocal('bjp-journal-v2',next))return;rows=next;editId=null;renderJournal();toast('已保存到当前浏览器。');}catch(err){toast(err.message);}
    };
    if(document.getElementById('cancel-edit'))document.getElementById('cancel-edit').onclick=()=>{editId=null;renderJournal();};
    if(document.getElementById('export-damaged'))document.getElementById('export-damaged').onclick=()=>download(journalRaw,'baijiangpai-damaged-records.txt','text/plain');
    document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{editId=b.dataset.edit;renderJournal();document.getElementById('journal-form').scrollIntoView({behavior:'smooth'});});
    document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{if(!confirm('删除这条本地对局？未导出备份的记录无法恢复。'))return;const next=rows.filter(r=>r.id!==b.dataset.delete);if(!saveLocal('bjp-journal-v2',next))return;rows=next;if(editId===b.dataset.delete)editId=null;renderJournal();toast('该本地记录已删除；有JSON备份可恢复。');});
    document.getElementById('export-json').onclick=()=>download(JSON.stringify({schema:2,exportedAt:new Date().toISOString(),rows},null,2),'baijiangpai-records.json','application/json');
    document.getElementById('export-csv').onclick=()=>{
      const quote=v=>{let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
      const table=[['日期','场次','身份','武将','胜负','开局兵力','结束兵力','外部净流入','净对局收益','备注'],...rows.map(r=>[r.date,r.room,r.role,r.hero,r.result,r.start,r.end,r.flow,L.net(r),r.note])];
      download('\ufeff'+table.map(r=>r.map(quote).join(',')).join('\r\n'),'baijiangpai-records.csv','text/csv;charset=utf-8');
    };
    document.getElementById('import-json').onclick=()=>document.getElementById('import-file').click();
    document.getElementById('import-file').onchange=async e=>{
      const file=e.target.files[0];if(!file)return;
      try{if(file.size>10000000)throw Error('备份文件不能超过10MB。');const backup=JSON.parse(await file.text());if(backup.schema!==2)throw Error('请选择本页导出的第2版JSON备份。');const next=L.validateRows(backup.rows);next.sort((a,b)=>a.date.localeCompare(b.date));if(!confirm(`用备份中的${next.length}条记录替换当前${rows.length}条？建议先备份当前记录。`))return;if(!saveLocal('bjp-journal-v2',next))return;rows=next;journalBroken=false;editId=null;renderJournal();toast('备份已恢复到当前浏览器。');}catch(err){toast('未导入：'+err.message);}finally{e.target.value='';}
    };
    const calculate=()=>{const w=L.number(document.getElementById('avg-win').value),l=L.number(document.getElementById('avg-loss').value),b=L.number(document.getElementById('balance').value),u=L.number(document.getElementById('max-loss').value);document.getElementById('break-even').textContent=w!==null&&l!==null&&w>=0&&l>=0&&w+l>0?percent(l/(w+l)):'—';document.getElementById('risk').textContent=b!==null&&u!==null&&b>0&&u>=0?percent(u/b):'—';};
    ['avg-win','avg-loss','balance','max-loss'].forEach(id=>document.getElementById(id).oninput=calculate);
  }
  function download(content,name,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);toast('已发起下载，请保管好私人备份。');}
  function renderNotFound(){document.title='未找到资料 | 百将牌研究库';main.innerHTML='<div class="empty"><h1>没有找到这份资料</h1><p>链接可能来自旧版本，或姓名尚未收录。</p><a href="#library">返回武将库 →</a></div>';}
  let previousRoute='';
  function route(){
    document.getElementById('toast').classList.remove('visible');
    const raw=location.hash.slice(1)||'library';let parts;try{parts=raw.split('/').map(decodeURIComponent);}catch{return renderNotFound();}
    const [view,id]=parts;document.querySelectorAll('[data-nav]').forEach(a=>{const active=a.dataset.nav===(view==='hero'||view==='compare'?'library':view);a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    if(view==='hero')renderHero(byName(id));else if(view==='compare')renderCompare((id||'').split(','));else if(view==='guide')renderGuides(id);else if(view==='updates')renderUpdates();else if(view==='journal')renderJournal();else if(view==='library')renderLibrary();else renderNotFound();
    renderTray();if(view==='library'&&previousRoute.startsWith('hero'))requestAnimationFrame(()=>window.scrollTo({top:scrollBeforeDetail,behavior:'instant'}));else window.scrollTo({top:0,behavior:'instant'});previousRoute=raw;
  }
  window.addEventListener('hashchange',route);
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&document.getElementById('search')){e.preventDefault();document.getElementById('search').focus();}});
  route();
})();
