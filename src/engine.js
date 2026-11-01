import {createExpandedRoster} from './expanded-roster.js';
export function createEngine(){
  const rulesVersion=4;
  // Stable keys preserve existing collections, avatars, lineups and gacha counters.
  const roles=[
    {key:'nova',name:'姬子',title:'火 · 智识',element:'fire',weak:['ice','lightning'],color:'#f0ac92',hp:1080,atk:110,speed:100,skillTarget:'enemy',skill:'熔核爆裂',ult:'天坠之火',talent:'乘胜追击',description:'扩散输出 · 击破蓄能 · 群体追击',basicText:'对单个敌人造成 100% 攻击伤害，恢复 1 战技点与 25 能量。攻击有 50% 概率施加 2 回合灼烧，每次为攻击力的 40%。',skillText:'主目标承受 170% 攻击伤害，相邻敌人承受 65%。削韧 35 / 15。',ultText:'全体敌人承受 200% 攻击伤害，削韧 30；每击倒一人恢复自身 10 能量。',talentText:'开场拥有 1 点充能。敌方目标被任意队友击破时获得 1 点，达到 3 点后在本次攻击结束时发动 100% 攻击力的群体追击。每条指令最多追击一次。'},
    {key:'aegis',name:'杰帕德',title:'冰 · 存护',element:'ice',weak:['wind','fire'],color:'#a4ceff',hp:1440,atk:82,speed:92,skillTarget:'enemy',skill:'震撼之击',ult:'永屹之壁',talent:'不屈之躯',description:'全队护盾 · 冻结 · 一次复起',basicText:'对单个敌人造成 100% 攻击伤害，恢复 1 战技点与 25 能量。',skillText:'单个敌人承受 150% 攻击伤害，削韧 30，并有 65% 概率冻结 1 次普通行动。抗冻期间不会再次冻结。',ultText:'全体存活队友获得 360 点护盾，持续各自 3 次普通行动。重复施加取较高护盾值并刷新时长，上限 650。',talentText:'每场战斗首次被击倒时立即恢复 35% 最大生命、清除负面状态并充满能量。只对自己生效，不能再次触发。'},
    {key:'lumen',name:'藿藿',title:'风 · 丰饶',element:'wind',weak:['fire','lightning'],color:'#a9dfbf',hp:1080,atk:72,speed:98,skillTarget:'ally',skill:'灵符·保命护身',ult:'尾巴·遣神役鬼',talent:'凭附·气通天真',description:'扩散治疗 · 禳命净化 · 全队充能',basicText:'对单个敌人造成 100% 攻击伤害，恢复 1 战技点与 25 能量。',skillText:'指定存活队友恢复 320 生命并净化 1 个负面状态，相邻队友各恢复 160。获得持续自身 2 次普通行动的「禳命」及 6 次天赋净化次数。',ultText:'其余队友恢复 20 能量，全队攻击提高 25%，持续 2 次普通行动。终结技本身不直接提供群体治疗。',talentText:'禳命期间，队友普通行动开始或施放终结技时，恢复该角色 55 生命，并治疗其他生命不高于 50% 的队友。天赋每净化一次消耗 1 次净化次数。'},
    {key:'volt',name:'景元',title:'雷 · 智识',element:'lightning',weak:['ice','wind'],color:'#e6cb91',hp:1060,atk:100,speed:99,skillTarget:'enemy',skill:'紫霄震曜',ult:'吾身光明',talent:'斩勘神形',description:'独立神君 · 段数叠加 · 弹射追击',basicText:'对单个敌人造成 100% 攻击伤害，恢复 1 战技点与 25 能量。',skillText:'全体敌人承受 85% 攻击伤害，削韧 20；神君下一次攻击增加 2 段。',ultText:'全体敌人承受 150% 攻击伤害，削韧 30；神君下一次攻击增加 3 段。',talentText:'神君独立进入行动序列，初始 3 段、速度 60，每增 1 段速度 +10，最多 10 段。每段对随机敌人造成 40% 攻击伤害，并扩散 25%；出手后重置。景元被控时神君延后，景元退场则神君退场。'},
    {key:'tempo',name:'布洛妮娅',title:'风 · 同谐',element:'wind',weak:['fire','ice'],color:'#bdd6f4',hp:1020,atk:78,speed:99,skillTarget:'ally',skill:'作战再部署',ult:'贝洛伯格进行曲',talent:'先人一步',description:'立即行动 · 净化增伤 · 攻击与暴伤辅助',basicText:'对单个敌人造成 100% 攻击伤害，恢复 1 战技点与 25 能量；自身下次行动提前 30%。',skillText:'净化指定队友 1 个负面状态，使其立即获得下一次普通行动，造成伤害提高 40%，持续 1 次普通行动。对自身施放仅净化和增伤，不会立即再动。',ultText:'全队攻击提高 25%、暴击伤害提高 30 个百分点，持续 2 次普通行动。',talentText:'通过普攻自拉条、战技拉队友与净化来安排出手顺序。终结技不占普通行动；已轮到的普通行动不会被其他终结技夺走。'},
    {key:'hex',name:'卡芙卡',title:'雷 · 虚无',element:'lightning',weak:['wind','fire'],color:'#d4a6d5',hp:1100,atk:98,speed:100,skillTarget:'enemy',skill:'月光摩挲连绵',ult:'悲剧尽头的颤音',talent:'温柔亦同残酷',description:'触电 · 持续伤害引爆 · 普攻协同追击',basicText:'对单个敌人造成 100% 攻击伤害，恢复 1 战技点与 25 能量。',skillText:'主目标承受 150% 攻击伤害，相邻敌人承受 55%；立即结算主目标已有灼烧、触电伤害的 75%，不消耗持续回合。',ultText:'全体敌人承受 130% 攻击伤害并获得 2 回合触电，每次为攻击力的 75%；随后额外结算一次触电伤害。',talentText:'其他队友普攻命中存活目标后，卡芙卡发动一次 100% 攻击力追击并施加触电。每次自身普通行动开始重置可用次数；被冻时不能追击。'},
    {key:'frost',name:'彦卿',title:'冰 · 巡猎',element:'ice',weak:['lightning','fire'],color:'#9cdbef',hp:1000,atk:112,speed:109,skillTarget:'enemy',skill:'遥击三尺水',ult:'快雨燕相逐',talent:'呼剑如影',description:'智剑连心 · 暴击爆发 · 条件追击冻结',basicText:'对单个敌人造成 100% 攻击伤害，恢复 1 战技点与 25 能量。',skillText:'单个敌人承受 165% 攻击伤害，削韧 35；获得「智剑连心」，持续至下次普通行动结束。',ultText:'本次及下次普通行动前暴击率提高 60 个百分点；若已有智剑连心，额外提高 50 个百分点暴击伤害。对指定敌人造成 280% 攻击伤害。',talentText:'智剑连心使暴击率 +20%、暴击伤害 +30%；攻击后有 60% 概率追加一次 75% 攻击伤害，并有 65% 概率冻结。生命实际受损时失去智剑连心，完全被护盾吸收则保留。'},
    {key:'reaper',name:'艾丝妲',title:'火 · 同谐',element:'fire',weak:['ice','wind'],color:'#edbacd',hp:1020,atk:74,speed:106,skillTarget:'enemy',skill:'流星风暴',ult:'星空祝言',talent:'天象学',description:'五段弹射 · 蓄能增攻 · 全队加速',basicText:'对单个敌人造成 100% 攻击伤害，恢复 1 战技点与 25 能量。有 50% 概率施加 2 回合灼烧。',skillText:'先攻击指定敌人，再向随机存活敌人弹射 4 次，每次造成 55% 攻击伤害并削韧 10。',ultText:'全体存活队友速度 +25，持续 2 次普通行动；剩余行动等待时间按新速度调整。',talentText:'一次攻击每命中一个不同敌人获得 1 层蓄能，火弱点目标额外 +1，最多 5 层；每层为全队提供 7% 攻击。自身第 2 次普通行动开始起，每次开始减少 3 层；退场后光环失效。'}
  ];
  roles.push(...createExpandedRoster());
  const elements={fire:'火',ice:'冰',wind:'风',lightning:'雷',physical:'物理',quantum:'量子'};
  const statusInfo={burn:{name:'灼烧',text:'普通行动开始结算持续伤害，不能暴击。',negative:true},shock:{name:'触电',text:'普通行动开始结算持续伤害，可被卡芙卡引爆。',negative:true},freeze:{name:'冻结',text:'跳过一次普通行动，禁止主动终结技和攻击型追击。',negative:true},immune:{name:'抗冻',text:'解除冻结后暂时免疫再次冻结。'},boost:{name:'再部署',text:'造成伤害提高 40%。'},inspiration:{name:'进行曲',text:'攻击提高 25%，暴击伤害提高 30 个百分点。'},assurance:{name:'祈福',text:'攻击提高 25%。'},haste:{name:'星空祝言',text:'速度提高 25。'},sword:{name:'智剑连心',text:'暴击率提高 20%、暴击伤害提高 30%；攻击可追击，实际掉血时失效。'},focus:{name:'快雨',text:'暴击率提高 60%；有智剑连心时额外提高暴击伤害。'}};
  Object.assign(statusInfo,{
    ward:{name:'冰盾守护',text:'带护盾受击时可触发三月七的有限反击。'},
    slow:{name:'减速',text:'速度降低 20，丹恒终结技对其增伤。',negative:true},
    pierce:{name:'贯穿',text:'丹恒下一次攻击伤害提高 25%，结算后消耗。'},
    acceleration:{name:'归刃加速',text:'速度提高 20。'},
    resurge:{name:'增幅',text:'造成伤害提高 30%；再现行动不能继续触发再现。'},
    regen:{name:'持续治疗',text:'行动开始恢复生命，低血量受娜塔莎天赋加成。'},
    svarog:{name:'反击标记',text:'克拉拉战技对此目标造成额外伤害。',negative:true},
    claraGuard:{name:'史瓦罗守护',text:'克拉拉减伤提高至 30%，队友受击可触发强化反击。'},
    bug:{name:'缺陷',text:'攻击降低 15%。',negative:true},
    implant:{name:'弱点植入',text:'暂时获得一个队伍属性弱点，结束后恢复原弱点。',negative:true},
    exposed:{name:'易伤',text:'受到的伤害提高 20%。',negative:true},
    overture:{name:'弦外音',text:'伤害提高 20%，匹配弱点时削韧提高 50%。'},
    bloom:{name:'残梅领域',text:'伤害提高 15%，每次领域对每个敌人仅追加一次击破伤害与延后。'},
    journey:{name:'行旅',text:'速度提高 8。'},
    combustion:{name:'完全燃烧',text:'流萤速度提高 35、伤害提高 20%，战技转为强化形态。'},
  });
  const presets={balanced:['nova','aegis','lumen'],followup:['volt','aegis','tempo'],dot:['nova','hex','lumen'],break:['frost','reaper','tempo']};
  Object.assign(presets,{vanguard:['dan','march','natasha'],counter:['clara','march','natasha'],quantum:['seele','silver','natasha'],combust:['firefly','ruan','lumen']});
  const living=(s,side)=>s.units.filter(u=>u.hp>0&&(side===undefined||u.side===side));
  const has=(u,kind)=>u?.statuses?.find(x=>x.kind===kind);
  const speed=u=>u.isSummon?60+(u.hits-3)*10:Math.max(1,Math.round(u.speed+(has(u,'haste')?.value||0)+(has(u,'acceleration')?20:0)+(has(u,'combustion')?35:0)+(has(u,'journey')?8:0)-(has(u,'slow')?20:0)));
  const interval=u=>10000/speed(u);
  const sort=(s,a,b)=>a.next-b.next||((a.side===s.firstSide?-1:1)-(b.side===s.firstSide?-1:1))||a.id.localeCompare(b.id);
  const activeSummons=s=>(s.summons||[]).filter(x=>s.units.some(u=>u.id===x.owner&&u.hp>0));
  const order=s=>[...living(s),...activeSummons(s)].sort((a,b)=>sort(s,a,b));
  const current=s=>s.units.find(u=>u.id===s.actor);
  const context=()=>({followed:new Set(),reacted:new Set()});
  function random(s){let x=s.rng>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng=x>>>0;return s.rng/4294967296;}
  function validateTeam(team){if(!Array.isArray(team)||team.length!==3||new Set(team).size!==3||team.some(k=>!roles.some(r=>r.key===k)))throw new Error('请选择三名不同的有效角色');return [...team];}
  function log(s,text,type='normal'){s.logs.push({text,type,n:s.seq});s.logs=s.logs.slice(-70);}
  function effect(s,u,text,kind){s.effects.push({id:u.id,text,kind});}
  function neighbours(s,target){const row=s.units.filter(u=>u.side===target.side),index=row.findIndex(u=>u.id===target.id);return row.filter((u,i)=>u.hp>0&&Math.abs(i-index)===1);}
  function status(s,u,kind,turns,source,value=0){if(u.hp<=0||kind==='freeze'&&(has(u,'immune')||has(u,'freeze')))return false;const oldSpeed=speed(u),old=has(u,kind),item={kind,turns,source:source?.id??source,value,appliedSeq:s.seq};if(old)Object.assign(old,item);else u.statuses.push(item);if(oldSpeed!==speed(u)&&u.id!==s.actor)u.next=s.time+Math.max(0,u.next-s.time)*oldSpeed/speed(u);effect(s,u,statusInfo[kind].name,statusInfo[kind].negative?'debuff':'buff');return true;}
  function clean(s,u){const index=u.statuses.findIndex(x=>x.kind==='freeze'),i=index>=0?index:u.statuses.findIndex(x=>statusInfo[x.kind]?.negative);if(i<0)return false;const item=u.statuses.splice(i,1)[0];if(item.kind==='freeze')status(s,u,'immune',2,u);if(item.kind==='implant')refreshWeak(u);effect(s,u,'净化 '+statusInfo[item.kind].name,'heal');log(s,`${u.name} 的${statusInfo[item.kind].name}已净化。`,'heal');return true;}
  function heal(s,u,n){if(u.hp<=0)return;const amount=Math.max(0,Math.min(u.maxHp-u.hp,Math.round(n)));u.hp+=amount;if(amount)effect(s,u,'+'+amount,'heal');}
  function shield(s,u,n,turns=2){if(u.hp<=0)return;const before=u.shield;u.shield=Math.min(650,Math.max(u.shield,n));u.shieldTurns=Math.max(u.shieldTurns||0,turns);u.shieldSeq=s.seq;effect(s,u,'护盾 '+u.shield,'shield');if(u.shield>before)log(s,`${u.name} 获得护盾，当前 ${u.shield} 点。`,'shield');}
  function attackPower(s,u){const asta=living(s,u.side).find(x=>x.key==='reaper'),bonus=(has(u,'inspiration')?.value||0)+(has(u,'assurance')?.value||0)+(asta?.charges||0)*.07;return u.atk*(1+bonus)*(has(u,'bug')?.85:1);}
  function refreshWeak(u){u.weak=[...new Set([...(u.baseWeak||roles.find(r=>r.key===u.key).weak),...(has(u,'implant')?[has(u,'implant').value]:[])])];}
  function implant(s,u,element,turns,actor){status(s,u,'implant',turns,actor,element);refreshWeak(u);}
  function natashaHeal(s,u,n){heal(s,u,n*(u.hp<u.maxHp*.3?1.3:1));}
  function reactions(s,victim,attacker,ctx){
    if(attacker.hp<=0||attacker.side===victim.side)return;
    const march=living(s,victim.side).find(u=>u.key==='march'&&u.counterCharges>0&&!has(u,'freeze'));
    if(march&&victim.hp>0&&victim.shield>0&&has(victim,'ward')&&!ctx.reacted.has(march.id)){
      ctx.reacted.add(march.id);march.counterCharges--;log(s,'三月七为受保护的队友反击！','followup');s.presentations.push({actor:march.id,name:'少女的特权',kind:'followup'});hit(s,attacker,1,march,15,ctx);
    }
    const clara=living(s,victim.side).find(u=>u.key==='clara'&&!has(u,'freeze')&&(u.id===victim.id||has(u,'claraGuard')&&u.enhancedCounters>0));
    if(clara&&attacker.hp>0&&!ctx.reacted.has(clara.id)){
      ctx.reacted.add(clara.id);const enhanced=has(clara,'claraGuard')&&clara.enhancedCounters>0;if(enhanced)clara.enhancedCounters--;
      status(s,attacker,'svarog',3,clara);log(s,'史瓦罗发动'+(enhanced?'强化':'')+'反击！','followup');s.presentations.push({actor:clara.id,name:enhanced?'强化反击':'因为我们是家人',kind:'followup'});
      const adjacent=enhanced?neighbours(s,attacker):[];hit(s,attacker,enhanced?1.5:.9,clara,15,ctx);for(const u of adjacent)hit(s,u,.55,clara,5,ctx);
    }
  }
  function critStats(u){return{rate:Math.min(1,.05+(has(u,'sword') ? .2 : 0)+(has(u,'focus') ? .6 : 0)),damage:.5+(has(u,'sword') ? .3 : 0)+(has(u,'inspiration') ? .3 : 0)+(has(u,'focus')?.value||0)};}
  function finish(s){const a=living(s,0).length,b=living(s,1).length;if(!a||!b){s.phase='ended';s.winner=a?0:b?1:-1;s.actor=null;log(s,'对局结束。','system');}}
  function revive(s,u){if(u.hp>0||u.key!=='aegis'||u.revived)return;u.revived=true;u.hp=Math.ceil(u.maxHp*.35);u.shield=0;u.shieldTurns=0;u.energy=100;u.statuses=u.statuses.filter(x=>!statusInfo[x.kind]?.negative);effect(s,u,'不屈之躯','heal');log(s,'杰帕德触发不屈之躯，恢复生命并充满能量；本场不可再次触发。','revive');}
  function hit(s,u,multiplier,source,power,ctx,dot=false){
    if(u.hp<=0||!dot&&source.hp<=0)return;let amount=dot?multiplier:attackPower(s,source)*multiplier*(1+(has(source,'boost')?.value||0)+(has(source,'resurge')?.3:0)+(has(source,'pierce')?.25:0)+(has(source,'overture')?.2:0)+(has(source,'bloom')?.15:0)+(has(source,'combustion')?.2:0));let critical=false;amount*=1+(has(u,'exposed')?.2:0);if(u.key==='clara')amount*=has(u,'claraGuard')?.7:.9;
    if(!dot){const crit=critStats(source);critical=random(s)<crit.rate;if(critical)amount*=1+crit.damage;if(u.toughness===0)amount*=1.1;}
    amount=Math.max(1,Math.round(amount*(1+Math.max(0,Math.floor((s.seq-50)/12))*.16)));const absorbed=Math.min(u.shield,amount),lost=Math.min(u.hp,amount-absorbed);u.shield-=absorbed;u.hp-=lost;
    if(lost>0&&has(u,'sword')){u.statuses=u.statuses.filter(x=>x.kind!=='sword');log(s,'彦卿实际受到伤害，智剑连心解除。','control');}
    if(!dot)u.energy=Math.min(100,u.energy+8);effect(s,u,(dot?'持续 ':critical?'暴击 ':'')+(lost?'−'+lost:'护盾 −'+absorbed),dot?'dot':critical?'critical':'damage');
    if(!dot&&u.hp>0&&u.toughness>0&&u.weak.includes(source.element)){
      u.toughness=Math.max(0,u.toughness-Math.round(power*(has(source,'overture')?1.5:1)));if(!u.toughness){u.next+=35;const breakShield=Math.min(u.shield,65);u.shield-=breakShield;const damage=Math.min(u.hp,65-breakShield);u.hp-=damage;if(damage>0&&has(u,'sword')){u.statuses=u.statuses.filter(x=>x.kind!=='sword');log(s,'彦卿受到击破伤害，智剑连心解除。','control');}effect(s,u,'弱点击破','break');log(s,`${u.name} 被击破，受到 65 点击破伤害（生命 −${damage}，护盾 −${breakShield}）并延后行动。`,'break');for(const h of living(s,source.side).filter(x=>x.key==='nova')){h.charge=Math.min(3,h.charge+1);effect(s,h,'充能 '+h.charge+'/3','buff');}if(has(source,'bloom')&&u.lastBloom!==source.side+':'+has(source,'bloom').appliedSeq){u.lastBloom=source.side+':'+has(source,'bloom').appliedSeq;u.next+=20;hit(s,u,80,source,0,ctx,true);log(s,'残梅追加击破伤害，并延后目标行动。','break');}if(source.element==='ice')status(s,u,'freeze',1,source);else if(source.element==='fire')status(s,u,'burn',2,source,Math.round(attackPower(s,source)*.4));else if(source.element==='lightning')status(s,u,'shock',2,source,Math.round(attackPower(s,source)*.5));}
    }
    revive(s,u);
    if(!dot&&source.key==='nova'&&u.hp>0&&random(s)<.5)status(s,u,'burn',2,source,Math.round(attackPower(s,source)*.4));
    if(!dot)reactions(s,u,source,ctx);return critical;
  }
  function himekoFollowups(s,ctx){for(const h of living(s).filter(u=>u.key==='nova'&&u.charge>=3&&!has(u,'freeze'))){if(ctx.followed.has(h.id)||!living(s,1-h.side).length)continue;ctx.followed.add(h.id);h.charge=0;log(s,'姬子充能已满，发动乘胜追击！','followup');s.presentations.push({actor:h.id,name:'乘胜追击',kind:'followup'});for(const t of living(s,1-h.side))hit(s,t,1,h,15,ctx);}}
  function attackExtras(s,actor,target,kind,ctx){
    if(actor.key==='frost'&&has(actor,'sword')&&target?.hp>0&&!ctx.followed.has(actor.id)&&random(s)<.6){ctx.followed.add(actor.id);log(s,'彦卿触发呼剑如影追加攻击！','followup');hit(s,target,.75,actor,15,ctx);if(target.hp>0&&random(s)<.65)status(s,target,'freeze',1,actor);}
    if(kind==='basic'&&target?.hp>0){const kafka=living(s,actor.side).find(u=>u.key==='hex'&&u.id!==actor.id&&u.followupReady&&!has(u,'freeze'));if(kafka){kafka.followupReady=false;log(s,'队友普攻触发卡芙卡的协同追击！','followup');hit(s,target,1,kafka,15,ctx);status(s,target,'shock',2,kafka,Math.round(attackPower(s,kafka)*.75));}}
    himekoFollowups(s,ctx);
  }
  function talisman(s,actor){const healer=living(s,actor.side).find(u=>u.key==='lumen'&&u.talismanTurns>0);if(!healer)return;const targets=[actor,...living(s,actor.side).filter(u=>u.id!==actor.id&&u.hp<=u.maxHp*.5)];for(const u of targets){heal(s,u,55);if(healer.cleanseCharges>0&&clean(s,u))healer.cleanseCharges--;}}
  function detonate(s,target,fraction,ctx,shockOnly=false){for(const x of [...target.statuses].filter(x=>x.kind==='shock'||!shockOnly&&x.kind==='burn')){if(target.hp<=0)break;const owner=s.units.find(u=>u.id===x.source)||target;hit(s,target,x.value*fraction,owner,0,ctx,true);log(s,`${target.name} 的${statusInfo[x.kind].name}被提前结算，不消耗回合。`,'dot');}}
  function addLordHits(s,actor,n){const lord=s.summons.find(x=>x.owner===actor.id);if(!lord)return;const before=speed(lord);lord.hits=Math.min(10,lord.hits+n);lord.next=s.time+Math.max(0,lord.next-s.time)*before/speed(lord);effect(s,actor,'神君 '+lord.hits+' 段','buff');}
  function fireLord(s,lord){const owner=s.units.find(u=>u.id===lord.owner);if(!owner||owner.hp<=0)return;if(has(owner,'freeze')){lord.next=Math.max(s.time+1,owner.next+.01);log(s,'景元被控制，神君等待其解除控制。','control');return;}const ctx=context(),hits=lord.hits;log(s,`神君行动，发动 ${hits} 段弹射追击！`,'summon');s.presentations.push({actor:owner.id,name:'神君 · '+hits+' 段追击',kind:'summon'});for(let i=0;i<hits;i++){const enemies=living(s,1-lord.side);if(!enemies.length)break;const t=enemies[Math.floor(random(s)*enemies.length)],adjacent=neighbours(s,t);hit(s,t,.4,owner,10,ctx);for(const u of adjacent)hit(s,u,.1,owner,3,ctx);}lord.hits=3;lord.next=s.time+interval(lord);himekoFollowups(s,ctx);finish(s);}
  function consumeTurn(s,u){u.statuses=u.statuses.filter(x=>{if(x.appliedSeq!==s.seq)x.turns--;return x.turns>0;});refreshWeak(u);if(u.shieldTurns>0&&u.shieldSeq!==s.seq&&!--u.shieldTurns){u.shield=0;effect(s,u,'护盾到期','debuff');}if(u.key==='lumen'&&u.talismanTurns>0&&u.talismanSeq!==s.seq)u.talismanTurns--;u.next=s.time+interval(u)*(1-(u.advanceNext||0));u.advanceNext=0;u.prepared=false;u.turns++;if(u.toughness===0&&u.hp>0){u.toughness=u.maxToughness;effect(s,u,'韧性恢复','shield');}}
  function chooseActor(s,now){
    for(let i=0;i<60&&s.phase==='battle';i++){
      finish(s);if(s.phase!=='battle')return;const u=order(s)[0];s.time=Math.max(s.time,u.next);
      if(u.isSummon){fireLord(s,u);continue;}s.actor=u.id;
      if(!u.prepared){u.prepared=true;if(u.key==='march')u.counterCharges=2;if(u.key==='seele'){u.isResurgenceTurn=!!u.pendingResurgence;u.pendingResurgence=false;}if(has(u,'regen'))natashaHeal(s,u,has(u,'regen').value);if(u.key==='hex')u.followupReady=true;if(u.key==='reaper'&&u.turns>=1)u.charges=Math.max(0,u.charges-3);for(const x of [...u.statuses])if(x.kind==='burn'||x.kind==='shock'){const owner=s.units.find(a=>a.id===x.source)||u;hit(s,u,x.value,owner,0,context(),true);log(s,`${u.name} 结算${statusInfo[x.kind].name}。`,'dot');if(u.hp<=0)break;}if(u.hp>0)talisman(s,u);}
      finish(s);if(s.phase!=='battle')return;if(u.hp<=0)continue;
      if(has(u,'freeze')){u.statuses=u.statuses.filter(x=>x.kind!=='freeze');status(s,u,'immune',2,u);log(s,`${u.name} 因冻结跳过行动，获得短暂抗冻。`,'control');consumeTurn(s,u);continue;}
      s.deadline=now+45000;return;
    }
    if(s.phase==='battle')throw new Error('自动行动数量异常，请重新开始对局');
  }
  function make(mode='practice',now=Date.now(),teams=[presets.balanced,presets.followup],options={}){
    const chosen=teams.map(validateTeam),seed=options.seed??7919,firstSide=options.firstSide??(seed%2);
    const s={rulesVersion,mode,phase:'battle',teams:chosen,units:[],summons:[],rng:(seed>>>0)||0x9e3779b9,sp:[3,3],seq:0,actor:null,time:0,firstSide,winner:null,logs:[],ready:[false,false],connected:[true,mode!=='online'],deadline:now+45000,effects:[],presentations:[],last:null};
    for(let side=0;side<2;side++)for(const key of chosen[side]){const r=roles.find(x=>x.key===key),id=side+'-'+key;s.units.push({...structuredClone(r),id,side,hp:r.hp,maxHp:r.hp,toughness:key==='aegis'?80:60,maxToughness:key==='aegis'?80:60,shield:0,shieldTurns:0,shieldSeq:-1,energy:45,next:10000/r.speed,statuses:[],baseWeak:[...r.weak],counterCharges:2,enhancedCounters:0,pendingResurgence:false,isResurgenceTurn:false,turns:0,prepared:false,advanceNext:0,charge:key==='nova'?1:0,charges:0,revived:false,talismanTurns:0,talismanSeq:-1,cleanseCharges:0,followupReady:true});if(key==='volt')s.summons.push({id:side+'-lord',owner:id,side,key:'volt',name:'神君',title:'独立追击',isSummon:true,hits:3,next:10000/60,color:'#e6cb91'});}
    for(const side of [0,1])if(living(s,side).some(u=>u.key==='ruan'))for(const u of living(s,side))status(s,u,'journey',999,u);
    log(s,'同人战术演练已就绪：角色机制为三人对战改编，数值以游戏内说明为准。','system');chooseActor(s,now);if(mode==='online')s.phase='waiting';return s;
  }
  function resolveTarget(s,actor,action){const kind=action.kind==='skill'?actor.skillTarget:action.kind==='ultimate'?(actor.ultTarget||(actor.key==='frost'?'enemy':'none')):'enemy';if(kind==='none'||action.kind==='defend')return null;const u=s.units.find(x=>x.id===action.target);if(!u||u.hp<=0||((kind==='ally')!==(u.side===actor.side)))throw new Error(kind==='ally'?'请选择一名存活的己方角色':'请选择一名存活的敌方角色');return u;}
  function act(source,side,action,now=Date.now()){
    if(!source||source.rulesVersion!==rulesVersion)throw new Error('对局版本已更新，请重新开局');const s=structuredClone(source);if(s.phase!=='battle')throw new Error('当前不在战斗中');if(side!==0&&side!==1)throw new Error('无效的玩家');if(!action||!['basic','skill','ultimate','defend'].includes(action.kind))throw new Error('无效的行动');
    const ultimate=action.kind==='ultimate',turn=current(s),actor=ultimate?s.units.find(u=>u.id===action.actor):turn;if(!actor||actor.hp<=0||actor.side!==side)throw new Error(ultimate?'该角色无法施放终结技':'还未轮到你行动');if(has(actor,'freeze'))throw new Error('冻结期间无法主动施放技能');if(ultimate&&actor.energy<100)throw new Error('能量尚未充满');if(action.kind==='skill'&&s.sp[side]<1)throw new Error('战技点不足，普攻或防御可以恢复');
    const target=resolveTarget(s,actor,action);s.seq++;s.effects=[];s.presentations=[];s.last={side,actor:actor.id,kind:action.kind,target:target?.id??null,seq:s.seq};const allies=living(s,side),enemies=living(s,1-side),ctx=context(),enemyCount=enemies.length;if(action.kind==='skill'&&target?.side===side&&target.key==='dan'&&actor.id!==target.id)status(s,target,'pierce',1,actor);
    if(ultimate){actor.energy=0;talisman(s,actor);log(s,`${actor.name} 终结技「${actor.ult}」！`,'ultimate');
      if(actor.key==='nova'){const before=enemies.filter(u=>u.hp>0).length;for(const u of enemies)hit(s,u,2,actor,30,ctx);actor.energy=Math.min(100,(before-living(s,1-side).length)*10);}
      else if(actor.key==='aegis')allies.forEach(u=>shield(s,u,360,3));
      else if(actor.key==='lumen')allies.forEach(u=>{if(u.id!==actor.id)u.energy=Math.min(100,u.energy+20);status(s,u,'assurance',2,actor,.25);});
      else if(actor.key==='volt'){enemies.forEach(u=>hit(s,u,1.5,actor,30,ctx));addLordHits(s,actor,3);}
      else if(actor.key==='tempo')allies.forEach(u=>status(s,u,'inspiration',2,actor,.25));
      else if(actor.key==='hex')enemies.forEach(u=>{hit(s,u,1.3,actor,25,ctx);status(s,u,'shock',2,actor,Math.round(attackPower(s,actor)*.75));detonate(s,u,1,ctx,true);});
      else if(actor.key==='frost'){status(s,actor,'focus',1,actor,has(actor,'sword') ? .5 : 0);hit(s,target,2.8,actor,45,ctx);}
      else if(actor.key==='march')enemies.forEach(u=>{hit(s,u,1.2,actor,25,ctx);if(u.hp>0&&random(s)<.55)status(s,u,'freeze',1,actor);});
      else if(actor.key==='dan')hit(s,target,has(target,'slow')?3.5:2.8,actor,45,ctx);
      else if(actor.key==='seele'){status(s,actor,'resurge',1,actor);hit(s,target,2.9,actor,45,ctx);}
      else if(actor.key==='natasha')allies.forEach(u=>natashaHeal(s,u,270));
      else if(actor.key==='clara'){status(s,actor,'claraGuard',2,actor);actor.enhancedCounters=2;}
      else if(actor.key==='silver'){status(s,target,'exposed',2,actor);hit(s,target,2.5,actor,40,ctx);}
      else if(actor.key==='ruan')allies.forEach(u=>status(s,u,'bloom',2,actor));
      else if(actor.key==='firefly')status(s,actor,'combustion',3,actor);
      else allies.forEach(u=>status(s,u,'haste',2,actor,25));
      attackExtras(s,actor,target,'ultimate',ctx);
    }else if(action.kind==='basic'){
      const wasBroken=target.toughness===0;hit(s,target,1,actor,20,ctx);if(actor.key==='firefly'&&has(actor,'combustion')&&wasBroken&&target.hp>0){hit(s,target,80,actor,0,ctx,true);log(s,'流萤追加超击破伤害。','break');}s.sp[side]=Math.min(5,s.sp[side]+1);actor.energy=Math.min(100,actor.energy+25);if(actor.key==='tempo')actor.advanceNext=.3;if(actor.key==='silver'&&target.hp>0&&random(s)<.6)status(s,target,'bug',2,actor);if(actor.key==='reaper'){actor.charges=Math.min(5,actor.charges+1+(target.weak.includes('fire')?1:0));if(target.hp>0&&random(s)<.5)status(s,target,'burn',2,actor,Math.round(attackPower(s,actor)*.4));}log(s,`${actor.name} 普攻 → ${target.name}，战技点 +1。`);attackExtras(s,actor,target,'basic',ctx);
    }else if(action.kind==='defend'){shield(s,actor,120,2);s.sp[side]=Math.min(5,s.sp[side]+1);actor.energy=Math.min(100,actor.energy+15);log(s,`${actor.name} 防御，战技点 +1。`);
    }else{
      s.sp[side]--;actor.energy=Math.min(100,actor.energy+30);log(s,`${actor.name} 施放「${actor.skill}」 → ${target.name}。`,'skill');
      if(actor.key==='nova'){const adjacent=neighbours(s,target);hit(s,target,1.7,actor,35,ctx);adjacent.forEach(u=>hit(s,u,.65,actor,15,ctx));}
      else if(actor.key==='aegis'){hit(s,target,1.5,actor,30,ctx);if(target.hp>0&&random(s)<.65)status(s,target,'freeze',1,actor);}
      else if(actor.key==='lumen'){heal(s,target,320);clean(s,target);neighbours(s,target).forEach(u=>heal(s,u,160));actor.talismanTurns=2;actor.talismanSeq=s.seq;actor.cleanseCharges=6;effect(s,actor,'禳命 · 2 回合','buff');}
      else if(actor.key==='volt'){enemies.forEach(u=>hit(s,u,.85,actor,20,ctx));addLordHits(s,actor,2);}
      else if(actor.key==='tempo'){clean(s,target);status(s,target,'boost',1,actor,.4);if(target.id!==actor.id){target.next=s.time;effect(s,target,'立即行动','buff');}}
      else if(actor.key==='hex'){const adjacent=neighbours(s,target);hit(s,target,1.5,actor,25,ctx);adjacent.forEach(u=>hit(s,u,.55,actor,10,ctx));detonate(s,target,.75,ctx);}
      else if(actor.key==='frost'){hit(s,target,1.65,actor,35,ctx);status(s,actor,'sword',1,actor);}
      else if(actor.key==='march'){shield(s,target,380,3);clean(s,target);status(s,target,'ward',3,actor);}
      else if(actor.key==='dan'){const critical=hit(s,target,1.8,actor,35,ctx);if(critical&&target.hp>0)status(s,target,'slow',2,actor);}
      else if(actor.key==='seele'){hit(s,target,1.9,actor,35,ctx);status(s,actor,'acceleration',2,actor);}
      else if(actor.key==='natasha'){natashaHeal(s,target,340);clean(s,target);status(s,target,'regen',2,actor,100);}
      else if(actor.key==='clara'){for(const u of enemies){const marked=!!has(u,'svarog');hit(s,u,.9,actor,20,ctx);if(marked)hit(s,u,.9,actor,0,ctx);u.statuses=u.statuses.filter(x=>x.kind!=='svarog');}}
      else if(actor.key==='silver'){const teamElements=[...new Set(allies.map(u=>u.element))],missing=teamElements.filter(e=>!(target.baseWeak||[]).includes(e)),pool=missing.length?missing:teamElements;implant(s,target,pool[Math.floor(random(s)*pool.length)],3,actor);status(s,target,'bug',2,actor);hit(s,target,1.5,actor,30,ctx);}
      else if(actor.key==='ruan')allies.forEach(u=>status(s,u,'overture',3,actor));
      else if(actor.key==='firefly'){
        const enhanced=!!has(actor,'combustion'),adjacent=neighbours(s,target),broken=target.toughness===0;
        if(enhanced){heal(s,actor,actor.maxHp*.25);implant(s,target,'fire',2,actor);}else{actor.hp=Math.max(1,actor.hp-Math.floor(actor.maxHp*.2));actor.energy=Math.min(100,actor.energy+15);effect(s,actor,'生命转能','buff');}
        hit(s,target,enhanced?2.2:2,actor,enhanced?60:35,ctx);for(const u of adjacent)hit(s,u,enhanced?.9:.6,actor,enhanced?25:15,ctx);
        if(enhanced&&broken&&target.hp>0){hit(s,target,80,actor,0,ctx,true);log(s,'流萤对已击破目标造成超击破伤害！','break');}
      }
      else{const touched=new Set();let t=target;for(let i=0;i<5;i++){if(!t||t.hp<=0){const candidates=living(s,1-side);if(!candidates.length)break;t=candidates[Math.floor(random(s)*candidates.length)];}touched.add(t.id);hit(s,t,.55,actor,10,ctx);const candidates=living(s,1-side);t=candidates.length?candidates[Math.floor(random(s)*candidates.length)]:null;}for(const id of touched){const u=s.units.find(x=>x.id===id);actor.charges=Math.min(5,actor.charges+1+(u.weak.includes('fire')?1:0));}effect(s,actor,'蓄能 '+actor.charges+'/5','buff');}
      attackExtras(s,actor,target,'skill',ctx);
    }
    if(actor.key==='dan'&&action.kind!=='defend')actor.statuses=actor.statuses.filter(x=>x.kind!=='pierce');
    if(actor.key==='seele'&&actor.hp>0&&living(s,1-side).length<enemyCount&&!actor.isResurgenceTurn&&!actor.pendingResurgence){actor.advanceNext=1;actor.pendingResurgence=true;actor.next=s.time;status(s,actor,'resurge',1,actor);log(s,'希儿触发再现，获得一次立即行动！','followup');}
    if(!ultimate)consumeTurn(s,actor);finish(s);if(s.phase==='battle'&&(!ultimate||!turn||turn.hp<=0||has(turn,'freeze')))chooseActor(s,now);return s;
  }
  function ai(s,side=1){
    if(s.phase!=='battle')return null;const allies=living(s,side),enemies=living(s,1-side);if(!allies.length||!enemies.length)return null;const weak=[...allies].sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0],usable=allies.filter(u=>u.energy>=100&&!has(u,'freeze'));
    const ult=usable.find(u=>u.key==='aegis'&&allies.some(a=>a.shield<180))||usable.find(u=>u.key==='lumen'&&allies.some(a=>a.id!==u.id&&a.energy<80))||usable.find(u=>u.key==='tempo'&&!allies.every(a=>has(a,'inspiration')))||usable.find(u=>u.key==='reaper'&&!allies.every(a=>has(a,'haste')))||usable.find(u=>['nova','volt','hex'].includes(u.key)||u.key==='frost'&&(has(u,'sword')||s.sp[side]===0));const extraUlt=usable.find(u=>u.key==='natasha'&&(weak.hp<weak.maxHp*.45||allies.filter(a=>a.hp<a.maxHp*.75).length>=2))||usable.find(u=>u.key==='clara'&&!has(u,'claraGuard'))||usable.find(u=>u.key==='ruan'&&!allies.every(a=>has(a,'bloom')))||usable.find(u=>u.key==='firefly'&&!has(u,'combustion'))||usable.find(u=>['march','dan','seele','silver'].includes(u.key));const chosenUlt=extraUlt||ult;if(chosenUlt)return{kind:'ultimate',actor:chosenUlt.id,target:[...enemies].sort((a,b)=>a.hp-b.hp)[0].id};
    const actor=current(s);if(!actor||actor.side!==side)return null;const enemy=[...enemies].sort((a,b)=>{const score=u=>u.hp-(u.weak.includes(actor.element)?150:0)-(actor.key==='hex'&&(has(u,'burn')||has(u,'shock'))?250:0);return score(a)-score(b);})[0];let kind='basic',target=enemy;
    if(s.sp[side]>0){if(actor.key==='lumen'&&(!actor.talismanTurns||weak.hp<weak.maxHp*.72||allies.some(a=>has(a,'freeze')))){kind='skill';target=allies.find(a=>has(a,'freeze'))||weak;}else if(actor.key==='tempo'&&s.sp[side]>=2){const carry=allies.filter(a=>['nova','volt','hex','frost'].includes(a.key)).sort((a,b)=>b.atk-a.atk)[0];if(carry&&!has(carry,'boost')){kind='skill';target=carry;}}else if(actor.key==='aegis'&&s.sp[side]>=2&&!has(enemy,'freeze'))kind='skill';else if(actor.key==='reaper'&&(s.sp[side]>=2||actor.charges<2))kind='skill';else if(['nova','volt','hex','frost'].includes(actor.key)&&(s.sp[side]>1||!allies.some(a=>a.key==='lumen')||weak.hp>weak.maxHp*.45))kind='skill';}
    if(s.sp[side]>0){
      if(actor.key==='march'){const ward=allies.find(a=>a.key==='clara')||weak;if(ward.shield<160||!has(ward,'ward')){kind='skill';target=ward;}}
      else if(actor.key==='natasha'&&(weak.hp<weak.maxHp*.75||allies.some(a=>has(a,'freeze')))){kind='skill';target=allies.find(a=>has(a,'freeze'))||weak;}
      else if(actor.key==='ruan'&&!allies.every(a=>has(a,'overture'))){kind='skill';target=actor;}
      else if(['dan','seele','clara','silver','firefly'].includes(actor.key)&&(s.sp[side]>1||!allies.some(a=>['lumen','natasha'].includes(a.key))||weak.hp>weak.maxHp*.5))kind='skill';
    }
    return{kind,target:target.id};
  }
  function mechanic(s,u){if(u.key==='march')return '反击 '+u.counterCharges+'/2';if(u.key==='dan')return has(u,'pierce')?'贯穿就绪':'减速 / 单点';if(u.key==='seele')return u.isResurgenceTurn?'再现行动':'击杀再动';if(u.key==='natasha')return '急救 / 持续治疗';if(u.key==='clara')return has(u,'claraGuard')?'强化反击 '+u.enhancedCounters+'/2':'受击反击';if(u.key==='silver')return '弱点植入 / 缺陷';if(u.key==='ruan')return '击破效率 / 残梅';if(u.key==='firefly')return has(u,'combustion')?'完全燃烧 '+has(u,'combustion').turns:'生命转能';if(u.key==='nova')return '充能 '+u.charge+'/3';if(u.key==='aegis')return u.revived?'复起已用':'不屈可用';if(u.key==='lumen')return u.talismanTurns?'禳命 '+u.talismanTurns+' · 净化 '+u.cleanseCharges:'禳命未启';if(u.key==='volt')return '神君 '+(s.summons.find(x=>x.owner===u.id)?.hits||0)+'/10';if(u.key==='tempo')return '拉条 / 净化';if(u.key==='hex')return u.followupReady?'追击就绪':'追击已用';if(u.key==='frost')return has(u,'sword')?'智剑连心':'智剑未启';return '蓄能 '+u.charges+'/5';}
  return{rulesVersion,roles,elements,statusInfo,presets,validateTeam,living,current,order,speed,has,make,act,ai,mechanic,critStats,attackPower};
}
