import {A,S} from "../state.js";
import {ic} from "../ui/icons.js";
import {open_} from "../ui/render.js";
import {$,ymd} from "../util.js";
Object.assign(A,{
 histView:v=>{S.hist.v=v;A.r()},
 histMonth:d=>{const o=S.hist,[y,m]=(o.m||ymd(new Date()).slice(0,7)).split('-').map(Number),n=new Date(y,m-1+d,1);o.m=ymd(n).slice(0,7);o.d=null;A.r()},
 histToday:()=>{const t=ymd(new Date());S.hist.m=t.slice(0,7);S.hist.d=t;A.r()},
 histDay:d=>{S.hist.d=d;if(d.slice(0,7)!==S.hist.m)S.hist.m=d.slice(0,7);A.r();setTimeout(()=>{if(innerWidth<900){const e=document.getElementById('dayDetail');if(e)e.scrollIntoView({behavior:'smooth',block:'start'})}},60)},
 histType:k=>{const o=S.hist;o.t[k]=!o.t[k];if(!o.t.att&&!o.t.plant&&!o.t.harv)o.t.att=true;o.n=50;A.r()},
 histSet:(k,v)=>{S.hist[k]=v;S.hist.n=50;A.r()},
 histMore:()=>{S.hist.n+=50;A.r()},
 moreMenu:()=>open_(`<h2>More</h2>${[['farm','Farm','eco'],['users','Users','person'],['settings','Settings','tune']].map(([k,l,i])=>`<button class="text" style="width:100%;display:flex;justify-content:flex-start;gap:16px;align-items:center;min-height:56px;font-size:16px;color:var(--txt)" onclick="A.close();S_.tab='${k}';A.r()">${ic(i)}<span>${l}</span></button>`).join('')}`)
});
