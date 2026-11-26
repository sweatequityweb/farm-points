import {db,deleteField,doc,setDoc,where,writeBatch} from "../firebase.js";
import {A,S} from "../state.js";
import {$,esc,pad} from "../util.js";
/* ---------- pods + availability helpers ---------- */
const natCmp=(a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true});
const isNumPod=p=>/^\d+$/.test(String(p||''));
const podLabel=p=>p?(isNumPod(p)?'Pod '+p:String(p)):'No pod';
const podChip=p=>p?`<span class="chip pod">${esc(podLabel(p))}</span>`:'<span class="chip nopod">No pod</span>';
const podNums=()=>{const t=new Set((S.cfg.pods||[]).map(String));Object.values(S.hh).forEach(h=>{if(isNumPod(h.pod))t.add(String(h.pod))});return[...t].sort((a,b)=>a-b)};
const legacyPods=()=>[...new Set(Object.values(S.hh).map(h=>h.pod).filter(p=>p&&!isNumPod(p)))];
const DAYS=[['Mon','Monday'],['Tue','Tuesday'],['Wed','Wednesday'],['Thu','Thursday'],['Fri','Friday'],['Sat','Saturday'],['Sun','Sunday']];
const slotName=k=>{const[d,t]=k.split('-'),f=DAYS.find(x=>x[0]===d);return f?f[1]+' '+(t==='AM'?'morning':'afternoon'):k};
const slotOrd=k=>{const[d,t]=k.split('-');return DAYS.findIndex(x=>x[0]===d)*2+(t==='PM'?1:0)};
function availLabels(av){const s=new Set(av||[]);return DAYS.flatMap(([d])=>{const a=s.has(d+'-AM'),p=s.has(d+'-PM');return a&&p?[d+' all day']:a?[d+' morning']:p?[d+' afternoon']:[]})}
const availChips=av=>{const L=availLabels(av);return L.length?L.map(l=>`<span class="sch">${l}</span>`).join(''):'<span class="mut">No schedule set</span>'};
const availText=av=>{const L=availLabels(av);return L.length?'Available: '+L.join(', '):'No schedule set'};
const slotGrid=(id,av)=>{const s=new Set(av||[]),P=[['AM','Morning'],['PM','Afternoon']];
  return `<div class="slotw"><div class="slotg"><span></span>${DAYS.map(([d,full])=>`<button type="button" class="sgh" aria-label="Toggle all ${full}" onclick="A.toggleDay('${id}','${d}',this)">${d}</button>`).join('')}${P.map(([t,l])=>`<button type="button" class="sgh" aria-label="Toggle every ${l.toLowerCase()}" onclick="A.toggleRow('${id}','${t}',this)">${t}</button>${DAYS.map(([d,full])=>{const k=d+'-'+t,on=s.has(k);return `<button type="button" class="slot${on?' on':''}" data-k="${k}" aria-pressed="${on}" aria-label="${full} ${l.toLowerCase()}" onclick="A.toggleSlot('${id}',this)">${on?'✓':''}</button>`}).join('')}`).join('')}</div><p class="mut sgs" style="margin:8px 0 4px">${availText(av)}</p><div class="row" style="gap:6px"><button type="button" class="sm ghost" onclick="A.slotPreset('${id}','wk',this)">Weekdays</button><button type="button" class="sm ghost" onclick="A.slotPreset('${id}','we',this)">Weekends</button><button type="button" class="sm ghost" onclick="A.slotPreset('${id}','none',this)">Clear</button></div><p class="mut" style="margin:6px 0 0;font-size:12px">AM = morning, PM = afternoon. Tap a day or AM/PM to toggle a whole column or row. Saves right away.</p></div>`};
function glance(ids,map,card){const n=ids.length,cnt={};ids.forEach(i=>(map[i]?.availability||[]).forEach(k=>cnt[k]=(cnt[k]||0)+1));
  const rows=Object.entries(cnt).sort((a,b)=>b[1]-a[1]||slotOrd(a[0])-slotOrd(b[0]));if(!rows.length)return'';
  const body=rows.map(([k,c])=>`<div style="margin:8px 0"><div class="row sp"><span>${slotName(k)}</span><span class="mut">${c} of ${n}</span></div><div class="bar"><i style="width:${c/n*100}%"></i></div></div>`).join('');
  return card?`<div class="card"><h2>When your pod is free</h2><p class="mut" style="margin-top:0">Times most podmates can come are listed first.</p>${body}</div>`:`<div style="margin-top:12px"><div class="mut"><b>Pod overlap</b></div>${body}</div>`}
