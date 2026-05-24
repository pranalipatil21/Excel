import React, { useState } from "react";
import NavbarMain from "../components/NavbarMain";
import SidebarDrawer from "../components/SidebarDrawer";
import Footer from "../components/Footer";
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
      <div className="theme-card mt-4 border rounded-lg p-4">
        <p className="theme-title text-sm font-semibold mb-3">Insight Visualization</p>
        <div className="h-64">
          <Bar
            data={{
              labels: [answerData.label],
              datasets: [{
                label: answerData.label,
                data: [answerData.value],
                backgroundColor: "#2f8f4ecc",
                borderColor: "#2f8f4e",
                borderWidth: 2,
                borderRadius: 8,
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  labels: {
                    color: "#2f3e2f",
                    font: {
                      weight: "600",
                    },
                  },
                },
                tooltip: {
                  backgroundColor: "rgba(255, 255, 255, 0.96)",
                  titleColor: "#1e2d1e",
                  bodyColor: "#49644d",
                },
              },
              scales: {
                x: {
                  ticks: {
                    color: "#49644d",
                  },
                  grid: {
                    color: "rgba(130, 148, 130, 0.2)",
                  },
                },
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: "#49644d",
                  },
                  grid: {
                    color: "rgba(130, 148, 130, 0.2)",
                  },
                }
              }
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="theme-page min-h-screen font-detective relative">
      <div className="absolute inset-0 theme-overlay z-0" />
      <NavbarMain onToggleDrawer={() => setIsDrawerOpen(true)} />
      <SidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="relative z-10 px-6 py-12 max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold theme-title mb-4 text-center">AI Insights</h2>

        {/* 🚀 How to Use AI Section */}
        <div className="theme-card border rounded-md p-4 mb-6">
          <h3 className="theme-title font-semibold mb-2 text-lg">How to use AI insights</h3>
          <ul className="list-disc list-inside theme-subtitle space-y-1 text-sm">
            <li>Upload your Excel file in the Upload section first.</li>
            <li>Type your question in natural language. Example: <em>"What is the highest sales?"</em></li>
            <li>The AI analyzes your data and responds with a chart.</li>
            <li>Supported question types include:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Highest / Maximum</li>
                <li>Lowest / Minimum</li>
                <li>Average / Mean</li>
                <li>Total / Sum</li>
              </ul>
            </li>
            <li>🔊 AI will also speak out the answer for better accessibility.</li>
            <li>Speech output is available for accessibility.</li>
            <li>You can review previous questions in the history section.</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="e.g., What is the highest value?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="theme-input flex-1 px-4 py-2 rounded-md"
          />
          <button onClick={handleAsk} className="theme-btn px-4 py-2 text-sm">Ask</button>
          <button onClick={handleReset} className="theme-btn px-4 py-2 text-sm">Reset</button>
        </div>

        <div className="flex gap-4 flex-wrap justify-center mb-6">
          <button onClick={handleSampleQuestion} className="theme-btn px-3 py-1 text-xs rounded font-semibold">
            Example: Highest?
          </button>
          <a href="/upload" className="theme-btn text-sm px-4 py-1">Upload</a>
          <a href="/charts" className="theme-btn text-sm px-4 py-1">Charts</a>
        </div>

        {answer && (
          <div className="theme-card border p-4 rounded-lg mb-4">
            <p className="theme-subtitle mb-2">{answer}</p>
            {renderBarChart()}
          </div>
        )}

        {history.length > 0 && (
          <div className="theme-card p-4 mt-6 rounded border">
            <h3 className="theme-title font-semibold mb-2">Question History</h3>
            {history.map((h, idx) => (
              <div key={idx} className="mb-2">
                <p className="theme-title text-sm">Q: {h.q}</p>
                <p className="theme-subtitle text-sm">A: {h.a}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

    </div>
  );
}
