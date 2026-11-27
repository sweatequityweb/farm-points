import {annual,pts,target} from "./points.js";
import {where} from "../firebase.js";
import {A,S} from "../state.js";
import {fmtD,toD,ymd} from "../util.js";
/* Pace engine: reads S.cfg.terms (name, end, pct) and works out where a household should be today. */
const dn=s=>{const[y,m,d]=toD(s).split('-').map(Number);return Math.round(Date.UTC(y,m-1,d)/864e5)};
const datedTerms=()=>(S.cfg.terms||[]).filter(x=>x.end).map(x=>({...x,end:toD(x.end)})).sort((a,b)=>a.end>b.end?1:-1);
const TIER={ahead:['Ahead of pace','approved'],on:['On pace','approved'],catch:['Catching up','pending'],help:['Needs support','voided']};
/* Returns {key,label,cls,mode,...}. mode: none | pace | annual. Tiers: ahead (met current term), on (at pace line minus grace), catch (above floor), help (below floor). */
function paceInfo(h,p){const c=S.cfg,t=target(h),adj=h?.targetType==='adjusted',ppd=c.pointsPerDay||8,today=ymd(new Date()),T=datedTerms();
  if(!c.yearStart||today<c.yearStart)return{key:'none',label:'Not started',cls:'',mode:'none'};
  if(!T.length||c.yearEnd||today>T[T.length-1].end){const l=annual(h,p),k=l==='In Good Standing'?'on':l==='On Track'?'catch':'help';
    return{key:k,label:l,cls:TIER[k][1],mode:'annual',expected:t,goal:t,need:Math.max(0,t-p),days:Math.ceil(Math.max(0,t-p)/ppd)}}
  const mid=adj?c.onTrackAdjusted:c.onTrackStandard,ratio=c.paceFloorPct>0?c.paceFloorPct/100:(t?mid/t:.6),th=x=>Math.round(t*x.pct/100);
  const cur=T.find(x=>x.end>=today),prev=[...T].reverse().find(x=>x.end<today),a=prev?{d:dn(prev.end),v:th(prev)}:{d:dn(c.yearStart),v:0},b={d:dn(cur.end),v:th(cur)};
  const exp=b.d>a.d?a.v+(b.v-a.v)*Math.min(1,Math.max(0,(dn(today)-a.d)/(b.d-a.d))):b.v,grace=(c.paceGraceDays??1)*ppd,goal=th(cur);
  const key=p>=goal?'ahead':p>=exp-grace?'on':p>=exp*ratio-grace?'catch':'help',toPace=Math.max(0,Math.ceil(exp-grace-p)),toGoal=Math.max(0,goal-p);
  return{key,label:TIER[key][0],cls:TIER[key][1],mode:'pace',expected:Math.round(exp),goal,term:cur.name,end:cur.end,toGoal,goalDays:Math.ceil(toGoal/ppd),paceDays:Math.ceil(toPace/ppd),daysLeft:dn(cur.end)-dn(today)}}
function standing(h,p){const i=paceInfo(h,p);return[i.label,i.cls]}
const paceMsg=i=>{const d=n=>n+' more work day'+(n===1?'':'s');
  if(i.mode==='none')return'';
  if(i.mode==='annual')return i.need?d(i.days)+' would reach the full-year goal.':'You have reached the full-year goal. Thank you!';
  if(i.key==='ahead')return 'You have already met the '+i.term+' goal. Every extra day is a bonus for the farm.';
  if(i.key==='on')return d(i.goalDays)+' will complete '+i.term+'.';
  if(i.key==='catch')return d(i.paceDays)+' brings you back on pace.';
  return d(i.paceDays)+' brings you back on pace. The Farm Liaison can help with make-up days.'};
function paceCounts(){const c={ahead:0,on:0,catch:0,help:0};let mode='';Object.keys(S.hh).forEach(id=>{const i=paceInfo(S.hh[id],pts(id));if(c[i.key]!==undefined)c[i.key]++;mode=mode||i.mode});return{c,mode}}

export {TIER,datedTerms,dn,paceCounts,paceInfo,paceMsg,standing};
