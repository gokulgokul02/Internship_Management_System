


const express = require("express");
const router = express.Router();
const { Student, ApprovedStudent, Payment } = require("../models");
const { Op } = require("sequelize");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const generateInvoice = require('../utils/generateInvoice');

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
    const studentId = req.body.studentId || req.params.id || "unknown";
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

// Configure nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

// GET all students (both pending and approved)
router.get("/", async (req, res) => {
  try {
    const { type = "all", status = "all" } = req.query;
    
    let whereClause = {};
    
    // Filter by type (pending/approved)
    if (type === "pending") {
      whereClause.is_approved = false;
    } else if (type === "approved") {
      whereClause.is_approved = true;
    }
    
    // Filter by internship status
    if (status !== "all") {
      whereClause.internshipStatus = status;
    }

    const students = await Student.findAll({ 
      where: whereClause,
      order: [["updatedAt", "DESC"]], // Order by last updated
      attributes: { exclude: ['password'] }
    });
    
    res.json(students);
    
  } catch (error) {
    console.error("❌ Error fetching students:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error fetching students", 
      error: error.message 
    });
  }
});

// GET approved students only (from both tables)
router.get("/approved/list", async (req, res) => {
  try {
    const { status = "all" } = req.query;
    
    let whereClause = { is_approved: true };
    
    // Filter by internship status
    if (status !== "all") {
      whereClause.internshipStatus = status;
    }

    // Get approved students from main Student table
    const approvedStudents = await Student.findAll({ 
      where: whereClause,
      order: [["updatedAt", "DESC"]],
      attributes: { exclude: ['password'] }
    });

    // Also get from ApprovedStudent table if it exists
    let archivedApprovedStudents = [];
    try {
      archivedApprovedStudents = await ApprovedStudent.findAll({
        order: [["updatedAt", "DESC"]]
      });
    } catch (error) {
      console.log("ApprovedStudent table not available or empty");
    }

    // Combine both lists
    const allApprovedStudents = [...approvedStudents, ...archivedApprovedStudents];
    
    res.json(allApprovedStudents);
    
  } catch (error) {
    console.error("❌ Error fetching approved students:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error fetching approved students", 
      error: error.message 
    });
  }
});

// GET pending students only
router.get("/pending/list", async (req, res) => {
  try {
    const { status = "all" } = req.query;
    
    let whereClause = { is_approved: false };
    
    // Filter by internship status
    if (status !== "all") {
      whereClause.internshipStatus = status;
    }

    const pendingStudents = await Student.findAll({ 
      where: whereClause,
      order: [["updatedAt", "DESC"]],
      attributes: { exclude: ['password'] }
    });
    
    res.json(pendingStudents);
    
  } catch (error) {
    console.error("❌ Error fetching pending students:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error fetching pending students", 
      error: error.message 
    });
  }
});

