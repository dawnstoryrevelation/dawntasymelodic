import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyB8EaaBJ3tHZafzFhXn9qPI6W2NiVexHuk",
    authDomain: "dawntasyai.firebaseapp.com",
    projectId: "dawntasyai",
    storageBucket: "dawntasyai.firebasestorage.app",
    messagingSenderId: "809395170084",
    appId: "1:809395170084:web:17401e10346345ca6e61b1",
    measurementId: "G-61F3E88XMK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

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
        })
        .catch((error) => {
            console.error("Sign-up error:", error.code, error.message);
            alert("Sign up failed: " + error.message);
        });
}

export function handleSignIn() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("User signed in:", user);
            alert("Sign in successful! Welcome back!");
            window.location.href = "dashboard.html"; 
        })
        .catch((error) => {
            console.error("Sign in error:", error.code, error.message);
            alert("Sign in failed: " + error.message);
        });
}
