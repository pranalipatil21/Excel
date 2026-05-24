import React, { useState } from "react";
import axios from "axios";

/**
 * AI Insights Panel Component
 * Shows:
 * - Chart explanations in simple language
 * - Insights auto-summarized from data
 * - Month-to-month comparisons
 */
const AIInsightsPanel = ({ chartData = null, tableData = null, uploadId = null }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("summary"); // summary, comparison, explain, dependency

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  /**
   * Generate auto-summary from data
   */
  const generateAutoSummary = async () => {
    try {
      setActiveTab("summary");
      setLoading(true);

      const response = await axios.post(`${API_BASE}/dashboard/insights/analyze`, {
        data: tableData || [],
        context:
          "Provide detailed excel overview, graph guidance, dependency explanation and actionable recommendations.",
      }).catch((error) => {
        // If request fails, throw with better message
        throw new Error(error.response?.data?.msg || error.message);
      });

      setInsights([
        {
          id: Date.now(),
          type: "summary",
          content: response.data.insight,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...insights,
      ]);
    } catch (error) {
      console.error("Error generating insight:", error);
      setInsights([
        {
          id: Date.now(),
          type: "error",
          content: "Failed to generate insight. Please try again.",
          timestamp: new Date().toLocaleTimeString(),
        },
        ...insights,
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Explain the current chart
   */
  const explainCurrentChart = async () => {
    if (!chartData) {
      setInsights([
        {
          id: Date.now(),
          type: "error",
          content: "No chart selected. Please select a chart to explain.",
          timestamp: new Date().toLocaleTimeString(),
        },
        ...insights,
      ]);
      return;
    }

    try {
      setActiveTab("explain");
      setLoading(true);

      const response = await axios.post(`${API_BASE}/dashboard/insights/explain-chart`, {
        chartData: {
          type: chartData.type || "bar",
          title: chartData.title || "Chart",
          labels: chartData.labels || [],
          description: chartData.description || "",
        },
      }).catch((error) => {
        throw new Error(error.response?.data?.msg || error.message);
      });

      setInsights([
        {
          id: Date.now(),
          type: "explanation",
          content: response.data.explanation,
          timestamp: new Date().toLocaleTimeString(),
          chartTitle: chartData.title,
        },
        ...insights,
      ]);
    } catch (error) {
      console.error("Error explaining chart:", error);
      setInsights([
        {
          id: Date.now(),
          type: "error",
          content: "Failed to explain chart. Please try again.",
          timestamp: new Date().toLocaleTimeString(),
        },
        ...insights,
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Compare data from two time periods (auto-detect numeric columns)
   */
  const compareTimeperiods = async () => {
    if (!tableData || tableData.length < 2) {
      setInsights([
        {
          id: Date.now(),
          type: "error",
          content: "Need at least 2 data points to compare.",
          timestamp: new Date().toLocaleTimeString(),
        },
        ...insights,
      ]);
      return;
    }

    try {
      setActiveTab("comparison");
      setLoading(true);

      // Auto-detect numeric columns
      const numericColumns = Object.keys(tableData[0]).filter((key) => {
        const values = tableData.map((row) => {
          const val = row[key];
          return typeof val === "number" ? val : parseFloat(val);
        });
        return values.some((v) => !isNaN(v));
      });

      if (numericColumns.length === 0) {
        throw new Error("No numeric columns found to compare");
      }

      // Split data into two halves (current vs previous period)
      const midpoint = Math.floor(tableData.length / 2);
      const previousData = tableData.slice(0, midpoint);
      const currentData = tableData.slice(midpoint);

      const response = await axios.post(`${API_BASE}/dashboard/insights/compare`, {
        currentData,
        previousData,
        metricName: numericColumns[0] || "Primary Metric",
      }).catch((error) => {
        throw new Error(error.response?.data?.msg || error.message);
      });

      setInsights([
        {
          id: Date.now(),
          type: "comparison",
          content: response.data.comparison.comparison,
          changePercent: response.data.comparison.changePercent,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...insights,
      ]);
    } catch (error) {
      console.error("Error comparing periods:", error);
      setInsights([
        {
          id: Date.now(),
          type: "error",
          content: `Comparison failed: ${error.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...insights,
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Explain dependencies between fields in dataset
   */
  const explainDependencies = async () => {
    if (!tableData || tableData.length === 0) {
      setInsights([
        {
          id: Date.now(),
          type: "error",
          content: "Upload data first to analyze dependencies.",
          timestamp: new Date().toLocaleTimeString(),
        },
        ...insights,
      ]);
      return;
    }

    try {
      setActiveTab("dependency");
      setLoading(true);

      const firstRow = tableData[0] || {};
      const numericMetric = Object.keys(firstRow).find((key) => {
        const value = firstRow[key];
        return Number.isFinite(typeof value === "number" ? value : parseFloat(value));
      });

      const response = await axios.post(`${API_BASE}/dashboard/insights/dependencies`, {
        data: tableData,
        focusMetric: numericMetric || "",
      }).catch((error) => {
        throw new Error(error.response?.data?.msg || error.message);
      });

      setInsights([
        {
          id: Date.now(),
          type: "dependency",
          content: response.data.dependencies,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...insights,
      ]);
    } catch (error) {
      console.error("Error explaining dependencies:", error);
      setInsights([
        {
          id: Date.now(),
          type: "error",
          content: `Dependency analysis failed: ${error.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...insights,
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear all insights
   */
  const clearInsights = () => {
    setInsights([]);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 rounded-t-lg">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>🤖</span> AI Insights Panel
        </h3>
        <p className="text-emerald-50 text-sm mt-1">Get smart analysis & insights from your data</p>
      </div>

      {/* Control Tabs */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={generateAutoSummary}
            disabled={loading || !tableData || tableData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition"
          >
            <span>📊</span> {loading && activeTab === "summary" ? "Analyzing..." : "Auto-Summary"}
          </button>

          <button
            onClick={explainCurrentChart}
            disabled={loading || !chartData}
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition"
          >
            <span>📈</span> {loading && activeTab === "explain" ? "Explaining..." : "Explain Chart"}
          </button>

          <button
            onClick={compareTimeperiods}
            disabled={loading || !tableData || tableData.length < 2}
            className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition"
          >
            <span>📅</span> {loading && activeTab === "comparison" ? "Comparing..." : "Compare Periods"}
          </button>

          <button
            onClick={explainDependencies}
            disabled={loading || !tableData || tableData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition"
          >
            <span>🔗</span> {loading && activeTab === "dependency" ? "Analyzing..." : "Dependencies"}
          </button>

          {insights.length > 0 && (
            <button
              onClick={clearInsights}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium transition"
            >
              <span>🗑️</span> Clear
            </button>
          )}
        </div>
      </div>

      {/* Insights Display */}
      <div className="p-4 max-h-96 overflow-y-auto bg-gray-50">
        {insights.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-2xl mb-2">💡</p>
            <p className="text-sm">Click a button above to generate insights</p>
            <p className="text-xs mt-2 text-gray-300">Insights will appear here instantly</p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={`p-3 rounded-lg border-l-4 ${
                  insight.type === "error"
                    ? "bg-red-50 border-red-400 text-red-700"
                    : insight.type === "comparison"
                    ? "bg-orange-50 border-orange-400 text-orange-900"
                      : insight.type === "dependency"
                      ? "bg-emerald-50 border-emerald-400 text-emerald-900"
                    : insight.type === "explanation"
                    ? "bg-purple-50 border-purple-400 text-purple-900"
                    : "bg-blue-50 border-blue-400 text-blue-900"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-xs">
                    {insight.type === "error"
                      ? "⚠️ Error"
                      : insight.type === "comparison"
                      ? "📅 Comparison"
                      : insight.type === "dependency"
                      ? "🔗 Dependency Analysis"
                      : insight.type === "explanation"
                      ? `📈 ${insight.chartTitle}`
                      : "📊 Summary"}
                  </span>
                  <span className="text-xs opacity-70">{insight.timestamp}</span>
                </div>
                <p className="text-sm leading-relaxed">{insight.content}</p>
                {insight.changePercent !== undefined && (
                  <p className="text-xs mt-2 font-semibold">
                    Change: <span className={insight.changePercent > 0 ? "text-green-600" : "text-red-600"}>
                      {insight.changePercent > 0 ? "+" : ""}{insight.changePercent}%
                    </span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-b-lg text-xs text-gray-500">
        <p>{insights.length} insight{insights.length !== 1 ? "s" : ""} generated</p>
      </div>
    </div>
  );
};

export default AIInsightsPanel;
