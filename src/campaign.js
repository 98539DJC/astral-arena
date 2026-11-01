export function createCampaign(){
  const say=(speaker,key,text)=>({speaker,key,text});
  const chapters=[
    {id:0,name:'失联的星灯',subtitle:'FIRST CONTACT',description:'观测站收到一封没有寄件人的求救讯息。',portrait:'march',color:'#dcb2db'},
    {id:1,name:'霜城的回声',subtitle:'ECHOES IN THE SNOW',description:'被遗落的坐标，将小队引向一座沉默的城市。',portrait:'clara',color:'#e0b5a5'},
    {id:2,name:'缄默的坐标',subtitle:'BEYOND THE SIGNAL',description:'有人改写了星图，也有人仍在等待答案。',portrait:'silver',color:'#b7b3ed'},
    {id:3,name:'最后一盏灯',subtitle:'UNTIL THE STARS RETURN',description:'信号的终点，是一个需要你亲自作出的选择。',portrait:'firefly',color:'#a2e1d0'},
  ];
  const stages=[
    {id:'signal',chapter:0,name:'信号初醒',tag:'新手教学',location:'边境观测站 · 中央平台',summary:'回应一封来自废弃航道的求救讯息，完成第一场协同演练。',team:['dan','march','natasha'],enemy:['reaper','aegis','nova'],scale:.50,reward:240,recruit:'march',lesson:'选目标、普攻回点、终结技与战技',
      before:[say('旁白',null,'停摆七年的航道，忽然亮起了一盏星灯。通讯记录里只有一句话：请不要关闭最后的信号。'),say('三月七','march','总不能假装没听见吧？不过出发之前，先让咱们看看你会不会指挥小队。'),say('丹恒','dan','每队三人。攻击和援助需要选择不同目标，战技点则由全队共享。'),say('娜塔莎','natasha','这次我们会陪你一起。先认识伙伴，再迈出第一步。')],
      choice:{prompt:'你决定怎样回应这封讯息？',options:[{label:'先确认是否有人需要帮助。',text:'三月七举起相机：“好，那就把今天当作这次旅程的第一张合照。”'},{label:'把它当作一次新的探索。',text:'丹恒收起记录：“保持好奇，也记得让每位同伴安全回来。”'}]},
      after:[say('三月七','march','配合不错！本姑娘决定加入你的常驻编队啦。'),say('丹恒','dan','第一段坐标已经恢复。接下来，我们去旧站台。')]},
    {id:'platform',chapter:0,name:'站台来客',tag:'击破演练',location:'废弃航道 · 第七站台',summary:'星灯投影重现了最后一班列车的离站记录。',team:['nova','march','dan'],enemy:['reaper','aegis','lumen'],scale:.64,reward:320,recruit:'dan',lesson:'匹配弱点削韧，利用姬子追击',
      before:[say('姬子','nova','这些影像不是敌人本人，是星灯保存下来的战术投影。击破它们，就能读取记录。'),say('丹恒','dan','看敌人上方的属性图标。匹配弱点的攻击能削减韧性，击破会延后它们的行动。'),say('三月七','march','我来保护队友，你们负责把这段记忆点亮！')],
      after:[say('旁白',null,'投影散去，站台广播第一次完整地响起：下一站，霜城。'),say('丹恒','dan','我会继续同行。将来编队时，也可以选择我。')]},
    {id:'clinic',chapter:1,name:'白夜诊所',tag:'治疗与净化',location:'霜城 · 下层街区',summary:'断续的广播引来新的投影，诊所的灯仍然亮着。',team:['clara','natasha','dan'],enemy:['frost','reaper','aegis'],scale:.70,reward:400,recruit:'natasha',lesson:'留战技点治疗，及时净化负面状态',
      before:[say('娜塔莎','natasha','信号在这里分成了两路。先让受困的人离开，坐标可以稍后再找。'),say('克拉拉','clara','史瓦罗先生说，保护重要的人也是一种正确的计算。'),say('丹恒','dan','攻击不是唯一的指令。保留至少一点战技点，能给治疗留下选择。')],
      after:[say('娜塔莎','natasha','危急时先照顾生命最低的同伴。我也会成为你随时可以呼叫的伙伴。'),say('旁白',null,'诊所门后的墙上，刻着一幅指向城门的旧星图。')]},
    {id:'gate',chapter:1,name:'守护者门前',tag:'护盾反击',location:'霜城 · 无人城门',summary:'守卫系统拒绝放行，克拉拉决定用自己的方式回答。',team:['clara','march','lumen'],enemy:['volt','nova','aegis'],scale:.76,reward:480,recruit:null,lesson:'克拉拉承伤反击，三月七保护关键角色',
      before:[say('克拉拉','clara','我不想破坏这里。我们只需要让守卫相信，我们是来帮助大家的。'),say('三月七','march','那就先挡住它们的攻击。我的护盾会和史瓦罗一起保护你。'),say('藿藿','lumen','我、我也准备好了。需要治疗的时候，一定要叫我！')],
      after:[say('旁白',null,'城门开启，星图却在你们面前被改写成一行闪烁的问候。'),say('银狼','silver','终于到了？我只是想看看，你们会不会走到这里。')]},
    {id:'hack',chapter:2,name:'未署名的邀请',tag:'弱点植入',location:'观测站镜像 · 缓存空间',summary:'银狼把信号变成一道谜题，而答案藏在队伍的属性之中。',team:['seele','silver','natasha'],enemy:['clara','hex','lumen'],scale:.80,reward:560,recruit:null,lesson:'银狼制造弱点，希儿寻找击杀窗口',
      before:[say('银狼','silver','星图没有坏，只是被锁起来了。拿出一点本事，我就把下一段坐标交给你们。'),say('希儿','seele','花样真多。告诉我突破口在哪，我负责结束战斗。'),say('银狼','silver','没有合适的弱点？那就替它加上一个。记得用同伴的属性配合。')],
      choice:{prompt:'面对银狼的试探，你选择——',options:[{label:'研究规则，再找到突破口。',text:'银狼轻笑：“不错，至少你不是只会乱按按钮。”'},{label:'相信同伴，一起完成挑战。',text:'希儿点了点头：“把机会留给我，我会把它变成结果。”'}]},
      after:[say('银狼','silver','通关。下一段坐标在一座温室里，别把那里当成普通的花园。'),say('希儿','seele','走吧。还没找到发出求救的人呢。')]},
    {id:'garden',chapter:2,name:'琉光温室',tag:'击破协同',location:'废弃研究站 · 琉光温室',summary:'阮·梅发现，星灯保存的不是路线，而是一段等待回应的记忆。',team:['ruan','frost','lumen'],enemy:['silver','reaper','aegis'],scale:.84,reward:640,recruit:null,lesson:'先开击破增益，再集中攻击同一弱点',
      before:[say('阮·梅','ruan','这段信号会对协同作出反应。一个人的力量不足以打开最后的记录。'),say('彦卿','frost','也就是说，要先让大家的节奏一致，再一击突破？'),say('阮·梅','ruan','是的。先观察，再行动。击破效率的提高，会让突破来得更早。')],
      after:[say('旁白',null,'最后的记录显现：那不是一封等待救援的信，而是一座等待重新启航的灯塔。'),say('阮·梅','ruan','要把它点亮，还需要一簇能穿过风暴的火。')]},
    {id:'firefly',chapter:3,name:'萤火过境',tag:'强化形态',location:'破碎航道 · 风暴边缘',summary:'流萤愿意带着小队穿过风暴，代价是一次必须把握的燃烧窗口。',team:['firefly','ruan','natasha'],enemy:['clara','march','hex'],scale:.90,reward:720,recruit:null,lesson:'生命换能量，完全燃烧后连续击破',
      before:[say('流萤','firefly','如果前面还有人在等待，我想试着走到那里。'),say('娜塔莎','natasha','你可以把生命转成能量，但别忘记让同伴照顾你。'),say('阮·梅','ruan','把强化形态和击破增益放在同一个窗口里，效果会更好。')],
      after:[say('流萤','firefly','我们到了。现在，决定要不要让灯塔重新亮起来的人，是你。'),say('旁白',null,'灯塔的防御投影全部苏醒。最后一段航道，正在等待你们。')]},
    {id:'dawn',chapter:3,name:'群星归航',tag:'章节首领',location:'失落灯塔 · 星灯核心',summary:'完成最后一场协同作战，让沉默的航道再次拥有归途。',team:['firefly','ruan','lumen'],enemy:['volt','clara','silver'],scale:.98,reward:960,recruit:'seele',lesson:'综合运用治疗、强化、弱点与行动顺序',
      before:[say('姬子','nova','信号的另一头，也许已没有人在等待。但我们依然可以为后来的人留下一条路。'),say('三月七','march','出发时的合照还空着一个位置。等点亮灯塔，就一起把它补上吧。'),say('流萤','firefly','这一次，我们一起走到最后。')],
      choice:{prompt:'你向小队下达最后的指令。',options:[{label:'点亮灯塔，为后来的人留下归途。',text:'一道新的航线在星图上亮起。你们决定让这段旅程成为另一个故事的起点。'},{label:'保存这段记忆，带着大家一起返航。',text:'小队把所有记录接入灯塔。被遗忘的声音终于有了回响，也有了归途。'}]},
      after:[say('旁白',null,'灯塔亮起，星海不再沉默。记录的最后，多出了一张属于你们的合照。'),say('希儿','seele','这趟旅程还不错。下一次需要帮手，就把我的名字放进编队里。'),say('姬子','nova','第一段航线到这里结束。你也可以带着自己的伙伴，开启下一场演练与联机对战。')]},
  ];
  const get=id=>stages.find(s=>s.id===id);
  const cleared=p=>Array.isArray(p?.storyCleared)?p.storyCleared:[];
  const unlocked=(p,id)=>{const i=stages.findIndex(s=>s.id===id);return i>=0&&(i===0||cleared(p).includes(stages[i-1].id));};
  const next=p=>stages.find(s=>!cleared(p).includes(s.id))||null;
  function makeBattle(engine,id,seed,now=Date.now()){
    const stage=get(id);if(!stage)throw new Error('没有这个剧情关卡');
    const game=engine.make('practice',now,[stage.team,stage.enemy],{seed,firstSide:0});
    for(const u of game.units.filter(u=>u.side===1)){u.hp=u.maxHp=Math.round(u.maxHp*stage.scale);u.atk=Math.round(u.atk*stage.scale);}
    if(id==='signal'){game.units.find(u=>u.id==='0-dan').energy=75;game.units.find(u=>u.id==='1-aegis').toughness=20;for(const u of game.units.filter(u=>u.side===1))u.energy=0;}
    game.campaign={stageId:id,guideStep:0,guideHidden:false};return game;
  }
  function reward(collection,source,id){
    const stage=get(id);if(!stage||!unlocked(source,id))throw new Error('请先完成前置剧情关卡');
    const p=structuredClone(source);p.storyCleared??=[];
    if(p.storyCleared.includes(id))return{profile:p,firstClear:false};
    p.storyCleared.push(id);p.stars+=stage.reward;
    if(stage.recruit){if(p.owned[stage.recruit])p.stardust+=collection.rarity(stage.recruit)===5?30:8;else p.owned[stage.recruit]=1;}
    if(id==='signal')p.tutorialDone=true;
    return{profile:p,firstClear:true,stars:stage.reward,recruit:stage.recruit};
  }
  return{chapters,stages,get,cleared,unlocked,next,makeBattle,reward};
}
