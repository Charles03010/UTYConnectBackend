"use strict";
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword1 = await bcrypt.hash("password123", 10);
    const hashedPassword2 = await bcrypt.hash("anotherpassword", 10);
    const hashedPassword3 = await bcrypt.hash("testpass456", 10);

    const userId1 = uuidv4();
    const userId2 = uuidv4();
    const userId3 = uuidv4();

    await queryInterface.bulkInsert(
      "users",
      [
        {
          id: userId1,
          name: "Alice Wonderland",
          username: "alice_seeder",
          email: "alice@example.com",
          password: hashedPassword1,
          bio: "Curiouser and curiouser!",
          profile_picture_url: "https://picsum.photos/seed/alice/200",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: userId2,
          name: "Bob The Builder",
          username: "bob_seeder",
          email: "bob@example.com",
          password: hashedPassword2,
          bio: "Can we fix it? Yes, we can!",
          profile_picture_url: "https://picsum.photos/seed/bob/200",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: userId3, 
          name: "Charlie Brown",
          username: "charlie_seeder",
          email: "charlie@example.com",
          password: hashedPassword3,
          bio: "Good grief!",
          profile_picture_url: "https://picsum.photos/seed/charlie/200",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", {
      username: ["alice_seeder", "bob_seeder", "charlie_seeder"]
    }, {});
  },
};