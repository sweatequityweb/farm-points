import {A} from "../state.js";
import {toast} from "../util.js";
/* In-app browsers (Messenger, Facebook, Instagram, TikTok, Line...) break Google sign-in.
   Detect them and guide people to a normal browser instead. */
const inApp=()=>/FBAN|FBAV|FB_IAB|FBIOS|Messenger|Instagram|Line\/|MicroMessenger|TikTok|BytedanceWebview|Snapchat|Twitter|; wv\)/i.test(navigator.userAgent||'');
const isAndroid=()=>/Android/i.test(navigator.userAgent||'');
/* Shown INSTEAD of the sign-in page inside Messenger and similar apps: one button, one sentence. */
function inAppNotice(){return `<div class="center"><div class="heroc"><div style="font-size:56px">🌿</div><h2 style="font-size:24px;margin:8px 0">Open in your browser</h2><p style="font-size:18px;margin:0 0 18px">This site needs to open in your browser, like Chrome or Safari.</p><button style="width:100%;min-height:64px;font-size:20px" onclick="A.openBrowser()">Open in browser</button><p class="mut" style="margin:12px 0 0">If nothing happens, the link is copied. Paste it in your browser.</p></div></div>`}
Object.assign(A,{
 /* One button for every phone: generic Android intent (default browser) or Safari scheme on iPhone. Also copies the link as a fallback. */
 openBrowser:async()=>{const u=location.host+location.pathname+location.search;try{await navigator.clipboard.writeText(location.origin+location.pathname)}catch(e){}toast('Link copied. If your browser did not open, paste it there.');
   location.href=isAndroid()?'intent://'+u+'#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end':'x-safari-https://'+u},
 copyLink:async()=>{const u=location.origin+location.pathname;try{await navigator.clipboard.writeText(u);toast('Link copied. Paste it in your browser.')}catch(e){prompt('Copy this link and open it in your browser:',u)}}
});
export {inApp,inAppNotice,isAndroid};
