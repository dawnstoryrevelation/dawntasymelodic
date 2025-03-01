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
  // Redirect to welcome.html
            window.location.href = "welcome.html"; 
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
import { getAuth, onAuthStateChanged } from "firebase/auth";

const auth = getAuth();
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/auth.user
    const uid = user.uid;
    // ...
  } else {
    // User is signed out
    // ...
  }
});
<script type="module">
  import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
  import { app } from "./auth.js"; // Make sure your 'app' is exported in auth.js

  const auth = getAuth(app);

  // Auth state observer: if user isn't signed in, redirect to signup.html
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User is signed in:", user);
      document.getElementById('user-info').textContent = `Welcome, ${user.email}!`;
    } else {
      console.log("No user signed in, redirecting to signup page.");
      window.location.href = "signup.html";
    }
  });

  // Logout functionality
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      signOut(auth)
        .then(() => {
          console.log("User signed out.");
          window.location.href = "signup.html";
        })
        .catch((error) => {
          console.error("Error signing out:", error);
        });
    });
  }
</script>

