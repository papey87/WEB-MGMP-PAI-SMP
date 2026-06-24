import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  projectId: "promising-card-0pnh2",
  appId: "1:827904139612:web:8da7d60f6e994022a16199",
  apiKey: "AIzaSyCp4sLgQ00xWa3BBvFRJs1AEnD1EytNUQc",
  authDomain: "promising-card-0pnh2.firebaseapp.com",
  storageBucket: "promising-card-0pnh2.firebasestorage.app",
  messagingSenderId: "827904139612"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID for custom databases
const db = getFirestore(app, "ai-studio-52c3b800-b7a1-459e-af6e-315e9ae0eb3a");

// Initialize Auth
const auth = getAuth(app);

export { db, auth };

