const mongoose = require("mongoose");

const uploadSchema = new mongoose.Schema({
  originalName: String,
  path: String,
  size: Number,
  uploadDate: Date,
});

module.exports = mongoose.model("Upload", uploadSchema);
