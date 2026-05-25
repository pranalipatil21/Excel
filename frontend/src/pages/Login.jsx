import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/NavbarAuth";
import Footer from "../components/Footer";

const RAW_API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "").endsWith("/api")
  ? RAW_API_BASE.replace(/\/+$/, "")
  : `${RAW_API_BASE.replace(/\/+$/, "")}/api`;

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      let res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      let data = await res.json();

      // Fallback: if admin login via common endpoint fails, try dedicated admin endpoint.
      if (!res.ok && String(email).trim().toLowerCase() === "admin@excelverse.com") {
        const adminRes = await fetch(`${API_BASE}/auth/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const adminData = await adminRes.json();
        if (adminRes.ok) {
          res = adminRes;
          data = {
            token: adminData.token,
            user: {
              email: adminData?.admin?.email || email,
              role: "admin",
            },
          };
        }
      }

      if (!res.ok) {
        alert(data.msg || "Invalid credentials");
        return;
      }

      const role = data?.user?.role;
      const loginEmail = String(data?.user?.email || email).toLowerCase();

      if (role === "admin" || loginEmail === "admin@excelverse.com") {
        localStorage.removeItem("token");
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminEmail", loginEmail);
        localStorage.setItem("adminRole", "admin");
        alert("Admin Login Successful!");
        navigate("/admin-dashboard");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminEmail");
      localStorage.removeItem("adminRole");

      alert("Login Successful!");
      navigate("/home");
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong. Try again.");
    }
  };

  return (
    <div className="theme-page min-h-screen flex flex-col relative font-detective">
      <div className="absolute inset-0 theme-overlay z-0" />
      <Navbar />
      <div className="z-10 flex-grow flex items-center justify-center px-4 py-16">
        <div className="theme-card p-10 rounded-xl shadow-xl w-full max-w-md relative z-10 border">
          <h2 className="text-3xl theme-title font-bold mb-6 text-center">
            Login to ExcelVerse
          </h2>

          <form className="flex flex-col space-y-5" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              className="theme-input p-3"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Secret Passcode"
              className="theme-input p-3"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="theme-btn w-full py-3">
              🔍 Enter Investigation Room
            </button>
          </form>

          <p className="theme-subtitle text-sm mt-6 text-center">
            New Investigator?{" "}
            <Link to="/register" className="underline theme-link">
              Register Now
            </Link>
          </p>
        </div>
      </div>
      <Footer />

    </div>
  );
}
