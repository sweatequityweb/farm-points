import {HDEST} from "../domain/farm.js";
import {standing} from "../domain/pace.js";
import {ndt,plusYr,summarize,target,yearRows} from "../domain/points.js";
import {collection,db,doc,writeBatch} from "../firebase.js";
import {A,S} from "../state.js";
import {open_} from "../ui/render.js";
import {$,esc,fmtT,guard,inRange,toast,yLabel,ymd} from "../util.js";
import {endPrev,lastEvt,nextLabel,snap} from "../views/years.js";
Object.assign(A,{
 exportXlsx:()=>A.exportYear(S.cfg.currentYear),
 endPreview:endPrev,
 endYearModal(){const c=S.cfg;if(!c.currentYear||c.yearEnd)return toast('There is no open year to end');
  open_(`<h2>End ${yLabel(c.currentYear)}?</h2><p class="mut">This saves a summary and closes the year. No logs are deleted, and you can undo it from the Years tab.</p><label>Last day of the year</label><input id="yE" type="date" min="${c.yearStart}" value="${ymd(new Date())}" onchange="A.endPreview()"><div id="yP" style="margin-top:12px"></div><div class="row" style="margin-top:14px"><button class="red" onclick="A.endYear()">End year</button><button class="ghost" onclick="A.close()">Cancel</button></div>`);endPrev()},
 endYear:guard(async()=>{const c=S.cfg,id=c.currentYear,end=$('#yE').value;if(!end||end<c.yearStart)return toast('Pick a valid last day');
  const rows=yearRows(c.yearStart,end),sm=summarize(rows);if(sm.pending&&!$('#yK')?.checked)return toast('Tick the box to continue');
  const b=writeBatch(db),by=S.user.email,past=[...(c.pastYears||[]).filter(y=>y.id!==id),{id,start:c.yearStart,end}];
  b.set(doc(db,'years',id),{id,label:yLabel(id),start:c.yearStart,end,status:'closed',closedAt:Date.now(),closedBy:by,rows,summary:sm});
  b.set(doc(db,'config','program'),{yearEnd:end,pastYears:past},{merge:true});
  b.set(doc(collection(db,'yearEvents')),{type:'end',year:id,at:Date.now(),by,before:snap(),undone:false});
  await b.commit();A.close();toast('Year ended. You can undo this.')}),
 editYearModal(){const c=S.cfg;
  open_(`<h2>Edit program year</h2>
    <p class="mut">A log counts only when its date falls between the first day and the last day. Change the dates here to bring logs into the year.</p>
    <label>Year label</label><input id="eyL" value="${esc(c.currentYear||'')}" placeholder="2026-2027">
    <label>First day — logs on or after this date count</label><input id="eyS" type="date" value="${esc(c.yearStart||'')}">
    <label>Last day — leave blank for an open year</label><input id="eyE" type="date" value="${esc(c.yearEnd||'')}">
    <p class="mut" style="margin-top:10px">Clearing the last day reopens the year. This edit does <b>not</b> save a snapshot of the standings — use <b>End year</b> for that.</p>
    <div class="row" style="margin-top:14px"><button onclick="A.saveYear()">Save</button><button class="ghost" onclick="A.close()">Cancel</button></div>`)},
 saveYear:guard(async()=>{
  const id=$('#eyL').value.trim(),st=$('#eyS').value,en=$('#eyE').value,c=S.cfg;
  if(!/^\d{4}-\d{4}$/.test(id))return toast('Write the year like 2026-2027');
  if(!st)return toast('Set the first day');
  if(en&&en<st)return toast('The last day must be after the first day');
  if(id!==c.currentYear&&(c.pastYears||[]).some(y=>y.id===id))return toast('A past year already uses that label');
  const patch={currentYear:id,yearStart:st,yearEnd:en||''};
  const oldId=c.currentYear;
  if(oldId&&(c.pastYears||[]).some(y=>y.id===oldId)){
    patch.pastYears=(c.pastYears||[]).map(y=>y.id===oldId?{...y,id,start:st,end:en||''}:y);
  }
  const b=writeBatch(db);
  b.set(doc(db,'config','program'),patch,{merge:true});
  if(oldId&&oldId!==id){
    const old=S.years.find(y=>y.id===oldId);
    if(old){b.delete(doc(db,'years',oldId));b.set(doc(db,'years',id),{...old,id,label:yLabel(id),start:st,end:en||'',status:en?'closed':'open'})}
  }else if(S.years.some(y=>y.id===id)){
    b.update(doc(db,'years',id),{start:st,end:en||'',status:en?'closed':'open'});
  }
  await b.commit();A.close();toast('Year updated')
 }),
 startYearModal(){const c=S.cfg;if(c.currentYear&&!c.yearEnd)return toast('End the current year first');
  const st=c.yearEnd?ndt(c.yearEnd):(c.yearStart||ymd(new Date())),hasT=c.currentYear&&(c.terms||[]).some(t=>t.end);
  open_(`<h2>Start a new year</h2><p class="mut">Points start again at 0. Households, pods and target types carry over. Past years stay saved and exportable.</p><label>Year</label><input id="yL" value="${nextLabel()}" placeholder="2027-2028"><label>First day</label><input id="yS2" type="date" value="${st}">${hasT?`<label class="row" style="color:var(--txt);font-size:14px"><input id="yT" type="checkbox" checked style="width:24px;min-height:24px"> Move term end dates forward one year</label>`:''}<div class="row" style="margin-top:14px"><button onclick="A.startYear()">Start year</button><button class="ghost" onclick="A.close()">Cancel</button></div>`)},
 startYear:guard(async()=>{const c=S.cfg,id=$('#yL').value.trim(),st=$('#yS2').value;
  if(!/^\d{4}-\d{4}$/.test(id))return toast('Write the year like 2027-2028');if(!st||(c.yearEnd&&st<=c.yearEnd))return toast('The first day must be after the last year ended');
  if(S.years.some(y=>y.id===id))return toast('That year already exists');
  const terms=$('#yT')?.checked?(c.terms||[]).map(t=>({...t,end:t.end?plusYr(t.end):''})):(c.terms||[]),b=writeBatch(db),by=S.user.email;
  b.set(doc(db,'years',id),{id,label:yLabel(id),start:st,status:'open',startedAt:Date.now(),startedBy:by});
  b.set(doc(db,'config','program'),{currentYear:id,yearStart:st,yearEnd:'',terms},{merge:true});
  b.set(doc(collection(db,'yearEvents')),{type:'start',year:id,at:Date.now(),by,before:snap(),undone:false});
  await b.commit();S.td=null;A.close();toast('Year started. You can undo this.')}),
 undoLast:guard(async()=>{const e=lastEvt();if(!e)return;if(!confirm(`Undo "${e.type==='end'?'Ended':'Started'} ${yLabel(e.year)}"? The year and points go back to how they were.`))return;
  const b=writeBatch(db);b.set(doc(db,'config','program'),{currentYear:e.before.currentYear,yearStart:e.before.yearStart,yearEnd:e.before.yearEnd,pastYears:e.before.pastYears,terms:e.before.terms},{merge:true});
  if(e.type==='start')b.delete(doc(db,'years',e.year));else b.set(doc(db,'years',e.year),{id:e.year,label:yLabel(e.year),start:e.before.yearStart,status:'open',reopenedAt:Date.now()});
  b.update(doc(db,'yearEvents',e.id),{undone:true,undoneAt:Date.now(),undoneBy:S.user.email});await b.commit();S.td=null;toast('Undone')}),
 exportYear:guard(id=>{const c=S.cfg,y=S.years.find(x=>x.id===id),cur=id&&id===c.currentYear,st=y?.start||(cur?c.yearStart:''),en=y?.end||(cur?c.yearEnd:'');
  const closed=y&&y.status==='closed'&&y.rows&&!cur,rows=closed?y.rows:yearRows(st,en),sm=closed?y.summary:summarize(rows);
  const L=S.att.filter(a=>inRange(a.date,st,en)).sort((a,b)=>a.timeIn>b.timeIn?1:-1);
  const info=[['Program year',id?yLabel(id):'All time'],['Status',closed?'Closed':'Open'],['First day',st||''],['Last day',en||'(open)'],['Exported',new Date().toLocaleString()],[],['Households',sm.households],['Households with at least one work day',sm.active],['Total points',sm.points],['Average points per household',sm.avg],['Work days approved',sm.workDays],['Hours worked',sm.hours],['Buy-out entries',sm.buyouts],['Logs still pending',sm.pending],[],['In Good Standing',sm.good],['On Track',sm.onTrack],['Needs Support',sm.needs]];
  const wb=XLSX.utils.book_new(),s1=XLSX.utils.aoa_to_sheet(info);s1['!cols']=[{wch:38},{wch:22}];XLSX.utils.book_append_sheet(wb,s1,'Year Summary');
  const s2=XLSX.utils.json_to_sheet(rows.map(r=>({'Household ID':r.id,Name:r.name,Barangay:r.barangay,Pod:r.pod,'Target type':r.targetType,Target:r.target,Points:r.points,'Work days':r.workDays,Hours:r.hours,Guests:r.guests??'','Buy-outs':r.buyouts,'Buy-out days':r.buyoutDays,Pending:r.pending,Voided:r.voided,Standing:r.standing})));s2['!cols']=Array(14).fill({wch:14});XLSX.utils.book_append_sheet(wb,s2,'Household Summary');
  const s3=XLSX.utils.json_to_sheet(L.map(a=>({Type:a.kind||'work',Date:a.date,'Household ID':a.hhId,Pod:a.pod||'','Time In':fmtT(a.timeIn),'Time Out':fmtT(a.timeOut),Hours:a.durationHours||0,Guests:a.guests||0,Note:a.note||'',Points:a.points||0,Status:a.status,'Approved by':a.approvedBy||''})));s3['!cols']=Array(11).fill({wch:14});XLSX.utils.book_append_sheet(wb,s3,'Attendance Logs');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(S.harv.filter(h=>inRange(h.date,st,en)).map(h=>({Date:h.date,Crop:h.crop,Amount:h.qty,Unit:h.unit,Destination:HDEST[h.dest]||h.dest,'Household ID':h.hhId||'',Notes:h.note||''}))),'Harvests');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(S.plant.filter(p=>p.status!=='pending'&&inRange(p.date,st,en)).map(p=>({Date:p.date,'Household ID':p.hhId,Crop:p.crop||'',Count:p.qty??'',Notes:p.note||''}))),'Plantings');
  XLSX.writeFile(wb,`ugnayan-gulayan-${id||'all'}.xlsx`)})
});
