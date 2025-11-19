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
    defaultValue: () => generateStudentId() // Add default value function
  },

  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: true },
  college: { type: DataTypes.STRING, allowNull: false },
  department: { type: DataTypes.STRING, allowNull: false },

  internshipType: {
    type: DataTypes.ENUM("paid", "unpaid"),
    allowNull: false,
    defaultValue: "unpaid",
    field: "internship_type"
  },

  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },

  startDate: { 
    type: DataTypes.DATEONLY, 
    allowNull: true,
    field: "start_date" 
  },
  endDate: { 
    type: DataTypes.DATEONLY, 
    allowNull: true,
    field: "end_date" 
  },

  // ✅ Internship Status
  internshipStatus: {
    type: DataTypes.ENUM("Active", "Completed", "Discontinued"),
    allowNull: false,
    defaultValue: "Active",
    field: "internship_status"
  },

  isApproved: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false,
    field: "is_approved" 
  },

  stipendType: {
    type: DataTypes.ENUM("Paid", "Unpaid"),
    allowNull: false,
    defaultValue: "Unpaid",
    field: "stipend_type"
  },

  stipendAmount: { 
    type: DataTypes.INTEGER, 
    allowNull: true,
    field: "stipend_amount" 
  },

  paymentMode: {
    type: DataTypes.ENUM("Online", "Cash", "Advance"),
    allowNull: true,
    defaultValue: null,
    field: "payment_mode"
  },

  totalAmount: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: true, 
    defaultValue: 0,
    field: "total_amount" 
  },
  advanceAmount: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: true, 
    defaultValue: 0,
    field: "advance_amount" 
  },
  remainingAmount: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: true, 
    defaultValue: 0,
    field: "remaining_amount" 
  },

  paymentStatus: {
    type: DataTypes.ENUM("Pending", "Completed", "Failed", "Refunded", "Partially_Paid"),
    allowNull: false,
    defaultValue: "Pending",
    field: "payment_status"
  },

  razorpayTransactionId: { 
    type: DataTypes.STRING, 
    allowNull: true,
    field: "razorpay_transaction_id" 
  },
  senderUpiId: { 
    type: DataTypes.STRING, 
    allowNull: true,
    field: "sender_upi_id" 
  },

  paymentScreenshot: { 
    type: DataTypes.STRING, 
    allowNull: true, 
    field: "payment_screenshot" 
  },
  paymentDate: { 
    type: DataTypes.DATE, 
    allowNull: true,
    field: "payment_date" 
  },
  unpaidProofScreenshot: { 
    type: DataTypes.STRING, 
    allowNull: true,
    field: "unpaid_proof_screenshot" 
  },
  unpaidDeclarationDate: { 
    type: DataTypes.DATE, 
    allowNull: true,
    field: "unpaid_declaration_date" 
  },

  offerSent: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false,
    field: "offer_sent" 
  },
  completionSent: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false,
    field: "completion_sent" 
  },

  reason: { type: DataTypes.TEXT, allowNull: true },

}, {
  tableName: "students",
  timestamps: true,
  hooks: {
    beforeValidate: async (student) => {
      // Generate unique ID only if it doesn't exist
      if (!student.id) {
        let newId;
        let exists = true;
        let attempts = 0;
        const maxAttempts = 10;

        while (exists && attempts < maxAttempts) {
          newId = generateStudentId();
          const found = await Student.findOne({ where: { id: newId } });
          exists = !!found;
          attempts++;
        }

        if (exists) {
          // Fallback: timestamp-based ID
          newId = 'S' + Date.now().toString().slice(-4);
        }

        student.id = newId;
      }

      // Auto-set stipendType based on internshipType
      if (student.internshipType === "paid") {
        student.stipendType = "Paid";
      } else {
        student.stipendType = "Unpaid";
      }
    }
  }
});

module.exports = Student;