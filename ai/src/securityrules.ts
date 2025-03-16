import { defineStore } from 'pinia';
import { ref } from 'vue';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, firestore } from '../src/firebase/init';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export const useSecurityStore = defineStore('security', () => {
  const failedLoginAttempts = ref<number>(0);
  const lastFailedLogin = ref<number | null>(null);
  const maxLoginAttempts = 5; // Max login attempts before lockout
  const lockoutDuration = 15 * 60 * 1000; // 15 minutes lockout period
  const sessionTimeout = 30 * 60 * 1000; // Auto logout after 30 mins inactivity
  const lastActivity = ref<number>(Date.now());

  // Detect failed login attempts & apply lockout
  const trackFailedLogin = async (email: string) => {
    const userRef = doc(firestore, 'securityLogs', email);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      failedLoginAttempts.value = data.failedAttempts || 0;
      lastFailedLogin.value = data.lastFailed || null;
    }

    failedLoginAttempts.value++;

    // If user exceeds max attempts, lock them out
    if (failedLoginAttempts.value >= maxLoginAttempts) {
      await setDoc(userRef, {
        failedAttempts: failedLoginAttempts.value,
        lastFailed: Date.now(),
        lockedUntil: Date.now() + lockoutDuration
      }, { merge: true });
      throw new Error('⚠️ Too many failed login attempts! Please try again later.');
    } else {
      await setDoc(userRef, {
        failedAttempts: failedLoginAttempts.value,
        lastFailed: Date.now()
      }, { merge: true });
    }
  };

  // Reset failed login attempts on successful login
  const resetFailedLogin = async (email: string) => {
    const userRef = doc(firestore, 'securityLogs', email);
    await setDoc(userRef, { failedAttempts: 0, lastFailed: null }, { merge: true });
  };

  // Auto logout after session timeout
  const autoLogout = () => {
    if (Date.now() - lastActivity.value > sessionTimeout) {
      signOut(auth);
      console.warn('🔒 Auto logout due to inactivity.');
    }
  };

  // Track user activity & refresh session
  const updateActivity = () => {
    lastActivity.value = Date.now();
  };

  // Monitor user authentication state
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Flag account if suspicious
        console.warn('🚨 Unauthorized user detected!');
      }
    }
  });

  return {
    trackFailedLogin,
    resetFailedLogin,
    autoLogout,
    updateActivity
  };
});