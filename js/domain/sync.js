import {isNumPod,natCmp} from "./pods.js";
import {pts} from "./points.js";
import {db,doc,updateDoc} from "../firebase.js";
import {A,S} from "../state.js";
import {isStaff} from "../util.js";
let syncT;const schedSync=()=>{clearTimeout(syncT);syncT=setTimeout(syncPoints,1500)};
async function syncPoints(){if(!S.user||!S._attOk||!S._cfgOk)return;
  try{if(isStaff()){for(const id of Object.keys(S.pp)){const p=pts(id);if(S.pp[id].points!==p)await updateDoc(doc(db,'podpoints',id),{points:p})}}
  else if(S.profile?.status==='active'&&S.myPp){const id=S.profile.householdId,p=pts(id);if(S.myPp.points!==p)await updateDoc(doc(db,'podpoints',id),{points:p})}}catch(e){console.error(e)}}
const SORTS={id:'Household ID',ptsDesc:'Most points',ptsAsc:'Fewest points',newest:'Newest added',name:'Name A\u2013Z',pod:'Pod'};
function hhSorted(){let ids=Object.keys(S.hh);const P={};ids.forEach(i=>P[i]=pts(i));const f=S.hpod||'all',k=S.hsort||'id';
  if(f==='none')ids=ids.filter(i=>!S.hh[i].pod);else if(f!=='all')ids=ids.filter(i=>String(S.hh[i].pod||'')===f);
  const pn=i=>isNumPod(S.hh[i].pod)?+S.hh[i].pod:S.hh[i].pod?9998:9999;
  const C={id:natCmp,ptsDesc:(a,b)=>P[b]-P[a]||natCmp(a,b),ptsAsc:(a,b)=>P[a]-P[b]||natCmp(a,b),newest:(a,b)=>(S.hh[b].createdAt||0)-(S.hh[a].createdAt||0)||natCmp(b,a),name:(a,b)=>String(S.hh[a].name||'').localeCompare(String(S.hh[b].name||''))||natCmp(a,b),pod:(a,b)=>pn(a)-pn(b)||natCmp(a,b)};
  return{ids:ids.sort(C[k]||natCmp),P}}
export {SORTS,hhSorted,schedSync,syncPoints};
