import React from "react";
import { useNavigate } from "react-router-dom";

export default function Gate() {
  const navigate = useNavigate();

  const handleBegin = () => {
    navigate("/login"); 
  };

  return (
    <div className="theme-page min-h-screen flex items-center justify-center relative font-detective">
      <div className="absolute inset-0 theme-overlay z-0" />

     
      <div className="z-10 text-center px-6 max-w-3xl">
        <h1 className="text-6xl font-black theme-title animate-scan tracking-wider">
          ExcelVerse
        </h1>
        <p className="theme-subtitle mt-4 text-lg md:text-xl max-w-2xl mx-auto">
          Analyze spreadsheet data with clear visuals, fast insights, and a clean professional experience.
        </p>
        <button
          onClick={handleBegin}
          className="mt-8 theme-btn px-10 py-3 text-lg inline-block"
        >
          Explore Platform
        </button>
      </div>

   
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0); }
        }

        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse 6s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
