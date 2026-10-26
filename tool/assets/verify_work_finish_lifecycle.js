async page => {
  const base='http://127.0.0.1:4327/review/work-finish/';
  const ready=()=>page.waitForFunction(()=>document.querySelector('[data-page-turn]').dataset.state==='settled',null,{timeout:90000});
  const metrics=()=>page.locator('[data-metrics]').evaluate(e=>JSON.parse(e.textContent));
  await page.goto(base); await ready();
  await page.locator('[data-chapter="4"]').click();
  await page.locator('[data-chapter="5"]').click();
  await page.locator('[data-chapter="1"]').click();
  await page.waitForFunction(()=>{const r=document.querySelector('[data-page-turn]');return r.dataset.state==='settled'&&r.dataset.selected==='services'},null,{timeout:90000});
  const queued=await metrics();
  await page.locator('[data-chapter="2"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-page-turn]').dataset.state==='turning',null,{timeout:90000});
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
  const before=(await metrics()).progress;
  await page.waitForTimeout(200);
  const after=(await metrics()).progress;
  if(before!==after)throw Error('Hidden-document progress continued');
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
  await ready();
  await page.locator('canvas').evaluate(c=>c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.waitForFunction(()=>document.querySelector('[data-page-turn]').dataset.state==='error');
  return {queued,hiddenSimulation:{before,after,resumed:true},contextLoss:{poster:await page.locator('[data-stage] img').isVisible(),metrics:await metrics()}};
}
