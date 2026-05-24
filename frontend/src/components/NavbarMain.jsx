import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import userAvatar from "../assests/detective.png";

export default function NavbarMain({ onToggleDrawer, onSearchChange }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const isAdmin = localStorage.getItem("adminRole") === "admin";

  const dropdownRef = useRef();
  const navigate = useNavigate();

  // Fetch user profile
  const fetchProfile = async () => {
    if (isAdmin) {
      setUserName("Admin");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/user/profile", {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });

      if (!res.ok) throw new Error("Failed to fetch name");
      const data = await res.json();
      setUserName(data.name);
    } catch (err) {
      setUserName("Unknown");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [isAdmin]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("adminRole");
    window.location.replace("/login");
  };

  const handleNavigate = (path) => {
    setShowDropdown(false);
    navigate(path);
  };

  return (
    <nav className="theme-nav relative z-10 flex justify-between items-center px-6 py-4 border-b shadow-md">
      {/* Left: Logo + Drawer */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onToggleDrawer && onToggleDrawer()}
          className="theme-title text-3xl focus:outline-none hover:opacity-80 transition"
        >
          ☰
        </button>
        <Link to={isAdmin ? "/admin-dashboard" : "/home"} className="flex items-center gap-2 theme-title hover:opacity-80 transition">
          <img
            src="/excelverse_logo.png"
            alt="ExcelVerse Logo"
            className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
          />
          <span className="text-2xl sm:text-4xl font-bold tracking-wide">ExcelVerse</span>
        </Link>
      </div>

      <div className="flex-1" />

      {/* Right: Avatar & Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <img
            src={userAvatar}
            alt="Avatar"
            className="w-10 h-10 rounded-full border-2 border-lime-400/70 shadow-md"
          />
          <span className="theme-subtitle font-medium hidden sm:inline">
            {loading ? "..." : userName}
          </span>
        </div>

        {showDropdown && (
          <div className="theme-card absolute right-0 mt-2 w-48 border rounded-md shadow-lg z-50">
            <ul className="theme-subtitle text-sm">
              {isAdmin ? (
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate("/admin-dashboard")}
                    className="block px-4 py-2 hover:bg-lime-700/40 transition"
                  >
                    🎛️ Admin Dashboard
                  </button>
                </li>
              ) : (
                <>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleNavigate("/profile")}
                      className="block px-4 py-2 hover:bg-lime-700/40 transition"
                    >
                      👤 View Profile
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleNavigate("/settings")}
                      className="block px-4 py-2 hover:bg-lime-700/40 transition"
                    >
                      ⚙️ Settings
                    </button>
                  </li>
                </>
              )}
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-lime-700/40 transition"
                >
                  🚪 Logout
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
