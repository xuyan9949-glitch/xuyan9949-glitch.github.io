const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),route='/articles/mu-fy2026-q3-earnings/';
function load(storage={}){const dom=new JSDOM(fs.readFileSync(path.join(root,route,'index.html'),'utf8'),{url:'https://www.xxyalpha.cn'+route,runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;w.HTMLElement.prototype.scrollIntoView=function(){this.dataset.scrolled='true';};for(const [k,v] of Object.entries(storage))w.localStorage.setItem(k,v);w.eval(['articles','calendar-data','archive-data','journal','downloads','reader'].map(x=>fs.readFileSync(path.join(root,'js/'+x+'.js'),'utf8')).join('\n'));return dom;}
function click(d,s){d.window.document.querySelector(s).click();}
let d=load(),doc=d.window.document;
assert.ok(doc.querySelectorAll('#reader-toc a').length>5);
assert.ok(doc.querySelector('#reader-toc').hidden);click(d,'#reader-toc-toggle');assert.equal(doc.querySelector('#reader-toc-toggle').getAttribute('aria-expanded'),'true');assert.equal(doc.querySelector('#reader-toc').hidden,false);click(d,'#reader-toc a');assert.ok(doc.querySelector('#reader-toc').hidden);
for(const a of doc.querySelectorAll('.reader-downloads a')){assert.ok(fs.existsSync(path.join(root,a.getAttribute('href'))));assert.ok(a.hasAttribute('download'));}
assert.equal(doc.querySelectorAll('.reader-downloads a').length,2);
click(d,'#reader-focus');assert.ok(doc.body.classList.contains('reader-focused'));click(d,'#reader-focus');assert.ok(!doc.body.classList.contains('reader-focused'));
doc.querySelector('#reader-size').value='21';doc.querySelector('#reader-size').dispatchEvent(new d.window.Event('change'));assert.equal(doc.querySelector('.article-content').style.getPropertyValue('--reading-font-size'),'21px');assert.equal(d.window.localStorage.getItem('xxyalpha.reading.size'),'21');
const hash=doc.querySelector('[name=article-source-hash]').content,heading=doc.querySelector('.article-content h2').id;d.window.close();
d=load({'xxyalpha.reading.mu-fy2026-q3-earnings':JSON.stringify({heading,sourceHash:hash})});doc=d.window.document;assert.ok(doc.querySelector('.reader-resume'));click(d,'.reader-resume button');assert.equal(doc.getElementById(heading).dataset.scrolled,'true');assert.ok(!doc.querySelector('.reader-resume'));d.window.close();
d=load({'xxyalpha.reading.mu-fy2026-q3-earnings':JSON.stringify({heading,sourceHash:'outdated'})});assert.ok(!d.window.document.querySelector('.reader-resume'));d.window.close();
d=load({'xxyalpha.reading.mu-fy2026-q3-earnings':'invalid json','xxyalpha.reading.size':'bad'});assert.equal(d.window.document.querySelector('#reader-size').value,'17');d.window.close();
console.log('PASS reader TOC, downloads, focus, font preference, resume, stale-content and corrupt-storage handling');
