const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const generateInvoice = async (student, payment) => {
  try {
    const invoicesDir = path.join(__dirname, "..", "assets", "invoices");
    ensureDir(invoicesDir);

    const filename = `invoice_${student.id}_${Date.now()}.pdf`;
    const filepath = path.join(invoicesDir, filename);

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Header
    doc.fontSize(18).text("Invoice / Payment Receipt", { align: "center" });
    doc.moveDown();

    // Student details
    doc.fontSize(12).text(`Student ID: ${student.id}`);
    doc.text(`Name: ${student.name}`);
    doc.text(`Email: ${student.email || "N/A"}`);
    doc.text(`Department: ${student.department || "N/A"}`);
    doc.moveDown();

    // Payment details
    doc.text(`Payment ID: ${payment.id || "-"}`);
    doc.text(`Amount: ₹${Number(payment.amount).toFixed(2)}`);
    doc.text(`Method: ${payment.method || "Online"}`);
    if (payment.razorpayPaymentId) doc.text(`Razorpay ID: ${payment.razorpayPaymentId}`);
    if (payment.notes) doc.moveDown().text(`Notes: ${payment.notes}`);
    doc.moveDown();

    doc.text(`Date: ${new Date(payment.createdAt || Date.now()).toLocaleString()}`);

    doc.moveDown();
    doc.text("Thank you for your payment.");

    doc.end();

    await new Promise((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    return { filename, filepath };
  } catch (err) {
    throw err;
  }
};

module.exports = generateInvoice;
