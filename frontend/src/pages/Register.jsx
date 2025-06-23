import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import bg from "../assests/b.gif";
import Navbar from "../components/NavbarAuth";
import Footer from "../components/Footer";

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
      const res = await fetch("http://localhost:5000/api/auth/register", {
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
    <div
      className="min-h-screen flex flex-col text-white relative font-detective"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-0" />
      <Navbar />
      <div className="z-10 flex-grow flex items-center justify-center px-4 py-16">
        <div className="bg-black/50 border border-lime-400 p-10 rounded-xl shadow-2xl w-full max-w-md relative z-10">
          <h2 className="text-3xl text-lime-300 font-bold mb-6 text-center">
            📜 Join ExcelVerse
          </h2>

          <form className="flex flex-col space-y-5" onSubmit={handleRegister}>
            <input
              name="name"
              type="text"
              placeholder="Detective Name"
              className="input-field"
              required
              value={formData.name}
              onChange={handleChange}
            />
            <input
              name="email"
              type="email"
              placeholder="Detective ID (Email)"
              className="input-field"
              required
              value={formData.email}
              onChange={handleChange}
            />
            <input
              name="password"
              type="password"
              placeholder="Secret Passcode"
              className="input-field"
              required
              value={formData.password}
              onChange={handleChange}
            />
            <button type="submit" className="detective-btn w-full">
              🕯️ Begin Investigation
            </button>
          </form>

          <p className="text-lime-300 text-sm mt-6 text-center">
            Already enlisted?{" "}
            <Link to="/login" className="underline hover:text-lime-100">
              Return to Login
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
