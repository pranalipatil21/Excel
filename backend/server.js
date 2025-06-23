require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ✅ Middleware first!
app.use(cors());
app.use(express.json());

// ✅ Then define routes
const userRoutes = require("./routes/user");
const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/upload");

app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes); // 🔐 Auth endpoint: /api/auth/register, /api/auth/login
app.use("/api/upload", uploadRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Root route
app.get("/", (req, res) => {
  res.send("🚀 Server is running & MongoDB is connected!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
