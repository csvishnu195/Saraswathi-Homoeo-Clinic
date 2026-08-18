import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, isAdminEmail } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        setProfile(snap.exists() ? snap.data() : null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function registerPatient({ name, email, password, phone }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const newProfile = {
      name,
      email,
      phone,
      role: "patient",
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "users", cred.user.uid), newProfile);
    setProfile(newProfile);
    return cred.user;
  }

  async function loginPatient({ email, password }) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (!snap.exists() || snap.data().role !== "patient") {
      await signOut(auth);
      throw new Error("This login is for patients only. Use the admin login instead.");
    }
    return cred.user;
  }

  async function loginAdmin({ email, password }) {
    if (!isAdminEmail(email)) {
      throw new Error("This email is not authorized for admin access.");
    }
    const cred = await signInWithEmailAndPassword(auth, email, password);
    let snap = await getDoc(doc(db, "users", cred.user.uid));
    if (!snap.exists()) {
      // First-ever admin sign-in: create the admin profile automatically.
      const adminProfile = {
        name: "Clinic Admin",
        email,
        role: "admin",
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", cred.user.uid), adminProfile);
      setProfile(adminProfile);
    } else if (snap.data().role !== "admin") {
      await signOut(auth);
      throw new Error("This account is not an admin account.");
    }
    return cred.user;
  }

  async function registerAdminFirstTime({ email, password }) {
    if (!isAdminEmail(email)) {
      throw new Error("This email is not authorized for admin access.");
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const adminProfile = {
      name: "Clinic Admin",
      email,
      role: "admin",
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "users", cred.user.uid), adminProfile);
    setProfile(adminProfile);
    return cred.user;
  }

  async function logout() {
    await signOut(auth);
  }

  async function resetPassword(email) {
    if (!email) throw new Error("Enter your email address first.");
    await sendPasswordResetEmail(auth, email);
  }

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === "admin",
    isPatient: profile?.role === "patient",
    registerPatient,
    loginPatient,
    loginAdmin,
    registerAdminFirstTime,
    resetPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
