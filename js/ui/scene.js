import {A} from "../state.js";
/* Living farm landscape, drawn with code (canvas 2D). Sky follows the real time of day.
   Reacts to the pointer: grass bends, hills and clouds drift (parallax), butterflies/fireflies follow,
   taps grow a seedling into a flower. Respects reduced-motion, pauses when hidden, lowers quality on slow phones. */
const TAU=Math.PI*2,lerp=(a,b,t)=>a+(b-a)*t,cl=(v,a,b)=>Math.min(b,Math.max(a,v)),rnd=(a,b)=>a+Math.random()*(b-a),ease=t=>1-Math.pow(1-t,3);
const hx=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const K=[[0,'#0b1d2e','#1f3a4d','#2b4a4a','#244238','#1c3a2c','#16301f',0],[5.5,'#3b4a73','#f2a88c','#6f7f8e','#4f7a58','#3f7a45','#2f6a35',.25],[8,'#7ec8e8','#fbe7c6','#8fb4b8','#6aa56a','#4f9a4f','#3f8a3f',.8],[12,'#4fa8dc','#cfeaf5','#86b2b6','#62a35c','#4c964a','#3d8a3b',1],[17,'#6aa8d8','#fbd9a0','#8aa8aa','#5f9b55','#4a8f45','#3b7f38',.85],[19,'#4a4a8a','#f58f6a','#6b6a8a','#4a7050','#3b6a40','#2f5a33',.35],[21,'#101a35','#2b3a5a','#2b4a4a','#244238','#1c3a2c','#16301f',0],[24,'#0b1d2e','#1f3a4d','#2b4a4a','#244238','#1c3a2c','#16301f',0]].map(r=>[r[0],...r.slice(1,7).map(hx),r[7]]);
const mixc=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t)),rgb=(c,a=1)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
function pal(h){let i=0;while(i<K.length-2&&h>K[i+1][0])i++;const a=K[i],b=K[i+1],t=cl((h-a[0])/(b[0]-a[0]),0,1);return[...Array(6)].map((_,j)=>mixc(a[j+1],b[j+1],t)).concat([lerp(a[7],b[7],t)])}
const FL=['#ffffff','#ffd54f','#f48fb1','#ffab40'];
const s={w:0,h:0,dpr:1,mode:'login',v:0,px:-999,py:-999,pv:0,mx:0,tmx:0,t:0,last:-99,lt:0,on:true,low:false,sl:0,still:false,rows:[],clouds:[],stars:[],birds:[],bugs:[],sp:[],rings:[],parts:[],raf:0,c:null,cv:null};
const ridge=(x,w,a)=>Math.sin(x/w*TAU*1.1+a[2])*a[0]+Math.sin(x/w*TAU*2.3+a[2]*1.7)*a[0]*.45;
function build(){const{w,h}=s,q=s.low?.55:1;
  s.rows=[0,1,2].map(r=>{const n=Math.round(w/(11+r*3)*q*(s.mode==='login'?1:.8)),y=h*(.85+r*.06),sc=.7+r*.3,B=[];
    for(let i=0;i<n;i++)B.push({x:(i+Math.random())/n*(w+40)-20,y:y+rnd(-6,6),h:h*.07*sc*rnd(.6,1.25),p:rnd(0,TAU),c:Math.floor(Math.random()*3),b:0,v:0,f:Math.random()<.07?Math.floor(Math.random()*4):-1});return{B}});
  s.clouds=[...Array(5)].map(()=>({x:rnd(0,w),y:rnd(.08,.38)*h,k:rnd(.6,1.4),v:rnd(4,12)}));
  s.stars=[...Array(s.low?30:70)].map(()=>({x:Math.random()*w,y:Math.random()*h*.5,r:rnd(.4,1.4),p:rnd(0,TAU)}));
  s.birds=[...Array(3)].map(()=>({x:-rnd(50,w),y:rnd(.12,.35)*h,v:rnd(30,55),p:rnd(0,TAU)}));
  s.bugs=[...Array(s.low?3:6)].map(()=>({x:rnd(0,w),y:rnd(.5,.9)*h,vx:0,vy:0,p:rnd(0,TAU),tx:rnd(0,w),ty:rnd(.5,.9)*h,tt:0}))}
function fit(){const cv=s.cv;s.dpr=Math.min(window.devicePixelRatio||1,s.low||s.mode==='app'?1:1.5);s.w=window.innerWidth||360;s.h=window.innerHeight||640;
  cv.width=Math.round(s.w*s.dpr);cv.height=Math.round(s.h*s.dpr);build();if(s.still)draw(0)}
