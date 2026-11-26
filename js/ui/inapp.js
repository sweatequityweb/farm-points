import {A} from "../state.js";
import {toast} from "../util.js";
/* In-app browsers (Messenger, Facebook, Instagram, TikTok, Line...) break Google sign-in.
   Detect them and guide people to a normal browser instead. */
const inApp=()=>/FBAN|FBAV|FB_IAB|FBIOS|Messenger|Instagram|Line\/|MicroMessenger|TikTok|BytedanceWebview|Snapchat|Twitter|; wv\)/i.test(navigator.userAgent||'');
const isAndroid=()=>/Android/i.test(navigator.userAgent||'');
function inAppNotice(){return `<div class="card" style="max-width:340px;text-align:left;border:1px solid #ffe0b2;background:#fff4e0"><b>Please open this page in your browser</b><p style="margin:6px 0 10px">Google sign-in does not work inside Messenger or other chat apps. Open the link in Chrome or Safari, then sign in there.</p>${isAndroid()?`<button style="width:100%;margin-bottom:8px" onclick="A.openChrome()">Open in Chrome</button>`:''}<button class="ghost" style="width:100%" onclick="A.copyLink()">Copy link</button><p class="mut" style="margin:10px 0 0">Or tap the ⋯ menu at the top and choose “Open in browser”.</p></div>`}
Object.assign(A,{
 openChrome:()=>{location.href='intent://'+location.host+location.pathname+location.search+'#Intent;scheme=https;package=com.android.chrome;end'},
 copyLink:async()=>{const u=location.origin+location.pathname;try{await navigator.clipboard.writeText(u);toast('Link copied. Paste it in Chrome or Safari.')}catch(e){prompt('Copy this link and open it in Chrome or Safari:',u)}}
});
export {inApp,inAppNotice,isAndroid};