// Create student with all fields - FIXED PAYMENT RECORDING LOGIC
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      college,
      department,
      internshipType = "unpaid",
      duration = "1",
      startDate,
      endDate,
      stipendAmount,
      paymentMode = "Online",
      advanceAmount = 0,
      reason
    } = req.body;

    console.log("📥 FULL Received student data:", {
      name, email, internshipType, duration, advanceAmount, paymentMode
    });

    // Basic validation
    if (!name || !email || !college || !department) {
      return res.status(400).json({
        success: false,
        message: "Name, email, college, and department are required fields"
      });
    }

    // Generate simple ID
    const generateId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let id = '';
      for (let i = 0; i < 5; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return id;
    };

    const studentId = generateId();
    const durationInt = parseInt(duration) || 1;
    
    // Calculate amounts based on internship type
    let totalAmount = 0;
    let advance = parseFloat(advanceAmount) || 0;
    let remaining = 0;
    let stipendType = "Unpaid";
    let paymentStatus = "Pending";

    if (internshipType === "unpaid") {
      totalAmount = durationInt * 5000;
      remaining = Math.max(0, totalAmount - advance);
      stipendType = "Unpaid";
      
      if (advance > 0) {
        paymentStatus = remaining === 0 ? "Completed" : "Partially_Paid";
      } else {
        paymentStatus = "Pending";
      }
    } else {
      totalAmount = 0;
      advance = 0;
      remaining = 0;
      stipendType = "Paid";
      paymentStatus = "Completed";
    }

    console.log("💰 FINAL Calculated amounts:", {
      totalAmount,
      advanceAmount: advance,
      remainingAmount: remaining,
      paymentStatus
    });

    const studentData = {
      id: studentId,
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : null,
      college: college.trim(),
      department: department.trim(),
      internshipType,
      duration: durationInt,
      startDate: startDate || null,
      endDate: endDate || null,
      internshipStatus: "Active",
      stipendType: stipendType,
      stipendAmount: internshipType === "paid" ? (parseFloat(stipendAmount) || 0) : null,
      paymentMode: internshipType === "unpaid" ? paymentMode : null,
      totalAmount: totalAmount,
      advanceAmount: advance,
      remainingAmount: remaining,
      paymentStatus: paymentStatus,
      reason: reason || null,
      is_approved: false
    };

    console.log("💾 FINAL Student data to save:", studentData);

    // Create student
    const student = await Student.create(studentData);
    console.log("✅ Student created successfully with ID:", student.id);

    // ✅ FIXED PAYMENT RECORDING LOGIC - Always record advance payments
    try {
      const advancePaid = parseFloat(advance) || 0;
      if (advancePaid > 0) {
        console.log(`💳 Recording initial advance payment for student ${student.id}: ₹${advancePaid}`);
        
        const paymentRecord = await Payment.create({
          studentId: student.id,
          amount: advancePaid,
          method: paymentMode || 'Offline',
          razorpayPaymentId: null,
          notes: reason || 'Advance paid during registration',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log("✅ Payment record created:", {
          paymentId: paymentRecord.id,
          studentId: paymentRecord.studentId,
          amount: paymentRecord.amount,
          method: paymentRecord.method
        });

        // Generate invoice if function exists
        try {
          if (generateInvoice && typeof generateInvoice === 'function') {
            const invoice = await generateInvoice(student, paymentRecord);
            if (invoice && invoice.filename) {
              await Payment.update({ invoicePath: invoice.filename }, { where: { id: paymentRecord.id } });
              console.log("✅ Invoice generated for payment:", paymentRecord.id);
            }
          }
        } catch (invErr) {
          console.error('Invoice generation failed:', invErr.message);
        }

        console.log(`✅ Initial payment recorded successfully: ${paymentRecord.id}`);
      } else {
        console.log('ℹ️ No advance amount provided during registration');
      }
    } catch (err) {
      console.error('❌ Failed to record initial advance payment:', err.message);
      console.error('Error details:', err);
    }

    res.status(201).json({ 
      success: true, 
      message: "Student registered successfully",
      student: student,
      id: student.id
    });

  } catch (error) {
    console.error("❌ Error creating student:", error);
    
    let errorMessage = "Server error creating student";
    if (error.name === 'SequelizeValidationError') {
      errorMessage = "Validation error: " + error.errors.map(e => e.message).join(', ');
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      errorMessage = "A student with this email or ID already exists";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
});

// ✅ FIXED: Process Payment - CORRECT LOGIC
router.post("/:id/payment", async (req, res) => {
  try {
    const { 
      amount, 
      paymentDate, 
      razorpayTransactionId, 
      senderUpiId, 
      paymentScreenshot,
      paymentMode = "Online",
      reason
    } = req.body;
    
    const student = await Student.findByPk(req.params.id);
    
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    console.log("💳 Processing payment for student:", student.id, "Amount:", amount);

    // Validate amount
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payment amount" });
    }

    const payAmount = parseFloat(amount);
    const currentRemaining = parseFloat(student.remainingAmount) || 0;
    const currentAdvance = parseFloat(student.advanceAmount) || 0;
    const totalAmount = parseFloat(student.totalAmount) || 0;
    
    console.log("Current state - Total:", totalAmount, "Advance:", currentAdvance, "Remaining:", currentRemaining, "Payment:", payAmount);

    if (payAmount > currentRemaining) {
      return res.status(400).json({ 
        success: false, 
        message: `Payment amount (₹${payAmount}) exceeds remaining balance (₹${currentRemaining})` 
      });
    }

    // ✅ CORRECT CALCULATION: Add payment to advance, subtract from remaining
    const newAdvance = currentAdvance + payAmount;
    const newRemaining = Math.max(0, currentRemaining - payAmount);

    console.log("✅ Updated amounts - New Advance:", newAdvance, "New Remaining:", newRemaining);

    // Determine payment status
    let newPaymentStatus = student.paymentStatus;
    if (newRemaining === 0) {
      newPaymentStatus = "Completed";
    } else if (newAdvance > 0) {
      newPaymentStatus = "Partially_Paid";
    } else {
      newPaymentStatus = "Pending";
    }

    const updateData = {
      advanceAmount: newAdvance,
      remainingAmount: newRemaining,
      paymentDate: paymentDate || new Date(),
      paymentStatus: newPaymentStatus
    };

    // Add transaction details for online payments
    if (razorpayTransactionId) {
      updateData.razorpayTransactionId = razorpayTransactionId;
    }
    if (senderUpiId) {
      updateData.senderUpiId = senderUpiId;
    }
    if (paymentScreenshot) {
      updateData.paymentScreenshot = paymentScreenshot;
    }
    if (paymentMode) {
      updateData.paymentMode = paymentMode;
    }
    if (reason) {
      // Append to existing reason or create new
      const existingReason = student.reason || "";
      updateData.reason = existingReason + (existingReason ? "\n" : "") + `Payment of ₹${payAmount} on ${new Date().toLocaleDateString()}: ${reason}`;
    }

    console.log("🔄 Updating student with:", updateData);

    await student.update(updateData);

    // Fetch the completely updated student
    const updatedStudent = await Student.findByPk(req.params.id);

    // Create payment history record with exact payment timestamp
    let createdPaymentId = null;
    try {
      const paymentRecord = await Payment.create({
        studentId: req.params.id,
        amount: payAmount,
        method: paymentMode,
        razorpayPaymentId: razorpayTransactionId || null,
        notes: reason || null,
        createdAt: new Date() // Capture exact payment time
      });

      // Generate invoice and store filename
      try {
        const invoice = await generateInvoice(updatedStudent, paymentRecord);
        if (invoice && invoice.filename) {
          await Payment.update({ invoicePath: invoice.filename }, { where: { id: paymentRecord.id } });
        }
      } catch (invErr) {
        console.error('Invoice generation failed:', invErr.message);
      }

      // Attach payment id to response
      createdPaymentId = paymentRecord.id;
    } catch (payErr) {
      console.error('Failed to create payment record:', payErr.message);
    }

    res.json({
      success: true,
      message: `Payment of ₹${payAmount} processed successfully!`,
      student: updatedStudent,
      paymentId: createdPaymentId,
      paymentDetails: {
        totalAmount: totalAmount,
        previousAdvance: currentAdvance,
        newAdvance: newAdvance,
        previousRemaining: currentRemaining,
        newRemaining: newRemaining,
        amountPaid: payAmount,
        paymentStatus: newPaymentStatus
      }
    });
  } catch (error) {
    console.error("❌ Payment processing error:", error);
    res.status(500).json({
      success: false,
      message: "Payment processing failed",
      error: error.message
    });
  }
});

