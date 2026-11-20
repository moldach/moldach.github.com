async page => {
 const base='http://127.0.0.1:4322',url=base+'/review/page-turn/'; const result={},errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const ready=()=>page.waitForFunction(()=>JSON.parse(document.querySelector('[data-metrics]')?.textContent||'{}').servicesReady,null,{timeout:45000});
 const settled=chapter=>page.waitForFunction(c=>{const r=document.querySelector('[data-page-turn]');return r?.dataset.state==='settled'&&r.dataset.selected===c},chapter,{timeout:15000});
 const data=()=>page.locator('[data-metrics]').textContent().then(JSON.parse);
 const assert=(v,m)=>{if(!v)throw Error(m)};
 await page.setViewportSize({width:1536,height:1250});await page.goto(url);await ready();
 const history=await page.evaluate(()=>window.history.length);let initial=await data();assert(initial.approvedImages.length===10,'Missing images');
 await page.screenshot({path:'output/playwright/turn-start-settled.png'});
 await page.locator('[data-chapter="1"]').click();await settled('services');result.forward=await data();assert(await page.locator('[data-chapter="1"]').getAttribute('aria-current')==='page','Wrong selected tab');await page.screenshot({path:'output/playwright/turn-services-settled.png'});
 await page.locator('[data-chapter="0"]').click();await settled('start');result.reverse=await data();
 // Queue the latest request without restarting the first turn.
 await page.locator('[data-chapter="1"]').click();await page.waitForFunction(()=>document.querySelector('[data-page-turn]').dataset.state==='turning');await page.locator('[data-chapter="1"]').click();await page.locator('[data-chapter="0"]').click();await settled('start');result.latestRequestWins=true;
 assert(page.url()===url,'Changed review URL');assert(await page.evaluate(()=>window.history.length)===history,'Added history entries');result.historyUnchanged=true;
 await page.locator('[data-chapter="1"]').focus();await page.keyboard.press('Enter');assert((await data()).state==='settled','Keyboard should switch directly');assert((await data()).selected==='services','Keyboard target wrong');result.keyboardImmediate=true;
 // Pause/resume the controller using a controlled document-visibility event.
 await page.locator('[data-chapter="0"]').click();await page.waitForFunction(()=>Number(JSON.parse(document.querySelector('[data-metrics]').textContent).progress)>.15);await page.evaluate(()=>{window.__reviewHidden=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__reviewHidden});document.dispatchEvent(new Event('visibilitychange'))});const paused=(await data()).progress;
 await page.waitForTimeout(250);assert((await data()).progress===paused,'Hidden animation advanced');await page.evaluate(()=>{window.__reviewHidden=false;document.dispatchEvent(new Event('visibilitychange'))});await settled('start');result.visibilityPause=true;
 await page.goto(url+'?capture');await ready();
 for(const to of ['services','start'])for(const progress of [.25,.5,.75]){await page.locator('[data-page-turn]').evaluate((el,detail)=>el.dispatchEvent(new CustomEvent('review-seek',{detail})),{to,progress});await page.screenshot({path:`output/playwright/turn-${to}-${progress*100}.png`});}
 // Normal links retain the other four chapter destinations.
 await page.goto(url);await ready();result.otherChapters=await page.locator('[data-chapter]').evaluateAll(els=>els.slice(2).map(el=>el.getAttribute('href')));assert(result.otherChapters.join(',')==='/work/,/writing/,/about/,/contact/','Other destinations changed');
 await page.locator('[data-chapter="1"]').focus();await page.keyboard.press('Enter');await page.locator('[data-open-chapter]').click();await page.waitForURL(base+'/services/');result.openChapterPage=true;
 const browser=page.context().browser();
 const mobile=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const mp=await mobile.newPage();await mp.goto(url);await mp.waitForFunction(()=>JSON.parse(document.querySelector('[data-metrics]').textContent).servicesReady,null,{timeout:45000});await mp.locator('[data-chapter="1"]').tap();await mp.waitForFunction(()=>document.querySelector('[data-page-turn]').dataset.selected==='services'&&document.querySelector('[data-page-turn]').dataset.state==='settled');result.mobile=JSON.parse(await mp.locator('[data-metrics]').textContent());await mp.screenshot({path:'output/playwright/turn-mobile.png'});await mobile.close();
 const reduced=await browser.newContext({reducedMotion:'reduce'});const rp=await reduced.newPage();await rp.goto(url);await rp.waitForFunction(()=>JSON.parse(document.querySelector('[data-metrics]').textContent).servicesReady,null,{timeout:45000});await rp.locator('[data-chapter="1"]').click();assert(await rp.locator('[data-page-turn]').getAttribute('data-state')==='settled','Reduced motion animated');result.reducedMotion=true;await reduced.close();
 for(const type of ['nojs','nogl','failed-services']){const ctx=await browser.newContext(type==='nojs'?{javaScriptEnabled:false}:{});if(type==='nogl')await ctx.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:get.call(this,type,...args)}});if(type==='failed-services')await ctx.route('**/models/page-turn/services.glb',r=>r.abort());const p=await ctx.newPage();await p.goto(url);if(type==='failed-services'){await p.locator('[data-retry]').waitFor({state:'visible'});await ctx.unroute('**/models/page-turn/services.glb');await p.locator('[data-retry]').click();await p.waitForFunction(()=>JSON.parse(document.querySelector('[data-metrics]').textContent).servicesReady,null,{timeout:45000});result.retry=true;}else{await p.locator('[data-chapter="1"]').click();await p.waitForURL(base+'/services/');result[type]=true;}await ctx.close();}
 assert(!errors.length,errors.join('\n'));result.pageErrors=errors;return result;
}
