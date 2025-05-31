"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserSave extends Model {
    static associate(models) {
      UserSave.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      UserSave.belongsTo(models.Post, {
        foreignKey: "post_id",
        as: "post",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }
  UserSave.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      post_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "user_posts",
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "UserSave",
      tableName: "user_saves",
      timestamps: true,
    }
  );
  return UserSave;
};
