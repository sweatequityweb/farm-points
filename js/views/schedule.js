import {A,S} from "../state.js";
import {esc,ymd} from "../util.js";
import {DAYS,availChips,natCmp,podLabel,podNums,slotGrid,wSort,winById,winLabel} from "../domain/pods.js";
import {open_} from "../ui/render.js";
/* Weekly schedule built from S.cfg.windows (day + start/end + pod) and each household's window. */
const winPeriod=w=>String(w.start||'08:00')<'12:00'?'AM':'PM';
const winKey=w=>w.day+'-'+winPeriod(w);
function weekDays(off){const s=new Date();s.setHours(0,0,0,0);s.setDate(s.getDate()-((s.getDay()+6)%7)+off*7);
  return DAYS.map(([k,full],i)=>{const d=new Date(s);d.setDate(s.getDate()+i);return{k,full,d,date:ymd(d)}})}
const slotOf=a=>{const d=new Date(a.timeIn);return(isNaN(d)?8:d.getHours())<12?'AM':'PM'};
const PERS=[['AM','Morning'],['PM','Afternoon']];
function availMap(){const m={},pod=S.schedPod||'all';Object.entries(S.hh).forEach(([id,h])=>{if(pod!=='all'&&String(h.pod||'')!==pod)return;(h.availability||[]).forEach(k=>(m[k]??=[]).push(id))});Object.values(m).forEach(a=>a.sort(natCmp));return m}
const cameSet=(date,per)=>new Set(S.att.filter(a=>a.date===date&&a.status!=='voided'&&a.kind!=='buyout'&&slotOf(a)===per).map(a=>a.hhId));
function cellHtml(day,per,m,today,max,empty){const n=(m[day.k+'-'+per]||[]).length;if(!n)return`<span class="wz">${empty}</span>`;
  const past=day.date<=today,a=.18+.72*n/max;
  return`<button type="button" class="wsl${n===1?' thin':a>.5?' hi':''}" style="--a:${a.toFixed(2)}" aria-label="${day.full} ${per==='AM'?'morning':'afternoon'}: ${n} household${n===1?'':'s'} available" onclick="A.schedCell('${day.k}','${per}','${day.date}')"><b>${n}</b><span>available</span>${past?`<small>${cameSet(day.date,per).size} came</small>`:''}</button>`}
function scheduleCard(){const o=S.schedWk||0,days=weekDays(o),today=ymd(new Date()),f=d=>d.toLocaleDateString('en-PH',{month:'short',day:'numeric'}),m=availMap(),max=Math.max(1,...Object.values(m).map(a=>a.length)),
  none=Object.values(S.hh).filter(h=>!(h.availability||[]).length).length,pods=podNums(),
  head=`<div class="row sp"><h2 style="margin:0">Schedule</h2><div class="row" style="gap:4px"><button class="sm ghost" aria-label="Previous week" onclick="A.schedWk(-1)">‹</button><button class="sm ghost" onclick="A.schedWk(0)">This week</button><button class="sm ghost" aria-label="Next week" onclick="A.schedWk(1)">›</button></div></div>
  <div class="row sp" style="margin:6px 0 10px;gap:8px"><span class="mut">${f(days[0].d)} – ${f(days[6].d)} · households available at the farm</span>${pods.length>1?`<select aria-label="Pod" style="width:auto;min-height:36px" onchange="A.schedPod(this.value)"><option value="all">All pods</option>${pods.map(n=>`<option value="${n}"${S.schedPod===n?' selected':''}>${esc(podLabel(n))}</option>`).join('')}</select>`:''}</div>`;
  if(Object.keys(m).length===0)return`<div class="card wide">${head}<p class="mut" style="margin:0">No availability set yet. Set it in each household, under “Available at the farm”.</p></div>`;
  const table=`<div class="wkt"><div class="wkr hd"><span></span>${days.map(d=>`<span class="${d.date===today?'tdy':''}">${d.k}<small>${d.d.getDate()}</small></span>`).join('')}</div>${PERS.map(([p,l])=>`<div class="wkr"><span class="pl">${l}</span>${days.map(d=>`<div class="wcell${d.date===today?' tdy':''}">${cellHtml(d,p,m,today,max,'–')}</div>`).join('')}</div>`).join('')}</div>`,
  agenda=`<div class="wagw">${days.map(d=>`<div class="wag${d.date===today?' tdy':''}"><div class="wad"><b>${d.k}</b><small>${f(d.d)}</small></div><div class="wap">${PERS.map(([p,l])=>`<div><i>${l}</i>${cellHtml(d,p,m,today,max,'None')}</div>`).join('')}</div></div>`).join('')}</div>`;
  return`<div class="card wide">${head}${table}${agenda}<p class="mut" style="margin:10px 0 0;font-size:12px">The number is how many households can come. Tap a slot to see who. Amber means only one household, and a work day needs at least two.${none?` ${none} household${none===1?' has':'s have'} not set availability yet.`:''}</p></div>`}
/* Household modal: availability + the window it leads to, in one place. */
function schedSection(id,x,adm){const av=new Set(x.availability||[]),w=winById(x.window),
  fits=(S.cfg.windows||[]).filter(v=>String(v.pod)===String(x.pod)&&v.id!==x.window&&av.has(winKey(v))).sort(wSort),
  grid=adm?slotGrid(id,x.availability):`<div class="row" style="gap:6px">${availChips(x.availability)}</div>`;
  const cur=w?`<span class="sch">${esc(winLabel(w))}</span>${adm?` <button class="text" style="min-height:36px" onclick="A.setWindow('${id}','')">Remove</button>`:''}`:'<span class="mut">No window yet</span>';
  const pick=!adm?'':!x.pod?'<p class="mut" style="margin:6px 0 0">Choose a pod first to assign a window.</p>':fits.length?`<div class="mut" style="margin:8px 0 4px">Windows that fit their availability</div><div class="row" style="gap:6px">${fits.map(v=>`<button class="sm ghost" onclick="A.setWindow('${id}','${v.id}')">${esc(winLabel(v))}</button>`).join('')}</div>`:'<p class="mut" style="margin:6px 0 0">No window in this pod matches their availability.</p>';
  return`<label>Available at the farm</label>${grid}<div style="margin-top:12px"><div class="mut">Assigned window</div><div class="row" style="gap:6px;margin-top:4px">${cur}</div>${pick}</div>`}
Object.assign(A,{schedPod:v=>{S.schedPod=v;A.r()},
 schedCell:(k,per,date)=>{const ids=(availMap()[k+'-'+per]||[]),past=date<=ymd(new Date()),ca=cameSet(date,per),day=DAYS.find(x=>x[0]===k)[1];
  open_(`<div class="row sp"><h2 style="margin:0">${day} ${per==='AM'?'morning':'afternoon'}</h2><button class="text" onclick="A.close()">Close</button></div><p class="mut">${ids.length} household${ids.length===1?'':'s'} available${past?' · '+ca.size+' came on '+date:''}</p>${ids.map(i=>`<div class="log row sp"><div><b>${esc(i)}</b> ${esc(S.hh[i].name||'')}<div class="mut">${esc(podLabel(S.hh[i].pod))}</div></div><div class="row" style="gap:6px">${past?`<span class="chip ${ca.has(i)?'approved':'nopod'}">${ca.has(i)?'Came':'No log'}</span>`:''}<button class="sm ghost" onclick="A.hhModal('${i}')">Open</button></div></div>`).join('')}`)},
 schedWk:n=>{S.schedWk=n===0?0:(S.schedWk||0)+n;A.r()}});
export {schedSection,scheduleCard,winKey,winPeriod};
