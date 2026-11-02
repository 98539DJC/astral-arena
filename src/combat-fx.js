// Presentation only: this module never changes combat state or sends requests.
export function createCombatFX({getRole,getArt}) {
  const palette={fire:['#ffb565','#ff604a'],ice:['#d1f5ff','#69baff'],wind:['#b7ffe0','#5ed6bb'],lightning:['#ead2ff','#ba8cff'],physical:['#fff0d4','#e5b98d'],quantum:['#e0c3ff','#9767ff']};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let preference='full',session=null,lastKey=null;
  try{preference=localStorage.getItem('astral-effects-v1')==='lite'?'lite':'full';}catch{}
  const light=()=>preference==='lite'||reduced.matches;
  const node=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  function clear(){
    if(!session)return;
    const s=session;session=null;cancelAnimationFrame(s.frame);clearTimeout(s.timer);
    s.animations.forEach(a=>a.cancel());s.root.remove();s.resolve?.(0);
  }
  function toggle(){preference=light()&&!reduced.matches?'full':'lite';try{localStorage.setItem('astral-effects-v1',preference);}catch{}clear();return light();}
  function animate(el,frames,options){if(!el?.animate||!session)return;const a=el.animate(frames,options);session.animations.push(a);}
  function grouped(effects){
    const groups=new Map();
    for(const e of effects||[]){
      const kind=/^护盾 [−-]/.test(e.text)?'guard':e.kind;
      const value=e.text.match(/[+−-](\d+)/),key=e.id+'|'+kind+(value?'':'|'+e.text);
      const g=groups.get(key)||{...e,kind,value:0,count:0,numeric:!!value};
      g.count++;if(value)g.value+=Number(value[1]);groups.set(key,g);
    }
    return [...groups.values()];
  }
  function play(state,{previous,key}={}){
    const arena=document.querySelector('.arena');
    if(!arena||!state?.last||document.hidden||key&&key===lastKey)return Promise.resolve(0);
    clear();lastKey=key;
    const last=state.last,actor=state.units.find(u=>u.id===last.actor),r=actor&&getRole(actor.key);
    if(!r)return Promise.resolve(0);
    const simple=light(),ultimate=last.kind==='ultimate',special=state.presentations?.find(p=>p.kind==='summon')||state.presentations?.[0];
    const duration=simple?220:ultimate?1250:special?1000:last.kind==='skill'?850:650;
    const hitAt=simple?0:ultimate?460:180;
    const bounds=arena.getBoundingClientRect(),top=Math.max(8,bounds.top),bottom=Math.min(innerHeight-8,bounds.bottom);
    if(bottom<=top)return Promise.resolve(0);
    const root=node('div','afx-root'+(simple?' afx-lite':''));root.setAttribute('aria-hidden','true');
    root.dataset.action=last.kind;root.dataset.element=r.element;
    root.style.setProperty('--fx-color',r.key==='firefly'?'#9fffe1':palette[r.element]?.[0]||r.color);
    const canvas=node('canvas','afx-canvas');root.append(canvas);document.body.append(root);
    const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.ceil(innerWidth*ratio);canvas.height=Math.ceil(innerHeight*ratio);
    const ctx=canvas.getContext('2d');if(ctx)ctx.scale(ratio,ratio);
    const s=session={root,frame:0,timer:0,animations:[],resolve:null};
    const positions=new Map();
    for(const u of state.units){
      const card=document.querySelector('[data-unit="'+u.id+'"]'),art=card?.querySelector('.unit-art');
      if(!art)continue;
      const b=art.getBoundingClientRect();
      if(b.bottom<top||b.top>bottom)continue;
      positions.set(u.id,{x:b.left+b.width/2,y:b.top+b.height*.52,w:b.width,h:b.height,card,art});
      const old=previous?.units?.find(v=>v.id===u.id),bar=card.querySelector('.bar.hp i');
      if(old&&old.hp!==u.hp&&!simple)animate(bar,[{width:old.hp/old.maxHp*100+'%'},{width:u.hp/u.maxHp*100+'%'}],{duration:420,delay:hitAt,easing:'cubic-bezier(.2,.8,.3,1)'});
    }
    const source=positions.get(actor.id),groups=grouped(state.effects),counts={},stacks=new Map(),impacts=[];
    for(const g of groups){
      const p=positions.get(g.id);if(!p)continue;
      const index=counts[g.id]||0;counts[g.id]=index+1;
      if(index>=4)continue;
      const at=hitAt+index*(simple?0:55);
      let stack=stacks.get(g.id);
      if(!stack){stack=node('div','afx-stack');stack.style.left=p.x+'px';stack.style.top=(p.y-20)+'px';stack.style.setProperty('--number-delay',hitAt+'ms');stacks.set(g.id,stack);root.append(stack);}
      const amount=node('div','afx-number '+g.kind);
      if(g.numeric){
        const labels={critical:'暴击',dot:'持续伤害',guard:'护盾吸收'};
        const label=labels[g.kind]||(g.count>1?'连击 ×'+g.count:'');
        if(label)amount.append(node('small','',label));
        amount.append(node('b','',(g.kind==='heal'?'+':'−')+g.value));
      }else amount.append(node('b','',g.text));
      stack.append(amount);
      const hostile=['damage','critical','dot','break','guard'].includes(g.kind);
      impacts.push({...p,kind:g.kind,at,hostile,element:r.element,seed:index+g.id.charCodeAt(0)});
      if(!simple&&hostile)animate(p.art,[{transform:'translateX(0)'},{transform:'translateX(-4px)',offset:.25},{transform:'translateX(3px)',offset:.6},{transform:'translateX(0)'}],{duration:240,delay:at,easing:'ease-out'});
      const old=previous?.units?.find(v=>v.id===g.id),now=state.units.find(v=>v.id===g.id);
      if(old?.shield>0&&now?.shield===0&&hostile)impacts.push({...p,kind:'shatter',at:at+60,hostile:false,element:'ice',seed:5});
    }
    if(source&&!simple){
      const destination=positions.get(last.target),direction=destination?Math.sign(destination.x-source.x)||1:1;
      animate(source.art,[{transform:'translate(0,0)',filter:'brightness(1)'},{transform:`translate(${direction*8}px,-6px)`,filter:'brightness(1.28)',offset:.35},{transform:'translate(0,0)',filter:'brightness(1)'}],{duration:420,easing:'ease-out'});
    }
    const mainName=ultimate?r.ult:(special?.name||(last.kind==='skill'?r.skill:last.kind==='defend'?'稳固防御':'普通攻击'));
    const nameplate=node('div','afx-skill-name',mainName);nameplate.style.left=(Math.max(8,bounds.left)+Math.min(bounds.width,innerWidth-16)/2)+'px';nameplate.style.top=(top+12)+'px';root.append(nameplate);
    if((ultimate||special)&&!simple){
      const bannerRole=ultimate?r:getRole(state.units.find(u=>u.id===special.actor)?.key)||r;
      const banner=node('div','afx-cutin'+(ultimate?' afx-ultimate':' afx-followup')+(simple?' afx-static':''));
      const width=Math.min(bounds.width,innerWidth-16,1080);banner.style.width=width+'px';banner.style.left=(Math.max(8,bounds.left)+(Math.min(bounds.width,innerWidth-16)-width)/2)+'px';
      banner.style.top=(top+Math.max(28,Math.min(150,(bottom-top-220)*.2)))+'px';
      const image=node('img','afx-cutin-art');image.src=getArt(bannerRole.key,'splash');image.alt='';image.decoding='async';banner.append(image);
      const copy=node('div','afx-cutin-copy');copy.append(node('small','',ultimate?'ULTIMATE / 终结技':special.kind==='summon'?'LIGHTNING-LORD / 神君行动':'FOLLOW-UP / 追加攻击'),node('h2','',ultimate?r.ult:special.name),node('span','',bannerRole.name+' · '+bannerRole.title));banner.append(copy);
      const crest=node('div','afx-cutin-crest',({fire:'✦',ice:'❄',wind:'≋',lightning:'ϟ',physical:'◈',quantum:'✺'})[r.element]);banner.append(crest);root.append(banner);
    }
    if(!simple&&groups.some(g=>g.kind==='break'||g.kind==='critical'))animate(arena,[{transform:'translate(0,0)'},{transform:'translate(-2px,1px)',offset:.28},{transform:'translate(2px,-1px)',offset:.55},{transform:'translate(0,0)'}],{duration:180,delay:hitAt});
    function polygon(x,y,n,radius,angle=0){ctx.beginPath();for(let i=0;i<=n;i++){const a=angle+i*Math.PI*2/n;const p=[x+Math.cos(a)*radius,y+Math.sin(a)*radius];i?ctx.lineTo(...p):ctx.moveTo(...p);}ctx.closePath();}
    function ring(x,y,radius,color,alpha,width=2){ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.ellipse(x,y,radius,radius*.42,0,0,Math.PI*2);ctx.stroke();}
    function beam(from,to,progress,color,element){
      const x=from.x+(to.x-from.x)*progress,y=from.y+(to.y-from.y)*progress;
      ctx.strokeStyle=color;ctx.lineWidth=element==='physical'?4:3;ctx.globalAlpha=.65;ctx.shadowColor=color;ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(from.x,from.y);
      if(element==='lightning'){for(let i=1;i<7;i++){const p=i/7;ctx.lineTo(from.x+(x-from.x)*p+(i%2?7:-7),from.y+(y-from.y)*p);}ctx.lineTo(x,y);}else ctx.quadraticCurveTo((from.x+x)/2,(from.y+y)/2-32,x,y);
      ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=.95;ctx.fillStyle='#fff4dd';ctx.beginPath();ctx.arc(x,y,4,0,7);ctx.fill();
    }
    function impact(p,age){
      if(age<0||age>700)return;
      const progress=age/700,alpha=Math.max(0,1-progress),colors=palette[p.element]||palette.physical;
      const color=p.kind==='heal'?'#9ff5c6':['shield','guard','shatter'].includes(p.kind)?'#9cdfff':p.kind==='break'?'#ffe0a2':r.key==='firefly'?'#a2ffe0':r.key==='volt'?'#ffe2a0':colors[0];
      const radius=12+Math.sqrt(progress)*72,scale=innerWidth<650?.7:1;
      ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);
      const glow=ctx.createRadialGradient(0,0,0,0,0,radius*1.5);glow.addColorStop(0,color+'55');glow.addColorStop(1,color+'00');ctx.globalAlpha=alpha;ctx.fillStyle=glow;ctx.fillRect(-radius*2,-radius*2,radius*4,radius*4);
      if(['shield','guard','shatter'].includes(p.kind)){
        ctx.strokeStyle=color;ctx.globalAlpha=alpha*.9;ctx.lineWidth=2.4;polygon(0,0,p.kind==='shatter'?8:6,radius,Math.PI/6);ctx.stroke();if(p.kind!=='shatter'){polygon(0,0,6,radius*.8,Math.PI/6);ctx.stroke();}
      }else if(p.kind==='heal'||p.kind==='buff'){
        ring(0,18,radius*1.15,color,alpha);ring(0,-15,radius*.75,color,alpha*.65);ctx.globalAlpha=alpha;ctx.fillStyle=color;
        for(let i=0;i<4;i++){const a=i*1.57+progress;const x=Math.cos(a)*radius*.65,y=Math.sin(a)*radius*.4-progress*35;ctx.fillRect(x-2,y-8,4,16);ctx.fillRect(x-8,y-2,16,4);}
      }else{
        if(p.element==='wind'){
          ctx.strokeStyle=color;ctx.lineWidth=3;ctx.globalAlpha=alpha;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,radius*(.6+i*.25),i*2+progress,i*2+progress+1.4);ctx.stroke();}
        }else if(p.element==='ice'||p.kind==='break'){
          ctx.strokeStyle=color;ctx.lineWidth=p.kind==='break'?3.5:2;ctx.globalAlpha=alpha;for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(Math.cos(a)*12,Math.sin(a)*12);ctx.lineTo(Math.cos(a)*radius,Math.sin(a)*radius);ctx.stroke();}
          polygon(0,0,6,radius*.5,progress);ctx.stroke();
        }else if(p.element==='quantum'){
          ctx.strokeStyle=color;ctx.lineWidth=3;ctx.globalAlpha=alpha;for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2+progress);ctx.beginPath();ctx.ellipse(radius*.4,0,radius*.5,radius*.18,.4,0,7);ctx.stroke();ctx.restore();}
        }else if(p.element==='lightning'){
          ctx.strokeStyle=color;ctx.lineWidth=3;ctx.globalAlpha=alpha;for(let i=0;i<2;i++){ctx.beginPath();ctx.moveTo(-18+i*30,-radius*1.2);ctx.lineTo(16-i*10,-10);ctx.lineTo(-7+i*8,12);ctx.lineTo(20-i*30,radius);ctx.stroke();}
        }else{
          ctx.strokeStyle=color;ctx.lineWidth=(1-progress)*7+1;ctx.globalAlpha=alpha;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-radius+i*13,-radius*.7);ctx.lineTo(radius-i*13,radius*.7);ctx.stroke();}
          if(p.element==='fire')ring(0,0,radius,color,alpha,3);
        }
      }
      if(!simple){
        const count=innerWidth<650?10:18;ctx.globalAlpha=alpha*.85;ctx.fillStyle=color;
        for(let i=0;i<count;i++){const a=i*2.399+p.seed,travel=(25+(i%5)*15)*progress;const x=Math.cos(a)*travel,y=Math.sin(a)*travel+progress*progress*30;
          ctx.save();ctx.translate(x,y);ctx.rotate(a);if(p.element==='ice'||p.kind==='shatter'){polygon(0,0,3,4+i%3);ctx.fill();}else ctx.fillRect(-1,-2,2+i%3,5+i%4);ctx.restore();}
      }
      ctx.restore();
    }
    const begun=performance.now();
    const frame=now=>{
      if(session!==s)return;
      const elapsed=now-begun;
      if(ctx&&!simple){
        ctx.clearRect(0,0,innerWidth,innerHeight);ctx.save();ctx.beginPath();ctx.rect(Math.max(0,bounds.left),top,Math.min(bounds.width,innerWidth),bottom-top);ctx.clip();
        if(source&&elapsed<hitAt+100&&elapsed>30){for(const p of impacts.filter(p=>p.hostile).slice(0,3))beam(source,p,Math.max(0,Math.min(1,(elapsed-30)/Math.max(100,hitAt-30))),palette[r.element]?.[0]||r.color,r.element);}
        for(const p of impacts)impact(p,elapsed-p.at);
        ctx.restore();
      }
      if(elapsed<duration+350)s.frame=requestAnimationFrame(frame);
    };
    if(!simple&&ctx)s.frame=requestAnimationFrame(frame);
    // The combat lock lasts only for the main cue; decoration then cleans itself.
    const completion=new Promise(resolve=>{s.resolve=resolve;setTimeout(()=>{if(session===s){s.resolve=null;resolve(duration);}},duration);});
    s.timer=setTimeout(()=>{if(session===s)clear();},duration+400);
    return completion;
  }
  addEventListener('resize',clear,{passive:true});addEventListener('scroll',clear,{passive:true});
  reduced.addEventListener?.('change',clear);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
  return {play,clear,toggle,isLight:light};
}
