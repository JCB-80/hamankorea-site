/* Haman Korea: progressive enhancement, navigation remains usable without animation. */
(()=>{
 const style=document.createElement('style');style.textContent=`
 .hk-page-turn{position:fixed;inset:0;z-index:9999;pointer-events:none;perspective:1800px;overflow:hidden}
 .hk-page-turn-sheet{position:absolute;inset:-2px;background:linear-gradient(90deg,#e5e2d9 0%,#fffef9 5%,#f8f7f2 75%,#dedbd1 100%);transform-origin:left center;backface-visibility:hidden;box-shadow:20px 0 65px #24241f30}
 .hk-page-turn-sheet:after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 3px,#827a6210 4px);opacity:.25}
 @media(prefers-reduced-motion:reduce){.hk-page-turn{display:none}}
 `;document.head.append(style);
 let active=null;
 const key='hamanPageIndex';
 let index=Number.isInteger(history.state?.[key])?history.state[key]:0;
 history.replaceState({...history.state,[key]:index},'');
 const back=document.createElement('button');back.type='button';back.className='hk-page-back';back.textContent='← 이전 장';back.setAttribute('aria-label','이전 장으로 돌아가기');back.style.cssText='position:fixed;right:18px;bottom:20px;z-index:1000;border:1px solid #ccc9bd;border-radius:99px;background:#fffef9;color:#34382f;padding:13px 18px;box-shadow:0 4px 24px #0001;cursor:pointer;font:inherit';back.hidden=index<=0;back.onclick=()=>history.back();document.body.append(back);

 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.querySelector('.hk-hero-subnav button[aria-pressed="true"]')!==null;
 function navigate(hash,options={}){
  let target;try{target=document.getElementById(decodeURIComponent(hash.slice(1))||'top')}catch{return false}if(!target)return false;
  if(active)active(false);
  if(!options.restore&&location.hash!==hash){index++;history.pushState({...history.state,[key]:index},'',hash);back.hidden=false;}
  let moved=false,overlay,timer,anim;
  const move=()=>{if(moved)return;moved=true;const prior=document.documentElement.style.scrollBehavior;document.documentElement.style.scrollBehavior='auto';target.scrollIntoView({behavior:'instant',block:'start'});document.documentElement.style.scrollBehavior=prior;const heading=target.matches('h1,h2,h3')?target:target.querySelector('h1,h2,h3');const focus=heading||target;const prev=focus.getAttribute('tabindex');focus.setAttribute('tabindex','-1');focus.focus({preventScroll:true});focus.addEventListener('blur',()=>{if(prev===null)focus.removeAttribute('tabindex');else focus.setAttribute('tabindex',prev)},{once:true});};
  const finish=(complete=true)=>{clearTimeout(timer);if(complete)move();overlay?.remove();if(anim){anim.onfinish=null;anim.cancel()}active=null};
  if(reduced()||!Element.prototype.animate){move();return true}
  overlay=document.createElement('div');overlay.className='hk-page-turn';overlay.setAttribute('aria-hidden','true');const sheet=document.createElement('div');sheet.className='hk-page-turn-sheet';overlay.append(sheet);document.body.append(overlay);
  if(options.reverse)sheet.style.transformOrigin='right center';
  const direction=options.reverse?-1:1;
  anim=sheet.animate([{transform:`rotateY(${90*direction}deg)`,opacity:0},{transform:'rotateY(0deg)',opacity:1,offset:.45},{transform:`rotateY(${-105*direction}deg)`,opacity:.95}],{duration:500,easing:'cubic-bezier(.25,.65,.3,1)',fill:'forwards'});
  timer=setTimeout(move,215);active=finish;anim.onfinish=finish;anim.oncancel=()=>overlay.remove();return true;
 }
 window.hamanPageTurn=navigate;
 window.addEventListener('popstate',()=>{
  const next=Number.isInteger(history.state?.[key])?history.state[key]:0;
  const reverse=next<=index;index=next;back.hidden=index<=0;
  if(active)active(false);
  navigate(location.hash,{restore:true,reverse});
 });
 document.addEventListener('click',e=>{if(e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return;const a=e.target.closest?.('a[href]');if(!a||a.target||a.hasAttribute('download'))return;const url=new URL(a.href,location.href);if(url.origin!==location.origin||url.pathname!==location.pathname||!url.hash)return;if(navigate(url.hash))e.preventDefault();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')active?.()});
})();
