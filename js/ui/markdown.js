/* Safe markdown for announcements. Everything is HTML-escaped first; only the tags below are ever produced.
   Supports: # headings, **bold**, *italic*, ~~strike~~, `code`, > quotes, - lists, 1. lists, ---, [text](https://link),
   bare links, :shortcode: emoji (and normal emoji typed directly). Links open in a new tab. */
const E=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const EMOJI={smile:'😊',grin:'😄',laugh:'😂',love:'🥰',heart:'❤️',thumbsup:'👍','+1':'👍',pray:'🙏',clap:'👏',wave:'👋',muscle:'💪',tada:'🎉',fire:'🔥',star:'⭐',sparkles:'✨',rainbow:'🌈',seedling:'🌱',herb:'🌿',leaf:'🍃',sunflower:'🌻',tomato:'🍅',corn:'🌽',carrot:'🥕',eggplant:'🍆',cucumber:'🥒',lettuce:'🥬',banana:'🍌',tractor:'🚜',farmer:'🧑‍🌾',basket:'🧺',house:'🏡',sun:'☀️',cloud:'☁️',rain:'🌧️',droplet:'💧',calendar:'📅',clock:'⏰',bell:'🔔',megaphone:'📢',check:'✅',warning:'⚠️',x:'❌',pin:'📌',phone:'📞'};
const okUrl=u=>/^(https?:\/\/|mailto:|tel:)/i.test(u);
const A_=(u,t)=>`<a href="${u}" target="_blank" rel="noopener noreferrer nofollow">${t}</a>`;
function inline(s){const keep=[],hold=h=>{keep.push(h);return '\u0001'+(keep.length-1)+'\u0001'};
  s=s.replace(/`([^`\n]+)`/g,(m,c)=>hold('<code>'+c+'</code>'));
  s=s.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g,(m,t,u)=>okUrl(u)?hold(A_(u,t)):m);
  s=s.replace(/(^|[\s(])((?:https?:\/\/|www\.)[^\s<]*[^\s<.,;:!?)'])/g,(m,p,u)=>p+hold(A_(/^www\./i.test(u)?'https://'+u:u,u)));
  s=s.replace(/\*\*([^*\n]+)\*\*|__([^_\n]+)__/g,(m,a,b)=>'<strong>'+(a||b)+'</strong>')
     .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g,(m,p,a)=>p+'<em>'+a+'</em>').replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g,(m,p,a)=>p+'<em>'+a+'</em>')
     .replace(/~~([^~\n]+)~~/g,'<s>$1</s>')
     .replace(/:([a-z0-9_+]+):/g,(m,n)=>EMOJI[n]||m);
  return s.replace(/\u0001(\d+)\u0001/g,(m,i)=>keep[i])}
function md(src){const L=E(src).replace(/\r/g,'').split('\n'),out=[];let i=0;
  while(i<L.length){const l=L[i];
    if(/^\s*$/.test(l)){i++;continue}
    if(/^```/.test(l)){const b=[];i++;while(i<L.length&&!/^```/.test(L[i]))b.push(L[i++]);i++;out.push('<pre><code>'+b.join('\n')+'</code></pre>');continue}
    let m;
    if(m=l.match(/^(#{1,3})\s+(.+)$/)){out.push(`<h${m[1].length+2}>${inline(m[2])}</h${m[1].length+2}>`);i++;continue}
    if(/^\s*(-{3,}|\*{3,})\s*$/.test(l)){out.push('<hr>');i++;continue}
    if(/^&gt;\s?/.test(l)){const b=[];while(i<L.length&&/^&gt;\s?/.test(L[i]))b.push(L[i++].replace(/^&gt;\s?/,''));out.push('<blockquote>'+b.map(inline).join('<br>')+'</blockquote>');continue}
    if(/^\s*[-*•]\s+/.test(l)){const b=[];while(i<L.length&&/^\s*[-*•]\s+/.test(L[i]))b.push('<li>'+inline(L[i++].replace(/^\s*[-*•]\s+/,''))+'</li>');out.push('<ul>'+b.join('')+'</ul>');continue}
    if(/^\s*\d+[.)]\s+/.test(l)){const b=[];while(i<L.length&&/^\s*\d+[.)]\s+/.test(L[i]))b.push('<li>'+inline(L[i++].replace(/^\s*\d+[.)]\s+/,''))+'</li>');out.push('<ol>'+b.join('')+'</ol>');continue}
    const b=[];while(i<L.length&&!/^\s*$/.test(L[i])&&!/^(#{1,3}\s|```|&gt;|\s*[-*•]\s|\s*\d+[.)]\s|\s*(-{3,}|\*{3,})\s*$)/.test(L[i]))b.push(inline(L[i++]));
    out.push('<p>'+b.join('<br>')+'</p>')}
  return out.join('')}
export {EMOJI,md};
