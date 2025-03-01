// auth.js
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

// Your Firebase configuration (safe to be public in Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyB8EaaBJ3tHZafzFhXn9qPI6W2NiVexHuk",
  authDomain: "dawntasyai.firebaseapp.com",
  projectId: "dawntasyai",
  storageBucket: "dawntasyai.firebasestorage.app",
  messagingSenderId: "809395170084",
  appId: "1:809395170084:web:17401e10346345ca6e61b1",
  measurementId: "G-61F3E88XMK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Sign-Up Function
export function handleSignUp() {
  const fullName = document.getElementById("fullname").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("User signed up:", user);
      alert("Sign up successful!");
      // Optionally, redirect to a welcome page or update the UI here
    })
    .catch((error) => {
      console.error("Sign-up error:", error.code, error.message);
      alert("Sign up failed: " + error.message);
    });
}

// Sign-In Function
export function handleSignIn() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("User signed in:", user);
      alert("Sign in successful! Welcome back!");
      // Redirect to dashboard or another page:
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      console.error("Sign in error:", error.code, error.message);
      alert("Sign in failed: " + error.message);
    });
}

// Toggle Form Code: Switch active class between signup and login forms
document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tab === 'signup') {
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
      } else if (btn.dataset.tab === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
      }
    });
  });
});

// Attach functions to global window for inline onclick to work
window.handleSignUp = handleSignUp;
window.handleSignIn = handleSignIn;
