import {firebaseConfig} from "./config.js";
import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,onAuthStateChanged,signInWithPopup,GoogleAuthProvider,signInWithEmailAndPassword,signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore,doc,collection,onSnapshot,setDoc,updateDoc,deleteDoc,addDoc,getDocs,query,where,writeBatch,deleteField} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
export {GoogleAuthProvider,addDoc,app,auth,collection,db,deleteDoc,deleteField,doc,getAuth,getDocs,getFirestore,initializeApp,onAuthStateChanged,onSnapshot,query,setDoc,signInWithEmailAndPassword,signInWithPopup,signOut,updateDoc,where,writeBatch};
