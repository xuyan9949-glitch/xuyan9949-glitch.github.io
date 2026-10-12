const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname, '..');
const records = 'xxyalpha.research-notebook.v1';
const pending = company => records + '.input.' + (company || 'general');
function load(company = 'MU', storage = {}) {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'workbench/index.html'), 'utf8'), {url:'https://www.xxyalpha.cn/workbench/?company=' + company, runScripts:'outside-only'});
  for (const [key,value] of Object.entries(storage)) dom.window.localStorage.setItem(key,value);
  dom.window.eval(['articles','calendar-data','archive-data','journal','publisher-entry','notebook-input'].map(script=>fs.readFileSync(path.join(root,'js',script+'.js'),'utf8')).join('\n'));
  return dom;
}
function input(dom, name, value) {
  const field = dom.window.document.querySelector('#note-form').elements.namedItem(name);
  field.value = value;
  field.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
}
function submit(dom) { dom.window.document.querySelector('#note-form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})); }
let checks = 0;
function test(name,fn) { fn(); checks++; console.log('PASS',name); }
test('Unfinished input survives reload, opens the notebook and stays unpublished', () => {
  const d = load(); input(d,'title','尚未完成'); input(d,'observed','原始观察');
  const raw = d.window.localStorage.getItem(pending('MU'));
  assert.equal(d.window.localStorage.getItem(records),null);
  const reloaded = load('MU',{[pending('MU')]:raw});
  assert.equal(reloaded.window.document.querySelector('[name=title]').value,'尚未完成');
  assert.equal(reloaded.window.document.querySelector('[name=observed]').value,'原始观察');
  assert.equal(reloaded.window.document.querySelector('#private-notebook').open,true);
  const other = load('LITE',{[pending('MU')]:raw});
  assert.equal(other.window.document.querySelector('[name=title]').value,'');
  assert.equal(other.window.document.querySelector('#note-company').value,'LITE');
  for (const dom of [d,reloaded,other]) dom.window.close();
});
test('Successful save clears pending input and preserves company for the next record', () => {
  const d=load(); input(d,'title','第一条'); input(d,'observed','观察'); submit(d);
  assert.equal(d.window.localStorage.getItem(pending('MU')),null);
  assert.equal(d.window.document.querySelector('#note-company').value,'MU');
  input(d,'title','第二条'); input(d,'observed','新观察'); submit(d);
  assert.deepEqual(JSON.parse(d.window.localStorage.getItem(records)).map(n=>n.company),['MU','MU']); d.window.close();
});
test('Validation failures retain unfinished input and create no saved record', () => {
  const d=load(); input(d,'title','待补观察'); const raw=d.window.localStorage.getItem(pending('MU')); submit(d);
  assert.equal(d.window.localStorage.getItem(pending('MU')),raw);
  assert.equal(d.window.localStorage.getItem(records),null); d.window.close();
});
test('Corrupt pending data is preserved, and storage failures retain the form', () => {
  const d=load('MU',{[pending('MU')]:'{broken'}); input(d,'title','正在写');
  assert.equal(d.window.localStorage.getItem(pending('MU')),'{broken');
  assert.ok(d.window.document.querySelector('#input-status').textContent.includes('不可用')); d.window.close();
  const denied=load(); denied.window.Storage.prototype.setItem=function(){throw Error('quota');}; input(denied,'title','保留输入');
  assert.equal(denied.window.document.querySelector('[name=title]').value,'保留输入');
  assert.ok(denied.window.document.querySelector('#input-status').textContent.includes('不可用')); denied.window.close();
});
test('Changes from another tab cannot be overwritten by stale pending input or saved records', () => {
  const d=load(); input(d,'title','本页'); const newer='{"version":1,"values":{}}'; d.window.localStorage.setItem(pending('MU'),newer); input(d,'observed','保留');
  assert.equal(d.window.localStorage.getItem(pending('MU')),newer);
  assert.ok(d.window.document.querySelector('#input-status').textContent.includes('另一页面'));
  d.window.localStorage.setItem(records,'[]'); submit(d);
  assert.equal(d.window.localStorage.getItem(records),'[]');
  assert.equal(d.window.document.querySelector('[name=observed]').value,'保留');
  assert.ok(d.window.document.querySelector('#save-status').textContent.includes('另一页面')); d.window.close();
});
test('Company context links back to the archive and accompanies both publisher actions', () => {
  const d=load(); const link=d.window.document.querySelector('#workbench-company a');
  assert.equal(link.getAttribute('href'),'/research/mu/?tab=journal');
  assert.equal(d.window.document.querySelector('#workbench-company').hidden,false);
  for (const a of d.window.document.querySelectorAll('[data-publisher]')) assert.equal(new URL(a.href).searchParams.get('company'),'MU'); d.window.close();
  const unknown=load('<bad>'); assert.equal(unknown.window.document.querySelector('#workbench-company').hidden,true); unknown.window.close();
});
console.log(`Completed ${checks} notebook checks. DOM tests only.`);
