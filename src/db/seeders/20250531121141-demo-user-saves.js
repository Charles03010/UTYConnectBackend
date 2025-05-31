'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('user_saves', [
      { user_id: 1, post_id: 5, createdAt: new Date(), updatedAt: new Date() }, // Alice saves Bob's blueprint
      { user_id: 2, post_id: 3, createdAt: new Date(), updatedAt: new Date() }, // Bob saves Alice's tea party post
      { user_id: 3, post_id: 2, createdAt: new Date(), updatedAt: new Date() }, // Charlie saves Bob's birdhouse post
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_saves', null, {});
  }
};