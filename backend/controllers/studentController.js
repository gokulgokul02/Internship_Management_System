// backend/controllers/studentController.js
const { Student } = require("../models");
const sendEmail = require("../utils/sendEmail");

// ---------------------------
// BASIC CRUD
// ---------------------------
exports.createStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const students = await Student.findAll({ order: [["createdAt", "DESC"]] });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ message: "Not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    await Student.update(req.body, { where: { id: req.params.id } });
    res.json(await Student.findByPk(req.params.id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    await Student.destroy({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --------------------------------------------------
// PAYMENT STATUS
// --------------------------------------------------
exports.markPaymentCompleted = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.paymentStatus = "Completed";
    if (req.file) student.paymentProof = req.file.filename;
    await student.save();

    res.json({ message: "Payment marked as Completed", student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAsUnpaid = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.paymentStatus = "Unpaid";
    student.paymentProof = null;
    await student.save();

    res.json({ message: "Payment marked as Unpaid", student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --------------------------------------------------
// APPROVAL ACTIONS
// --------------------------------------------------
exports.approveStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    await student.update({
      paymentStatus: "Completed",
      is_approved: true,
      approvedBy: req.admin.id,
      approvedAt: new Date()
    });

    res.json({ message: "Approved successfully", student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rejectStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    await student.update({
      paymentStatus: "Failed",
      is_approved: false,
      approvedBy: req.admin.id,
      approvedAt: new Date()
    });

    res.json({ message: "Rejected successfully", student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.revokeApproval = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    await student.update({
      paymentStatus: "Pending",
      is_approved: false,
      approvedBy: null,
      approvedAt: null
    });

    res.json({ message: "Approval revoked", student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --------------------------------------------------
// PDF PREVIEW (TEMP HTML for now — real PDF later)
// --------------------------------------------------
exports.generateOfferPreview = async (req, res) => {
  res.json({ message: "Offer preview generated successfully" });
};

exports.generateCompletionPreview = async (req, res) => {
  res.json({ message: "Completion preview generated successfully" });
};

exports.generateCertificatePreview = async (req, res) => {
  res.json({ message: "Certificate preview generated successfully" });
};

// --------------------------------------------------
// BULK OPERATIONS
// --------------------------------------------------
exports.bulkSendOffers = async (req, res) => {
  res.json({ message: "Bulk offer letters sent" });
};

exports.bulkSendCompletions = async (req, res) => {
  res.json({ message: "Bulk completion letters sent" });
};

exports.bulkUpdatePayments = async (req, res) => {
  res.json({ message: "Bulk payments updated" });
};
