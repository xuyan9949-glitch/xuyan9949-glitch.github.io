(() => {
'use strict';
if(document.body.dataset.page!=='article')return;
const content=document.querySelector('.article-content'), main=document.querySelector('.article-page');
if(!content||!main)return;
content.querySelectorAll('img').forEach(img=>{const missing=()=>{const note=document.createElement('p');note.className='notice';note.textContent='原图暂缺：'+(img.alt||'未命名图片')+'。图片文件未随原文归档。';img.replaceWith(note);};img.addEventListener('error',missing,{once:true});if(img.complete&&img.naturalWidth===0)missing();});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=location.pathname.split('/').filter(Boolean).at(-1), key='xxyalpha.reading.'+id;
const headings=[...content.querySelectorAll('h2,h3')];
headings.forEach((h,i)=>{if(!h.id)h.id='reading-section-'+(i+1);});
const toolbar=document.createElement('section');toolbar.className='reader-toolbar';toolbar.setAttribute('aria-label','阅读工具');
const exported=window.articleDownloads?.[id],sourceHash=document.querySelector('meta[name="article-source-hash"]')?.content;
const ready=exported&&exported.sourceHash===sourceHash;
const filename=(main.querySelector('h1')?.textContent||id).replace(/[\\/:*?"<>|]/g,'-').trim();
toolbar.innerHTML=`<div class="reader-controls"><button type="button" id="reader-toc-toggle" aria-expanded="false" aria-controls="reader-toc">章节目录 <span>${headings.length}</span></button><label class="reader-size-label">字号 <select id="reader-size" aria-label="正文字号"><option value="17">标准</option><option value="19">大字</option><option value="21">特大</option></select></label><button type="button" id="reader-focus" aria-pressed="false">专注阅读</button></div><div class="reader-downloads">${ready?`<a href="${esc(exported.pdf)}" download="${esc(filename)}.pdf">下载 PDF ↓</a><a href="${esc(exported.docx)}" download="${esc(filename)}.docx">下载 Word ↓</a>`:'<span class="muted">下载文件待生成</span>'}</div><div class="reader-status"><span id="reader-current">从这里开始阅读</span><span id="reader-percentage">0%</span></div><div class="reader-progress" aria-hidden="true"><i></i></div>`;
content.before(toolbar);
const toc=document.createElement('nav');toc.id='reader-toc';toc.className='reader-toc';toc.setAttribute('aria-label','文章章节目录');toc.hidden=true;
toc.innerHTML=`<div class="reader-toc-heading"><strong>文章目录</strong><button type="button" id="reader-toc-close" aria-label="关闭章节目录">关闭 ×</button></div>${headings.length?`<ol>${headings.map(h=>`<li class="level-${h.tagName.toLowerCase()}"><a href="#${encodeURIComponent(h.id)}">${esc(h.textContent)}</a></li>`).join('')}</ol>`:'<p>这篇文章没有章节标题。</p>'}`;
main.append(toc);
const toggle=document.querySelector('#reader-toc-toggle');
function setTOC(open){toc.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(open)toc.querySelector('a,button')?.focus();}
toggle.addEventListener('click',()=>setTOC(toc.hidden));document.querySelector('#reader-toc-close').addEventListener('click',()=>{setTOC(false);toggle.focus();});
toc.addEventListener('click',e=>{if(e.target.closest('a'))setTOC(false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!toc.hidden){setTOC(false);toggle.focus();}});
let size='17';try{size=localStorage.getItem('xxyalpha.reading.size')||'17';}catch{}
if(!['17','19','21'].includes(size))size='17';
const sizeInput=document.querySelector('#reader-size');sizeInput.value=size;content.style.setProperty('--reading-font-size',size+'px');
sizeInput.addEventListener('change',()=>{content.style.setProperty('--reading-font-size',sizeInput.value+'px');try{localStorage.setItem('xxyalpha.reading.size',sizeInput.value);}catch{}});
document.querySelector('#reader-focus').addEventListener('click',e=>{const on=document.body.classList.toggle('reader-focused');e.currentTarget.setAttribute('aria-pressed',String(on));e.currentTarget.textContent=on?'退出专注':'专注阅读';});
let saved=null;try{saved=JSON.parse(localStorage.getItem(key));}catch{}
if(saved&&typeof saved.heading==='string'&&saved.sourceHash===sourceHash&&document.getElementById(saved.heading)&&!location.hash){const resume=document.createElement('div');resume.className='reader-resume';const heading=document.getElementById(saved.heading);resume.innerHTML=`<span>上次读到：${esc(heading.textContent)}</span><button type="button">继续阅读 →</button>`;toolbar.before(resume);resume.querySelector('button').addEventListener('click',()=>{heading.scrollIntoView({behavior:'smooth',block:'start'});history.replaceState(null,'','#'+encodeURIComponent(heading.id));resume.remove();});}
let activeHeading=null, raf=false;
function update(){raf=false;const top=content.getBoundingClientRect().top+window.scrollY;const range=Math.max(1,content.offsetHeight-window.innerHeight+140);const percent=Math.round(Math.max(0,Math.min(1,(window.scrollY-top+140)/range))*100);document.querySelector('#reader-percentage').textContent=percent+'%';document.querySelector('.reader-progress i').style.width=percent+'%';const passed=headings.filter(h=>h.getBoundingClientRect().top<=165);const current=passed.at(-1);activeHeading=current?.id||null;document.querySelector('#reader-current').textContent=current?.textContent||'从这里开始阅读';toc.querySelectorAll('a').forEach(a=>{if(decodeURIComponent(a.hash.slice(1))===activeHeading)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
function save(){if(!activeHeading)return;try{localStorage.setItem(key,JSON.stringify({heading:activeHeading,sourceHash,savedAt:new Date().toISOString()}));}catch{}}
window.addEventListener('scroll',()=>{if(!raf){raf=true;requestAnimationFrame(update);}},{passive:true});window.addEventListener('resize',update);window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save();});
const interval=setInterval(save,5000);window.addEventListener('pagehide',()=>clearInterval(interval),{once:true});
const sections=document.createElement('nav');sections.className='reader-section-jump';sections.setAttribute('aria-label','前后章节');sections.innerHTML='<button type="button" data-direction="previous">↑ 上一节</button><button type="button" data-direction="next">下一节 ↓</button>';
main.append(sections);sections.addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;const i=headings.findIndex(h=>h.id===activeHeading);const index=button.dataset.direction==='next'?Math.min(headings.length-1,i+1):Math.max(0,i-1);headings[index]?.scrollIntoView({behavior:'smooth',block:'start'});});
update();
})();
