// src/services/firebase.ts
import { initializeApp } from "firebase/app";
// FIX: Added 'increment' to the import list from 'firebase/firestore' to resolve export error.
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc, getDocs, writeBatch, orderBy, limit, getDoc, setDoc, increment, enableIndexedDbPersistence } from "firebase/firestore";

// --- IMPORTANT ---
// Replace this with your own Firebase project configuration.
// You can find this in your Firebase project settings.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Enable offline persistence to prevent errors when the client is offline.
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // This can happen if multiple tabs are open, as persistence can only be
      // enabled in one tab at a time.
      console.warn("Firestore persistence failed: another tab may be open.");
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the features required.
      console.warn("Firestore persistence is not supported in this browser.");
    }
  });

export { 
    db, 
    collection, 
    addDoc, 
    query, 
    where, 
    onSnapshot, 
    serverTimestamp,
    doc,
    updateDoc,
    getDocs,
    writeBatch,
    orderBy,
    limit,
    getDoc,
    setDoc,
    // FIX: Added 'increment' to the export list to make it available for other services.
    increment,
};