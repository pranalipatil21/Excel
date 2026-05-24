const mongoose = require("mongoose");

const widgetSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true, // Unique widget ID (e.g., "widget-1")
  },
  type: {
    type: String,
    enum: ["bar", "pie", "line", "radar", "table", "kpi"],
    required: true,
  },
  title: {
    type: String,
    default: "Untitled Widget",
  },
  config: {
    // Chart configuration (dataKeys, labels, colors, etc.)
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  position: {
    // Grid position for drag-and-drop
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    w: { type: Number, default: 3 }, // Width in grid units
    h: { type: Number, default: 2 }, // Height in grid units
  },
  dataSource: {
    // Reference to data (column names, row ranges, etc.)
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

const dashboardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  uploadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Upload",
    required: true, // Dashboard belongs to a file
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  widgets: [widgetSchema],
  layout: {
    // Grid layout settings
    columns: { type: Number, default: 12 }, // 12-column grid
    rowHeight: { type: Number, default: 60 }, // px per row
  },
  isDefault: {
    type: Boolean,
    default: false, // Mark as the default dashboard for file
  },
}, { timestamps: true });

module.exports = mongoose.model("Dashboard", dashboardSchema);
