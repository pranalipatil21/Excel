import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/NavbarAuth";
import Footer from "../components/Footer";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.msg || "Registration failed.");
        return;
      }

      localStorage.setItem("token", data.token);
      alert("Registration Successful!");
      navigate("/login");
    } catch (err) {
      console.error("Registration Error:", err);
      alert("Something went wrong. Try again.");
    }
  };

  return (
    <div className="theme-page min-h-screen flex flex-col relative font-detective">
      <div className="absolute inset-0 theme-overlay z-0" />
      <Navbar />
      <div className="z-10 flex-grow flex items-center justify-center px-4 py-16">
        <div className="theme-card p-10 rounded-xl shadow-2xl w-full max-w-md relative z-10 border">
          <h2 className="text-3xl theme-title font-bold mb-6 text-center">
            Create Account
          </h2>

          <form className="flex flex-col space-y-5" onSubmit={handleRegister}>
            <input
              name="name"
              type="text"
              placeholder="Full Name"
              className="theme-input p-3"
              required
              value={formData.name}
              onChange={handleChange}
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="theme-input p-3"
              required
              value={formData.email}
              onChange={handleChange}
            />
            <input
              name="password"
              type="password"
              placeholder="Secret Passcode"
              className="theme-input p-3"
              required
              value={formData.password}
              onChange={handleChange}
            />
            <button type="submit" className="theme-btn w-full py-3">
              Register
            </button>
          </form>

          <p className="theme-subtitle text-sm mt-6 text-center">
            Already enlisted?{" "}
            <Link to="/login" className="underline theme-link">
              Return to Login
            </Link>
          </p>
        </div>
      </div>
      <Footer />

    </div>
  );
}
