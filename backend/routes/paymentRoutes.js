
/*
const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const util = require("util");
const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);
const { Student, Payment } = require("../models");
const generateInvoice = require("../utils/generateInvoice");
const sendEmail = require("../utils/sendEmail");

// ✅ Import Required Middleware
const { protect, requireAdmin } = require("../middleware/authMiddleware");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ✅ Create Razorpay Order - No authentication required for student registration
router.post("/create-order", async (req, res) => {
  try {
    const { studentId, amount, currency = "INR" } = req.body;

    console.log(`💰 Creating order for student ${studentId} with amount: ${amount}`);

    // ✅ Check if student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // ✅ Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid payment amount is required"
      });
    }

    // ✅ Razorpay order details
    const options = {
      amount: Number(amount) * 100, // Convert rupees to paise
      currency,
      receipt: `receipt_${studentId}_${Date.now()}`,
      notes: {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        department: student.department,
        paymentAmount: amount // Store the intended payment amount
      }
    };

    // ✅ Create order on Razorpay
    const order = await razorpay.orders.create(options);

    console.log(`✅ Order created: ${order.id} for amount: ${amount}`);

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      order,
      requestedAmount: amount
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

// ✅ Verify Payment - No authentication required
router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      studentId,
      senderUpiId,
      paidAmount // This should be the amount user intended to pay
    } = req.body;

    console.log(`🔍 Verifying payment for student ${studentId}`, {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      paidAmount: paidAmount
    });

    // ✅ Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !studentId) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification fields"
      });
    }

    // ✅ Check if student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // ✅ Generate expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    // ✅ Verify signature
    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed - Invalid signature"
      });
    }

    // ✅ Get the actual paid amount - PRIMARY METHOD: use request body (most reliable)
    let actualPaidAmount = 0;

    // ✅ Method 1: Use paidAmount from request body (frontend sends exact amount user intended to pay)
    if (paidAmount && parseFloat(paidAmount) > 0) {
      actualPaidAmount = parseFloat(paidAmount);
      console.log(`💰 PRIMARY: Using paidAmount from request body: ₹${actualPaidAmount}`);
    }

    // Method 2: Fallback - Fetch order details from Razorpay
    if (actualPaidAmount <= 0) {
      try {
        const order = await razorpay.orders.fetch(razorpay_order_id);
        actualPaidAmount = order.amount / 100; // Convert from paise to rupees
        console.log(`💰 FALLBACK: Using Razorpay order amount: ₹${actualPaidAmount}`);
      } catch (razorpayError) {
        console.error("❌ Error fetching order from Razorpay:", razorpayError);
      }
    }

    // Method 3: If still 0, use the order notes
    if (actualPaidAmount <= 0) {
      try {
        const order = await razorpay.orders.fetch(razorpay_order_id);
        if (order.notes && order.notes.paymentAmount) {
          actualPaidAmount = parseFloat(order.notes.paymentAmount);
          console.log(`💰 FALLBACK: Using order notes amount: ₹${actualPaidAmount}`);
        }
      } catch (error) {
        console.error("❌ Error fetching order notes:", error);
      }
    }

    // Final validation
    if (actualPaidAmount <= 0) {
      console.error("❌ Could not determine payment amount");
      return res.status(400).json({
        success: false,
        message: "Could not determine payment amount"
      });
    }

    console.log(`✅ FINAL AMOUNT TO RECORD IN DATABASE: ₹${actualPaidAmount}`);

    console.log(`💰 Final determined amount: ${actualPaidAmount}`);

    // ✅ Calculate new amounts based on ACTUAL paid amount
    const currentAdvance = parseFloat(student.advanceAmount) || 0;
    const currentRemaining = parseFloat(student.remainingAmount) || 0;
    const totalAmount = parseFloat(student.totalAmount) || 0;

    const newAdvance = currentAdvance + actualPaidAmount;
    const newRemaining = Math.max(0, totalAmount - newAdvance);
    
    // ✅ Determine payment status
    let paymentStatus = "Partially_Paid";
    if (newRemaining === 0) {
      paymentStatus = "Completed";
    } else if (actualPaidAmount > 0 && newRemaining > 0) {
      paymentStatus = "Partially_Paid";
    }

    console.log(`📊 Payment Calculation:
      Student: ${student.name} (${student.id})
      Total Amount: ${totalAmount}
      Previous Advance: ${currentAdvance}
      Current Payment: ${actualPaidAmount}
      New Advance: ${newAdvance}
      New Remaining: ${newRemaining}
      Status: ${paymentStatus}`);

    // ✅ Update student payment details
    const updateResult = await Student.update(
      {
        advanceAmount: newAdvance,
        remainingAmount: newRemaining,
        paymentStatus: paymentStatus,
        razorpayTransactionId: razorpay_payment_id,
        senderUpiId: senderUpiId || "Not Provided",
        paymentDate: new Date(),
        paymentMode: "Online",
        lastPaymentAmount: actualPaidAmount
      },
      { where: { id: studentId } }
    );

    // ✅ Create payment history record
    let paymentRecord = null;
    try {
      paymentRecord = await Payment.create({
        studentId: studentId,
        amount: actualPaidAmount,
        method: "Online",
        razorpayPaymentId: razorpay_payment_id,
        notes: null,
        createdAt: new Date() // Capture exact payment time
      });

      // Generate invoice PDF and store path
      try {
        const invoice = await generateInvoice(student, paymentRecord);
        if (invoice && invoice.filename) {
          await Payment.update(
            { invoicePath: invoice.filename },
            { where: { id: paymentRecord.id } }
          );
        }
      } catch (invErr) {
        console.error("Invoice generation failed:", invErr.message);
      }
    } catch (payErr) {
      console.error("Failed to create payment record:", payErr.message);
    }

    console.log(`✅ Database update result:`, updateResult);

    // ✅ Fetch updated student record
    const updatedStudent = await Student.findByPk(studentId, {
      attributes: { exclude: ['password'] }
    });

    return res.status(200).json({
      success: true,
      message: `Payment of ₹${actualPaidAmount} verified successfully`,
      paidAmount: actualPaidAmount,
      previousAdvance: currentAdvance,
      newAdvance: newAdvance,
      newRemaining: newRemaining,
      paymentStatus: paymentStatus,
      student: updatedStudent
    });

  } catch (error) {
    console.error("❌ Payment verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message
    });
  }
});

// ✅ Get payment status - Protected route (admin only)
router.get("/status/:studentId", protect, requireAdmin, async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.studentId, {
      attributes: [
        "id", 
        "name", 
        "paymentStatus", 
        "razorpayTransactionId", 
        "senderUpiId",
        "paymentDate",
        "paymentMode",
        "advanceAmount",
        "remainingAmount",
        "totalAmount",
        "lastPaymentAmount"
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

// ✅ Manual payment recording (for cash/advance payments)
router.post("/record-payment", protect, requireAdmin, async (req, res) => {
  try {
    const { studentId, amount, paymentMode, notes } = req.body;

    if (!studentId || !amount || !paymentMode) {
      return res.status(400).json({
        success: false,
        message: "Student ID, amount, and payment mode are required"
      });
    }

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount"
      });
    }

    // Calculate new amounts
    const currentAdvance = parseFloat(student.advanceAmount) || 0;
    const totalAmount = parseFloat(student.totalAmount) || 0;
    
    const newAdvance = currentAdvance + paymentAmount;
    const newRemaining = Math.max(0, totalAmount - newAdvance);
    
    let paymentStatus = "Partially_Paid";
    if (newRemaining === 0) {
      paymentStatus = "Completed";
    }

    // Update student record
    await Student.update(
      {
        advanceAmount: newAdvance,
        remainingAmount: newRemaining,
        paymentStatus: paymentStatus,
        paymentMode: paymentMode,
        paymentDate: new Date(),
        lastPaymentAmount: paymentAmount
      },
      { where: { id: studentId } }
    );

    const updatedStudent = await Student.findByPk(studentId);

    // Create payment history record and invoice with exact payment timestamp
    try {
      const paymentRecord = await Payment.create({
        studentId: studentId,
        amount: paymentAmount,
        method: paymentMode,
        notes: notes || null,
        createdAt: new Date() // Capture exact payment time
      });

      try {
        const invoice = await generateInvoice(updatedStudent, paymentRecord);
        if (invoice && invoice.filename) {
          await Payment.update({ invoicePath: invoice.filename }, { where: { id: paymentRecord.id } });
        }
      } catch (invErr) {
        console.error("Invoice generation failed:", invErr.message);
      }
    } catch (errCreate) {
      console.error("Failed to create payment record:", errCreate.message);
    }

    res.json({
      success: true,
      message: `Payment of ₹${paymentAmount} recorded successfully`,
      paidAmount: paymentAmount,
      previousAdvance: currentAdvance,
      newAdvance: newAdvance,
      newRemaining: newRemaining,
      student: updatedStudent
    });

  } catch (error) {
    console.error("❌ Manual payment recording error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record payment",
      error: error.message
    });
  }
});

// ✅ Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Payment routes are working",
    timestamp: new Date().toISOString()
  });
});

// ✅ Get payment history for a student (admin only)
router.get("/student/:studentId", protect, requireAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findByPk(studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const history = await Payment.findAll({ where: { studentId }, order: [["createdAt", "DESC"]] });
    res.json({ success: true, history });
  } catch (err) {
    console.error("Error fetching payment history:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch payment history", error: err.message });
  }
});

// ✅ Download / Preview invoice for a payment (admin only)
// Returns the PDF binary with inline disposition so frontend can request as blob for preview
router.get("/download/:paymentId", protect, requireAdmin, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    if (!payment.invoicePath) return res.status(404).json({ success: false, message: "Invoice not generated" });

    const invoicePath = path.join(__dirname, "..", "assets", "invoices", payment.invoicePath);
    // Send as inline PDF so frontend can fetch it as a blob for preview (and browsers can open it inline)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${payment.invoicePath}"`);
    return res.sendFile(invoicePath);
  } catch (err) {
    console.error("Error downloading invoice:", err.message);
    res.status(500).json({ success: false, message: "Failed to download invoice", error: err.message });
  }
});

// ✅ Preview invoice for a payment (returns base64 PDF) - admin only
router.get("/preview/:paymentId", protect, requireAdmin, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    const student = await Student.findByPk(payment.studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    let invoiceFilename = payment.invoicePath;
    if (!invoiceFilename) {
      // generate invoice if missing
      const invoice = await generateInvoice(student, payment);
      if (invoice && invoice.filename) {
        invoiceFilename = invoice.filename;
        await Payment.update({ invoicePath: invoiceFilename }, { where: { id: payment.id } });
      } else {
        return res.status(404).json({ success: false, message: "Invoice not available" });
      }
    }

    const invoicePath = path.join(__dirname, "..", "assets", "invoices", invoiceFilename);
    const buffer = await readFile(invoicePath);
    const base64 = buffer.toString('base64');
    return res.json({ success: true, billPreview: base64, filename: invoiceFilename });
  } catch (err) {
    console.error("Error previewing invoice:", err.message);
    res.status(500).json({ success: false, message: "Failed to preview invoice", error: err.message });
  }
});

// ✅ Delete stored invoice file for a payment (admin only)
router.delete("/download/:paymentId", protect, requireAdmin, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    if (!payment.invoicePath) return res.status(400).json({ success: false, message: "No invoice file to delete" });

    const invoicePath = path.join(__dirname, "..", "assets", "invoices", payment.invoicePath);
    // remove file if exists
    try {
      await unlink(invoicePath);
    } catch (fsErr) {
      console.warn("Warning: could not delete invoice file", fsErr.message);
      // continue to clear DB record even if file missing
    }

    await Payment.update({ invoicePath: null }, { where: { id: payment.id } });

    res.json({ success: true, message: "Invoice file deleted and DB updated" });
  } catch (err) {
    console.error("Error deleting invoice file:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete invoice file", error: err.message });
  }
});

// ✅ Send invoice by email for a payment (admin only)
router.post("/send/:paymentId", protect, requireAdmin, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    const student = await Student.findByPk(payment.studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    let invoiceFilename = payment.invoicePath;
    if (!invoiceFilename) {
      // generate invoice
      const invoice = await generateInvoice(student, payment);
      if (invoice && invoice.filename) {
        invoiceFilename = invoice.filename;
        await Payment.update({ invoicePath: invoiceFilename }, { where: { id: payment.id } });
      }
    }

    const invoiceFilepath = path.join(__dirname, "..", "assets", "invoices", invoiceFilename);

    // send email
    const subject = `Payment Invoice - ${payment.id} - ${student.name}`;
    const text = `Dear ${student.name},\n\nPlease find attached the invoice for your recent payment of ₹${Number(payment.amount).toFixed(2)}.\n\nRegards`;

    await sendEmail(student.email, subject, text, [{ path: invoiceFilepath, filename: invoiceFilename }]);

    await Payment.update({ invoiceSent: true }, { where: { id: payment.id } });

    res.json({ success: true, message: "Invoice sent successfully" });
  } catch (err) {
    console.error("Error sending invoice:", err.message);
    res.status(500).json({ success: false, message: "Failed to send invoice", error: err.message });
  }
});

module.exports = router;*/


