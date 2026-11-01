import {createEngine} from '../src/engine.js';
import {createCollection} from '../src/collection.js';
import {createAccounts} from './accounts.js';
import {createAdminService} from './admin.js';
import {createCampaign} from '../src/campaign.js';
const engine=createEngine();
const collection=createCollection();
const campaign=createCampaign();
const practiceGame=(ticket,now)=>ticket.stageId?campaign.makeBattle(engine,ticket.stageId,ticket.seed,now):engine.make('practice',now,ticket.teams,{seed:ticket.seed});
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const random=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
const tokenHash=async token=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
const accounts=createAccounts({hash:tokenHash,makeProfile:()=>collection.make()});
const adminApi=createAdminService({accounts});
async function profileOf(request,db){
  const account=await accounts.session(request,db);
  if(account){const p=await accounts.profile(db,account);return{hash:account.profile_hash,profile:p.profile,version:p.profileVersion,account:accounts.safeAccount(account)};}
  const token=request.headers.get('X-Arena-Profile');if(!token||!/^[a-f0-9]{64}$/.test(token)){const e=new Error('登录已过期，请重新登录账号');e.status=401;throw e;}const hash=await tokenHash(token),row=await db.prepare('SELECT data, version FROM arena_profiles WHERE token_hash = ?').bind(hash).first();if(!row)throw new Error('收藏恢复码无效');if(await db.prepare('SELECT id FROM arena_accounts WHERE profile_hash=?').bind(hash).first())throw new Error('此存档已绑定账号，请使用账号密码登录');return{hash,profile:JSON.parse(row.data),version:row.version};
}
async function writeProfile(db,p){const r=await db.prepare('UPDATE arena_profiles SET data = ?, version = version + 1 WHERE token_hash = ? AND version = ?').bind(JSON.stringify(p.profile),p.hash,p.version).run();if(r.meta.changes!==1)throw new Error('收藏已在另一个页面更新，请刷新后重试');p.version++;return{profile:p.profile,profileVersion:p.version};}
async function collectionApi(request,env,url){
  if(!env.DB)return json({error:'收藏服务尚未连接'},503);
  try{
    let body={};if(request.method==='POST'){const raw=await request.text();if(raw.length>128000)return json({error:'请求过大'},413);body=JSON.parse(raw);}
    if(url.pathname==='/api/profile'&&request.method==='POST'){
      const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join(''),hash=await tokenHash(token),profile=collection.make();
      await env.DB.prepare('INSERT INTO arena_profiles (token_hash,data,version) VALUES (?,?,0)').bind(hash,JSON.stringify(profile)).run();return json({token,profile,profileVersion:0});
    }
    const p=await profileOf(request,env.DB);
    if(url.pathname==='/api/profile'&&request.method==='GET')return json({profile:p.profile,profileVersion:p.version});
    if(request.method!=='POST')return json({error:'不支持的请求'},405);
    let results,storyReward;
    if(url.pathname==='/api/collection/draw'){const draw=collection.draw(p.profile,body.count,random);p.profile=draw.profile;results=draw.results;}
    else if(url.pathname==='/api/collection/exchange')p.profile=collection.exchange(p.profile,body.key);
    else if(url.pathname==='/api/collection/daily')p.profile=collection.daily(p.profile);
    else if(url.pathname==='/api/collection/mission')p.profile=collection.claim(p.profile,body.key);
    else if(url.pathname==='/api/collection/tutorial')p.profile={...p.profile,tutorialDone:true};
    else if(url.pathname==='/api/practice/start'){
      const stage=body.stageId?campaign.get(body.stageId):null;if(body.stageId&&(!stage||!campaign.unlocked(p.profile,body.stageId)))throw new Error('请先完成前置剧情关卡');
      const team=stage?stage.team:collection.checkTeam(p.profile,engine.validateTeam(body.team)),seed=crypto.getRandomValues(new Uint32Array(1))[0],keys=Object.keys(engine.presets);
      const opponent=stage?stage.enemy:engine.presets[body.opponent==='random'?keys[seed%keys.length]:body.opponent];if(!opponent)throw new Error('请选择有效的电脑阵容');
      const ticket={id:crypto.randomUUID(),rulesVersion:engine.rulesVersion,teams:[team,opponent],seed,expires:Date.now()+6*3600000,...(stage?{stageId:stage.id}:{})};p.profile.pendingPractice=ticket;
      const saved=await writeProfile(env.DB,p);return json({...saved,matchId:ticket.id,game:practiceGame(ticket,Date.now())});
    }else if(url.pathname==='/api/practice/claim'){
      const rewardId='practice:'+body.matchId;if(p.profile.claimedMatches.includes(rewardId))return json({profile:p.profile,profileVersion:p.version});
      const ticket=p.profile.pendingPractice;if(!ticket||ticket.rulesVersion!==engine.rulesVersion||ticket.id!==body.matchId||ticket.expires<Date.now())throw new Error('这场演练的奖励记录已失效，可重新开始一场');
      if(!Array.isArray(body.actions)||body.actions.length>500)throw new Error('对战记录无效');
      let game=practiceGame(ticket,0);
      for(const entry of body.actions){if(entry.side===1){const expected=engine.ai(game,1);if(!expected||expected.kind!==entry.action?.kind||expected.actor!==entry.action?.actor||expected.target!==entry.action?.target)throw new Error('电脑行动记录未通过校验');}game=engine.act(game,entry.side,entry.action,0);}
      if(game.phase!=='ended')throw new Error('请先完成对局');p.profile=collection.reward(p.profile,rewardId,game.winner===0,game.seq>=6);p.profile.pendingPractice=null;
      if(ticket.stageId&&game.winner===0&&game.seq>=6){const grant=campaign.reward(collection,p.profile,ticket.stageId);p.profile=grant.profile;storyReward={firstClear:grant.firstClear,stars:grant.stars||0,recruit:grant.recruit||null};}
    }else return json({error:'没有这个收藏操作'},404);
    const saved=await writeProfile(env.DB,p);return json({...saved,...(results?{results}:{}),...(storyReward?{storyReward}:{})});
  }catch(e){return json({error:e.message},e.status||400);}
}
const publicRoom=room=>{const {tokens,profiles,...rest}=room;return rest;};
const codeOf=()=>Array.from(crypto.getRandomValues(new Uint8Array(6)),x=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x%32]).join('');
async function load(db,code){const row=await db.prepare('SELECT data, version, expires FROM arena_rooms WHERE code = ?').bind(code).first();if(!row||row.expires<Date.now())throw new Error('房间不存在或已过期');const room=JSON.parse(row.data);if(room.game.rulesVersion!==engine.rulesVersion)throw new Error('这个房间属于旧版本，请重新创建房间');return {room,version:row.version};}
async function save(db,code,room,version){const r=await db.prepare('UPDATE arena_rooms SET data = ?, version = version + 1 WHERE code = ? AND version = ?').bind(JSON.stringify(room),code,version).run();if(r.meta.changes!==1)throw new Error('对局状态已更新，请重新操作');}
async function api(request,env,url){
  if(!env.DB)return json({error:'联机服务尚未连接。你仍然可以体验人机演练。'},503);
  const token=request.headers.get('Authorization')?.replace(/^Bearer /,'');
  const parts=url.pathname.split('/').filter(Boolean);
  let body={};
  if(request.method==='POST'){if(Number(request.headers.get('content-length')||0)>6000)return json({error:'请求过大'},413);try{body=await request.json();}catch{return json({error:'无效请求'},400);}}
  try{
    if(request.method==='POST'&&url.pathname==='/api/rooms'){
      const p=await profileOf(request,env.DB);
      const team=collection.checkTeam(p.profile,body.team?engine.validateTeam(body.team):engine.presets.balanced);
      const room={code:codeOf(),matchId:crypto.randomUUID(),profiles:[p.hash,null],players:[p.account?{nickname:p.account.nickname,avatar:p.account.avatar}:null,null],tokens:[crypto.randomUUID(),null],game:engine.make('online',Date.now(),[team,engine.presets.balanced])};
      await env.DB.prepare('DELETE FROM arena_rooms WHERE expires < ?').bind(Date.now()).run();
      let created=false;
      for(let i=0;i<4;i++){
        const r=await env.DB.prepare('INSERT OR IGNORE INTO arena_rooms (code,data,version,expires) VALUES (?,?,0,?)').bind(room.code,JSON.stringify(room),Date.now()+6*3600000).run();
        if(r.meta.changes){created=true;break;}room.code=codeOf();
      }
      if(!created)throw new Error('房间创建失败，请重试');
      return json({...publicRoom(room),token:room.tokens[0],side:0,version:0});
    }
    const code=parts[2]?.toUpperCase();
    if(parts[1]!=='rooms'||!code||!/^[A-Z2-9]{6}$/.test(code))return json({error:'无效的房间地址'},404);
    const {room,version}=await load(env.DB,code);
    const operation=parts[3];
    if(request.method==='POST'&&operation==='join'){
      if(room.tokens.includes(token)){const p=await profileOf(request,env.DB);if(room.profiles?.[room.tokens.indexOf(token)]!==p.hash)throw new Error('请登录此房间对应的账号');return json({...publicRoom(room),side:room.tokens.indexOf(token),token,version});}
      if(room.tokens[1])throw new Error('房间已有两名玩家');
      const p=await profileOf(request,env.DB);room.profiles??=[null,null];room.profiles[1]=p.hash;room.players??=[null,null];room.players[1]=p.account?{nickname:p.account.nickname,avatar:p.account.avatar}:null;
      room.tokens[1]=crypto.randomUUID();room.game.connected[1]=true;
      await save(env.DB,code,room,version);
      return json({...publicRoom(room),side:1,token:room.tokens[1],version:version+1});
    }
    const side=room.tokens.indexOf(token);
    if(!token||side<0)return json({error:'请通过加入房间取得玩家身份'},403);
    const identity=await profileOf(request,env.DB);if(room.profiles?.[side]&&room.profiles[side]!==identity.hash)return json({error:'请登录本场对局对应的账号'},403);
    if(room.game.phase==='battle'&&Date.now()>room.game.deadline){
      const actor=engine.current(room.game);
      room.game=engine.act(room.game,actor.side,{kind:'defend'});
      await save(env.DB,code,room,version);
      if(request.method==='POST')return json({error:'上一回合已超时，请刷新状态后重试'},409);
      return json({...publicRoom(room),side,version:version+1});
    }
    if(request.method==='GET'&&!operation)return json({...publicRoom(room),side,version});
    if(request.method!=='POST')return json({error:'不支持的请求'},405);
    if(operation==='reward'){
      if(room.game.phase!=='ended')throw new Error('请先完成对局');const p=await profileOf(request,env.DB);if(room.profiles?.[side]&&room.profiles[side]!==p.hash)throw new Error('请使用本场对局对应的收藏存档');
      const rewardId='room:'+(room.matchId||room.tokens[side])+':'+side;p.profile=collection.reward(p.profile,rewardId,room.game.winner===side,room.game.seq>=6&&room.game.surrendered!==side);return json(await writeProfile(env.DB,p));
    }
    if(operation==='ready'){
      if(room.game.phase!=='waiting')throw new Error('对局已开始');
      const p=await profileOf(request,env.DB);if(room.profiles?.[side]&&room.profiles[side]!==p.hash)throw new Error('请使用本房间对应的收藏存档');
      room.game.teams[side]=collection.checkTeam(p.profile,body.team?engine.validateTeam(body.team):room.game.teams[side]);
      room.game.ready[side]=true;
      if(room.game.ready.every(Boolean)&&room.tokens[1]){const fresh=engine.make('online',Date.now(),room.game.teams,{seed:crypto.getRandomValues(new Uint32Array(1))[0]});fresh.phase='battle';fresh.ready=[true,true];fresh.connected=[true,true];room.game=fresh;}
    }else if(operation==='unready'){
      if(room.game.phase!=='waiting')throw new Error('对局已开始，无法取消准备');
      room.game.ready[side]=false;
    }else if(operation==='action'){
      if(body.seq!==room.game.seq)throw new Error('对局状态已更新，请重新操作');
      room.game=engine.act(room.game,side,body.action);
    }else if(operation==='surrender'){
      if(room.game.phase!=='battle')throw new Error('当前无法认输');
      room.game.phase='ended';room.game.winner=1-side;room.game.surrendered=side;room.game.actor=null;room.game.seq++;
    }else return json({error:'无效的操作'},404);
    await save(env.DB,code,room,version);
    return json({...publicRoom(room),side,version:version+1});
  }catch(e){return json({error:e.message},e.status||400);}
}
export default {async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/'&&env.DB&&env.ARENA_ADMIN_BOOTSTRAP){try{await accounts.ensureAdmin(env.DB,env.ARENA_ADMIN_BOOTSTRAP);}catch{return json({error:'预置管理员初始化失败，请由项目所有者检查配置'},503);}}
  if(url.pathname.startsWith('/api/')){try{accounts.checkOrigin(request);}catch(e){return json({error:e.message},e.status||403);}}
  if(url.pathname.startsWith('/api/auth/'))return accounts.api(request,env,url);
  if(url.pathname.startsWith('/api/admin/'))return adminApi(request,env,url);
  if(url.pathname==='/api/profile'||url.pathname.startsWith('/api/collection/')||url.pathname.startsWith('/api/practice/'))return collectionApi(request,env,url);
  if(url.pathname.startsWith('/api/'))return api(request,env,url);
  const asset=ASSETS[url.pathname];
  if(!asset)return new Response('Not found',{status:404});
  const body=asset.encoding==='base64'?Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0)):asset.body;
  return new Response(body,{headers:{'Content-Type':asset.type,'X-Content-Type-Options':'nosniff','Cache-Control':asset.encoding?'public, max-age=86400':'no-cache'}});
}};
