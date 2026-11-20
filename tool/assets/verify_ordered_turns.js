async page => {
 const base='http://127.0.0.1:4322', errors=[], result={}; page.on('pageerror',e=>errors.push(String(e)));
 const ready=()=>page.waitForFunction(()=>document.querySelector('[data-page-turn]')?.dataset.state==='settled',null,{timeout:60000});
 const remember=()=>page.evaluate(()=>window.addEventListener('pagehide',()=>sessionStorage.setItem('ordered-turns',document.querySelector('[data-metrics]').textContent),{once:true}));
 const journey=async (from,to,index,expected)=>{
  await page.goto(base+from); await ready(); await remember();
  await page.locator(`[data-chapter="${index}"]`).click();
  await page.waitForFunction(()=>document.querySelector('[data-page-turn]')?.dataset.state==='turning',null,{timeout:45000});
  await page.waitForTimeout(650);
  await page.screenshot({path:`output/playwright/ordered-${index}-turn.png`});
  await page.waitForURL(base+to,{timeout:60000}); await ready();
  const report=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('ordered-turns')));
  if(JSON.stringify(report.completedTurns.map(t=>t.to))!==JSON.stringify(expected)) throw Error(JSON.stringify(report));
  return {turns:report.completedTurns,peakDrawCalls:report.peakDrawCalls,peakTriangles:report.peakTriangles};
 };
 await page.setViewportSize({width:1440,height:1100});
 result.forward=await journey('/','/about/',4,['services','work','writing','about']);
 await page.screenshot({path:'output/playwright/ordered-about.png'});
 const portrait=page.locator('[data-exhibit-hotspot="Matthew headshot photograph"]');
 result.portraitHotspots=await portrait.count();
 if(await portrait.count()){await portrait.click();result.portraitOpened=await page.locator('dialog[open]').count();await page.keyboard.press('Escape');}
 result.reverse=await journey('/contact/','/services/',1,['about','writing','work','services']);
 await page.goto(base+'/writing/');await ready();
 result.articleLinks=await page.locator('[data-exhibit-hotspot]').evaluateAll(a=>a.map(e=>({name:e.dataset.exhibitHotspot,href:e.getAttribute('href'),hidden:e.hidden})));
 if(!result.articleLinks.some(a=>a.href==='/writing/highlighting-3d-brain-regions/'&&!a.hidden))throw Error('Brain article hotspot missing');
 await page.goto(base+'/');await ready();await page.locator('[data-chapter="5"]').focus();await page.keyboard.press('Enter');await page.waitForURL(base+'/contact/',{timeout:60000});await ready();result.keyboard=true;
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-chapter="2"]').click();await page.waitForURL(base+'/work/',{timeout:60000});await ready();result.reducedMotion=true;
 await page.emulateMedia({reducedMotion:'no-preference'});
 result.errors=errors;if(errors.length)throw Error(errors.join('\n'));return result;
}
