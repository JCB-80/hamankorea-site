/* Haman Korea: progressive enhancement, navigation remains usable without animation. */
(()=>{
 const style=document.createElement('style');style.textContent=`
 .hk-page-turn{position:fixed;inset:0;z-index:9999;pointer-events:none;perspective:1800px;overflow:hidden}
 .hk-page-turn-sheet{position:absolute;inset:-2px;background:linear-gradient(90deg,#e5e2d9 0%,#fffef9 5%,#f8f7f2 75%,#dedbd1 100%);transform-origin:left center;backface-visibility:hidden;box-shadow:20px 0 65px #24241f30}
 .hk-page-turn-sheet:after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 3px,#827a6210 4px);opacity:.25}
 @media(prefers-reduced-motion:reduce){.hk-page-turn{display:none}}
 `;document.head.append(style);
 let active=null;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.querySelector('.hk-hero-subnav button[aria-pressed="true"]')!==null;
 function navigate(hash){
  let target;try{target=document.getElementById(decodeURIComponent(hash.slice(1)))}catch{return false}if(!target)return false;
  if(active)active();
  let moved=false,overlay,timer,anim;
  const move=()=>{if(moved)return;moved=true;history.pushState(null,'',hash);const prior=document.documentElement.style.scrollBehavior;document.documentElement.style.scrollBehavior='auto';target.scrollIntoView({behavior:'instant',block:'start'});document.documentElement.style.scrollBehavior=prior;const heading=target.matches('h1,h2,h3')?target:target.querySelector('h1,h2,h3');const focus=heading||target;const prev=focus.getAttribute('tabindex');focus.setAttribute('tabindex','-1');focus.focus({preventScroll:true});focus.addEventListener('blur',()=>{if(prev===null)focus.removeAttribute('tabindex');else focus.setAttribute('tabindex',prev)},{once:true});};
  const finish=()=>{clearTimeout(timer);move();overlay?.remove();anim?.cancel();active=null};
  if(reduced()||!Element.prototype.animate){move();return true}
  overlay=document.createElement('div');overlay.className='hk-page-turn';overlay.setAttribute('aria-hidden','true');const sheet=document.createElement('div');sheet.className='hk-page-turn-sheet';overlay.append(sheet);document.body.append(overlay);
  anim=sheet.animate([{transform:'rotateY(90deg)',opacity:0},{transform:'rotateY(0deg)',opacity:1,offset:.45},{transform:'rotateY(-105deg)',opacity:.95}],{duration:500,easing:'cubic-bezier(.25,.65,.3,1)',fill:'forwards'});
  timer=setTimeout(move,215);active=finish;anim.onfinish=finish;anim.oncancel=()=>overlay.remove();return true;
 }
 window.hamanPageTurn=navigate;
 document.addEventListener('click',e=>{if(e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return;const a=e.target.closest?.('a[href]');if(!a||a.target||a.hasAttribute('download'))return;const url=new URL(a.href,location.href);if(url.origin!==location.origin||url.pathname!==location.pathname||!url.hash)return;if(navigate(url.hash))e.preventDefault();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')active?.()});
})();
