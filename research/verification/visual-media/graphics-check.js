async(page)=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:4321/');
 if(await page.locator('[data-launch-book]').isVisible()&&await page.locator('[data-launch-book]').isEnabled())await page.locator('[data-launch-book]').click();
 await page.locator('[data-book][data-webgl="ready"]').waitFor();
 if(await page.locator('[data-pause-book]').innerText()==='Pause motion')await page.locator('[data-pause-book]').click();
 await page.getByRole('tab',{name:'Start',exact:true}).click();
 const canvas=page.locator('.book-canvas'); const bounds=await canvas.boundingBox();
 const before=await canvas.screenshot();await page.mouse.move(bounds.x+bounds.width*.6,bounds.y+bounds.height*.5);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*.6+70,bounds.y+bounds.height*.5+10,{steps:8});await page.mouse.up();const after=await canvas.screenshot();
 await canvas.focus();await page.keyboard.press('ArrowLeft');const keyboard=await canvas.screenshot();
 await canvas.evaluate(canvas=>{window.bookLossExtension=canvas.getContext('webgl2').getExtension('WEBGL_lose_context');window.bookLossExtension.loseContext();});
 await page.locator('[data-book][data-webgl="lost"]').waitFor();const fallback=await page.locator('.book-artwork').isVisible();
 await page.evaluate(()=>window.bookLossExtension.restoreContext());await page.locator('[data-book][data-webgl="ready"]').waitFor();
 const restored=await canvas.isVisible();
 const touchContext=await page.context().browser().newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const touch=await touchContext.newPage();await touch.goto('http://127.0.0.1:4321/');await touch.locator('[data-launch-book]').tap();await touch.locator('[data-book][data-webgl="ready"]').waitFor();await touch.getByRole('tab',{name:'Work',exact:true}).tap();const touchChapter=await touch.locator('[data-book]').getAttribute('data-chapter');await touchContext.close();
 return {mouseDragChangesRendering:!before.equals(after),keyboardRotationChangesRendering:!after.equals(keyboard),contextLossShowsPoster:fallback,contextRestoreShowsCanvas:restored,touchEmulationChapter:touchChapter};
}
