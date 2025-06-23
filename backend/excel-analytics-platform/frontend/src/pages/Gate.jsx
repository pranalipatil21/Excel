import React from "react";
import { useNavigate } from "react-router-dom";
import gateBg from "../assests/b.gif"; 

export default function Gate() {
  const navigate = useNavigate();

  const handleBegin = () => {
    navigate("/login"); 
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative text-white font-detective"
      style={{
        backgroundImage: `url(${gateBg})`,
        backgroundSize: "cover",  
        backgroundPosition: "center",
      }}
    >
      
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0" />

     
      <div className="z-10 text-center px-6 max-w-3xl">
        <h1 className="text-6xl font-black text-lime-300 animate-scan tracking-wider">
          🕵️ ExcelVerse
        </h1>
        <p className="text-lime-100 mt-4 text-lg md:text-xl max-w-2xl mx-auto">
          Step through the shadows, where every spreadsheet holds a secret. Become the detective of data.
        </p>
        <button
          onClick={handleBegin}
          className="mt-8 detective-btn px-10 py-3 text-lg inline-block"
        >
          🔎 Explore Data Cases!
        </button>
      </div>

      
      <div className="absolute top-24 right-12 w-24 h-24 bg-lime-400 rounded-full opacity-10 animate-pulse-slow blur-2xl"></div>
      <div className="absolute bottom-24 left-16 w-32 h-32 bg-lime-600 rounded-full opacity-10 animate-pulse-slow blur-2xl"></div>

   
      <style>{`
        .detective-btn {
          background: linear-gradient(135deg, #84cc16, #3f6212);
          border-radius: 9999px;
          color: white;
          font-weight: bold;
          box-shadow: 0 0 20px rgba(163, 230, 53, 0.5);
          transition: all 0.3s ease-in-out;
        }
        .detective-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 0 30px rgba(190, 255, 50, 0.7);
        }

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

        .font-detective {
          font-family: 'Courier New', Courier, monospace;
        }
      `}</style>
    </div>
  );
}