const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const util = require("util");
const { Op } = require("sequelize");
const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);
const { Student, Payment } = require("../models");
const generateInvoice = require("../utils/generateInvoice");
const sendEmail = require("../utils/sendEmail");

// ✅ Import Required Middleware
const { protect, requireAdmin } = require("../middleware/authMiddleware");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ✅ Create Razorpay Order
router.post("/create-order", async (req, res) => {
  try {
    const { studentId, amount, currency = "INR" } = req.body;

    console.log(`💰 Creating order for student ${studentId} with amount: ${amount}`);

    // ✅ Check if student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // ✅ Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid payment amount is required"
      });
    }

    // ✅ Razorpay order details
    const options = {
      amount: Math.round(Number(amount) * 100), // Convert rupees to paise
      currency,
      receipt: `receipt_${studentId}_${Date.now()}`,
      notes: {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        department: student.department,
        paymentAmount: amount
      }
    };

    // ✅ Create order on Razorpay
    const order = await razorpay.orders.create(options);

    console.log(`✅ Order created: ${order.id} for amount: ${amount}`);

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      order,
      requestedAmount: amount
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

// ✅ Verify Payment - COMPLETELY FIXED DUPLICATION
router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      studentId,
      senderUpiId,
      paidAmount
    } = req.body;

    console.log(`🔍 Verifying payment for student ${studentId}`, {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      paidAmount: paidAmount
    });

    // ✅ Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !studentId) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification fields"
      });
    }

    // ✅ Check if student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // ✅ CRITICAL FIX: Check if payment already exists for this Razorpay payment ID
    const existingPayment = await Payment.findOne({
      where: { 
        [Op.or]: [
          { razorpayPaymentId: razorpay_payment_id },
          { 
            studentId: studentId,
            amount: paidAmount ? parseFloat(paidAmount) : 0,
            method: 'Online',
            createdAt: {
              [Op.gte]: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
            }
          }
        ]
      }
    });

    if (existingPayment) {
      console.log(`⚠️ Payment already recorded: ${existingPayment.id}`);
      console.log(`   Razorpay ID: ${existingPayment.razorpayPaymentId}`);
      console.log(`   Amount: ${existingPayment.amount}`);
      console.log(`   Created: ${existingPayment.createdAt}`);
      
      const updatedStudent = await Student.findByPk(studentId);
      return res.status(200).json({
        success: true,
        message: `Payment of ₹${existingPayment.amount} was already processed successfully`,
        paidAmount: existingPayment.amount,
        previousAdvance: student.advanceAmount,
        newAdvance: updatedStudent.advanceAmount,
        newRemaining: updatedStudent.remainingAmount,
        paymentStatus: updatedStudent.paymentStatus,
        student: updatedStudent,
        alreadyProcessed: true,
        existingPaymentId: existingPayment.id
      });
    }

    // ✅ Generate expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    // ✅ Verify signature
    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed - Invalid signature"
      });
    }

    // ✅ Determine the actual paid amount
    let actualPaidAmount = 0;

    // Method 1: Use paidAmount from request body
    if (paidAmount && parseFloat(paidAmount) > 0) {
      actualPaidAmount = parseFloat(paidAmount);
      console.log(`💰 Using paidAmount from request: ₹${actualPaidAmount}`);
    }

    // Method 2: Fallback to Razorpay order amount
    if (actualPaidAmount <= 0) {
      try {
        const order = await razorpay.orders.fetch(razorpay_order_id);
        actualPaidAmount = order.amount / 100;
        console.log(`💰 Using Razorpay order amount: ₹${actualPaidAmount}`);
      } catch (razorpayError) {
        console.error("❌ Error fetching order from Razorpay:", razorpayError);
      }
    }

    // Final validation
    if (actualPaidAmount <= 0) {
      console.error("❌ Could not determine payment amount");
      return res.status(400).json({
        success: false,
        message: "Could not determine payment amount"
      });
    }

    console.log(`✅ FINAL AMOUNT: ₹${actualPaidAmount}`);

    // ✅ Calculate new amounts
    const currentAdvance = parseFloat(student.advanceAmount) || 0;
    const currentRemaining = parseFloat(student.remainingAmount) || 0;
    const totalAmount = parseFloat(student.totalAmount) || 0;

    const newAdvance = currentAdvance + actualPaidAmount;
    const newRemaining = Math.max(0, totalAmount - newAdvance);
    
    // ✅ Determine payment status
    let paymentStatus = student.paymentStatus;
    if (newRemaining === 0) {
      paymentStatus = "Completed";
    } else if (actualPaidAmount > 0) {
      paymentStatus = "Partially_Paid";
    }

    console.log(`📊 Payment Calculation:
      Previous Advance: ${currentAdvance}
      Current Payment: ${actualPaidAmount}
      New Advance: ${newAdvance}
      New Remaining: ${newRemaining}
      Status: ${paymentStatus}`);

    // ✅ Update student record
    await Student.update(
      {
        advanceAmount: newAdvance,
        remainingAmount: newRemaining,
        paymentStatus: paymentStatus,
        razorpayTransactionId: razorpay_payment_id,
        senderUpiId: senderUpiId || null,
        paymentDate: new Date(),
        paymentMode: "Online"
      },
      { where: { id: studentId } }
    );

    // ✅ Create SINGLE payment record
    const paymentRecord = await Payment.create({
      studentId: studentId,
      amount: actualPaidAmount,
      method: "Online",
      razorpayPaymentId: razorpay_payment_id,
      notes: `Razorpay Payment - Order: ${razorpay_order_id}`,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`✅ Payment record created: ${paymentRecord.id}`);

    // ✅ Generate invoice
    try {
      const updatedStudent = await Student.findByPk(studentId);
      const invoice = await generateInvoice(updatedStudent, paymentRecord);
      if (invoice && invoice.filename) {
        await Payment.update(
          { invoicePath: invoice.filename },
          { where: { id: paymentRecord.id } }
        );
        console.log(`✅ Invoice generated: ${invoice.filename}`);
      }
    } catch (invErr) {
      console.error("Invoice generation failed:", invErr.message);
    }

    // ✅ Fetch updated student
    const updatedStudent = await Student.findByPk(studentId, {
      attributes: { exclude: ['password'] }
    });

    return res.status(200).json({
      success: true,
      message: `Payment of ₹${actualPaidAmount} verified successfully`,
      paidAmount: actualPaidAmount,
      previousAdvance: currentAdvance,
      newAdvance: newAdvance,
      newRemaining: newRemaining,
      paymentStatus: paymentStatus,
      student: updatedStudent,
      paymentId: paymentRecord.id
    });

  } catch (error) {
    console.error("❌ Payment verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message
    });
  }
});

