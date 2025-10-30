// backend/controllers/adminController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
require("dotenv").config();

// Register admin
exports.register = async (req, res) => {
  const { email, password } = req.body;
  try {
    const exists = await Admin.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ email, password: hashed });

    res.json({ message: "Admin registered", admin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Login admin
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ message: "Login success", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all admins
// Get all admins (Backend correct code)
exports.getAdmins = async (req, res) => {
  try {
    const admins = await Admin.findAll({
      attributes: ["id", "email"],  // return safe fields only
      order: [["id", "DESC"]],       // latest first (optional)
    });
    res.json(admins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// Add admin
exports.createAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const exists = await Admin.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);

    const admin = await Admin.create({ email, password: hashed });
    res.json(admin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update admin (only email here)
exports.updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  try {
    const admin = await Admin.findByPk(id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    admin.email = email;
    await admin.save();

    res.json(admin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete admin
exports.deleteAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const admin = await Admin.findByPk(id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    await admin.destroy();
    res.json({ message: "Admin deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
