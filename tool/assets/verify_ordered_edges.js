async page => {
 const base='http://127.0.0.1:4322',result={};
 const ready=p=>p.waitForFunction(()=>document.querySelector('[data-page-turn]')?.dataset.state==='settled',null,{timeout:60000});
 await page.goto(base+'/');await ready(page);
 await page.evaluate(()=>window.addEventListener('pagehide',()=>sessionStorage.setItem('retarget',document.querySelector('[data-metrics]').textContent),{once:true}));
 await page.locator('[data-chapter="5"]').click();await page.waitForFunction(()=>document.querySelector('[data-page-turn]').dataset.state==='turning');
 await page.locator('[data-chapter="2"]').click();await page.waitForURL(base+'/work/',{timeout:60000});await ready(page);
 result.retarget=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('retarget')).completedTurns);if(result.retarget.length!==2)throw Error('Retarget restarted or skipped');
 await page.goBack();await ready(page);result.back=await page.locator('[data-page-turn]').getAttribute('data-selected');
 await page.route('**/models/page-turn/writing.glb',route=>route.abort());
 await page.locator('[data-chapter="4"]').click();await page.waitForFunction(()=>document.querySelector('[data-page-turn]').dataset.state==='error',null,{timeout:60000});
 result.failedAt=await page.locator('[data-page-turn]').getAttribute('data-selected');if(result.failedAt!=='work')throw Error('Failed chapter skipped');
 result.fallback=await page.locator('[data-open-chapter]').isVisible();
 await page.unroute('**/models/page-turn/writing.glb');await page.locator('[data-retry]').click();await page.waitForURL(base+'/about/',{timeout:60000});await ready(page);result.retry=true;
 const browser=page.context().browser(),mobile=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const p=await mobile.newPage();
 await p.goto(base+'/contact/');await ready(p);await p.locator('[data-chapter="1"]').tap();await p.waitForURL(base+'/services/',{timeout:60000});await ready(p);result.mobileFourTurns=true;await p.screenshot({path:'output/playwright/ordered-mobile.png'});await mobile.close();
 const nojs=await browser.newContext({javaScriptEnabled:false});const n=await nojs.newPage();await n.goto(base+'/');await n.locator('[data-chapter="4"]').click();await n.waitForURL(base+'/about/');result.noJS=true;await nojs.close();
 return result;
}
