// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxnwQvml_WusESRagLx4KZuLFvqjAGQsw",
  authDomain: "smart-sales-fb0fc.firebaseapp.com",
  projectId: "smart-sales-fb0fc",
  storageBucket: "smart-sales-fb0fc.firebasestorage.app",
  messagingSenderId: "605722646357",
  appId: "1:605722646357:web:4056585bd688c8e0c041dc",
  measurementId: "G-XFTN7V5P0Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Export the services you need
export { auth, db};  // Add any other services you need to export