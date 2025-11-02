// backend/models/Admin.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Admin = sequelize.define("Admin", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  type: { 
    type: DataTypes.ENUM('SUPER_ADMIN', 'ADMIN'),
    allowNull: false,
    defaultValue: 'ADMIN'
  }
}, {
  tableName: "admins",
  timestamps: true
});

module.exports = Admin;