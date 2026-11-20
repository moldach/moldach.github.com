// playwright-cli run-code --filename tool/assets/verify_chapter_journey.js
async (page) => {
 const url='http://127.0.0.1:4322';const results={chapters:[]};const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const ready=p=>p.waitForFunction(()=>document.querySelector('[data-chapter-book]')?.dataset.state==='ready',null,{timeout:45000});
 const report=p=>p.locator('[data-metrics]').textContent().then(JSON.parse);
 const assert=(test,message)=>{if(!test)throw new Error(message);};
 await page.setViewportSize({width:1600,height:1250});await page.goto(url+'/review/start/');await ready(page);
 for(const [index,label,path] of [[1,'Services','/services/'],[2,'Work','/work/'],[3,'Writing','/writing/'],[4,'About','/about/'],[5,'Contact','/contact/'],[0,'Start','/']]){
  await page.getByRole('navigation',{name:'Book chapters'}).getByRole('link',{name:label,exact:true}).click();
  await page.waitForURL(url+path);await ready(page);
  const data=await report(page);assert(data.selectedChapter===label&&data.chapterIndex===index,'Wrong chapter model');
  const y=await page.locator('[data-chapter-book]').evaluate(book=>book.getBoundingClientRect().top);
  assert(y>=0&&y<400,'Book is not at top of page');
  assert(await page.locator('input[name=lighting],input[type=range],[data-close],[data-measure]').count()===0,'Settings returned');
  results.chapters.push({label,path,bookY:y,drawCalls:data.drawCalls,model:await page.locator('[data-chapter-book]').getAttribute('data-model')});
  if(index===1)await page.screenshot({path:'output/playwright/services-book-top.png',fullPage:true});
  if(index===3)await page.screenshot({path:'output/playwright/writing-book-top.png',fullPage:true});
 }
 await page.goto(url+'/services/');await ready(page);await page.goto(url+'/work/');await ready(page);await page.goBack();await ready(page);assert((await report(page)).selectedChapter==='Services','Back selected wrong book');results.backRestoresServices=true;
 const browser=page.context().browser();
 const mobileContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const mobile=await mobileContext.newPage();await mobile.goto(url+'/');await ready(mobile);
 await mobile.getByRole('navigation',{name:'Book chapters'}).getByRole('link',{name:'Services',exact:true}).tap();await mobile.waitForURL(url+'/services/');await ready(mobile);
 assert((await report(mobile)).selectedChapter==='Services','Mobile destination missing Services book');await mobile.screenshot({path:'output/playwright/services-book-top-mobile.png',fullPage:true});results.touchServices=true;await mobileContext.close();
 const noJSContext=await browser.newContext({javaScriptEnabled:false});const noJS=await noJSContext.newPage();await noJS.goto(url+'/services/');
 assert(await noJS.locator('[data-poster]').isVisible(),'Services poster unavailable without JS');
 assert((await noJS.locator('[data-poster]').getAttribute('src')).includes('/services.webp'),'Wrong Services fallback');
 await noJS.getByRole('navigation',{name:'Book chapters'}).getByRole('link',{name:'Writing',exact:true}).click();await noJS.waitForURL(url+'/writing/');assert((await noJS.locator('[data-poster]').getAttribute('src')).includes('/writing.webp'),'Wrong Writing fallback');results.noJSChapterPosters=true;await noJSContext.close();
 const failContext=await browser.newContext();const fail=await failContext.newPage();await fail.route('**/models/chapters/services.glb',r=>r.abort());await fail.goto(url+'/services/');await fail.waitForFunction(()=>document.querySelector('[data-chapter-book]')?.dataset.state==='error');assert(await fail.locator('[data-poster]').isVisible(),'Failed model lost chapter poster');results.modelFailurePoster=true;await failContext.close();
 assert(errors.length===0,errors.join('\n'));results.pageErrors=errors;return results;
}
