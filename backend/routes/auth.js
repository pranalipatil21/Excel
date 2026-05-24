// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // <-- your Mongoose User model
const Upload = require("../models/Upload");
const Dashboard = require("../models/Dashboard");
const router = express.Router();

const buildToken = (payload, expiresIn = "1d") =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Access denied. No admin token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded?.role !== "admin") {
      return res.status(403).json({ msg: "Admin access required" });
    }
    req.admin = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ msg: "Invalid or expired admin token" });
  }
};

//  Register route
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ msg: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

//  Login route
router.post("/login", async (req, res) => {
  const rawEmail = req.body?.email;
  const rawPassword = req.body?.password;

  const email = String(rawEmail || "").trim().toLowerCase();
  const password = String(rawPassword || "").trim();

  if (!email || !password)
    return res.status(400).json({ msg: "Please enter all fields" });

  try {
    const adminEmail = String(process.env.ADMIN_USER || "").trim().toLowerCase();
    const adminPassword = String(process.env.ADMIN_PASSWORD || "").trim();

    if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
      const adminToken = buildToken(
        { id: "admin", role: "admin", email: adminEmail, name: "Admin" },
        "12h"
      );

      return res.status(200).json({
        msg: "Admin login successful",
        token: adminToken,
        user: {
          id: "admin",
          name: "Admin",
          email: adminEmail,
          role: "admin",
        },
      });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Invalid credentials" });

    //  Create token
    const token = buildToken({ id: user._id, role: "user" });

    res.status(200).json({
      msg: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Admin login route (credentials from .env)
router.post("/admin/login", async (req, res) => {
  const rawEmail = req.body?.email;
  const rawPassword = req.body?.password;

  const email = String(rawEmail || "").trim().toLowerCase();
  const password = String(rawPassword || "").trim();

  if (!email || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }

  const adminEmail = String(process.env.ADMIN_USER || "").trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || "").trim();

  if (!adminEmail || !adminPassword) {
    return res.status(500).json({ msg: "Admin credentials are not configured" });
  }

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ msg: "Invalid admin credentials" });
  }

  const token = buildToken(
    { id: "admin", role: "admin", email: adminEmail, name: "Admin" },
    "12h"
  );

  return res.status(200).json({
    msg: "Admin login successful",
    token,
    admin: {
      email: adminEmail,
      role: "admin",
      name: "Admin",
    },
  });
});

// Admin dashboard live stats
router.get("/admin/stats", verifyAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalUploads,
      totalDashboards,
      dashboards,
      recentUploads,
    ] = await Promise.all([
      User.countDocuments(),
      Upload.countDocuments(),
      Dashboard.countDocuments(),
      Dashboard.find().select("widgets"),
      Upload.find()
        .sort({ uploadDate: -1 })
        .limit(10)
        .select("originalName uploadDate name email size"),
    ]);

    const totalCharts = dashboards.reduce(
      (acc, dashboard) => acc + (Array.isArray(dashboard.widgets) ? dashboard.widgets.length : 0),
      0
    );

    const uniqueUploadUsers = await Upload.distinct("email", {
      email: { $exists: true, $nin: ["", "unknown@local", null] },
    });

    const activities = recentUploads.map((upload) => ({
      id: upload._id,
      type: "File Upload",
      fileName: upload.originalName,
      uploadedBy: upload.name || "Unknown",
      uploadedByEmail: upload.email || "unknown@local",
      uploadDate: upload.uploadDate,
      size: upload.size || 0,
    }));

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalUploads,
        totalDashboards,
        totalCharts,
        usersWhoUploaded: uniqueUploadUsers.length,
      },
      activities,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Failed to fetch admin stats", error: error.message });
  }
});

module.exports = router;
