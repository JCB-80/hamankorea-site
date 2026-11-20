"use strict";
const $ = (id) => document.getElementById(id);
const roleDefs = [["research","자료 조사"],["strategy","기획"],["design","디자인"],["engineering","개발"],["content","콘티 작성"],["qa","검수"],["delivery","최종 정리"]];
const stateLabel = {queued:"대기",running:"진행 중",completed:"완료",failed:"실패",interrupted:"중단",pending:"대기",done:"완료",error:"실패",waiting:"대기"};
let output = "", running = false;
function txt(tag, value, cls) { const el=document.createElement(tag);el.textContent=value;if(cls)el.className=cls;return el; }
function makeRoles(items=[]) {
  const map=new Map(items.map(x=>[x.id,x]));
  $("roles").replaceChildren(...roleDefs.map(([id,label],n)=>{
    const item=map.get(id), state=item?.status ?? "queued", el=document.createElement("li");
    el.dataset.state=state;el.append(txt("span",String(n+1).padStart(2,"0"),"num"),txt("strong",label),txt("span",stateLabel[state]??state,"state"));return el;
  }));
}
function show(data) {
  makeRoles(data.roles); $("stage").textContent=stateLabel[data.stage]??"대기";
  const completed = data.roles.filter(x=>x.result);
  if(completed.length){
    const rendered = completed.map(x=>{
      const str=typeof x.result==="string"?x.result:JSON.stringify(x.result,null,2);
      const label=roleDefs.find(it=>it[0]===x.id)?.[1]??x.id;
      const div=document.createElement("div");div.className="result-item";div.append(txt("h3",label),txt("pre",str));return {div,label,str};
    });
    $("results").replaceChildren(...rendered.map(x=>x.div));output=rendered.map(x=>x.label+"\n"+x.str).join("\n\n");
    if(data.mode==="simulation")output="[시뮬레이션 · 실제 AI 응답 아님]\n\n"+output;
    $("copy").disabled=false;
  }
}

const samples = [
  "공식 자료와 1차 출처를 먼저 확인하고, 추정은 별도로 표시합니다.",
  "목표·대상·결과물 기준을 정하고, 꼭 필요한 항목부터 배치합니다.",
  "핵심이 한눈에 보이는 레이아웃과 화면별 참고 방향을 잡습니다.",
  "필요한 입력과 출력, 구현 가능 범위, 확인할 의존성을 나눕니다.",
  "질문으로 시작해 단서를 보여준 뒤, 마지막에 답을 제시합니다.",
  "사실과 추정을 구분하고, 결과물이 요청 조건을 충족하는지 확인합니다.",
  "결과물 목록과 남은 확인 사항을 한곳에 모아 전달합니다."
];
const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));
$("brief").addEventListener("input",()=>{$("counter").textContent=$("brief").value.length+" / 2,000";});
$("example").addEventListener("click",()=>{$("brief").value="히메지성의 비하인드 스토리를 소개하는 15초 세로 영상 콘티. 확인된 사실과 재현 장면을 구분하고, 인물 없이 구조를 보여 주세요."; $("brief").dispatchEvent(new Event("input")); $("brief").focus();});
$("job").addEventListener("submit", async (e) => {
  e.preventDefault(); if (running) return;
  const brief = $("brief").value.trim().slice(0, 2000);
  if (!brief) { $("notice").textContent="작업 내용을 입력해 주세요."; return; }
  running=true;output="";$("copy").disabled=true;$("submit").disabled=true;
  $("results").replaceChildren(txt("p","담당별 예시를 준비하고 있어요.","placeholder"));
  const roles = roleDefs.map(([id]) => ({id,status:"queued"}));
  const data = {mode:"simulation",stage:"running",roles};
  const delays = matchMedia("(prefers-reduced-motion: reduce)").matches ? 50 : 280;
  try {
    for (const [i,r] of roles.entries()) {
      r.status="running"; $("notice").textContent=roleDefs[i][1]+" 단계 체험 중"; show(data); await pause(delays);
      r.status="done"; r.result="요청: "+brief.slice(0,180)+(brief.length>180?"…":"")+"\n예시: "+samples[i]; show(data);
    }
    data.stage="completed"; show(data);
    $("notice").textContent="체험이 끝났어요. 결과는 미리 준비된 예시이며 실제 AI 답변이 아닙니다.";
  } finally { running=false; $("submit").disabled=false; }
});
$("submit").disabled=false;
$("copy").addEventListener("click",async()=>{
  if(!output)return;
  try{await navigator.clipboard.writeText(output);$("notice").textContent="결과를 복사했어요.";}
  catch(e){$("notice").textContent="복사가 제한됐어요. 화면에서 결과를 선택해 복사할 수 있습니다.";}
});
makeRoles();
const workshopTools=[["motion.html","모션 프롬프트 사전"],["scenes.html","모션 장면 편집기"],["fonts.html","폰트 정리실"]];
for(const [href,title] of workshopTools){const a=txt("a",title);a.href=href;const li=document.createElement("li");li.append(a);$("tool-list").append(li);}
$("tools").hidden=false;
