let notifiedToday = {}
let notifiedSoon = {}
let notifiedTomorrow = false

auth.onAuthStateChanged(user=>{

if(!user){
window.location="index.html"
return
}

loadAllReminders()

})


// 🔊 SOUND
function playSound(){
let audio = new Audio("assets/notification.mp3")
audio.play()
}


// 🔔 POPUP
function showNotification(message){

const div = document.createElement("div")

div.className = "private-popup"

div.innerHTML = `
<div class="popup-card">
<h3>${message}</h3>
</div>
`

document.body.appendChild(div)

setTimeout(()=>{
div.remove()
},3000)

playSound()

}


// 🔄 MAIN LOADER
function loadAllReminders(){

let now = new Date()

let today = now.toISOString().split("T")[0]

let tomorrowDate = new Date()
tomorrowDate.setDate(now.getDate()+1)
let tomorrow = tomorrowDate.toISOString().split("T")[0]


// 🔹 TODAY CASES
db.collection("hearings")
.where("nextDate","==",today)

.onSnapshot(snapshot=>{

let board = {}

snapshot.forEach(doc=>{

let h = doc.data()
let id = doc.id

db.collection("cases").doc(h.caseId).get()
.then(caseDoc=>{

let c = caseDoc.data()

// TODAY NOTIFICATION
if(!notifiedToday[id]){
showNotification("Today: " + c.caseTitle)
notifiedToday[id] = true
}


// ⏰ 1-HOUR BEFORE CHECK
if(h.hearingDate){

let hearingTime = new Date(h.hearingDate)
let diff = (hearingTime - now) / (1000*60)

if(diff <= 60 && diff > 0 && !notifiedSoon[id]){
showNotification("1 Hour: " + c.caseTitle)
notifiedSoon[id] = true
}

}


// BUILD BOARD
let court = c.courtName || "Unknown Court"
let judge = c.judgeName || "Unknown Judge"

if(!board[court]) board[court] = {}
if(!board[court][judge]) board[court][judge] = []

board[court][judge].push(c)

renderBoard(board)

})

})

})


// 🔹 TOMORROW REMINDER
db.collection("hearings")
.where("nextDate","==",tomorrow)

.get()

.then(snapshot=>{

if(!notifiedTomorrow && snapshot.size > 0){

showNotification(`Tomorrow: ${snapshot.size} case(s)`)

notifiedTomorrow = true

}

})

}


// 🧱 RENDER BOARD
function renderBoard(board){

let html=""

for(let court in board){

html+=`
<div class="fare-card">

<div class="fare-row">
<span>Court</span>
<b>${court}</b>
</div>
`

for(let judge in board[court]){

html+=`
<div class="fare-row">
<span>Judge</span>
<b>${judge}</b>
</div>
`

board[court][judge].forEach(c=>{

html+=`
<div class="fare-row">
<span>Case</span>
<b>${c.caseTitle}</b>
</div>
`
})

html+=`<hr>`
}

html+=`</div>`
}

todayList.innerHTML = html

}