import {target} from "../domain/points.js";
import {db,doc,setDoc} from "../firebase.js";
import {A,S} from "../state.js";
import {open_} from "../ui/render.js";
import {$,guard,toast,uid} from "../util.js";
import {initBlocks,md,programHtml,redrawBlk,slideEmbed} from "../views/program.js";
import {redrawTerms,termsHtml} from "../views/settings.js";
Object.assign(A,{
 setTerm:(i,k,v)=>{S.td[i][k]=k==='pct'?+v:v},
 addTerm:()=>{termsHtml();S.td.push({name:'Term '+(S.td.length+1),end:'',pct:100});redrawTerms()},
 delTerm:i=>{S.td.splice(i,1);redrawTerms()},
 evenTerms:()=>{termsHtml();const n=S.td.length;S.td.forEach((t,i)=>t.pct=Math.round(100*(i+1)/n));redrawTerms()}
});
Object.assign(A,{
 setBlk:(i,k,v)=>{if(S.pb&&S.pb[i])S.pb[i][k]=v},
 addBlk:t=>{S.pb??=initBlocks();S.pb.push({id:uid(),type:t,title:'',url:'',md:''});redrawBlk();const l=$('#blkBox').lastElementChild;if(l)l.scrollIntoView({behavior:'smooth',block:'center'})},
 delBlk:i=>{const b=S.pb[i];if((b.title||b.url||b.md)&&!confirm('Delete this block?'))return;S.pb.splice(i,1);redrawBlk()},
 moveBlk:(i,d)=>{const j=i+d;if(j<0||j>=S.pb.length)return;[S.pb[i],S.pb[j]]=[S.pb[j],S.pb[i]];redrawBlk()},
 previewBlocks:()=>open_(`<div class="row sp"><h2 style="margin:0">Preview</h2><button class="text" onclick="A.close()">Close</button></div><p class="mut">This is how households will see it.</p>${programHtml((S.pb||initBlocks()).filter(b=>b.title||b.md||slideEmbed(b.url)))}`),
 saveBlocks:guard(async()=>{const bl=(S.pb||initBlocks()).map(b=>({id:b.id,type:b.type,title:b.title.trim(),url:b.type==='slides'?b.url.trim():'',md:b.md.trim()}));
   const bad=bl.findIndex(b=>b.type==='slides'?!slideEmbed(b.url):!(b.title||b.md));
   if(bad>=0)return toast(bl[bad].type==='slides'?'Block '+(bad+1)+': add a valid Google Slides link':'Block '+(bad+1)+' is empty');
   await setDoc(doc(db,'config','program'),{programBlocks:bl},{merge:true});S.pb=null;A.r();toast('Program page saved')}),
 saveClock:guard(async()=>{await setDoc(doc(db,'config','program'),{clockOpen:$('#cO').value,clockClose:$('#cC').value,maxShiftHours:+$('#cM').value},{merge:true});toast('Clock-in saved')}),
 saveTerms:guard(async()=>{let terms=(S.td||S.cfg.terms||[]).map((t,i)=>({name:String(t.name||'').trim()||'Term '+(i+1),end:t.end||'',pct:+t.pct||0}));const dated=terms.every(t=>t.end);
   if(terms.some(t=>t.end&&!(t.pct>0&&t.pct<=100)))return toast('A term with an end date needs a % from 1 to 100');
   if(dated)terms=terms.sort((a,b)=>a.end>b.end?1:-1);
   if(dated&&terms.length&&terms[terms.length-1].pct!==100&&!confirm('The last term is not 100% of the target. Save anyway?'))return;
   await setDoc(doc(db,'config','program'),{terms},{merge:true});S.td=null;A.r();toast('Terms saved')})
});
document.addEventListener('pointerdown',e=>{const g=e.target.closest&&e.target.closest('[data-grip]');if(!g||S.role!=='admin')return;e.preventDefault();
  const box=$('#blkBox'),el=g.closest('.blk');if(!box||!el)return;el.classList.add('drag');g.setPointerCapture(e.pointerId);
  const mv=ev=>{const y=ev.clientY;if(y<90)scrollBy(0,-14);else if(y>innerHeight-90)scrollBy(0,14);const nx=[...box.children].filter(c=>c!==el).find(c=>{const r=c.getBoundingClientRect();return y<r.top+r.height/2});box.insertBefore(el,nx||null)};
  const up=()=>{g.removeEventListener('pointermove',mv);g.removeEventListener('pointerup',up);g.removeEventListener('pointercancel',up);S.pb=[...box.children].map(c=>S.pb.find(b=>b.id===c.dataset.id));redrawBlk()};
  g.addEventListener('pointermove',mv);g.addEventListener('pointerup',up);g.addEventListener('pointercancel',up)});
