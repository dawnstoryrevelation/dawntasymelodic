import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
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

function handleSignUp() {
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
            // Optionally, redirect to a welcome page or update the UI
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Sign-up error:", errorCode, errorMessage);
            alert("Sign up failed: " + errorMessage);
        });
}

import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const auth = getAuth();
signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed in 
    const user = userCredential.user;
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
  });
