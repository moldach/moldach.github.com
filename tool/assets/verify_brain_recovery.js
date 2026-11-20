async page => {
 const base='http://127.0.0.1:4322'; const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(base+'/writing/');await page.waitForFunction(()=>document.querySelector('[data-chapter-book]')?.dataset.state==='ready',null,{timeout:45000});
 await page.locator('[data-exhibit-hotspot="Printed Highlighting 3D Brain Regions"]').click();await page.waitForURL(base+'/writing/highlighting-3d-brain-regions/');
 const result=await page.evaluate(async()=>{
 const article=document.querySelector('article'); const imgs=[...article.querySelectorAll('img')];
 await Promise.all(imgs.map(img=>{img.loading='eager';return img.decode()}));
 return {url:location.href,title:document.querySelector('h1').textContent,date:document.querySelector('time').dateTime,images:imgs.length,allImagesLocal:imgs.every(i=>new URL(i.currentSrc).origin===location.origin),allImagesDecoded:imgs.every(i=>i.naturalWidth>0),sections:[...article.querySelectorAll('h2,h3')].map(e=>e.textContent),codeBlocks:article.querySelectorAll('pre').length,attribution:article.textContent.includes('John Muschelli'),trackingPixels:!!article.querySelector('img[src*="medium.com/_/stat"]')};
 });
 if(result.images!==26||!result.allImagesLocal||!result.allImagesDecoded||result.codeBlocks<1||!result.attribution||result.trackingPixels)throw Error(JSON.stringify(result));
 await page.locator('article img').first().scrollIntoViewIfNeeded();await page.screenshot({path:'output/playwright/brain-restored-article.png'});
 await page.goBack();await page.waitForFunction(()=>document.querySelector('[data-chapter-book]')?.dataset.state==='ready',null,{timeout:45000});result.backToWriting=page.url()===base+'/writing/';
 const ctx=await page.context().browser().newContext({javaScriptEnabled:false});const p=await ctx.newPage();const response=await p.goto(base+'/writing/highlighting-3d-brain-regions/');result.noJS={status:response.status(),images:await p.locator('article img').count(),code:await p.locator('article pre').count()};await ctx.close();result.pageErrors=errors;if(errors.length)throw Error(errors.join('\n'));return result;
}
