import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBIzjmiLRh4JYBK6Ve6qdoOWXs79Y-fCk8",
  authDomain: "saraswathi-homoeo-clinic.firebaseapp.com",
  projectId: "saraswathi-homoeo-clinic",
  storageBucket: "saraswathi-homoeo-clinic.firebasestorage.app",
  messagingSenderId: "13158524966",
  appId: "1:13158524966:web:986f22945ce9c426d55ee7",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// The emails allowed to self-register/sign in as an admin from the Admin
// Login screen.
export const ADMIN_EMAILS = ["ssambaji9@gmail.com", "csvishnu195@gmail.com"];

export function isAdminEmail(email) {
  const normalized = (email || "").trim().toLowerCase();
  return ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === normalized);
}
