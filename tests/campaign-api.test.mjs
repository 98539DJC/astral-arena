import{test}from'node:test';
import assert from'node:assert/strict';
import{DatabaseSync}from'node:sqlite';
import{readFileSync}from'node:fs';
import{createEngine}from'../src/engine.js';
import{createCampaign}from'../src/campaign.js';
import worker from'../dist/server/index.js';
const E=createEngine(),S=createCampaign();
function fixture(){
 const db=new DatabaseSync(':memory:');for(const file of ['0000_arena.sql','0001_collection.sql','0002_accounts.sql','0003_admin.sql'])db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 const env={DB:{prepare(sql){return{bind(...args){return{first:async()=>db.prepare(sql).get(...args)??null,run:async()=>({meta:{changes:db.prepare(sql).run(...args).changes}})};}};}}};
 const call=async(path,body,token)=>{const response=await worker.fetch(new Request('http://test'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{'X-Arena-Profile':token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}),env);return{status:response.status,data:await response.json()};};
 return{db,call};
}
function finish(source){let game=source;const actions=[];while(game.phase==='battle'&&actions.length<450){const side=E.current(game).side,action=E.ai(game,side);actions.push({side,action});game=E.act(game,side,action);}assert.equal(game.phase,'ended');return{game,actions};}

test('story entry rejects locked stages and loans do not unlock ordinary PvP ownership',async()=>{
 const{db,call}=fixture();try{const p=(await call('/api/profile',{})).data;assert.equal((await call('/api/practice/start',{stageId:'dawn'},p.token)).status,400);assert.equal((await call('/api/practice/start',{stageId:'missing'},p.token)).status,400);
 const stage=await call('/api/practice/start',{stageId:'signal'},p.token);assert.equal(stage.status,200);assert.deepEqual(stage.data.game.teams[0],['dan','march','natasha']);assert(!stage.data.profile.owned.dan);assert(!stage.data.profile.owned.march);assert.equal((await call('/api/rooms',{team:stage.data.game.teams[0]},p.token)).status,400);
 assert.equal((await call('/api/practice/claim',{matchId:stage.data.matchId,actions:[]},p.token)).status,400);
 }finally{db.close();}
});

test('server replays eight story stages, persists unlocks, and never duplicates first-clear rewards',async()=>{
 const{db,call}=fixture();try{const p=(await call('/api/profile',{})).data;let expectedStars=3200;
 for(const stage of S.stages){let won;for(let retry=0;retry<12;retry++){const start=await call('/api/practice/start',{stageId:stage.id},p.token);assert.equal(start.status,200);const battle=finish(start.data.game);if(battle.game.winner===0){won={start:start.data,...battle};break;}}
 assert(won,'Trial team must be able to win '+stage.id);
 const entry=won.actions.find(a=>a.side===1),forged=structuredClone(won.actions);if(entry){forged[won.actions.indexOf(entry)].action={kind:'defend'};assert.equal((await call('/api/practice/claim',{matchId:won.start.matchId,actions:forged},p.token)).status,400);}
 const body={matchId:won.start.matchId,actions:won.actions},claimed=await call('/api/practice/claim',body,p.token);assert.equal(claimed.status,200,JSON.stringify(claimed.data));expectedStars+=200+stage.reward;assert.equal(claimed.data.profile.stars,expectedStars);assert(claimed.data.profile.storyCleared.includes(stage.id));if(stage.recruit)assert(claimed.data.profile.owned[stage.recruit]);
 assert.equal((await call('/api/practice/claim',body,p.token)).data.profile.stars,expectedStars);
 }
 const saved=(await call('/api/profile',undefined,p.token)).data.profile;assert.equal(saved.storyCleared.length,8);assert(saved.tutorialDone);for(const key of ['march','dan','natasha','seele'])assert(saved.owned[key]);
 }finally{db.close();}
});

test('tutorial dismissal updates only its preference and does not grant characters or story rewards',async()=>{
 const{db,call}=fixture();try{const p=(await call('/api/profile',{})).data;const result=await call('/api/collection/tutorial',{},p.token);assert.equal(result.status,200);assert(result.data.profile.tutorialDone);assert.equal(result.data.profile.stars,3200);assert.deepEqual(result.data.profile.owned,p.profile.owned);assert.deepEqual(result.data.profile.storyCleared,[]);}finally{db.close();}
});
