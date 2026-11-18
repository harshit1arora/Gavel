import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
dotenv.config();

// Attempt to initialize using default credentials, or fallback for local dev
if (!getApps().length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      initializeApp({
        credential: applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project'
      });
    }
  } catch (err) {
    console.warn('Firebase Admin default initialization failed. Falling back to demo mode.');
    if (!getApps().length) {
      initializeApp({ projectId: 'demo-project' });
    }
  }
}

export const db = getFirestore();


export { Timestamp, FieldValue, DocumentReference, getFirestore } from 'firebase-admin/firestore';
