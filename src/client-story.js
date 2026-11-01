const STORY=createCampaign();
let storyChapter=0,storyScene=null;
const storyWelcomeDismissed=new Set();
const storyKey=()=>account?.id||'offline';
const storyStage=()=>STORY.get(state?.campaign?.stageId);

function storyHubCard(){
  const next=STORY.next(profile),chapter=STORY.chapters[next?.chapter??3],count=STORY.cleared(profile).length;
  return `<button class="story-hub-card" data-story-action="open" style="--story-color:${chapter.color}"><div><span class="eyebrow">STORY EXPEDITION / 原创剧情航线</span><h2>${next?'下一站，'+next.name+'。':'星灯已亮，旅程继续。'}</h2><p>${next?chapter.name+' · '+next.summary:'四章航线已完成。重温故事，或带着新伙伴加入联机对战。'}</p><span class="story-hub-link">${next?'继续剧情':'重温航线'} <b>↗</b></span></div><div class="story-hub-portrait">${portrait(chapter.portrait,'splash')}</div><span class="story-hub-progress"><b>${count}</b> / ${STORY.stages.length}<small>关卡已通关</small></span></button>`;
}

function storyScreen(){
  const chapter=STORY.chapters[storyChapter],cleared=STORY.cleared(profile),next=STORY.next(profile);
  return `${header()}<main class="story-page" style="--story-color:${chapter.color}"><div class="story-page-title"><div><span class="eyebrow">STELLAR CHRONICLE / 星灯纪行</span><h1>每一段相遇，<br>都有回响<span>。</span></h1><p>一条等待重新点亮的航线，和十六位可以并肩的伙伴。</p></div><div class="story-total"><b>${String(cleared.length).padStart(2,'0')}</b><span>/ 08<br>航线记录</span></div></div><nav class="story-chapters" aria-label="剧情章节">${STORY.chapters.map(c=>`<button data-story-chapter="${c.id}" class="${c.id===storyChapter?'selected':''}" aria-pressed="${c.id===storyChapter}"><small>CHAPTER 0${c.id+1}</small><b>${c.name}</b><span>${STORY.stages.filter(s=>s.chapter===c.id&&cleared.includes(s.id)).length} / 2</span></button>`).join('')}</nav><section class="story-chapter-hero"><div class="story-constellation">✦</div><div><span class="eyebrow">CHAPTER 0${chapter.id+1} / ${chapter.subtitle}</span><h2>${chapter.name}</h2><p>${chapter.description}</p><small>本章提供免费试用编队，首次通关领取星石与伙伴。</small></div>${portrait(chapter.portrait,'splash')}</section><div class="story-stage-grid">${STORY.stages.filter(s=>s.chapter===storyChapter).map(s=>{const available=STORY.unlocked(profile,s.id),done=cleared.includes(s.id),index=STORY.stages.indexOf(s);return `<article class="story-stage-card ${done?'cleared':''} ${!available?'locked':''} ${next?.id===s.id?'next':''}"><div class="story-stage-top"><span>${String(index+1).padStart(2,'0')} / ${s.tag}</span><b>${done?'✓ 已通关':available?'可探索':'◇ 尚未解锁'}</b></div><h3>${s.name}</h3><p>${s.summary}</p><div class="story-trial-team">${s.team.map(key=>`<span>${portrait(key,'avatar')}<small>${role(key).name}</small></span>`).join('')}<em>本关试用<br>三人编队</em></div><div class="story-stage-lesson"><span>✧ 战术提示</span>${s.lesson}</div><div class="story-stage-reward"><span>${done?'首通奖励已领取':'首通奖励'}<b>✦ ${s.reward} 星石${s.recruit?' · '+role(s.recruit).name:''}</b></span><button class="${available?'primary':'secondary'}" data-story-stage="${s.id}" ${!available||busy||!profileConnected?'disabled':''}>${done?'重温 ↗':available?'开始探索 ↗':'完成前置关卡'}</button></div></article>`;}).join('')}</div><div class="story-footer-note"><span>原创课程同人剧情 · 敌方为战术投影 · 战斗机制采用本作数值</span><button class="text-btn" data-story-action="replay-guide">重新体验新手引导 ↗</button></div></main>`;
}

