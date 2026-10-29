import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  User
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

/**
 * True only when real Firebase credentials are present.
 *
 * The open-source build ships placeholder values, and with placeholders
 * `onAuthStateChanged` never fires, which used to leave /dashboard and every
 * protected route stuck on a spinner forever. Callers check this flag instead
 * of waiting on a network call that will never resolve.
 */
export const isFirebaseConfigured = (() => {
  const key = import.meta.env.VITE_FIREBASE_API_KEY;
  const project = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const isPlaceholder = (v?: string) => !v || v.includes("YOUR_") || v === "your-api-key";
  return !isPlaceholder(key) && !isPlaceholder(project);
})();

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Track user in database to store waitlist/beta permissions
const syncUserToDb = async (user: User, fullName?: string) => {
  if (!user) return;
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: fullName || user.displayName,
      photoURL: user.photoURL,
      createdAt: new Date(),
      status: "waitlist"
    });
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await syncUserToDb(result.user);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const signInWithGithub = async () => {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    await syncUserToDb(result.user);
    return result.user;
  } catch (error) {
    console.error("Error signing in with GitHub", error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, fullName: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await syncUserToDb(result.user, fullName);
    return result.user;
  } catch (error) {
    console.error("Error signing up with email", error);
    throw error;
  }
};

export const logInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Error signing in with email", error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error sending password reset email", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
