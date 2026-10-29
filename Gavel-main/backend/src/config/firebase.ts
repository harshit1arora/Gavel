import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
dotenv.config();

// Attempt to initialize using default credentials, or fallback for local dev
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project'
      });
    }
  } catch (err) {
    console.warn('Firebase Admin default initialization failed. Falling back to demo mode.');
    if (!admin.apps.length) {
      admin.initializeApp({ projectId: 'demo-project' });
    }
  }
}

export const db = admin.firestore();
export { admin };

export const {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentReference,
  FieldValue
} = require('firebase-admin/firestore');
