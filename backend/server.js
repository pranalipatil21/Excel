require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Diagnostics to ensure the expected backend entry is running
console.log(`[boot] cwd=${process.cwd()}`);
console.log(`[boot] file=${__filename}`);

// Routes
const userRoutes = require("./routes/user");
const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/upload");
const dashboardRoutes = require("./routes/dashboard");

app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health route
app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true, service: "excel-analytics-backend" });
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Root route
app.get("/", (req, res) => {
  res.send("Server is running & MongoDB is connected!");
});

// Fallback for unknown routes
app.use((req, res) => {
  res.status(404).json({ msg: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
