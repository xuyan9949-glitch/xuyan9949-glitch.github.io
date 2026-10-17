const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {chromium}=require('playwright');
const origin=process.env.BJP_QA_URL||'http://127.0.0.1:8847/baijiangpai/';
const screenshots=process.env.BJP_QA_OUTPUT||'/private/tmp';
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();const errors=[];const failed=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(origin.split('/baijiangpai/')[0])&&r.status()>=400)failed.push(r.status()+' '+r.url());});
  let checks=0;function ok(name){checks++;console.log('PASS '+name);}
  async function settle(){await page.evaluate(()=>{window.scrollTo({top:0,behavior:'instant'});return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});}
  await page.goto(origin);await page.waitForSelector('.hero-card');
  const total=await page.locator('.hero-card').count();assert(total>=58);ok('catalogue loads '+total+' heroes');
  await page.locator('#search').fill('麋夫人');assert.equal(await page.locator('.hero-card').count(),1);assert.match(await page.locator('.hero-name').innerText(),/糜/);ok('alias search');
  await page.locator('#search').fill('NO-MATCH-123');await page.getByRole('button',{name:'清除全部筛选'}).click();assert.equal(await page.locator('.hero-card').count(),total);ok('empty state reset');
  await page.locator('[data-faction="吴"]').click();assert(await page.locator('.hero-card').count()<total);assert((await page.locator('.hero-card .faction').allTextContents()).every(x=>x==='吴'));ok('faction filter');
  await page.locator('#reset').click();await page.locator('#new-only').check();const newCount=await page.locator('.hero-card').count();assert(newCount>=16&&newCount<total);await page.locator('#new-only').uncheck();ok('new filter');
  await page.locator('[data-compare]').nth(0).check();await page.locator('[data-compare]').nth(1).check();await page.locator('#open-compare').click();await page.waitForSelector('.compare-table');assert.equal(await page.locator('.compare-table th').count(),2);ok('two hero comparison');
  await page.goto(origin+'#hero/'+encodeURIComponent('张辽'));await page.waitForSelector('#rules');assert.match(await page.locator('#rules').innerText(),/限2次/);await page.locator('#favorite').click();assert.equal(await page.locator('#favorite').innerText(),'已设为常用');await page.reload();assert.equal(await page.locator('#favorite').innerText(),'已设为常用');ok('deep link, correction and favorite persistence');
  await settle();await page.screenshot({path:path.join(screenshots,'bjp-detail-desktop.png')});
  const names=await page.evaluate(()=>window.BJP_DATA.heroes.map(h=>h.name));
  for(const name of names){await page.goto(origin+'#hero/'+encodeURIComponent(name));await page.waitForSelector('#rules');assert.match(await page.locator('h1').innerText(),new RegExp(name));assert.equal(await page.locator('img').count(),0);}ok('all hero details load without images');
  for(const tab of ['guide','updates','journal']){await page.goto(origin+'#'+tab);await page.waitForSelector('h1');assert((await page.locator('h1').innerText()).length>2);}ok('all main sections');
  await page.goto(origin+'#guide');const links=await page.locator('.guide-card>a').evaluateAll(a=>a.map(x=>x.hash));for(const hash of links){await page.goto(origin+hash);await page.waitForSelector('.reading .article-body');assert((await page.locator('.article-body').innerText()).length>350);}ok('six substantive research articles');
  await page.goto(origin+'#journal');assert.match(await page.locator('.empty').innerText(),/尚无真实记录/);assert.equal(await page.locator('.journal-stat strong').nth(0).innerText(),'—');
  await page.locator('#avg-win').fill('40000');await page.locator('#avg-loss').fill('70000');assert.equal(await page.locator('#break-even').innerText(),'63.6%');await page.locator('#balance').fill('1000000');await page.locator('#max-loss').fill('80000');assert.equal(await page.locator('#risk').innerText(),'8.0%');ok('conditional calculators and empty baseline');
  await page.locator('[name="date"]').fill('2026-10-17T10:00');await page.locator('[name="start"]').fill('100000');await page.locator('[name="end"]').fill('90000');await page.locator('[name="flow"]').fill('10000');await page.locator('[name="result"]').selectOption('负');await page.locator('[name="note"]').fill('<img src=x onerror=alert(1)>');await page.getByRole('button',{name:'保存本局'}).click();assert.equal(await page.locator('.journal-stat strong').nth(0).innerText(),'-20,000');assert.equal(await page.locator('img').count(),0);assert.match(await page.locator('.data-table').innerText(),/<img/);ok('local record saves, calculates, escapes text');
  await page.reload();assert.equal(await page.locator('.data-table tbody tr').count(),1);await page.locator('[data-edit]').click();await page.locator('[name="end"]').fill('120000');await page.locator('[name="result"]').selectOption('胜');await page.getByRole('button',{name:'保存修改'}).click();assert.equal(await page.locator('.journal-stat strong').nth(0).innerText(),'10,000');ok('edit and reload persistence');
  const downloadPromise=page.waitForEvent('download');await page.locator('#export-json').click();const download=await downloadPromise;const backupPath=path.join(screenshots,'bjp-qa-backup.json');await download.saveAs(backupPath);const backup=JSON.parse(fs.readFileSync(backupPath));assert.equal(backup.rows.length,1);ok('JSON backup');
  page.on('dialog',d=>d.accept());await page.locator('[data-delete]').click();assert.match(await page.locator('.empty').innerText(),/尚无真实记录/);await page.locator('#import-file').setInputFiles(backupPath);await page.waitForSelector('.data-table');assert.equal(await page.locator('.data-table tbody tr').count(),1);ok('delete and restore validated backup');
  await settle();await page.screenshot({path:path.join(screenshots,'bjp-journal-desktop.png'),fullPage:true});
  for(const width of [390,360]){
    await page.setViewportSize({width,height:844});
    for(const route of ['library','hero/'+encodeURIComponent('张辽'),'guide','guide/tempo','updates','journal','compare/'+encodeURIComponent('张辽')+','+encodeURIComponent('诸葛亮')]){
      await page.goto(origin+'#'+route);await page.waitForSelector('h1');await settle();
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+' overflow '+route);
      if(width===390&&['library','journal','hero/'+encodeURIComponent('张辽')].includes(route))await page.screenshot({path:path.join(screenshots,'bjp-'+(route.startsWith('hero')?'detail':route)+'-mobile.png'),fullPage:route!=='library'});
    }
  }ok('390px and 360px all views, no document overflow');
  await page.setViewportSize({width:1440,height:1000});await page.goto(origin+'#library');await settle();await page.screenshot({path:path.join(screenshots,'bjp-desktop-final.png')});
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);ok('no browser errors or failed site resources');
  await browser.close();console.log(JSON.stringify({checks,total,newCount,errors,failed,origin}));
})().catch(e=>{console.error(e);process.exit(1);});