function storyDialogue(){
  const scene=storyScene,stage=STORY.get(scene.stageId),chapter=STORY.chapters[stage.chapter];
  if(scene.phase==='squad')return `<div class="story-shade" role="dialog" aria-modal="true" aria-label="确认剧情编队"><section class="story-squad-modal"><button class="close" data-story-action="close-scene" aria-label="返回航线">×</button><span class="eyebrow">TRIAL SQUAD / 本关试用编队</span><h2>三位伙伴，<br>一起出发。</h2><p>${stage.name} · ${stage.location}</p><div class="story-squad-cards">${stage.team.map((key,i)=>{const r=role(key);return `<button data-detail="${key}" style="--unit-color:${r.color}"><span>0${i+1} / 试用</span>${portrait(key,'splash')}<div><b>${r.name}</b><small>${r.description}</small></div></button>`;}).join('')}</div><div class="story-squad-tip"><b>本关目标</b><p>${stage.lesson}。三位角色仅在本关免费试用，首次通关奖励会加入你的收藏。</p></div><button class="primary large full" data-story-action="start" ${busy?'disabled':''}>${busy?'正在准备战场…':'编队确认，进入战场 ↗'}</button><small class="story-squad-foot">点击伙伴卡片可以先查看技能。角色不需要提前抽取。</small></section></div>`;
  const lines=scene.phase==='after'?stage.after:stage.before,choosing=scene.phase==='before'&&stage.choice&&scene.index===lines.length,answer=scene.phase==='before'&&stage.choice&&scene.index>lines.length;
  const line=answer?{speaker:'旁白',key:null,text:stage.choice.options[scene.choice].text}:lines[Math.min(scene.index,lines.length-1)];
  const key=choosing?chapter.portrait:line.key||chapter.portrait;
  return `<div class="story-dialog" role="dialog" aria-modal="true" aria-label="${esc(stage.name)}剧情对话" style="--story-color:${chapter.color}"><div class="story-dialog-bg"></div><div class="story-dialog-location"><span>CHAPTER 0${stage.chapter+1} / ${esc(stage.name)}</span><b>${esc(stage.location)}</b></div><button class="text-btn story-skip" data-story-action="skip-scene">跳过对话 ↗</button><div class="story-dialog-art">${portrait(key,'splash')}</div><section class="story-dialog-panel"><div class="story-dialog-label"><span>✦</span>${choosing?'你的回应':esc(line.speaker)}</div>${choosing?`<h3>${esc(stage.choice.prompt)}</h3><div class="story-choices">${stage.choice.options.map((option,i)=>`<button data-story-choice="${i}"><span>0${i+1}</span>${esc(option.label)}<b>↗</b></button>`).join('')}</div>`:`<p class="story-dialog-copy">${esc(line.text)}</p><div class="story-dialog-bottom"><span>${scene.phase==='after'?'航线记录更新':'星灯纪行'} · ${Math.min(scene.index+1,lines.length)} / ${lines.length}</span><button class="primary" data-story-action="next-line">${scene.phase==='after'&&scene.index>=lines.length-1?'返回航线 ↗':scene.phase==='before'&&!stage.choice&&scene.index>=lines.length-1||answer?'查看编队 ↗':'继续 ▷'}</button></div>`}</section><span class="story-dialog-foot">原创同人剧情 / STELLAR CHRONICLE</span></div>`;
}

function storyOverlay(){
  if(storyScene)return storyDialogue();
  if(mode==='lobby'&&profileConnected&&(account||offlineCollection)&&!profile.tutorialDone&&!accountRecovery&&!storyWelcomeDismissed.has(storyKey()))return `<div class="story-shade story-welcome-shade" role="dialog" aria-modal="true" aria-label="新手启航引导"><section class="story-welcome"><div class="story-welcome-art">${portrait('march','splash')}</div><div class="story-welcome-copy"><span class="eyebrow">FIRST DEPARTURE / 启航指引</span><h2>第一场冒险，<br>我们陪你。</h2><p>从一支试用小队开始，在故事里认识伙伴，学会第一场对战。</p><ol><li><b>01</b><span>认识三人编队<small>伙伴定位与技能目标</small></span></li><li><b>02</b><span>完成实战引导<small>选目标、回战技点、施放终结技</small></span></li><li><b>03</b><span>带伙伴继续旅程<small>首通可获得三月七等角色</small></span></li></ol><button class="primary large full" data-story-action="begin-guide">开始新手旅程 ↗</button><button class="text-btn full" data-story-action="dismiss-welcome">我想先自由探索</button></div></section></div>`;
  return '';
}

