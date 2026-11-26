import {hhName} from "../domain/points.js";
import {A,S} from "../state.js";
import {$,esc,fmtD,fmtT,hrs,inYear,isStaff} from "../util.js";
function logHtml(a,opts={}){
  const low=a.durationHours<2&&a.status==='pending';
  const out=a.status==='approved'&&a.points>0&&!inYear(a);
  const show=!opts.bare&&(!opts.tap||opts.open),tap=opts.tap?` role="button" tabindex="0" aria-expanded="${!!opts.open}" onclick="A.histOpen('${a.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();A.histOpen('${a.id}')}"`:'';
  return `<div class="log${opts.tap?' tap':''}${opts.open?' open':''}" data-s="${a.status}"${tap}><div class="row sp"><b>${opts.hh?esc(hhName(a.hhId))+' · ':''}${fmtD(a.date)}</b><span class="chip ${a.status}">${a.status}${a.status==='approved'?' +'+a.points:''}</span></div>
  <div class="mut">${a.kind==='buyout'?'Buy-out · '+esc(a.item)+' · '+a.days+' day(s) equivalent':fmtT(a.timeIn)+' – '+fmtT(a.timeOut)+' · '+hrs(a.durationHours||0)+(a.note?' · '+esc(a.note):'')}</div>
  ${low?'<span class="chip warn">Under 2 hours: earns 0 points</span>':''}${out?'<span class="chip warn">Outside the program year: not counted</span>':''}${a.autoClosed?'<span class="chip warn">Auto-closed: times need checking</span>':''}${a.reviewNote?`<div class="mut">Reason: ${esc(a.reviewNote)}</div>`:''}${a.guests>0?`<span class="chip pod">${a.guests+1} people worked${a.guestNames?': '+esc(a.guestNames):''}</span>`:''}${show?`<div${opts.tap?' onclick="event.stopPropagation()"':''}>${opts.actions||''}${isStaff()&&a.kind!=='buyout'?`<div><button class="text" onclick="A.editModal('${a.id}')">Edit times or note</button></div>`:''}</div>`:''}</div>`}
const logActs=a=>`<div class="row" style="margin-top:6px">${a.status!=='approved'?`<button class="sm" onclick="A.approve('${a.id}')">Approve</button>`:''}${a.status!=='voided'?`<button class="sm ghost" onclick="A.setStatus('${a.id}','voided')">Void</button>`:''}${a.status!=='pending'?`<button class="sm ghost" onclick="A.setStatus('${a.id}','pending')">Reopen</button>`:''}${S.role==='admin'?`<button class="sm ghost" onclick="A.delLog('${a.id}')">Delete</button>`:''}</div>`;
const unitTxt=u=>u==='pcs'?'pcs':u==='bundle'?'bundles':'kg';
export {logActs,logHtml,unitTxt};
