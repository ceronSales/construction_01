/**
 * WHAT: Firebase app initialization and service exports.
 * HOW: Reads credentials from environment variables and initializes
 *      Firebase app, Firestore, and Auth services.
 * CALLED BY: Any module requiring db or auth (pages, components).
 */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, logEvent as firebaseLogEvent, isSupported } from "firebase/analytics";

// Firebase project credentials loaded from .env
const firebaseConfig = {
  apiKey: "AIzaSyDMNMRQ-H0wKJw2pMehgEildLu8ByXZ-kI",
  authDomain: "fir-trinx.firebaseapp.com",
  projectId: "fir-trinx",
  storageBucket: "fir-trinx.firebasestorage.app",
  messagingSenderId: "554228521430",
  appId: "1:554228521430:web:49f157d965a3e6e0f0ac77"
};

const app = initializeApp(firebaseConfig);

export const db   = getFirestore(app);
export const auth = getAuth(app);

/* ── Analytics — fully silent, only activates when credentials are valid ── */
let analytics = null;

isSupported()
  .then(supported => {
    // Only init analytics if measurementId is a real value (not placeholder)
    const mid = process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "";
    if (supported && mid && !mid.startsWith("G-XXX")) {
      analytics = getAnalytics(app);
    }
  })
  .catch(() => {
    // Silently swallow — analytics is non-critical
  });

/**
 * WHAT: logEvent — safe wrapper around Firebase Analytics logEvent.
 * HOW:  No-ops silently if analytics is not initialized or credentials
 *       are missing. Never throws. Safe to call at any time.
 * CALLED BY: ContactSection, AppointmentSection, any tracking call.
 */
export function logEvent(eventName, params = {}) {
  try {
    if (analytics) firebaseLogEvent(analytics, eventName, params);
  } catch (_) {
    // Silently swallow — analytics failures must never crash the UI
  }
}

export default app;