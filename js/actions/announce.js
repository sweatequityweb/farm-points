import {A,S} from "../state.js";
import {$,guard,toast} from "../util.js";
import {addDoc,collection,db,deleteDoc,doc} from "../firebase.js";
import {annMarkSeen,annSeen} from "../domain/announce.js";
import {annSheet,composeHtml} from "../views/announce.js";
import {md} from "../ui/markdown.js";
import {open_} from "../ui/render.js";
const show=()=>open_(annSheet(),show);
const ta=()=>$('#annB');
const live=()=>{const t=ta(),p=$('#annPv');if(p)p.innerHTML=t.value.trim()?md(t.value):'<span class="mut">Your message appears here.</span>'};
function put(a,b,ph){const t=ta(),s=t.selectionStart,e=t.selectionEnd,v=t.value,sel=v.slice(s,e)||ph;t.value=v.slice(0,s)+a+sel+b+v.slice(e);t.focus();t.selectionStart=s+a.length;t.selectionEnd=s+a.length+sel.length;live()}
Object.assign(A,{
 annOpen:()=>{S._annPrev=annSeen();annMarkSeen();show();A.r()},
 annCompose:()=>open_(composeHtml()),
 annLive:live,
 mdIns:k=>{if(k==='b')put('**','**','bold text');else if(k==='i')put('*','*','italic text');
   else if(k==='list'){const t=ta(),s=t.selectionStart,e=t.selectionEnd,v=t.value,sel=(v.slice(s,e)||'item').split('\n').map(x=>'- '+x).join('\n');t.value=v.slice(0,s)+sel+v.slice(e);t.focus();live()}
   else if(k==='link'){const u=prompt('Paste the link (it should start with https://)','https://');if(!u||!/^https?:\/\//i.test(u.trim()))return u?toast('Links must start with http:// or https://'):0;put('[','](' +u.trim()+')','link text')}},
 mdEmoji:e=>{const t=ta(),s=t.selectionStart;t.value=t.value.slice(0,s)+e+t.value.slice(t.selectionEnd);t.focus();t.selectionStart=t.selectionEnd=s+e.length;live()},
 annPost:guard(async()=>{const t=$('#annT').value.trim().slice(0,60),b=$('#annB').value.trim().slice(0,1500);if(!b)return toast('Write a message first');
  await addDoc(collection(db,'announcements'),{title:t,body:b,createdAt:Date.now(),by:S.role==='admin'?'Admin':'Farm Liaison'});S._annPrev=annSeen();annMarkSeen();A.close();toast('Posted. Everyone will see it.')}),
 annDel:guard(async id=>{if(!confirm('Delete this announcement?'))return;await deleteDoc(doc(db,'announcements',id));toast('Deleted')})
});
