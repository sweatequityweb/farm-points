import {target} from "../domain/points.js";
import {app} from "../firebase.js";
import {A,S} from "../state.js";
import {$,esc,uid} from "../util.js";
const slideEmbed=u=>{const m=String(u||'').match(/presentation\/d\/(e\/)?([\w-]+)/);return m?`https://docs.google.com/presentation/d/${m[1]||''}${m[2]}/embed?start=false&loop=false`:''};
function programView(){const bl=S.cfg.programBlocks??(S.cfg.slidesUrl?[{type:'slides',title:'About the program',url:S.cfg.slidesUrl,md:''}]:[]);$('#app').innerHTML=programHtml(bl)}
function md(src){const E=t=>t.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const inl=t=>E(t).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<i>$2</i>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  const out=[];let list=null,para=[];const flush=()=>{if(para.length){out.push('<p>'+inl(para.join(' '))+'</p>');para=[]}},endL=()=>{if(list){out.push('</'+list+'>');list=null}};
  for(const raw of String(src||'').split('\n')){const l=raw.trimEnd();let m;
    if(!l.trim()){flush();endL();continue}
    if(m=/^(#{1,3})\s+(.*)$/.exec(l)){flush();endL();out.push('<h'+(m[1].length+1)+'>'+inl(m[2])+'</h'+(m[1].length+1)+'>')}
    else if(/^(-{3,}|\*{3,})$/.test(l.trim())){flush();endL();out.push('<hr>')}
    else if(m=/^\s*[-*]\s+(.*)$/.exec(l)){flush();if(list!=='ul'){endL();out.push('<ul>');list='ul'}out.push('<li>'+inl(m[1])+'</li>')}
    else if(m=/^\s*\d+[.)]\s+(.*)$/.exec(l)){flush();if(list!=='ol'){endL();out.push('<ol>');list='ol'}out.push('<li>'+inl(m[1])+'</li>')}
    else if(m=/^>\s?(.*)$/.exec(l)){flush();endL();out.push('<blockquote>'+inl(m[1])+'</blockquote>')}
    else{endL();para.push(l.trim())}}
  flush();endL();return out.join('')}
function programHtml(bl){return bl.length?bl.map(b=>{const u=b.type==='slides'?slideEmbed(b.url):'';
  return `<div class="card">${b.title?`<h2>${esc(b.title)}</h2>`:''}${u?`<div style="position:relative;padding-top:56.25%;border-radius:8px;overflow:hidden"><iframe src="${esc(u)}" style="position:absolute;inset:0;width:100%;height:100%;border:0" allowfullscreen title="${esc(b.title||'Slides')}"></iframe></div><p><a href="${esc(b.url)}" target="_blank" rel="noopener">Open in Google Slides</a></p>`:''}${b.md?`<div class="md">${md(b.md)}</div>`:''}</div>`}).join(''):'<div class="card"><p class="mut">Nothing has been added yet.</p></div>'}
function initBlocks(){return JSON.parse(JSON.stringify(S.cfg.programBlocks??(S.cfg.slidesUrl?[{id:uid(),type:'slides',title:'About the program',url:S.cfg.slidesUrl,md:''}]:[]))).map(b=>({id:b.id||uid(),type:b.type,title:b.title||'',url:b.url||'',md:b.md||''}))}
function blocksHtml(){S.pb??=initBlocks();const bt='style="padding:0 14px"';
  return S.pb.map((b,i)=>`<div class="blk" data-i="${i}" data-id="${b.id}"><div class="row" style="flex-wrap:nowrap;gap:4px"><span class="grip" data-grip role="button" aria-label="Drag to reorder">\u2807</span><span class="chip ${b.type==='slides'?'approved':'pending'}">${b.type==='slides'?'Slides':'Text'}</span><span class="grow"></span><button class="ghost sm" ${bt} aria-label="Move up" onclick="A.moveBlk(${i},-1)">\u25b2</button><button class="ghost sm" ${bt} aria-label="Move down" onclick="A.moveBlk(${i},1)">\u25bc</button><button class="ghost sm" ${bt} aria-label="Delete block" onclick="A.delBlk(${i})">\u2715</button></div>
  <label>Title (optional)</label><input value="${esc(b.title)}" oninput="A.setBlk(${i},'title',this.value)">
  ${b.type==='slides'?`<label>Google Slides link</label><input value="${esc(b.url)}" inputmode="url" placeholder="https://docs.google.com/presentation/d/..." oninput="A.setBlk(${i},'url',this.value)">`:''}
  <label>${b.type==='slides'?'Description (Markdown, optional)':'Text (Markdown)'}</label><textarea rows="${b.type==='slides'?3:6}" oninput="A.setBlk(${i},'md',this.value)">${esc(b.md)}</textarea></div>`).join('')||'<p class="mut">No blocks yet. Add slides or text below.</p>'}
const redrawBlk=()=>{const b=$('#blkBox');if(b)b.innerHTML=blocksHtml()};
export {blocksHtml,initBlocks,md,programHtml,programView,redrawBlk,slideEmbed};
