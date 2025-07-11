import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavbarMain from "../components/NavbarMain";
import SidebarDrawer from "../components/SidebarDrawer";
import Footer from "../components/Footer";
import detectiveBg from "../assests/b.gif";
import excelIcon from "../assests/excel-icon.png";

export default function History() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch history from MongoDB
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/upload/history");
        const data = await response.json();
        setHistory(data);
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };

    fetchHistory();
  }, []);

  // Filter history based on search input
  const filteredHistory = history.filter((entry) =>
    entry.originalName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="min-h-screen text-green-200 font-detective relative overflow-x-hidden"
      style={{
        backgroundImage: `url(${detectiveBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-0" />
      <NavbarMain
        onToggleDrawer={() => setIsDrawerOpen(true)}
        onSearchChange={(query) => setSearchQuery(query)}
      />
      <SidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="relative z-10 px-6 py-12 max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-lime-400 mb-6 animate-typewriter">
          📁 Upload History
        </h2>

        {filteredHistory.length === 0 ? (
          <p className="text-center text-lime-200">No uploads found yet.</p>
        ) : (
          <ul className="space-y-4">
            {filteredHistory.map((entry, index) => (
              <li
                key={index}
                className="bg-black/60 p-4 rounded-lg border border-lime-500 flex justify-between items-center gap-4"
              >
                <div className="flex items-center gap-4">
                  <img src={excelIcon} alt="Excel" className="w-8 h-8" />
                  <div>
                    <p className="text-lime-100 font-semibold">{entry.originalName}</p>
                    <p className="text-gray-300 text-sm">{(entry.size / 1024).toFixed(2)} KB</p>
                    <p className="text-gray-400 text-xs">
                      Uploaded on: {new Date(entry.uploadDate).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {entry.url ? (
                    <a
                      href={entry.url}
                      download
                      className="text-xs bg-lime-600 text-black font-semibold px-3 py-1 rounded hover:bg-lime-400 transition"
                    >
                      ⬇️ Download
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No URL</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="text-center mt-10">
          <Link to="/upload" className="underline hover:text-lime-300 block mb-2">
            ← Back to Upload
          </Link>
          <Link to="/charts" className="btn-glow inline-block text-sm">
            📊 Go to Charts
          </Link>
        </div>
      </main>

      <Footer />

      <style>{`
        .font-detective {
          font-family: 'Courier New', Courier, monospace;
        }
        .btn-glow {
          background: linear-gradient(135deg, #84cc16, #3f6212);
          padding: 0.5rem 1.25rem;
          border-radius: 9999px;
          font-weight: 600;
          box-shadow: 0 0 15px rgba(132, 204, 22, 0.7);
          transition: all 0.3s ease-in-out;
        }
        .btn-glow:hover {
          transform: scale(1.05);
          box-shadow: 0 0 22px rgba(163, 230, 53, 0.8);
        }
        .animate-typewriter {
          overflow: hidden;
          border-right: .15em solid lime;
          white-space: nowrap;
          animation:
            typing 3s steps(40, end),
            blink-caret .75s step-end infinite;
        }
        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }
        @keyframes blink-caret {
          from, to { border-color: transparent }
          50% { border-color: lime }
        }
      `}</style>
    </div>
  );
}
