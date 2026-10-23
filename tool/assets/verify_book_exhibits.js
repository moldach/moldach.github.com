async (page) => {
 const base='http://127.0.0.1:4322'; const result={}; const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const ready=()=>page.waitForFunction(()=>document.querySelector('[data-chapter-book]')?.dataset.state==='ready',null,{timeout:45000});
 const assert=(v,m)=>{if(!v)throw Error(m)};
 await page.setViewportSize({width:1440,height:1100});
 for(const [name,path] of [['Printed Supervised UMAP','/writing/supervised-umap/'],['Printed The Gamification of Fitbit','/writing/fitbit-gamification/']]){
  await page.goto(base+'/writing/');await ready();await page.locator(`[data-exhibit-hotspot="${name}"]`).click();await page.waitForURL(base+path);result[name]=page.url();
  await page.goBack();await ready();assert(await page.locator('[data-chapter-label="Writing"]').count()===1,'Back failed');
 }
 await page.goto(base+'/writing/');await ready();
 const brain=page.locator('[data-exhibit-hotspot="Printed Highlighting 3D Brain Regions"]');
 await brain.click();await page.waitForURL(base+'/writing/highlighting-3d-brain-regions/');result.brain=page.url();
 for(const [name,hash] of [['PuttPulse','#puttpulse'],['Shiny-filteRs','#shiny-filters'],['Hinuhinu','#hinuhinu']]){
  await page.goto(base+'/work/');await ready();await page.locator(`[data-exhibit-hotspot="Project nameplate ${name}"]`).click();await page.waitForURL(base+'/work/'+hash);assert(await page.locator(hash).isVisible(),'Project missing');result[name]=page.url();
 }
 await page.goto(base+'/contact/');await ready();await page.locator('[data-exhibit-hotspot="Contact invitation"]').click();await page.waitForURL('**/#enquiry');result.contact=page.url();
 await page.goto(base+'/about/');await ready();await page.locator('[data-exhibit-hotspot="Matthew headshot photograph"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-portrait]')?.dataset.faceState==='ready');
 const root=page.locator('[data-portrait]'), face=page.locator('[data-face]');assert(await page.locator('dialog').isVisible(),'Portrait not opened');
 await face.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('f');await page.waitForFunction(()=>document.querySelector('[data-portrait]')?.dataset.facePins==='1');
 await page.locator('[data-face-region]').selectOption('forehead');await face.focus();await page.keyboard.press('ArrowUp');await page.locator('[data-face-freeze]').click();await page.waitForFunction(()=>document.querySelector('[data-portrait]')?.dataset.facePins==='2');
 await face.focus();await page.keyboard.press('Space');assert(await root.getAttribute('data-face-pins')==='2','Space removed pins');
 await page.screenshot({path:'output/playwright/portrait-frozen-points.png',fullPage:true});
 await page.locator('[data-face-reset]').click();await page.waitForFunction(()=>document.querySelector('[data-portrait]')?.dataset.facePins==='0');
 await page.keyboard.press('Escape');assert(!await page.locator('dialog').isVisible(),'Escape failed');
 result.portrait={openedFromBook:true,twoFrozenPoints:true,spacePreservesPins:true,reset:true,escape:true};
 // Native raycast without the projected links.
 await page.goto(base+'/writing/');await ready();const target=await page.locator('[data-exhibit-hotspot="Original supervised embedding"]').boundingBox();await page.locator('.chapter-tabs').evaluate(el=>el.style.display='none');await page.mouse.click(target.x+target.width/2,target.y+target.height/2);await page.waitForURL(base+'/writing/supervised-umap/');result.nativeRaycast=true;
 assert(!errors.length,errors.join('\n'));result.errors=errors;return result;
}