const storyGuideSteps=[
  {title:'先选择攻击目标',text:'点击敌方杰帕德的立绘。敌人上方是弱点图标，白色细条是韧性。',selector:'[data-target="1-aegis"]'},
  {title:'普攻会恢复战技点',text:'点击「普通攻击」。丹恒的风属性能匹配目标弱点，这次普攻还会让能量充满。',selector:'[data-combat="basic"]'},
  {title:'能量满，施放终结技',text:'点击丹恒下方发亮的终结技。终结技不消耗共享战技点，也不会抢走已保留的普通行动。',selector:'[data-ult="0-dan"]'},
  {title:'为伙伴选择战技目标',text:'轮到我方时，先看当前角色的技能。援助技能点击己方伙伴，攻击技能点击敌人，再按「战技」。战技消耗 1 点。',selector:'[data-combat="skill"]'},
];

function decorateStoryGuide(){
  if(mode!=='practice'||state?.phase!=='battle'||state.campaign?.stageId!=='signal'||state.campaign.guideHidden)return;
  const index=state.campaign.guideStep||0,step=storyGuideSteps[index],top=app.querySelector('.battle-top');if(!top)return;
  const ownTurn=G.current(state)?.side===0;
  top.insertAdjacentHTML('afterend',`<section class="battle-coach" aria-live="polite"><div class="coach-count">${step?String(index+1).padStart(2,'0'):'✓'}<small>/ 04</small></div><div><span>实战引导 · 可随时跳过</span><h3>${step?step.title:'你已经掌握基本指令'}</h3><p>${step?step.text:'继续完成本关。胜利后领取首通奖励，三月七就会加入你的常驻收藏。'}${step&&index!==2&&!ownTurn?' <b>对手行动中，等待我方下一次行动。</b>':''}</p></div><button class="text-btn" data-story-action="hide-coach">${step?'跳过引导':'收起引导'} ×</button></section>`);
  if(step)app.querySelector(step.selector)?.classList.add('coach-highlight');
}

function onStoryAction(action,player){
  if(player!==0||state?.campaign?.stageId!=='signal')return;
  const step=state.campaign.guideStep||0;
  if(step===1&&action.kind==='basic'||step===2&&action.kind==='ultimate'||step===3&&action.kind==='skill')state.campaign.guideStep=step+1;
}

function storyResultOverlay(){
  const stage=storyStage(),won=state.winner===0,done=STORY.cleared(profile).includes(stage.id),claimed=state.rewardClaimed;
  return `<div class="result-overlay"><div class="result-card story-result ${won?'victory':''}"><div class="result-symbol">${won?'✦':'◇'}</div><div class="eyebrow">${won?'CHAPTER RECORD / 航线记录':'RETRY EXPEDITION / 再次出发'}</div><h1>${won?stage.name+' · 完成':'旅程还没有结束'}</h1><p>${won?'星灯回应了你们的协同。':'调整指令次序，留出治疗和护盾的战技点，再试一次。'}</p><div class="result-stat">${state.seq} 次指令 · ${G.living(state,0).length} 名伙伴存活</div>${won?`<div class="story-result-reward"><span>${done?'本关首通已记录':'首次通关奖励'}</span><b>✦ ${stage.reward} 星石${stage.recruit?' ＋ '+role(stage.recruit).name:''}</b><small>重复拥有的奖励角色会转为对应星尘；首通奖励仅发放一次。</small></div>`:''}<button class="reward-button secondary" data-action="claim-battle" ${claimed||claimingReward?'disabled':''}>${claimed?'奖励已结算':claimingReward?'正在核验战斗…':won?'结算对战与剧情奖励':'领取演练结算'}</button>${won&&claimed?'<button class="primary" data-story-action="after">继续剧情 ↗</button>':`<button class="primary" data-story-stage="${stage.id}">${won?'重新挑战':'重新出发'} ↗</button>`}<button class="text-btn" data-story-action="open">返回剧情航线</button></div></div>`;
}

async function openStory(){
  if(mode!=='lobby'&&mode!=='story'&&!await leave())return;
  cancelAi();mode='story';state=null;room=null;roomPanel=false;busy=false;storyScene=null;storyChapter=STORY.next(profile)?.chapter??3;render();
}

async function showStoryStage(id){
  const stage=STORY.get(id);if(!stage||!STORY.unlocked(profile,id))return toast('请先完成前置剧情关卡');
  if(state?.phase==='battle'&&!await leave())return;
  cancelAi();state=null;mode='story';room=null;roomPanel=false;storyChapter=stage.chapter;storyScene={stageId:id,phase:'before',index:0,choice:null};render();
}

