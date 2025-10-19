// src/services/firebase.ts
import { initializeApp } from "firebase/app";
// FIX: Added 'increment' to the import list from 'firebase/firestore' to resolve export error.
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc, getDocs, writeBatch, orderBy, limit, getDoc, setDoc, increment } from "firebase/firestore";

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