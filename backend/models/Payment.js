const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.STRING(5),
      allowNull: false,
      field: "student_id",
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    method: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Online",
    },
    razorpayPaymentId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "razorpay_payment_id",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    invoicePath: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "invoice_path",
    },
    invoiceSent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "invoice_sent",
    },
  },
  {
    tableName: "payments",
    timestamps: true,
  }
);

module.exports = Payment;
