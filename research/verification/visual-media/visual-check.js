async(page)=>{
 const base='http://127.0.0.1:4321'; const results=[];
 await page.setViewportSize({width:1440,height:1000}); await page.goto(base);
 if(await page.locator('[data-launch-book]').isVisible()&&await page.locator('[data-launch-book]').isEnabled())await page.locator('[data-launch-book]').click();
 await page.locator('[data-book][data-webgl="ready"]').waitFor();
 await page.getByRole('button',{name:'Pause motion',exact:true}).click();
 for(const name of ['Services','Work','Writing','About','Contact','Start']){
   await page.getByRole('tab',{name,exact:true}).click();
   results.push({chapter:name,selected:await page.getByRole('tab',{name,exact:true}).getAttribute('aria-selected'),destination:await page.locator('[data-open-chapter]').getAttribute('href')});
 }
 await page.screenshot({path:'output/playwright/home-desktop-final.png'});
 await page.getByRole('tab',{name:'Work',exact:true}).click();
 await page.screenshot({path:'output/playwright/book-work-final.png'});
 await page.getByRole('tab',{name:'Writing',exact:true}).click();
 await page.locator('[data-exhibit-list]').getByRole('link',{name:'Fitbit',exact:false}).click();
 results.push({article:new URL(page.url()).pathname}); await page.goBack();
 if(await page.locator('[data-launch-book]').isVisible()&&await page.locator('[data-launch-book]').isEnabled())await page.locator('[data-launch-book]').click();
 await page.locator('[data-book][data-webgl="ready"]').waitFor();
 results.push({backChapter:await page.locator('[data-book]').getAttribute('data-chapter')});
 await page.getByRole('tab',{name:'Services',exact:true}).focus(); await page.keyboard.press('ArrowRight');
 results.push({keyboardChapter:await page.locator('[data-book]').getAttribute('data-chapter')});
 const video=page.locator('[data-project-video]').first(); await video.scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>{const v=document.querySelector('[data-project-video]');return v.readyState>=3&&!v.paused;});
 results.push({videoPlaying:await video.evaluate(v=>({playing:!v.paused,muted:v.muted,time:v.currentTime,ready:v.readyState}))});
 await page.screenshot({path:'output/playwright/projects-final.png'});
 await page.evaluate(()=>scrollTo(0,0)); await page.waitForFunction(()=>document.querySelector('[data-project-video]').paused);
 results.push({offscreenVideoPaused:await video.evaluate(v=>v.paused)});
 for(const width of [320,390,768,1024]){
  await page.setViewportSize({width,height:900});
  results.push({width,document:await page.evaluate(()=>document.documentElement.scrollWidth)});
 }
 await page.setViewportSize({width:390,height:844}); await page.goto(base);
 if(await page.locator('[data-launch-book]').isVisible()&&await page.locator('[data-launch-book]').isEnabled())await page.locator('[data-launch-book]').click();
 await page.locator('[data-book][data-webgl="ready"]').waitFor();
 await page.getByRole('button',{name:'Pause motion',exact:true}).click();
 await page.getByRole('tab',{name:'Start',exact:true}).click();
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:'output/playwright/home-mobile-final.png'});
 const reduced=await page.context().browser().newContext({reducedMotion:'reduce',viewport:{width:390,height:844}});
 const quiet=await reduced.newPage(); await quiet.goto(base);await quiet.locator('[data-launch-book]').click(); await quiet.locator('[data-book][data-webgl="ready"]').waitFor();
 results.push({reducedMotion:{button:await quiet.locator('[data-pause-book]').innerText(),pressed:await quiet.locator('[data-pause-book]').getAttribute('aria-pressed')}});
 await quiet.locator('video').first().scrollIntoViewIfNeeded();
 results.push({reducedVideoPaused:await quiet.locator('video').first().evaluate(v=>v.paused)});await reduced.close();
 const plainContext=await page.context().browser().newContext({javaScriptEnabled:false}); const plain=await plainContext.newPage();await plain.goto(base);
 results.push({noJavaScript:{headline:await plain.locator('h1').innerText(),projectLinks:await plain.locator('.gallery-caption h3 a').count(),articleLinks:await plain.locator('[data-article-id]').count(),bookLinks:await plain.getByRole('navigation',{name:'Book chapters',exact:true}).getByRole('link').count()}});await plainContext.close();
 const fallback=await page.context().browser().newContext();await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'||type==='webgl'?null:original.call(this,type,...args);};});
 const flat=await fallback.newPage();await flat.goto(base);await flat.locator('[data-launch-book]').click();await flat.locator('[data-book][data-webgl="unavailable"]').waitFor();results.push({webglUnavailable:{poster:await flat.locator('.book-artwork').isVisible(),links:await flat.getByRole('navigation',{name:'Book chapters',exact:true}).getByRole('link').count()}});await fallback.close();
 return results;
}
