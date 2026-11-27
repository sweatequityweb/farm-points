import {A,S} from "../state.js";
import {$,guard,toast} from "../util.js";
import {addDoc,collection,db,deleteDoc,doc} from "../firebase.js";
import {annMarkSeen,annSeen} from "../domain/announce.js";
import {annSheet} from "../views/announce.js";
import {open_} from "../ui/render.js";
const show=()=>open_(annSheet(),show);
Object.assign(A,{
 annOpen:()=>{S._annPrev=annSeen();S._annForm=false;annMarkSeen();show();A.r()},
 annForm:()=>{S._annForm=!S._annForm;show()},
 annPost:guard(async()=>{const t=$('#annT').value.trim().slice(0,60),b=$('#annB').value.trim().slice(0,500);if(!b)return toast('Write a message first');
  await addDoc(collection(db,'announcements'),{title:t,body:b,createdAt:Date.now(),by:S.role==='admin'?'Admin':'Farm Liaison'});S._annForm=false;S._annPrev=annSeen();annMarkSeen();toast('Announcement posted');show()}),
 annDel:guard(async id=>{if(!confirm('Delete this announcement?'))return;await deleteDoc(doc(db,'announcements',id));toast('Deleted')})
});
