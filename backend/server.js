// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { sequelize } = require("./config/db");

const app = express();

// ✅ Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory:', uploadsDir);
}

// ✅ Middlewares with increased payload limits
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅ Static file serving
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/certificates", express.static(path.join(__dirname, "certificates")));

// ✅ Import Routes
const certificateRoutes = require("./routes/certificates");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// ✅ NEW: Internship Type Route
const internshipTypeRoutes = require("./routes/internshipTypeRoutes");

// ✅ Use Routes
app.use("/api/certificates", certificateRoutes);
app.use("/api", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/payments", paymentRoutes);

// ✅ Register InternshipType Routes
app.use("/api", internshipTypeRoutes);   // <-- IMPORTANT

// ✅ Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: error.message
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");

    // Do model sync (no alter:true)
    await sequelize.sync();
    console.log("✅ Models synced successfully.");

    app.listen(PORT, () => {
      console.log(`🚀 Server running at: http://localhost:${PORT}`);
    });

    console.log("📁 Uploads directory ready:", uploadsDir);
  } catch (err) {
    console.error("❌ Server start error:", err);
    process.exit(1);
  }
};

start();
