import {spawn,execFileSync}from'node:child_process';
import {mkdir,writeFile}from'node:fs/promises';
import {fileURLToPath}from'node:url';
import assert from'node:assert/strict';
const root=new URL('../',import.meta.url),folder=new URL('.openai/screenshots/combat-fx/',root),stamp=Date.now();
await mkdir(folder,{recursive:true});
const base='http://127.0.0.1:4197';
const server=spawn(process.execPath,['--no-warnings','scripts/serve.mjs'],{cwd:fileURLToPath(root),env:{...process.env,PORT:'4197',ARENA_PREVIEW_DB:fileURLToPath(new URL('.openai/fx-'+stamp+'.sqlite',root))},windowsHide:true,stdio:'ignore'});
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=9241','--user-data-dir='+fileURLToPath(new URL('.openai/chrome-fx-'+stamp+'/',root)),'about:blank'],{windowsHide:true,stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;const errors=[],warnings=[],shots=[];
async function until(fn,timeout=12000){const end=Date.now()+timeout;while(Date.now()<end){try{if(await fn())return;}catch{}await sleep(60);}throw Error('Effects browser condition timed out');}
try{
 let tab;await until(async()=>{tab=(await(await fetch('http://127.0.0.1:9241/json')).json()).find(t=>t.type==='page');return !!tab;});
 ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let serial=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);else if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='warning')warnings.push(m.params.args.map(a=>a.value).join(' '));};
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 const click=selector=>evaluate(`(()=>{const b=document.querySelector(${JSON.stringify(selector)});if(!b||b.disabled)throw Error('Unavailable: '+${JSON.stringify(selector)});b.click();})()`);
 const capture=async name=>{const shot=await cdp('Page.captureScreenshot',{format:'png'});await writeFile(new URL(name+'.png',folder),Buffer.from(shot.data,'base64'));shots.push(name);};
 const viewport=async mobile=>{await cdp('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:mobile?844:1100,deviceScaleFactor:1,mobile});};
 await cdp('Page.enable');await cdp('Runtime.enable');await viewport(false);
 await until(async()=>{try{return(await fetch(base)).ok;}catch{return false;}});await cdp('Page.navigate',{url:base});await until(()=>evaluate('!!window.__arenaTest'));
 await evaluate(`fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'fx_${stamp.toString(36)}',nickname:'特效测试',password:'Effects2026Demo'})}).then(r=>{if(!r.ok)throw Error('Test registration failed')})`);
 await cdp('Page.reload');await until(()=>evaluate('!!__arenaTest.account&&__arenaTest.profileConnected'));
 await evaluate('document.querySelector("[data-story-action=dismiss-welcome]")?.click()');
 const keys=await evaluate('__arenaTest.roles.map(r=>r.key)'),tested=process.argv.includes('--quick')?['nova']:keys;
 for(const key of tested){
  const team=[key,...['nova','aegis','lumen'].filter(k=>k!==key)].slice(0,3);
  await evaluate(`__arenaTest.seed([${JSON.stringify(team)},['nova','aegis','lumen']]);__arenaTest.state.units.find(u=>u.id==='0-${key}').energy=100`);
  await click('[data-target="1-nova"]');
  await until(()=>evaluate('[...document.images].filter(i=>i.getBoundingClientRect().width>0).every(i=>i.complete)'));
  await click('[data-ult="0-'+key+'"]');await until(()=>evaluate('__arenaTest.state.seq===1'));
  await evaluate('__arenaTest.stop()');
  const snapshot=await evaluate('JSON.stringify(__arenaTest.state)');
  assert(await evaluate('!!document.querySelector(".afx-cutin")'));
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".afx-root")).pointerEvents'),'none');
  if(['nova','aegis','silver','firefly'].includes(key)){await sleep(270);await capture('desktop-ultimate-'+key);}
  await until(()=>evaluate('!document.querySelector(".afx-root")'),4000);
  assert.equal(await evaluate('JSON.stringify(__arenaTest.state)'),snapshot,'Effects mutated combat state: '+key);
 }
 console.log(tested.length+' ultimate presentations and cleanup passed.');
 await evaluate(`__arenaTest.seed();const s=__arenaTest.state;s.actor='0-nova';s.units.find(u=>u.id==='0-nova').prepared=true;const t=s.units.find(u=>u.id==='1-nova');t.weak=['fire','ice'];t.toughness=1`);
 await click('[data-target="1-nova"]');await click('[data-combat=basic]');await until(()=>evaluate('__arenaTest.state.seq===1'));await evaluate('__arenaTest.stop()');
 assert(await evaluate('!!document.querySelector(".afx-number.break")'));await sleep(230);await capture('desktop-weakness-break');await sleep(1100);
 await evaluate(`__arenaTest.seed([['lumen','aegis','nova'],['nova','aegis','lumen']]);__arenaTest.state.actor='0-lumen';__arenaTest.state.units.find(u=>u.id==='0-lumen').prepared=true;__arenaTest.state.units.find(u=>u.id==='0-nova').hp=100`);
 await click('[data-target="0-nova"]');await click('[data-combat=skill]');await until(()=>evaluate('__arenaTest.state.seq===1'));await evaluate('__arenaTest.stop()');assert(await evaluate('!!document.querySelector(".afx-number.heal")'));await sleep(230);await capture('desktop-healing');await sleep(1200);
 await evaluate(`__arenaTest.seed([['nova','volt','lumen'],['nova','aegis','lumen']]);__arenaTest.state.actor='0-nova';__arenaTest.state.units.find(u=>u.id==='0-nova').prepared=true;__arenaTest.state.summons[0].next=-100`);
 await click('[data-target="1-nova"]');await click('[data-combat=basic]');await until(()=>evaluate('__arenaTest.state.seq===1'));await evaluate('__arenaTest.stop()');
 assert.match(await evaluate('document.querySelector(".afx-cutin-copy")?.innerText||""'),/景元/);await sleep(230);await capture('desktop-lightning-lord');await sleep(1400);
 await viewport(true);await evaluate(`__arenaTest.seed([['firefly','ruan','natasha'],['nova','aegis','lumen']]);__arenaTest.state.units.find(u=>u.id==='0-firefly').energy=100`);await click('[data-target="1-nova"]');await evaluate('document.querySelector(".arena").scrollIntoView({block:"start"})');await sleep(100);await click('[data-ult="0-firefly"]');await until(()=>evaluate('__arenaTest.state.seq===1'));await evaluate('__arenaTest.stop()');await sleep(250);await capture('mobile-firefly');assert.equal(await evaluate('document.documentElement.scrollWidth'),390);await sleep(1400);
 await click('[data-action=effects]');assert.match(await evaluate('document.querySelector("[data-action=effects]").textContent'),/简洁/);
 await evaluate('__arenaTest.seed()');await click('[data-ult="0-nova"]');await until(()=>evaluate('!!document.querySelector(".afx-lite")'));await evaluate('__arenaTest.stop()');assert.equal(await evaluate('getComputedStyle(document.querySelector(".afx-canvas")).display'),'none');await capture('mobile-simple-effects');await sleep(750);
 await cdp('Page.reload');await until(()=>evaluate('!!__arenaTest.account&&__arenaTest.profileConnected'));await evaluate('__arenaTest.seed()');assert.match(await evaluate('document.querySelector("[data-action=effects]").textContent'),/简洁/);
 await click('[data-action=effects]');await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await evaluate('__arenaTest.seed()');await click('[data-ult="0-nova"]');await until(()=>evaluate('!!document.querySelector(".afx-lite")'));await evaluate('__arenaTest.stop()');assert.equal(await evaluate('getComputedStyle(document.querySelector(".afx-number")).animationName'),'none');await sleep(750);
 await cdp('Emulation.setEmulatedMedia',{features:[]});await viewport(false);await evaluate('__arenaTest.seed()');await click('[data-ult="0-nova"]');await until(()=>evaluate('!!document.querySelector(".afx-root")'));await evaluate('__arenaTest.home()');assert.equal(await evaluate('document.querySelectorAll(".afx-root").length'),0);
 assert.deepEqual(errors,[]);assert.deepEqual(warnings.filter(s=>s.includes('战斗演出')),[]);
 const result={ultimateRoles:tested.length,combatStateUnchanged:true,automaticCleanup:true,weaknessBreak:true,healing:true,correctSummonActor:true,mobileOverflow:'none',settingPersists:true,reducedMotion:true,navigationCleanup:true,runtimeErrors:errors,screenshots:shots};
 await writeFile(new URL('browser-results.json',folder),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{
 ws?.close();for(const p of[server,chrome])if(p.pid&&p.exitCode===null){try{execFileSync('taskkill.exe',['/PID',String(p.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});}catch{}}
}
