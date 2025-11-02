/*const express = require("express");
const router = express.Router();
const { Student } = require("../models");
const { Op } = require("sequelize");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const studentId = req.params.id || 'unknown';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `payment-${studentId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  if (error.message.includes('Only image files')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};
// Serve uploaded files (MOVE THIS TO NEAR THE TOP)
router.get("/uploads/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../uploads', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "File not found" });
  }

  res.sendFile(filePath);
});

// GET all students
router.get("/", async (req, res) => {
  try {
    const students = await Student.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Server error fetching students" });
  }
});

// POST create new student - FIXED: No auto-approval
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      college,
      department,
      startDate,
      endDate,
      stipendType,
      stipendAmount,
      paymentMode,
      paymentStatus = "Pending"
    } = req.body;

    const studentData = {
      name,
      email,
      phone: phone || null,
      college,
      department,
      startDate,
      endDate,
      stipendType: stipendType || "Unpaid",
      stipendAmount: stipendType === "Paid" ? stipendAmount : null,
      paymentMode: stipendType === "Unpaid" ? paymentMode : null,
      paymentStatus,
      // REMOVED: isApproved field - let it default to false in database
      // is_approved will be false by default in the database
    };

    console.log("Creating student with data:", studentData);

    const student = await Student.create(studentData);
    res.status(201).json(student);
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({ 
      message: "Server error creating student",
      error: error.message
    });
  }
});

// POST upload payment screenshot - FIXED: No auto-approval
router.post("/:id/upload-payment-screenshot", 
  upload.single('screenshot'),
  handleMulterError,
  async (req, res) => {
    try {
      console.log('=== SCREENSHOT UPLOAD STARTED ===');
      console.log('Student ID:', req.params.id);
      console.log('Uploaded file:', req.file);

      const studentId = req.params.id;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No screenshot file uploaded'
        });
      }

      // Find student
      const student = await Student.findByPk(studentId);
      if (!student) {
        // Delete the uploaded file if student not found
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Delete old screenshot if exists
      if (student.paymentScreenshot && !student.paymentScreenshot.startsWith('data:')) {
        const oldFilePath = path.join(__dirname, '../uploads', student.paymentScreenshot);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Update student with screenshot filename - NO AUTO-APPROVAL
      await student.update({
        paymentScreenshot: req.file.filename,
        paymentDate: new Date(),
        paymentStatus: 'Pending' // Keep as Pending, don't auto-approve
        // is_approved remains false
      });

      res.json({
        success: true,
        message: 'Payment screenshot uploaded successfully',
        data: {
          screenshotUrl: `/api/students/uploads/${req.file.filename}`,
          studentId: studentId
        }
      });

    } catch (error) {
      console.error('Screenshot upload error:', error);
      
      // Delete the uploaded file if there was an error
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (deleteError) {
          console.error('Error deleting file:', deleteError);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to upload screenshot',
        error: error.message
      });
    }
  }
);

// PUT upload base64 screenshot - FIXED: No auto-approval
router.put("/:id/screenshot", async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentScreenshot } = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    await student.update({
      paymentScreenshot: paymentScreenshot,
      paymentDate: new Date(),
      paymentStatus: "Pending" // Keep as Pending, don't auto-approve
      // is_approved remains false
    });

    res.json({
      success: true,
      message: "Payment screenshot uploaded successfully",
      student
    });

  } catch (error) {
    console.error("Error uploading screenshot:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload screenshot",
      error: error.message
    });
  }
});

// GET student by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Convert file path to URL if screenshot exists and is a filename
    if (student.paymentScreenshot && !student.paymentScreenshot.startsWith('data:')) {
      student.dataValues.screenshotUrl = `/api/students/uploads/${student.paymentScreenshot}`;
    }

    res.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ 
      message: "Server error fetching student",
      error: error.message 
    });
  }
});

// PUT update student
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      college,
      department,
      startDate,
      endDate,
      stipendType,
      stipendAmount,
      razorpayTransactionId,
      senderUpiId,
      paymentScreenshot,
      paymentMode,
      paymentStatus
    } = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const updateData = {
      name,
      email,
      phone,
      college,
      department,
      startDate,
      endDate,
      stipendType,
      stipendAmount: stipendType === "Paid" ? stipendAmount : null,
      paymentMode: stipendType === "Unpaid" ? paymentMode : null,
      paymentStatus
    };

    // Only add these fields if they are provided and relevant
    if (razorpayTransactionId !== undefined) {
      updateData.razorpayTransactionId = stipendType === "Unpaid" ? razorpayTransactionId : null;
    }
    if (senderUpiId !== undefined) {
      updateData.senderUpiId = stipendType === "Unpaid" ? senderUpiId : null;
    }
    if (paymentScreenshot !== undefined) {
      updateData.paymentScreenshot = paymentScreenshot;
    }

    await student.update(updateData);
    res.json(student);
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ 
      message: "Server error updating student",
      error: error.message 
    });
  }
});

// DELETE student
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Delete associated screenshot file if exists (and it's a filename, not base64)
    if (student.paymentScreenshot && !student.paymentScreenshot.startsWith('data:')) {
      const filePath = path.join(__dirname, '../uploads', student.paymentScreenshot);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await student.destroy();
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ 
      message: "Server error deleting student",
      error: error.message 
    });
  }
});

// GET serve uploaded files - FIXED with proper MIME types
router.get("/uploads/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    console.log('Requested file:', filename);
    console.log('File path:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('File not found at path:', filePath);
      return res.status(404).json({ 
        success: false,
        message: "File not found" 
      });
    }

    // Set appropriate content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp'
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    // Add CORS headers if needed
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error serving file:", error);
    res.status(500).json({ 
      success: false,
      message: "Error serving file" 
    });
  }
});

// MANUAL APPROVAL ROUTES - Only these routes can approve students

// Approve student (Super Admin only)
router.post("/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    await student.update({ 
      paymentStatus: "Completed",
      is_approved: true // MANUAL APPROVAL
    });
    
    res.json({ message: "Student approved successfully", student });
  } catch (error) {
    console.error("Error approving student:", error);
    res.status(500).json({ message: "Server error approving student" });
  }
});

// Reject student (Super Admin only)
router.post("/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    await student.update({ 
      paymentStatus: "Failed",
      is_approved: false 
    });
    
    res.json({ message: "Student rejected successfully", student });
  } catch (error) {
    console.error("Error rejecting student:", error);
    res.status(500).json({ message: "Server error rejecting student" });
  }
});

// Revoke approval (Super Admin only)
router.post("/:id/revoke", async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    await student.update({ 
      paymentStatus: "Pending",
      is_approved: false 
    });
    
    res.json({ message: "Student approval revoked successfully", student });
  } catch (error) {
    console.error("Error revoking approval:", error);
    res.status(500).json({ message: "Server error revoking approval" });
  }
});

module.exports = router;*/

