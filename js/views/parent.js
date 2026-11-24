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
function parentView(){if(S.ptab==='review'&&cmdOn())return reviewView();if(S.ptab==='program')return programView();if(S.ptab==='pod')return podView();
  const id=S.profile.householdId,h=S.hh[id]||{},p=pts(id),t=target(h),[st,cls]=standing(h,p),pi=paceInfo(h,p);
  const open=S.profile.activeClockIn,C=2*Math.PI*90,frac=Math.min(p/t,1);
  const mine=S.att.filter(inYear).sort((a,b)=>b.timeIn>a.timeIn?1:-1);
  const outPts=S.att.filter(a=>a.status==='approved'&&!inYear(a)).reduce((s,a)=>s+(a.points||0),0);
  $('#app').innerHTML=`${yearBanner()}<div class="card hero"><div class="mut">${esc(h.barangay||'')}${S.cfg.currentYear?' \u00b7 '+yLabel(S.cfg.currentYear):''}</div><div style="margin:6px 0 2px"><span class="chip approved" style="font-size:14px;padding:4px 14px;letter-spacing:.5px">${esc(id)}</span></div><h2 style="font-size:22px;margin-top:4px">${esc(h.name||id)} household</h2>
  <svg class="ring" width="220" height="220" viewBox="0 0 220 220" role="img" aria-label="${p} of ${t} points"><circle cx="110" cy="110" r="90" fill="none" stroke="#e3ebe3" stroke-width="16"/><circle cx="110" cy="110" r="90" fill="none" stroke="#2e7d32" stroke-width="16" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-frac)}" transform="rotate(-90 110 110)"/>${paceTick(pi,t)}<text x="110" y="112" text-anchor="middle" font-size="48" font-weight="700" fill="#1b5e20">${p}</text><text x="110" y="140" text-anchor="middle" font-size="15" fill="#5f6f61">of ${t} points</text></svg>
  <p class="mut std">Every farm day adds to your points. Thank you for showing up!</p>
  ${outPts?`<p class="mut" style="color:var(--pend);margin:6px 0 0">${outPts} approved point(s) fall outside the program year and are not counted.</p>`:''}</div>
  ${paceCard(pi,id,h)}${open?`<div class="card hero"><div class="mut">Working since ${fmtT(open)}</div><div id="tm" style="font-size:40px;font-weight:500">0:00:00</div><div class="mut" id="tmh"></div>${Date.now()-new Date(open)<3e5?`<button class="text" onclick="A.cancelIn()">Tapped by mistake? Cancel</button>`:''}<div style="margin-top:10px"><button class="red" style="width:100%;min-height:64px;font-size:20px;border-radius:32px" onclick="A.clockOutModal()">CLOCK OUT</button></div></div>`:`<div class="card" style="text-align:center">${clockBtn()}</div>`}
  ${farmCard()}${plantCard(id)}<div class="card"><h2>History</h2>${mine.length?mine.map(a=>logHtml(a)).join(''):'<p class="mut">No logs yet. Tap Clock in when you start work.</p>'}</div>${pastHtml(id)}`;
  if(open){const tick=()=>{const s=Math.max(0,Math.floor((Date.now()-new Date(open))/1000));$('#tm').textContent=`${Math.floor(s/3600)}:${pad(Math.floor(s/60)%60)}:${pad(s%60)}`;$('#tmh').textContent=s>=7200?'2-hour minimum reached':'Counts for points after 2 hours'};tick();S.timer=setInterval(tick,1000)}
}
const inWin=()=>{const n=new Date(),m=n.getHours()*60+n.getMinutes(),f=t=>{const[h,k]=String(t).split(':');return +h*60+ +k};return m>=f(S.cfg.clockOpen)&&m<f(S.cfg.clockClose)};
const clockBtn=()=>yearOver()?`<button disabled style="width:100%;min-height:64px;font-size:20px;border-radius:32px">CLOCK IN</button><p class="mut" style="text-align:center;margin:6px 0 0">The ${yLabel(S.cfg.currentYear)} year has ended. The new year hasn't started yet.</p>`:inWin()?`<button style="width:100%;min-height:64px;font-size:20px;border-radius:32px" onclick="A.clockIn()">CLOCK IN</button>`:`<button disabled style="width:100%;min-height:64px;font-size:20px;border-radius:32px">CLOCK IN</button><p class="mut" style="text-align:center;margin:6px 0 0">Clock-in is open ${S.cfg.clockOpen} to ${S.cfg.clockClose}</p>`;
function termRows(id,h,soft){const T=(S.cfg.terms||[]).filter(x=>x.end),t=target(h),today=ymd(new Date());
  return T.map(x=>{const thr=Math.round(t*x.pct/100),got=S.att.filter(a=>a.hhId===id&&a.status==='approved'&&inRange(a.date,'',x.end)&&inYear(a)).reduce((q,a)=>q+(a.points||0),0),closed=toD(x.end)<today,ok=got>=thr;
    return `<div class="row sp mut"><span>${esc(x.name)} (by ${fmtD(x.end)}): ${thr} pts</span><b style="color:${ok?'var(--ok)':closed?(soft?'var(--pend)':'var(--void)'):'var(--pend)'}">${ok?'Met':closed?(soft?'Catch up':'Not met'):'In progress'}</b></div>`}).join('')}
function yearBanner(){return yearOver()?`<div class="card"><b>The ${yLabel(S.cfg.currentYear)} year has ended.</b><p class="mut" style="margin:4px 0 0">Thank you for your work. The new year will start soon.</p></div>`:''}
function pastHtml(id){const L=(S.cfg.pastYears||[]).filter(y=>y.id!==S.cfg.currentYear);if(!L.length)return'';
  return `<div class="card"><h2>Previous years</h2>${L.slice().reverse().map(y=>`<div class="log row sp"><b>${yLabel(y.id)}</b><span>${S.att.filter(a=>a.hhId===id&&a.status==='approved'&&inRange(a.date,y.start,y.end)).reduce((q,a)=>q+(a.points||0),0)} points</span></div>`).join('')}</div>`}
export {clockBtn,inWin,parentView,pastHtml,termRows,yearBanner};
