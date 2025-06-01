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
    const aliceUserId = alice.id;
    const bob = await queryInterface.rawSelect(
      "users",
      { where: { username: "bob_seeder" }, plain: true },
      ["id"]
    );
    const bobUserId = bob.id;
    const charlie = await queryInterface.rawSelect(
      "users",
      { where: { username: "charlie_seeder" }, plain: true },
      ["id"]
    );
    const charlieUserId = charlie.id;

    const post1Id = uuidv4();
    const post2Id = uuidv4();
    const post3Id = uuidv4();
    const post4Id = uuidv4();
    const post5Id = uuidv4();

    await queryInterface.bulkInsert(
      "user_posts",
      [
        {
          id: post1Id,
          user_id: aliceUserId,
          image_url: "https://picsum.photos/seed/post1/600/400",
          caption: "Exploring the rabbit hole. #adventure",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: post2Id,
          user_id: bobUserId,
          image_url: "https://picsum.photos/seed/post2/600/400",
          caption: "Just finished building a new birdhouse! 🐦🏠",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: post3Id,
          user_id: aliceUserId,
          image_url: "https://picsum.photos/seed/post3/600/400",
          caption: "Tea party with the Mad Hatter was wild!",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: post4Id,
          user_id: charlieUserId,
          image_url: "https://picsum.photos/seed/post4/600/400",
          caption: "Trying to fly a kite again... 🪁",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: post5Id,
          user_id: bobUserId,
          image_url: "https://picsum.photos/seed/post5/600/400",
          caption: "My latest blueprint. #construction #design",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "user_posts",
      {
        caption: [
          "Exploring the rabbit hole. #adventure",
          "Just finished building a new birdhouse! 🐦🏠",
          "Tea party with the Mad Hatter was wild!",
          "Trying to fly a kite again... 🪁",
          "My latest blueprint. #construction #design",
        ],
      },
      {}
    );
  },
};
