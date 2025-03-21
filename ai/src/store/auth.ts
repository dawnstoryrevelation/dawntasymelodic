// src/store/auth.ts
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

// Declare firebase property on window object
declare global {
  interface Window {
    firebase?: {
      analytics: any;
    };
  }
}
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence, // Added
  browserLocalPersistence, // Added
  browserSessionPersistence // Added
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '@/firebase/init';
import router from '@/router';

// 🚀 USER ROLE ENUM
export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  PREMIUM = 'premium',
  ADMIN = 'admin'
}

// 🛡️ USER PROFILE INTERFACE
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  role: UserRole;
  plan: 'free' | 'premium' | 'rift';
  credits: number;
  lastLogin: Date | null;
  chats: string[];
  preferences: {
    theme: 'dark' | 'light' | 'cosmic' | 'ocean';
    notifications: boolean;
  };
  createdAt: Date;
}

// 🔑 AUTH STORE
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const userProfile = ref<UserProfile | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 🌟 AUTH STATUS
  const isAuthenticated = computed(() => !!user.value);
  const userRole = computed(() => userProfile.value?.role || UserRole.GUEST);
  const availableCredits = computed(() => userProfile.value?.credits || 0);
  const displayName = computed(() => userProfile.value?.displayName || user.value?.displayName || null);
  const uid = computed(() => user.value?.uid || null);

  // 🔑 GOOGLE AUTH PROVIDER
  const googleProvider = new GoogleAuthProvider();

  // 🌟 INIT AUTH
  const initAuth = () => {
    loading.value = true;
    return new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        try {
          if (currentUser) {
            user.value = currentUser;
            await fetchUserProfile(currentUser.uid);
            
            // Check if we need to redirect from login/register pages
            const currentRoute = router.currentRoute.value;
            if (currentRoute.path === '/login' || currentRoute.path === '/register') {
              router.push('/chat');
            }
          } else {
            user.value = null;
            userProfile.value = null;
            
            // Check if we need to redirect to login
            const currentRoute = router.currentRoute.value;
            if (currentRoute.meta.requiresAuth) {
              router.push('/login');
            }
          }
        } catch (e: any) {
          console.error('Auth state change error:', e);
          error.value = e.message;
        } finally {
          loading.value = false;
          resolve();
          // We keep the listener for future updates
        }
      });
    });
  };

  // 🌟 FETCH USER PROFILE
  const fetchUserProfile = async (uid: string) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        userProfile.value = {
          uid: uid,
          displayName: data.displayName || 'Dawntasy User',
          email: data.email || null,
          role: data.role || UserRole.USER,
          plan: data.plan || 'free',
          credits: data.credits || 0,
          lastLogin: data.lastLogin ? new Date(data.lastLogin.seconds * 1000) : null,
          chats: data.chats || [],
          preferences: data.preferences || { theme: 'cosmic', notifications: true },
          createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date()
        };
        
        // Update last login timestamp
        await updateDoc(docRef, {
          lastLogin: serverTimestamp()
        });
        
        console.log("User profile loaded:", userProfile.value);
        return userProfile.value;
      } else {
        console.warn("User document not found in Firestore!");
        return null;
      }
    } catch (e: any) {
      console.error('Error fetching user profile:', e);
      error.value = e.message;
      return null;
    }
  };

  // 🌟 CREATE USER PROFILE
  const createUserProfile = async (user: User, displayName: string) => {
    try {
      console.log("Creating user profile for:", user.uid, displayName);
      
      // Prepare username data for checking
      const lowerCaseName = displayName.toLowerCase();
      
      // Check if username exists - using a safer query approach
      try {
        const usernamesRef = collection(db, "usernames");
        const q = query(usernamesRef, where("name", "==", lowerCaseName));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          console.error("Username already taken!");
          throw new Error("Username already taken!");
        }
      } catch (nameCheckError) {
        console.warn("Username check error (continuing anyway):", nameCheckError);
        // Continue anyway - this might be a permissions issue on the usernames collection
      }
      
      // Create profile object with timestamps as server timestamps
      const profileData = {
        uid: user.uid,
        displayName: displayName,
        email: user.email,
        role: UserRole.USER,
        plan: 'free',
        credits: 100,
        lastLogin: serverTimestamp(),
        chats: [],
        preferences: {
          theme: 'cosmic',
          notifications: true
        },
        createdAt: serverTimestamp()
      };
      
      console.log("Creating user document:", profileData);
      
      // Save to Firestore - user document
      await setDoc(doc(db, "users", user.uid), profileData);
      console.log("User document created successfully");
      
      // Try to save the username reservation (not critical if fails)
      try {
        await setDoc(doc(db, "usernames", lowerCaseName), {
          uid: user.uid,
          name: lowerCaseName,
          displayName: displayName,
          createdAt: serverTimestamp()
        });
        console.log("Username reserved successfully");
      } catch (usernameError) {
        console.warn("Failed to reserve username, but continuing:", usernameError);
        // Non-critical error, continue anyway
      }
      
      // Create the local profile object
      const profile: UserProfile = {
        uid: user.uid,
        displayName: displayName,
        email: user.email,
        role: UserRole.USER,
        plan: 'free',
        credits: 100,
        lastLogin: new Date(),
        chats: [],
        preferences: {
          theme: 'cosmic',
          notifications: true
        },
        createdAt: new Date()
      };
      
      userProfile.value = profile;
      console.log("User profile created:", profile);
      return profile;
    } catch (e: any) {
      console.error("Error creating user profile:", e);
      error.value = e.message;
      throw e;
    }
  };

  // 🌟 REGISTER USER
  const registerUser = async (email: string, password: string, displayName: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      console.log("Registering user:", { email, displayName });
      
      // 1. Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Firebase auth account created successfully:", userCredential.user.uid);
      
      // 2. Update profile with display name
      await updateProfile(userCredential.user, { displayName });
      console.log("Firebase auth profile updated with displayName:", displayName);
      
      // 3. Create Firestore profile
      await createUserProfile(userCredential.user, displayName);
      console.log("Firestore profile created successfully");
      
      // 4. Set current user
      user.value = userCredential.user;
      
      loading.value = false;
      return { success: true, user: userCredential.user };
    } catch (e: any) {
      console.error("Registration error:", e);
      error.value = e.message;
      loading.value = false;
      return { success: false, error: e.message };
    }
  };

  // 🌟 LOGIN USER
  const loginUser = async (email: string, password: string, rememberMe?: boolean) => {
    loading.value = true;
    error.value = null;
    
    try {
      console.log("Logging in user:", email);
      
      // 1. Firebase authentication with persistence
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Firebase auth successful");
      
      // 2. Load user profile
      await fetchUserProfile(userCredential.user.uid);
      console.log("Profile loaded");
      
      // 3. Set current user
      user.value = userCredential.user;
      
      loading.value = false;
      return { success: true, user: userCredential.user };
    } catch (e: any) {
      console.error("Login error:", e);
      error.value = e.message;
      loading.value = false;
      return { success: false, error: e.message };
    }
  };

  // 🌟 LOGOUT
  const logout = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      console.log("Logging out user");
      await firebaseSignOut(auth);
      
      user.value = null;
      userProfile.value = null;
      
      loading.value = false;
      return { success: true };
    } catch (e: any) {
      console.error("Logout error:", e);
      error.value = e.message;
      loading.value = false;
      return { success: false, error: e.message };
    }
  };

  // 🌟 UPDATE USERNAME
  const updateUsername = async (newUsername: string) => {
    if (!user.value || !userProfile.value) {
      return { success: false, error: "User not authenticated" };
    }
    
    loading.value = true;
    error.value = null;
    
    try {
      // Update Auth profile
      await updateProfile(user.value, { displayName: newUsername });
      
      // Update Firestore profile
      const userRef = doc(db, "users", user.value.uid);
      await updateDoc(userRef, { displayName: newUsername });
      
      // Try to add to usernames collection (if permissions allow)
      try {
        await setDoc(doc(db, "usernames", newUsername.toLowerCase()), {
          uid: user.value.uid,
          name: newUsername.toLowerCase(),
          displayName: newUsername,
          createdAt: serverTimestamp()
        });
      } catch (usernameError) {
        console.warn("Failed to update username reservation, but continuing:", usernameError);
        // Non-critical error, continue anyway
      }
      
      // Update local profile
      if (userProfile.value) {
        userProfile.value.displayName = newUsername;
      }
      
      loading.value = false;
      return { success: true };
    } catch (e: any) {
      console.error("Username update error:", e);
      error.value = e.message;
      loading.value = false;
      return { success: false, error: e.message };
    }
  };

  // 🌟 RESET PASSWORD
  const resetPassword = async (email: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      await sendPasswordResetEmail(auth, email);
      loading.value = false;
      return { success: true };
    } catch (e: any) {
      console.error("Password reset error:", e);
      error.value = e.message;
      loading.value = false;
      return { success: false, error: e.message };
    }
  };

  // 🌟 GOOGLE SIGN IN
  const signInWithGoogle = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      // Configure Google Auth Provider
      googleProvider.setCustomParameters({
        'prompt': 'select_account'
      });
      
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Check if this is a new user
      const userRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create profile for new Google users
        await createUserProfile(firebaseUser, firebaseUser.displayName || 'Google User');
      } else {
        // Fetch existing profile
        await fetchUserProfile(firebaseUser.uid);
      }
      
      loading.value = false;
      return { success: true };
    } catch (e: any) {
      console.error("Google sign in error:", e);
      error.value = e.message;
      loading.value = false;
      return { success: false, error: e.message };
    }
  };

  // Optional: Disable Firebase Analytics to prevent CSP violation
  const disableAnalytics = () => {
    if (window.firebase && window.firebase.analytics) {
      const originalAnalytics = window.firebase.analytics;
      window.firebase.analytics = () => {
        console.warn('Firebase Analytics disabled to comply with CSP');
        return { logEvent: () => {}, setUserId: () => {}, setUserProperties: () => {} };
      };
      return () => {
        window.firebase.analytics = originalAnalytics; // Restore if needed later
      };
    }
  };

  // Run analytics disable on store initialization (optional)
  disableAnalytics();

  return {
    user,
    userProfile,
    loading,
    error,
    isAuthenticated,
    userRole,
    availableCredits,
    displayName,
    uid,
    initAuth,
    registerUser,
    loginUser,
    logout,
    resetPassword,
    signInWithGoogle,
    updateUsername
  };
});