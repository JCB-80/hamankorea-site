/* Real static entry routes with legacy fragment compatibility. Runs before React. */
(()=>{
 const paths={'/':'home','/index.html':'home','/portfolio/':'portfolio','/apps/':'apps','/products/':'products','/detail-pages/':'details','/services/':'services','/contact/':'contact','/fit/':'fit'};
 const path=location.pathname.replace(/index\.html$/,'');
 const legacy={'products':'/products/','signature-edition-section':'/portfolio/','gallery-workspace':'/portfolio/','app-section':'/apps/','galaxy-app-section':'/apps/','isafe-section':'/apps/','pdp-showcase-section':'/detail-pages/','four-services-section':'/services/','game-development':'/services/','development-inquiry':'/contact/','selected-work':'/','top':'/'};
 let hash;try{hash=decodeURIComponent(location.hash.slice(1))}catch{hash=''}
 const destination=hash.startsWith('sample/')?'/portfolio/':hash.startsWith('products/')?'/products/':legacy[hash];
 if(destination&&destination!==path){location.replace(destination+location.search+location.hash);return;}
 window.HAMAN_PAGE=paths[path]||'home';
 // React renders asynchronously; focus/scroll a retained in-page deep link once mounted.
 if(hash&&!hash.includes('/')){const observer=new MutationObserver(()=>{const el=document.getElementById(hash);if(el){observer.disconnect();el.scrollIntoView({behavior:'instant',block:'start'})}});observer.observe(document,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),5000);}
})();
