// backend/routes/studentRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const studentCtrl = require("../controllers/studentController");

router.post("/", protect, studentCtrl.createStudent);
router.get("/", protect, studentCtrl.getAll);
router.get("/:id", protect, studentCtrl.getOne);
router.put("/:id", protect, studentCtrl.updateStudent);
router.delete("/:id", protect, studentCtrl.deleteStudent);
router.post("/:id/offer", protect, studentCtrl.sendOffer);
router.post("/:id/completion", protect, studentCtrl.sendCompletion);

module.exports = router;
