// backend/routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { Student } = require("../models");

// ✅ Import Required Middleware
const { protect, requireAdmin } = require("../middleware/authMiddleware");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ✅ REMOVED global middleware - Apply middleware per route instead

// Create Razorpay Order - No authentication required for student registration
router.post("/create-order", async (req, res) => {
  try {
    const { studentId, amount = 50000, currency = "INR" } = req.body;

    // ✅ Check if student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // ✅ Razorpay order details
    const options = {
      amount: Number(amount), // Amount in paise
      currency,
      receipt: `receipt_${studentId}_${Date.now()}`,
      notes: {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        department: student.department
      }
    };

    // ✅ Create order on Razorpay
    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      order
    });

  } catch (error) {
    console.error("❌ Razorpay order creation error:", error);

    return res.status(500).json({
      success: false,
      message: "Payment initialization failed",
      error: error.message
    });
  }
});

// Verify payment signature & update DB - No authentication required
router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      studentId,
      senderUpiId // ✅ Added senderUpiId
    } = req.body;

    // ✅ Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !studentId) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification fields"
      });
    }

    // ✅ Validate senderUpiId if provided
    if (senderUpiId && typeof senderUpiId !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Invalid sender UPI ID format"
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await Student.update(
        { 
          paymentStatus: "Failed",
          razorpayTransactionId: razorpay_payment_id,
          senderUpiId: senderUpiId || null // ✅ Store UPI ID even for failed payments
        }, 
        { where: { id: studentId } }
      );
      return res.status(400).json({ 
        success: false, 
        message: "Invalid payment signature" 
      });
    }

    // ✅ Update student payment details with senderUpiId
    await Student.update(
      {
        paymentStatus: "Completed",
        razorpayTransactionId: razorpay_payment_id,
        senderUpiId: senderUpiId || null, // ✅ Store sender UPI ID
        paymentDate: new Date(),
        paymentMode: "Online" // ✅ Set payment mode to Online
      },
      { where: { id: studentId } }
    );

    const updatedStudent = await Student.findByPk(studentId, {
      attributes: { exclude: ['password'] } // Don't send password back
    });

    res.json({
      success: true,
      message: "Payment verified successfully",
      paymentId: razorpay_payment_id,
      upiId: senderUpiId, // ✅ Return UPI ID in response
      student: updatedStudent
    });

  } catch (error) {
    console.error("❌ Payment verification error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Payment verification failed",
      error: error.message 
    });
  }
});

// Get payment status - Protected route (admin only)
router.get("/status/:studentId", protect, requireAdmin, async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.studentId, {
      attributes: [
        "id", 
        "name", 
        "paymentStatus", 
        "razorpayTransactionId", 
        "senderUpiId", // ✅ Include senderUpiId in response
        "paymentDate",
        "paymentMode"
      ]
    });

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: "Student not found" 
      });
    }

    res.json({ 
      success: true, 
      paymentStatus: student.paymentStatus, 
      student 
    });

  } catch (error) {
    console.error("❌ Payment status error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching payment status",
      error: error.message
    });
  }
});

// ✅ Update student payment details manually (admin only) - INCLUDES senderUpiId
router.put("/update-payment/:studentId", protect, requireAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { 
      razorpayTransactionId, 
      senderUpiId, // ✅ Include senderUpiId
      paymentStatus, 
      paymentDate,
      paymentMode 
    } = req.body;

    // Check if student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Prepare update data
    const updateData = {};
    if (razorpayTransactionId) updateData.razorpayTransactionId = razorpayTransactionId;
    if (senderUpiId) updateData.senderUpiId = senderUpiId; // ✅ Update senderUpiId
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (paymentDate) updateData.paymentDate = paymentDate;
    if (paymentMode) updateData.paymentMode = paymentMode;

    await Student.update(updateData, { where: { id: studentId } });

    const updatedStudent = await Student.findByPk(studentId, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: "Payment details updated successfully",
      student: updatedStudent
    });

  } catch (error) {
    console.error("❌ Update payment details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment details",
      error: error.message
    });
  }
});

// ✅ Get all payment details for admin dashboard
router.get("/all-payments", protect, requireAdmin, async (req, res) => {
  try {
    const students = await Student.findAll({
      where: {
        paymentStatus: ["Completed", "Pending", "Failed"]
      },
      attributes: [
        "id",
        "name",
        "email",
        "paymentStatus",
        "razorpayTransactionId",
        "senderUpiId", // ✅ Include senderUpiId
        "paymentDate",
        "paymentMode",
        "stipendType",
        "stipendAmount"
      ],
      order: [['paymentDate', 'DESC']]
    });

    res.json({
      success: true,
      count: students.length,
      payments: students
    });

  } catch (error) {
    console.error("❌ Get all payments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
      error: error.message
    });
  }
});

// ✅ Add a health check endpoint for payment routes
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Payment routes are working",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;