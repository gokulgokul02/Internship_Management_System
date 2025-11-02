const express = require("express");
const router = express.Router();
const { Student } = require("../models");
const sendEmail = require("../utils/sendEmail");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const authMiddleware = require("../middleware/authMiddleware"); // Add this import

const adminController = require("../controllers/adminController");
const { 
  protect, 
  requireSuperAdmin, 
  requireAdmin, 
  canAccessAdmin 
} = require("../middleware/authMiddleware");
// In adminRoutes.js
router.get("/admins", protect, requireSuperAdmin, adminController.getAdmins);

// ✅ Login (No Auth Required)
router.post("/login", adminController.login);

// ✅ Register Admin (Only SuperAdmin can do this)
router.post("/register", protect, requireSuperAdmin, adminController.register);

// ✅ Create Admin — Same as register (Admin management panel)
router.post("/create", protect, requireSuperAdmin, adminController.createAdmin);

// ✅ View all admins (Only SuperAdmin)
router.get("/", protect, requireSuperAdmin, adminController.getAdmins);

// ✅ Update ANY admin — SuperAdmin OR self
router.put("/:id", protect, canAccessAdmin, adminController.updateAdmin);

// ✅ Delete admin (SuperAdmin only, cannot delete self → already handled)
router.delete("/:id", protect, requireSuperAdmin, adminController.deleteAdmin);

// ✅ Get currently logged-in admin’s profile
router.get("/profile/me", protect, adminController.getProfile);

// ✅ Update own profile
router.put("/profile/me", protect, adminController.updateProfile);




// ------------------------------
// HELPER FUNCTIONS
// ------------------------------
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

