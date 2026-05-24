import React, { useEffect, useMemo, useState, useRef } from "react";
import { Bar, Pie, Line, Radar, Doughnut } from "react-chartjs-2";
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
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import NavbarMain from "../components/NavbarMain";
import SidebarDrawer from "../components/SidebarDrawer";
import Footer from "../components/Footer";
import AIInsightsPanel from "../components/AIInsightsPanel";
import DashboardBuilder from "../components/DashboardBuilder";
import DashboardSharing from "../components/DashboardSharing";

const EDITOR_STORAGE_KEY = "excelEditorWorkbook";
const EDITOR_VERSIONS_KEY = "excelEditorVersions";

const makeCell = (value = "") => ({
  value: String(value ?? ""),
  bold: false,
  bg: "#ffffff",
});

const makeBlankSheet = (name = "Sheet", rows = 20, cols = 10) => {
  const cells = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => makeCell(""))
  );
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    cells,
  };
};

const normalizeSheetShape = (sheet, minRows = 20, minCols = 10) => {
  const rowCount = Math.max(minRows, sheet.cells?.length || 0);
  const colCount = Math.max(
    minCols,
    ...(sheet.cells || []).map((row) => row.length || 0),
    0
  );

  const cells = Array.from({ length: rowCount }, (_, r) =>
    Array.from({ length: colCount }, (_, c) => {
      const existing = sheet.cells?.[r]?.[c];
      if (!existing) return makeCell("");
      return {
        value: String(existing.value ?? ""),
        bold: Boolean(existing.bold),
        bg: existing.bg || "#ffffff",
      };
    })
  );

  return {
    id: sheet.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: sheet.name || "Sheet",
    cells,
  };
};

const lettersToIndex = (letters) => {
  let index = 0;
  for (let i = 0; i < letters.length; i += 1) {
    index = index * 26 + (letters.charCodeAt(i) - 64);
  }
  return index - 1;
};

const safeEvaluateExpression = (expression) => {
  const tokens = (expression.match(/\d*\.?\d+|[()+\-*/]/g) || []);
  if (!tokens.length) return NaN;

  const precedence = { "+": 1, "-": 1, "*": 2, "/": 2 };
  const values = [];
  const ops = [];

  const applyOp = () => {
    const op = ops.pop();
    const b = values.pop();
    const a = values.pop();
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;

    if (op === "+") values.push(a + b);
    else if (op === "-") values.push(a - b);
    else if (op === "*") values.push(a * b);
    else if (op === "/") values.push(b === 0 ? NaN : a / b);
    else return false;
    return true;
  };

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (/^\d*\.?\d+$/.test(token)) {
      values.push(Number(token));
      continue;
    }

    if (token === "(") {
      ops.push(token);
      continue;
    }

    if (token === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") {
        if (!applyOp()) return NaN;
      }
      if (ops[ops.length - 1] === "(") ops.pop();
      continue;
    }

    while (
      ops.length &&
      ops[ops.length - 1] !== "(" &&
      precedence[ops[ops.length - 1]] >= precedence[token]
    ) {
      if (!applyOp()) return NaN;
    }
    ops.push(token);
  }

  while (ops.length) {
    if (!applyOp()) return NaN;
  }

  return values.length === 1 ? values[0] : NaN;
};

const evaluateFormula = (rawValue, sheetCells) => {
  const text = String(rawValue ?? "").trim();
  if (!text.startsWith("=")) return text;

  const expression = text
    .slice(1)
    .replace(/([A-Z]+)(\d+)/g, (_, letters, rowStr) => {
      const row = Number(rowStr) - 1;
      const col = lettersToIndex(letters);
      const value = sheetCells?.[row]?.[col]?.value ?? 0;
      const numeric = parseFloat(String(value).replace(/,/g, ""));
      return Number.isFinite(numeric) ? String(numeric) : "0";
    })
    .replace(/[^0-9+\-*/(). ]/g, "")
    .trim();

  const result = safeEvaluateExpression(expression);
  return Number.isFinite(result) ? String(result) : "#ERR";
};

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const workbookFromExcelData = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return [makeBlankSheet("Sheet1")];
  }

  const headers = Object.keys(data[0]);
  const rows = [headers, ...data.map((row) => headers.map((h) => row[h] ?? ""))];

  const minRows = Math.max(20, rows.length);
  const minCols = Math.max(10, headers.length);
  const cells = Array.from({ length: minRows }, (_, r) =>
    Array.from({ length: minCols }, (_, c) => makeCell(rows[r]?.[c] ?? ""))
  );

  return [
    {
      id: `${Date.now()}-sheet1`,
      name: "Sheet1",
      cells,
    },
  ];
};

