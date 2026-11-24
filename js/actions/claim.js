import {collection,db,deleteField,doc,getDocs,setDoc} from "../firebase.js";
import {A,S} from "../state.js";
import {$,guard,toast} from "../util.js";
import {claimRows} from "../views/login.js";
import {snap} from "../views/years.js";
Object.assign(A,{
 pickHh:id=>{S.claimSel=id;document.querySelectorAll('#cl .pick').forEach(b=>{const on=b.dataset.id===id;b.classList.toggle('on',on);b.setAttribute('aria-checked',on)});const b=$('#cb');if(b)b.disabled=false},
 claimFilter:()=>{S.claimQ=$('#cq').value;$('#cl').innerHTML=claimRows(S.claimQ)},
 refreshDirectory:guard(async on=>{const snap=await getDocs(collection(db,'scholars')),g={};snap.forEach(d=>{const x=d.data();(g[x.householdId]??=[]).push(String(x.firstName||'').trim())});Object.keys(g).forEach(k=>g[k]=g[k].filter(Boolean));
   await setDoc(doc(db,'config','program'),{claimNames:!!on,dirScholars:on?g:deleteField()},{merge:true});toast(on?'Claim list updated with scholar names':'Scholar names are hidden on the claim screen')})
});