function draw(dt){const c=s.c,{w,h}=s,t=s.t,d=new Date(),hr=d.getHours()+d.getMinutes()/60;c.setTransform(s.dpr,0,0,s.dpr,0,0);
  s.v+=((s.mode==='app'?1:0)-s.v)*Math.min(1,dt*2.5);s.mx+=(s.tmx-s.mx)*Math.min(1,dt*3);s.pv*=.9;
  let p=pal(hr);const bl=.75*s.v,pn=pal(12);p=p.map((x,i)=>i<6?mixc(x,pn[i],bl):x);const L=lerp(p[6],1,bl),act=t-s.last<2.2,mx=s.mx;
  let g=c.createLinearGradient(0,0,0,h*.75);g.addColorStop(0,rgb(p[0]));g.addColorStop(1,rgb(p[1]));c.fillStyle=g;c.fillRect(0,0,w,h);
  const sa=(1-L)*(1-L);if(sa>.02){c.fillStyle='#fff';for(const o of s.stars){c.globalAlpha=sa*(.5+.5*Math.sin(t*1.5+o.p));c.beginPath();c.arc(o.x-mx*4,o.y,o.r,0,TAU);c.fill()}c.globalAlpha=1}
  const u=cl((hr-6)/12,0,1),sx=w*(.12+.76*u)-mx*10,sy=h*.58-Math.sin(u*Math.PI)*h*.4,mu=((hr+6)%24)/12>1?1:((hr+6)%24)/12,moonx=w*(.12+.76*cl(mu,0,1))-mx*10,moony=h*.58-Math.sin(cl(mu,0,1)*Math.PI)*h*.4;
  const orb=(x,y,r,col,a)=>{if(a<.02)return;const gg=c.createRadialGradient(x,y,r*.3,x,y,r*4);gg.addColorStop(0,rgb(col,.5*a));gg.addColorStop(1,rgb(col,0));c.fillStyle=gg;c.fillRect(x-r*4,y-r*4,r*8,r*8);c.fillStyle=rgb(col,a);c.beginPath();c.arc(x,y,r,0,TAU);c.fill()};
  orb(sx,sy,24,[255,236,170],cl(L*1.6-.1,0,1)*(1-bl*.5));orb(moonx,moony,16,[236,242,255],cl(1-L*1.8,0,1)*(1-bl));
  const cc=mixc([255,255,255],[70,90,125],1-L);for(const o of s.clouds){o.x+=o.v*dt;if(o.x>w+120)o.x=-120;const x=o.x+mx*18*o.k;c.fillStyle=rgb(cc,.5+.3*L);c.beginPath();
    [[0,0,46,16],[-30,6,30,12],[32,5,34,12],[10,-9,28,14]].forEach(([ox,oy,rx,ry])=>{c.moveTo(x+ox*o.k+rx*o.k,o.y+oy*o.k);c.ellipse(x+ox*o.k,o.y+oy*o.k,rx*o.k,ry*o.k,0,0,TAU)});c.fill()}
  if(L>.55&&s.v<.8){c.strokeStyle='rgba(40,50,60,.65)';c.lineWidth=1.6;for(const b of s.birds){b.x+=b.v*dt;if(b.x>w+30){b.x=-30;b.y=rnd(.12,.35)*h}const f=Math.sin(t*9+b.p)*3.5;c.beginPath();c.moveTo(b.x-7,b.y+f);c.quadraticCurveTo(b.x-3,b.y-3,b.x,b.y);c.quadraticCurveTo(b.x+3,b.y-3,b.x+7,b.y+f);c.stroke()}}
  const hill=(y0,amp,ph,par,col)=>{c.beginPath();c.moveTo(0,h);for(let x=0;x<=w+8;x+=8)c.lineTo(x,y0+ridge(x-mx*par,w,[amp,0,ph]));c.lineTo(w,h);c.closePath();c.fillStyle=rgb(col);c.fill()};
  hill(h*.6,20,.3,6,p[2]);
  g=c.createLinearGradient(0,h*.55,0,h*.7);g.addColorStop(0,rgb([255,255,255],0));g.addColorStop(1,rgb([255,255,255],.2*L));c.fillStyle=g;c.fillRect(0,h*.55,w,h*.15);
  hill(h*.68,24,2.1,14,p[3]);c.strokeStyle=rgb([255,255,210],.09*L+.03);c.lineWidth=1.5;
  for(let k=1;k<=5;k++){c.beginPath();for(let x=0;x<=w+8;x+=8){const y=h*.68+k*h*.022+ridge(x-mx*14,w,[24,0,2.1])*(1-k*.1);x?c.lineTo(x,y):c.moveTo(x,y)}c.stroke()}
  hill(h*.77,16,4,26,p[4]);g=c.createLinearGradient(0,h*.8,0,h);g.addColorStop(0,rgb(p[4]));g.addColorStop(1,rgb(mixc(p[5],[0,15,5],.35)));c.fillStyle=g;c.fillRect(0,h*.8,w,h*.2);
  const R=Math.min(130,w*.25),wind=Math.sin(t*.4)*.5+.5;
  s.rows.forEach((row,ri)=>{const sh=.25*(2-ri)/2,cols=[mixc(p[4],[0,20,10],sh),mixc(mixc(p[4],[190,225,110],.3),[0,20,10],sh),mixc(mixc(p[5],[120,190,90],.25),[0,20,10],sh)];
    if(dt>0)for(const b of row.B){let push=0;if(act){const dd=Math.hypot(b.x-s.px,b.y-b.h*.6-s.py);if(dd<R){const f=1-dd/R;push=(b.x>=s.px?1:-1)*f*f*b.h*(.9+s.pv*.7)}}
      const tg=push+(Math.sin(t*1.1+b.p+b.x*.006)*.16+wind*.1)*b.h;b.v+=((tg-b.b)*38-b.v*5.5)*dt;b.b=cl(b.b+b.v*dt,-b.h*1.05,b.h*1.05)}
    cols.forEach((col,gi)=>{c.beginPath();for(const b of row.B)if(b.c===gi){c.moveTo(b.x,b.y);c.quadraticCurveTo(b.x+b.b*.25,b.y-b.h*.6,b.x+b.b,b.y-b.h*(1-Math.abs(b.b)/b.h*.12))}c.strokeStyle=rgb(col);c.lineWidth=1.6+ri*.5;c.lineCap='round';c.stroke()});
    for(const b of row.B)if(b.f>=0){c.globalAlpha=.6+.4*L;c.fillStyle=FL[b.f];c.beginPath();c.arc(b.x+b.b,b.y-b.h,2.2+ri*.7,0,TAU);c.fill()}c.globalAlpha=1;
    if(ri===1)sprouts(c,p,L)});
  bugs(c,dt,L,act);
  s.rings=s.rings.filter(o=>t-o.t0<.9);for(const o of s.rings){const a=(t-o.t0)/.9;c.strokeStyle=`rgba(255,255,255,${.7*(1-a)})`;c.lineWidth=2;c.beginPath();c.arc(o.x,o.y,a*Math.min(120,w*.2)+4,0,TAU);c.stroke()}
  s.parts=s.parts.filter(o=>t-o.t0<1.5);for(const o of s.parts){const a=t-o.t0;c.globalAlpha=1-a/1.5;c.fillStyle=o.c;c.beginPath();c.arc(o.x+o.vx*a,o.y+o.vy*a+90*a*a,2.4,0,TAU);c.fill()}c.globalAlpha=1;
  if(s.v>.01){c.fillStyle=`rgba(246,250,244,${.82*s.v})`;c.fillRect(0,0,w,h)}}
