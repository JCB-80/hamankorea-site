(() => {
  'use strict';
  const motions = [
    ['rise', '위로 등장', '등장', '↑', '아래에서 올라오며 천천히 선명해지는 기본 등장입니다.', '대상을 아래쪽에서 위로 이동시키면서 불투명도를 0에서 100%로 올리고 제자리에 안착시킨다.', '위,미끄러짐,슬라이드,slide up'],
    ['fade', '부드러운 페이드', '등장', '◐', '위치와 크기는 고정하고 투명도만 바꿉니다.', '대상의 위치와 크기를 고정한 채 불투명도를 0에서 100%로 높인다.', '투명도,등장,fade'],
    ['left', '왼쪽에서 진입', '등장', '→', '좌측에서 수평으로 들어와 한 자리에서 멈춥니다.', '대상을 왼쪽에서 오른쪽으로 수평 이동시키고 지정한 위치에서 정확히 멈춘다.', '좌,우,슬라이드,slide'],
    ['pop', '팝업', '강조', '✦', '작은 상태에서 빠르게 커지고 한 차례 넘었다가 돌아옵니다.', '작게 시작해 정상 크기를 살짝 넘겼다가 원래 비율로 한 번만 돌아온다.', '스케일,팝,zoom,pop'],
    ['pulse', '호흡 강조', '강조', '◉', '중심을 고정하고 서서히 커졌다 작아집니다.', '중심점을 고정하고 한 번 커졌다가 원래 크기로 돌아온다.', '크기,펄스,맥박,pulse'],
    ['shake', '짧은 흔들림', '강조', '≈', '양쪽으로 작은 진동을 몇 번 주고 중립 위치로 돌아옵니다.', '수평으로 짧게 좌우 진동시킨 뒤 흔들림을 줄여 시작 위치에서 멈춘다.', '진동,경고,shake'],
    ['focus', '초점 드러내기', '등장', '◎', '흐린 초점이 자연스럽게 풀리고 대상이 또렷해집니다.', '대상을 흐린 초점으로 시작하고 위치를 움직이지 않은 채 점차 또렷하게 만든다.', '블러,선명,초점,focus'],
    ['wipe', '선형 마스크', '전환', '◩', '움직이는 경계선으로 대상의 왼쪽부터 드러냅니다.', '위치 고정 상태에서 수직 마스크만 왼쪽에서 오른쪽으로 이동시켜 대상을 드러낸다.', '마스크,리빌,전환,wipe,reveal'],
    ['flip', '입체 회전', '전환', '↻', '세로축으로 회전하면서 뒤집힌 면이 정면을 향합니다.', '대상을 Y축으로 돌려 옆면에서 시작하고 앞면이 정면으로 보일 때 안착시킨다.', '3d,플립,회전,flip'],
    ['stagger', '순차 등장', '전환', '···', '세 요소를 시간차로 움직여 시선이 왼쪽에서 오른쪽으로 이어집니다.', '세 요소를 왼쪽부터 짧은 간격을 두고 차례로 올려서 나타낸다.', '딜레이,지연,스태거,stagger'],
    ['drift', '슬로우 줌', '카메라', '⌕', '화면 중앙을 향해 천천히 다가가는 느낌입니다.', '카메라를 화면 중앙의 관심 대상 쪽으로 천천히 이동시켜 서서히 확대한다.', '푸시인,확대,줌,dolly in,zoom'],
    ['tilt', '대각선 틸트', '카메라', '↗', '측면 이동과 약한 각도 변화를 한 번에 보여줍니다.', '화면을 대각선으로 작게 이동시키면서 미세하게 기울이고 대상이 중앙을 벗어나지 않게 한다.', '기울기,이동,pan,tilt']
  ].map(([id,name,category,symbol,description,instruction,tags]) => ({id,name,category,symbol,description,instruction,tags}));
  const $ = id => document.getElementById(id);
  const demo = $('demo');
  const categories = ['전체', ...new Set(motions.map(item => item.category))];
  const easeNames = {'ease-out':'감속','ease-in-out':'가속 후 감속','ease-in':'가속','linear':'일정'};
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = motions[0], filter = '전체', tracks = [], step = 0, playing = false, token = 0, req = 0;
  const durationMs = () => Math.round(Number($('duration').value) * 1000);

  function frames(id, strength){
    const f = strength / 100;
    const tx = (x,y) => `translate(${x}px,${y}px)`;
    const scaling = scale => `scale(${scale})`;
    switch(id){
      case 'rise': return [{transform:tx(0,90*f),opacity:0},{transform:tx(0,0),opacity:1}];
      case 'fade': return [{opacity:0},{opacity:.50,offset:.35+.30*f},{opacity:1}];
      case 'left': return [{transform:tx(-166*f,0),opacity:0},{transform:tx(0,0),opacity:1}];
      case 'pop': return [{transform:scaling(1-.73*f),opacity:.4},{transform:scaling(1+.28*f),opacity:1,offset:.71},{transform:scaling(1),opacity:1}];
      case 'pulse': return [{transform:scaling(1)},{transform:scaling(1+.44*f),offset:.52},{transform:scaling(1)}];
      case 'shake': return [0,-17,17,-12,12,-5,5,0].map(x=>({transform:tx(x*f,0)}));
      case 'focus': return [{filter:`blur(${20*f}px)`,opacity:.24},{filter:'blur(0px)',opacity:1}];
      case 'wipe': return [{clipPath:'inset(0% 100% 0% 0%)'},{clipPath:'inset(0% 50% 0% 0%)',offset:.35+.30*f},{clipPath:'inset(0% 0% 0% 0%)'}];
      case 'flip': return [{transform:`rotateY(${-100*f}deg)`,opacity:.35},{transform:`rotateY(${12*f}deg)`,opacity:1,offset:.8},{transform:'rotateY(0deg)',opacity:1}];
      case 'stagger': return [];
      case 'drift': return [{transform:scaling(1-.3*f)},{transform:scaling(1+.82*f)}];
      case 'tilt': return [{transform:`${tx(-47*f,36*f)} rotate(${-13*f}deg)`},{transform:`${tx(35*f,-21*f)} rotate(${6*f}deg)`}];
      default: return [];
    }
  }

  function select(item){
    active = item;
    $('selected-title').textContent = item.name;
    $('description').textContent = item.description;
    $('category').textContent = item.category;
    demo.className = 'demo is-' + item.id;
    document.querySelectorAll('.preset').forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.id === active.id)));
    recreate(reducedMotion.matches ? 1 : 0);
    if(!reducedMotion.matches) run();
  }

  function renderList(){
    const q = $('search').value.trim().toLowerCase();
    const matching = motions.filter(item => (filter === '전체' || item.category === filter) && (!q || q.split(/\s+/u).every(t=>[item.name,item.category,item.description,item.tags].join(' ').toLowerCase().includes(t))));
    $('count').textContent = `${matching.length}개`;
    $('empty').hidden = !!matching.length;
    $('presets').replaceChildren(...matching.map(item => {
      const btn = document.createElement('button');
      btn.className='preset';
      btn.type='button';
      btn.dataset.id=item.id;
      btn.setAttribute('aria-pressed',String(item.id===active.id));
      const symbol=document.createElement('span');
      symbol.className='symbol';
      symbol.setAttribute('aria-hidden','true');
      symbol.textContent=item.symbol;
      const name=document.createElement('span');
      name.textContent=item.name;
      btn.append(symbol,name);
      btn.addEventListener('click',()=>select(item));
      return btn;
    }));
  }

  const localBase = () => ({duration:durationMs(), easing:$('easing').value, fill:'both'});
  function recreate(pos){
    pause();
    tracks.forEach(anim=>anim.cancel());
    tracks=[];
    const strength=Number($('strength').value), f=strength/100;
    demo.style.removeProperty('transform');
    if(active.id === 'stagger'){
      const dots=demo.querySelectorAll('.dot');
      dots.forEach((dot,i)=>{
        const start=.20*i, motion=[];
        if(start>0) motion.push({offset:0,transform:`translateY(${63*f}px)`,opacity:0});
        motion.push({offset:start,transform:`translateY(${63*f}px)`,opacity:0},{offset:start+.55,transform:'translateY(0px)',opacity:1});
        motion.push({offset:1,transform:'translateY(0px)',opacity:1});
        tracks.push(dot.animate(motion,localBase()));
      });
    } else {
      tracks=[demo.animate(frames(active.id,strength),localBase())];
    }
    tracks.forEach(anim=>anim.pause());
    show(pos);
    const length=(durationMs()/1000).toFixed(1);
    $('duration-value').textContent=`${length}초`;
    $('strength-value').textContent=`${strength}%`;
    $('prompt-text').value=`[${active.name}] ${active.instruction}\n길이: ${length}초 · 강도: ${strength}% · 속도 곡선: ${easeNames[$('easing').value]} · ${$('repeat').checked?'반복 재생':'1회 재생'}\n원본의 배경과 구도를 유지하고, 설정한 움직임만 적용한다.`;
    $('copy-status').textContent='';
  }

  function show(pos){
    step=Math.max(0,Math.min(1,pos));
    const millis=durationMs()*step;
    tracks.forEach(anim=>{anim.currentTime=millis;});
    $('seek').value=Math.round(1000*step);
    $('seek').setAttribute('aria-valuetext',`${(millis/1000).toFixed(2)}초`);
    $('position').value=`${(millis/1000).toFixed(2)}초`;
  }
  function pause(){
    token++;
    if(req) cancelAnimationFrame(req);
    req=0;playing=false;
    $('play').textContent='재생';
  }
  function run(){
    if(playing) return;
    if(step>=1) show(0);
    playing=true; $('play').textContent='일시정지';
    const thisToken=++token;
    const from=step*durationMs();
    let start=null;
    function advance(now){
      if(thisToken!==token) return;
      if(start===null) start=now;
      const p=(from+now-start)/durationMs();
      if(p>=1 && !$('repeat').checked){show(1);pause();return;}
      show($('repeat').checked?p%1:p);
      req=requestAnimationFrame(advance);
    }
    req=requestAnimationFrame(advance);
  }
  async function copy(){
    const prompt=$('prompt-text');
    try {
      await navigator.clipboard.writeText(prompt.value);
      $('copy-status').textContent='프롬프트를 복사했어요.';
    } catch {
      prompt.focus(); prompt.select();
      $('copy-status').textContent='직접 복사하려면 Ctrl+C 또는 ⌘C를 누르세요.';
    }
  }
  categories.forEach(name=>{
    const b=document.createElement('button');
    b.type='button';b.textContent=name;
    b.setAttribute('aria-pressed',String(name===filter));
    b.addEventListener('click',()=>{
      filter=name;
      Array.from($('filters').children).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
      renderList();
    });
    $('filters').append(b);
  });
  $('search').addEventListener('input',renderList);
  $('seek').addEventListener('input',()=>{pause();show(Number($('seek').value)/1000);});
  $('play').addEventListener('click',()=>playing?pause():run());
  $('reset').addEventListener('click',()=>{pause();show(0);});
  ['duration','strength','easing','repeat'].forEach(id=>{
    $(id).addEventListener(id==='easing'||id==='repeat'?'change':'input',()=>{
      const prev=playing;recreate(step);
      if(prev) run();
    });
  });
  $('copy').addEventListener('click',copy);
  reducedMotion.addEventListener?.('change',()=>{if(reducedMotion.matches)pause();});
  renderList(); select(active);
})();
