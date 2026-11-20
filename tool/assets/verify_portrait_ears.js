async page => {
 const browser=page.context().browser(),result={};
 for(const fallback of [false,true]) {
 const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 if(fallback)await ctx.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:get.call(this,type,...args)}});
 const p=await ctx.newPage();await p.goto('http://127.0.0.1:4322/about/');const trigger=p.locator('[data-portrait-open]');if(!(await trigger.textContent()).includes('Stretch my face'))throw Error('Unclear footer trigger');await trigger.tap();await p.waitForFunction(()=>document.querySelector('[data-portrait]')?.dataset.faceState==='ready');if(await p.locator('dialog select').count())throw Error('Selector still present');
 const face=p.locator('[data-face]');await p.locator('[data-face-ears]').tap();await p.waitForFunction(()=>Number(document.querySelector('[data-portrait]').dataset.faceEarSize)>0);
 await face.focus();for(let i=0;i<5;i++)await p.keyboard.press('n');await p.keyboard.press('ArrowLeft');await p.keyboard.press('f');await p.waitForFunction(()=>document.querySelector('[data-portrait]').dataset.facePins==='1');
 await p.keyboard.press('n');await p.keyboard.press('ArrowRight');await p.keyboard.press('f');await p.waitForFunction(()=>document.querySelector('[data-portrait]').dataset.facePins==='2');
 const b=await face.boundingBox();await p.mouse.move(b.x+b.width*.28,b.y+b.height*.45);await p.mouse.down();await p.mouse.move(b.x+b.width*.18,b.y+b.height*.4,{steps:4});await p.keyboard.press('f');await p.mouse.up();await p.waitForFunction(()=>document.querySelector('[data-portrait]').dataset.facePins==='3');
 if(!fallback)await p.screenshot({path:'output/playwright/portrait-ears-mobile.png'});
 await p.locator('[data-face-reset]').tap();await p.waitForFunction(()=>document.querySelector('[data-portrait]').dataset.facePins==='0'&&document.querySelector('[data-portrait]').dataset.faceEarSize==='0');result[fallback?'canvas':'webgl']={clearFooter:true,noSelector:true,enlarge:true,bothEarsFrozen:true,pointerStretch:true,reset:true};await ctx.close();
 }return result;
}
