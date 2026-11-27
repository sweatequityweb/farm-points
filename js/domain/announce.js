import {S} from "../state.js";
/* Unread = announcements newer than the last time this person opened the list (remembered on this device). */
const key=()=>'annSeen_'+(S.user?.uid||'');
const annSeen=()=>{try{return +localStorage.getItem(key())||0}catch(e){return S._annSeen||0}};
const annUnread=()=>(S.ann||[]).filter(a=>(a.createdAt||0)>annSeen()).length;
const annMarkSeen=()=>{const m=Math.max(0,...(S.ann||[]).map(a=>a.createdAt||0));try{localStorage.setItem(key(),m)}catch(e){S._annSeen=m}};
export {annMarkSeen,annSeen,annUnread};
