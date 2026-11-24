import {natCmp,parseIds,roleName,runBatch,winLabel} from "../domain/pods.js";
import {pts} from "../domain/points.js";
import {db,deleteDoc,deleteField,doc,setDoc,updateDoc,writeBatch} from "../firebase.js";
import {A,S} from "../state.js";
import {open_} from "../ui/render.js";
import {$,esc,guard,isStaff,toast,uid} from "../util.js";
Object.assign(A,{
 migrateContacts:guard(async()=>{const ids=Object.keys(S.hh).filter(i=>S.hh[i].contactNumber!==undefined||S.hh[i].masterEmail!==undefined);if(!ids.length)return toast('Nothing to move');
   if(!confirm('Move the contact details of '+ids.length+' households to private storage? Nothing is lost. Podmates will only see them if the household agrees.'))return;
   const ops=[];ids.forEach(i=>{const h=S.hh[i],ex=S.contacts[i]||{},c={pod:h.pod?String(h.pod):'',shared:ex.shared===true};
     if(!ex.contactNumber&&h.contactNumber)c.contactNumber=h.contactNumber;
     if(!ex.masterEmail&&h.masterEmail)c.masterEmail=h.masterEmail;
     ops.push(b=>b.set(doc(db,'contacts',i),c,{merge:true}));ops.push(b=>b.update(doc(db,'households',i),{contactNumber:deleteField(),masterEmail:deleteField()}))});
   await runBatch(ops);toast('Contact details moved')}),
 addWindow:guard(async n=>{const w={id:uid(),pod:String(n),day:'Mon',start:'08:00',end:'11:00'};S.open.pods=true;S.open['pod'+n]=true;await setDoc(doc(db,'config','program'),{windows:[...(S.cfg.windows||[]),w]},{merge:true});toast('Window added. Set its day, time and households.')}),
 saveWindow:guard(async wid=>{document.activeElement?.blur?.();const w=(S.cfg.windows||[]).find(x=>x.id===wid),d=S.winDraft[wid];if(!w||!d)return;
   if(!d.start||!d.end||d.end<=d.start)return toast('The end time must be after the start time');
   const{ids,bad}=parseIds(d.hh);if(bad.length)return toast('Not found: '+bad.join(', '));
   const out=ids.filter(i=>String(S.hh[i].pod||'')!==String(w.pod));if(out.length)return toast(out.join(', ')+(out.length>1?' are':' is')+' not in Pod '+w.pod+'. Add to the pod first.');
   const cur=Object.keys(S.hh).filter(i=>S.hh[i].window===wid),add=ids.filter(i=>!cur.includes(i)),rem=cur.filter(i=>!ids.includes(i));
   const wins=(S.cfg.windows||[]).map(x=>x.id===wid?{...x,day:d.day,start:d.start,end:d.end}:x),ops=[b=>b.set(doc(db,'config','program'),{windows:wins},{merge:true})];
   add.forEach(i=>ops.push(b=>b.update(doc(db,'households',i),{window:wid})));rem.forEach(i=>ops.push(b=>b.update(doc(db,'households',i),{window:deleteField()})));
   await runBatch(ops);delete S.winDraft[wid];toast('Window saved')}),
 delWindow:guard(async wid=>{const w=(S.cfg.windows||[]).find(x=>x.id===wid);if(!w)return;const ms=Object.keys(S.hh).filter(i=>S.hh[i].window===wid);
   if(!confirm('Delete '+winLabel(w)+'?'+(ms.length?'\n'+ms.length+' household(s) will have no window.':'')))return;
   const ops=ms.map(i=>b=>b.update(doc(db,'households',i),{window:deleteField()}));ops.push(b=>b.set(doc(db,'config','program'),{windows:(S.cfg.windows||[]).filter(x=>x.id!==wid)},{merge:true}));await runBatch(ops);delete S.winDraft[wid];toast('Window deleted')}),
 setWindow:guard(async(id,v)=>{await updateDoc(doc(db,'households',id),{window:v||deleteField()});S.winDraft={};toast(v?'Window set':'Window cleared')}),
 addRole:guard(async()=>{const n=($('#nr')?.value||'').trim();if(!n)return toast('Type a role name first');const r={id:uid(),name:n,desc:''};S.open.roles=true;S.open['role'+r.id]=true;
   await setDoc(doc(db,'config','program'),{roles:[...(S.cfg.roles||[]),r]},{merge:true});toast('Role added. Choose who holds it in each pod.')}),
 renameRole:guard(async(id,v)=>{v=v.trim();if(!v)return toast('A role needs a name');await setDoc(doc(db,'config','program'),{roles:(S.cfg.roles||[]).map(r=>r.id===id?{...r,name:v}:r)},{merge:true});toast('Saved')}),
 roleDesc:guard(async(id,v)=>{await setDoc(doc(db,'config','program'),{roles:(S.cfg.roles||[]).map(r=>r.id===id?{...r,desc:v.trim()}:r)},{merge:true});toast('Saved')}),
 delRole:guard(async id=>{const r=(S.cfg.roles||[]).find(x=>x.id===id);if(!r||!confirm('Delete the role "'+r.name+'"? Everyone holding it will lose it.'))return;
   const ops=Object.entries(S.holders).filter(([k,v])=>v.roleId===id).map(([k])=>b=>b.delete(doc(db,'roleHolders',k)));ops.push(b=>b.set(doc(db,'config','program'),{roles:(S.cfg.roles||[]).filter(x=>x.id!==id)},{merge:true}));await runBatch(ops);toast('Role deleted')}),
 setHolder:guard(async(id,pod,hh)=>{const k=id+'_'+pod;if(!hh){await deleteDoc(doc(db,'roleHolders',k));toast('Role cleared')}else{await setDoc(doc(db,'roleHolders',k),{roleId:id,pod:String(pod),hhId:hh});toast(hh+' is now '+roleName(id)+' for Pod '+pod)}}),
 /* ----- parents ----- */
 contactModal(){const id=S.profile.householdId,h=S.hh[id]||{},c=S.myContact||{},em=c.masterEmail||h.masterEmail||'',ph=c.contactNumber||h.contactNumber||'';
   open_(`<h2>My contact details</h2><p class="mut">Only your podmates see these, and only if you share them.</p><label>Mobile number</label><input id="cN" type="tel" inputmode="tel" value="${esc(ph)}" placeholder="09XXXXXXXXX"><label>Email</label><input id="cE" type="email" inputmode="email" value="${esc(em)}" placeholder="name@example.com"><div class="row" style="margin-top:14px"><button onclick="A.saveMyContact()">Save</button><button class="ghost" onclick="A.close()">Cancel</button></div>`)},
 saveMyContact:guard(async()=>{if(isStaff())return;const id=S.profile.householdId,pod=S.hh[id]?.pod;if(!pod)return toast('You are not in a pod yet');
   const ph=$('#cN').value.trim().replace(/[\s-]/g,''),em=$('#cE').value.trim().toLowerCase();
   if(ph&&!/^(\+?\d{7,15}|09\d{9})$/.test(ph))return toast('Check the mobile number');
   if(em&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em))return toast('Check the email address');
   if(!ph&&!em)return toast('Add a phone number or an email');
   if(S.myContact)await updateDoc(doc(db,'contacts',id),{contactNumber:ph,masterEmail:em});
   else await setDoc(doc(db,'contacts',id),{contactNumber:ph,masterEmail:em,pod:String(pod),shared:false});
   A.close();toast('Contact details saved')}),
 shareContact:guard(async v=>{if(isStaff())return;const id=S.profile.householdId,pod=S.hh[id]?.pod;if(!pod)return toast('You are not in a pod yet');
   const h=S.hh[id]||{},c=S.myContact||{},em=c.masterEmail||h.masterEmail||'',ph=c.contactNumber||h.contactNumber||'';
   if(!em&&!ph)return toast('Add your phone or email first');
   const b=writeBatch(db),now=Date.now();
   if(S.myContact)b.update(doc(db,'contacts',id),{shared:v});
   else b.set(doc(db,'contacts',id),{contactNumber:ph,masterEmail:em,pod:String(pod),shared:v});
   if(v)S.reqTo.filter(r=>r.type==='contact'&&r.status==='pending'&&String(r.pod)===String(pod)).forEach(r=>b.update(doc(db,'requests',r.id),{status:'accepted',updatedAt:now}));
   await b.commit();toast(v?'Your contact details are now shared with your pod':'You stopped sharing your contact details')}),
 sharePoints:guard(async v=>{if(isStaff())return;const id=S.profile.householdId,pod=S.hh[id]?.pod;if(!pod)return toast('You are not in a pod yet');const p=pts(id);
   if(S.myPp)await updateDoc(doc(db,'podpoints',id),{shown:v,points:p});else await setDoc(doc(db,'podpoints',id),{pod:String(pod),shown:v,points:p});toast(v?'Your points are now visible to your pod':'Your points are hidden')}),
 askContact:guard(async to=>{if(isStaff())return;const id=S.profile.householdId,pod=String(S.hh[id]?.pod||''),rid='contact_'+id+'_'+to,ex=S.reqFrom.find(r=>r.id===rid),now=Date.now();
   if(ex&&ex.status==='pending')return toast('You already asked');
   if(ex)await updateDoc(doc(db,'requests',rid),{status:'pending',updatedAt:now});else await setDoc(doc(db,'requests',rid),{type:'contact',pod,fromHh:id,toHh:to,status:'pending',createdAt:now,updatedAt:now});toast('Request sent')}),
 cancelReq:guard(async rid=>{await deleteDoc(doc(db,'requests',rid))}),
 answerReq:guard(async(rid,ok)=>{const r=S.reqTo.find(q=>q.id===rid);if(!r)return;const id=S.profile.householdId,now=Date.now();
   if(!ok){await updateDoc(doc(db,'requests',rid),{status:'declined',updatedAt:now});return toast('Declined. They can ask again.')}
   if(r.type==='contact')return A.shareContact(true);
   const h=S.holders[r.assignId];if(!h||h.hhId!==r.fromHh)return toast('That role has already moved');
   await updateDoc(doc(db,'requests',rid),{status:'accepted',updatedAt:now});
   try{await updateDoc(doc(db,'roleHolders',r.assignId),{hhId:id})}catch(e){try{await updateDoc(doc(db,'requests',rid),{status:'pending',updatedAt:Date.now()})}catch(_){};throw e}
   await deleteDoc(doc(db,'requests',rid));toast('You now hold '+roleName(r.roleId))}),
 passRoleModal(k){const id=S.profile.householdId,h=S.holders[k];if(!h||h.hhId!==id)return;const ids=Object.keys(S.podHh).filter(i=>i!==id).sort(natCmp);
   open_(`<h2>Pass ${esc(roleName(h.roleId)||'role')}</h2><p class="mut">Choose a podmate. They get a request, and the role moves only if they accept.</p><label for="rp">Podmate</label><select id="rp">${ids.map(i=>`<option value="${i}">${esc(S.podHh[i].name)} (${i})</option>`).join('')}</select><div class="row" style="margin-top:14px"><button onclick="A.sendRole('${k}')">Send request</button><button class="ghost" onclick="A.close()">Cancel</button></div>`)},
 sendRole:guard(async k=>{const id=S.profile.householdId,h=S.holders[k],to=$('#rp')?.value;if(!h||h.hhId!==id||!to)return toast('Choose a podmate');const rid='role_'+k+'_'+to,ex=S.reqFrom.find(q=>q.id===rid),now=Date.now();
   if(ex&&ex.status==='pending')return toast('You already asked them');
   if(ex)await updateDoc(doc(db,'requests',rid),{status:'pending',updatedAt:now});else await setDoc(doc(db,'requests',rid),{type:'role',roleId:h.roleId,assignId:k,pod:String(h.pod),fromHh:id,toHh:to,status:'pending',createdAt:now,updatedAt:now});
   A.close();toast('Request sent')})
});
