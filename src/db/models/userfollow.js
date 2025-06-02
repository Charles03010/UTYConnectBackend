"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserFollow extends Model {
    static associate(models) {
      UserFollow.belongsTo(models.User, {
        foreignKey: "follower_id",
        as: "follower",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      UserFollow.belongsTo(models.User, {
        foreignKey: "following_id",
        as: "followedUser",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }
  UserFollow.init(
    {
      follower_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      following_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "users",
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "UserFollow",
      tableName: "user_follows",
      timestamps: true,
    }
  );
  return UserFollow;
};