const fmt12=t=>{const[h,m]=String(t||'').split(':');if(!h)return'';const n=+h;return((n+11)%12+1)+':'+m+' '+(n<12?'AM':'PM')};
const dayFull=d=>(DAYS.find(x=>x[0]===d)||[])[1]||d;
const winLabel=w=>w?dayFull(w.day)+' '+fmt12(w.start)+' \u2013 '+fmt12(w.end):'';
const winById=id=>id?(S.cfg.windows||[]).find(w=>w.id===id):null;
const winChip=x=>{const w=winById(x.window);return w?`<span class="sch">${esc(winLabel(w))}</span>`:''};
const wSort=(a,b)=>DAYS.findIndex(x=>x[0]===a.day)-DAYS.findIndex(x=>x[0]===b.day)||String(a.start).localeCompare(String(b.start));
const roleName=id=>((S.cfg.roles||[]).find(r=>r.id===id)||{}).name;
const roleChips=hh=>Object.values(S.holders).filter(v=>v.hhId===hh&&roleName(v.roleId)).map(v=>`<span class="chip role">${esc(roleName(v.roleId))}</span>`).join('');
/* Contact lookup: prefer the contacts doc, fall back to legacy fields on the
   household doc (that's where older imports put phone + email). */
const ctc=id=>{const c=S.contacts[id]||{},h=S.hh[id]||{};return{masterEmail:c.masterEmail||h.masterEmail||'',contactNumber:c.contactNumber||h.contactNumber||'',shared:c.shared===true}};
const incoming=()=>{const pod=String(S.hh[S.profile?.householdId]?.pod||'');return S.reqTo.filter(r=>r.status==='pending'&&String(r.pod)===pod&&(r.type==='contact'||(roleName(r.roleId)&&S.holders[r.assignId]?.hhId===r.fromHh)))};
function parseIds(text){const raw=String(text||'').split(/[\s,;]+/).map(t=>t.trim()).filter(Boolean),ids=[],bad=[];
  const norm=t=>{const u=t.toUpperCase();if(S.hh[u])return u;const m=/^H?0*(\d+)$/.exec(u);if(m)for(const c of['H'+pad(m[1]),'H'+m[1]])if(S.hh[c])return c;return null};
  raw.forEach(t=>{const id=norm(t);if(!id)bad.push(t);else if(!ids.includes(id))ids.push(id)});return{ids,bad}}
async function runBatch(fns){for(let i=0;i<fns.length;i+=400){const b=writeBatch(db);fns.slice(i,i+400).forEach(f=>f(b));await b.commit()}}
async function assignPod(map){const ops=[];
  for(const [id,pod] of Object.entries(map)){const moved=String(S.hh[id]?.pod||'')!==String(pod);
    ops.push(b=>b.update(doc(db,'households',id),moved?{pod:pod?pod:deleteField(),window:deleteField()}:{pod:pod?pod:deleteField()}));
    if(moved){if(S.contacts[id])ops.push(b=>b.update(doc(db,'contacts',id),{pod,shared:false}));
      if(S.pp[id])ops.push(b=>b.update(doc(db,'podpoints',id),{pod,shown:false}));
      Object.entries(S.holders).filter(([k,v])=>v.hhId===id&&String(v.pod)!==String(pod)).forEach(([k])=>ops.push(b=>b.delete(doc(db,'roleHolders',k))))}}
  await runBatch(ops)}
const regPods=async l=>{const t=new Set([...(S.cfg.pods||[]),...l].map(String));await setDoc(doc(db,'config','program'),{pods:[...t].sort((a,b)=>a-b)},{merge:true})};
export {DAYS,assignPod,availChips,availLabels,availText,ctc,dayFull,fmt12,glance,incoming,isNumPod,legacyPods,natCmp,parseIds,podChip,podLabel,podNums,regPods,roleChips,roleName,runBatch,slotGrid,slotName,slotOrd,wSort,winById,winChip,winLabel};
