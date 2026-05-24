const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const verifyToken = require("../middleware/authMiddleware");
const User = require("../models/User");

// GET /api/user/profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(401).json({ msg: "Invalid token payload" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(403).json({ msg: "Profile endpoint is only available for user accounts" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

//  PUT /api/user/update
router.put("/update", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(401).json({ msg: "Invalid token payload" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(403).json({ msg: "Update endpoint is only available for user accounts" });
    }

    const { name } = req.body;

    const updated = await User.findByIdAndUpdate(
      userId,
      { name },
      { new: true }
    ).select("-password");

    res.status(200).json(updated);
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ msg: "Failed to update profile" });
  }
});

module.exports = router;
