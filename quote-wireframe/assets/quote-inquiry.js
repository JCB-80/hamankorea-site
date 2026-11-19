/* Local draft: no network/mail. Never persists contact fields. */
(function(){
'use strict';
var key='haman.quote-inquiry.v1',dialog,opener;
function el(tag,text,cls){var x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x}
function snapshot(){
 var d=window.DY,s=d&&d.app&&d.app.state;if(!s)throw Error('도면을 읽지 못했습니다.');
 var e=d.estimateDoc(s);
 var result={version:1,source:'quote-wireframe',createdAt:new Date().toISOString(),expiresAt:Date.now()+1800000,name:String(s.name||'').slice(0,200),template:s.tpl||null,estimate:{low:e.low,high:e.high,unit:'person-day'},pages:d.allPages(s).map(function(p){return {name:String(p.name||'').slice(0,200),blocks:d.readOrder(p.blocks).map(function(b){return {type:b.type,label:String(b.label||'').slice(0,300),column:b.col,row:b.row,span:b.span,rows:b.rows,level:d.levelOf(b),options:(b.options||[]).slice()}})}})};
 result.summaryMessage='[구상 도면] '+result.name+'\n'+result.pages.map(function(p,i){return (i+1)+'. '+p.name+'\n'+p.blocks.map(function(b){return '- '+b.label+' ('+b.type+', L'+b.level+') 열 '+b.column+' / 행 '+b.row+' / 폭 '+b.span+' / 높이 '+b.rows+' / 옵션 '+(b.options.join(', ')||'없음')}).join('\n')}).join('\n')+'\n예상 공수 '+result.estimate.low.toFixed(1)+'–'+result.estimate.high.toFixed(1)+' 인·일 (확정 견적 아님)';
 if(result.summaryMessage.length>4500)throw Error('도면 요약이 문의 길이 제한을 넘습니다. 페이지를 나누거나 JSON으로 별도 전달해 주세요.');
 if(JSON.stringify(result).length>100000)throw Error('도면이 너무 큽니다. JSON으로 저장해 별도로 전달해 주세요.');
 return result;
}
function close(){dialog.close();if(opener&&opener.isConnected)opener.focus()}
function open(event){
 opener=event.currentTarget;
 var data;try{data=snapshot()}catch(e){window.DY.toast(e.message);return}
 if(!dialog){dialog=el('dialog');dialog.className='quote-inquiry-dialog';dialog.setAttribute('aria-labelledby','quote-inquiry-title');document.body.appendChild(dialog);dialog.addEventListener('close',function(){dialog.replaceChildren();if(opener&&opener.isConnected)opener.focus()});}
 dialog.replaceChildren();
 var head=el('h2','이대로 문의하기');head.id='quote-inquiry-title';dialog.appendChild(head);
 dialog.appendChild(el('p','선택한 도면을 아래 내용으로 준비합니다. 아직 메일이 연결되지 않아 전송할 수 없습니다.','quote-inquiry-note'));
 var summary=el('pre',data.summaryMessage);
 summary.className='quote-inquiry-summary';dialog.appendChild(summary);
 var form=el('form');form.addEventListener('submit',function(e){e.preventDefault()});
 [['contact','연락처 (전화번호 또는 이메일)','text']].forEach(function(v){var label=el('label',v[1]);label.htmlFor='quote-'+v[0];var input=el('input');input.id='quote-'+v[0];input.name=v[0];input.type=v[2];input.maxLength=150;input.autocomplete='off';input.required=true;form.append(label,input)});
 form.appendChild(el('p','연락처는 저장하거나 전송하지 않습니다. 창을 닫으면 지워집니다. 도면 요약만 이 탭에 임시 보관되며 30분간 유효합니다.','quote-inquiry-note'));
 var status=el('p','메일 연결 준비 중 · 전송되지 않았습니다.');status.setAttribute('role','status');status.id='quote-inquiry-status';
 try{sessionStorage.setItem(key,JSON.stringify(data))}catch(e){status.textContent='메일 연결 준비 중 · 이 브라우저에서는 도면 임시 보관도 사용할 수 없습니다.'}
 var send=el('button','메일 연결 준비 중','btn btn-primary');send.type='submit';send.disabled=true;send.setAttribute('aria-describedby',status.id);
 var cancel=el('button','닫기','btn btn-quiet');cancel.type='button';cancel.addEventListener('click',close);
 form.append(status,send,cancel);dialog.appendChild(form);dialog.showModal();cancel.focus();
}
window.HamanQuoteInquiry={storageKey:key,readPreparedMessage:function(){try{var v=JSON.parse(sessionStorage.getItem(key)||'null');if(!v||v.version!==1||Date.now()>v.expiresAt||typeof v.summaryMessage!=='string'||v.summaryMessage.length>4500){sessionStorage.removeItem(key);return null}return v.summaryMessage}catch(e){return null}}};
function button(){var b=el('button','이대로 문의하기','btn btn-primary btn-sm quote-inquiry-cta');b.type='button';b.addEventListener('click',open);return b}
function mount(){
 var app=window.DY&&DY.app;if(!app)return;
 var sheet=document.querySelector('#sheet .sheet-bar-end');
 if(sheet&&!sheet.querySelector('.quote-inquiry-cta'))sheet.prepend(button());
 var rail=document.getElementById('rail');
 if(rail&&app.step===3&&!rail.querySelector('.quote-inquiry-cta')){var wrap=el('div',undefined,'rail-sec');wrap.appendChild(button());rail.appendChild(wrap)}
}
try{var old=JSON.parse(sessionStorage.getItem(key)||'null');if(old&&(!old.expiresAt||Date.now()>old.expiresAt))sessionStorage.removeItem(key)}catch(e){}
new MutationObserver(mount).observe(document.getElementById('builder'),{childList:true,subtree:true});
new MutationObserver(mount).observe(document.getElementById('sheet'),{childList:true,subtree:true});
mount();
})();