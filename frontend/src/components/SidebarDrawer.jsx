import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function SidebarDrawer({ isOpen, onClose }) {
  const location = useLocation();

  const navItems = [
    { label: "Home", path: "/home" },
    { label: "Upload Clue", path: "/upload" },
    { label: "Analyze", path: "/charts" },
    { label: "History", path: "/history" },
    { label: "Ask AI", path: "/chat" },
    { label: "Profile", path: "/profile" },
    { label: "Settings", path: "/settings" },
  ];

  return (
    <>
      {/* Background Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sidebar Navigation"
        className={`fixed top-0 left-0 h-full w-64 bg-black/90 border-r border-lime-400 shadow-xl transform transition-transform duration-300 z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close Button */}
        <div className="flex justify-end p-4">
          <button
            onClick={onClose}
            className="text-lime-300 text-xl hover:text-white"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="p-6 text-lime-100">
          {/* Navigation */}
          <h2 className="text-lime-300 font-bold mb-4">Quick Access</h2>
          {navItems.map((item, i) => (
            <Link
              key={i}
              to={item.path}
              onClick={onClose}
              className={`block py-2 px-3 rounded transition ${
                location.pathname === item.path
                  ? "bg-lime-700 text-white"
                  : "hover:bg-lime-700"
              }`}
            >
              📌 {item.label}
            </Link>
          ))}

          {/* Quick Stats */}
          <div className="mt-6 border-t border-lime-500 pt-4 text-sm text-lime-300">
            <p>
              🕵️‍♂️ Cases Solved: <span className="text-white">12</span>
            </p>
            <p>
              📂 Files Analyzed: <span className="text-white">34</span>
            </p>
          </div>

          {/* Recent Activities */}
          <div className="mt-6 border-t border-lime-500 pt-4 text-sm">
            <h3 className="text-lime-300 font-semibold mb-2">Recent</h3>
            <ul className="space-y-1 text-lime-100">
              <li>🔍 Clue.xlsx scanned</li>
              <li>📊 Trend chart saved</li>
              <li>💾 Report created</li>
            </ul>
          </div>

          {/* Help Link */}
          <Link
            to="/help"
            className="block mt-6 text-center text-sm text-lime-400 underline hover:text-white"
            onClick={onClose}
          >
            ❓ Need Help?
          </Link>
        </div>
      </div>
    </>
  );
}
