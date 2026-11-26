import {A} from "../state.js";
import {toast} from "../util.js";
import {db,doc,updateDoc} from "../firebase.js";
import {availText} from "../domain/pods.js";
/* Availability grid actions. Data stays the same: households/{id}.availability = ['Mon-AM','Wed-PM',...] */
const setBtn=(b,on)=>{b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);b.textContent=on?'✓':''};
async function applySlots(id,g,pred,mode){const bs=[...g.querySelectorAll('.slot')],prev=bs.map(b=>b.classList.contains('on')),tg=bs.filter(pred),
  all=tg.every(b=>b.classList.contains('on'));tg.forEach(b=>setBtn(b,typeof mode==='function'?mode(b):mode??!all));
  const av=[...g.querySelectorAll('.slot.on')].map(b=>b.dataset.k),s=g.parentElement.querySelector('.sgs');if(s)s.textContent=availText(av);
  try{await updateDoc(doc(db,'households',id),{availability:av})}catch(e){console.error(e);bs.forEach((b,i)=>setBtn(b,prev[i]));if(s)s.textContent=availText(bs.filter((b,i)=>prev[i]).map(b=>b.dataset.k));toast('Could not save: '+(e.code||e.message))}}
const gridOf=el=>el.closest('.slotw').querySelector('.slotg');
Object.assign(A,{
 toggleSlot:(id,btn)=>applySlots(id,gridOf(btn),b=>b===btn),
 toggleDay:(id,d,btn)=>applySlots(id,gridOf(btn),b=>b.dataset.k.startsWith(d+'-')),
 toggleRow:(id,t,btn)=>applySlots(id,gridOf(btn),b=>b.dataset.k.endsWith('-'+t)),
 slotPreset:(id,m,btn)=>applySlots(id,gridOf(btn),()=>true,b=>m==='none'?false:(m==='wk')===!/^(Sat|Sun)/.test(b.dataset.k))
});
