import {canCmd,findLog} from "../domain/commander.js";
import {hhName} from "../domain/points.js";
import {db,doc,setDoc,updateDoc} from "../firebase.js";
import {A,S} from "../state.js";
import {open_} from "../ui/render.js";
import {$,esc,fmtD,guard,toast} from "../util.js";
Object.assign(A,{
 approve:id=>A._approve(id),
 savePace:guard(async()=>{await setDoc(doc(db,'config','program'),{paceGraceDays:Math.max(0,+$('#pgd').value||0),paceFloorPct:Math.min(100,Math.max(0,+$('#pfp').value||0))},{merge:true});toast('Pace settings saved')}),
 saveCmd:guard(async()=>{await setDoc(doc(db,'config','program'),{cmdRoleId:$('#cmR').value,cmdApprove:$('#cmA').checked,cmdReject:$('#cmX').checked,cmdOwn:$('#cmO').checked},{merge:true});toast('Pod Commander access saved')}),
 cmdApprove:guard(async id=>{const l=findLog(id);if(!canCmd('approve',l))return toast('You cannot approve this log');if(l.status!=='pending')return toast('Already reviewed');await A._approve(id)}),
 cmdRejectModal:id=>{const l=findLog(id);if(!canCmd('reject',l))return toast('You cannot reject this log');
  open_(`<h2>Reject this log?</h2><p class="mut">${esc(hhName(l.hhId))} · ${fmtD(l.date)}. The household will see your reason.</p><label for="rjN">Reason (optional)</label><input id="rjN" maxlength="120" placeholder="e.g. Please clock out when you leave"><div class="row" style="margin-top:14px"><button class="red" onclick="A.cmdReject('${id}')">Reject</button><button class="ghost" onclick="A.close()">Cancel</button></div>`)},
 cmdReject:guard(async id=>{const l=findLog(id);if(!canCmd('reject',l)||l.status!=='pending')return toast('You cannot reject this log');
  await updateDoc(doc(db,'attendance',id),{status:'voided',points:0,approvedBy:S.user.email+' (Pod Commander)',reviewNote:($('#rjN')?.value||'').trim().slice(0,120)});A.close();toast('Rejected')})
});

