import {standing} from "./pace.js";
import {S} from "../state.js";
import {$,inRange,inYear,ymd} from "../util.js";
const pts=id=>S.att.filter(a=>a.hhId===id&&a.status==='approved'&&inYear(a)).reduce((s,a)=>s+(a.points||0),0);
const target=h=>h?.targetType==='adjusted'?S.cfg.targetAdjusted:S.cfg.targetStandard;
const hhName=id=>S.hh[id]?.name||S.podHh?.[id]?.name||S.cfg.directory?.[id]||id;
const ndt=d=>{const x=new Date(d+'T00:00');x.setDate(x.getDate()+1);return ymd(x)},plusYr=d=>{const[y,m,k]=d.split('-');return `${+y+1}-${m}-${k}`};
const annual=(h,p)=>{const t=target(h),mid=h?.targetType==='adjusted'?S.cfg.onTrackAdjusted:S.cfg.onTrackStandard;return p>=t?'In Good Standing':p>=mid?'On Track':'Needs Support'};
const r2=n=>Math.round(n*100)/100;
function yearRows(a,b){return Object.keys(S.hh).sort().map(id=>{const h=S.hh[id],L=S.att.filter(x=>x.hhId===id&&inRange(x.date,a,b)),ap=L.filter(x=>x.status==='approved'),w=ap.filter(x=>x.kind!=='buyout'),p=ap.reduce((q,x)=>q+(x.points||0),0),by=ap.filter(x=>x.kind==='buyout');
  return{id,name:h.name||'',barangay:h.barangay||'',pod:h.pod||'',targetType:h.targetType==='adjusted'?'adjusted':'standard',target:target(h),points:p,workDays:w.filter(x=>x.points>0).length,hours:r2(w.reduce((q,x)=>q+(x.durationHours||0),0)),guests:w.reduce((q,x)=>q+(+x.guests||0),0),buyouts:by.length,buyoutDays:by.reduce((q,x)=>q+(+x.days||0),0),pending:L.filter(x=>x.status==='pending').length,voided:L.filter(x=>x.status==='voided').length,standing:annual(h,p)}})}
const summarize=rs=>{const sum=k=>rs.reduce((q,r)=>q+r[k],0),n=rs.length;return{households:n,active:rs.filter(r=>r.workDays>0).length,points:sum('points'),avg:n?r2(sum('points')/n):0,workDays:sum('workDays'),hours:r2(sum('hours')),buyouts:sum('buyouts'),pending:sum('pending'),good:rs.filter(r=>r.standing==='In Good Standing').length,onTrack:rs.filter(r=>r.standing==='On Track').length,needs:rs.filter(r=>r.standing==='Needs Support').length}};
const guestBonus=l=>Math.min(Math.max(+l.guests||0,0),S.cfg.maxGuests)*S.cfg.guestPoints;
export {annual,guestBonus,hhName,ndt,plusYr,pts,r2,summarize,target,yearRows};