function sprouts(c,p,L){const t=s.t;s.sp=s.sp.filter(o=>t-o.t0<o.life);for(const o of s.sp){const age=t-o.t0,gr=ease(cl(age/2.4,0,1)),fade=cl((o.life-age)/2,0,1),hh=s.h*.13*gr*o.k,sw=Math.sin(t*1.6+o.p)*3*gr+(s.pv>.2?Math.sign(o.x-s.px)*3:0);c.globalAlpha=fade;
  c.strokeStyle=rgb(mixc([60,150,60],p[4],.3));c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(o.x,o.y);c.quadraticCurveTo(o.x+sw*.3,o.y-hh*.55,o.x+sw,o.y-hh);c.stroke();
  c.fillStyle=rgb(mixc([90,185,80],p[4],.25));for(const sg of[-1,1]){c.beginPath();c.ellipse(o.x+sw*.15+sg*7*gr,o.y-hh*.4,8*gr,3.5*gr,sg*-.6,0,TAU);c.fill()}
  const bm=ease(cl((age-1.6)/1.2,0,1));if(bm>0){const r=5+6*bm;c.fillStyle=o.col;for(let i=0;i<6;i++){const a=i/6*TAU+t*.3;c.beginPath();c.arc(o.x+sw+Math.cos(a)*r*.8,o.y-hh+Math.sin(a)*r*.8,r*.55,0,TAU);c.fill()}c.fillStyle='#ffe082';c.beginPath();c.arc(o.x+sw,o.y-hh,r*.4,0,TAU);c.fill()}}c.globalAlpha=1}
