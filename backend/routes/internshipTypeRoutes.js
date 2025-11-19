const express = require("express");
const router = express.Router();
const InternshipType = require("../models/InternshipType");

// ✅ Update Internship Type
router.put("/internship-type/:id", async (req, res) => {
  try {
    const { FormType } = req.body;

    await InternshipType.update(
      { FormType },
      { where: { id: req.params.id } }
    );

    res.json({ message: "Updated Successfully" });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// ✅ Get Internship Type by ID (Corrected - singular & no extra /api)
router.get("/internship-types/:id", async (req, res) => {
  try {
    const internshipType = await InternshipType.findByPk(req.params.id);
    if (!internshipType) {
      return res.status(404).json({ message: "Internship Type not found" });
    }
    res.json(internshipType);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// ✅ Initialize Internship Type
router.post("/internship-type/initialize", async (req, res) => {
  try {
    const [internshipType, created] = await InternshipType.findOrCreate({
      where: { id: 1 },
      defaults: {
        FormType: "unpaid"
      }
    });

    res.json({
      message: created ? "Internship type created" : "Internship type already exists",
      internshipType
    });
  } catch (error) {
    console.error("Initialize Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
