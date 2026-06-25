import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const defaultFirebaseConfig = {
  projectId: "promising-card-0pnh2",
  appId: "1:827904139612:web:8da7d60f6e994022a16199",
  apiKey: "AIzaSyCp4sLgQ00xWa3BBvFRJs1AEnD1EytNUQc",
  authDomain: "promising-card-0pnh2.firebaseapp.com",
  storageBucket: "promising-card-0pnh2.firebasestorage.app",
  messagingSenderId: "827904139612"
};

let firebaseConfig = defaultFirebaseConfig;

try {
  const saved = localStorage.getItem("custom_firebase_config");
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.apiKey && parsed.projectId && parsed.appId) {
      firebaseConfig = { ...defaultFirebaseConfig, ...parsed };
    }
  }
} catch (e) {
  console.error("Failed to load custom firebase configuration, falling back:", e);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let firestoreDbId = "ai-studio-52c3b800-b7a1-459e-af6e-315e9ae0eb3a";
try {
  const savedDbId = localStorage.getItem("custom_firebase_db_id");
  if (savedDbId) {
    firestoreDbId = savedDbId;
  }
} catch (e) {
  console.error("Failed to load custom firestore database ID:", e);
}

// Initialize Firestore with specific database ID for custom databases
const db = getFirestore(app, firestoreDbId);

// Initialize Auth
const auth = getAuth(app);

export { db, auth };

