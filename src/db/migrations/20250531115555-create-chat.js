"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_chats", {
      id: {
        type: Sequelize.UUID, 
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      user1_id: {
        type: Sequelize.UUID, 
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user2_id: {
        type: Sequelize.UUID, 
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addConstraint("user_chats", {
      fields: ["user1_id", "user2_id"],
      type: "unique",
      name: "chat_users_unique_constraint",
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      "user_chats",
      "chat_users_unique_constraint"
    );
    await queryInterface.dropTable("user_chats");
  },
};
