// backend/routes/certificates.js
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Get all certificates
router.get("/", async (req, res) => {
  try {
    const certificatesDir = path.join(__dirname, '../certificates');
    
    // Check if certificates directory exists
    if (!fs.existsSync(certificatesDir)) {
      return res.json({ offers: [], completions: [] });
    }

    const files = fs.readdirSync(certificatesDir);
    
    const offers = [];
    const completions = [];

    files.forEach(file => {
      const filePath = path.join(certificatesDir, file);
      const stats = fs.statSync(filePath);
      
      if (file.toLowerCase().startsWith('offer')) {
        offers.push({
          name: file,
          path: `/certificates/${file}`,
          size: stats.size,
          created: stats.birthtime,
          type: 'offer'
        });
      } else if (file.toLowerCase().startsWith('completion')) {
        completions.push({
          name: file,
          path: `/certificates/${file}`,
          size: stats.size,
          created: stats.birthtime,
          type: 'completion'
        });
      }
    });

    // Sort by creation date (newest first)
    offers.sort((a, b) => new Date(b.created) - new Date(a.created));
    completions.sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json({ offers, completions });
  } catch (error) {
    console.error("Error reading certificates:", error);
    res.status(500).json({ error: "Failed to read certificates" });
  }
});

// Upload certificate
router.post("/upload", async (req, res) => {
  // Implement file upload logic here
  // You can use multer or similar for file uploads
});

module.exports = router;