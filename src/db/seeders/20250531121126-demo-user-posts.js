'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('user_posts', [
      {
        id: 1, // Explicit ID
        user_id: 1, // Alice
        image_url: 'https://picsum.photos/seed/post1/600/400',
        caption: 'Exploring the rabbit hole. #adventure',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2, // Explicit ID
        user_id: 2, // Bob
        image_url: 'https://picsum.photos/seed/post2/600/400',
        caption: 'Just finished building a new birdhouse! 🐦🏠',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3, // Explicit ID
        user_id: 1, // Alice
        image_url: 'https://picsum.photos/seed/post3/600/400',
        caption: 'Tea party with the Mad Hatter was wild!',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4, // Explicit ID
        user_id: 3, // Charlie
        image_url: 'https://picsum.photos/seed/post4/600/400',
        caption: 'Trying to fly a kite again... 🪁',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5, // Explicit ID
        user_id: 2, // Bob
        image_url: 'https://picsum.photos/seed/post5/600/400',
        caption: 'My latest blueprint. #construction #design',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_posts', { id: [1, 2, 3, 4, 5] }, {});
  }
};