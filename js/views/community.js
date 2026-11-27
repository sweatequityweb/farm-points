import {S} from "../state.js";
import {$,yLabel} from "../util.js";
import {farmCard} from "./farm.js";
import {scheduleCard} from "./schedule.js";
/* What every household can see: totals and the weekly schedule, from the summary document (no names or IDs). */
function communityView(){const s=S.sum;
  if(!s)return $('#app').innerHTML=`<div class="card"><h2>Community</h2><p class="mut">The community summary is not ready yet. It appears after the Farm Liaison or Admin opens the app.</p></div>`;
  const st=s.standing||{},ok=(st.ahead||0)+(st.on||0),H=s.households||1,pc=n=>(n/H*100).toFixed(1);
  $('#app').innerHTML=`<div class="card"><h2>Our community${s.year?' · '+yLabel(s.year):''}</h2><div class="stats"><div><b>${s.households}</b><span>households</span></div><div><b>${s.workDays}</b><span>work days done</span></div><div><b>${s.hours}</b><span>hours of farm work</span></div></div></div>
  <div class="card"><h2>How are we doing?</h2><p style="margin:0 0 10px;font-size:1.1em"><b>${ok}</b> of <b>${s.households}</b> households are on track.</p><div class="stack" role="img" aria-label="${ok} on track, ${st.catch||0} catching up, ${st.help||0} need support"><i style="width:${pc(ok)}%;background:var(--pri)"></i><i style="width:${pc(st.catch||0)}%;background:#f9a825"></i><i style="width:${pc(st.help||0)}%;background:#e57373"></i></div><div class="row" style="gap:6px;margin-top:8px"><span class="chip approved">${ok} on track</span><span class="chip pending">${st.catch||0} catching up</span><span class="chip voided">${st.help||0} need support</span></div></div>
  ${scheduleCard()}${farmCard()}<p class="mut" style="text-align:center">Updated ${new Date(s.updatedAt||Date.now()).toLocaleString('en-PH',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</p>`}
export {communityView};
