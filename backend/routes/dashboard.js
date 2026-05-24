const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Dashboard = require("../models/Dashboard");
const DashboardShare = require("../models/DashboardShare");
const authMiddleware = require("../middleware/authMiddleware");
const {
  generateInsight,
  explainChart,
  compareMetrics,
  explainDependencies,
} = require("../services/aiInsightsService");

// ===== PUBLIC AI INSIGHTS ENDPOINTS (No Auth Required) =====

/**
 * POST /api/dashboard/insights/analyze
 * Generate AI insight from data (PUBLIC - No auth needed)
 */
router.post("/insights/analyze", async (req, res) => {
  try {
    const { data, context } = req.body;

    if (!data) {
      return res.status(400).json({ msg: "data is required" });
    }

    const insight = await generateInsight(data, context);

    res.json({
      success: true,
      insight,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

/**
 * POST /api/dashboard/insights/explain-chart
 * Generate chart explanation (PUBLIC - No auth needed)
 */
router.post("/insights/explain-chart", async (req, res) => {
  try {
    const { chartData } = req.body;

    if (!chartData) {
      return res.status(400).json({ msg: "chartData is required" });
    }

    const explanation = await explainChart(chartData);

    res.json({
      success: true,
      explanation,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

/**
 * POST /api/dashboard/insights/compare
 * Compare metrics between two periods (PUBLIC - No auth needed)
 */
router.post("/insights/compare", async (req, res) => {
  try {
    const { currentData, previousData, metricName } = req.body;

    if (!currentData || !previousData || !metricName) {
      return res.status(400).json({ msg: "currentData, previousData, and metricName are required" });
    }

    const comparison = await compareMetrics(currentData, previousData, metricName);

    res.json({
      success: true,
      comparison,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

/**
 * POST /api/dashboard/insights/dependencies
 * Explain dependencies and relationships in dataset (PUBLIC - No auth needed)
 */
router.post("/insights/dependencies", async (req, res) => {
  try {
    const { data, focusMetric } = req.body;

    if (!data) {
      return res.status(400).json({ msg: "data is required" });
    }

    const dependencies = await explainDependencies(data, focusMetric || "");

    res.json({
      success: true,
      dependencies,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// Middleware to ensure authentication for protected routes
router.use(authMiddleware);

// ===== DASHBOARD CRUD OPERATIONS =====

/**
 * GET /api/dashboard/:uploadId
 * Get all dashboards for a specific file
 */
router.get("/:uploadId", async (req, res) => {
  try {
    const { uploadId } = req.params;
    const userId = req.user.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(uploadId)) {
      return res.status(400).json({ msg: "Invalid upload ID" });
    }

    const dashboards = await Dashboard.find({ uploadId, createdBy: userId })
      .select("_id name description isDefault widgets createdAt updatedAt")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: dashboards.length,
      dashboards,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

/**
 * GET /api/dashboard/single/:dashboardId
 * Get a specific dashboard
 */
router.get("/single/:dashboardId", async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(dashboardId)) {
      return res.status(400).json({ msg: "Invalid dashboard ID" });
    }

    const dashboard = await Dashboard.findOne({
      _id: dashboardId,
      createdBy: userId,
    });

    if (!dashboard) {
      return res.status(404).json({ msg: "Dashboard not found" });
    }

    res.json({
      success: true,
      dashboard,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

/**
 * POST /api/dashboard
 * Create a new dashboard
 */
router.post("/", async (req, res) => {
  try {
    const { uploadId, name, description } = req.body;
    const userId = req.user.id;

    if (!uploadId || !name) {
      return res.status(400).json({ msg: "uploadId and name are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(uploadId)) {
      return res.status(400).json({ msg: "Invalid upload ID" });
    }

    // Create new dashboard
    const newDashboard = new Dashboard({
      uploadId,
      name: name.trim(),
      description: description || "",
      createdBy: userId,
      widgets: [],
      isDefault: false,
    });

    const savedDashboard = await newDashboard.save();

    res.status(201).json({
      success: true,
      msg: "Dashboard created successfully",
      dashboard: savedDashboard,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

/**
 * PATCH /api/dashboard/:dashboardId
 * Update dashboard (name, description, widgets, layout)
 */
router.patch("/:dashboardId", async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const userId = req.user.id;
    const { name, description, widgets, layout, isDefault } = req.body;

    if (!mongoose.Types.ObjectId.isValid(dashboardId)) {
      return res.status(400).json({ msg: "Invalid dashboard ID" });
    }

    const dashboard = await Dashboard.findOne({
      _id: dashboardId,
      createdBy: userId,
    });

    if (!dashboard) {
      return res.status(404).json({ msg: "Dashboard not found" });
    }

    // Update fields
    if (name !== undefined) dashboard.name = name.trim();
    if (description !== undefined) dashboard.description = description;
    if (widgets !== undefined) dashboard.widgets = widgets;
    if (layout !== undefined) dashboard.layout = layout;
    if (isDefault !== undefined) dashboard.isDefault = isDefault;

    const updated = await dashboard.save();

    res.json({
      success: true,
      msg: "Dashboard updated successfully",
      dashboard: updated,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

/**
 * DELETE /api/dashboard/:dashboardId
 * Delete a dashboard
 */
router.delete("/:dashboardId", async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(dashboardId)) {
      return res.status(400).json({ msg: "Invalid dashboard ID" });
    }

    const dashboard = await Dashboard.findOneAndDelete({
      _id: dashboardId,
      createdBy: userId,
    });

    if (!dashboard) {
      return res.status(404).json({ msg: "Dashboard not found" });
    }

    // Also delete all shares for this dashboard
    await DashboardShare.deleteMany({ dashboardId });

    res.json({
      success: true,
      msg: "Dashboard deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// ===== SHARING ENDPOINTS =====

/**
 * POST /api/dashboard/:dashboardId/share
 * Create a share link or email share
 */
router.post("/:dashboardId/share", async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const { shareType, email, permission, expiresAt } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(dashboardId)) {
      return res.status(400).json({ msg: "Invalid dashboard ID" });
    }

    // Verify user owns the dashboard
    const dashboard = await Dashboard.findOne({
      _id: dashboardId,
      createdBy: userId,
    });

    if (!dashboard) {
      return res.status(404).json({ msg: "Dashboard not found" });
    }

    // Validate share type
    if (!["link", "email"].includes(shareType)) {
      return res.status(400).json({ msg: "Invalid shareType (link or email)" });
    }

    // Create share record
    const share = new DashboardShare({
      dashboardId,
      sharedBy: userId,
      shareType,
      permission: permission || "view",
      expiresAt: expiresAt || null,
    });

    // Generate share link for link-based sharing
    if (shareType === "link") {
      share.shareLink = `${uuidv4()}`;
    } else if (shareType === "email") {
      if (!email) {
        return res.status(400).json({ msg: "email is required for email shares" });
      }
      share.sharedWith = email.toLowerCase();
    }

    const savedShare = await share.save();

    res.status(201).json({
      success: true,
      msg: "Dashboard shared successfully",
      share: {
        _id: savedShare._id,
        shareLink: savedShare.shareLink || null,
        sharedWith: savedShare.sharedWith || null,
        permission: savedShare.permission,
      },
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

/**
 * GET /api/dashboard/:dashboardId/shares
 * Get all shares for a dashboard
 */
router.get("/:dashboardId/shares", async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(dashboardId)) {
      return res.status(400).json({ msg: "Invalid dashboard ID" });
    }

    // Verify ownership
    const dashboard = await Dashboard.findOne({
      _id: dashboardId,
      createdBy: userId,
    });

    if (!dashboard) {
      return res.status(404).json({ msg: "Dashboard not found" });
    }

    const shares = await DashboardShare.find({ dashboardId, status: "active" })
      .select("_id shareType shareLink sharedWith permission createdAt expiresAt");

    res.json({
      success: true,
      shares,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

/**
 * DELETE /api/dashboard/share/:shareId
 * Revoke a share
 */
router.delete("/share/:shareId", async (req, res) => {
  try {
    const { shareId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(shareId)) {
      return res.status(400).json({ msg: "Invalid share ID" });
    }

    const share = await DashboardShare.findById(shareId);

    if (!share) {
      return res.status(404).json({ msg: "Share not found" });
    }

    // Verify the user is the one who created the share
    if (share.sharedBy.toString() !== userId) {
      return res.status(403).json({ msg: "You can only revoke shares you created" });
    }

    share.status = "revoked";
    await share.save();

    res.json({
      success: true,
      msg: "Share revoked successfully",
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

/**
 * GET /api/dashboard/access/:shareLink
 * Access a shared dashboard via link (public endpoint, no auth required)
 */
router.get("/access/:shareLink", async (req, res) => {
  try {
    const { shareLink } = req.params;

    const share = await DashboardShare.findOne({
      shareLink,
      status: "active",
    }).populate("dashboardId");

    if (!share) {
      return res.status(404).json({ msg: "Share not found or expired" });
    }

    // Check expiration
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      share.status = "revoked";
      await share.save();
      return res.status(403).json({ msg: "This share link has expired" });
    }

    res.json({
      success: true,
      dashboard: share.dashboardId,
      permission: share.permission,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

module.exports = router;
