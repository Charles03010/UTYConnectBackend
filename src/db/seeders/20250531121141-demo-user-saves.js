'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
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

    const alicePost = await queryInterface.rawSelect(
      "user_posts",
      {
        where: { caption: "Exploring the rabbit hole. #adventure" },
        plain: true,
      },
      ["id"]
    );
    const alicesPost1UUID = alicePost;
    // const alicePost1 = await queryInterface.rawSelect(
    //   "user_posts",
    //   {
    //     where: { caption: "Tea party with the Mad Hatter was wild!" },
    //     plain: true,
    //   },
    //   ["id"]
    // );
    // const alicesPost2UUID = alicePost1;
    const bobPost = await queryInterface.rawSelect(
      "user_posts",
      {
        where: { caption: "Just finished building a new birdhouse! 🐦🏠" },
        plain: true,
      },
      ["id"]
    );
    const bobsPost1UUID = bobPost;
    const bobPost1 = await queryInterface.rawSelect(
      "user_posts",
      {
        where: { caption: "My latest blueprint. #construction #design" },
        plain: true,
      },
      ["id"]
    );
    const bobsPost2UUID = bobPost1;
    // const charliePost = await queryInterface.rawSelect(
    //   "user_posts",
    //   { where: { caption: "Trying to fly a kite again... 🪁" }, plain: true },
    //   ["id"]
    // );
    // const charliesPost1UUID = charliePost;

    await queryInterface.bulkInsert('user_saves', [
      {
        id:uuidv4(),
        user_id: aliceUserId,         
        post_id: bobsPost1UUID, 
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id:uuidv4(),
        user_id: bobUserId,           
        post_id: alicesPost1UUID,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id:uuidv4(),
        user_id: charlieUserId,       
        post_id: bobsPost2UUID, 
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_saves', null, {});
  }
};