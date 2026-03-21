import { db, auth } from "./firebase.js";

import {
collection,
query,
where,
onSnapshot,
doc,
runTransaction,
updateDoc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let currentUser=null;

/* SOUNDS */
let jobSound=new Audio("assets/job.mp3");
jobSound.loop=true;

const acceptSound=new Audio("assets/accept.mp3");
const declineSound=new Audio("assets/decline.mp3");

/* SOUND CONTROL */
function playJobSound(){
jobSound.pause();
jobSound.currentTime=0;
jobSound.play();
}

function stopJobSound(){
jobSound.pause();
jobSound.currentTime=0;
}

/* GET NAME */
async function getUserName(uid){
const snap=await getDoc(doc(db,"users",uid));
if(!snap.exists()) return uid;
const u=snap.data();
return u.nickname || u.email || uid;
}

/* AUTH */
onAuthStateChanged(auth,user=>{

if(!user){ location.href="index.html"; return; }

currentUser=user;

document.getElementById("userInfo").textContent=user.email;

listenPool();
listenPosted();
listenAccepted();
listenAssigned();

/* LOCATION */
navigator.geolocation.watchPosition(async pos=>{
await updateDoc(doc(db,"users",user.uid),{
lat:pos.coords.latitude,
lng:pos.coords.longitude
});
});

});

/* LOGOUT */
document.getElementById("logoutBtn").onclick=async()=>{
await signOut(auth);
location.href="index.html";
};

/* TABS */
window.showTab=function(tab){
["pool","posted","accepted"].forEach(t=>{
document.getElementById(t+"Tab").style.display="none";
});
document.getElementById(tab+"Tab").style.display="block";
};

/* POOL */
function listenPool(){

const q=query(collection(db,"fares"), where("status","==","broadcast"));

const box=document.getElementById("poolList");

onSnapshot(q,snap=>{

box.innerHTML="";

snap.forEach(d=>{

const f=d.data();

const div=document.createElement("div");
div.className="fare-card";

div.innerHTML=`
<b>${f.pickup}</b> → ${f.drop}<br>
Price: ${f.price}<br>
<button onclick="acceptPool('${d.id}')">Accept</button>
`;

box.appendChild(div);

});

});
}

/* RACE FIX */
window.acceptPool=async(id)=>{

const ref=doc(db,"fares",id);

try{
await runTransaction(db,async(tx)=>{
const snap=await tx.get(ref);
if(snap.data().status!=="broadcast") throw "taken";
tx.update(ref,{
status:"accepted",
currentDriverUID:currentUser.uid
});
});
acceptSound.play();
}catch{
alert("Already taken");
}
};

/* POSTED */
function listenPosted(){

const q=query(collection(db,"fares"), where("originalDriverUID","==",currentUser.uid));

const box=document.getElementById("postedList");

onSnapshot(q,async snap=>{

box.innerHTML="";

for(const d of snap.docs){

const f=d.data();

const currentName=await getUserName(f.currentDriverUID);

const div=document.createElement("div");

div.className="fare-card";

div.innerHTML=`
<b>${f.pickup}</b> → ${f.drop}<br>
Status: ${f.status}<br>
Current Driver: ${currentName}<br>
<button onclick="deleteJob('${d.id}')">Delete</button>
`;

box.appendChild(div);

}

});
}

/* DELETE */
window.deleteJob=async(id)=>{
if(!confirm("Delete job?")) return;

await updateDoc(doc(db,"fares",id),{
status:"deleted"
});

alert("Deleted");
};

/* ACCEPTED */
function listenAccepted(){

const q=query(collection(db,"fares"),
where("currentDriverUID","==",currentUser.uid)
);

const box=document.getElementById("acceptedList");

onSnapshot(q,async snap=>{

box.innerHTML="";

for(const d of snap.docs){

const f=d.data();

const originalName=await getUserName(f.originalDriverUID);

const div=document.createElement("div");

div.className="fare-card";

div.innerHTML=`
<b>${f.pickup}</b> → ${f.drop}<br>
Original Driver: ${originalName}<br>
<button onclick="completeJob('${d.id}')">Complete</button>
`;

box.appendChild(div);

}

});
}

/* COMPLETE */
window.completeJob=async(id)=>{
await updateDoc(doc(db,"fares",id),{
status:"completed"
});
};

/* ASSIGNED */
function listenAssigned(){

const q=query(collection(db,"fares"),
where("assignedTo","==",currentUser.uid),
where("status","==","assigned")
);

onSnapshot(q,snap=>{
snap.docChanges().forEach(change=>{
if(change.type==="added"){
showPopup(change.doc.data(),change.doc.id);
}
});
});
}

/* POPUP */
function showPopup(f,id){

const popup=document.getElementById("jobPopup");
popup.style.display="block";

playJobSound();

document.getElementById("jobDetails").innerHTML=`
Pickup: ${f.pickup}<br>
Drop: ${f.drop}<br>
Price: ${f.price}
`;

const timer=setTimeout(()=>{
stopJobSound();
popup.style.display="none";
},12000);

/* ACCEPT */
document.getElementById("acceptBtn").onclick=async()=>{

await updateDoc(doc(db,"fares",id),{
status:"accepted",
currentDriverUID:currentUser.uid
});

stopJobSound();
acceptSound.play();

popup.style.display="none";
clearTimeout(timer);

};

/* REJECT */
document.getElementById("rejectBtn").onclick=async()=>{

const ref=doc(db,"fares",id);
const snap=await getDoc(ref);
const job=snap.data();

await updateDoc(ref,{
status:"returned",
assignedTo:"",
currentDriverUID:job.originalDriverUID
});

stopJobSound();
declineSound.play();

popup.style.display="none";
clearTimeout(timer);

};

}