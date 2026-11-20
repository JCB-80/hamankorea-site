(() => {
'use strict';
const $ = id => document.getElementById(id), stage = $('stage'), ctx = stage.getContext('2d');
const storageKey = 'haman-workroom-motion-v1', opts = ['cut','fade','slide','zoom'], w = stage.width, h = stage.height;
const initial = [
  {title:'모든 장면은\n한 문장으로 시작합니다', subtitle:'첫 컷 · 핵심 문구', bg:'#172d37', fg:'#f2f5ed', duration:3, transition:'cut'},
  {title:'색과 움직임으로\n이야기를 이어 보세요', subtitle:'둘째 컷 · 디졸브 전환', bg:'#3b263b', fg:'#ffe9cf', duration:3, transition:'fade'},
  {title:'당신의 다음 장면은?', subtitle:'셋째 컷 · 슬라이드 전환', bg:'#173e37', fg:'#efffe6', duration:3, transition:'slide'}
];
const blank = {title:'새 장면',subtitle:'',bg:'#21313a',fg:'#f4f7fa',duration:3,transition:'cut'};
const clamp = (v,a,b) => Math.max(a,Math.min(v,b));
const color = (v,d) => /^#[a-fA-F0-9]{6}$/.test(v) ? v : d;
function normalize(arr) {
  if (!Array.isArray(arr) || !arr.length || arr.length>40 || arr.some(x=>!x || typeof x!=='object' || typeof x.title!=='string')) throw Error('1~40개의 컷이 있는 프로젝트만 불러올 수 있어요.');
  return arr.map(s=>({title:s.title.slice(0,180),subtitle:typeof s.subtitle==='string'?s.subtitle.slice(0,120):'',bg:color(s.bg,blank.bg),fg:color(s.fg,blank.fg),duration:Number.isFinite(Number(s.duration))?clamp(Number(s.duration),.5,30):3,transition:opts.includes(s.transition)?s.transition:'cut'}));
}
let cuts=initial, selected=0, pos=0, playing=false, raf=0;
try {const raw=localStorage.getItem(storageKey); if(raw) cuts=normalize(JSON.parse(raw).cuts);} catch {}
const fields=['title','subtitle','bg','fg','duration','transition'];
const note=s=>$('status').textContent=s;
const at=i=>cuts.slice(0,i).reduce((n,s)=>n+s.duration,0), total=()=>at(cuts.length);
function persist(){try{localStorage.setItem(storageKey,JSON.stringify({version:1,cuts}));}catch{}}
function wrap(value,max) {
 const lines=[];
 for (const source of value.split('\n')){
   let line='';
   for(const ch of source){
     if(line && ctx.measureText(line+ch).width>max){lines.push(line.trimEnd());line=ch.trimStart();}
     else line+=ch;
   }
   lines.push(line.trimEnd());
 }
 return lines;
}
function display(s){
 ctx.fillStyle=s.bg; ctx.fillRect(0,0,w,h);
 const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,'#ffffff0c');g.addColorStop(1,'#00000025');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 ctx.fillStyle=s.fg;ctx.textAlign='center';ctx.textBaseline='middle';
 let size=70, lines;
 do {ctx.font='750 '+size+'px system-ui, sans-serif';lines=wrap(s.title,600);if(lines.length<=7)break;size-=3;}while(size>=26);
 const lh=size*1.23, sub=s.subtitle.trim(), center=h*.49-(sub?34:0), y=center-(lines.length-1)*lh/2;
 lines.slice(0,9).forEach((line,i)=>ctx.fillText(line,w/2,y+i*lh));
 if(sub){ctx.font='500 29px system-ui, sans-serif';ctx.globalAlpha*=.86;wrap(sub,560).slice(0,3).forEach((line,i)=>ctx.fillText(line,w/2,y+lines.length*lh+23+i*40));}
}
function layer(s, alpha=1, x=0, scale=1){ctx.save();ctx.globalAlpha=alpha;ctx.translate(x+w/2,h/2);ctx.scale(scale,scale);ctx.translate(-w/2,-h/2);display(s);ctx.restore();}
function draw(time){
 let n=0,start=0;
 while(n<cuts.length-1 && start+cuts[n].duration<=time) start+=cuts[n++].duration;
 const s=cuts[n], trans=Math.min(.65,s.duration*.4);
 const p=clamp((time-start)/trans,0,1), ease=p*p*(3-2*p);
 if(n===0 || p>=1 || s.transition==='cut'){layer(s);return;}
 const prev=cuts[n-1];
 if(s.transition==='fade'){layer(prev);layer(s,ease);}
 else if(s.transition==='slide'){layer(prev,1,-w*ease);layer(s,1,w*(1-ease));}
 else {layer(prev);layer(s,ease,0,.9+.1*ease);}
}
function sync(showSelected=false){ $('seek').max=total(); $('seek').value=pos; $('time').textContent=pos.toFixed(1)+' / '+total().toFixed(1)+'초'; if(showSelected)layer(cuts[selected]);else draw(pos); }
function pause(){playing=false; cancelAnimationFrame(raf);$('play').textContent='재생';}
function toggle(){
 if(playing){pause();return;}
 if(pos>=total()-.02)pos=0;
 playing=true;$('play').textContent='일시정지';const start=performance.now()-pos*1000;
 function tick(now){if(!playing)return;pos=clamp((now-start)/1000,0,total());sync();if(pos<total())raf=requestAnimationFrame(tick);else pause();}
 raf=requestAnimationFrame(tick);
}
function showList(){
 const ol=$('cuts');ol.replaceChildren();
 cuts.forEach((s,i)=>{
  const li=document.createElement('li'), b=document.createElement('button'), title=document.createElement('strong'), info=document.createElement('small');
  b.type='button';b.setAttribute('aria-pressed',i===selected);
  title.textContent=(i+1)+'. '+(s.title.trim().replace(/\s+/g,' ')||'제목 없는 컷');
  info.textContent=s.duration.toFixed(1)+'초 · '+({cut:'컷',fade:'디졸브',slide:'슬라이드',zoom:'줌인'}[s.transition]);
  b.append(title,info);b.addEventListener('click',()=>select(i,true));li.append(b);ol.append(li);
 });
}
function select(i,focus=false){
 pause();selected=clamp(i,0,cuts.length-1);pos=at(selected);
 fields.forEach(k=>$(k).value=cuts[selected][k]);
 $('earlier').disabled=selected===0;$('later').disabled=selected===cuts.length-1;
 $('remove').disabled=cuts.length===1;$('add').disabled=cuts.length===40;
 showList();sync(true);if(focus)$('cuts').children[selected].querySelector('button').focus();
}
fields.forEach(key=>$(key).addEventListener(key==='duration'?'change':'input',()=>{
 const field=$(key); if(key==='duration'){const value=Number(field.value);field.value=field.value && Number.isFinite(value)?Math.round(clamp(value,.5,30)*10)/10:cuts[selected].duration;cuts[selected][key]=Number(field.value);}
 else cuts[selected][key]=field.value;
 pause();pos=at(selected);sync(true);showList();persist();
}));
$('play').addEventListener('click',toggle);
$('seek').addEventListener('input',()=>{pause();pos=Number($('seek').value);sync();});
$('add').addEventListener('click',()=>{if(cuts.length>=40)return;cuts.splice(selected+1,0,{...blank});select(selected+1);persist();$('title').focus();});
$('remove').addEventListener('click',()=>{if(cuts.length===1)return;cuts.splice(selected,1);select(selected,true);persist();});
function move(delta){const next=selected+delta;if(next<0||next>=cuts.length)return;[cuts[selected],cuts[next]]=[cuts[next],cuts[selected]];select(next,true);persist();}
$('earlier').addEventListener('click',()=>move(-1));$('later').addEventListener('click',()=>move(1));
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
$('save').addEventListener('click',()=>{download(new Blob([JSON.stringify({version:1,format:'haman-motion-project',width:w,height:h,cuts},null,2)],{type:'application/json'}),'haman-motion-project.json');note('프로젝트 JSON 다운로드를 시작했어요.');});
$('load').addEventListener('change',async (event)=>{
 const file=event.target.files[0];if(!file)return;
 try{if(file.size>100000)throw Error('100KB 이하 프로젝트 JSON을 선택하세요.');const data=JSON.parse(await file.text());if(data.version!==1)throw Error('지원하는 프로젝트 버전이 아니에요.');cuts=normalize(data.cuts);select(0);persist();note('프로젝트를 불러왔어요.');}
 catch(e){note('불러오지 못했어요: '+(e instanceof SyntaxError?'JSON 형식을 확인하세요.':e.message));}
 finally{event.target.value='';}
});
select(0);
})();
