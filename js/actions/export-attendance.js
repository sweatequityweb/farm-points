import {A,S} from "../state.js";
import {guard,inRange,toast} from "../util.js";
import {natCmp} from "../domain/pods.js";
/* Attendance only, as Excel. Uses the History filters (household, period, status) when called from History. */
const hm=iso=>{const d=new Date(iso);return isNaN(d)?'':d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})};
Object.assign(A,{exportAttendance:guard(scope=>{const c=S.cfg,o=scope==='year'?{hh:'all',yr:'year',st:'all'}:(S.hist||{}),hh=o.hh||'all',yr=o.yr||'year',st=o.st||'all';
  const L=S.att.filter(a=>(hh==='all'||a.hhId===hh)&&(st==='all'||a.status===st)&&(yr!=='year'||!c.yearStart||inRange(a.date,c.yearStart,c.yearEnd))).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:natCmp(a.hhId,b.hhId));
  if(!L.length)return toast('No attendance to export for these filters');
  const rows=L.map(a=>({Date:a.date,'Household ID':a.hhId,Household:S.hh[a.hhId]?.name||'',Pod:a.pod||S.hh[a.hhId]?.pod||'',Type:a.kind==='buyout'?'Buy-out':'Work day','Time in':hm(a.timeIn),'Time out':hm(a.timeOut),Hours:a.durationHours??'',Points:a.points??0,Status:a.status,Guests:a.guests||0,'Guest names':a.guestNames||'',Note:a.note||'','Approved by':a.approvedBy||'','Review note':a.reviewNote||'','Auto-closed':a.autoClosed?'Yes':''}));
  const ws=XLSX.utils.json_to_sheet(rows);ws['!cols']=[12,12,22,8,10,9,9,8,8,10,8,22,28,26,24,11].map(wch=>({wch}));ws['!autofilter']={ref:ws['!ref']};
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Attendance');XLSX.writeFile(wb,'attendance_'+(yr==='year'&&c.currentYear?c.currentYear:'all-time')+(hh!=='all'?'_'+hh:'')+'.xlsx');toast(rows.length+' log'+(rows.length===1?'':'s')+' exported')})});
