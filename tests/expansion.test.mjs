import{test}from'node:test';
import assert from'node:assert/strict';
import{createEngine}from'../src/engine.js';
import{createCollection}from'../src/collection.js';
import{createCampaign}from'../src/campaign.js';
const E=createEngine(),C=createCollection(),S=createCampaign();
const get=(s,id)=>s.units.find(u=>u.id===id);
const make=(a,b=E.presets.balanced)=>E.make('practice',1000,[a,b],{seed:12345,firstSide:0});
function force(s,id){s.units.forEach((u,i)=>{u.next=s.time+1000+i*20;u.prepared=false;});for(const summon of s.summons)summon.next=s.time+2000;s.actor=id;get(s,id).next=s.time;get(s,id).prepared=true;return s;}

test('all sixteen characters can be recruited or exchanged, preserving the original starter and legacy keys',()=>{
  assert.equal(E.roles.length,16);assert.equal(new Set(E.roles.map(r=>r.key)).size,16);
  assert.deepEqual([...C.five,...C.four].sort(),E.roles.map(r=>r.key).sort());
  for(const key of E.roles.map(r=>r.key).filter(k=>!C.starter.includes(k))){const p=C.make();p.stardust=1000;assert(C.exchange(p,key).owned[key]);}
  assert.deepEqual(Object.keys(C.make().owned),['nova','aegis','lumen']);
});

test('legacy collection backups gain only default story fields and retain balances, ownership and pity',()=>{
  const old=C.make();delete old.storyCleared;delete old.tutorialDone;old.stars=917;old.stardust=48;old.pity5=39;old.pity4=5;old.guaranteed=true;old.owned.tempo=1;
  const restored=C.validate(old);assert.deepEqual(restored,{...old,storyCleared:[],tutorialDone:false});
  assert.throws(()=>C.validate({...restored,storyCleared:['dawn']}),/剧情存档/);assert.throws(()=>C.validate({...restored,tutorialDone:'yes'}),/引导存档/);
});

test('March shields and cleanses one ally then responds with bounded counters',()=>{
  let s=force(make(['march','dan','natasha']),'0-march');get(s,'0-dan').statuses.push({kind:'burn',turns:2,value:40,source:'1-nova',appliedSeq:-1});
  s=E.act(s,0,{kind:'skill',target:'0-dan'});assert.equal(get(s,'0-dan').shield,380);assert(!E.has(get(s,'0-dan'),'burn'));
  s=force(s,'1-nova');const hp=get(s,'1-nova').hp;s=E.act(s,1,{kind:'basic',target:'0-dan'});assert(get(s,'1-nova').hp<hp);assert.equal(get(s,'0-march').counterCharges,1);
});

test('Dan Heng critical skills slow and amplify his targeted ultimate',()=>{
  let s=force(make(['dan','march','natasha']),'0-dan');s.rng=1;s=E.act(s,0,{kind:'skill',target:'1-nova'});assert(E.has(get(s,'1-nova'),'slow'));
  s=force(s,'0-dan');get(s,'0-dan').energy=100;const plain=structuredClone(s);get(plain,'1-nova').statuses=[];
  const enhanced=E.act(s,0,{kind:'ultimate',actor:'0-dan',target:'1-nova'}),normal=E.act(plain,0,{kind:'ultimate',actor:'0-dan',target:'1-nova'});
  assert(get(enhanced,'1-nova').hp<get(normal,'1-nova').hp);
});

test('counter freeze during an ultimate resolves the frozen reserved turn rather than leaving an illegal actor',()=>{
  let s=force(make(['dan','lumen','natasha'],['march','aegis','natasha']),'0-dan');
  get(s,'0-dan').energy=100;get(s,'0-dan').toughness=10;get(s,'1-aegis').shield=380;
  get(s,'1-aegis').statuses.push({kind:'ward',turns:3,source:'1-march',appliedSeq:-1});s.rng=12345;
  s=E.act(s,0,{kind:'ultimate',actor:'0-dan',target:'1-aegis'});
  assert(s.logs.some(l=>l.text.includes('因冻结跳过行动')));assert(!E.has(E.current(s),'freeze'));
  assert.doesNotThrow(()=>E.act(s,E.current(s).side,E.ai(s,E.current(s).side)));
});

test('Seele earns one immediate resurgence action and cannot chain it inside that extra action',()=>{
  let s=force(make(['seele','silver','natasha']),'0-seele');get(s,'1-lumen').hp=1;const time=s.time;
  s=E.act(s,0,{kind:'basic',target:'1-lumen'});assert.equal(s.actor,'0-seele');assert.equal(s.time,time);assert(get(s,'0-seele').isResurgenceTurn);
  get(s,'1-nova').hp=1;s=E.act(s,0,{kind:'basic',target:'1-nova'});assert.equal(s.logs.filter(l=>l.text.includes('希儿触发再现')).length,1);assert(s.time>time);
});

test('Natasha cleanses, applies regeneration and improves emergency healing without reviving defeated allies',()=>{
  let s=force(make(['natasha','march','dan']),'0-natasha');get(s,'0-dan').hp=100;get(s,'0-dan').statuses.push({kind:'freeze',turns:1,appliedSeq:-1});
  s=E.act(s,0,{kind:'skill',target:'0-dan'});assert.equal(get(s,'0-dan').hp,542);assert(!E.has(get(s,'0-dan'),'freeze'));assert(E.has(get(s,'0-dan'),'regen'));
  s=force(s,'0-march');get(s,'0-natasha').energy=100;get(s,'0-dan').hp=0;s=E.act(s,0,{kind:'ultimate',actor:'0-natasha'});assert.equal(get(s,'0-dan').hp,0);
});

