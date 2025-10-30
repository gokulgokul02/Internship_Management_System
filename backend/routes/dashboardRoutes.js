const express = require("express");
const router = express.Router();
const { Student, Certificate, Admin } = require("../models");

router.get("/", async (req, res) => {
  try {
    const totalStudents = await Student.count();
    const certificatesIssued = await Certificate.count();
    const activeAdmins = await Admin.count();

    res.json({ totalStudents, certificatesIssued, activeAdmins });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
