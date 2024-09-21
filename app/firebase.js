// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyASjY2-rLdkyt7ZVKrOZ8OLDm_u2jYuZ8g",
    authDomain: "bc-inv-logistics.firebaseapp.com",
    projectId: "bc-inv-logistics",
    storageBucket: "gs://bc-inv-logistics.appspot.com",
    messagingSenderId: "1094785289329",
    appId: "1:1094785289329:web:12b89b42924c2a5e659fd0"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };
