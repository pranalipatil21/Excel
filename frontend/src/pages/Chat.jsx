import React, { useState } from "react";
import NavbarMain from "../components/NavbarMain";
import SidebarDrawer from "../components/SidebarDrawer";
import Footer from "../components/Footer";
import detectiveBg from "../assests/b.gif";

export default function Chat() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleAsk = () => {
    const lowerQ = question.toLowerCase();

    if (lowerQ.includes("highest") || lowerQ.includes("maximum") || lowerQ.includes("greatest")) {
      const data = JSON.parse(localStorage.getItem("excelData"));
      if (data && data.length > 0) {
        const keys = Object.keys(data[0]);
        const keyToCheck = keys[1]; // second column assumed to be numeric
        const labelKey = keys[0];   // first column as label

        const maxRow = data.reduce((prev, curr) =>
          parseFloat(curr[keyToCheck]) > parseFloat(prev[keyToCheck]) ? curr : prev
        );
        setAnswer(`🔍 Highest ${keyToCheck} is ${maxRow[keyToCheck]} (Label: ${maxRow[labelKey]})`);
      } else {
        setAnswer("⚠️ No data available. Please upload a file first.");
      }
    } else {
      setAnswer("🤖 I'm still learning. Try asking things like: 'What is the highest sales?'");
    }
  };

  const handleReset = () => {
    setQuestion("");
    setAnswer("");
  };

  const handleSampleQuestion = () => {
    setQuestion("What is the highest value?");
  };

  return (
    <div
      className="min-h-screen font-detective relative text-white"
      style={{
        backgroundImage: `url(${detectiveBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-0" />
      <NavbarMain onToggleDrawer={() => setIsDrawerOpen(true)} />
      <SidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="relative z-10 px-6 py-12 max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-lime-300 mb-6 text-center">🧠 Interrogate AI</h2>
        <p className="text-lime-100 mb-6 text-center">
          Ask questions about your uploaded Excel data.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="e.g., What is the highest value?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 px-4 py-2 rounded-md text-black"
          />
          <button onClick={handleAsk} className="btn-glow px-4 py-2 text-sm">Ask</button>
          <button onClick={handleReset} className="btn-glow bg-red-600 hover:bg-red-400 px-4 py-2 text-sm">Reset</button>
        </div>

        <div className="flex gap-4 flex-wrap justify-center mb-6">
          <button onClick={handleSampleQuestion} className="bg-lime-700 hover:bg-lime-500 text-black px-3 py-1 text-xs rounded font-semibold">
            💡 Example: Highest?
          </button>
          <a href="/upload" className="btn-glow text-sm px-4 py-1">📁 Upload</a>
          <a href="/charts" className="btn-glow text-sm px-4 py-1">📊 Charts</a>
        </div>

        {answer && (
          <div className="bg-black/60 border border-lime-400 p-4 rounded-lg">
            <p className="text-lime-200">{answer}</p>
          </div>
        )}
      </main>

      <Footer />

      <style>{`
        .btn-glow {
          background: linear-gradient(135deg, #84cc16, #3f6212);
          padding: 0.5rem 1.25rem;
          border-radius: 9999px;
          font-weight: 600;
          box-shadow: 0 0 15px rgba(132, 204, 22, 0.7);
          transition: all 0.3s ease-in-out;
          color: black;
        }
        .btn-glow:hover {
          transform: scale(1.05);
          box-shadow: 0 0 22px rgba(163, 230, 53, 0.8);
        }
        .font-detective {
          font-family: 'Courier New', Courier, monospace;
        }
      `}</style>
    </div>
  );
}
