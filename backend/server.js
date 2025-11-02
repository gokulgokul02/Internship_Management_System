// backend/server.js
/*
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { sequelize } = require("./config/db");

const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ Certificate Routes and Static Files
const certificateRoutes = require('./routes/certificates');
app.use('/api/certificates', certificateRoutes);
app.use('/certificates', express.static(path.join(__dirname, 'certificates')));

// ✅ Default Root Route
app.get("/", (req, res) => {
  res.send("API is running successfully ✅");
});

// ✅ Other Routes
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/register-student", require("./routes/studentRegistration")); // ✅ FIXED
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));

// ✅ Start Server
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");

    // ✅ IMPORTANT: Removed alter:true to prevent duplicate indexes & table corruption
    await sequelize.sync();
    console.log("✅ Models synced successfully.");

    app.listen(PORT, () =>
      console.log(`🚀 Server running at: http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ Server start error:", err);
    process.exit(1);
  }
};

start();
*/
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
app.use('/certificates', express.static(path.join(__dirname, 'certificates')));

// ✅ Certificate Routes
const certificateRoutes = require('./routes/certificates');
app.use('/api/certificates', certificateRoutes);

// ✅ Default Root Route
app.get("/", (req, res) => {
  res.send("API is running successfully ✅");
});

// ✅ Other Routes
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));

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

    // ✅ IMPORTANT: Removed alter:true to prevent duplicate indexes & table corruption
    await sequelize.sync();
    console.log("✅ Models synced successfully.");

    app.listen(PORT, () =>
      console.log(`🚀 Server running at: http://localhost:${PORT}`)
    );
    console.log("📁 Uploads directory ready:", uploadsDir);
    console.log("📁 Certificates directory ready:", path.join(__dirname, 'certificates'));
    console.log("💾 File upload limit: 50MB");
  } catch (err) {
    console.error("❌ Server start error:", err);
    process.exit(1);
  }
};

start();