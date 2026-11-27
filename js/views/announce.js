import {S} from "../state.js";
import {esc,isStaff} from "../util.js";
import {annSeen,annUnread} from "../domain/announce.js";
import {ic} from "../ui/icons.js";
import {md} from "../ui/markdown.js";
const when=ms=>new Date(ms).toLocaleDateString('en-PH',{month:'short',day:'numeric'})+' · '+new Date(ms).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
const EMO=['😊','🙏','👏','🎉','❤️','👍','🌱','🥬','🍅','🌽','🥕','🍆','🌻','☀️','🌧️','💧','🚜','🧺','📅','⏰','📢','✅','⚠️','📍'];
/* Header bell: pulses with a red number while there are unread announcements. */
function bellHtml(){if(!S.user||(!isStaff()&&S.profile?.status!=='active'))return'';const n=annUnread();
  return`<button class="rb bell${n?' has':''}" onclick="A.annOpen()" aria-label="Announcements${n?', '+n+' new':''}">${ic('bell',26)}${n?`<span class="bdg">${n>9?'9+':n}</span>`:''}</button>`}
const annBody=a=>`<div class="md">${md(a.body)}</div>`;
const annRow=(a,prev)=>`<div class="ann${(a.createdAt||0)>prev?' new':''}"><div class="row sp"><b>${esc(a.title||'Announcement')}</b>${isStaff()?`<button class="text" style="min-height:40px" onclick="A.annDel('${a.id}')">Delete</button>`:''}</div><div class="mut">${esc(a.by||'')} · ${when(a.createdAt||0)}</div>${annBody(a)}</div>`;
function annSheet(){const prev=S._annPrev??annSeen();
  return`<div class="row sp"><h2 style="margin:0">Announcements</h2><button class="text" onclick="A.close()">Close</button></div><div style="margin-top:12px">${isStaff()?`<button style="width:100%;margin-bottom:12px" onclick="A.annCompose()">+ Write announcement</button>`:''}${(S.ann||[]).map(a=>annRow(a,prev)).join('')||'<p class="mut">No announcements yet.</p>'}</div>`}
/* Latest announcement as a card on the parent home screen. */
function annPreview(){const a=(S.ann||[])[0];if(!a)return'';const n=annUnread();
  return`<div class="card annc" onclick="A.annOpen()" role="button" tabindex="0" onkeydown="if(event.key==='Enter')A.annOpen()"><div class="row sp"><h2 style="margin:0">${ic('campaign',22)} ${esc(a.title||'Announcement')}</h2>${n?`<span class="chip warn">${n} new</span>`:''}</div><div class="md clampbox">${md(a.body)}</div><div class="mut" style="margin-top:6px">${esc(a.by||'')} · ${when(a.createdAt||0)} · Tap to read all</div></div>`}
/* Staff: the Announce tab and the writing sheet. */
function annTab(){const L=S.ann||[];
  return`<div class="row sp" style="margin-bottom:12px"><h2 style="margin:0">Announcements</h2><button onclick="A.annCompose()">+ Write announcement</button></div>${L.length?L.map(a=>`<div class="card"><div class="row sp"><b style="font-size:1.05em">${esc(a.title||'Announcement')}</b><button class="text" style="min-height:40px" onclick="A.annDel('${a.id}')">Delete</button></div><div class="mut">${esc(a.by||'')} · ${when(a.createdAt||0)}</div>${annBody(a)}</div>`).join(''):`<div class="card"><p class="mut" style="margin:0">No announcements yet. Write one and every household sees it, with a pulsing bell on their screen.</p></div>`}`}
const tb=(l,k,aria)=>`<button type="button" class="tbb" aria-label="${aria}" onclick="A.mdIns('${k}')">${l}</button>`;
function composeHtml(){return`<div class="row sp"><h2 style="margin:0">New announcement</h2><button class="text" onclick="A.close()">Cancel</button></div>
<label for="annT">Title (optional)</label><input id="annT" maxlength="60" placeholder="e.g. Harvest day this Saturday 🌽">
<label for="annB">Message</label><div class="tbar">${tb('<b>B</b>','b','Bold')}${tb('<i>I</i>','i','Italic')}${tb('Link','link','Add a link')}${tb('• List','list','Bulleted list')}</div>
<textarea id="annB" rows="6" maxlength="1500" oninput="A.annLive()" placeholder="Write your message. You can use **bold**, *italic*, [links](https://…) and emoji."></textarea>
<div class="emos" aria-label="Emoji">${EMO.map(e=>`<button type="button" aria-label="Insert ${e}" onclick="A.mdEmoji('${e}')">${e}</button>`).join('')}</div>
<label>How it will look</label><div id="annPv" class="md pv"><span class="mut">Your message appears here.</span></div>
<div class="row" style="gap:8px;margin-top:14px"><button style="flex:1" onclick="A.annPost()">Post to everyone</button></div>`}
export {annPreview,annSheet,annTab,bellHtml,composeHtml};