function bugs(c,dt,L,act){const t=s.t,day=L>.35;for(const o of s.bugs){o.tt-=dt;if(o.tt<=0){o.tt=rnd(2,5);o.tx=rnd(0,s.w);o.ty=rnd(.45,.9)*s.h}
  const tx=act?s.px+Math.cos(t*.8+o.p*3)*55:o.tx,ty=act?s.py+Math.sin(t*1.1+o.p*3)*40:o.ty;if(dt>0){o.vx+=((tx-o.x)*.9+Math.sin(t*3+o.p)*30)*dt;o.vy+=((ty-o.y)*.9+Math.cos(t*2.6+o.p)*30)*dt;o.vx*=1-1.8*dt;o.vy*=1-1.8*dt;o.x+=o.vx*dt;o.y+=o.vy*dt}
  if(day){const wg=Math.abs(Math.sin(t*14+o.p));c.fillStyle=o.p>3?'rgba(244,143,177,.9)':'rgba(255,193,7,.9)';for(const sg of[-1,1]){c.beginPath();c.ellipse(o.x+sg*(1.5+3*wg),o.y,2+3.5*wg,3.6,sg*.4,0,TAU);c.fill()}}
  else{const a=.5+.5*Math.sin(t*2+o.p),gg=c.createRadialGradient(o.x,o.y,0,o.x,o.y,12);gg.addColorStop(0,`rgba(220,255,120,${.85*a})`);gg.addColorStop(1,'rgba(220,255,120,0)');c.fillStyle=gg;c.fillRect(o.x-12,o.y-12,24,24)}}}
function bloom(x,y){const t=s.t;s.rings.push({x,y,t0:t});if(s.sp.length>=10)s.sp.shift();
  s.sp.push({x,y:cl(y,s.h*.84,s.h*.96),t0:t,p:rnd(0,TAU),k:rnd(.8,1.3),col:FL[1+Math.floor(Math.random()*3)],life:rnd(11,16)});
  for(let i=0;i<9;i++){const a=rnd(0,TAU),v=rnd(30,90);s.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,t0:t,c:FL[Math.floor(Math.random()*4)]})}}
const free=el=>!(el&&el.closest&&el.closest('button,a,input,select,textarea,label,.card,.heroc,header,nav,#modal,[onclick]'));
function loop(now){s.raf=0;if(!s.on||document.hidden)return;if(s.mode==='app'&&now-s.lt<30){s.raf=requestAnimationFrame(loop);return}
  const dt=Math.min(.05,(now-s.lt)/1000||.016);s.lt=now;s.t+=dt;s.sl=dt>.034?s.sl+1:Math.max(0,s.sl-1);if(s.sl>120&&!s.low){s.low=true;fit()}
  draw(dt);s.raf=requestAnimationFrame(loop)}
function go(){if(s.on&&!s.still&&!s.raf)s.raf=requestAnimationFrame(loop);if(s.still&&s.on)draw(0)}
function startScene(cv){if(!cv||!cv.getContext)return;s.cv=cv;s.c=cv.getContext('2d');try{s.on=localStorage.getItem('scene')!=='off'}catch(e){}
  s.still=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);s.low=(navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||4)<=2;
  cv.style.display=s.on?'':'none';fit();
  const mv=e=>{s.pv=cl(Math.hypot(e.clientX-s.px,e.clientY-s.py)/30,0,1);s.px=e.clientX;s.py=e.clientY;s.tmx=cl((s.px/s.w-.5)*2,-1,1);s.last=s.t};
  window.addEventListener('pointermove',mv,{passive:true});
  window.addEventListener('pointerdown',e=>{mv(e);if(s.on&&!s.still&&free(e.target))bloom(e.clientX,e.clientY)},{passive:true});
  let rt;window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(fit,150)});document.addEventListener('visibilitychange',()=>{if(!document.hidden){s.lt=performance.now();go()}});go()}
const sceneMode=m=>{if(s.mode!==m){s.mode=m;if(s.cv)s.still?draw(0):0}};
const sceneOn=()=>s.on;
Object.assign(A,{sceneToggle:()=>{s.on=!s.on;try{localStorage.setItem('scene',s.on?'on':'off')}catch(e){}if(s.cv)s.cv.style.display=s.on?'':'none';s.on?go():s.raf&&cancelAnimationFrame(s.raf);A.r()}});
export {sceneMode,sceneOn,startScene};
