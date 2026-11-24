import {standing} from "../domain/pace.js";
import {availText,ctc,legacyPods,podChip,podNums,roleChips,winChip} from "../domain/pods.js";
import {hhName,target} from "../domain/points.js";
import {SORTS,hhSorted} from "../domain/sync.js";
import {app} from "../firebase.js";
import {hhModal,manualModal} from "../modals/staff-modals.js";
import {A,S} from "../state.js";
import {navBtn} from "../ui/icons.js";
import {$,esc} from "../util.js";
import {podsPanel,privacyNotice,rolesPanel} from "./admin-pods.js";
import {dashView} from "./dashboard.js";
import {farmView} from "./farm.js";
import {historyView} from "./history.js";
import {logHtml} from "./logs.js";
import {settingsHtml} from "./settings.js";
function staffView(){
  const ae=document.activeElement;if((S.tab==='settings'||S.tab==='households')&&ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)&&ae.type!=='file'&&$('#app').contains(ae))return;
  const pendL=S.att.filter(a=>a.status==='pending').sort((a,b)=>a.timeIn>b.timeIn?1:-1);
  const pendU=S.users.filter(u=>u.status==='pending');
  const n=pendL.length+pendU.length,adm=S.role==='admin';
  const tabs=adm?[['dash','Dashboard','dash'],['approvals','Approvals','check',n],['households','Households','people'],['history','History','history'],['farm','Farm','eco',0,1],['users','Users','person',0,1],['settings','Settings','tune',0,1]]:[['approvals','Approvals','check',n],['households','Households','people'],['farm','Farm','eco'],['history','History','history']];
  if(!tabs.some(t=>t[0]===S.tab))S.tab=adm?'dash':'approvals';
  $('#nav').innerHTML=tabs.map(([k,l,i,b,sec])=>navBtn(l,i,S.tab===k,`S_.tab='${k}';A.r()`,b,sec?'sec':'')).join('')+(adm?navBtn('More','more',tabs.some(t=>t[4]&&t[0]===S.tab),'A.moreMenu()',0,'more'):'');
  let h='';
  if(S.tab==='approvals'){
    h+=`<div class="row sp" style="margin-bottom:12px"><h2 style="margin:0">${n?n+' waiting for review':'All caught up'}</h2><span class="row"><button class="ghost" onclick="A.buyoutModal()">Buy-out</button><button onclick="A.manualModal()">+ Add log</button></span></div>`;
    if(pendU.length)h+=`<div class="card"><h2>Households requesting access</h2>${pendU.map(u=>userRow(u)).join('')}</div>`;
    h+=`<div class="card"><h2>Pending logs</h2>${pendL.length?pendL.map(a=>logHtml(a,{hh:1,actions:`<div class="row" style="margin-top:8px"><button class="sm" onclick="A.approve('${a.id}')">Approve</button><button class="sm ghost" onclick="A.setStatus('${a.id}','voided')">Void</button></div>`})).join(''):'<p class="mut">No pending logs.</p>'}</div>`;
  }else if(S.tab==='households'){
    const {ids:list,P}=hhSorted(),total=Object.keys(S.hh).length,hs=S.hsort||'id',hp=S.hpod||'all';
    if(adm)h+=privacyNotice()+podsPanel()+rolesPanel();
    const popt=[['all','All households'],['none','No pod yet'],...podNums().map(n=>[n,'Pod '+n]),...legacyPods().map(n=>[n,n])];
    h+=`<div class="card"><h2>Households (${list.length}${list.length!==total?' of '+total:''})</h2>
    <div class="row" style="flex-wrap:nowrap;align-items:flex-end;margin-bottom:6px"><div class="grow" style="min-width:0"><label for="hs" style="margin-top:0">Sort by</label><select id="hs" onchange="this.blur();S_.hsort=this.value;A.r()">${Object.entries(SORTS).map(([k,l])=>`<option value="${k}"${hs===k?' selected':''}>${l}</option>`).join('')}</select></div><div class="grow" style="min-width:0"><label for="hp" style="margin-top:0">Show</label><select id="hp" onchange="this.blur();S_.hpod=this.value;A.r()">${popt.map(([k,l])=>`<option value="${esc(k)}"${hp===k?' selected':''}>${esc(l)}</option>`).join('')}</select></div></div>
    ${list.length?list.map(id=>{const x=S.hh[id],p=P[id],t=target(x),[st,c]=standing(x,p);
      return `<div class="log" onclick="A.hhModal('${id}')" style="cursor:pointer"><div class="row sp"><b>${id} \u00b7 ${esc(x.name)}</b><span class="chip ${c}">${st}</span></div><div class="mut">${esc(x.barangay||'')} \u00b7 ${p}/${t} pts${x.targetType==='adjusted'?' \u00b7 adjusted':''}</div><div class="row" style="gap:6px;margin:4px 0 2px">${podChip(x.pod)}${winChip(x)}${roleChips(id)}</div><div class="mut" style="margin-bottom:6px">${availText(x.availability)}</div><div class="bar"><i style="width:${Math.min(100,p/t*100)}%"></i></div></div>`}).join(''):(total?'<p class="mut">No households match this filter.</p>':'<p class="mut">No households yet.'+(adm?' Import the Excel file in Settings.':'')+'</p>')}</div>`;
  }else if(S.tab==='dash'){h+=dashView();
  }else if(S.tab==='history'){h+=historyView();
  }else if(S.tab==='farm'){h+=farmView();
  }else if(S.tab==='users'){
    const ps=S.users.filter(u=>u.role==='parent');
    h+=`<div class="card"><h2>Household accounts</h2>${ps.length?ps.map(u=>userRow(u,true)).join(''):'<p class="mut">No sign-ins yet.</p>'}</div>`;
  }else{
    h+=settingsHtml();
  }
  $('#app').innerHTML=h;
}
function userRow(u,all){
  const hh=S.hh[u.householdId],me_=ctc(u.householdId).masterEmail,ok=me_&&me_.toLowerCase()===(u.email||'').toLowerCase();
  return `<div class="log"><div class="row sp"><b>${esc(u.email)}</b><span class="chip ${u.status==='active'?'approved':'pending'}">${u.status}</span></div>
  <div class="mut">Claims ${esc(u.householdId)} · ${esc(hhName(u.householdId))}</div>
  <div style="font-size:13px;color:${ok?'var(--ok)':'var(--pend)'}">${ok?'✓ Matches the email on record':'⚠ Doesn\'t match the email on record'+(me_?' ('+esc(me_)+')':'')}</div>
  <div class="row" style="margin-top:8px">${u.status==='pending'?`<button class="sm" onclick="A.userSet('${u.id}','active')">Approve</button><button class="sm ghost" onclick="A.userDel('${u.id}')">Reject</button>`:S.role==='admin'?`<button class="sm ghost" onclick="A.userDel('${u.id}')">Remove access</button>`:''}</div></div>`}
export {staffView,userRow};
