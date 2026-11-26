import {A,S} from "../state.js";
import {esc,ymd} from "../util.js";
import {DAYS,availChips,fmt12,natCmp,podLabel,slotGrid,wSort,winById,winLabel} from "../domain/pods.js";
/* Weekly schedule built from S.cfg.windows (day + start/end + pod) and each household's window. */
const winPeriod=w=>String(w.start||'08:00')<'12:00'?'AM':'PM';
const winKey=w=>w.day+'-'+winPeriod(w);
function weekDays(off){const s=new Date();s.setHours(0,0,0,0);s.setDate(s.getDate()-((s.getDay()+6)%7)+off*7);
  return DAYS.map(([k,full],i)=>{const d=new Date(s);d.setDate(s.getDate()+i);return{k,full,d,date:ymd(d)}})}
function cellHtml(day,per,today,empty){const W=(S.cfg.windows||[]).filter(w=>w.day===day.k&&winPeriod(w)===per).sort(wSort);
  if(!W.length)return`<span class="wz">${empty}</span>`;
  return W.map(w=>{const ms=Object.keys(S.hh).filter(i=>S.hh[i].window===w.id).sort(natCmp),past=day.date<=today,
    came=past?ms.filter(i=>S.att.some(a=>a.hhId===i&&a.date===day.date&&a.status!=='voided'&&a.kind!=='buyout')).length:0;
    return`<div class="wc${ms.length<2?' thin':''}"${ms.length<2?' title="A window day needs at least 2 households"':''}><b>${fmt12(w.start)}–${fmt12(w.end)}</b><span>${esc(podLabel(w.pod))} · ${past?came+'/'+ms.length+' came':ms.length+' expected'}</span><small>${ms.map(esc).join(' ')||'No households yet'}</small></div>`}).join('')}
function scheduleCard(){const o=S.schedWk||0,days=weekDays(o),today=ymd(new Date()),f=d=>d.toLocaleDateString('en-PH',{month:'short',day:'numeric'}),
  nowin=Object.values(S.hh).filter(h=>h.pod&&!h.window).length,PER=[['AM','Morning'],['PM','Afternoon']],
  head=`<div class="row sp"><h2 style="margin:0">Schedule</h2><div class="row" style="gap:4px"><button class="sm ghost" aria-label="Previous week" onclick="A.schedWk(-1)">‹</button><button class="sm ghost" onclick="A.schedWk(0)">This week</button><button class="sm ghost" aria-label="Next week" onclick="A.schedWk(1)">›</button></div></div><p class="mut" style="margin:4px 0 10px">${f(days[0].d)} – ${f(days[6].d)} · who is expected at the farm</p>`;
  if(!(S.cfg.windows||[]).length)return`<div class="card wide">${head}<p class="mut" style="margin:0">No windows yet. Add them in Settings, under Pods.</p></div>`;
  const table=`<div class="wkt"><div class="wkr hd"><span></span>${days.map(d=>`<span class="${d.date===today?'tdy':''}">${d.k}<small>${d.d.getDate()}</small></span>`).join('')}</div>${PER.map(([p,l])=>`<div class="wkr"><span class="pl">${l}</span>${days.map(d=>`<div class="wcell${d.date===today?' tdy':''}">${cellHtml(d,p,today,'–')}</div>`).join('')}</div>`).join('')}</div>`,
  agenda=`<div class="wagw">${days.map(d=>`<div class="wag${d.date===today?' tdy':''}"><div class="wad"><b>${d.k}</b><small>${f(d.d)}</small></div><div class="wap">${PER.map(([p,l])=>`<div><i>${l}</i>${cellHtml(d,p,today,'No session')}</div>`).join('')}</div></div>`).join('')}</div>`;
  return`<div class="card wide">${head}${table}${agenda}${nowin?`<p class="mut" style="margin:10px 0 0">${nowin} household${nowin===1?' has':'s have'} a pod but no window yet.</p>`:''}</div>`}
/* Household modal: availability + the window it leads to, in one place. */
function schedSection(id,x,adm){const av=new Set(x.availability||[]),w=winById(x.window),
  fits=(S.cfg.windows||[]).filter(v=>String(v.pod)===String(x.pod)&&v.id!==x.window&&av.has(winKey(v))).sort(wSort),
  grid=adm?slotGrid(id,x.availability):`<div class="row" style="gap:6px">${availChips(x.availability)}</div>`;
  const cur=w?`<span class="sch">${esc(winLabel(w))}</span>${adm?` <button class="text" style="min-height:36px" onclick="A.setWindow('${id}','')">Remove</button>`:''}`:'<span class="mut">No window yet</span>';
  const pick=!adm?'':!x.pod?'<p class="mut" style="margin:6px 0 0">Choose a pod first to assign a window.</p>':fits.length?`<div class="mut" style="margin:8px 0 4px">Windows that fit their availability</div><div class="row" style="gap:6px">${fits.map(v=>`<button class="sm ghost" onclick="A.setWindow('${id}','${v.id}')">${esc(winLabel(v))}</button>`).join('')}</div>`:'<p class="mut" style="margin:6px 0 0">No window in this pod matches their availability.</p>';
  return`<label>Available at the farm</label>${grid}<div style="margin-top:12px"><div class="mut">Assigned window</div><div class="row" style="gap:6px;margin-top:4px">${cur}</div>${pick}</div>`}
Object.assign(A,{schedWk:n=>{S.schedWk=n===0?0:(S.schedWk||0)+n;A.r()}});
export {schedSection,scheduleCard,winKey,winPeriod};