// ✅ NEW: Generate Bill PDF
router.get("/:id/generate-bill", async (req, res) => {
  try {
    const { id } = req.params;
    
    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // ✅ Convert payment fields to numbers safely
    const totalAmount = Number(student.totalAmount) || 0;
    const advanceAmount = Number(student.advanceAmount) || 0;
    const remainingAmount = Number(student.remainingAmount) || (totalAmount - advanceAmount);

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=bill-${student.name}-${student.id}.pdf`
    );

    doc.pipe(res);

    // Title
    doc.fontSize(20).font("Helvetica-Bold").text("INTERNSHIP FEE BILL", { align: "center" });
    doc.moveDown();

    // Company details
    doc.fontSize(12).font("Helvetica-Bold").text("Issued By:");
    doc.font("Helvetica").text("RORIRI SOFTWARE SOLUTIONS PVT LTD");
    doc.text("Company Address Line 1");
    doc.text("Company Address Line 2");
    doc.text("Phone: +91 XXXXXXXXXX | Email: company@example.com");
    doc.moveDown();

    // Bill details
    doc.font("Helvetica-Bold").text(`Bill No: BILL-${student.id}-${Date.now()}`);
    doc.text(`Bill Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // Student details
    doc.font("Helvetica-Bold").text("Student Details:");
    doc.font("Helvetica");
    doc.text(`Student ID: ${student.id}`);
    doc.text(`Name: ${student.name}`);
    doc.text(`Email: ${student.email}`);
    doc.text(`Phone: ${student.phone || "N/A"}`);
    doc.text(`College: ${student.college}`);
    doc.text(`Department: ${student.department}`);
    doc.text(`Internship Type: ${student.internshipType}`);
    doc.text(`Duration: ${student.duration} Month${student.duration > 1 ? "s" : ""}`);
    doc.moveDown();

    // Payment summary
    doc.font("Helvetica-Bold").text("Payment Summary:");
    doc.font("Helvetica");

    const itemX = 50;
    const amountX = 400;
    let currentY = doc.y + 10;

    doc.font("Helvetica-Bold");
    doc.text("Description", itemX, currentY);
    doc.text("Amount (₹)", amountX, currentY);
    currentY += 20;

    doc.font("Helvetica");
    doc.text("Total Internship Fee", itemX, currentY);
    doc.text(totalAmount.toFixed(2), amountX, currentY);
    currentY += 20;

    doc.text("Advance Amount Paid", itemX, currentY);
    doc.text(advanceAmount.toFixed(2), amountX, currentY);
    currentY += 20;

    doc.text("Remaining Amount", itemX, currentY);
    doc.text(remainingAmount.toFixed(2), amountX, currentY);
    currentY += 30;

    // Payment status
    doc.font("Helvetica-Bold");
    doc.text(`Payment Status: ${student.paymentStatus}`, itemX, currentY);
    currentY += 20;

    if (student.paymentDate) {
      doc.text(`Last Payment Date: ${new Date(student.paymentDate).toLocaleDateString()}`, itemX, currentY);
    }

    doc.moveDown();
    doc.moveDown();

    // Terms
    doc.font("Helvetica-Bold").text("Terms & Conditions:");
    doc.font("Helvetica").fontSize(10);
    doc.text("1. This bill is generated for internship fee payment purposes.");
    doc.text("2. All payments are non-refundable.");
    doc.text("3. The internship duration is as mentioned above.");
    doc.text("4. For any queries, contact the administration.");
    doc.moveDown();
    doc.moveDown();

    // Signature
    doc.font("Helvetica-Bold").text("Authorized Signature", 400, doc.y);
    doc.moveDown();
    doc.text("_________________________", 400, doc.y);

    // ✅ Proper close PDF stream
    doc.end();

  } catch (error) {
    console.error("❌ Error generating bill:", error);
    res.status(500).json({
      success: false,
      message: "Error generating bill",
      error: error.message
    });
  }
});

