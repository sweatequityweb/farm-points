import {S} from "../state.js";
import {db,doc,setDoc} from "../firebase.js";
import {inRange} from "../util.js";
import {paceInfo} from "./pace.js";
import {pts} from "./points.js";
/* Community summary: numbers only (no names, no IDs). Staff clients write it; every household can read it for the Community tab. */
function buildSummary(){const c=S.cfg,ids=Object.keys(S.hh),standing={ahead:0,on:0,catch:0,help:0},sched={};
  ids.forEach(i=>{const k=paceInfo(S.hh[i],pts(i)).key;if(standing[k]!==undefined)standing[k]++;(S.hh[i].availability||[]).forEach(s=>sched[s]=(sched[s]||0)+1)});
  const ok=S.att.filter(a=>a.status==='approved'&&a.kind!=='buyout'&&(!c.yearStart||inRange(a.date,c.yearStart,c.yearEnd)));
  return{households:ids.length,standing,sched,workDays:ok.length,hours:Math.round(ok.reduce((s,a)=>s+(a.durationHours||0),0)),year:c.currentYear||''}}
async function pushSummary(){if(!S._attOk||!S._cfgOk||!Object.keys(S.hh).length)return;const s=buildSummary(),h=JSON.stringify(s);if(S._sumH===h)return;S._sumH=h;
  try{await setDoc(doc(db,'summary','dashboard'),{...s,updatedAt:Date.now()})}catch(e){console.error(e);S._sumH=''}}
export {buildSummary,pushSummary};
