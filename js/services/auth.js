import {ADMIN_EMAIL,DEF,LIAISON_EMAIL} from "../config.js";
import {DEFCROPS,pushStats} from "../domain/farm.js";
import {auth,collection,db,doc,onAuthStateChanged,onSnapshot,query,setDoc,updateDoc,where} from "../firebase.js";
import {A,S} from "../state.js";
import {render} from "../ui/render.js";
import {isStaff,toD,toast,uid,ymd} from "../util.js";
/* ---------- auth + subscriptions ---------- */
function clearSubs(){if(S._cmdUn)S._cmdUn();S._cmdUn=null;S._cmdKey='';S.unsubs.forEach(u=>u());S.unsubs=[];clearInterval(S.timer)}
const sub=(ref,cb)=>S.unsubs.push(onSnapshot(ref,cb,e=>{console.error(e);toast('Permission or network error: '+e.code)}));
onAuthStateChanged(auth,user=>{
  clearSubs();S.user=user;S.profile=undefined;S.hh={};S.att=[];S.users=[];S.podHh={};S.podAtt=[];S._pod=null;S._pn0=null;S._hhSub=false;S.contacts={};S.pp={};S.holders={};S.myContact=null;S.myPp=null;S.podContacts={};S.podPts={};S.reqFrom=[];S.reqTo=[];S._attOk=false;S._cfgOk=false;S.ann=[];S.sum=null;S.years=[];S.events=[];S.harv=[];S.plant=[];S.fstats=null;S.claimSel=null;S.claimQ='';S._dirTried=false;
  if(!user){S.role=null;return render()}
  const em=(user.email||'').toLowerCase();
  S.role=em===ADMIN_EMAIL?'admin':em===LIAISON_EMAIL?'liaison':'parent';S.tab=S.role==='admin'?'dash':'approvals';
  sub(doc(db,'config','program'),s=>{S.cfg={...DEF,...(s.data()||{})};
    S.cfg.yearStart=toD(S.cfg.yearStart);S.cfg.yearEnd=toD(S.cfg.yearEnd);
    S._cfgOk=true;if(S.role==='admin'&&!(s.data()||{}).crops)setDoc(doc(db,'config','program'),{crops:DEFCROPS},{merge:true});
    if(S.role==='admin'&&S.cfg.claimNames!==false&&!S.cfg.dirScholars&&!S._dirTried){S._dirTried=true;setTimeout(()=>A.refreshDirectory(true),0)}const tt=S.cfg.terms||[];if(tt.length===3&&tt.every(t=>!t.end)&&tt.map(t=>t.pct).join()==='33,66,100')S.cfg.terms=DEF.terms;render()});
  if(isStaff()){
    S.profile={status:'active'};
    sub(collection(db,'households'),s=>{S.hh={};s.forEach(d=>S.hh[d.id]=d.data());render()});
    sub(collection(db,'attendance'),s=>{S.att=s.docs.map(d=>({id:d.id,...d.data()}));S._attOk=true;render()});
    sub(collection(db,'contacts'),s=>{S.contacts={};s.forEach(d=>S.contacts[d.id]=d.data());render()});
    sub(collection(db,'podpoints'),s=>{S.pp={};s.forEach(d=>S.pp[d.id]=d.data());render()});
    sub(collection(db,'roleHolders'),s=>{S.holders={};s.forEach(d=>S.holders[d.id]=d.data());render()});
    sub(collection(db,'harvests'),s=>{S.harv=s.docs.map(d=>({id:d.id,...d.data()}));if(S._pushPending){S._pushPending=false;pushStats()}render()});
    sub(collection(db,'plantings'),s=>{S.plant=s.docs.map(d=>({id:d.id,...d.data()}));render()});
    sub(collection(db,'users'),s=>{S.users=s.docs.map(d=>({id:d.id,...d.data()}));S.users.forEach(u=>sweep(u.id,u));render()});
    sub(collection(db,'announcements'),s=>{S.ann=s.docs.map(d=>({id:d.id,...d.data()})).sort((x,y)=>(y.createdAt||0)-(x.createdAt||0));render()});
    if(S.role==='admin'){sub(collection(db,'years'),s=>{S.years=s.docs.map(d=>d.data());render()});sub(collection(db,'yearEvents'),s=>{S.events=s.docs.map(d=>({id:d.id,...d.data()}));render()})}
  }else{
    sub(doc(db,'users',user.uid),s=>{
      S.profile=s.exists()?s.data():null;sweep(user.uid,S.profile);
      if(S.profile?.status==='active'&&S.profile.householdId&&!S._hhSub){
        S._hhSub=true;const id=S.profile.householdId;
        sub(doc(db,'households',id),x=>{S.hh={[id]:x.data()};const pd=x.data()?.pod;
          if(pd&&S._pod!==pd){if(S._pn0!=null)S.unsubs.slice(S._pn0,S._pn0+4).forEach(u=>u());S._pn0=S.unsubs.length;S._pod=pd;S.podHh={};S.podContacts={};S.podPts={};S.holders={};
            sub(query(collection(db,'households'),where('pod','==',pd)),y=>{S.podHh={};y.forEach(d=>S.podHh[d.id]=d.data());render()});
            sub(query(collection(db,'contacts'),where('pod','==',pd),where('shared','==',true)),y=>{S.podContacts={};y.forEach(d=>S.podContacts[d.id]=d.data());render()});
            sub(query(collection(db,'podpoints'),where('pod','==',pd),where('shown','==',true)),y=>{S.podPts={};y.forEach(d=>S.podPts[d.id]=d.data());render()});
            sub(query(collection(db,'roleHolders'),where('pod','==',pd)),y=>{S.holders={};y.forEach(d=>S.holders[d.id]=d.data());render()})}
          render()});
        sub(doc(db,'contacts',id),x=>{S.myContact=x.exists()?x.data():null;render()});
        sub(doc(db,'podpoints',id),x=>{S.myPp=x.exists()?x.data():null;render()});
        sub(query(collection(db,'plantings'),where('hhId','==',id)),x=>{S.plant=x.docs.map(d=>({id:d.id,...d.data()}));render()});
        sub(collection(db,'announcements'),x=>{S.ann=x.docs.map(d=>({id:d.id,...d.data()})).sort((p,q)=>(q.createdAt||0)-(p.createdAt||0));render()});
        sub(doc(db,'summary','dashboard'),x=>{S.sum=x.exists()?x.data():null;render()});
        sub(doc(db,'farmstats','summary'),x=>{S.fstats=x.exists()?x.data():null;render()});
        sub(query(collection(db,'requests'),where('fromHh','==',id)),x=>{S.reqFrom=x.docs.map(d=>({id:d.id,...d.data()}));render()});
        sub(query(collection(db,'requests'),where('toHh','==',id)),x=>{S.reqTo=x.docs.map(d=>({id:d.id,...d.data()}));render()});
        sub(query(collection(db,'attendance'),where('hhId','==',id)),x=>{S.att=x.docs.map(d=>({id:d.id,...d.data()}));S._attOk=true;render()});
      }
      render();
    });
  }
});
async function sweep(uid,u){if(!u?.activeClockIn||(Date.now()-new Date(u.activeClockIn))/36e5<S.cfg.maxShiftHours)return;
  const tin=new Date(u.activeClockIn),tout=new Date(+tin+S.cfg.maxShiftHours*36e5);
  try{await setDoc(doc(db,'attendance',`auto_${uid}_${tin.getTime()}`),{hhId:u.householdId,pod:S.hh[u.householdId]?.pod||'',date:ymd(tin),timeIn:tin.toISOString(),timeOut:tout.toISOString(),durationHours:+S.cfg.maxShiftHours,note:'Auto-closed: no clock-out',autoClosed:true,status:'pending',points:0,loggedBy:uid,approvedBy:''})}catch(e){}
  try{await updateDoc(doc(db,'users',uid),{activeClockIn:null})}catch(e){}}
export {clearSubs,sub,sweep};