// ✅ NEW: Generate Bill Preview (Base64 for frontend preview)
router.get("/:id/generate-bill-preview", async (req, res) => {
  try {
    const { id } = req.params;
    
    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const totalAmount = Number(student.totalAmount) || 0;
    const advanceAmount = Number(student.advanceAmount) || 0;
    const remainingAmount = Number(student.remainingAmount) || (totalAmount - advanceAmount);

    const doc = new PDFDocument({ margin: 50 });
    
    // Collect PDF data as buffer
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      const base64Pdf = pdfData.toString('base64');
      
      res.json({
        success: true,
        billPreview: base64Pdf,
        message: "Bill preview generated successfully"
      });
    });

    // Title
    doc.fontSize(20).font("Helvetica-Bold").text("INTERNSHIP FEE BILL - PREVIEW", { align: "center" });
    doc.moveDown();

    // Company details
    doc.fontSize(12).font("Helvetica-Bold").text("Issued By:");
    doc.font("Helvetica").text("RORIRI SOFTWARE SOLUTIONS PVT LTD");
    doc.text("Company Address Line 1");
    doc.text("Company Address Line 2");
    doc.text("Phone: +91 XXXXXXXXXX | Email: company@example.com");
    doc.moveDown();

    // Bill details
    doc.font("Helvetica-Bold").text(`Bill No: BILL-${student.id}-${Date.now()}`);
    doc.text(`Bill Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // Student details
    doc.font("Helvetica-Bold").text("Student Details:");
    doc.font("Helvetica");
    doc.text(`Student ID: ${student.id}`);
    doc.text(`Name: ${student.name}`);
    doc.text(`Email: ${student.email}`);
    doc.text(`Phone: ${student.phone || "N/A"}`);
    doc.text(`College: ${student.college}`);
    doc.text(`Department: ${student.department}`);
    doc.text(`Internship Type: ${student.internshipType}`);
    doc.text(`Duration: ${student.duration} Month${student.duration > 1 ? "s" : ""}`);
    doc.moveDown();

    // Payment summary
    doc.font("Helvetica-Bold").text("Payment Summary:");
    doc.font("Helvetica");

    const itemX = 50;
    const amountX = 400;
    let currentY = doc.y + 10;

    doc.font("Helvetica-Bold");
    doc.text("Description", itemX, currentY);
    doc.text("Amount (₹)", amountX, currentY);
    currentY += 20;

    doc.font("Helvetica");
    doc.text("Total Internship Fee", itemX, currentY);
    doc.text(totalAmount.toFixed(2), amountX, currentY);
    currentY += 20;

    doc.text("Advance Amount Paid", itemX, currentY);
    doc.text(advanceAmount.toFixed(2), amountX, currentY);
    currentY += 20;

    doc.text("Remaining Amount", itemX, currentY);
    doc.text(remainingAmount.toFixed(2), amountX, currentY);
    currentY += 30;

    // Payment status
    doc.font("Helvetica-Bold");
    doc.text(`Payment Status: ${student.paymentStatus}`, itemX, currentY);
    
    doc.moveDown();
    doc.moveDown();

    // Preview watermark
    doc.fontSize(60).fillColor('lightgray').text("PREVIEW", 50, 300, {
      opacity: 0.3,
      align: 'center'
    });

    doc.end();

  } catch (error) {
    console.error("❌ Error generating bill preview:", error);
    res.status(500).json({
      success: false,
      message: "Error generating bill preview",
      error: error.message
    });
  }
});

// ✅ NEW: Send Offer Letter Email
router.post("/send-offer", async (req, res) => {
  try {
    const { studentId } = req.body;
    
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: student.email,
      subject: 'Internship Offer Letter - RORIRI SOFTWARE SOLUTIONS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Congratulations ${student.name}!</h2>
          <p>We are pleased to offer you an internship position at RORIRI SOFTWARE SOLUTIONS PVT LTD.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151;">Internship Details:</h3>
            <p><strong>Department:</strong> ${student.department}</p>
            <p><strong>Duration:</strong> ${student.duration} Month${student.duration > 1 ? 's' : ''}</p>
            <p><strong>Start Date:</strong> ${new Date(student.startDate).toLocaleDateString()}</p>
            <p><strong>End Date:</strong> ${new Date(student.endDate).toLocaleDateString()}</p>
            <p><strong>Stipend Type:</strong> ${student.stipendType}</p>
            ${student.stipendType === 'Paid' ? `<p><strong>Stipend Amount:</strong> ₹${student.stipendAmount}</p>` : ''}
          </div>

          <p>Please find your official offer letter attached with this email.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
            <p><strong>Best Regards,</strong><br>
            HR Department<br>
            RORIRI SOFTWARE SOLUTIONS PVT LTD<br>
            Email: hr@roririsolutions.com<br>
            Phone: +91 XXXXXXXXXX</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    // Update student record
    await student.update({ offerSent: true, offerSentAt: new Date() });

    res.json({
      success: true,
      message: "Offer letter sent successfully to " + student.email,
      student: student
    });

  } catch (error) {
    console.error("❌ Error sending offer letter:", error);
    res.status(500).json({
      success: false,
      message: "Error sending offer letter",
      error: error.message
    });
  }
});

// ✅ NEW: Send Completion Certificate Email
router.post("/send-completion", async (req, res) => {
  try {
    const { studentId } = req.body;
    
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: student.email,
      subject: 'Internship Completion Certificate - RORIRI SOFTWARE SOLUTIONS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Congratulations ${student.name}!</h2>
          <p>Congratulations on successfully completing your internship at RORIRI SOFTWARE SOLUTIONS PVT LTD.</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #065f46;">Internship Completion Details:</h3>
            <p><strong>Department:</strong> ${student.department}</p>
            <p><strong>Duration:</strong> ${student.duration} Month${student.duration > 1 ? 's' : ''}</p>
            <p><strong>Completion Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Performance:</strong> Excellent</p>
          </div>

          <p>Your completion certificate is attached with this email. We wish you the best for your future endeavors!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #d1fae5;">
            <p><strong>Best Regards,</strong><br>
            HR Department<br>
            RORIRI SOFTWARE SOLUTIONS PVT LTD<br>
            Email: hr@roririsolutions.com<br>
            Phone: +91 XXXXXXXXXX</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    // Update student record
    await student.update({ 
      completionSent: true, 
      completionSentAt: new Date(),
      internshipStatus: "Completed" 
    });

    res.json({
      success: true,
      message: "Completion certificate sent successfully to " + student.email,
      student: student
    });

  } catch (error) {
    console.error("❌ Error sending completion certificate:", error);
    res.status(500).json({
      success: false,
      message: "Error sending completion certificate",
      error: error.message
    });
  }
});

// ✅ NEW: Send Bill Email
router.post("/send-bill", async (req, res) => {
  try {
    const { studentId } = req.body;
    
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const transporter = createTransporter();

    const totalAmount = Number(student.totalAmount) || 0;
    const advanceAmount = Number(student.advanceAmount) || 0;
    const remainingAmount = Number(student.remainingAmount) || (totalAmount - advanceAmount);

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: student.email,
      subject: 'Internship Fee Bill - RORIRI SOFTWARE SOLUTIONS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">Internship Fee Bill</h2>
          <p>Dear ${student.name},</p>
          <p>Please find your internship fee bill attached with this email.</p>
          
          <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #5b21b6;">Payment Summary:</h3>
            <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
            <p><strong>Advance Paid:</strong> ₹${advanceAmount}</p>
            <p><strong>Remaining Amount:</strong> ₹${remainingAmount}</p>
            <p><strong>Payment Status:</strong> ${student.paymentStatus}</p>
            <p><strong>Due Date:</strong> ${new Date(student.startDate).toLocaleDateString()}</p>
          </div>

          <p>Please complete the payment at your earliest convenience.</p>
          <p>For any queries regarding the bill, please contact our accounts department.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd6fe;">
            <p><strong>Accounts Department</strong><br>
            RORIRI SOFTWARE SOLUTIONS PVT LTD<br>
            Email: accounts@roririsolutions.com<br>
            Phone: +91 XXXXXXXXXX</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Bill sent successfully to " + student.email,
      student: student
    });

  } catch (error) {
    console.error("❌ Error sending bill:", error);
    res.status(500).json({
      success: false,
      message: "Error sending bill",
      error: error.message
    });
  }
});

// ✅ NEW: Generate PDF Preview for Offer/Completion
router.post("/generate-preview", async (req, res) => {
  try {
    const { studentId, type } = req.body; // type: 'offer' or 'completion'
    
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const doc = new PDFDocument({ margin: 50 });
    
    // Collect PDF data as buffer
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      const base64Pdf = pdfData.toString('base64');
      
      res.json({
        success: true,
        pdfData: base64Pdf,
        message: `${type === 'offer' ? 'Offer letter' : 'Completion certificate'} preview generated successfully`
      });
    });

    if (type === 'offer') {
      // Offer Letter Content
      doc.fontSize(20).font("Helvetica-Bold").text("INTERNSHIP OFFER LETTER", { align: "center" });
      doc.moveDown();
      
      doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
      doc.moveDown();
      
      doc.text(`To,`);
      doc.text(`${student.name}`);
      doc.text(`${student.email}`);
      doc.text(`${student.phone || 'N/A'}`);
      doc.moveDown();
      
      doc.text(`Dear ${student.name},`);
      doc.moveDown();
      
      doc.text(`We are pleased to offer you an internship position at RORIRI SOFTWARE SOLUTIONS PVT LTD.`);
      doc.moveDown();
      
      doc.font("Helvetica-Bold").text("Internship Details:");
      doc.font("Helvetica");
      doc.text(`• Department: ${student.department}`);
      doc.text(`• Duration: ${student.duration} Month${student.duration > 1 ? 's' : ''}`);
      doc.text(`• Start Date: ${new Date(student.startDate).toLocaleDateString()}`);
      doc.text(`• End Date: ${new Date(student.endDate).toLocaleDateString()}`);
      doc.text(`• Stipend Type: ${student.stipendType}`);
      if (student.stipendType === 'Paid') {
        doc.text(`• Stipend Amount: ₹${student.stipendAmount} per month`);
      }
      doc.moveDown();
      
      doc.text("We look forward to having you as part of our team.");
      doc.moveDown();
      doc.moveDown();
      
      doc.text("Sincerely,");
      doc.moveDown();
      doc.moveDown();
      doc.text("HR Manager");
      doc.text("RORIRI SOFTWARE SOLUTIONS PVT LTD");
      
    } else if (type === 'completion') {
      // Completion Certificate Content
      doc.fontSize(24).font("Helvetica-Bold").text("INTERNSHIP COMPLETION CERTIFICATE", { align: "center" });
      doc.moveDown();
      
      doc.fontSize(16).text("This is to certify that", { align: "center" });
      doc.moveDown();
      
      doc.fontSize(20).font("Helvetica-Bold").text(student.name, { align: "center" });
      doc.moveDown();
      
      doc.fontSize(14).text(`has successfully completed ${student.duration} month${student.duration > 1 ? 's' : ''} internship in`, { align: "center" });
      doc.moveDown();
      
      doc.fontSize(18).font("Helvetica-Bold").text(student.department, { align: "center" });
      doc.moveDown();
      
      doc.fontSize(14).text(`at RORIRI SOFTWARE SOLUTIONS PVT LTD from ${new Date(student.startDate).toLocaleDateString()} to ${new Date(student.endDate).toLocaleDateString()}.`, { align: "center" });
      doc.moveDown();
      doc.moveDown();
      doc.moveDown();
      
      doc.text("Date: " + new Date().toLocaleDateString());
      doc.moveDown();
      doc.moveDown();
      
      doc.text("_________________________");
      doc.text("Authorized Signature");
      doc.text("RORIRI SOFTWARE SOLUTIONS PVT LTD");
    }

    // Preview watermark
    doc.fontSize(60).fillColor('lightgray').text("PREVIEW", 50, 400, {
      opacity: 0.3,
      align: 'center'
    });

    doc.end();

  } catch (error) {
    console.error("❌ Error generating PDF preview:", error);
    res.status(500).json({
      success: false,
      message: "Error generating PDF preview",
      error: error.message
    });
  }
});

// ✅ NEW: Update Internship Status
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { internshipStatus } = req.body;

    console.log("🔄 Updating internship status for student:", id, "to:", internshipStatus);

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Validate internship status
    const validStatuses = ["Active", "Completed", "Discontinued"];
    if (!validStatuses.includes(internshipStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid internship status. Must be: Active, Completed, or Discontinued"
      });
    }

    await student.update({
      internshipStatus: internshipStatus
    });

    // Fetch updated student
    const updatedStudent = await Student.findByPk(id);

    res.json({
      success: true,
      message: `Internship status updated to ${internshipStatus} successfully`,
      student: updatedStudent
    });
  } catch (error) {
    console.error("❌ Error updating internship status:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating internship status",
      error: error.message
    });
  }
});

// ✅ FIXED: Approve student - Proper field mapping
// ✅ FIXED: Approve student - Ensure database is properly updated
router.put("/:id/approve", async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    console.log("Before approval - Student:", {
      id: student.id,
      is_approved: student.is_approved,
      paymentStatus: student.paymentStatus
    });

    // ✅ Use direct database field assignment
    student.isApproved = true;
student.payment_status = "Completed"; // this one works fine
await student.save();

    
    // ✅ Force save and wait for completion
    await student.save();

    // ✅ Alternative approach using direct SQL if needed
    // await Student.update(
    //   { 
    //     is_approved: true, 
    //     paymentStatus: "Completed",
    //     updatedAt: new Date()
    //   },
    //   { where: { id: req.params.id } }
    // );

    // ✅ Reload the student to get the updated data
    const updatedStudent = await Student.findByPk(req.params.id);

    console.log("After approval - Student:", {
      id: updatedStudent.id,
      is_approved: updatedStudent.is_approved,
      paymentStatus: updatedStudent.paymentStatus
    });

    res.json({
      success: true,
      message: "Student approved successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("❌ Error approving student:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ FIXED: Reject student - Properly update payment status
router.post("/:id/reject", async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    
    // Update both is_approved AND paymentStatus
    await student.update({ 
      paymentStatus: "Rejected", 
      is_approved: false 
    });
    
    // Fetch updated student
    const updatedStudent = await Student.findByPk(req.params.id);
    
    res.json({ 
      success: false,
      message: "Student rejected successfully", 
      student: updatedStudent
    });
  } catch (error) {
    console.error("❌ Error rejecting student:", error);
    res.status(500).json({ 
      success: false,
      message: "Error rejecting student", 
      error: error.message 
    });
  }
});

// ✅ ADDED: New endpoint for screenshot upload without ID in URL
router.post(
  "/upload-payment-screenshot",
  upload.single("screenshot"),
  handleMulterError,
  async (req, res) => {
    try {
      const { studentId } = req.body;
      
      if (!studentId) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          success: false, 
          message: "Student ID is required" 
        });
      }

      const student = await Student.findByPk(studentId);
      if (!student) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });
      }

      // Delete old file if exists
      if (student.paymentScreenshot && !student.paymentScreenshot.startsWith("data:")) {
        const oldPath = path.join(__dirname, "../uploads", student.paymentScreenshot);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await student.update({
        paymentScreenshot: req.file.filename,
        paymentDate: new Date(),
        paymentStatus: "Completed",
      });

      const screenshotUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

      res.json({
        success: true,
        message: "Payment screenshot uploaded successfully!",
        screenshotUrl,
        student: student
      });
    } catch (error) {
      console.error("❌ Screenshot upload error:", error);
      res.status(500).json({
        success: false,
        message: "Upload failed",
        error: error.message,
      });
    }
  }
);

// Upload screenshot (file) with ID in URL
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
      if (student.paymentScreenshot && !student.paymentScreenshot.startsWith("data:")) {
        const oldPath = path.join(__dirname, "../uploads", student.paymentScreenshot);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await student.update({
        paymentScreenshot: req.file.filename,
        paymentDate: new Date(),
        paymentStatus: "Completed",
      });

      const screenshotUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

      res.json({
        success: true,
        message: "Screenshot uploaded successfully!",
        screenshotUrl,
      });
    } catch (error) {
      console.error("❌ Screenshot upload error:", error);
      res.status(500).json({
        success: false,
        message: "Upload failed",
        error: error.message,
      });
    }
  }
);

// Get student by ID
router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Prepare screenshot URL if it's a filename (not base64)
    const screenshotUrl =
      student.paymentScreenshot && !student.paymentScreenshot.startsWith("data:")
        ? `${req.protocol}://${req.get("host")}/uploads/${student.paymentScreenshot}`
        : null;

    res.json({
      success: true,
      student: {
        ...student.dataValues,
        screenshotUrl,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching student:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching student",
      error: error.message,
    });
  }
});

