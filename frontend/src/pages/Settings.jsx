import React from "react";
import NavbarMain from "../components/NavbarMain";
import SidebarDrawer from "../components/SidebarDrawer";
import Footer from "../components/Footer";
import { useState } from "react";

export default function Settings() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="theme-page min-h-screen font-detective relative overflow-x-hidden">
      {/* Overlay */}
      <div className="absolute inset-0 theme-overlay z-0" />

      {/* Navbar */}
      <NavbarMain onToggleDrawer={() => setIsDrawerOpen(true)} />

      {/* Sidebar Drawer */}
      <SidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Content */}
      <main className="relative z-10 px-6 py-10">
        <h2 className="text-4xl theme-title font-bold text-center mb-10 animate-scan">
          Settings
        </h2>

        <div className="max-w-3xl mx-auto space-y-10">
          {/* Account Section */}
          <section className="theme-card p-6 rounded-lg border shadow-lg">
            <h3 className="text-2xl theme-subtitle font-semibold mb-4">Account</h3>
            <div className="space-y-2 theme-subtitle">
              <p><strong>Username:</strong> User</p>
              <p><strong>Email:</strong> ada@example.com</p>
              <button className="theme-btn mt-2 px-5 py-2">Change Password</button>
            </div>
          </section>

          {/* Preferences */}
          <section className="theme-card p-6 rounded-lg border shadow-lg">
            <h3 className="text-2xl theme-subtitle font-semibold mb-4">Preferences</h3>
            <div className="flex flex-col gap-4 theme-subtitle">
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
          <section className="theme-card p-6 rounded-lg border shadow-lg">
            <h3 className="text-2xl theme-subtitle font-semibold mb-4">Theme</h3>
            <p className="theme-subtitle mb-2">Current: <strong>Formal Light</strong></p>
            <p className="theme-muted text-sm">White background with green accents is enabled across the application.</p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Custom Styles */}
      <style>{`
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
