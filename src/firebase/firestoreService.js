/**
 * WHAT: firestoreService.js — centralized Firestore write/read operations.
 * HOW:  Exports individual async functions for each collection write.
 *       All functions validate required fields before writing.
 *       serverTimestamp() is added to every document for audit trail.
 *       Errors are thrown back to the caller for UI handling.
 * CALLED BY: ContactSection, AppointmentSection, any future form component.
 */

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

/* ── Collection name constants ── */
const COLLECTIONS = {
  contacts:     "contacts",
  appointments: "appointments",
  inquiries:    "inquiries",
};

/**
 * WHAT: Saves a contact form submission to Firestore.
 * HOW:  Validates required fields, writes to "contacts" collection with
 *       a serverTimestamp. Returns the new document reference.
 * CALLED BY: ContactSection handleSubmit
 */
export async function saveContact({ name, email, subject, message }) {
  if (!name || !email || !message) {
    throw new Error("Name, email, and message are required.");
  }
  const docRef = await addDoc(collection(db, COLLECTIONS.contacts), {
    name:      name.trim(),
    email:     email.trim().toLowerCase(),
    subject:   subject.trim(),
    message:   message.trim(),
    source:    "contact_form",
    createdAt: serverTimestamp(),
  });
  return docRef;
}

/**
 * WHAT: Saves an appointment booking to Firestore.
 * HOW:  Validates required fields, writes to "appointments" collection.
 *       Returns the new document reference.
 * CALLED BY: AppointmentSection handleSubmit
 */
export async function saveAppointment({ firstName, surname, email, phone, purpose, notes }) {
  if (!firstName || !email) {
    throw new Error("First name and email are required.");
  }
  const docRef = await addDoc(collection(db, COLLECTIONS.appointments), {
    firstName:  firstName.trim(),
    surname:    surname.trim(),
    email:      email.trim().toLowerCase(),
    phone:      phone.trim(),
    purpose:    purpose.trim(),
    notes:      (notes || "").trim(),
    source:     "appointment_form",
    status:     "pending",
    createdAt:  serverTimestamp(),
  });
  return docRef;
}

/**
 * WHAT: Saves a general project inquiry to Firestore.
 * HOW:  Writes to "inquiries" collection. Used for future inquiry forms.
 * CALLED BY: Future inquiry components
 */
export async function saveInquiry({ name, email, phone, projectType, budget, message }) {
  if (!name || !email) {
    throw new Error("Name and email are required.");
  }
  const docRef = await addDoc(collection(db, COLLECTIONS.inquiries), {
    name:        name.trim(),
    email:       email.trim().toLowerCase(),
    phone:       (phone || "").trim(),
    projectType: (projectType || "").trim(),
    budget:      (budget || "").trim(),
    message:     (message || "").trim(),
    source:      "inquiry_form",
    status:      "new",
    createdAt:   serverTimestamp(),
  });
  return docRef;
}

/**
 * WHAT: Fetches all contacts ordered by creation date descending.
 * HOW:  Queries "contacts" collection, returns array of doc data + id.
 * CALLED BY: Future admin dashboard
 */
export async function getContacts() {
  const q   = query(collection(db, COLLECTIONS.contacts), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * WHAT: Fetches all appointments ordered by creation date descending.
 * HOW:  Queries "appointments" collection, returns array of doc data + id.
 * CALLED BY: Future admin dashboard
 */
export async function getAppointments() {
  const q    = query(collection(db, COLLECTIONS.appointments), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
