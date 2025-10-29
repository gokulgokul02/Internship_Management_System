const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/adminController");
const { Student } = require("../models");
const sendEmail = require("../utils/sendEmail");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// ------------------------------
// AUTH ROUTES
// ------------------------------
router.post("/register", register);
router.post("/login", login);

// ------------------------------
// HELPER FUNCTION TO GENERATE PDF
// ------------------------------
async function generatePDF(type, student) {
  try {
    const certificatesDir = path.join(__dirname, "../certificates");
    if (!fs.existsSync(certificatesDir)) fs.mkdirSync(certificatesDir, { recursive: true });

    const fileName = `${type}_${student.name.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
    const filePath = path.join(certificatesDir, fileName);

    // Use landscape for completion certificate, portrait for offer letter
    const doc = new PDFDocument({
      size: type === "completion" ? [842, 595] : "A4", // Landscape for completion
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    if (type === "offer") {
      await generateOfferLetter(doc, student);
    } else {
      await generateCompletionCertificate(doc, student);
    }

    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => resolve(filePath));
      writeStream.on("error", reject);
    });
  } catch (err) {
    console.error("❌ Error generating PDF:", err);
    throw err;
  }
}

// ------------------------------
// OFFER LETTER DESIGN (SINGLE PAGE)
// ------------------------------
async function generateOfferLetter(doc, student) {
  // Green background header
  doc.rect(0, 0, doc.page.width, 100)
     .fill("#1e6b52");
  
  // Company Logo
  const logoPath = path.join(__dirname, "../assets/logo.png");
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 20, { width: 60, height: 60 });
  }

  // Company Name
  doc.fontSize(24)
     .fillColor("#ffffff")
     .font("Helvetica-Bold")
     .text("RORIRI SOFTWARE SOLUTIONS", 120, 35)
     .fontSize(10)
     .font("Helvetica")
     .text("Innovating Tomorrow's Solutions Today", 120, 65);

  // Main content area
  doc.fillColor("#000000");
  
  // Offer Letter Title
  doc.fontSize(20)
     .font("Helvetica-Bold")
     .fillColor("#1e6b52")
     .text("INTERNSHIP OFFER LETTER", 50, 130, { align: "center" });
  
  // Underline for title
  doc.moveTo(150, 155)
     .lineTo(445, 155)
     .strokeColor("#1e6b52")
     .lineWidth(1)
     .stroke();

  // Date
  doc.fontSize(10)
     .fillColor("#666666")
     .text(`Date: ${new Date().toLocaleDateString()}`, 400, 170, { align: "right" });

  // Content - using explicit Y positions to control layout
  let yPosition = 200;
  
  doc.fontSize(12)
     .fillColor("#000000")
     .font("Helvetica")
     .text(`Dear ${student.name},`, 50, yPosition);

  yPosition += 30;
  
  doc.font("Helvetica-Bold")
     .text("CONGRATULATIONS!", 50, yPosition, { continued: true })
     .font("Helvetica")
     .text(` We are pleased to offer you an internship position at RORIRI SOFTWARE SOLUTIONS.`);

  yPosition += 50;
  
  doc.text(`After careful consideration, we are impressed with your academic background from ${student.college} and your enthusiasm for joining our team in the ${student.department} department.`, 50, yPosition, {
    width: 500,
    align: 'justify'
  });

  yPosition += 50;
  
  doc.text("Internship Details:", 50, yPosition, { underline: true });

  yPosition += 25;
  
  // Internship details in a styled box
  const detailsX = 70;
  const detailsY = yPosition;
  
  doc.rect(detailsX, detailsY, 470, 70)
     .fill("#f8f9fa")
     .stroke("#1e6b52");
  
  doc.fillColor("#1e6b52")
     .font("Helvetica-Bold")
     .text("• Start Date:", detailsX + 20, detailsY + 15)
     .fillColor("#000000")
     .font("Helvetica")
     .text(student.startDate, detailsX + 100, detailsY + 15);
  
  doc.fillColor("#1e6b52")
     .font("Helvetica-Bold")
     .text("• End Date:", detailsX + 20, detailsY + 35)
     .fillColor("#000000")
     .font("Helvetica")
     .text(student.endDate, detailsX + 100, detailsY + 35);
  
  doc.fillColor("#1e6b52")
     .font("Helvetica-Bold")
     .text("• Department:", detailsX + 20, detailsY + 55)
     .fillColor("#000000")
     .font("Helvetica")
     .text(student.department, detailsX + 120, detailsY + 55);

  yPosition += 100;
  
  doc.text("During your internship, you will:", 50, yPosition, { underline: true });

  yPosition += 25;
  
  doc.text("• Work on real-world projects under experienced mentors", 70, yPosition);
  yPosition += 20;
  doc.text("• Develop practical skills in your field of study", 70, yPosition);
  yPosition += 20;
  doc.text("• Collaborate with our dynamic team of professionals", 70, yPosition);
  yPosition += 20;
  doc.text("• Gain valuable industry experience", 70, yPosition);

  yPosition += 50;
  
  doc.text("We believe this internship will provide you with valuable experience and contribute significantly to your professional development.", 50, yPosition, {
    width: 500,
    align: 'justify'
  });

  yPosition += 40;
  
  doc.text("To accept this offer, please confirm your participation by replying to this email within 5 business days.", 50, yPosition, {
    width: 500,
    align: 'justify'
  });

  yPosition += 30;
  
  doc.text("We look forward to welcoming you to our team!", 50, yPosition, { align: "center" });

  // Footer with signatures - ensure it fits on one page
  const footerY = 650;
  
  doc.moveTo(50, footerY)
     .lineTo(200, footerY)
     .strokeColor("#000000")
     .lineWidth(1)
     .stroke();
  
  doc.moveTo(350, footerY)
     .lineTo(500, footerY)
     .strokeColor("#000000")
     .lineWidth(1)
     .stroke();

  doc.fontSize(10)
     .text("Intern Signature", 50, footerY + 10)
     .text("Company Representative", 350, footerY + 10);

  doc.fontSize(12)
     .font("Helvetica-Bold")
     .fillColor("#1e6b52")
     .text("Best Regards,", 50, footerY + 40)
     .font("Helvetica")
     .fillColor("#000000")
     .text("Internship Coordinator", 50, footerY + 60)
     .text("RORIRI SOFTWARE SOLUTIONS", 50, footerY + 80);
}

// ------------------------------
// COMPLETION CERTIFICATE DESIGN (LANDSCAPE)
// ------------------------------
async function generateCompletionCertificate(doc, student) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Decorative border
  doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
     .stroke("#1e6b52")
     .lineWidth(3);

  // Inner decorative border
  doc.rect(40, 40, pageWidth - 80, pageHeight - 80)
     .stroke("#d4af37")
     .lineWidth(2);

  // Certificate background
  doc.rect(45, 45, pageWidth - 90, pageHeight - 90)
     .fill("#f0f8f5");

  // Company Logo - centered at top
  const logoPath = path.join(__dirname, "../assets/logo.png");
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, pageWidth / 2 - 40, 60, { width: 80, height: 80 });
  }

  // Company Name
  doc.fontSize(20)
     .fillColor("#1e6b52")
     .font("Helvetica-Bold")
     .text("RORIRI SOFTWARE SOLUTIONS", 0, 150, { align: "center" })
     .fontSize(12)
     .fillColor("#666666")
     .text("Innovating Tomorrow's Solutions Today", 0, 175, { align: "center" });

  // Certificate Title
  doc.fontSize(36)
     .fillColor("#1e6b52")
     .font("Helvetica-Bold")
     .text("CERTIFICATE OF COMPLETION", 0, 220, { align: "center" });

  // Decorative line
  doc.moveTo(100, 260)
     .lineTo(pageWidth - 100, 260)
     .strokeColor("#d4af37")
     .lineWidth(2)
     .stroke();

  // Main certificate text
  doc.fontSize(16)
     .fillColor("#333333")
     .font("Helvetica")
     .text("This is to certify that", 0, 300, { align: "center" });

  // Student name with special styling
  doc.fontSize(32)
     .fillColor("#1e6b52")
     .font("Helvetica-Bold")
     .text(student.name.toUpperCase(), 0, 330, { align: "center" });

  doc.fontSize(16)
     .fillColor("#333333")
     .font("Helvetica")
     .text(`has successfully completed the internship program in`, 0, 380, { align: "center" });

  // Department with emphasis
  doc.fontSize(20)
     .fillColor("#1e6b52")
     .font("Helvetica-Bold")
     .text(student.department, 0, 410, { align: "center" });

  doc.fontSize(16)
     .fillColor("#333333")
     .font("Helvetica")
     .text(`from ${student.college}`, 0, 440, { align: "center" });

  // Internship period
  doc.text(`during the period from ${student.startDate} to ${student.endDate}`, 0, 470, { align: "center" });

  // Achievement description
  doc.fontSize(14)
     .font("Helvetica-Oblique")
     .fillColor("#555555")
     .text("The intern has demonstrated exceptional dedication, professionalism,", 0, 510, { align: "center" })
     .text("and eagerness to learn throughout the internship program.", 0, 530, { align: "center" });

  // Signatures area
  const signatureY = pageHeight - 120;

  // Left signature (Company)
  doc.moveTo(100, signatureY)
     .lineTo(280, signatureY)
     .strokeColor("#1e6b52")
     .stroke();

  doc.fontSize(12)
     .fillColor("#1e6b52")
     .font("Helvetica-Bold")
     .text("Sarah Johnson", 100, signatureY + 10)
     .font("Helvetica")
     .fontSize(10)
     .text("Internship Coordinator", 100, signatureY + 25)
     .text("RORIRI SOFTWARE SOLUTIONS", 100, signatureY + 40);

  // Right signature (Date)
  doc.moveTo(pageWidth - 280, signatureY)
     .lineTo(pageWidth - 100, signatureY)
     .strokeColor("#1e6b52")
     .stroke();

  doc.fontSize(10)
     .fillColor("#666666")
     .text(`Issued on: ${new Date().toLocaleDateString('en-US', { 
       year: 'numeric', 
       month: 'long', 
       day: 'numeric' 
     })}`, pageWidth - 280, signatureY + 10, { width: 180, align: "center" });

  // Certificate ID at bottom
  const certId = `RSS-${Date.now().toString().slice(-8)}`;
  doc.fontSize(8)
     .fillColor("#999999")
     .text(`Certificate ID: ${certId}`, 0, pageHeight - 30, { align: "center" });
}

// ------------------------------
// SEND OFFER LETTER
// ------------------------------
router.post("/send-offer", async (req, res) => {
  try {
    const { studentId } = req.body;
    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Validate required student data
    if (!student.name || !student.college || !student.department || !student.startDate || !student.endDate) {
      return res.status(400).json({ message: "Student data is incomplete. Please ensure all fields are filled." });
    }

    console.log("📄 Generating professional offer letter for:", student.name);
    const filePath = await generatePDF("offer", student);

    console.log("📤 Sending offer letter email to:", student.email);
    await sendEmail(
      student.email,
      "Internship Offer Letter - RORIRI SOFTWARE SOLUTIONS",
      `Dear ${student.name},

We are delighted to offer you an internship position at RORIRI SOFTWARE SOLUTIONS!

Please find attached your official internship offer letter detailing your placement in the ${student.department} department.

This internship will run from ${student.startDate} to ${student.endDate}, during which you'll work on exciting projects and gain valuable industry experience.

To accept this offer, please reply to this email within 5 business days.

We look forward to welcoming you to our team!

Best Regards,
Internship Coordinator
RORIRI SOFTWARE SOLUTIONS
hr@roririsolutions.com`,
      [{ filename: `Offer_Letter_${student.name.replace(/\s+/g, '_')}.pdf`, path: filePath }]
    );

    student.offerSent = true;
    await student.save();

    res.json({ success: true, message: "Professional offer letter sent successfully!" });
  } catch (err) {
    console.error("❌ Error sending offer letter:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ------------------------------
// SEND COMPLETION CERTIFICATE
// ------------------------------
router.post("/send-completion", async (req, res) => {
  try {
    const { studentId } = req.body;
    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Validate required student data
    if (!student.name || !student.college || !student.department || !student.startDate || !student.endDate) {
      return res.status(400).json({ message: "Student data is incomplete. Please ensure all fields are filled." });
    }

    console.log("📄 Generating professional completion certificate for:", student.name);
    const filePath = await generatePDF("completion", student);

    console.log("📤 Sending completion certificate to:", student.email);
    await sendEmail(
      student.email,
      "Internship Completion Certificate - RORIRI SOFTWARE SOLUTIONS",
      `Dear ${student.name},

Congratulations on successfully completing your internship at RORIRI SOFTWARE SOLUTIONS!

We are pleased to attach your Internship Completion Certificate in recognition of your hard work and dedication during your time with us in the ${student.department} department.

Your contributions from ${student.startDate} to ${student.endDate} have been valuable, and we wish you continued success in your academic and professional journey.

We hope this experience has been rewarding and that you will carry the skills and knowledge gained forward in your career.

Best Regards,
Internship Coordinator
RORIRI SOFTWARE SOLUTIONS
hr@roririsolutions.com`,
      [{ filename: `Completion_Certificate_${student.name.replace(/\s+/g, '_')}.pdf`, path: filePath }]
    );

    student.completionSent = true;
    await student.save();

    res.json({
      success: true,
      message: "Professional completion certificate sent successfully!",
    });
  } catch (err) {
    console.error("❌ Error sending completion certificate:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;