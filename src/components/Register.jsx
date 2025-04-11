import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Create a new user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Save the user's details in Firestore with the role "buyer"
      try {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          role: "buyer", // Automatically assign the buyer role
        });
        console.log("User data saved successfully!");
      } catch (firestoreError) {
        console.error("Error saving user data to Firestore:", firestoreError.message);
        alert("Failed to save user data. Please try again.");
        return; // Stop further execution
      }
  
      alert("Account created successfully! Please log in.");
      navigate("/"); // Redirect to the login page after registration
    } catch (authError) {
      console.error("Error registering user:", authError.message);
      alert("Failed to register. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#252836]">
      <div className="bg-[#1f1d2b] p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Register</h2>
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-white mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-[#252836] border border-[#ea7c69] rounded text-white focus:outline-none focus:border-[#ffffff]"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-white mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[#252836] border border-[#ea7c69] rounded text-white focus:outline-none focus:border-[#ffffff]"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#ea7c69] text-white py-2 rounded hover:bg-[#ffffff] hover:text-[#252836] transition duration-300"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;