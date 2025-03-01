import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { auth, firestore } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const userProfile = ref<any>(null);
  const isLoading = ref(true);
  
  const isAuthenticated = computed(() => !!user.value);
  
  async function initAuth() {
    return new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        user.value = currentUser;
        
        if (currentUser) {
          await fetchUserProfile();
        } else {
          userProfile.value = null;
        }
        
        isLoading.value = false;
        unsubscribe();
        resolve();
      });
    });
  }
  
  async function register(email: string, password: string, displayName: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      
      // Create user profile in Firestore
      await setDoc(doc(firestore, 'users', userCredential.user.uid), {
        email,
        displayName,
        createdAt: new Date().toISOString(),
        settings: {
          theme: 'light'
        }
      });
      
      user.value = userCredential.user;
      await fetchUserProfile();
      
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  async function login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      user.value = userCredential.user;
      await fetchUserProfile();
      
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  async function signOut() {
    try {
      await firebaseSignOut(auth);
      user.value = null;
      userProfile.value = null;
      
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  async function fetchUserProfile() {
    if (!user.value) return;
    
    try {
      const docRef = doc(firestore, 'users', user.value.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        userProfile.value = docSnap.data();
      } else {
        console.error('No user profile found');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }
  
  async function updateUserProfile(data: any) {
    if (!user.value) return { success: false, error: 'Not authenticated' };
    
    try {
      const docRef = doc(firestore, 'users', user.value.uid);
      await setDoc(docRef, { ...userProfile.value, ...data }, { merge: true });
      
      // Update local state
      userProfile.value = { ...userProfile.value, ...data };
      
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  return {
    user,
    userProfile,
    isLoading,
    isAuthenticated,
    initAuth,
    register,
    login,
    signOut,
    fetchUserProfile,
    updateUserProfile
  };
});
