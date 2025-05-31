'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Ensure user1_id < user2_id to maintain consistency if you have such a rule in service layer
    await queryInterface.bulkInsert('user_chats', [
      {
        id: 1, // Chat between Alice (1) and Bob (2)
        user1_id: 1,
        user2_id: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2, // Chat between Alice (1) and Charlie (3)
        user1_id: 1,
        user2_id: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3, // Chat between Bob (2) and Charlie (3)
        user1_id: 2,
        user2_id: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_chats', { id: [1, 2, 3] }, {});
  }
};