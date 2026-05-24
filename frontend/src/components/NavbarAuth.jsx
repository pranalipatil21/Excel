import React from "react";
import { Link } from "react-router-dom";
import avatar from "../assests/detective.png";

export default function NavbarAuth() {
  return (
    <nav className="theme-nav w-full z-50 relative flex items-center justify-between px-6 py-4 border-b shadow-md">
      {/* Logo */}
      <Link to="/" className="theme-title text-2xl font-bold tracking-wider">
        🕵️ ExcelVerse
      </Link>

      {/* Avatar Only (No nav links) */}
      <div className="theme-card flex items-center gap-2 px-3 py-1 rounded-full border">
        <img
          src={avatar}
          alt="User"
          className="w-8 h-8 rounded-full border border-lime-400"
        />
        <span className="text-sm theme-subtitle">User</span>
      </div>
    </nav>
  );
}
