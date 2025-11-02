// backend/controllers/adminController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
require("dotenv").config();

// Register admin (SuperAdmin only)
exports.register = async (req, res) => {
  const { email, password, type = 'ADMIN' } = req.body;
  
  try {
    // Check if user is SuperAdmin (from auth middleware)
    if (req.admin.type !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: "Only SuperAdmin can register new admins" });
    }

    const exists = await Admin.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ 
      email, 
      password: hashed,
      type 
    });

    // Don't return password in response
    const adminResponse = {
      id: admin.id,
      email: admin.email,
      type: admin.type,
      createdAt: admin.createdAt
    };

    res.status(201).json({ message: "Admin registered successfully", admin: adminResponse });
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

    const token = jwt.sign({ 
      id: admin.id, 
      email: admin.email,
      type: admin.type 
    }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Return admin info without password
    const adminInfo = {
      id: admin.id,
      email: admin.email,
      type: admin.type
    };

    res.json({ 
      message: "Login successful", 
      token,
      admin: adminInfo 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all admins (SuperAdmin only)
exports.getAdmins = async (req, res) => {
  try {
    // Check if user is SuperAdmin
    if (req.admin.type !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: "Only SuperAdmin can view all admins" });
    }

    const admins = await Admin.findAll({
      attributes: ["id", "email", "type", "createdAt", "updatedAt"],
      order: [["createdAt", "DESC"]],
    });
    res.json(admins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Add admin (SuperAdmin only) - Similar to register but with more control
exports.createAdmin = async (req, res) => {
  const { email, password, type = 'ADMIN' } = req.body;
  
  try {
    // Check if user is SuperAdmin
    if (req.admin.type !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: "Only SuperAdmin can create new admins" });
    }

    // Validate type
    if (!['SUPER_ADMIN', 'ADMIN'].includes(type)) {
      return res.status(400).json({ message: "Invalid admin type" });
    }

    const exists = await Admin.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ 
      email, 
      password: hashed,
      type 
    });

    // Return without password
    const adminResponse = {
      id: admin.id,
      email: admin.email,
      type: admin.type,
      createdAt: admin.createdAt
    };

    res.status(201).json({ 
      message: "Admin created successfully", 
      admin: adminResponse 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update admin (SuperAdmin can update anyone, Admin can only update themselves)
exports.updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { email, type } = req.body;
  
  try {
    const adminToUpdate = await Admin.findByPk(id);
    if (!adminToUpdate) return res.status(404).json({ message: "Admin not found" });

    // Check permissions
    const isSuperAdmin = req.admin.type === 'SUPER_ADMIN';
    const isSelf = parseInt(req.admin.id) === parseInt(id);

    // Regular admin can only update themselves
    if (!isSuperAdmin && !isSelf) {
      return res.status(403).json({ message: "You can only update your own profile" });
    }

    // Only SuperAdmin can change admin type
    if (type && !isSuperAdmin) {
      return res.status(403).json({ message: "Only SuperAdmin can change admin type" });
    }

    // Update fields
    if (email) adminToUpdate.email = email;
    if (type && isSuperAdmin) adminToUpdate.type = type;

    await adminToUpdate.save();

    // Return updated admin without password
    const updatedAdmin = {
      id: adminToUpdate.id,
      email: adminToUpdate.email,
      type: adminToUpdate.type,
      updatedAt: adminToUpdate.updatedAt
    };

    res.json({ 
      message: "Admin updated successfully", 
      admin: updatedAdmin 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete admin (SuperAdmin only, cannot delete self)
exports.deleteAdmin = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if user is SuperAdmin
    if (req.admin.type !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: "Only SuperAdmin can delete admins" });
    }

    // Prevent self-deletion
    if (parseInt(req.admin.id) === parseInt(id)) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const admin = await Admin.findByPk(id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    await admin.destroy();
    res.json({ message: "Admin deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get current admin profile
exports.getProfile = async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.admin.id, {
      attributes: ["id", "email", "type", "createdAt", "updatedAt"]
    });
    
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.json(admin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update current admin profile (password update included)
exports.updateProfile = async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  
  try {
    const admin = await Admin.findByPk(req.admin.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Update email if provided
    if (email) admin.email = email;

    // Update password if provided
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });
      
      admin.password = await bcrypt.hash(newPassword, 10);
    }

    await admin.save();

    // Return updated profile without password
    const updatedProfile = {
      id: admin.id,
      email: admin.email,
      type: admin.type,
      updatedAt: admin.updatedAt
    };

    res.json({ 
      message: "Profile updated successfully", 
      admin: updatedProfile 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


   
