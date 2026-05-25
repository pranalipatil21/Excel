import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavbarMain from "../components/NavbarMain";
import SidebarDrawer from "../components/SidebarDrawer";
import Footer from "../components/Footer";
import excelIcon from "../assests/excel-icon.png";
import { API_BASE } from "../utils/apiBase";

export default function History() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch history from MongoDB
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${API_BASE}/upload/history`);
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
    <div className="theme-page min-h-screen font-detective relative overflow-x-hidden">
      <div className="absolute inset-0 theme-overlay z-0" />
      <NavbarMain
        onToggleDrawer={() => setIsDrawerOpen(true)}
        onSearchChange={(query) => setSearchQuery(query)}
      />
      <SidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="relative z-10 px-6 py-12 max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-center theme-title mb-6 animate-typewriter">
          Upload History
        </h2>

        {filteredHistory.length === 0 ? (
          <p className="text-center theme-subtitle">No uploads found yet.</p>
        ) : (
          <ul className="space-y-4">
            {filteredHistory.map((entry, index) => (
              <li
                key={index}
                className="theme-card p-4 rounded-lg border flex justify-between items-center gap-4"
              >
                <div className="flex items-center gap-4">
                  <img src={excelIcon} alt="Excel" className="w-8 h-8" />
                  <div>
                    <p className="theme-subtitle font-semibold">{entry.originalName}</p>
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
          <Link to="/upload" className="underline theme-link block mb-2">
            ← Back to Upload
          </Link>
          <Link to="/charts" className="theme-btn inline-block text-sm px-4 py-2">
            Go to Charts
          </Link>
        </div>
      </main>

      <Footer />

      <style>{`
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
