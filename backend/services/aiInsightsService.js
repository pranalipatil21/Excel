const { GoogleGenerativeAI } = require("@google/generative-ai");

const client = new GoogleGenerativeAI(process.env.GEMINI_API);
const FALLBACK_MODELS = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

async function generateWithGemini(prompt) {
  const models = [process.env.GEMINI_MODEL, ...FALLBACK_MODELS].filter(Boolean);
  let lastError = null;

  for (const modelName of models) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text && text.trim()) {
        return text.trim();
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No Gemini model returned a valid response");
}

/**
 * Generate AI insights about the data
 * @param {Array} data - Array of objects representing the data
 * @param {String} context - Additional context about the data
 * @returns {Promise<String>} AI-generated insight
 */
const generateInsight = async (data, context = "") => {
  try {
    if (!process.env.GEMINI_API) {
      console.warn("⚠️  GEMINI_API not set, returning mock response");
      return generateMockInsight(data);
    }

    const dataSummary = formatDataForAnalysis(data);

    const prompt = `You are a senior analytics consultant for Excel datasets.
Generate a detailed but practical report using clear headings and bullet points.
Keep response within 250-350 words.

Data Summary:
${dataSummary}

${context ? `Additional Context: ${context}` : ""}

Required sections:
1) Executive Overview: 2-3 lines on what the dataset represents.
2) Key Trends: top patterns and shifts.
3) Graph Explanation Guidance: what bar/line/pie charts would reveal.
4) Dependency Analysis: relationships between columns, likely drivers and dependent fields.
5) Actionable Recommendations: 3 concrete actions.

Be specific to the provided data and do not invent unavailable fields.`;

    return await generateWithGemini(prompt);
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    return generateMockInsight(data);
  }
};

/**
 * Explain a specific chart/visualization
 * @param {Object} chartData - Chart configuration and data
 * @returns {Promise<String>} Explanation of the chart
 */
const explainChart = async (chartData) => {
  try {
    if (!process.env.GEMINI_API) {
      return generateMockChartExplanation(chartData);
    }

    const prompt = `You are a data visualization expert.
Give a detailed but easy-to-read explanation for this chart.
Keep response under 220 words with short headings.

Chart Title: ${chartData.title || "Untitled"}
Chart Type: ${chartData.type}
Data Keys: ${chartData.labels?.join(", ") || "Unknown"}
${chartData.description ? `Description: ${chartData.description}` : ""}

Required sections:
1) What this graph shows.
2) Important highs/lows or trend shifts.
3) Business meaning of the observed pattern.
4) Dependencies: what variables seem to influence others.
5) One warning about misinterpretation and one next-check suggestion.`;

    return await generateWithGemini(prompt);
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    return generateMockChartExplanation(chartData);
  }
};

/**
 * Compare data metrics across two time periods
 * @param {Array} currentData - Current period data
 * @param {Array} previousData - Previous period data
 * @param {String} metricName - Name of metric being compared
 * @returns {Promise<Object>} Comparison results with insights
 */
const compareMetrics = async (currentData, previousData, metricName) => {
  try {
    const currentSummary = formatDataForAnalysis(currentData);
    const previousSummary = formatDataForAnalysis(previousData);
    const currentAvg = calculateMetricAverage(currentData, metricName);
    const previousAvg = calculateMetricAverage(previousData, metricName);
    const hasComparableAverages = Number.isFinite(currentAvg) && Number.isFinite(previousAvg) && previousAvg !== 0;
    const changePercent = hasComparableAverages
      ? (((currentAvg - previousAvg) / previousAvg) * 100).toFixed(2)
      : null;

    if (!process.env.GEMINI_API) {
      return generateMockComparison(currentData, previousData, metricName);
    }

    const prompt = `Compare these two datasets for metric: ${metricName}

Current Period:
${currentSummary}

Previous Period:
${previousSummary}

Numerical context:
- Current average (${metricName}): ${Number.isFinite(currentAvg) ? currentAvg.toFixed(2) : "N/A"}
- Previous average (${metricName}): ${Number.isFinite(previousAvg) ? previousAvg.toFixed(2) : "N/A"}
- Change %: ${changePercent !== null ? `${changePercent}%` : "Not enough numeric data"}

Provide:
1) Key differences
2) Percentage movement interpretation
3) Possible dependency/drivers
4) One actionable decision`;

    const comparisonText = await generateWithGemini(prompt);

    return {
      comparison: comparisonText,
      currentSummary,
      previousSummary,
      changePercent,
    };
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    return generateMockComparison(currentData, previousData, metricName);
  }
};

/**
 * Explain field-level dependencies from uploaded data
 * @param {Array} data - Dataset rows
 * @param {String} focusMetric - Optional metric to focus dependency on
 * @returns {Promise<String>} Dependency explanation text
 */
