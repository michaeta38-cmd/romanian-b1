import {initializeApp} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,onSnapshot} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
const firebaseConfig = {
 apiKey: "AIzaSyAnwquB8Mrh2j5PTecbOekq9YXQNN1gWHw",
 authDomain: "romanian-b1-sync.firebaseapp.com",
 projectId: "romanian-b1-sync",
 storageBucket: "romanian-b1-sync.firebasestorage.app",
 messagingSenderId: "664931446971",
 appId: "1:664931446971:web:e133532f4713390e33f99e"
};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const signin=document.getElementById('signin'),signout=document.getElementById('signout'),status=document.getElementById('cloudstatus');
let activeUser=null,unsub=null,ready=false,timer=null,writing=false,pending=false,revision=0;
function show(t){status.textContent=t;}
function valid(x){return x&&Array.isArray(x.verbs)&&x.verbs.every(v=>typeof v.inf==='string'&&typeof v.he==='string'&&Array.isArray(v.forms)&&v.forms.length===6&&v.forms.every(z=>typeof z==='string'))&&x.scores&&typeof x.scores==='object'&&!Array.isArray(x.scores);}
function snapshot(){return JSON.parse(JSON.stringify(data));}
function apply(x){if(!valid(x))return;data=x;localStorage.setItem(KEY,JSON.stringify(data));stats();nextQ();nextCard();if(!document.getElementById('library').hidden)library();}
const provider=new GoogleAuthProvider();
signin.disabled=false;signin.onclick=async()=>{try{await signInWithPopup(auth,provider)}catch(e){if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment'].includes(e.code)){await signInWithRedirect(auth,provider)}else show('התחברות נכשלה: '+e.message)}};
signout.onclick=()=>signOut(auth);
getRedirectResult(auth).catch(e=>show('התחברות נכשלה: '+e.message));
window.scheduleCloudSave=()=>{if(!ready||!activeUser)return;revision++;pending=true;clearTimeout(timer);timer=setTimeout(flush,900)};
async function flush(){if(!ready||!activeUser||writing||!pending)return;writing=true;pending=false;let current=revision;let userId=activeUser.uid, payload=snapshot();try{await setDoc(doc(db,'users',userId),{state:payload,updatedAt:Date.now()});show('מסונכרן עם Google ✓')}catch(e){pending=true;show('שמירה בענן נכשלה. הגיבוי המקומי נשמר. '+e.code)}finally{writing=false;if(pending||revision!==current){pending=true;timer=setTimeout(flush,1200)}}}
onAuthStateChanged(auth,async user=>{ready=false;activeUser=user;clearTimeout(timer);if(unsub){unsub();unsub=null;}signin.hidden=!!user;signout.hidden=!user;
if(!user){show('לא מחובר – ההתקדמות נשמרת רק במכשיר הזה');return;}
show('מחובר ל־Google. טוען התקדמות…');
try{const ref=doc(db,'users',user.uid);const existing=await getDoc(ref);if(activeUser?.uid!==user.uid)return;
if(existing.exists()&&valid(existing.data().state)){apply(existing.data().state);show('התקדמות נטענה מהענן ✓')}else if(existing.exists()){show('נמצא מידע בענן בפורמט לא תקין. לא בוצעה דריסה.');return}else{await setDoc(ref,{state:snapshot(),updatedAt:Date.now()});show('ההתקדמות המקומית נשמרה בענן ✓')}
ready=true;
unsub=onSnapshot(ref,d=>{if(!ready||writing||pending||!d.exists()||!valid(d.data().state))return;const remote=d.data().state;if(JSON.stringify(remote)!==JSON.stringify(data)){apply(remote);show('התקדמות עודכנה מהענן ✓')}},e=>show('שגיאת סנכרון: '+e.code));
}catch(e){show('לא ניתן להתחבר למסד הנתונים: '+e.code+' – בדקי הרשאות וכתובת מאושרת')}});
