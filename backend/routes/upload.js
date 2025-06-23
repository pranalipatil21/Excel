const express = require("express");
const multer = require("multer");
const Upload = require("../models/Upload");

const router = express.Router();

// Configure memory storage
const storage = multer.memoryStorage();

// Configure multer with file filter
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls or sometimes .csv
      'text/csv' // .csv
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("❌ Only .xlsx, .xls, or .csv files are allowed."));
    }
  }
});

// POST route to handle file upload
router.post("/excel", upload.single("file"), async (req, res) => {
  try {
    const { name, age, email } = req.body;
    const excelfilebase64 = req.file ? req.file.buffer.toString("base64") : null;

    const newFile = new Upload({
      originalName: req.file.originalname,
      size: req.file.size,
      uploadDate: new Date(),
      name,
      age,
      email,
      excelfilebase64
    });

    await newFile.save();

    res.json({
      message: "✅ File uploaded and stored in MongoDB!",
      fileId: newFile._id
    });
  } catch (err) {
    res.status(500).json({
      message: "❌ Upload failed",
      error: err.message
    });
  }
});

// GET route to fetch recent upload history
router.get("/history", async (req, res) => {
  try {
    const uploads = await Upload.find().sort({ uploadDate: -1 }).limit(10);
    res.json(uploads);
  } catch (err) {
    res.status(500).json({ message: "❌ Failed to fetch history", error: err.message });
  }
});


module.exports = router;
