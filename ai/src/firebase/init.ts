// src/firebase/init.ts
import { initializeApp, FirebaseApp } from 'firebase/app'; // Added FirebaseApp type
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  connectAuthEmulator, // <<< ADDED
  Auth, // Added Auth type
} from 'firebase/auth';
import {
  getFirestore,
  enableIndexedDbPersistence,
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  updateDoc,
  connectFirestoreEmulator, // <<< ADDED
  Firestore, // Added Firestore type
} from 'firebase/firestore';
import {
    getFunctions,
    connectFunctionsEmulator, // <<< ADDED
    Functions // Added Functions type
} from 'firebase/functions';
import {
    getStorage,
    connectStorageEmulator, // <<< ADDED (Optional, if you use Storage)
    FirebaseStorage // Added FirebaseStorage type
} from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics'; // Added Analytics type

// Firebase Configuration object
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase app
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
// Specify region if needed (e.g., if functions deployed outside us-central1)
const functions: Functions = getFunctions(app /*, 'your-region' */);
const storage: FirebaseStorage = getStorage(app);
let analytics: Analytics | null = null;

// --- EMULATOR CONNECTION (ONLY IN DEVELOPMENT) ---
if (import.meta.env.DEV) {
    try {
        console.log("Connecting to Firebase Emulators...");
        // Default ports - Adjust if your firebase.json emulator config uses different ports
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        console.log("Auth Emulator connected (http://127.0.0.1:9099)");
        connectFirestoreEmulator(db, '127.0.0.1', 8080); // Hostname first for Firestore
        console.log("Firestore Emulator connected (localhost:8080)");
        connectFunctionsEmulator(functions, '127.0.0.1', 5001); // Hostname first for Functions
        console.log("Functions Emulator connected (localhost:5001)");
        // connectStorageEmulator(storage, '127.0.0.1', 9199); // Uncomment if using Storage Emulator
        // console.log("Storage Emulator connected (localhost:9199)");
    } catch (error) {
         console.error("!!! Error connecting to Firebase Emulators:", error);
         console.warn("Ensure Firebase Emulator Suite is running (`firebase emulators:start`)");
         console.warn("Check emulator ports match configuration in firebase.json and this file.");
    }
}
// --- END EMULATOR CONNECTION ---


// Set auth persistence to local (run AFTER potential emulator connection)
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log('Firebase Auth persistence set to local'))
  .catch((error) => console.error('Error setting auth persistence:', error));

// Enable Firestore offline persistence (run AFTER potential emulator connection)
enableIndexedDbPersistence(db)
  .then(() => console.log('Firestore persistence enabled'))
  .catch((err) => {
      if (err.code == 'failed-precondition') {
          console.warn('Firestore persistence failed (multiple tabs open?');
      } else if (err.code == 'unimplemented') {
          console.warn('Firestore persistence not available in this browser.');
      } else {
          console.warn('Firestore persistence could not be enabled:', err.code);
      }
  });


// Initialize analytics in production
if (import.meta.env.PROD) {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
        console.log('Firebase Analytics initialized');
      }
    })
    .catch((err) => console.error('Error initializing analytics:', err));
}

// 🔐 Helper: Generate unique memory code
function generateMemoryCode(): string {
  const adjectives = ['MATH', 'DREAM', 'CHAOS', 'FIRE', 'STORM', 'NOVA'];
  const nouns = ['FORCE', 'XPLOSION', 'STRIKE', 'VERSE', 'CORE', 'BLAZE'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj}-${noun}-${num}`; // e.g., "FIRE-CORE-4721"
}

// 🧠 Assign memory codes to existing users (run once, manually if needed)
async function assignMemoryCodesToExistingUsers(): Promise<void> {
  try {
    // Ensure DB is initialized before using it
    if (!db) {
      console.error("Firestore DB not initialized for assignMemoryCodes.");
      return;
    }
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (!data.memoryCode) {
        await updateDoc(doc(db, 'users', docSnap.id), {
          memoryCode: generateMemoryCode(),
          updatedAt: new Date().toISOString(),
        });
        console.log(`Memory code added to user ${docSnap.id}`);
      }
    }
  } catch (error) {
    console.error('Error assigning memory codes:', error);
  }
}

// 🔁 Auto-assign memory code on login/signup
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Ensure DB is initialized before using it
    if (!db) {
       console.error("Firestore DB not initialized for onAuthStateChanged.");
       return;
    }
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        // New user: Create document with memory code
        await setDoc(userDocRef, {
          memoryCode: generateMemoryCode(),
          email: user.email || '',
          createdAt: new Date().toISOString(),
        });
        console.log('Memory code created for new user:', user.uid);
      } else {
        // Existing user: Ensure memory code exists
        const userData = userSnap.data();
        if (!userData.memoryCode) {
          await updateDoc(userDocRef, {
            memoryCode: generateMemoryCode(),
            updatedAt: new Date().toISOString(),
          });
          console.log('Memory code patched to existing user:', user.uid);
        }
      }
    } catch (error) {
      console.error('Error handling user memory code:', error);
    }
  }
});

// Export initialized services and helper functions
export {
  app,
  auth,
  db,
  functions,
  storage,
  analytics,
  assignMemoryCodesToExistingUsers,
  generateMemoryCode, // Exported for potential use elsewhere
};

// Export function to get Firebase services
export function getFirebaseServices() {
  return { app, auth, db, functions, storage, analytics };
}