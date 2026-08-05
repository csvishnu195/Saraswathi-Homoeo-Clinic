import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 1. Go to https://console.firebase.google.com -> Create a project (free Spark plan is fine).
// 2. In Project settings -> General -> "Your apps", add a Web app and copy the config below.
// 3. Enable Authentication -> Sign-in method -> Email/Password.
// 4. Enable Firestore Database -> Start in production mode (rules are provided in firestore.rules).
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// The one email allowed to self-register/sign in as an admin from the Admin
// Login screen. Change this to the clinic's real admin email before deploying.
export const ADMIN_EMAIL = "ssambaji9@gmail.com";
