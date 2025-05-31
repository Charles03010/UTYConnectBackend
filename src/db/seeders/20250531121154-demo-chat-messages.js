'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
    const oneMinAgo = new Date(now.getTime() - 60000);
    const twoMinAgo = new Date(now.getTime() - 120000);

    await queryInterface.bulkInsert('chat_messages', [
      // Chat 1: Alice and Bob
      {
        chat_id: 1,
        sender_id: 1, // Alice
        message: 'Hey Bob, how are you?',
        timestamp: twoMinAgo,
        status: 'read',
        createdAt: twoMinAgo,
        updatedAt: twoMinAgo
      },
      {
        chat_id: 1,
        sender_id: 2, // Bob
        message: 'Hi Alice! Doing great. Just working on a new project.',
        timestamp: oneMinAgo,
        status: 'delivered',
        createdAt: oneMinAgo,
        updatedAt: oneMinAgo
      },
      {
        chat_id: 1,
        sender_id: 1, // Alice
        message: 'Sounds exciting! Tell me more.',
        timestamp: now,
        status: 'sent',
        createdAt: now,
        updatedAt: now
      },
      // Chat 2: Alice and Charlie
      {
        chat_id: 2,
        sender_id: 3, // Charlie
        message: 'Alice, did you see Snoopy today?',
        timestamp: oneMinAgo,
        status: 'delivered',
        createdAt: oneMinAgo,
        updatedAt: oneMinAgo
      },
      {
        chat_id: 2,
        sender_id: 1, // Alice
        message: 'Not yet, Charlie! Was he chasing Woodstock?',
        timestamp: now,
        status: 'sent',
        createdAt: now,
        updatedAt: now
      },
       // Chat 3: Bob and Charlie
      {
        chat_id: 3,
        sender_id: 2, // Bob
        message: 'Charlie, I have some spare wood if you need it for any projects.',
        timestamp: twoMinAgo,
        status: 'read',
        createdAt: twoMinAgo,
        updatedAt: twoMinAgo
      },
      {
        chat_id: 3,
        sender_id: 3, // Charlie
        message: 'Thanks Bob! That would be great for the kite repair shop I am (not) building.',
        timestamp: now,
        status: 'sent',
        createdAt: now,
        updatedAt: now
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    // Deleting all messages for simplicity in demo data
    await queryInterface.bulkDelete('chat_messages', null, {});
  }
};