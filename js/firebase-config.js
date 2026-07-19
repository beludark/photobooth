// 1. Va sur https://console.firebase.google.com/, crée un projet (gratuit, plan "Spark").
// 2. Dans le projet : Build > Firestore Database > "Créer une base de données"
//    (mode "test" suffit largement pour un usage perso à deux).
// 3. Dans Project settings > General > "Vos applications" > icône Web ("</>")
//    pour enregistrer une app web, puis copie l'objet de config ici en dessous.

const firebaseConfig = {
    apiKey: "AIzaSyDQma6AkM5ZzVhlkJA4dPL3lxmfC-ptmTI",
    authDomain: "photobooth-f925c.firebaseapp.com",
    projectId: "photobooth-f925c",
    storageBucket: "photobooth-f925c.firebasestorage.app",
    messagingSenderId: "89265043548",
    appId: "1:89265043548:web:1c11bafe427089e4380e99",
    measurementId: "G-4CCYT3VLPC"
  };

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
