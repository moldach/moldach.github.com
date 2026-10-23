// playwright-cli -s=start-tabs run-code --filename tool/assets/verify_start_review.js
async (page) => {
  const url='http://127.0.0.1:4322/review/start/';
  const ready=p=>p.waitForFunction(()=>document.querySelector('main')?.dataset.state==='ready',null,{timeout:45000});
  const data=p=>p.locator('[data-metrics]').textContent().then(JSON.parse);
  const assert=(value,message)=>{if(!value)throw new Error(message);};
  const results={}; const errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.setViewportSize({width:1600,height:1250});await page.goto(url);await ready(page);
  assert(await page.locator('input[type=range],input[name=lighting],[data-close],[data-measure],details').count()===0,'Visitor settings remain');
  assert((await data(page)).lighting==='studio','Studio is not fixed');
  await page.screenshot({path:'output/playwright/start-studio-tabs.png',fullPage:true});
  const firstPose=(await data(page)).camera;
  await page.locator('canvas').focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('Escape');
  assert((await data(page)).camera.position.every((v,i)=>Math.abs(v-firstPose.position[i])<1e-6),'Reset failed');
  const chapters=[['Start','/'],['Services','/services/'],['Work','/work/'],['Writing','/writing/'],['About','/about/'],['Contact','/contact/']];
  results.links=[];
  // Capture real pagehide cleanup during chapter navigation.
  await page.evaluate(()=>window.addEventListener('pagehide',()=>sessionStorage.setItem('start-cleanup',document.querySelector('[data-metrics]').textContent),{once:true}));
  await page.getByRole('navigation',{name:'Book chapters'}).getByRole('link',{name:'Services',exact:true}).click();
  await page.waitForURL('**/services/');
  results.servicesPage={url:page.url(),heading:await page.locator('main h1').textContent()};
  results.disposal=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('start-cleanup')));
  assert(results.disposal.contextReleased,'Navigation did not release WebGL context');
  await page.goBack();await ready(page);results.backRestoresScene=true;
  for(const [name,path] of chapters){
    await page.getByRole('navigation',{name:'Book chapters'}).getByRole('link',{name,exact:true}).click();
    await page.waitForURL(new URL(path,url).href);
    results.links.push({name,path,heading:await page.locator('main h1').textContent()});
    await page.goto(url);await ready(page);
  }
  // Exercise native model raycasting without the accessible HTML overlay.
  const serviceBox=await page.locator('[data-chapter="1"]').boundingBox();
  await page.locator('.chapter-tabs').evaluate(nav=>nav.style.display='none');
  await page.mouse.click(serviceBox.x+serviceBox.width/2,serviceBox.y+serviceBox.height/2);
  await page.waitForURL('**/services/');results.raycastServices=true;
  await page.goto(url);await ready(page);
  // Dragging from a tab is inspection, never navigation.
  const tab=await page.locator('[data-chapter="1"]').boundingBox();
  await page.locator('.chapter-tabs').evaluate(nav=>nav.style.display='none');
  await page.mouse.move(tab.x+tab.width/2,tab.y+tab.height/2);await page.mouse.down();
  await page.mouse.move(tab.x+tab.width/2+60,tab.y+tab.height/2-20,{steps:6});await page.mouse.up();
  assert(page.url()===url,'Drag navigated');results.dragDoesNotNavigate=true;
  const browser=page.context().browser();
  const mobileContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const mobile=await mobileContext.newPage();await mobile.goto(url);await ready(mobile);
  await mobile.screenshot({path:'output/playwright/start-studio-tabs-mobile.png',fullPage:true});
  await mobile.getByRole('navigation',{name:'Book chapters'}).getByRole('link',{name:'Services',exact:true}).tap();
  await mobile.waitForURL('**/services/');results.touchServices=true;await mobileContext.close();
  const fallbackContext=await browser.newContext();const fallback=await fallbackContext.newPage();
  await fallback.route('**/models/start/start.glb',route=>route.abort());await fallback.goto(url);await ready(fallback);
  assert((await data(fallback)).asset==='conventional','Texture fallback failed');results.conventionalFallback=true;await fallbackContext.close();
  const noJSContext=await browser.newContext({javaScriptEnabled:false});const noJS=await noJSContext.newPage();await noJS.goto(url);
  await noJS.getByRole('navigation',{name:'Book chapters'}).getByRole('link',{name:'Services',exact:true}).click();await noJS.waitForURL('**/services/');results.noJSNavigation=true;await noJSContext.close();
  const noGLContext=await browser.newContext();
  await noGLContext.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:original.call(this,type,...args);};});
  const noGL=await noGLContext.newPage();await noGL.goto(url);await noGL.waitForFunction(()=>document.querySelector('main')?.dataset.state==='error');
  await noGL.getByRole('navigation',{name:'Book chapters'}).getByRole('link',{name:'Services',exact:true}).click();await noGL.waitForURL('**/services/');results.noGLNavigation=true;await noGLContext.close();
  assert(errors.length===0,errors.join('\n'));results.pageErrors=errors;return results;
}