const sheetToJsonRows = (sheet) => {
  if (!sheet?.cells?.length) return [];

  const headerRow = sheet.cells[0].map((cell, i) => String(cell?.value || `Column_${i + 1}`).trim());
  const nonEmptyHeaders = headerRow.map((h, i) => h || `Column_${i + 1}`);
  const dataRows = [];

  for (let r = 1; r < sheet.cells.length; r += 1) {
    const row = sheet.cells[r];
    const obj = {};
    let hasValue = false;

    for (let c = 0; c < nonEmptyHeaders.length; c += 1) {
      const raw = row?.[c]?.value ?? "";
      const evaluated = evaluateFormula(raw, sheet.cells);
      const parsedNum = parseFloat(String(evaluated).replace(/,/g, ""));
      const value = String(evaluated).trim() === "" ? "" : Number.isFinite(parsedNum) ? parsedNum : evaluated;
      obj[nonEmptyHeaders[c]] = value;
      if (String(value).trim() !== "") hasValue = true;
    }

    if (hasValue) dataRows.push(obj);
  }

  return dataRows;
};

const sheetToWorksheet = (sheet) => {
  const aoa = sheet.cells.map((row, rowIndex) =>
    row.map((cell) => {
      const raw = String(cell.value ?? "");
      if (rowIndex > 0 && raw.trim().startsWith("=")) {
        const formulaResult = evaluateFormula(raw, sheet.cells);
        const parsed = parseFloat(String(formulaResult));
        return { f: raw.slice(1), v: Number.isFinite(parsed) ? parsed : formulaResult };
      }
      return raw;
    })
  );
  return XLSX.utils.aoa_to_sheet(aoa);
};

