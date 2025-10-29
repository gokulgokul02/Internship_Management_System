// backend/config/db.js
const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
  }
);

// test connection & sync models if run directly
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL connected");
    // Optionally sync (creates tables)
    await sequelize.sync({ alter: true }); // use { force: true } to drop & recreate
    console.log("Sequelize models synced");
  } catch (err) {
    console.error("DB connection failed:", err);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
