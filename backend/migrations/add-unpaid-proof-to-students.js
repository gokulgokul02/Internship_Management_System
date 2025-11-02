// backend/migrations/add-unpaid-proof-to-students.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('students', 'unpaidProofScreenshot', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('students', 'unpaidDeclarationDate', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('students', 'unpaidProofScreenshot');
    await queryInterface.removeColumn('students', 'unpaidDeclarationDate');
  }
};