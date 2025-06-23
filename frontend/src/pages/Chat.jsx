import React, { useState } from "react";
import NavbarMain from "../components/NavbarMain";
import SidebarDrawer from "../components/SidebarDrawer";
import Footer from "../components/Footer";
import detectiveBg from "../assests/b.gif";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function Chat() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerData, setAnswerData] = useState(null);
  const [history, setHistory] = useState([]);

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const handleAsk = () => {
    const lowerQ = question.toLowerCase();
    const data = JSON.parse(localStorage.getItem("excelData"));
    if (!data || data.length === 0) {
      setAnswer("⚠️ No data available. Please upload a file first.");
      setAnswerData(null);
      return;
    }

    const keys = Object.keys(data[0]);
    const mentionedKey = keys.find(k => lowerQ.includes(k.toLowerCase())) || keys[1];
    const labelKey = keys[0];

    let result = "";
    let chartValue = 0;

    if (lowerQ.includes("highest") || lowerQ.includes("maximum") || lowerQ.includes("greatest")) {
      const maxRow = data.reduce((prev, curr) =>
        parseFloat(curr[mentionedKey]) > parseFloat(prev[mentionedKey]) ? curr : prev
      );
      result = `🔍 Highest ${mentionedKey} is ${maxRow[mentionedKey]} (Label: ${maxRow[labelKey]})`;
      chartValue = maxRow[mentionedKey];
    } else if (lowerQ.includes("lowest") || lowerQ.includes("minimum") || lowerQ.includes("smallest")) {
      const minRow = data.reduce((prev, curr) =>
        parseFloat(curr[mentionedKey]) < parseFloat(prev[mentionedKey]) ? curr : prev
      );
      result = `📉 Lowest ${mentionedKey} is ${minRow[mentionedKey]} (Label: ${minRow[labelKey]})`;
      chartValue = minRow[mentionedKey];
    } else if (lowerQ.includes("average") || lowerQ.includes("mean")) {
      const sum = data.reduce((acc, curr) => acc + parseFloat(curr[mentionedKey]), 0);
      const avg = (sum / data.length).toFixed(2);
      result = `📊 Average ${mentionedKey} is ${avg}`;
      chartValue = avg;
    } else if (lowerQ.includes("sum") || lowerQ.includes("total")) {
      const total = data.reduce((acc, curr) => acc + parseFloat(curr[mentionedKey]), 0);
      result = `📈 Total ${mentionedKey} is ${total}`;
      chartValue = total;
    } else {
      result = "🤖 I'm still learning. Try asking: 'What is the highest sales?'";
    }

    setAnswer(result);
    setAnswerData({ label: mentionedKey, value: chartValue });
    speak(result);
    setHistory(prev => [...prev, { q: question, a: result }]);
  };

  const handleReset = () => {
    setQuestion("");
    setAnswer("");
    setAnswerData(null);
    setHistory([]);
  };

  const handleSampleQuestion = () => {
    setQuestion("What is the highest value?");
  };

  const renderBarChart = () => {
    if (!answerData) return null;
    return (
      <Bar
        data={{
          labels: [answerData.label],
          datasets: [{
            label: answerData.label,
            data: [answerData.value],
            backgroundColor: '#84cc16'
          }]
        }}
        options={{
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }}
      />
    );
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
        <h2 className="text-4xl font-bold text-lime-300 mb-4 text-center">🧠 Interrogate AI</h2>

        {/* 🚀 How to Use AI Section */}
        <div className="bg-black/60 border border-lime-500 rounded-md p-4 mb-6">
          <h3 className="text-lime-300 font-semibold mb-2 text-lg">🚀 How to Use the AI Feature</h3>
          <ul className="list-disc list-inside text-lime-100 space-y-1 text-sm">
            <li>📁 Upload your Excel file in the <strong>Upload</strong> section first.</li>
            <li>🤔 Then, type your question in natural language. For example: <em>"What is the highest sales?"</em></li>
            <li>🧠 The AI will analyze your data and give you the answer with a chart!</li>
            <li>✅ Supported question types include:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Highest / Maximum</li>
                <li>Lowest / Minimum</li>
                <li>Average / Mean</li>
                <li>Total / Sum</li>
              </ul>
            </li>
            <li>🔊 AI will also speak out the answer for better accessibility.</li>
            <li>📜 You can review all your previous questions in the history section.</li>
          </ul>
        </div>

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
          <div className="bg-black/60 border border-lime-400 p-4 rounded-lg mb-4">
            <p className="text-lime-200 mb-2">{answer}</p>
            {renderBarChart()}
          </div>
        )}

        {history.length > 0 && (
          <div className="bg-black/50 p-4 mt-6 rounded">
            <h3 className="text-lime-300 font-semibold mb-2">📜 Question History</h3>
            {history.map((h, idx) => (
              <div key={idx} className="mb-2">
                <p className="text-lime-400 text-sm">Q: {h.q}</p>
                <p className="text-white text-sm">A: {h.a}</p>
              </div>
            ))}
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
