import {calcStats,qtyText} from "../domain/farm.js";
import {standing} from "../domain/pace.js";
import {summarize,yearRows} from "../domain/points.js";
import {A,S} from "../state.js";
import {ic} from "../ui/icons.js";
import {$,esc,inRange,yLabel,ymd} from "../util.js";
import {histData} from "./history.js";
import {paceDash} from "./pace.js";
import {kpi} from "./years.js";
function dashView(){const c=S.cfg,sm=summarize(yearRows(c.yearStart,c.yearEnd)),st=calcStats(),now=new Date(),cur=c.currentYear,open=cur&&!c.yearEnd;
  const pendL=S.att.filter(a=>a.status==='pending').length,pendU=S.users.filter(u=>u.status==='pending').length,pendC=S.plant.filter(p=>p.status==='pending').length,unplaced=Object.values(S.hh).filter(h=>!h.pod).length;
  const cutoff=ymd(new Date(now.getTime()-30*864e5)),inactive=open&&c.yearStart&&c.yearStart<=cutoff?Object.keys(S.hh).filter(id=>!S.att.some(a=>a.hhId===id&&a.status==='approved'&&a.kind!=='buyout'&&a.date>=cutoff)).length:0;
  const mon=d=>{const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x},wk=[];
  for(let i=7;i>=0;i--){const s0=mon(new Date(now.getTime()-i*6048e5)),e0=new Date(s0);e0.setDate(e0.getDate()+6);const a=ymd(s0),b=ymd(e0);wk.push({l:(s0.getMonth()+1)+'/'+s0.getDate(),n:S.att.filter(x=>x.status==='approved'&&x.kind!=='buyout'&&x.points>0&&inRange(x.date,a,b)).length})}
  const mx=Math.max(1,...wk.map(w=>w.n)),H=sm.households||1;
  const need=[[pendL,'Logs waiting for approval','approvals'],[pendU,'Households requesting access','approvals'],[pendC,'Crops to check','farm'],[unplaced,'Households without a pod','households'],[inactive,'No work day in the last 30 days','households']].filter(x=>x[0]>0);
  const recent=histData({t:{att:true,plant:true,harv:true},hh:'all',yr:'year',st:'all',plain:true}).slice(0,6);
  return `<div class="row sp" style="margin:4px 0 14px"><div><div class="mut">Program year</div><div style="font-size:26px;font-weight:500;color:var(--pri-d)">${cur?yLabel(cur):'Not started'}</div></div><span class="chip ${open?'approved':'pending'}">${open?'Open':cur?'Ended':'No year'}</span></div>
  <div class="dgrid"><div class="card"><h2>Overview</h2><div class="kpi"><div><b>${sm.points}</b>points earned</div><div><b>${sm.workDays}</b>work days</div><div><b>${sm.hours}</b>hours worked</div><div><b>${sm.active}/${sm.households}</b>households took part</div></div></div>
  <div class="card"><h2>Needs attention</h2>${need.length?need.map(([n,l,t])=>`<div class="att" role="button" tabindex="0" onclick="S_.tab='${t}';A.r()"><span>${l}</span><b class="n">${n}</b></div>`).join(''):`<div class="row" style="color:var(--ok)">${ic('check')}<span>All caught up. Nothing needs attention.</span></div>`}</div>
  <div class="card"><h2>Work days per week</h2><div class="wks">${wk.map(w=>`<div class="wk"><b>${w.n}</b><i style="height:${Math.max(3,w.n/mx*90)}px"></i><span>${w.l}</span></div>`).join('')}</div></div>
  <div class="card"><h2>Standing</h2>${c.yearStart?`<div class="stack" role="img" aria-label="${sm.good} in good standing, ${sm.onTrack} on track, ${sm.needs} need support"><i style="width:${sm.good/H*100}%;background:var(--pri)"></i><i style="width:${sm.onTrack/H*100}%;background:#f9a825"></i><i style="width:${sm.needs/H*100}%;background:var(--void)"></i></div><div class="row" style="gap:6px"><span class="chip approved">${sm.good} In Good Standing</span><span class="chip pending">${sm.onTrack} On Track</span><span class="chip voided">${sm.needs} Needs Support</span></div>${paceDash()}`:'<p class="mut" style="margin:0">Start a program year in Settings to see standing.</p>'}</div>
  <div class="card"><h2>Farm</h2><div class="kpi"><div><b>${st.kg}</b>kg harvested</div><div><b>${st.dest.feeding||0}</b>kg fed to scholars</div></div>${st.crops.slice(0,4).map(x=>`<div class="row sp"><span>${esc(x.crop)}</span><span class="mut">${qtyText(x)}</span></div>`).join('')||'<p class="mut" style="margin:0">No harvests recorded this year.</p>'}</div>
  <div class="card"><h2>Recent activity</h2>${recent.map(x=>x.h).join('')||'<p class="mut" style="margin:0">Nothing yet.</p>'}<div style="margin-top:8px"><button class="text" onclick="S_.tab='history';A.r()">See all history</button></div></div></div>`}
export {dashView};
