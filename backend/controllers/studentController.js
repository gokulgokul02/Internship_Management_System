// backend/controllers/studentController.js
const Student = require("../models/Student");
const sendEmail = require("../utils/sendEmail");

exports.createStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAll = async (req, res) => {
  try {
    const students = await Student.findAll({ order: [["createdAt", "DESC"]] });
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getOne = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ message: "Not found" });
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    await Student.update(req.body, { where: { id: req.params.id } });
    const updated = await Student.findByPk(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    await Student.destroy({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.sendOffer = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const html = `
      <p>Dear ${student.name},</p>
      <p>Congratulations — you are offered an internship from <strong>Company</strong>.</p>
      <p>Internship duration: ${student.startDate || "N/A"} — ${student.endDate || "N/A"}</p>
      <p>Regards,<br/>Internship Management System</p>
    `;

    await sendEmail(student.email, "Internship Offer Letter", html);
    student.offerSent = true;
    await student.save();
    res.json({ message: "Offer sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.sendCompletion = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const html = `
      <p>Dear ${student.name},</p>
      <p>Congratulations on completing your internship.</p>
      <p>We appreciate your effort.</p>
      <p>Regards,<br/>Internship Management System</p>
    `;

    await sendEmail(student.email, "Internship Completion Letter", html);
    student.completionSent = true;
    await student.save();
    res.json({ message: "Completion sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