// ✅ Get payment status
router.get("/status/:studentId", protect, requireAdmin, async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.studentId, {
      attributes: [
        "id", "name", "paymentStatus", "razorpayTransactionId", "senderUpiId",
        "paymentDate", "paymentMode", "advanceAmount", "remainingAmount", "totalAmount"
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

// ✅ Manual payment recording - FIXED
router.post("/record-payment", protect, requireAdmin, async (req, res) => {
  try {
    const { studentId, amount, paymentMode, notes } = req.body;

    if (!studentId || !amount || !paymentMode) {
      return res.status(400).json({
        success: false,
        message: "Student ID, amount, and payment mode are required"
      });
    }

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount"
      });
    }

    // Calculate new amounts
    const currentAdvance = parseFloat(student.advanceAmount) || 0;
    const totalAmount = parseFloat(student.totalAmount) || 0;
    
    const newAdvance = currentAdvance + paymentAmount;
    const newRemaining = Math.max(0, totalAmount - newAdvance);
    
    let paymentStatus = student.paymentStatus;
    if (newRemaining === 0) {
      paymentStatus = "Completed";
    } else if (paymentAmount > 0) {
      paymentStatus = "Partially_Paid";
    }

    // Update student record
    await Student.update(
      {
        advanceAmount: newAdvance,
        remainingAmount: newRemaining,
        paymentStatus: paymentStatus,
        paymentDate: new Date()
      },
      { where: { id: studentId } }
    );

    const updatedStudent = await Student.findByPk(studentId);

    // Create payment record
    const paymentRecord = await Payment.create({
      studentId: studentId,
      amount: paymentAmount,
      method: paymentMode,
      notes: notes || `Manual payment recorded by admin`,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`✅ Manual payment recorded: ${paymentRecord.id}`);

    // Generate invoice
    try {
      const invoice = await generateInvoice(updatedStudent, paymentRecord);
      if (invoice && invoice.filename) {
        await Payment.update({ invoicePath: invoice.filename }, { where: { id: paymentRecord.id } });
      }
    } catch (invErr) {
      console.error("Invoice generation failed:", invErr.message);
    }

    res.json({
      success: true,
      message: `Payment of ₹${paymentAmount} recorded successfully`,
      paidAmount: paymentAmount,
      previousAdvance: currentAdvance,
      newAdvance: newAdvance,
      newRemaining: newRemaining,
      student: updatedStudent,
      paymentId: paymentRecord.id
    });

  } catch (error) {
    console.error("❌ Manual payment recording error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record payment",
      error: error.message
    });
  }
});

