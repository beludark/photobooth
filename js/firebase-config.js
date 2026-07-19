// 1. Va sur https://console.firebase.google.com/, crée un projet (gratuit, plan "Spark").
// 2. Dans le projet : Build > Firestore Database > "Créer une base de données"
//    (mode "test" suffit largement pour un usage perso à deux).
// 3. Dans Project settings > General > "Vos applications" > icône Web ("</>")
//    pour enregistrer une app web, puis copie l'objet de config ici en dessous.

const firebaseConfig = {
  apiKey: "REMPLACE_MOI",
  authDomain: "REMPLACE_MOI.firebaseapp.com",
  projectId: "REMPLACE_MOI",
  storageBucket: "REMPLACE_MOI.appspot.com",
  messagingSenderId: "REMPLACE_MOI",
  appId: "REMPLACE_MOI",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
