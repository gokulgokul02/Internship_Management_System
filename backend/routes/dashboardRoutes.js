const express = require("express");
const { Op } = require("sequelize");
const router = express.Router();
const { Student, Admin } = require("../models");

router.get("/dashboard", async (req, res) => {
  try {
    const [
      totalStudents,
      activeAdmins,
      approvedStudents,
      pendingStudents,
      paidInternships,
      unpaidInternships,
      completePayments,
      pendingPayments,
    ] = await Promise.all([
      Student.count(),
      Admin.count(),
      Student.count({ where: { isApproved: true } }),   // ✅ model field
      Student.count({ where: { isApproved: false } }),  // ✅ model field
      Student.count({ where: { stipendType: "Paid" } }),   // ✅ model field
      Student.count({ where: { stipendType: "Unpaid" } }),  // ✅ model field
      Student.count({ where: {paymentStatus:"Completed"}}),
      Student.count({where:{paymentStatus:"Pending"}})
    ]);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentStudents = await Student.count({
      where: { createdAt: { [Op.gte]: oneWeekAgo } }
    });

    const completedPayments = await Student.count({
      where: { stipendType: "Paid", paymentStatus: "Completed" } // ✅ model field
    });

    res.json({
      overview: {
        totalStudents,
        activeAdmins,
        recentStudents,
        completedPayments,
        certificatesIssued: 0 // ✅ CERTIFICATES REMOVED (no such field)
      },
      students: {
        approved: approvedStudents,
        pending: pendingStudents,
        paid: paidInternships,
        unpaid: unpaidInternships,
        payed:completePayments,
        nopaid:pendingPayments
      }
    });

  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
