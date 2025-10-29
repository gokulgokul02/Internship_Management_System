// backend/controllers/adminController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
require("dotenv").config();

exports.register = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existing = await Admin.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: "Admin already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const admin = await Admin.create({ email, password: hashed });
    res.json({ id: admin.id, email: admin.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const payload = { id: admin.id, email: admin.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, admin: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
