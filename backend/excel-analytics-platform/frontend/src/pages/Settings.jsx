import React from "react";
import NavbarMain from "../components/NavbarMain";
import SidebarDrawer from "../components/SidebarDrawer";
import Footer from "../components/Footer";
import { useState } from "react";

export default function Settings() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div
      className="min-h-screen text-white font-detective relative overflow-x-hidden"
      style={{
        backgroundImage: `url(/src/assests/b.gif)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-0" />

      {/* Navbar */}
      <NavbarMain onToggleDrawer={() => setIsDrawerOpen(true)} />

      {/* Sidebar Drawer */}
      <SidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Content */}
      <main className="relative z-10 px-6 py-10">
        <h2 className="text-4xl text-lime-300 font-bold text-center mb-10 animate-scan">
          ⚙️ Settings
        </h2>

        <div className="max-w-3xl mx-auto space-y-10">
          {/* Account Section */}
          <section className="bg-black/60 p-6 rounded-lg border border-lime-500 shadow-lg">
            <h3 className="text-2xl text-lime-200 font-semibold mb-4">👤 Account</h3>
            <div className="space-y-2 text-lime-100">
              <p><strong>Username:</strong> DetectiveAda</p>
              <p><strong>Email:</strong> ada@example.com</p>
              <button className="detective-btn mt-2">Change Password</button>
            </div>
          </section>

          {/* Preferences */}
          <section className="bg-black/60 p-6 rounded-lg border border-lime-500 shadow-lg">
            <h3 className="text-2xl text-lime-200 font-semibold mb-4">⚙️ Preferences</h3>
            <div className="flex flex-col gap-4 text-lime-100">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="accent-lime-500" />
                Enable auto-save reports
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="accent-lime-500" />
                Receive update emails
              </label>
            </div>
          </section>

          {/* Theme */}
          <section className="bg-black/60 p-6 rounded-lg border border-lime-500 shadow-lg">
            <h3 className="text-2xl text-lime-200 font-semibold mb-4">🎨 Theme</h3>
            <p className="text-lime-100 mb-2">Current: <strong>Dark Mode</strong></p>
            <button className="detective-btn">Switch to Light Mode</button>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Custom Styles */}
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
        .font-detective {
          font-family: 'Courier New', Courier, monospace;
        }
        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }
        @keyframes scan {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}
