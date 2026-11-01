export function createAccounts({hash,makeProfile}) {
  const cookieName='arena_session',iterations=100000;
  const roles=['nova','aegis','lumen','volt','tempo','hex','frost','reaper','march','dan','seele','natasha','clara','silver','ruan','firefly'];
  const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  const secret=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
  const fail=(message,status=400)=>{const e=new Error(message);e.status=status;throw e;};
  const answer=(data,status=200,cookie)=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...(cookie?{'Set-Cookie':cookie}:{})}});
  const cookie=(request,token,age)=>`${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${new URL(request.url).protocol==='https:'?'; Secure':''}`;
  function checkOrigin(request){if(request.method==='GET')return;const origin=request.headers.get('Origin');if(origin&&origin!==new URL(request.url).origin)fail('请在游戏页面内进行操作',403);if(!request.headers.get('Content-Type')?.startsWith('application/json'))fail('请使用游戏中的表单提交',415);}
  async function derive(password,salt){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations,hash:'SHA-256'},key,256)));}
  function passwordCheck(value){if(typeof value!=='string'||value.length<8||value.length>128||!/[A-Za-z]/.test(value)||!/[0-9]/.test(value))fail('密码需要 8–128 位，包含字母和数字');return value;}
  function usernameCheck(value){if(typeof value!=='string'||!/^[a-zA-Z0-9_]{4,24}$/.test(value))fail('账号需为 4–24 位字母、数字或下划线');return value.toLowerCase();}
  function nicknameCheck(value){if(typeof value!=='string'||value.trim().length<1||value.trim().length>16||/[\u0000-\u001f\u007f]/.test(value))fail('昵称需要 1–16 个字符');return value.trim();}
  function safeAccount(a){return{id:a.id,username:a.username,nickname:a.nickname,avatar:a.avatar,createdAt:a.created_at,role:a.is_admin?'admin':'player'};}
  async function session(request,db){const token=request.headers.get('Cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const tokenHash=await hash(token);const a=await db.prepare('SELECT a.*, EXISTS(SELECT 1 FROM arena_admins adm WHERE adm.account_id=a.id) AS is_admin, s.token_hash AS session_hash, s.created_at AS session_created, s.expires AS session_expires FROM arena_sessions s JOIN arena_accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires>?').bind(tokenHash,Date.now()).first();return a||null;}
  function bootstrapSpec(raw){if(!raw)return null;let spec;try{spec=JSON.parse(raw);}catch{fail('管理员预置配置格式错误',503);}if(!/^[a-z0-9_]{4,24}$/.test(spec.username)||!['passwordHash','salt','recoveryHash'].every(k=>/^[a-f0-9]{64}$/.test(spec[k])))fail('管理员预置配置无效',503);return spec;}
  async function ensureAdmin(db,raw){
    const spec=bootstrapSpec(raw);if(!spec)return null;
    const existing=await db.prepare('SELECT a.*, EXISTS(SELECT 1 FROM arena_admins adm WHERE adm.account_id=a.id) AS is_admin FROM arena_accounts a WHERE username=?').bind(spec.username).first();
    if(existing){if(!existing.is_admin)fail('预置管理员账号已被普通账号占用，请联系项目所有者',409);return existing;}
    const id=crypto.randomUUID(),profileHash=await hash(secret()),p=makeProfile();p.stars=16000;p.stardust=600;for(const key of roles)p.owned[key]=1;
    await db.prepare('INSERT INTO arena_profiles (token_hash,data,version) VALUES (?,?,0)').bind(profileHash,JSON.stringify(p)).run();
    try{
      await db.batch([
        db.prepare('INSERT INTO arena_accounts (id,username,nickname,avatar,profile_hash,password_hash,password_salt,recovery_hash,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,spec.username,'星序管理员','nova',profileHash,spec.passwordHash,spec.salt,spec.recoveryHash,Date.now()),
        db.prepare('INSERT INTO arena_admins (account_id) VALUES (?)').bind(id)
      ]);
    }catch(e){await db.prepare('DELETE FROM arena_profiles WHERE token_hash=?').bind(profileHash).run();const raced=await db.prepare('SELECT a.*, EXISTS(SELECT 1 FROM arena_admins adm WHERE adm.account_id=a.id) AS is_admin FROM arena_accounts a WHERE username=?').bind(spec.username).first();if(raced?.is_admin)return raced;throw e;}
    return db.prepare('SELECT a.*, 1 AS is_admin FROM arena_accounts a WHERE id=?').bind(id).first();
  }
  async function profile(db,a){const row=await db.prepare('SELECT data, version FROM arena_profiles WHERE token_hash=?').bind(a.profile_hash).first();if(!row)fail('角色存档暂时无法读取',503);return{profile:JSON.parse(row.data),profileVersion:row.version};}
  async function limited(request,db,type,key,max=10,period=900000){const ip=request.headers.get('CF-Connecting-IP')||'local';const bucket=await hash(type+':'+ip+':'+key+':'+Math.floor(Date.now()/period));await db.prepare('INSERT INTO arena_auth_limits (bucket,attempts,expires) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET attempts=attempts+1').bind(bucket,Date.now()+period).run();const row=await db.prepare('SELECT attempts FROM arena_auth_limits WHERE bucket=?').bind(bucket).first();if(row.attempts>max)fail('操作过于频繁，请稍后再试',429);}
  async function startSession(request,db,a,remember,expectedHash){const token=secret(),now=Date.now(),age=remember?30*86400:86400;const device=(request.headers.get('User-Agent')||'未知设备').slice(0,220);const result=await db.prepare('INSERT INTO arena_sessions (token_hash,account_id,created_at,expires,device) SELECT ?,id,?,?,? FROM arena_accounts WHERE id=? AND password_hash=?').bind(await hash(token),now,now+age*1000,device,a.id,expectedHash).run();if(result.meta.changes!==1)fail('密码刚刚发生变更，请重新登录',401);await db.prepare('DELETE FROM arena_sessions WHERE expires<?').bind(now).run();await db.prepare('DELETE FROM arena_auth_limits WHERE expires<?').bind(now).run();return cookie(request,token,age);}
  async function api(request,env,url){
    if(!env.DB)return answer({error:'账号服务尚未连接'},503);
    const db=env.DB,path=url.pathname.replace('/api/auth/','');
    try{
      checkOrigin(request);let body={};if(request.method==='POST'){const raw=await request.text();if(raw.length>10000)fail('请求过大',413);try{body=JSON.parse(raw);}catch{fail('表单格式不正确');}}
      if(path==='register'&&request.method==='POST'){
        if(await session(request,db))fail('请先退出当前账号');
        const username=usernameCheck(body.username),password=passwordCheck(body.password),nickname=nicknameCheck(body.nickname||body.username);
        if(username===bootstrapSpec(env.ARENA_ADMIN_BOOTSTRAP)?.username)fail('此账号为管理员预留，请使用其他账号');
        await limited(request,db,'register','',60,3600000);
        if(await db.prepare('SELECT id FROM arena_accounts WHERE username=?').bind(username).first())fail('这个账号已被注册，请换一个');
        let profileHash,newProfile=false;const legacy=body.legacyCode||request.headers.get('X-Arena-Profile');if(body.legacyCode&&!/^[a-f0-9]{64}$/.test(body.legacyCode))fail('旧试玩恢复码格式不正确');
        if((body.bindLegacy||body.legacyCode)&&legacy&&/^[a-f0-9]{64}$/.test(legacy)){
          profileHash=await hash(legacy);if(!await db.prepare('SELECT token_hash FROM arena_profiles WHERE token_hash=?').bind(profileHash).first())fail('旧试玩存档不存在');
          if(await db.prepare('SELECT id FROM arena_accounts WHERE profile_hash=?').bind(profileHash).first())fail('这份试玩存档已绑定账号，请登录原账号');
        }else{profileHash=await hash(secret());newProfile=true;await db.prepare('INSERT INTO arena_profiles (token_hash,data,version) VALUES (?,?,0)').bind(profileHash,JSON.stringify(makeProfile())).run();}
        const id=crypto.randomUUID(),salt=secret(),passwordHash=await derive(password,salt),recoveryCode=secret(),now=Date.now();
        try{await db.prepare('INSERT INTO arena_accounts (id,username,nickname,avatar,profile_hash,password_hash,password_salt,recovery_hash,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,username,nickname,'nova',profileHash,passwordHash,salt,await hash(recoveryCode),now).run();}catch{if(newProfile)await db.prepare('DELETE FROM arena_profiles WHERE token_hash=?').bind(profileHash).run();fail('账号或存档已被绑定，请登录或换一个账号');}
        const a=await db.prepare('SELECT * FROM arena_accounts WHERE id=?').bind(id).first();const sessionCookie=await startSession(request,db,a,body.remember!==false,passwordHash);
        return answer({account:safeAccount(a),...await profile(db,a),recoveryCode,boundLegacy:!newProfile},201,sessionCookie);
      }
      if(path==='login'&&request.method==='POST'){
        const username=usernameCheck(body.username);if(typeof body.password!=='string'||body.password.length>128)fail('账号或密码不正确',401);
        await limited(request,db,'login',username);await limited(request,db,'login-ip','',200);
        if(username===bootstrapSpec(env.ARENA_ADMIN_BOOTSTRAP)?.username)await ensureAdmin(db,env.ARENA_ADMIN_BOOTSTRAP);
        const a=await db.prepare('SELECT a.*, EXISTS(SELECT 1 FROM arena_admins adm WHERE adm.account_id=a.id) AS is_admin FROM arena_accounts a WHERE username=?').bind(username).first();const computed=await derive(body.password,a?.password_salt||'astral-dummy-password-salt');
        if(!a||computed!==a.password_hash)fail('账号或密码不正确',401);
        return answer({account:safeAccount(a),...await profile(db,a)},200,await startSession(request,db,a,!!body.remember,a.password_hash));
      }
      if(path==='reset-password'&&request.method==='POST'){
        const username=usernameCheck(body.username),password=passwordCheck(body.password);await limited(request,db,'reset',username,6);const a=await db.prepare('SELECT * FROM arena_accounts WHERE username=?').bind(username).first();const recovery=String(body.recoveryCode||'').replace(/[\s-]/g,'').toLowerCase();const recoveryHash=await hash(recovery);
        if(!a||!/^[a-f0-9]{64}$/.test(recovery)||a.recovery_hash!==recoveryHash)fail('账号或恢复码不正确',401);
        const salt=secret(),recoveryCode=secret(),r=await db.prepare('UPDATE arena_accounts SET password_hash=?,password_salt=?,recovery_hash=? WHERE id=? AND recovery_hash=?').bind(await derive(password,salt),salt,await hash(recoveryCode),a.id,recoveryHash).run();if(r.meta.changes!==1)fail('恢复码已使用，请使用最新恢复码',409);
        await db.prepare('DELETE FROM arena_sessions WHERE account_id=?').bind(a.id).run();return answer({message:'密码已重置，请重新登录',recoveryCode},200,cookie(request,'',0));
      }
      const a=await session(request,db);if(!a)fail('请先登录账号',401);
      if(path==='me'&&request.method==='GET')return answer({account:safeAccount(a),...await profile(db,a)});
      if(path==='logout'&&request.method==='POST'){await db.prepare('DELETE FROM arena_sessions WHERE token_hash=?').bind(a.session_hash).run();return answer({ok:true},200,cookie(request,'',0));}
      if(path==='profile'&&request.method==='POST'){
        const nickname=nicknameCheck(body.nickname),avatar=body.avatar;if(!roles.includes(avatar))fail('请选择有效头像');const p=await profile(db,a);if(!p.profile.owned[avatar])fail('请先招募该角色后再设为头像');
        await db.prepare('UPDATE arena_accounts SET nickname=?,avatar=? WHERE id=?').bind(nickname,avatar,a.id).run();return answer({account:safeAccount({...a,nickname,avatar})});
      }
      if((path==='password'||path==='recovery')&&request.method==='POST'){
        await limited(request,db,'security',a.id,8);if(typeof body.currentPassword!=='string'||body.currentPassword.length>128||await derive(body.currentPassword,a.password_salt)!==a.password_hash)fail('当前密码不正确',401);
        if(path==='password'){const salt=secret(),password=passwordCheck(body.password);const r=await db.prepare('UPDATE arena_accounts SET password_hash=?,password_salt=? WHERE id=? AND password_hash=?').bind(await derive(password,salt),salt,a.id,a.password_hash).run();if(r.meta.changes!==1)fail('账号已更新，请重试',409);await db.prepare('DELETE FROM arena_sessions WHERE account_id=? AND token_hash<>?').bind(a.id,a.session_hash).run();return answer({message:'密码已修改，其他设备已退出登录'});}
        const recoveryCode=secret();await db.prepare('UPDATE arena_accounts SET recovery_hash=? WHERE id=?').bind(await hash(recoveryCode),a.id).run();return answer({recoveryCode});
      }
      if(path==='sessions'&&request.method==='GET'){
        // D1's .all() is not needed: JSON aggregation keeps local and hosted adapters identical.
        const row=await db.prepare("SELECT json_group_array(json_object('id',token_hash,'createdAt',created_at,'expires',expires,'device',device,'current',token_hash=?)) AS items FROM (SELECT * FROM arena_sessions WHERE account_id=? AND expires>? ORDER BY created_at DESC LIMIT 30)").bind(a.session_hash,a.id,Date.now()).first();return answer({sessions:JSON.parse(row.items||'[]')});
      }
      if(path==='sessions/revoke'&&request.method==='POST'){
        if(body.id){if(body.id===a.session_hash)fail('当前设备请使用退出登录');await db.prepare('DELETE FROM arena_sessions WHERE account_id=? AND token_hash=?').bind(a.id,body.id).run();}else await db.prepare('DELETE FROM arena_sessions WHERE account_id=? AND token_hash<>?').bind(a.id,a.session_hash).run();return answer({ok:true});
      }
      return answer({error:'没有这个账号操作'},404);
    }catch(e){return answer({error:e.message},e.status||400);}
  }
  return{api,session,profile,safeAccount,checkOrigin,ensureAdmin,limited,verifyPassword:async(value,a)=>typeof value==='string'&&value.length<=128&&await derive(value,a.password_salt)===a.password_hash};
}
