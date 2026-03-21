let currentFilter = "all"

function showSuccess(message){
const div = document.createElement("div")
div.className = "private-popup"
div.innerHTML = `<div class="popup-card"><h3>${message}</h3></div>`
document.body.appendChild(div)
setTimeout(()=>div.remove(),2000)
}

auth.onAuthStateChanged(user=>{
if(!user){
window.location="index.html"
return
}
loadCases(user.uid)
})

function logout(){
auth.signOut().then(()=>window.location="index.html")
}


// 🔥 FILTER CONTROL
function setFilter(type){
currentFilter = type
applySmartFilter()
}

function applySmartFilter(){
const user = auth.currentUser
if(user){
loadCases(user.uid)
}
}


// ✅ ADD CASE
function addCase(){

const client = document.getElementById("clientName")
const title = document.getElementById("caseTitle")
const number = document.getElementById("caseNumber")
const court = document.getElementById("courtName")
const judge = document.getElementById("judgeName")
const opp = document.getElementById("opponent")

if(!client.value || !title.value){
alert("Client & Case Title required")
return
}

db.collection("cases").add({
lawyers:[auth.currentUser.uid],
clientName: client.value,
caseTitle: title.value,
caseNumber: number.value,
courtName: court.value,
judgeName: judge.value,
opponent: opp.value,
createdAt: Date.now()
})
.then(()=>{
client.value=""
title.value=""
number.value=""
court.value=""
judge.value=""
opp.value=""
showSuccess("Case Saved")
})

}


// ✅ LOAD CASES WITH SMART FILTERS + COLOR STATUS
async function loadCases(userId){

const snapshot = await db.collection("cases")
.where("lawyers","array-contains",userId)
.get()

let html=""
let selectHTML=""

let today = new Date().toISOString().split("T")[0]

let tomorrowDate = new Date()
tomorrowDate.setDate(new Date().getDate()+1)
let tomorrow = tomorrowDate.toISOString().split("T")[0]

const search = document.getElementById("searchBox")?.value?.toLowerCase() || ""
const dateValue = document.getElementById("dateFilter")?.value
const judgeValue = document.getElementById("judgeFilter")?.value?.toLowerCase()

for(const doc of snapshot.docs){

let c = doc.data()
let show = true

if(search){
show =
c.caseTitle?.toLowerCase().includes(search) ||
c.clientName?.toLowerCase().includes(search) ||
c.judgeName?.toLowerCase().includes(search)
}

let hearingSnap = await db.collection("hearings")
.where("caseId","==",doc.id)
.get()

let hasToday=false, hasTomorrow=false, hasDate=false, overdue=false

let hearingsHTML=""

hearingSnap.forEach(hDoc=>{
let h = hDoc.data()

if(h.nextDate === today) hasToday=true
if(h.nextDate === tomorrow) hasTomorrow=true
if(dateValue && h.nextDate === dateValue) hasDate=true
if(h.nextDate < today) overdue=true

hearingsHTML+=`
<div class="fare-row">
<span>${h.nextDate}</span>
<b>${h.result || "-"}</b>
</div>
`
})

if(currentFilter==="today") show = hasToday
if(currentFilter==="tomorrow") show = hasTomorrow
if(currentFilter==="judge" && judgeValue){
show = c.judgeName?.toLowerCase().includes(judgeValue)
}
if(dateValue) show = hasDate

if(!show) continue


// 🎨 COLOR STATUS
let borderColor = "#d4af37"

if(hasToday) borderColor = "lime"
else if(hasTomorrow) borderColor = "gold"
else if(overdue) borderColor = "red"


selectHTML+=`
<option value="${doc.id}">
${c.caseTitle} - ${c.clientName}
</option>
`


html+=`
<div class="fare-card" style="border:2px solid ${borderColor};">

<div class="fare-row">
<span>Case</span>
<b>${c.caseTitle}</b>
</div>

<div class="fare-row">
<span>Client</span>
<b>${c.clientName}</b>
</div>

<div class="fare-row">
<span>Judge</span>
<b>${c.judgeName}</b>
</div>

<div class="fare-row">
<span>Court</span>
<b>${c.courtName}</b>
</div>

<hr>

<div>
<b style="color:#d4af37;">Hearings:</b>
${hearingsHTML || "<i>No hearings</i>"}
</div>

</div>
`
}

caseList.innerHTML = html
caseSelect.innerHTML = selectHTML

}


// ✅ QUICK HEARING
function quickAddHearing(){

const caseId = document.getElementById("caseSelect")
const hearingDate = document.getElementById("quickDate")
const result = document.getElementById("quickResult")
const nextDate = document.getElementById("quickNextDate")
const notes = document.getElementById("quickNotes")

if(!caseId.value || !nextDate.value){
alert("Select case & next date")
return
}

db.collection("hearings").add({
caseId: caseId.value,
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

}