import React, { useState } from "react";
import { Bar, Line, Pie, Radar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
  Legend
);

/**
 * Dashboard Builder Component
 * Allows users to:
 * - Create/edit dashboard layouts
 * - Drag and drop widgets
 * - Configure widget settings with actual Excel columns
 * - Live chart preview
 * - Save layouts
 */
const DashboardBuilder = ({ uploadId, availableColumns = [], tableData = [], onSave = null, initialDashboard = null }) => {
  const [dashboardName, setDashboardName] = useState(initialDashboard?.name || "My Dashboard");
  const [dashboardDescription, setDashboardDescription] = useState(initialDashboard?.description || "");
  const [widgets, setWidgets] = useState(initialDashboard?.widgets || []);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [draggedWidget, setDraggedWidget] = useState(null);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);

  // Available widget types
  const WIDGET_TYPES = [
    { id: "bar", label: "Bar Chart", icon: "📊", color: "bg-blue-100 text-blue-700" },
    { id: "line", label: "Line Chart", icon: "📈", color: "bg-green-100 text-green-700" },
    { id: "pie", label: "Pie Chart", icon: "🥧", color: "bg-orange-100 text-orange-700" },
    { id: "doughnut", label: "Doughnut Chart", icon: "🍩", color: "bg-pink-100 text-pink-700" },
    { id: "table", label: "Data Table", icon: "📋", color: "bg-purple-100 text-purple-700" },
    { id: "kpi", label: "KPI Card", icon: "🎯", color: "bg-red-100 text-red-700" },
    { id: "radar", label: "Radar Chart", icon: "🎲", color: "bg-indigo-100 text-indigo-700" },
  ];

  /**
   * Add a new widget to dashboard
   */
  const addWidget = (type) => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      type,
      title: `${WIDGET_TYPES.find((w) => w.id === type)?.label} Widget`,
      config: {},
      position: {
        x: (widgets.length % 4) * 3,
        y: Math.floor(widgets.length / 4) * 2,
        w: 3,
        h: 2,
      },
      dataSource: {},
    };

    setWidgets([...widgets, newWidget]);
    setShowWidgetLibrary(false);
  };

  /**
   * Update widget position during drag
   */
  const handleWidgetDragStart = (e, widgetId) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleWidgetDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleWidgetDrop = (e, newX, newY) => {
    e.preventDefault();
    if (!draggedWidget) return;

    setWidgets((prevWidgets) =>
      prevWidgets.map((w) =>
        w.id === draggedWidget ? { ...w, position: { ...w.position, x: newX, y: newY } } : w
      )
    );

    setDraggedWidget(null);
  };

  /**
   * Update widget properties
   */
  const updateWidget = (widgetId, updates) => {
    setWidgets((prevWidgets) =>
      prevWidgets.map((w) => (w.id === widgetId ? { ...w, ...updates } : w))
    );
  };

  /**
   * Remove widget
   */
  const removeWidget = (widgetId) => {
    setWidgets((prevWidgets) => prevWidgets.filter((w) => w.id !== widgetId));
    setSelectedWidget(null);
  };

  /**
   * Generate chart data from selected columns
   */
  const generateChartData = (widget) => {
    if (!widget.dataSource?.xAxis || !widget.dataSource?.yAxis || tableData.length === 0) {
      return null;
    }

    const xCol = widget.dataSource.xAxis;
    const yCol = widget.dataSource.yAxis;

    // Parse row range (e.g., "1-50")
    let displayData = tableData;
    if (widget.dataSource.rowRange) {
      const [start, end] = widget.dataSource.rowRange.split("-").map((s) => parseInt(s.trim()));
      if (!isNaN(start)) {
        displayData = tableData.slice(start - 1, end || tableData.length);
      }
    }

    const labels = displayData.map((row) => String(row[xCol] || "")).slice(0, 20); // Limit to 20 data points
    const values = displayData.map((row) => {
      const val = parseFloat(row[yCol]);
      return isNaN(val) ? 0 : val;
    }).slice(0, 20);

    

    return {
      labels,
      datasets: [
        {
          label: yCol,
          data: values,
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderColor: "#3b82f6",
          borderWidth: 2,
          fill: widget.type === "line" ? false : true,
          tension: widget.type === "line" ? 0.4 : 0,
        },
      ],
    };
  };

  /**
   * Generate pie chart data
   */
  const generatePieChartData = (widget) => {
    if (!widget.dataSource?.yAxis || tableData.length === 0) {
      return null;
    }

    const yCol = widget.dataSource.yAxis;
    const values = tableData.map((row) => {
      const val = parseFloat(row[yCol]);
      return isNaN(val) ? 0 : val;
    }).slice(0, 10);

    

    return {
      labels: tableData.slice(0, 10).map((_, i) => `Item ${i + 1}`),
      datasets: [
        {
          label: yCol,
          data: values,
          backgroundColor: colors.slice(0, values.length),
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    };
  };

  /**
   * Generate KPI card content
   */
  const generateKPIContent = (widget) => {
    if (!widget.dataSource?.valueColumn || tableData.length === 0) {
      return null;
    }

    const values = tableData
      .map((row) => parseFloat(row[widget.dataSource.valueColumn]))
      .filter((v) => !isNaN(v));

    if (values.length === 0) return null;

    const total = values.reduce((a, b) => a + b, 0);
    const average = (total / values.length).toFixed(2);
    const max = Math.max(...values);
    const min = Math.min(...values);

    return { total, average, max, min, count: values.length };
  };

  /**
   * Generate table preview data
   */
  const generateTableData = (widget) => {
    let displayData = tableData;

    if (widget.dataSource?.rowRange) {
      const [start, end] = widget.dataSource.rowRange.split("-").map((s) => parseInt(s.trim()));
      if (!isNaN(start)) {
        displayData = tableData.slice(start - 1, end || tableData.length);
      }
    }

    return displayData.slice(0, 10); // Show first 10 rows
  };

  /**
   * Render widget preview
   */
  const renderWidgetPreview = (widget) => {
    if (!tableData || tableData.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center bg-gray-50 rounded text-gray-500 text-sm">
          📂 Upload Excel file to see preview
        </div>
      );
    }

    if (!widget.dataSource?.xAxis && widget.type !== "pie" && widget.type !== "kpi") {
      return (
        <div className="h-48 flex items-center justify-center bg-gray-50 rounded text-gray-500 text-sm">
          ⚙️ Select data columns in settings
        </div>
      );
    }

    try {
      if (widget.type === "bar") {
        const data = generateChartData(widget);
        if (!data) return null;
        const chartOptions = {
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            tooltip: {
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              padding: 12,
              borderRadius: 4,
            },
            legend: {
              labels: { font: { size: 12 } },
            },
          },
          scales: {
            y: {
              ticks: { font: { size: 10 } },
            },
          },
        };
        return (
          <div style={{ height: "250px" }}>
            <Bar data={data} options={chartOptions} />
          </div>
        );
      }

      if (widget.type === "line") {
        const data = generateChartData(widget);
        if (!data) return null;
        const chartOptions = {
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            tooltip: {
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              padding: 12,
              borderRadius: 4,
              mode: "index",
              intersect: false,
            },
            legend: {
              labels: { font: { size: 12 } },
            },
          },
          scales: {
            y: {
              ticks: { font: { size: 10 } },
            },
          },
        };
        return (
          <div style={{ height: "250px" }}>
            <Line data={data} options={chartOptions} />
          </div>
        );
      }

      if (widget.type === "pie") {
        const data = generatePieChartData(widget);
        if (!data) return null;
        const chartOptions = {
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            tooltip: {
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              padding: 12,
              borderRadius: 4,
              callbacks: {
                label: function (context) {
                  const label = context.label || "";
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                },
              },
            },
            legend: {
              labels: { font: { size: 12 }, padding: 12 },
            },
          },
        };
        return (
          <div style={{ height: "250px" }}>
            <Pie data={data} options={chartOptions} />
          </div>
        );
      }

      if (widget.type === "doughnut") {
        const data = generatePieChartData(widget);
        if (!data) return null;
        const chartOptions = {
          maintainAspectRatio: false,
          responsive: true,
          cutout: "65%",
          plugins: {
            tooltip: {
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              padding: 12,
              borderRadius: 4,
              callbacks: {
                label: function (context) {
                  const label = context.label || "";
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                },
              },
            },
            legend: {
              labels: { font: { size: 12 }, padding: 12 },
            },
          },
        };
        return (
          <div style={{ height: "250px" }}>
            <Doughnut data={data} options={chartOptions} />
          </div>
        );
      }

      if (widget.type === "radar") {
        const data = generateChartData(widget);
        if (!data) return null;
        const chartOptions = {
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            tooltip: {
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              padding: 12,
              borderRadius: 4,
            },
            legend: {
              labels: { font: { size: 12 } },
            },
          },
          scales: {
            r: {
              ticks: { font: { size: 10 } },
            },
          },
        };
        return (
          <div style={{ height: "250px" }}>
            <Radar data={data} options={chartOptions} />
          </div>
        );
      }

      if (widget.type === "kpi") {
        const kpiData = generateKPIContent(widget);
        if (!kpiData) return null;
        return (
          <div className="h-48 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 rounded">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{kpiData.total.toFixed(0)}</div>
              <div className="text-xs text-gray-600 mt-2">{widget.dataSource.valueColumn}</div>
              <div className="text-xs text-gray-500 mt-1">Avg: {kpiData.average} • Max: {kpiData.max}</div>
            </div>
          </div>
        );
      }

      if (widget.type === "table") {
        const data = generateTableData(widget);
        return (
          <div className="overflow-x-auto bg-gray-50 rounded">
            <table className="text-xs border-collapse w-full">
              <thead>
                <tr className="bg-gray-200">
                  {availableColumns.slice(0, 5).map((col) => (
                    <th key={col} className="border px-2 py-1 text-left">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="border-b">
                    {availableColumns.slice(0, 5).map((col) => (
                      <td key={col} className="border px-2 py-1 text-gray-700">
                        {String(row[col] || "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      return null;
    } catch (error) {
      console.error("Error rendering preview:", error);
      return (
        <div className="h-48 flex items-center justify-center bg-red-50 rounded text-red-500 text-sm">
          ⚠️ Error generating preview
        </div>
      );
    }
  };

  /**
   * Save dashboard
   */
  const handleSaveDashboard = async () => {
    if (!dashboardName.trim()) {
      alert("Dashboard name is required");
      return;
    }

    const dashboardData = {
      uploadId,
      name: dashboardName.trim(),
      description: dashboardDescription,
      widgets,
      isDefault: false,
    };

    if (onSave) {
      await onSave(dashboardData);
    } else {
      console.warn("No onSave callback provided");
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 rounded-t-lg">
        <h2 className="text-xl font-bold text-white">📊 Dashboard Builder</h2>
        <p className="text-indigo-50 text-sm mt-1">Create custom dashboards with drag-and-drop widgets</p>
      </div>

      <div className="flex gap-4 p-4 border-b border-gray-200">
        {/* Dashboard Settings */}
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Dashboard Name</label>
          <input
            type="text"
            value={dashboardName}
            onChange={(e) => setDashboardName(e.target.value)}
            placeholder="e.g., Sales Dashboard"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={dashboardDescription}
            onChange={(e) => setDashboardDescription(e.target.value)}
            placeholder="Optional description"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          onClick={handleSaveDashboard}
          className="self-end px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition"
        >
          💾 Save
        </button>
      </div>

      <div className="flex gap-4 p-4">
        {/* Left Sidebar - Widget Library */}
        <div className="w-48 border-r border-gray-200">
          <button
            onClick={() => setShowWidgetLibrary(!showWidgetLibrary)}
            className="w-full px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg mb-4 transition"
          >
            ➕ {showWidgetLibrary ? "Hide" : "Add"} Widgets
          </button>

          {showWidgetLibrary && (
            <div className="space-y-2">
              {WIDGET_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => addWidget(type.id)}
                  className={`w-full p-3 rounded-lg text-left font-medium text-sm transition ${type.color} hover:opacity-80`}
                >
                  <span className="text-lg mr-2">{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          )}

          {/* Widgets List */}
          <div className="mt-6">
            <p className="font-semibold text-gray-700 text-sm mb-2">Widgets ({widgets.length})</p>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {widgets.map((widget) => (
                <button
                  key={widget.id}
                  onClick={() => setSelectedWidget(widget.id)}
                  className={`w-full p-2 text-left text-xs rounded-lg transition ${
                    selectedWidget === widget.id
                      ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-500"
                      : "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200"
                  }`}
                >
                  <span>{WIDGET_TYPES.find((t) => t.id === widget.type)?.icon}</span> {widget.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Canvas */}
        <div
          className="flex-1 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-4 min-h-96 relative overflow-auto"
          onDragOver={handleWidgetDragOver}
        >
          {widgets.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-2xl mb-2">🎨</p>
                <p className="font-semibold">Start by adding widgets</p>
                <p className="text-sm">Click "Add Widgets" to begin</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-4 auto-rows-max">
              {widgets.map((widget) => (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={(e) => handleWidgetDragStart(e, widget.id)}
                  onDrop={(e) => handleWidgetDrop(e, 0, 0)}
                  onClick={() => setSelectedWidget(widget.id)}
                  className={`col-span-3 p-4 rounded-lg cursor-grab active:cursor-grabbing transition border-2 overflow-hidden ${
                    selectedWidget === widget.id
                      ? "bg-white border-indigo-500 shadow-lg ring-2 ring-indigo-200"
                      : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  {/* Widget Header */}
                  <div className="mb-3 flex justify-between items-center">
                    <div>
                      <div className="text-xl">{WIDGET_TYPES.find((t) => t.id === widget.type)?.icon}</div>
                      <p className="font-semibold text-sm text-gray-800 mt-1">{widget.title}</p>
                      <p className="text-xs text-gray-500">{widget.type} • {widget.position.w}×{widget.position.h}</p>
                    </div>
                  </div>

                  {/* Widget Preview */}
                  <div className="mt-3 border-t pt-3">
                    {renderWidgetPreview(widget)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar - Widget Settings */}
        {selectedWidget && (
          <div className="w-56 border-l border-gray-200 pl-4 overflow-y-auto max-h-96">
            {(() => {
              const widget = widgets.find((w) => w.id === selectedWidget);
              if (!widget) return null;

              return (
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">Widget Settings</h3>

                  {/* Basic Props */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={widget.title}
                      onChange={(e) => updateWidget(widget.id, { title: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    />
                  </div>

                  {/* Size Settings */}
                  <div className="mb-4 p-2 bg-gray-100 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Size</p>
                    <div className="space-y-1">
                      <label className="text-xs block">
                        Width:
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={widget.position.w}
                          onChange={(e) =>
                            updateWidget(widget.id, {
                              position: { ...widget.position, w: parseInt(e.target.value) },
                            })
                          }
                          className="ml-1 w-12 px-1 py-1 text-xs border border-gray-300 rounded"
                        />
                      </label>
                      <label className="text-xs block">
                        Height:
                        <input
                          type="number"
                          min="1"
                          max="6"
                          value={widget.position.h}
                          onChange={(e) =>
                            updateWidget(widget.id, {
                              position: { ...widget.position, h: parseInt(e.target.value) },
                            })
                          }
                          className="ml-1 w-12 px-1 py-1 text-xs border border-gray-300 rounded"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Data Source - Select Excel Columns */}
                  <div className="mb-4 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="text-xs font-semibold text-blue-900 block mb-2">📊 Data Columns</label>
                    {availableColumns && availableColumns.length > 0 ? (
                      <div className="space-y-2">
                        {/* X-Axis Column (for bar, line, radar) */}
                        {["bar", "line", "radar"].includes(widget.type) && (
                          <div>
                            <p className="text-[10px] text-blue-700 font-semibold mb-1">X-Axis (Categories):</p>
                            <select
                              value={widget.dataSource?.xAxis || ""}
                              onChange={(e) =>
                                updateWidget(widget.id, {
                                  dataSource: { ...widget.dataSource, xAxis: e.target.value },
                                })
                              }
                              className="w-full px-2 py-1 text-xs border border-blue-300 rounded bg-white"
                            >
                              <option value="">-- Select Column --</option>
                              {availableColumns.map((col) => (
                                <option key={col} value={col}>
                                  {col}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Y-Axis Column(s) for bar, line, radar */}
                        {["bar", "line", "radar"].includes(widget.type) && (
                          <div>
                            <p className="text-[10px] text-blue-700 font-semibold mb-1">Y-Axis (Values):</p>
                            <select
                              value={widget.dataSource?.yAxis || ""}
                              onChange={(e) =>
                                updateWidget(widget.id, {
                                  dataSource: { ...widget.dataSource, yAxis: e.target.value },
                                })
                              }
                              className="w-full px-2 py-1 text-xs border border-blue-300 rounded bg-white"
                            >
                              <option value="">-- Select Column --</option>
                              {availableColumns.map((col) => (
                                <option key={col} value={col}>
                                  {col}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Y-Axis Column for Pie & Doughnut */}
                        {["pie", "doughnut"].includes(widget.type) && (
                          <div>
                            <p className="text-[10px] text-blue-700 font-semibold mb-1">Values Column:</p>
                            <select
                              value={widget.dataSource?.yAxis || ""}
                              onChange={(e) =>
                                updateWidget(widget.id, {
                                  dataSource: { ...widget.dataSource, yAxis: e.target.value },
                                })
                              }
                              className="w-full px-2 py-1 text-xs border border-blue-300 rounded bg-white"
                            >
                              <option value="">-- Select Column --</option>
                              {availableColumns.map((col) => (
                                <option key={col} value={col}>
                                  {col}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Data Value (for KPI) */}
                        {widget.type === "kpi" && (
                          <div>
                            <p className="text-[10px] text-blue-700 font-semibold mb-1">Value Column:</p>
                            <select
                              value={widget.dataSource?.valueColumn || ""}
                              onChange={(e) =>
                                updateWidget(widget.id, {
                                  dataSource: { ...widget.dataSource, valueColumn: e.target.value },
                                })
                              }
                              className="w-full px-2 py-1 text-xs border border-blue-300 rounded bg-white"
                            >
                              <option value="">-- Select Column --</option>
                              {availableColumns.map((col) => (
                                <option key={col} value={col}>
                                  {col}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Row Range */}
                        <div>
                          <p className="text-[10px] text-blue-700 font-semibold mb-1">Rows:</p>
                          <input
                            type="text"
                            placeholder="e.g., 1-50"
                            defaultValue={widget.dataSource?.rowRange || ""}
                            onChange={(e) =>
                              updateWidget(widget.id, {
                                dataSource: { ...widget.dataSource, rowRange: e.target.value },
                              })
                            }
                            className="w-full px-2 py-1 text-xs border border-blue-300 rounded bg-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">📂 No Excel data available. Upload a file first.</p>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => removeWidget(widget.id)}
                    className="w-full px-3 py-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition"
                  >
                    🗑️ Remove Widget
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 p-3 rounded-b-lg text-xs text-gray-500 flex justify-between">
        <p>Total Widgets: {widgets.length} • Drag widgets to reposition</p>
        <button
          onClick={() => setWidgets([])}
          className="text-red-600 hover:text-red-700 font-semibold"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default DashboardBuilder;