// ✅ Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Payment routes are working",
    timestamp: new Date().toISOString()
  });
});

// ✅ Get payment history for a student
router.get("/student/:studentId", protect, requireAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findByPk(studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const history = await Payment.findAll({ 
      where: { studentId }, 
      order: [["createdAt", "DESC"]] 
    });
    
    res.json({ 
      success: true, 
      history,
      totalPayments: history.length,
      totalAmount: history.reduce((sum, payment) => sum + parseFloat(payment.amount), 0)
    });
  } catch (err) {
    console.error("Error fetching payment history:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch payment history", error: err.message });
  }
});

// ✅ Download / Preview invoice for a payment (admin only)
router.get("/download/:paymentId", protect, requireAdmin, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    if (!payment.invoicePath) return res.status(404).json({ success: false, message: "Invoice not generated" });

    const invoicePath = path.join(__dirname, "..", "assets", "invoices", payment.invoicePath);
    
    // Check if file exists
    if (!fs.existsSync(invoicePath)) {
      return res.status(404).json({ success: false, message: "Invoice file not found" });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${payment.invoicePath}"`);
    return res.sendFile(invoicePath);
  } catch (err) {
    console.error("Error downloading invoice:", err.message);
    res.status(500).json({ success: false, message: "Failed to download invoice", error: err.message });
  }
});

