import {A} from "../state.js";
import {toast} from "../util.js";
/* In-app browsers (Messenger, Facebook, Instagram, TikTok, Line...) break Google sign-in.
   Detect them and guide people to a normal browser instead. */
const inApp=()=>/FBAN|FBAV|FB_IAB|FBIOS|Messenger|Instagram|Line\/|MicroMessenger|TikTok|BytedanceWebview|Snapchat|Twitter|; wv\)/i.test(navigator.userAgent||'');
const isAndroid=()=>/Android/i.test(navigator.userAgent||'');
function inAppNotice(){return `<div class="card" style="max-width:340px;text-align:left;border:1px solid #ffe0b2;background:#fff4e0"><b>Please open this page in your browser</b><p style="margin:6px 0 10px">Google sign-in does not work inside Messenger and other chat apps. Open this page in your own browser (Chrome, Brave, Firefox, DuckDuckGo, Samsung Internet, Safari…) and sign in there.</p>${isAndroid()?`<button style="width:100%;margin-bottom:8px" onclick="A.openBrowser()">Open in my browser</button>`:''}<button class="ghost" style="width:100%" onclick="A.copyLink()">Copy link</button><p class="mut" style="margin:10px 0 0">If the button does nothing: copy the link, open your browser, and paste it in the address bar. You can also tap the ⋯ menu here and choose “Open in browser”.</p></div>`}
Object.assign(A,{
 /* Generic Android intent: opens the user's default browser (Chrome, Brave, DuckDuckGo...). No browser is hard-coded. */
 openBrowser:()=>{const u=location.host+location.pathname+location.search;location.href='intent://'+u+'#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end'},
 copyLink:async()=>{const u=location.origin+location.pathname;try{await navigator.clipboard.writeText(u);toast('Link copied. Paste it in your browser.')}catch(e){prompt('Copy this link and open it in your browser:',u)}}
});
export {inApp,inAppNotice,isAndroid};
