export function createAdminService({accounts}){
  const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
  const fail=(message,status=400)=>{const e=new Error(message);e.status=status;throw e;};
  const roles=['nova','aegis','lumen','volt','tempo','hex','frost','reaper','march','dan','seele','natasha','clara','silver','ruan','firefly'];
  return async function adminApi(request,env,url){
    if(!env.DB)return json({error:'管理服务尚未连接'},503);
    const db=env.DB;
    try{
      const actor=await accounts.session(request,db);if(!actor)fail('请先登录管理员账号',401);if(!actor.is_admin)fail('当前账号没有管理员权限',403);
      if(request.method==='GET'&&url.pathname==='/api/admin/overview'){
        const stats=await db.prepare("SELECT (SELECT count(*) FROM arena_accounts) AS players,(SELECT count(*) FROM arena_rooms WHERE expires>?) AS rooms,(SELECT COALESCE(sum(json_extract(p.data,'$.totalDraws')),0) FROM arena_profiles p JOIN arena_accounts a ON a.profile_hash=p.token_hash) AS draws,(SELECT count(*) FROM arena_admin_audit) AS operations").bind(Date.now()).first();return json({stats});
      }
      if(request.method==='GET'&&url.pathname==='/api/admin/players'){
        const q=(url.searchParams.get('q')||'').trim().slice(0,40),offset=Number(url.searchParams.get('offset')||0);if(!Number.isSafeInteger(offset)||offset<0||offset>10000)fail('页码无效');
        const pattern='%'+q.replace(/[\\%_]/g,'\\$&')+'%';
        const where=" WHERE a.username LIKE ? ESCAPE '\\' OR a.nickname LIKE ? ESCAPE '\\'";
        const total=await db.prepare('SELECT count(*) AS count FROM arena_accounts a'+where).bind(pattern,pattern).first();
        const row=await db.prepare("SELECT json_group_array(json_object('id',id,'username',username,'nickname',nickname,'avatar',avatar,'createdAt',created_at,'role',CASE WHEN is_admin=1 THEN 'admin' ELSE 'player' END,'profile',json(data),'version',version)) AS items FROM (SELECT a.id,a.username,a.nickname,a.avatar,a.created_at,p.data,p.version,EXISTS(SELECT 1 FROM arena_admins adm WHERE adm.account_id=a.id) AS is_admin FROM arena_accounts a JOIN arena_profiles p ON p.token_hash=a.profile_hash"+where+' ORDER BY a.created_at DESC LIMIT 25 OFFSET ?)').bind(pattern,pattern,offset).first();
        const players=JSON.parse(row.items||'[]').map(x=>{const p=x.profile;return{...x,profile:{stars:p.stars,stardust:p.stardust,owned:p.owned,totalDraws:p.totalDraws,matches:p.matches,wins:p.wins}};});return json({players,total:total.count,offset});
      }
      if(request.method==='GET'&&url.pathname==='/api/admin/audit'){
        const row=await db.prepare("SELECT json_group_array(json_object('id',id,'actor',actor,'target',target,'action',action,'detail',json(detail),'createdAt',created_at)) AS items FROM (SELECT l.id,a.username AS actor,t.username AS target,l.action,l.detail,l.created_at FROM arena_admin_audit l JOIN arena_accounts a ON a.id=l.actor_id JOIN arena_accounts t ON t.id=l.target_id ORDER BY l.created_at DESC LIMIT 30)").bind().first();return json({records:JSON.parse(row.items||'[]')});
      }
      if(request.method==='POST'&&url.pathname==='/api/admin/grant'){
        const raw=await request.text();if(raw.length>6000)fail('请求过大',413);const body=JSON.parse(raw);await accounts.limited(request,db,'admin-grant',actor.id,30);if(!await accounts.verifyPassword(body.password,actor))fail('管理员密码不正确',403);
        const stars=body.stars??0,stardust=body.stardust??0,unlockAll=body.unlockAll===true,reason=typeof body.reason==='string'?body.reason.trim():'';
        if(!Number.isSafeInteger(stars)||stars<0||stars>100000||!Number.isSafeInteger(stardust)||stardust<0||stardust>10000)fail('单次星石为 0–100000，星尘为 0–10000');if(!stars&&!stardust&&!unlockAll)fail('请至少选择一项操作');if(!reason||reason.length>120)fail('请填写 1–120 字的操作说明');
        const target=await db.prepare('SELECT a.id,a.profile_hash,p.data,p.version FROM arena_accounts a JOIN arena_profiles p ON p.token_hash=a.profile_hash WHERE a.id=?').bind(body.accountId).first();if(!target)fail('玩家账号不存在',404);
        const p=JSON.parse(target.data);p.stars+=stars;p.stardust+=stardust;if(!Number.isSafeInteger(p.stars)||!Number.isSafeInteger(p.stardust))fail('资源超出允许范围');if(unlockAll)for(const key of roles)p.owned[key]=Math.max(1,p.owned[key]||0);
        const detail={stars,stardust,unlockAll,reason};
        const result=await db.batch([
          db.prepare('INSERT INTO arena_admin_audit (id,actor_id,target_id,action,detail,created_at) SELECT ?,?,?,?,?,? FROM arena_profiles WHERE token_hash=? AND version=?').bind(crypto.randomUUID(),actor.id,target.id,'grant',JSON.stringify(detail),Date.now(),target.profile_hash,target.version),
          db.prepare('UPDATE arena_profiles SET data=?,version=version+1 WHERE token_hash=? AND version=?').bind(JSON.stringify(p),target.profile_hash,target.version)
        ]);
        if(result[0].meta.changes!==1||result[1].meta.changes!==1)fail('玩家进度刚刚更新，请刷新后重试',409);return json({ok:true,accountId:target.id,profile:p,profileVersion:target.version+1});
      }
      return json({error:'没有这个管理操作'},404);
    }catch(e){return json({error:e.message},e.status||400);}
  };
}
