import {DEF} from "../config.js";
import {allLogs,findLog} from "../domain/commander.js";
import {standing} from "../domain/pace.js";
import {guestBonus,pts,target} from "../domain/points.js";
import {GoogleAuthProvider,addDoc,auth,collection,db,deleteDoc,deleteField,doc,getDocs,setDoc,signInWithEmailAndPassword,signInWithPopup,signOut,updateDoc,writeBatch} from "../firebase.js";
import {hhModal,manualModal} from "../modals/staff-modals.js";
import {A,S} from "../state.js";
import {open_,render} from "../ui/render.js";
import {$,fmtT,guard,hrs,inRange,inYear,toast,uid,yearOver,ymd} from "../util.js";
import {inWin} from "../views/parent.js";
/* ---------- actions ---------- */
Object.assign(A,{
  r:render,close:()=>{$('#modal').classList.remove('show');S._reModal=null},
  google:guard(()=>signInWithPopup(auth,new GoogleAuthProvider())),
  emailLogin:guard(async()=>{try{await signInWithEmailAndPassword(auth,$('#em').value.trim(),$('#pw').value)}catch(e){toast('Check your email and password')}}),
  logout:()=>{S._hhSub=false;signOut(auth)},
  claim:guard(async()=>{const id=S.claimSel;if(!id)return toast('Choose your household');
    await setDoc(doc(db,'users',S.user.uid),{email:S.user.email.toLowerCase(),role:'parent',householdId:id,status:'pending'})}),
  cancelClaim:guard(async()=>{await deleteDoc(doc(db,'users',S.user.uid))}),
  clockIn:guard(async()=>{if(yearOver())return toast('The program year has ended');if(!inWin())return toast('Clock-in is closed right now');if(!confirm('Start your work day now?'))return;await updateDoc(doc(db,'users',S.user.uid),{activeClockIn:new Date().toISOString()});toast('Clocked in')}),
  clockOutModal:()=>open_(`<h2>Clock out</h2><p class="mut">Worked ${hrs((Date.now()-new Date(S.profile.activeClockIn))/36e5)}</p><label>What did you work on?</label><input id="cn" placeholder="e.g. Weeding"><label>How many people worked today, including you?</label><div class="row" style="flex-wrap:nowrap;justify-content:center"><button type="button" class="ghost" style="width:56px;padding:0;font-size:24px" aria-label="One less" onclick="A.step('cg',-1)">\u2212</button><input id="cg" type="number" min="1" max="${S.cfg.maxGuests+1}" inputmode="numeric" value="1" style="text-align:center;font-size:22px;width:80px;flex:none" oninput="A.pplHint()"><button type="button" class="ghost" style="width:56px;padding:0;font-size:24px" aria-label="One more" onclick="A.step('cg',1)">+</button></div><p id="cgh" class="mut" style="text-align:center;margin:6px 0 0">Just you</p><label>Who came with you? (optional)</label><input id="cgn" placeholder="e.g. Ate Mila, Jun"><div class="row" style="margin-top:14px"><button class="red" onclick="A.clockOut()">Clock out and submit</button><button class="ghost" onclick="A.close()">Keep working</button></div>`),
  clockOut:guard(async()=>{
    const tin=new Date(S.profile.activeClockIn),tout=new Date(),dur=Math.round((tout-tin)/36e3)/100;
    await addDoc(collection(db,'attendance'),{hhId:S.profile.householdId,pod:S.hh[S.profile.householdId]?.pod||'',date:ymd(tin),timeIn:tin.toISOString(),timeOut:tout.toISOString(),durationHours:dur,note:$('#cn').value.trim(),guests:Math.min(Math.max((parseInt($('#cg').value)||1)-1,0),S.cfg.maxGuests),guestNames:($('#cgn').value||'').trim().slice(0,150),status:'pending',points:0,loggedBy:S.user.uid,approvedBy:''});
    await updateDoc(doc(db,'users',S.user.uid),{activeClockIn:null});A.close();toast('Submitted for approval')}),
  _approve:guard(async id=>{
    const l=findLog(id),ppd=S.cfg.pointsPerDay;let p=l.durationHours>=2?ppd:0,why='This log is under 2 hours.';
    if(!inYear(l)&&!confirm('This log is dated outside the program year, so it will not count toward the household total. Approve anyway?'))return;
    if(allLogs().some(x=>x.id!==id&&x.hhId===l.hhId&&x.date===l.date&&x.status==='approved'&&x.points>0)){p=0;why='This household already earned points for this day (one work day counts once).'}
    if(p>0)p+=guestBonus(l);
    if(p===0&&!confirm(why+' Approve with 0 points?'))return;
    await updateDoc(doc(db,'attendance',id),{status:'approved',points:p,approvedBy:S.user.email+(S.role==='parent'?' (Pod Commander)':'')});toast(p?`Approved +${p}`:'Approved, 0 points')}),
  setStatus:guard(async(id,s)=>{await updateDoc(doc(db,'attendance',id),{status:s,points:0,approvedBy:s==='pending'?'':S.user.email})}),
  delLog:guard(async id=>{if(confirm('Delete this log permanently?'))await deleteDoc(doc(db,'attendance',id))}),
  userSet:guard(async(id,s)=>{await updateDoc(doc(db,'users',id),{status:s})}),
  userDel:guard(async id=>{if(confirm('Remove this account\'s access?'))await deleteDoc(doc(db,'users',id))}),
  setTarget:guard(async(id,v)=>{await updateDoc(doc(db,'households',id),{targetType:v});toast('Target updated')}),
  hhModal,manualModal,
  saveManual:guard(async()=>{
    const hh=$('#mH').value,i=new Date($('#mI').value),o=new Date($('#mO').value);
    if(isNaN(i)||isNaN(o)||o<=i)return toast('Time out must be after time in');
    const dur=Math.round((o-i)/36e3)/100,ok=$('#mA').checked;let p=0;const g=Math.min(Math.max((+$('#mG').value||1)-1,0),S.cfg.maxGuests);
    if(!inRange(ymd(i),S.cfg.yearStart,S.cfg.yearEnd)&&!confirm('This date is outside the program year, so it will not count toward the household total. Save anyway?'))return;
    if(ok&&dur>=2&&!S.att.some(x=>x.hhId===hh&&x.date===ymd(i)&&x.status==='approved'&&x.points>0))p=S.cfg.pointsPerDay+g*S.cfg.guestPoints;
    await addDoc(collection(db,'attendance'),{hhId:hh,pod:S.hh[hh]?.pod||'',date:ymd(i),timeIn:i.toISOString(),timeOut:o.toISOString(),durationHours:dur,note:$('#mN').value.trim(),guests:g,status:ok?'approved':'pending',points:p,loggedBy:S.user.uid,approvedBy:ok?S.user.email:''});
    A.close();toast(ok&&!p?'Saved with 0 points (under 2h or day already counted)':'Log saved')}),
  saveCfg:guard(async()=>{const n=id=>+$(id).value;
    await setDoc(doc(db,'config','program'),{targetStandard:n('#tS'),targetAdjusted:n('#tA'),pointsPerDay:n('#tP'),guestPoints:n('#tG'),maxGuests:n('#tM'),onTrackStandard:n('#oS'),onTrackAdjusted:n('#oA')},{merge:true});toast('Settings saved')}),
  importXlsx:guard(async()=>{
    const f=$('#xf').files[0];if(!f)return toast('Choose the Excel file first');
    const wb=XLSX.read(await f.arrayBuffer()),ws=wb.Sheets['Sorted by Barangay']||wb.Sheets[wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(ws,{defval:''}).filter(r=>String(r['Scholar ID']).trim()&&String(r['Household ID']).trim());
    if(!rows.length)return toast('No scholar rows found');
    const existing={};(await getDocs(collection(db,'households'))).forEach(d=>existing[d.id]=d.data());
    const g={};rows.forEach(r=>(g[String(r['Household ID']).trim()]??=[]).push(r));
    const first=(rs,k)=>String(rs.map(r=>r[k]).find(v=>String(v).trim())??'').trim();
    const phone=v=>/^9\d{9}$/.test(v)?'0'+v:v;
    const b=writeBatch(db),dir={},ds={};
    for(const [id,rs] of Object.entries(g)){
      const name=String(rs[0]['Last Name']).trim();dir[id]=name;ds[id]=rs.map(r=>String(r['First Name']).trim()).filter(Boolean);
      const d={name,barangay:first(rs,'Barangay')},em=first(rs,'E-mail Address').toLowerCase(),ph=phone(first(rs,'Contact Number')),c={};
      if(em)c.masterEmail=em;if(ph)c.contactNumber=ph;
      if(!existing[id]){d.targetType='standard';d.createdAt=Date.now()}else if(existing[id].pod)c.pod=String(existing[id].pod);
      b.set(doc(db,'households',id),d,{merge:true});
      if(Object.keys(c).length)b.set(doc(db,'contacts',id),c,{merge:true});
    }
    rows.forEach(r=>b.set(doc(db,'scholars',String(r['Scholar ID']).trim()),{householdId:String(r['Household ID']).trim(),firstName:String(r['First Name']).trim(),lastName:String(r['Last Name']).trim(),gradeLevel:String(r['Grade Level']).trim()}));
    b.set(doc(db,'config','program'),{directory:dir,dirScholars:S.cfg.claimNames===false?deleteField():ds,...Object.fromEntries(Object.entries(DEF).filter(([k])=>k!=='directory'&&S.cfg[k]===DEF[k]).map(([k])=>[k,DEF[k]]))},{merge:true});
    await b.commit();toast(`Imported ${Object.keys(g).length} households, ${rows.length} scholars`)}),
  exportXlsx:guard(()=>{
    const sum=Object.keys(S.hh).sort().map(id=>{const h=S.hh[id],p=pts(id);return{'Household ID':id,Name:h.name,Barangay:h.barangay,Target:target(h),'Current Points':p,Standing:standing(h,p)[0]}});
    const logs=[...S.att].sort((a,b)=>a.timeIn>b.timeIn?1:-1).map(a=>({Type:a.kind||'work',Date:a.date,'Household ID':a.hhId,'Time In':fmtT(a.timeIn),'Time Out':fmtT(a.timeOut),Note:a.note,Points:a.points,Status:a.status}));
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(sum),'Household Summary');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(logs),'Attendance Logs');
    XLSX.writeFile(wb,`ugnayan-gulayan-${ymd(new Date())}.xlsx`)})
});