// PUT update student with all fields
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      college,
      department,
      internshipType,
      duration,
      startDate,
      endDate,
      internshipStatus,
      stipendType,
      stipendAmount,
      paymentMode,
      totalAmount,
      advanceAmount,
      remainingAmount,
      razorpayTransactionId,
      senderUpiId,
      paymentScreenshot,
      reason,
      paymentStatus,
      is_approved
    } = req.body;

    console.log("📤 Updating student:", id, "with data:", {
      internshipType, duration, totalAmount, advanceAmount, remainingAmount, internshipStatus, is_approved
    });

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Calculate amounts properly for updates
    const durationFinal = duration ? parseInt(duration) : student.duration;
    let totalAmountFinal = student.totalAmount;
    let advanceAmountFinal = student.advanceAmount;
    let remainingAmountFinal = student.remainingAmount;

    if (internshipType === "unpaid" || student.internshipType === "unpaid") {
      // Calculate total amount
      if (totalAmount !== undefined && totalAmount !== null) {
        totalAmountFinal = parseFloat(totalAmount);
      } else if (duration !== undefined) {
        totalAmountFinal = durationFinal * 5000;
      }

      // Update advance amount
      if (advanceAmount !== undefined && advanceAmount !== null) {
        advanceAmountFinal = parseFloat(advanceAmount);
      }

      // Calculate remaining amount
      if (remainingAmount !== undefined && remainingAmount !== null) {
        remainingAmountFinal = parseFloat(remainingAmount);
      } else {
        remainingAmountFinal = Math.max(0, totalAmountFinal - advanceAmountFinal);
      }
    } else {
      // For paid internships, reset amounts
      totalAmountFinal = 0;
      advanceAmountFinal = 0;
      remainingAmountFinal = 0;
    }

    console.log("💰 FINAL Updated amounts:", {
      totalAmountFinal,
      advanceAmountFinal,
      remainingAmountFinal
    });

    const updateData = {
      name: name || student.name,
      email: email || student.email,
      phone: phone !== undefined ? phone : student.phone,
      college: college || student.college,
      department: department || student.department,
      internshipType: internshipType || student.internshipType,
      duration: durationFinal,
      startDate: startDate || student.startDate,
      endDate: endDate || student.endDate,
      internshipStatus: internshipStatus || student.internshipStatus,
      stipendType: stipendType || student.stipendType,
      stipendAmount: stipendType === "Paid" ? (stipendAmount ? parseFloat(stipendAmount) : 0) : null,
      paymentMode: (internshipType === "unpaid" || student.internshipType === "unpaid") ? paymentMode : null,
      totalAmount: totalAmountFinal,
      advanceAmount: advanceAmountFinal,
      remainingAmount: remainingAmountFinal,
      reason: reason || student.reason,
      paymentStatus: paymentStatus || student.paymentStatus,
      is_approved: is_approved !== undefined ? is_approved : student.is_approved
    };

    // Add conditional fields
    if (razorpayTransactionId !== undefined) {
      updateData.razorpayTransactionId = (internshipType === "unpaid" && paymentMode === "Online") ? razorpayTransactionId : null;
    }
    if (senderUpiId !== undefined) {
      updateData.senderUpiId = (internshipType === "unpaid" && paymentMode === "Online") ? senderUpiId : null;
    }
    if (paymentScreenshot !== undefined) {
      updateData.paymentScreenshot = paymentScreenshot;
    }

    console.log("🔄 Final update data:", updateData);

    await student.update(updateData);
    
    // Return the completely updated student
    const updatedStudent = await Student.findByPk(id);

    // If advance amount was changed and increased, create a payment record for the difference
    let adminCreatedPaymentId = null;
    try {
      if (advanceAmount !== undefined && advanceAmount !== null) {
        const oldAdvance = parseFloat(student.advanceAmount) || 0;
        const newAdvance = parseFloat(advanceAmountFinal || advanceAmount) || 0;
        const diff = newAdvance - oldAdvance;
        if (diff > 0) {
          console.log(`💳 Admin update created payment for student ${id}: ₹${diff}`);
          const paymentRecord = await Payment.create({
            studentId: id,
            amount: diff,
            method: paymentMode || student.paymentMode || 'Offline',
            razorpayPaymentId: razorpayTransactionId || null,
            notes: reason || null,
            createdAt: new Date()
          });
          adminCreatedPaymentId = paymentRecord.id;

          try {
            const invoice = await generateInvoice(updatedStudent, paymentRecord);
            if (invoice && invoice.filename) {
              await Payment.update({ invoicePath: invoice.filename }, { where: { id: paymentRecord.id } });
            }
          } catch (invErr) {
            console.error('Invoice generation failed for admin-created payment:', invErr.message);
          }
          console.log(`✅ Admin-created payment id: ${adminCreatedPaymentId}`);
        } else {
          console.log('ℹ️ No positive advance difference detected; skipping payment creation');
        }
      } else {
        console.log('ℹ️ advanceAmount not provided in admin update; no payment record created');
      }
    } catch (err) {
      console.error('Error creating payment record for admin update:', err.message);
    }
    
    res.json({
      success: true,
      message: "Student updated successfully",
      student: updatedStudent
    });
  } catch (error) {
    console.error("❌ Error updating student:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating student",
      error: error.message,
    });
  }
});

