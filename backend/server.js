// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { sequelize } = require("./config/db");

// ✅ Initialize app FIRST
const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ Certificate Routes and Static Folder
const certificateRoutes = require('./routes/certificates');
app.use('/api/certificates', certificateRoutes);
app.use('/certificates', express.static(path.join(__dirname, 'certificates')));

// ✅ Default route
app.get("/", (req, res) => {
  res.send("API is running successfully ✅");
});

// Other Routes
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));



// Start Server
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connected");

    await sequelize.sync({ alter: true });
    console.log("✅ Models synced");

    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ Server start error:", err);
    process.exit(1);
  }
};

start();
