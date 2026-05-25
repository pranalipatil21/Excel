// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import NavbarMain from "../components/NavbarMain";
import SidebarDrawer from "../components/SidebarDrawer";
import Footer from "../components/Footer";
import { API_BASE } from "../utils/apiBase";

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
      title: "Upload File",
      desc: "Start your analysis.",
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
      title: "Upload History",
      desc: "Review previous uploads.",
    },
    {
      to: "/chat",
      icon: "🧠",
      title: "Ask AI",
      desc: "Ask questions from your data.",
    },
  ];

  const filteredFeatures = features.filter(({ title, desc }) =>
    (title + desc).toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/user/profile`, {
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
    <div className="theme-page min-h-screen font-detective relative overflow-x-hidden">
      <div className="absolute inset-0 theme-overlay z-0" />

      <NavbarMain
        onToggleDrawer={() => setIsDrawerOpen(true)}
        onSearchChange={setSearchQuery}
      />
      <SidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="relative z-10 px-8 py-10">
        {/* Hero */}
        <section className="text-center mb-12">
          <h2 className="text-5xl font-bold theme-title animate-scan">
            {loading
              ? "Loading..."
              : error
              ? "Welcome"
              : `Welcome, ${userName}!`}
          </h2>
          <p className="theme-subtitle mt-3 mb-6 max-w-xl mx-auto">
            Transform spreadsheets into clear insights with a modern analytics workspace.
          </p>
          <Link to="/upload" className="theme-btn inline-block px-5 py-2">
            Start Analysis
          </Link>
        </section>

        {/* Features */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {filteredFeatures.map(({ to, icon, title, desc }, i) => (
            <Link
              key={i}
              to={to}
              className="theme-card group relative p-6 border rounded-lg shadow-xl transform hover:scale-105 transition overflow-hidden"
            >
              <span className="absolute -top-3 -right-3 bg-lime-500 h-8 w-8 flex items-center justify-center rounded-full text-black">
                {i + 1}
              </span>
              <div className="text-5xl mb-4 transition group-hover:scale-110">
                {icon}
              </div>
              <h4 className="text-xl font-bold theme-subtitle mb-2 group-hover:text-white">
                {title}
              </h4>
              <p className="theme-subtitle">{desc}</p>
            </Link>
          ))}
        </section>

        {/* Steps */}
        <section className="theme-card p-8 rounded-lg border max-w-3xl mx-auto mb-16">
          <h3 className="text-3xl theme-title font-bold mb-6 text-center">
            Process Steps
          </h3>
          <div className="flex flex-col md:flex-row justify-between gap-4 theme-subtitle text-sm">
            {["Upload Excel", "AI Analysis", "See Patterns", "Save Report"].map(
              (s, i) => (
                <div
                  key={i}
                  className="theme-card-strong flex-1 p-4 rounded-md text-center hover:bg-lime-900/40 transition"
                >
                  {`${i + 1}. ${s}`}
                </div>
              )
            )}
          </div>
        </section>

        {/* Why Us */}
        <section className="text-center max-w-4xl mx-auto">
          <h3 className="text-3xl theme-title font-bold mb-6">
            Why ExcelVerse?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {["Fast Analysis", "Unified Dashboard", "Save Reports"].map((text, i) => (
              <div
                key={i}
                className="theme-card p-4 rounded-lg border shadow-md"
              >
                <div className="text-4xl mb-2">
                  {["⚡", "🔍", "💾"][i]}
                </div>
                <p className="theme-subtitle">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }
        @keyframes scan {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}
