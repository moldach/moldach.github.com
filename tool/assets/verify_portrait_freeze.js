async (page) => {
 const browser=page.context().browser();const results={};
 for(const fallback of [false,true]){
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 if(fallback) await ctx.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:get.call(this,type,...args)}});
 const p=await ctx.newPage();await p.goto('http://127.0.0.1:4322/about/');await p.locator('[data-book-portrait]').tap();await p.waitForFunction(()=>document.querySelector('[data-portrait]')?.dataset.faceState==='ready');
 const renderer=await p.locator('[data-portrait]').getAttribute('data-face-renderer');if(renderer!==(fallback?'canvas':'webgl'))throw Error('Wrong renderer');
 const face=p.locator('[data-face]');const b=await face.boundingBox();
 await p.mouse.move(b.x+b.width*.5,b.y+b.height*.5);await p.mouse.down();await p.mouse.move(b.x+b.width*.65,b.y+b.height*.43,{steps:5});await p.keyboard.press('f');await p.mouse.up();await p.waitForFunction(()=>document.querySelector('[data-portrait]')?.dataset.facePins==='1');
 await p.locator('[data-face-region]').selectOption('chin');await face.focus();await p.keyboard.press('ArrowLeft');await p.locator('[data-face-freeze]').tap();await p.waitForFunction(()=>document.querySelector('[data-portrait]')?.dataset.facePins==='2');
 await p.locator('[data-face-reset]').tap();await p.waitForFunction(()=>document.querySelector('[data-portrait]')?.dataset.facePins==='0');results[renderer]={mouseDragFreeze:true,touchFreezeButton:true,multiplePoints:true,reset:true};await ctx.close();
 }
 const ctx=await browser.newContext({javaScriptEnabled:false});const p=await ctx.newPage();await p.goto('http://127.0.0.1:4322/writing/');await p.getByRole('navigation',{name:'Writing exhibits'}).getByRole('link',{name:'Supervised UMAP'}).click();await p.waitForURL('**/writing/supervised-umap/');results.noJSArticleLink=true;await ctx.close();return results;
}
