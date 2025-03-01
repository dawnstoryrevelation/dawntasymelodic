// Import Firestore functions and your Firebase app instance
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { app } from "./auth.js";  // using your existing Firebase app

// Initialize Firestore
const db = getFirestore(app);

// Function to write a test chat message
export async function writeTestChat() {
  try {
    const docRef = await addDoc(collection(db, "chats"), {
      userId: "testuser@example.com", // Replace later with the actual user's ID
      messages: ["Hello, this is a test chat message!"],
      timestamp: serverTimestamp()
    });
    console.log("Test chat written with ID: ", docRef.id);
    alert("Test chat message saved!");
  } catch (e) {
    console.error("Error adding test chat: ", e);
    alert("Failed to save test chat: " + e.message);
  }
}

// Attach function to the window so you can call it from HTML
window.writeTestChat = writeTestChat;
