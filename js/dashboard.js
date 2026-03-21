import { db, auth } from "./firebase.js";

import {
collection, query, where, onSnapshot,
doc, updateDoc, getDoc, runTransaction
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let currentUser = null;

/* SOUND ELEMENTS (USE HTML AUDIO — IMPORTANT) */
const jobSound = document.getElementById("jobSound");
const acceptSound = document.getElementById("acceptSound");
const declineSound = document.getElementById("declineSound");

/* SOUND CONTROL */
function playJobSound() {
  jobSound.pause();
  jobSound.currentTime = 0;
  jobSound.loop = true;
  jobSound.play();
}

function stopSound() {
  jobSound.pause();
  jobSound.currentTime = 0;
}

/* GET NAME */
async function getUserName(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return uid;
  const u = snap.data();
  return u.nickname || u.email || uid;
}

/* AUTH */
onAuthStateChanged(auth, user => {

  if (!user) return location.href = "index.html";

  currentUser = user;

  document.getElementById("userInfo").textContent = user.email;

  listenPool();
  listenPosted();
  listenAccepted();
  listenAssigned();
  listenReturns();
});

/* LOGOUT */
document.getElementById("logoutBtn").onclick = async () => {
  await signOut(auth);
  location.href = "index.html";
};

/* TABS */
window.showTab = tab => {
  ["pool", "posted", "accepted"].forEach(t => {
    document.getElementById(t + "Tab").style.display = "none";
  });
  document.getElementById(tab + "Tab").style.display = "block";
};

/* POOL */
function listenPool() {

  const q = query(collection(db, "fares"), where("status", "==", "broadcast"));
  const box = document.getElementById("poolList");

  onSnapshot(q, snap => {

    box.innerHTML = "";

    snap.forEach(docSnap => {

      const f = docSnap.data();

      const div = document.createElement("div");
      div.className = "fare-card";

      div.innerHTML = `
        <b>${f.pickup}</b> → ${f.drop}<br>
        Price: ${f.price}<br>
        <button onclick="acceptPool('${docSnap.id}')">Accept</button>
      `;

      box.appendChild(div);
    });
  });
}

/* ACCEPT POOL */
window.acceptPool = async id => {

  const ref = doc(db, "fares", id);

  try {
    await runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      if (snap.data().status !== "broadcast") throw "taken";

      tx.update(ref, {
        status: "accepted",
        currentDriverUID: currentUser.uid
      });
    });

    acceptSound.play();

  } catch {
    alert("Already taken");
  }
};

/* POSTED */
function listenPosted() {

  const q = query(collection(db, "fares"),
    where("originalDriverUID", "==", currentUser.uid)
  );

  const box = document.getElementById("postedList");

  onSnapshot(q, async snap => {

    box.innerHTML = "";

    for (const d of snap.docs) {

      const f = d.data();
      const name = await getUserName(f.currentDriverUID);

      const div = document.createElement("div");

      div.className = "fare-card";

      div.innerHTML = `
        <b>${f.pickup}</b> → ${f.drop}<br>
        Status: ${f.status}<br>
        Current Driver: ${name}<br>

        ${f.status === "returned" ? `<button onclick="resend('${d.id}')">Resend</button>` : ""}

        <button onclick="deleteJob('${d.id}')">Delete</button>
      `;

      box.appendChild(div);
    }
  });
}

/* RESEND */
window.resend = async id => {

  await updateDoc(doc(db, "fares", id), {
    status: "broadcast",
    assignedTo: "",
    currentDriverUID: currentUser.uid
  });

  alert("Sent back to pool");
};

/* DELETE */
window.deleteJob = async id => {
  if (!confirm("Delete job?")) return;

  await updateDoc(doc(db, "fares", id), {
    status: "deleted"
  });

  alert("Deleted");
};

/* ACCEPTED */
function listenAccepted() {

  const q = query(collection(db, "fares"),
    where("currentDriverUID", "==", currentUser.uid)
  );

  const box = document.getElementById("acceptedList");

  onSnapshot(q, async snap => {

    box.innerHTML = "";

    for (const d of snap.docs) {

      const f = d.data();
      const name = await getUserName(f.originalDriverUID);

      const div = document.createElement("div");

      div.className = "fare-card";

      div.innerHTML = `
        <b>${f.pickup}</b> → ${f.drop}<br>
        Original Driver: ${name}<br>
        <button onclick="completeJob('${d.id}')">Complete</button>
      `;

      box.appendChild(div);
    }
  });
}

/* COMPLETE */
window.completeJob = async id => {
  await updateDoc(doc(db, "fares", id), {
    status: "completed"
  });
};

/* PRIVATE POPUP */
function listenAssigned() {

  const q = query(
    collection(db, "fares"),
    where("assignedTo", "==", currentUser.uid),
    where("status", "==", "assigned")
  );

  onSnapshot(q, snap => {
    snap.docChanges().forEach(change => {
      if (change.type === "added") {
        showPopup(change.doc.data(), change.doc.id);
      }
    });
  });
}

/* POPUP WITH TIMEOUT */
function showPopup(f, id) {

  const popup = document.getElementById("jobPopup");
  popup.style.display = "block";

  playJobSound();

  document.getElementById("jobDetails").innerHTML = `
    Pickup: ${f.pickup}<br>
    Drop: ${f.drop}<br>
    Price: ${f.price}
  `;

  let handled = false;

  const timer = setTimeout(async () => {

    if (handled) return;
    handled = true;

    const ref = doc(db, "fares", id);
    const snap = await getDoc(ref);
    const job = snap.data();

    if (job.status === "assigned") {
      await updateDoc(ref, {
        status: "returned",
        assignedTo: "",
        currentDriverUID: job.originalDriverUID
      });
    }

    stopSound();
    popup.style.display = "none";

  }, 12000);

  document.getElementById("acceptBtn").onclick = async () => {

    if (handled) return;
    handled = true;

    await updateDoc(doc(db, "fares", id), {
      status: "accepted",
      currentDriverUID: currentUser.uid
    });

    stopSound();
    acceptSound.play();

    popup.style.display = "none";
    clearTimeout(timer);
  };

  document.getElementById("rejectBtn").onclick = async () => {

    if (handled) return;
    handled = true;

    const ref = doc(db, "fares", id);
    const snap = await getDoc(ref);
    const job = snap.data();

    await updateDoc(ref, {
      status: "returned",
      assignedTo: "",
      currentDriverUID: job.originalDriverUID
    });

    stopSound();
    declineSound.play();

    popup.style.display = "none";
    clearTimeout(timer);
  };
}

/* RETURN ALERT */
function listenReturns() {

  const q = query(
    collection(db, "fares"),
    where("originalDriverUID", "==", auth.currentUser.uid),
    where("status", "==", "returned")
  );

  onSnapshot(q, snap => {
    snap.docChanges().forEach(change => {
      if (change.type === "modified") {
        declineSound.play();
      }
    });
  });
}