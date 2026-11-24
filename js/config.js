import {app} from "./firebase.js";
/* ============ CONFIGURATION: paste your NEW Firebase project's config here ============ */
const firebaseConfig = {
  apiKey: "AIzaSyCUsIydJpEClSyKKavQ1QQsC1qU4s-So_4",
  authDomain: "farm-points-7ceb5.firebaseapp.com",
  projectId: "farm-points-7ceb5",
  storageBucket: "farm-points-7ceb5.firebasestorage.app",
  messagingSenderId: "204725381372",
  appId: "1:204725381372:web:f57b2a49a1d82364f1cf79"
};
const ADMIN_EMAIL = "admin@lla.edu", LIAISON_EMAIL = "farm@lla.edu";
/* ====================================================================================== */
const DEF={cmdRoleId:'',cmdApprove:true,cmdReject:true,cmdOwn:false,paceGraceDays:1,paceFloorPct:0,targetStandard:120,targetAdjusted:90,pointsPerDay:8,onTrackStandard:75,onTrackAdjusted:60,directory:{},currentYear:'',yearEnd:'',pastYears:[],clockOpen:'04:00',clockClose:'19:00',maxShiftHours:8,guestPoints:2,maxGuests:5,slidesUrl:'',yearStart:'',terms:[{name:'Term 1',end:'',pct:25},{name:'Term 2',end:'',pct:50},{name:'Term 3',end:'',pct:75},{name:'Term 4',end:'',pct:100}]};
export {ADMIN_EMAIL,DEF,LIAISON_EMAIL,firebaseConfig};
