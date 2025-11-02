// backend/models/Student.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

// Function to generate 5-char alphanumeric student ID
function generateStudentId() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let i = 0; i < 5; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return id;
}

const Student = sequelize.define("Student", {
  id: {
    type: DataTypes.STRING(5),
    primaryKey: true,
    allowNull: false,
  },

  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  college: { type: DataTypes.STRING },
  department: { type: DataTypes.STRING },

  startDate: { type: DataTypes.DATEONLY },
  endDate: { type: DataTypes.DATEONLY },

  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  stipendType: {
    type: DataTypes.ENUM("Paid", "Unpaid"),
    allowNull: false,
    defaultValue: "Unpaid",
  },

  stipendAmount: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // ✅ NEW: Payment Mode
  paymentMode: {
    type: DataTypes.ENUM("Online", "Cash"),
    allowNull: true,
    defaultValue: null,
  },

  paymentStatus: {
    type: DataTypes.ENUM("Pending", "Completed", "Failed", "Refunded"),
    allowNull: false,
    defaultValue: "Pending",
  },

  razorpayTransactionId: { type: DataTypes.STRING, allowNull: true },
  senderUpiId: { type: DataTypes.STRING, allowNull: true },
  paymentScreenshot: { type: DataTypes.STRING, allowNull: true,field: "payment_screenshot"}, // IMPORTANT },
  paymentDate: { type: DataTypes.DATE, allowNull: true },

  unpaidProofScreenshot: { type: DataTypes.STRING, allowNull: true },
  unpaidDeclarationDate: { type: DataTypes.DATE, allowNull: true },

  offerSent: { type: DataTypes.BOOLEAN, defaultValue: false },
  completionSent: { type: DataTypes.BOOLEAN, defaultValue: false },

}, {
  tableName: "students",
  timestamps: true,
});

// ✅ Generate ID before validation — makes sure ID is unique
Student.beforeValidate(async (student) => {
  if (!student.id) {
    let newId;
    let exists = true;

    while (exists) {
      newId = generateStudentId();
      const found = await Student.findOne({ where: { id: newId } });
      exists = !!found;
    }

    student.id = newId; // Example: "A9M2K"
  }
});

module.exports = Student;
