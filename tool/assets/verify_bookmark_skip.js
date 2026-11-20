async page => {
 const base='http://127.0.0.1:4322';const result={};
 const ready=()=>page.waitForFunction(()=>document.querySelector('[data-page-turn]')?.dataset.state==='settled',null,{timeout:45000});
 for(const [name,from,index,to] of [['forward','/',5,'/contact/'],['reverse','/contact/',1,'/services/']]){
  await page.goto(base+from);await ready();
  await page.evaluate(()=>{window.__states=[]; const r=document.querySelector('[data-page-turn]');new MutationObserver(()=>window.__states.push({state:r.dataset.state,selected:r.dataset.selected})).observe(r,{attributes:true});window.addEventListener('pagehide',()=>sessionStorage.setItem('skip',JSON.stringify({states:window.__states,metrics:JSON.parse(r.querySelector('[data-metrics]').textContent)})),{once:true});});
  const start=Date.now();await page.locator(`[data-chapter="${index}"]`).click();await page.waitForFunction(()=>document.querySelector('[data-page-turn]')?.dataset.state==='turning',null,{timeout:45000});
  await page.waitForTimeout(600);await page.screenshot({path:`output/playwright/bookmark-${name}.png`});await page.waitForURL(base+to,{timeout:45000});await ready();
  const evidence=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('skip')));result[name]={elapsed:Date.now()-start,...evidence};
  const settled=evidence.states.filter(x=>x.state==='settled');if(settled.some(x=>!['start',to.split('/')[1]].includes(x.selected)))throw Error('Intermediate chapter settled');
  if(evidence.metrics.completedTurns.length!== (name==='forward'?5:4))throw Error('Wrong leaf count');
 }
 return result;
}
