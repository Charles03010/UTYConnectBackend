"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_saves", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      post_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "user_posts",
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

    await queryInterface.addConstraint("user_saves", {
      fields: ["user_id", "post_id"],
      type: "unique",
      name: "user_post_save_unique_constraint",
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      "user_saves",
      "user_post_save_unique_constraint"
    );
    await queryInterface.dropTable("user_saves");
  },
};
