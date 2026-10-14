(() => {
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const types={dossier:'投研全文',story:'公司故事',concept:'概念研究'};
const icons=()=>{if(window.lucide)window.lucide.createIcons();};
function renderCompany(c,list,articleRow){
 const p=c.profile,docs=c.documents||[],params=new URLSearchParams(location.search),query=params.get('q')||'',sector=params.get('sector')||'',tabs=[['overview','公司概览'],['thesis','研究判断'],['financials','财务分析'],['journal','研究跟踪']];
 let tab=tabs.some(([id])=>id===params.get('tab'))?params.get('tab'):params.get('tab')==='catalysts'?'thesis':'overview';
 const host=document.getElementById('company-detail');
 const link=d=>d.file+'?'+new URLSearchParams({company:c.id,from:tab,...(query?{q:query}:{}),...(sector?{sector}:{})}).toString();
 const points=()=>'<div class="mm-points">'+p.points.map(([title,text])=>'<div><h3>'+esc(title)+'</h3><p>'+esc(text)+'</p></div>').join('')+'</div>';
 const figures=()=>'<div class="mm-financials">'+p.metrics.map(([label,value,type])=>'<div><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><small>'+esc(type)+'</small></div>').join('')+'</div>';
 const reference=()=>'<details class="mm-original-note"><summary>引用来源</summary>'+p.sources.map(([name,url])=>'<p><a href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(name)+' ↗</a></p>').join('')+'</details>';
 function books(){return '<section class="mm-reading-section"><h2>读懂这家公司</h2><div class="mm-reading-choice"><img class="mm-cover" src="/images/research/'+esc(p.hero)+'" alt="'+esc(p.name)+'业务示意"><div>'+['dossier','story'].map(kind=>{const d=docs.find(x=>x.kind===kind);if(!d)return '<div class="mm-missing">'+types[kind]+' · 原稿待补</div>';const index=(window.researchDocuments||[]).find(x=>x.id===d.id),reading=index?.reading;return '<a class="mm-choice mm-doc-link" href="'+esc(link(d))+'"><small>'+types[kind]+(reading?' · '+reading.parts.length+' 个篇章':'')+'</small><strong class="mm-serif">'+esc(kind==='dossier'?p.headline:d.title)+'</strong><p>'+esc(kind==='dossier'?p.headline2:'人物、关键选择与公司的演变。')+'</p><span class="mm-open">开始阅读 →</span></a>';}).join('')+'</div></div></section>';}
 function draw(){
  const primary=docs.find(d=>d.kind==='dossier'),earnings=list.filter(a=>/财报|业绩|earnings|季度/i.test(a.title+' '+a.id+' '+(a.tags||[]).join(' '))),concepts=docs.filter(d=>d.kind==='concept');
  const panes={
   overview:()=>'<div class="mm-brief"><div class="mm-eyebrow">THE COMPANY AT A GLANCE</div><h2 class="mm-serif">'+esc(p.headline)+'，<br>'+esc(p.headline2)+'。</h2><p>'+esc(p.thesis)+'</p>'+points()+'</div>'+books(),
   thesis:()=>'<div class="mm-brief mm-thesis-editorial"><h2 class="mm-serif">把判断变成验证。</h2><p>'+esc(p.thesis)+'</p>'+points()+'<section class="mm-risk-section"><h3>需要重新判断的信号</h3><ul class="mm-risk-list">'+p.risks.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></section><section class="mm-window-section"><h3>接下来的验证窗口</h3><div class="mm-timeline">'+p.catalysts.map(([when,what])=>'<div><strong>'+esc(when)+'</strong><p>'+esc(what)+'</p></div>').join('')+'</div></section></div>',
   financials:()=>'<div class="mm-brief"><h2 class="mm-serif">把盈利与现金一起看。</h2><div class="mm-eyebrow">'+(primary?'已归档财报':'故事中的经营资料')+' · '+esc(p.financialPeriod)+'</div>'+(!primary?'<p class="mm-notice">独立投研档案待补，以下仅整理公司故事中的经营资料，不代表完整财报分析。</p>':'')+figures()+'<p>指标沿用 '+esc(p.sourceDate)+' 研究版本；期间、金额与会计口径见原文。</p><h3>财报跟踪</h3>'+(earnings.length?earnings.map(a=>articleRow(a)).join(''):'<p class="mm-empty">新的季度分析将在这里按时间积累。</p>')+reference()+'</div>',
   journal:()=>'<div class="mm-brief"><h2 class="mm-serif">把判断的变化留下来。</h2>'+concepts.map(d=>'<a class="mm-choice" href="'+esc(link(d))+'"><small>概念研究 · '+esc(d.date)+'</small><strong>'+esc(d.title)+'</strong><span class="mm-open">阅读全文 →</span></a>').join('')+(list.length?list.map(a=>articleRow(a)).join(''):'<p class="mm-empty">暂无新增跟踪文章。后续公司动态、买入逻辑和复盘将按日期归档。</p>')+'</div>'};
  host.innerHTML='<div class="magazine"><div class="mm-company-shell"><a class="mm-breadcrumb" href="/research/'+(query||sector?'?'+new URLSearchParams({...(query?{q:query}:{}),...(sector?{sector}:{})}).toString():'')+'">← '+(query?'返回搜索结果':'公司档案')+'</a><header class="mm-company-head"><div><div class="mm-eyebrow">NASDAQ: '+esc(c.id)+' · '+esc(p.industry)+'</div><h1>'+esc(p.name)+'</h1><p>'+esc(p.chinese||p.sector)+'</p></div><img class="mm-logo'+(p.logoTheme==='dark'?' mm-logo-dark':'')+'" src="/images/research/'+esc(p.logo)+'" alt="'+esc(p.name)+' logo"></header><div class="mm-edition">研究版本 '+esc(p.sourceDate)+' · 历史归档</div><nav class="mm-company-tabs" aria-label="公司详情栏目" role="tablist">'+tabs.map(([id,label])=>'<button type="button" role="tab" id="mm-tab-'+id+'" data-company-tab="'+id+'" aria-controls="mm-company-content" aria-selected="'+(id===tab)+'">'+label+'</button>').join('')+'</nav><section id="mm-company-content" class="mm-company-content" role="tabpanel" aria-labelledby="mm-tab-'+tab+'">'+panes[tab]()+'</section></div></div>';
  host.querySelectorAll('[data-company-tab]').forEach(b=>b.addEventListener('click',()=>{if(tab===b.dataset.companyTab)return;tab=b.dataset.companyTab;const u=new URL(location.href);u.searchParams.set('tab',tab);history.pushState(null,'',u);draw();host.querySelector('[data-company-tab="'+tab+'"]').focus();}));icons();
 }
 window.addEventListener('popstate',()=>{const id=new URLSearchParams(location.search).get('tab');tab=tabs.some(([x])=>x===id)?id:'overview';draw();});draw();
}
function renderReader(root,data){
 const article=root.querySelector('.mm-reader-article'),bottom=root.querySelector('.mm-reader-bottom'),params=new URLSearchParams(location.search),origin=data.relatedTickers.includes(params.get('company'))?params.get('company'):data.ticker;
 const from=['overview','thesis','financials','journal'].includes(params.get('from'))?params.get('from'):data.kind==='concept'?'journal':'overview';
 const returnURL='/research/'+origin.toLowerCase()+'/?'+new URLSearchParams({tab:from,...(params.get('q')?{q:params.get('q')}:{}),...(params.get('sector')?{sector:params.get('sector')}:{})}).toString();
 root.querySelector('.mm-return-company').href=returnURL;root.querySelector('.mm-return-company').textContent='← '+origin;
 const key='xxyalpha.magazine.'+data.id+'.'+data.sourceSHA,settingsKey='xxyalpha.magazine.preferences';let part=0,flow='chapters',size=19,menu=null,resume=null;
 try{const s=JSON.parse(localStorage.getItem(settingsKey)||'null');if([17,19,21].includes(s?.size))size=s.size;const r=JSON.parse(localStorage.getItem(key)||'null');if(r&&Number.isInteger(r.part)&&r.part>=0&&r.part<data.parts.length&&['chapters','continuous'].includes(r.flow))resume=r;}catch{}
 root.style.setProperty('--mm-size',size+'px');
 const menus={contents:root.querySelector('.mm-contents-menu'),settings:root.querySelector('.mm-settings-menu')};
 function toggle(name){menu=menu===name?null:name;Object.entries(menus).forEach(([id,node])=>node.hidden=menu!==id);root.querySelectorAll('[data-menu]').forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.menu===menu)));if(menu)root.querySelector('.mm-reader-bar').scrollIntoView({block:'start',behavior:'auto'});}
 function save(){try{localStorage.setItem(key,JSON.stringify({part,flow}));}catch{}}
 function updateURL(hash=''){const u=new URL(location.href);part?u.searchParams.set('part',String(part+1)):u.searchParams.delete('part');flow==='continuous'?u.searchParams.set('view','full'):u.searchParams.delete('view');u.hash=hash;history.replaceState(null,'',u);}
 function openHash(id){const target=root.querySelector('#'+id);if(!target)return;for(let el=target.parentElement;el&&el!==root;el=el.parentElement)if(el.tagName==='DETAILS')el.open=true;target.scrollIntoView({block:'start',behavior:'auto'});}
 function draw(scroll=true,hash='',preserveResume=false){
  const selected=flow==='continuous'?data.parts:[data.parts[part]],cover=part===0||flow==='continuous';
  article.innerHTML='<div class="mm-article-wrap">'+(cover?'<header class="mm-article-cover"><div class="mm-eyebrow">'+esc(types[data.kind])+' / '+esc(data.ticker)+'</div><h1 class="mm-serif">'+esc(data.readingTitle)+'</h1><p class="mm-deck">'+esc(data.deck)+'</p><div class="mm-article-date">资料截至 '+esc(data.date)+' · '+data.parts.length+' 个篇章 · 完整原文</div>'+(data.kind==='story'?'<figure><img src="'+esc(data.hero)+'" alt="'+esc(data.companyName)+'业务示意"><figcaption>业务示意，不作为历史场景照片。</figcaption></figure>':'')+'</header>':'')+(resume&&preserveResume?'<button type="button" class="mm-resume" data-resume>继续上次阅读：'+esc(data.parts[resume.part].title)+' →</button>':'')+selected.map((x,i)=>{const index=flow==='continuous'?i:part;return '<section id="mm-part-'+index+'"><header class="mm-part-heading"><span>CHAPTER '+String(index+1).padStart(2,'0')+' / '+String(data.parts.length).padStart(2,'0')+'</span><h2 class="mm-serif">'+esc(x.title)+'</h2><p>'+esc(x.lead)+'</p></header><div class="mm-body">'+x.html+'</div></section>';}).join('')+'</div>';
  bottom.innerHTML=flow==='continuous'?'<div class="mm-nextbar"><button type="button" data-reader-top>↑ 回到文章开头</button><a href="'+esc(returnURL)+'">返回 '+esc(origin)+' →</a></div>':'<div class="mm-nextbar"><button type="button" '+(part?'data-prev':'data-reader-top')+'>'+(part?'← 上一篇章':'↑ 回到篇首')+'</button>'+(part<data.parts.length-1?'<button type="button" class="mm-next" data-next><small>接下来</small><strong>'+esc(data.parts[part+1].title)+' →</strong></button>':'<a href="'+esc(returnURL)+'">读完了 · 返回 '+esc(origin)+' →</a>')+'</div>';
  bottom.innerHTML+='<div class="mm-footer-tools"><button type="button" data-menu="contents">目录</button><a href="'+esc(returnURL)+'">返回 '+esc(origin)+'</a><span>'+String(part+1)+' / '+data.parts.length+'</span></div>';
  menus.contents.innerHTML='<p>选择篇章或原文章节</p>'+data.parts.map((x,i)=>'<div class="mm-chapter-row"><button type="button" data-part="'+i+'"><span>'+String(i+1).padStart(2,'0')+'</span> '+esc(x.title)+'</button><details><summary>'+x.chapters.length+' 个原文章节</summary>'+x.chapters.map(ch=>'<a href="#'+esc(ch.id)+'" data-chapter="'+esc(ch.id)+'" data-part="'+i+'">'+esc(ch.title)+'</a>').join('')+'</details></div>').join('');
  menu=null;Object.values(menus).forEach(node=>node.hidden=true);root.querySelectorAll('[data-menu]').forEach(b=>b.setAttribute('aria-expanded','false'));root.querySelectorAll('[data-flow]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.flow===flow)));root.querySelectorAll('[data-size]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.size)===size)));icons();
  if(scroll)root.querySelector('.mm-reader-bar').scrollIntoView({block:'start',behavior:'auto'});if(hash)openHash(hash);if(!preserveResume)save();
 }
 root.addEventListener('click',e=>{
  const a=e.target.closest('a[href^="#"]');if(a&&!a.dataset.chapter){const id=decodeURIComponent(a.hash.slice(1)),index=data.parts.findIndex(p=>p.html.includes('id="'+id+'"'));if(index>=0){e.preventDefault();part=index;draw(false,id);updateURL(id);return;}}
  const m=e.target.closest('[data-menu]');if(m){toggle(m.dataset.menu);return;}
  const b=e.target.closest('[data-part]');if(b){e.preventDefault();part=Number(b.dataset.part);const hash=b.dataset.chapter||'';draw(true,hash||(flow==='continuous'?'mm-part-'+part:''));if(hash)openHash(hash);updateURL(hash);return;}
  if(e.target.closest('[data-next]')){part=Math.min(data.parts.length-1,part+1);draw();updateURL();return;}
  if(e.target.closest('[data-prev]')){part=Math.max(0,part-1);draw();updateURL();return;}
  const font=e.target.closest('[data-size]');if(font){size=Number(font.dataset.size);root.style.setProperty('--mm-size',size+'px');root.querySelectorAll('[data-size]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.size)===size)));try{localStorage.setItem(settingsKey,JSON.stringify({size}));}catch{}return;}
  const f=e.target.closest('[data-flow]');if(f){flow=f.dataset.flow;draw();updateURL();return;}
  if(e.target.closest('[data-resume]')){part=resume.part;flow=resume.flow;resume=null;draw(true,flow==='continuous'?'mm-part-'+part:'');updateURL();return;}
  if(e.target.closest('[data-reader-top]'))root.querySelector('.mm-reader-bar').scrollIntoView({block:'start',behavior:'auto'});
 });
 root.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu){toggle(menu);root.querySelector('[data-menu="contents"]').focus();}});
 function initial(){const u=new URL(location.href),id=decodeURIComponent(u.hash.slice(1));part=0;flow=u.searchParams.get('view')==='full'?'continuous':'chapters';const requested=Number(u.searchParams.get('part'));if(Number.isInteger(requested)&&requested>0&&requested<=data.parts.length)part=requested-1;if(id){const index=data.parts.findIndex(p=>p.html.includes('id="'+id+'"')||id==='mm-part-'+data.parts.indexOf(p));if(index>=0)part=index;}draw(false,id,true);}
 window.addEventListener('popstate',initial);window.addEventListener('pagehide',save);initial();
 return {data};
}
window.magazineUI={renderCompany,renderReader};
if(window.researchV0)window.researchV0.renderCompany=renderCompany;
const root=document.querySelector('[data-magazine-reader]');if(root){const data=JSON.parse(root.querySelector('.magazine-data').textContent);renderReader(root,data);}
})();
