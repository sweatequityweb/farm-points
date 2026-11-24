import {S} from "./state.js";
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isStaff=()=>S.role==='admin'||S.role==='liaison';
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const fmtT=iso=>iso?new Date(iso).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):'—';
const fmtD=s=>new Date(s+'T00:00').toLocaleDateString([], {month:'short',day:'numeric',year:'numeric'});
const hrs=h=>{const m=Math.round(h*60);return `${Math.floor(m/60)}h ${pad(m%60)}m`};
const toast=m=>{const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>t.style.display='none',3000)};
const guard=fn=>async(...a)=>{try{return await fn(...a)}catch(e){console.error(e);toast('Error: '+(e.code||e.message))}};
/* ---------- derived data ---------- */
/* Normalise a date that may be a string, Date, number, Firestore Timestamp
   or full ISO string, so year-window comparisons never silently fail. */
const toD=v=>{if(!v)return'';if(typeof v==='string')return v.slice(0,10);if(typeof v==='number')return ymd(new Date(v));
  if(v.toDate)return ymd(v.toDate());if(v.seconds!==undefined)return ymd(new Date(v.seconds*1000));
  if(v instanceof Date)return ymd(v);return String(v).slice(0,10)};
const yLabel=id=>String(id||'').replace('-','\u2013');
const inRange=(d,a,b)=>{d=toD(d);a=toD(a);b=toD(b);return(!a||d>=a)&&(!b||d<=b)};
const inYear=a=>inRange(a.date,S.cfg.yearStart,S.cfg.yearEnd);
const yearOver=()=>!!S.cfg.yearEnd&&ymd(new Date())>toD(S.cfg.yearEnd);
const uid=()=>Math.random().toString(36).slice(2,8);
export {$,esc,fmtD,fmtT,guard,hrs,inRange,inYear,isStaff,pad,toD,toast,uid,yLabel,yearOver,ymd};
