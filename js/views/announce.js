import {S} from "../state.js";
import {esc,isStaff} from "../util.js";
import {annSeen,annUnread} from "../domain/announce.js";
import {ic} from "../ui/icons.js";
const when=ms=>new Date(ms).toLocaleDateString('en-PH',{month:'short',day:'numeric'})+' · '+new Date(ms).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
/* Header bell: pulses with a red number while there are unread announcements. */
function bellHtml(){if(!S.user||(!isStaff()&&S.profile?.status!=='active'))return'';const n=annUnread();
  return`<button class="rb bell${n?' has':''}" onclick="A.annOpen()" aria-label="Announcements${n?', '+n+' new':''}">${ic('bell',26)}${n?`<span class="bdg">${n>9?'9+':n}</span>`:''}</button>`}
const annRow=(a,prev)=>`<div class="ann${(a.createdAt||0)>prev?' new':''}"><div class="row sp"><b>${esc(a.title||'Announcement')}</b>${isStaff()?`<button class="text" style="min-height:40px" onclick="A.annDel('${a.id}')">Delete</button>`:''}</div><div class="mut">${esc(a.by||'')} · ${when(a.createdAt||0)}</div><p style="margin:8px 0 0;white-space:pre-wrap">${esc(a.body)}</p></div>`;
function annSheet(){const prev=S._annPrev??annSeen();
  const form=isStaff()?(S._annForm?`<div class="ann form"><label for="annT">Title (optional)</label><input id="annT" maxlength="60" placeholder="e.g. Harvest day this Saturday"><label for="annB">Message</label><textarea id="annB" rows="4" maxlength="500" placeholder="Write your announcement"></textarea><div class="row" style="gap:8px;margin-top:12px"><button onclick="A.annPost()">Post</button><button class="ghost" onclick="A.annForm()">Cancel</button></div></div>`:`<button style="width:100%;margin-bottom:12px" onclick="A.annForm()">+ New announcement</button>`):'';
  return`<div class="row sp"><h2 style="margin:0">Announcements</h2><button class="text" onclick="A.close()">Close</button></div><div style="margin-top:12px">${form}${S.ann.map(a=>annRow(a,prev)).join('')||'<p class="mut">No announcements yet.</p>'}</div>`}
/* Latest announcement as a card on the parent home screen. */
function annPreview(){const a=S.ann[0];if(!a)return'';const n=annUnread();
  return`<div class="card annc" onclick="A.annOpen()" role="button" tabindex="0" onkeydown="if(event.key==='Enter')A.annOpen()"><div class="row sp"><h2 style="margin:0">${ic('campaign',22)} ${esc(a.title||'Announcement')}</h2>${n?`<span class="chip warn">${n} new</span>`:''}</div><p class="clamp" style="margin:6px 0 0">${esc(a.body)}</p><div class="mut" style="margin-top:6px">${esc(a.by||'')} · ${when(a.createdAt||0)} · Tap to read all</div></div>`}
export {annPreview,annSheet,bellHtml};
