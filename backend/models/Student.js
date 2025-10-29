// backend/models/Student.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Student = sequelize.define("Student", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  college: { type: DataTypes.STRING },
  department: { type: DataTypes.STRING },
  startDate: { type: DataTypes.DATEONLY },
  endDate: { type: DataTypes.DATEONLY },
  offerSent: { type: DataTypes.BOOLEAN, defaultValue: false },
  completionSent: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "students",
  timestamps: true
});

module.exports = Student;
