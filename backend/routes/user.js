const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const User = require("../models/User");

// GET /api/user/profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ PUT /api/user/update
router.put("/update", verifyToken, async (req, res) => {
  try {
    const { name } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.user.id,
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