// ✅ Preview invoice for a payment (returns base64 PDF) - admin only
router.get("/preview/:paymentId", protect, requireAdmin, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    const student = await Student.findByPk(payment.studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    let invoiceFilename = payment.invoicePath;
    if (!invoiceFilename) {
      // generate invoice if missing
      const invoice = await generateInvoice(student, payment);
      if (invoice && invoice.filename) {
        invoiceFilename = invoice.filename;
        await Payment.update({ invoicePath: invoiceFilename }, { where: { id: payment.id } });
      } else {
        return res.status(404).json({ success: false, message: "Invoice not available" });
      }
    }

    const invoicePath = path.join(__dirname, "..", "assets", "invoices", invoiceFilename);
    
    // Check if file exists
    if (!fs.existsSync(invoicePath)) {
      // Regenerate if file missing
      const invoice = await generateInvoice(student, payment);
      if (invoice && invoice.filename) {
        invoiceFilename = invoice.filename;
        await Payment.update({ invoicePath: invoiceFilename }, { where: { id: payment.id } });
      } else {
        return res.status(404).json({ success: false, message: "Invoice file not found" });
      }
    }

    const buffer = await readFile(invoicePath);
    const base64 = buffer.toString('base64');
    return res.json({ success: true, billPreview: base64, filename: invoiceFilename });
  } catch (err) {
    console.error("Error previewing invoice:", err.message);
    res.status(500).json({ success: false, message: "Failed to preview invoice", error: err.message });
  }
});

