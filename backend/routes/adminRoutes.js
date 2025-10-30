const express = require("express");
const router = express.Router();
const { Student } = require("../models");
const sendEmail = require("../utils/sendEmail");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const { 
  register, 
  login, 
  getAdmins, 
  createAdmin, 
  updateAdmin, 
  deleteAdmin 
} = require("../controllers/adminController");

// ------------------------------
// AUTH ROUTES
// ------------------------------
router.post("/register", register);
router.post("/login", login);

// CRUD
router.get("/", getAdmins);
router.post("/", createAdmin);
router.put("/:id", updateAdmin);
router.delete("/:id", deleteAdmin);

// ------------------------------
// HELPER FUNCTION TO GENERATE PDF
// ------------------------------
async function generatePDF(type, student) {
  try {
    const certificatesDir = path.join(__dirname, "../certificates");
    if (!fs.existsSync(certificatesDir)) {
      fs.mkdirSync(certificatesDir, { recursive: true });
    }

    const fileName = `${type}_${student.name.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
    const filePath = path.join(certificatesDir, fileName);

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    if (type === "offer") {
      await generateOfferLetter(doc, student);
    } else {
      await generateCompletionLetter(doc, student);
    }

    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => {
        console.log(`✅ PDF saved at: ${filePath}`);
        resolve(filePath);
      });
      writeStream.on("error", reject);
    });
  } catch (err) {
    console.error("❌ Error generating PDF:", err);
    throw err;
  }
}

function calculateDuration(startDate, endDate) {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  let diffTime = end - start;
  let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let years = Math.floor(diffDays / 365);
  diffDays %= 365;
  let months = Math.floor(diffDays / 30);
  diffDays %= 30;
  let weeks = Math.floor(diffDays / 7);
  diffDays %= 7;

  let duration = [];
  if (years > 0) duration.push(`${years} Year${years > 1 ? "s" : ""}`);
  if (months > 0) duration.push(`${months} Month${months > 1 ? "s" : ""}`);
  if (weeks > 0) duration.push(`${weeks} Week${weeks > 1 ? "s" : ""}`);
  if (diffDays > 0) duration.push(`${diffDays} Day${diffDays > 1 ? "s" : ""}`);

  if (duration.length === 0) return "0 Days";

  return duration.join(" ");
}

// ------------------------------
// OFFER LETTER DESIGN
// ------------------------------
async function generateOfferLetter(doc, student) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 50;
  let yPosition = 100;

  // Calculate duration
  const duration = calculateDuration(student.startDate, student.endDate);

  // Register Noto font for rupee symbol
  const fontPath = path.join(__dirname, "../fonts/NotoSans-Regular.ttf");
  let hasNotoFont = false;
  if (fs.existsSync(fontPath)) {
    doc.registerFont("Noto", fontPath);
    hasNotoFont = true;
    console.log("✅ Noto font registered successfully");
  } else {
    console.log("⚠️ Noto font not found, using fallback for rupee symbol");
  }

  // Add header image
  const headerPath = path.join(__dirname, "../assets/header.png");
  if (fs.existsSync(headerPath)) {
    doc.image(headerPath, 0, 0, { width: pageWidth, height: 120 });
    yPosition = 140;
  }

  // Offer Letter Title
  doc.fontSize(12)
     .font("Times-Bold")
     .fillColor("black")
     .text("Internship Offer Letter", margin, yPosition, { 
       align: "center",
       width: pageWidth - (2 * margin)
     });
  
  yPosition += 50;

  // Date
  doc.fontSize(10)
     .font("Times-Roman")
     .fillColor("#666666")
     .text(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition);

  yPosition += 30;
  
  // Salutation
  doc.fontSize(12)
     .fillColor("#000000")
     .font("Times-Bold")
     .text(`Dear ${student.name},`, margin, yPosition);

  yPosition += 25;
  
  // Introduction paragraph
  doc.font("Times-Roman")
     .text("We are pleased to offer you an ", margin, yPosition, { continued: true })
     .font("Times-Bold")
     .text("Internship Opportunity", { continued: true })
     .font("Times-Roman")
     .text(" at ", { continued: true })
     .font("Times-Bold")
     .text("RORIRI SOFTWARE SOLUTIONS", { continued: true })
     .font("Times-Roman")
     .text(". We appreciate your enthusiasm and potential and believe this internship will provide you with valuable industry experience.");

  yPosition += 50;
  
  // Internship Details Section
  doc.font("Times-Bold")
     .text("Internship Details:", margin, yPosition);

  yPosition += 25;

  // Internship details
  const details = [
    { label: "• Position:", value: student.department },
    { 
      label: "• Start Date:", 
      value: new Date(student.startDate).toLocaleDateString("en-GB") 
    },
    { label: "• Duration:", value: duration },
    { label: "• Location:", value: "Roriri Software Solutions Pvt. Ltd, Nallanthapuram, Kalakad" },
    {
      label: "• Stipend:",
      value: student.stipendType === "Unpaid"
        ? "Unpaid Internship"
        : `₹${student.stipendAmount}`,
      needsRupee: student.stipendType === "Paid"
    }
  ];

  // Render details with special handling for rupee symbol
  details.forEach(detail => {
    doc.fillColor("black")
       .font("Times-Bold")
       .text(detail.label.padEnd(22, " "), margin + 10, yPosition)
       .fillColor("#000000");
    
    if (detail.needsRupee && hasNotoFont) {
      // Use Noto font for rupee symbol
      doc.font("Noto")
         .text(detail.value, margin + 80, yPosition)
         .font("Times-Roman"); // Switch back to Times-Roman
    } else {
      doc.font("Times-Roman")
         .text(detail.value, margin + 80, yPosition);
    }
    yPosition += 18;
  });

  yPosition += 20;
  
  // Terms Section
  doc.font("Times-Bold")
     .text("Internship Terms & Future Opportunities:", margin, yPosition);

  yPosition += 25;

  // Terms
  doc.font("Times-Roman")
     .text("• During the internship, you will work on ", margin + 20, yPosition, { continued: true })
     .font("Times-Bold")
     .text(student.department, { continued: true })
     .font("Times-Roman")
     .text(" related projects.");
  
  yPosition += 20;
  
  doc.font("Times-Roman")
     .text("• Your ", margin + 20, yPosition, { continued: true })
     .font("Times-Bold")
     .text("performance will be evaluated", { continued: true })
     .font("Times-Roman")
     .text(" during the internship period.");
  
  yPosition += 20;
  
  doc.font("Times-Roman")
     .text("• Upon successful completion of the internship, based on your performance and company requirements, we may offer you a ", margin + 20, yPosition, { continued: true })
     .font("Times-Bold")
     .text("full-time position", { continued: true })
     .font("Times-Roman")
     .text(" with a fixed salary.");

  yPosition += 30;
  
  // Closing paragraph
  const closingText = "We are excited to have you as part of our team and look forward to seeing your contributions.";
  
  doc.text(closingText, margin, yPosition, {
    width: pageWidth - (2 * margin),
    align: 'justify'
  });

  yPosition += 30;
  
  // Congratulations
  doc.font("Times-Bold")
     .text("Congratulations once again, and welcome to Roriri Software Solutions Pvt. Ltd.", margin, yPosition, {
       width: pageWidth - (2 * margin),
       align: 'justify'
     });

  // Signature section
  yPosition += 40;
  
  doc.fontSize(12)
     .font("Times-Bold")
     .fillColor("black")
     .text("Best regards,", margin, yPosition);

  yPosition += 25;

  // Add signature image
  const signaturePath = path.join(__dirname, "../assets/signature.png");
  if (fs.existsSync(signaturePath)) {
    doc.image(signaturePath, margin, yPosition, { width: 100, height: 40 });
    yPosition += 50;
  } else {
    yPosition += 20;
  }

  doc.font("Times-Bold")
     .fillColor("#000000")
     .text("Ragupathi,", margin, yPosition)
     .font("Times-Roman")
     .text("Chief Executive Officer (CEO),", margin, yPosition + 15)
     .font("Times-Bold")
     .text("Roriri Software Solutions Pvt Ltd", margin, yPosition + 35);

  // Add footer image at bottom
  const footerPath = path.join(__dirname, "../assets/footer.png");
  if (fs.existsSync(footerPath)) {
    const footerY = pageHeight - 100;
    doc.image(footerPath, 0, footerY, { width: pageWidth, height: 100 });
  }
}

// ------------------------------
// COMPLETION LETTER DESIGN
// ------------------------------
async function generateCompletionLetter(doc, student) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 50;
  let yPosition = 80;

  // Calculate duration
  const duration = calculateDuration(student.startDate, student.endDate);

  // Completion Letter Title
  doc.fontSize(16)
     .font("Times-Bold")
     .fillColor("black")
     .text("INTERNSHIP COMPLETION LETTER", margin, yPosition, { 
       align: "center",
       width: pageWidth - (2 * margin)
     });

  yPosition += 40;

  // Salutation
  doc.fontSize(12)
     .fillColor("#000000")
     .font("Times-Bold")
     .text(`Dear ${student.name},`, margin, yPosition);

  yPosition += 25;

  // Main content paragraphs
  doc.font("Times-Roman")
     .text("We are delighted to acknowledge the successful completion of your Internship with ", margin, yPosition, { continued: true })
     .font("Times-Bold")
     .text("Roriri Software Solutions Pvt Ltd", { continued: true })
     .font("Times-Roman")
     .text(". Your Internship, which ran from ", { continued: true })
     .font("Times-Bold")
     .text(`${student.startDate} to ${student.endDate}`, { continued: true })
     .font("Times-Roman")
     .text(" has come to a successful close, and we are pleased to report that you achieved a perfect attendance record throughout this period.");

  yPosition += 80;

  // Paragraph 2
  doc.text("Your commitment to your role and your consistent presence at the office have been truly commendable. Your contributions to our ", margin, yPosition, { continued: true })
     .font("Times-Bold")
     .text(student.department, { continued: true })
     .font("Times-Roman")
     .text(" were highly valued, and your dedication and work ethic have not gone unnoticed.");

  yPosition += 60;

  // Paragraph 3
  doc.text("It has been a pleasure having you with us as an intern. You brought a fresh perspective to our team, and we hope that your time here was both insightful and rewarding.", margin, yPosition, {
    width: pageWidth - (2 * margin),
    align: 'justify'
  });

  yPosition += 50;

  // Paragraph 4 - Thank you
  doc.font("Times-Bold")
     .text(`Thank you once again for your exceptional performance and dedication during this ${duration} of Internship Period.`, margin, yPosition, {
       width: pageWidth - (2 * margin),
       align: 'justify'
     });

  // Signature section
  yPosition += 50;
  
  doc.fontSize(12)
     .font("Times-Bold")
     .fillColor("black")
     .text("Best regards,", margin, yPosition);

  yPosition += 25;

  // Add signature image
  const signaturePath = path.join(__dirname, "../assets/signature.png");
  if (fs.existsSync(signaturePath)) {
    doc.image(signaturePath, margin, yPosition, { width: 100, height: 40 });
    yPosition += 50;
  } else {
    yPosition += 20;
  }

  doc.font("Times-Bold")
     .fillColor("#000000")
     .text("Ragupathi R,", margin, yPosition)
     .font("Times-Roman")
     .text("Chief Executive Officer (CEO),", margin, yPosition + 15)
     .font("Times-Bold")
     .text("Roriri Software Solutions Pvt Ltd", margin, yPosition + 35);

  // Add footer image at bottom

}

// ------------------------------
// GENERATE PDF FOR PREVIEW (UPDATED)
// ------------------------------
router.post("/generate-preview", async (req, res) => {
  try {
    const { studentId, type } = req.body; // type: 'offer' or 'completion'
    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Validate required student data
    if (!student.name || !student.college || !student.department || !student.startDate || !student.endDate) {
      return res.status(400).json({ message: "Student data is incomplete. Please ensure all fields are filled." });
    }

    console.log(`📄 Generating ${type} letter preview for:`, student.name);
    const filePath = await generatePDF(type, student);

    // Read the generated PDF file and send as base64
    const pdfBuffer = fs.readFileSync(filePath);
    const base64PDF = pdfBuffer.toString('base64');

    res.json({
      success: true,
      pdfData: base64PDF,
      fileName: `${type}_letter_${student.name.replace(/\s+/g, '_')}.pdf`,
      filePath: filePath, // Return file path for debugging
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} letter generated successfully for preview!`
    });
  } catch (err) {
    console.error("❌ Error generating PDF preview:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ------------------------------
// SEND OFFER LETTER (UPDATED)
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

    res.json({ 
      success: true, 
      message: "Professional offer letter sent successfully!",
      filePath: filePath // For debugging
    });
  } catch (err) {
    console.error("❌ Error sending offer letter:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ------------------------------
// SEND COMPLETION CERTIFICATE (UPDATED)
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

    console.log("📄 Generating professional completion letter for:", student.name);
    const filePath = await generatePDF("completion", student);

    console.log("📤 Sending completion letter to:", student.email);
    await sendEmail(
      student.email,
      "Internship Completion Letter - RORIRI SOFTWARE SOLUTIONS",
      `Dear ${student.name},

Congratulations on successfully completing your internship at RORIRI SOFTWARE SOLUTIONS!

We are pleased to attach your Internship Completion Letter in recognition of your hard work and dedication during your time with us in the ${student.department} department.

Your contributions from ${student.startDate} to ${student.endDate} have been valuable, and we wish you continued success in your academic and professional journey.

We hope this experience has been rewarding and that you will carry the skills and knowledge gained forward in your career.

Best Regards,
Internship Coordinator
RORIRI SOFTWARE SOLUTIONS
hr@roririsolutions.com`,
      [{ filename: `Completion_Letter_${student.name.replace(/\s+/g, '_')}.pdf`, path: filePath }]
    );

    student.completionSent = true;
    await student.save();

    res.json({
      success: true,
      message: "Professional completion letter sent successfully!",
      filePath: filePath // For debugging
    });
  } catch (err) {
    console.error("❌ Error sending completion letter:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;