function nextStoryLine(){
  if(!storyScene)return;const stage=STORY.get(storyScene.stageId),lines=storyScene.phase==='after'?stage.after:stage.before;
  if(storyScene.index<lines.length-1){storyScene.index++;render();return;}
  if(storyScene.phase==='after'){storyScene=null;storyChapter=STORY.next(profile)?.chapter??storyChapter;render();return;}
  if(stage.choice&&storyScene.choice===null){storyScene.index=lines.length;render();return;}
  storyScene.phase='squad';render();
}

async function startStoryBattle(){
  if(busy||!storyScene)return;const stage=STORY.get(storyScene.stageId);cancelAi();const generation=gameGeneration;busy=true;render();
  try{
    await connectCollection();let next,id;
    if(offlineCollection){const seed=crypto.getRandomValues(new Uint32Array(1))[0];next=STORY.makeBattle(G,stage.id,seed);id='story-'+stage.id+'-'+Date.now();}
    else{const data=await request('/api/practice/start',{stageId:stage.id});if(generation!==gameGeneration)return;collectionAccept(data);next=data.game;id=data.matchId;}
    if(generation!==gameGeneration)return;state=next;state.collectionMatch={id,actions:[]};state.deadline=Date.now()+45000;mode='practice';side=0;room=null;roomPanel=false;storyScene=null;target=allyTarget=null;normalizeTarget();storePractice();
  }catch(error){toast(error.message);}finally{if(generation===gameGeneration){busy=false;render();scheduleAi();}}
}

async function markStoryTutorialDone(){
  storyWelcomeDismissed.add(storyKey());
  if(profile.tutorialDone)return;
  try{await collectionOperation('tutorial');}catch(error){toast(error.message);}
}

document.addEventListener('click',event=>{
  const targetButton=event.target.closest('[data-target]');
  if(targetButton&&!targetButton.disabled&&state?.campaign?.stageId==='signal'&&state.campaign.guideStep===0&&targetButton.dataset.target.startsWith('1-'))state.campaign.guideStep=1;
},true);

document.addEventListener('click',async event=>{
  const chapter=event.target.closest('[data-story-chapter]');if(chapter){storyChapter=Number(chapter.dataset.storyChapter);render();return;}
  const stage=event.target.closest('[data-story-stage]');if(stage&&!stage.disabled){await showStoryStage(stage.dataset.storyStage);return;}
  const choice=event.target.closest('[data-story-choice]');if(choice&&storyScene){storyScene.choice=Number(choice.dataset.storyChoice);storyScene.index=STORY.get(storyScene.stageId).before.length+1;render();return;}
  const button=event.target.closest('[data-story-action]');if(!button||button.disabled)return;
  const action=button.dataset.storyAction;
  if(action==='open')await openStory();
  else if(action==='begin-guide'||action==='replay-guide'){storyWelcomeDismissed.add(storyKey());await showStoryStage('signal');}
  else if(action==='dismiss-welcome'){storyWelcomeDismissed.add(storyKey());render();await markStoryTutorialDone();}
  else if(action==='next-line')nextStoryLine();
  else if(action==='close-scene'){storyScene=null;render();}
  else if(action==='skip-scene'){if(storyScene.phase==='after')storyScene=null;else storyScene.phase='squad';render();}
  else if(action==='start')await startStoryBattle();
  else if(action==='hide-coach'){state.campaign.guideHidden=true;storePractice();render();await markStoryTutorialDone();}
  else if(action==='after'){const stage=storyStage();cancelAi();state=null;mode='story';storyScene={stageId:stage.id,phase:'after',index:0,choice:null};render();}
});

document.addEventListener('keydown',event=>{
  if(!storyScene||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)||document.querySelector('dialog[open]'))return;
  if((event.key==='Enter'||event.key===' ')&&['before','after'].includes(storyScene.phase)&&!event.target.closest('button')&&!document.querySelector('.story-choices')){event.preventDefault();nextStoryLine();}
});

function revealArchiveSelection(){const list=app.querySelector('.character-selector'),selected=list?.querySelector('.selected');if(!list||!selected)return;const parent=list.getBoundingClientRect(),item=selected.getBoundingClientRect();if(matchMedia('(max-width:900px)').matches){if(item.left<parent.left||item.right>parent.right)list.scrollLeft+=item.left-parent.left-(list.clientWidth-item.width)/2;}else if(item.top<parent.top||item.bottom>parent.bottom)list.scrollTop+=item.top-parent.top-(list.clientHeight-item.height)/2;}

window.addEventListener('resize',()=>requestAnimationFrame(revealArchiveSelection));
