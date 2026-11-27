import {A,S} from "../state.js";
import {$,isStaff,toast} from "../util.js";
import {open_} from "./render.js";
/* Back button: each tab change is a history entry, so Back goes to the previous tab.
   At the very first tab, Back asks "Leave the app?" instead of exiting. A modal is its own entry, so Back closes it first. */
const keyNow=()=>!S.user||S.profile===undefined?null:isStaff()?'s:'+S.tab:'p:'+(S.ptab||'home');
const isOpen=()=>$('#modal').classList.contains('show');
function hideModal(){$('#modal').classList.remove('show');S._reModal=null}
function closeModal(){const was=history.state&&history.state.modal;hideModal();if(was){S._quiet=true;history.back()}}
function pushModal(){if(S._nk!==undefined&&!(history.state&&history.state.modal))history.pushState({app:1,modal:1,k:S._nk},'')}
function track(){const k=keyNow();if(!k||S._nk===k)return;
  if(S._nk===undefined&&!S._navInit){S._navInit=true;history.replaceState({root:1},'');history.pushState({app:1,k},'')}else history.pushState({app:1,k},'');S._nk=k}
function showExit(){history.pushState({app:1,k:S._nk},'');
  open_(`<h2>Leave the app?</h2><p style="font-size:17px;margin:0 0 16px">You are about to exit Ugnayan Gulayan.</p><div class="row" style="gap:10px"><button style="flex:1" onclick="A.close()">Stay</button><button class="ghost" style="flex:1" onclick="A.leave()">Leave</button></div>`)}
window.addEventListener('popstate',e=>{if(S._leaving)return;if(S._quiet){S._quiet=false;return}const st=e.state||{};
  if(isOpen()){hideModal();if(st.root)history.pushState({app:1,k:S._nk},'');return}
  if(!S.user)return;
  if(st.root||!st.app){showExit();return}
  if(st.k){S._nk=st.k;const v=st.k.slice(2);if(st.k[0]==='s')S.tab=v;else S.ptab=v;A.r()}});
Object.assign(A,{leave:()=>{S._leaving=true;history.go(-3);setTimeout(()=>{S._leaving=false;try{window.close()}catch(e){}toast('You can close this tab now')},700)}});
export {closeModal,hideModal,pushModal,showExit,track};
