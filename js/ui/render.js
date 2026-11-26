import {sceneMode} from "./scene.js";
import {cmdOn,cmdPending,syncCmdSub} from "../domain/commander.js";
import {incoming} from "../domain/pods.js";
import {hhName} from "../domain/points.js";
import {schedSync} from "../domain/sync.js";
import {app} from "../firebase.js";
import {sub} from "../services/auth.js";
import {A,S} from "../state.js";
import {navBtn} from "./icons.js";
import {$,esc,isStaff} from "../util.js";
import {claimView,loginView} from "../views/login.js";
import {parentView} from "../views/parent.js";
import {staffView} from "../views/staff.js";
/* ---------- rendering ---------- */
function render(){
  schedSync();syncCmdSub();sceneMode(S.user?'app':'login');
  if(S._reModal&&$('#modal').classList.contains('show')&&!(document.activeElement&&$('#sheet').contains(document.activeElement)&&/^(SELECT|INPUT|TEXTAREA)$/.test(document.activeElement.tagName))){try{S._reModal()}catch(e){console.error(e)}}
  const app=$('#app'),nav=$('#nav'),hdr=$('#hdr');
  clearInterval(S.timer);
  if(!S.user){hdr.hidden=nav.hidden=true;return app.innerHTML=loginView()}
  if(S.profile===undefined){hdr.hidden=nav.hidden=true;return app.innerHTML='<div class="center">Loading…</div>'}
  hdr.hidden=false;
  $('#sub').textContent=S.user.email+' · '+({admin:'Admin',liaison:'Farm Liaison',parent:'Household'}[S.role]);
  if(isStaff()){nav.hidden=false;return staffView()}
  nav.hidden=true;nav.innerHTML='';
  if(!S.profile)return app.innerHTML=claimView();
  if(S.profile.status!=='active')return app.innerHTML=`<div class="center"><div style="font-size:56px">🌱</div><h2>Waiting for approval</h2><p class="mut" style="max-width:320px">Your request to join household <b>${esc(S.profile.householdId)} ${esc(hhName(S.profile.householdId))}</b> was sent. The Farm Liaison will confirm it. This screen updates by itself.</p><button class="ghost" onclick="A.cancelClaim()">Choose a different household</button></div>`;
  nav.hidden=false;const nIn=incoming().length;nav.innerHTML=[['home','Home','home'],['pod','My pod','people'],...(cmdOn()?[['review','Review','check']]:[]),['program','Program','book']].map(([k,l,i])=>navBtn(l,i,S.ptab===k,`S_.ptab='${k}';A.r()`,k==='pod'?nIn:k==='review'?cmdPending().length:0)).join('');
  parentView();
}
/* ---------- modals ---------- */
const open_=(h,re)=>{$('#sheet').innerHTML=h;$('#modal').classList.add('show');S._reModal=re||null};
export {open_,render};
