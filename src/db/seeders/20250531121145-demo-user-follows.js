'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('user_follows', [
      // Alice follows Bob and Charlie
      { follower_id: 1, following_id: 2, createdAt: new Date(), updatedAt: new Date() },
      { follower_id: 1, following_id: 3, createdAt: new Date(), updatedAt: new Date() },
      // Bob follows Alice
      { follower_id: 2, following_id: 1, createdAt: new Date(), updatedAt: new Date() },
      // Charlie follows Alice
      { follower_id: 3, following_id: 1, createdAt: new Date(), updatedAt: new Date() },
      // Bob and Charlie follow each other
      { follower_id: 2, following_id: 3, createdAt: new Date(), updatedAt: new Date() },
      { follower_id: 3, following_id: 2, createdAt: new Date(), updatedAt: new Date() },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_follows', null, {});
  }
};