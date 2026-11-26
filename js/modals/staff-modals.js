import {schedSection} from "../views/schedule.js";
import {loc} from "../actions/staff-actions.js";
import {availChips,ctc,isNumPod,podLabel,podNums,roleChips,slotGrid,wSort,winById,winLabel} from "../domain/pods.js";
import {pts,target} from "../domain/points.js";
import {A,S} from "../state.js";
import {open_} from "../ui/render.js";
import {$,esc,inYear,pad,ymd} from "../util.js";
import {logHtml} from "../views/logs.js";
import {paceDetail} from "../views/pace.js";
import {termRows} from "../views/parent.js";
function hhModal(id){
  const x=S.hh[id]||{},c_=ctc(id),logs=S.att.filter(a=>a.hhId===id).sort((a,b)=>b.timeIn>a.timeIn?1:-1),adm=S.role==='admin';
  const outPts=logs.filter(a=>a.status==='approved'&&!inYear(a)).reduce((s,a)=>s+(a.points||0),0);
  open_(`<div class="row sp"><h2 style="margin:0">${id} · ${esc(x.name)}</h2><button class="text" onclick="A.close()">Close</button></div>
  <p class="mut">${esc(x.barangay||'')}<br>${esc(c_.masterEmail||'no email on record')} · ${esc(c_.contactNumber||'')}<br><b>${pts(id)}</b> / ${target(x)} points</p>${outPts?`<p class="mut" style="color:var(--pend);margin:0 0 8px">${outPts} approved point(s) fall outside the program year and are not counted.</p>`:''}${paceDetail(x,pts(id))}${termRows(id,x)}
  ${adm?`<label>Target type</label><select onchange="A.setTarget('${id}',this.value)"><option value="standard"${x.targetType!=='adjusted'?' selected':''}>Standard (${S.cfg.targetStandard})</option><option value="adjusted"${x.targetType==='adjusted'?' selected':''}>Adjusted (${S.cfg.targetAdjusted})</option></select>`:''}
  ${adm?`<label for="hp1">Pod</label><select id="hp1" onchange="A.setPod('${id}',this.value)"><option value="">No pod</option>${[...podNums(),...(x.pod&&!isNumPod(x.pod)?[x.pod]:[])].map(n=>`<option value="${esc(n)}"${String(x.pod||'')===n?' selected':''}>${esc(podLabel(n))}</option>`).join('')}</select>`:`<p class="mut">${esc(podLabel(x.pod))}</p>`}
  ${roleChips(id)?`<div class="row" style="margin-top:10px">${roleChips(id)}</div>`:''}
  ${schedSection(id,x,adm)}
  <div class="row" style="margin:12px 0"><button class="sm" onclick="A.manualModal('${id}')">+ Add log</button><button class="sm ghost" onclick="A.buyoutModal('${id}')">Buy-out</button><button class="sm ghost" onclick="A.plantModal('${id}')">Plantings</button></div>
  ${logs.map(a=>logHtml(a,{actions:`<div class="row" style="margin-top:6px">${a.status!=='approved'?`<button class="sm" onclick="A.approve('${a.id}')">Approve</button>`:''}${a.status!=='voided'?`<button class="sm ghost" onclick="A.setStatus('${a.id}','voided')">Void</button>`:''}${a.status!=='pending'?`<button class="sm ghost" onclick="A.setStatus('${a.id}','pending')">Reopen</button>`:''}${adm?`<button class="sm ghost" onclick="A.delLog('${a.id}')">Delete</button>`:''}</div>`})).join('')||'<p class="mut">No logs yet.</p>'}`,()=>hhModal(id));
}
function manualModal(pre=''){
  const now=new Date(),ids=Object.keys(S.hh).sort(),loc=d=>`${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const a=new Date(now);a.setHours(8,0,0,0);const b=new Date(now);b.setHours(10,0,0,0);
  open_(`<h2>Add a log</h2><label>Household</label><select id="mH">${ids.map(i=>`<option value="${i}"${i===pre?' selected':''}>${i} · ${esc(S.hh[i].name)}</option>`).join('')}</select>
  <label>Time in</label><input id="mI" type="datetime-local" value="${loc(a)}"><label>Time out</label><input id="mO" type="datetime-local" value="${loc(b)}">
  <label>Note</label><input id="mN" placeholder="e.g. Weeding (forgot to clock out)"><label>People who worked, including the parent (+${S.cfg.guestPoints} per extra person)</label><input id="mG" type="number" min="1" max="${S.cfg.maxGuests+1}" inputmode="numeric" value="1">
  <label class="row" style="color:var(--txt);font-size:15px"><input id="mA" type="checkbox" checked style="width:24px;min-height:24px"> Approve right away</label>
  <p class="mut" style="margin:8px 0 0">If the date falls outside the open program year, the points will not count toward the household total.</p>
  <div class="row" style="margin-top:14px"><button onclick="A.saveManual()">Save log</button><button class="ghost" onclick="A.close()">Cancel</button></div>`);
}
export {hhModal,manualModal};