// Upload Base64 Screenshot
router.put("/:id/screenshot", async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    await student.update({
      paymentScreenshot: req.body.paymentScreenshot,
      paymentDate: new Date(),
      paymentStatus: "Completed",
    });

    res.json({ 
      success: true, 
      message: "Screenshot uploaded successfully", 
      student 
    });
  } catch (error) {
    console.error("❌ Screenshot upload error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error uploading screenshot", 
      error: error.message 
    });
  }
});

// Revoke approval
router.post("/:id/revoke", async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    
    await student.update({ 
      paymentStatus: "Pending", 
      is_approved: false 
    });
    
    res.json({ 
      success: true,
      message: "Approval revoked successfully", 
      student 
    });
  } catch (error) {
    console.error("❌ Error revoking approval:", error);
    res.status(500).json({ 
      success: false,
      message: "Error revoking approval", 
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
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Delete associated screenshot file if exists (and it's a filename, not base64)
    if (student.paymentScreenshot && !student.paymentScreenshot.startsWith("data:")) {
      const filePath = path.join(__dirname, "../uploads", student.paymentScreenshot);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete all associated payment records
    try {
      const { Payment } = require("../models");
      const payments = await Payment.findAll({ where: { studentId: id } });

      // Delete associated invoice files
      for (const payment of payments) {
        if (payment.invoicePath) {
          const invoicePath = path.join(__dirname, "../certificates", payment.invoicePath);
          if (fs.existsSync(invoicePath)) {
            fs.unlinkSync(invoicePath);
          }
        }
      }

      // Delete all payment records for this student
      await Payment.destroy({ where: { studentId: id } });
      console.log(`✅ Deleted ${payments.length} payment records for student ${id}`);
    } catch (paymentError) {
      console.error("❌ Error deleting payment records:", paymentError);
      // Continue with student deletion even if payment deletion fails
    }

    await student.destroy();

    res.json({
      success: true,
      message: "Student and associated payment history deleted successfully"
    });
  } catch (error) {
    console.error("❌ Error deleting student:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting student",
      error: error.message,
    });
  }
});

// Get payment summary
router.get("/:id/payment-summary", async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const paymentSummary = {
      totalAmount: student.totalAmount || 0,
      advanceAmount: student.advanceAmount || 0,
      remainingAmount: student.remainingAmount || 0,
      paymentStatus: student.paymentStatus,
      paymentMode: student.paymentMode,
      paymentDate: student.paymentDate,
      isPaid: student.remainingAmount === 0
    };

    res.json({
      success: true,
      paymentSummary
    });
  } catch (error) {
    console.error("❌ Error fetching payment summary:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payment summary",
      error: error.message
    });
  }
});

// ✅ NEW: Get dashboard statistics
router.get("/dashboard/stats", async (req, res) => {
  try {
    const totalStudents = await Student.count();
    const approvedStudents = await Student.count({ where: { is_approved: true } });
    const pendingStudents = await Student.count({ where: { is_approved: false } });
    const activeInternships = await Student.count({ where: { internshipStatus: "Active" } });
    const completedInternships = await Student.count({ where: { internshipStatus: "Completed" } });

    // Calculate total revenue from unpaid internships
    const unpaidStudents = await Student.findAll({ 
      where: { internshipType: "unpaid" },
      attributes: ['advanceAmount']
    });
    
    const totalRevenue = unpaidStudents.reduce((sum, student) => {
      return sum + (Number(student.advanceAmount) || 0);
    }, 0);

    res.json({
      success: true,
      stats: {
        totalStudents,
        approvedStudents,
        pendingStudents,
        activeInternships,
        completedInternships,
        totalRevenue
      }
    });
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message
    });
  }
});

module.exports = router;