const explainDependencies = async (data, focusMetric = "") => {
  try {
    const dataSummary = formatDataForAnalysis(data);
    if (!process.env.GEMINI_API) {
      return generateMockDependencies(data, focusMetric);
    }

    const prompt = `You are a data analyst identifying dependencies in Excel data.
Provide a clear dependency breakdown in under 220 words.

Data Summary:
${dataSummary}

Focus metric: ${focusMetric || "Not provided"}

Required output:
1) Likely independent vs dependent columns.
2) Potential correlations and causal caution.
3) Segment-level dependencies to test.
4) Suggested validation checks before decision-making.`;

    return await generateWithGemini(prompt);
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    return generateMockDependencies(data, focusMetric);
  }
};

/**
 * Format data array for Gemini analysis
 */
function formatDataForAnalysis(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return "No data available";
  }

  const fields = Object.keys(data[0] || {});
  const sample = data.slice(0, 5);

  const numericInsights = fields
    .map((field) => {
      const values = data
        .map((row) => parseFloat(String(row[field] ?? "").replace(/,/g, "")))
        .filter((value) => Number.isFinite(value));

      if (values.length === 0) return null;
      const sum = values.reduce((acc, value) => acc + value, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      return `${field}: count=${values.length}, avg=${avg.toFixed(2)}, min=${min.toFixed(2)}, max=${max.toFixed(2)}`;
    })
    .filter(Boolean)
    .slice(0, 8);

  const categoryInsights = fields
    .map((field) => {
      const values = data
        .map((row) => row[field])
        .filter((value) => value !== null && value !== undefined && String(value).trim() !== "")
        .map((value) => String(value));

      if (!values.length) return null;
      const uniqueCount = new Set(values).size;
      if (uniqueCount > Math.max(20, values.length * 0.7)) return null;

      const frequency = {};
      values.forEach((value) => {
        frequency[value] = (frequency[value] || 0) + 1;
      });

      const topValues = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([label, count]) => `${label} (${count})`)
        .join(", ");

      return `${field}: unique=${uniqueCount}, top=${topValues}`;
    })
    .filter(Boolean)
    .slice(0, 8);

  const summary = `
Total records: ${data.length}
Fields: ${fields.join(", ")}
Numeric profile: ${numericInsights.length ? numericInsights.join(" | ") : "No clear numeric fields"}
Category profile: ${categoryInsights.length ? categoryInsights.join(" | ") : "No clear categorical fields"}
Sample records: ${JSON.stringify(sample, null, 2)}
  `.trim();

  return summary;
}

function calculateMetricAverage(data, metricName) {
  if (!Array.isArray(data) || !data.length || !metricName) return NaN;
  const values = data
    .map((row) => parseFloat(String(row?.[metricName] ?? "").replace(/,/g, "")))
    .filter((value) => Number.isFinite(value));

  if (!values.length) return NaN;
  const total = values.reduce((acc, value) => acc + value, 0);
  return total / values.length;
}

/**
 * Mock insight generator (fallback when API not available)
 */
function generateMockInsight(data) {
  const count = Array.isArray(data) ? data.length : 0;
  return [
    `Executive Overview: Dataset contains ${count} records and is ready for analysis.`,
    "Key Trends: Available sample indicates visible movement across important columns.",
    "Graph Guidance: Use bar charts for category comparisons and line charts for trend direction.",
    "Dependency Analysis: Check how numeric outcomes vary by category and time fields.",
    "Recommendations: Validate column data types, then run segmented trend analysis before action.",
  ].join("\n\n");
}

/**
 * Mock chart explanation
 */
function generateMockChartExplanation(chartData) {
  return [
    `What this graph shows: This ${chartData.type} chart summarizes ${chartData.title || "selected metrics"}.`,
    "Important pattern: It helps identify dominant segments, spikes, and weak-performing points.",
    "Business meaning: You can quickly see where performance concentration exists.",
    "Dependencies: Cross-check whether value changes are linked with category or time dimensions.",
    "Next step: Validate with a secondary chart before drawing final conclusions.",
  ].join("\n\n");
}

/**
 * Mock comparison
 */
function generateMockComparison(currentData, previousData, metricName) {
  const currentCount = Array.isArray(currentData) ? currentData.length : 0;
  const previousCount = Array.isArray(previousData) ? previousData.length : 0;
  const changePercent = previousCount > 0 ? (((currentCount - previousCount) / previousCount) * 100).toFixed(1) : 0;

  return {
    comparison: `The ${metricName} metric ${currentCount > previousCount ? "increased" : "decreased"} by ${Math.abs(changePercent)}% from the previous period. This is a notable shift in the data pattern.`,
    currentSummary: `Current: ${currentCount} records`,
    previousSummary: `Previous: ${previousCount} records`,
    changePercent,
  };
}

function generateMockDependencies(data, focusMetric) {
  const count = Array.isArray(data) ? data.length : 0;
  return [
    `Dependency focus: ${focusMetric || "overall dataset"}.`,
    `Data coverage: ${count} records available for dependency checks.`,
    "Likely dependent fields are outcome columns, while category/time columns usually act as drivers.",
    "Run grouped averages and trend splits to verify true dependency before decision-making.",
  ].join("\n\n");
}

module.exports = {
  generateInsight,
  explainChart,
  compareMetrics,
  explainDependencies,
};
