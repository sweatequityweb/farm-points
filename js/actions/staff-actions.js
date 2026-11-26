import {assignPod,podLabel,podNums,regPods} from "../domain/pods.js";
import {hhName,target} from "../domain/points.js";
import {addDoc,collection,db,doc,setDoc,updateDoc} from "../firebase.js";
import {A,S} from "../state.js";
import {open_} from "../ui/render.js";
import {$,esc,guard,pad,toast,uid,ymd} from "../util.js";
const loc=iso=>{const d=new Date(iso);return `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`};
Object.assign(A,{
 cancelIn:guard(async()=>{await updateDoc(doc(db,'users',S.user.uid),{activeClockIn:null});toast('Cancelled')}),
 setPod:guard(async(id,v)=>{v=String(v||'').trim();await assignPod({[id]:v});toast(v?'Moved to '+podLabel(v):'Removed from pod')}),
 addPod:guard(async()=>{const L=podNums().map(Number),n=String((L.length?Math.max(...L):0)+1);S.open.pods=true;S.open['pod'+n]=true;await regPods([n]);toast('Pod '+n+' added')}),
 savePod:guard(async n=>{document.activeElement?.blur?.();
   const raw=($('#pt'+n)?.value??'').split(/[\s,;]+/).map(t=>t.trim()).filter(Boolean);
   const norm=t=>{const u=t.toUpperCase();if(S.hh[u])return u;const m=/^H?0*(\d+)$/.exec(u);if(m)for(const c of['H'+pad(m[1]),'H'+m[1]])if(S.hh[c])return c;return null};
   const ids=[],bad=[];raw.forEach(t=>{const id=norm(t);if(!id)bad.push(t);else if(!ids.includes(id))ids.push(id)});
   if(bad.length)return toast('Not found: '+bad.join(', ')+'. Check the IDs.');
   const cur=Object.keys(S.hh).filter(i=>String(S.hh[i].pod||'')===n),add=ids.filter(i=>!cur.includes(i)),rem=cur.filter(i=>!ids.includes(i));
   if(!add.length&&!rem.length){delete S.podDraft[n];A.r();return toast('No changes to save')}
   const mv=add.filter(i=>S.hh[i].pod);
   if(mv.length&&!confirm(mv.map(i=>i+' is in '+podLabel(S.hh[i].pod)).join('\n')+'\n\nMove '+(mv.length>1?'them':'it')+' to Pod '+n+'?'))return;
   const map={};add.forEach(i=>map[i]=n);rem.forEach(i=>map[i]='');
   await assignPod(map);delete S.podDraft[n];toast('Pod '+n+' saved'+(add.length?' \u00b7 '+add.length+' added':'')+(rem.length?' \u00b7 '+rem.length+' removed':''))}),
 delPod:guard(async n=>{const ms=Object.keys(S.hh).filter(i=>String(S.hh[i].pod||'')===n);
   if(!confirm('Delete Pod '+n+'?'+(ms.length?'\n'+ms.length+' household(s) will be left without a pod.':'')))return;
   const map={};ms.forEach(i=>map[i]='');await assignPod(map);
   await setDoc(doc(db,'config','program'),{pods:(S.cfg.pods||[]).map(String).filter(p=>p!==n)},{merge:true});delete S.podDraft[n];toast('Pod '+n+' deleted')}),
 saveCfg2:guard(async()=>{let terms=(S.td||S.cfg.terms||[]).map((t,i)=>({name:String(t.name||'').trim()||'Term '+(i+1),end:t.end||'',pct:+t.pct||0}));
   const dated=terms.every(t=>t.end);
   if(terms.some(t=>t.end&&!(t.pct>0&&t.pct<=100)))return toast('A term with an end date needs a % from 1 to 100');
   if(dated)terms=terms.sort((a,b)=>a.end>b.end?1:-1);
   if(dated&&terms.length&&terms[terms.length-1].pct!==100&&!confirm('The last term is not 100% of the target. Save anyway?'))return;
   await setDoc(doc(db,'config','program'),{clockOpen:$('#cO').value,clockClose:$('#cC').value,maxShiftHours:+$('#cM').value,terms,slidesUrl:$('#sU').value.trim()},{merge:true});S.td=null;A.r();toast('Saved')}),
 editModal(id){const a=S.att.find(x=>x.id===id);open_(`<h2>Edit log · ${esc(hhName(a.hhId))}</h2><p class="mut">Correct this to the real time they arrived and left.</p><label>Time in</label><input id="eI" type="datetime-local" value="${loc(a.timeIn)}"><label>Time out</label><input id="eO" type="datetime-local" value="${loc(a.timeOut)}"><label>Note</label><input id="eN" value="${esc(a.note)}"><label>People who worked, including the parent (+${S.cfg.guestPoints} per extra person)</label><input id="eG" type="number" min="1" max="${S.cfg.maxGuests+1}" inputmode="numeric" value="${(a.guests||0)+1}"><div class="row" style="margin-top:14px"><button onclick="A.saveEdit('${id}')">Save</button><button class="ghost" onclick="A.close()">Cancel</button></div>`)},
 saveEdit:guard(async id=>{const l=S.att.find(x=>x.id===id),i=new Date($('#eI').value),o=new Date($('#eO').value);if(isNaN(i)||isNaN(o)||o<=i)return toast('Time out must be after time in');
   const dur=Math.round((o-i)/36e3)/100;let p=0;if(l.status==='approved'){p=dur>=2?S.cfg.pointsPerDay:0;if(S.att.some(x=>x.id!==id&&x.hhId===l.hhId&&x.date===ymd(i)&&x.status==='approved'&&x.points>0))p=0}
   const g=Math.min(Math.max((+$('#eG').value||1)-1,0),S.cfg.maxGuests);if(p>0)p+=g*S.cfg.guestPoints;
   await updateDoc(doc(db,'attendance',id),{date:ymd(i),timeIn:i.toISOString(),timeOut:o.toISOString(),durationHours:dur,note:$('#eN').value.trim(),guests:g,points:p,autoClosed:false,editedBy:S.user.email});A.close();toast('Log updated')}),
 buyoutModal(pre=''){const ids=Object.keys(S.hh).sort();open_(`<h2>Record a buy-out</h2><p class="mut">For households who gave materials, skills or services instead of a farm day. It does not add points.</p><label>Household</label><select id="bH">${ids.map(i=>`<option value="${i}"${i===pre?' selected':''}>${i} · ${esc(S.hh[i].name)}</option>`).join('')}</select><label>Date</label><input id="bD" type="date" value="${ymd(new Date())}"><label>What was given or done</label><input id="bI" placeholder="e.g. 20 kg compost, harvest delivery"><label>Work days it covers</label><input id="bN" type="number" step="0.5" value="1"><div class="row" style="margin-top:14px"><button onclick="A.saveBuyout()">Save</button><button class="ghost" onclick="A.close()">Cancel</button></div>`)},
 saveBuyout:guard(async()=>{const hh=$('#bH').value,it=$('#bI').value.trim(),d=$('#bD').value;if(!it||!d)return toast('Add the date and what was given');const t=new Date(d+'T12:00').toISOString();
   await addDoc(collection(db,'attendance'),{hhId:hh,pod:S.hh[hh]?.pod||'',date:d,kind:'buyout',item:it,days:+$('#bN').value,timeIn:t,timeOut:t,durationHours:0,note:it,status:'approved',points:0,loggedBy:S.user.uid,approvedBy:S.user.email});A.close();toast('Buy-out recorded')})
});
export {loc};