test('Clara ultimate has no instant enemy damage and its enhanced response is bounded per command',()=>{
  let s=force(make(['clara','march','natasha'],['volt','nova','lumen']),'0-clara');get(s,'0-clara').energy=100;const hp=s.units.filter(u=>u.side===1).map(u=>u.hp);
  s=E.act(s,0,{kind:'ultimate',actor:'0-clara'});assert.deepEqual(s.units.filter(u=>u.side===1).map(u=>u.hp),hp);assert.equal(get(s,'0-clara').enhancedCounters,2);
  s=force(s,'1-volt');s=E.act(s,1,{kind:'skill',target:'0-clara'});assert.equal(s.logs.filter(l=>l.text==='史瓦罗发动强化反击！').length,1);assert.equal(get(s,'0-clara').enhancedCounters,1);assert(E.has(get(s,'1-volt'),'svarog'));
});

test('Silver Wolf implants a team weakness and cleansing restores the original weaknesses',()=>{
  let s=force(make(['silver','seele','natasha'],['nova','aegis','natasha']),'0-silver');const original=[...get(s,'1-nova').weak];
  s=E.act(s,0,{kind:'skill',target:'1-nova'});const target=get(s,'1-nova');assert(E.has(target,'implant'));assert(target.weak.length>original.length);assert(['quantum','physical'].includes(E.has(target,'implant').value));
  s=force(s,'1-natasha');s=E.act(s,1,{kind:'skill',target:'1-nova'});assert.deepEqual(get(s,'1-nova').weak,original);
});

test('Ruan Mei improves matching break efficiency and limits bloom delay to one trigger per enemy per field',()=>{
  let s=force(make(['ruan','frost','lumen']),'0-ruan');s=E.act(s,0,{kind:'skill',target:'0-frost'});assert(s.units.filter(u=>u.side===0).every(u=>E.has(u,'overture')));
  s=force(s,'0-ruan');s=E.act(s,0,{kind:'basic',target:'1-nova'});assert.equal(get(s,'1-nova').toughness,30);
  s=force(s,'0-ruan');get(s,'0-ruan').energy=100;s=E.act(s,0,{kind:'ultimate',actor:'0-ruan'});
  for(let i=0;i<2;i++){s=force(s,'0-ruan');get(s,'1-nova').hp=1080;get(s,'1-nova').toughness=10;s=E.act(s,0,{kind:'basic',target:'1-nova'});}
  assert.equal(s.logs.filter(l=>l.text.includes('残梅追加')).length,1);
});

test('Firefly spends life safely and transforms to healing fire-implant attacks with bounded super-break',()=>{
  let s=force(make(['firefly','ruan','natasha']),'0-firefly');get(s,'0-firefly').hp=80;s=E.act(s,0,{kind:'skill',target:'1-nova'});assert.equal(get(s,'0-firefly').hp,1);assert.equal(get(s,'0-firefly').energy,90);
  s=force(s,'0-natasha');get(s,'0-firefly').energy=100;s=E.act(s,0,{kind:'ultimate',actor:'0-firefly'});assert.equal(s.actor,'0-natasha');assert(E.has(get(s,'0-firefly'),'combustion'));
  s=force(s,'0-firefly');get(s,'1-aegis').toughness=0;s=E.act(s,0,{kind:'skill',target:'1-aegis'});assert(get(s,'0-firefly').hp>1);assert(get(s,'1-aegis').weak.includes('fire'));assert(s.logs.some(l=>l.text.includes('超击破')));
});

test('story has eight ordered stages, trial teams and persistent idempotent first-clear rewards',()=>{
  let p=C.make();assert.equal(S.stages.length,8);assert.equal(S.chapters.length,4);assert(!S.unlocked(p,'dawn'));assert.throws(()=>S.reward(C,p,'dawn'),/前置/);
  for(const stage of S.stages){assert(S.unlocked(p,stage.id));assert.equal(E.validateTeam(stage.team).length,3);assert.equal(E.validateTeam(stage.enemy).length,3);const before=p.stars,grant=S.reward(C,p,stage.id);p=grant.profile;assert.equal(p.stars,before+stage.reward);assert.equal(S.reward(C,p,stage.id).profile.stars,p.stars);}
  assert.equal(p.storyCleared.length,8);assert(p.tutorialDone);for(const key of ['march','dan','natasha','seele'])assert(p.owned[key]);
});

test('all eight campaign battle templates replay deterministically and finish within reward limits',()=>{
  for(const stage of S.stages){let a=S.makeBattle(E,stage.id,101,1000),b=structuredClone(a),n=0;while(a.phase==='battle'&&n++<450){const side=E.current(a).side,action=E.ai(a,side);a=E.act(a,side,action,1000);b=E.act(b,side,action,1000);assert.deepEqual(a,b);}assert.equal(a.phase,'ended',stage.id);assert(a.seq>=6,stage.id+' must allow a meaningful first clear');}
});
