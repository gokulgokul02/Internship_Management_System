const { Student, Admin } = require("../models");

exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.count();
    const totalAdmins = await Admin.count();
    const certificatesIssued = 567; // Example static or future dynamic

    res.json({ totalStudents, totalAdmins, certificatesIssued });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
