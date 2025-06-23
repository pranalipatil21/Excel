// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import detectiveBg from "../assests/b.gif";
import magnifier from "../assests/detective.png";
import NavbarMain from "../components/NavbarMain";
import SidebarDrawer from "../components/SidebarDrawer";
import Footer from "../components/Footer";

export default function Home() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const features = [
    {
      to: "/upload",
      icon: "🧾",
      title: "Upload Clue",
      desc: "Start your investigation.",
    },
    {
      to: "/charts",
      icon: "📊",
      title: "Analyze Patterns",
      desc: "Reveal trends and spikes.",
    },
    {
      to: "/history",
      icon: "📁",
      title: "Case History",
      desc: "Review past investigations.",
    },
    {
      to: "/chat",
      icon: "🧠",
      title: "Interrogate AI",
      desc: "Ask the data detective.",
    },
  ];

  const filteredFeatures = features.filter(({ title, desc }) =>
    (title + desc).toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/user/profile", {
          method: "GET",
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.msg || "Failed to fetch profile");
        }

        const data = await res.json();
        setUserName(data.name);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div
      className="min-h-screen text-white font-detective relative overflow-x-hidden"
      style={{
        backgroundImage: `url(${detectiveBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-0" />

      <NavbarMain
        onToggleDrawer={() => setIsDrawerOpen(true)}
        onSearchChange={setSearchQuery}
      />
      <SidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="relative z-10 px-8 py-10">
        {/* Hero */}
        <section className="text-center mb-12">
          <h2 className="text-5xl font-bold text-lime-300 animate-scan">
            {loading
              ? "Loading..."
              : error
              ? "Welcome, Detective!"
              : `Welcome, Detective ${userName}!`}
          </h2>
          <p className="text-lime-100 mt-3 mb-6 max-w-xl mx-auto">
            Dive into your Excel files like never before—ExcelVerse reveals the hidden truths.
          </p>
          <Link to="/upload" className="detective-btn inline-block">
            Start Investigation
          </Link>
          <img
            src={magnifier}
            alt="Detective tool"
            className="mx-auto w-44 h-auto mt-10 animate-scan"
          />
        </section>

        {/* Features */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {filteredFeatures.map(({ to, icon, title, desc }, i) => (
            <Link
              key={i}
              to={to}
              className="group relative p-6 bg-black/60 border border-lime-500 rounded-lg shadow-xl transform hover:scale-105 transition overflow-hidden"
            >
              <span className="absolute -top-3 -right-3 bg-lime-500 h-8 w-8 flex items-center justify-center rounded-full text-black">
                {i + 1}
              </span>
              <div className="text-5xl mb-4 transition group-hover:scale-110">
                {icon}
              </div>
              <h4 className="text-xl font-bold text-lime-200 mb-2 group-hover:text-white">
                {title}
              </h4>
              <p className="text-lime-100">{desc}</p>
            </Link>
          ))}
        </section>

        {/* Steps */}
        <section className="bg-black/40 p-8 rounded-lg border border-lime-500 max-w-3xl mx-auto mb-16">
          <h3 className="text-3xl text-lime-300 font-bold mb-6 text-center">
            🧭 Investigation Steps
          </h3>
          <div className="flex flex-col md:flex-row justify-between gap-4 text-lime-100 text-sm">
            {["Upload Excel", "AI Analysis", "See Patterns", "Save Report"].map(
              (s, i) => (
                <div
                  key={i}
                  className="flex-1 bg-black/70 p-4 rounded-md text-center hover:bg-lime-900 transition"
                >
                  {`${i + 1}. ${s}`}
                </div>
              )
            )}
          </div>
        </section>

        {/* Why Us */}
        <section className="text-center max-w-4xl mx-auto">
          <h3 className="text-3xl text-lime-300 font-bold mb-6">
            💡 Why ExcelVerse?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {["Fast Analysis", "Detective Dashboard", "Case Save"].map((text, i) => (
              <div
                key={i}
                className="bg-black/60 p-4 rounded-lg border border-lime-500 shadow-md"
              >
                <div className="text-4xl mb-2">
                  {["⚡", "🔍", "💾"][i]}
                </div>
                <p className="text-lime-100">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        .detective-btn {
          background: linear-gradient(135deg, #84cc16, #3f6212);
          padding: 0.5rem 1.25rem;
          border-radius: 9999px;
          font-weight: 600;
          box-shadow: 0 0 12px rgba(132, 204, 22, 0.6);
          transition: all 0.3s ease-in-out;
        }
        .detective-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 0 22px rgba(163, 230, 53, 0.8);
        }
        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }
        @keyframes scan {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        .font-detective {
          font-family: 'Courier New', Courier, monospace;
        }
      `}</style>
    </div>
  );
}
