import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// ------------------------------------------------------------------
// CONFIGURATION FIREBASE
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCcpzprgs4CnZDjFZ5rzfrs12aJ3zzR8SY",
  authDomain: "agir-72b37.firebaseapp.com",
  projectId: "agir-72b37",
  storageBucket: "agir-72b37.appspot.com"
};

// Initialisation de l'application
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Activation du mode hors ligne (Persistence)
try {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            // Plusieurs onglets ouverts
            console.warn('Persistance hors ligne : Multiples onglets ouverts.');
        } else if (err.code == 'unimplemented') {
            // Navigateur non supporté
            console.warn('Persistance hors ligne : Navigateur non supporté.');
        }
    });
} catch (e) {
    console.log("Persistence initialization error (can be ignored in some envs):", e);
}

export const isFirebaseConfigured = () => {
    // Vérifie simplement si projectId est défini correctement
    return firebaseConfig.projectId === "agir-72b37";
};