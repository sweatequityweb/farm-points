import {homeView} from "./home.js";
import {communityView} from "./community.js";
import {cmdOn} from "../domain/commander.js";
import {paceInfo,standing} from "../domain/pace.js";
import {pts,target} from "../domain/points.js";
import {app} from "../firebase.js";
import {A,S} from "../state.js";
import {$,esc,fmtD,fmtT,inRange,inYear,pad,toD,yLabel,yearOver,ymd} from "../util.js";
import {farmCard,plantCard} from "./farm.js";
import {logHtml} from "./logs.js";
import {paceCard,paceTick} from "./pace.js";
import {podView} from "./pod.js";
import {programView} from "./program.js";
import {reviewView} from "./review.js";
function parentView(){if(S.ptab==='review'&&cmdOn())return reviewView();if(S.ptab==='program')return programView();if(S.ptab==='pod')return podView();if(S.ptab==='comm')return communityView();return homeView()}
function termRows(id,h,soft){const T=(S.cfg.terms||[]).filter(x=>x.end),t=target(h),today=ymd(new Date());
  return T.map(x=>{const thr=Math.round(t*x.pct/100),got=S.att.filter(a=>a.hhId===id&&a.status==='approved'&&inRange(a.date,'',x.end)&&inYear(a)).reduce((q,a)=>q+(a.points||0),0),closed=toD(x.end)<today,ok=got>=thr;
    return `<div class="row sp mut"><span>${esc(x.name)} (by ${fmtD(x.end)}): ${thr} pts</span><b style="color:${ok?'var(--ok)':closed?(soft?'var(--pend)':'var(--void)'):'var(--pend)'}">${ok?'Met':closed?(soft?'Catch up':'Not met'):'In progress'}</b></div>`}).join('')}
function yearBanner(){return yearOver()?`<div class="card"><b>The ${yLabel(S.cfg.currentYear)} year has ended.</b><p class="mut" style="margin:4px 0 0">Thank you for your work. The new year will start soon.</p></div>`:''}
function pastHtml(id){const L=(S.cfg.pastYears||[]).filter(y=>y.id!==S.cfg.currentYear);if(!L.length)return'';
  return `<div class="card"><h2>Previous years</h2>${L.slice().reverse().map(y=>`<div class="log row sp"><b>${yLabel(y.id)}</b><span>${S.att.filter(a=>a.hhId===id&&a.status==='approved'&&inRange(a.date,y.start,y.end)).reduce((q,a)=>q+(a.points||0),0)} points</span></div>`).join('')}</div>`}
const inWin=()=>{const n=new Date(),m=n.getHours()*60+n.getMinutes(),f=t=>{const[h,k]=String(t).split(':');return +h*60+ +k};return m>=f(S.cfg.clockOpen)&&m<f(S.cfg.clockClose)};
export {inWin,parentView,pastHtml,termRows,yearBanner};
