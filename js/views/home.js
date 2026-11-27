import {S} from "../state.js";
import {$,esc,fmtT,inYear,pad,yLabel,yearOver} from "../util.js";
import {paceInfo} from "../domain/pace.js";
import {podLabel} from "../domain/pods.js";
import {pts,target} from "../domain/points.js";
import {annPreview} from "./announce.js";
import {farmCard,plantCard} from "./farm.js";
import {logHtml} from "./logs.js";
import {paceCard,paceTick} from "./pace.js";
import {inWin,pastHtml,yearBanner} from "./parent.js";
/* PARENT HOME.  DESIGN RULE: the clock-in button and the household points ring live in ONE card (#hero),
   clock-in directly under the ring, so people always see their points while they work. Status/pace goes BELOW this card, never between. */
const greet=()=>{const h=new Date().getHours();return h<11?'Magandang umaga':h<13?'Magandang tanghali':h<18?'Magandang hapon':'Magandang gabi'};
const btn=(cls,en,tl,on,dis)=>`<button class="clockbtn ${cls}"${dis?' disabled':''}${on?` onclick="${on}"`:''}><span>${en}</span><small>${tl}</small></button>`;
function clockBlock(open){
  if(yearOver())return btn('','CLOCK IN','Simulan ang trabaho','',1)+`<p class="mut cnote">The ${yLabel(S.cfg.currentYear)} year has ended. The new year hasn't started yet.</p>`;
  if(open)return`<div class="working"><div class="mut">Working since ${fmtT(open)}</div><div id="tm" class="timer">0:00:00</div><div class="mut" id="tmh"></div></div>${btn('out','CLOCK OUT','Tapusin ang trabaho','A.clockOutModal()')}${Date.now()-new Date(open)<3e5?`<button class="text" style="width:100%" onclick="A.cancelIn()">Tapped by mistake? Cancel</button>`:''}`;
  return inWin()?btn('','CLOCK IN','Simulan ang trabaho',"FX.play('celebrate',this);A.clockIn()"):btn('','CLOCK IN','Simulan ang trabaho','',1)+`<p class="mut cnote">Clock-in is open ${S.cfg.clockOpen} to ${S.cfg.clockClose}</p>`}
function homeView(){const id=S.profile.householdId,h=S.hh[id]||{},p=pts(id),t=target(h),pi=paceInfo(h,p),open=S.profile.activeClockIn,C=2*Math.PI*88,frac=Math.min(p/Math.max(t,1),1),
  left=Math.max(0,t-p),days=Math.ceil(left/(S.cfg.pointsPerDay||8)),mine=S.att.filter(inYear).sort((a,b)=>b.timeIn>a.timeIn?1:-1),
  outPts=S.att.filter(a=>a.status==='approved'&&!inYear(a)).reduce((s,a)=>s+(a.points||0),0);
  $('#app').innerHTML=`${yearBanner()}<div class="card hero2" id="hero">
  <div class="who"><div class="av" aria-hidden="true">${esc(String(h.name||id).charAt(0).toUpperCase())}</div><div><div class="mut">${greet()},</div><div class="hn">${esc(h.name||id)} household</div><div class="mut">${esc(id)}${h.pod?' · '+esc(podLabel(h.pod)):''}</div></div></div>
  <svg class="ring" width="210" height="210" viewBox="0 0 220 220" role="img" aria-label="${p} of ${t} points"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#66bb6a"/><stop offset="1" stop-color="#26a69a"/></linearGradient></defs><circle cx="110" cy="110" r="88" fill="none" stroke="#e4e6eb" stroke-width="16"/><circle cx="110" cy="110" r="88" fill="none" stroke="url(#rg)" stroke-width="16" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-frac)}" transform="rotate(-90 110 110)"/>${paceTick(pi,t)}<text x="110" y="112" text-anchor="middle" font-size="52" font-weight="700" fill="#1b5e20">${p}</text><text x="110" y="140" text-anchor="middle" font-size="16" fill="#5f6f61">of ${t} points</text></svg>
  <p class="goal">${left?`${days} more work day${days===1?'':'s'} to reach your goal`:'You reached your yearly goal. Salamat po!'}</p>
  ${outPts?`<p class="mut" style="color:var(--pend);margin:0 0 8px">${outPts} approved point(s) fall outside the program year and are not counted.</p>`:''}
  ${clockBlock(open)}
  <p class="mut cnote">Your clock-in and your points stay together here.</p></div>
  ${paceCard(pi,id,h)}${annPreview()}${farmCard()}${plantCard(id)}<div class="card"><h2>History</h2>${mine.length?mine.map(a=>logHtml(a)).join(''):'<p class="mut">No logs yet. Tap Clock in when you start work.</p>'}</div>${pastHtml(id)}`;
  if(open){const tick=()=>{const s=Math.max(0,Math.floor((Date.now()-new Date(open))/1000));$('#tm').textContent=`${Math.floor(s/3600)}:${pad(Math.floor(s/60)%60)}:${pad(s%60)}`;$('#tmh').textContent=s>=7200?'2-hour minimum reached':'Counts for points after 2 hours'};tick();S.timer=setInterval(tick,1000)}}
export {homeView};
