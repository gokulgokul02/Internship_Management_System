// backend/models/index.js
const Student = require("./Student");
const Admin = require("./Admin");
const Payment = require("./Payment");

// Associations
if (Payment && Student) {
	Student.hasMany(Payment, { foreignKey: "studentId", sourceKey: "id" });
	Payment.belongsTo(Student, { foreignKey: "studentId", targetKey: "id" });
}

module.exports = { Student, Admin, Payment };
