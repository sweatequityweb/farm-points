/* Effects engine. Register an effect once, then play it from anywhere:
     onclick="FX.play('celebrate',this)"        (rainbow button + confetti)
   Add a new effect: FX.register('name',(el,opts)=>{...}). Effects are skipped when the phone asks for reduced motion. */
const reduced=()=>!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const reg={},COL=['#ef5350','#ffa726','#ffee58','#66bb6a','#42a5f5','#ab47bc','#ec407a'];
let cv,cx,parts=[],raf=0;
const size=()=>{cv.width=innerWidth;cv.height=innerHeight};
function layer(){if(cv)return;cv=document.createElement('canvas');cv.id='fx';cv.setAttribute('aria-hidden','true');cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:50';document.body.appendChild(cv);cx=cv.getContext('2d');size();addEventListener('resize',size)}
function tick(){cx.clearRect(0,0,cv.width,cv.height);const now=performance.now();parts=parts.filter(p=>now-p.t<p.life);
  for(const p of parts){const a=(now-p.t)/1000;cx.globalAlpha=1-(now-p.t)/p.life;cx.fillStyle=p.c;cx.save();cx.translate(p.x+p.vx*a,p.y+p.vy*a+520*a*a);cx.rotate(p.r+a*p.s);cx.fillRect(-p.w/2,-p.h/2,p.w,p.h);cx.restore()}
  cx.globalAlpha=1;raf=parts.length?requestAnimationFrame(tick):0}
const FX={register:(n,f)=>{reg[n]=f},play:(n,el,o={})=>{if(reduced()||!reg[n]||!el)return;try{reg[n](el,o)}catch(e){console.error(e)}}};
const restart=(el,c,ms)=>{el.classList.remove(c);void el.offsetWidth;el.classList.add(c);setTimeout(()=>el.classList.remove(c),ms)};
FX.register('burst',(el,o)=>{layer();const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
  for(let i=0;i<(o.n||46);i++){const a=Math.random()*Math.PI*2,v=120+Math.random()*320;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-220,c:COL[i%COL.length],w:6+Math.random()*6,h:3+Math.random()*5,r:Math.random()*6,s:(Math.random()-.5)*14,t:performance.now(),life:1100+Math.random()*700})}
  if(!raf)raf=requestAnimationFrame(tick)});
FX.register('rainbow',el=>restart(el,'fx-rainbow',1400));
FX.register('pop',el=>restart(el,'fx-pop',500));
FX.register('celebrate',(el,o)=>{FX.play('rainbow',el);FX.play('burst',el,o)});
window.FX=FX;
export {FX};
