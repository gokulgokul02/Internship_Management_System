// backend/middleware/uploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only images (JPEG, PNG, WebP) and PDF files are allowed"));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter,
});

// Specific upload configurations
const uploadPaymentProof = upload.fields([
  { name: "paymentScreenshot", maxCount: 1 },
  { name: "unpaidProofScreenshot", maxCount: 1 },
]);

const uploadStudentDocuments = upload.fields([
  { name: "paymentScreenshot", maxCount: 1 },
  { name: "unpaidProofScreenshot", maxCount: 1 },
  { name: "resume", maxCount: 1 },
  { name: "offerLetter", maxCount: 1 },
]);

module.exports = {
  upload,
  uploadPaymentProof,
  uploadStudentDocuments,
};