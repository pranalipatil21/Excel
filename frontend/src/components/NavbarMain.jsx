import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import userAvatar from "../assests/detective.png";

export default function NavbarMain({ onToggleDrawer }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef();
  const navigate = useNavigate();

  // Fetch real user name from profile API
  const fetchProfile = async () => {
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
  }, []);

  // Close dropdown when clicked outside
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
    navigate("/login");
  };

  return (
    <nav className="relative z-10 flex justify-between items-center px-6 py-4 bg-black/70 border-b border-lime-400 shadow-md">
      {/* Left: Drawer Toggle + Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleDrawer}
          className="text-lime-300 text-3xl focus:outline-none hover:text-white transition"
        >
          ☰
        </button>
        <Link to="/home" className="flex items-center gap-2 text-lime-300 hover:text-white transition">
          <span className="text-2xl sm:text-3xl font-bold tracking-wide">🔍 ExcelVerse</span>
        </Link>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden sm:block flex-1 mx-6">
        <input
          type="text"
          placeholder="Search Case..."
          className="w-full p-2 bg-black/40 border border-lime-400 rounded placeholder-lime-300 text-lime-100 focus:outline-none"
        />
      </div>

      {/* Right: User Avatar & Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <img
            src={userAvatar}
            alt="Avatar"
            className="w-10 h-10 rounded-full border-2 border-lime-400 shadow-md"
          />
          <span className="text-lime-200 font-medium hidden sm:inline">
            {loading ? "..." : `Detective ${userName}`}
          </span>
        </div>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-black/90 border border-lime-400 rounded-md shadow-lg z-50">
            <ul className="text-lime-200 text-sm">
              <li>
                <Link
                  to="/profile"
                  className="block px-4 py-2 hover:bg-lime-700 transition"
                  onClick={() => setShowDropdown(false)}
                >
                  👤 View Profile
                </Link>
              </li>
              <li>
                <Link
                  to="/settings"
                  className="block px-4 py-2 hover:bg-lime-700 transition"
                  onClick={() => setShowDropdown(false)}
                >
                  ⚙️ Settings
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-lime-700 transition"
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
