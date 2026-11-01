import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker from '../dist/server/index.js';
function fixture(){
 const db=new DatabaseSync(':memory:');for(const file of ['0000_arena.sql','0001_collection.sql','0002_accounts.sql','0003_admin.sql'])db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 const env={DB:{prepare(sql){return{bind(...args){return{first:async()=>db.prepare(sql).get(...args)??null,run:async()=>({meta:{changes:db.prepare(sql).run(...args).changes}})};}};}}};
 const client=()=>{let cookie='';return{get cookie(){return cookie;},set cookie(v){cookie=v;},async call(path,body,headers={}){const r=await worker.fetch(new Request('https://arena.test'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Origin:'https://arena.test','User-Agent':'Browser test',...(cookie?{Cookie:cookie}:{}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})}),env);const set=r.headers.get('Set-Cookie');if(set)cookie=set.split(';')[0];return{status:r.status,data:await r.json(),cookie:set};}};};
 return{db,client};
}
const registration=(username='traveler')=>({username,nickname:'星海旅人',password:'Nebula2026',remember:true});
test('register, persistent login, private profile and logout use hashed passwords and HttpOnly sessions',async()=>{
 const {db,client}=fixture(),a=client();assert.equal((await a.call('/api/auth/me')).status,401);
 const created=await a.call('/api/auth/register',registration());assert.equal(created.status,201);assert.equal(created.data.profile.stars,3200);assert.match(created.data.recoveryCode,/^[a-f0-9]{64}$/);assert.match(created.cookie,/HttpOnly/);assert.match(created.cookie,/Secure/);assert.match(created.cookie,/SameSite=Lax/);assert(!JSON.stringify(created.data).includes('password_hash'));
 const row=db.prepare('SELECT * FROM arena_accounts').get();assert.notEqual(row.password_hash,'Nebula2026');assert.equal(row.password_hash.length,64);assert.notEqual(row.recovery_hash,created.data.recoveryCode);
 assert.equal((await a.call('/api/collection/draw',{count:10})).data.profile.stars,1600);
 const b=client();assert.equal((await b.call('/api/auth/login',{username:'TRAVELER',password:'Nebula2026',remember:true})).status,200);assert.equal((await b.call('/api/auth/me')).data.profile.totalDraws,10);
 const oldCookie=a.cookie;await a.call('/api/auth/logout',{});a.cookie=oldCookie;assert.equal((await a.call('/api/auth/me')).status,401);assert.equal((await b.call('/api/auth/me')).status,200);db.close();
});
test('validation, duplicate registration and incorrect passwords cannot change an account',async()=>{
 const {db,client}=fixture(),a=client();assert.equal((await a.call('/api/auth/register',{...registration(),username:'ab'})).status,400);assert.equal((await a.call('/api/auth/register',{...registration(),password:'12345678'})).status,400);assert.equal((await a.call('/api/auth/register',registration())).status,201);
 const b=client();assert.equal((await b.call('/api/auth/register',registration())).status,400);assert.equal((await b.call('/api/auth/login',{username:'traveler',password:'Wrong2026'})).status,401);assert.equal((await b.call('/api/auth/me')).status,401);assert.equal(db.prepare('SELECT count(*) AS n FROM arena_accounts').get().n,1);db.close();
});
test('old anonymous collection binds once without resetting pity, while its old bearer no longer grants access',async()=>{
 const {db,client}=fixture(),a=client();const legacy=(await a.call('/api/profile',{})).data;const headers={'X-Arena-Profile':legacy.token};await a.call('/api/collection/draw',{count:10},headers);
 const registered=await a.call('/api/auth/register',{...registration(),bindLegacy:true},headers);assert.equal(registered.data.boundLegacy,true);assert.equal(registered.data.profile.totalDraws,10);assert.equal(registered.data.profile.stars,1600);
 const b=client();assert.equal((await b.call('/api/profile',undefined,headers)).status,400);assert.equal((await b.call('/api/collection/draw',{count:1},headers)).status,400);assert.equal((await b.call('/api/auth/register',{...registration('hijacker'),bindLegacy:true},headers)).status,400);assert.equal((await a.call('/api/auth/me')).data.profile.totalDraws,10);db.close();
});
test('nickname and avatar update persists and cannot select an unowned character',async()=>{
 const {db,client}=fixture(),a=client();await a.call('/api/auth/register',registration());assert.equal((await a.call('/api/auth/profile',{nickname:'新旅人',avatar:'tempo'})).status,400);
 const changed=await a.call('/api/auth/profile',{nickname:'新旅人',avatar:'lumen'});assert.equal(changed.status,200);assert.equal((await a.call('/api/auth/me')).data.account.nickname,'新旅人');assert.equal((await a.call('/api/auth/me')).data.account.avatar,'lumen');assert.equal((await a.call('/api/auth/profile',{nickname:'x'.repeat(17),avatar:'nova'})).status,400);db.close();
});
test('changing password verifies the current password and invalidates other sessions',async()=>{
 const {db,client}=fixture(),a=client(),b=client(),c=client();await a.call('/api/auth/register',registration());await b.call('/api/auth/login',{username:'traveler',password:'Nebula2026'});
 assert.equal((await a.call('/api/auth/password',{currentPassword:'Wrong1234',password:'NewNebula2026'})).status,401);assert.equal((await a.call('/api/auth/password',{currentPassword:'Nebula2026',password:'NewNebula2026'})).status,200);
 assert.equal((await a.call('/api/auth/me')).status,200);assert.equal((await b.call('/api/auth/me')).status,401);assert.equal((await c.call('/api/auth/login',{username:'traveler',password:'Nebula2026'})).status,401);assert.equal((await c.call('/api/auth/login',{username:'traveler',password:'NewNebula2026'})).status,200);db.close();
});
test('forgot-password recovery is single-use, rotates the recovery code and logs out all devices',async()=>{
 const {db,client}=fixture(),a=client(),b=client();const reg=await a.call('/api/auth/register',registration());const old=reg.data.recoveryCode;assert.equal((await b.call('/api/auth/reset-password',{username:'traveler',password:'Recovered2026',recoveryCode:'a'.repeat(64)})).status,401);
 const reset=await b.call('/api/auth/reset-password',{username:'traveler',password:'Recovered2026',recoveryCode:old});assert.equal(reset.status,200);assert.notEqual(reset.data.recoveryCode,old);assert.equal((await a.call('/api/auth/me')).status,401);assert.equal((await b.call('/api/auth/reset-password',{username:'traveler',password:'Stolen2026',recoveryCode:old})).status,401);
 assert.equal((await b.call('/api/auth/login',{username:'traveler',password:'Recovered2026'})).status,200);const rotated=await b.call('/api/auth/recovery',{currentPassword:'Recovered2026'});assert.equal(rotated.status,200);assert.notEqual(rotated.data.recoveryCode,reset.data.recoveryCode);db.close();
});
test('session management revokes selected or other devices and an expired cookie is rejected',async()=>{
 const {db,client}=fixture(),a=client(),b=client();await a.call('/api/auth/register',registration());await b.call('/api/auth/login',{username:'traveler',password:'Nebula2026'});const sessions=(await a.call('/api/auth/sessions')).data.sessions;assert.equal(sessions.length,2);assert.equal(sessions.filter(x=>x.current).length,1);
 assert.equal((await a.call('/api/auth/sessions/revoke',{id:sessions.find(x=>!x.current).id})).status,200);assert.equal((await b.call('/api/auth/me')).status,401);await b.call('/api/auth/login',{username:'traveler',password:'Nebula2026'});await a.call('/api/auth/sessions/revoke',{});assert.equal((await b.call('/api/auth/me')).status,401);
 db.prepare('UPDATE arena_sessions SET expires=?').run(Date.now()-1);assert.equal((await a.call('/api/auth/me')).status,401);db.close();
});
test('cross-origin form submissions are blocked and persistent rate limiting rejects brute force',async()=>{
 const {db,client}=fixture(),a=client();assert.equal((await a.call('/api/auth/register',registration(),{Origin:'https://evil.test'})).status,403);assert.equal((await a.call('/api/auth/register',registration(),{'Content-Type':'text/plain'})).status,415);await a.call('/api/auth/register',registration());await a.call('/api/auth/logout',{});
 for(let i=0;i<10;i++)assert.equal((await a.call('/api/auth/login',{username:'traveler',password:'Wrong2026'})).status,401);assert.equal((await a.call('/api/auth/login',{username:'traveler',password:'Nebula2026'})).status,429);db.close();
});
test('collection and multiplayer state remain isolated between accounts, even with another room token',async()=>{
 const {db,client}=fixture(),a=client(),b=client();await a.call('/api/auth/register',registration());await b.call('/api/auth/register',registration('another'));
 await a.call('/api/collection/draw',{count:10});assert.equal((await b.call('/api/profile')).data.profile.totalDraws,0);const room=(await a.call('/api/rooms',{})).data;
 assert.equal((await b.call('/api/rooms/'+room.code,undefined,{Authorization:'Bearer '+room.token})).status,403);
 const joined=await b.call('/api/rooms/'+room.code+'/join',{});assert.equal(joined.status,200);assert.equal(joined.data.players[0].nickname,'星海旅人');assert(!('profiles' in joined.data));assert(!('tokens' in joined.data));
 await a.call('/api/auth/logout',{});assert.equal((await a.call('/api/rooms/'+room.code+'/ready',{}, {Authorization:'Bearer '+room.token})).status,401);db.close();
});
