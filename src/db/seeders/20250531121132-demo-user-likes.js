'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('user_likes', [
      { user_id: 1, post_id: 2, createdAt: new Date(), updatedAt: new Date() }, // Alice likes Bob's post
      { user_id: 1, post_id: 4, createdAt: new Date(), updatedAt: new Date() }, // Alice likes Charlie's post
      { user_id: 2, post_id: 1, createdAt: new Date(), updatedAt: new Date() }, // Bob likes Alice's first post
      { user_id: 2, post_id: 3, createdAt: new Date(), updatedAt: new Date() }, // Bob likes Alice's second post
      { user_id: 3, post_id: 1, createdAt: new Date(), updatedAt: new Date() }, // Charlie likes Alice's first post
      { user_id: 3, post_id: 5, createdAt: new Date(), updatedAt: new Date() }, // Charlie likes Bob's blueprint post
    ], {});
  },

  async down (queryInterface, Sequelize) {
    // For bulkDelete with multiple conditions, it's simpler to delete all for demo data
    // or list specific user_id/post_id pairs if needed.
    await queryInterface.bulkDelete('user_likes', null, {});
  }
};