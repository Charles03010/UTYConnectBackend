"use strict";
const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword1 = await bcrypt.hash("password123", 10);
    const hashedPassword2 = await bcrypt.hash("anotherpassword", 10);
    const hashedPassword3 = await bcrypt.hash("testpass456", 10);

    await queryInterface.bulkInsert(
      "users",
      [
        {
          id: 1,
          name: "Alice Wonderland",
          username: "alice",
          email: "alice@example.com",
          password: hashedPassword1,
          bio: "Curiouser and curiouser!",
          profile_picture_url: "https://picsum.photos/seed/alice/200",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: "Bob The Builder",
          username: "bob",
          email: "bob@example.com",
          password: hashedPassword2,
          bio: "Can we fix it? Yes, we can!",
          profile_picture_url: "https://picsum.photos/seed/bob/200",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          name: "Charlie Brown",
          username: "charlie",
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
    await queryInterface.bulkDelete("users", { id: [1, 2, 3] }, {});
  },
};