const express = require("express");
const router = express.Router();
const { Student } = require("../models");
const { Op } = require("sequelize");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads/");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const studentId = req.params.id || "unknown";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `payment-${studentId}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed!"), false);
  },
});

const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res
      .status(413)
      .json({ success: false, message: "File too large. Max 10MB." });
  }
  if (error.message.includes("Only image files")) {
    return res.status(400).json({ success: false, message: error.message });
  }
  next(error);
};

/*// ✅ Serve uploaded files FIRST before any dynamic ID routes
router.get("/uploads/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "../uploads", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "File not found" });
  }

  res.sendFile(filePath);
});*/

// GET all students
router.get("/", async (req, res) => {
  try {
    const students = await Student.findAll({ order: [["createdAt", "DESC"]] });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching students" });
  }
});

// Create student
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    data.paymentStatus = "Pending";
    data.is_approved = false;
    const student = await Student.create(data);
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Upload screenshot (file)
router.post(
  "/:id/upload-payment-screenshot",
  upload.single("screenshot"),
  handleMulterError,
  async (req, res) => {
    try {
      const student = await Student.findByPk(req.params.id);
      if (!student) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });
      }

      // Delete old file if exists
      if (
        student.paymentScreenshot &&
        !student.paymentScreenshot.startsWith("data:")
      ) {
        const oldPath = path.join(
          __dirname,
          "../uploads",
          student.paymentScreenshot
        );
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await student.update({
        paymentScreenshot: req.file.filename,
        paymentDate: new Date(),
        paymentStatus: "Pending",
      });

      const screenshotUrl = `${req.protocol}://${req.get("host")}/uploads/${
        req.file.filename
      }`;

      res.json({
        success: true,
        message: "Screenshot uploaded",
        screenshotUrl,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Upload failed",
        error: error.message,
      });
    }
  }
);