// ✅ Delete stored invoice file for a payment (admin only)
router.delete("/download/:paymentId", protect, requireAdmin, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    if (!payment.invoicePath) return res.status(400).json({ success: false, message: "No invoice file to delete" });

    const invoicePath = path.join(__dirname, "..", "assets", "invoices", payment.invoicePath);
    
    try {
      await unlink(invoicePath);
    } catch (fsErr) {
      console.warn("Warning: could not delete invoice file", fsErr.message);
    }

    await Payment.update({ invoicePath: null }, { where: { id: payment.id } });

    res.json({ success: true, message: "Invoice file deleted and DB updated" });
  } catch (err) {
    console.error("Error deleting invoice file:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete invoice file", error: err.message });
  }
});

// ✅ Send invoice by email for a payment (admin only)
router.post("/send/:paymentId", protect, requireAdmin, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    const student = await Student.findByPk(payment.studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    let invoiceFilename = payment.invoicePath;
    if (!invoiceFilename) {
      // generate invoice
      const invoice = await generateInvoice(student, payment);
      if (invoice && invoice.filename) {
        invoiceFilename = invoice.filename;
        await Payment.update({ invoicePath: invoiceFilename }, { where: { id: payment.id } });
      } else {
        return res.status(400).json({ success: false, message: "Could not generate invoice" });
      }
    }

    const invoiceFilepath = path.join(__dirname, "..", "assets", "invoices", invoiceFilename);

    // Check if file exists
    if (!fs.existsSync(invoiceFilepath)) {
      // Regenerate if missing
      const invoice = await generateInvoice(student, payment);
      if (invoice && invoice.filename) {
        invoiceFilename = invoice.filename;
        await Payment.update({ invoicePath: invoiceFilename }, { where: { id: payment.id } });
      } else {
        return res.status(400).json({ success: false, message: "Invoice file not found" });
      }
    }

    // send email
    const subject = `Payment Invoice - ${payment.id} - ${student.name}`;
    const text = `Dear ${student.name},\n\nPlease find attached the invoice for your recent payment of ₹${Number(payment.amount).toFixed(2)}.\n\nRegards`;

    await sendEmail(student.email, subject, text, [{ path: invoiceFilepath, filename: invoiceFilename }]);

    await Payment.update({ invoiceSent: true }, { where: { id: payment.id } });

    res.json({ success: true, message: "Invoice sent successfully" });
  } catch (err) {
    console.error("Error sending invoice:", err.message);
    res.status(500).json({ success: false, message: "Failed to send invoice", error: err.message });
  }
});

// ✅ Debug endpoint to check for duplicate payments
router.get("/debug/duplicates/:studentId", protect, requireAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const payments = await Payment.findAll({
      where: { studentId },
      order: [["createdAt", "ASC"]]
    });

    // Find potential duplicates
    const duplicates = [];
    const seen = new Map();

    payments.forEach(payment => {
      const key = `${payment.amount}-${payment.method}-${payment.razorpayPaymentId}`;
      if (seen.has(key)) {
        duplicates.push({
          original: seen.get(key),
          duplicate: payment
        });
      } else {
        seen.set(key, payment);
      }
    });

    res.json({
      success: true,
      totalPayments: payments.length,
      duplicates: duplicates,
      payments: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        razorpayPaymentId: p.razorpayPaymentId,
        createdAt: p.createdAt,
        notes: p.notes
      }))
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ success: false, message: "Debug error", error: error.message });
  }
});

module.exports = router;