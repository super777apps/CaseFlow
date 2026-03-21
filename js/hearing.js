const caseId=localStorage.getItem("caseId")

auth.onAuthStateChanged(user=>{

if(!user){

window.location="index.html"
return

}

loadHearings()

})


function addHearing(){

const hearingDate=hearingDate.value
const result=result.value
const nextDate=nextDate.value
const notes=notes.value

db.collection("hearings").add({

caseId,
hearingDate,
result,
nextDate,
notes,
updatedBy:auth.currentUser.uid,
createdAt:Date.now()

})

alert("Hearing Saved")

}


function loadHearings(){

db.collection("hearings")
.where("caseId","==",caseId)

.orderBy("hearingDate","desc")

.onSnapshot(snapshot=>{

let html=""

snapshot.forEach(doc=>{

let h=doc.data()

html+=`

<div class="fare-card">

<div class="fare-row">
<span>Date</span>
<b>${h.hearingDate}</b>
</div>

<div class="fare-row">
<span>Result</span>
<b>${h.result}</b>
</div>

<div class="fare-row">
<span>Next Date</span>
<b>${h.nextDate}</b>
</div>

<div class="fare-row">
<span>Notes</span>
<b>${h.notes}</b>
</div>

</div>

`

})

hearingList.innerHTML=html

})

}