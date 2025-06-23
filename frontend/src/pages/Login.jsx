import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import detectiveBg from "../assests/b.gif";
import Navbar from "../components/NavbarAuth";
import Footer from "../components/Footer";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.msg || "Invalid credentials");
        return;
      }

      localStorage.setItem("token", data.token);
      alert("Login Successful!");
      navigate("/home");
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong. Try again.");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col text-white relative font-detective"
      style={{
        backgroundImage: `url(${detectiveBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-0" />
      <Navbar />
      <div className="z-10 flex-grow flex items-center justify-center px-4 py-16">
        <div className="bg-black/50 border border-lime-400 p-10 rounded-xl shadow-xl w-full max-w-md relative z-10">
          <h2 className="text-3xl text-lime-300 font-bold mb-6 text-center">
            🕵️ Login to ExcelVerse
          </h2>

          <form className="flex flex-col space-y-5" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Detective ID (Email)"
              className="input-field"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Secret Passcode"
              className="input-field"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="detective-btn w-full">
              🔍 Enter Investigation Room
            </button>
          </form>

          <p className="text-lime-300 text-sm mt-6 text-center">
            New Investigator?{" "}
            <Link to="/register" className="underline hover:text-lime-100">
              Register Now
            </Link>
          </p>
        </div>
      </div>
      <Footer />

      <style>{`
        .input-field {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #84cc16;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          outline: none;
          color: white;
        }
        .input-field::placeholder {
          color: #d9f99d;
        }
        .input-field:focus {
          border-color: #a3e635;
          box-shadow: 0 0 10px #bef264;
        }
        .detective-btn {
          background: linear-gradient(135deg, #65a30d, #365314);
          padding: 0.75rem 1.5rem;
          border-radius: 9999px;
          font-weight: bold;
          box-shadow: 0 0 20px rgba(132, 204, 22, 0.6);
        }
        .detective-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 25px rgba(190, 242, 100, 0.9);
        }
        .font-detective {
          font-family: 'Courier New', Courier, monospace;
        }
      `}</style>
    </div>
  );
}
