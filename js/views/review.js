import {canCmd,cmdPending,cmdPod} from "../domain/commander.js";
import {podLabel,roleName} from "../domain/pods.js";
import {app} from "../firebase.js";
import {A,S} from "../state.js";
import {pan} from "../ui/icons.js";
import {$,esc} from "../util.js";
import {logHtml} from "./logs.js";
import {md} from "./program.js";
function reviewView(){const me=S.profile.householdId,P=cmdPending().sort((a,b)=>a.timeIn>b.timeIn?1:-1),held=S.podAtt.filter(a=>a.status==='pending'&&a.hhId===me&&!canCmd('approve',a)).length,
  done=S.podAtt.filter(a=>a.status!=='pending'&&a.kind!=='buyout').sort((a,b)=>a.timeIn<b.timeIn?1:-1).slice(0,8),
  acts=a=>`<div class="row" style="margin-top:8px">${canCmd('approve',a)?`<button class="sm" onclick="A.cmdApprove('${a.id}')">Approve</button>`:''}${canCmd('reject',a)?`<button class="sm ghost" onclick="A.cmdRejectModal('${a.id}')">Reject</button>`:''}</div>`;
  $('#app').innerHTML=`<div class="card"><h2>Review ${esc(podLabel(cmdPod()))}</h2><p class="mut" style="margin:0">As ${esc(roleName(S.cfg.cmdRoleId)||'Pod Commander')} you can check logs from your pod. Check that the day and hours look right before you approve.</p></div>
  <div class="card"><h2>${P.length?P.length+' waiting for you':'All caught up'}</h2>${P.map(a=>logHtml(a,{hh:1,actions:acts(a)})).join('')||'<p class="mut">No pending logs in your pod.</p>'}${held?`<p class="mut">${held} log(s) from your own household go to the Farm Liaison.</p>`:''}</div>
  <div class="card"><h2>Recently reviewed</h2>${done.map(a=>logHtml(a,{hh:1})).join('')||'<p class="mut">Nothing yet.</p>'}</div>`}
function cmdPanel(){const c=S.cfg,R=c.roles||[],ck=(id,v,l)=>`<label class="row" style="color:var(--txt);font-size:15px;flex-wrap:nowrap"><input id="${id}" type="checkbox" ${v?'checked':''} style="width:24px;min-height:24px;flex:none"> ${l}</label>`;
  return pan('cmd','Pod Commander access',c.cmdRoleId?(roleName(c.cmdRoleId)||'Role')+' can review':'Off',`<p class="mut">Choose which role may review logs. Holders only see and review logs from their own pod, and only logs that are still pending. Firestore rules must allow this (see FIRESTORE_RULES.md).</p><label for="cmR">Role that can review logs</label><select id="cmR"><option value="">Off (nobody)</option>${R.map(r=>`<option value="${r.id}"${c.cmdRoleId===r.id?' selected':''}>${esc(r.name)}</option>`).join('')}</select>${ck('cmA',c.cmdApprove!==false,'Can approve logs')}${ck('cmX',c.cmdReject!==false,'Can reject logs (with a reason)')}${ck('cmO',c.cmdOwn===true,'Can review their own household’s logs')}<div style="margin-top:14px"><button onclick="A.saveCmd()">Save</button></div>`)}

export {cmdPanel,reviewView};
