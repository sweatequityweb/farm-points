import {HDEST,cap1,cropList,cropsCat} from "../domain/farm.js";
import {natCmp,runBatch} from "../domain/pods.js";
import {r2} from "../domain/points.js";
import {addDoc,collection,db,deleteDoc,doc,setDoc,writeBatch} from "../firebase.js";
import {A,S} from "../state.js";
import {open_} from "../ui/render.js";
import {$,esc,guard,isStaff,toast,ymd} from "../util.js";
import {plantRows} from "../views/farm.js";
Object.assign(A,{
 harvestModal(){open_(`<h2>Record a harvest</h2><label>Date</label><input id="hD" type="date" value="${ymd(new Date())}"><label>Crop</label><input id="hC" list="crops" placeholder="e.g. Okra" autocomplete="off"><datalist id="crops">${cropList().map(c=>`<option value="${esc(c)}">`).join('')}</datalist>
  <div class="row" style="flex-wrap:nowrap"><div class="grow" style="min-width:0"><label>Amount</label><input id="hQ" type="number" step="0.01" inputmode="decimal"></div><div style="width:120px;flex:none"><label>Unit</label><select id="hU"><option value="kg">kg</option><option value="pcs">pieces</option><option value="bundle">bundles</option></select></div></div>
  <label>Where it went</label><select id="hW">${Object.entries(HDEST).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><label>Credit a household (optional)</label><select id="hH"><option value="">None</option>${Object.keys(S.hh).sort(natCmp).map(i=>`<option value="${i}">${i} \u00b7 ${esc(S.hh[i].name)}</option>`).join('')}</select>
  <label>Notes (optional)</label><input id="hN" placeholder="e.g. first picking from Plot 3"><div class="row" style="margin-top:14px"><button onclick="A.saveHarvest()">Save</button><button class="ghost" onclick="A.close()">Cancel</button></div>`)},
 saveHarvest:guard(async()=>{const crop=cap1($('#hC').value),qty=+$('#hQ').value;if(!crop)return toast('Add the crop');if(!(qty>0))return toast('Add the amount');
  await addDoc(collection(db,'harvests'),{date:$('#hD').value||ymd(new Date()),crop:crop.slice(0,40),qty:r2(qty),unit:$('#hU').value,dest:$('#hW').value,hhId:$('#hH').value,note:$('#hN').value.trim().slice(0,150),by:S.user.email,createdAt:Date.now()});
  S._pushPending=true;A.close();toast('Harvest recorded')}),
 delHarvest:guard(async id=>{if(!confirm('Delete this harvest entry?'))return;S._pushPending=true;await deleteDoc(doc(db,'harvests',id))}),
 delPlant:guard(async id=>{if(confirm('Remove this entry?'))await deleteDoc(doc(db,'plantings',id))})
});
Object.assign(A,{
 step:(id,d)=>{const i=$('#'+id),mn=+i.min||0,mx=+i.max||99;i.value=Math.min(mx,Math.max(mn,(parseInt(i.value)||mn)+d));A.pplHint()},
 pplHint:()=>{const n=Math.max(1,parseInt($('#cg')?.value)||1),h=$('#cgh');if(h)h.textContent=n<=1?'Just you':n+' people \u00b7 +'+Math.min(n-1,S.cfg.maxGuests)*S.cfg.guestPoints+' bonus points'}
});
Object.assign(A,{
 plantModal(pre=''){S.pd={};S.pon=0;const ids=Object.keys(S.hh).sort(natCmp),today=ymd(new Date());
  open_(`<h2>What did your household plant?</h2><p class="mut">Tap + for each crop and how many were planted. Only count what your household planted yourselves, not what farm staff planted.</p>${isStaff()?`<label>Household</label><select id="pH">${ids.map(i=>`<option value="${i}"${i===pre?' selected':''}>${i} \u00b7 ${esc(S.hh[i].name)}</option>`).join('')}</select>`:''}
  <input id="pQ" placeholder="Search crops" style="margin:8px 0" oninput="A.plantFilter()"><div id="pL">${plantRows('')}</div>
  <div class="log"><b>Not on the list?</b><p class="mut" style="margin:2px 0 8px">Staff will check it before it shows up.</p><div class="row sp" style="flex-wrap:nowrap"><input id="pO" maxlength="30" placeholder="Crop name" style="min-width:0"><span class="row" style="flex-wrap:nowrap;gap:6px"><button type="button" class="ghost" style="width:48px;padding:0;font-size:22px" aria-label="One less" onclick="A.pStep(-1,-1)">\u2212</button><b id="pcx" style="min-width:28px;text-align:center">0</b><button type="button" style="width:48px;padding:0;font-size:22px" aria-label="One more" onclick="A.pStep(-1,1)">+</button></span></div></div>
  <label for="pD">Date</label><input id="pD" type="date" value="${today}" max="${today}"><label for="pN">Note (optional)</label><input id="pN" maxlength="60" placeholder="e.g. back plot">
  <div class="row" style="margin-top:14px"><button onclick="A.savePlants()">Save</button><button class="ghost" onclick="A.close()">Cancel</button></div>`)},
 plantFilter:()=>{$('#pL').innerHTML=plantRows($('#pQ').value)},
 pStep:(i,d)=>{if(i<0){S.pon=Math.min(99,Math.max(0,(S.pon||0)+d));$('#pcx').textContent=S.pon;return}const c=cropsCat()[i];S.pd[c]=Math.min(99,Math.max(0,(S.pd[c]||0)+d));const e=$('#pc'+i);if(e)e.textContent=S.pd[c]},
 savePlants:guard(async()=>{const hh=isStaff()?$('#pH').value:S.profile.householdId,pod=String(S.hh[hh]?.pod||''),now=Date.now(),date=$('#pD').value||ymd(new Date()),note=($('#pN').value||'').trim().slice(0,60),rows=[];
  Object.entries(S.pd).forEach(([c,n])=>{if(n>0)rows.push({crop:c,qty:n,status:'ok'})});
  const on=cap1($('#pO').value).slice(0,30);if(on&&!(S.pon>0))return toast('Set how many '+on+' were planted');if(on)rows.push({crop:on,qty:S.pon,status:isStaff()?'ok':'pending'});
  if(!rows.length)return toast('Tap + next to what was planted');
  const b=writeBatch(db);rows.forEach((r,k)=>b.set(doc(collection(db,'plantings')),{hhId:hh,pod,crop:r.crop,qty:r.qty,note:k===0?note:'',date,by:S.user.email,createdAt:now,status:r.status}));
  await b.commit();A.close();toast(rows.length+' saved'+(rows.some(r=>r.status==='pending')?'. Staff will check the new crop.':''))}),
 approvePlant:guard(async id=>{const p=S.plant.find(x=>x.id===id);if(!p)return;const c=p.crop,same=S.plant.filter(x=>x.status==='pending'&&String(x.crop).toLowerCase()===c.toLowerCase());
  const ops=[b=>b.set(doc(db,'config','program'),{crops:[...new Set([...cropsCat(),c])]},{merge:true})];same.forEach(x=>ops.push(b=>b.update(doc(db,'plantings',x.id),{status:'ok',crop:c})));await runBatch(ops);toast(c+' added to the list')}),
 addCrop:guard(async()=>{const c=cap1($('#nc').value).slice(0,30);if(!c)return toast('Type the crop name');if(cropsCat().some(x=>x.toLowerCase()===c.toLowerCase()))return toast('Already on the list');
  S.open.crops=true;await setDoc(doc(db,'config','program'),{crops:[...cropsCat(),c]},{merge:true});toast(c+' added')}),
 delCrop:guard(async i=>{const c=cropsCat()[i];if(!confirm('Remove '+c+' from the list? Past entries stay.'))return;S.open.crops=true;await setDoc(doc(db,'config','program'),{crops:cropsCat().filter((x,k)=>k!==i)},{merge:true})})
});
