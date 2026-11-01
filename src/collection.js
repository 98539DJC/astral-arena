export function createCollection(){
  const starter=['nova','aegis','lumen'],five=['tempo','volt','nova','aegis','lumen','hex','frost','seele','clara','silver','ruan','firefly'],four=['reaper','march','dan','natasha'],featured='tempo',cost=160;
  const missions=[{key:'first',name:'初次回应',text:'累计跃迁 1 次',stars:160,check:p=>p.totalDraws>=1},{key:'ten',name:'十道星轨',text:'累计跃迁 10 次',stars:320,check:p=>p.totalDraws>=10},{key:'five',name:'伙伴集结',text:'拥有 5 名不同角色',stars:480,check:p=>Object.keys(p.owned).length>=5},{key:'battle',name:'初次交锋',text:'完成 1 场有效对局',stars:320,check:p=>p.matches>=1},{key:'victory',name:'首胜星光',text:'取得 1 次对局胜利',stars:640,check:p=>p.wins>=1}];
  const rarity=key=>five.includes(key)?5:4;
  const day=now=>new Date(now+8*3600000).toISOString().slice(0,10);
  function make(){return{schemaVersion:1,stars:3200,stardust:0,owned:Object.fromEntries(starter.map(k=>[k,1])),pity5:0,pity4:0,guaranteed:false,totalDraws:0,history:[],claimedMissions:[],lastDaily:null,wins:0,matches:0,claimedMatches:[],pendingPractice:null,storyCleared:[],tutorialDone:false};}
  function validate(p){const integer=(n,max=1e9)=>Number.isSafeInteger(n)&&n>=0&&n<=max;const keys=[...five,...four];if(!p||p.schemaVersion!==1||!integer(p.stars)||!integer(p.stardust)||!integer(p.pity5,49)||!integer(p.pity4,9)||!integer(p.totalDraws)||!integer(p.wins)||!integer(p.matches)||typeof p.guaranteed!=='boolean'||!p.owned||Array.isArray(p.owned)||!starter.every(k=>p.owned[k])||Object.entries(p.owned).some(([k,n])=>!keys.includes(k)||!integer(n)||n<1)||!Array.isArray(p.history)||p.history.length>100||p.history.some(r=>!r||!integer(r.n)||!Number.isFinite(r.at)||![3,4,5].includes(r.rarity)||(r.rarity===3?r.key!==null:!keys.includes(r.key)))||!Array.isArray(p.claimedMissions)||p.claimedMissions.some(k=>!missions.some(m=>m.key===k))||!Array.isArray(p.claimedMatches)||p.claimedMatches.some(k=>typeof k!=='string'))throw new Error('收藏存档格式不正确');const ids=['signal','platform','clinic','gate','hack','garden','firefly','dawn'];if(p.storyCleared!==undefined&&(!Array.isArray(p.storyCleared)||p.storyCleared.some((id,i)=>id!==ids[i])))throw new Error('剧情存档格式不正确');if(p.tutorialDone!==undefined&&typeof p.tutorialDone!=='boolean')throw new Error('引导存档格式不正确');const restored=structuredClone(p);restored.storyCleared??=[];restored.tutorialDone??=false;return restored;}
  function probability(p){const p5=p.pity5>=49?1:p.pity5>=40?Math.min(1,.06+(p.pity5-39)*.08):.06;const p4=p.pity4>=9?1-p5:Math.min(.24,1-p5);return{five:p5,four:p4,three:Math.max(0,1-p5-p4)};}
  function random(rng){const n=rng();if(!Number.isFinite(n)||n<0||n>=1)throw new Error('随机数无效');return n;}
  function pick(keys,rng){return keys[Math.floor(random(rng)*keys.length)];}
  function draw(source,count,rng=Math.random,now=Date.now()){
    if(count!==1&&count!==10)throw new Error('仅支持单次或十次跃迁');
    if(source.stars<count*cost)throw new Error('星石不足，可领取补给、完成任务或进行对战');
    const p=structuredClone(source),results=[];p.stars-=count*cost;
    for(let i=0;i<count;i++){
      const rates=probability(p),r=random(rng);let grade=r<rates.five?5:r<rates.five+rates.four?4:3,key=null,featuredHit=false;
      if(grade===5){featuredHit=p.guaranteed||random(rng)<.5;key=featuredHit?featured:pick(five.filter(k=>k!==featured),rng);p.guaranteed=!featuredHit;p.pity5=0;p.pity4=0;}
      else{p.pity5++;if(grade===4){key=pick(four,rng);p.pity4=0;}else p.pity4++;}
      const duplicate=key?!!p.owned[key]:false,dust=key?(duplicate?(grade===5?30:8):0):2;
      if(key)p.owned[key]=(p.owned[key]||0)+1;p.stardust+=dust;p.totalDraws++;
      const result={n:p.totalDraws,key,rarity:grade,isNew:!!key&&!duplicate,duplicate,stardust:dust,featured:featuredHit,at:now};
      results.push(result);p.history.unshift(result);
    }
    p.history=p.history.slice(0,100);return{profile:p,results};
  }
  function exchange(source,key){if(![...five,...four].includes(key))throw new Error('无效的兑换角色');if(source.owned[key])throw new Error('这个角色已经拥有');const price=rarity(key)===5?90:32;if(source.stardust<price)throw new Error('星尘不足');const p=structuredClone(source);p.stardust-=price;p.owned[key]=1;return p;}
  function daily(source,now=Date.now()){if(source.lastDaily===day(now))throw new Error('今日补给已领取，明天再来');const p=structuredClone(source);p.lastDaily=day(now);p.stars+=400;return p;}
  function claim(source,key){const m=missions.find(m=>m.key===key);if(!m||!m.check(source))throw new Error('任务尚未完成');if(source.claimedMissions.includes(key))throw new Error('任务奖励已领取');const p=structuredClone(source);p.claimedMissions.push(key);p.stars+=m.stars;return p;}
  function reward(source,id,won,eligible=true){if(source.claimedMatches.includes(id))return structuredClone(source);const p=structuredClone(source);p.claimedMatches.push(id);if(eligible){p.matches++;if(won)p.wins++;p.stars+=won?200:80;}return p;}
  function checkTeam(profile,team){if(!Array.isArray(team)||team.some(k=>!profile.owned[k]))throw new Error('阵容包含尚未招募的角色，请先跃迁或兑换解锁');return team;}
  return{starter,five,four,featured,cost,missions,rarity,day,make,validate,probability,draw,exchange,daily,claim,reward,checkTeam};
}
