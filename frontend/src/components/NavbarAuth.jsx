import React from "react";
import { Link } from "react-router-dom";
import avatar from "../assests/detective.png"; // detective avatar image

export default function NavbarAuth() {
  return (
    <nav className="w-full z-50 relative flex items-center justify-between px-6 py-4 bg-black/70 border-b border-lime-400 shadow-md">
      {/* Logo */}
      <Link to="/" className="text-lime-300 text-2xl font-bold tracking-wider">
        🕵️ ExcelVerse
      </Link>

      {/* Avatar Only (No nav links) */}
      <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full border border-lime-300">
        <img
          src={avatar}
          alt="Detective"
          className="w-8 h-8 rounded-full border border-lime-400"
        />
        <span className="text-sm text-lime-200">Detective007</span>
      </div>
    </nav>
  );
}
