function showSuccess(message){

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
},2000)

}


// LOGIN
loginBtn.onclick = function(){

const email = emailInput.value.trim()
const password = passwordInput.value.trim()

if(!email.includes("@") || !email.includes(".")){
alert("Enter valid email")
return
}

if(password.length < 6){
alert("Password must be at least 6 characters")
return
}

auth.signInWithEmailAndPassword(email,password)

.then(()=>{
window.location = "dashboard.html"
})

.catch(e=>alert(e.message))

}


// REGISTER
registerBtn.onclick = function(){

const email = emailInput.value.trim()
const password = passwordInput.value.trim()

if(!email.includes("@") || !email.includes(".")){
alert("Enter valid email")
return
}

if(password.length < 6){
alert("Password must be at least 6 characters")
return
}

auth.createUserWithEmailAndPassword(email,password)

.then(user=>{

db.collection("users").doc(user.user.uid).set({
email: email,
role: "lawyer",
createdAt: Date.now()
})

showSuccess("Account Created")

})

.catch(e=>alert(e.message))

}