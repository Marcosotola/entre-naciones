import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let app: FirebaseApp | undefined;
if (isFirebaseConfigured) {
  app = getApps()[0] ?? initializeApp(firebaseConfig);
}

// Cuando Firebase no está configurado, estos quedan undefined y las
// funciones de lectura devuelven datos vacíos (ver src/lib/data.ts).
export const db = (app ? getFirestore(app) : undefined) as Firestore;
export const storage = (app ? getStorage(app) : undefined) as FirebaseStorage;
export const auth = (
  app && typeof window !== "undefined" ? getAuth(app) : undefined
) as Auth;
