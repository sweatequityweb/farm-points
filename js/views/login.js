import {inApp,inAppNotice} from "../ui/inapp.js";
import {natCmp} from "../domain/pods.js";
import {A,S} from "../state.js";
import {$,esc} from "../util.js";
function loginView(){return `<div class="center"><div style="font-size:64px">🥬</div><h1 style="margin:0;color:var(--pri-d)">Ugnayan Gulayan</h1><p class="mut">Farm attendance and points for Noah Scholarship households</p>
${inApp()?inAppNotice():`<button style="width:100%;max-width:340px;min-height:56px" onclick="A.google()">Sign in with Google</button>`}
${S.showStaff?`<div class="card"><h2>Staff sign in</h2><label>Email</label><input id="em" type="email" autocomplete="username"><label>Password</label><input id="pw" type="password" autocomplete="current-password"><div style="margin-top:14px"><button style="width:100%" onclick="A.emailLogin()">Sign in</button></div></div>`:`<button class="text" onclick="S_.showStaff=true;A.r()">Staff sign in</button>`}</div>`}
const claimLabel=(id,n,sc)=>`<b>${esc(id)}</b> ${esc(n)}${sc&&sc.length?` <span class="mut">(${sc.map(esc).join(', ')})</span>`:''}`;
function claimRows(q){const d=S.cfg.directory||{},ds=S.cfg.claimNames===false?{}:(S.cfg.dirScholars||{}),ql=String(q||'').toLowerCase();
  return Object.entries(d).sort((a,b)=>natCmp(a[0],b[0])).filter(([id,n])=>!ql||(id+' '+n+' '+(ds[id]||[]).join(' ')).toLowerCase().includes(ql)).map(([id,n])=>`<button type="button" class="pick${S.claimSel===id?' on':''}" data-id="${esc(id)}" role="radio" aria-checked="${S.claimSel===id}" onclick="A.pickHh('${esc(id)}')"><span class="rd"></span><span>${claimLabel(id,n,ds[id])}</span></button>`).join('')||'<p class="mut" style="padding:12px;margin:0">No match. Check the spelling or ask the Farm Liaison.</p>'}
function claimView(){const has=Object.keys(S.cfg.directory||{}).length;
  return `<div class="center"><div class="card claim"><div style="text-align:center"><div class="logo">\ud83c\udf31</div><h2 style="font-size:22px;margin:10px 0 4px">Find your household</h2><p class="mut" style="margin:0">Signed in as ${esc(S.user.email)}.<br>Choose the household your scholar belongs to.</p></div>
  ${has?`<input id="cq" type="search" placeholder="Search by ID, surname or scholar" autocomplete="off" value="${esc(S.claimQ||'')}" oninput="A.claimFilter()" style="margin:16px 0 8px"><div id="cl" class="plist" role="radiogroup" aria-label="Households">${claimRows(S.claimQ)}</div><button style="width:100%;margin-top:14px;min-height:52px" id="cb"${S.claimSel?'':' disabled'} onclick="A.claim()">Send request</button><p class="mut" style="text-align:center;margin:10px 0 0">A teacher or the Farm Liaison will confirm it.</p>`:`<p>The household list isn't loaded yet. Ask the Admin to import the scholar data.</p>`}</div></div>`}
export {claimLabel,claimRows,claimView,loginView};
