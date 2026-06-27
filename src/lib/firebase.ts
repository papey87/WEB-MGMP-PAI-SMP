import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 1. Automatic Sandbox Firebase Configuration as safe fallback
const sandboxFirebaseConfig = {
  projectId: "promising-card-0pnh2",
  appId: "1:827904139612:web:8da7d60f6e994022a16199",
  apiKey: "AIzaSyCp4sLgQ00xWa3BBvFRJs1AEnD1EytNUQc",
  authDomain: "promising-card-0pnh2.firebaseapp.com",
  storageBucket: "promising-card-0pnh2.firebasestorage.app",
  messagingSenderId: "827904139612"
};

const metaEnv = (import.meta as any).env || {};

// 2. Custom Firebase configuration prioritizing Environment Variables
const envFirebaseConfig = {
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
  apiKey: metaEnv.VITE_FIREBASE_API_KEY,
  appId: metaEnv.VITE_FIREBASE_APP_ID,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID
};

// Load custom config from localStorage if present
let localFirebaseConfig: any = null;
try {
  const saved = localStorage.getItem("custom_firebase_config");
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.apiKey || parsed.projectId || parsed.appId) {
      localFirebaseConfig = parsed;
    }
  }
} catch (e) {
  console.error("Failed to load custom firebase configuration from localStorage:", e);
}

// 3. Determine which configuration to use:
// We use the custom configuration if an API key is specified in environment variables OR localStorage.
// Otherwise, we gracefully fall back to the sandbox configuration so the app doesn't crash on start.
let firebaseConfig = { ...sandboxFirebaseConfig };
let isUsingCustom = false;

if (localFirebaseConfig && localFirebaseConfig.apiKey) {
  firebaseConfig = { ...firebaseConfig, ...localFirebaseConfig };
  isUsingCustom = true;
} else if (envFirebaseConfig.apiKey) {
  firebaseConfig = {
    projectId: envFirebaseConfig.projectId || "siladik-guru-pai-smp",
    authDomain: envFirebaseConfig.authDomain || "siladik-guru-pai-smp.firebaseapp.com",
    storageBucket: envFirebaseConfig.storageBucket || "siladik-guru-pai-smp.firebasestorage.app",
    apiKey: envFirebaseConfig.apiKey,
    appId: envFirebaseConfig.appId || "",
    messagingSenderId: envFirebaseConfig.messagingSenderId || ""
  };
  isUsingCustom = true;
} else {
  // If the user set some custom env variables but hasn't put the api key yet, we still check if they want to override
  const hasAnyEnv = envFirebaseConfig.projectId || envFirebaseConfig.authDomain;
  if (hasAnyEnv && envFirebaseConfig.apiKey) {
    firebaseConfig = {
      projectId: envFirebaseConfig.projectId || "siladik-guru-pai-smp",
      authDomain: envFirebaseConfig.authDomain || "siladik-guru-pai-smp.firebaseapp.com",
      storageBucket: envFirebaseConfig.storageBucket || "siladik-guru-pai-smp.firebasestorage.app",
      apiKey: envFirebaseConfig.apiKey,
      appId: envFirebaseConfig.appId || "",
      messagingSenderId: envFirebaseConfig.messagingSenderId || ""
    };
    isUsingCustom = true;
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 4. Determine Database ID:
// If using custom configuration, default to "(default)" unless overridden.
// Otherwise, fall back to the sandbox database ID "ai-studio-52c3b800-b7a1-459e-af6e-315e9ae0eb3a".
let firestoreDbId = "ai-studio-52c3b800-b7a1-459e-af6e-315e9ae0eb3a";

if (isUsingCustom) {
  firestoreDbId = metaEnv.VITE_FIREBASE_DATABASE_ID || "(default)";
}

try {
  const savedDbId = localStorage.getItem("custom_firebase_db_id");
  if (savedDbId && savedDbId.trim() !== "") {
    firestoreDbId = savedDbId;
  }
} catch (e) {
  console.error("Failed to load custom firestore database ID:", e);
}

// Initialize Firestore
const db = getFirestore(app, firestoreDbId);

// Initialize Auth
const auth = getAuth(app);

export { db, auth };