const columnLabel = (index) => {
  let label = "";
  let num = index + 1;
  while (num > 0) {
    const rem = (num - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    num = Math.floor((num - 1) / 26);
  }
  return label;
};

const mutateSheetCollection = (prevSheets, targetSheetId, mutator) => {
  if (!Array.isArray(prevSheets) || prevSheets.length === 0) return prevSheets;

  const resolvedId =
    targetSheetId && prevSheets.some((sheet) => sheet.id === targetSheetId)
      ? targetSheetId
      : prevSheets[0].id;

  return prevSheets.map((sheet) => {
    if (sheet.id !== resolvedId) return sheet;
    const cloned = deepClone(sheet);

    if (!Array.isArray(cloned.cells) || cloned.cells.length === 0) {
      cloned.cells = [Array.from({ length: 10 }, (_, i) => makeCell(`Column_${i + 1}`))];
    }

    mutator(cloned);
    return cloned;
  });
};

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

export default function Charts() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [excelData, setExcelData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState([]);
  const [chartType, setChartType] = useState("Bar");
  const [searchQuery, setSearchQuery] = useState("");
  const [chartSize, setChartSize] = useState("Medium");
  const [maxPoints, setMaxPoints] = useState(25);
  const [editorSheets, setEditorSheets] = useState([]);
  const [activeSheetId, setActiveSheetId] = useState("");
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [editorVersions, setEditorVersions] = useState([]);
  const [newSheetName, setNewSheetName] = useState("Sheet2");
  const [newColumnName, setNewColumnName] = useState("");
  const [renameSheetName, setRenameSheetName] = useState("");
  const [versionName, setVersionName] = useState("");
  const [showFullEditor, setShowFullEditor] = useState(false);
  const [showInsertionMenu, setShowInsertionMenu] = useState(false);
  const [currentUploadId, setCurrentUploadId] = useState(null);
  const [activeDashboard, setActiveDashboard] = useState(null);
  const [showDashboardBuilder, setShowDashboardBuilder] = useState(false);
  const [showDashboardSharing, setShowDashboardSharing] = useState(false);
  const [featureTab, setFeatureTab] = useState("insights"); // insights, dashboard, sharing
  const chartRef = useRef();

  const chartGreenPalette = [
    "#2f8f4e",
    "#3ca25a",
    "#4caf61",
    "#63ba73",
    "#78c786",
    "#90d29b",
    "#a4dcae",
    "#bddfbe",
  ];

  const piePalette = [
    "#22d3ee",
    "#34d399",
    "#f59e0b",
    "#f97316",
    "#f43f5e",
    "#a78bfa",
    "#38bdf8",
    "#84cc16",
  ];

  const chartHeight = {
    Small: 280,
    Medium: 380,
    Large: 480,
  }[chartSize];

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("excelData"));
    if (data && data.length > 0) {
      const keys = Object.keys(data[0]);
      setExcelData(data);
      setColumns(keys);
      setXAxis(keys[0]);
      setYAxis([keys[1]]);
    }

    const savedWorkbook = localStorage.getItem(EDITOR_STORAGE_KEY);
    const savedVersions = localStorage.getItem(EDITOR_VERSIONS_KEY);

    if (savedVersions) {
      try {
        setEditorVersions(JSON.parse(savedVersions));
      } catch {
        setEditorVersions([]);
      }
    }

    if (savedWorkbook) {
      try {
        const parsed = JSON.parse(savedWorkbook);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error("Empty workbook cache");
        }
        const normalized = parsed.map((sheet) => normalizeSheetShape(sheet));
        setEditorSheets(normalized);
        setActiveSheetId(normalized[0]?.id || "");
        setRenameSheetName(normalized[0]?.name || "");
        return;
      } catch {
        // Fall through to default workbook creation
      }
    }

    const initialWorkbook = workbookFromExcelData(data || []);
    setEditorSheets(initialWorkbook);
    setActiveSheetId(initialWorkbook[0].id);
    setRenameSheetName(initialWorkbook[0].name);
  }, []);

  useEffect(() => {
    if (editorSheets.length > 0) {
      localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(editorSheets));
    }
  }, [editorSheets]);

  useEffect(() => {
    localStorage.setItem(EDITOR_VERSIONS_KEY, JSON.stringify(editorVersions));
  }, [editorVersions]);

  const activeSheet = useMemo(
    () => editorSheets.find((sheet) => sheet.id === activeSheetId) || editorSheets[0],
    [editorSheets, activeSheetId]
  );

  const selectedCellData = activeSheet?.cells?.[selectedCell.row]?.[selectedCell.col] || makeCell("");

  const updateActiveSheet = (updater) => {
    setEditorSheets((prev) => mutateSheetCollection(prev, activeSheetId, updater));
  };

  const updateCellValue = (rowIndex, colIndex, value) => {
    updateActiveSheet((sheet) => {
      if (!sheet.cells[rowIndex]) return;
      sheet.cells[rowIndex][colIndex].value = value;
    });
  };

  const addSheet = () => {
    const trimmed = newSheetName.trim() || `Sheet${editorSheets.length + 1}`;
    const duplicate = editorSheets.some((s) => s.name.toLowerCase() === trimmed.toLowerCase());
    const name = duplicate ? `${trimmed}_${editorSheets.length + 1}` : trimmed;
    const newSheet = makeBlankSheet(name);
    setEditorSheets((prev) => [...prev, newSheet]);
    setActiveSheetId(newSheet.id);
    setRenameSheetName(newSheet.name);
    setSelectedCell({ row: 0, col: 0 });
  };

  const renameActiveSheet = () => {
    if (!activeSheet) return;
    const trimmed = renameSheetName.trim();
    if (!trimmed) return;
    setEditorSheets((prev) =>
      prev.map((sheet) =>
        sheet.id === activeSheet.id ? { ...sheet, name: trimmed } : sheet
      )
    );
  };

  const deleteActiveSheet = () => {
    if (editorSheets.length <= 1 || !activeSheet) return;
    const remaining = editorSheets.filter((sheet) => sheet.id !== activeSheet.id);
    setEditorSheets(remaining);
    setActiveSheetId(remaining[0].id);
    setRenameSheetName(remaining[0].name);
    setSelectedCell({ row: 0, col: 0 });
  };

