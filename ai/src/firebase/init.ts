// src/firebase/init.ts
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
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
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
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
  .then(() => console.log('Firebase Auth persistence set to local'))
  .catch((error) => console.error('Error setting auth persistence:', error));

// Enable Firestore offline persistence
enableIndexedDbPersistence(db)
  .then(() => console.log('Firestore persistence enabled'))
  .catch((err) => console.warn('Firestore persistence could not be enabled:', err.code));

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