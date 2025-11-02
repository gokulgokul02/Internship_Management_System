// backend/migrations/add-payment-fields-to-students.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('students', 'razorpayTransactionId', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });
    
    await queryInterface.addColumn('students', 'senderUpiId', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('students', 'paymentScreenshot', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('students', 'paymentStatus', {
      type: Sequelize.ENUM("Pending", "Completed", "Failed", "Refunded"),
      allowNull: false,
      defaultValue: "Pending"
    });
    
    await queryInterface.addColumn('students', 'paymentDate', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('students', 'razorpayTransactionId');
    await queryInterface.removeColumn('students', 'senderUpiId');
    await queryInterface.removeColumn('students', 'paymentScreenshot');
    await queryInterface.removeColumn('students', 'paymentStatus');
    await queryInterface.removeColumn('students', 'paymentDate');
  }
};