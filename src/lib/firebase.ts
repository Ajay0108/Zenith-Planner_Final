import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInAnonymously, signOut, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";

// Config from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyBdW5oDICv-UCCHcIoQ9WNeDeA9oL5dIbU",
  authDomain: "gen-lang-client-0045013712.firebaseapp.com",
  projectId: "gen-lang-client-0045013712",
  storageBucket: "gen-lang-client-0045013712.firebasestorage.app",
  messagingSenderId: "454285673626",
  appId: "1:454285673626:web:e072105a21cab063b60b23"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
// Use the custom database ID specified in firebase-applet-config.json
export const db = getFirestore(app, "ai-studio-dd728d98-cdc3-4ca3-87a9-650f0ce056d9");

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/calendar");
googleProvider.addScope("https://www.googleapis.com/auth/calendar.events");
googleProvider.addScope("https://www.googleapis.com/auth/gmail.readonly");
googleProvider.setCustomParameters({ prompt: "select_account" });

let cachedAccessToken: string | null = null;
let isLoginActive = false;

// ─── TOKEN PERSISTENCE ────────────────────────────────────────────────────────
// Google tokens expire in 1 hour. We save them to localStorage so the
// calendar/gmail sync still works after a page refresh within that window.
const TOKEN_KEY    = "google_oauth_token";
const EXPIRY_KEY   = "google_oauth_expiry";

// Restore token from localStorage on module load (runs once at startup)
try {
  const stored = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(EXPIRY_KEY);
  if (stored && expiry && Date.now() < parseInt(expiry, 10)) {
    cachedAccessToken = stored;
    console.log("✅ Restored Google access token from localStorage");
  } else if (stored) {
    // Token exists but expired — clean up
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    console.log("⚠️ Stored Google token was expired, cleared.");
  }
} catch (_) { /* localStorage unavailable in SSR or restricted env */ }

export function getCachedAccessToken() {
  return cachedAccessToken;
}

export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      // Google tokens last ~3600s; we treat them valid for 55 min (3300s) to be safe
      localStorage.setItem(EXPIRY_KEY, (Date.now() + 3300 * 1000).toString());
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRY_KEY);
    }
  } catch (_) { /* localStorage unavailable */ }
}

export async function loginWithGoogle() {
  if (isLoginActive) {
    console.warn("Google login already in progress, ignoring duplicate request");
    return null;
  }
  isLoginActive = true;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      setCachedAccessToken(credential.accessToken); // ← persists to localStorage
      console.log("✅ Google access token saved to localStorage");
    }
    return result.user;
  } catch (error) {
    console.error("Google login error:", error);
    throw error;
  } finally {
    isLoginActive = false;
  }
}

export async function loginAnonymously() {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    // Swallowed gracefully: Return null to trigger seamless local fallback without console noise
    return null;
  }
}

export async function logoutUser() {
  setCachedAccessToken(null); // ← clears localStorage token too
  await signOut(auth);
}

export async function loginWithEmail(email: string, pass: string) {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function registerWithEmail(email: string, pass: string) {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  return result.user;
}
