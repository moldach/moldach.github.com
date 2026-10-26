async(page)=>{
 await page.goto('http://127.0.0.1:4321/');
 if(await page.locator('[data-launch-book]').isVisible()&&await page.locator('[data-launch-book]').isEnabled())await page.locator('[data-launch-book]').click();
 await page.locator('[data-book][data-webgl="ready"]').waitFor();
 if(await page.locator('[data-pause-book]').innerText()==='Pause motion')await page.locator('[data-pause-book]').click();
 await page.getByRole('tab',{name:'Start',exact:true}).click();
 await page.getByRole('button',{name:'Play motion',exact:true}).click();
 await page.getByRole('tab',{name:'Work',exact:true}).click();
 const busy=await page.locator('[role=tabpanel]').getAttribute('aria-busy');
 await page.locator('[role=tabpanel][aria-busy=false]').waitFor();
 return {turnStarted:busy==='true',turnCompleted:true,selected:await page.locator('[data-book]').getAttribute('data-chapter')};
}
