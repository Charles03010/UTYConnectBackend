"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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

    const chat1Id = uuidv4();
    const chat2Id = uuidv4();
    const chat3Id = uuidv4();

    const orderUserPair = (uuid1, uuid2) => {
      return uuid1 < uuid2
        ? { u1: uuid1, u2: uuid2 }
        : { u1: uuid2, u2: uuid1 };
    };

    const chatPair1 = orderUserPair(aliceUserId, bobUserId);
    const chatPair2 = orderUserPair(aliceUserId, charlieUserId);
    const chatPair3 = orderUserPair(bobUserId, charlieUserId);

    await queryInterface.bulkInsert(
      "user_chats",
      [
        {
          id: chat1Id,
          user1_id: chatPair1.u1,
          user2_id: chatPair1.u2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: chat2Id,
          user1_id: chatPair2.u1,
          user2_id: chatPair2.u2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: chat3Id,
          user1_id: chatPair3.u1,
          user2_id: chatPair3.u2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("user_chats", null, {});
  },
};
