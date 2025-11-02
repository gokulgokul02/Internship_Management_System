// backend/controllers/paymentController.js
const { Student } = require("../models");

exports.getPaymentStats = async (req, res) => {
  try {
    const total = await Student.count();
    const paid = await Student.count({ where: { paymentStatus: "Completed" } });
    const unpaid = await Student.count({ where: { paymentStatus: "Unpaid" } });
    const pending = await Student.count({ where: { paymentStatus: "Pending" } });

    res.json({ total, paid, unpaid, pending });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
