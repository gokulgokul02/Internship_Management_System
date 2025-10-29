const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text, attachments = []) => {
  try {
    console.log("📨 Preparing to send email...");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("From:", process.env.EMAIL_USER);

    // Check if credentials exist
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Missing EMAIL_USER or EMAIL_PASS in .env file");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify transporter
    await transporter.verify();
    console.log("✅ Mail transporter verified successfully.");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      attachments,
    };

    console.log("📤 Sending email...");
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully!");
    console.log("📬 Message ID:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Error in sendEmail:", err.message);
    throw err;
  }
};

module.exports = sendEmail;
