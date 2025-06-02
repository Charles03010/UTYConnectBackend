"use strict";
const { v4: uuidv4 } = require('uuid');
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

    await queryInterface.bulkInsert(
      "user_follows",
      [
        {
          id:uuidv4(),
          follower_id: aliceUserId,
          following_id: bobUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id:uuidv4(),
          follower_id: aliceUserId,
          following_id: charlieUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id:uuidv4(),
          follower_id: bobUserId,
          following_id: aliceUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id:uuidv4(),
          follower_id: charlieUserId,
          following_id: aliceUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id:uuidv4(),
          follower_id: bobUserId,
          following_id: charlieUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id:uuidv4(),
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
