function showSuccess(message){

const div=document.createElement("div")

div.className="private-popup"

div.innerHTML=`
<div class="popup-card">
<h3>${message}</h3>
</div>
`

document.body.appendChild(div)

setTimeout(()=>{div.remove()},2000)

}


const caseId=localStorage.getItem("caseId")

auth.onAuthStateChanged(user=>{

if(!user){
window.location="index.html"
return
}

loadHearings()

})


// ADD HEARING
function addHearing(){

const hearingDate=document.getElementById("hearingDate")
const result=document.getElementById("result")
const nextDate=document.getElementById("nextDate")
const notes=document.getElementById("notes")

if(!nextDate.value){
alert("Next date required")
return
}

db.collection("hearings").add({

caseId,
hearingDate: hearingDate.value,
result: result.value,
nextDate: nextDate.value,
notes: notes.value,
updatedBy: auth.currentUser.uid,
createdAt: Date.now()

})

.then(()=>{

hearingDate.value=""
result.value=""
nextDate.value=""
notes.value=""

showSuccess("Hearing Saved")

})

.catch(e=>alert(e.message))

}


// LOAD HEARINGS
function loadHearings(){

db.collection("hearings")
.where("caseId","==",caseId)
.orderBy("createdAt","desc")

.onSnapshot(snapshot=>{

let html=""

snapshot.forEach(doc=>{

let h=doc.data()

html+=`
<div class="fare-card">

<div class="fare-row">
<span>Date</span>
<b>${h.hearingDate || "-"}</b>
</div>

<div class="fare-row">
<span>Result</span>
<b>${h.result || "-"}</b>
</div>

<div class="fare-row">
<span>Next Date</span>
<b>${h.nextDate}</b>
</div>

<div class="fare-row">
<span>Notes</span>
<b>${h.notes || "-"}</b>
</div>

</div>
`
})

hearingList.innerHTML=html

})

}