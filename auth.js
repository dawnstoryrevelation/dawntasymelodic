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


// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
