const mongoose = require("mongoose");

const uploadSchema = new mongoose.Schema({
  originalName: String,
  size: Number,
  uploadDate: Date,
  name: String,
  age: String,
  email: String,
  excelfilebase64: String, // optional
});

module.exports = mongoose.model("Upload", uploadSchema);
