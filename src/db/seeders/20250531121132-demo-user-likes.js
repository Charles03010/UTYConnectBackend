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

    const alicePost = await queryInterface.rawSelect(
      "user_posts",
      {
        where: { caption: "Exploring the rabbit hole. #adventure" },
        plain: true,
      },
      ["id"]
    );
    const alicesPost1UUID = alicePost.id;
    const alicePost1 = await queryInterface.rawSelect(
      "user_posts",
      {
        where: { caption: "Tea party with the Mad Hatter was wild!" },
        plain: true,
      },
      ["id"]
    );
    const alicesPost2UUID = alicePost1.id;
    const bobPost = await queryInterface.rawSelect(
      "user_posts",
      {
        where: { caption: "Just finished building a new birdhouse! 🐦🏠" },
        plain: true,
      },
      ["id"]
    );
    const bobsPost1UUID = bobPost.id;
    const bobPost1 = await queryInterface.rawSelect(
      "user_posts",
      {
        where: { caption: "My latest blueprint. #construction #design" },
        plain: true,
      },
      ["id"]
    );
    const bobsPost2UUID = bobPost1.id;
    const charliePost = await queryInterface.rawSelect(
      "user_posts",
      { where: { caption: "Trying to fly a kite again... 🪁" }, plain: true },
      ["id"]
    );
    const charliesPost1UUID = charliePost.id;

    await queryInterface.bulkInsert(
      "user_likes",
      [
        {
          user_id: aliceUserId,
          post_id: bobsPost1UUID,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          user_id: aliceUserId,
          post_id: charliesPost1UUID,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          user_id: bobUserId,
          post_id: alicesPost1UUID,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          user_id: bobUserId,
          post_id: alicesPost2UUID,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          user_id: charlieUserId,
          post_id: alicesPost1UUID,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          user_id: charlieUserId,
          post_id: bobsPost2UUID,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("user_likes", null, {});
  },
};
