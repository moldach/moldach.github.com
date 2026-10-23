async (page) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const check=(condition,label)=>{if(!condition)throw Error(label);};
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('http://127.0.0.1:4321/');
  await page.waitForFunction(()=>document.querySelector('[data-book]').dataset.webgl==='ready');
  const book=page.locator('[data-book]'),canvas=page.locator('.book-canvas');
  const mode=await book.getAttribute('data-book-geometry'), objects=Number(await book.getAttribute('data-object-count'));
  check(mode==='modeled-opening' && objects>100,'modeled opening');
  await page.locator('.book-stage').screenshot({path:'output/playwright/modeled-opening.png'});
  await canvas.focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowUp');
  await page.locator('.book-stage').screenshot({path:'output/playwright/modeled-opening-angle.png'});
  await page.keyboard.press('Escape');
  for(const label of ['Services','Work','Writing','About','Contact','Start']){
    await page.getByRole('tab',{name:label,exact:true}).focus();await page.keyboard.press('Enter');
    await page.waitForFunction(label=>document.querySelector('[data-book]').dataset.chapter===label,label);
    check(await page.getByRole('tab',{name:label,exact:true}).getAttribute('aria-selected')==='true',label+' selection');
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('.book-stage').screenshot({path:'output/playwright/modeled-opening-mobile.png'});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no mobile overflow');
  await page.getByRole('tab',{name:'Writing',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('[data-book]').dataset.chapter==='Writing');
  await page.locator('[data-exhibit-list]').getByRole('link',{name:'UMAP',exact:false}).click();
  check(page.url().includes('/writing/supervised-umap/'),'article destination');
  await page.goBack();await page.waitForFunction(()=>document.querySelector('[data-book]').dataset.chapter==='Writing');
  await page.getByRole('tab',{name:'Start',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('[data-book]').dataset.chapter==='Start');
  const context=await page.context().browser().newContext({javaScriptEnabled:false});
  const fallback=await context.newPage();await fallback.goto('http://127.0.0.1:4321/');
  check(await fallback.locator('.paper-tabs a').count()===6,'HTML chapter fallback');await context.close();
  check(errors.length===0,JSON.stringify(errors));
  console.log(JSON.stringify({mode,objects,chapters:6,articleAndBack:true,mobileLayout:true,noJavaScript:true,errors}));
}
