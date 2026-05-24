const mongoose = require("mongoose");

const dashboardShareSchema = new mongoose.Schema({
  dashboardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dashboard",
    required: true,
  },
  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  shareType: {
    type: String,
    enum: ["link", "email"],
    required: true,
  },
  // For link-based sharing
  shareLink: {
    type: String,
    unique: true,
    sparse: true, // Only required for "link" type
  },
  // For email-based sharing
  sharedWith: {
    type: String, // Email address
    sparse: true,
  },
  permission: {
    type: String,
    enum: ["view", "edit"],
    default: "view",
  },
  expiresAt: {
    type: Date,
    default: null, // null = no expiration
  },
  status: {
    type: String,
    enum: ["active", "revoked"],
    default: "active",
  },
}, { timestamps: true });

module.exports = mongoose.model("DashboardShare", dashboardShareSchema);
