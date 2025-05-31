'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('post_comments', [
      {
        id: 1,
        post_id: 1, // Alice's first post
        user_id: 2, // Bob comments
        text: 'Wow, Alice! Looks amazing!',
        parent_comment_id: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        post_id: 1, // Alice's first post
        user_id: 3, // Charlie comments
        text: 'Be careful down there!',
        parent_comment_id: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        post_id: 1, // Alice's first post
        user_id: 1, // Alice replies to Bob
        text: 'Thanks Bob! It was quite an experience.',
        parent_comment_id: 1, // Reply to Bob's comment (ID 1)
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        post_id: 2, // Bob's first post
        user_id: 1, // Alice comments
        text: 'That birdhouse is so cute, Bob!',
        parent_comment_id: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5,
        post_id: 4, // Charlie's post
        user_id: 2, // Bob comments
        text: 'Need any help with that kite, Charlie?',
        parent_comment_id: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('post_comments', { id: [1, 2, 3, 4, 5] }, {});
  }
};