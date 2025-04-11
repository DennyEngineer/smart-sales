import React, { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom"; // Import Link
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("buyer");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Authenticate the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Fetch the user's role from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnapshot = await getDoc(userDocRef);
  
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        const role = userData.role;
  
        // Redirect based on the user's role
        if (role === "admin") {
          navigate("/summary");
        } else if (role === "buyer") {
          navigate("/buyer");
        } else {
          alert("Unknown user role. Please contact support.");
        }
      } else {
        alert("User data not found. Please contact support.");
      }
    } catch (error) {
      console.error("Error logging in:", error.message);
      alert("Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#252836]">
      <div className="bg-[#1f1d2b] p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Smart Sales POS</h2>
        <form onSubmit={handleSubmit}>
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
          <div className="mb-4">
            <label className="block text-white mb-2">User Type</label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="w-full px-4 py-2 bg-[#252836] border border-[#ea7c69] rounded text-white focus:outline-none focus:border-[#ffffff]"
            >
              <option value="buyer">Buyer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-[#ea7c69] text-white py-2 rounded hover:bg-[#ffffff] hover:text-[#252836] transition duration-300"
          >
            Log In
          </button>
        </form>
        <p className="text-center mt-4 text-white">
          Don't have an account?{" "}
          <Link to="/register" className="text-[#ea7c69] hover:underline">
            Register as a Buyer
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;