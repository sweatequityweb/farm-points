import {paceCounts,paceInfo,paceMsg} from "../domain/pace.js";
import {annual,pts} from "../domain/points.js";
import {where} from "../firebase.js";
import {sub} from "../services/auth.js";
import {A,S} from "../state.js";
import {pan} from "../ui/icons.js";
import {$,esc,fmtD} from "../util.js";
import {termRows} from "./parent.js";
const paceTick=(pi,t)=>pi.mode==='pace'&&t?`<line x1="110" y1="8" x2="110" y2="30" stroke="#f9a825" stroke-width="5" stroke-linecap="round" transform="rotate(${Math.min(360,pi.expected/t*360)} 110 110)"/>`:'';
function paceCard(pi,id,h){if(pi.mode==='none')return'';const warm=pi.key==='catch'||pi.key==='help',lab=pi.mode==='annual'?pi.label:{ahead:'Ahead of pace',on:'On pace',catch:'A little behind',help:'We can catch up together'}[pi.key];
  return `<div class="pace ${warm?'warm':'ok'}"><div class="row sp"><b>${lab}</b>${pi.mode==='pace'?`<span class="mut">${esc(pi.term)} · by ${fmtD(pi.end)}</span>`:''}</div><p style="margin:6px 0 0">${esc(paceMsg(pi))}</p>${pi.mode==='pace'?'<p class="mut" style="margin:6px 0 0"><i class="dot" style="background:#f9a825"></i> The orange mark on the ring is where you would be right on pace today.</p>':''}${termRows(id,h,true)}</div>`}
function paceDetail(x,p){const i=paceInfo(x,p);return i.mode==='pace'?`<div class="log"><div class="row sp"><b>Pace now</b><span class="chip ${i.cls}">${i.label}</span></div><div class="mut">Expected about ${i.expected} pts today · ${esc(i.term)} goal ${i.goal} by ${fmtD(i.end)}${i.paceDays?' · '+i.paceDays+' work day(s) to get on pace':''}</div></div>`:''}
function paceDash(){const{c,mode}=paceCounts(),H=Object.keys(S.hh).length||1;if(mode!=='pace')return'<p class="mut" style="margin:10px 0 0">Based on the yearly bands.</p>';
  const ok=c.ahead+c.on;return `<div class="sub" style="padding:6px 0 0">Right now, by term pace</div><div class="stack" role="img" aria-label="${ok} on pace, ${c.catch} catching up, ${c.help} need support"><i style="width:${ok/H*100}%;background:var(--pri)"></i><i style="width:${c.catch/H*100}%;background:#f9a825"></i><i style="width:${c.help/H*100}%;background:var(--void)"></i></div><div class="row" style="gap:6px"><span class="chip approved">${ok} On pace</span><span class="chip pending">${c.catch} Catching up</span><span class="chip voided">${c.help} Needs support</span></div><p class="mut" style="margin:10px 0 0">Pace follows your terms, so it changes when you edit them.</p>`}
function pacePanel(){const c=S.cfg;return pan('pace','Pace and status','Grace '+(c.paceGraceDays??1)+' day(s)',`<p class="mut">Households are compared to a pace line that rises smoothly between term end dates (set in Terms). A household is <b>On pace</b> when it is within the grace of that line, <b>Catching up</b> above the floor, and <b>Needs support</b> below it.</p><label for="pgd">Grace (work days of slack before a household is behind)</label><input id="pgd" type="number" min="0" step="0.5" inputmode="decimal" value="${c.paceGraceDays??1}"><label for="pfp">Floor (% of the pace line). 0 = use the On Track bands</label><input id="pfp" type="number" min="0" max="100" inputmode="numeric" value="${c.paceFloorPct||0}"><div style="margin-top:14px"><button onclick="A.savePace()">Save</button></div>`)}

export {paceCard,paceDash,paceDetail,pacePanel,paceTick};
