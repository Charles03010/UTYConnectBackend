"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const oneMinAgo = new Date(now.getTime() - 60000);
    const twoMinAgo = new Date(now.getTime() - 120000);

    const alice = await queryInterface.rawSelect(
      "users",
      { where: { username: "alice_seeder" }, plain: true },
      ["id"]
    );
    const aliceUserId = alice;
    const bob = await queryInterface.rawSelect(
      "users",
      { where: { username: "bob_seeder" }, plain: true },
      ["id"]
    );
    const bobUserId = bob;
    const charlie = await queryInterface.rawSelect(
      "users",
      { where: { username: "charlie_seeder" }, plain: true },
      ["id"]
    );
    const charlieUserId = charlie;

    const orderUserPair = (uuid1, uuid2) => {
      if (!uuid1 || !uuid2) {
        // Basic check
        throw new Error("Both user UUIDs must be provided for ordering.");
      }
      return uuid1 < uuid2
        ? { u1: uuid1, u2: uuid2 }
        : { u1: uuid2, u2: uuid1 };
    };

    let chat1AliceBobId, chat2AliceCharlieId, chat3BobCharlieId;
    try {
      const pairAliceBob = orderUserPair(aliceUserId, bobUserId);
      const chatAliceBob = await queryInterface.sequelize.query(
        `SELECT id FROM "user_chats" WHERE user1_id = :user1_id AND user2_id = :user2_id LIMIT 1`,
        {
          replacements: {
            user1_id: pairAliceBob.u1,
            user2_id: pairAliceBob.u2,
          },
          type: Sequelize.QueryTypes.SELECT,
          plain: true, 
        }
      );
      if (!chatAliceBob || !chatAliceBob.id) {
        throw new Error(
          `Chat between Alice (ID: ${aliceUserId}) and Bob (ID: ${bobUserId}) not found.`
        );
      }
      chat1AliceBobId = chatAliceBob.id;

      const pairAliceCharlie = orderUserPair(aliceUserId, charlieUserId);
      const chatAliceCharlie = await queryInterface.sequelize.query(
        `SELECT id FROM "user_chats" WHERE user1_id = :user1_id AND user2_id = :user2_id LIMIT 1`,
        {
          replacements: {
            user1_id: pairAliceCharlie.u1,
            user2_id: pairAliceCharlie.u2,
          },
          type: Sequelize.QueryTypes.SELECT,
          plain: true,
        }
      );
      if (!chatAliceCharlie || !chatAliceCharlie.id) {
        throw new Error(
          `Chat between Alice (ID: ${aliceUserId}) and Charlie (ID: ${charlieUserId}) not found.`
        );
      }
      chat2AliceCharlieId = chatAliceCharlie.id;

      const pairBobCharlie = orderUserPair(bobUserId, charlieUserId);
      const chatBobCharlie = await queryInterface.sequelize.query(
        `SELECT id FROM "user_chats" WHERE user1_id = :user1_id AND user2_id = :user2_id LIMIT 1`,
        {
          replacements: {
            user1_id: pairBobCharlie.u1,
            user2_id: pairBobCharlie.u2,
          },
          type: Sequelize.QueryTypes.SELECT,
          plain: true,
        }
      );
      if (!chatBobCharlie || !chatBobCharlie.id) {
        throw new Error(
          `Chat between Bob (ID: ${bobUserId}) and Charlie (ID: ${charlieUserId}) not found.`
        );
      }
      chat3BobCharlieId = chatBobCharlie.id;
    } catch (error) {
      console.error("Error fetching chat UUIDs:", error);
      throw error; 
    }

    await queryInterface.bulkInsert(
      "chat_messages",
      [
        {
          id: uuidv4(),
          chat_id: chat1AliceBobId,
          sender_id: aliceUserId,
          message: "Hey Bob, how are you?",
          timestamp: twoMinAgo,
          status: "read",
          createdAt: twoMinAgo,
          updatedAt: twoMinAgo,
        },
        {
          id: uuidv4(),
          chat_id: chat1AliceBobId,
          sender_id: bobUserId,
          message: "Hi Alice! Doing great. Just working on a new project.",
          timestamp: oneMinAgo,
          status: "delivered",
          createdAt: oneMinAgo,
          updatedAt: oneMinAgo,
        },
        {
          id: uuidv4(),
          chat_id: chat1AliceBobId,
          sender_id: aliceUserId,
          message: "Sounds exciting! Tell me more.",
          timestamp: now,
          status: "sent",
          createdAt: now,
          updatedAt: now,
        },

        {
          id: uuidv4(),
          chat_id: chat2AliceCharlieId,
          sender_id: charlieUserId,
          message: "Alice, did you see Snoopy today?",
          timestamp: oneMinAgo,
          status: "delivered",
          createdAt: oneMinAgo,
          updatedAt: oneMinAgo,
        },
        {
          id: uuidv4(),
          chat_id: chat2AliceCharlieId,
          sender_id: aliceUserId,
          message: "Not yet, Charlie! Was he chasing Woodstock?",
          timestamp: now,
          status: "sent",
          createdAt: now,
          updatedAt: now,
        },

        {
          id: uuidv4(),
          chat_id: chat3BobCharlieId,
          sender_id: bobUserId,
          message:
            "Charlie, I have some spare wood if you need it for any projects.",
          timestamp: twoMinAgo,
          status: "read",
          createdAt: twoMinAgo,
          updatedAt: twoMinAgo,
        },
        {
          id: uuidv4(),
          chat_id: chat3BobCharlieId,
          sender_id: charlieUserId,
          message:
            "Thanks Bob! That would be great for the kite repair shop I am (not) building.",
          timestamp: now,
          status: "sent",
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("chat_messages", null, {});
  },
};
