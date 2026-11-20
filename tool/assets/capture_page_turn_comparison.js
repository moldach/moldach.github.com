async page => {
 const base='http://127.0.0.1:4322';await page.setViewportSize({width:1536,height:1250});
 // Camera-only network fixtures: existing chapter code and assets are not edited.
 await page.route('**/src/components/book-review/runtime.ts*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace('referenceTarget = new THREE.Vector3(0, .7, 0)','referenceTarget = new THREE.Vector3(0, 2, 0)');await route.fulfill({response,body})});
 for(const [chapter,path]of[['start','/review/start/'],['services','/services/']]){
  await page.route(base+path,async route=>{const response=await route.fetch();let body=await response.text();body=body.replace(/data-camera="[^"]+"/,'data-camera="[0.12,17,18]"').replace(/data-lens="[^"]+"/,'data-lens="48"');await route.fulfill({response,body})});
  await page.goto(base+path);await page.waitForFunction(()=>document.querySelector('[data-chapter-book]').dataset.state==='ready',null,{timeout:45000});await page.locator('[data-chapter-book]').evaluate(el=>{el.style.width='1488px';el.style.maxWidth='1488px'});await page.locator('[data-chapter-book] .stage').screenshot({path:`output/playwright/baseline-${chapter}-matching.png`});await page.unroute(base+path);
 }
 await page.unroute('**/src/components/book-review/runtime.ts*');await page.goto(base+'/review/page-turn/');await page.waitForFunction(()=>JSON.parse(document.querySelector('[data-metrics]').textContent).servicesReady,null,{timeout:45000});await page.locator('[data-stage]').screenshot({path:'output/playwright/prototype-start-matching.png'});await page.locator('[data-chapter="1"]').focus();await page.keyboard.press('Enter');await page.locator('[data-stage]').screenshot({path:'output/playwright/prototype-services-matching.png'});return {camera:[.12,17,18],target:[0,2,0],lens:48,stageWidth:1488,sourceAssetsUnchanged:true};
}