const addRow = (position = "below") => {
    setEditorSheets((prev) =>
      mutateSheetCollection(prev, activeSheetId, (sheet) => {
        const cols = Math.max(1, sheet.cells[0]?.length || 10);
        const newRow = Array.from({ length: cols }, () => makeCell(""));
        const insertIndex = position === "above" ? selectedCell.row : selectedCell.row + 1;
        sheet.cells.splice(insertIndex, 0, newRow);
      })
    );
  };

  const addColumn = (position = "right") => {
    setEditorSheets((prev) =>
      mutateSheetCollection(prev, activeSheetId, (sheet) => {
        const insertIndex = position === "left" ? selectedCell.col : selectedCell.col + 1;
        const name = newColumnName.trim() || `Column_${insertIndex + 1}`;
        
        sheet.cells = sheet.cells.map((row, rowIndex) => {
          const newRow = [...row];
          if (rowIndex === 0) {
            newRow.splice(insertIndex, 0, makeCell(name));
          } else {
            newRow.splice(insertIndex, 0, makeCell(""));
          }
          return newRow;
        });
      })
    );
    setNewColumnName("");
  };

  const applyBoldToSelected = () => {
    if (!activeSheet) return;
    updateActiveSheet((sheet) => {
      const cell = sheet.cells[selectedCell.row]?.[selectedCell.col];
      if (!cell) return sheet;
      cell.bold = !cell.bold;
      return sheet;
    });
  };

  const applyBgToSelected = (bg) => {
    if (!activeSheet) return;
    updateActiveSheet((sheet) => {
      const cell = sheet.cells[selectedCell.row]?.[selectedCell.col];
      if (!cell) return sheet;
      cell.bg = bg;
      return sheet;
    });
  };

  const saveEditedVersion = () => {
    if (!editorSheets.length) return;

    const versionId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const versionTitle = versionName.trim() || `Version ${editorVersions.length + 1}`;
    const createdAt = new Date().toISOString();
    const workbookSnapshot = deepClone(editorSheets);

    const workbook = XLSX.utils.book_new();
    workbookSnapshot.forEach((sheet) => {
      const ws = sheetToWorksheet(sheet);
      XLSX.utils.book_append_sheet(workbook, ws, sheet.name.slice(0, 31));
    });

    XLSX.writeFile(workbook, `excel-edit-${versionId}.xlsx`);

    setEditorVersions((prev) => [
      { id: versionId, name: versionTitle, createdAt, sheets: workbookSnapshot },
      ...prev,
    ]);
    setVersionName("");
  };

  const rollbackVersion = (versionId) => {
    const target = editorVersions.find((v) => v.id === versionId);
    if (!target) return;
    const restored = deepClone(target.sheets).map((sheet) => normalizeSheetShape(sheet));
    setEditorSheets(restored);
    setActiveSheetId(restored[0]?.id || "");
    setRenameSheetName(restored[0]?.name || "");
    setSelectedCell({ row: 0, col: 0 });
  };

  const applySheetToCharts = () => {
    if (!activeSheet) return;
    const rows = sheetToJsonRows(activeSheet);
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    setExcelData(rows);
    setColumns(keys);
    setXAxis(keys[0] || "");
    setYAxis(keys[1] ? [keys[1]] : []);
    localStorage.setItem("excelData", JSON.stringify(rows));
  };

  const resetEditorWorkbook = () => {
    const seed = workbookFromExcelData(excelData);
    setEditorSheets(seed);
    setActiveSheetId(seed[0].id);
    setRenameSheetName(seed[0].name);
    setSelectedCell({ row: 0, col: 0 });
    setNewColumnName("");
    localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(seed));
  };

  const filteredData = excelData.filter((row) =>
    searchQuery
      ? Object.values(row).some((val) =>
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
      : true
  );

  const toNumber = (value) => {
    if (typeof value === "number") return value;
    if (value === null || value === undefined) return 0;
    const parsed = parseFloat(String(value).replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const displayData = useMemo(() => filteredData.slice(0, maxPoints), [filteredData, maxPoints]);

  const labels = displayData.map((row) => String(row[xAxis] ?? ""));

  const datasets = yAxis.map((col, idx) => {
    const color = chartGreenPalette[idx % chartGreenPalette.length];
    return {
      label: col,
      data: displayData.map((row) => toNumber(row[col])),
      backgroundColor: `${color}cc`,
      borderColor: color,
      borderWidth: 2,
      fill: chartType === "Radar",
      tension: 0.35,
      pointRadius: chartType === "Line" ? 3 : 0,
      pointHoverRadius: chartType === "Line" ? 5 : 0,
    };
  });

  const chartData = {
    labels,
    datasets,
  };

  const pieSource = useMemo(() => {
    if (!yAxis[0]) return [];
    return displayData
      .map((row) => ({ label: String(row[xAxis] ?? ""), value: toNumber(row[yAxis[0]]) }))
      .sort((a, b) => b.value - a.value);
  }, [displayData, xAxis, yAxis]);

  const pieTopLimit = 12;
  const pieItems = useMemo(() => {
    if (pieSource.length <= pieTopLimit) return pieSource;
    const top = pieSource.slice(0, pieTopLimit - 1);
    const others = pieSource.slice(pieTopLimit - 1).reduce((sum, item) => sum + item.value, 0);
    return [...top, { label: "Others", value: Number(others.toFixed(2)) }];
  }, [pieSource]);

  const pieAndDoughnutData = {
    labels: pieItems.map((item) => item.label),
    datasets: [
      {
        label: yAxis[0],
        data: pieItems.map((item) => item.value),
        backgroundColor: pieItems.map((_, i) => piePalette[i % piePalette.length]),
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 700,
      easing: "easeOutQuart",
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#2f3e2f",
          boxWidth: 14,
          font: {
            size: 12,
            weight: "600",
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.96)",
        borderColor: "#9dc38d",
        borderWidth: 1,
        titleColor: "#1e2d1e",
        bodyColor: "#3f5a45",
        padding: 10,
      },
    },
  };

  const axisOptions = {
    ...commonOptions,
    scales: {
      x: {
        grid: {
          color: "rgba(130, 148, 130, 0.2)",
        },
        ticks: {
          color: "#3f5a45",
          autoSkip: true,
          maxRotation: 30,
          minRotation: 0,
          maxTicksLimit: 12,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(130, 148, 130, 0.2)",
        },
        ticks: {
          color: "#3f5a45",
        },
      },
    },
  };

  const pieOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: {
        position: pieItems.length > 8 ? "bottom" : "right",
        labels: {
          color: "#2f3e2f",
          boxWidth: 12,
          font: {
            size: 11,
            weight: "600",
          },
        },
      },
    },
  };

  const downloadAsImage = async () => {
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement("a");
    link.download = "chart.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const downloadAsPDF = async () => {
    const canvas = await html2canvas(chartRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 180, 100);
    pdf.save("chart.pdf");
  };

  const highlightMatch = (text) => {
    if (!searchQuery) return text;
    const regex = new RegExp(`(${searchQuery})`, "gi");
    return <span dangerouslySetInnerHTML={{ __html: text.replace(regex, "<mark>$1</mark>") }} />;
  };

  const ChartComponent = {
    Bar: <Bar data={chartData} options={axisOptions} />,
    Line: <Line data={chartData} options={axisOptions} />,
    Radar: <Radar data={chartData} options={commonOptions} />,
    Pie: <Pie data={pieAndDoughnutData} options={pieOptions} />,
    Doughnut: <Doughnut data={pieAndDoughnutData} options={pieOptions} />,
  }[chartType];

  return (
    <div className="theme-page min-h-screen font-detective relative">
      <div className="absolute inset-0 theme-overlay z-0" />
      <NavbarMain onToggleDrawer={() => setIsDrawerOpen(true)} onSearchChange={setSearchQuery} />
      <SidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="relative z-10 px-6 py-12 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-4xl font-bold theme-title">Filterable Charts</h2>
        </div>

        <div className="flex flex-wrap gap-4 mb-10">
          <Link to="/upload" className="theme-btn text-sm px-4 py-2">Upload</Link>
          <Link to="/history" className="theme-btn text-sm px-4 py-2">History</Link>
          <Link to="/chat" className="theme-btn text-sm px-4 py-2">AI Insights</Link>
          <Link to="/home" className="theme-btn text-sm px-4 py-2">Home</Link>
        </div>

        {excelData.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm mb-1 theme-title">X-Axis Column</label>
                <select
                  value={xAxis}
                  onChange={(e) => setXAxis(e.target.value)}
                  className="theme-input w-full p-2 border rounded"
                >
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 theme-title">Y-Axis Column(s)</label>
                <select
                  multiple
                  value={yAxis}
                  onChange={(e) =>
                    setYAxis(Array.from(e.target.selectedOptions, (o) => o.value))
                  }
                  className="theme-input w-full p-2 border rounded h-32"
                >
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 theme-title">Chart Type</label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  className="theme-input w-full p-2 border rounded"
                >
                  <option value="Bar">Bar</option>
                  <option value="Line">Line</option>
                  <option value="Radar">Radar</option>
                  <option value="Pie">Pie</option>
                  <option value="Doughnut">Doughnut</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 theme-title">Chart Size</label>
                <select
                  value={chartSize}
                  onChange={(e) => setChartSize(e.target.value)}
                  className="theme-input w-full p-2 border rounded"
                >
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 theme-title">Visible Data Points</label>
                <select
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(Number(e.target.value))}
                  className="theme-input w-full p-2 border rounded"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div ref={chartRef} className="theme-card p-5 sm:p-6 rounded-xl border shadow-lg mb-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-xl theme-title font-semibold">{chartType} Chart</h3>
                <span className="text-xs theme-muted">
                  Showing {displayData.length} of {filteredData.length} rows
                </span>
              </div>
              <div style={{ height: `${chartHeight}px` }}>
              {ChartComponent}
              </div>
            </div>

            <div className="flex gap-4 justify-center mb-8">
              <button onClick={downloadAsImage} className="theme-btn px-4 py-2 text-sm">
                Download Image
              </button>
              <button onClick={downloadAsPDF} className="theme-btn px-4 py-2 text-sm">
                Download PDF
              </button>
            </div>

            <div className="overflow-auto theme-card border rounded-lg p-4 text-sm max-h-96">
              <h3 className="theme-title mb-2">Data Preview</h3>
              <table className="min-w-full text-left">
                <thead className="border-b border-emerald-200">
                  <tr>
                    {columns.map((key) => (
                      <th key={key} className="px-2 py-1">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, idx) => (
                    <tr key={idx} className="border-t border-emerald-100">
                      {columns.map((col, i) => (
                        <td key={i} className="px-2 py-1 whitespace-pre-wrap">
                          {highlightMatch(String(row[col] ?? ""))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <section className="theme-card border rounded-xl p-4 sm:p-6 mt-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="theme-title text-2xl font-bold">In-Browser Excel Editor</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetEditorWorkbook}
                    className="px-4 py-2 text-sm rounded bg-gray-500 text-white"
                  >
                    Reset Editor
                  </button>
                  <button
                    type="button"
                    onClick={applySheetToCharts}
                    className="theme-btn px-4 py-2 text-sm"
                  >
                    Apply Active Sheet To Charts
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
                <div className="theme-card-strong border rounded-lg p-3">
                  <p className="theme-title font-semibold mb-2">Sheet Controls</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editorSheets.map((sheet) => (
                      <button
                        key={sheet.id}
                        type="button"
                        onClick={() => {
                          setActiveSheetId(sheet.id);
                          setRenameSheetName(sheet.name);
                          setSelectedCell({ row: 0, col: 0 });
                        }}
                        className={`px-3 py-1 rounded-full text-sm border ${
                          sheet.id === activeSheet?.id
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-emerald-700 border-emerald-300"
                        }`}
                      >
                        {sheet.name}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newSheetName}
                      onChange={(e) => setNewSheetName(e.target.value)}
                      placeholder="New sheet name"
                      className="theme-input w-full p-2 text-sm"
                    />
                    <button type="button" onClick={addSheet} className="theme-btn px-3 py-2 text-sm">
                      Add
                    </button>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={renameSheetName}
                      onChange={(e) => setRenameSheetName(e.target.value)}
                      placeholder="Rename active sheet"
                      className="theme-input w-full p-2 text-sm"
                    />
                    <button type="button" onClick={renameActiveSheet} className="theme-btn px-3 py-2 text-sm">
                      Rename
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={deleteActiveSheet}
                    disabled={editorSheets.length <= 1}
                    className="px-3 py-2 rounded text-sm bg-red-500 text-white disabled:opacity-50"
                  >
                    Delete Active Sheet
                  </button>
                </div>

                <div className="theme-card-strong border rounded-lg p-3">
                  <p className="theme-title font-semibold mb-2">Cell Tools</p>
                  <p className="theme-subtitle text-xs mb-2">
                    Selected: {columnLabel(selectedCell.col)}{selectedCell.row + 1}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      placeholder="New column name"
                      className="theme-input w-full p-2 text-sm"
                    />
                  </div>
                  <div className="mb-3">
                    <button 
                      type="button" 
                      onClick={() => setShowInsertionMenu(!showInsertionMenu)}
                      className="theme-btn px-3 py-2 text-sm w-full"
                    >
                      {showInsertionMenu ? "✕ Close Insertion Menu" : "➕ Insert Row/Column"}
                    </button>
                  </div>
                  
                  {showInsertionMenu && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded p-3 mb-2">
                      <p className="text-xs font-semibold text-emerald-700 mb-2">Insert Row:</p>
                      <div className="flex gap-2 mb-3">
                        <button 
                          type="button" 
                          onClick={() => { addRow("above"); setShowInsertionMenu(false); }}
                          className="flex-1 px-2 py-1 bg-white text-emerald-700 border border-emerald-300 rounded text-xs hover:bg-emerald-100"
                        >
                          ⬆ Above Row {selectedCell.row + 1}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => { addRow("below"); setShowInsertionMenu(false); }}
                          className="flex-1 px-2 py-1 bg-white text-emerald-700 border border-emerald-300 rounded text-xs hover:bg-emerald-100"
                        >\n                          ⬇ Below Row {selectedCell.row + 1}\n                        </button>
                      </div>
                      
                      <p className="text-xs font-semibold text-emerald-700 mb-2">Insert Column:</p>
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => { addColumn("left"); setShowInsertionMenu(false); }}
                          className="flex-1 px-2 py-1 bg-white text-emerald-700 border border-emerald-300 rounded text-xs hover:bg-emerald-100"
                        >
                          ⬅ Left of {columnLabel(selectedCell.col)}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => { addColumn("right"); setShowInsertionMenu(false); }}
                          className="flex-1 px-2 py-1 bg-white text-emerald-700 border border-emerald-300 rounded text-xs hover:bg-emerald-100"
                        >
                          ➡ Right of {columnLabel(selectedCell.col)}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={applyBoldToSelected}
                      className={`px-3 py-2 rounded text-sm border ${
                        selectedCellData.bold
                          ? "bg-emerald-700 text-white border-emerald-700"
                          : "bg-white text-emerald-700 border-emerald-300"
                      }`}
                    >
                      Bold
                    </button>
                    <input
                      type="color"
                      value={selectedCellData.bg || "#ffffff"}
                      onChange={(e) => applyBgToSelected(e.target.value)}
                      className="h-10 w-14 rounded border border-emerald-300"
                    />
                  </div>
                  <p className="theme-muted text-xs">
                    Formula support: start value with =, for example =A2+B2
                  </p>
                </div>

                <div className="theme-card-strong border rounded-lg p-3">
                  <p className="theme-title font-semibold mb-2">Versioning</p>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={versionName}
                      onChange={(e) => setVersionName(e.target.value)}
                      placeholder="Version name (optional)"
                      className="theme-input w-full p-2 text-sm"
                    />
                    <button type="button" onClick={saveEditedVersion} className="theme-btn px-3 py-2 text-sm">
                      Save
                    </button>
                  </div>
                  <div className="max-h-28 overflow-auto text-sm space-y-2 pr-1">
                    {editorVersions.length === 0 ? (
                      <p className="theme-muted text-xs">No saved versions yet.</p>
                    ) : (
                      editorVersions.slice(0, 6).map((version) => (
                        <div key={version.id} className="flex items-center justify-between gap-2 border border-emerald-200 rounded p-2 bg-white">
                          <div>
                            <p className="text-emerald-800 font-medium text-xs">{version.name}</p>
                            <p className="text-emerald-700 text-[11px]">
                              {new Date(version.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => rollbackVersion(version.id)}
                            className="theme-btn px-2 py-1 text-xs"
                          >
                            Rollback
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="border border-emerald-200 rounded-lg">
                <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-200 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      {showFullEditor ? "📄 Full Excel Editor" : "👁 Preview Mode"}
                    </p>
                    <p className="text-xs text-emerald-600">
                      Showing {showFullEditor ? "all" : "first 50"} rows of {activeSheet?.cells?.length || 0} total
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFullEditor(!showFullEditor)}
                    className={`px-4 py-2 rounded text-sm font-medium transition ${
                      showFullEditor
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50"
                    }`}
                  >
                    {showFullEditor ? "← Show Preview" : "→ Show Complete File"}
                  </button>
                </div>
                
                <div className="overflow-auto" style={{ maxHeight: showFullEditor ? "800px" : "600px" }}>
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-emerald-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 border-b border-emerald-100 w-14 text-center">#</th>
                        {(activeSheet?.cells?.[0] || []).map((cell, colIndex) => {
                          const colName = String(cell?.value || `Column_${colIndex + 1}`).trim() || `Column_${colIndex + 1}`;
                          return (
                          <th
                            key={`col-${colIndex}`}
                            className="px-2 py-2 border-b border-emerald-100 text-emerald-700 min-w-[110px]"
                          >
                            <div className="flex flex-col leading-tight">
                              <span>{columnLabel(colIndex)}</span>
                              <span className="text-[11px] text-emerald-500 font-normal">{colName}</span>
                            </div>
                          </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {(activeSheet?.cells || []).slice(0, showFullEditor ? undefined : 50).map((row, rowIndex) => (
                        <tr key={`row-${rowIndex}`}>
                          <td className="px-2 py-1 border-b border-emerald-100 text-center text-emerald-700 bg-emerald-50">
                            {rowIndex + 1}
                          </td>
                          {row.map((cell, colIndex) => {
                            const isSelected =
                              selectedCell.row === rowIndex && selectedCell.col === colIndex;

                            return (
                              <td
                                key={`cell-${rowIndex}-${colIndex}`}
                                className={`border-b border-emerald-100 ${
                                  isSelected ? "ring-2 ring-emerald-400" : ""
                                }`}
                                style={{ backgroundColor: cell.bg || "#ffffff" }}
                              >
                                <input
                                  type="text"
                                  value={cell.value}
                                  onFocus={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                                  onChange={(e) => updateCellValue(rowIndex, colIndex, e.target.value)}
                                  className="w-full px-2 py-1 bg-transparent outline-none"
                                  style={{ fontWeight: cell.bold ? 700 : 400 }}
                                />
                                {cell.value.trim().startsWith("=") && (
                                  <p className="px-2 pb-1 text-[10px] text-emerald-700">
                                    = {evaluateFormula(cell.value, activeSheet.cells)}
                                  </p>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {!showFullEditor && (activeSheet?.cells?.length || 0) > 50 && (
                  <div className="bg-white border-t border-emerald-200 px-4 py-3 text-center">
                    <p className="text-xs text-emerald-600 mb-2">
                      Showing first 50 of {activeSheet?.cells?.length} rows
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* New Features: AI Insights, Dashboard Builder, Sharing */}
            <section className="mt-12 space-y-8">
              {/* Feature Tabs */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => setFeatureTab("insights")}
                  className={`px-6 py-3 font-semibold rounded-lg transition ${
                    featureTab === "insights"
                      ? "bg-emerald-500 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:border-emerald-400"
                  }`}
                >
                  🤖 AI Insights
                </button>
                <button
                  onClick={() => setFeatureTab("dashboard")}
                  className={`px-6 py-3 font-semibold rounded-lg transition ${
                    featureTab === "dashboard"
                      ? "bg-indigo-500 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:border-indigo-400"
                  }`}
                >
                  📊 Dashboard Builder
                </button>
                <button
                  onClick={() => setFeatureTab("sharing")}
                  className={`px-6 py-3 font-semibold rounded-lg transition ${
                    featureTab === "sharing"
                      ? "bg-cyan-500 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:border-cyan-400"
                  }`}
                >
                  🔗 Share Dashboard
                </button>
              </div>

              {/* AI Insights Panel */}
              {featureTab === "insights" && (
                <AIInsightsPanel
                  chartData={{
                    type: chartType,
                    title: `${chartType} Chart`,
                    labels: columns,
                    description: `Chart showing ${yAxis.join(", ")} by ${xAxis}`,
                  }}
                  tableData={excelData}
                  uploadId={currentUploadId}
                />
              )}

              {/* Dashboard Builder */}
              {featureTab === "dashboard" && (
                <DashboardBuilder
                  uploadId={currentUploadId}
                  availableColumns={columns}
                  tableData={excelData}
                  initialDashboard={activeDashboard}
                  onSave={async (dashboardData) => {
                    try {
                      console.log("Saving dashboard:", dashboardData);
                      // Show success message
                      alert("✅ Dashboard saved successfully! (Backend integration in progress)");
                      setActiveDashboard(dashboardData);
                    } catch (error) {
                      console.error("Error saving dashboard:", error);
                      alert("❌ Failed to save dashboard");
                    }
                  }}
                />
              )}

              {/* Dashboard Sharing */}
              {featureTab === "sharing" && activeDashboard ? (
                <DashboardSharing
                  dashboardId={activeDashboard._id || activeDashboard.id}
                  onShare={(share) => {
                    console.log("Dashboard shared:", share);
                  }}
                />
              ) : featureTab === "sharing" ? (
                <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                  <p className="text-yellow-800 font-semibold">⚠️ Create a dashboard first</p>
                  <p className="text-yellow-700 text-sm mt-2">Use the Dashboard Builder to create a dashboard before sharing</p>
                </div>
              ) : null}
            </section>
          </>
        ) : (
          <p className="text-center text-gray-400 text-lg">
            No Excel data found. Please upload a file first.
          </p>
        )}
      </main>

      <Footer />

      <style>{`
        mark {
          background-color: yellow;
          color: black;
        }
      `}</style>
    </div>
  );
}
