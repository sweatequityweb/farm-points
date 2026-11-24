import {r2} from "./points.js";
import {db,doc,setDoc} from "../firebase.js";
import {S} from "../state.js";
import {inRange} from "../util.js";
const HDEST={feeding:'Fed to scholars',sold:'Sold',shared:'Shared with households',other:'Other'};
const DEFCROPS=['Ampalaya','Kalabasa','Patola','Kamatis','Cherry tomato','Mustasa','Okra','Talong','Sitaw','Pechay','Kangkong','Sili','Upo','Mais','Saging'];
const cropList=()=>[...new Set([...(S.cfg.crops&&S.cfg.crops.length?S.cfg.crops:DEFCROPS),...S.harv.map(h=>h.crop)].filter(Boolean))].sort();
const hInYear=h=>inRange(h.date,S.cfg.yearStart,S.cfg.yearEnd);
const cap1=t=>{t=String(t||'').trim().replace(/\s+/g,' ');return t?t[0].toUpperCase()+t.slice(1):''};
const qtyText=c=>[c.kg?c.kg+' kg':'',c.pcs?c.pcs+' pcs':'',c.bundle?c.bundle+' bundles':''].filter(Boolean).join(' \u00b7 ');
function calcStats(){const H=S.harv.filter(hInYear),by={},dest={};let tk=0;
  H.forEach(h=>{const c=by[h.crop]??={kg:0,pcs:0,bundle:0};c[h.unit]=(c[h.unit]||0)+(+h.qty||0);if(h.unit==='kg'){tk+=+h.qty||0;dest[h.dest]=(dest[h.dest]||0)+(+h.qty||0)}});
  const crops=Object.entries(by).map(([crop,v])=>({crop,kg:r2(v.kg),pcs:r2(v.pcs),bundle:r2(v.bundle)})).sort((a,b)=>b.kg-a.kg||(b.pcs+b.bundle)-(a.pcs+a.bundle)).slice(0,10);
  return{year:S.cfg.currentYear||'',kg:r2(tk),dest:Object.fromEntries(Object.entries(dest).map(([k,v])=>[k,r2(v)])),crops,entries:H.length,updatedAt:Date.now()}}
const pushStats=async()=>{try{await setDoc(doc(db,'farmstats','summary'),calcStats())}catch(e){console.error(e)}};
const cropsCat=()=>S.cfg.crops&&S.cfg.crops.length?S.cfg.crops:DEFCROPS;
export {DEFCROPS,HDEST,calcStats,cap1,cropList,cropsCat,hInYear,pushStats,qtyText};
