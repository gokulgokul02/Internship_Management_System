const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const InternshipType = sequelize.define("InternshipType", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  FormType: {
    type: DataTypes.ENUM("paid", "unpaid"),
    allowNull: false,
    defaultValue: "unpaid",
    field: "FormType", // ✅ Exact DB column name
  },

}, {
  tableName: "internship_types",
  timestamps: true,
  underscored: false, // ✅ This prevents Sequelize from converting updatedAt → updated_at
});

module.exports = InternshipType;
