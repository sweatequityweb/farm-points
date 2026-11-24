import {collection,db,onSnapshot,query,where} from "../firebase.js";
import {S} from "../state.js";
import {render} from "../ui/render.js";
import {toast} from "../util.js";
/* Pod Commander: the admin picks which role counts (S.cfg.cmdRoleId) and what it may do. */
const cmdPod=()=>{const c=S.cfg,me=S.profile?.householdId,pod=S.hh[me]?.pod;if(S.role!=='parent'||!c.cmdRoleId||!pod)return'';return S.holders[c.cmdRoleId+'_'+pod]?.hhId===me?String(pod):''};
const cmdOn=()=>!!cmdPod()&&!!(S.cfg.cmdApprove||S.cfg.cmdReject);
const allLogs=()=>[...S.att,...S.podAtt.filter(x=>!S.att.some(y=>y.id===x.id))];
const findLog=id=>S.att.find(x=>x.id===id)||S.podAtt.find(x=>x.id===id);
const canCmd=(act,l)=>{if(!cmdOn()||!l||l.kind==='buyout'||String(l.pod||'')!==cmdPod())return false;if(l.hhId===S.profile.householdId&&!S.cfg.cmdOwn)return false;return act==='approve'?!!S.cfg.cmdApprove:act==='reject'?!!S.cfg.cmdReject:false};
const cmdPending=()=>cmdOn()?S.podAtt.filter(a=>a.status==='pending'&&canCmd('approve',a)||a.status==='pending'&&canCmd('reject',a)):[];
function syncCmdSub(){const pod=cmdOn()?cmdPod():'';if((S._cmdKey||'')===pod)return;S._cmdKey=pod;if(S._cmdUn)S._cmdUn();S._cmdUn=null;S.podAtt=[];if(!pod)return;
  S._cmdUn=onSnapshot(query(collection(db,'attendance'),where('pod','==',pod)),s=>{S.podAtt=s.docs.map(d=>({id:d.id,...d.data()}));render()},e=>{console.error(e);toast('Commander access is not allowed yet: '+e.code)})}

export {allLogs,canCmd,cmdOn,cmdPending,cmdPod,findLog,syncCmdSub};