// Upload Base64 Screenshot
router.put("/:id/screenshot", async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });

    await student.update({
      paymentScreenshot: req.body.paymentScreenshot,
      paymentDate: new Date(),
      paymentStatus: "Pending",
    });

    res.json({ success: true, message: "Screenshot uploaded", student });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error", error: error.message });
  }
});

// Get student
// Get student
// Get student by ID
router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    let screenshotUrl = null;

    // ✅ If screenshot exists and is not base64
    if (student.paymentScreenshot && !student.paymentScreenshot.startsWith("data:")) {
      screenshotUrl = `${req.protocol}://${req.get("host")}/uploads/${student.paymentScreenshot}`;
    }

    // ✅ Send full student + screenshotUrl
    return res.json({
      ...student.dataValues,
      screenshotUrl,
    });

  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ message: "Error fetching student", error: error.message });
  }
});

// Approve
router.post("/:id/approve", async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).json({ message: "Not found" });
  await student.update({ paymentStatus: "Completed", is_approved: true });
  res.json({ message: "Approved", student });
});

// Reject
router.post("/:id/reject", async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).json({ message: "Not found" });
  await student.update({ paymentStatus: "Failed", is_approved: false });
  res.json({ message: "Rejected", student });
});

// Revoke approval
router.post("/:id/revoke", async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).json({ message: "Not found" });
  await student.update({ paymentStatus: "Pending", is_approved: false });
  res.json({ message: "Approval revoked", student });
});

// PUT update student
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      college,
      department,
      startDate,
      endDate,
      stipendType,
      stipendAmount,
      razorpayTransactionId,
      senderUpiId,
      paymentScreenshot,
      paymentMode,
      paymentStatus,
    } = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const updateData = {
      name,
      email,
      phone,
      college,
      department,
      startDate,
      endDate,
      stipendType,
      stipendAmount: stipendType === "Paid" ? stipendAmount : null,
      paymentMode: stipendType === "Unpaid" ? paymentMode : null,
      paymentStatus,
    };

    // Only add these fields if they are provided and relevant
    if (razorpayTransactionId !== undefined) {
      updateData.razorpayTransactionId =
        stipendType === "Unpaid" ? razorpayTransactionId : null;
    }
    if (senderUpiId !== undefined) {
      updateData.senderUpiId = stipendType === "Unpaid" ? senderUpiId : null;
    }
    if (paymentScreenshot !== undefined) {
      updateData.paymentScreenshot = paymentScreenshot;
    }

    await student.update(updateData);
    res.json(student);
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({
      message: "Server error updating student",
      error: error.message,
    });
  }
});

// DELETE student
// DELETE student
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Delete associated screenshot file if exists (and it's a filename, not base64)
    if (
      student.paymentScreenshot &&
      !student.paymentScreenshot.startsWith("data:")
    ) {
      const filePath = path.join(
        __dirname,
        "../uploads",
        student.paymentScreenshot
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await student.destroy();
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({
      message: "Server error deleting student",
      error: error.message,
    });
  }
});

module.exports = router;
