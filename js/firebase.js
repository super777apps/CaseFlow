const firebaseConfig = {
  apiKey: "AIzaSyA2W5SdTVmeVStA0sp9RaPRXL2o1mSG8rc",
  authDomain: "caseflow-fd89e.firebaseapp.com",
  projectId: "caseflow-fd89e",
  storageBucket: "caseflow-fd89e.firebasestorage.app",
  messagingSenderId: "529706242117",
  appId: "1:529706242117:web:410ee5848e34c87383532c"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();