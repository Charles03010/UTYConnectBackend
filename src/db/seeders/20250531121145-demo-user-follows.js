"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const alice = await queryInterface.rawSelect(
      "users",
      { where: { username: "alice" }, plain: true },
      ["id"]
    );
    const aliceUserId = alice.id;
    const bob = await queryInterface.rawSelect(
      "users",
      { where: { username: "bob" }, plain: true },
      ["id"]
    );
    const bobUserId = bob.id;
    const charlie = await queryInterface.rawSelect(
      "users",
      { where: { username: "charlie" }, plain: true },
      ["id"]
    );
    const charlieUserId = charlie.id;

    await queryInterface.bulkInsert(
      "user_follows",
      [
        {
          follower_id: aliceUserId,
          following_id: bobUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          follower_id: aliceUserId,
          following_id: charlieUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          follower_id: bobUserId,
          following_id: aliceUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          follower_id: charlieUserId,
          following_id: aliceUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          follower_id: bobUserId,
          following_id: charlieUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          follower_id: charlieUserId,
          following_id: bobUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("user_follows", null, {});
  },
};
