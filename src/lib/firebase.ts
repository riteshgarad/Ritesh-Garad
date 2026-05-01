import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const storage = getStorage(app);

// Secondary App (Used only for creating users to avoid logout)
const secondaryApp = getApps().find(a => a.name === "Secondary") 
                     || initializeApp(firebaseConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);

export default app;
