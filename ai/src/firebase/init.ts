// src/firebase/init.js
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase Configuration object
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);
let analytics = null;

// Set auth persistence to local
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Firebase Auth persistence set to local');
  })
  .catch((error) => {
    console.error('Error setting auth persistence:', error);
  });

// Enable Firestore offline persistence
try {
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log('Firestore persistence enabled');
    })
    .catch((err) => {
      console.warn('Firestore persistence could not be enabled:', err.code);
    });
} catch (err) {
  console.warn('Firestore persistence error:', err);
}

// Initialize analytics in production
if (import.meta.env.PROD) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized');
    }
  });
}

// Export initialized services
export { app, auth, db, functions, storage, analytics };

// Export function to get Firebase services
export function getFirebaseServices() {
  return {
    app,
    auth,
    db,
    functions,
    storage,
    analytics
  };
}