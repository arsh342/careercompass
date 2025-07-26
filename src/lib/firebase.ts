// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCfT2Hal6k32D4gJfVzLnxlE33fLFq1iMk",
  authDomain: "careercompass-4s96f.firebaseapp.com",
  projectId: "careercompass-4s96f",
  storageBucket: "careercompass-4s96f.appspot.com",
  messagingSenderId: "857031005574",
  appId: "1:857031005574:web:819f697f6f53f7bb5bc807"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