function getCurrentDateFormatted() {
  return new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Safe image function to prevent errors
function addImageSafe(doc, imagePath, x, y, options = {}) {
  try {
    if (fs.existsSync(imagePath)) {
      doc.image(imagePath, x, y, options);
      return true;
    } else {
      console.log(`⚠️ Image not found: ${imagePath}`);
      // Create a simple text signature as fallback
      doc.fontSize(12)
         .font('Times-Bold')
         .text('_________________________', x, y + 10)
         .text('Ragupathi R', x, y + 25)
         .font('Times-Roman')
         .text('Chief Executive Officer', x, y + 40);
      return false;
    }
  } catch (error) {
    console.log(`⚠️ Error loading image: ${imagePath}`, error.message);
    // Fallback to text signature
    doc.fontSize(12)
       .font('Times-Bold')
       .text('_________________________', x, y + 10)
       .text('Ragupathi R', x, y + 25)
       .font('Times-Roman')
       .text('Chief Executive Officer', x, y + 40);
    return false;
  }
}

// ------------------------------
// TEMPLATE PATHS (ONLY OFFER AND COMPLETION)
// ------------------------------
const TEMPLATE_PATHS = {
  offer: path.join(__dirname, "../templates/offer.png"),
  completion: path.join(__dirname, "../templates/completion-template.png")
};

// ------------------------------
// PDF GENERATION WITH TEMPLATES AS BACKGROUND
// ------------------------------
async function generatePDFFromTemplate(type, student, shouldSave = false) {
  try {
    const templatePath = TEMPLATE_PATHS[type];
    
    // Check if template exists, if not use dynamic generation
    if (!fs.existsSync(templatePath)) {
      console.log(`⚠️ ${type} template not found at ${templatePath}, generating dynamic PDF`);
      return await generateDynamicPDF(type, student, shouldSave);
    }

    const certificatesDir = path.join(__dirname, "../certificates");
    if (!fs.existsSync(certificatesDir)) {
      fs.mkdirSync(certificatesDir, { recursive: true });
    }

    const fileName = `${type}_${student.name.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
    const filePath = path.join(certificatesDir, fileName);

    // Create new PDF document with appropriate orientation
    let doc;
    if (type === "completion") {
      // Completion certificate in LANDSCAPE
      doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
    } else {
      // Offer letter in PORTRAIT
      doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
    }
    
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Add template as background (first page only)
    doc.image(templatePath, 0, 0, { 
      width: doc.page.width, 
      height: doc.page.height 
    });

    // Add content on top of template based on type
    if (type === "offer") {
      await addOfferLetterContentOnTemplate(doc, student);
    } else if (type === "completion") {
      await addCompletionCertificateContentOnTemplate(doc, student);
    }
      // Register Noto font for rupee symbol


    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => {
        console.log(`✅ ${type.toUpperCase()} PDF saved at: ${filePath}`);
        // If shouldSave is false (for preview), return the file path but don't keep it permanently
        if (!shouldSave) {
          // For preview, we'll delete the file after sending, but for actual sending, we keep it
          console.log(`📄 PDF generated for ${shouldSave ? 'permanent storage' : 'preview'}`);
        }
        resolve(filePath);
      });
      writeStream.on("error", reject);
    });
  } catch (err) {
    console.error(`❌ Error generating ${type} PDF:`, err);
    // Fallback to dynamic PDF generation
    return await generateDynamicPDF(type, student, shouldSave);
  }
}



// ------------------------------
// CONTENT FUNCTIONS TO WRITE ON TEMPLATES
// ------------------------------
async function addOfferLetterContentOnTemplate(doc, student) {
  const pageWidth = doc.page.width;
  const margin = 50;
  let yPosition = 100;
  const duration = calculateDuration(student.startDate, student.endDate);

  // Company Header (positioned to fit on template)

  yPosition += 40;

  // Offer Letter Title
  doc.fontSize(14)
     .font("Times-Bold")
     .fillColor("black")
     .text("INTERNSHIP OFFER LETTER", margin, yPosition, { 
       align: "center",
       width: pageWidth - (2 * margin)
     });
  
  yPosition += 50;

  // Date
  doc.fontSize(10)
     .font("Times-Roman")
     .fillColor("#666666")
     .text(`Date: ${getCurrentDateFormatted()}`, margin, yPosition, {
       align: "right",
       width: pageWidth - (2.5 * margin)
     });

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
    { label: "• Position:", value: student.department || "Not specified" },
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
  const fontPath = path.join(__dirname, "../fonts/NotoSans-Bold.ttf");
let hasNotoFont = false;
if (fs.existsSync(fontPath)) {
  doc.registerFont("Noto-Bold", fontPath);
  hasNotoFont = true;
  console.log("✅ Noto font registered successfully");
} else {
  console.log("⚠️ Noto font not found, using fallback for rupee symbol");
}


// Render details
details.forEach(detail => {
  // Print the label
  doc.fillColor("black")
     .font("Times-Bold")
     .text(detail.label, margin + 10, yPosition);

  // If this detail contains Rupee symbol → use Unicode font
  if (detail.needsRupee && hasNotoFont) {
    doc.font("Noto-Bold"); // Switch to Noto for ₹
  } else {
    doc.font("Times-Roman"); // Normal text
  }

  // Print the value
  doc.fillColor("#000000")
     .text(detail.value, margin + 80, yPosition);

  // Reset font after printing the line
  doc.font("Times-Roman");

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
     .text(student.department || "assigned", { continued: true })
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
  yPosition += 60;
  
  doc.fontSize(12)
     .font("Times-Bold")
     .fillColor("black")
     .text("Best regards,", margin, yPosition);

  yPosition += 25;

  // Add signature image
  const signaturePath = path.join(__dirname, "../assets/signature.png");
  addImageSafe(doc, signaturePath, margin, yPosition, { width: 100, height: 40 });
  
  yPosition += 50;

  doc.font("Times-Bold")
     .fillColor("#000000")
     .text("Ragupathi R", margin, yPosition)
     .font("Times-Roman")
     .text("Chief Executive Officer (CEO),", margin, yPosition + 15)
     .font("Times-Bold")
     .text("Roriri Software Solutions Pvt Ltd", margin, yPosition + 35);
}

async function addCompletionCertificateContentOnTemplate(doc, student) {
  const pageWidth = doc.page.width; // This will be larger in landscape
  const pageHeight = doc.page.height;
  const margin = 50;
  let yPosition = 80;

  // Company Header (matches your image exactly)
  

  yPosition += 50;

  // "Presented to" text
  

  yPosition += 97;
doc.registerFont("Poppins-Bold", "fonts/Poppins-Bold.ttf");

  // Student Name (prominently displayed)
  doc.fontSize(18)
     .font("Poppins-Bold")
     .fillColor("#6F6F6F")
     .text(student.name, margin, yPosition, {
       align: "center",
       characterSpacing: 1,
       width: pageWidth - (1  * margin)
     });

  yPosition += 35;

  // Main certificate text with only name, department, and dates
 

  

  doc.fontSize(18)
     .font("Poppins-Bold")
     .fillColor("#6F6F6F")
     .text(student.department, margin, yPosition, {
       align: "center",
       characterSpacing: 1,
       width: pageWidth - (-3 * margin),
       lineGap: 5
     });

  yPosition += 34;
 const startDateFormatted = new Date(student.startDate).toLocaleDateString('en-GB').replace(/\//g, '/');
  const endDateFormatted = new Date(student.endDate).toLocaleDateString('en-GB').replace(/\//g, '/');
// Measure text widths
const startWidth = doc.widthOfString(startDateFormatted);
const endWidth = doc.widthOfString(endDateFormatted);

// How much space you want between them
const gap = 100; // adjust gap here

// Compute total centered positioning
const totalWidth = startWidth + gap + endWidth;
const startX = (pageWidth - totalWidth) /4;
const endX = startX + startWidth + gap;

// Draw first date
doc.fontSize(18)
  .font("Poppins-Bold")
  .fillColor("#6F6F6F")
  .text(startDateFormatted, startX, yPosition);

// Draw second date
doc.fontSize(18)
  .font("Poppins-Bold")
  .fillColor("#6F6F6F")
  .text(endDateFormatted, endX, yPosition);

 

  // Signature section - Text only

}

// ------------------------------
// DYNAMIC PDF GENERATION (FALLBACK - WITHOUT TEMPLATES)
// ------------------------------
async function generateDynamicPDF(type, student, shouldSave = false) {
  const certificatesDir = path.join(__dirname, "../certificates");
  if (!fs.existsSync(certificatesDir)) {
    fs.mkdirSync(certificatesDir, { recursive: true });
  }

  const fileName = `${type}_${student.name.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
  const filePath = path.join(certificatesDir, fileName);

  let doc;
  if (type === "completion") {
    doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
  } else {
    doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
  }
  
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  if (type === "offer") {
    await addOfferLetterContentOnTemplate(doc, student);
  } else if (type === "completion") {
    await addCompletionCertificateContentOnTemplate(doc, student);
  }

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on("finish", () => resolve(filePath));
    writeStream.on("error", reject);
  });
}

// ------------------------------
// ROUTES (UPDATED - REMOVED CERTIFICATE ROUTE)
// ------------------------------
router.post("/generate-preview", async (req, res) => {
  try {
    const { studentId, type } = req.body;
    
    // Validate type
    if (type !== "offer" && type !== "completion") {
      return res.status(400).json({ message: "Invalid type. Only 'offer' and 'completion' are supported." });
    }

    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.name || !student.college || !student.department || !student.startDate || !student.endDate) {
      return res.status(400).json({ message: "Student data is incomplete. Please ensure all fields are filled." });
    }

    console.log(`📄 Generating ${type} letter preview for:`, student.name);
    const filePath = await generatePDFFromTemplate(type, student, false); // false = don't save permanently for preview

    const pdfBuffer = fs.readFileSync(filePath);
    const base64PDF = pdfBuffer.toString('base64');

    // Clean up the file after reading (for preview only)
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      pdfData: base64PDF,
      fileName: `${type}_letter_${student.name.replace(/\s+/g, '_')}.pdf`,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} letter generated successfully for preview!`
    });
  } catch (err) {
    console.error("❌ Error generating PDF preview:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

router.post("/send-offer", async (req, res) => {
  try {
    const { studentId } = req.body;
    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.name || !student.college || !student.department || !student.startDate || !student.endDate) {
      return res.status(400).json({ message: "Student data is incomplete. Please ensure all fields are filled." });
    }

    console.log("📄 Generating professional offer letter for:", student.name);
    const filePath = await generatePDFFromTemplate("offer", student, true); // true = save permanently

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

    // DO NOT delete the file - keep it in certificates folder for future reference
    console.log(`✅ Offer letter saved permanently at: ${filePath}`);

    res.json({ 
      success: true, 
      message: "Professional offer letter sent successfully and saved for future reference!"
    });
  } catch (err) {
    console.error("❌ Error sending offer letter:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

router.post("/send-completion", async (req, res) => {
  try {
    const { studentId } = req.body;
    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.name || !student.college || !student.department || !student.startDate || !student.endDate) {
      return res.status(400).json({ message: "Student data is incomplete. Please ensure all fields are filled." });
    }

    console.log("📄 Generating professional completion certificate for:", student.name);
    const filePath = await generatePDFFromTemplate("completion", student, true); // true = save permanently

    console.log("📤 Sending completion certificate to:", student.email);
    await sendEmail(
      student.email,
      "Internship Completion Certificate - RORIRI SOFTWARE SOLUTIONS",
      `Dear ${student.name},

Congratulations on successfully completing your internship at RORIRI SOFTWARE SOLUTIONS!

We are pleased to attach your official Internship Completion Certificate in recognition of your hard work and dedication during your time with us in the ${student.department} department.

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

    // DO NOT delete the file - keep it in certificates folder for future reference
    console.log(`✅ Completion certificate saved permanently at: ${filePath}`);

    res.json({
      success: true,
      message: "Professional completion certificate sent successfully and saved for future reference!"
    });
  } catch (err) {
    console.error("❌ Error sending completion certificate:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});



module.exports = router;