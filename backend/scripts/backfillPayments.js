require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');
const { sequelize } = require('../config/db');
const { Student, Payment } = require('../models');
const generateInvoice = require('../utils/generateInvoice');

async function backfill() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    const students = await Student.findAll();
    console.log(`Found ${students.length} students`);

    let created = 0;

    for (const student of students) {
      try {
        const existing = await Payment.findOne({ where: { studentId: student.id } });
        if (existing) continue; // already has history

        const advance = Number(student.advanceAmount) || 0;
        const last = Number(student.lastPaymentAmount) || 0;
        const amount = last > 0 ? last : (advance > 0 ? advance : 0);

        if (amount <= 0) continue; // nothing to backfill

        const paymentRecord = await Payment.create({
          studentId: student.id,
          amount: amount,
          method: student.paymentMode || 'Manual',
          razorpayPaymentId: student.razorpayTransactionId || null,
          notes: 'Backfilled from student record'
        });

        // Try generate invoice
        try {
          const invoice = await generateInvoice(student, paymentRecord);
          if (invoice && invoice.filename) {
            await Payment.update({ invoicePath: invoice.filename }, { where: { id: paymentRecord.id } });
          }
        } catch (invErr) {
          console.error('Invoice generation failed for', student.id, invErr.message);
        }

        created++;
        console.log(`Backfilled payment for ${student.id} amount ₹${amount}`);
      } catch (err) {
        console.error('Error processing student', student.id, err.message);
      }
    }

    console.log(`✅ Backfill complete. Created ${created} payment records.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Backfill failed:', err.message);
    process.exit(1);
  }
}

backfill();
